import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

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
      strategyType, // 'thousand_trades' or 'ten_trades'
      days = 7 // Simulation days
    } = await request.json();
    
    if (!accountId || !tradingPair || !strategyType) {
      return NextResponse.json(
        { message: 'يرجى تقديم جميع المعلومات المطلوبة' },
        { status: 400 }
      );
    }
    
    // Verify account belongs to user
    const account = await (request as any).env.DB.prepare(
      'SELECT id, account_type, current_balance FROM accounts WHERE id = ? AND user_id = ?'
    )
      .bind(accountId, decoded.userId)
      .first();
    
    if (!account) {
      return NextResponse.json(
        { message: 'الحساب غير موجود أو غير مصرح به' },
        { status: 403 }
      );
    }
    
    // Get bot configuration
    const botConfig = await (request as any).env.DB.prepare(
      'SELECT id, bot_type, is_active FROM bot_configurations WHERE account_id = ? AND trading_pair = ?'
    )
      .bind(accountId, tradingPair)
      .first();
    
    if (!botConfig) {
      return NextResponse.json(
        { message: 'لم يتم العثور على إعدادات البوت' },
        { status: 404 }
      );
    }
    
    // Execute Python script to run simulation
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'trading_strategies.py');
    
    const exec = promisify(require('child_process').exec);
    const { stdout, stderr } = await exec(
      `python3 ${scriptPath} simulate ${strategyType} ${tradingPair} ${account.current_balance} ${days}`
    );
    
    if (stderr) {
      console.error('Error executing simulation:', stderr);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء تشغيل المحاكاة' },
        { status: 500 }
      );
    }
    
    try {
      const simulationResults = JSON.parse(stdout);
      
      // Store simulation results
      await (request as any).env.DB.prepare(
        `INSERT INTO simulations 
         (user_id, account_id, bot_id, trading_pair, strategy_type, initial_capital, final_capital, 
          total_trades, profitable_trades, losing_trades, total_profit_loss, simulation_days, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
        .bind(
          decoded.userId,
          accountId,
          botConfig.id,
          tradingPair,
          strategyType,
          simulationResults.initial_capital,
          simulationResults.final_capital,
          simulationResults.total_trades,
          simulationResults.profitable_trades,
          simulationResults.losing_trades,
          simulationResults.total_profit_loss,
          days
        )
        .run();
      
      return NextResponse.json({
        message: 'تم تشغيل المحاكاة بنجاح',
        results: simulationResults
      }, { status: 200 });
      
    } catch (error) {
      console.error('Error parsing simulation results:', error);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء معالجة نتائج المحاكاة' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error running simulation:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تشغيل المحاكاة' },
      { status: 500 }
    );
  }
}
