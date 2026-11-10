# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users: Friends and college students in Indonesia dining out together at restaurants, cafes, or warungs, sharing joint dining bills and splitting expenses after social meals. Secondary audience: Social group organizers who pay the upfront bill and need to collect shares via WhatsApp.

## Product Purpose

Smart Split Bill eliminates the awkward friction, manual calculation errors, and privacy concerns of splitting group meal bills. It provides an instant, zero-retention OCR workflow that parses physical Indonesian receipts, divides items and shared charges (PPN/tax, service charge, discounts) with mathematical exactness down to Rp 0 rounding difference, and produces ready-to-paste WhatsApp breakdown summaries and shareable stateless URLs. Success means bills are settled in under two minutes with zero calculation discrepancies and zero user data saved on servers.

## Positioning

Unlike typical expense-sharing apps (Splitwise, etc.) that require accounts, persistent cloud databases, and friend networks, Smart Split Bill operates completely statelessly with Zero Data Retention: receipt images live only in temporary RAM (`tmpfs`), state is encoded entirely in client-side URL fragment hashes (`#hash`), and calculation uses the Hare-Niemeyer Largest Remainder method to ensure exact integer Rupiah totals without Rp 1 rounding drift.

## Operating Context

- Mobile and desktop web browsers (Chrome, Safari, Firefox).
- Noisy, crumpled, or varied Indonesian printed receipts (thermal paper from cafes, restaurants, minimarkets) containing subtotal, tax (PB1/PPN 10-11%), service charge (typically 5-10%), and item-level discounts.
- WhatsApp / Telegram messaging groups where users paste textual breakdown summaries for immediate settlement via e-wallets (GoPay, OVO, Dana) or bank transfers (BCA, Mandiri).
- Ephemeral, cold-starting backend hosting on Render free tier (paired with Vercel frontend CDN) requiring warm-up handling and clear connectivity feedback.

## Capabilities and Constraints

- **Four-step sequential wizard:**
  1. *Upload:* In-browser image compression, HEIC/EXIF normalization, drag-and-drop, camera upload, fallback to manual entry.
  2. *Review Items:* OCR result editing, adding/removing items, price and quantity corrections, tax, service charge, item/bill discount adjustments.
  3. *Assign:* Participant management (add/remove friends), item-by-item assignment, split portion toggle, select-all shortcuts.
  4. *Summary:* Proportional breakdown per person, Largest Remainder math verification (diff = Rp 0), copy-ready WhatsApp text export, URL fragment share link generation, reset.
- **Strict Ephemeral Architecture:** No database (PostgreSQL, MongoDB, SQLite). No user accounts or authentication. Zero image retention (processed in-memory, destroyed immediately).
- **Client-Side State Sharing:** Shared bills encode state strictly into window.location.hash using JSON + base64/compression, keeping storage serverless and private.
- **Indonesian Currency & Locale:** All amounts formatted in IDR (Rupiah, `id-ID`), comma/dot separator handling for receipts, handling of common Indonesian receipt conventions.

## Brand Commitments

- **Name:** Smart Split Bill
- **Identity:** Clean, functional, and trustworthy financial tool. Minimalist, transparent, without clutter or aggressive growth hacks.
- **Tone:** Practical, direct, respectful of privacy, utilitarian.

## Evidence on Hand

- Frontend code in `smart-split-bill-fe`: React 19, TypeScript, Tailwind CSS v4, Zustand store (`useBillStore.ts`), Largest Remainder implementation (`calculator.ts`), URL hash sharing (`hashShare.ts`).
- Backend code in `smart-split-bill-be`: FastAPI, Tesseract OCR 5.x (`ocr.py`), custom regex parser for Indonesian receipts (`parser.py`), ephemeral tmpfs memory handling, rate limiting.
- Unit test suite for parser and calculation engine in `smart-split-bill-be/tests` and `smart-split-bill-fe/src/utils/calculator.test.ts`.

## Product Principles

1. **Zero Data Retention:** Never store receipts, names, or financial breakdowns in a persistent database. What happens in RAM stays in RAM and vanishes after response.
2. **Mathematically Honest:** Every single Rupiah is accounted for. Total of individual shares must match receipt total down to Rp 0 difference using Largest Remainder integer distribution.
3. **Frictionless & Accountless:** No sign-up, no login, no passwords. Open the URL, scan or enter, share, and settle immediately.
4. **Resilient to Real-World Chaos:** Thermal receipts are crumpled and OCR is imperfect; always allow effortless manual corrections, price adjustments, and offline manual bill-splitting.

## Accessibility & Inclusion

- High contrast text for legible reading in bright cafe or dim restaurant lighting.
- Clear step-by-step progress indication with aria-compatible semantics.
- Works reliably on touchscreens and mobile viewports as well as desktop browsers.
