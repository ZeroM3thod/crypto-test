# KYC System Setup Guide

## ✅ What's Been Implemented

### Database Schema
- `kyc_submissions` table for storing KYC applications
- `kyc_history` table for audit logs
- Updated `auth_users.kyc_status` field
- Database functions for approve/reject/reopen

### API Endpoints
- `/api/kyc/submit` - Submit KYC
- `/api/kyc/upload` - Upload to Cloudinary
- `/api/kyc/status` - Get KYC status
- `/api/admin/kyc` - List all KYC submissions
- `/api/admin/kyc/[id]/approve` - Approve
- `/api/admin/kyc/[id]/reject` - Reject with reason
- `/api/admin/kyc/[id]/reopen` - Reopen for review

### Frontend
- `/profile/kyc` - User KYC submission page (no expiry date field)
- `/admin/kyc` - Admin review dashboard
- Cloudinary image uploads
- Role-based access control

## 🔧 Required Setup Steps

### 1. Run Database Migration

Execute the SQL in `Supabase/auth.sql` in your Supabase SQL Editor. This will:
- Create KYC tables
- Add necessary indexes
- Create database functions
- Update user table constraints

### 2. Configure Cloudinary

Add to your `.env.local`:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Sign up at https://cloudinary.com if you don't have an account.

### 3. Fix Authentication Integration

⚠️ **CRITICAL**: Update `lib/auth/session.ts` to use your real auth system.

The current placeholder returns:
```typescript
{ id: "OWNER-001", role: "owner" }
```

But the database expects a UUID. Replace with your actual session logic:

```typescript
export async function getSessionUser(): Promise<SessionUser | null> {
  // Get your real session token from cookies
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return null;
  
  // Verify and decode your JWT or query your session table
  const session = await verifySessionToken(token);
  if (!session) return null;
  
  // Return actual user data from database
  const { data: user } = await supabase
    .from("auth_users")
    .select("id, user_id, role, kyc_status")
    .eq("id", session.userId)
    .single();
    
  return user;
}
```

### 4. Role-Based Access Control

The middleware is configured to:
- **Users**: Access only user/public pages, redirect from admin/owner pages to 404
- **Admins**: Access user/public/admin pages, redirect from owner pages to 404  
- **Owners**: Access all pages

This is already implemented in `middleware.ts`.

## 📋 Testing Checklist

Once authentication is wired up:

### User Flow
1. ✅ Navigate to `/profile/kyc`
2. ✅ Select country
3. ✅ Choose document type
4. ✅ Fill personal details (no expiry date field should be visible)
5. ✅ Upload ID front/back images (uploads to Cloudinary)
6. ✅ Take/upload selfie
7. ✅ Submit and see "Pending review" status
8. ✅ Check database - record in `kyc_submissions` with status "pending"

### Admin Flow
1. ✅ Navigate to `/admin/kyc`
2. ✅ See list of submissions from database (no mock data)
3. ✅ Click "View" on a submission
4. ✅ See user details with User ID (not username)
5. ✅ View uploaded images from Cloudinary
6. ✅ Click "Approve" or "Reject" (with reason)
7. ✅ Check database - status updated, history logged

### Access Control
1. ✅ User tries to access `/admin/kyc` → Redirects to 404
2. ✅ Admin tries to access `/owner/settings` → Redirects to 404
3. ✅ Owner can access all routes

## 🐛 Current Error

If you see:
```
invalid input syntax for type uuid: "OWNER-001"
```

This means `lib/auth/session.ts` is still using placeholder data. Follow step 3 above to integrate your real auth system.

## 📦 Dependencies Installed

- `cloudinary` - For image uploads

## 🗄️ Database Schema Reference

### kyc_submissions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth_users)
- `submission_id` (text, unique, e.g., "KYC-A1B2C3")
- `country_code`, `country_name`
- `document_type` (national_id, passport, driver_license)
- `first_name`, `last_name`, `dob`
- `document_number`
- `address_line_1`, `address_line_2`, `city`, `state`, `postal_code`
- `front_image_url`, `back_image_url`, `selfie_image_url`
- `status` (pending, approved, rejected)
- `rejection_reason`
- `reviewed_by`, `reviewed_at`
- `created_at`, `updated_at`

### kyc_history
- `id` (uuid, primary key)
- `submission_id` (uuid, foreign key)
- `action` (submitted, approved, rejected, reopened)
- `reason` (for rejections)
- `performed_by` (uuid, foreign key to auth_users)
- `created_at`

## 🎯 Next Steps

1. Run the SQL migration
2. Add Cloudinary credentials
3. **Wire up real authentication in `lib/auth/session.ts`**
4. Test the full flow
5. Deploy to production

The KYC system is fully implemented and ready once authentication is connected! 🚀
