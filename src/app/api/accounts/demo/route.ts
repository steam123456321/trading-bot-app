import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface Env {
  DB: D1Database;
}

// In a production environment, this would be stored securely
const JWT_SECRET = 'trading-bot-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح به' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const decoded = verify(token, JWT_SECRET) as { userId: number, username: string };
    
    // Get request body
    const { initialCapital, currency = 'USD' } = await request.json();
    
    if (!initialCapital || initialCapital <= 0) {
      return NextResponse.json(
        { message: 'يرجى تقديم رأس مال صالح' },
        { status: 400 }
      );
    }
    
    // Create a new demo account
    const result = await (request as any).env.DB.prepare(
      'INSERT INTO accounts (user_id, account_type, initial_capital, current_balance, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id'
    )
      .bind(decoded.userId, 'demo', initialCapital, initialCapital, currency)
      .first();
    
    if (!result) {
      return NextResponse.json(
        { message: 'فشل في إنشاء الحساب التجريبي' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'تم إنشاء الحساب التجريبي بنجاح',
      accountId: result.id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating demo account:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء الحساب التجريبي' },
      { status: 500 }
    );
  }
}
