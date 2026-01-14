# Hint Project - Session Restart Guide

Quick reference for picking up where you left off.

**Last Updated:** January 13, 2026 (Night)

---

## Current Status: 99% MVP Complete

**Phase:** Mobile App Feature Complete - TestFlight Build 9 Live

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

## Mobile App Status (TestFlight Build 9)

**Build 9 (Latest):**
- Improved modal and card UI styling
- Better header icon centering (marginRight offset)
- ProductCard with 72x72 images and chips row layout
- Cleaner modal spacing and button alignment
- Added try-catch for URL parsing safety
- Fixed guest claimer detection in ProductCard

**Build 8:**
- Fixed Friends tab crash (error handling + data validation)
- Fixed Share modal layout (title inside box, no inner divider)
- Removed Share Code from Edit List (now only in Share modal)
- Fixed header icon sizing

**Build 7:**
- Deep linking support for hint:// scheme
- Web link support for https://hint.com/list/{id}
- Supported routes: list/{id}, lists, friends, leaderboard, settings, activity
- Android intent filters configured

**Build 6:**
- Header shows only Hint logo (removed "My Lists" text)
- Centered share/edit icons in list detail header
- Fixed product modal spacing (removed floating line, more space before Close)
- Fixed Friends tab crash (null checks for user data)
- Auto-pass export compliance (ITSAppUsesNonExemptEncryption)

**Build 5:**
- Separate share and edit icons in header (replaced 3-dot menu)
- Share List modal with share code, copy code/link buttons
- Fixed date picker text visibility
- Added password change to Account settings

**Earlier Builds:**
- Hint logo on login screen
- Leaderboard with This Week / This Month / All Time
- Product detail modal with image, price, and "Mark as Claimed" button
- Edit List screen with full settings
- Add Friend by Email + Invite Friend functionality
- Friend Requests with accept/reject
- Due Date picker on Create List
- Notification Center for in-app activity
- Due Date Reminder settings

**Deploy to TestFlight:**
```bash
cd hint-mobile-test
eas build --platform ios --profile production --non-interactive
eas submit --platform ios --non-interactive
```

---

## Next Up (Planned Features)

1. **Push Notifications** - OneSignal integration for real push delivery
2. **Share Extension** - Receive shares from other apps
3. **Barcode Scanning** - Nice-to-have for in-store use
4. **Production Launch** - Move from TestFlight to App Store

**Completed:** Account Settings, Deep Linking (hint:// scheme)

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
cd hint-mobile-test && eas build --platform ios --profile production --non-interactive && eas submit --platform ios --latest --non-interactive
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

**GitHub:** https://github.com/wahans/hint

Initialized Jan 13, 2026. Key commits:
- `b407e31` - Initial commit with full project
- `babb092` - Mobile app UI fixes (logo, leaderboard, product modal)
- `31cc608` - Add App Store Connect App ID
- `6281689` - Add Edit List, Friends management, and Notification features
- `5aafb14` - Fix UI issues and add Share List modal (Build 5)
- `a094bd1` - Fix UI polish and Friends tab crash (Build 6)
- `e865961` - Add deep linking support (Build 7)
- `7fb6cea` - Fix Friends crash, Share modal, remove share from Edit (Build 8)
- `527916b` - Improve modal and card UI styling (Build 9)

---

*Update this file at the end of each session.*
