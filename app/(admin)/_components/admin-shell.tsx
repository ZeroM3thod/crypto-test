// app/(admin)/_components/admin-shell.tsx
"use client";

import Avatar9 from "@/components/base-ui/avatar2";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  BadgeCheck,
  BriefcaseBusiness,
  CandlestickChart,
  ChevronRight,
  ChevronsUpDown,
  Command,
  HeadsetIcon,
  History,
  Home,
  Landmark,
  LogOut,
  MessagesCircle,
  PanelLeft,
  ShieldCheck,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
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

/** Maps every nav label (top-level or child) to its Next.js route. */
const ROUTES: Record<string, string> = {
  // Top-level
  "Dashboard": "/admin/dashboard",

  // Users
  "Users": "/admin/users",
  "All Users": "/admin/users",
  "KYC Requests": "/admin/kyc",
  "Login History": "/admin/users/login-history",

  // Finance
  "Finance": "/admin/deposits",
  "Deposits": "/admin/deposits",
  "Withdrawals": "/admin/withdraws",
  "Fund History": "/admin/history",

  // Investment
  "Investment": "/admin/investment/overview",
  "Overview": "/admin/investment/overview",
  "Daily Profit": "/admin/investment/daily-profit",
  "Cloud Mining": "/admin/investment/cloud-mining",

  // Trading
  "Trading": "/admin/trading/overview",
  "Trade Overview": "/admin/trading/overview",
  "AI Trading": "/admin/ai-trading",
  "Manual Trading": "/admin/trading/manual-trading",
  "Trade History": "/admin/trading/trade-history",

  // Support
  "Support": "/admin/support",
  "All Tickets": "/admin/support",
  "Ticket Replies": "/admin/support/replies",

  // Referral
  "Basic Management": "/admin/referral",
  "Leaderboard Management": "/admin/referral/leaderboard",

  // Community
  "Community": "/admin/community",
  "Chat Moderation": "/admin/community",
  "Announcements": "/admin/announcement",
};

const destinations = [
  { label: "Dashboard", icon: Home },
  {
    label: "Users",
    icon: Users,
    children: ["All Users", "KYC Requests"],
  },
  {
    label: "Finance",
    icon: Landmark,
    children: ["Deposits", "Withdrawals", "Fund History"],
  },
  {
    label: "Package Management",
    icon: BriefcaseBusiness,
    children: [ "Daily Profit",  "AI Trading"],
  },
  {
    label: "Manual Trading Management",
    icon: CandlestickChart,
    children: ["Trade Overview", "Manual Trading", "Trade History"],
  },
    {
    label: "Referral",
    icon: Trophy,
    children: ["Basic Management", "Leaderboard Management"],
  },

  {
    label: "Community",
    icon: MessagesCircle,
    children: ["Chat Moderation", "Announcements"],
  },
  {
    label: "Support",
    icon: HeadsetIcon,
    
  },
] satisfies {
  label: string;
  icon: typeof Users;
  children?: string[];
}[];

interface AdminShellProps {
  /** The nav item or sub-item label that should appear active. */
  active: string;
  /** The page content rendered inside the inset area, below the header. */
  children: ReactNode;
}

export function AdminShell({ active: initialActive, children }: AdminShellProps) {
  const [active, setActive] = useState(initialActive);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

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

  return (
    <AnimatedSidebarProvider className="min-h-svh">
      <AnimatedSidebar
        ariaLabel="Admin Panel"
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
              onClick={() => {
                setActive("Dashboard");
                router.push("/admin/dashboard");
              }}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[state=collapsed]/sidebar:hidden"
            >
              <span className="truncate text-sm font-semibold text-foreground">
                Admin Panel
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
            <AnimatedSidebarGroupLabel>Admin Panel</AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                {destinations.map(({ label, icon: Icon, children }) => (
                  <AnimatedSidebarMenuItem key={label}>
                    <AnimatedSidebarMenuButton
                      isActive={
                        active === label || children?.includes(active) === true
                      }
                      ariaExpanded={
                        children ? openSection === label : undefined
                      }
                      icon={<Icon className="size-4" />}
                      onSelect={() => {
                        if (!children) {
                          setOpenSection(null);
                          setActive(label);
                          navigate(label);
                          return;
                        }
                        setOpenSection((current) =>
                          current === label ? null : label
                        );
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
                              onSelect={() => {
                                setActive(child);
                                navigate(child);
                              }}
                            >
                              {child}
                            </AnimatedSidebarMenuSubButton>
                          </AnimatedSidebarMenuSubItem>
                        ))}
                      </AnimatedSidebarMenuSub>
                    ) : null}
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
                <Avatar9 />

                <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
                  <span className="block truncate text-sm font-medium text-foreground">
                    Admin
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    admin@gmail.com
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
                onSelect={() => {
                  setActive("Personal Information");
                  router.push("/admin/profile");
                }}
              >
                <User aria-hidden="true" className="h-4 w-4" />
                Personal Information
              </ContextMenuItem>
              <ContextMenuItem
                textValue="Security"
                onSelect={() => {
                  setActive("Security");
                  router.push("/admin/profile/security");
                }}
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Security
              </ContextMenuItem>
              <ContextMenuItem
                textValue="Verification"
                onSelect={() => {
                  setActive("Verification");
                  router.push("/admin/profile/verification");
                }}
              >
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                Verification
              </ContextMenuItem>
              <ContextMenuItem
                textValue="Login History"
                onSelect={() => {
                  setActive("Login History");
                  router.push("/admin/profile/login-history");
                }}
              >
                <History aria-hidden="true" className="h-4 w-4" />
                Login History
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuItem
                tone="destructive"
                textValue="Log out"
                onSelect={() => console.log("logout")}
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
    </AnimatedSidebarProvider>
  );
}