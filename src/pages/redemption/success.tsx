import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Offer {
  id: string;
  title: string;
  description: string;
}

export default function RedemptionSuccessPage() {
  const router = useRouter();
  const { code, vendorId, offerId } = router.query;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Head>
        <title>Redemption Code - Claim Your Offer</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-4xl">✅</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 Verified!
            </h1>
            <p className="text-gray-600">
              Your identity has been verified successfully
            </p>
          </div>

          {/* Redemption Code Card */}
          <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
            {/* Offer Summary */}
            {offer && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Your Offer</p>
                <p className="text-xl font-bold text-gray-900">{offer.title}</p>
                <p className="text-sm text-gray-700 mt-2">{offer.description}</p>
              </div>
            )}

            {/* Redemption Code */}
            <div className="bg-purple-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 text-center mb-3">Your Redemption Code</p>
              <div
                onClick={copyCode}
                className="bg-white border-2 border-purple-600 rounded-lg p-4 cursor-pointer hover:bg-purple-50 transition"
              >
                <p className="text-center text-3xl font-mono font-bold text-purple-600 tracking-widest break-all">
                  {code}
                </p>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                Click to copy • Share with vendor to redeem
              </p>
            </div>

            {/* Copy Button */}
            <button
              onClick={copyCode}
              className={`w-full py-3 rounded-lg font-semibold transition mb-4 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy Code'}
            </button>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next Step:</strong> Visit the vendor and share this code to claim your offer.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">How to Redeem:</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-gray-700">Show this code to the vendor</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-gray-700">Vendor verifies the code in their app</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-gray-700">Offer is marked as redeemed</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    `My redemption code: ${code}`
                  )}`,
                  '_blank'
                )
              }
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition flex items-center justify-center gap-2"
            >
              💬 Share via WhatsApp
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-semibold transition"
            >
              🏠 Back to Home
            </button>
          </div>

          {/* Code Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Code valid for 30 days from creation
            </p>
            <p className="text-xs text-gray-600 mt-1">
              For support, contact: support@qrohm.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
