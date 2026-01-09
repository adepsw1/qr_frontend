import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function QRRedirectPage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (!token) return;

    const validateAndRoute = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/qr/validate/${token}`;
        console.log('[QR Redirect] Calling API:', apiUrl);
        setDebugInfo(`Validating token: ${token}`);

        // Validate QR token
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();
        console.log('[QR Redirect] Full Response:', { 
          status: res.status, 
          statusText: res.statusText,
          data,
          claimedCheck: res.status === 410 || data.claimed,
          vendorId: data.vendor_id,
          vendorSlug: data.vendor_slug
        });
        setDebugInfo(`API Response: Status ${res.status}, Data: ${JSON.stringify(data)}`);

        // Check if QR is already claimed (410 status means claimed)
        if (res.status === 410 || (data.claimed && data.vendor_id)) {
          // QR is already claimed - redirect directly to vendor's storefront with vendor slug/name
          const vendorSlug = data.vendor_slug || data.vendor_id;
          console.log('✅ QR is claimed, vendor_slug:', vendorSlug, ', vendor_id:', data.vendor_id);
          console.log('🚀 Redirecting to /scan/' + vendorSlug);
          setDebugInfo(`Claimed QR - Redirecting to /scan/${vendorSlug}`);
          router.push(`/scan/${vendorSlug}`);
          return;
        } else if (res.ok && data.valid && !data.claimed) {
          // QR is unclaimed - redirect to registration form
          console.log('📝 QR is unclaimed, redirecting to registration...');
          setDebugInfo(`Unclaimed QR - Redirecting to /vendor/register?token=${token}`);
          router.push(`/vendor/register?token=${token}`);
          return;
        } else {
          // Invalid QR
          console.warn('[QR Redirect] Invalid QR response:', data);
          const errorMsg = data.message || `Invalid QR code (Status: ${res.status})`;
          setError(errorMsg);
          setDebugInfo(`Invalid QR - ${errorMsg}`);
          setTimeout(() => {
            console.log('[QR Redirect] Redirecting to home after error');
            router.push('/');
          }, 3000);
        }
      } catch (err: any) {
        console.error('[QR Redirect] Error validating QR:', err);
        const errorMsg = err.message || 'Error validating QR code';
        setError(errorMsg);
        setDebugInfo(`Error: ${errorMsg}`);
        setTimeout(() => {
          console.log('[QR Redirect] Redirecting to home after error');
          router.push('/');
        }, 3000);
      }
    };

    validateAndRoute();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-block mb-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-white mt-6">
          {error ? '⚠️ Error' : '📱 Validating QR Code...'}
        </h1>
        {error && (
          <p className="text-red-400 mt-4">{error}</p>
        )}
        {!error && (
          <p className="text-indigo-300 mt-4">Please wait, opening vendor storefront...</p>
        )}
        
        {/* Debug Info */}
        <div className="mt-6 p-3 bg-slate-800 rounded text-left text-xs text-slate-400">
          <p className="font-mono">{debugInfo}</p>
          <p className="font-mono mt-2 text-slate-500">Token: {token || 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}
