import mongoose from 'mongoose';

// ── AuditLog collection ───────────────────────────────────────────────────────
// Stored in: esamadhan.auditlogs
// Tracks every important action for accountability
const auditLogSchema = new mongoose.Schema(
      {
            action: {
                  type: String,
                  required: true,
                  enum: [
                        // User / citizen actions
                        'user_register', 'user_login', 'user_logout',
                        // Officer actions
                        'officer_login', 'officer_logout', 'officer_register',
                        'officer_complaint_update', 'officer_complaint_accept',
                        'officer_complaint_resolve', 'officer_note_added',
                        'officer_blocked', 'officer_unblocked',
                        // Complaint actions
                        'complaint_create', 'complaint_update', 'complaint_assign',
                        'complaint_resolve', 'complaint_reject', 'complaint_escalate',
                        // Department / admin actions
                        'department_create', 'department_update',
                        'admin_action',
                  ],
            },
            // Who performed the action — can be a User _id or Officer _id
            performedBy: {
                  type: mongoose.Schema.Types.ObjectId,
                  refPath: 'performedByModel',
                  required: true,
            },
            // Which collection performedBy refers to
            performedByModel: {
                  type: String,
                  enum: ['User', 'Officer'],
                  default: 'User',
            },
            // Role of the actor for quick filtering
            role: {
                  type: String,
                  enum: ['citizen', 'officer', 'admin'],
                  default: 'citizen',
            },
            // Optional: employee ID for officers
            employeeId: { type: String, default: null },
            // Optional: department for officers / admins
            department: { type: String, default: null },
            targetModel: {
                  type: String,
                  enum: ['User', 'Officer', 'Complaint', 'Department', null],
                  default: null,
            },
            targetId: {
                  type: mongoose.Schema.Types.ObjectId,
                  default: null,
            },
            details: {
                  type: mongoose.Schema.Types.Mixed, // flexible JSON
                  default: {},
            },
            ipAddress: { type: String },
            userAgent: { type: String },
      },
      { timestamps: true }
);

auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
