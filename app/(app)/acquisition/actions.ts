"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface AcquisitionActionResult {
  ok: boolean;
  error?: string;
  modelId?: string;
}

// ── computeAcquisitionModel ───────────────────────────────────────────────────

export async function computeAcquisitionModel(
  formData: FormData,
): Promise<AcquisitionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const rawPrice = formData.get("acquisition_price_sar");
  const rawDebt = formData.get("debt_sar") ?? "0";
  const rawLabel = formData.get("label") ?? "Untitled model";
  const rawListingId = formData.get("connection_listing_id");

  const acquisitionPrice = Number(rawPrice);
  const debtSar = Number(rawDebt) || 0;
  const label = String(rawLabel).trim() || "Untitled model";
  const connectionListingId =
    rawListingId && String(rawListingId).trim()
      ? String(rawListingId).trim()
      : null;

  if (!Number.isFinite(acquisitionPrice) || acquisitionPrice <= 0) {
    return { ok: false, error: "Acquisition price must be a positive number." };
  }
  if (!Number.isFinite(debtSar) || debtSar < 0) {
    return { ok: false, error: "Debt must be zero or a positive number." };
  }

  const { data, error } = await supabase.rpc("compute_acquisition_model", {
    p_workspace_id: workspace.id,
    p_acquisition_price_sar: acquisitionPrice,
    p_debt_sar: debtSar,
    p_label: label,
    p_connection_listing_id: connectionListingId,
  });

  if (error) {
    const msg = error.message ?? "Failed to compute model.";
    return { ok: false, error: msg };
  }

  const result = data as { model_id: string } | null;
  revalidatePath("/acquisition");
  return { ok: true, modelId: result?.model_id };
}

// ── archiveAcquisitionModel ───────────────────────────────────────────────────

export async function archiveAcquisitionModel(
  modelId: string,
): Promise<AcquisitionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.rpc("archive_acquisition_model", {
    p_model_id: modelId,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Failed to archive model." };
  }

  revalidatePath("/acquisition");
  return { ok: true };
}
