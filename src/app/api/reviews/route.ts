import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { ReviewController } from '@/controllers/reviewController';
import { successResponse, paginatedResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || (String(user._id));

    const result = await ReviewController.getUserReviews(
      userId,
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 10
    );

    return paginatedResponse(result.reviews, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const review = await ReviewController.createReview(String(user._id), body);
    return successResponse(review, 'Review submitted successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
