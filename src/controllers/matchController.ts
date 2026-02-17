import { connectDB } from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { createMatchSchema, updateMatchSchema } from '@/validators';
import { NotFoundError, ConflictError, BadRequestError } from '@/utils/errors';
import { calculateCompatibilityScore, getPaginationParams } from '@/utils/helpers';

export class MatchController {
  static async findMatches(userId: string, page?: number, limit?: number) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const currentUser = await User.findById(userId);
    if (!currentUser) throw new NotFoundError('User not found');

    const userSkillsOffered = currentUser.skillsOffered.map((s) => s.name);
    const userSkillsWanted = currentUser.skillsWanted.map((s) => s.name);

    if (userSkillsOffered.length === 0 || userSkillsWanted.length === 0) {
      return { matches: [], total: 0, page: p, limit: l };
    }

    const potentialMatches = await User.find({
      _id: { $ne: userId },
      isBanned: false,
      'skillsOffered.name': { $in: userSkillsWanted },
      'skillsWanted.name': { $in: userSkillsOffered },
    }).select('-firebaseUid');

    const scoredMatches = potentialMatches
      .map((match) => ({
        user: match,
        score: calculateCompatibilityScore(
          userSkillsOffered,
          userSkillsWanted,
          match.skillsOffered.map((s) => s.name),
          match.skillsWanted.map((s) => s.name)
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const total = scoredMatches.length;
    const paginatedMatches = scoredMatches.slice(skip, skip + l);

    return { matches: paginatedMatches, total, page: p, limit: l };
  }

  static async createMatch(userId: string, data: unknown) {
    const validated = createMatchSchema.parse(data);
    await connectDB();

    if (userId === validated.targetUserId) {
      throw new BadRequestError('Cannot match with yourself');
    }

    const existingMatch = await Match.findOne({
      $or: [
        { userA: userId, userB: validated.targetUserId },
        { userA: validated.targetUserId, userB: userId },
      ],
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingMatch) {
      throw new ConflictError('A match already exists between these users');
    }

    const targetUser = await User.findById(validated.targetUserId);
    if (!targetUser) throw new NotFoundError('Target user not found');

    const currentUser = await User.findById(userId);
    if (!currentUser) throw new NotFoundError('User not found');

    const score = calculateCompatibilityScore(
      currentUser.skillsOffered.map((s) => s.name),
      currentUser.skillsWanted.map((s) => s.name),
      targetUser.skillsOffered.map((s) => s.name),
      targetUser.skillsWanted.map((s) => s.name)
    );

    const match = await Match.create({
      userA: userId,
      userB: validated.targetUserId,
      skillOfferedByA: validated.skillOffered,
      skillOfferedByB: validated.skillWanted,
      compatibilityScore: score,
      initiatedBy: userId,
    });

    await Notification.create({
      user: validated.targetUserId,
      type: 'match',
      title: 'New Skill Exchange Request',
      message: `${currentUser.displayName} wants to exchange ${validated.skillOffered} for ${validated.skillWanted}`,
      link: `/matches/${match._id}`,
    });

    return match.populate(['userA', 'userB']);
  }

  static async updateMatch(matchId: string, userId: string, data: unknown) {
    const validated = updateMatchSchema.parse(data);
    await connectDB();

    const match = await Match.findById(matchId);
    if (!match) throw new NotFoundError('Match not found');

    if (match.userB.toString() !== userId) {
      throw new BadRequestError('Only the recipient can accept/reject this match');
    }

    match.status = validated.status;
    await match.save();

    const notifyUser = match.userA.toString();
    await Notification.create({
      user: notifyUser,
      type: 'match',
      title: `Match ${validated.status}`,
      message: `Your skill exchange request has been ${validated.status}`,
      link: `/matches/${match._id}`,
    });

    return match.populate(['userA', 'userB']);
  }

  static async getUserMatches(userId: string, status?: string, page?: number, limit?: number) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const filter: Record<string, unknown> = {
      $or: [{ userA: userId }, { userB: userId }],
    };

    if (status) filter.status = status;

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate('userA', 'displayName photoURL skillsOffered rating')
        .populate('userB', 'displayName photoURL skillsOffered rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      Match.countDocuments(filter),
    ]);

    return { matches, total, page: p, limit: l };
  }
}
