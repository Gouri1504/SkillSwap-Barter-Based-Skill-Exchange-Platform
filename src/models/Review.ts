import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReviewDocument extends Document {
  session: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  skillRating: number;
  communicationRating: number;
  punctualityRating: number;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 10, maxlength: 1000 },
    skillRating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, required: true, min: 1, max: 5 },
    punctualityRating: { type: Number, required: true, min: 1, max: 5 },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ reviewee: 1, createdAt: -1 });
ReviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });

const Review: Model<IReviewDocument> = mongoose.models.Review || mongoose.model<IReviewDocument>('Review', ReviewSchema);

export default Review;
