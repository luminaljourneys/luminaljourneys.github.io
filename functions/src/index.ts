/**
 * functions/src/index.ts — Luminal Journeys
 *
 * Cloud Function: sendIntakeEmails
 * Triggers on every new document in `intake_submissions`.
 * Sends two emails via Resend:
 *   1. Client confirmation → submitter's email address
 *   2. Admin notification  → hi@keeya.nl
 *
 * Required secret (set once, never committed):
 *   firebase functions:secrets:set RESEND_API_KEY
 *
 * Deploy:
 *   cd functions && npm run build
 *   firebase deploy --only functions
 */

import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { Resend } from "resend";

admin.initializeApp();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// ── Intake document shape ─────────────────────────────────────────────────────
interface IntakeData {
  firstName:        string;
  lastName:         string;
  preferredName?:   string;
  dateOfBirth?:     string;
  pronouns?:        string;
  email:            string;
  phone?:           string;
  address?:         string;
  city?:            string;
  state?:           string;
  zip?:             string;
  preferredContact?: string;
  primaryGoal?:     string;
  hearAboutUs?:     string;
  additionalNotes?: string;
  env:              "staging" | "production";
  status:           string;
  submittedAt?:     admin.firestore.Timestamp;
}

// ── Helper: format date nicely ────────────────────────────────────────────────
function fmtDate(ts?: admin.firestore.Timestamp): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }) + " PT";
}

// ── Cloud Function ────────────────────────────────────────────────────────────
export const sendIntakeEmails = onDocumentCreated(
  {
    document: "intake_submissions/{docId}",
    secrets: [RESEND_API_KEY],
    region: "us-central1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const d = snap.data() as IntakeData;
    const resend = new Resend(RESEND_API_KEY.value());

    const displayName = d.preferredName || d.firstName;
    const fullName    = `${d.firstName} ${d.lastName}`.trim();
    const submitted   = fmtDate(d.submittedAt);
    const isStaging   = d.env === "staging";

    // Skip client email for staging submissions to avoid spamming real inboxes
    // during testing. Admin notification still fires so you can verify.
    if (!isStaging) {
      // ── 1. Client confirmation ──────────────────────────────────────────────
      await resend.emails.send({
        from: "Luminal Journeys <hello@luminaljourneys.com>",
        to:   d.email,
        subject: `We've received your intake form, ${displayName} ✦`,
        html: clientEmailHtml(displayName, d),
      });
    }

    // ── 2. Admin notification (always fires, both envs) ─────────────────────
    await resend.emails.send({
      from:    "Luminal Journeys <hello@luminaljourneys.com>",
      to:      "hi@keeya.nl",
      subject: `[${d.env.toUpperCase()}] New intake — ${fullName}`,
      html:    adminEmailHtml(fullName, d, submitted, snap.id),
    });

    console.log(`[sendIntakeEmails] Emails sent for ${fullName} (${d.env})`);
  }
);

// ── Email templates ───────────────────────────────────────────────────────────

function clientEmailHtml(displayName: string, d: IntakeData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F6;padding:48px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d8;">

        <!-- Header -->
        <tr>
          <td style="background:#172f2d;padding:32px 40px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;color:#e6ddd0;letter-spacing:0.04em;">
              Luminal Journeys
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="font-size:26px;font-weight:600;color:#172f2d;margin:0 0 16px;">
              Thank you, ${displayName}. ✦
            </p>
            <p style="font-size:16px;color:#4a5568;line-height:1.7;margin:0 0 24px;">
              We've received your intake form and will be in touch within
              <strong>1–2 business days</strong> to schedule your first appointment.
            </p>
            <p style="font-size:15px;color:#4a5568;line-height:1.7;margin:0 0 8px;">
              Here's a quick summary of what you shared:
            </p>

            <!-- Summary box -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F9F8F6;border-radius:8px;border:1px solid #e5e0d8;margin:0 0 28px;">
              <tr>
                <td style="padding:20px 24px;">
                  ${summaryRow("Primary Goal",   d.primaryGoal || "—")}
                  ${summaryRow("Preferred Contact", d.preferredContact || "—")}
                  ${summaryRow("Email", d.email)}
                  ${d.phone ? summaryRow("Phone", d.phone) : ""}
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#89a99e;line-height:1.6;margin:0 0 4px;">
              Questions before your appointment? Simply reply to this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9F8F6;border-top:1px solid #e5e0d8;padding:20px 40px;text-align:center;">
            <p style="font-size:12px;color:#89a99e;margin:0;letter-spacing:0.05em;">
              © 2026 LUMINAL JOURNEYS · All rights reserved
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminEmailHtml(
  fullName: string,
  d: IntakeData,
  submitted: string,
  docId: string,
): string {
  const adminUrl = "https://luminaljourneys.com/admin";
  const rows = [
    ["Name",             fullName],
    ["Preferred Name",   d.preferredName || "—"],
    ["Date of Birth",    d.dateOfBirth   || "—"],
    ["Pronouns",         d.pronouns      || "—"],
    ["Email",            `<a href="mailto:${d.email}" style="color:#2E7D7F;">${d.email}</a>`],
    ["Phone",            d.phone   || "—"],
    ["Address",          [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ") || "—"],
    ["Preferred Contact",d.preferredContact || "—"],
    ["Primary Goal",     d.primaryGoal  || "—"],
    ["How they heard",   d.hearAboutUs  || "—"],
    ["Additional Notes", d.additionalNotes || "—"],
    ["Submitted",        submitted],
    ["Environment",      d.env.toUpperCase()],
    ["Doc ID",           `<span style="font-family:monospace;font-size:12px;">${docId}</span>`],
  ];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d8;">

        <!-- Header -->
        <tr>
          <td style="background:#172f2d;padding:24px 32px;text-align:left;">
            <div style="font-size:11px;letter-spacing:0.12em;color:#89a99e;text-transform:uppercase;margin-bottom:4px;">
              New Intake Submission
            </div>
            <div style="font-size:20px;font-weight:600;color:#e6ddd0;">
              ${fullName}
            </div>
          </td>
        </tr>

        <!-- Table -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rows.map(([label, val]) => `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0ece6;width:38%;
                  font-size:11px;letter-spacing:0.08em;text-transform:uppercase;
                  color:#89a99e;vertical-align:top;padding-right:16px;">${label}</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0ece6;
                  font-size:14px;color:#172f2d;">${val}</td>
              </tr>`).join("")}
            </table>

            <div style="margin-top:28px;text-align:center;">
              <a href="${adminUrl}"
                style="display:inline-block;background:#172f2d;color:#fff;
                text-decoration:none;border-radius:6px;padding:12px 28px;
                font-size:14px;font-weight:500;letter-spacing:0.02em;">
                Open Admin Panel →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9F8F6;border-top:1px solid #e5e0d8;padding:16px 32px;text-align:center;">
            <p style="font-size:11px;color:#89a99e;margin:0;letter-spacing:0.05em;">
              LUMINAL JOURNEYS · Automated notification
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function summaryRow(label: string, value: string): string {
  return `
  <div style="margin-bottom:10px;">
    <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#89a99e;margin-bottom:2px;">${label}</div>
    <div style="font-size:14px;color:#172f2d;">${value}</div>
  </div>`;
}
