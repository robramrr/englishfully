'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';

interface TeacherAuthGateProps {
  children: React.ReactNode;
  description?: string;
  refreshOnSuccess?: boolean;
}

const DEFAULT_DESCRIPTION =
  'Enter your teacher password to manage Speak & Submit and Listen & Answer tools.';

export default function TeacherAuthGate({
  children,
  description = DEFAULT_DESCRIPTION,
  refreshOnSuccess = false,
}: TeacherAuthGateProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/speak-and-submit/auth')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const ok = Boolean(data.authenticated);
        setAuthenticated(ok);
        if (ok && refreshOnSuccess) router.refresh();
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshOnSuccess, router]);

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
      if (refreshOnSuccess) router.refresh();
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
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faLock} aria-hidden className="h-[0.85em] w-[0.85em]" />
              Teacher Access
            </span>
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-6">{description}</ComicText>
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

  if (refreshOnSuccess) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Opening…</ComicText>
      </div>
    );
  }

  return <>{children}</>;
}
