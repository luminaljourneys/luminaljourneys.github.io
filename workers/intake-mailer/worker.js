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

// Shared branded header: dark green bar with logo mark + wordmark
// Uses hosted PNG assets from luminaljourneys.com (public, no auth needed).
// Inline alt text renders in clients that block images.
function emailHeader() {
  return `
  <tr>
    <td style="background:#172f2d;padding:24px 32px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <img
              src="https://luminaljourneys.com/luminaljourneys-primary-logo-mark-gold.transparent.png"
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
