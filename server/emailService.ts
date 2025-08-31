import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface VipEmailOptions {
  to: string;
  code: string;
  expiresAt: string;
  paid?: boolean;
}

// HTML template helper
function buildVipEmailHtml({ code, expiresAt, paid }: VipEmailOptions) {
  const subtitle = paid
    ? 'Your VIP journey begins!'
    : 'A complimentary pass to worlds unknown';
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>NovelNexus VIP Invitation</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, sans-serif; background:#0f0c29; background:linear-gradient(135deg,#24243e 0%,#302b63 50%,#0f0c29 100%); color:#fff; padding:2rem; }
        .card { max-width:600px; margin:auto; background:rgba(255,255,255,0.05); border-radius:12px; padding:2rem; box-shadow:0 8px 16px rgba(0,0,0,0.4); }
        h1 { text-align:center; font-size:2rem; margin-bottom:0.5rem; }
        h2 { text-align:center; font-weight:400; margin-top:0; color:#facc15; }
        .code { font-size:2.2rem; letter-spacing:0.15em; font-weight:700; background:#1e1b4b; padding:1rem 2rem; border-radius:8px; display:inline-block; margin:1.5rem auto; }
        p { line-height:1.6; }
        .footer { margin-top:2rem; font-size:0.75rem; text-align:center; opacity:0.7; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>✨ Welcome to NovelNexus ✨</h1>
        <h2>${subtitle}</h2>
        <p>Greetings, Adventurer!</p>
        <p>
          Unlock countless tales of magic, mystery, and imagination with your exclusive VIP code below.
          Redeem it inside NovelNexus to start exploring premium stories without limits.
        </p>
        <div style="text-align:center;">
          <span class="code">${code}</span>
        </div>
        <p style="text-align:center;">Expires on <strong>${new Date(expiresAt).toLocaleDateString()}</strong></p>
        <p>May your journeys be legendary,<br/>The NovelNexus Guild 🪄</p>
        <div class="footer">If you did not request this email, please ignore it.</div>
      </div>
    </body>
  </html>`;
}

export async function sendVipCodeEmail(opts: VipEmailOptions) {
  const { to, code, expiresAt, paid } = opts;
  const html = buildVipEmailHtml(opts);
  await resend.emails.send({
    from: 'NovelNexus <noreply@novelnexus.com>',
    to,
    subject: paid ? 'Your NovelNexus VIP Code' : 'Your Free NovelNexus VIP Code',
    html,
  });
}
