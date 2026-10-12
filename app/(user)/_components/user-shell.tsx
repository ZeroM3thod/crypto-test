// app/(user)/_components/user-shell.tsx
"use client";

import Avatar9 from "@/components/base-ui/avatar2";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CandlestickChart,
  ChevronRight,
  ChevronsUpDown,
  Users,
  Command,
  History,
  Home,
  Landmark,
  LogOut, 
  Lock,
  PanelLeft,
  Settings,
  ShieldCheck,
  User,
  Wallet,
  X,
  MessagesCircle,
  HeadsetIcon,
} from "lucide-react"
import { useRef, useState, useEffect, type ReactNode } from "react";
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuSub,
  AnimatedSidebarMenuSubButton,
  AnimatedSidebarMenuSubItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/motion/context-menu";
import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from "@/components/motion/animated-toast-stack";

/** Maps every nav label (top-level or child) to its Next.js route. */
const ROUTES: Record<string, string> = {
  // Top-level
  "Dashboard": "/dashboard",
  // Investment
  "Investment": "/investment/overview",
  "Overview":   "/investment/overview",
  "Daily Profit": "/investment/daily-profit",
  
  // Trading
  "Trade Overview":         "/trading/overview",
  "Trading":          "/trading",
  "AI Trading":       "/trading/ai-trading",
  "Manual Trading":   "/trading/manual-trading",
  "Trade History":    "/trading/trade-history",
  
  // Wallet
  "Wallet":            "/wallet",
  "Main Wallet":       "/wallet/main",
  "Investment Wallet": "/wallet/investment",
  "Trading Wallet":    "/wallet/trading",

  "Wallet History":    "/wallet/history",
  // Fund
  "Fund":         "/fund",
  "Deposit":      "/fund/deposit",
  "Withdraw":     "/fund/withdraw",
  "Send":     "/fund/send",
  "Fund History": "/fund/history",
  // Referral
  
  "Referral Dashboard": "/referral/dashboard",
  "Leaderboard":       "/referral/leaderboard",

  // Support
  "Support":        "/support/create-ticket",
  "Create Ticket":  "/support/create-ticket",
  "My Tickets":     "/support/my-tickets",
  

  // Community
  "Community":           "/community",
  "International Chat":  "/community/chat",
  "Announcements":       "/community/announcements",
};

const destinations = [
  { label: "Dashboard", icon: Home },
  {
    label: "Investment",
    icon: BriefcaseBusiness,
    children: ["Overview", "Daily Profit" , "AI Trading"],
  },
  {
    label: "Trading",
    icon: CandlestickChart,
    children: [ "Trade Overview" ,  "Manual Trading",  "Trade History"],
    locked: true, // Coming soon: shown in the sidebar but not clickable
  },
  {
    label: "Wallet",
    icon: Wallet,
    children: [
      "Main Wallet",
      "Investment Wallet",
      "Trading Wallet",
      
      
      "Wallet History",
    ],
  },
  {
    label: "Fund",
    icon: Landmark,
    children: ["Deposit", "Withdraw", "Send", "Fund History"],
  },
  {
    label: "Referral",
    icon: Users,
    children: [
      "Referral Dashboard",
      "Leaderboard",
          ],
  },
  {
    label: "Support",
    icon: HeadsetIcon,
    children: ["Create Ticket", "My Tickets"],
  },
  {
    label: "Community",
    icon: MessagesCircle,
    children: ["International Chat", "Announcements"],
  },
] satisfies {
  label: string;
  icon: typeof Users;
  children?: string[];
  /** Locked items show a "Coming soon" pill and can't be opened. */
  locked?: boolean;
}[];

interface UserShellProps {
  /** The nav item or sub-item label that should appear active. */
  active: string;
  /** The page content rendered inside the inset area, below the header. */
  children: ReactNode;
}

export function UserShell({ active: initialActive, children }: UserShellProps) {
  const [active, setActive] = useState(initialActive);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useAnimatedToastStack({
    defaultDuration: 2800,
    limit: 1, // only one "Coming soon" toast at a time
  });

  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string; email: string; avatarUrl: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?.firstName && data.profile?.email) {
          setUserProfile({
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            email: data.profile.email,
            avatarUrl: data.profile.avatarUrl,
          });
        }
      })
      .catch(() => {});
  }, []);

  /** Locked items open a "Coming soon" toast instead of navigating. */
  const showComingSoon = (label: string) => {
    showToast({
      status: "info",
      title: `${label} is coming soon`,
      description: "This section isn't available yet. Stay tuned!",
    });
  };

  /** Navigate to the route for a label if one is registered. */
  const navigate = (label: string) => {
    const route = ROUTES[label];
    if (route) router.push(route);
  };

  const handleProfileClick = () => {
    const btn = profileButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const syntheticEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top,
    });
    btn.dispatchEvent(syntheticEvent);
  };

  const displayName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
    : "Loading...";
  const displayEmail = userProfile?.email || "loading...";

  return (
    <AnimatedSidebarProvider className="min-h-svh">
      <AnimatedSidebar
        ariaLabel="User Panel"
        collapsible="icon"
        panelClassName="border-foreground/[0.08]"
      >
        <AnimatedSidebarHeader className="p-3 pb-2">
          <div className="flex min-h-11 items-center gap-3 overflow-hidden px-2">
            <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-background">
              <Command aria-hidden="true" className="size-4" />
            </div>
            <button
              type="button"
              onClick={() => { setActive("Dashboard"); router.push("/dashboard"); }}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[state=collapsed]/sidebar:hidden"
            >
              <span className="truncate text-sm font-semibold text-foreground">
                MultiMod
              </span>
              <ChevronsUpDown
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            </button>
            <AnimatedSidebarClose className="ml-auto text-muted-foreground hover:bg-muted md:hidden">
              <X aria-hidden="true" className="size-4" />
            </AnimatedSidebarClose>
          </div>
        </AnimatedSidebarHeader>

        <AnimatedSidebarContent className="px-2 pt-1">
          <AnimatedSidebarGroup className="pt-1">
            <AnimatedSidebarGroupLabel>User Panel</AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                {destinations.map(({ label, icon: Icon, children, locked }) => (
                  <AnimatedSidebarMenuItem key={label}>
                    {locked ? (
                      <div aria-disabled="true" className="cursor-not-allowed">
                        <AnimatedSidebarMenuButton
                          isActive={false}
                          icon={<Icon className="size-4 opacity-50" />}
                          onSelect={() => showComingSoon(label)}
                        >
                          <span className="flex w-full items-center gap-2 text-muted-foreground/60">
                            {label}
                            <Lock
                              aria-hidden="true"
                              className="ml-auto size-3.5 shrink-0 group-data-[state=collapsed]/sidebar:hidden"
                            />
                          </span>
                        </AnimatedSidebarMenuButton>
                      </div>
                    ) : (
                      <>
                        <AnimatedSidebarMenuButton
                          isActive={
                            active === label ||
                            children?.includes(active) === true
                          }
                          ariaExpanded={
                            children ? openSection === label : undefined
                          }
                          icon={<Icon className="size-4" />}
                          onSelect={() => {
                            setOpenSection((current) => {
                              if (!children) {
                                setActive(label);
                                navigate(label);
                                return null;
                              }
                              return current === label ? null : label;
                            });
                          }}
                        >
                          {label}
                        </AnimatedSidebarMenuButton>
                        {children ? (
                          <AnimatedSidebarMenuSub open={openSection === label}>
                            {children.map((child) => (
                              <AnimatedSidebarMenuSubItem key={child}>
                                <AnimatedSidebarMenuSubButton
                                  isActive={active === child}
                                  onSelect={() => { setActive(child); navigate(child); }}
                                >
                                  {child}
                                </AnimatedSidebarMenuSubButton>
                              </AnimatedSidebarMenuSubItem>
                            ))}
                          </AnimatedSidebarMenuSub>
                        ) : null}
                      </>
                    )}
                  </AnimatedSidebarMenuItem>
                ))}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>

        <AnimatedSidebarFooter className="gap-3 border-none p-3">
          <ContextMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <ContextMenuTrigger>
              <button
                ref={profileButtonRef}
                type="button"
                onClick={handleProfileClick}
                className="flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl p-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
            <Avatar9 name={displayName} avatar={userProfile?.avatarUrl} />
          
                <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground group-data-[state=collapsed]/sidebar:hidden"
                />
              </button>
            </ContextMenuTrigger>

            <ContextMenuContent ariaLabel="Profile actions" className="w-60">
              <ContextMenuLabel>Profile</ContextMenuLabel>
              <ContextMenuItem
                textValue="Personal Information"
                onSelect={() => { setActive("Personal Information"); router.push("/profile"); }}
              >
                <User aria-hidden="true" className="h-4 w-4" />
                Personal Information
              </ContextMenuItem>
              <ContextMenuItem
                textValue="Security"
                onSelect={() => { setActive("Security"); router.push("/profile/security"); }}
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Security
              </ContextMenuItem>
              <ContextMenuItem
                textValue="KYC Verification"
                onSelect={() => { setActive("KYC Verification"); router.push("/profile/kyc"); }}
              >
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                KYC Verification
              </ContextMenuItem>
              <ContextMenuItem
                textValue="Login History"
                onSelect={() => { setActive("Login History"); router.push("/profile/login-history"); }}
              >
                <History aria-hidden="true" className="h-4 w-4" />
                Login History
              </ContextMenuItem>


              <ContextMenuSeparator />

              <ContextMenuItem
                tone="destructive"
                textValue="Log out"
                onSelect={async () => {
                  await fetch("/api/logout", { method: "POST" });
                  router.push("/signin");
                }}
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Log out
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </AnimatedSidebarFooter>

        <AnimatedSidebarRail />
      </AnimatedSidebar>

      <AnimatedSidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-border border-b px-4">
          <div className="flex items-center gap-3">
            <AnimatedSidebarTrigger className="text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <PanelLeft aria-hidden="true" className="size-4" />
            </AnimatedSidebarTrigger>
            <div className="h-5 w-px bg-border" />
            <p className="text-sm font-medium text-foreground">{active}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content goes here */}
        {children}
      </AnimatedSidebarInset>

      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        placement="fixed"
        maxVisible={1}
        icons={{ info: <Lock className="h-3.5 w-3.5" /> }}
      />
    </AnimatedSidebarProvider>
  );
}