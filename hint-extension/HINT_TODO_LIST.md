# hint - Remaining TODO List

**Last Updated:** January 9, 2026  
**Project:** hint Chrome Extension & Web Viewer  
**Current State:** MVP Complete, Polishing & Enhancement Phase

---

## ✅ RECENTLY COMPLETED

### Core Features
- Authentication system (Supabase Auth)
- Multiple named hintlists per user (private/public)
- Product capture from any website via Chrome extension
- Friends system (send/accept/reject requests, view friend's hintlists)
- Share codes for public hintlists (8-char alphanumeric)
- Claiming system (secret claims, owner sees count only)
- Guest claiming (non-users via web viewer with email)
- Export to Excel (CSV download)
- Email notification system
- Price tracking with daily cron job
- Product image extraction (Amazon, Walmart, Target)
- QR codes for sharing
- Dark mode toggle

### Branding & UI
- Complete "wishlist → hintlist" rebrand
- Teal/green theme (#228855 primary color)
- Leckerli One font for "hint" logo
- Bradley Hand font for emails
- Light green background (#f0f9f4)
- White cards with green shadows
- Emoji-only header buttons (⚙️ Settings, 👥 Friends)
- Product thumbnails (60x60px extension, 120x120px web)
- Settings modal (9 sections: Account, Notifications, Privacy, Data Export, Appearance, About, Help, Legal, Advanced)
- Key dates & reminders (60/30/15 day automated emails)
- Email notification preferences (4 levels: none/who/what/both)

---

## 🚧 HIGH PRIORITY ITEMS

### 1. Non-User Web Viewer Updates 🔗
**Status:** Needs updates  
**Time Estimate:** 2 hours  
**Priority:** HIGH ⭐⭐⭐

**Current Issues:**
- Web viewer at https://wahans.github.io/hint/ has outdated purple branding
- Access codes not working properly
- Logo not using Leckerli One font
- Still uses "wishlist" terminology instead of "hintlist"

**Required Fixes:**
- [ ] Update all colors from purple to green (#228855)
- [ ] Change logo font to Leckerli One
- [ ] Fix access code validation and database queries
- [ ] Update all "wishlist" → "hintlist" terminology
- [ ] Add proper error messages for invalid codes
- [ ] Test complete guest claiming flow end-to-end
- [ ] Ensure mobile responsiveness
- [ ] Update footer/header styling to match extension

**Files Affected:**
- `index.html` (standalone web viewer on GitHub Pages)
- May need to check Supabase RLS policies for public hintlist access

**Technical Details:**
- Web viewer allows non-users to view public hintlists via access code
- Users can claim items as guests (provide name + email)
- Critical for viral growth - friends/family don't need extension installed

---

### 2. UI/UX Streamlining - Phase 2 🎨
**Status:** Phase 1 Complete, Phases 2-6 Remaining  
**Time Estimate:** 6-8 hours total  
**Priority:** HIGH ⭐⭐⭐

**Current Problem:**
- Extension UI is text-heavy and busy
- "My Lists" and "My Claims" tabs have lots of buttons that feel overwhelming
- All buttons are useful, but need better organization
- Information architecture could be clearer

**Phase 2: Button Reorganization (2-3 hours)**
- [ ] Reduce button clutter in "My Lists" tab card layouts
- [ ] Group related actions into dropdown menus (e.g., "More Actions" menu)
- [ ] Replace text buttons with icon buttons where appropriate
- [ ] Use progressive disclosure (hide secondary actions initially)
- [ ] Cleaner visual hierarchy for list item cards
- [ ] Consider card hover states for revealing actions
- [ ] Improve spacing and padding between elements

**Phase 3: Visual Hierarchy (1-2 hours)**
- [ ] Implement proper typography scale (headings, body, captions)
- [ ] Consistent spacing system (4px, 8px, 12px, 16px, 24px grid)
- [ ] Clear information architecture
- [ ] Visual grouping of related content
- [ ] Use of whitespace to reduce cognitive load

**Phase 4: Progressive Disclosure (1-2 hours)**
- [ ] Hide advanced features behind "More" or "Advanced" menus
- [ ] Show only essential actions by default
- [ ] Collapsible sections for optional content
- [ ] Tooltips for complex features
- [ ] Reduce number of visible elements per screen

**Phase 5: Micro-interactions (1 hour)**
- [ ] Smooth CSS transitions and animations
- [ ] Loading states (spinners, skeleton screens)
- [ ] Success confirmation animations
- [ ] Error state visual feedback
- [ ] Hover effects for interactive elements
- [ ] Focus states for accessibility

**Phase 6: Mobile Optimization (2 hours)**
- [ ] Responsive layouts for different screen sizes
- [ ] Touch-friendly button sizes (minimum 44x44px)
- [ ] Swipe gestures for list actions
- [ ] Bottom sheets for mobile web viewer
- [ ] Optimized spacing for smaller screens
- [ ] Test on actual mobile devices

**Design Inspiration:**
- Notion (clean, minimal, progressive disclosure)
- Spotify (organized, clear hierarchy)
- Linear (smooth interactions, modern UI)
- Apple Notes (simple, intuitive)

**Files Affected:**
- `popup.html` (CSS styles)
- `popup.js` (UI rendering logic, especially `displayMyLists()` and `displayMyClaims()`)

---

### 3. Leaderboard & Gamification 🏆
**Status:** Not Started  
**Time Estimate:** 5-6 hours  
**Priority:** HIGH ⭐⭐⭐

**Goal:** Drive engagement and make gift-giving fun and social

**Features to Build:**

**A. User Stats Tracking**
- [ ] Create `user_stats` database table
  - Fields: user_id, gifts_claimed, gifts_given, gifts_received, total_points, last_active, streak_days
- [ ] Track claiming activity (count per user)
- [ ] Track gifts given (when owner marks item as "received")
- [ ] Track gifts received (owner's perspective)
- [ ] Calculate points system
- [ ] Track daily streaks (consecutive days with activity)

**B. Leaderboards**
- [ ] Global leaderboard (all users)
- [ ] Friends-only leaderboard
- [ ] Time-based views:
  - This Month
  - This Year
  - All Time
- [ ] Sort by different metrics:
  - Most gifts claimed
  - Most gifts given
  - Highest points
  - Longest streak

**C. Achievement Badges**
- [ ] Create `achievements` table (user_id, achievement_type, earned_at)
- [ ] Badge types:
  - 🎁 **First Gift** - Claim your first item
  - 💚 **Generous Friend** - Claim 10+ items
  - 👑 **Gift Master** - Claim 50+ items
  - 🎅 **Secret Santa** - Claim items for 5+ different people
  - ⚡ **Early Bird** - Claim within 24 hours of item being added
  - 🔥 **On Fire** - 7-day claiming streak
  - 🌟 **Rising Star** - Top 10 on monthly leaderboard
- [ ] Display badges in user profile
- [ ] Badge notifications when earned
- [ ] Badge showcase in leaderboard

**D. Anti-Spam Measures**
- [ ] Email verification required before claiming counts
- [ ] Daily claim limits (max 5 claims per day)
- [ ] "Verify purchase" system:
  - Create `claim_confirmations` table
  - Owner can mark item as "Gift Received" or "Not Received"
  - Only confirmed gifts count toward stats
  - Unconfirmed claims after 90 days = neutral
  - Fake claims flagged = penalty points
- [ ] Reputation score (0-100 based on confirmation rate)
- [ ] Report system for suspicious activity
- [ ] Rate limiting on claims from same IP
- [ ] Cooldown period between claims on same list

**E. UI Components**
- [ ] Leaderboard tab in extension
- [ ] User badge display in header (mini badge icon)
- [ ] Profile stats page
- [ ] Achievement notification toasts
- [ ] Leaderboard rankings with avatars (initials)
- [ ] Points explanation tooltip
- [ ] "Verify Gift Received" button for list owners

**Database Schema:**
```sql
-- user_stats table
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  gifts_claimed INT DEFAULT 0,
  gifts_given INT DEFAULT 0,
  gifts_received INT DEFAULT 0,
  total_points INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_active TIMESTAMP,
  reputation_score DECIMAL(3,1) DEFAULT 100.0
);

-- achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_type VARCHAR(50),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- claim_confirmations table
CREATE TABLE claim_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  claimer_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  status VARCHAR(20), -- 'pending', 'received', 'not_received', 'reported'
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Files Affected:**
- New database tables (Supabase SQL)
- `popup.js` (new leaderboard UI, stats display)
- `popup.html` (new tab, badge icons, stats panels)
- New Edge Function for calculating leaderboards

---

## 📊 MEDIUM PRIORITY ITEMS

### 4. Enhanced Product Tracking 📈
**Status:** Basic tracking works, needs expansion  
**Time Estimate:** 3-4 hours  
**Priority:** MEDIUM ⭐⭐

**Current State:**
- Price tracking works for Amazon, Walmart, Target
- Daily cron job checks prices
- Email notifications on price drops

**Enhancements:**

**A. Price History Visualization**
- [ ] Create price history charts (use Chart.js or similar)
- [ ] Show 30-day, 90-day, all-time price trends
- [ ] Display in product detail modal
- [ ] Highlight best historical price
- [ ] Show average price over time

**B. Additional Retailers**
- [ ] Best Buy price extraction
- [ ] eBay price extraction
- [ ] Etsy price extraction
- [ ] Home Depot price extraction
- [ ] Wayfair price extraction
- [ ] Generic price extraction fallback (meta tags, JSON-LD)

**C. Stock Availability**
- [ ] Track "In Stock" vs "Out of Stock" status
- [ ] Email notification when out-of-stock item returns
- [ ] Display stock status in product card
- [ ] Historical stock availability tracking

**D. Weekly Digest Emails**
- [ ] Summarize all price changes from past week
- [ ] Group by hintlist
- [ ] Include biggest drops first
- [ ] Option to enable/disable in settings
- [ ] Send on Sunday evenings

**E. Browser Notifications**
- [ ] Chrome extension push notifications
- [ ] Notify on major price drops (>20%)
- [ ] Notify on stock availability changes
- [ ] Configurable notification thresholds

**Files Affected:**
- `price-tracking-cron.ts` (Edge Function)
- `popup.js` (price history chart rendering)
- New Edge Function for weekly digest
- `manifest.json` (notification permissions)

---

### 5. Mobile App 📱
**Status:** Not Started  
**Time Estimate:** 20+ hours  
**Priority:** MEDIUM ⭐⭐ (6-month goal)

**Decision Points:**
- **React Native** (JavaScript/React, native performance, can share code with extension)
- **Flutter** (Dart, beautiful UI, fast, growing ecosystem)
- **PWA** (Progressive Web App, works everywhere, limited native features)

**Recommended:** Start with PWA, then build React Native app if traction is good

**Features Needed:**
- [ ] All extension features (lists, products, friends, claiming)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Camera integration for barcode scanning
- [ ] Share sheet integration (share from other apps to hint)
- [ ] Offline mode (cache hintlists locally)
- [ ] Native look and feel (bottom navigation, swipe gestures)
- [ ] Face ID / Touch ID for login
- [ ] Deep linking (open specific hintlist from link)
- [ ] App Store / Play Store listings
- [ ] App icon and splash screen
- [ ] In-app browser for product links

**Technical Approach:**
1. Audit current codebase for mobile compatibility
2. Create responsive web version first
3. Convert to PWA with service worker
4. Add to home screen prompts
5. Test on various devices
6. (Later) Native app if needed

**Files Affected:**
- Entire new codebase (separate from extension)
- Shared API/backend (Supabase already works)
- Potentially shared UI components

---

## 🔮 LOW PRIORITY / FUTURE ITEMS

### 6. Auto-Purchase Feature 🤖💳
**Status:** Research/Planning Phase  
**Time Estimate:** 10+ hours  
**Priority:** LOW ⭐ (future vision, 1-2 year goal)

**Concept:**
Enable fully automated gift purchasing based on triggers:
- Price drops to specific threshold (e.g., "Buy when <$50")
- Date triggers (e.g., "Buy 7 days before birthday")
- Stock availability (e.g., "Buy when back in stock")

**Payment Infrastructure - Crypto Approach:**
- Embedded crypto wallets (user-controlled, non-custodial)
- Stablecoin payments (USDC, USDT for price stability)
- Abstracted UX (users don't need crypto knowledge)
- On/off ramps for fiat ↔ stablecoin conversion
- AI agent executes purchases automatically
- Confirmation emails after purchase

**Technical Components:**

**A. Wallet Management**
- [ ] Integrate wallet SDK (e.g., Privy, Dynamic, Magic)
- [ ] Multi-party computation (MPC) for key management
- [ ] Social recovery options
- [ ] Secure enclave storage
- [ ] Gas fee optimization

**B. Purchase Execution**
- [ ] Headless browser automation (Puppeteer/Playwright)
- [ ] Merchant API integrations where available
- [ ] Crypto → fiat conversion at checkout (via payment processor)
- [ ] Handle CAPTCHAs and anti-bot measures
- [ ] Verify return policies before purchase
- [ ] Save order confirmations

**C. Compliance & Safety**
- [ ] KYC/AML if required
- [ ] Transaction limits
- [ ] Purchase approval flow (optional)
- [ ] Spending controls
- [ ] Fraud detection

**Benefits:**
- ✅ No credit card storage (no PCI compliance needed)
- ✅ User owns wallet (control & transparency)
- ✅ Programmable money (smart contracts)
- ✅ Lower payment fees
- ✅ Cross-border payments

**Challenges:**
- ❌ Most retailers don't accept crypto directly
- ❌ User onboarding complexity
- ❌ Regulatory uncertainty
- ❌ Gas fees can be unpredictable
- ❌ Need intermediary (BitPay, Coinbase Commerce, or gift card services)

**Alternative Approach:**
- Traditional payment processor (Stripe)
- Save encrypted payment methods
- Still use trigger logic
- Easier to implement, more merchant support

**Files Affected:**
- New microservice/backend for purchase automation
- Payment integration code
- Database for storing purchase history
- Legal disclaimers and terms of service

---

### 7. Advanced Analytics & Insights 📊
**Status:** Not Started  
**Time Estimate:** 5-6 hours  
**Priority:** LOW ⭐

**Features:**
- [ ] Personal analytics dashboard
  - Spending patterns
  - Most common product categories
  - Price drop savings
  - Gift-giving insights
- [ ] Hintlist analytics
  - Most viewed items
  - Claim rate percentages
  - Popular price ranges
- [ ] Friend insights
  - Most generous friends
  - Mutual interests (similar products)
  - Gift exchange balance
- [ ] Platform-wide trends
  - Trending products
  - Popular categories
  - Average prices by category
  - Seasonal patterns

**Files Affected:**
- New analytics Edge Function
- `popup.js` (charts and visualizations)
- Database views for aggregated data

---

### 8. Social Features 🌐
**Status:** Not Started  
**Time Estimate:** 8-10 hours  
**Priority:** LOW ⭐

**Features:**
- [ ] Activity feed (friend added item, claimed item, etc.)
- [ ] Comments on hintlist items
- [ ] Direct messaging between friends
- [ ] Group hintlists (e.g., wedding registry, baby shower)
- [ ] Friends of friends suggestions
- [ ] Popular items across platform
- [ ] Share to social media (Twitter, Facebook)
- [ ] Embed hintlist widget on personal website

---

### 9. Communication Enhancements 💬
**Status:** Basic emails work, needs expansion  
**Time Estimate:** 3-4 hours  
**Priority:** LOW ⭐

**Features:**
- [ ] In-app notifications center
- [ ] Notification preferences per hintlist
- [ ] Weekly digest emails (price drops, friend activity)
- [ ] SMS notifications (via Twilio)
- [ ] Slack/Discord integrations
- [ ] Calendar integration (add key dates to Google Calendar)

---

### 10. Performance & Infrastructure 🚀
**Status:** Ongoing  
**Time Estimate:** Varies  
**Priority:** ONGOING ⭐

**Tasks:**
- [ ] Optimize database queries (add indexes)
- [ ] Implement caching layer (Redis)
- [ ] Rate limiting on APIs
- [ ] Error logging and monitoring (Sentry)
- [ ] Analytics integration (PostHog, Mixpanel)
- [ ] A/B testing framework
- [ ] Backup and disaster recovery plan
- [ ] Load testing
- [ ] CDN for static assets

---

## 🐛 KNOWN BUGS / TECH DEBT

**None currently reported** - Add here as issues arise

---

## 📖 DOCUMENTATION NEEDS

- [ ] API documentation for developers
- [ ] User guide / help center
- [ ] Video tutorials for key features
- [ ] FAQ page
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Contributing guide (if open source)

---

## 💡 SUGGESTED NEXT SESSION PLAN

**Session 1 (4-5 hours):**
1. Fix Non-User Web Viewer (2 hours)
2. UI Streamlining Phase 2 (2-3 hours)

**Session 2 (5-6 hours):**
1. UI Streamlining Phases 3-6 (4-5 hours)
2. Start Leaderboard (database schema + basic tracking)

**Session 3 (5-6 hours):**
1. Complete Leaderboard & Gamification

**Session 4 (3-4 hours):**
1. Enhanced Product Tracking (price charts, more retailers)

---

## 📊 PROJECT METRICS

**Current Status:**
- **Core Features:** 95% complete ✅
- **Friends & Sharing:** 100% complete ✅
- **Settings:** 100% complete ✅
- **Email System:** 100% complete ✅
- **Price Tracking:** 90% complete (basic works, enhancements pending)
- **UI Polish:** 20% complete (Phase 1 done, 5 phases remaining)
- **Gamification:** 0% complete
- **Mobile App:** 0% complete

**Total Development Time to Date:** ~60+ hours  
**Lines of Code:** ~2,000+ (popup.js alone is ~1,900 lines)

---

## 🎯 VISION & LONG-TERM GOALS

**6 Months:**
- 1,000+ active users
- Mobile app launched (PWA minimum)
- Leaderboard & gamification live
- UI fully polished
- All high-priority items complete

**1 Year:**
- 10,000+ active users
- Auto-purchase beta (traditional payments)
- Partnerships with retailers
- Revenue positive (affiliate links, premium features)

**2 Years:**
- 100,000+ active users
- Crypto auto-purchase live
- AI-powered gift recommendations
- International expansion
- Potential Series A fundraising

---

**End of TODO List**
