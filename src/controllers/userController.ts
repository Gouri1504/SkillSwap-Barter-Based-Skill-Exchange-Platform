import { connectDB } from '@/lib/mongodb';
import User, { IUserDocument } from '@/models/User';
import { updateProfileSchema } from '@/validators';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { getPaginationParams } from '@/utils/helpers';

export class UserController {
  static async getProfile(userId: string): Promise<IUserDocument> {
    await connectDB();
    const user = await User.findById(userId).select('-firebaseUid');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  static async updateProfile(userId: string, data: unknown): Promise<IUserDocument> {
    const validated = updateProfileSchema.parse(data);
    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: validated },
      { new: true, runValidators: true }
    );

    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  static async searchUsers(query: {
    skill?: string;
    category?: string;
    level?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    await connectDB();
    const { page, limit, skip } = getPaginationParams(query.page, query.limit);

    const filter: Record<string, unknown> = { isBanned: false };

    if (query.skill) {
      filter['skillsOffered.name'] = { $regex: query.skill, $options: 'i' };
    }
    if (query.category) {
      filter['skillsOffered.category'] = query.category;
    }
    if (query.level) {
      filter.experienceLevel = query.level;
    }
    if (query.location) {
      filter.location = { $regex: query.location, $options: 'i' };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-firebaseUid')
        .sort({ rating: -1, totalSessions: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  }

  static async getTopUsers(limitCount = 10) {
    await connectDB();
    return User.find({ isBanned: false, totalSessions: { $gt: 0 } })
      .select('displayName photoURL rating totalSessions skillsOffered badges')
      .sort({ rating: -1, totalSessions: -1 })
      .limit(limitCount);
  }

  static async getDashboardStats(userId: string) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const Session = (await import('@/models/Session')).default;
    const Match = (await import('@/models/Match')).default;
    const Review = (await import('@/models/Review')).default;

    const [totalSessions, completedSessions, activeExchanges, reviewsReceived] = await Promise.all([
      Session.countDocuments({ $or: [{ host: userId }, { participant: userId }] }),
      Session.countDocuments({ $or: [{ host: userId }, { participant: userId }], status: 'completed' }),
      Match.countDocuments({ $or: [{ userA: userId }, { userB: userId }], status: 'accepted' }),
      Review.find({ reviewee: userId }).sort({ createdAt: -1 }).limit(5).populate('reviewer', 'displayName photoURL'),
    ]);

    const uniqueSkillsLearned = await Session.distinct('skill', {
      participant: userId,
      status: 'completed',
    });

    return {
      totalSessions,
      completedSessions,
      activeExchanges,
      skillsLearned: uniqueSkillsLearned.length,
      averageRating: user.rating,
      recentReviews: reviewsReceived,
    };
  }

  static async banUser(userId: string, adminId: string) {
    await connectDB();
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new BadRequestError('Unauthorized action');
    }

    const user = await User.findByIdAndUpdate(userId, { isBanned: true }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  static async unbanUser(userId: string, adminId: string) {
    await connectDB();
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new BadRequestError('Unauthorized action');
    }

    const user = await User.findByIdAndUpdate(userId, { isBanned: false }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
