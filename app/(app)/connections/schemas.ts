import { z } from "zod";

// Listing type enum
export const ListingTypeSchema = z.enum(["exit", "partnership"]);
export type ListingType = z.infer<typeof ListingTypeSchema>;

// Exit-specific structured data (D9)
export const ExitTypeDataSchema = z.object({
  ask_type: z.enum(["active_sale", "open_to_offers", "acqui_hire", "merger"]),
  ask_amount_sar: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((s) => !s || /^\d+(\.\d+)?$/.test(s), "must be a number"),
  sector: z.string().max(100).optional().or(z.literal("")),
  stage: z.string().max(50).optional().or(z.literal("")),
});

// Partnership-specific structured data (D9)
export const PartnershipTypeDataSchema = z.object({
  seeking_type: z.enum(["co_founder", "advisor", "senior_hire", "business_partner"]),
  skills: z.array(z.string().min(1).max(40)).max(10).default([]),
  equity_expectations: z.string().max(200).optional().or(z.literal("")),
  commitment_type: z.enum(["full_time", "part_time", "advisory", "flexible"]),
});

// Create listing form
export const CreateConnectionListingSchema = z.object({
  listing_type: ListingTypeSchema,
  public_summary: z.string().min(1, "required").max(500),
  notes: z.string().max(1000).optional().or(z.literal("")),
  // type_data carries the type-specific JSON; client serializes it.
  type_data_json: z.string(),
});

// Withdraw listing
export const WithdrawConnectionListingSchema = z.object({
  listing_id: z.uuid(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

// Send inquiry
export const SendInquirySchema = z.object({
  listing_id: z.uuid(),
  message: z.string().max(500).optional().or(z.literal("")),
});

// Accept inquiry
export const AcceptInquirySchema = z.object({
  inquiry_id: z.uuid(),
  access_tier: z.enum(["intro", "standard", "diligence"]).default("standard"),
  token_ttl_days: z.coerce.number().int().min(1).max(90).default(14),
});

// Decline inquiry
export const DeclineInquirySchema = z.object({
  inquiry_id: z.uuid(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

// Close inquiry
export const CloseInquirySchema = z.object({
  inquiry_id: z.uuid(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export type ExitTypeData = z.infer<typeof ExitTypeDataSchema>;
export type PartnershipTypeData = z.infer<typeof PartnershipTypeDataSchema>;
