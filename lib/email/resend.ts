import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "updates@venturepath.co";

export interface InvestorUpdateEmailPayload {
  to: string[];
  companyName: string;
  roundName: string;
  subject: string;
  body: string;
  highlights: string[];
  mrrSar: number | null;
  runwayMonths: number | null;
  publicUrl: string;
}

function buildHtml(p: InvestorUpdateEmailPayload): string {
  const highlightItems = p.highlights
    .map((h) => `<li style="margin-bottom:6px;">${escHtml(h)}</li>`)
    .join("");

  const metricsHtml =
    p.mrrSar != null || p.runwayMonths != null
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            ${
              p.mrrSar != null
                ? `<td style="padding:12px 16px;background:#f0f9fa;border-radius:8px;width:50%;">
                    <div style="font-size:11px;text-transform:uppercase;color:#4a5168;letter-spacing:0.06em;margin-bottom:4px;">MRR</div>
                    <div style="font-size:20px;font-weight:700;color:#0d1322;font-variant-numeric:tabular-nums;">SAR ${p.mrrSar.toLocaleString()}</div>
                  </td>`
                : ""
            }
            ${
              p.runwayMonths != null
                ? `<td style="padding:12px 16px;background:#f0f9fa;border-radius:8px;width:50%;">
                    <div style="font-size:11px;text-transform:uppercase;color:#4a5168;letter-spacing:0.06em;margin-bottom:4px;">Runway</div>
                    <div style="font-size:20px;font-weight:700;color:#0d1322;">${p.runwayMonths} months</div>
                  </td>`
                : ""
            }
          </tr>
        </table>`
      : "";

  const highlightsHtml = highlightItems
    ? `<h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#4a5168;font-weight:600;margin:0 0 12px;">Highlights</h2>
       <ul style="margin:0 0 24px;padding-left:20px;color:#0d1322;font-size:15px;line-height:1.6;">
         ${highlightItems}
       </ul>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f5ee;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:4px 0;background:linear-gradient(135deg,#0a7e8c,#3cd7ff);"></td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#4a5168;font-weight:600;">${escHtml(p.companyName)} · ${escHtml(p.roundName)}</p>
              <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0d1322;line-height:1.3;">${escHtml(p.subject)}</h1>

              ${metricsHtml}
              ${highlightsHtml}

              <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#4a5168;font-weight:600;margin:0 0 12px;">Update</h2>
              <div style="font-size:15px;line-height:1.7;color:#0d1322;white-space:pre-wrap;margin-bottom:32px;">${escHtml(p.body)}</div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escHtml(p.publicUrl)}" style="display:inline-block;background:#0a7e8c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">View full update →</a>
                  </td>
                </tr>
              </table>
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

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInvestorUpdateEmails(
  payload: InvestorUpdateEmailPayload,
): Promise<{ sent: number; error?: string }> {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email send");
    return { sent: 0, error: "Email not configured (RESEND_API_KEY missing)" };
  }
  if (payload.to.length === 0) return { sent: 0 };

  const html = buildHtml(payload);

  // Resend allows up to 50 recipients per call; batch if needed.
  const batches: string[][] = [];
  for (let i = 0; i < payload.to.length; i += 50) {
    batches.push(payload.to.slice(i, i + 50));
  }

  let sent = 0;
  for (const batch of batches) {
    const { error } = await resend.emails.send({
      from: FROM,
      to: batch,
      subject: `${payload.companyName}: ${payload.subject}`,
      html,
    });
    if (error) {
      console.error("[resend] send error:", error);
      return { sent, error: (error as { message?: string }).message ?? "Send failed" };
    }
    sent += batch.length;
  }

  return { sent };
}
