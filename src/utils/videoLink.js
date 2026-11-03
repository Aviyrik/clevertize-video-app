// Magnific video links expire: their token carries "exp=<unix seconds>" (e.g. ?token=exp=1730000000~hmac=…).
// Copies saved to permanent storage carry no such token. Projects made before videos were copied may
// hold an expired link — show that clearly instead of a broken player.

// The link's expiry as a Date, or null when the link carries no expiry
function videoLinkExpiry(url) {
  if (typeof url !== 'string' || !url) return null;
  let text = url;
  try { text = decodeURIComponent(url); } catch {}
  const m = text.match(/(?:^|[?&~=])exp=(\d{9,12})(?=$|[~&#])/);
  return m ? new Date(Number(m[1]) * 1000) : null;
}

function isVideoLinkExpired(url, now = Date.now()) {
  const expiry = videoLinkExpiry(url);
  return Boolean(expiry && expiry.getTime() <= now);
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { videoLinkExpiry, isVideoLinkExpired };
}
