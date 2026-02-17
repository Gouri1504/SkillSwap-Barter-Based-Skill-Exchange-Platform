import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { UserController } from '@/controllers/userController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const stats = await UserController.getDashboardStats(String(user._id));
    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}
