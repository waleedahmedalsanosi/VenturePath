import { z } from "zod";

import { Dec } from "@/lib/cap-table/decimal";

const PositiveDecString = z
  .string()
  .min(1, "required")
  .refine((s) => {
    try {
      return new Dec(s).gt(0);
    } catch {
      return false;
    }
  }, "must be a positive number");

export const CreateListingSchema = z.object({
  shareholder_id: z.uuid("must select a shareholder"),
  shares_offered: PositiveDecString,
  ask_price_sar: PositiveDecString,
  notes: z.string().max(2000).optional().or(z.literal("")),
  expires_at: z.string().optional().or(z.literal("")),
});

export const WithdrawListingSchema = z.object({
  listing_id: z.uuid(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export const MarkSoldSchema = z.object({
  listing_id: z.uuid(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export const RecordRofrSchema = z.object({
  notification_id: z.uuid(),
  response: z.enum(["exercise", "decline"]),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type RecordRofrInput = z.infer<typeof RecordRofrSchema>;
