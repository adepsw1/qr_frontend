import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  category: string;
  city: string;
  address: string;
  qr_code_url: string;
  created_at?: string;
}

export default function VendorQRCodePage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        router.push('/vendor/login');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setVendor(data.data || data);
      } else {
        setError('Failed to load vendor data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!vendor?.qr_code_url) return;
    
    const link = document.createElement('a');
    link.href = vendor.qr_code_url;
    link.download = `${vendor.name.replace(/\s+/g, '-')}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyQRLink = () => {
    const qrLink = `${window.location.origin}/scan/${vendor?.id}`;
    navigator.clipboard.writeText(qrLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRCodeDataUrl = async () => {
    // This creates a printable view with the QR code
    if (!vendor?.qr_code_url) return;
    
    const printWindow = window.open('', '', 'width=600,height=700');
    if (printWindow) {
      printWindow.document.write(`
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
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
              h1 {
                color: #4f46e5;
                margin: 0 0 10px 0;
                font-size: 24px;
              }
              .details {
                font-size: 14px;
                color: #666;
                margin-bottom: 20px;
              }
              img {
                width: 300px;
                height: 300px;
                border: 3px solid #4f46e5;
                border-radius: 10px;
                margin: 20px 0;
              }
              .instructions {
                font-size: 12px;
                color: #999;
                margin-top: 20px;
                font-style: italic;
              }
              @media print {
                body {
                  background: white;
                }
                .container {
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${vendor.name}</h1>
              <div class="details">
                <p>${vendor.address}</p>
                <p>📞 ${vendor.phone_number}</p>
              </div>
              <img src="${vendor.qr_code_url}" alt="QR Code" />
              <p style="font-weight: bold; color: #333; margin: 20px 0;">Scan to view our offers!</p>
              <div class="instructions">
                Print this page and display in your store
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">⏳ Loading QR code...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">❌ {error || 'Failed to load QR code'}</p>
          <button
            onClick={() => router.push('/vendor/dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{vendor.name} - QR Code | QR Offers</title>
        <meta name="description" content={`${vendor.name} QR Code for customer offers`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📱 My QR Code</h1>
                <p className="text-gray-600 mt-2">{vendor.name}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => router.push('/vendor/dashboard')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your QR Code</h2>
                <p className="text-gray-600 text-sm">Display this in your store</p>
              </div>

              {vendor.qr_code_url && (
                <div className="bg-indigo-50 p-6 rounded-lg border-4 border-indigo-600 mb-6">
                  <img
                    src={vendor.qr_code_url}
                    alt="Vendor QR Code"
                    style={{ width: '280px', height: '280px' }}
                    className="rounded-lg"
                  />
                </div>
              )}

              <p className="text-center text-gray-600 text-sm mb-6 max-w-xs">
                Customers can scan this QR code with their phone camera to view your offers
              </p>

              <div className="text-center bg-blue-50 p-4 rounded-lg w-full">
                <p className="text-xs text-gray-600 mb-2">Scan URL</p>
                <p className="text-sm font-mono text-blue-600 break-all mb-3">
                  {window.location.origin}/scan/{vendor.id}
                </p>
                <button
                  onClick={copyQRLink}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
              </div>
            </div>

            {/* Vendor Info & Actions */}
            <div className="space-y-6">
              {/* Business Info Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Business Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="text-lg font-semibold text-gray-900">{vendor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{vendor.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-semibold text-gray-900">{vendor.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-lg font-semibold text-gray-900">{vendor.address}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">Vendor ID</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{vendor.id}</p>
                  </div>
                </div>
              </div>

              {/* Download & Print Options */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">🎯 Share Your QR Code</h3>
                <p className="text-indigo-100 mb-6">
                  Download or print your QR code to display in your store, on social media, or in promotional materials.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={downloadQRCode}
                    className="w-full bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                  >
                    📥 Download QR Code
                  </button>
                  <button
                    onClick={generateQRCodeDataUrl}
                    className="w-full bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition flex items-center justify-center gap-2"
                  >
                    🖨️ Print QR Code
                  </button>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-green-50 rounded-lg shadow-lg p-6 border-l-4 border-green-600">
                <h3 className="text-lg font-bold text-green-900 mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>✓ Print and laminate for durability</li>
                  <li>✓ Place near checkout counter</li>
                  <li>✓ Share on social media</li>
                  <li>✓ Include in email signatures</li>
                  <li>✓ Display on storefront windows</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .max-w-6xl {
            max-width: 100%;
          }
          button, .max-w-6xl > div:nth-child(n+2) {
            display: none;
          }
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
