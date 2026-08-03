import React from 'react';
import { useCreateReview } from '@workspace/api-client-react';
import logoSrc from '@assets/logo_new_transparent.png';

const WHITE_LOGO = { filter: 'brightness(0) invert(1)' } as const;

export default function ReviewPage() {
  const params = new URLSearchParams(window.location.search);
  const clientId = Number(params.get('clientId'));
  const starsParam = Number(params.get('stars'));

  const [selected, setSelected]   = React.useState<number>(starsParam || 0);
  const [hovered, setHovered]     = React.useState<number>(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError]         = React.useState('');

  const createReview = useCreateReview();

  React.useEffect(() => {
    // If stars came from email link, auto-submit immediately
    if (starsParam >= 1 && starsParam <= 5 && clientId) {
      createReview.mutate(
        { data: { clientId, rating: starsParam } },
        {
          onSuccess: () => setSubmitted(true),
          onError: () => setError('Something went wrong. Please try again.'),
        }
      );
    }
  }, []);

  const handleStarClick = (star: number) => {
    if (submitted || createReview.isPending) return;
    if (!clientId) { setError('Invalid review link.'); return; }
    setSelected(star);
    createReview.mutate(
      { data: { clientId, rating: star } },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setError('Something went wrong. Please try again.'),
      }
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(216,65%,11%)] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <img src={logoSrc} alt="Moysidis Mobile Massage" className="h-20 w-auto object-contain mb-10" style={WHITE_LOGO} draggable={false} onContextMenu={e => e.preventDefault()} />

      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
        {submitted ? (
          <>
            {/* Thank you state */}
            <div className="text-5xl mb-4">🙏</div>
            <h1 className="text-2xl font-bold text-[hsl(216,65%,11%)] mb-3">Thank you!</h1>
            <div className="flex justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(s => (
                <span key={s} className="text-3xl" style={{ color: s <= selected ? '#f59e0b' : '#d1d5db' }}>★</span>
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your feedback means a lot. We look forward to welcoming you again soon.
            </p>
            <p className="text-gray-400 text-xs mt-6">
              Panagiotis Moysidis · Moysidis Mobile Massage
            </p>
          </>
        ) : (
          <>
            {/* Star selection state */}
            <h1 className="text-xl font-bold text-[hsl(216,65%,11%)] mb-2">How was your session?</h1>
            <p className="text-gray-500 text-sm mb-6">Tap a star to leave your rating</p>

            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStarClick(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  disabled={createReview.isPending}
                  className="text-5xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer bg-transparent border-0 p-0 leading-none"
                  style={{ color: s <= (hovered || selected) ? '#f59e0b' : '#d1d5db' }}
                  aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>

            {createReview.isPending && (
              <p className="text-gray-400 text-sm">Saving your review…</p>
            )}

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            <p className="text-gray-400 text-xs mt-6">
              Panagiotis Moysidis · Moysidis Mobile Massage
            </p>
          </>
        )}
      </div>
    </div>
  );
}
