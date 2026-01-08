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
  profile_image?: string;
  store_image?: string;
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
  
  // OTP Redemption states
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  
  // Image upload states
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadType, setUploadType] = useState<'profile' | 'banner' | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleRedeemOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpInput.trim()) {
      setOtpMessage('❌ Please enter an OTP');
      setOtpSuccess(false);
      return;
    }

    try {
      setOtpLoading(true);
      setOtpMessage('');
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            otp: otpInput.trim(),
            vendor_id: vendorId,
          }),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpMessage(`✅ ${data.message || 'OTP redeemed successfully!'}`);
        setOtpSuccess(true);
        setOtpInput('');
        // Refresh stats after redemption
        setTimeout(() => {
          fetchDashboardData();
        }, 1500);
      } else {
        setOtpMessage(`❌ ${data.message || 'Invalid OTP'}`);
        setOtpSuccess(false);
      }
    } catch (err: any) {
      console.error('Error redeeming OTP:', err);
      setOtpMessage(`❌ Error: ${err.message}`);
      setOtpSuccess(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!uploadType) return;

    try {
      setUploadingImage(true);
      setUploadProgress(0);
      
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.floor(percentComplete));
        }
      };
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const token = localStorage.getItem('accessToken');
        const vendorId = localStorage.getItem('vendorId');

        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}/upload-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData: base64String,
              filename: `${uploadType}-${Date.now()}.png`,
              type: uploadType,
            }),
          },
        );

        if (uploadRes.ok) {
          const result = await uploadRes.json();
          
          // Update vendor state with new image
          if (vendor) {
            setVendor({
              ...vendor,
              [uploadType === 'profile' ? 'profile_image' : 'store_image']: result.url,
            });
          }
          
          setUploadProgress(100);
          alert(`✅ ${uploadType === 'profile' ? 'Profile' : 'Banner'} photo uploaded successfully!`);
          setShowImageModal(false);
          setUploadType(null);
          setUploadProgress(0);
        } else {
          const error = await uploadRes.json();
          alert(`❌ Upload failed: ${error.message || 'Unknown error'}`);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert(`❌ Error uploading image: ${err.message}`);
    } finally {
      setUploadingImage(false);
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

      <div className="min-h-screen bg-white">
        {/* Top Bar with Contact Admin */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">{vendor?.name || 'Vendor Dashboard'}</h1>
              <button
                onClick={() => alert('Contact Admin: admin@example.com')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                ☎️ Contact Admin
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Section 1: Banner & Profile Photo */}
          <div className="mb-12">
            <div className="relative mb-8">
              {/* Banner */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
                {vendor?.store_image ? (
                  <button
                    onClick={() => {
                      setUploadType('banner');
                      setShowImageModal(true);
                    }}
                    className="w-full h-full hover:ring-4 hover:ring-blue-400 transition group"
                  >
                    <img 
                      src={vendor.store_image} 
                      alt="Store Banner" 
                      className="w-full h-full object-cover group-hover:opacity-75 transition"
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUploadType('banner');
                      setShowImageModal(true);
                    }}
                    className="text-center text-white hover:scale-105 transition"
                  >
                    <p className="text-lg font-semibold">📸 Click to Add Banner Photo</p>
                  </button>
                )}
              </div>

              {/* Profile Photo - Overlapping Circle - Clickable */}
              <div className="flex justify-center -mt-20 relative z-10 mb-6">
                <button
                  onClick={() => {
                    setUploadType('profile');
                    setShowImageModal(true);
                  }}
                  className="w-40 h-40 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center shadow-lg overflow-hidden hover:ring-4 hover:ring-blue-400 transition group"
                >
                  {vendor?.profile_image ? (
                    <img 
                      src={vendor.profile_image} 
                      alt="Profile" 
                      className="w-full h-full object-cover group-hover:opacity-75 transition"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="text-4xl">👤</p>
                      <p className="text-xs text-gray-600 mt-1">Click to add</p>
                    </div>
                  )}
                </button>
              </div>

              {/* OTP Redemption Form - New Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 max-w-md mx-auto mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">🎟️ Quick OTP Redemption</h3>
                <form onSubmit={handleRedeemOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP Code</label>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit OTP"
                      maxLength={10}
                      className="w-full px-4 py-3 text-center text-lg font-mono border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
                      disabled={otpLoading}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {otpLoading ? '⏳ Processing...' : '✅ Redeem OTP'}
                  </button>

                  {otpMessage && (
                    <div className={`p-3 rounded-lg text-center font-semibold text-sm ${
                      otpSuccess 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {otpMessage}
                    </div>
                  )}

                  <p className="text-xs text-gray-600 text-center mt-3">
                    Customers will receive OTP codes when they participate in your offers
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Section 2: OTP Redemption Window - Removed, only quick form above */}
          {/* All OTP redemption stats moved to /vendor/redemption page */}

          {/* Section 3: Add Products */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🛍️ Product Management</h2>
            <p className="text-gray-600 mb-4">Manage your store products and inventory</p>
            <button
              onClick={() => router.push('/vendor/products')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              + Add Products
            </button>
          </div>

          {/* Section 4: Customer Retention */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Customer Retention</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-3xl font-bold text-orange-600">0</p>
              </div>
              <div className="bg-pink-50 border border-pink-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Returning Customers</p>
                <p className="text-3xl font-bold text-pink-600">0</p>
              </div>
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Total Unique Customers</p>
                <p className="text-3xl font-bold text-red-600">0</p>
              </div>
            </div>
          </div>

          {/* Section 5: Offers Status */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📢 Offers Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Active Offers</p>
                <p className="text-3xl font-bold text-indigo-600">{acceptedOffers.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Pending Offers</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingOffers.length}</p>
              </div>
              <div className="bg-teal-50 border border-teal-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Customers Sent To</p>
                <p className="text-3xl font-bold text-teal-600">{stats?.total_messages_sent || 0}</p>
              </div>
            </div>

            {/* Pending Offers List */}
            {pendingOffers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">⏳ Pending Offers</h3>
                <div className="space-y-3">
                  {pendingOffers.map((offer: any) => (
                    <div key={offer.id} className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{offer.title}</p>
                        <p className="text-sm text-gray-600">{offer.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleRejectOffer(offer.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 6: QR Code Management */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📱 QR Code & QR Link</h2>
            {vendor && vendor.qr_code_url ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-300 rounded-lg p-6 flex flex-col items-center">
                  <img 
                    src={vendor.qr_code_url} 
                    alt="Vendor QR Code" 
                    style={{ width: '200px', height: '200px' }}
                    className="rounded-lg border-2 border-blue-600 mb-4"
                  />
                  <p className="text-sm text-gray-600 text-center mb-3">
                    Scan to view your offers
                  </p>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = vendor.qr_code_url;
                      link.download = `qr-code-${vendor.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition mb-2"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
                  >
                    🖨️ Print
                  </button>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600">Vendor ID</p>
                    <p className="text-lg font-mono font-bold text-gray-900">{vendor.id}</p>
                  </div>
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="text-lg font-bold text-gray-900">{vendor.name}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{vendor.address}, {vendor.city}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-600">QR Code will be generated once your profile is complete</p>
                <button
                  onClick={() => router.push('/vendor/profile')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Complete Profile
                </button>
              </div>
            )}
          </div>

          {/* Section 7: Quick Actions */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <button
                onClick={() => router.push('/vendor/profile')}
                className="bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition"
              >
                ⚙️ Profile
              </button>
              <button
                onClick={() => router.push('/vendor/products')}
                className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                🛍️ Products
              </button>
              <button
                onClick={() => router.push('/vendor/redemption')}
                className="bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                🎫 Redeem
              </button>
              <button
                onClick={() => router.push('/vendor/redemption-scanner')}
                className="bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                📸 Scanner
              </button>
              <button
                onClick={() => router.push('/vendor/redemption-stats')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
              >
                📊 Redemptions
              </button>
            </div>
          </div>

          {/* Section 8: Logout */}
          <div className="flex justify-center mt-12 mb-8">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  localStorage.clear();
                  window.location.href = '/vendor/login';
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm"
            >
              🚪 Logout
            </button>
          </div>

          {/* Image Upload/Management Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📸 {uploadType === 'profile' ? 'Profile' : 'Banner'} Photo
              </h2>
              
              <div className="space-y-3">
                {/* Upload/Update Button */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploadingImage}
                    className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-gray-700 cursor-pointer hover:border-blue-600 transition disabled:opacity-50"
                  />
                </div>

                {uploadingImage && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Uploading...</span>
                      <span className="text-sm font-bold text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                {/* Remove Button - Only show if image exists */}
                {uploadType === 'profile' && vendor?.profile_image && (
                  <button
                    onClick={() => {
                      if (confirm('Remove profile photo?')) {
                        if (vendor) {
                          setVendor({
                            ...vendor,
                            profile_image: undefined,
                          });
                        }
                        setShowImageModal(false);
                        setUploadType(null);
                      }
                    }}
                    disabled={uploadingImage}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    🗑️ Remove
                  </button>
                )}
                {uploadType === 'banner' && vendor?.store_image && (
                  <button
                    onClick={() => {
                      if (confirm('Remove banner photo?')) {
                        if (vendor) {
                          setVendor({
                            ...vendor,
                            store_image: undefined,
                          });
                        }
                        setShowImageModal(false);
                        setUploadType(null);
                      }
                    }}
                    disabled={uploadingImage}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    🗑️ Remove
                  </button>
                )}
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setUploadType(null);
                    setUploadProgress(0);
                  }}
                  disabled={uploadingImage}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-gray-600 text-center mt-4">
                ✅ Select an image to update, or remove the existing one
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}