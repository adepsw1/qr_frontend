import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface QRCode {
  id: string;
  qr_token: string;
  token?: string;
  qr_code_image: string;
  qr_image?: string;
  layout: 'layout1' | 'layout2' | 'layout3' | 'layout4' | 'layout5' | 'layout6';
  status: 'unclaimed' | 'claimed';
  vendor_id?: string;
  vendor_name?: string;
  created_at: string;
}

export default function QRManagement() {
  const router = useRouter();
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingCount, setGeneratingCount] = useState('100');
  const [selectedLayout, setSelectedLayout] = useState<'layout1' | 'layout2' | 'layout3' | 'layout4' | 'layout5' | 'layout6'>('layout1');
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('QR Fetch Response:', data); // Debug log
        
        // Handle nested data structure
        let qrArray = [];
        if (data.data) {
          if (Array.isArray(data.data)) {
            qrArray = data.data;
          } else if (data.data.tokens && Array.isArray(data.data.tokens)) {
            qrArray = data.data.tokens;
          }
        } else if (Array.isArray(data)) {
          qrArray = data;
        }

        // Map backend field names to frontend expectations
        const mappedCodes = qrArray.map((qr: any) => ({
          ...qr,
          id: qr.token || qr.id,
          qr_code_image: qr.qr_image || qr.qr_code_image,
          qr_token: qr.token || qr.qr_token,
          created_at: qr.created_at || new Date().toISOString(),
        }));
        
        console.log('Mapped QR Codes:', mappedCodes); // Debug log
        setQRCodes(mappedCodes);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    }
  };

  const generateQRCodes = async () => {
    if (!generatingCount || parseInt(generatingCount) <= 0) {
      setError('Please enter a valid number');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr/generate-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: parseInt(generatingCount),
          layout: selectedLayout,
        }),
      });

      const responseData = await res.json();
      console.log('Generate Response:', responseData); // Debug log
      
      if (res.ok) {
        setSuccess(`✅ Successfully generated ${generatingCount} QR codes with ${selectedLayout} layout`);
        setGeneratingCount('100');
        // Wait a moment then fetch updated list
        setTimeout(() => fetchQRCodes(), 500);
      } else {
        setError(responseData.message || 'Failed to generate QR codes');
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = (qr: QRCode) => {
    const link = document.createElement('a');
    link.href = qr.qr_code_image;
    link.download = `${qr.qr_token}-${qr.layout}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = (qr: QRCode) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      const layoutStyles = getLayoutStyle(qr.layout);
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${qr.qr_token}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              .container {
                ${layoutStyles}
                padding: 40px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
              }
              h1 {
                margin: 0 0 10px 0;
                font-size: 32px;
                font-weight: bold;
              }
              .subtitle {
                font-size: 14px;
                margin-bottom: 25px;
              }
              .qr-container {
                margin: 20px 0;
              }
              img {
                width: 280px;
                height: 280px;
                border-radius: 8px;
              }
              .tagline {
                font-size: 12px;
                margin-top: 15px;
              }
              .branding {
                font-size: 11px;
                margin-top: 10px;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .container { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              ${getLayoutHTML(qr.layout, qr.qr_code_image)}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getLayoutStyle = (layout: string) => {
    const styles: { [key: string]: string } = {
      layout1: 'background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white;',
      layout2: 'background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white;',
      layout3: 'background: white; border: 4px solid #7c3aed; color: #333;',
      layout4: 'background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); color: white;',
      layout5: 'background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;',
      layout6: 'background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: white;',
    };
    return styles[layout] || styles.layout1;
  };

  const getLayoutHTML = (layout: string, qrImage: string) => {
    const layouts: { [key: string]: string } = {
      layout1: `
        <h1 style="color: #fbbf24;">Discount Ka QR</h1>
        <div class="subtitle" style="color: #e0e7ff;">Scan karo, discount lo</div>
        <div class="qr-container">
          <img src="${qrImage}" alt="QR Code" />
        </div>
        <p style="font-weight: bold; color: white; margin: 15px 0;">No app. Sirf scan.</p>
        <div class="branding" style="color: #a5b4fc;">Powered by • XNEX Retail.io</div>
      `,
      layout2: `
        <h1 style="color: #fbbf24;">Discount Ka QR</h1>
        <div class="subtitle" style="color: #d1fae5;">Scan karo, discount lo</div>
        <div class="qr-container">
          <img src="${qrImage}" alt="QR Code" />
        </div>
        <p style="font-weight: bold; color: white; margin: 15px 0;">No app. Sirf scan.</p>
        <div class="branding" style="color: #6ee7b7;">Powered by • XNEX Retail.io</div>
      `,
      layout3: `
        <h1 style="color: #7c3aed;">✨ Get Offers</h1>
        <div class="subtitle" style="color: #ec4899;">Scan to unlock amazing discounts</div>
        <div class="qr-container">
          <img src="${qrImage}" alt="QR Code" />
        </div>
        <p style="font-weight: bold; color: #7c3aed; margin: 15px 0;">📱 Scan with your phone</p>
        <div class="branding" style="color: #999;">Smart Discounts • Easy Access</div>
      `,
      layout4: `
        <h1 style="color: #fef2f2;">🎉 Special Offers</h1>
        <div class="subtitle" style="color: #fee2e2;">Scan karo, save karo</div>
        <div class="qr-container">
          <img src="${qrImage}" alt="QR Code" />
        </div>
        <p style="font-weight: bold; color: white; margin: 15px 0;">Camera se scan karein</p>
        <div class="branding" style="color: #fecaca;">Powered by XNEX Retail.io</div>
      `,
      layout5: `
        <h1 style="color: white;">🏆 Premium Deals</h1>
        <div class="subtitle" style="color: #fef3c7;">Exclusive offers await</div>
        <div class="qr-container">
          <img src="${qrImage}" alt="QR Code" />
        </div>
        <p style="font-weight: bold; color: white; margin: 15px 0;">Scan for amazing deals</p>
        <div class="branding" style="color: #fcd34d;">Your Shopping Destination</div>
      `,
      layout6: `
        <h1 style="color: white;">💫 Exclusive Offers</h1>
        <div class="subtitle" style="color: #f3e8ff;">Unlock your rewards now</div>
        <div class="qr-container">
          <img src="${qrImage}" alt="QR Code" />
        </div>
        <p style="font-weight: bold; color: white; margin: 15px 0;">Point & Save</p>
        <div class="branding" style="color: #e9d5ff;">Join our rewards program</div>
      `,
    };
    return layouts[layout] || layouts.layout1;
  };

  const filteredQRs = qrCodes.filter((qr) => {
    if (filter === 'claimed') return qr.status === 'claimed';
    if (filter === 'unclaimed') return qr.status === 'unclaimed';
    return true;
  });

  const claimedCount = qrCodes.filter((q) => q.status === 'claimed').length;
  const unclaimedCount = qrCodes.filter((q) => q.status === 'unclaimed').length;

  return (
    <>
      <Head>
        <title>QR Code Management | Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">🎫 QR Code Management</h1>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total QR Codes</p>
              <p className="text-3xl font-bold text-indigo-600">{qrCodes.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Claimed</p>
              <p className="text-3xl font-bold text-green-600">{claimedCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Available</p>
              <p className="text-3xl font-bold text-orange-600">{unclaimedCount}</p>
            </div>
          </div>

          {/* Generate Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Generate New QR Codes</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Count Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How many QR codes to generate?
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={generatingCount}
                  onChange={(e) => setGeneratingCount(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  placeholder="100"
                  disabled={generating}
                />
              </div>

              {/* Layout Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Choose Layout Design
                </label>
                <select
                  value={selectedLayout}
                  onChange={(e) => setSelectedLayout(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  disabled={generating}
                >
                  <option value="layout1">💙 Blue Style (Discount Ka QR)</option>
                  <option value="layout2">💚 Green Style (Discount Ka QR)</option>
                  <option value="layout3">💜 Modern Style (Get Offers)</option>
                  <option value="layout4">❤️ Red Style (Special Offers)</option>
                  <option value="layout5">🏆 Gold Style (Premium Deals)</option>
                  <option value="layout6">💫 Purple Style (Exclusive Offers)</option>
                </select>
              </div>
            </div>

            {/* Layout Preview */}
            <div className="mb-6 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
              <p className="text-sm text-gray-600 mb-3">Preview:</p>
              <div className={`p-4 rounded text-center max-w-xs ${getLayoutStyle(selectedLayout)}`}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Layout Preview</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>Your QR will appear here</div>
              </div>
            </div>

            <button
              onClick={generateQRCodes}
              disabled={generating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? '⏳ Generating...' : `✨ Generate ${generatingCount} QR Codes`}
            </button>
          </div>

          {/* Filter */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-600'
              }`}
            >
              All ({qrCodes.length})
            </button>
            <button
              onClick={() => setFilter('claimed')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'claimed'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-green-600'
              }`}
            >
              Claimed ({claimedCount})
            </button>
            <button
              onClick={() => setFilter('unclaimed')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'unclaimed'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-600'
              }`}
            >
              Available ({unclaimedCount})
            </button>
          </div>

          {/* QR Codes Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">QR Token</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Layout</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">QR Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Vendor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQRs.length > 0 ? filteredQRs.map((qr) => (
                    <tr key={qr.qr_token || qr.id} className="border-b hover:bg-indigo-50 transition">
                      <td className="px-6 py-3 font-mono text-sm text-indigo-600 font-semibold">
                        {qr.qr_token || qr.token || 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {qr.layout}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <img src={qr.qr_code_image} alt={qr.qr_token} style={{ width: '60px', height: '60px' }} className="rounded" />
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            qr.status === 'claimed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {qr.status === 'claimed' ? '✓ Claimed' : '○ Available'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {qr.vendor_name ? (
                          <span className="text-gray-700">{qr.vendor_name}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(qr.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => downloadQR(qr)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
                            title="Download QR Code"
                          >
                            📥
                          </button>
                          <button
                            onClick={() => printQR(qr)}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700 transition"
                            title="Print QR Code"
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-gray-500 text-lg">📭 No QR codes generated yet</p>
                        <p className="text-gray-400 text-sm mt-2">Generate some QR codes above to get started!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredQRs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No QR codes found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
