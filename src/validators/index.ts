import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  category: z.string().min(1).max(50),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  description: z.string().max(200).optional(),
});

export const timeSlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).trim().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  photoURL: z.string().url().optional().or(z.literal('')),
  skillsOffered: z.array(skillSchema).max(20).optional(),
  skillsWanted: z.array(skillSchema).max(20).optional(),
  portfolioLinks: z.array(z.string().url()).max(10).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  availability: z.object({
    timezone: z.string(),
    slots: z.array(timeSlotSchema),
  }).optional(),
});

export const createMatchSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  skillOffered: z.string().min(1, 'Skill offered is required'),
  skillWanted: z.string().min(1, 'Skill wanted is required'),
});

export const updateMatchSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export const createSessionSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  skill: z.string().min(1, 'Skill is required'),
  scheduledAt: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Session must be scheduled in the future',
  }),
  duration: z.number().min(15).max(480),
  notes: z.string().max(1000).optional(),
});

export const updateSessionSchema = z.object({
  status: z.enum(['in-progress', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
  meetingLink: z.string().optional(),
  summary: z.string().max(3000).optional(),
});

export const addSessionNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const addSessionResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url('Please enter a valid URL'),
  type: z.enum(['link', 'document', 'video', 'image', 'other']).optional().default('link'),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1).max(2000),
  messageType: z.enum(['text', 'image', 'system']).optional().default('text'),
});

export const createReviewSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
  skillRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  punctualityRating: z.number().min(1).max(5),
});

export const createReportSchema = z.object({
  reportedUserId: z.string().min(1, 'Reported user ID is required'),
  reason: z.enum(['harassment', 'spam', 'inappropriate', 'fraud', 'no-show', 'other']),
  description: z.string().min(20).max(1000),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});
