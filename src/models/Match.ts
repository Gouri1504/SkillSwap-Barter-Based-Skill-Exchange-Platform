import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMatchDocument extends Document {
  userA: mongoose.Types.ObjectId;
  userB: mongoose.Types.ObjectId;
  skillOfferedByA: string;
  skillOfferedByB: string;
  compatibilityScore: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  initiatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatchDocument>(
  {
    userA: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userB: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillOfferedByA: { type: String, required: true },
    skillOfferedByB: { type: String, required: true },
    compatibilityScore: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

MatchSchema.index({ userA: 1, userB: 1 }, { unique: true });
MatchSchema.index({ status: 1 });

const Match: Model<IMatchDocument> = mongoose.models.Match || mongoose.model<IMatchDocument>('Match', MatchSchema);

export default Match;
