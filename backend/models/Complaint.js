import mongoose from 'mongoose';

// ── Complaint collection ──────────────────────────────────────────────────────
// Stored in: esamadhan.complaints
const complaintSchema = new mongoose.Schema(
      {
            complaintId: {
                  type: String,
                  unique: true,
            },
            title: {
                  type: String,
                  required: [true, 'Complaint title is required'],
                  trim: true,
                  maxlength: [200, 'Title cannot exceed 200 characters'],
            },
            description: {
                  type: String,
                  required: [true, 'Description is required'],
                  trim: true,
                  maxlength: [2000, 'Description cannot exceed 2000 characters'],
            },
            category: {
                  type: String,
                  required: [true, 'Category is required'],
                  enum: [
                        'electricity', 'water_supply', 'roads_transport',
                        'sanitation', 'police', 'healthcare', 'municipal', 'education', 'other',
                  ],
            },
            priority: {
                  type: String,
                  enum: ['low', 'medium', 'high', 'emergency'],
                  default: 'medium',
            },
            status: {
                  type: String,
                  enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'],
                  default: 'pending',
            },
            // Who filed it
            citizen: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                  required: true,
            },
            // Which officer is handling it
            assignedOfficer: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                  default: null,
            },
            // Which department
            department: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'Department',
                  default: null,
            },
            location: {
                  address: { type: String, trim: true },
                  city: { type: String, trim: true },
                  state: { type: String, trim: true },
                  pincode: { type: String, trim: true },
                  coordinates: {
                        lat: { type: Number },
                        lng: { type: Number },
                  },
            },
            attachments: [
                  {
                        url: { type: String },
                        filename: { type: String },
                        mimetype: { type: String },
                  },
            ],
            // Timeline of status changes
            timeline: [
                  {
                        status: { type: String },
                        note: { type: String },
                        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                        updatedAt: { type: Date, default: Date.now },
                  },
            ],
            // Citizen feedback after resolution
            feedback: {
                  rating: { type: Number, min: 1, max: 5 },
                  comment: { type: String, trim: true },
                  givenAt: { type: Date },
            },
            // AI Resolution Report fields
            resolutionNotes: { type: String },
            resolutionReport: { type: String },
            reportPdfUrl: { type: String },
            reportGeneratedAt: { type: Date },
            reportSent: { type: Boolean, default: false },
            citizenRating: { type: Number, default: 0 },
            citizenFeedback: { type: String },
            resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            // Crowd verification — other citizens who upvoted
            upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            upvoteCount: { type: Number, default: 0 },
            isEmergency: { type: Boolean, default: false },
            aiPriorityReason: { type: String, trim: true, default: '' },
            duplicateClusterCount: { type: Number, default: 0 },
            resolvedAt: { type: Date },
            dueDate: { type: Date },
            language: { type: String, default: 'en' },

            // ── Queue / self-assignment fields ────────────────────────────────
            // True once an officer picks it up from the department queue
            isAccepted: { type: Boolean, default: false },
            acceptedBy: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'Officer',
                  default: null,
            },
            acceptedAt: { type: Date, default: null },
      },
      { timestamps: true }
);

// Auto-generate complaint ID like C-000001
complaintSchema.pre('save', async function (next) {
      if (!this.complaintId) {
            const count = await mongoose.model('Complaint').countDocuments();
            this.complaintId = `C-${String(count + 1).padStart(6, '0')}`;
      }
      next();
});

// Index for fast queries
complaintSchema.index({ citizen: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ assignedOfficer: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ category: 1, 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
// Queue index — fast lookup of unaccepted complaints per department
complaintSchema.index({ department: 1, isAccepted: 1, status: 1, createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
