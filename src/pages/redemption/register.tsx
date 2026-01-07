import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Vendor {
  id: string;
  name: string;
  category: string;
  city: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  expiry_date: string;
}

export default function RedemptionRegisterPage() {
  const router = useRouter();
  const { vendorId, offerId } = router.query;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch vendor and offer details
  useEffect(() => {
    if (!vendorId || !offerId) return;

    const fetchData = async () => {
      try {
        // Get vendor details
        const vendorRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`
        );
        const vendorData = await vendorRes.json();

        if (!vendorRes.ok) {
          throw new Error('Vendor not found');
        }

        setVendor(vendorData.data);

        // Get offer details
        const offerRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}`
        );
        const offerData = await offerRes.json();

        if (!offerRes.ok) {
          throw new Error('Offer not found');
        }

        setOffer(offerData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [vendorId, offerId]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || !customerName) {
      setError('Please enter your name and phone number');
      return;
    }

    setLoading(true);

    try {
      // Store redemption data in localStorage temporarily
      const redemptionData = {
        vendorId,
        offerId,
        phoneNumber,
        customerName,
        startTime: new Date().toISOString(),
      };

      localStorage.setItem('redemptionData', JSON.stringify(redemptionData));

      // Send OTP
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customer/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      // Redirect to OTP verification page
      router.push(
        `/redemption/verify-otp?vendorId=${vendorId}&offerId=${offerId}&phone=${encodeURIComponent(phoneNumber)}`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">⏳ Loading offer details...</p>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Claim Offer - {vendor?.name}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Claim Your Offer</h1>
            <p className="text-gray-600">Complete redemption process</p>
          </div>

          {/* Vendor & Offer Info */}
          {vendor && offer && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              {/* Vendor Name */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="text-lg font-bold text-gray-900">{vendor.name}</p>
                  <p className="text-xs text-gray-500">{vendor.category} • {vendor.city}</p>
                </div>
              </div>

              {/* Offer Details */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-2">📝 Offer Details</h3>
                <p className="text-lg font-semibold text-indigo-600 mb-2">{offer.title}</p>
                <p className="text-gray-700 text-sm mb-3">{offer.description}</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Category: {offer.category}</span>
                  <span>
                    Expires: {new Date(offer.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Register</p>
                  </div>
                  <div className="flex-1 h-1 bg-indigo-600 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold text-sm">
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

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Details</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone (with country code)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">e.g., +919876543210</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Sending OTP...' : '📱 Send OTP & Continue'}
              </button>
            </form>

            {/* Info */}
            <p className="text-xs text-gray-600 text-center mt-4">
              We'll send you an OTP to verify your phone number
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
