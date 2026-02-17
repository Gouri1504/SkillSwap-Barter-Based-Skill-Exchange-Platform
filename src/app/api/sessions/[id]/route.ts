import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { SessionController } from '@/controllers/sessionController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(req);
    const session = await SessionController.getSession(params.id, String(user._id));
    return successResponse(session);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const session = await SessionController.updateSession(
      params.id,
      String(user._id),
      body
    );
    return successResponse(session, 'Session updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
