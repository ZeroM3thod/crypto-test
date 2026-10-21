## Error Type
Build Error

## Error Message
the name `Logo` is defined multiple times

## Build Output
./app/(public)/_components/footer.tsx:98:10
Error: the name `Logo` is defined multiple times
  96 |   );
  97 | }
> 98 | import { Logo } from "./logo";
     |          ^^^^
  99 |

Ecmascript file had an error

Import trace:
  Server Component:
    ./app/(public)/_components/footer.tsx
    ./app/(public)/page.tsx

Next.js version: 16.3.5 (Turbopack)
