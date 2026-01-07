import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface VendorStats {
  accepted_offers: number;
  pending_offers: number;
  total_messages_sent: number;
  delivery_rate: number;
}

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  category: string;
  city: string;
  address: string;
  qr_code_url: string;
}

interface AcceptedOfferRow {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  expiry_date: string;
  send_count: number;
  status: 'sent' | 'pending';
}

export default function VendorDashboard() {
  const router = useRouter();
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<AcceptedOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        window.location.href = '/vendor/login';
        return;
      }

      console.log('[VendorDashboard] Fetching data for vendorId:', vendorId);

      // Fetch vendor profile with QR code
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setVendor(profileData.data || profileData);
        console.log('[VendorDashboard] ✅ Profile loaded:', profileData.data);
      }

      // Fetch pending offers
      const offersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (offersRes.ok) {
        const data = await offersRes.json();
        console.log('[VendorDashboard] ✅ Offers loaded:', data);
        const offers = data.data || [];
        
        // Separate pending and accepted offers
        const pending = offers.filter((o: any) => o.status !== 'accepted');
        const accepted = offers.filter((o: any) => o.status === 'accepted').map((o: any) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          category: o.category,
          created_at: o.created_at,
          expiry_date: o.expiry_date,
          send_count: o.send_count || 0,
          status: (o.send_count && o.send_count > 0) ? 'sent' : 'pending',
        }));
        
        setPendingOffers(pending);
        setAcceptedOffers(accepted);
      } else {
        console.log('[VendorDashboard] ❌ Failed to fetch offers:', offersRes.status);
      }

      // Fetch stats
      const statsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}/stats`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data || {
          accepted_offers: 0,
          pending_offers: pendingOffers.length,
          total_messages_sent: 0,
          delivery_rate: 0,
        });
      }
    } catch (err: any) {
      console.error('[VendorDashboard] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}/vendor/${vendorId}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.ok) {
        alert('✅ Offer accepted!');
        // Remove from pending and add to accepted
        const accepted = pendingOffers.find(o => o.id === offerId);
        if (accepted) {
          setPendingOffers(pendingOffers.filter(o => o.id !== offerId));
          setAcceptedOffers([...acceptedOffers, {
            id: accepted.id,
            title: accepted.title,
            description: accepted.description,
            category: accepted.category,
            created_at: accepted.created_at,
            expiry_date: accepted.expiry_date,
            send_count: accepted.send_count || 0,
            status: 'pending',
          }]);
        }
      } else {
        const error = await res.json();
        console.error('Failed to accept:', error);
        alert('❌ Failed to accept offer');
      }
    } catch (err) {
      console.error('Error accepting offer:', err);
      alert('Error accepting offer');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}/vendor/${vendorId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.ok) {
        alert('✅ Offer rejected');
        // Remove from pending
        setPendingOffers(pendingOffers.filter(o => o.id !== offerId));
      } else {
        const error = await res.json();
        console.error('Failed to reject:', error);
        alert('❌ Failed to reject offer');
      }
    } catch (err) {
      console.error('Error rejecting offer:', err);
      alert('Error rejecting offer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">⏳ Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vendor Dashboard - QR Offers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">Vendor Dashboard</h1>
                <p className="text-indigo-300 text-sm mt-1">Welcome back, {vendor?.name || 'Vendor'}!</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
                >
                  🏠 Home

                </button>
                <button
                  onClick={() => router.push('/vendor/profile')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
                >
                  ⚙️ Profile
                </button>
                <button
                  onClick={() => router.push('/vendor/products')}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
                >
                  🛍️ Products
                </button>
                <button
                  onClick={() => router.push('/vendor/redemption')}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
                >
                  🎫 Redeem
                </button>
                <button
                  onClick={() => router.push('/vendor/qrcode')}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
                >
                  📱 QR Code
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg font-bold transition text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-violet-900/50 to-indigo-900/50 border border-indigo-500/30 rounded-lg sm:rounded-xl p-6">
                <p className="text-indigo-300 text-sm">Accepted Offers</p>
                <p className="text-3xl lg:text-4xl font-black text-violet-400 mt-2">{stats.accepted_offers}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-lg sm:rounded-xl p-6">
                <p className="text-indigo-300 text-sm">Pending Offers</p>
                <p className="text-3xl lg:text-4xl font-black text-indigo-400 mt-2">{stats.pending_offers}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-indigo-500/30 rounded-lg sm:rounded-xl p-6">
                <p className="text-indigo-300 text-sm">Messages Sent</p>
                <p className="text-3xl lg:text-4xl font-black text-blue-400 mt-2">{stats.total_messages_sent}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 border border-indigo-500/30 rounded-lg sm:rounded-xl p-6">
                <p className="text-indigo-300 text-sm">Delivery Rate</p>
                <p className="text-3xl lg:text-4xl font-black text-purple-400 mt-2">{stats.delivery_rate}%</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {vendor && vendor.qr_code_url && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* QR Code Display */}
                <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📱 Your QR Code</h3>
                  <img 
                    src={vendor.qr_code_url} 
                    alt="Vendor QR Code" 
                    style={{ width: '280px', height: '280px' }}
                    className="rounded-lg border-4 border-indigo-600"
                  />
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Customers scan this QR code to view your offers
                  </p>
                </div>

                {/* QR Code Info & Actions */}
                <div className="text-white">
                  <h3 className="text-3xl font-bold mb-4">🎯 Share Your QR Code</h3>
                  <p className="text-indigo-100 mb-6">
                    Display this QR code in your store so customers can easily access your offers.
                  </p>

                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-indigo-100 mb-2">Vendor ID</p>
                    <p className="text-lg font-mono font-bold text-white">{vendor.id}</p>
                  </div>

                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-indigo-100 mb-2">Business</p>
                    <p className="text-lg font-bold text-white">{vendor.name}</p>
                    <p className="text-sm text-indigo-100">{vendor.address}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = vendor.qr_code_url;
                        link.download = `qr-code-${vendor.id}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                    >
                      📥 Download QR Code
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="w-full bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition flex items-center justify-center gap-2"
                    >
                      🖨️ Print QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Offers */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Offers</h2>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}

          {pendingOffers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No pending offers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOffers.map((offer: any) => (
                <div key={offer.id} className="bg-white rounded-lg shadow p-6">
                  {offer.image_url && (
                    <img src={offer.image_url} alt={offer.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{offer.description}</p>
                  <p className="text-sm text-gray-500 mb-4">Expires: {new Date(offer.expiry_date).toLocaleDateString()}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptOffer(offer.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => handleRejectOffer(offer.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accepted Offers Table */}
        {acceptedOffers.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">✅ Accepted Offers</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Offer Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Send Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {acceptedOffers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{offer.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{offer.description.substring(0, 50)}...</span>
                          <div className="text-xs text-gray-400 mt-1">Category: {offer.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {new Date(offer.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                            {offer.send_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            offer.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {offer.status === 'sent' ? '✅ Sent' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}