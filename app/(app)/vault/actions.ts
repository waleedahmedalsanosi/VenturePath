"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "image/jpeg",
  "image/png",
]);

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const file = formData.get("file");
  const nameField = String(formData.get("name") ?? "").trim();
  const categoryId = (formData.get("category_id") as string) || null;
  const visibility = (formData.get("visibility") as string) || "internal";
  if (!["internal", "data_room", "public"].includes(visibility)) {
    return { ok: false, error: `Invalid visibility: ${visibility}` };
  }

  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded." };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `File exceeds 50 MB limit (got ${(file.size / 1048576).toFixed(1)} MB).` };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type || "unknown"}. Allowed: PDF, DOCX, XLSX, JPG, PNG.` };
  }

  const displayName = nameField || file.name;
  const documentId = randomUUID();
  // Preserve the file extension so download serves with the right content type.
  const dotIndex = file.name.lastIndexOf(".");
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex) : "";
  const storagePath = `${workspace.id}/${documentId}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage.from("vault").upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) {
    return { ok: false, error: `Storage upload failed: ${upload.error.message}` };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    workspace_id: workspace.id,
    name: displayName,
    storage_path: storagePath,
    size_bytes: file.size,
    mime_type: file.type,
    uploaded_by: user.id,
    category_id: categoryId,
    visibility: visibility as "internal" | "data_room" | "public",
  });
  if (insertError) {
    // Best-effort cleanup so we don't orphan storage objects.
    await supabase.storage.from("vault").remove([storagePath]);
    return { ok: false, error: `Metadata insert failed: ${insertError.message}` };
  }

  await logAudit({
    workspaceId: workspace.id,
    entityType: "document",
    entityId: documentId,
    action: "upload",
    description: `Uploaded "${displayName}" (${(file.size / 1024).toFixed(1)} KB)`,
    payload: { mime_type: file.type, size_bytes: file.size },
  });

  revalidatePath("/vault");
  return { ok: true };
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, name, workspace_id")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  // Soft-delete the metadata, hard-delete the storage object (free user storage).
  const { error: updateError } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId);
  if (updateError) return { ok: false, error: updateError.message };

  const { error: storageError } = await supabase.storage
    .from("vault")
    .remove([doc.storage_path]);
  if (storageError) {
    // Metadata is already marked deleted; surface the storage error but don't roll back.
    return { ok: false, error: `Storage remove failed: ${storageError.message}` };
  }

  await logAudit({
    workspaceId: doc.workspace_id,
    entityType: "document",
    entityId: documentId,
    action: "delete",
    description: `Deleted document "${doc.name}"`,
  });

  revalidatePath("/vault");
  return { ok: true };
}

export async function getSignedDownloadUrl(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, name, mime_type")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  // 60-second signed URL — long enough to click through, short enough to not leak.
  const signed = await supabase.storage
    .from("vault")
    .createSignedUrl(doc.storage_path, 60, {
      download: doc.name,
    });
  if (signed.error || !signed.data) {
    return { ok: false, error: signed.error?.message ?? "Failed to sign URL." };
  }

  return { ok: true, url: signed.data.signedUrl };
}

const VISIBILITY_CYCLE: Record<string, "internal" | "data_room" | "public"> = {
  internal: "data_room",
  data_room: "public",
  public: "internal",
};

export async function cycleVisibility(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: doc } = await supabase
    .from("documents")
    .select("workspace_id, name, visibility")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  const next = VISIBILITY_CYCLE[doc.visibility] ?? "internal";
  const { error } = await supabase
    .from("documents")
    .update({ visibility: next })
    .eq("id", documentId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: doc.workspace_id,
    entityType: "document",
    entityId: documentId,
    action: "visibility_change",
    description: `"${doc.name}" visibility: ${doc.visibility} → ${next}`,
  });

  revalidatePath("/vault");
  return { ok: true };
}

export async function setDocumentCategory(
  documentId: string,
  categoryId: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("documents")
    .update({ category_id: categoryId })
    .eq("id", documentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/vault");
  return { ok: true };
}

// Category management.

export async function createCategory(name: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 80) {
    return { ok: false, error: "Name must be 1-80 chars." };
  }

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const { data: existing } = await supabase
    .from("vault_categories")
    .select("sort_order")
    .eq("workspace_id", workspace.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = (existing?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("vault_categories").insert({
    workspace_id: workspace.id,
    name: cleanName,
    sort_order: nextSort,
  });
  if (error) {
    // Unique violation = duplicate name (case-insensitive).
    if (error.code === "23505") return { ok: false, error: "Name already used." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/vault");
  return { ok: true };
}

export async function renameCategory(
  categoryId: string,
  newName: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const clean = newName.trim();
  if (!clean || clean.length > 80) return { ok: false, error: "Name must be 1-80 chars." };

  // Block renaming locked (Data Room) categories.
  const { data: category } = await supabase
    .from("vault_categories")
    .select("is_locked")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return { ok: false, error: "Category not found." };
  if (category.is_locked) return { ok: false, error: "Data Room cannot be renamed." };

  const { error } = await supabase
    .from("vault_categories")
    .update({ name: clean })
    .eq("id", categoryId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Name already used." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/vault");
  return { ok: true };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: category } = await supabase
    .from("vault_categories")
    .select("is_locked, name")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return { ok: false, error: "Category not found." };
  if (category.is_locked) return { ok: false, error: "Data Room cannot be deleted." };

  // PRD US-09-02: deletion only if zero documents.
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .is("deleted_at", null);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Remove all documents from this category before deleting it.",
    };
  }

  const { error } = await supabase
    .from("vault_categories")
    .delete()
    .eq("id", categoryId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vault");
  return { ok: true };
}
