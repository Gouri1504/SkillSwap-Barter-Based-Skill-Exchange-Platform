import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  location: string;
  skillsOffered: Array<{
    name: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    description: string;
  }>;
  skillsWanted: Array<{
    name: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    description: string;
  }>;
  portfolioLinks: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  availability: {
    timezone: string;
    slots: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  rating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  isBanned: boolean;
  role: 'user' | 'admin';
  badges: string[];
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema({
  name: { type: String, required: true, trim: true, lowercase: true },
  category: { type: String, required: true, trim: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
  description: { type: String, default: '' },
}, { _id: false });

const TimeSlotSchema = new Schema({
  day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { _id: false });

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    photoURL: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    location: { type: String, default: '' },
    skillsOffered: { type: [SkillSchema], default: [] },
    skillsWanted: { type: [SkillSchema], default: [] },
    portfolioLinks: { type: [String], default: [] },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
    availability: {
      timezone: { type: String, default: 'UTC' },
      slots: { type: [TimeSlotSchema], default: [] },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    badges: { type: [String], default: [] },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.index({ 'skillsOffered.name': 1 });
UserSchema.index({ 'skillsWanted.name': 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ location: 1 });

const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
