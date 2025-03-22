import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Clear the auth token cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      path: '/',
      sameSite: 'strict',
    });

    return NextResponse.json(
      { message: 'تم تسجيل الخروج بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}
