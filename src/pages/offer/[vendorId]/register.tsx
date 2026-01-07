import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function RegisterPage() {
  const router = useRouter();
  const { vendorId } = router.query;
  const [vendor, setVendor] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorId) {
      fetchVendorAndOffer();
    }
  }, [vendorId]);

  const fetchVendorAndOffer = async () => {
    try {
      // Get vendor info (if available)
      const vendorRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`
      );
      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        setVendor(vendorData.data || vendorData);
      }

      // Get latest offer for this vendor
      const offerRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/vendor/${vendorId}`
      );
      if (offerRes.ok) {
        const offerData = await offerRes.json();
        if (offerData.data && offerData.data.length > 0) {
          // Get the most recent accepted offer
          const acceptedOffers = offerData.data.filter(
            (o: any) => o.vendor_status === 'accepted'
          );
          if (acceptedOffers.length > 0) {
            setOffer(acceptedOffers[0]);
          } else if (offerData.data.length > 0) {
            setOffer(offerData.data[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register customer and get OTP
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            name,
            phoneNumber: phone,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Registration successful:', data);
        
        // Redirect to OTP/offer display page
        router.push({
          pathname: `/offer/${vendorId}/otp-offer`,
          query: {
            sessionId: data.data.sessionId,
            name,
            phone,
          },
        });
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to register');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Get Offer - Join Now</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Get Your Offer</h1>
            <p className="text-gray-600">Join our exclusive offer program</p>
          </div>

          {/* Vendor Info */}
          {vendor && (
            <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-200">
              <p className="text-sm text-gray-600">Offer from:</p>
              <p className="text-lg font-bold text-indigo-600">{vendor.name}</p>
            </div>
          )}

          {/* Offer Preview */}
          {offer && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Special Offer:</p>
              <p className="text-2xl font-bold text-green-600">{offer.title}</p>
              <p className="text-sm text-gray-600 mt-2">{offer.description}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">We'll send your OTP here</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Generating OTP...' : '✅ Continue'}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to receive exclusive offers via WhatsApp
          </p>
        </div>
      </div>
    </>
  );
}
