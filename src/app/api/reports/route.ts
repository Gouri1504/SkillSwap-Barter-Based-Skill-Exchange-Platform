import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import { createReportSchema } from '@/validators';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const validated = createReportSchema.parse(body);

    await connectDB();

    const report = await Report.create({
      reporter: user._id,
      reported: validated.reportedUserId,
      reason: validated.reason,
      description: validated.description,
    });

    return successResponse(report, 'Report submitted successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
