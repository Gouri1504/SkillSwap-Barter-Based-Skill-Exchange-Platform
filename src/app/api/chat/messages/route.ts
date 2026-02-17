import { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { ChatController } from '@/controllers/chatController';
import { successResponse, paginatedResponse, errorResponse } from '@/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return errorResponse(new Error('Conversation ID is required'));
    }

    const result = await ChatController.getMessages(
      conversationId,
      String(user._id),
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 50
    );

    return paginatedResponse(result.messages, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    const body = await req.json();
    const result = await ChatController.sendMessage(String(user._id), body);
    return successResponse(result, 'Message sent successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
