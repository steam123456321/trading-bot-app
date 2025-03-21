'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function BotsDashboard() {
  const [tradingPairs, setTradingPairs] = useState(['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD']);
  const [bots, setBots] = useState([]);
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
    const fetchBots = async () => {
      try {
        setLoading(true);
        setError('');
        
        // In a real application, this would fetch from the API
        // For now, we'll use mock data
        const mockBots = [
          {
            id: 1,
            tradingPair: 'BTC-USD',
            strategyType: 'thousand_trades',
            isActive: true,
            accountType: 'demo',
            currentBalance: 10000,
            profitLoss: 120.50,
            profitLossPercentage: 1.2,
            totalTrades: 450,
            successfulTrades: 270,
            lastUpdated: '2025-03-21T10:30:00Z'
          },
          {
            id: 2,
            tradingPair: 'ETH-USD',
            strategyType: 'ten_trades',
            isActive: false,
            accountType: 'demo',
            currentBalance: 5000,
            profitLoss: -75.25,
            profitLossPercentage: -1.5,
            totalTrades: 5,
            successfulTrades: 2,
            lastUpdated: '2025-03-21T09:15:00Z'
          },
          {
            id: 3,
            tradingPair: 'BNB-USD',
            strategyType: 'thousand_trades',
            isActive: false,
            accountType: 'demo',
            currentBalance: 7500,
            profitLoss: 0,
            profitLossPercentage: 0,
            totalTrades: 0,
            successfulTrades: 0,
            lastUpdated: '2025-03-21T08:00:00Z'
          },
          {
            id: 4,
            tradingPair: 'SOL-USD',
            strategyType: 'ten_trades',
            isActive: false,
            accountType: 'demo',
            currentBalance: 3000,
            profitLoss: 0,
            profitLossPercentage: 0,
            totalTrades: 0,
            successfulTrades: 0,
            lastUpdated: '2025-03-21T08:00:00Z'
          }
        ];
        
        setBots(mockBots);
      } catch (err) {
        console.error('Error fetching bots:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات البوتات');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBots();
  }, []);

  const toggleBotStatus = async (botId) => {
    try {
      setError('');
      
      // Find the bot to toggle
      const botIndex = bots.findIndex(bot => bot.id === botId);
      if (botIndex === -1) return;
      
      // In a real application, this would call the API
      // For now, we'll just update the local state
      const updatedBots = [...bots];
      updatedBots[botIndex] = {
        ...updatedBots[botIndex],
        isActive: !updatedBots[botIndex].isActive
      };
      
      setBots(updatedBots);
      
      // Show success message
      alert(updatedBots[botIndex].isActive ? 
        `تم تشغيل البوت ${updatedBots[botIndex].tradingPair} بنجاح` : 
        `تم إيقاف البوت ${updatedBots[botIndex].tradingPair} بنجاح`);
      
    } catch (err) {
      console.error('Error toggling bot status:', err);
      setError(err.message || 'حدث خطأ أثناء تغيير حالة البوت');
    }
  };

  const configureBotStrategy = (botId) => {
    // In a real application, this would navigate to a configuration page
    // For now, we'll just show an alert
    alert(`سيتم فتح صفحة إعدادات البوت ${botId} قريباً`);
  };

  const createNewBot = () => {
    // In a real application, this would navigate to a new bot creation page
    // For now, we'll just show an alert
    alert('سيتم فتح صفحة إنشاء بوت جديد قريباً');
  };

  const getStrategyName = (strategyType) => {
    return strategyType === 'thousand_trades' ? 'صفقة الألف نقطة' : 'بوت العشرة عين';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">إدارة البوتات</h1>
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">البوتات النشطة</h2>
          <button
            onClick={createNewBot}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            إنشاء بوت جديد
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
            <p className="mt-4 text-gray-700">جاري تحميل البوتات...</p>
          </div>
        ) : bots.length > 0 ? (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 sm:pl-6">زوج التداول</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الاستراتيجية</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">نوع الحساب</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الرصيد الحالي</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الربح/الخسارة</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الصفقات</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الحالة</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {bots.map((bot) => (
                  <tr key={bot.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{bot.tradingPair}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{getStrategyName(bot.strategyType)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {bot.accountType === 'demo' ? 'تجريبي' : 'حقيقي'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${bot.currentBalance.toLocaleString()}</td>
                    <td className={`whitespace-nowrap px-3 py-4 text-sm ${bot.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {bot.profitLoss >= 0 ? '+' : ''}{bot.profitLoss.toLocaleString()} (
                      {bot.profitLossPercentage >= 0 ? '+' : ''}{bot.profitLossPercentage.toFixed(2)}%)
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {bot.successfulTrades}/{bot.totalTrades} ({bot.totalTrades > 0 ? ((bot.successfulTrades / bot.totalTrades) * 100).toFixed(0) : 0}%)
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        bot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bot.isActive ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex space-x-3 rtl:space-x-reverse">
                        <button
                          onClick={() => toggleBotStatus(bot.id)}
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            bot.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {bot.isActive ? 'إيقاف' : 'تشغيل'}
                        </button>
                        <button
                          onClick={() => configureBotStrategy(bot.id)}
                          className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          إعدادات
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-700 mb-4">لا توجد بوتات نشطة حالياً</p>
            <button
              onClick={createNewBot}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              إنشاء بوت جديد
            </button>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات سريعة</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">إجمالي البوتات</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{bots.length}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">البوتات النشطة</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{bots.filter(bot => bot.isActive).length}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">إجمالي الصفقات</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{bots.reduce((total, bot) => total + bot.totalTrades, 0)}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">نسبة النجاح</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {bots.reduce((total, bot) => total + bot.totalTrades, 0) > 0 ? 
                    ((bots.reduce((total, bot) => total + bot.successfulTrades, 0) / bots.reduce((total, bot) => total + bot.totalTrades, 0)) * 100).toFixed(0) : 0}%
                </dd>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
