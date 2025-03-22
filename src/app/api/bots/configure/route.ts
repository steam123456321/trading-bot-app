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
    const { 
      accountId, 
      tradingPair, 
      botType, 
      entryPercentage, 
      takeProfitPercentage, 
      stopLossPercentage, 
      maxLossMultiplier, 
      maxLossMultiplierCount, 
      maxWeeklyLossPercentage = 20 
    } = await request.json();
    
    if (!accountId || !tradingPair || !botType) {
      return NextResponse.json(
        { message: 'يرجى تقديم جميع المعلومات المطلوبة' },
        { status: 400 }
      );
    }
    
    // Verify account belongs to user
    const account = await (request as any).env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ?'
    )
      .bind(accountId, decoded.userId)
      .first();
    
    if (!account) {
      return NextResponse.json(
        { message: 'الحساب غير موجود أو غير مصرح به' },
        { status: 403 }
      );
    }
    
    // Check if bot configuration already exists
    const existingBot = await (request as any).env.DB.prepare(
      'SELECT id FROM bot_configurations WHERE account_id = ? AND trading_pair = ?'
    )
      .bind(accountId, tradingPair)
      .first();
    
    let botId;
    
    if (existingBot) {
      // Update existing bot configuration
      await (request as any).env.DB.prepare(
        `UPDATE bot_configurations 
         SET bot_type = ?, entry_percentage = ?, take_profit_percentage = ?, 
             stop_loss_percentage = ?, max_loss_multiplier = ?, max_loss_multiplier_count = ?, 
             max_weekly_loss_percentage = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
        .bind(
          botType, 
          entryPercentage, 
          takeProfitPercentage, 
          stopLossPercentage, 
          maxLossMultiplier, 
          maxLossMultiplierCount, 
          maxWeeklyLossPercentage,
          existingBot.id
        )
        .run();
      
      botId = existingBot.id;
    } else {
      // Create new bot configuration
      const result = await (request as any).env.DB.prepare(
        `INSERT INTO bot_configurations 
         (account_id, trading_pair, bot_type, is_active, entry_percentage, take_profit_percentage, 
          stop_loss_percentage, max_loss_multiplier, max_loss_multiplier_count, max_weekly_loss_percentage, 
          created_at, updated_at) 
         VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id`
      )
        .bind(
          accountId, 
          tradingPair, 
          botType, 
          entryPercentage, 
          takeProfitPercentage, 
          stopLossPercentage, 
          maxLossMultiplier, 
          maxLossMultiplierCount, 
          maxWeeklyLossPercentage
        )
        .first();
      
      if (!result) {
        return NextResponse.json(
          { message: 'فشل في إنشاء إعدادات البوت' },
          { status: 500 }
        );
      }
      
      botId = result.id;
    }
    
    return NextResponse.json({
      message: 'تم حفظ إعدادات البوت بنجاح',
      botId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error configuring bot:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إعداد البوت' },
      { status: 500 }
    );
  }
}
