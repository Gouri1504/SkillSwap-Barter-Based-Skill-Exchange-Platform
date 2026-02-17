import { connectDB } from '@/lib/mongodb';
import Session from '@/models/Session';
import Match from '@/models/Match';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { createSessionSchema, updateSessionSchema, addSessionNoteSchema, addSessionResourceSchema } from '@/validators';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { generateMeetingLink, getPaginationParams } from '@/utils/helpers';

export class SessionController {
  static async createSession(userId: string, data: unknown) {
    const validated = createSessionSchema.parse(data);
    await connectDB();

    const match = await Match.findById(validated.matchId);
    if (!match) throw new NotFoundError('Match not found');
    if (match.status !== 'accepted') {
      throw new BadRequestError('Match must be accepted before booking a session');
    }

    const isParticipant =
      match.userA.toString() === userId || match.userB.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this match');
    }

    const participantId =
      match.userA.toString() === userId
        ? match.userB.toString()
        : match.userA.toString();

    const session = await Session.create({
      match: validated.matchId,
      host: userId,
      participant: participantId,
      skill: validated.skill,
      scheduledAt: new Date(validated.scheduledAt),
      duration: validated.duration,
      meetingLink: generateMeetingLink(),
      notes: validated.notes || '',
    });

    const host = await User.findById(userId);
    await Notification.create({
      user: participantId,
      type: 'session',
      title: 'New Session Booked',
      message: `${host?.displayName} has scheduled a ${validated.skill} session with you`,
      link: `/sessions/${session._id}`,
    });

    return session.populate(['host', 'participant', 'match']);
  }

  static async updateSession(sessionId: string, userId: string, data: unknown) {
    const validated = updateSessionSchema.parse(data);
    await connectDB();

    const session = await Session.findById(sessionId);
    if (!session) throw new NotFoundError('Session not found');

    const isParticipant =
      session.host.toString() === userId ||
      session.participant.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this session');
    }

    if (validated.status === 'completed') {
      await User.updateMany(
        { _id: { $in: [session.host, session.participant] } },
        { $inc: { totalSessions: 1 } }
      );
    }

    if (validated.summary !== undefined) {
      session.summary = validated.summary;
    }

    if (validated.status) session.status = validated.status;
    if (validated.notes !== undefined) session.notes = validated.notes;
    if (validated.meetingLink !== undefined) session.meetingLink = validated.meetingLink;

    await session.save();

    const notifyUser =
      session.host.toString() === userId
        ? session.participant.toString()
        : session.host.toString();

    if (validated.status) {
      await Notification.create({
        user: notifyUser,
        type: 'session',
        title: `Session ${validated.status}`,
        message: `Your session has been marked as ${validated.status}`,
        link: `/sessions/${session._id}`,
      });
    }

    return session.populate(['host', 'participant', 'match']);
  }

  static async addNote(sessionId: string, userId: string, data: unknown) {
    const validated = addSessionNoteSchema.parse(data);
    await connectDB();

    const session = await Session.findById(sessionId);
    if (!session) throw new NotFoundError('Session not found');

    const isParticipant =
      session.host.toString() === userId ||
      session.participant.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this session');
    }

    session.sessionNotes.push({
      content: validated.content,
      author: userId as unknown as import('mongoose').Types.ObjectId,
      createdAt: new Date(),
    });

    await session.save();

    return session.populate([
      'host',
      'participant',
      { path: 'sessionNotes.author', select: 'displayName photoURL' },
      { path: 'resources.addedBy', select: 'displayName photoURL' },
    ]);
  }

  static async addResource(sessionId: string, userId: string, data: unknown) {
    const validated = addSessionResourceSchema.parse(data);
    await connectDB();

    const session = await Session.findById(sessionId);
    if (!session) throw new NotFoundError('Session not found');

    const isParticipant =
      session.host.toString() === userId ||
      session.participant.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this session');
    }

    session.resources.push({
      title: validated.title,
      url: validated.url,
      type: validated.type || 'link',
      addedBy: userId as unknown as import('mongoose').Types.ObjectId,
      addedAt: new Date(),
    });

    await session.save();

    return session.populate([
      'host',
      'participant',
      { path: 'sessionNotes.author', select: 'displayName photoURL' },
      { path: 'resources.addedBy', select: 'displayName photoURL' },
    ]);
  }

  static async updateSummary(sessionId: string, userId: string, summary: string) {
    await connectDB();

    const session = await Session.findById(sessionId);
    if (!session) throw new NotFoundError('Session not found');

    const isParticipant =
      session.host.toString() === userId ||
      session.participant.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this session');
    }

    session.summary = summary;
    await session.save();

    return session.populate(['host', 'participant']);
  }

  static async getUserSessions(userId: string, status?: string, page?: number, limit?: number) {
    await connectDB();
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);

    const filter: Record<string, unknown> = {
      $or: [{ host: userId }, { participant: userId }],
    };

    if (status) filter.status = status;

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .populate('host', 'displayName photoURL')
        .populate('participant', 'displayName photoURL')
        .populate('match')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(l),
      Session.countDocuments(filter),
    ]);

    return { sessions, total, page: p, limit: l };
  }

  static async getSession(sessionId: string, userId: string) {
    await connectDB();
    const session = await Session.findById(sessionId)
      .populate('host', 'displayName photoURL email')
      .populate('participant', 'displayName photoURL email')
      .populate('match')
      .populate('sessionNotes.author', 'displayName photoURL')
      .populate('resources.addedBy', 'displayName photoURL');

    if (!session) throw new NotFoundError('Session not found');

    const isParticipant =
      session.host._id.toString() === userId ||
      session.participant._id.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestError('You are not part of this session');
    }

    return session;
  }
}
