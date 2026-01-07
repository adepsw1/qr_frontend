import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function VendorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          userType: 'vendor',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('userType', 'vendor');
      localStorage.setItem('vendorId', data.data.userId);

      router.push('/vendor/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vendor Login - QR Offers</title>
        <meta name="description" content="Login to your vendor dashboard" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-2">Vendor Login</h1>
            <p className="text-indigo-300">Access your offer dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Email</label>
              <input
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                disabled={loading}
                required
              />
            </div>

            {error && <div className="p-3 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-500/30">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition"
            >
              {loading ? '⏳ Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-indigo-300 mt-6 text-sm">
            Don't have an account?{' '}
            <a href="/vendor/register" className="text-violet-400 hover:text-violet-300 font-semibold transition">
              Register here
            </a>
          </p>

          <div className="flex gap-2 mt-6 pt-4 border-t border-indigo-500/20">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition text-sm"
            >
              🏠 Home
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-semibold transition text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
