'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const [accountInfo, setAccountInfo] = useState({
    demoAccount: {
      balance: 10000,
    },
    realAccount: {
      connected: false,
      exchange: '',
      apiKey: '',
      apiSecret: '',
    },
    notifications: {
      emailNotifications: true,
      profitAlerts: true,
      lossAlerts: true,
      weeklyReports: true,
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAccountSettings = async () => {
      try {
        setLoading(true);
        setError('');
        
        // In a real application, this would fetch from the API
        // For now, we'll use mock data
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching account settings:', err);
        setError(err.message || 'حدث خطأ أثناء جلب إعدادات الحساب');
        setLoading(false);
      }
    };
    
    fetchAccountSettings();
  }, []);

  const handleDemoBalanceChange = (e) => {
    setAccountInfo({
      ...accountInfo,
      demoAccount: {
        ...accountInfo.demoAccount,
        balance: parseFloat(e.target.value) || 0
      }
    });
  };

  const handleExchangeChange = (e) => {
    setAccountInfo({
      ...accountInfo,
      realAccount: {
        ...accountInfo.realAccount,
        exchange: e.target.value
      }
    });
  };

  const handleApiKeyChange = (e) => {
    setAccountInfo({
      ...accountInfo,
      realAccount: {
        ...accountInfo.realAccount,
        apiKey: e.target.value
      }
    });
  };

  const handleApiSecretChange = (e) => {
    setAccountInfo({
      ...accountInfo,
      realAccount: {
        ...accountInfo.realAccount,
        apiSecret: e.target.value
      }
    });
  };

  const handleNotificationChange = (setting) => {
    setAccountInfo({
      ...accountInfo,
      notifications: {
        ...accountInfo.notifications,
        [setting]: !accountInfo.notifications[setting]
      }
    });
  };

  const handleSaveDemoAccount = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // In a real application, this would call the API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('تم حفظ إعدادات الحساب التجريبي بنجاح');
    } catch (err) {
      console.error('Error saving demo account settings:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ إعدادات الحساب التجريبي');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectRealAccount = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // Validate inputs
      if (!accountInfo.realAccount.exchange) {
        setError('يرجى اختيار منصة التداول');
        setSaving(false);
        return;
      }
      
      if (!accountInfo.realAccount.apiKey || !accountInfo.realAccount.apiSecret) {
        setError('يرجى إدخال مفتاح API وكلمة السر');
        setSaving(false);
        return;
      }
      
      // In a real application, this would call the API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update state to show connected
      setAccountInfo({
        ...accountInfo,
        realAccount: {
          ...accountInfo.realAccount,
          connected: true
        }
      });
      
      setSuccessMessage('تم ربط الحساب الحقيقي بنجاح');
    } catch (err) {
      console.error('Error connecting real account:', err);
      setError(err.message || 'حدث خطأ أثناء ربط الحساب الحقيقي');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectRealAccount = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // In a real application, this would call the API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update state to show disconnected
      setAccountInfo({
        ...accountInfo,
        realAccount: {
          exchange: '',
          apiKey: '',
          apiSecret: '',
          connected: false
        }
      });
      
      setSuccessMessage('تم فصل الحساب الحقيقي بنجاح');
    } catch (err) {
      console.error('Error disconnecting real account:', err);
      setError(err.message || 'حدث خطأ أثناء فصل الحساب الحقيقي');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // In a real application, this would call the API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('تم حفظ إعدادات الإشعارات بنجاح');
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ إعدادات الإشعارات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">إعدادات الحساب</h1>
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              العودة إلى لوحة التحكم
            </Link>
          </div>
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
        
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="mr-3">
                <div className="text-sm text-green-700">
                  {successMessage}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-700">جاري تحميل إعدادات الحساب...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Demo Account Settings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">إعدادات الحساب التجريبي</h2>
                <p className="mt-1 text-sm text-gray-500">إدارة إعدادات الحساب التجريبي للتداول باستخدام أموال افتراضية</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="demo-balance" className="block text-sm font-medium text-gray-700">
                      رأس المال الافتراضي (بالدولار)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="demo-balance"
                        id="demo-balance"
                        value={accountInfo.demoAccount.balance}
                        onChange={handleDemoBalanceChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-left sm:px-6">
                <button
                  type="button"
                  onClick={handleSaveDemoAccount}
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
              </div>
            </div>
            
            {/* Real Account Settings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">إعدادات الحساب الحقيقي</h2>
                <p className="mt-1 text-sm text-gray-500">ربط حسابك بمنصة تداول حقيقية باستخدام API</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {accountInfo.realAccount.connected ? (
                  <div>
                    <div className="rounded-md bg-green-50 p-4 mb-6">
                      <div className="flex">
                        <div className="mr-3">
                          <div className="text-sm text-green-700">
                            تم ربط الحساب الحقيقي بنجاح مع منصة {accountInfo.realAccount.exchange}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectRealAccount}
                      disabled={saving}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                    >
                      {saving ? 'جاري الفصل...' : 'فصل الحساب الحقيقي'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="exchange" className="block text-sm font-medium text-gray-700">
                        منصة التداول
                      </label>
                      <div className="mt-1">
                        <select
                          id="exchange"
                          name="exchange"
                          value={accountInfo.realAccount.exchange}
                          onChange={handleExchangeChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">اختر منصة التداول</option>
                          <option value="binance">Binance</option>
                          <option value="bybit">Bybit</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                        مفتاح API
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="api-key"
                          id="api-key"
                          value={accountInfo.realAccount.apiKey}
                          onChange={handleApiKeyChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="api-secret" className="block text-sm font-medium text-gray-700">
                        كلمة سر API
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="api-secret"
                          id="api-secret"
                          value={accountInfo.realAccount.apiSecret}
                          onChange={handleApiSecretChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <p className="text-sm text-gray-500">
                        ملاحظة: يجب أن تكون مفاتيح API لديك مقيدة بصلاحيات القراءة والتداول فقط، ولا تسمح بعمليات السحب.
                      </p>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <button
                        type="button"
                        onClick={handleConnectRealAccount}
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                      >
                        {saving ? 'جاري الربط...' : 'ربط الحساب الحقيقي'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notification Settings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">إعدادات الإشعارات</h2>
                <p className="mt-1 text-sm text-gray-500">تخصيص إشعارات وتنبيهات البوت</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        name="email-notifications"
                        type="checkbox"
                        checked={accountInfo.notifications.emailNotifications}
                        onChange={() => handleNotificationChange('emailNotifications')}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="mr-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700">
                        إشعارات البريد الإلكتروني
                      </label>
                      <p className="text-gray-500">استلام إشعارات عبر البريد الإلكتروني</p>
          <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>