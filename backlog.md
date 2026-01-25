# Hint Project Backlog

A comprehensive tracking document for the Hint gift-sharing platform across Chrome extension, mobile app, and web viewer. Use this document to track ideas, bugs, questions, and completed work. Update regularly during development sessions.

**Last Updated:** January 24, 2026
**MVP Status:** 95% Complete (~60+ hours development)
**Current Phase:** Polishing & Enhancement

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [New Ideas](#new-ideas) | Fresh concepts and feature proposals |
| [Questions to Discuss](#questions-to-discuss) | Open decisions needing input |
| [Bugs](#bugs) | Known issues requiring fixes |
| [Low Priority / Nice to Have](#low-priority--nice-to-have) | Future enhancements |
| [In Production](#in-production) | Currently deployed features |
| [Archived](#archived) | Completed, rejected, and closed items |
| [Claude Code Cheat Sheet](#claude-code-cheat-sheet) | Quick reference for development |

---

## Gift Ideas (Courtney)

- [ ] **Allbirds Women's Varsity shoes** - https://www.allbirds.com/products/womens-varsity
  - Source: braindump (2026-01-18)

---

## New Ideas

### Leaderboard & Gamification System
- [ ] User stats tracking (gifts claimed, given, received)
- [ ] Points system with weighted scoring
- [ ] Global leaderboard + friends-only view
- [ ] Time-based filters (week/month/year/all-time)
- [ ] Achievement badges:
  - First Gift (claim first item)
  - Generous Friend (give 10+ gifts)
  - Gift Master (100+ successful claims)
  - Secret Santa (holiday season claims)
  - Early Bird (claim before key date)
  - On Fire (7-day streak)
  - Rising Star (fastest climber)
- [ ] Anti-spam measures (5 claims/day limit, email verification, reputation scoring)

### Enhanced Product Tracking
- [ ] Price history charts (30-day, 90-day, all-time)
- [ ] Additional retailers: Best Buy, eBay, Etsy, Home Depot, Wayfair
- [ ] Stock availability tracking with notifications
- [ ] Weekly price digest emails
- [ ] Browser push notifications for >20% drops

### Social Features
- [ ] Activity feed showing friend claims
- [ ] Comments on hintlist items
- [ ] Direct messaging between friends
- [ ] Group hintlists for families/events
- [ ] Embeddable widget for blogs/websites

### Auto-Purchase Feature (Long-term Vision)
- [ ] Automated purchasing on price/date/stock triggers
- [ ] Crypto wallet integration (USDC/USDT stablecoins)
- [ ] Alternative: Traditional Stripe payment processing
- [ ] Headless browser automation for checkout
- [ ] KYC/AML compliance framework

### Mobile App Enhancements
- [ ] Push notifications (OneSignal)
- [ ] Camera/barcode scanning for product capture
- [ ] Offline mode with sync
- [ ] Face ID / Touch ID authentication
- [ ] Share sheet integration
- [ ] Deep linking (hint:// scheme)

### Analytics Dashboard
- [ ] Personal spending patterns
- [ ] Price drop savings calculator
- [ ] Hintlist view/claim analytics
- [ ] Friend insights (most generous, mutual interests)
- [ ] Platform trends (trending products, seasonal)

### Communication Enhancements
- [ ] In-app notifications center
- [ ] SMS notifications via Twilio
- [ ] Slack/Discord integration
- [ ] Calendar sync for key dates

---

## Questions to Discuss

### Architecture Decisions
- [ ] Should mobile app be PWA-first or go straight to React Native?
- [ ] Redis caching layer - worth the complexity for current scale?
- [ ] Edge functions vs traditional serverless for price tracking?

### Product Decisions
- [ ] Monetization strategy: Affiliate links vs premium features vs both?
- [ ] Should gamification be opt-in or default?
- [ ] Privacy implications of activity feed - how much to show?

### Technical Debt
- [x] ~~Consolidate popup.js (5,528 lines) into smaller modules?~~ - Done! 11 ES modules (Jan 24, 2026)
- [ ] TypeScript migration for remaining JS files?
- [ ] Remove legacy `dnu/` folder contents entirely?

### Growth Strategy
- [ ] Partner with specific retailers for enhanced integration?
- [ ] Influencer/affiliate program structure?
- [ ] App Store submission timing vs web PWA launch?

---

## Bugs

### High Priority
- [x] ~~**Web viewer access codes not validating**~~ - Fixed via RPC functions (Jan 24, 2026)
- [x] ~~**Web viewer still purple branding**~~ - Already green, was a stale issue
- [x] ~~**Web viewer "wishlist" terminology**~~ - Already uses "hintlist"

### Medium Priority
- [x] ~~**Logo font inconsistent**~~ - Leckerli One already loaded
- [ ] **Mobile app friends API not connected** - FriendsListsScreen shows TODO for API integration
- [ ] **Leaderboard using mock data** - LeaderboardScreen not connected to actual user_stats

### Low Priority
- [x] ~~**Extension popup overflow on small screens**~~ - Fixed with 560px fixed height, 520px modal max (Jan 24, 2026)
- [x] ~~**Dark mode contrast issues**~~ - Improved text opacity levels for better readability (Jan 24, 2026)
- [x] ~~**CSV export missing some fields**~~ - Added "Claimed By" column with guest_claimer_name (Jan 24, 2026)

---

## Low Priority / Nice to Have

### UI Polish (Phases 2-6)
- [x] ~~Phase 2: Button reorganization with dropdown menus~~ - Replaced dropdowns with inline action icons (Jan 24, 2026)
- [x] ~~Phase 3: Visual hierarchy & typography scale~~ - Added spacing utilities, dividers, card elevation (Jan 24, 2026)
- [x] ~~Phase 4: Progressive disclosure for advanced features~~ - Added tooltips, help text, empty states (Jan 24, 2026)
- [x] ~~Phase 5: Micro-interactions & animations~~ - Added press effects, loading dots, staggered animations (Jan 24, 2026)
- [x] ~~Phase 6: Mobile-responsive optimization~~ - Added reduced motion, high contrast, print styles, small screen support (Jan 24, 2026)

### Infrastructure
- [ ] Database query optimization
- [ ] Rate limiting implementation
- [ ] Error logging with Sentry
- [ ] Analytics with PostHog/Mixpanel
- [ ] A/B testing framework
- [ ] CDN for static assets

### Accessibility
- [ ] Screen reader improvements
- [ ] Keyboard navigation throughout extension
- [ ] High contrast mode option
- [ ] Reduced motion preference support

### Internationalization
- [ ] Multi-language support framework
- [ ] Currency localization
- [ ] Regional retailer support

---

## In Production

### Authentication & Accounts
- [x] Supabase Auth integration (email/password)
- [x] Session management with auto-refresh
- [x] User registration flow
- [x] Password reset functionality

### Hintlist Management
- [x] Create multiple named hintlists per user
- [x] Private/public visibility toggle
- [x] Share codes (8-character alphanumeric)
- [x] Key date assignment (birthdays, holidays)
- [x] List-specific notification preferences
- [x] QR code generation for sharing

### Product Capture
- [x] One-click product capture from any website
- [x] Automatic price extraction (Amazon, Walmart, Target)
- [x] Automatic image extraction
- [x] Manual product entry option
- [x] Product URL validation

### Friends System
- [x] Send/accept/reject friend requests
- [x] View friends' public hintlists
- [x] Friend search by email
- [x] Friends list management

### Claiming System
- [x] Secret claims (owner sees count only, not who)
- [x] Guest claiming via web viewer (no account needed)
- [x] Unclaim functionality with tokens
- [x] Claim notifications to list owner

### Notifications & Emails
- [x] Email notification system
- [x] 4-level preferences (none/who_only/what_only/both)
- [x] Key date reminders (60/30/15 days)
- [x] Claim notifications
- [x] Price drop alerts
- [x] Smart batching (5-minute windows)
- [x] Bradley Hand font branding

### Price Tracking
- [x] Daily cron job monitoring
- [x] Target price alerts
- [x] Amazon/Walmart/Target specific extraction
- [x] Price history storage

### Data Export
- [x] CSV/Excel export of hintlists
- [x] Complete data portability

### UI & Branding
- [x] Complete "wishlist" → "hintlist" rebrand
- [x] Teal/green theme (#228855 primary)
- [x] Leckerli One logo font
- [x] Dark mode toggle
- [x] Settings modal (9 sections)
- [x] Product thumbnails (60x60 extension, 120x120 web)

### Chrome Extension
- [x] Manifest V3 compliance
- [x] Service worker background script
- [x] Content script for page scraping
- [x] 20+ retailer permissions configured
- [x] Chrome Storage API integration
- [x] Chrome Alarms for scheduling

### Mobile App Foundation
- [x] React Native/Expo project structure
- [x] Navigation (tabs, stack)
- [x] Auth context and flow
- [x] Theme context (light/dark)
- [x] Screen scaffolding (Lists, Friends, Leaderboard, Settings)
- [x] Shared services layer with extension

---

## Archived

### Completed

#### January 2026
- [x] Complete wishlist → hintlist terminology rebrand
- [x] Implement green theme (#228855) across extension
- [x] Add Settings modal with 9 sections
- [x] Set up Supabase leaderboard schema
- [x] Create mobile app project structure
- [x] Implement shared TypeScript services layer
- [x] Add dark mode toggle functionality

#### December 2025
- [x] Launch MVP Chrome extension (v1.0.0 → v1.1.0)
- [x] Implement guest claiming system
- [x] Add email notification framework
- [x] Set up price tracking cron jobs
- [x] Create web viewer for non-users
- [x] Implement friend request system
- [x] Add CSV export functionality

#### Earlier
- [x] Initial Supabase database schema
- [x] Core authentication flow
- [x] Basic product capture from Amazon
- [x] First working extension popup
- [x] Content script for price extraction

### Rejected Ideas

- **Facebook/Google OAuth** - Decided to keep simple email auth for privacy
- **Browser notification badges** - Too intrusive, users prefer email
- **Real-time collaborative editing** - Overkill for wishlist management
- **AI gift recommendations (Phase 1)** - Postponed to Year 2 roadmap
- **Subscription pricing model** - Going with affiliate/freemium instead

### Closed Questions

- **Tech stack for backend?** → Supabase (PostgreSQL + Auth + Edge Functions)
- **Extension manifest version?** → Manifest V3 for future-proofing
- **Primary brand color?** → #228855 (teal/green)
- **Mobile framework?** → React Native via Expo for code sharing
- **Notification preferences approach?** → 4-level enum per list
- **How to handle guest claims?** → Email-based with unique unclaim tokens

---

# Claude Code Cheat Sheet

Quick reference for developing the Hint project with Claude Code.

### Project Locations

| Project | Path |
|---------|------|
| **Main Folder** | `/Users/wallyhansen/Desktop/projects/riversideco/hint/` |
| **Chrome Extension** | `/Users/wallyhansen/Desktop/projects/riversideco/hint/hint-extension/` |
| **Mobile App** | `/Users/wallyhansen/Desktop/projects/riversideco/hint/hint-mobile-test/` |
| **GitHub Pages Viewer** | `/Users/wallyhansen/Desktop/projects/riversideco/hint/hint-gh-pages/` |
| **Shared Services** | `/Users/wallyhansen/Desktop/projects/riversideco/hint/hint-extension/shared/` |
| **This Backlog** | `/Users/wallyhansen/Desktop/projects/riversideco/hint/backlog.md` |

### Quick Start Prompts

**Starting a new session:**
```
Read the backlog at /Users/wallyhansen/Desktop/projects/riversideco/hint/backlog.md and the TODO list at hint-extension/HINT_TODO_LIST.md. What are the highest priority items to work on?
```

**Extension work:**
```
I'm working on the hint Chrome extension. Read popup.js and popup.html to understand the current implementation, then help me [specific task].
```

**Mobile app work:**
```
I'm working on the hint mobile app. Read App.tsx and the src/screens folder structure to understand the current state, then help me [specific task].
```

**Web viewer fixes:**
```
The hint web viewer needs updates. Read hint-gh-pages/index.html and help me update the branding from purple to green (#228855) and change "wishlist" to "hintlist".
```

**Database work:**
```
Read supabase-leaderboard.sql and supabase-price-alerts.sql to understand the schema, then help me [specific task].
```

### Tech Stack Reference

| Layer | Technology | Notes |
|-------|------------|-------|
| **Extension** | JavaScript/HTML/CSS | Manifest V3, popup.js is main file |
| **Mobile** | React Native 0.81.5 | Expo 54, React Navigation, React Native Paper |
| **Backend** | Supabase | PostgreSQL + Auth + Edge Functions + RLS |
| **Database** | PostgreSQL | Via Supabase, RLS policies enabled |
| **Auth** | Supabase Auth | Email/password, sessions via JWT |
| **Storage** | Chrome Storage / AsyncStorage | Platform-abstracted in storage.ts |
| **Styling** | CSS3 / React Native Paper | Theme: #228855 primary, #f0f9f4 background |
| **Fonts** | Leckerli One (logo), Bradley Hand (emails) | System fonts for UI |
| **Build (Mobile)** | EAS | Expo Application Services |

### Common Commands

**Extension Development:**
```bash
# Navigate to extension
cd "/Users/wallyhansen/Desktop/projects/riversideco/hint/hint-extension"

# Load unpacked extension in Chrome
# chrome://extensions → Developer mode → Load unpacked → select hint-extension folder
```

**Mobile Development:**
```bash
# Navigate to mobile app
cd "/Users/wallyhansen/Desktop/projects/riversideco/hint/hint-mobile-test"

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build for production
eas build --platform ios
eas build --platform android
```

**Database:**
```bash
# Supabase CLI (if installed)
supabase login
supabase db push
supabase functions deploy
```

### Data Model Quick Reference

**Lists Table:**
```typescript
interface List {
  id: string;           // UUID
  user_id: string;      // FK to auth.users
  name: string;
  is_public: boolean;
  access_code: string;  // 8-char alphanumeric
  share_code: string;
  key_date: Date | null;
  notification_level: 'none' | 'who_only' | 'what_only' | 'both';
  created_at: Date;
  updated_at: Date;
}
```

**Products Table:**
```typescript
interface Product {
  id: string;           // UUID
  list_id: string;      // FK to lists
  name: string;
  url: string;
  image_url: string | null;
  current_price: number | null;
  target_price: number | null;
  in_stock: boolean;
  claimed_by: string | null;        // User ID or null
  guest_claimer_name: string | null;
  guest_claimer_email: string | null;
  claimed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

**Friends Table:**
```typescript
interface Friend {
  id: string;
  user_id: string;      // Requester
  friend_id: string;    // Recipient
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
}
```

**User Stats (Leaderboard):**
```typescript
interface UserStats {
  user_id: string;
  points: number;
  claims_count: number;
  lists_count: number;
  items_added: number;
  current_streak: number;
  longest_streak: number;
  badges: string[];     // Array of badge IDs
  updated_at: Date;
}
```

### Session Tips

1. **Always read before editing** - Read popup.js, App.tsx, or relevant files before making changes
2. **Check the TODO list** - `hint-extension/HINT_TODO_LIST.md` has detailed implementation notes
3. **Test in both themes** - Changes should work in light and dark mode
4. **Platform awareness** - Shared code uses platform detection (extension/web/mobile)
5. **Supabase RLS** - Remember Row Level Security policies when debugging data access
6. **Large files** - popup.js is 5,528 lines; use line numbers when referencing

### Session Checkpoint and Restart Templates

**End of Session Checkpoint:**
```markdown
## Session Summary - [DATE]

### Completed This Session:
- [ ] Item 1
- [ ] Item 2

### Files Modified:
- `path/to/file.js` - Description of changes
- `path/to/file.ts` - Description of changes

### Current State:
- What's working:
- What's not working:
- Blockers:

### Next Session Should:
1. First priority
2. Second priority
3. Third priority

### Notes for Next Session:
- Important context
- Gotchas discovered
- Decisions made
```

**Start of Session Template:**
```markdown
## Starting Session - [DATE]

### Goals for This Session:
1. Primary goal
2. Secondary goal

### Context Needed:
- Read backlog.md for current status
- Check HINT_TODO_LIST.md for details
- Review last session's checkpoint

### Files to Review:
- Main file for this task
- Related files

### Success Criteria:
- [ ] Specific outcome 1
- [ ] Specific outcome 2
```

**Quick Status Check Prompt:**
```
Read the backlog at /Users/wallyhansen/Desktop/projects/riversideco/hint/backlog.md. Summarize:
1. What's currently in production
2. Top 3 priority items
3. Any blocking bugs
```

---

*This backlog is maintained alongside development. Update sections as items move through the pipeline.*
