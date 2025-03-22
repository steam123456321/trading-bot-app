'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const [accountInfo, setAccountInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
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
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // In a real application, this would fetch from the API
        // For now, we'll use mock data
        const mockAccountInfo = {
          username: 'مستخدم_تجريبي',
          demoAccount: {
            balance: 10000,
            profitLoss: 120.50,
            profitLossPercentage: 1.2,
            activeBots: 1,
            totalBots: 4
          },
          realAccount: {
            connected: false,
            exchange: null,
            apiKey: null
          }
        };
        
        const mockNotifications = [
          {
            id: 1,
            type: 'success',
            message: 'تم تشغيل بوت BTC-USD بنجاح',
            timestamp: '2025-03-21T10:30:00Z'
          },
          {
            id: 2,
            type: 'warning',
            message: 'وصل بوت ETH-USD إلى خسارة 1.5%',
            timestamp: '2025-03-21T09:15:00Z'
          },
          {
            id: 3,
            type: 'info',
            message: 'تم تحديث تحليل السوق لـ BTC-USD',
            timestamp: '2025-03-21T08:00:00Z'
          }
        ];
        
        setAccountInfo(mockAccountInfo);
        setNotifications(mockNotifications);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات لوحة التحكم');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">لوحة التحكم</h1>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
            <p className="mt-4 text-gray-700">جاري تحميل البيانات...</p>
          </div>
        ) : accountInfo ? (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">مرحباً، {accountInfo.username}!</h2>
              <p className="text-gray-600">مرحباً بك في لوحة تحكم بوت التداول التلقائي. استخدم الأدوات أدناه لإدارة البوتات ومراقبة أدائها.</p>
            </div>
            
            {/* Quick Stats */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">نظرة عامة</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">رصيد الحساب التجريبي</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">${accountInfo.demoAccount.balance.toLocaleString()}</dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">الربح/الخسارة</dt>
                    <dd className={`mt-1 text-3xl font-semibold ${accountInfo.demoAccount.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {accountInfo.demoAccount.profitLoss >= 0 ? '+' : ''}{accountInfo.demoAccount.profitLoss.toLocaleString()} (
                      {accountInfo.demoAccount.profitLossPercentage >= 0 ? '+' : ''}{accountInfo.demoAccount.profitLossPercentage.toFixed(2)}%)
                    </dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">البوتات النشطة</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{accountInfo.demoAccount.activeBots}/{accountInfo.demoAccount.totalBots}</dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">حالة الحساب الحقيقي</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {accountInfo.realAccount.connected ? 'متصل' : 'غير متصل'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Navigation */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">الأدوات الرئيسية</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/dashboard/bots" className="block">
                  <div className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة البوتات</h3>
                      <p className="text-sm text-gray-500">تشغيل وإيقاف وتكوين البوتات لأزواج العملات المختلفة</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/dashboard/analysis" className="block">
                  <div className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">تحليل السوق</h3>
                      <p className="text-sm text-gray-500">عرض تحليلات الذكاء الاصطناعي وتوقعات الأسعار</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/dashboard/reports" className="block">
                  <div className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">التقارير والإحصائيات</h3>
                      <p className="text-sm text-gray-500">عرض تقارير مفصلة عن أداء البوتات والصفقات</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/dashboard/settings" className="block">
                  <div className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">إعدادات الحساب</h3>
                      <p className="text-sm text-gray-500">إدارة إعدادات الحساب التجريبي والحقيقي</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Recent Notifications */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">آخر الإشعارات</h2>
              <div className="bg-white shadow rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <li key={notification.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                              notification.type === 'success' ? 'bg-green-100' :
                              notification.type === 'warning' ? 'bg-yellow-100' :
                              notification.type === 'error' ? 'bg-red-100' :
                              'bg-blue-100'
                            }`}>
                              <span className={`h-5 w-5 ${
                                notification.type === 'success' ? 'text-green-500' :
                                notification.type === 'warning' ? 'text-yellow-500' :
                                notification.type === 'error' ? 'text-red-500' :
                                'text-blue-500'
                              }`}>
                                {notification.type === 'success' ? '✓' :
                                 notification.type === 'warning' ? '⚠' :
                                 notification.type === 'error' ? '✗' :
                                 'ℹ'}
                              </span>
                            </div>
                            <p className="mr-3 text-sm font-medium text-gray-900">{notification.message}</p>
                          </div>
                          <div className="mr-2 flex-shrink-0 text-sm text-gray-500">
                            {formatDate(notification.timestamp)}
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
                      لا توجد إشعارات جديدة
                    </li>
                  )}
                </ul>
                {notifications.length > 0 && (
                  <div className="bg-gray-50 px-4 py-3 text-left sm:px-6">
                    <button
                      type="button"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      عرض جميع الإشعارات
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-700">لا توجد بيانات متاحة</p>
          </div>
        )}
      </main>
    </div>
  );
}
