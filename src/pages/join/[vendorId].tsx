import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function JoinPage() {
  const router = useRouter();
  const { vendorId } = router.query;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'consent'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [vendorName, setVendorName] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSessionToken(data.sessionToken);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Store token
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      setStep('consent');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Opt-in to vendor
  const handleOptIn = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/opt-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          phoneNumber,
          vendorId,
          source: 'qr_scan',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to opt-in');
      }

      alert('✅ You have successfully opted in! You will now receive offers on WhatsApp.');
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Get Exclusive Offers - QR Offers</title>
        <meta name="description" content="Join and get exclusive offers on WhatsApp" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 mb-2">Get Offers</h1>
            <p className="text-gray-600">Receive exclusive offers on WhatsApp</p>
          </div>

          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                  required
                />
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? '⏳ Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-sm text-center">
                OTP sent to {phoneNumber}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP (4 digits)
                </label>
                <input
                  type="text"
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
                  disabled={loading}
                  required
                />
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? '⏳ Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Change Phone
              </button>
            </form>
          )}

          {/* Step 3: Consent */}
          {step === 'consent' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h2 className="text-lg font-semibold text-green-900 mb-3">Ready to get offers?</h2>
                <div className="text-sm text-green-800 space-y-2">
                  <p>✅ You'll receive exclusive offers on WhatsApp</p>
                  <p>✅ You can opt-out anytime by replying STOP</p>
                  <p>✅ Your phone number is private and secure</p>
                </div>
              </div>

              <button
                onClick={handleOptIn}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? '⏳ Confirming...' : '✅ Yes, Send Me Offers!'}
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Maybe Later
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
