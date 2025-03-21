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

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
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
    verify(token, JWT_SECRET);
    
    const symbol = params.symbol;
    if (!symbol) {
      return NextResponse.json(
        { message: 'يرجى تحديد رمز العملة' },
        { status: 400 }
      );
    }
    
    // Get interval and range from query parameters
    const searchParams = request.nextUrl.searchParams;
    const interval = searchParams.get('interval') || '1d';
    const range = searchParams.get('range') || '1mo';
    
    // Execute Python script to get market data
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'market_data.py');
    
    const exec = promisify(require('child_process').exec);
    const { stdout, stderr } = await exec(`python3 ${scriptPath} ${symbol} ${interval} ${range}`);
    
    if (stderr) {
      console.error('Error executing market data script:', stderr);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء جلب بيانات السوق' },
        { status: 500 }
      );
    }
    
    try {
      const marketData = JSON.parse(stdout);
      return NextResponse.json(marketData, { status: 200 });
    } catch (error) {
      console.error('Error parsing market data:', error);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء معالجة بيانات السوق' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error getting market data:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب بيانات السوق' },
      { status: 500 }
    );
  }
}
