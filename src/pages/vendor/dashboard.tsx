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
  const [otpData, setOtpData] = useState<any>(null);
  
  // Image upload states
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadType, setUploadType] = useState<'profile' | 'banner' | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Contact Admin modal state
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  
  // QR Layout modal state
  const [showQRLayouts, setShowQRLayouts] = useState(false);
  const [selectedQRLayout, setSelectedQRLayout] = useState<'layout1' | 'layout2' | 'layout3' | 'layout4'>('layout1');

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
      setOtpData(null);
      return;
    }

    try {
      setOtpLoading(true);
      setOtpMessage('');
      setOtpData(null);
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/verify-otp-for-vendor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            otp: otpInput.trim(),
            vendorId: vendorId,
          }),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpData(data.data);
        setOtpMessage(`✅ OTP Validated Successfully!`);
        setOtpSuccess(true);
        // Don't clear input yet, keep for reference
      } else {
        setOtpMessage(`❌ ${data.message || 'Invalid OTP'}`);
        setOtpSuccess(false);
        setOtpData(null);
      }
    } catch (err: any) {
      console.error('Error redeeming OTP:', err);
      setOtpMessage(`❌ Error: ${err.message}`);
      setOtpSuccess(false);
      setOtpData(null);
    } finally {
      setOtpLoading(false);
    }
  };

  const printQRLayout = (layout: 'layout1' | 'layout2' | 'layout3' | 'layout4') => {
    if (!vendor?.qr_code_url) {
      alert('QR code not available');
      return;
    }

    let htmlContent = '';
    
    if (layout === 'layout1') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${vendor.name} - QR Code</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                padding: 50px;
                border-radius: 10px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
                color: white;
              }
              h1 {
                color: #fbbf24;
                margin: 0 0 10px 0;
                font-size: 36px;
                font-weight: bold;
              }
              .subtitle {
                font-size: 18px;
                color: #e0e7ff;
                margin-bottom: 30px;
                font-style: italic;
              }
              img {
                width: 350px;
                height: 350px;
                background: white;
                border: 8px solid white;
                border-radius: 10px;
                margin: 30px 0;
              }
              .instructions {
                font-size: 16px;
                color: white;
                margin-top: 20px;
                font-weight: bold;
              }
              .tagline {
                font-size: 14px;
                color: #e0e7ff;
                margin-top: 15px;
              }
              .branding {
                font-size: 12px;
                color: #a5b4fc;
                margin-top: 20px;
              }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Discount Ka QR</h1>
              <div class="subtitle">Scan karo, discount lo</div>
              <img src="${vendor.qr_code_url}" alt="QR Code" />
              <p class="instructions">No app. Sirf scan.</p>
              <div class="tagline">${vendor.name}</div>
              <div class="branding">Powered by • XNEX Retail.io</div>
            </div>
          </body>
        </html>
      `;
    } else if (layout === 'layout2') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${vendor.name} - QR Code</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: linear-gradient(135deg, #065f46 0%, #047857 100%);
                padding: 50px;
                border-radius: 10px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
                color: white;
              }
              h1 {
                color: #fbbf24;
                margin: 0 0 10px 0;
                font-size: 36px;
                font-weight: bold;
              }
              .subtitle {
                font-size: 18px;
                color: #d1fae5;
                margin-bottom: 30px;
                font-style: italic;
              }
              img {
                width: 350px;
                height: 350px;
                background: white;
                border: 8px solid white;
                border-radius: 10px;
                margin: 30px 0;
              }
              .instructions {
                font-size: 16px;
                color: white;
                margin-top: 20px;
                font-weight: bold;
              }
              .tagline {
                font-size: 14px;
                color: #d1fae5;
                margin-top: 15px;
              }
              .branding {
                font-size: 12px;
                color: #6ee7b7;
                margin-top: 20px;
              }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Discount Ka QR</h1>
              <div class="subtitle">Scan karo, discount lo</div>
              <img src="${vendor.qr_code_url}" alt="QR Code" />
              <p class="instructions">No app. Sirf scan.</p>
              <div class="tagline">${vendor.name}</div>
              <div class="branding">Powered by • XNEX Retail.io</div>
            </div>
          </body>
        </html>
      `;
    } else if (layout === 'layout3') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${vendor.name} - QR Code</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
              }
              .container {
                background: white;
                padding: 50px;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              h1 {
                color: #7c3aed;
                margin: 0 0 5px 0;
                font-size: 32px;
                font-weight: bold;
              }
              .subtitle {
                font-size: 16px;
                color: #ec4899;
                margin-bottom: 30px;
                font-weight: 600;
              }
              img {
                width: 350px;
                height: 350px;
                border: 6px solid #7c3aed;
                border-radius: 15px;
                margin: 30px 0;
              }
              .instructions {
                font-size: 18px;
                color: #7c3aed;
                margin-top: 20px;
                font-weight: bold;
              }
              .tagline {
                font-size: 14px;
                color: #666;
                margin-top: 15px;
              }
              .branding {
                font-size: 12px;
                color: #999;
                margin-top: 20px;
              }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✨ Get Offers</h1>
              <div class="subtitle">Scan to unlock amazing discounts</div>
              <img src="${vendor.qr_code_url}" alt="QR Code" />
              <p class="instructions">📱 Scan with your phone</p>
              <div class="tagline">${vendor.name}</div>
              <div class="branding">Smart Discounts • Easy Access</div>
            </div>
          </body>
        </html>
      `;
    } else if (layout === 'layout4') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${vendor.name} - QR Code</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
                padding: 50px;
                border-radius: 10px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
                color: white;
              }
              h1 {
                color: #fef2f2;
                margin: 0 0 10px 0;
                font-size: 36px;
                font-weight: bold;
              }
              .subtitle {
                font-size: 18px;
                color: #fee2e2;
                margin-bottom: 30px;
                font-style: italic;
              }
              img {
                width: 350px;
                height: 350px;
                background: white;
                border: 8px solid white;
                border-radius: 10px;
                margin: 30px 0;
              }
              .instructions {
                font-size: 16px;
                color: white;
                margin-top: 20px;
                font-weight: bold;
              }
              .tagline {
                font-size: 14px;
                color: #fee2e2;
                margin-top: 15px;
              }
              .branding {
                font-size: 12px;
                color: #fecaca;
                margin-top: 20px;
              }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎉 Special Offers</h1>
              <div class="subtitle">Scan karo, save karo</div>
              <img src="${vendor.qr_code_url}" alt="QR Code" />
              <p class="instructions">Camera se scan karein</p>
              <div class="tagline">${vendor.name}</div>
              <div class="branding">Powered by XNEX Retail.io</div>
            </div>
          </body>
        </html>
      `;
    }

    const printWindow = window.open('', '', 'width=600,height=700');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
    setShowQRLayouts(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!uploadType) return;

    try {
      setUploadingImage(true);
      setUploadProgress(5);
      console.log('🔄 Starting upload for file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
      
      // Compress image first (0-30% progress)
      setUploadProgress(10);
      console.log('🖼️ Compressing image...');
      
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize if larger than 1200px
            if (width > 1200 || height > 1200) {
              const scale = Math.min(1200 / width, 1200 / height);
              width = Math.floor(width * scale);
              height = Math.floor(height * scale);
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Compress with quality 0.7-0.8
              const compressed = canvas.toDataURL('image/jpeg', 0.75);
              setUploadProgress(30);
              console.log('✅ Image compressed. Original:', (file.size / 1024).toFixed(1), 'KB');
              resolve(compressed);
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      setUploadProgress(40);
      console.log('📤 Uploading to server...');
      
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
            imageData: compressedBase64,
            fileName: `${uploadType}-${Date.now()}.jpg`,
            type: uploadType,
          }),
        },
      );

      setUploadProgress(85);
      
      if (uploadRes.ok) {
        const result = await uploadRes.json();
        console.log('🎉 Upload successful:', result);
        
        // Update vendor state with new image
        if (vendor) {
          setVendor({
            ...vendor,
            [uploadType === 'profile' ? 'profile_image' : 'store_image']: result.data?.imageUrl || result.url,
          });
        }
        
        setUploadProgress(100);
        // Keep modal open for 1 second to show 100% completion
        setTimeout(() => {
          alert(`✅ ${uploadType === 'profile' ? 'Profile' : 'Banner'} photo uploaded successfully!`);
          setShowImageModal(false);
          setUploadType(null);
          setUploadProgress(0);
          setUploadingImage(false);
        }, 1000);
      } else {
        const error = await uploadRes.json();
        console.error('❌ Upload failed:', error);
        alert(`❌ Upload failed: ${error.message || 'Unknown error'}`);
        setUploadingImage(false);
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert(`❌ Error uploading image: ${err.message}`);
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
                onClick={() => setShowContactAdmin(true)}
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
                    className="w-full h-full hover:ring-4 hover:ring-blue-400 transition group relative"
                  >
                    <img 
                      src={vendor.store_image} 
                      alt="Store Banner" 
                      className="w-full h-full object-cover group-hover:opacity-75 transition"
                    />
                    {uploadType === 'banner' && uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <div className="w-2/3 bg-gray-300 rounded-full h-2 mb-3">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-white font-bold text-lg">{uploadProgress}%</p>
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUploadType('banner');
                      setShowImageModal(true);
                    }}
                    className="text-center text-white hover:scale-105 transition relative w-full h-full flex items-center justify-center"
                  >
                    <p className="text-lg font-semibold">📸 Click to Add Banner Photo</p>
                    {uploadType === 'banner' && uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-xl">
                        <div className="w-2/3 bg-gray-300 rounded-full h-2 mb-3">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-white font-bold text-lg">{uploadProgress}%</p>
                      </div>
                    )}
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
                  className="w-40 h-40 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center shadow-lg overflow-hidden hover:ring-4 hover:ring-blue-400 transition group relative"
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
                  {uploadType === 'profile' && uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex flex-col items-center justify-center">
                      <div className="w-3/4 bg-gray-300 rounded-full h-2 mb-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-white font-bold text-sm">{uploadProgress}%</p>
                    </div>
                  )}
                </button>
              </div>

              {/* OTP Redemption Form - New Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 max-w-2xl mx-auto mb-8">
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
                    {otpLoading ? '⏳ Processing...' : '✅ Verify OTP'}
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

                  {/* Show Customer & Offer Details After Validation */}
                  {otpSuccess && otpData && (
                    <div className="mt-6 bg-white border-2 border-green-300 rounded-lg p-5 space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">📋 Customer & Offer Details</h4>
                      
                      {/* Customer Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-semibold uppercase">Customer Name</p>
                          <p className="text-lg font-bold text-blue-700">{otpData.customerName}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-semibold uppercase">Phone Number</p>
                          <p className="text-lg font-bold text-blue-700">{otpData.phoneNumber}</p>
                        </div>
                      </div>

                      {/* Offer Details */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Offer</p>
                        <p className="text-lg font-bold text-purple-700 mb-2">{otpData.offerTitle}</p>
                        <p className="text-sm text-gray-700">{otpData.offerDescription}</p>
                      </div>

                      {/* Confirm Redemption Button */}
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('accessToken');
                            const vendorId = localStorage.getItem('vendorId');
                            
                            const confirmRes = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/api/redemption/confirm`,
                              {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  redemptionId: otpData.redemptionId,
                                  vendorId: vendorId,
                                }),
                              },
                            );

                            const confirmData = await confirmRes.json();
                            if (confirmRes.ok) {
                              alert(`✅ ${confirmData.message}\nRedeemed: ${confirmData.offerTitle}`);
                              setOtpInput('');
                              setOtpData(null);
                              setOtpMessage('');
                              setOtpSuccess(false);
                              fetchDashboardData();
                            } else {
                              alert(`❌ ${confirmData.message}`);
                            }
                          } catch (err: any) {
                            alert(`❌ Error: ${err.message}`);
                          }
                        }}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition text-lg"
                      >
                        ✓ Confirm Redemption
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 text-center mt-3">
                    Customers receive OTP codes when they participate in your offers
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
                onClick={() => setShowQRLayouts(true)}
                className="bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                🎨 Design QR
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
          <div className="flex justify-center mt-6 mb-8">
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
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📸 {uploadType === 'profile' ? 'Profile' : 'Banner'} Photo
              </h2>
              
              {!uploadingImage ? (
                <div className="space-y-4">
                  {/* Upload/Update Button */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Image to Upload:</label>
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
                      className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-gray-700 cursor-pointer hover:border-blue-600 transition"
                    />
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
              ) : (
                <div className="py-8">
                  <div className="mb-6 text-center">
                    <p className="text-lg font-bold text-gray-900 mb-2">Uploading {uploadType === 'profile' ? 'Profile' : 'Banner'} Photo...</p>
                    <p className="text-sm text-gray-600">Please wait while we upload your image</p>
                  </div>

                  {/* Large Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress > 10 && (
                          <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Large Percentage Display */}
                  <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-blue-600">{uploadProgress}%</p>
                    <p className="text-gray-600 text-sm mt-2">Upload in progress...</p>
                  </div>

                  {/* Animated Dots */}
                  <div className="text-center">
                    <div className="inline-block">
                      <span className="text-2xl text-gray-400">
                        <span className="inline-block animate-bounce" style={{animationDelay: '0s'}}>●</span>
                        <span className="inline-block animate-bounce mx-1" style={{animationDelay: '0.2s'}}>●</span>
                        <span className="inline-block animate-bounce" style={{animationDelay: '0.4s'}}>●</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* QR Code Layouts Modal */}
        {showQRLayouts && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-6xl overflow-hidden my-4 sm:my-8">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg sm:text-2xl font-bold">🎨 Choose Your QR Code Design</h3>
                  <button
                    onClick={() => setShowQRLayouts(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 text-xl sm:text-2xl flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-3 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6 mb-6">
                  {/* Layout 1 - Blue */}
                  <div 
                    onClick={() => setSelectedQRLayout('layout1')}
                    className={`cursor-pointer p-3 sm:p-4 rounded-lg border-4 transition ${
                      selectedQRLayout === 'layout1' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-indigo-400'
                    }`}
                  >
                    <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-4 sm:p-6 text-white text-center mb-3 h-40 sm:h-48 flex flex-col justify-center items-center">
                      <h4 className="text-base sm:text-xl font-bold text-yellow-400">Discount Ka QR</h4>
                      <p className="text-xs sm:text-sm italic text-blue-100">Scan karo, discount lo</p>
                      <div className="mt-3 bg-white p-2 rounded">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 mx-auto"></div>
                      </div>
                      <p className="text-xs sm:text-sm mt-3 text-white font-bold">No app. Sirf scan.</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        printQRLayout('layout1');
                      }}
                      className="w-full bg-blue-600 text-white py-2 sm:py-2 px-2 rounded-lg font-semibold hover:bg-blue-700 text-xs sm:text-sm"
                    >
                      💙 Print Blue Design
                    </button>
                  </div>

                  {/* Layout 2 - Green */}
                  <div 
                    onClick={() => setSelectedQRLayout('layout2')}
                    className={`cursor-pointer p-3 sm:p-4 rounded-lg border-4 transition ${
                      selectedQRLayout === 'layout2' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-indigo-400'
                    }`}
                  >
                    <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-4 sm:p-6 text-white text-center mb-3 h-40 sm:h-48 flex flex-col justify-center items-center">
                      <h4 className="text-base sm:text-xl font-bold text-yellow-400">Discount Ka QR</h4>
                      <p className="text-xs sm:text-sm italic text-green-100">Scan karo, discount lo</p>
                      <div className="mt-3 bg-white p-2 rounded">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 mx-auto"></div>
                      </div>
                      <p className="text-xs sm:text-sm mt-3 text-white font-bold">No app. Sirf scan.</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        printQRLayout('layout2');
                      }}
                      className="w-full bg-green-600 text-white py-2 sm:py-2 px-2 rounded-lg font-semibold hover:bg-green-700 text-xs sm:text-sm"
                    >
                      💚 Print Green Design
                    </button>
                  </div>

                  {/* Layout 3 - Modern Purple */}
                  <div 
                    onClick={() => setSelectedQRLayout('layout3')}
                    className={`cursor-pointer p-3 sm:p-4 rounded-lg border-4 transition ${
                      selectedQRLayout === 'layout3' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-indigo-400'
                    }`}
                  >
                    <div className="bg-white border-4 border-purple-600 rounded-lg p-4 sm:p-6 text-center mb-3 h-40 sm:h-48 flex flex-col justify-center items-center">
                      <h4 className="text-base sm:text-xl font-bold text-purple-600">✨ Get Offers</h4>
                      <p className="text-xs sm:text-sm font-semibold text-purple-500">Scan to unlock amazing discounts</p>
                      <div className="mt-3 bg-gray-200 p-2 rounded">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-400 mx-auto"></div>
                      </div>
                      <p className="text-xs sm:text-sm mt-3 text-purple-600 font-bold">📱 Scan with your phone</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        printQRLayout('layout3');
                      }}
                      className="w-full bg-purple-600 text-white py-2 sm:py-2 px-2 rounded-lg font-semibold hover:bg-purple-700 text-xs sm:text-sm"
                    >
                      💜 Print Modern Design
                    </button>
                  </div>

                  {/* Layout 4 - Red */}
                  <div 
                    onClick={() => setSelectedQRLayout('layout4')}
                    className={`cursor-pointer p-3 sm:p-4 rounded-lg border-4 transition ${
                      selectedQRLayout === 'layout4' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-indigo-400'
                    }`}
                  >
                    <div className="bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-4 sm:p-6 text-white text-center mb-3 h-40 sm:h-48 flex flex-col justify-center items-center">
                      <h4 className="text-base sm:text-xl font-bold text-yellow-200">🎉 Special Offers</h4>
                      <p className="text-xs sm:text-sm italic text-red-100">Scan karo, save karo</p>
                      <div className="mt-3 bg-white p-2 rounded">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 mx-auto"></div>
                      </div>
                      <p className="text-xs sm:text-sm mt-3 text-white font-bold">Camera se scan karein</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        printQRLayout('layout4');
                      }}
                      className="w-full bg-red-600 text-white py-2 sm:py-2 px-2 rounded-lg font-semibold hover:bg-red-700 text-xs sm:text-sm"
                    >
                      ❤️ Print Red Design
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end border-t pt-4">
                  <button
                    onClick={() => setShowQRLayouts(false)}
                    className="px-4 sm:px-6 py-2 bg-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-400 text-xs sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Admin Modal */}
        {showContactAdmin && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Contact Admin</h3>
                  <button
                    onClick={() => setShowContactAdmin(false)}
                    className="text-indigo-400 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* WhatsApp Button */}
                  <button
                    onClick={() => {
                      window.open(`https://wa.me/+919545105125?text=Hi`, '_blank');
                      setShowContactAdmin(false);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">💬</span>
                    <div className="text-left">
                      <div>WhatsApp Us</div>
                      <div className="text-xs opacity-90">+91 9545105125</div>
                    </div>
                  </button>

                  {/* Email Button */}
                  <button
                    onClick={() => {
                      window.location.href = 'mailto:contact@xnex.io?subject=Contact from QR Offer&body=Hi, I would like to get in touch.';
                      setShowContactAdmin(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">✉️</span>
                    <div className="text-left">
                      <div>Email Us</div>
                      <div className="text-xs opacity-90">contact@xnex.io</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}