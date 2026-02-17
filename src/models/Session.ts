import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISessionDocument extends Document {
  match: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId;
  skill: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meetingLink: string;
  notes: string;
  summary: string;
  resources: Array<{
    title: string;
    url: string;
    type: 'link' | 'document' | 'video' | 'image' | 'other';
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
  }>;
  sessionNotes: Array<{
    content: string;
    author: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  url: { type: String, required: true },
  type: { type: String, enum: ['link', 'document', 'video', 'image', 'other'], default: 'link' },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
}, { _id: true });

const SessionNoteSchema = new Schema({
  content: { type: String, required: true, maxlength: 5000 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const SessionSchema = new Schema<ISessionDocument>(
  {
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, required: true, min: 15, max: 480, default: 60 },
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
    meetingLink: { type: String, default: '' },
    notes: { type: String, default: '', maxlength: 1000 },
    summary: { type: String, default: '', maxlength: 3000 },
    resources: { type: [ResourceSchema], default: [] },
    sessionNotes: { type: [SessionNoteSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

SessionSchema.index({ scheduledAt: 1 });
SessionSchema.index({ status: 1 });

const Session: Model<ISessionDocument> = mongoose.models.Session || mongoose.model<ISessionDocument>('Session', SessionSchema);

export default Session;
