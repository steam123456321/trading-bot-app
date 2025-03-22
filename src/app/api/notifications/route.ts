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
    
    // Get notifications for the user
    const notifications = await (request as any).env.DB.prepare(
      `SELECT id, title, message, notification_type, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`
    )
      .bind(decoded.userId)
      .all();
    
    return NextResponse.json({
      notifications: notifications.results
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الإشعارات' },
      { status: 500 }
    );
  }
}
