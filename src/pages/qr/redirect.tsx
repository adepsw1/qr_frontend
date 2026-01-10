import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function QRRedirectPage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Helper to safely extract token from query, search params, or legacy path
  const resolveToken = () => {
    if (typeof window === 'undefined') return undefined;
    // 1) Next router query
    if (typeof token === 'string' && token.length > 0) return token;
    // 2) URLSearchParams (?token=...)
    const searchToken = new URLSearchParams(window.location.search).get('token');
    if (searchToken) return searchToken;
    // 3) Legacy path format: /qr/redirect/QR_XXXX
    const parts = window.location.pathname.split('/').filter(Boolean);
    const qrIdx = parts.findIndex(p => p.toLowerCase() === 'qr');
    if (qrIdx >= 0 && parts[qrIdx + 1]?.toLowerCase() === 'redirect' && parts[qrIdx + 2]) {
      return parts[qrIdx + 2];
    }
    return undefined;
  };

  useEffect(() => {
    const resolved = resolveToken();
    if (!resolved) return;

    const validateAndRoute = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/qr/validate/${resolved}`;
        console.log('[QR Redirect] Calling API:', apiUrl);
        setDebugInfo(`Validating token: ${resolved}`);

        // Validate QR token with timeout to avoid infinite loading
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(id);

        const data = await res.json();
        console.log('[QR Redirect] Full Response:', { 
          status: res.status, 
          statusText: res.statusText,
          data,
          adminVerified: data.data?.admin_verified || data.admin_verified,
          vendorSlug: data.data?.vendor_slug || data.vendor_slug
        });
        setDebugInfo(`API Response: Status ${res.status}, Data: ${JSON.stringify(data)}`);

        // PRIORITY 1: Check if admin verified (direct storefront redirect - no checks)
        if (res.ok && (data.data?.admin_verified || data.admin_verified)) {
          const vendorSlug = data.data?.vendor_slug || data.vendor_slug || data.data?.vendor_id || data.vendor_id;
          console.log('✅ ADMIN VERIFIED - Direct redirect to storefront:', vendorSlug);
          setDebugInfo(`Admin Verified - Redirecting to /scan/${vendorSlug}`);
          window.location.replace(`/scan/${vendorSlug}`);
          return;
        }

        // PRIORITY 2: Check if QR is claimed but not verified yet (show pending message)
        if (res.status === 410 || (data.claimed && !data.admin_verified)) {
          const vendorSlug = data.vendor_slug || data.vendor_id;
          console.log('⏳ QR claimed but not verified yet - vendor:', vendorSlug);
          // Avoid showing interstitial; send user to home quickly
          window.location.replace('/');
          return;
        }

        // PRIORITY 3: Unclaimed QR - redirect to registration
        if (res.ok && data.valid && !data.claimed) {
          // QR is unclaimed - redirect to registration form
          console.log('📝 QR is unclaimed, redirecting to registration...');
          setDebugInfo(`Unclaimed QR - Redirecting to /vendor/register?token=${resolved}`);
          window.location.replace(`/vendor/register?token=${resolved}`);
          return;
        } else {
          // Invalid QR or unexpected response
          console.warn('[QR Redirect] Invalid QR response:', data);
          const errorMsg = data.message || `Invalid QR code (Status: ${res.status})`;
          console.warn('[QR Redirect] Redirecting to home after error:', errorMsg);
          window.location.replace('/');
        }
      } catch (err: any) {
        console.error('[QR Redirect] Error validating QR:', err);
        window.location.replace('/');
      }
    };

    validateAndRoute();
  }, [token, router]);

  // Render nothing to avoid any visible interstitial screen; rely on immediate redirect above.
  return null;
}
