import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import User, { IUserDocument } from '@/models/User';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';

export interface AuthenticatedRequest extends NextRequest {
  user?: IUserDocument;
}

export async function authenticateUser(req: NextRequest): Promise<IUserDocument> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No authentication token provided');
  }

  const token = authHeader.split('Bearer ')[1];

  if (!token) {
    throw new UnauthorizedError('Invalid authentication token');
  }

  try {
    const { adminAuth } = getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(token);

    await connectDB();

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        photoURL: decodedToken.picture || '',
      });
    }

    if (user.isBanned) {
      throw new ForbiddenError('Your account has been suspended');
    }

    user.lastActive = new Date();
    await user.save();

    return user;
  } catch (error) {
    if (error instanceof ForbiddenError) throw error;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function authenticateAdmin(req: NextRequest): Promise<IUserDocument> {
  const user = await authenticateUser(req);

  if (user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return user;
}
