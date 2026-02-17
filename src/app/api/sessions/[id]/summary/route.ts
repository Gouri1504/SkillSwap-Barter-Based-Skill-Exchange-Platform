import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { SessionController } from '@/controllers/sessionController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const session = await SessionController.updateSummary(
      params.id,
      String(user._id),
      body.summary
    );
    return successResponse(session, 'Summary updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
