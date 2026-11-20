// Our stored copy of a project's video. The server signs a short-lived link to it only after checking the
// project belongs to the logged-in user; the browser never sees where the file is kept. Projects without a copy
// (older ones, or one still being copied right after a render) use their render link as before.
import { useEffect, useState } from 'react';

function authHeaders() {
  try {
    const t = typeof localStorage !== 'undefined' ? localStorage.getItem('clevertize_token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

/** { url, expiresInSeconds } for this project's stored video, or null when there is none (or no access). */
export async function storedVideoLink(projectId, { download = false } = {}) {
  if (!projectId) return null;
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/video${download ? '?download=1' : ''}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data && data.url ? data : null;
  } catch {
    return null;
  }
}

/**
 * The src to play a project's video from: a signed link to our copy when the project has one, else its render
 * link. `retry()` fetches a fresh signed link (a player whose link has lapsed calls it once before giving up).
 */
export function useVideoSource(projectId, stored, renderUrl) {
  const [state, setState] = useState({ src: stored ? '' : renderUrl || '', fromStorage: false, tries: 0 });
  useEffect(() => {
    let cancelled = false;
    if (!stored || !projectId) {
      setState({ src: renderUrl || '', fromStorage: false, tries: 0 });
      return undefined;
    }
    setState((s) => ({ ...s, src: '', fromStorage: false }));
    storedVideoLink(projectId).then((link) => {
      if (cancelled) return;
      // no stored copy after all: play the render link
      setState((s) => ({ ...s, src: link ? link.url : renderUrl || '', fromStorage: Boolean(link) }));
    });
    return () => { cancelled = true; };
  }, [projectId, stored, renderUrl, state.tries]);
  const retry = () => {
    if (!stored || state.tries >= 1) return false;
    setState((s) => ({ ...s, tries: s.tries + 1 }));
    return true;
  };
  return { src: state.src, fromStorage: state.fromStorage, retry };
}
