import { NextResponse } from 'next/server';
import { AppError } from './errors';

export function successResponse<T>(data: T, message = 'Success', status = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
    { status: 200 }
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error instanceof AppError && 'errors' in error
          ? { validationErrors: (error as { errors: Record<string, string> }).errors }
          : {}),
      },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);

  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  );
}
