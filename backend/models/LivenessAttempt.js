import mongoose from 'mongoose';

/** Per-email attempt tracking (separate from individual verification sessions) */
const livenessAttemptSchema = new mongoose.Schema(
      {
            email: {
                  type: String,
                  required: true,
                  unique: true,
                  lowercase: true,
                  trim: true,
            },
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                  default: null,
            },
            attempts: {
                  type: Number,
                  default: 0,
                  min: 0,
            },
            blockedUntil: {
                  type: Date,
                  default: null,
            },
            lastAttemptAt: {
                  type: Date,
                  default: null,
            },
      },
      { timestamps: true }
);

livenessAttemptSchema.index({ blockedUntil: 1 });
livenessAttemptSchema.index({ updatedAt: 1 });

const LivenessAttempt = mongoose.model('LivenessAttempt', livenessAttemptSchema);
export default LivenessAttempt;
