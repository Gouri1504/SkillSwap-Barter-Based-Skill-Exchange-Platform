import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    return successResponse(user, 'User fetched successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
