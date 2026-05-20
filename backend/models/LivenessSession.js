import mongoose from 'mongoose';
import crypto from 'crypto';

const livenessSessionSchema = new mongoose.Schema(
      {
            sessionId: {
                  type: String,
                  required: true,
                  unique: true,
                  default: () => crypto.randomBytes(24).toString('hex'),
            },
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                  default: null,
            },
            email: {
                  type: String,
                  lowercase: true,
                  trim: true,
            },
            govtIdType: {
                  type: String,
                  enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport', ''],
                  default: '',
            },
            govtIdImage: { type: String, default: null },
            tasks: {
                  type: [String],
                  default: [],
            },
            completedActions: {
                  type: [String],
                  default: [],
            },
            livenessVerified: {
                  type: Boolean,
                  default: false,
            },
            verificationStatus: {
                  type: String,
                  enum: ['pending', 'verified', 'failed', 'expired'],
                  default: 'pending',
            },
            confidenceScore: {
                  type: Number,
                  default: 0,
            },
            fraudFlags: {
                  type: [String],
                  default: [],
            },
            liveCaptureHash: { type: String, select: false },
            attempts: { type: Number, default: 0 },
            blockedUntil: { type: Date, default: null },
            expiresAt: {
                  type: Date,
                  default: () => new Date(Date.now() + 15 * 60 * 1000),
                  expires: 0,
            },
      },
      { timestamps: true, bufferCommands: false }
);

livenessSessionSchema.index({ email: 1, verificationStatus: 1 });

const LivenessSession = mongoose.model('LivenessSession', livenessSessionSchema);
export default LivenessSession;
