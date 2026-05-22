/**
 * Cloudflare Worker — intake-mailer
 * Luminal Journeys
 *
 * Receives intake submission data from the client (POSTed after Firestore write),
 * sends two emails via Resend:
 *   1. Client confirmation  → submitter's email  (production only)
 *   2. Admin notification   → hi@keeya.nl        (always)
 *
 * Secret required (set once in Cloudflare dashboard → Worker → Settings → Variables):
 *   RESEND_API_KEY = re_xxxxxxxx
 *
 * CORS: allows luminaljourneys.com, staging subdomain, and localhost dev.
 */

const ADMIN_EMAIL   = 'hi@keeya.nl';
const FROM_EMAIL    = 'Luminal Journeys <hello@luminaljourneys.com>';
const RESEND_API    = 'https://api.resend.com/emails';

const ALLOWED_ORIGINS = [
  'https://luminaljourneys.com',
  'https://www.luminaljourneys.com',
  'https://staging.luminaljourneys.com',
  'https://luminaljourneys-staging.web.app',
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

    const key = env.RESEND_API_KEY;
    if (!key) {
      return jsonResponse({ ok: false, error: 'RESEND_API_KEY not configured' }, 500, origin);
    }

    // ── Send emails ─────────────────────────────────────────────────────────
    try {
      const isProduction = data.env === 'production';
      const results = [];

      // 1. Client confirmation — production submissions only
      if (isProduction) {
        const clientRes = await sendEmail(key, {
          from:    FROM_EMAIL,
          to:      data.email,
          subject: `We've received your intake form, ${data.preferredName || data.firstName} ✦`,
          html:    clientEmailHtml(data),
        });
        results.push({ type: 'client', status: clientRes.status });
      }

      // 2. Admin notification — always (staging + production)
      const adminRes = await sendEmail(key, {
        from:    FROM_EMAIL,
        to:      ADMIN_EMAIL,
        subject: `[${(data.env || 'unknown').toUpperCase()}] New intake — ${data.firstName} ${data.lastName}`,
        html:    adminEmailHtml(data),
      });
      results.push({ type: 'admin', status: adminRes.status });

      return jsonResponse({ ok: true, results }, 200, origin);

    } catch (err) {
      console.error('[intake-mailer] Error:', err);
      return jsonResponse({ ok: false, error: err.message }, 500, origin);
    }
  },
};

// ── Resend API call ───────────────────────────────────────────────────────────

async function sendEmail(apiKey, payload) {
  const res = await fetch(RESEND_API, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
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

function clientEmailHtml(d) {
  const name = d.preferredName || d.firstName;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F6;padding:48px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d8;">

  <tr><td style="background:#172f2d;padding:32px 40px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:22px;color:#e6ddd0;letter-spacing:0.04em;">Luminal Journeys</div>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="font-size:26px;font-weight:600;color:#172f2d;margin:0 0 16px;">Thank you, ${name}. ✦</p>
    <p style="font-size:16px;color:#4a5568;line-height:1.7;margin:0 0 24px;">
      We've received your intake form and will be in touch within
      <strong>1–2 business days</strong> to schedule your first appointment.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#F9F8F6;border-radius:8px;border:1px solid #e5e0d8;margin:0 0 28px;">
      <tr><td style="padding:20px 24px;">
        ${summaryRow('Primary Goal',      d.primaryGoal      || '—')}
        ${summaryRow('Preferred Contact', d.preferredContact || '—')}
        ${summaryRow('Email',             d.email)}
        ${d.phone ? summaryRow('Phone', d.phone) : ''}
      </td></tr>
    </table>
    <p style="font-size:14px;color:#89a99e;line-height:1.6;margin:0;">
      Questions before your appointment? Simply reply to this email.
    </p>
  </td></tr>

  <tr><td style="background:#F9F8F6;border-top:1px solid #e5e0d8;padding:20px 40px;text-align:center;">
    <p style="font-size:12px;color:#89a99e;margin:0;letter-spacing:0.05em;">© 2026 LUMINAL JOURNEYS · All rights reserved</p>
  </td></tr>

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
    ['Email',             `<a href="mailto:${d.email}" style="color:#2E7D7F;">${d.email}</a>`],
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
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d8;">

  <tr><td style="background:#172f2d;padding:24px 32px;">
    <div style="font-size:11px;letter-spacing:0.12em;color:#89a99e;text-transform:uppercase;margin-bottom:4px;">New Intake Submission</div>
    <div style="font-size:20px;font-weight:600;color:#e6ddd0;">${fullName}</div>
  </td></tr>

  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${rows.map(([label, val]) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0ece6;width:38%;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#89a99e;vertical-align:top;padding-right:16px;">${label}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0ece6;font-size:14px;color:#172f2d;">${val}</td>
      </tr>`).join('')}
    </table>
    <div style="margin-top:28px;text-align:center;">
      <a href="https://luminaljourneys.com/admin"
        style="display:inline-block;background:#172f2d;color:#fff;text-decoration:none;border-radius:6px;padding:12px 28px;font-size:14px;font-weight:500;">
        Open Admin Panel →
      </a>
    </div>
  </td></tr>

  <tr><td style="background:#F9F8F6;border-top:1px solid #e5e0d8;padding:16px 32px;text-align:center;">
    <p style="font-size:11px;color:#89a99e;margin:0;letter-spacing:0.05em;">LUMINAL JOURNEYS · Automated notification</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function summaryRow(label, value) {
  return `<div style="margin-bottom:10px;">
    <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#89a99e;margin-bottom:2px;">${label}</div>
    <div style="font-size:14px;color:#172f2d;">${value}</div>
  </div>`;
}
