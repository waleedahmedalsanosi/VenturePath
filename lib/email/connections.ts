/**
 * Connections Hub email templates.
 *
 * Four transactional emails for the connection inquiry handshake:
 *   1. inquiry-sent       → listing owner gets notified
 *   2. inquiry-accepted   → BOTH parties get contact details + data-room link
 *   3. inquiry-declined   → inquirer is notified
 *   4. listing-published  → owner confirmation
 *
 * Visual DNA matches investor-update + share-listing templates in resend.ts:
 *   - 4px gradient top stripe (#0A7E8C → #3CD7FF at 135deg)
 *   - Papyrus background (#f8f5ee), 600px max width centered
 *   - label-md uppercase header line + H1 + content
 *   - Single primary CTA when relevant (teal gradient button)
 *   - Footer: "Sent via VenturePath — Sharia-compliant cap table for KSA founders"
 *   - Zero decorative elements (no icons-in-circles, no centered hero, no emoji)
 */

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "updates@venturepath.co";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shellHtml(opts: {
  eyebrow: string;
  headline: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const cta = opts.ctaUrl && opts.ctaLabel
    ? `<table width="100%" cellpadding="0" cellspacing="0">
         <tr><td align="center">
           <a href="${escHtml(opts.ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#0a7e8c,#3cd7ff);color:#0d1322;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;">${escHtml(opts.ctaLabel)} →</a>
         </td></tr>
       </table>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f5ee;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:4px 0;background:linear-gradient(135deg,#0a7e8c,#3cd7ff);"></td></tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#4a5168;font-weight:600;">${escHtml(opts.eyebrow)}</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0d1322;line-height:1.3;">${escHtml(opts.headline)}</h1>
              <div style="font-size:15px;line-height:1.7;color:#0d1322;margin-bottom:${cta ? "24px" : "8px"};">${opts.body}</div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;border-top:1px solid #efeae0;">
              <p style="margin:0;font-size:12px;color:#8b92a8;">Sent via <a href="https://venturepath.co" style="color:#0a7e8c;text-decoration:none;">VenturePath</a> — Sharia-compliant cap table for KSA founders.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function listingTypeLabel(t: "exit" | "partnership"): string {
  return t === "exit" ? "Exit listing" : "Partnership listing";
}

// ── 1. Inquiry sent (to listing owner) ─────────────────────────────────────

export interface InquirySentPayload {
  to: string;
  ownerCompanyName: string;
  listingType: "exit" | "partnership";
  inquirerCompanyName: string;
  inquirerMessage: string | null;
  listingUrl: string;
}

export async function sendInquirySentEmail(
  p: InquirySentPayload,
): Promise<{ sent: number; error?: string }> {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping inquiry-sent email");
    return { sent: 0, error: "Email not configured (RESEND_API_KEY missing)" };
  }

  const bodyHtml = `
    <p style="margin:0 0 12px;"><strong>${escHtml(p.inquirerCompanyName)}</strong> is interested in your ${escHtml(listingTypeLabel(p.listingType).toLowerCase())}.</p>
    ${p.inquirerMessage ? `<p style="margin:0 0 12px;color:#4a5168;padding:12px 16px;background:#f8f5ee;border-radius:8px;font-style:italic;">${escHtml(p.inquirerMessage)}</p>` : ""}
    <p style="margin:0 0 12px;color:#4a5168;">Review their inquiry on VenturePath to accept (revealing contact details + data room access) or decline.</p>`;

  const html = shellHtml({
    eyebrow: `${p.ownerCompanyName} · ${listingTypeLabel(p.listingType)}`,
    headline: "New inquiry on your listing",
    body: bodyHtml,
    ctaUrl: p.listingUrl,
    ctaLabel: "Review inquiry",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [p.to],
    subject: `${p.ownerCompanyName}: new connection inquiry`,
    html,
  });
  if (error) {
    return { sent: 0, error: (error as { message?: string }).message ?? "Send failed" };
  }
  return { sent: 1 };
}

// ── 2. Inquiry accepted with contact reveal (to inquirer) ──────────────────

export interface InquiryAcceptedToInquirerPayload {
  to: string;
  inquirerCompanyName: string;
  ownerCompanyName: string;
  ownerName: string;
  ownerEmail: string;
  listingType: "exit" | "partnership";
  dataRoomUrl: string | null; // null = no data room link (e.g., owner has no published tier yet)
}

export async function sendInquiryAcceptedToInquirerEmail(
  p: InquiryAcceptedToInquirerPayload,
): Promise<{ sent: number; error?: string }> {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping accepted email");
    return { sent: 0, error: "Email not configured (RESEND_API_KEY missing)" };
  }

  const contactBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ee;border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:11px;text-transform:uppercase;color:#4a5168;letter-spacing:0.06em;margin-bottom:4px;">Contact</div>
        <div style="font-size:16px;font-weight:600;color:#0d1322;">${escHtml(p.ownerName)}</div>
        <div style="font-size:14px;color:#4a5168;margin-top:2px;"><a href="mailto:${escHtml(p.ownerEmail)}" style="color:#0a7e8c;text-decoration:none;">${escHtml(p.ownerEmail)}</a></div>
      </td></tr>
    </table>`;

  const bodyHtml = `
    <p style="margin:0 0 16px;"><strong>${escHtml(p.ownerName)}</strong> at ${escHtml(p.ownerCompanyName)} accepted your inquiry. You can now connect directly.</p>
    ${contactBlock}
    <p style="margin:0 0 12px;color:#4a5168;font-size:14px;">VenturePath does not mediate the conversation from here. Closing happens between the two of you, off-platform.</p>`;

  const html = shellHtml({
    eyebrow: `${p.ownerCompanyName} · ${listingTypeLabel(p.listingType)}`,
    headline: `${p.ownerName} accepted your inquiry`,
    body: bodyHtml,
    ctaUrl: p.dataRoomUrl ?? undefined,
    ctaLabel: p.dataRoomUrl ? "Open data room" : undefined,
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [p.to],
    subject: `${p.ownerCompanyName}: inquiry accepted — contact details inside`,
    html,
  });
  if (error) {
    return { sent: 0, error: (error as { message?: string }).message ?? "Send failed" };
  }
  return { sent: 1 };
}

// ── 2b. Inquiry accepted — confirmation to owner ───────────────────────────

export interface InquiryAcceptedToOwnerPayload {
  to: string;
  ownerCompanyName: string;
  inquirerCompanyName: string;
  inquirerName: string;
  inquirerEmail: string;
  listingType: "exit" | "partnership";
  listingUrl: string;
}

export async function sendInquiryAcceptedToOwnerEmail(
  p: InquiryAcceptedToOwnerPayload,
): Promise<{ sent: number; error?: string }> {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping accepted-owner email");
    return { sent: 0, error: "Email not configured (RESEND_API_KEY missing)" };
  }

  const contactBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ee;border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:11px;text-transform:uppercase;color:#4a5168;letter-spacing:0.06em;margin-bottom:4px;">Contact</div>
        <div style="font-size:16px;font-weight:600;color:#0d1322;">${escHtml(p.inquirerName)} · ${escHtml(p.inquirerCompanyName)}</div>
        <div style="font-size:14px;color:#4a5168;margin-top:2px;"><a href="mailto:${escHtml(p.inquirerEmail)}" style="color:#0a7e8c;text-decoration:none;">${escHtml(p.inquirerEmail)}</a></div>
      </td></tr>
    </table>`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">You accepted <strong>${escHtml(p.inquirerName)}</strong>'s inquiry. They now have your contact details and a scoped data-room link (if configured).</p>
    ${contactBlock}`;

  const html = shellHtml({
    eyebrow: `${p.ownerCompanyName} · ${listingTypeLabel(p.listingType)}`,
    headline: "Inquiry accepted",
    body: bodyHtml,
    ctaUrl: p.listingUrl,
    ctaLabel: "View listing",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [p.to],
    subject: `${p.ownerCompanyName}: inquiry accepted`,
    html,
  });
  if (error) {
    return { sent: 0, error: (error as { message?: string }).message ?? "Send failed" };
  }
  return { sent: 1 };
}

// ── 3. Inquiry declined (to inquirer) ──────────────────────────────────────

export interface InquiryDeclinedPayload {
  to: string;
  inquirerCompanyName: string;
  ownerCompanyName: string;
  listingType: "exit" | "partnership";
  declineReason: string | null;
  browseUrl: string;
}

export async function sendInquiryDeclinedEmail(
  p: InquiryDeclinedPayload,
): Promise<{ sent: number; error?: string }> {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping declined email");
    return { sent: 0, error: "Email not configured (RESEND_API_KEY missing)" };
  }

  const bodyHtml = `
    <p style="margin:0 0 12px;">${escHtml(p.ownerCompanyName)} is not pursuing this connection at the moment.</p>
    ${p.declineReason ? `<p style="margin:0 0 12px;color:#4a5168;padding:12px 16px;background:#f8f5ee;border-radius:8px;font-style:italic;">${escHtml(p.declineReason)}</p>` : ""}
    <p style="margin:0 0 12px;color:#4a5168;font-size:14px;">There are other listings on the Connections Hub that may be a better fit.</p>`;

  const html = shellHtml({
    eyebrow: `${p.ownerCompanyName} · ${listingTypeLabel(p.listingType)}`,
    headline: "Inquiry update",
    body: bodyHtml,
    ctaUrl: p.browseUrl,
    ctaLabel: "Browse Connections",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [p.to],
    subject: `${p.ownerCompanyName}: inquiry update`,
    html,
  });
  if (error) {
    return { sent: 0, error: (error as { message?: string }).message ?? "Send failed" };
  }
  return { sent: 1 };
}

// ── 4. Listing published (confirmation to owner) ───────────────────────────

export interface ListingPublishedPayload {
  to: string;
  ownerCompanyName: string;
  listingType: "exit" | "partnership";
  listingUrl: string;
}

export async function sendListingPublishedEmail(
  p: ListingPublishedPayload,
): Promise<{ sent: number; error?: string }> {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping published email");
    return { sent: 0, error: "Email not configured (RESEND_API_KEY missing)" };
  }

  const bodyHtml = `
    <p style="margin:0 0 12px;">Your ${escHtml(listingTypeLabel(p.listingType).toLowerCase())} is live on the Connections Hub.</p>
    <p style="margin:0 0 12px;color:#4a5168;">It is visible to other VenturePath members. You will receive an email when someone sends an inquiry.</p>`;

  const html = shellHtml({
    eyebrow: `${p.ownerCompanyName} · ${listingTypeLabel(p.listingType)}`,
    headline: "Your listing is live",
    body: bodyHtml,
    ctaUrl: p.listingUrl,
    ctaLabel: "View listing",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [p.to],
    subject: `Your ${listingTypeLabel(p.listingType).toLowerCase()} is live`,
    html,
  });
  if (error) {
    return { sent: 0, error: (error as { message?: string }).message ?? "Send failed" };
  }
  return { sent: 1 };
}
