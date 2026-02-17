import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { SessionController } from '@/controllers/sessionController';
import { successResponse, paginatedResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const { searchParams } = new URL(req.url);

    const result = await SessionController.getUserSessions(
      String(user._id),
      searchParams.get('status') || undefined,
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 10
    );

    return paginatedResponse(result.sessions, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const session = await SessionController.createSession(String(user._id), body);
    return successResponse(session, 'Session created successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
