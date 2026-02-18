import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { UserController } from '@/controllers/userController';
import { paginatedResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const { searchParams } = new URL(req.url);

    const result = await UserController.searchUsers({
      q: searchParams.get('q') || undefined,
      skill: searchParams.get('skill') || undefined,
      category: searchParams.get('category') || undefined,
      level: searchParams.get('level') || undefined,
      location: searchParams.get('location') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      excludeUserId: String(user._id),
    });

    return paginatedResponse(result.users, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}
