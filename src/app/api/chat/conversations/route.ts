import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { ChatController } from '@/controllers/chatController';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const conversations = await ChatController.getConversations(String(user._id));
    return successResponse(conversations);
  } catch (error) {
    return errorResponse(error);
  }
}
