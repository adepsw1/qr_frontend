import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface AcceptedOffer {
  id: string;
  title: string;
  description: string;
  category: string;
  expiry_date: string;
  created_at: string;
  customers_received: number;
  customers_contacted: number;
  customers_list?: any[];
}

interface CustomerDetail {
  id: string;
  phone_number: string;
  name: string;
  opted_in_date: string;
  contacted: boolean;
}

export default function AcceptedOffersPage() {
  const router = useRouter();
  const [acceptedOffers, setAcceptedOffers] = useState<AcceptedOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<AcceptedOffer | null>(null);
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    fetchAcceptedOffers();
  }, []);

  const fetchAcceptedOffers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        window.location.href = '/vendor/login';
        return;
      }

      // Fetch vendor info
      const vendorRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        setVendor(vendorData.data || vendorData);
      }

      // Fetch offers - this will include accepted offers
      const offersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (offersRes.ok) {
        const data = await offersRes.json();
        // Filter for accepted offers (where vendor_status is 'accepted')
        const accepted = (data.data || []).filter((o: any) => o.vendor_status === 'accepted');
        setAcceptedOffers(accepted);
        console.log('✅ Accepted offers loaded:', accepted);
      } else {
        console.error('Failed to fetch offers:', offersRes.status);
      }
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferDetails = async (offerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch offer analytics/details
      const analyticsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offerId}/analytics`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        console.log('Offer analytics:', data);
        
        // Update the selected offer with customer data
        if (selectedOffer) {
          setSelectedOffer({
            ...selectedOffer,
            customers_list: data.data?.customers || [],
          });
        }

        // Set customers list
        setCustomers(data.data?.customers || []);
      }
    } catch (err) {
      console.error('Error fetching offer details:', err);
    }
  };

  const handleSelectOffer = (offer: AcceptedOffer) => {
    setSelectedOffer(offer);
    setCustomers([]);
    fetchOfferDetails(offer.id);
  };

  const handleBack = () => {
    setSelectedOffer(null);
    setCustomers([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">⏳ Loading accepted offers...</p>
      </div>
    );
  }

  // Detail View
  if (selectedOffer) {
    return (
      <>
        <Head>
          <title>{selectedOffer.title} - Offer Details</title>
        </Head>

        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Offer Details</h1>
                <button
                  onClick={handleBack}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  ← Back to List
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Offer Info Card */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-8 text-white mb-8">
              <h2 className="text-4xl font-bold mb-4">{selectedOffer.title}</h2>
              <p className="text-lg text-green-100 mb-6">{selectedOffer.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white bg-opacity-20 rounded-lg p-6">
                <div>
                  <p className="text-sm text-green-100">Category</p>
                  <p className="text-2xl font-bold">{selectedOffer.category}</p>
                </div>
                <div>
                  <p className="text-sm text-green-100">Expires</p>
                  <p className="text-xl font-bold">
                    {new Date(selectedOffer.expiry_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-100">Created</p>
                  <p className="text-xl font-bold">
                    {new Date(selectedOffer.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-100">Status</p>
                  <p className="text-xl font-bold">✅ Accepted</p>
                </div>
              </div>
            </div>

            {/* Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-semibold uppercase">👥 Total Contacts</p>
                <p className="text-5xl font-bold text-blue-600 mt-2">{customers.length}</p>
                <p className="text-gray-600 text-xs mt-2">Customers received this offer</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-semibold uppercase">📞 Responded</p>
                <p className="text-5xl font-bold text-green-600 mt-2">
                  {customers.filter(c => c.contacted).length}
                </p>
                <p className="text-gray-600 text-xs mt-2">Customers who contacted you</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-semibold uppercase">📊 Response Rate</p>
                <p className="text-5xl font-bold text-purple-600 mt-2">
                  {customers.length > 0 
                    ? Math.round((customers.filter(c => c.contacted).length / customers.length) * 100)
                    : 0}%
                </p>
                <p className="text-gray-600 text-xs mt-2">Engagement rate</p>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">📋 Customer Details ({customers.length})</h3>
              </div>

              {customers.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <p>No customer data available yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Opted In Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer, index) => (
                        <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.name || 'Customer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {customer.phone_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(customer.opted_in_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                customer.contacted
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {customer.contacted ? '✅ Contacted' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                const message = `Hi, I have an offer for you!`;
                                window.location.href = `https://wa.me/${customer.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  message,
                                )}`;
                              }}
                              className="text-green-600 hover:text-green-900 font-semibold"
                            >
                              💬 Message
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  const csv = [
                    ['No.', 'Name', 'Phone', 'Opted In Date', 'Status'],
                    ...customers.map((c, i) => [
                      i + 1,
                      c.name || 'Customer',
                      c.phone_number,
                      new Date(c.opted_in_date).toLocaleDateString(),
                      c.contacted ? 'Contacted' : 'Pending',
                    ]),
                  ]
                    .map(row => row.join(','))
                    .join('\n');

                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `customers-${selectedOffer.id}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition"
              >
                📥 Export to CSV
              </button>
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                🖨️ Print
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // List View
  return (
    <>
      <Head>
        <title>Accepted Offers - Vendor Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">✅ Accepted Offers</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/vendor/dashboard')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  ← Dashboard
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}

          {acceptedOffers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-xl text-gray-600 mb-4">📭 No accepted offers yet</p>
              <p className="text-gray-500 mb-6">
                Accept offers from the dashboard to see them here with customer details.
              </p>
              <button
                onClick={() => router.push('/vendor/dashboard')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedOffers.map((offer: any) => (
                <div
                  key={offer.id}
                  onClick={() => handleSelectOffer(offer)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden group"
                >
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2"></div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                      {offer.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{offer.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Category:</span>
                        <span className="text-gray-900 font-semibold">{offer.category}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Expires:</span>
                        <span className="text-gray-900 font-semibold">
                          {new Date(offer.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Status:</span>
                        <span className="text-green-600 font-bold">✅ Accepted</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-center text-blue-600 font-semibold hover:text-blue-800 transition">
                        👉 Click to view customer details →
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
