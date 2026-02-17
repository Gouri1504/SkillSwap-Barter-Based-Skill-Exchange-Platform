import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Session from '@/models/Session';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { createReviewSchema } from '@/validators';
import { NotFoundError, BadRequestError, ConflictError } from '@/utils/errors';
import { getPaginationParams } from '@/utils/helpers';

export class ReviewController {
  static async createReview(userId: string, data: unknown) {
    const validated = createReviewSchema.parse(data);
    await connectDB();

    const session = await Session.findById(validated.sessionId);
    if (!session) throw new NotFoundError('Session not found');
    if (session.status !== 'completed') {
      throw new BadRequestError('Can only review completed sessions');
    }

    const isParticipant =
      session.host.toString() === userId ||
      session.participant.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this session');
    }

    const revieweeId =
      session.host.toString() === userId
        ? session.participant.toString()
        : session.host.toString();

    const existingReview = await Review.findOne({
      session: validated.sessionId,
      reviewer: userId,
    });
    if (existingReview) {
      throw new ConflictError('You have already reviewed this session');
    }

    const review = await Review.create({
      session: validated.sessionId,
      reviewer: userId,
      reviewee: revieweeId,
      rating: validated.rating,
      comment: validated.comment,
      skillRating: validated.skillRating,
      communicationRating: validated.communicationRating,
      punctualityRating: validated.punctualityRating,
    });

    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
    });

    const reviewer = await User.findById(userId);
    await Notification.create({
      user: revieweeId,
      type: 'review',
      title: 'New Review Received',
      message: `${reviewer?.displayName} left you a ${validated.rating}-star review`,
      link: `/profile/${revieweeId}`,
    });

    return review.populate(['reviewer', 'reviewee']);
  }

  static async getUserReviews(userId: string, page?: number, limit?: number) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const [reviews, total] = await Promise.all([
      Review.find({ reviewee: userId })
        .populate('reviewer', 'displayName photoURL')
        .populate('session', 'skill scheduledAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      Review.countDocuments({ reviewee: userId }),
    ]);

    return { reviews, total, page: p, limit: l };
  }
}
