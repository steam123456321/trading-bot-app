'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AnalysisDashboard() {
  const [tradingPairs, setTradingPairs] = useState(['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD']);
  const [selectedPair, setSelectedPair] = useState('BTC-USD');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/analysis/${selectedPair}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات التحليل');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات التحليل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPair) {
      fetchAnalysis();
    }
  }, [selectedPair]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">تحليل السوق والذكاء الاصطناعي</h1>
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label htmlFor="trading-pair" className="block text-sm font-medium text-gray-700 ml-2">
              زوج التداول:
            </label>
            <select
              id="trading-pair"
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {tradingPairs.map((pair) => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'جاري التحليل...' : 'تحديث التحليل'}
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
            <p className="mt-4 text-gray-700">جاري تحليل بيانات السوق...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Overall Recommendation */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">التوصية الشاملة</h2>
              <div className={`p-4 rounded-lg ${
                analysis.overall_recommendation?.recommendation === 'buy' ? 'bg-green-50' :
                analysis.overall_recommendation?.recommendation === 'sell' ? 'bg-red-50' :
                'bg-yellow-50'
              }`}>
                <p className={`text-lg font-medium ${
                  analysis.overall_recommendation?.recommendation === 'buy' ? 'text-green-700' :
                  analysis.overall_recommendation?.recommendation === 'sell' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                  {analysis.overall_recommendation?.recommendation_text || 'لا توجد توصية متاحة'}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  مستوى الثقة: {Math.round((analysis.overall_recommendation?.confidence || 0) * 100)}%
                </p>
              </div>
            </div>
            
            {/* Price Predictions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">توقعات الأسعار</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* LSTM Predictions */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">توقعات LSTM</h3>
                  {analysis.price_predictions?.lstm?.error ? (
                    <p className="text-red-600">{analysis.price_predictions.lstm.error}</p>
                  ) : analysis.price_predictions?.lstm?.predictions ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        السعر الحالي: ${analysis.price_predictions.lstm.current_price.toLocaleString()}
                      </p>
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">التاريخ</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">السعر المتوقع</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">التغيير</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analysis.price_predictions.lstm.predictions.map((prediction, index) => {
                            const change = ((prediction.predicted_price - analysis.price_predictions.lstm.current_price) / analysis.price_predictions.lstm.current_price) * 100;
                            return (
                              <tr key={index}>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{prediction.date}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">${prediction.predicted_price.toLocaleString()}</td>
                                <td className={`whitespace-nowrap px-3 py-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">لا توجد بيانات متاحة</p>
                  )}
                </div>
                
                {/* Linear Regression Predictions */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">توقعات الانحدار الخطي</h3>
                  {analysis.price_predictions?.linear_regression?.error ? (
                    <p className="text-red-600">{analysis.price_predictions.linear_regression.error}</p>
                  ) : analysis.price_predictions?.linear_regression?.predictions ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        السعر الحالي: ${analysis.price_predictions.linear_regression.current_price.toLocaleString()}
                      </p>
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">التاريخ</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">السعر المتوقع</th>
                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">التغيير</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analysis.price_predictions.linear_regression.predictions.map((prediction, index) => {
                            const change = ((prediction.predicted_price - analysis.price_predictions.linear_regression.current_price) / analysis.price_predictions.linear_regression.current_price) * 100;
                            return (
                              <tr key={index}>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{prediction.date}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">${prediction.predicted_price.toLocaleString()}</td>
                                <td className={`whitespace-nowrap px-3 py-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">لا توجد بيانات متاحة</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sentiment Analysis */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تحليل المشاعر السوقية</h2>
              {analysis.sentiment_analysis?.error ? (
                <p className="text-red-600">{analysis.sentiment_analysis.error}</p>
              ) : analysis.sentiment_analysis ? (
                <div>
                  <p className="text-lg mb-4">{analysis.sentiment_analysis.analysis || 'لا يوجد تحليل متاح'}</p>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="text-sm font-medium text-blue-800">النظرة قصيرة المدى</h4>
                      <p className="mt-2 text-2xl font-bold text-blue-600">
                        {analysis.sentiment_analysis.technical_events?.short_term?.description || 'غير متاح'}
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-purple-50 p-4">
                      <h4 className="text-sm font-medium text-purple-800">النظرة متوسطة المدى</h4>
                      <p className="mt-2 text-2xl font-bold text-purple-600">
                        {analysis.sentiment_analysis.technical_events?.intermediate_term?.description || 'غير متاح'}
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-indigo-50 p-4">
                      <h4 className="text-sm font-medium text-indigo-800">النظرة طويلة المدى</h4>
                      <p className="mt-2 text-2xl font-bold text-indigo-600">
                        {analysis.sentiment_analysis.technical_events?.long_term?.description || 'غير متاح'}
                      </p>
                    </div>
                  </div>
                  
                  {analysis.sentiment_analysis.significant_developments?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">التطورات الهامة</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.sentiment_analysis.significant_developments.map((dev, index) => (
                          <li key={index} className="text-gray-700">
                            {dev.headline} <span className="text-gray-500 text-sm">({dev.date})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">لا توجد بيانات متاحة</p>
              )}
            </div>
            
            {/* Technical Analysis */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تحليل المؤشرات الفنية</h2>
              {analysis.technical_analysis?.error ? (
                <p className="text-red-600">{analysis.technical_analysis.error}</p>
              ) : analysis.technical_analysis ? (
                <div>
                  <div className="mb-4">
                    <div className={`inline-block px-4 py-2 rounded-full font-medium ${
                      analysis.technical_analysis.trading_signal === 'strong_buy' ? 'bg-green-100 text-green-800' :
                      analysis.technical_analysis.trading_signal === 'buy' ? 'bg-green-50 text-green-700' :
                      analysis.technical_analysis.trading_signal === 'strong_sell' ? 'bg-red-100 text-red-800' :
                      analysis.technical_analysis.trading_signal === 'sell' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {analysis.technical_analysis.trading_signal === 'strong_buy' ? 'شراء قوي' :
                       analysis.technical_analysis.trading_signal === 'buy' ? 'شراء' :
                       analysis.technical_analysis.trading_signal === 'strong_sell' ? 'بيع قوي' :
                       analysis.technical_analysis.trading_signal === 'sell' ? 'بيع' :
                       'محايد'}
                    </div>
                  </div>
                  
                  <p className="text-lg mb-4">{analysis.technical_analysis.analysis}</p>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">المتوسطات المتحركة</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">SMA 5</span>
                          <span className="font-medium">${analysis.technical_analysis.indicators?.sma?.sma_5.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">SMA 10</span>
                          <span className="font-medium">${analysis.technical_analysis.indicators?.sma?.sma_10.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">SMA 20</span>
                          <span className="font-medium">${analysis.technical_analysis.indicators?.sma?.sma_20.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
          <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>