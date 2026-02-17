import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Session from '@/models/Session';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { TRENDING_SKILLS, SKILL_CATEGORIES } from '@/utils/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const topSkills = await Session.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$skill', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    const trending = topSkills.length > 0
      ? topSkills.map((s) => ({ name: s._id, count: s.count }))
      : TRENDING_SKILLS.map((name) => ({ name, count: 0 }));

    return successResponse({
      trending,
      categories: SKILL_CATEGORIES,
      recommendations: TRENDING_SKILLS.slice(0, 10),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
