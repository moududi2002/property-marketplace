<!-- 📍 /TESTING.md -->

# Property Marketplace — Manual Testing Checklist

Run through this list before every production deployment.

## Environment Pre-Flight
- [ ] Docker services running: `docker compose ps` → postgres, redis, minio all healthy
- [ ] API server: `curl http://localhost:4035/health` → `"status": "ok"`
- [ ] Web server running on :3035
- [ ] Seed run: admin + categories + locations present in Prisma Studio

## Authentication
- [ ] Register with new phone → lands on /account
- [ ] Register with duplicate phone → shows error, no duplicate created
- [ ] Register with invalid phone format → field error
- [ ] Login with email → works
- [ ] Login with phone → works
- [ ] Login with wrong password → "Invalid credentials"
- [ ] Logout → redirected to homepage, cookies cleared
- [ ] Visit /account while logged out → redirects to /login
- [ ] Visit /admin while logged out → redirects to /login
- [ ] Visit /admin as regular user → redirects to /
- [ ] Suspended user cannot log in (test via admin suspend)

## Public Website
- [ ] Homepage hero search navigates to /properties with filters
- [ ] Language switcher toggles EN ↔ বাংলা
- [ ] Featured section shows only featured properties
- [ ] Recent section shows only published
- [ ] Categories grid → each card links to filtered listing
- [ ] Divisions grid → each card links to filtered listing
- [ ] /en/properties default load shows results
- [ ] /en/properties filters (purpose, category, price, bedrooms) apply
- [ ] /en/properties pagination works
- [ ] Property card → click → detail page loads
- [ ] Detail page gallery opens in lightbox, ESC closes, arrows navigate
- [ ] Detail page source contains JSON-LD schema
- [ ] Detail page shows NO seller phone or email
- [ ] Inquiry form submits anonymously → success message
- [ ] Inquiry with invalid phone → validation error
- [ ] Duplicate inquiry (same phone, same property) within 5 min → 409
- [ ] Inquiry rate limit hit after 3 submissions in 60s

## Seller Dashboard
- [ ] /en/sell step 1 requires category, title, description
- [ ] Step 2 requires division, district, area, address
- [ ] Step 3 requires price
- [ ] Step 4 requires at least one image before submit
- [ ] Draft persists across page reload
- [ ] `Save as Draft` → shows in /account/properties
- [ ] `Submit for Review` → status becomes PENDING_REVIEW
- [ ] Status badge colors match state
- [ ] Image upload: drag & drop works, progress bar animates
- [ ] Image upload: file type validation rejects text/plain
- [ ] Image upload: max 20 limit enforced
- [ ] Image: set cover works, badge moves
- [ ] Image: reorder preserves after reload
- [ ] Image: delete removes from S3 (verify MinIO)
- [ ] /account/properties/{id} → "Continue editing" loads wizard

## Admin Dashboard
- [ ] Dashboard shows correct stat counts
- [ ] Properties list tabs: Pending / Approved / Published / Rejected / Changes / All
- [ ] Properties list search filters by title, seller, phone
- [ ] Property review page shows: seller info, images, moderation history
- [ ] Approve (without publish) → status APPROVED, publishedAt null
- [ ] Approve & Publish → status PUBLISHED, publishedAt set
- [ ] Reject requires reason → status REJECTED, seller sees reason
- [ ] Request Changes requires note → status CHANGES_REQUESTED
- [ ] Admin Edit → audit_logs entry created
- [ ] Archive → status ARCHIVED
- [ ] Users list filters by role & status
- [ ] User detail shows properties + inquiries
- [ ] Suspend user → cannot log in
- [ ] Cannot suspend self → 403
- [ ] Cannot suspend another admin → 403
- [ ] Audit log filter by entity type works
- [ ] Moderator cannot see /admin/audit-logs
- [ ] Moderator cannot suspend admin

## Inquiries (Admin)
- [ ] Inquiries list default tab = New
- [ ] Detail shows buyer message, property link, seller info
- [ ] Status update saves + increments contactCount
- [ ] Follow-up date persists
- [ ] Add note without status change works
- [ ] Internal notes only visible to admin (not on public site)

## Real-time Notifications
- [ ] Bell badge shows 0 when logged out
- [ ] Property submitted → admin bell increments WITHOUT refresh
- [ ] Property approved → seller bell increments WITHOUT refresh
- [ ] Property rejected → seller bell increments WITH reason
- [ ] New inquiry → admin bell increments
- [ ] Click notification → navigates to correct page + marks read
- [ ] Mark all as read → badge clears
- [ ] Offline admin (logged out) → notification persists on next login
- [ ] Two admin tabs open → both receive events

## SEO
- [ ] /sitemap.xml returns valid XML with all pages
- [ ] /robots.txt blocks /admin, /account, /api
- [ ] Homepage has `<title>`, meta desc, canonical, og:*
- [ ] Property detail has JSON-LD `RealEstateListing`
- [ ] hreflang alternates point to /en and /bn versions
- [ ] Bengali homepage title is in Bengali

## Mobile & Responsive
- [ ] Homepage at 375px: search form stacks, no horizontal scroll
- [ ] Listing page at 375px: filters collapse (or scroll)
- [ ] Detail page at 375px: sidebar stacks below main content
- [ ] Admin tables at 375px: horizontal scroll or column hiding
- [ ] Notification popover at 375px: fits screen width
- [ ] Tap targets ≥ 44px height

## Performance (Lighthouse)
- [ ] Performance ≥ 85 (mobile)
- [ ] SEO = 100
- [ ] Accessibility ≥ 90
- [ ] Best Practices ≥ 90

## Database & Data Integrity
- [ ] Prisma Studio: every property has at least 1 image after submit
- [ ] audit_logs populated for every admin mutation
- [ ] property_moderation_logs has one entry per status change
- [ ] Session table rotates on refresh (old deleted, new inserted)
- [ ] No orphaned property_images after deletion
- [ ] Soft-deleted properties have `deletedAt` set, not removed