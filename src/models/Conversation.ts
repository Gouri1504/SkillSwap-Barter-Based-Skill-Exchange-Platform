import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversationDocument extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage: {
    content: string;
    sender: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation: Model<IConversationDocument> = mongoose.models.Conversation || mongoose.model<IConversationDocument>('Conversation', ConversationSchema);

export default Conversation;
