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
    const { botId, action } = await request.json();
    
    if (!botId || !action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { message: 'يرجى تقديم معرف البوت والإجراء الصحيح (start/stop)' },
        { status: 400 }
      );
    }
    
    // Verify bot belongs to user
    const bot = await (request as any).env.DB.prepare(
      `SELECT b.id, b.account_id, b.trading_pair, b.bot_type, a.user_id 
       FROM bot_configurations b
       JOIN accounts a ON b.account_id = a.id
       WHERE b.id = ? AND a.user_id = ?`
    )
      .bind(botId, decoded.userId)
      .first();
    
    if (!bot) {
      return NextResponse.json(
        { message: 'البوت غير موجود أو غير مصرح به' },
        { status: 403 }
      );
    }
    
    // Update bot status
    const isActive = action === 'start' ? 1 : 0;
    
    await (request as any).env.DB.prepare(
      'UPDATE bot_configurations SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(isActive, botId)
      .run();
    
    // If starting the bot, create a notification
    if (action === 'start') {
      await (request as any).env.DB.prepare(
        `INSERT INTO notifications 
         (user_id, title, message, notification_type, created_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
        .bind(
          decoded.userId, 
          'تم تشغيل البوت',
          `تم تشغيل بوت ${bot.trading_pair} بنجاح`,
          'system'
        )
        .run();
    } else {
      await (request as any).env.DB.prepare(
        `INSERT INTO notifications 
         (user_id, title, message, notification_type, created_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
        .bind(
          decoded.userId, 
          'تم إيقاف البوت',
          `تم إيقاف بوت ${bot.trading_pair} بنجاح`,
          'system'
        )
        .run();
    }
    
    return NextResponse.json({
      message: action === 'start' ? 'تم تشغيل البوت بنجاح' : 'تم إيقاف البوت بنجاح',
      status: isActive ? 'running' : 'stopped'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error controlling bot:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء التحكم في البوت' },
      { status: 500 }
    );
  }
}
