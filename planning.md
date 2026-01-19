# Hint - Planning

> Gift-sharing platform with Chrome extension, mobile app, and web viewer for Riverside Co.

---

## Project Setup Checklist

> Complete these items before starting any development work. Based on best practices from [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices), [Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/), [Claude Code Tips](https://github.com/ykdojo/claude-code-tips), and community research.

### Phase 0: Pre-Planning

- [x] **Begin in plan mode** - Comprehensive backlog.md exists with feature tracking
- [x] **Create spec.md** - Project documented in backlog.md with full feature specs
- [x] **Tech stack established** - Supabase + Chrome Extension + React Native/Expo

### Phase 1: Project Structure Setup

- [x] **Directory structure** - Multi-app monorepo structure:
  ```
  hint/
  ├── hint-extension/        # Chrome extension (Manifest V3)
  │   ├── popup.js           # Main extension UI (5,528 lines)
  │   ├── popup.html         # Extension popup
  │   ├── background.js      # Service worker
  │   ├── content.js         # Page scraping
  │   └── shared/            # Shared services with mobile
  ├── hint-mobile-test/      # React Native/Expo mobile app
  │   └── src/screens/       # App screens
  ├── hint-gh-pages/         # Web viewer (GitHub Pages)
  ├── hint-app-v2/           # Alternative app version
  ├── backlog.md             # Comprehensive project backlog
  └── restart.md             # Session restart notes
  ```

- [x] **Create backlog.md** - Comprehensive tracking document in place
- [ ] **Create CLAUDE.md** - Project conventions and gotchas

### Phase 2: Workflow Setup

- [x] **Session templates** - Checkpoint and restart templates in backlog.md
- [ ] **Set up handoff system** - Full session continuity system
- [ ] **Context compaction agent** - Auto-trigger at 75% context usage

### Phase 3: Development Standards

- [ ] **Testing strategy** - Define test approach for extension + mobile
- [x] **Git workflow** - Repository initialized with .gitignore
- [ ] **Dual review pattern** - Set up second AI reviewer

### Phase 4: Post-Planning Setup

- [ ] **Create /init file** - Context optimization file for new sessions

---

## Default Tech Stack

| Category | Current Choice | Notes |
|----------|----------------|-------|
| **Extension** | JavaScript/HTML/CSS | Manifest V3, service worker |
| **Mobile** | React Native 0.81.5 + Expo 54 | Code sharing with extension |
| **Backend** | Supabase | PostgreSQL + Auth + Edge Functions + RLS |
| **Database** | PostgreSQL | Via Supabase with Row Level Security |
| **Auth** | Supabase Auth | Email/password, JWT sessions |
| **Storage** | Chrome Storage / AsyncStorage | Platform-abstracted |
| **Styling** | CSS3 / React Native Paper | Theme: #228855 primary |
| **Fonts** | Leckerli One (logo), Bradley Hand (emails) | System fonts for UI |
| **Build (Mobile)** | EAS | Expo Application Services |
| **Hosting (Web)** | GitHub Pages | Static web viewer |

---

## Vision

A gift-sharing platform that makes it easy to create, share, and manage "hintlists" (wishlists) across devices. Users can capture products from any website, share lists with friends and family, and claim gifts secretly.

---

## Architecture

```
hint/
├── hint-extension/           # Chrome Extension (MVP Complete)
│   ├── popup.js              # Main UI and logic
│   ├── background.js         # Service worker
│   ├── content.js            # Page scraping
│   └── shared/               # TypeScript services layer
│
├── hint-mobile-test/         # Mobile App (In Development)
│   ├── App.tsx               # Entry point
│   ├── src/screens/          # Screen components
│   └── src/services/         # Shared with extension
│
├── hint-gh-pages/            # Web Viewer (GitHub Pages)
│   └── index.html            # Public hintlist viewer
│
└── Supabase Backend
    ├── lists                 # Hintlist storage
    ├── products              # Product/item storage
    ├── friends               # Friend connections
    ├── user_stats            # Leaderboard data
    └── Edge Functions        # Price tracking, notifications
```

---

## Core Capabilities

### In Production (95% MVP)
- One-click product capture from any website
- Multiple named hintlists with privacy controls
- Share codes and QR codes for sharing
- Secret claiming system (owner sees count only)
- Guest claiming via web viewer
- Friend requests and friend list viewing
- Email notifications (4-level preferences)
- Price tracking with alerts
- Key date reminders
- Data export (CSV/Excel)
- Dark mode toggle

### In Development
- Mobile app foundation (React Native/Expo)
- Leaderboard and gamification
- Enhanced price tracking

### Planned Features
- Push notifications
- Location-based reminders
- Social features (activity feed, comments)
- Auto-purchase capability

---

## Current Priorities

### High Priority Bugs
1. Web viewer access codes not validating
2. Web viewer still showing purple branding (should be #228855 green)
3. Web viewer "wishlist" terminology (should be "hintlist")

### Next Features
1. Complete mobile app API integration
2. Connect leaderboard to actual user_stats
3. Additional retailer support (Best Buy, eBay, Etsy)

---

## Open Questions

- Should mobile app be PWA-first or React Native?
- Monetization strategy: Affiliate links vs premium features?
- Should gamification be opt-in or default?
- TypeScript migration for remaining JS files?

---

## Research & References

### Key Technical Docs
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### Project Resources
- Supabase Dashboard: Project-specific URL
- Chrome Web Store: Extension publishing
- GitHub Pages: https://wahans.github.io/hint/

---

## Milestones

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Chrome Extension MVP | Complete |
| 2 | Web Viewer | Complete (bugs remain) |
| 3 | Mobile App Foundation | In Progress |
| 4 | Leaderboard & Gamification | Scaffolded |
| 5 | Enhanced Price Tracking | Planned |
| 6 | Social Features | Planned |

---

## Notes

*Last Updated: January 2026*
*MVP Status: 95% Complete (~60+ hours development)*

