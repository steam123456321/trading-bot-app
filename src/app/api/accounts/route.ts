import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface Env {
  DB: D1Database;
}

// In a production environment, this would be stored securely
const JWT_SECRET = 'trading-bot-secret-key';

export async function GET(request: NextRequest) {
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
    
    // Get user accounts
    const accounts = await (request as any).env.DB.prepare(
      'SELECT id, account_type, initial_capital, current_balance, currency, is_active FROM accounts WHERE user_id = ?'
    )
      .bind(decoded.userId)
      .all();
    
    return NextResponse.json({
      accounts: accounts.results
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting accounts:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الحسابات' },
      { status: 500 }
    );
  }
}
