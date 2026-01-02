# Hint Web Viewer - Non-User Access

This standalone web viewer allows non-users to view and claim items from public hintlists without creating an account.

## Features

✅ View public hintlists with access code
✅ Mobile-responsive design
✅ Guest claiming (name + email)
✅ Updated branding (green #228855)
✅ "hint" logo with Leckerli One font
✅ Direct product links
✅ Price display
✅ CTA to install extension

## Setup Instructions

### 1. Update Supabase Credentials

Edit `app.js` and replace:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual Supabase URL and anon key.

### 2. Run SQL Setup

Run the SQL in `guest-claiming-setup.sql` in your Supabase SQL Editor:
- Adds guest claim columns to products table
- Creates `claim_product_as_guest` function
- Creates `public_products` view
- Grants permissions to anonymous users

### 3. Deploy to GitHub Pages

1. Create a new repo or use existing: `wahans.github.io/hint/`
2. Upload these files:
   - `index.html`
   - `app.js`
3. Enable GitHub Pages in repo settings
4. Site will be live at: `https://wahans.github.io/hint/`

### 4. Update Extension (Optional)

Add a "Share" button in the extension that generates links like:
```
https://wahans.github.io/hint/?code=ABC123XY
```

## Usage

### For List Owners (with extension):
1. Create a hintlist
2. Make it public (generates access code)
3. Share link: `https://wahans.github.io/hint/?code=YOUR_CODE`
4. Non-users can view and claim items

### For Non-Users:
1. Receive link from friend
2. Click link → automatically loads hintlist
3. Browse available items
4. Click "I'll Buy This" to claim
5. Enter name and email
6. Item is claimed (hidden from others)

## URL Parameters

- `?code=ABC123XY` - Auto-loads hintlist with this access code

## Guest Claiming Flow

1. Guest clicks "I'll Buy This"
2. Modal asks for name and email
3. Item is marked as claimed
4. Guest info stored in database
5. List owner gets email notification (future)
6. Item no longer appears for other guests

## Database Schema Changes

New columns added to `products` table:
- `guest_claimer_name` - TEXT
- `guest_claimer_email` - TEXT

These are used when a non-user claims an item.

## Future Enhancements

- [ ] Email notifications to list owner when guest claims
- [ ] Email confirmation to guest after claiming
- [ ] Allow guests to unclaim (with email verification)
- [ ] Show guest's initials to owner (e.g., "Claimed by J.S.")
- [ ] Invite system (email invitations from extension)
- [ ] QR code generation for easy sharing
- [ ] Product images
- [ ] Price history
- [ ] "Create your own hintlist" signup flow

## Files

- `index.html` - Main HTML file with styling
- `app.js` - JavaScript for loading and claiming
- `guest-claiming-setup.sql` - Database setup
- `README.md` - This file

## Branding

- Primary color: #228855 (teal green)
- Font: Leckerli One (logo)
- Font: System sans-serif (body)

## Mobile Support

Fully responsive design with:
- Flexible layouts
- Touch-friendly buttons
- Optimized font sizes
- Stack buttons on mobile

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

**Last Updated:** January 2, 2026
