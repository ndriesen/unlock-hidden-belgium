# Security Review and Hardening (Spotly)

## Implemented hardening

1. HTTP security headers (`next.config.ts`)
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security`
- `poweredByHeader: false`

2. Database RLS
- Added/strengthened RLS policies for:
  - `hotspot_likes`, `hotspot_saves`
  - `hotspot_media`, `trip_media`
  - `activities`, `notifications`, `user_follows`
  - `subscription_plans`, `user_subscriptions`
- Added storage object policies for private bucket `spotly-media`.

3. Upload validation
- Strict MIME whitelist: jpg/png/webp
- Max file size: 10MB
- Sanitized filenames and captions

4. Access model
- Visibility model on media: `private` / `friends` / `public`
- Activity/notification reads restricted by user ownership/follow rules

## Remaining recommendations (next steps)

1. Move sensitive writes to server-side routes
- Current writes happen client-side with anon key + RLS.
- For maximum security, move high-value writes (subscription state, moderation actions) behind server-side API routes.

2. Add abuse prevention
- Add rate limits per user/IP on review posting, likes/saves and uploads.

3. Add moderation pipeline
- Auto-flag explicit content and spam on user uploads/comments.

4. Add audit logging
- Track admin and moderation actions in immutable audit table.

5. Add payment provider webhook verification
- If billing is added, verify signed webhooks server-side and store events idempotently.

