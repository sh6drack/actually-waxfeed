# WaxFeed Budget Breakdown - Explained

## Infrastructure (Google Cloud)

### Cloud Run (Hosting) - $570/6mo
This is where the actual WaxFeed website lives. Cloud Run is a serverless platform that runs our Next.js application. It automatically scales up when more users visit and scales down when traffic is low, so we only pay for what we use. The specs (2 vCPU, 4GB RAM) can handle thousands of concurrent users.

### Cloud SQL (Database) - $594/6mo
This is our PostgreSQL database where all user data is stored - accounts, reviews, ratings, friend lists, etc. It includes automatic daily backups so we never lose data. The database is managed by Google, meaning they handle security patches, updates, and maintenance.

### Cloud Storage + CDN - $276/6mo
Cloud Storage holds user-uploaded images (profile pictures, etc.) and cached album artwork. The CDN (Content Delivery Network) distributes these files across servers worldwide so images load fast regardless of where users are located.

---

## Domain

### Domain Registration - $15/6mo
This is the waxfeed.com (or whatever domain) web address. Annual cost prorated for 6 months. SSL certificate (the https:// security lock) is included free with Google Cloud.

---

## Services

### Email (SendGrid) - $90/6mo
Transactional email service for password resets, email verification, and notifications. Without this, users can't recover their accounts if they forget their password.

### Metadata API Reserve - $1,500/6mo
This is a buffer based on Lars's contact's advice. Right now we use Spotify's free API for album/artist data, but Spotify discourages third-party apps from pulling their metadata. If they restrict our access, we'd need to switch to a licensed provider like 7digital or Tuned Global (~$250/month). This reserve ensures we're covered if that happens.

---

## Mobile App Stores

### Apple Developer Program - $99/year
Required to publish WaxFeed on the iOS App Store. Apple charges this annually - no way around it.

### Google Play Developer - $25 one-time
One-time fee to publish on the Google Play Store for Android. Unlike Apple, this is a lifetime registration.

---

## Operations

### Error Monitoring (Sentry) - $156/6mo
Sentry catches bugs and crashes in real-time and alerts us. When something breaks, we see exactly what happened, which user was affected, and the full error details. Essential for maintaining a stable app.

### Scaling Buffer - $780/6mo
Reserve fund for unexpected costs: traffic spikes (if we go viral), database growth faster than expected, or emergency fixes. Better to have it and not need it than need it and not have it.

---

## Free Services (No Cost)

- **Spotify API**: Album metadata, artist info, search - free tier
- **LRCLIB**: Song lyrics - free
- **Google OAuth**: Sign in with Google - free
- **SSL Certificate**: HTTPS encryption - included with GCP

---

## Summary

| Category | 6-Month Cost |
|----------|--------------|
| Infrastructure | $1,440 |
| Domain | $15 |
| Services | $1,590 |
| Mobile App Stores | $124 |
| Operations | $936 |
| **TOTAL** | **$4,105** |
| **Rounded Request** | **$5,000** |

The ~$900 buffer between actual costs and the $5,000 request covers any price fluctuations, unexpected needs, or minor expenses not listed here.
