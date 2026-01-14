# Hint Project - Session Restart Guide

Quick reference for picking up where you left off.

**Last Updated:** January 13, 2026

---

## Current Status: 99% MVP Complete

**Phase:** Mobile App Feature Complete - Ready for TestFlight Build 4

---

## What's Working (In Production)

- **Chrome Extension v1.1.0** - Full functionality with Manifest V3
- **Core Features** - Auth, multiple hintlists, product capture from 20+ retailers
- **Friends & Sharing** - Friend requests, public/private lists, 8-char share codes, QR codes
- **Claiming** - Secret claims, guest claiming (no account needed), notifications
- **Price Tracking** - Daily cron jobs for Amazon/Walmart/Target, alerts
- **Emails** - Key date reminders (60/30/15 days), claim notifications, price drops
- **Branding** - Green theme (#228855), "wishlist" terminology, dark mode
- **Web Viewer** - Working with access code validation
- **Mobile App** - React Native/Expo with full API integration

---

## Mobile App Status (Ready for TestFlight Build 4)

**Completed Today (Jan 13, 2026):**
- Added hint logo to login screen
- Leaderboard now shows This Week / This Month / All Time
- Product detail modal with image, price, and "Mark as Claimed" button
- Fixed three-dot menu positioning and added confirmation dialogs
- Friends API connected (friends.service.ts)
- Leaderboard API connected (leaderboard.service.ts)
- App Store Connect ID configured in eas.json for easy deploys
- **NEW: Edit List screen** - Full settings (name, due date, privacy, notifications, share code)
- **NEW: Add Friend by Email** - Search users and send friend requests
- **NEW: Invite Friend** - Share invite link to non-users
- **NEW: Friend Requests** - View and accept/reject pending requests with FAB menu
- **NEW: Due Date on Create List** - Set key dates when creating lists
- **NEW: Notification Center** - In-app activity feed for viewing notifications
- **NEW: Due Date Reminders** - Settings for 60/30/15 day reminders

**Deploy to TestFlight:**
```bash
cd hint-mobile-test
eas build --platform ios --profile production --non-interactive
eas submit --platform ios --non-interactive
```

---

## Next Up (Planned Features)

1. **Push Notifications** - OneSignal integration for real push delivery
2. **Account Settings** - Password change, delete account
3. **Mobile Polish** - Barcode scanning, deep linking, share extension
4. **Production Launch** - Move from TestFlight to App Store

---

## Long-term Vision

- **6 months:** 1,000+ users, mobile app live on App Store, gamification
- **1 year:** 10,000+ users, auto-purchase beta, affiliate revenue
- **2 years:** 100,000+ users, crypto payments, AI recommendations

---

## Quick Start Prompts

**Check current state:**
```
Read restart.md. What should I work on next?
```

**Test web viewer locally:**
```
cd hint-gh-pages && python3 -m http.server 8080
# Then open http://localhost:8080/?code=YOUR_ACCESS_CODE
```

**Run mobile app locally:**
```
cd hint-mobile-test && npx expo start
```

**Build & deploy to TestFlight:**
```
cd hint-mobile-test && eas build --platform ios --profile production --non-interactive && eas submit --platform ios --non-interactive
```

---

## Project Locations

| Project | Path |
|---------|------|
| Main Backlog | backlog.md |
| Chrome Extension | hint-extension/ |
| Mobile App | hint-mobile-test/ |
| Web Viewer | hint-gh-pages/ |
| This File | restart.md |

---

## Tech Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Extension | JavaScript/HTML/CSS, Manifest V3 |
| Mobile | React Native 0.81.5, Expo 54, React Native Paper |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Theme | #228855 primary, #f0f9f4 background |
| Fonts | Leckerli One (logo), Bradley Hand (emails) |
| Deploy | EAS Build + Submit, App Store Connect ID: 6757765732 |

---

## Git Repo

Initialized Jan 13, 2026. Key commits:
- `b407e31` - Initial commit with full project
- `babb092` - Mobile app UI fixes (logo, leaderboard, product modal)
- `31cc608` - Add App Store Connect App ID

---

*Update this file at the end of each session.*
