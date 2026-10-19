  61 |   if (!text) return null as T;
  62 |   return JSON.parse(text) as T;
 GET /api/chat/messages 500 in 321ms (next.js: 12ms, application-code: 309ms)
 GET /api/chat/rules 200 in 366ms (next.js: 27ms, application-code: 339ms)
⨯ Error: {"code":"42703","details":null,"hint":null,"message":"column auth_users_1.avatar does not exist"}
    at supabase (lib\auth\backend.ts:59:22)
    at async GET (app\api\chat\online\route.ts:15:17)
  57 |     headers: supabaseHeaders(init.headers),
  58 |   });
> 59 |   if (!res.ok) throw new Error(await res.text());
     |                      ^
  60 |   const text = await res.text();
  61 |   if (!text) return null as T;
  62 |   return JSON.parse(text) as T;
 GET /api/chat/online 500 in 505ms (next.js: 39ms, application-code: 466ms)
