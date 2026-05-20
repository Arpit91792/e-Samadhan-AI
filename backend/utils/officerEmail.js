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

export const officerWelcomeEmailHtml = ({ name, department, employeeId, loginUrl }) => {
      const deptName = DEPT_NAMES[department] || department;
      return `<!DOCTYPE html>
<html><body style="margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:40px 20px;">
<table width="520" align="center" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:28px;text-align:center;">
<p style="margin:0;font-size:22px;font-weight:900;color:#fff;">⚡ e-Samadhan AI</p>
<p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.8);">Smart Government Grievance Platform</p>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 12px;color:#0f172a;">Congratulations, ${name}!</h2>
<p style="color:#475569;line-height:1.7;margin:0 0 20px;">
You are now an Officer of <strong>${deptName}</strong> on e-Samadhan AI.
</p>
<div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
<p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;">YOUR EMPLOYEE ID</p>
<p style="margin:0;font-size:28px;font-weight:900;color:#1d4ed8;letter-spacing:2px;">${employeeId}</p>
</div>
<p style="color:#475569;font-size:14px;line-height:1.7;">
Register or log in using this Employee ID to access your officer dashboard.
</p>
<p style="margin:24px 0 0;text-align:center;">
<a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">Go to Officer Login</a>
</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} e-Samadhan AI — Government of India Initiative</p>
</td></tr>
</table>
</body></html>`;
};

export async function sendOfficerWelcomeEmail(officer) {
      if (!officer?.email || !officer?.employeeId) return null;
      const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
      return sendEmail({
            to: officer.email,
            subject: `Officer Appointment — Employee ID ${officer.employeeId}`,
            html: officerWelcomeEmailHtml({
                  name: officer.name,
                  department: officer.department,
                  employeeId: officer.employeeId,
                  loginUrl,
            }),
      });
}
