PS C:\Users\KHAN GADGET\Documents\Crypto\crypto-invest> npm run build 

> crypto-invest@0.1.0 build
> next build

▲ Next.js 16.3.5 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 58ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 35.0s
✓ Finished TypeScript in 30.5s    
✓ Collecting page data using 7 workers in 4.9s    
Session error: Error: Dynamic server usage: Route /admin/announcement couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/announcement couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/announcement couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at g (app\(admin)\admin\announcement\page.tsx:9:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/announcement couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /owner/users couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at d (lib\auth\require-owner.ts:9:25)
    at g (app\(superadmin)\owner\users\page.tsx:8:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /owner/users couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/ai-trading couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/ai-trading couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/ai-trading couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at f (app\(admin)\admin\ai-trading\page.tsx:8:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/ai-trading couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/community couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/community couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /community/announcements couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at f (lib\auth\require-user.ts:12:25)
    at i (app\(user)\community\announcements\page.tsx:6:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /community/announcements couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/dashboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/dashboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/dashboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at g (app\(admin)\admin\dashboard\page.tsx:10:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/dashboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/history couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/history couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/deposits couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/deposits couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/investment/daily-profit couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/investment/daily-profit couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/investment/daily-profit couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at f (app\(admin)\admin\investment\daily-profit\page.tsx:8:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/investment/daily-profit couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/referral/leaderboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/referral/leaderboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/referral/leaderboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at f (app\(admin)\admin\referral\leaderboard\page.tsx:8:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/referral/leaderboard couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/referral couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/referral couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/referral couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at f (app\(admin)\admin\referral\page.tsx:8:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/referral couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/kyc couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/kyc couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/kyc couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at i (app\(admin)\admin\kyc\page.tsx:14:25)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/kyc couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/support couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/support couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/users couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/users couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/users couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at e (lib\auth\require-admin.ts:14:25)
    at g (app\(admin)\admin\users\page.tsx:9:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/users couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /owner/users/kyc couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at d (lib\auth\require-owner.ts:9:25)
    at i (app\(superadmin)\owner\users\kyc\page.tsx:8:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /owner/users/kyc couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /owner/support/tickets couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at d (lib\auth\require-owner.ts:9:25)
    at f (app\(superadmin)\owner\support\tickets\page.tsx:7:9)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /owner/support/tickets couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Session error: Error: Dynamic server usage: Route /admin/withdraws couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
    at df (lib\auth\session.ts:29:26)
    at dg (lib\auth\session.ts:80:25)
    at f (app\(admin)\layout.tsx:13:27)
  27 |   try {
  28 |     // Get session token from cookies
> 29 |     const token = (await cookies()).get("session_token")?.value;
     |                          ^
  30 |     
  31 |     if (token) {
  32 |       // Verify token exists in auth_sessions and is not expired/revoked {
  description: "Route /admin/withdraws couldn't be rendered statically because it used `cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
  digest: 'DYNAMIC_SERVER_USAGE'
}
Error occurred prerendering page "/dashboard". Read more: https://nextjs.org/docs/messages/prerender-error
TypeError: Cannot read properties of undefined (reading 'avatar')
    at O (components\motion\wallet-card\account-avatar.tsx:12:15)
  10 |   className?: string;
  11 | }) {
> 12 |   if (account.avatar) return <>{account.avatar}</>;
     |               ^
  13 |   return (
  14 |     <img
  15 |       src={diceBearGlassUrl(account.id || account.address)} {
  digest: '3034235347'
}
Export encountered an error on /(user)/dashboard/page: /dashboard, exiting the build.
⨯ Next.js build worker exited with code: 1 and signal: null
PS C:\Users\KHAN GADGET\Documents\Crypto\crypto-invest> 