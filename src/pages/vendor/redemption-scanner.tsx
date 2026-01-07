import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface RedemptionDetail {
  code: string;
  offerId: string;
  offerTitle: string;
  customerPhone: string;
  customerName: string;
  redemptionDate: string;
  status: 'verified' | 'redeemed' | 'expired';
}

export default function VendorRedemptionPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redemptionDetail, setRedemptionDetail] = useState<RedemptionDetail | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [token, setToken] = useState('');

  // Check auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedVendorId = localStorage.getItem('vendorId');

    if (!storedToken || !storedVendorId) {
      router.push('/vendor/login');
      return;
    }

    setToken(storedToken);
    setVendorId(storedVendorId);
  }, [router]);

  // Handle form submission
  const handleVerifyCode = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRedemptionDetail(null);

    if (!code || code.trim().length === 0) {
      setError('Please enter or scan a redemption code');
      return;
    }

    setLoading(true);

    try {
      // Verify redemption code
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/redemption/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            vendorId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid redemption code');
      }

      setRedemptionDetail(data.data);
      setCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark as redeemed
  const handleMarkRedeemed = async () => {
    if (!redemptionDetail) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/redemption/mark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: redemptionDetail.code,
            vendorId,
            status: 'redeemed',
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to mark as redeemed');
      }

      setSuccess(`✅ Offer redeemed successfully for ${redemptionDetail.customerName}!`);
      setRedemptionDetail(null);

      setTimeout(() => {
        setSuccess('');
        setCode('');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Redemption Scanner - Vendor</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">🔍 Scan Redemption Code</h1>
              <button
                onClick={() => {
                  localStorage.clear();
                  router.push('/');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
            <p className="text-gray-600 mt-2">Verify customer redemption codes</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Scanner Form */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Redemption Code</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">❌ {error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">{success}</p>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              {/* Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Redemption Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Scan or enter code (e.g., RDM-1234567890-ABC123)"
                  className="w-full px-4 py-3 text-lg font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use a barcode scanner or enter manually
                </p>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || code.trim().length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Verifying...' : '🔍 Verify Code'}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ How it works:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Customer scans QR code or receives redemption link</li>
                <li>• Customer registers their phone number</li>
                <li>• Customer verifies OTP sent to their phone</li>
                <li>• Customer receives unique redemption code</li>
                <li>• Scan the code here to mark offer as redeemed</li>
              </ul>
            </div>
          </div>

          {/* Redemption Detail Card */}
          {redemptionDetail && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-2 border-green-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  ✅
                </div>
                <h3 className="text-2xl font-bold text-green-600">Code Verified!</h3>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Customer Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold text-gray-900">
                      {redemptionDetail.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold text-gray-900">
                      {redemptionDetail.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(redemptionDetail.redemptionDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offer Info */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">Offer Details</h4>
                <p className="text-lg font-bold text-blue-600 mb-2">
                  {redemptionDetail.offerTitle}
                </p>
                <p className="text-sm text-gray-700">
                  Code: <span className="font-mono font-semibold">{redemptionDetail.code}</span>
                </p>
              </div>

              {/* Status Info */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Status:</strong> Ready to mark as redeemed
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMarkRedeemed}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50"
                >
                  {loading ? '⏳ Processing...' : '✅ Mark as Redeemed'}
                </button>
                <button
                  onClick={() => {
                    setRedemptionDetail(null);
                    setCode('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-semibold transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Recent Redemptions (Mock) */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Today's Redemptions</h3>
            <div className="text-center text-gray-500">
              <p>Scan codes to see redemption history</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
