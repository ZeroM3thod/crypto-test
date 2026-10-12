I've reviewed your dashboard design thoroughly. Here are all the User Panel PRDs, one by one. I'll deliver them section by section — starting now.

---

# USER PANEL — COMPLETE PRD

---

## 1. DASHBOARD PAGE

**Route:** `/user/dashboard`
**Purpose:** Central command center giving the user a real-time snapshot of their entire portfolio — wallets, P&L, activity, transactions, trade history, and notifications.

---

### Layout Structure
- Top greeting bar with date + personalized welcome (e.g., "Good morning, Ava.")
- Wallet Card section
- P&L Overview (4 stat cards)
- Monthly Returns Calendar
- Activity Overview (tabbed: Investment / AI Trading / Mining / Manual / Referral)
- Recent Transactions table
- Trade History table
- Notifications accordion

---

### Components & Behavior

**Greeting Block**
- Shows current day/date (e.g., "Friday, July 18")
- Personalized greeting using user's first name
- Time-aware greeting: Good morning / afternoon / evening

**Wallet Card**
- Switcher between wallets: Main, Investment, Mining, Trading, Referral
- Displays total balance with 24h change delta (e.g., +$124.50)
- Wallet address shown (truncated with copy button)
- Quick action buttons: Deposit, Withdraw, Transfer, Invest
- Search bar with recent search suggestions (wallet addresses, ENS names, labels)
- Notification bell with unread badge

**P&L Overview (4 cards)**
- Today's P/L
- 7-Day P/L
- 30-Day P/L
- Total P/L
- Each card shows value + "Realized" label with green/red arrow delta
- Skeleton loaders while data is fetching

**Monthly Returns Calendar**
- Year switcher (e.g., 2021–2025)
- 12-month grid heatmap per year
- Each month cell colored green (positive return) or red (negative return)
- Tooltip on hover showing exact % return for that month

**Activity Overview Tabs (MorphingTabs — draggable/reorderable)**
- **Investment tab:** Active plans list with plan name, status dot (active/paused/completed), daily rate %, invested amount, returns to date, progress bar
- **AI Trading tab:** Active bot name, strategy type, pair, status, total P/L
- **Mining tab:** Active contracts, hash rate, daily earnings, contract expiry
- **Manual tab:** Summary of open manual trades — pair, side, size, current P/L
- **Referral tab:** Referral link, total referrals, active referrals, total earnings, pending earnings; "Referrals" and "Earnings" quick buttons

**Recent Transactions Table**
- Columns: Date, Type (Deposit/Withdrawal/Transfer), Asset, Amount, Status (Completed/Pending/Failed), Tx Hash
- Status color-coded: green (Completed), blue (Pending), red (Failed)
- Tx Hash shown in monospace truncated format
- "View all" link → routes to `/user/fund/history`
- Fixed height scrollable table (280px), row height 44px

**Trade History Table**
- Columns: Date, Pair, Side (Buy/Sell), Entry Price, Exit Price, Size, P/L
- P/L colored green (positive) or red (negative)
- "View all" link → routes to `/user/trading/trade-history`
- Same table styling as transactions

**Notifications Accordion**
- Bouncy/animated accordion
- Each item: icon + title + description
- Default first item expanded
- Types: Deposit Confirmed, AI Trading Activated, New Login Detected, Mining Earnings Credited

---

### Data Requirements
- User profile (name)
- All 5 wallet balances (real-time)
- P&L aggregates (today / 7d / 30d / all-time)
- Monthly return series per year
- Active investments, bots, mining contracts, open trades
- Last 6 transactions
- Last 6 completed trades
- Last 4 notifications

---

### States
- Loading: skeleton placeholders on all stat values
- Empty: empty state components with CTA buttons where no data exists
- Error: toast notification with retry option

---
---

## 2. INVESTMENT — OVERVIEW PAGE

**Route:** `/user/investment/overview`
**Purpose:** Shows all active and historical investment plans, total invested amount, total returns, and plan-level performance breakdown.

---

### Layout Structure
- Summary stat cards (top)
- Active Investment Plans table/cards
- Investment History table
- Quick action: "New Investment" button

---

### Components & Behavior

**Summary Stats (4 cards)**
- Total Invested (e.g., $5,000.00)
- Total Returns Earned (e.g., +$1,240.00)
- Active Plans Count (e.g., 3)
- ROI % (e.g., +24.8%)

**Active Plans Section**
- Card or table layout per plan
- Each plan shows: Plan Name, Tier/Level, Invested Amount, Daily Rate %, Start Date, End Date/Duration, Total Returns So Far, Status badge (Active / Paused / Completed / Expired)
- Progress bar showing % of plan duration elapsed
- Per-plan action buttons: View Details, Cancel (if allowed)

**Investment History Table**
- Columns: Plan Name, Amount, Start Date, End Date, Total Return, Status
- Filterable by status (Active / Completed / Cancelled)
- Pagination or infinite scroll

**New Investment CTA**
- Prominent button → routes to `/user/investment/plans` or opens a plan picker modal
- If no active plans exist, full empty state is shown with CTA

---

### States
- Loading: skeleton cards
- Empty (no plans): illustration + "Start your first investment" CTA
- Active plans present: full layout

---
---

## 3. INVESTMENT — DAILY PROFIT PAGE

**Route:** `/user/investment/daily-profit`
**Purpose:** Shows a day-by-day breakdown of all profit credited from active investment plans.

---

### Layout Structure
- Summary: Total profit earned, this month's profit, today's profit
- Daily Profit Table (main content)
- Filter bar (date range, plan filter)

---

### Components & Behavior

**Summary Stats**
- Today's Profit (e.g., +$12.40)
- This Month's Profit (e.g., +$248.00)
- All-Time Profit from Investments (e.g., +$1,240.00)

**Daily Profit Table**
- Columns: Date, Plan Name, Rate Applied (%), Invested Amount, Profit Credited, Cumulative Total
- Color-coded profit amounts (always green for credited profits)
- Date grouped rows (e.g., "July 18, 2025")
- Search/filter by plan name
- Date range picker (from / to)
- Export button (CSV)

**Calendar View Toggle**
- Optional toggle to show profits in a monthly calendar heatmap (same style as dashboard returns calendar)

---

### States
- Loading: skeleton rows
- Empty: "No profit records yet. Start an investment plan to begin earning."
- Filtered empty: "No results for selected filters"

---
---

## 4. INVESTMENT — CLOUD MINING PAGE

**Route:** `/user/investment/cloud-mining`
**Purpose:** Allows users to browse, purchase, and monitor cloud mining contracts. Shows real-time mining stats and earnings.

---

### Layout Structure
- Mining summary stats (top)
- Active Mining Contracts (cards)
- Available Mining Plans (purchase cards)
- Mining Earnings History table

---

### Components & Behavior

**Mining Summary Stats**
- Total Hash Rate (e.g., 45 TH/s)
- Today's Mining Earnings (e.g., +$8.20)
- Total Mining Earnings (e.g., +$320.00)
- Active Contracts Count (e.g., 2)

**Active Contracts Cards**
- Each card: Contract ID, Plan Name, Hash Rate, Daily Earnings, Start Date, Expiry Date, Status (Active/Expired)
- Progress bar for contract duration
- "View Earnings" per contract link

**Available Mining Plans (Buy Section)**
- Grid of plan cards
- Each plan: Plan name, Hash Rate, Duration (days), Price, Estimated Daily Earnings, Estimated Total Return
- "Buy Now" button → opens confirmation modal with payment wallet selector
- Plans tiered (e.g., Starter, Pro, Elite)

**Mining Earnings History Table**
- Columns: Date, Contract ID, Hash Rate, Amount Earned, Wallet Credited
- Filterable by contract or date range

---

### States
- Loading: skeleton cards and table rows
- No active contracts: empty state with plan purchase CTA
- All plans sold out: disabled buy buttons with "Sold Out" badge

---
---

## 5. TRADING — MANUAL TRADING PAGE

**Route:** `/user/trading/manual`
**Purpose:** Interface for placing manual buy/sell orders on supported trading pairs.

---

### Layout Structure
- Chart area (price chart for selected pair)
- Order form panel
- Open Orders (bottom or sidebar)
- Recent Fills

---

### Components & Behavior

**Pair Selector**
- Dropdown or searchable selector (BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, etc.)
- Shows current price + 24h change % next to the pair name

**Price Chart**
- Candlestick chart with time-frame switcher (1m, 5m, 15m, 1H, 4H, 1D)
- Volume bars beneath
- Basic indicators: MA, EMA (optional toggle)

**Order Form**
- Tab switcher: Buy / Sell
- Order Type selector: Market, Limit, Stop-Limit
- Input fields: Amount (in quote currency), Quantity (in base asset), Price (for limit orders), Stop Price (for stop-limit)
- Available balance displayed (from Trading Wallet)
- Percentage quick-fill buttons: 25%, 50%, 75%, 100%
- Total cost preview
- "Place Order" button (Buy = green, Sell = red)
- Confirmation modal before order submission

**Open Orders Table**
- Columns: Time, Pair, Type, Side, Price, Amount, Filled, Status, Action (Cancel)
- Real-time updates

**Recent Fills**
- Last 5 filled orders with pair, side, fill price, quantity, time

---

### States
- Loading: chart skeleton + form disabled
- Insufficient balance: "Place Order" button disabled with tooltip
- Order placed: success toast + open orders list updates
- Order cancelled: row removed with animation

---
---

## 6. TRADING — AI TRADING PAGE

**Route:** `/user/trading/ai-trading`
**Purpose:** Lets users activate, configure, and monitor AI-powered automated trading bots.

---

### Layout Structure
- Active Bots summary (top)
- Available AI Strategies (cards)
- Active Bot Details (expandable)
- Bot Performance Chart

---

### Components & Behavior

**Active Bots Summary**
- Total active bots
- Combined bot P/L (today / all-time)
- Total capital deployed in bots

**AI Strategy Cards (Available to Activate)**
- Each card: Strategy name, Risk level badge (Low/Medium/High), Supported pairs, Estimated monthly return %, Min capital required
- "Activate" button → opens config modal
- Config modal: select pair, set capital amount, set stop-loss %, confirm

**Active Bot Cards**
- Bot name, strategy, pair, status (Running/Paused/Stopped)
- Capital allocated, P/L today, P/L all-time
- Action buttons: Pause / Stop / View Details
- Real-time P/L update with pulsing indicator when running

**Bot Performance Chart**
- Line chart: P/L over time for selected bot
- Time range selector: 1D / 7D / 30D

---

### States
- No active bots: empty state with "Activate your first AI bot" CTA
- Bot running: pulsing green status indicator
- Bot paused: yellow indicator
- Bot stopped/error: red indicator with error message

---
---

## 7. TRADING — OPEN TRADES PAGE

**Route:** `/user/trading/open-trades`
**Purpose:** Shows all currently open (active) trades across manual and AI trading.

---

### Layout Structure
- Summary: total open positions, unrealized P/L
- Open Trades Table (main content)
- Filter bar

---

### Components & Behavior

**Summary Stats**
- Total Open Positions
- Unrealized P/L (total, color-coded)
- Largest Open Position
- Most Profitable Open Trade

**Open Trades Table**
- Columns: Opened At, Pair, Source (Manual / AI Bot), Side (Buy/Sell), Entry Price, Current Price, Size, Unrealized P/L, P/L %, Action
- P/L updates in real-time
- Action column: Close Trade button (opens confirmation modal with estimated exit value)
- Filter by: Source (Manual / AI), Pair, Side

**Close Trade Modal**
- Shows: Pair, Entry Price, Current Market Price, Estimated Exit Value, Estimated P/L
- Confirm / Cancel buttons

---

### States
- Loading: skeleton rows
- No open trades: empty state "No open positions right now"
- Real-time P/L animation (count up/down)

---
---

## 8. TRADING — TRADE HISTORY PAGE

**Route:** `/user/trading/trade-history`
**Purpose:** Complete record of all closed/completed trades.

---

### Layout Structure
- Performance summary stats (top)
- Trade History Table (main)
- Filter and search bar
- Export option

---

### Components & Behavior

**Performance Summary**
- Total Trades Completed
- Win Rate %
- Best Trade (highest P/L)
- Worst Trade (biggest loss)
- Total Realized P/L

**Trade History Table**
- Columns: Date, Pair, Source, Side, Entry Price, Exit Price, Size, P/L, P/L %, Duration
- P/L color-coded (green/red)
- Row click → opens trade detail drawer/modal
- Filters: Date range, Pair, Side (Buy/Sell), Source (Manual/AI), P/L (Profit only / Loss only)
- Search by pair
- Export to CSV

**Trade Detail Modal/Drawer**
- Full trade details: open time, close time, pair, entry, exit, size, fees paid, gross P/L, net P/L, notes

---

### States
- Loading: skeleton rows
- Empty: "No completed trades yet"
- Filtered empty: "No trades match your filters"

---
---

## 9. TRADING — TRADING PORTFOLIO PAGE

**Route:** `/user/trading/portfolio`
**Purpose:** Overview of current asset holdings within the trading wallet — allocation, value, and performance.

---

### Layout Structure
- Total portfolio value + change
- Asset allocation donut chart
- Holdings table
- Performance chart

---

### Components & Behavior

**Portfolio Header**
- Total Portfolio Value (e.g., $4,820.00)
- 24h Change amount + % (color-coded)
- Last updated timestamp

**Asset Allocation Chart**
- Donut/pie chart showing % allocation per asset
- Legend with asset names and % share
- Hover tooltip: asset name, value, % allocation

**Holdings Table**
- Columns: Asset, Amount, Avg Buy Price, Current Price, Current Value, P/L, P/L %, 24h Change %
- Sorted by value (highest first) by default
- Sortable columns

**Portfolio Performance Chart**
- Line chart of total portfolio value over time
- Time range: 1D / 7D / 30D / 1Y / All

---

### States
- Loading: skeleton charts and table
- Empty portfolio: "No assets in your trading portfolio"
- Single asset: chart still renders for that one asset

---
---

## 10. WALLET — MAIN WALLET

**Route:** `/user/wallet/main`
**Purpose:** Shows the main wallet balance, address, and all incoming/outgoing transactions for the main wallet.

---

### Layout Structure
- Wallet balance card (top)
- Quick actions bar
- Transaction History table

---

### Components & Behavior

**Wallet Balance Card**
- Current balance (USDT equivalent)
- Wallet address (with copy button and QR code button)
- 24h balance change

**Quick Actions**
- Deposit, Withdraw, Transfer (to other internal wallets)
- Each opens a dedicated modal

**Transaction History**
- Columns: Date, Type, Asset, Amount, Status, Tx Hash
- Filter by: Type (Deposit/Withdrawal/Transfer), Status, Date range
- Pagination

---

*(The following 4 wallet pages — Investment, Trading, Mining, Referral — follow the same structure as Main Wallet, with wallet-specific context and restrictions.)*

---

## 11. WALLET — INVESTMENT WALLET

**Route:** `/user/wallet/investment`
- Same layout as Main Wallet
- Shows only investment-related credits and debits
- Quick action: "Invest Now" CTA (no direct withdrawal — must transfer to Main first)
- Balance reflects earnings from active investment plans

---

## 12. WALLET — TRADING WALLET

**Route:** `/user/wallet/trading`
- Same layout as Main Wallet
- Shows trading deposits, withdrawals, P/L credits
- Quick action: "Fund Trading" (transfer from Main)
- Displays unrealized balance from open positions

---

## 13. WALLET — MINING WALLET

**Route:** `/user/wallet/mining`
- Same layout as Main Wallet
- Shows only mining earnings credited
- Quick action: "Transfer to Main" button
- Balance accumulates from active mining contracts

---

## 14. WALLET — REFERRAL WALLET

**Route:** `/user/wallet/referral`
- Same layout as Main Wallet
- Shows referral commission credits only
- Quick action: "Transfer to Main" button
- Balance grows as referred users invest/trade

---

## 15. WALLET — WALLET HISTORY PAGE

**Route:** `/user/wallet/history`
**Purpose:** Unified transaction history across all wallets in one view.

---

### Components & Behavior
- **All-wallet filter toggle:** All / Main / Investment / Trading / Mining / Referral
- Unified table: Date, Wallet, Type, Asset, Amount, Status, Tx Hash
- Date range picker
- Export to CSV
- Status filters: All / Completed / Pending / Failed
- Sortable columns

---
---

## 16. FUND — DEPOSIT PAGE

**Route:** `/user/fund/deposit`
**Purpose:** Allows users to deposit crypto into their main wallet.

---

### Layout Structure
- Asset selector
- Network selector
- Deposit address display
- QR code
- Minimum deposit notice
- Recent Deposits list

---

### Components & Behavior

**Step 1 — Select Asset**
- Dropdown: USDT, BTC, ETH, BNB, SOL, etc.

**Step 2 — Select Network**
- Network options based on asset (e.g., USDT: TRC20, ERC20, BEP20)
- Network fee and confirmation time shown per option

**Step 3 — Deposit Address**
- Unique deposit address for user + asset + network
- Copy to clipboard button
- QR code (scannable)
- Warning: "Only send [ASSET] on [NETWORK]. Sending any other asset may result in permanent loss."

**Minimum Deposit Notice**
- "Minimum deposit: $10.00"
- "Deposits below minimum will not be credited"

**Recent Deposits (bottom)**
- Last 5 deposits: Date, Asset, Network, Amount, Status, Confirmations

---

### States
- Address loading: skeleton
- Network not supported: informational message
- Deposit confirmed: toast notification + recent list updates

---
---

## 17. FUND — WITHDRAW PAGE

**Route:** `/user/fund/withdraw`
**Purpose:** Allows users to withdraw crypto from their main wallet to an external address.

---

### Layout Structure
- Asset selector
- Network selector
- Amount input
- Destination address input
- Fee preview
- Confirm & Submit

---

### Components & Behavior

**Step 1 — Select Asset & Network**
- Same as deposit flow

**Step 2 — Enter Amount**
- Amount input field
- Available balance shown
- "Max" button auto-fills available balance minus fee
- Fee breakdown: network fee, platform fee, net amount to receive

**Step 3 — Destination Address**
- Text input for external wallet address
- Address format validation per asset/network
- Warning against sending to exchange deposit addresses

**Step 4 — Security Verification**
- 2FA code input (if enabled)
- Email OTP confirmation

**Review & Submit**
- Summary: Asset, Network, Amount, Fee, Net Amount, Destination
- Confirm button → triggers 2FA / email OTP
- Cancel button

**Withdrawal Limits Notice**
- Daily limit, remaining limit shown

---

### States
- Insufficient balance: amount field error + button disabled
- Invalid address format: inline error
- 2FA required: verification modal appears
- Withdrawal submitted: success state with expected processing time
- Withdrawal failed: error toast with reason

---
---

## 18. FUND — TRANSFER PAGE

**Route:** `/user/fund/transfer`
**Purpose:** Transfer funds between the user's own internal wallets (e.g., Main → Trading, Mining → Main).

---

### Components & Behavior

**From Wallet Selector**
- Dropdown: Main / Investment / Trading / Mining / Referral
- Shows current balance

**To Wallet Selector**
- Same options (cannot be same as From)
- Shows current balance

**Amount Input**
- Amount field
- "Max" button
- Instant transfer (no fees for internal transfers)
- Preview: From balance after / To balance after

**Confirm Transfer**
- Summary card
- "Transfer Now" button
- Instant confirmation — no OTP required (internal only)

---

### States
- Same wallet selected for From/To: error state
- Zero balance in source: button disabled
- Transfer success: balances update in real-time, success toast

---
---

## 19. FUND — FUND HISTORY PAGE

**Route:** `/user/fund/history`
**Purpose:** Complete log of all deposit, withdrawal, and transfer activity.

---

### Components & Behavior
- **Type filter:** All / Deposits / Withdrawals / Transfers
- **Status filter:** All / Completed / Pending / Failed / Cancelled
- **Date range picker**
- **Table columns:** Date, Type, Asset, Network, Amount, Fee, Net Amount, Status, Tx Hash / Reference
- Row click → opens detail modal
- Export to CSV/PDF

---
---

## 20. REFERRAL — REFERRAL DASHBOARD

**Route:** `/user/referral/dashboard`
**Purpose:** Overview of the user's referral program performance.

---

### Layout Structure
- Referral link + share tools (top)
- Stats summary cards
- Earnings chart
- Commission tier info

---

### Components & Behavior

**Referral Link Block**
- Unique referral URL
- Copy button, share buttons (WhatsApp, Telegram, Twitter/X, Email)
- QR code for the referral link

**Stats Cards**
- Total Referrals (all-time)
- Active Referrals (currently active investors/traders)
- Total Commissions Earned
- Pending Commissions
- Referral Wallet Balance

**Earnings Chart**
- Bar or line chart: commissions earned per day/week/month
- Time range switcher: 7D / 30D / 3M / 1Y

**Commission Tier Table**
- Shows tier levels (e.g., Level 1: 5%, Level 2: 2%, Level 3: 1%)
- User's current tier highlighted

---
---

## 21. REFERRAL — MY REFERRALS PAGE

**Route:** `/user/referral/my-referrals`
**Purpose:** Detailed list of all users the person has referred and their activity.

---

### Components & Behavior

**Referral Table**
- Columns: Username (masked for privacy), Joined Date, Status (Active/Inactive), Total Invested, Total Traded, Commission Earned from this user
- Sortable by commission, joined date
- Search by username

**Commission Detail**
- Click on a referral → opens drawer with commission history from that user: Date, Activity (Deposit/Trade/Investment), Commission Rate, Amount Earned

---
---

## 22. SUPPORT — HELP CENTER

**Route:** `/user/support/help-center`
**Purpose:** Self-service knowledge base and FAQ.

---

### Components & Behavior

**Search Bar**
- Full-text search across all articles
- Autocomplete suggestions

**Category Grid**
- Categories: Getting Started, Deposits & Withdrawals, Trading, Investments, Mining, Referrals, Account & Security, KYC
- Icon + category name cards

**Featured Articles**
- Pinned top articles

**FAQ Accordion**
- Common questions per category
- Expandable answers

**CTA: Still need help?**
- "Create a Ticket" button → routes to `/user/support/create-ticket`

---
---

## 23. SUPPORT — MY TICKETS PAGE

**Route:** `/user/support/my-tickets`
**Purpose:** View and track all support tickets submitted by the user.

---

### Components & Behavior

**Ticket List**
- Columns: Ticket ID, Subject, Category, Created Date, Last Updated, Status (Open / In Progress / Resolved / Closed)
- Status badges color-coded
- Click row → opens ticket thread view

**Ticket Thread View**
- Full conversation thread (user messages + admin replies)
- Timestamp per message
- Status history (e.g., "Opened → In Progress → Resolved")
- Option to reply (if ticket is open)
- Option to reopen (if resolved)
- File attachments view

---
---

## 24. SUPPORT — CREATE TICKET PAGE

**Route:** `/user/support/create-ticket`
**Purpose:** Submit a new support request.

---

### Components & Behavior

**Ticket Form**
- Subject field (text input)
- Category selector: Deposit/Withdrawal, Trading, Investment, Mining, Account, KYC, Other
- Priority selector: Low / Medium / High (optional or auto-assigned)
- Message textarea (min 20 characters)
- File attachment (up to 3 files, max 5MB each — screenshots, receipts)
- Submit button

**After Submission**
- Success state: "Ticket #[ID] created. We'll respond within 24 hours."
- Auto-redirect to My Tickets after 3 seconds

---
---

## 25. COMMUNITY — INTERNATIONAL CHAT

**Route:** `/user/community/chat`
**Purpose:** Real-time global chat for all platform users.

---

### Components & Behavior

**Chat Interface**
- Chat window with message bubbles (own messages right-aligned, others left-aligned)
- User avatar + username + timestamp per message
- Message input bar (text) + send button
- Emoji picker
- "@ mention" support for users
- Language indicator (optional — users can tag their language)

**Online Users Sidebar**
- Shows count of online users
- Collapsible on mobile

**Moderation Notices**
- Pinned messages from admin at the top
- Auto-moderation: profanity filter active

**Rules Banner**
- Collapsible community rules at the top of the chat

---
---

## 26. COMMUNITY — ANNOUNCEMENTS

**Route:** `/user/community/announcements`
**Purpose:** Official announcements from the platform team.

---

### Components & Behavior

**Announcement Feed**
- Sorted newest first
- Each announcement: Title, Category badge (Platform Update / Maintenance / New Feature / Important), Date, Full content (rich text / markdown)
- Pinned announcements shown at top with "Pinned" badge
- Read/Unread state (unread shown in bold)

**Filter**
- By category
- Search by keyword

**Notification Integration**
- New announcement triggers notification in the dashboard notification panel

---
---

## 27. PROFILE — PERSONAL INFORMATION

**Route:** `/user/profile/personal-info`
**Purpose:** View and edit basic personal details.

---

### Components & Behavior

**Profile Picture**
- Upload/change avatar
- Crop tool
- Remove photo option

**Editable Fields**
- First Name, Last Name
- Date of Birth
- Gender (optional)
- Phone Number (with country code)
- Country of Residence

**Read-only Fields**
- Email Address (change via Security page)
- Username
- Account ID
- Member Since date

**Save Button**
- Changes trigger email confirmation for sensitive fields

---
---

## 28. PROFILE — SECURITY PAGE

**Route:** `/user/profile/security`
**Purpose:** Manage account security settings.

---

### Components & Behavior

**Change Password**
- Current Password, New Password, Confirm New Password
- Password strength meter
- Save button

**Two-Factor Authentication (2FA)**
- Toggle to enable/disable
- Setup flow: QR code → authenticator app → verify 6-digit code
- Shows "2FA Enabled" badge when active
- Backup codes: generate / copy / download

**Change Email**
- Current email shown
- Input new email → sends verification to both old and new email

**Active Sessions**
- Lists current logged-in devices: device name, browser, location, last active
- "Revoke" button per session (except current)
- "Revoke All Others" bulk action

---
---

## 29. PROFILE — KYC PAGE

**Route:** `/user/profile/kyc`
**Purpose:** Identity verification submission and status tracking.

---

### Components & Behavior

**KYC Status Banner**
- Not Started / Pending Review / Verified / Rejected
- Rejection shows reason + option to resubmit

**Step-by-step KYC Flow**

- **Step 1 — Personal Details:** Full legal name, DOB, nationality, address
- **Step 2 — Document Upload:** ID type selector (Passport / National ID / Driver's License), front image upload, back image upload (if applicable)
- **Step 3 — Selfie Verification:** Upload selfie holding document or live camera capture
- **Step 4 — Review & Submit**

**Status Tracking**
- Progress steps shown (1 of 3 complete, etc.)
- Estimated review time shown after submission (e.g., "1–3 business days")

---
---

## 30. PROFILE — LOGIN HISTORY

**Route:** `/user/profile/login-history`
**Purpose:** Shows a log of all login activity for security monitoring.

---

### Components & Behavior

**Login History Table**
- Columns: Date & Time, Device, Browser, IP Address, Location (City, Country), Status (Success / Failed)
- Failed logins highlighted in red
- Flag unusual logins (new location, new device) with yellow warning icon
- Pagination (50 rows per page)

**Security Notice**
- "See a login you don't recognize? Secure your account" → link to Security page

---
---

## 31. PROFILE — ACCOUNT SETTINGS

**Route:** `/user/profile/account-settings`
**Purpose:** General account preferences and danger zone.

---

### Components & Behavior

**Display Preferences**
- Language selector
- Currency display preference (USD, EUR, BTC, etc.)
- Timezone selector

**Privacy Settings**
- Show/hide profile in leaderboard (if applicable)
- Allow referral tracking (toggle)

**Danger Zone**
- Deactivate Account (temporary — requires password confirmation)
- Delete Account (permanent — requires password + 2FA + email OTP)
- Both actions show explicit warning modals

---
---

## 32. PROFILE — NOTIFICATION SETTINGS

**Route:** `/user/profile/notification-settings`
**Purpose:** Control which notifications the user receives and through which channels.

---

### Components & Behavior

**Notification Categories with toggles per channel (In-App / Email / SMS)**

| Category | In-App | Email | SMS |
|---|---|---|---|
| Deposit Confirmed | ✓ | ✓ | optional |
| Withdrawal Processed | ✓ | ✓ | optional |
| Transfer Completed | ✓ | ✓ | — |
| Investment Return Credited | ✓ | ✓ | — |
| AI Bot Activity | ✓ | optional | — |
| Mining Earnings | ✓ | optional | — |
| New Referral Signup | ✓ | optional | — |
| Referral Commission Earned | ✓ | ✓ | — |
| Support Ticket Reply | ✓ | ✓ | — |
| New Login Detected | ✓ | ✓ | ✓ |
| Security Alerts | ✓ | ✓ | ✓ |
| Platform Announcements | ✓ | optional | — |

**Save All button** at the bottom

---

That covers all **32 pages** across the User Panel. Here's a quick summary of the full structure:

- **Dashboard** — 1 page
- **Investment** — 3 pages (Overview, Daily Profit, Cloud Mining)
- **Trading** — 5 pages (Manual, AI Trading, Open Trades, Trade History, Portfolio)
- **Wallet** — 6 pages (Main, Investment, Trading, Mining, Referral, History)
- **Fund** — 4 pages (Deposit, Withdraw, Transfer, History)
- **Referral** — 2 pages (Dashboard, My Referrals)
- **Support** — 3 pages (Help Center, My Tickets, Create Ticket)
- **Community** — 2 pages (Chat, Announcements)
- **Profile** — 6 pages (Personal Info, Security, KYC, Login History, Account Settings, Notification Settings)

Let me know when you're ready and I'll move on to the **Admin Panel PRDs** or go deeper on any specific page.