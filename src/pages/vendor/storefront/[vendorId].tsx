import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function VendorStorefront() {
  const router = useRouter();
  const { vendorId } = router.query;
  const [vendorData, setVendorData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (!vendorId) return;

    const fetchVendorData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`
        );
        const data = await response.json();
        setVendorData(data);

        // Fetch products
        const productsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/product/vendor/${vendorId}`
        );
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);

        // Fetch offers
        const offersRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}/offers`
        );
        const offersData = await offersRes.json();
        setOffers(offersData || []);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  const sampleProducts = [
    {
      id: 1,
      name: 'Premium Coffee',
      price: '$8.99',
      image: '☕',
      description: 'Freshly brewed premium coffee'
    },
    {
      id: 2,
      name: 'Iced Beverage',
      price: '$5.99',
      image: '🧊',
      description: 'Refreshing iced drinks'
    },
    {
      id: 3,
      name: 'Pastries',
      price: '$3.99',
      image: '🥐',
      description: 'Fresh daily pastries'
    },
    {
      id: 4,
      name: 'Sandwich',
      price: '$6.99',
      image: '🥪',
      description: 'Delicious sandwiches'
    }
  ];

  const sampleOffers = [
    {
      id: 1,
      title: 'Buy 2 Get 1 Free',
      description: 'On all beverages',
      discount: '33%',
      expires: 'Jan 31, 2026'
    },
    {
      id: 2,
      title: 'Weekend Special',
      description: 'Extra 20% off pastries',
      discount: '20%',
      expires: 'Jan 30, 2026'
    },
    {
      id: 3,
      title: 'Loyalty Bonus',
      description: '5% off for loyalty members',
      discount: '5%',
      expires: 'Feb 28, 2026'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          <p className="text-white mt-4">Loading storefront...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vendor Storefront - {vendorData?.name || 'Store'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        {/* Header/Navigation */}
        <nav className="bg-gradient-to-r from-slate-950/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-2xl">🏪</span>
                </div>
                <div>
                  <h1 className="font-black text-base sm:text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                    {vendorData?.name || 'Premium Store'}
                  </h1>
                  <p className="text-indigo-300 text-xs sm:text-sm">{vendorData?.category || 'Quality Products'}</p>
                </div>
              </div>
              <a href={`https://wa.me/${vendorData?.whatsappNumber || ''}`} className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg font-bold text-sm transition">
                💬 Contact on WhatsApp
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 border-b border-indigo-500/20">
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-48 h-48 bg-violet-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                Welcome to Our Store
              </h2>
              <p className="text-indigo-200 text-base sm:text-lg max-w-2xl mx-auto">
                Discover premium products and exclusive offers
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-6 py-3 rounded-lg font-bold transition text-sm sm:text-base ${
                    activeTab === 'products'
                      ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/50'
                      : 'border-2 border-violet-500 text-violet-200 hover:bg-violet-500/10'
                  }`}
                >
                  📦 Products
                </button>
                <button
                  onClick={() => setActiveTab('offers')}
                  className={`px-6 py-3 rounded-lg font-bold transition text-sm sm:text-base ${
                    activeTab === 'offers'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                      : 'border-2 border-indigo-500 text-indigo-200 hover:bg-indigo-500/10'
                  }`}
                >
                  🎁 Special Offers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        {activeTab === 'products' && (
          <section className="py-12 sm:py-20 bg-gradient-to-b from-slate-950 to-indigo-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-8 sm:mb-12">
                Our Products
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {(products.length > 0 ? products : sampleProducts).map((product: any) => (
                  <div
                    key={product.id}
                    className="group relative bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-lg sm:rounded-xl overflow-hidden hover:border-violet-500/50 transition"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-50 blur-xl transition"></div>
                    <div className="relative p-4 sm:p-6">
                      {/* Product Image */}
                      <div className="mb-3 flex items-center justify-center h-32 sm:h-40 bg-slate-800/50 rounded-lg overflow-hidden">
                        {product.icon ? (
                          <img 
                            src={product.icon} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '🛍️';
                              (e.target as HTMLImageElement).alt = 'Product Image';
                            }}
                          />
                        ) : (
                          <div className="text-5xl sm:text-6xl text-center">🛍️</div>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{product.name}</h3>
                      <p className="text-indigo-200 text-sm mb-4">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl sm:text-3xl font-black text-violet-400">${product.price}</span>
                        <a href={`https://wa.me/${vendorData?.whatsappNumber || ''}?text=I%20am%20interested%20in%20${product.name}`} className="px-3 sm:px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg font-bold text-xs sm:text-sm transition">
                          Order →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Offers Section */}
        {activeTab === 'offers' && (
          <section className="py-12 sm:py-20 bg-gradient-to-b from-slate-950 to-indigo-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-8 sm:mb-12">
                Special Offers
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {(offers.length > 0 ? offers : sampleOffers).map((offer: any) => (
                  <div
                    key={offer.id}
                    className="group relative bg-gradient-to-br from-indigo-900 via-violet-900 to-indigo-900 border-2 border-violet-500/50 rounded-lg sm:rounded-2xl overflow-hidden hover:border-violet-400 transition"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg sm:rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition"></div>
                    <div className="relative p-6 sm:p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">{offer.title}</h3>
                          <p className="text-indigo-200 text-sm sm:text-base">{offer.description}</p>
                        </div>
                        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 px-3 sm:px-4 py-2 rounded-lg">
                          <span className="text-white font-black text-lg sm:text-2xl">{offer.discount}</span>
                        </div>
                      </div>
                      <div className="border-t border-indigo-500/30 pt-4 flex items-center justify-between">
                        <span className="text-indigo-300 text-xs sm:text-sm">Expires: {offer.expires}</span>
                        <a href={`https://wa.me/${vendorData?.whatsappNumber || ''}?text=I%20want%20to%20claim%20the%20${offer.title}%20offer`} className="px-4 sm:px-6 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg font-bold text-xs sm:text-sm transition">
                          Claim Now →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-indigo-500/20 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
              <div>
                <h3 className="font-bold text-white mb-4">Store Info</h3>
                <p className="text-indigo-300 text-sm">{vendorData?.description || 'Welcome to our premium store offering quality products and services.'}</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-4">Contact</h3>
                <p className="text-indigo-300 text-sm">📧 {vendorData?.email || 'contact@store.com'}</p>
                <p className="text-indigo-300 text-sm">📱 {vendorData?.phone || 'Contact via WhatsApp'}</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="text-indigo-300 hover:text-violet-400 transition">Twitter</a>
                  <a href="#" className="text-indigo-300 hover:text-violet-400 transition">Facebook</a>
                  <a href="#" className="text-indigo-300 hover:text-violet-400 transition">Instagram</a>
                </div>
              </div>
            </div>
            <div className="border-t border-indigo-500/20 pt-8 text-center text-indigo-300 text-sm">
              <p>&copy; 2026 {vendorData?.name || 'Vendor Store'}. Powered by QR-Offer Platform</p>
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(20px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
