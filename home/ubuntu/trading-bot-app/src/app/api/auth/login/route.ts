import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface Env {
  DB: D1Database;
}

// In a production environment, this would be stored securely
const JWT_SECRET = 'trading-bot-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'يرجى تقديم اسم المستخدم وكلمة المرور' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await (request as any).env.DB.prepare(
      'SELECT id, username, password_hash FROM users WHERE username = ?'
    )
      .bind(username)
      .first();

    if (!user) {
      return NextResponse.json(
        { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Update last login time
    await (request as any).env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(user.id)
      .run();

    // Generate JWT token
    const token = sign(
      { 
        userId: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie with token
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'strict',
    });

    return NextResponse.json(
      { 
        message: 'تم تسجيل الدخول بنجاح',
        user: {
          id: user.id,
          username: user.username
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
