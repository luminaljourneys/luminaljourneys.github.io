/**
 * Cloudflare Worker — intake-mailer
 * Luminal Journeys
 *
 * Receives intake submission data from the client (POSTed after Firestore write),
 * sends two emails via Postmark:
 *   1. Client confirmation  → submitter's email  (production only)
 *   2. Admin notification   → support@luminaljourneys.com (forwards to all 5 team members)
 *
 * Secret required (set once in Cloudflare dashboard → Worker → Settings → Variables):
 *   POSTMARK_API_KEY = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * CORS: allows luminaljourneys.com, admin subdomain, and localhost dev.
 */

// Email routing — clean separation of concerns:
//   hello@    → client-facing FROM address + client confirmation TO address
//   intakes@  → admin notification TO address (ImprovMX → all admin users)
//              This avoids the hello→hello self-loop that ImprovMX drops.
const ADMIN_NOTIFICATION_EMAIL = 'intakes@luminaljourneys.com';
const FROM_EMAIL     = 'Luminal Journeys <hello@luminaljourneys.com>';
const POSTMARK_API   = 'https://api.postmarkapp.com/email';

const ALLOWED_ORIGINS = [
  'https://luminaljourneys.com',
  'https://www.luminaljourneys.com',
  'https://admin.luminaljourneys.com',       // primary admin/edit domain
  'https://staging.luminaljourneys.com',     // kept during DNS transition — remove after cutover
  'https://luminaljourneys-staging.web.app', // Firebase default URL (always keep)
  'http://localhost:5173',
  'http://localhost:4173',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowed ? origin : ''),
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400, origin);
    }

    if (!data.email || !data.firstName) {
      return jsonResponse({ ok: false, error: 'Missing required fields: email, firstName' }, 400, origin);
    }

    const key = env.POSTMARK_API_KEY;
    if (!key) {
      return jsonResponse({ ok: false, error: 'POSTMARK_API_KEY not configured' }, 500, origin);
    }

    // ── Send emails ─────────────────────────────────────────────────────────
    try {
      const isProduction = data.env === 'production';
      // Allow test inboxes (maildrop.cc) to receive client confirmation on any env
      const isTestEmail   = typeof data.email === 'string' && data.email.endsWith('@maildrop.cc');
      const results = [];

      // 1. Client confirmation — production always; staging if maildrop.cc test address
      if (isProduction || isTestEmail) {
        const clientRes = await sendEmail(key, {
          from:    FROM_EMAIL,
          to:      data.email,
          subject: `We've received your intake form, ${data.preferredName || data.firstName} ✦`,
          html:    clientEmailHtml(data),
        });
        results.push({ type: 'client', status: clientRes.status });
      }

      // 2. Admin notification — always (staging + production)
      // Sent to intakes@luminaljourneys.com (not hello@) to avoid ImprovMX self-loop.
      // ImprovMX forwards intakes@ to all admin users.
      const envTag    = (data.env || 'unknown').toUpperCase();
      const adminRes  = await sendEmail(key, {
        from:    FROM_EMAIL,
        to:      ADMIN_NOTIFICATION_EMAIL,
        subject: `[LUMINAL JOURNEYS] [${envTag}] New intake — ${data.firstName} ${data.lastName}`,
        html:    adminEmailHtml(data),
      });
      results.push({ type: 'admin', to: ADMIN_NOTIFICATION_EMAIL, status: adminRes.status });

      return jsonResponse({ ok: true, results }, 200, origin);

    } catch (err) {
      console.error('[intake-mailer] Error:', err);
      return jsonResponse({ ok: false, error: err.message }, 500, origin);
    }
  },
};

// ── Postmark API call ─────────────────────────────────────────────────────────

async function sendEmail(apiKey, payload) {
  const res = await fetch(POSTMARK_API, {
    method:  'POST',
    headers: {
      'X-Postmark-Server-Token': apiKey,
      'Content-Type':            'application/json',
      'Accept':                  'application/json',
    },
    body: JSON.stringify({
      From:          payload.from,
      To:            payload.to,
      Subject:       payload.subject,
      HtmlBody:      payload.html,
      MessageStream: 'outbound',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Postmark ${res.status}: ${body}`);
  }
  return res;
}

// ── Response helpers ──────────────────────────────────────────────────────────

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(ALLOWED_ORIGINS.includes(origin) ? origin : ''),
    },
  });
}

// ── Email templates ───────────────────────────────────────────────────────────

// Logo hosted on luminaljourneys.com — Gmail and all major clients block data: URIs,
// so an HTTPS URL is the only reliable approach for email image rendering.
// The transparent PNG works on the dark green header background.
// NOTE: If luminaljourneys.com is ever unreachable, the alt text "Luminal Journeys" shows.
const LOGO_URL = 'https://luminaljourneys.com/luminaljourneys-primary-logo-mark-gold.transparent.png';
// (kept for reference, not used in emails)
// const LOGO_B64 = 'data:image/png;base64,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'

// Shared branded header: dark green bar with logo mark + wordmark.
// Logo is embedded as base64 — no external request, renders in all email clients.
function emailHeader() {
  return `
  <tr>
    <td style="background:#172f2d;padding:24px 32px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <img
              src="${LOGO_URL}"
              alt="Luminal Journeys"
              width="40" height="40"
              style="display:block;border:0;height:40px;width:auto;"
            />
          </td>
          <td style="vertical-align:middle;border-left:1px solid rgba(255,255,255,0.2);padding-left:12px;">
            <div style="font-family:Georgia,'DM Serif Display',serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#e6ddd0;white-space:nowrap;">Luminal Journeys</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// Shared footer
function emailFooter() {
  return `
  <tr>
    <td style="background:#172f2d;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#89a99e;margin:0;letter-spacing:0.06em;">
        © 2026 LUMINAL JOURNEYS &nbsp;·&nbsp; <a href="https://luminaljourneys.com" style="color:#89a99e;text-decoration:none;">luminaljourneys.com</a>
      </p>
    </td>
  </tr>`;
}

function clientEmailHtml(d) {
  const name = d.preferredName || d.firstName;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>We received your intake form</title>
</head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F6;padding:40px 0;">
<tr><td align="center" style="padding:0 16px;">
<table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

  <!-- Logo header -->
  ${emailHeader()}

  <!-- Main content — cream background, opposite of header -->
  <tr>
    <td style="background:#FDFCFA;padding:40px 36px 32px;border-left:1px solid #e8e3db;border-right:1px solid #e8e3db;">

      <p style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#172f2d;margin:0 0 8px;line-height:1.3;">
        Thank you, ${name}. ✦
      </p>
      <p style="font-size:15px;color:#5a6e6b;line-height:1.75;margin:0 0 28px;">
        We've received your intake form and will be in touch within
        <strong style="color:#172f2d;">1–2 business days</strong>
        to schedule your first appointment.
      </p>

      <!-- Summary card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#F0EDE8;border-radius:8px;margin:0 0 28px;">
        <tr><td style="padding:20px 24px;">
          ${summaryRow('Primary Goal',      d.primaryGoal      || '—')}
          ${summaryRow('Preferred Contact', d.preferredContact || '—')}
          ${summaryRow('Email',             d.email)}
          ${d.phone ? summaryRow('Phone', d.phone) : ''}
        </td></tr>
      </table>

      <p style="font-size:14px;color:#89a99e;line-height:1.65;margin:0 0 28px;">
        Questions before your appointment? Simply reply to this email —
        we're happy to help.
      </p>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-radius:6px;background:#bf8a3e;">
            <a href="https://luminaljourneys.com"
              style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;letter-spacing:0.02em;font-family:Helvetica,Arial,sans-serif;">
              Visit luminaljourneys.com
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Footer -->
  ${emailFooter()}

</table>
</td></tr>
</table>
</body></html>`;
}

function adminEmailHtml(d) {
  const fullName  = `${d.firstName} ${d.lastName}`.trim();
  const address   = [d.address, d.city, d.state, d.zip].filter(Boolean).join(', ') || '—';
  const submitted = d.submittedAt
    ? new Date(d.submittedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT'
    : new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT';

  const rows = [
    ['Name',              fullName],
    ['Preferred Name',    d.preferredName    || '—'],
    ['Date of Birth',     d.dateOfBirth      || '—'],
    ['Pronouns',          d.pronouns         || '—'],
    ['Email',             `<a href="mailto:${d.email}" style="color:#2d6a4f;font-weight:500;">${d.email}</a>`],
    ['Phone',             d.phone            || '—'],
    ['Address',           address],
    ['Preferred Contact', d.preferredContact || '—'],
    ['Primary Goal',      d.primaryGoal      || '—'],
    ['How they heard',    d.hearAboutUs      || '—'],
    ['Additional Notes',  d.additionalNotes  || '—'],
    ['Submitted',         submitted],
    ['Environment',       (d.env || 'unknown').toUpperCase()],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>New Intake — ${fullName}</title>
</head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F6;padding:40px 0;">
<tr><td align="center" style="padding:0 16px;">
<table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

  <!-- Logo header -->
  ${emailHeader()}

  <!-- Tag strip: NEW INTAKE SUBMISSION + client name — cream, opposite of header -->
  <tr>
    <td style="background:#FDFCFA;padding:20px 32px 16px;border-left:1px solid #e8e3db;border-right:1px solid #e8e3db;border-bottom:1px solid #e8e3db;">
      <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#89a99e;margin-bottom:6px;font-family:Helvetica,Arial,sans-serif;">
        New Intake Submission
      </div>
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#172f2d;line-height:1.2;">
        ${fullName}
      </div>
      <div style="font-size:12px;color:#89a99e;margin-top:4px;">${submitted}</div>
    </td>
  </tr>

  <!-- Data rows — white content block -->
  <tr>
    <td style="background:#fff;padding:24px 32px;border-left:1px solid #e8e3db;border-right:1px solid #e8e3db;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rows.map(([label, val]) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #f0ece6;width:36%;font-size:10px;letter-spacing:0.09em;text-transform:uppercase;color:#89a99e;vertical-align:top;padding-right:16px;font-family:Helvetica,Arial,sans-serif;">${label}</td>
          <td style="padding:9px 0;border-bottom:1px solid #f0ece6;font-size:14px;color:#172f2d;line-height:1.5;font-family:Helvetica,Arial,sans-serif;">${val}</td>
        </tr>`).join('')}
      </table>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr>
          <td style="border-radius:6px;background:#172f2d;">
            <a href="https://admin.luminaljourneys.com"
              style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;letter-spacing:0.02em;font-family:Helvetica,Arial,sans-serif;">
              Open Admin Panel →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  ${emailFooter()}

</table>
</td></tr>
</table>
</body></html>`;
}

function summaryRow(label, value) {
  return `
  <div style="margin-bottom:12px;">
    <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#89a99e;margin-bottom:3px;font-family:Helvetica,Arial,sans-serif;">${label}</div>
    <div style="font-size:14px;color:#172f2d;font-family:Helvetica,Arial,sans-serif;">${value}</div>
  </div>`;
}
