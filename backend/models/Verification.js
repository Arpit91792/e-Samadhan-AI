import mongoose from 'mongoose';

// ── Verification collection ───────────────────────────────────────────────────
// Tracks government ID and face verification status per user
// Stored in: esamadhan.verifications
const verificationSchema = new mongoose.Schema(
      {
            user: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                  required: true,
                  unique: true,   // one verification record per user
            },
            // Government ID verification
            govtId: {
                  idType: { type: String, enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport'] },
                  number: { type: String, select: false },
                  imageUrl: { type: String },
                  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
                  verifiedAt: { type: Date },
                  rejectedReason: { type: String },
            },
            // AI liveness verification (anti-spoof)
            liveness: {
                  sessionId: { type: String },
                  imageUrl: { type: String },
                  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
                  verifiedAt: { type: Date },
                  confidence: { type: Number },
                  completedActions: [{ type: String }],
            },
            face: {
                  imageUrl: { type: String },
                  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
                  verifiedAt: { type: Date },
                  confidence: { type: Number },
            },
            // Overall verification level
            level: {
                  type: String,
                  enum: ['none', 'email', 'basic', 'full'],
                  default: 'none',
            },
            verifiedBy: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
            },
            notes: { type: String },
      },
      { timestamps: true }
);
// Note: unique:true on user field already creates an index — no need for schema.index()

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
