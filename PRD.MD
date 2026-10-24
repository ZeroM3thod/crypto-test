rowser] ObjectMultiplex - orphaned data for stream "metamask-multichain-provider" (moz-extension://fe1c432f-10b4-41ec-88a1-1a73446c4c64/scripts/inpage.js;:1:36689)
[browser] ObjectMultiplex - orphaned data for stream "metamask-multichain-provider" (moz-extension://fe1c432f-10b4-41ec-88a1-1a73446c4c64/scripts/inpage.js;:1:36689)
 GET /api/profile 200 in 272ms (next.js: 27ms, application-code: 245ms)
 GET /api/user/role 200 in 277ms (next.js: 52ms, application-code: 224ms)
 GET /api/fund/received 200 in 310ms (next.js: 12ms, application-code: 298ms)
 GET /api/deposits 200 in 421ms (next.js: 76ms, application-code: 345ms)
 GET /api/profile 200 in 175ms (next.js: 14ms, application-code: 162ms)
 GET /api/user/role 200 in 151ms (next.js: 10ms, application-code: 141ms)
 GET /api/fund/received 200 in 304ms (next.js: 11ms, application-code: 293ms)
 GET /api/deposits 200 in 455ms (next.js: 8ms, application-code: 447ms)
 GET /api/fund/received 200 in 288ms (next.js: 6ms, application-code: 281ms)
 GET /api/fund/received 200 in 305ms (next.js: 15ms, application-code: 290ms)
 GET /api/fund/received 200 in 298ms (next.js: 6ms, application-code: 292ms)
 GET /api/fund/received 200 in 286ms (next.js: 6ms, application-code: 280ms)
 GET /api/fund/received 200 in 318ms (next.js: 7ms, application-code: 310ms)
Deposit notification email failed: Error: {"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type uuid: \"100529\""}
    at supabase (lib\auth\backend.ts:61:22)
    at async notifyRequest (lib\email\request-notification.ts:11:19)
    at async POST (app\api\deposits\route.ts:40:3)
  59 |     headers: supabaseHeaders(init.headers),
  60 |   });
> 61 |   if (!res.ok) throw new Error(await res.text());
     |                      ^
  62 |   const text = await res.text();
  63 |   if (!text) return null as T;
  64 |   return JSON.parse(text) as T;
 POST /api/deposits 200 in 870ms (next.js: 6ms, application-code: 864ms)
 GET /api/deposits 200 in 294ms (next.js: 6ms, application-code: 288ms)
 GET /api/fund/received 200 in 300ms (next.js: 12ms, application-code: 288ms)
 GET /api/fund/received 200 in 283ms (next.js: 11ms, application-code: 272ms)
 GET /api/fund/received 200 in 297ms (next.js: 12ms, application-code: 285ms)
 GET /api/fund/received 200 in 277ms (next.js: 5ms, application-code: 273ms)
 GET 