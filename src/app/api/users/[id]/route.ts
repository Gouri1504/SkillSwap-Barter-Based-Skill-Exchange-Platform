import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { UserController } from '@/controllers/userController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateUser(req);
    const profile = await UserController.getProfile(params.id);
    return successResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}
