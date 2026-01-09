import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function QRValidatePage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const validateAndRoute = async () => {
      try {
        setLoading(true);
        
        // Validate QR token
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr/validate/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();
        console.log('QR Validation Response:', { status: res.status, data });

        // Check if QR is already claimed
        if ((res.status === 410 || data.claimed) && data.vendor_id) {
          // QR is already claimed - redirect directly to vendor's storefront
          console.log('✅ QR is claimed, redirecting to vendor storefront:', data.vendor_id);
          router.push(`/scan/${data.vendor_id}`);
          return;
        } else if (res.ok && data.valid && !data.claimed) {
          // QR is unclaimed - redirect to registration form
          console.log('📝 QR is unclaimed, redirecting to registration...');
          router.push(`/vendor/register?token=${token}`);
          return;
        } else {
          // Invalid QR
          console.warn('Invalid QR response:', data);
          setError(data.message || 'Invalid QR code');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (err: any) {
        console.error('Error validating QR:', err);
        setError('Error validating QR code');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    validateAndRoute();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-white mt-6">
          {error ? '⚠️ Error' : '🔍 Validating QR Code...'}
        </h1>
        {error && (
          <p className="text-red-400 mt-4">{error}</p>
        )}
        {!error && (
          <p className="text-indigo-300 mt-4">Please wait, we're processing your QR code...</p>
        )}
      </div>
    </div>
  );
}
