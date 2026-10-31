/* Contact form handler: spam checks, Cloudflare Turnstile verification, then forward to FormSubmit.
   Env vars (Vercel project settings):
     TURNSTILE_SECRET  Turnstile secret key. If unset, the captcha check is skipped. */
const TO = 'grobleroliver@gmail.com';
const SITE = 'https://www.aibyao.com';
const BLOCKED = /voice4yourstack|elevenlabs voice library/i;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const d = {
    name: str(b.name, 200),
    email: str(b.email, 200),
    topic: str(b.topic, 100),
    company: str(b.company, 200),
    message: str(b.message, 5000)
  };

  if (d.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) || d.message.length < 10) {
    return res.status(400).json({ success: false, message: 'Please check your details and try again.' });
  }

  /* Looks like spam: pretend it worked so the sender isn't tipped off. */
  const tooFast = Number(b.elapsed) < 4000;
  if (b._honey || tooFast || BLOCKED.test(`${d.email} ${d.company} ${d.message}`)) {
    return res.status(200).json({ success: true });
  }

  const secret = process.env.TURNSTILE_SECRET;
  if (secret) {
    const token = str(b.turnstile, 4096);
    let ok = false;
    if (token) {
      try {
        const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, response: token, remoteip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined })
        });
        ok = !!(await r.json()).success;
      } catch (e) { ok = false; }
    }
    if (!ok) return res.status(400).json({ success: false, message: 'Captcha check failed. Please try again.' });
  }

  try {
    const r = await fetch(`https://formsubmit.co/ajax/${TO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: SITE, Referer: `${SITE}/` },
      body: JSON.stringify({ ...d, _subject: 'New enquiry from the AI by AO website', _template: 'table' })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false || j.success === 'false') throw new Error(j.message || 'Send failed');
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(502).json({ success: false, message: 'Send failed' });
  }
};
