// Background clips for the login screen's clip wall.
//
// Stock footage from Coverr (https://coverr.co), picked once through the Coverr API
// and hotlinked from Coverr's CDN. The browser never calls the API and no API key is
// shipped: these are plain CDN links. `src` is Coverr's light 360p preview file, which
// is all a small, dimmed background card needs.
//
// `label` and `meta` describe the kind of ad CleverCut could make for that business;
// they are illustrative, not the clip's real length.

const cdn = (slug) => ({
  src: `https://cdn.coverr.co/videos/${slug}/360p.mp4`,
  poster: `https://cdn.coverr.co/videos/${slug}/thumbnail?width=640`,
});

export const COVERR_URL = 'https://coverr.co';

export const LOGIN_CLIPS = [
  { id: '1hzSvVyXva', label: 'Skincare D2C', meta: 'Launch film · 0:15', ...cdn('user-ai-generation-0IwhHACz2N6l') },
  { id: 'O2znLScMSR', label: 'Electronics', meta: 'Product demo · 0:15', ...cdn('coverr-woman-putting-on-headphones-6468') },
  { id: 'RbSJgHh5Nf', label: 'Real estate', meta: 'Walkthrough · 0:15', ...cdn('user-ai-generation-bIStZ9igaGr5') },
  { id: 'j4QKugY5DI', label: 'Fintech app', meta: 'Explainer · 0:30', ...cdn('coverr-male-hands-typing-on-a-smartphone-3876') },
  { id: 'jNCQ05yWYX', label: 'Jewellery', meta: 'Wedding season · 0:20', ...cdn('coverr-diverse-collection-of-rings-on-display') },
  { id: '8fJofGzq9M', label: 'Fitness studio', meta: 'Membership · 0:30', ...cdn('coverr-man-biking-in-the-gym-2972') },
  { id: 'aO3Auaf5ys', label: 'Coffee chain', meta: 'UGC · 0:30', ...cdn('coverr-coffee-machine-in-action-4632') },
  { id: '5Ic0LgEUgE', label: 'Automobile', meta: 'Festive offer · 0:20', ...cdn('coverr-electric-car-driving-in-the-dark-woods-668') },
  { id: 'NhNS42pYVy', label: 'Agency · Brand film', meta: 'Campaign · 0:30', ...cdn('user-ai-generation-PcuCvB12ZMyg') },
  { id: 'OnngKjBdTk', label: 'Restaurant', meta: 'Menu launch · 0:15', ...cdn('coverr-grilling-meat-on-skewers-2903') },
  { id: 'ivQHnXKOkS', label: 'Fashion retail', meta: 'Sale drop · 0:15', ...cdn('coverr-woman-looking-at-boots-in-the-mirror-9178') },
  { id: 'DtxWNmjQmr', label: 'Hotel & travel', meta: 'Getaway · 0:30', ...cdn('coverr-resort-in-the-philippines-7789') },
];
