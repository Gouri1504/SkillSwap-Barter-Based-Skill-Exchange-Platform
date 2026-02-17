import { NextRequest } from 'next/server';
import { authenticateAdmin } from '@/middleware/auth';
import { AdminController } from '@/controllers/adminController';
import { UserController } from '@/controllers/userController';
import { paginatedResponse, successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const { searchParams } = new URL(req.url);

    const result = await AdminController.getUsers(
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 20,
      searchParams.get('search') || undefined
    );

    return paginatedResponse(result.users, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req);
    const body = await req.json();
    const { userId, action } = body;

    let result;
    if (action === 'ban') {
      result = await UserController.banUser(userId, String(admin._id));
    } else if (action === 'unban') {
      result = await UserController.unbanUser(userId, String(admin._id));
    } else {
      return errorResponse(new Error('Invalid action'));
    }

    return successResponse(result, `User ${action}ned successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
