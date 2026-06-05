const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim()
    .slice(0, 2000);
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) return send(res, 500, { error: 'RESEND_API_KEY is not configured' });

  const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
  if (body.website) return send(res, 200, { ok: true });

  const lead = {
    name: escapeHtml(body.name),
    email: escapeHtml(body.email),
    organization: escapeHtml(body.organization),
    projectType: escapeHtml(body.projectType),
    message: escapeHtml(body.message),
  };

  if (!lead.name || !isEmail(lead.email) || !lead.organization || !lead.projectType || !lead.message) {
    return send(res, 400, { error: 'Missing required fields' });
  }

  const text = [
    'New Rightnote inquiry',
    '',
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Organization / role: ${lead.organization}`,
    `Project type: ${lead.projectType}`,
    '',
    'Message:',
    lead.message,
  ].join('\n');

  const html = `
    <h2>New Rightnote inquiry</h2>
    <p><strong>Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Organization / role:</strong> ${lead.organization}</p>
    <p><strong>Project type:</strong> ${lead.projectType}</p>
    <hr />
    <p style="white-space:pre-wrap">${lead.message}</p>
  `;

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Rightnote <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO_EMAIL || 'hermes.promox@gmail.com'],
      reply_to: lead.email,
      subject: `Rightnote inquiry — ${lead.projectType} — ${lead.organization}`,
      text,
      html,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) return send(res, 502, { error: result.message || 'Resend error' });
  return send(res, 200, { ok: true, id: result.id });
};
