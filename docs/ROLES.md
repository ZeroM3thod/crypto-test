-- Role-based permissions summary
-- ═══════════════════════════════════════════════════════════

-- USER ROLE:
--   Access: Public pages (/, /about, /contact, etc.)
--   Access: User pages (/dashboard, /investment, /trading, /wallet, /referral, /profile)
--   Denied: Admin pages (/admin/*)
--   Denied: Owner pages (/owner/*)

-- ADMIN ROLE:
--   Access: Public pages
--   Access: User pages
--   Access: Admin pages (/admin/*)
--   Denied: Owner pages (/owner/*)

-- OWNER ROLE:
--   Access: Everything (public, user, admin, owner)
--   Full system control
--   Exclusive access to /owner/* routes

-- Route Structure:
-- /owner/* → Owner panel (owner ONLY)
-- /admin/* → Admin panel (admin & owner)
-- /dashboard, /investment, /trading, /wallet, /referral, /profile → User pages (user, admin & owner)
-- /, /about, /contact, /signin, /signup → Public (everyone)

-- Implementation:
-- 1. Database: role column in auth_users with check constraint
-- 2. Middleware: Route protection based on role
--    - /owner/* → owner ONLY
--    - /admin/* → admin & owner
--    - /dashboard, /investment, etc. → user, admin & owner
-- 3. API: Role checks in requireOwner(), requireAdmin(), requireUser()
-- 4. Components: 
--    - requireOwner() for owner pages
--    - requireAdmin() for admin pages
--    - requireUser() for user pages
