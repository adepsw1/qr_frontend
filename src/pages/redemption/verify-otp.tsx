import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Offer {
  id: string;
  title: string;
  description: string;
}

export default function VerifyOTPPage() {
  const router = useRouter();
  const { vendorId, offerId, phone } = router.query;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<Offer | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Fetch offer details
  useEffect(() => {
    if (!offerId) return;

    const fetchOffer = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}`
        );
        const data = await res.json();

        if (res.ok) {
          setOffer(data.data);
          setOtpSent(true);
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendOTP = async () => {
    if (!phone || resendTimer > 0) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customer/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        }
      );

      if (res.ok) {
        alert('✅ OTP sent again to your phone');
        setResendTimer(60);
      } else {
        alert('❌ Failed to resend OTP');
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
    }
  };

  const handleVerifyOTP = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            otp: otp.trim(),
            vendorId,
            offerId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid OTP. Please try again.');
      }

      // Get redemption code from response or generate one
      const redemptionCode = data.data?.redemptionCode || data.redemptionCode || 
        `RDM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Store redemption details
      const redemptionData = {
        vendorId,
        offerId,
        phoneNumber: phone,
        code: redemptionCode,
        verified: true,
        verifiedAt: new Date().toISOString(),
      };

      localStorage.setItem('redemptionCode', redemptionCode);
      localStorage.setItem('redemptionData', JSON.stringify(redemptionData));

      // Redirect to redemption success page
      router.push(
        `/redemption/success?code=${redemptionCode}&vendorId=${vendorId}&offerId=${offerId}`
      );
    } catch (err: any) {
      setError(err.message);
      console.error('OTP Verification Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">⏳ Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Verify OTP - Claim Offer</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📲 Verify OTP</h1>
            <p className="text-gray-600">Enter the code sent to your phone</p>
          </div>

          {/* Offer Info */}
          {offer && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Offer to Claim</p>
                <p className="text-lg font-bold text-green-600">{offer.title}</p>
                <p className="text-sm text-gray-700 mt-2">{offer.description}</p>
              </div>

              {/* Progress Steps */}
              <div className="mt-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      ✓
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Registered</p>
                  </div>
                  <div className="flex-1 h-1 bg-green-600 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Verify OTP</p>
                  </div>
                  <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Redeem</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTP Verification Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter OTP</h2>
            <p className="text-sm text-gray-600 mb-4">Check your SMS for the code</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* OTP Input */}
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-4 text-center text-3xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  OTP is usually 4-6 digits
                </p>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Verifying...' : '✅ Verify & Get Code'}
              </button>
            </form>

            {/* Resend OTP */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-3">Didn't receive code?</p>
              <button
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
                className="w-full text-green-600 font-semibold hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendTimer > 0 ? `⏳ Resend in ${resendTimer}s` : '🔄 Resend OTP'}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ After verification, you'll get a unique redemption code to claim the offer at the vendor.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
