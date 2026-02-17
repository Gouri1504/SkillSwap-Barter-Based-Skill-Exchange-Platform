import { NextRequest } from 'next/server';
import { authenticateAdmin } from '@/middleware/auth';
import { AdminController } from '@/controllers/adminController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const analytics = await AdminController.getAnalytics();
    return successResponse(analytics);
  } catch (error) {
    return errorResponse(error);
  }
}
