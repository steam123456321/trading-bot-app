'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedBot, setSelectedBot] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // In a real application, this would fetch from the API
        // For now, we'll use mock data
        const mockReportData = {
          summary: {
            totalTrades: 455,
            successfulTrades: 272,
            failedTrades: 183,
            successRate: 59.78,
            initialCapital: 10000,
            currentBalance: 10120.50,
            totalProfit: 120.50,
            profitPercentage: 1.2,
          },
          bots: [
            {
              id: 1,
              tradingPair: 'BTC-USD',
              strategyType: 'thousand_trades',
              totalTrades: 450,
              successfulTrades: 270,
              failedTrades: 180,
              successRate: 60,
              profit: 120.50,
              profitPercentage: 1.2,
            },
            {
              id: 2,
              tradingPair: 'ETH-USD',
              strategyType: 'ten_trades',
              totalTrades: 5,
              successfulTrades: 2,
              failedTrades: 3,
              successRate: 40,
              profit: -75.25,
              profitPercentage: -1.5,
            },
          ],
          tradeHistory: [
            {
              id: 1,
              botId: 1,
              tradingPair: 'BTC-USD',
              entryPrice: 63250.75,
              exitPrice: 63365.42,
              amount: 0.001,
              profit: 0.11,
              profitPercentage: 0.18,
              timestamp: '2025-03-21T10:15:00Z',
              status: 'success',
            },
            {
              id: 2,
              botId: 1,
              tradingPair: 'BTC-USD',
              entryPrice: 63365.42,
              exitPrice: 63308.19,
              amount: 0.001,
              profit: -0.06,
              profitPercentage: -0.09,
              timestamp: '2025-03-21T10:30:00Z',
              status: 'failed',
            },
            {
              id: 3,
              botId: 2,
              tradingPair: 'ETH-USD',
              entryPrice: 3450.25,
              exitPrice: 3765.80,
              amount: 0.01,
              profit: 3.16,
              profitPercentage: 9.15,
              timestamp: '2025-03-21T09:00:00Z',
              status: 'success',
            },
          ],
          dailyPerformance: [
            { date: '2025-03-15', profit: 15.20, trades: 65, successRate: 58 },
            { date: '2025-03-16', profit: 18.75, trades: 64, successRate: 61 },
            { date: '2025-03-17', profit: -8.30, trades: 65, successRate: 52 },
            { date: '2025-03-18', profit: 22.40, trades: 65, successRate: 63 },
            { date: '2025-03-19', profit: 30.15, trades: 65, successRate: 66 },
            { date: '2025-03-20', profit: 25.80, trades: 65, successRate: 62 },
            { date: '2025-03-21', profit: 16.50, trades: 66, successRate: 59 },
          ],
        };
        
        setReportData(mockReportData);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات التقارير');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [selectedPeriod, selectedBot]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStrategyName = (strategyType) => {
    return strategyType === 'thousand_trades' ? 'صفقة الألف نقطة' : 'بوت العشرة عين';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">التقارير والإحصائيات</h1>
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <label htmlFor="period" className="block text-sm font-medium text-gray-700">
              الفترة:
            </label>
            <select
              id="period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="day">اليوم</option>
              <option value="week">الأسبوع</option>
              <option value="month">الشهر</option>
              <option value="year">السنة</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <label htmlFor="bot" className="block text-sm font-medium text-gray-700">
              البوت:
            </label>
            <select
              id="bot"
              value={selectedBot}
              onChange={(e) => setSelectedBot(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">جميع البوتات</option>
              <option value="1">BTC-USD</option>
              <option value="2">ETH-USD</option>
              <option value="3">BNB-USD</option>
              <option value="4">SOL-USD</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            تحديث التقرير
          </button>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="mr-3">
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-700">جاري تحميل بيانات التقارير...</p>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ملخص الأداء</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">إجمالي الصفقات</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.summary.totalTrades}</dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">نسبة النجاح</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.summary.successRate}%</dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">الرصيد الحالي</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">${reportData.summary.currentBalance.toLocaleString()}</dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">الربح/الخسارة</dt>
                    <dd className={`mt-1 text-3xl font-semibold ${reportData.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.summary.totalProfit >= 0 ? '+' : ''}{reportData.summary.totalProfit.toLocaleString()} (
                      {reportData.summary.profitPercentage >= 0 ? '+' : ''}{reportData.summary.profitPercentage.toFixed(2)}%)
                    </dd>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Daily Performance Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الأداء اليومي</h2>
              <div className="h-64 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                {/* In a real application, this would be a chart */}
                <div className="text-center">
                  <p className="text-gray-500">سيتم عرض رسم بياني للأداء اليومي هنا</p>
                  <p className="text-sm text-gray-400 mt-2">يعرض الربح/الخسارة ونسبة النجاح لكل يوم</p>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">التاريخ</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الصفقات</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">نسبة النجاح</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الربح/الخسارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.dailyPerformance.map((day, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{day.date}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{day.trades}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{day.successRate}%</td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {day.profit >= 0 ? '+' : ''}{day.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Bot Performance */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">أداء البوتات</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">البوت</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الاستراتيجية</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الصفقات</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">نسبة النجاح</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الربح/الخسارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.bots.map((bot) => (
                      <tr key={bot.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{bot.tradingPair}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{getStrategyName(bot.strategyType)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {bot.successfulTrades}/{bot.totalTrades}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{bot.successRate}%</td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm ${bot.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {bot.profit >= 0 ? '+' : ''}{bot.profit.toLocaleString()} (
                          {bot.profitPercentage >= 0 ? '+' : ''}{bot.profitPercentage.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recent Trades */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">آخر الصفقات</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الزوج</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">سعر الدخول</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">سعر الخروج</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الكمية</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الربح/الخسارة</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">التاريخ</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.tradeHistory.map((trade) => (
                      <tr key={trade.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{trade.tradingPair}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm tex<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>