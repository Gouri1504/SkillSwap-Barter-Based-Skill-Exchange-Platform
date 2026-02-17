import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    await connectDB();

    const notifications = await Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(notifications);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    await connectDB();

    await Notification.updateMany(
      { user: user._id, read: false },
      { read: true }
    );

    return successResponse(null, 'Notifications marked as read');
  } catch (error) {
    return errorResponse(error);
  }
}
