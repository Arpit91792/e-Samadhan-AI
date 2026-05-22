import sendEmail from './sendEmail.js';

const DEPT_NAMES = {
      electricity: 'Electricity',
      water_supply: 'Water Supply',
      roads_transport: 'Roads & Transport',
      sanitation: 'Sanitation',
      police: 'Police',
      healthcare: 'Healthcare',
      municipal: 'Municipal Services',
      education: 'Education',
      general: 'General Administration',
};

// ── Welcome / account-created email ──────────────────────────────────────────
export const officerWelcomeEmailHtml = ({ name, department, employeeId, registerUrl }) => {
      const deptName = DEPT_NAMES[department] || department;
      const year = new Date().getFullYear();
      return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:40px 20px;">
<table width="560" align="center" cellpadding="0" cellspacing="0"
  style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:32px;text-align:center;">
    <p style="margin:0;font-size:24px;font-weight:900;color:#fff;">⚡ e-Samadhan AI</p>
    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.8);letter-spacing:1px;">SMART GOVERNMENT GRIEVANCE PLATFORM</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px;">
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Officer Account Created</h2>
    <p style="color:#475569;line-height:1.7;margin:0 0 24px;font-size:14px;">
      Congratulations <strong>${name}</strong>! You have been registered as an officer for the
      <strong>${deptName} Department</strong> on e-Samadhan AI.
    </p>

    <!-- Employee ID box -->
    <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#64748b;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your Employee ID</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#1d4ed8;letter-spacing:4px;font-family:'Courier New',monospace;">${employeeId}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#64748b;">Department: <strong>${deptName}</strong></p>
    </div>

    <!-- Instructions -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#166534;">📋 Registration Instructions</p>
      <ol style="margin:0;padding-left:18px;color:#15803d;font-size:13px;line-height:1.8;">
        <li>Go to the Officer Registration page</li>
        <li>Enter your Employee ID: <strong>${employeeId}</strong></li>
        <li>Enter this official email address</li>
        <li>Select department: <strong>${deptName}</strong></li>
        <li>Verify your email with OTP</li>
        <li>Set your password to complete registration</li>
      </ol>
    </div>

    <!-- Security warning -->
    <div style="border-left:4px solid #f59e0b;background:#fffbeb;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="color:#92400e;font-size:12px;font-weight:700;margin:0 0 4px;">🔒 Security Notice</p>
      <p style="color:#b45309;font-size:12px;margin:0;">
        Keep your Employee ID confidential. You can only register using the exact department
        and email assigned to you. Cross-department access is strictly blocked.
      </p>
    </div>

    <p style="margin:0 0 24px;text-align:center;">
      <a href="${registerUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;
               padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
        Complete Registration →
      </a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">© ${year} e-Samadhan AI — Government of India Initiative. Do not reply.</p>
  </td></tr>
</table>
</body></html>`;
};

export async function sendOfficerWelcomeEmail(officer) {
      if (!officer?.email || !officer?.employeeId) return null;
      const registerUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/officer/register`;
      return sendEmail({
            to: officer.email,
            subject: `Officer Account Created — Employee ID: ${officer.employeeId}`,
            html: officerWelcomeEmailHtml({
                  name: officer.name,
                  department: officer.department,
                  employeeId: officer.employeeId,
                  registerUrl,
            }),
      });
}
