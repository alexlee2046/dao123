import { NextRequest, NextResponse } from 'next/server';
import { getPublicForm } from '@/lib/actions/forms';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const form = await getPublicForm(id);

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or not published' },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
