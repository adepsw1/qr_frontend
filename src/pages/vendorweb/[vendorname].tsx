import React, { useEffect, useState } from 'react';
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
  image?: string;
  description?: string;
}

export default function VendorMicroWeb() {
  const router = useRouter();
  const { vendorname } = router.query;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('offers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vendorname) return;
    fetchVendorData();
  }, [vendorname]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      // Fetch vendor by name/slug
      const vendorRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/web/${vendorname}`
      );
      const vendorData = await vendorRes.json();
      
      if (!vendorRes.ok) {
        throw new Error(vendorData.message || 'Vendor not found');
      }
      
      setVendor(vendorData.data || vendorData);
      const vendorId = vendorData.data?.id || vendorData.id;

      // Fetch vendor offers
      const offersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/vendor/${vendorId}`
      );
      const offersData = await offersRes.json();
      const acceptedOffers = (offersData.data || []).filter((o: any) => o.status === 'accepted');
      setOffers(acceptedOffers);

      // Fetch vendor products
      const productsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}/products`
      );
      const productsData = await productsRes.json();
      setProducts(productsData.data || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
          </div>
          <p className="text-indigo-300">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg mb-4">❌ Store not found</p>
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
        <title>{vendor.name} - Micro Store</title>
        <meta name="description" content={`${vendor.name} - ${vendor.category}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-20">
        {/* Hero Section with Store Banner */}
        <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-br from-violet-600 to-indigo-600 overflow-hidden">
          {vendor.store_image && (
            <img
              src={vendor.store_image}
              alt={vendor.name}
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

          {/* Vendor Profile Section - Overlapping */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 sm:gap-6 px-4 sm:px-6 pb-6">
            {/* Profile Image */}
            {vendor.profile_image ? (
              <img
                src={vendor.profile_image}
                alt={vendor.name}
                className="w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 rounded-xl border-4 border-white shadow-2xl object-cover"
              />
            ) : (
              <div className="w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 rounded-xl border-4 border-white shadow-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-4xl sm:text-5xl md:text-6xl">
                🏪
              </div>
            )}

            {/* Vendor Info */}
            <div className="flex-1 pb-2">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2">{vendor.name}</h1>
              <p className="text-indigo-200 text-sm sm:text-base">{vendor.category} • {vendor.city}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Vendor Description */}
          {vendor.description && (
            <div className="bg-gradient-to-br from-slate-800/50 to-indigo-800/50 border border-indigo-500/20 rounded-xl p-6 mb-8">
              <p className="text-indigo-200 text-center">{vendor.description}</p>
            </div>
          )}

          {/* Quick Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <a
              href={`tel:${vendor.phone_number}`}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-lg font-bold text-center transition transform hover:scale-105"
            >
              📞 Call Now
            </a>
            <a
              href={`https://wa.me/${vendor.phone_number}?text=Hi, I'm interested in your offers!`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-lg font-bold text-center transition transform hover:scale-105"
            >
              💬 WhatsApp
            </a>
            <a
              href={`mailto:${vendor.email}`}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white p-4 rounded-lg font-bold text-center transition transform hover:scale-105"
            >
              📧 Email
            </a>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'offers', label: '🎉 Offers', icon: '🎉' },
              { id: 'products', label: '🛍️ Products', icon: '🛍️' },
              { id: 'about', label: '📍 About', icon: '📍' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-3 rounded-lg font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-800/50 text-indigo-300 hover:bg-slate-700/50 border border-indigo-500/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">🎉 Exclusive Offers</h2>
              {offers.length === 0 ? (
                <div className="bg-slate-800/50 border border-indigo-500/20 rounded-xl p-8 text-center">
                  <p className="text-indigo-300">No offers available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-gradient-to-br from-slate-800 to-indigo-800 border border-indigo-500/30 rounded-xl overflow-hidden hover:border-violet-500 transition transform hover:scale-105"
                    >
                      {offer.image_url && (
                        <img
                          src={offer.image_url}
                          alt={offer.title}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="text-xl font-bold text-white">{offer.title}</h3>
                          {offer.discount_percentage && (
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-3 py-1 rounded-lg font-bold whitespace-nowrap">
                              {offer.discount_percentage}% OFF
                            </div>
                          )}
                        </div>
                        <p className="text-indigo-200 text-sm mb-3">{offer.description}</p>
                        <p className="text-indigo-400 text-xs">
                          Valid till: {new Date(offer.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">🛍️ Our Products</h2>
              {products.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Coffee', price: '₹199', icon: '☕' },
                    { name: 'Snacks', price: '₹99', icon: '🍪' },
                    { name: 'Beverages', price: '₹79', icon: '🥤' },
                    { name: 'Desserts', price: '₹149', icon: '🍰' },
                    { name: 'Sandwiches', price: '₹249', icon: '🥪' },
                    { name: 'Smoothies', price: '₹129', icon: '🥗' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-slate-800 to-indigo-800 border border-indigo-500/30 rounded-xl p-4 text-center hover:border-violet-500 transition"
                    >
                      <div className="text-4xl mb-2">{item.icon}</div>
                      <h4 className="text-white font-bold text-sm mb-1">{item.name}</h4>
                      <p className="text-violet-400 font-bold">{item.price}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-gradient-to-br from-slate-800 to-indigo-800 border border-indigo-500/30 rounded-xl overflow-hidden hover:border-violet-500 transition"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-4xl">
                          🛍️
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-indigo-200 text-sm mb-3">{product.description}</p>
                        )}
                        <p className="text-2xl font-bold text-violet-400">₹{product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-slate-800/50 to-indigo-800/50 border border-indigo-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">📍 Location</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-2xl">📮</span>
                    <div>
                      <p className="text-indigo-300 text-sm">Address</p>
                      <p className="text-white font-medium">{vendor.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-2xl">🏙️</span>
                    <div>
                      <p className="text-indigo-300 text-sm">City</p>
                      <p className="text-white font-medium">{vendor.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <p className="text-indigo-300 text-sm">Category</p>
                      <p className="text-white font-medium">{vendor.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-indigo-800/50 border border-indigo-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">📞 Contact Details</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="text-indigo-300 text-sm">Phone</p>
                      <a
                        href={`tel:${vendor.phone_number}`}
                        className="text-violet-400 hover:text-violet-300 font-medium transition"
                      >
                        {vendor.phone_number}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="text-indigo-300 text-sm">Email</p>
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-violet-400 hover:text-violet-300 font-medium transition break-all"
                      >
                        {vendor.email}
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const whatsappLink = `https://wa.me/${vendor.phone_number}?text=Hello, I want to know more about your services!`;
                    window.open(whatsappLink, '_blank');
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition"
                >
                  💬 Start Chat on WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
