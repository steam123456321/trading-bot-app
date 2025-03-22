import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { hash } from 'bcryptjs';

interface Env {
  DB: D1Database;
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'يرجى تقديم اسم المستخدم والبريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await (request as any).env.DB.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    )
      .bind(username, email)
      .first();

    if (existingUser) {
      return NextResponse.json(
        { message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Insert new user
    const result = await (request as any).env.DB.prepare(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING id'
    )
      .bind(username, email, hashedPassword)
      .first();

    if (!result) {
      return NextResponse.json(
        { message: 'فشل في إنشاء المستخدم' },
        { status: 500 }
      );
    }

    // Create default demo account for the user
    await (request as any).env.DB.prepare(
      'INSERT INTO accounts (user_id, account_type, initial_capital, current_balance, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    )
      .bind(result.id, 'demo', 10000, 10000, 'USD')
      .run();

    return NextResponse.json(
      { message: 'تم إنشاء المستخدم بنجاح', userId: result.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تسجيل المستخدم' },
      { status: 500 }
    );
  }
}
