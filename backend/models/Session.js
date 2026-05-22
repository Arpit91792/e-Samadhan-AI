import mongoose from 'mongoose';

// ── Session collection ────────────────────────────────────────────────────────
// Tracks active login sessions for officers, admins, and citizens.
const sessionSchema = new mongoose.Schema(
      {
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
                  required: true,
                  refPath: 'roleModel',
            },
            roleModel: {
                  type: String,
                  required: true,
                  enum: ['Officer', 'User'],
            },
            role: {
                  type: String,
                  required: true,
                  enum: ['officer', 'admin', 'citizen'],
            },
            employeeId: { type: String, default: null },
            department: { type: String, default: null },
            token: { type: String, required: true },
            loginAt: { type: Date, default: Date.now },
            ipAddress: { type: String, default: '' },
            device: { type: String, default: '' },
            expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      { timestamps: true }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ role: 1 });
sessionSchema.index({ token: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index — auto-delete expired sessions

const Session = mongoose.model('Session', sessionSchema);
export default Session;
