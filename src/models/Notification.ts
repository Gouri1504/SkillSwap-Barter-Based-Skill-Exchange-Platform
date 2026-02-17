import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: 'match' | 'session' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['match', 'session', 'message', 'review', 'system'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification: Model<INotificationDocument> = mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default Notification;
