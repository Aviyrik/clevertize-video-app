/**
 * Triggers an authenticated video download by requesting a short-lived,
 * single-purpose download ticket and invoking the browser's native download manager.
 * This prevents leaking long-lived user session tokens into query strings, URLs,
 * browser history, and proxy logs.
 */
export async function downloadVideoWithTicket(videoUrl, filename = 'commercial_video.mp4') {
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
    throw new Error(data.error || 'Failed to prepare video download.');
  }

  const data = await res.json();
  const ticket = data.ticket;
  if (!ticket) {
    throw new Error('No download ticket returned from server.');
  }

  const downloadUrl = `/api/download?ticket=${encodeURIComponent(ticket)}`;
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
