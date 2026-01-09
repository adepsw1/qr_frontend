import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    qrToken: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [vendorData, setVendorData] = useState<any>(null);
  const [qrTokenValidating, setQrTokenValidating] = useState(false);
  const [qrTokenError, setQrTokenError] = useState('');
  const [qrTokenValid, setQrTokenValid] = useState(false);

  // Check if QR token is in URL and validate it
  useEffect(() => {
    if (router.query.token) {
      const token = router.query.token as string;
      setFormData((prev) => ({
        ...prev,
        qrToken: token,
      }));
      
      // Validate the token immediately
      validateQRTokenByToken(token);
    }
  }, [router.query.token]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateQRTokenByToken = async (token: string) => {
    if (!token.trim()) {
      setQrTokenError('QR Token is required');
      setQrTokenValid(false);
      return;
    }

    setQrTokenValidating(true);
    setQrTokenError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr/validate/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      // Check if QR is already claimed
      if (res.status === 410 && data.claimed) {
        // QR is already claimed - redirect to vendor's storefront
        setQrTokenError(`✅ This QR code belongs to ${data.vendor_name}. Redirecting to their storefront...`);
        setQrTokenValid(false);
        
        // Redirect to vendor's storefront after 2 seconds
        setTimeout(() => {
          router.push(`/scan?vendor=${data.vendor_id}`);
        }, 2000);
        return;
      }

      if (!res.ok) {
        setQrTokenError(data.message || 'Invalid or already claimed QR token');
        setQrTokenValid(false);
      } else {
        setQrTokenError('');
        setQrTokenValid(true);
      }
    } catch (err: any) {
      setQrTokenError('Error validating QR token');
      setQrTokenValid(false);
    } finally {
      setQrTokenValidating(false);
    }
  };

  const validateQRToken = async () => {
    if (!formData.qrToken.trim()) {
      setQrTokenError('QR Token is required');
      setQrTokenValid(false);
      return;
    }

    await validateQRTokenByToken(formData.qrToken);
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate QR Token first
    if (!qrTokenValid) {
      setError('Please validate your QR token first');
      setLoading(false);
      return;
    }

    // Validate all fields are filled
    if (!formData.qrToken.trim() || !formData.businessName.trim() || !formData.email.trim() || 
        !formData.phone.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || 
        !formData.address.trim() || !formData.city.trim() || !formData.category.trim()) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: formData.qrToken,
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          address: formData.address,
          city: formData.city,
          category: formData.category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store vendor ID and access token in localStorage
      if (data.data && data.data.id) {
        localStorage.setItem('vendorId', data.data.id);
        
        // Store access token for auto-login
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
        }
        
        setVendorData(data.data);
      }

      // Display QR code if available
      if (data.data && data.data.qr_code_url) {
        setQrCode(data.data.qr_code_url);
        setSuccess('✅ Registration successful! Welcome to your dashboard!');
        
        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/vendor/dashboard');
        }, 2000);
      } else {
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/vendor/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vendor Registration - QR Offers</title>
        <meta name="description" content="Create a vendor account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-8">
          {/* Display QR Code After Registration */}
          {qrCode ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 text-center mb-4">🎉 Registration Complete!</h1>
              <p className="text-indigo-300 mb-6">Your QR code is ready! Print it or display it in your store.</p>
              
              <div className="bg-slate-800 p-4 rounded-lg border-2 border-violet-500 mb-6 flex justify-center">
                <img src={qrCode} alt="Vendor QR Code" style={{ width: '300px', height: '300px' }} />
              </div>

              <div className="bg-slate-800/50 border border-indigo-500/20 p-4 rounded-lg mb-6">
                <p className="text-sm text-indigo-300"><strong>Vendor ID:</strong> <span className="text-white font-mono">{vendorData?.id}</span></p>
                <p className="text-sm text-indigo-300 mt-2"><strong>Business:</strong> <span className="text-white">{vendorData?.name}</span></p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-indigo-300">Share this QR code in your store so customers can scan it!</p>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  🖨️ Print QR Code
                </button>
                <button
                  onClick={() => router.push('/vendor/dashboard')}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  Go to Dashboard
                </button>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    🏠 Home
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Registration Form */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-2">Vendor Registration</h1>
                <p className="text-indigo-300">Create your business account</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">QR Token <span className="text-red-400">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="qrToken"
                      placeholder="e.g., QR_ABC123XYZ"
                      value={formData.qrToken}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      disabled={loading || qrTokenValidating}
                      required
                    />
                    <button
                      type="button"
                      onClick={validateQRToken}
                      disabled={qrTokenValidating || !formData.qrToken.trim()}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition whitespace-nowrap"
                    >
                      {qrTokenValidating ? '⏳' : qrTokenValid ? '✅ Valid' : 'Validate'}
                    </button>
                  </div>
                  {qrTokenError && <p className="text-red-400 text-xs mt-1">{qrTokenError}</p>}
                  {qrTokenValid && <p className="text-green-400 text-xs mt-1">✓ QR token is valid and ready to use</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail Store</option>
                    <option value="salon">Salon & Spa</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="vendor@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Business Address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    disabled={loading}
                    required
                  />
                </div>

                {error && <div className="p-3 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-500/30">{error}</div>}
                {success && <div className="p-3 bg-green-500/20 text-green-300 rounded-lg text-sm border border-green-500/30">{success}</div>}

                <button
                  type="submit"
                  disabled={loading || !qrTokenValid}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                >
                  {loading ? '⏳ Registering...' : 'Register & Login'}
                </button>
              </form>

              <p className="text-center text-indigo-300 mt-6 text-sm">
                Already have an account?{' '}
                <a href="/vendor/login" className="text-violet-400 hover:text-violet-300 font-semibold transition">
                  Login here
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
