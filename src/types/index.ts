export interface IUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  skillsOffered: ISkill[];
  skillsWanted: ISkill[];
  portfolioLinks: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  availability: IAvailability;
  rating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  isBanned: boolean;
  role: 'user' | 'admin';
  badges: string[];
  joinedAt: Date;
  lastActive: Date;
}

export interface ISkill {
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description?: string;
}

export interface IAvailability {
  timezone: string;
  slots: ITimeSlot[];
}

export interface ITimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
}

export interface IMatch {
  _id: string;
  userA: string | IUser;
  userB: string | IUser;
  skillOfferedByA: string;
  skillOfferedByB: string;
  compatibilityScore: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  initiatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  _id: string;
  match: string | IMatch;
  host: string | IUser;
  participant: string | IUser;
  skill: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  conversation: string;
  sender: string | IUser;
  content: string;
  messageType: 'text' | 'image' | 'system';
  readBy: string[];
  createdAt: Date;
}

export interface IConversation {
  _id: string;
  participants: string[] | IUser[];
  lastMessage?: IMessage;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: string;
  session: string | ISession;
  reviewer: string | IUser;
  reviewee: string | IUser;
  rating: number;
  comment: string;
  skillRating: number;
  communicationRating: number;
  punctualityRating: number;
  createdAt: Date;
}

export interface IReport {
  _id: string;
  reporter: string | IUser;
  reported: string | IUser;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: string;
  user: string | IUser;
  type: 'match' | 'session' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MatchQuery {
  userId: string;
  skillOffered?: string;
  skillWanted?: string;
  experienceLevel?: string;
  page?: number;
  limit?: number;
}

export interface SessionQuery {
  userId: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  activeExchanges: number;
  skillsLearned: number;
  averageRating: number;
  recentActivity: Array<{
    type: string;
    description: string;
    date: Date;
  }>;
}
