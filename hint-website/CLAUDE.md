# Hint Website

Simple, clean marketing website for hint - styled after Phantom.com but with hint's green color palette.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Design System

### Color Palette (Green, replacing Phantom's purple)
- `--hint-50` to `--hint-950`: Full green scale
- Accent colors: mint, lime, teal, emerald for feature cards

### Components
- `Navigation`: Sticky header with dropdown menus
- `Hero`: Large hero section with gradient background
- `Features`: Feature cards grid with hover effects
- `Footer`: Multi-column footer with social links

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
```

## Structure
```
src/
├── app/
│   ├── globals.css    # Design tokens & custom CSS
│   ├── layout.tsx     # Root layout with fonts
│   └── page.tsx       # Homepage
└── components/
    ├── Navigation.tsx
    ├── Hero.tsx
    ├── Features.tsx
    ├── Footer.tsx
    └── index.ts
```

## Reference
- Design inspired by: https://phantom.com/
- Green palette replaces Phantom's purple/violet theme
