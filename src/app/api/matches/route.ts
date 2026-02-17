import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { MatchController } from '@/controllers/matchController';
import { successResponse, paginatedResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const { searchParams } = new URL(req.url);

    const result = await MatchController.getUserMatches(
      String(user._id),
      searchParams.get('status') || undefined,
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 10
    );

    return paginatedResponse(result.matches, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const match = await MatchController.createMatch(String(user._id), body);
    return successResponse(match, 'Match request sent successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
