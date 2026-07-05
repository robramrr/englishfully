'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';

interface TeacherAuthGateProps {
  children: React.ReactNode;
}

export default function TeacherAuthGate({ children }: TeacherAuthGateProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/speak-and-submit/auth')
      .then((res) => res.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/speak-and-submit/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Incorrect teacher password.');
        return;
      }

      setAuthenticated(true);
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (authenticated === null) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading teacher access…</ComicText>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <section className="max-w-xl mx-auto py-24 px-4">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={2} className="mb-4 text-[var(--comic-secondary)]">
            🔐 Teacher Access
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
            Enter your teacher password to manage Speak &amp; Submit tasks and view student recordings.
          </ComicText>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full comic-input"
              placeholder="Teacher password"
              autoComplete="current-password"
              required
            />
            {error ? (
              <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
            ) : null}
            <ComicButton type="submit" variant="secondary" size="md" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </ComicButton>
          </form>
        </ComicCard>
      </section>
    );
  }

  return <>{children}</>;
}
