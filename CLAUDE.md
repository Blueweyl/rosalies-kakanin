# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rosalie's Kakanin — a static website for a Filipino kakanin (rice cake) food business in Marilao, Bulacan, Philippines. Product of RDC Corporation. Hosted on **GitHub Pages** at `https://blueweyl.github.io/rosalies-kakanin/`.

No build step, no bundler, no framework. Pure HTML/CSS/JS served statically.

## Deployment

Push to `master` branch auto-deploys to GitHub Pages. Changes take 1-2 minutes to propagate. When modifying CSS, bump the `?v=N` cache-buster query param on the `<link>` tag in both `index.html` and `checkout.html`.

## Architecture

### Public Site (`index.html`)
- **CSS:** `css/style.css` — single file, all styles including checkout page styles
- **JS:** `js/app.js` — scroll reveal (IntersectionObserver), sticky header, mobile menu, back-to-top, tile 3D hover
- **JS:** `js/cart.js` — IIFE that injects "Add" buttons into `.menu-card` elements, manages cart in `localStorage` (`rosalies_cart`), renders sticky cart bar + cart modal. Exposes `window.RosaliesCart` API (`getCart`, `getCartTotal`, `clearCart`)

### Checkout (`checkout.html`)
- Inline `<script>` handles order type (delivery/pickup), payment method, and order confirmation via Facebook Messenger (`m.me/rosalieskakanin`)
- Google Maps integration with API key for geolocation, address search, and draggable pin
- Delivery orders enforce GCash-only payment (COD disabled)
- `window.renderCheckoutSummary` is called by cart.js when cart updates

### Admin Panel (`admin.html`)
- **CSS:** `css/admin.css` — separate stylesheet
- **JS:** `js/admin.js` — session auth via `sessionStorage` (password: `rosalies2026`), posts stored in `localStorage` (`rosalies_admin`)
- Features: post CRUD, AI marketing agent (built-in templates + optional Claude API), social media auto-posting (Facebook Graph API, Instagram Graph API, TikTok API — requires user's API keys)

### Key Design System (CSS Variables)
- Colors: `--cream` `--forest` `--forest-deep` `--gold` `--sage` `--paper` `--ink`
- Fonts: Cormorant Garamond (italic headings), Italiana (display), Jost/system (body)
- Animations: `.reveal` class with IntersectionObserver, `--transition-smooth`, `--transition-spring`

## Menu Data

Product data lives directly in `index.html` as HTML markup (`.menu-card` elements). Prices are extracted at runtime by `cart.js` parsing the `.price` div text for the first `₱` number. When updating prices, edit the HTML directly — there is no separate data file.

## Images

- `images/products/` — product poster images with both original Facebook filenames and clean renamed copies (e.g., `bibingka-special.jpg`). Menu cards reference the clean names.
- `images/banners/` — hero banner image
- `images/rosalie.jpg` — owner photo used in About section

## Social Media URLs

Facebook, Instagram, and TikTok links appear in: header nav, mobile menu, contact section, and footer. All point to `/rosalieskakanin` handles. Update all locations if handles change.

## Business Hours

Mon–Thu: 5:00 AM – 9:00 PM, Fri–Sun: 5:00 AM – 10:00 PM. Displayed in hero strip and contact section.
