import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function OfferPage() {
  const router = useRouter();
  const { vendorId } = router.query;

  useEffect(() => {
    if (vendorId) {
      // Redirect to the new scan page
      router.replace(`/scan/${vendorId}`);
    }
  }, [vendorId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin mb-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
        </div>
        <p className="text-indigo-300">Redirecting to vendor page...</p>
      </div>
    </div>
  );
}
