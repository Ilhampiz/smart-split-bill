# Critique: smart-split-bill-fe/src/App.tsx

⚠️ DEGRADED: single-context (sub-agent tool unavailable due to auto-mode classifier outage)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Backend cold-start health check and OCR loading spinner clear; missing upload progress bar for large receipt images. |
| 2 | Match System / Real World | 4 | Indonesian locale (Rp, thousands separators), natural receipt itemization (PPN, PB1, Service Charge), WhatsApp summary formatting. |
| 3 | User Control and Freedom | 3 | Step back/forward navigation functional; reset confirmation dialog missing (accidental data loss risk on "Mulai Tagihan Baru"). |
| 4 | Consistency and Standards | 3 | Clean Slate palette consistent; minor variation in button heights (h-8 vs h-9) and chip radiuses (rounded-md vs rounded-full). |
| 5 | Error Prevention | 3 | Exact Rp 0 balance verification via Largest Remainder; lacks confirmation guard when resetting or removing participants with active assignments. |
| 6 | Recognition Rather Than Recall | 4 | Real-time unassigned item warning badge; individual portion fractions and participant chips visible at point of decision. |
| 7 | Flexibility and Efficiency | 2 | Has "Bagi ke Semua" shortcut; lacks batch participant assignment, keyboard shortcuts (Enter to add, Tab navigation), and drag-to-split. |
| 8 | Aesthetic and Minimalist Design | 4 | "The Clean Ledger" aesthetic strictly upheld: 1px hairline borders, high contrast slate-on-bone, zero decorative clutter. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 2 | Backend offline badge shown; OCR failure shows generic toast without image re-crop/re-upload or targeted item repair prompt. |
| 10 | Help and Documentation | 3 | Explanatory subtitle on proportional tax allocation; lacks inline tooltip explaining how Largest Remainder handles fractional Rupiah. |
| **Total** | | **31/40** | **Good** |

## Design Specificity Verdict

**LLM assessment**: The interface exhibits high domain grounding for post-meal dining in Indonesia. Visual hierarchy adheres to "The Clean Ledger" system documented in `DESIGN.md`: utilitarian hairline cards (`#e2e8f0`), tabular numerals for currency, and deliberate absence of decorative drop shadows. However, interaction models lean slightly generic web-form rather than mobile cafe-table optimized: touch targets for participant chips (24px-28px) are undersized for thumb navigation, and OCR error recovery lacks visual receipt-to-item mapping.

**Deterministic scan**: Static code inspection across `App.tsx`, `Step1Upload.tsx`, `Step2ReviewItems.tsx`, `Step3Assign.tsx`, and `Step4Summary.tsx`:
- Missing explicit `aria-label` on icon-only actions (delete item button, remove participant button).
- Touch target sizing on participant delete triggers (`w-3.5 h-3.5`) and checkbox chips (`w-3.5 h-3.5`) violates the 44×44px WCAG minimum.
- Native `number` input spinner styles visible in some desktop browsers without `appearance-none`.

**Visual overlays**: Unavailable (single-context degraded execution mode without browser script injection).

## Overall Impression
Strict, functional, mathematically honest accounting tool. Excels at data clarity and exactness. Main friction lies in mobile ergonomic efficiency (small touch targets on cafe tables) and missing guardrails on destructive reset actions.

## What's Working
1. **Mathematical Transparency**: Rp 0 difference banner and breakdown of Subtotal + PPN + Service Charge creates instant social trust.
2. **"The Clean Ledger" Restraint**: Monochrome slate-on-bone canvas prevents visual fatigue during multi-item receipt audits.
3. **Stateless Privacy Execution**: Clear `#hash` URL indicator and zero-retention messaging reinforces ephemeral security.

## Priority Issues
- **[P1] Touch Target Violations on Mobile Viewports**: Participant chips, delete buttons, and assignment toggles measure ~24px-32px tall. On mobile screens (primary usage scene at restaurants), thumb misclicks occur frequently.
  - *Fix*: Expand touch targets to minimum 44×44px hit areas using Tailwind `min-h-[44px]` or padding envelopes.
  - *Suggested command*: `/impeccable adapt`
- **[P1] Destructive Reset Lacks Guardrail**: "Mulai Tagihan Baru" in Step 4 immediately invokes `resetAll()` without confirmation, discarding edited receipts and participant data permanently.
  - *Fix*: Add inline confirmation modal or undo toast before wiping ephemeral store.
  - *Suggested command*: `/impeccable harden`
- **[P2] Missing Interactive Receipt-to-Item Visual Mapping**: Step 2 displays OCR items in an isolated list without reference to the original uploaded receipt image.
  - *Fix*: Provide collapsible/split receipt image preview sheet so users can verify blurry or misread items directly against the bill.
  - *Suggested command*: `/impeccable layout`
- **[P2] WhatsApp Summary Lacks Payment Destination Slot**: Step 4 generates plain text copy without placeholder or prompt for bank account (BCA/Mandiri) or e-wallet (GoPay/OVO/Dana) numbers.
  - *Fix*: Add optional payee field or payment note template in Step 4 export panel.
  - *Suggested command*: `/impeccable clarify`

## Persona Red Flags
- **Casey (Distracted Mobile User)**: Using phone one-handed at a noisy cafe table. Red flag: Tapping tiny participant pills (`px-2.5 py-1.5`) and delete crosses (`p-1 text-slate-300`) leads to repeated mis-taps and accidental deletions.
- **Jordan (First-Timer)**: Unsure if OCR captured everything. Red flag: No side-by-side receipt image preview to cross-check item prices; must switch between phone photo gallery and browser tab.
- **Budi (Social Organizer / Bill Payer)**: Paid the restaurant bill upfront, needs friends to transfer immediately. Red flag: WhatsApp copy text has no payment destination (bank account/e-wallet), forcing manual editing in WhatsApp before sending.
