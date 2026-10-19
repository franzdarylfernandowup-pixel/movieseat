# MovieSeat — UI Final Plan
**Project:** Single-cinema movie & seat reservation web app for Cinema City Hall  
**Stack:** Vite + React (JSX) · Tailwind CSS v4 · Supabase Auth · EmailJS OTP  
**Date:** 2026-10-19

---

## 1. Design System

| Token | Value |
|---|---|
| Page background | `#0B0B0D` |
| Card surface | `#15161B` |
| Input background | `#0D0E12` |
| Amber accent | `#F59E0B` |
| Amber hover | `#FBBF24` |
| Error | `red-400 / red-500` |
| Success | `emerald-400 / emerald-500` |
| Border (default) | `white/[0.07–0.08]` |
| Border (active/focus) | `#F59E0B` at 50% opacity |
| Typography | Inter (Google Fonts) — single family, varied weights |
| Radius (cards) | `rounded-2xl` |
| Radius (inputs, buttons) | `rounded-xl` |
| Radius (pills) | `rounded-full` |
| Amber glow (buttons) | `shadow-[0_0_20px_#F59E0B44]` |
| Ambient glow (pages) | Radial `blur-[120–130px]` div, amber at ~5% opacity |

---

## 2. Shared Layout

### Header
- **Left:** MovieSeat logo (SVG) links to `/`
- **Center:** Nav pills — `Now Showing` (→ `/`) and `Find Reservation` (→ `/find-reservation`)
  - Active pill: amber background, black text, amber glow
  - Inactive: gray text, hover `bg-white/10`
- **Right (desktop):** Cinema City Hall tag · divider · live clock (Asia/Manila, 1s interval) · divider · Sign In link + Create Account amber pill
- **Mobile:** hamburger menu replaces nav pills and auth buttons; logo and clock remain visible
- Sticky, `backdrop-blur-md`, subtle bottom border

### Footer
- Left: "MovieSeat" wordmark
- Center (desktop): "Next.js + Supabase Architecture · Student Project"
- Right: green pulsing dot + "Live Database Connected"

---

## 3. Screen Specifications

### 3.1 Sign In (`/signin`)

**Layout:** centered card (`max-w-md`), amber radial glow backdrop

**Card contents:**
- Heading: "Sign In to MovieSeat"
- Sub-heading: "Enter your registered credentials to access your booked seats and profile."
- `EMAIL ADDRESS` field — mail icon, placeholder `alex.rivera@example.com`
- `PASSWORD` field — lock icon, `Forgot password?` amber link top-right, show/hide eye toggle
- Amber submit button: "Sign In to MovieSeat →" with loading spinner when submitting
- Link: "Don't have an account? **Create an account**" → `/signup`

**Validation & error states:**
- Empty email or password → per-field error below input; border turns red
- Invalid credentials → error banner at top: _"Invalid credentials or user is not registered."_

**Auth:** `supabase.auth.signInWithPassword()` → on success navigate to `/`

---

### 3.2 Create Account (`/signup`)

**Layout:** centered card (`max-w-lg`), amber radial glow backdrop

**Card contents:**
- Heading: "Create your MovieSeat Account"
- `FULL NAME *` — person icon
- `EMAIL ADDRESS *` — mail icon
- `PASSWORD *` — lock icon, show/hide toggle
- `CONFIRM PASSWORD *` — shield icon, show/hide toggle
- Custom amber checkbox: terms of service, theater house rules, privacy policy (amber links)
- Amber submit button: "Create Account →" with loading spinner
- Link: "Already have an account? **Sign In →**" → `/signin`

**Validation:**
- All fields required
- Valid email format
- Password ≥ 8 characters
- Passwords must match
- Terms checkbox must be checked

**Auth flow:**
1. `supabase.auth.signUp()` creates account
2. `sendOtp(email)` generates 6-digit OTP via `crypto.getRandomValues`, stores in `sessionStorage`, sends via EmailJS (`service_0qee32n` / template `nfastkl`)
3. On success → navigate to `/verify` with `{ state: { email } }`

---

### 3.3 Verify Email (`/verify`)

**Layout:** centered card (`max-w-md`), amber + deep-red glow, "← Back to Sign In" link above card

**Card contents:**
- Mail icon badge with emerald checkmark overlay
- Heading: "Verify Your Email"
- Description with amber-highlighted email address
- **6 individual OTP digit boxes** (`w-12 h-14`, `rounded-xl`, `bg-[#0D0E12]`)
  - Filled: amber border + glow; Focused: stronger amber glow
  - Auto-advance on type; backspace returns to previous; arrow keys navigate; paste fills all
- Countdown: `Code expires in M:SS` — turns red and shows "Code expired" at zero
- Amber submit button: "Verify Email & Continue →" — disabled until 6 digits filled or expired
- Resend row: `Resend in M:SS` (60s cooldown) or `Resend Code` when available
- Info hint about spam/promotions folder

**OTP logic (`src/lib/otp.js`):**
- TTL: 10 minutes; resend cooldown: 60 seconds
- EmailJS variables: `{{email}}`, `{{passcode}}`, `{{time}}`
- Correct → `clearOtpRecord()` + success flash → redirect to `/signin`
- Expired → error; Wrong → "Incorrect code. Please try again."

---

### 3.4 Now Showing (`/`)

**Loading state:** centered amber circular spinner

**Auditorium filter bar:**
- Pills: `All Auditoriums`, `Cinema 1 · Dolby Atmos`, `Cinema 2 · IMAX Laser`, `Cinema 3 · Standard`
- Colored status dot per auditorium; active pill elevated/white

**Movie grid:**
- Desktop: 2 × 2; Mobile: single column *(recommendation)*
- Cards: `bg-[#15161B]`, `rounded-2xl`

**Each movie card shows:**
- Poster image, rating badge, format badge (e.g. `4K IMAX`, `A24 INDIE`)
- Genre + runtime
- Movie title + synopsis
- Showtime pills (time, cinema, price)
  - **Sold-out showtime:** dimmed gray, `cursor-not-allowed`, not clickable *(recommendation)*
- Footer: seat count + "Select Screening" amber button → `/screenings/:id`
  - If all showtimes sold out: button shows "Sold Out", disabled

---

### 3.5 Seat Map & Checkout (`/screenings/:id`)

**Layout:** two-column desktop (map left, sidebar right); stacked mobile (map top, summary below) *(recommendation)*

**Components:**
- Breadcrumb bar: Movie → Auditorium → Showtime
- Amber advisory banner about seat holds
- Curved glowing projection arc SVG
- Seat grid with realistic aisle gaps and VIP Recliners row
- 4-state legend below grid

**Seat states:**

| State | Style |
|---|---|
| Available | Gray, hover amber |
| Selected (mine) | Amber fill, black text |
| Held by others | Dimmed orange, not clickable |
| Reserved/Sold | Dark, not clickable |

**Selection rules:**
- Min 1 seat, max 6 seats *(from interview)*
- Clicking a 7th → error: "Maximum of 6 seats allowed."

**Ticket Summary sidebar:**
- Seat chips (amber, removable), price breakdown, waived booking fee (`FREE / ₱0.00`)
- Name + email fields
- "Simulated checkout — no real payment" note
- "Confirm Reservation" amber button

---

### 3.6 Ticket (`/ticket/:reference`)

**Layout:** centered, `max-w-2xl`

**Sections:**
- "Reservation Confirmed!" emerald banner
- Ticket card (perforated edges): poster, movie title, auditorium, showtime, seat badges, total ₱
- Stub: Reference code (`MS-2026-XXXXXX`) with copy-to-clipboard button
  - Copy flashes "Copied!" label for 2 seconds then reverts *(recommendation)*
  - Decorative CSS barcode

**Actions:**
- "Print / Save Ticket (PDF)" — primary amber
- "Lookup Anytime" → `/find-reservation`
- "Book Another Movie" → `/`

---

### 3.7 Find Reservation (`/find-reservation`)

**Layout:** centered, `max-w-xl`

**Search card:**
- Input with `#` prefix, "Find Reservation" amber button
- Unknown code → "No reservation found for that reference code."

**"Your Latest Reservation" card:**
- Pre-loaded with mock data on page load *(recommendation)*
- Movie title, showtime, seats, total, status badge

**Status badges:**

| Status | Color |
|---|---|
| Active | Emerald |
| Cancelled | Gray |
| Expired | Orange/Amber |
| Used | Blue |

---

## 4. Mobile Behavior

| Screen | Mobile layout |
|---|---|
| Header | Hamburger menu; logo + clock always visible |
| Now Showing | Single-column card grid |
| Seat Map | Seat grid stacked above Ticket Summary |
| Auth screens | Full-width card, same structure |

---

## 5. Auth & OTP Flow

```
[Create Account]
      │
      ├─ supabase.auth.signUp()       error → banner
      ├─ sendOtp(email)               error → banner
      │    └─ EmailJS: service_0qee32n / template nfastkl
      │         vars: {{email}}, {{passcode}}, {{time}}
      └─ navigate('/verify', { state: { email } })
               │
         [Verify Email]
               │
               ├─ correct & not expired → clearOtpRecord() → navigate('/signin')
               ├─ wrong code            → "Incorrect code"
               ├─ expired               → "Code expired — request a new one"
               └─ resend (60s cooldown) → sendOtp() again

[Sign In]
      └─ supabase.auth.signInWithPassword()
               ├─ success → navigate('/')
               └─ error   → "Invalid credentials or user is not registered."
```

---

## 6. File Structure

```
src/
  lib/
    otp.js
  components/
    layout/
      Header.jsx
      Footer.jsx
    signin/
      SignInForm.jsx
    signup/
      SignUpForm.jsx
    verify/
      VerifyForm.jsx
    now-showing/
      AuditoriumFilter.jsx
      MovieCard.jsx
      ShowtimePill.jsx
    seat-map/
      BreadcrumbBar.jsx
      ProjectionArc.jsx
      SeatGrid.jsx
      SeatLegend.jsx
      TicketSidebar.jsx
    ticket/
      TicketCard.jsx
      TicketStub.jsx
      ActionButtons.jsx
    find-reservation/
      SearchCard.jsx
      ReservationCard.jsx
      StatusBadge.jsx
  pages/
    SignIn.jsx
    SignUp.jsx
    Verify.jsx
    NowShowing.jsx
    SeatMap.jsx
    Ticket.jsx
    FindReservation.jsx
  App.jsx
  main.jsx
  index.css
  supabaseClient.js
```

---

## 7. Routes

| Path | Page | Active nav pill |
|---|---|---|
| `/` | NowShowing | Now Showing |
| `/signin` | SignIn | none |
| `/signup` | SignUp | none |
| `/verify` | Verify | none |
| `/screenings/:id` | SeatMap | none |
| `/ticket/:reference` | Ticket | none |
| `/find-reservation` | FindReservation | Find Reservation |

---

## 8. Open Items

| # | Item | Action needed |
|---|---|---|
| 1 | `.env` Supabase URL | Remove `/rest/v1/` — must be `https://dwepbqogkbafvcmbxair.supabase.co` |
| 2 | Supabase email confirmation | Must be disabled in Supabase dashboard for custom OTP flow to work |
| 3 | Seat/showtime data | Decide: Supabase tables vs mock data for remaining screens |
| 4 | PDF generation | Library not yet chosen for "Print / Save Ticket" |
| 5 | Cancellation cutoff | 30-min rule enforcement on Find Reservation still to be designed |
