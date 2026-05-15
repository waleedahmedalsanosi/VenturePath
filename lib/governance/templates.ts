/**
 * Pre-filled resolution body templates. Each returns a starter string the
 * founder can edit. Per PRD US-13-02, selecting a template pre-fills both
 * the title and a structured body with placeholder text.
 */

import type { Database } from "@/lib/supabase/types";

type Template = Database["public"]["Enums"]["resolution_template"];

export const TEMPLATE_LABELS: Record<Template, string> = {
  new_share_issuance: "New Share Issuance",
  round_approval: "Round Approval",
  director_appointment: "Director Appointment",
  esop_grant: "ESOP Grant",
  esop_pool_expansion: "ESOP Pool Expansion",
  rofr_waiver: "Right of First Refusal Waiver",
  transfer_restriction: "Transfer Restriction",
  custom: "Custom",
};

export function templateDefaults(template: Template): {
  title: string;
  body: string;
} {
  switch (template) {
    case "new_share_issuance":
      return {
        title: "Resolution: Issuance of New Ordinary Shares",
        body: `RESOLVED, that the Company is authorised to issue [NUMBER] Ordinary Shares to [HOLDER NAME] at a price per share of [PRICE] SAR, for a total consideration of [TOTAL] SAR.

FURTHER RESOLVED, that the Cap Table shall be updated to reflect this issuance, and the appropriate share certificates (or electronic equivalent) shall be issued to the holder.

Authorised this [DATE].`,
      };
    case "round_approval":
      return {
        title: "Resolution: Approval of Financing Round",
        body: `RESOLVED, that the Company is authorised to enter into a financing round with the following terms:
- Round size: [SIZE] SAR
- Pre-money valuation: [PRE_MONEY] SAR
- Lead investor: [LEAD]
- Instrument: [SAFE / iSAFE / Priced Round]

FURTHER RESOLVED, that the directors are authorised to execute all necessary agreements and filings to consummate this round.`,
      };
    case "director_appointment":
      return {
        title: "Resolution: Appointment of Director",
        body: `RESOLVED, that [NAME] is hereby appointed as a Director of the Company effective [DATE], to serve until removal or resignation per the Company's articles.`,
      };
    case "esop_grant":
      return {
        title: "Resolution: ESOP Grant",
        body: `RESOLVED, that the Company shall issue [NUMBER] options under the existing ESOP plan to [EMPLOYEE NAME] at a strike price of [STRIKE] SAR per share, with a vesting schedule of [SCHEDULE], dated [GRANT DATE].`,
      };
    case "esop_pool_expansion":
      return {
        title: "Resolution: Expansion of ESOP Pool",
        body: `RESOLVED, that the existing Employee Stock Option Plan pool is hereby expanded by an additional [NUMBER] options, bringing the total pool size to [NEW TOTAL] options.

FURTHER RESOLVED, that this expansion shall count against the Company's authorised but unissued shares.`,
      };
    case "rofr_waiver":
      return {
        title: "Resolution: Waiver of Right of First Refusal",
        body: `RESOLVED, that the Company hereby waives its Right of First Refusal in respect of the proposed transfer of [NUMBER] shares from [SELLER] to [BUYER] at [PRICE] SAR per share, dated [DATE].`,
      };
    case "transfer_restriction":
      return {
        title: "Resolution: Transfer Restriction",
        body: `RESOLVED, that the following transfer restrictions are hereby placed upon the Company's shares:
- Lock-up period: [DURATION]
- Restricted parties: [LIST]
- Exceptions: [LIST]

These restrictions take effect [DATE].`,
      };
    case "custom":
    default:
      return { title: "", body: "" };
  }
}
