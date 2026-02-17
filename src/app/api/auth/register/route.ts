import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { ConflictError } from '@/utils/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(new Error('No token provided'));
    }

    const token = authHeader.split('Bearer ')[1];
    const { adminAuth } = getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(token);

    await connectDB();

    const existingUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const body = await req.json();

    const user = await User.create({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || body.email,
      displayName: body.displayName || decodedToken.name || 'User',
      photoURL: decodedToken.picture || body.photoURL || '',
      bio: body.bio || '',
      skillsOffered: body.skillsOffered || [],
      skillsWanted: body.skillsWanted || [],
    });

    return successResponse(user, 'User registered successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
