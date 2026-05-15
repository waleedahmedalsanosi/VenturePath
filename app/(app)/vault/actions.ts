"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

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

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const file = formData.get("file");
  const nameField = String(formData.get("name") ?? "").trim();

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
