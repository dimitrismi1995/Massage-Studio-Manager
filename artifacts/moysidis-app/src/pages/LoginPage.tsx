import React from 'react';
import { useAuth } from '@/lib/useAuth';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

export default function LoginPage() {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { login, loginPending } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(password);
    } catch {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#deedf8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img
            src={logoSrc}
            alt="Moysidis Mobile Massage"
            className="h-20 w-auto"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#C8DFF2] p-8">
          <h1 className="text-xl font-bold text-[#1A2E4A] text-center mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-center text-[#5B9BD0] mb-6">
            Moysidis Mobile Massage · Admin
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2E4A] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                className="w-full h-11 rounded-lg border border-[#C8DFF2] bg-[#EFF6FC] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B9BD0] focus:ring-offset-1"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loginPending || !password}
              className="w-full h-11 rounded-lg bg-[#5B9BD0] text-white text-sm font-semibold
                         hover:bg-[#4A87BB] active:bg-[#3a70a0] transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4A87BB] mt-6">
          Private access only
        </p>
      </div>
    </div>
  );
}
