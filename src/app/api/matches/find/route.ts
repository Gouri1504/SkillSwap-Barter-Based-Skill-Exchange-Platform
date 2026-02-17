import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { MatchController } from '@/controllers/matchController';
import { paginatedResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const { searchParams } = new URL(req.url);

    const result = await MatchController.findMatches(
      String(user._id),
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 10
    );

    return paginatedResponse(result.matches, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}
