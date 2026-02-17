import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { UserController } from '@/controllers/userController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const profile = await UserController.getProfile(String(user._id));
    return successResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const updated = await UserController.updateProfile(String(user._id), body);
    return successResponse(updated, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
