import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { MatchController } from '@/controllers/matchController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const match = await MatchController.updateMatch(
      params.id,
      String(user._id),
      body
    );
    return successResponse(match, 'Match updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
