import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface RedemptionRecord {
  id: string;
  customer_name: string;
  customer_phone?: string;
  offer_title: string;
  discount_value: number;
  discount_type: 'percentage' | 'fixed'; // percentage or fixed amount
  otp_code: string;
  redeemed_at: string;
  offer_category?: string;
}

export default function VendorRedemptionStatsPage() {
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [totalCount, setTotalCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    fetchRedemptionRecords();
  }, [selectedPeriod]);

  const fetchRedemptionRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        router.push('/vendor/login');
        return;
      }

      // Mock data - Replace with real API call when available
      const mockRedemptions: RedemptionRecord[] = [
        {
          id: '1',
          customer_name: 'Rajesh Kumar',
          customer_phone: '+91 98765 43210',
          offer_title: 'Buy 1 Get 1 Free',
          discount_value: 50,
          discount_type: 'percentage',
          otp_code: 'OTP123456',
          redeemed_at: new Date().toISOString(),
          offer_category: 'Fashion',
        },
        {
          id: '2',
          customer_name: 'Priya Singh',
          customer_phone: '+91 87654 32109',
          offer_title: 'Flat ₹500 Off',
          discount_value: 500,
          discount_type: 'fixed',
          otp_code: 'OTP789012',
          redeemed_at: new Date(Date.now() - 3600000).toISOString(),
          offer_category: 'Groceries',
        },
        {
          id: '3',
          customer_name: 'Amit Patel',
          customer_phone: '+91 76543 21098',
          offer_title: '25% Off on Electronics',
          discount_value: 25,
          discount_type: 'percentage',
          otp_code: 'OTP345678',
          redeemed_at: new Date(Date.now() - 7200000).toISOString(),
          offer_category: 'Electronics',
        },
      ];

      setRedemptions(mockRedemptions);
      setTotalCount(mockRedemptions.length);
      setTotalValue(mockRedemptions.reduce((sum, r) => sum + r.discount_value, 0));
    } catch (err: any) {
      console.error('Error fetching redemptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">⏳ Loading redemption data...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Customer Redemptions - QR Offers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📊 Customer Redemptions</h1>
                <p className="text-gray-600 text-sm mt-1">View all customer redemptions and discounts given</p>
              </div>
              <button
                onClick={() => router.push('/vendor/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Period Selector */}
          <div className="mb-8">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedPeriod === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-600'
                }`}
              >
                📅 Today
              </button>
              <button
                onClick={() => setSelectedPeriod('weekly')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedPeriod === 'weekly'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-600'
                }`}
              >
                📊 Weekly
              </button>
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedPeriod === 'monthly'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-600'
                }`}
              >
                📈 Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedPeriod === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-600'
                }`}
              >
                🎯 All Time
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border-2 border-blue-300 rounded-xl p-6">
              <p className="text-gray-600 text-sm mb-2">Total Redemptions</p>
              <p className="text-4xl font-bold text-blue-600">{totalCount}</p>
            </div>
            <div className="bg-white border-2 border-green-300 rounded-xl p-6">
              <p className="text-gray-600 text-sm mb-2">Total Discounts Given</p>
              <p className="text-4xl font-bold text-green-600">₹{totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white border-2 border-purple-300 rounded-xl p-6">
              <p className="text-gray-600 text-sm mb-2">Avg. Discount Per Redemption</p>
              <p className="text-4xl font-bold text-purple-600">₹{Math.round(totalValue / totalCount) || 0}</p>
            </div>
          </div>

          {/* Redemption List */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Redemption Details</h2>
            
            {redemptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No redemptions yet for this period</p>
                <p className="text-sm text-gray-500 mt-2">Customer redemptions will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Customer Name</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Contact</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Offer / Category</th>
                      <th className="text-right py-4 px-4 font-bold text-gray-900">Discount</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">OTP Code</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Redeemed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((redemption, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-blue-50 transition">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{redemption.customer_name}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">{redemption.customer_phone || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{redemption.offer_title}</p>
                            <p className="text-xs text-gray-600">{redemption.offer_category || 'General'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-block bg-green-100 border border-green-300 rounded-lg px-3 py-1">
                            <p className="font-bold text-green-700">
                              {redemption.discount_type === 'percentage' 
                                ? `${redemption.discount_value}%` 
                                : `₹${redemption.discount_value}`
                              }
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-700">
                            {redemption.otp_code}
                          </code>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(redemption.redeemed_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => router.push('/vendor/dashboard')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              🖨️ Print Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
