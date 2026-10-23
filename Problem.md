  938 |     if (!hydratedMessages.current) {
 GET /api/chat/admin/schedule 200 in 169ms (next.js: 15ms, application-code: 154ms)
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at readChatArchive (lib\chat-archive.ts:23:23)
    at async GET (app\api\chat\messages\route.ts:30:16)
  21 | export async function readChatArchive(): Promise<ArchivedChatMessage[]> {
  22 |   try {
> 23 |     const data = JSON.parse(await readFile(archivePath, "utf8"));
     |                       ^
  24 |     return Array.isArray(data.messages) ? data.messages : [];
  25 |   } catch (error) {
  26 |     if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
 GET /api/chat/messages 500 in 762ms (next.js: 131ms, application-code: 631ms)
[browser] Community refresh failed Error: Could not refresh messages
    at refreshMessages (app/(admin)/_components/community-chat-view.tsx:935:29)
  933 |   const refreshMessages = async () => {
  934 |     const response = await fetch("/api/chat/messages");
> 935 |     if (!response.ok) throw new Error("Could not refresh messages");
      |                             ^
  936 |     const rows = await response.json();
  937 |     const next = [...new Map(rows.map((m: any) => [m.id, m])).values()]....
  938 |     if (!hydratedMessages.current) {
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at readChatArchive (lib\chat-archive.ts:23:23)
    at async GET (app\api\chat\admin\export\route.ts:12:20)
  21 | export async function readChatArchive(): Promise<ArchivedChatMessage[]> {
  22 |   try {
> 23 |     const data = JSON.parse(await readFile(archivePath, "utf8"));
     |                       ^
  24 |     return Array.isArray(data.messages) ? data.messages : [];
  25 |   } catch (error) {
  26 |     if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
 GET /api/chat/admin/export 500 in 792ms (next.js: 345ms, application-code: 447ms)
 GET /api/chat/admin/schedule 200 in 171ms (next.js: 8ms, application-code: 162ms)
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at readChatArchive (lib\chat-archive.ts:23:23)
    at async GET (app\api\chat\messages\route.ts:30:16)
  21 | export async function readChatArchive(): Promise<ArchivedChatMessage[]> {
  22 |   try {
> 23 |     const data = JSON.parse(await readFile(archivePath, "utf8"));
     |                       ^
  24 |     return Array.isArray(data.messages) ? data.messages : [];
  25 |   } catch (error) {
  26 |     if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
 GET /api/chat/messages 500 in 347ms (next.js: 14ms, application-code: 333ms)
[browser] Community refresh failed Error: Could not refresh messages
    at refreshMessages (app/(admin)/_components/community-chat-view.tsx:935:29)
  933 |   const refreshMessages = async () => {
  934 |     const response = await fetch("/api/chat/messages");
> 935 |     if (!response.ok) throw new Error("Could not refresh messages");
      |                             ^
  936 |     const rows = await response.json();
  937 |     const next = [...new Map(rows.map((m: any) => [m.id, m])).values()]....
  938 |     if (!hydratedMessages.current) {
 GET /api/chat/admin/schedule 200 in 224ms (next.js: 11ms, application-code: 213ms)
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at readChatArchive (lib\chat-archive.ts:23:23)
    at async GET (app\api\chat\messages\route.ts:30:16)
  21 | export async function readChatArchive(): Promise<ArchivedChatMessage[]> {
  22 |   try {
> 23 |     const data = JSON.parse(await readFile(archivePath, "utf8"));
     |                       ^
  24 |     return Array.isArray(data.messages) ? data.messages : [];
  25 |   } catch (error) {
  26 |     if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
 GET /api/chat/messages 500 in 465ms (next.js: 19ms, application-code: 446ms)
[browser] Community refresh failed Error: Could not refresh messages
    at refreshMessages (app/(admin)/_components/community-chat-view.tsx:935:29)
  933 |   const refreshMessages = async () => {
  934 |     const response = await fetch("/api/chat/messages");
> 935 |     if (!response.ok) throw new Error("Could not refresh messages");
      |                             ^
  936 |     const rows = await response.json();
  937 |     const next = [...new Map(rows.map((m: any) => [m.id, m])).values()]....
  938 |     if (!hydratedMessages.current) {
 GET /api/chat/admin/schedule 200 in 171ms (next.js: 4ms, application-code: 167ms)
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at readChatArchive (lib\chat-archive.ts:23:23)
    at async GET (app\api\chat\messages\route.ts:30:16)
  21 | export async function readChatArchive(): Promise<ArchivedChatMessage[]> {
  22 |   try {
> 23 |     const data = JSON.parse(await readFile(archivePath, "utf8"));
     |                       ^
  24 |     return Array.isArray(data.messages) ? data.messages : [];
  25 |   } catch (error) {
  26 |     if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
 GET /api/chat/messages 500 in 405ms (next.js: 6ms, application-code: 399ms)
[browser] Community refresh failed Error: Could not refresh messages
    at refreshMessages (app/(admin)/_components/community-chat-view.tsx:935:29)
  933 |   const refreshMessages = async () => {
  934 |     const response = await fetch("/api/chat/messages");
> 935 |     if (!response.ok) throw new Error("Could not refresh messages");
      |                             ^
  936 |     const rows = await response.json();
  937 |     const next = [...new Map(rows.map((m: any) => [m.id, m])).values()]....
  938 |     if (!hydratedMessages.current) {
 GE