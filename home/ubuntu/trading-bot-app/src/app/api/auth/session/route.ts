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
        { authenticated: false },
        { status: 401 }
      );
    }
    
    // Verify the token
    const decoded = verify(token, JWT_SECRET) as { userId: number, username: string };
    
    // Get user data
    const user = await (request as any).env.DB.prepare(
      'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?'
    )
      .bind(decoded.userId)
      .first();
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    // Get user accounts
    const accounts = await (request as any).env.DB.prepare(
      'SELECT id, account_type, initial_capital, current_balance, currency, is_active FROM accounts WHERE user_id = ?'
    )
      .bind(user.id)
      .all();
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login
      },
      accounts: accounts.results
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting user session:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
