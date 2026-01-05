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
- `donations.html` contains a demo Stripe Checkout modal that simulates a payment flow locally.
- To add a real Stripe Checkout, you will need a small server endpoint that creates a Checkout Session (using your Stripe secret key) and returns the session id. I can add that server code (Node/Express or serverless function) when you're ready.

## Firebase
- When you're ready to use Firestore, paste your Firebase config object into `scripts.js` (the `firebaseConfig` constant). The site already supports Firestore for comments, messages, and events with a localStorage fallback for testing.

## Design updates (Ligonier-inspired)
- Global styles updated: **Merriweather** for headings and **Inter** for body text (Google Fonts included). Color palette refined to deep navy and warm gold. Buttons and cards were restyled for a professional, consistent look.
- Header and top navigation replaced with a site header (logo + primary nav + Donate CTA). This is now consistent across pages.
- Hero section and card styles updated (improved spacing, image thumbnails, "Newest" badge for latest video).
- Teachings: video catalog uses thumbnails and opens a detail dialog showing the video, description, and comments. There's an **Admin** toggle on the Teachings page to reveal the Add Video form (simple prompt protection).
- Mobile responsive layout and accessibility improvements applied.


