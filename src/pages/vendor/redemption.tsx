import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function VendorRedemptionPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [redeemed, setRedeemed] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        router.push('/vendor/login');
        return;
      }

      // Verify OTP and get customer & offer details
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/verify-otp-for-vendor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            otp,
            vendorId,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log('✅ OTP verified:', data);
        setResult(data.data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Invalid OTP or OTP expired');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemOffer = async () => {
    if (!result?.redemptionId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      // Mark as redeemed
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            redemptionId: result.redemptionId,
            vendorId,
          }),
        }
      );

      if (res.ok) {
        setRedeemed(true);
        setTimeout(() => {
          setOtp('');
          setResult(null);
          setRedeemed(false);
        }, 3000);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to redeem offer');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Redeem Offer - Vendor</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">🛍️ Redeem Offer</h1>
            <p className="text-gray-600 mt-2">Enter customer OTP to validate and redeem offer</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter OTP</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  ❌ {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer OTP (6 digits)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 text-center text-3xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    disabled={result !== null}
                  />
                  <p className="text-xs text-gray-500 mt-2">Customer will share this OTP with you</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || result !== null || otp.length !== 6}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
                </button>
              </form>

              {/* Instructions */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-2">📋 How it works:</h3>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>1. Customer gives you their 6-digit OTP</li>
                  <li>2. Enter the OTP above</li>
                  <li>3. Customer details & offer will appear on the right</li>
                  <li>4. Click "Redeem" to confirm and apply the offer</li>
                </ol>
              </div>
            </div>

            {/* Right: Customer & Offer Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {result ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">✅ OTP Valid!</h2>

                  {/* Customer Details */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-300">
                    <p className="text-sm text-gray-600 mb-1">👤 Customer</p>
                    <p className="text-2xl font-bold text-blue-600">{result.customerName}</p>
                    <p className="text-sm text-gray-700 mt-1">📱 {result.phoneNumber}</p>
                  </div>

                  {/* Offer Details */}
                  <div className="bg-green-50 rounded-lg p-4 mb-4 border-2 border-green-300">
                    <p className="text-sm text-gray-600 mb-1">🎁 Offer</p>
                    <p className="text-2xl font-bold text-green-600">{result.offerTitle}</p>
                    <p className="text-sm text-gray-700 mt-2">{result.offerDescription}</p>
                    {result.offerExpiry && (
                      <p className="text-xs text-gray-600 mt-2">
                        Valid until: {new Date(result.offerExpiry).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6 border-2 border-yellow-300">
                    <p className="text-sm font-semibold text-gray-900">Status:</p>
                    <p className="text-lg text-yellow-600 font-bold mt-1">⏳ Ready to Redeem</p>
                    <p className="text-xs text-gray-600 mt-2">Click button below to confirm and apply offer</p>
                  </div>

                  {/* Redeem Button */}
                  <button
                    onClick={handleRedeemOffer}
                    disabled={loading || redeemed}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {redeemed ? '✅ Offer Redeemed!' : '🎉 Confirm & Redeem'}
                  </button>

                  {/* Success Message */}
                  {redeemed && (
                    <div className="mt-4 p-4 bg-green-100 border-2 border-green-600 rounded-lg text-center">
                      <p className="text-green-700 font-bold">✅ Offer successfully redeemed!</p>
                    </div>
                  )}

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setOtp('');
                      setResult(null);
                      setError('');
                    }}
                    className="w-full mt-3 bg-gray-300 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    ← Check Another OTP
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600">Enter OTP to view customer details and offer information</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
