# gma-website
A website created for my grandmothers use

## Setup notes
- Pages: `index.html`, `teachings.html`, `about.html`, `contact.html`.
- Styles moved into `style.css`, shared JS in `scripts.js`.

## Firebase (optional but recommended)
1. Create a project at https://console.firebase.google.com/
2. Enable **Firestore** (start in test mode for development).
3. Copy your project's config object and replace the placeholders in `scripts.js` (the `firebaseConfig` constant).
4. Open the site locally (e.g., with a simple static server) and test comments and the contact form.

Notes: the site also has a local fallback using `localStorage` so comments and contact messages will work even before you add Firebase credentials.

## Notes
- `img/gma-pfp.jpg` is used as the placeholder photo.
- Teachings are driven from the `videos` array inside `teachings.html` for now; easily extendable.

## Calendly
- The `bookings.html` page includes a Calendly inline widget with a placeholder URL (`https://calendly.com/your-username/30min`). Replace it with your Calendly scheduling link.

## Stripe
- `donations.html` contains a demo Stripe button (links to Stripe). Full Stripe Checkout requires server-side session creation — I can add that when you are ready.

## Firebase
- When you're ready to use Firestore, paste your Firebase config object into `scripts.js` (the `firebaseConfig` constant). The site already supports Firestore for comments, messages, and events with a localStorage fallback for testing.

