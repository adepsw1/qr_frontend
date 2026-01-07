import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function OtpOfferPage() {
  const router = useRouter();
  const { vendorId, sessionId, name, phone } = router.query;
  const [otp, setOtp] = useState('');
  const [offer, setOffer] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Prevent browser back navigation
  useEffect(() => {
    // Push a state to history so user can't go back
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e: any) => {
      // If user tries to go back, push them forward again
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (vendorId && sessionId) {
      fetchData();
    }
  }, [vendorId, sessionId]);

  const fetchData = async () => {
    try {
      // Get vendor info
      const vendorRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`
      );
      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        setVendor(vendorData.data || vendorData);
      }

      // Get OTP and offer for this session
      const otpRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/session/${sessionId}`
      );
      if (otpRes.ok) {
        const otpData = await otpRes.json();
        setOtp(otpData.data.otp);
        setOffer(otpData.data.offer);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const whatsappMsg = `🎉 I got an OTP for an exclusive offer!\n\nOffer: ${offer?.title}\n${offer?.description}\n\nOTP: ${otp}\n\nValid for 10 minutes. I'll share this with the vendor when I visit.`;
    const encodedMsg = encodeURIComponent(whatsappMsg);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  if (!vendorId || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your OTP & Offer - {vendor?.name || 'Vendor'}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-3xl font-bold text-gray-900">Success!</h1>
            <p className="text-gray-600 mt-2">Your OTP is ready</p>
          </div>

          {/* Vendor Name */}
          {vendor && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <p className="text-sm text-gray-600">Vendor:</p>
              <p className="text-lg font-bold text-blue-600">{vendor.name}</p>
            </div>
          )}

          {/* Offer Details */}
          {offer && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6 border-2 border-orange-300">
              <p className="text-sm text-gray-600 mb-1">🎁 Your Offer:</p>
              <p className="text-2xl font-bold text-orange-600">{offer.title}</p>
              <p className="text-sm text-gray-700 mt-2">{offer.description}</p>
              {offer.expiry_date && (
                <p className="text-xs text-gray-600 mt-2">
                  Valid until: {new Date(offer.expiry_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* OTP Display */}
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 mb-6 border-2 border-indigo-300">
            <p className="text-sm text-gray-600 text-center mb-3 font-medium">Your OTP (Valid for 10 minutes)</p>
            <div className="text-5xl font-bold text-center text-indigo-600 font-mono tracking-widest">
              {otp}
            </div>
            <p className="text-xs text-gray-600 text-center mt-3">⏱️ Expires in: 10:00 minutes</p>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-sm text-gray-600">Customer Details:</p>
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-600">{phone}</p>
          </div>

          {/* Copy OTP Button */}
          <button
            onClick={handleCopyOtp}
            className={`w-full py-3 rounded-lg font-semibold transition mb-3 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? '✅ Copied!' : '📋 Copy OTP'}
          </button>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-2">📝 How to Use:</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-semibold">1. Next Visit:</span> Come back to the vendor store
              </li>
              <li>
                <span className="font-semibold">2. Share OTP:</span> Tell vendor your OTP: <strong>{otp}</strong>
              </li>
              <li>
                <span className="font-semibold">3. Claim Offer:</span> Vendor will validate and apply your offer
              </li>
            </ol>
          </div>

          {/* Share WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition mb-3"
          >
            💬 Share via WhatsApp
          </button>

          {/* Back Button - Redirect to offer registration, not home */}
          <button
            onClick={() => router.push(`/offer/${vendorId}`)}
            className="w-full bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            ← Back to Offer
          </button>

          {/* Message */}
          {message && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
