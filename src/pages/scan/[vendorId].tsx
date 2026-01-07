import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  category: string;
  city: string;
  qr_code_url?: string;
  profile_image?: string;
  store_image?: string;
  description?: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  expiry_date: string;
  discount_percentage?: number;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  icon: string;
  isActive: boolean;
}

export default function QRScanResult() {
  const router = useRouter();
  const { vendorId } = router.query;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [redemptionId, setRedemptionId] = useState('');
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null);

  const checkRedemptionStatus = useCallback(async () => {
    if (!redemptionId || isRedeemed) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/redemption/${redemptionId}/status`);
      const data = await res.json();
      if (res.ok && data.data?.status === 'redeemed') {
        setIsRedeemed(true);
        setRedemptionDetails(data.data);
      }
    } catch (err) {
      console.error('Error checking redemption status:', err);
    }
  }, [redemptionId, isRedeemed]);

  useEffect(() => {
    if (!showOTP || !redemptionId || isRedeemed) return;
    const interval = setInterval(checkRedemptionStatus, 5000);
    return () => clearInterval(interval);
  }, [showOTP, redemptionId, isRedeemed, checkRedemptionStatus]);

  useEffect(() => {
    if (!vendorId) return;
    fetchVendorAndOffers();
  }, [vendorId]);

  const fetchVendorAndOffers = async () => {
    try {
      setLoading(true);
      // Fetch vendor details
      const vendorRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`
      );
      const vendorData = await vendorRes.json();
      setVendor(vendorData.data || vendorData);

      // Fetch vendor offers
      const offersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/vendor/${vendorId}`
      );
      const offersData = await offersRes.json();
      const acceptedOffers = (offersData.data || []).filter((o: any) => o.status === 'accepted');
      setOffers(acceptedOffers);
      if (acceptedOffers.length > 0) {
        setSelectedOffer(acceptedOffers[0]);
      }

      // Fetch vendor products
      const productsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/product/vendor/${vendorId}`
      );
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const activeProducts = (productsData.data || []).filter((p: Product) => p.isActive !== false);
        setProducts(activeProducts);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOTP = async (e: any) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!customerName.trim()) {
        throw new Error('Please enter your name');
      }

      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      const fullPhoneNumber = `+91${digits}`;

      // Call backend to generate and store OTP
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/generate-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            phoneNumber: fullPhoneNumber,
            vendorId,
            offerId: selectedOffer?.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate OTP');
      }

      // Store the OTP from backend response (for display purposes only)
      // In production, OTP would be sent via SMS/WhatsApp
      setOtp(data.data?.otp || data.otp || '');
      setRedemptionId(data.data?.redemptionId || data.redemptionId || '');
      setShowOTP(true);

      console.log('OTP generated for:', customerName, fullPhoneNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
          </div>
          <p className="text-indigo-300">Loading vendor information...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg mb-4">Vendor not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{vendor.name} - QR Offer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        {/* ========== SECTION 1: Store Banner + Profile Picture ========== */}
        <div className="relative">
          {/* Store Banner */}
          <div className="w-full h-44 sm:h-56 bg-gradient-to-r from-indigo-800 to-violet-800 relative overflow-hidden">
            {vendor.store_image ? (
              <img
                src={vendor.store_image}
                alt={`${vendor.name} banner`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-30">🏪</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          </div>

          {/* Profile Picture - Overlapping */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-14 sm:-bottom-16">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-slate-950 shadow-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600">
              {vendor.profile_image ? (
                <img
                  src={vendor.profile_image}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🏪</div>
              )}
            </div>
          </div>
        </div>

        {/* Vendor Name & Info */}
        <div className="pt-16 sm:pt-20 pb-4 text-center px-4">
          <h1 className="text-2xl sm:text-3xl font-black text-white">{vendor.name}</h1>
          <p className="text-indigo-300 text-sm mt-1">{vendor.category} • {vendor.city}</p>
        </div>

        {/* ========== SECTION 2: OTP Form / OTP Display ========== */}
        <div className="px-4 pb-6">
          <div className="max-w-md mx-auto">
            {!showOTP ? (
              /* OTP Collection Form */
              <div className="bg-gradient-to-br from-slate-900/90 to-indigo-900/90 backdrop-blur border border-indigo-500/30 rounded-2xl shadow-2xl p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">📱 Get Your Offer</h2>
                <p className="text-indigo-300 text-sm mb-4">Enter details to receive OTP</p>

                <form onSubmit={handleGenerateOTP} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/70 border border-indigo-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex">
                    <span className="px-3 py-3 bg-slate-800/70 border border-indigo-500/30 rounded-l-xl text-indigo-300 font-medium text-sm">+91</span>
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 px-4 py-3 bg-slate-800/70 border border-indigo-500/30 rounded-r-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={submitting}
                      maxLength={10}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-500/30">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !customerName.trim() || phoneNumber.length !== 10}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition text-base"
                  >
                    {submitting ? '⏳ Generating...' : '✨ Get OTP'}
                  </button>
                </form>
              </div>
            ) : isRedeemed ? (
              /* Redemption Success */
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-2 border-green-500 rounded-2xl shadow-2xl p-5 sm:p-6">
                <div className="text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <h2 className="text-xl sm:text-2xl font-black text-green-400 mb-2">Redeemed!</h2>
                  <p className="text-green-300 text-sm mb-3">Your offer has been applied</p>
                  
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-3">
                    <p className="text-white font-bold">{redemptionDetails?.offerTitle || selectedOffer?.title}</p>
                    <p className="text-green-200 text-sm mt-1">
                      {redemptionDetails?.discountPercent || selectedOffer?.discount_percentage}% OFF
                    </p>
                  </div>
                  
                  <p className="text-green-300 text-xs">✅ Thank you for visiting!</p>
                </div>
              </div>
            ) : (
              /* OTP Display with Validity */
              <div className="bg-gradient-to-br from-slate-900/90 to-indigo-900/90 backdrop-blur border border-indigo-500/30 rounded-2xl shadow-2xl p-5 sm:p-6">
                <div className="text-center">
                  <p className="text-indigo-300 text-sm mb-2">Your OTP</p>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 mb-3 inline-block">
                    <p className="text-3xl sm:text-4xl font-black text-white tracking-widest font-mono">{otp}</p>
                  </div>
                  
                  {/* Validity Info */}
                  <div className="bg-slate-800/50 rounded-xl p-3 mb-3">
                    <p className="text-indigo-300 text-xs">Valid until</p>
                    <p className="text-white font-bold text-lg">
                      {selectedOffer?.expiry_date ? new Date(selectedOffer.expiry_date).toLocaleDateString() : '24 hours'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <p className="text-yellow-300 text-xs">Waiting for redemption...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== SECTION 3: Store Features / Products ========== */}
        <div className="px-4 pb-6">
          <div className="max-w-2xl mx-auto">
            {/* Current Offers */}
            {offers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  🎁 Available Offers
                </h3>
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className={`bg-gradient-to-r rounded-xl p-4 border-2 transition cursor-pointer ${
                        selectedOffer?.id === offer.id
                          ? 'from-violet-900/70 to-indigo-900/70 border-violet-500'
                          : 'from-slate-800/70 to-indigo-800/70 border-indigo-500/30'
                      }`}
                      onClick={() => setSelectedOffer(offer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-bold">{offer.title}</h4>
                          <p className="text-indigo-300 text-sm mt-1">{offer.description}</p>
                        </div>
                        {offer.discount_percentage && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-lg font-bold text-sm whitespace-nowrap">
                            {offer.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-400 text-xs mt-2">
                        Valid until: {new Date(offer.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products / Services */}
            {products.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  🛍️ Our Products & Services
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gradient-to-br from-slate-800/80 to-indigo-800/80 border border-indigo-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl mb-2">{product.icon || '📦'}</div>
                      <h4 className="text-white font-semibold text-sm">{product.name}</h4>
                      <p className="text-emerald-400 font-bold mt-1">₹{product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store Description */}
            {vendor.description && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  ℹ️ About Us
                </h3>
                <div className="bg-slate-800/50 border border-indigo-500/20 rounded-xl p-4">
                  <p className="text-indigo-200 text-sm">{vendor.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== SECTION 4: Contact & Location ========== */}
        <div className="px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              📍 Contact & Location
            </h3>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-indigo-800/50 border border-indigo-500/20 rounded-xl p-4 sm:p-5">
              {/* Contact Info */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">📍</span>
                  <div>
                    <p className="text-indigo-400 text-xs">Address</p>
                    <p className="text-white text-sm">{vendor.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">📞</span>
                  <div>
                    <p className="text-indigo-400 text-xs">Phone</p>
                    <p className="text-white text-sm">{vendor.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">📧</span>
                  <div>
                    <p className="text-indigo-400 text-xs">Email</p>
                    <p className="text-white text-sm">{vendor.email}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.open(`tel:${vendor.phone_number}`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <span>📞</span> Call
                </button>
                <button
                  onClick={() => {
                    const link = `https://wa.me/${vendor.phone_number?.replace(/[^0-9]/g, '')}?text=Hi, I visited your store!`;
                    window.open(link, '_blank');
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <span>💬</span> WhatsApp
                </button>
              </div>
              
              {/* Google Maps Link */}
              <button
                onClick={() => {
                  const query = encodeURIComponent(`${vendor.name} ${vendor.address} ${vendor.city}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
                className="w-full mt-3 bg-slate-700/50 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 border border-indigo-500/30"
              >
                <span>🗺️</span> View on Google Maps
              </button>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="text-center py-6 border-t border-indigo-500/20">
          <p className="text-indigo-400 text-xs">Powered by QR Offers</p>
        </div>
      </div>
    </>
  );
}
