import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  category: string;
  city: string;
  profile_image?: string;
  store_image?: string;
  description?: string;
  created_at: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: number;
  expiry_date: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorOffers, setVendorOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vendors');
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    category: 'general',
    discount_percentage: 10,
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setVendors(data.data || []);
      } else {
        setError('Failed to fetch vendors');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorOffers = async (vendorId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/vendor/${vendorId}`
      );

      if (res.ok) {
        const data = await res.json();
        setVendorOffers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const handleSelectVendor = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setActiveTab('offers');
    await fetchVendorOffers(vendor.id);
  };

  const handleCreateOffer = async () => {
    if (!selectedVendor) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newOffer,
            vendorId: selectedVendor.id,
          }),
        }
      );

      if (res.ok) {
        setNewOffer({
          title: '',
          description: '',
          category: 'general',
          discount_percentage: 10,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        await fetchVendorOffers(selectedVendor.id);
      } else {
        setError('Failed to create offer');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveOffer = async (offerId: string) => {
    if (!selectedVendor) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}/approve`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (res.ok) {
        await fetchVendorOffers(selectedVendor.id);
      }
    } catch (err) {
      console.error('Error approving offer:', err);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!selectedVendor) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (res.ok) {
        await fetchVendorOffers(selectedVendor.id);
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
          </div>
          <p className="text-indigo-300">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Vendors Management</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-white">Vendors Management</h1>
                <p className="text-indigo-300 text-sm mt-1">Manage vendors and their offers</p>
              </div>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {error && (
            <div className="p-4 bg-red-500/20 text-red-300 rounded-lg mb-6 border border-red-500/30">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vendors List */}
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">👥 Vendors ({vendors.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => handleSelectVendor(vendor)}
                    className={`w-full text-left p-4 rounded-lg transition ${
                      selectedVendor?.id === vendor.id
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-slate-800/50 hover:bg-slate-700/50 text-indigo-200'
                    }`}
                  >
                    <p className="font-bold">{vendor.name}</p>
                    <p className="text-xs opacity-75">{vendor.category} • {vendor.city}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Details & Offers Management */}
            {selectedVendor && (
              <div className="lg:col-span-2 space-y-6">
                {/* Vendor Info */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">📋 {selectedVendor.name}</h2>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-indigo-300 text-sm">Category</p>
                      <p className="text-white font-bold">{selectedVendor.category}</p>
                    </div>
                    <div>
                      <p className="text-indigo-300 text-sm">City</p>
                      <p className="text-white font-bold">{selectedVendor.city}</p>
                    </div>
                    <div>
                      <p className="text-indigo-300 text-sm">Email</p>
                      <p className="text-white font-bold text-sm break-all">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <p className="text-indigo-300 text-sm">Phone</p>
                      <p className="text-white font-bold">{selectedVendor.phone_number}</p>
                    </div>
                  </div>

                  {selectedVendor.profile_image && (
                    <div className="mb-4">
                      <p className="text-indigo-300 text-sm mb-2">Profile Picture</p>
                      <img src={selectedVendor.profile_image} alt="Profile" className="w-24 h-24 rounded-lg object-cover" />
                    </div>
                  )}
                </div>

                {/* Offers Management */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">🎉 Manage Offers</h3>

                  {/* Create New Offer */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-indigo-500/20">
                    <h4 className="font-bold text-white mb-4">➕ Create New Offer</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Offer Title"
                        value={newOffer.title}
                        onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded text-white placeholder-gray-400"
                      />
                      <textarea
                        placeholder="Description"
                        value={newOffer.description}
                        onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded text-white placeholder-gray-400"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Discount %"
                          value={newOffer.discount_percentage}
                          onChange={(e) => setNewOffer({ ...newOffer, discount_percentage: parseInt(e.target.value) })}
                          className="px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded text-white"
                        />
                        <input
                          type="date"
                          value={newOffer.expiry_date}
                          onChange={(e) => setNewOffer({ ...newOffer, expiry_date: e.target.value })}
                          className="px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded text-white"
                        />
                      </div>
                      <button
                        onClick={handleCreateOffer}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2 rounded font-bold transition"
                      >
                        Create Offer
                      </button>
                    </div>
                  </div>

                  {/* Offers List */}
                  {vendorOffers.length === 0 ? (
                    <div className="text-center py-8 text-indigo-300">
                      <p>No offers created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vendorOffers.map((offer) => (
                        <div key={offer.id} className="bg-slate-800/50 border border-indigo-500/20 rounded-lg p-4">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div>
                              <p className="font-bold text-white">{offer.title}</p>
                              <p className="text-indigo-300 text-sm">{offer.description}</p>
                            </div>
                            {offer.discount_percentage && (
                              <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                                {offer.discount_percentage}% OFF
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-indigo-400 mb-3">
                            <span>Expires: {new Date(offer.expiry_date).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded font-bold ${
                              offer.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                              offer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {offer.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {offer.status === 'pending' && (
                              <button
                                onClick={() => handleApproveOffer(offer.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-bold transition"
                              >
                                ✅ Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-bold transition"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedVendor && (
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-8 flex items-center justify-center">
                <p className="text-indigo-300 text-center">Select a vendor to manage their offers</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
