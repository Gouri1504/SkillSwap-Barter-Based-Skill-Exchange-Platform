import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import Match from '@/models/Match';
import Report from '@/models/Report';
import Review from '@/models/Review';
import { getPaginationParams } from '@/utils/helpers';
import { NotFoundError } from '@/utils/errors';

export class AdminController {
  static async getDashboardStats() {
    await connectDB();

    const [
      totalUsers,
      activeUsers,
      totalSessions,
      completedSessions,
      totalMatches,
      pendingReports,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Match.countDocuments({ status: 'accepted' }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isBanned: true }),
    ]);

    const recentUsers = await User.find()
      .select('displayName email photoURL createdAt role isBanned')
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      completedSessions,
      totalMatches,
      pendingReports,
      bannedUsers,
      recentUsers,
    };
  }

  static async getUsers(page?: number, limit?: number, search?: string) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-firebaseUid')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      User.countDocuments(filter),
    ]);

    return { users, total, page: p, limit: l };
  }

  static async getReports(status?: string, page?: number, limit?: number) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'displayName email photoURL')
        .populate('reported', 'displayName email photoURL isBanned')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      Report.countDocuments(filter),
    ]);

    return { reports, total, page: p, limit: l };
  }

  static async updateReport(reportId: string, status: string, adminNotes?: string) {
    await connectDB();
    const report = await Report.findByIdAndUpdate(
      reportId,
      { status, adminNotes: adminNotes || '' },
      { new: true }
    ).populate(['reporter', 'reported']);

    if (!report) throw new NotFoundError('Report not found');
    return report;
  }

  static async getAnalytics() {
    await connectDB();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [topSkills, sessionsByDay, userGrowth] = await Promise.all([
      Session.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$skill', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Session.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avgRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    return {
      topSkills,
      sessionsByDay,
      userGrowth,
      averagePlatformRating: avgRating[0]?.avg || 0,
    };
  }
}
