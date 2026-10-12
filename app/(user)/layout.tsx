// app/(user)/layout.tsx
// User panel: dashboard, markets, wallet, fund, referral, support etc.

export const dynamic = 'force-dynamic';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
