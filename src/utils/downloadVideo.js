/**
 * Triggers an authenticated video download by requesting a short-lived,
 * single-purpose download ticket and invoking the browser's native download manager.
 * This prevents leaking long-lived user session tokens into query strings, URLs,
 * browser history, and proxy logs.
 */
import { brandSafeMessage } from './brandSafeText.js';
import { storedVideoLink } from './storedVideo.js';

function clickDownload(href, filename) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

// A project with our stored copy downloads from it (a short-lived signed link the server issues after checking
// ownership); anything else, or a copy that can't be reached, goes through the render-link ticket as before.
export async function downloadVideoWithTicket(videoUrl, filename = 'commercial_video.mp4', { projectId = null, stored = false } = {}) {
  if (stored && projectId) {
    const link = await storedVideoLink(projectId, { download: true });
    if (link) {
      clickDownload(link.url, filename);
      return;
    }
  }
  if (!videoUrl) return;

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('clevertize_token') : null;
  if (!token) {
    alert('Please sign in to download your video.');
    return;
  }

  const res = await fetch('/api/download/ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(brandSafeMessage(data.error, 'Failed to prepare video download.') || 'Failed to prepare video download.');
  }

  const data = await res.json();
  const ticket = data.ticket;
  if (!ticket) {
    throw new Error('No download ticket returned from server.');
  }

  clickDownload(`/api/download?ticket=${encodeURIComponent(ticket)}`, filename);
}
