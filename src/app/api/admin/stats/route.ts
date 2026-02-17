import { NextRequest } from 'next/server';
import { authenticateAdmin } from '@/middleware/auth';
import { AdminController } from '@/controllers/adminController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const stats = await AdminController.getDashboardStats();
    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}
