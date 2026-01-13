# Hint Project - Session Restart Guide

Quick reference for picking up where you left off.

**Last Updated:** January 13, 2026

---

## Current Status: 95% MVP Complete

**Phase:** Polishing & Enhancement (post-MVP)

---

## What's Working (In Production)

- **Chrome Extension v1.1.0** - Full functionality with Manifest V3
- **Core Features** - Auth, multiple hintlists, product capture from 20+ retailers
- **Friends & Sharing** - Friend requests, public/private lists, 8-char share codes, QR codes
- **Claiming** - Secret claims, guest claiming (no account needed), notifications
- **Price Tracking** - Daily cron jobs for Amazon/Walmart/Target, alerts
- **Emails** - Key date reminders (60/30/15 days), claim notifications, price drops
- **Branding** - Green theme (#228855), "hintlist" terminology, dark mode
- **Mobile Foundation** - React Native/Expo scaffolding with navigation and auth

---

## Needs Attention (High Priority Bugs)

1. **Web viewer** - Working. Uses "wishlist" terminology. Green branding (#228855). Access code validation uses `access_code` field with `is_public=true` check.
2. **Mobile app** - CONNECTED: Friends API and leaderboard now connected to real Supabase data via new services (friends.service.ts, leaderboard.service.ts)

---

## Next Up (Planned Features)

1. **Leaderboard & Gamification** - Points, badges, anti-spam (schema ready, no UI)
2. **UI Polish Phases 2-6** - Button cleanup, visual hierarchy, animations
3. **Enhanced Price Tracking** - History charts, more retailers
4. **Mobile App Completion** - Push notifications, barcode scanning, deep linking

---

## Long-term Vision

- **6 months:** 1,000+ users, mobile app live, gamification
- **1 year:** 10,000+ users, auto-purchase beta, affiliate revenue
- **2 years:** 100,000+ users, crypto payments, AI recommendations

---

## Quick Start Prompts

**Check current state:**
```
Read ~/Documents/hint-parcel/restart.md. What should I work on next?
```

**Test web viewer:**
```
Open http://localhost:8080/?code=YOUR_ACCESS_CODE after running: cd hint-gh-pages && python3 -m http.server 8080
```

**Mobile app (CONNECTED):**
```
Friends API and leaderboard connected on Jan 13, 2026. New services: friends.service.ts, leaderboard.service.ts. Screens updated: FriendsListsScreen.tsx, LeaderboardScreen.tsx
```

**Work on gamification:**
```
Help me implement the leaderboard UI for hint. The Supabase schema is ready in supabase-leaderboard.sql.
```

---

## Project Locations

| Project | Path |
|---------|------|
| Main Backlog | backlog.md |
| Chrome Extension | hint-extension/ |
| Mobile App | hint-mobile-test/ |
| This File | ~/Documents/hint-parcel/restart.md |

---

## Tech Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Extension | JavaScript/HTML/CSS, Manifest V3 |
| Mobile | React Native 0.81.5, Expo 54 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Theme | #228855 primary, #f0f9f4 background |
| Fonts | Leckerli One (logo), Bradley Hand (emails) |

---

*Update this file at the end of each session.*
