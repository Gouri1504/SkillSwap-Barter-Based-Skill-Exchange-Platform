import { NextRequest } from 'next/server';
import { authenticateAdmin } from '@/middleware/auth';
import { AdminController } from '@/controllers/adminController';
import { paginatedResponse, successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const { searchParams } = new URL(req.url);

    const result = await AdminController.getReports(
      searchParams.get('status') || undefined,
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 20
    );

    return paginatedResponse(result.reports, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const body = await req.json();
    const { reportId, status, adminNotes } = body;

    const report = await AdminController.updateReport(reportId, status, adminNotes);
    return successResponse(report, 'Report updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
