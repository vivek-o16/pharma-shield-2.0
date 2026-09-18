# Pharma Shield 2.0 — Public Reviews Setup

The UI is ready, but GitHub Pages alone cannot store reviews publicly. For real
cross-user reviews, deploy the review API against your existing Spring Boot +
MongoDB backend.

Required API:
- GET /api/reviews              -> JSON array of public reviews
- POST /api/reviews             -> accepts name, rating, role, review, createdAt
- DELETE /api/admin/reviews/{id}-> removes a review; protect with X-Admin-Key

Then set in `review-system.js`:
`const REVIEW_API_URL = "https://YOUR-API-DOMAIN/api/reviews";`

Admin removal:
- The UI sends `X-Admin-Key`.
- Do not hard-code a secret admin key in public JavaScript.
- The backend must validate the header server-side.
- CORS must allow the GitHub Pages origin.

If REVIEW_API_URL is empty, the site uses a clearly-labelled device-local fallback
for development only. It is NOT a public review database.

Recommended MongoDB document:
{
  "name": "Vivek",
  "rating": 5,
  "role": "Pharmacy Student",
  "review": "Very useful for checking alerts.",
  "createdAt": "2026-09-18T00:00:00.000Z"
}

The review system is intentionally separate from drugAlerts.json.
