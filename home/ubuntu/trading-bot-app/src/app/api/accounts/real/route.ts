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
    const { exchange, apiKey, apiSecret } = await request.json();
    
    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: 'يرجى تقديم جميع المعلومات المطلوبة' },
        { status: 400 }
      );
    }
    
    // Store API keys
    await (request as any).env.DB.prepare(
      'INSERT INTO api_keys (user_id, exchange, api_key, api_secret, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    )
      .bind(decoded.userId, exchange, apiKey, apiSecret)
      .run();
    
    // Create a real account with initial balance of 0 (will be updated after connecting to exchange)
    const result = await (request as any).env.DB.prepare(
      'INSERT INTO accounts (user_id, account_type, initial_capital, current_balance, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id'
    )
      .bind(decoded.userId, 'real', 0, 0, 'USD')
      .first();
    
    if (!result) {
      return NextResponse.json(
        { message: 'فشل في إنشاء الحساب الحقيقي' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'تم إنشاء الحساب الحقيقي وربطه بمنصة التداول بنجاح',
      accountId: result.id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating real account:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء الحساب الحقيقي' },
      { status: 500 }
    );
  }
}
