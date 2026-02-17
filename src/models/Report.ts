import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  reported: mongoose.Types.ObjectId;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reported: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, enum: ['harassment', 'spam', 'inappropriate', 'fraud', 'no-show', 'other'] },
    description: { type: String, required: true, minlength: 20, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
    adminNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ status: 1 });
ReportSchema.index({ reported: 1 });

const Report: Model<IReportDocument> = mongoose.models.Report || mongoose.model<IReportDocument>('Report', ReportSchema);

export default Report;
