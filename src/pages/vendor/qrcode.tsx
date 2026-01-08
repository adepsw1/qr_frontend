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
  const [selectedLayout, setSelectedLayout] = useState<'layout1' | 'layout2' | 'layout3' | 'layout4'>('layout1');

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
    
    let htmlContent = '';
    
    if (selectedLayout === 'layout1') {
      // Blue Layout with heading
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
    } else if (selectedLayout === 'layout2') {
      // Green Layout
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
    } else if (selectedLayout === 'layout3') {
      // Modern Purple Layout
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
                body {
                  background: white;
                }
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
    } else if (selectedLayout === 'layout4') {
      // Minimal Red Layout
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

                {/* Layout Selection */}
                <div className="mb-6 bg-white bg-opacity-20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 text-indigo-100">Choose Layout:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedLayout('layout1')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                        selectedLayout === 'layout1'
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-700 text-white hover:bg-indigo-800'
                      }`}
                    >
                      💙 Blue Style
                    </button>
                    <button
                      onClick={() => setSelectedLayout('layout2')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                        selectedLayout === 'layout2'
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-700 text-white hover:bg-indigo-800'
                      }`}
                    >
                      💚 Green Style
                    </button>
                    <button
                      onClick={() => setSelectedLayout('layout3')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                        selectedLayout === 'layout3'
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-700 text-white hover:bg-indigo-800'
                      }`}
                    >
                      💜 Modern Style
                    </button>
                    <button
                      onClick={() => setSelectedLayout('layout4')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                        selectedLayout === 'layout4'
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-700 text-white hover:bg-indigo-800'
                      }`}
                    >
                      ❤️ Red Style
                    </button>
                  </div>
                </div>

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
                    🖨️ Print with Selected Layout
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
