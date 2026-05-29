import nodemailer from 'nodemailer';

// ── Create a fresh transporter each call so env vars are always current ────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,   // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,   // Gmail App Password — NO spaces
    },
    tls: { rejectUnauthorized: false },
  });

// ── Verify SMTP on startup ────────────────────────────────────────────────────
export const verifyEmailConnection = async () => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️  SMTP_EMAIL or SMTP_PASSWORD not set — emails disabled');
    return;
  }
  try {
    await createTransporter().verify();
    console.log(`✅ SMTP connected: ${process.env.SMTP_EMAIL}`);
  } catch (err) {
    console.warn(`⚠️  SMTP verify failed: ${err.message}`);
    console.warn('   Check SMTP_EMAIL and SMTP_PASSWORD in backend/.env');
    console.warn('   Gmail: use App Password (no spaces), 2FA must be ON');
  }
};

// ── Core send ─────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP credentials not configured');
  }
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'e-Samadhan AI'}" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
    text: text || subject,
    attachments,
  });
  return info;
};

export default sendEmail;

// ── OTP Email Template ────────────────────────────────────────────────────────
export const otpEmailTemplate = (otp, purpose = 'register') => {
  const purposeMap = {
    register: 'complete your registration',
    login: 'log in to your account',
    reset_password: 'reset your password',
  };
  const purposeText = purposeMap[purpose] || 'verify your identity';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>OTP — e-Samadhan AI</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#f1f5f9;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
    <p style="margin:0;font-size:24px;font-weight:900;color:#fff;">⚡ e-Samadhan AI</p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;">SMART GOVERNMENT GRIEVANCE PLATFORM</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#fff;padding:36px;border:1px solid #e2e8f0;border-top:none;">
    <h2 style="color:#0f172a;margin:0 0 8px;font-size:20px;font-weight:800;">Email Verification Code</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Use the OTP below to <strong style="color:#1d4ed8;">${purposeText}</strong>.
      Valid for <strong>10 minutes</strong> and single use only.
    </p>

    <!-- OTP Box -->
    <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:2px solid #bfdbfe;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
      <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">YOUR ONE-TIME PASSWORD</p>
      <p style="font-size:48px;font-weight:900;color:#1d4ed8;font-family:'Courier New',monospace;letter-spacing:14px;margin:0;line-height:1;">${otp}</p>
      <p style="color:#94a3b8;font-size:11px;margin:14px 0 0;">⏱ Expires in 10 minutes</p>
    </div>

    <!-- Warning -->
    <div style="border-left:4px solid #f59e0b;background:#fffbeb;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
      <p style="color:#92400e;font-size:12px;font-weight:700;margin:0 0 4px;">🔒 Security Notice</p>
      <p style="color:#b45309;font-size:12px;margin:0;">
        Never share this OTP. e-Samadhan AI will <strong>never</strong> ask for your OTP via call or message.
      </p>
    </div>

    <p style="color:#94a3b8;font-size:12px;margin:0;">
      If you did not request this, please ignore this email safely.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:18px;text-align:center;">
    <p style="color:#94a3b8;font-size:11px;margin:0;">
      © ${new Date().getFullYear()} e-Samadhan AI — Government of India Initiative. Do not reply.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
};

// ── Password Reset Email ──────────────────────────────────────────────────────
export const forgotPasswordEmail = (name, resetUrl) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#f1f5f9;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:16px 16px 0 0;padding:28px;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:900;color:#fff;">⚡ e-Samadhan AI</p>
  </td></tr>
  <tr><td style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <h2 style="color:#0f172a;margin:0 0 12px;">Reset Your Password</h2>
    <p style="color:#64748b;font-size:14px;">Hello <strong>${name}</strong>,</p>
    <p style="color:#64748b;font-size:14px;line-height:1.7;">
      Click the button below to reset your password. This link expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:16px;text-align:center;">
    <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} e-Samadhan AI. Do not reply.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
