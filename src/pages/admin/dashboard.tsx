import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Stats {
  total_vendors: number;
  total_offers: number;
  total_broadcasts: number;
  total_customers: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    category: '',
    expiry_date: '',
  });
  const [showSendOffer, setShowSendOffer] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [showSendToCustomers, setShowSendToCustomers] = useState(false);
  const [selectedOfferForCustomers, setSelectedOfferForCustomers] = useState<any>(null);
  const [vendorsWithCustomers, setVendorsWithCustomers] = useState<any[]>([]);
  const [sendingToCustomers, setSendingToCustomers] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh offers every 5 seconds to see vendor acceptances/rejections
    const interval = setInterval(() => {
      refreshOffersOnly();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      // Fetch vendors
      const vendorsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      let vendorCount = 0;
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        console.log('Vendors API Response:', data);
        setVendors(data.data || []);
        vendorCount = data.data?.length || 0;
      } else {
        console.error('Failed to fetch vendors:', vendorsRes.status, vendorsRes.statusText);
      }

      // Fetch offers
      const offersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      let offerCount = 0;
      if (offersRes.ok) {
        const data = await offersRes.json();
        setOffers(data.data || []);
        offerCount = data.data?.length || 0;
      }

      // Fetch broadcasts
      const broadcastsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/broadcast?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      let broadcastCount = 0;
      if (broadcastsRes.ok) {
        const data = await broadcastsRes.json();
        setBroadcasts(data.data || []);
        broadcastCount = data.data?.length || 0;
      }

      // Calculate stats
      setStats({
        total_vendors: vendorCount,
        total_offers: offerCount,
        total_broadcasts: broadcastCount,
        total_customers: 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshOffersOnly = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Fetch only offers to check for updated acceptance status
      const offersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (offersRes.ok) {
        const data = await offersRes.json();
        console.log('📊 Offers refreshed with latest status:', data.data);
        setOffers(data.data || []);
      }
    } catch (err) {
      console.error('Error refreshing offers:', err);
    }
  };

  const handleCreateOffer = async (e: any) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: offerForm.title,
          description: offerForm.description,
          category: offerForm.category,
          expiry_date: new Date(offerForm.expiry_date).toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Offer created:', data);
        alert('✅ Offer created! Now select vendors to send it to.');
        setShowCreateOffer(false);
        setOfferForm({ title: '', description: '', category: '', expiry_date: '' });
        
        // Refresh offers list to show the newly created offer with all stats
        await refreshOffersOnly();
      } else {
        alert('❌ Failed to create offer');
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      alert('Error creating offer');
    }
  };

  const handleSendOffer = async (offerId: string) => {
    setSelectedOfferId(offerId);
    setSelectedVendors([]);
    setShowSendOffer(true);
  };

  const handlePublishOffer = async () => {
    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${selectedOfferId}/publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendorIds: selectedVendors,
          }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Offer published:', data);
        alert(`✅ Offer sent to ${selectedVendors.length} vendors!`);
        
        // Update offer status in the list
        setOffers(
          offers.map((offer: any) =>
            offer.id === selectedOfferId
              ? { ...offer, status: 'published', vendors_selected: selectedVendors.length }
              : offer,
          ),
        );
        
        setShowSendOffer(false);
        setSelectedOfferId('');
        setSelectedVendors([]);
      } else {
        const error = await res.json();
        console.error('Failed to publish offer:', error);
        alert('❌ Failed to send offer');
      }
    } catch (err) {
      console.error('Error sending offer:', err);
      alert('Error sending offer');
    }
  };

  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleSendToCustomers = async (offer: any) => {
    const acceptedVendors = offers
      .filter((o: any) => o.id === offer.id)[0]
      ?.vendors_accepted || 0;

    if (acceptedVendors === 0) {
      alert('❌ No vendors have accepted this offer yet');
      return;
    }

    // Fetch vendor details and customer counts
    try {
      const token = localStorage.getItem('accessToken');
      const offersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offer.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (offersRes.ok) {
        const offerData = await offersRes.json();
        const publishedOffer = offerData.data;

        // Get vendor details and customer counts for vendors who accepted
        const vendorDetails: any[] = [];

        if (publishedOffer.vendors_selected && Array.isArray(publishedOffer.vendors_selected)) {
          for (const vendorId of publishedOffer.vendors_selected) {
            try {
              // Get vendor info
              const vendorRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );

              if (vendorRes.ok) {
                const vendorData = await vendorRes.json();
                const vendor = vendorData.data || vendorData;

                // Get customer count for this vendor
                const customersRes = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/customer/vendor/${vendorId}/customers?page=1&limit=1`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );

                let customerCount = 0;
                if (customersRes.ok) {
                  const customerData = await customersRes.json();
                  customerCount = customerData.pagination?.total || 0;
                }

                vendorDetails.push({
                  id: vendorId,
                  name: vendor.name,
                  customerCount,
                });
              }
            } catch (err) {
              console.error(`Error fetching details for vendor ${vendorId}:`, err);
            }
          }
        }

        setVendorsWithCustomers(vendorDetails);
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err);
    }

    setSelectedOfferForCustomers(offer);
    setShowSendToCustomers(true);
  };

  const confirmSendToCustomers = async () => {
    if (!selectedOfferForCustomers) return;

    setSendingToCustomers(true);
    try {
      const token = localStorage.getItem('accessToken');

      // For each vendor that accepted, send the offer to their customers
      const offer = selectedOfferForCustomers;
      const vendorsThatAccepted = offers
        .filter((o: any) => o.id === offer.id)
        .map((o: any) => o.vendors_accepted || 0)[0];

      // Call endpoint for each vendor
      // First, we need to get the list of vendors who accepted
      const offersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offer.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const offerData = await offersRes.json();
      const publishedOffer = offerData.data;

      // For now, we'll send from the first accepting vendor (or all accepting vendors)
      // The backend endpoint will be: POST /api/offer/:offerId/send-to-customers
      // with vendor ID in the body

      let totalMessagesSent = 0;

      if (publishedOffer.vendors_selected && Array.isArray(publishedOffer.vendors_selected)) {
        for (const vendorId of publishedOffer.vendors_selected) {
          try {
            const sendRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offer.id}/send-to-customers`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ vendorId }),
              }
            );

            if (sendRes.ok) {
              const result = await sendRes.json();
              totalMessagesSent += result.data?.messages_sent || 0;
              console.log(`✅ Sent to customers for vendor ${vendorId}:`, result);
            } else {
              console.error(`Failed to send for vendor ${vendorId}:`, sendRes.status);
            }
          } catch (err) {
            console.error(`Error sending for vendor ${vendorId}:`, err);
          }
        }
      }

      alert(`✅ Offer sent to ${totalMessagesSent} customers via WhatsApp!`);
      setShowSendToCustomers(false);
      setSelectedOfferForCustomers(null);
    } catch (err) {
      console.error('Error sending to customers:', err);
      alert('❌ Failed to send offer to customers');
    } finally {
      setSendingToCustomers(false);
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
        <title>Admin Dashboard - QR Offers</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/admin/products')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  🍽️ Products
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Vendors</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total_vendors}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Offers</p>
                <p className="text-3xl font-bold text-green-600">{stats.total_offers}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Broadcasts</p>
                <p className="text-3xl font-bold text-purple-600">{stats.total_broadcasts}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Customers</p>
                <p className="text-3xl font-bold text-orange-600">{stats.total_customers}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Offer Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!showCreateOffer ? (
            <button
              onClick={() => setShowCreateOffer(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold mb-6"
            >
              + Create New Offer
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Offer</h2>

              <form onSubmit={handleCreateOffer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Offer Title"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g., Salon, Restaurant)"
                    value={offerForm.category}
                    onChange={(e) => setOfferForm({ ...offerForm, category: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <textarea
                  placeholder="Offer Description"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  required
                />

                <input
                  type="date"
                  value={offerForm.expiry_date}
                  onChange={(e) => setOfferForm({ ...offerForm, expiry_date: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Create Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateOffer(false)}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Vendors Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Vendors</h2>

          {vendors.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No vendors yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">City</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vendors.map((vendor: any) => (
                    <tr key={vendor.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{vendor.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vendor.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vendor.city}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          {vendor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Offers Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Offers</h2>

          {offers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No offers yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vendors</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {offers.map((offer: any) => (
                  <tr key={offer.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{offer.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{offer.category}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            offer.status === 'published'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="text-gray-900 font-semibold">Total: {offer.vendors_selected || 0}</div>
                          {offer.status === 'published' && (
                            <>
                              <div className="text-green-600">✅ Accepted: {offer.vendors_accepted || 0}</div>
                              <div className="text-red-600">❌ Rejected: {offer.vendors_rejected || 0}</div>
                              <div className="text-yellow-600">⏳ Pending: {offer.vendors_pending || 0}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {offer.status === 'draft' ? (
                          <button
                            onClick={() => handleSendOffer(offer.id)}
                            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 font-semibold"
                          >
                            📤 Send to Vendors
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendToCustomers(offer)}
                            disabled={!offer.vendors_accepted || offer.vendors_accepted === 0}
                            className={`${
                              offer.vendors_accepted && offer.vendors_accepted > 0
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                            } text-white px-4 py-1 rounded font-semibold`}
                          >
                            📱 Send to Customers ({offer.vendors_accepted || 0})
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Send Offer Modal */}
        {showSendOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Offer to Vendors</h2>

              <div className="mb-6 max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                {vendors.map((vendor: any) => (
                  <div key={vendor.id} className="flex items-center p-4 border-b hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.id)}
                      onChange={() => toggleVendorSelection(vendor.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-600">
                        {vendor.category} • {vendor.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePublishOffer}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  ✅ Send to {selectedVendors.length} Vendor{selectedVendors.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => {
                    setShowSendOffer(false);
                    setSelectedOfferId('');
                    setSelectedVendors([]);
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send to Customers Modal */}
        {showSendToCustomers && selectedOfferForCustomers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send to Customers</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong className="text-lg">{selectedOfferForCustomers.title}</strong>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Will send to all customers of vendors who accepted this offer
                </p>
                <p className="text-sm font-semibold text-green-700 mt-3">
                  ✅ {selectedOfferForCustomers.vendors_accepted || 0} vendor{selectedOfferForCustomers.vendors_accepted !== 1 ? 's' : ''} accepted
                </p>
              </div>

              {/* Vendors List with Customer Counts */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Vendors & Customers</h3>
                {vendorsWithCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {vendorsWithCustomers.map((vendor: any) => (
                      <div key={vendor.id} className="bg-white rounded-lg p-3 flex justify-between items-center border border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-600">Vendor ID: {vendor.id.substring(0, 8)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{vendor.customerCount}</p>
                          <p className="text-xs text-gray-600">customer{vendor.customerCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Loading vendor information...</p>
                )}
              </div>

              {/* Total Customers Summary */}
              {vendorsWithCustomers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Total Customers to Receive Offer:</strong>
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {vendorsWithCustomers.reduce((sum: number, v: any) => sum + v.customerCount, 0)}
                  </p>
                </div>
              )}

              <p className="text-gray-700 mb-6">
                Ready to send <strong>{selectedOfferForCustomers.title}</strong> to all customers via WhatsApp?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={confirmSendToCustomers}
                  disabled={sendingToCustomers}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                >
                  {sendingToCustomers ? '⏳ Sending...' : '📱 Send Now'}
                </button>
                <button
                  onClick={() => {
                    setShowSendToCustomers(false);
                    setSelectedOfferForCustomers(null);
                    setVendorsWithCustomers([]);
                  }}
                  disabled={sendingToCustomers}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}