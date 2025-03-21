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
    
    // Execute Python script to get market analysis
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'market_analysis.py');
    
    const exec = promisify(require('child_process').exec);
    const { stdout, stderr } = await exec(`python3 ${scriptPath} analyze ${symbol}`);
    
    if (stderr) {
      console.error('Error executing market analysis script:', stderr);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء تحليل السوق' },
        { status: 500 }
      );
    }
    
    try {
      const analysisResults = JSON.parse(stdout);
      
      // Store analysis results in database
      await (request as any).env.DB.prepare(
        `INSERT INTO market_analyses 
         (symbol, analysis_type, analysis_data, created_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
      )
        .bind(
          symbol,
          'comprehensive',
          JSON.stringify(analysisResults)
        )
        .run();
      
      return NextResponse.json(analysisResults, { status: 200 });
      
    } catch (error) {
      console.error('Error parsing analysis results:', error);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء معالجة نتائج التحليل' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error getting market analysis:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحليل السوق' },
      { status: 500 }
    );
  }
}
