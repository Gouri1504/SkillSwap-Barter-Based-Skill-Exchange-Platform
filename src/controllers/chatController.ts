import { connectDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import { sendMessageSchema } from '@/validators';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { getPaginationParams } from '@/utils/helpers';

export class ChatController {
  static async getConversations(userId: string) {
    await connectDB();
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'displayName photoURL lastActive')
      .sort({ updatedAt: -1 });

    return conversations;
  }

  static async getMessages(conversationId: string, userId: string, page?: number, limit?: number) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new NotFoundError('Conversation not found');

    const isParticipant = conversation.participants.some(
      (pid) => pid.toString() === userId
    );
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this conversation');
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'displayName photoURL')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    return { messages: messages.reverse(), total, page: p, limit: l };
  }

  static async sendMessage(userId: string, data: unknown) {
    const validated = sendMessageSchema.parse(data);
    await connectDB();

    let conversation;

    if (validated.conversationId) {
      conversation = await Conversation.findById(validated.conversationId);
      if (!conversation) throw new NotFoundError('Conversation not found');
    } else if (validated.recipientId) {
      const recipient = await User.findById(validated.recipientId);
      if (!recipient) throw new NotFoundError('Recipient not found');

      conversation = await Conversation.findOne({
        participants: { $all: [userId, validated.recipientId], $size: 2 },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userId, validated.recipientId],
        });
      }
    } else {
      throw new BadRequestError('Either conversationId or recipientId is required');
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      content: validated.content,
      messageType: validated.messageType,
      readBy: [userId],
    });

    conversation.lastMessage = {
      content: validated.content,
      sender: userId as unknown as import('mongoose').Types.ObjectId,
      createdAt: new Date(),
    };
    await conversation.save();

    const populated = await message.populate('sender', 'displayName photoURL');
    return { message: populated, conversationId: conversation._id };
  }

  static async getOrCreateConversation(userId: string, recipientId: string) {
    await connectDB();

    const recipient = await User.findById(recipientId);
    if (!recipient) throw new NotFoundError('Recipient not found');

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    }).populate('participants', 'displayName photoURL lastActive');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
      });
      conversation = await conversation.populate('participants', 'displayName photoURL lastActive');
    }

    return conversation;
  }
}
