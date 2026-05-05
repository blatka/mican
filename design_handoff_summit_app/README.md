# Handoff: MiCAN 2026 Summit Mobile App

## Overview
A native-feeling mobile web app for attendees of the Michigan Climate Action Network Annual Summit. Attendees use it to browse sessions, save their personal schedule, view the venue map, and explore sponsors. It is designed primarily for mobile (iOS) but should degrade gracefully on Android and desktop browsers.

## About the Design Files
The files in this bundle are **high-fidelity HTML prototypes** — not production code. They show exact intended look, behavior, and interactions. Your task is to **recreate these designs in your target environment** (React Native, Expo, Swift, or a mobile-first React PWA) using that codebase's established patterns and libraries. Do not ship the HTML files directly.

The primary reference file is `MiCAN Summit App.html` — a fully self-contained interactive prototype. Open it in any browser to interact with all screens. `standalone-ready.html` is the same file with all assets base64-inlined (for hosting).

## Fidelity
**High-fidelity.** Colors, typography, spacing, border radii, and interactions are all finalized and should be reproduced exactly. The design system tokens are in `../colors_and_type.css`.

---

## Screens / Views

### 1. Home Screen
**Purpose:** App landing screen. Gives attendees quick access to schedule and map, and showcases the presenting sponsor.

**Layout:**
- Full-height scrollable column
- Top: `paddingTop: 52px` to clear iOS Dynamic Island / notch
- Hero image: full-width PNG (`assets/summit-hero.png`), no overlay
- CTA buttons: full-width, `borderRadius: 14px`, `padding: 18px`, gap `12px` between
- Sponsor card: full-width, `borderRadius: 16px`, gradient header + white body
- Footer: centered MiCAN bug logo + "Powered by MiCAN" label

**Components:**
- **View Schedule button:** `background: #398032` (green), white text, Montserrat ExtraBold 16px, calendar icon left
- **Venue Map button:** `background: #1E2B5F` (navy), white text, Montserrat ExtraBold 16px, map-pin icon left
- **Sponsor card header:** `linear-gradient(135deg, #1E2B5F, #042A80)`, sponsor logo centered (44px tall, contain), org name Montserrat ExtraBold 17px white, tagline 13px white 75% opacity
- **Sponsor card body:** white, `padding: 16px 20px`, full-width "Learn more →" button in `sponsor.color`
- **Section label above card:** 11px Montserrat Bold, uppercase, `#9CA3AF`, centered, `letterSpacing: 0.1em`
- **Tapping sponsor card** → navigates to Climate Innovator sponsor detail page

---

### 2. Schedule Screen
**Purpose:** Browse all summit sessions. Filter by track, time, or personal saved schedule.

**Layout:**
- Sticky header: white surface, `borderBottom: 1px solid #EAECF0`, `paddingTop: 52px`
- Filter tab row: horizontal scroll, no scrollbar visible, tab underline style
- Scrollable session card list below

**Filter Tabs:** All | By Track | By Time | My Schedule
- Active tab: `color: #398032`, `borderBottom: 2.5px solid #398032`
- Inactive: `color: #5A6272`, transparent border

**Track filter pills** (shown when "By Track" selected):
- One pill per track, horizontally scrollable
- Active: colored bg + border matching track dot color
- Inactive: white bg, `border: 1.5px solid #EAECF0`

**Session Card (3-line layout):**
- Background: white, `borderRadius: 14px`, `padding: 12px 14px`, `marginBottom: 10px`, subtle shadow
- **Line 1:** Time (clock icon + bold 11px Montserrat `#5A6272`) left | Track badge right
- **Line 2:** Session title, Montserrat Bold 14px `#0D1117`, `lineHeight: 1.35`, `marginBottom: 5px`
- **Line 3:** Room (map-pin icon + 11px Montserrat `#5A6272`) left | Bookmark icon right
- Tapping card → Session Detail screen

**Track Badges:**
| Track | Background | Text | Dot |
|---|---|---|---|
| Courage of Our Convictions | `#EEF2FF` | `#1E2B5F` | `#1E2B5F` |
| Practicing Courage | `#ECFCE5` | `#286325` | `#398032` |
| Powering the Network | `#F5E8FF` | `#5B0A52` | `#7C0770` |
| Art/Collective Courage | `#FFF4E0` | `#8B5E04` | `#D97706` |
| Community Climate Action Fellowship | `#E0F7FA` | `#0E6E88` | `#0891B2` |

Badge: `borderRadius: 20px`, `padding: 3px 8px`, 10px Montserrat Bold, colored dot 6px circle left

**Sponsor Ad Cards** (injected every 3 sessions in "All" view):
- White card, `borderRadius: 12px`
- Header: "CLIMATE INNOVATOR SPONSOR" label — 11px Bold uppercase centered, `paddingBottom: 17px`, `background: #F9F9F9`
- Body: logo (44px square, cover), name (13px Bold), tagline (12px), CTA button
- Tapping → Climate Innovator sponsor detail page

**My Schedule empty state:**
- Centered bookmark icon, "No saved sessions yet", 13px instruction text

---

### 3. Session Detail Screen
**Purpose:** Full details for a single session.

**Layout:**
- Sticky header: white surface, `paddingTop: 52px`, back button + 3-line session summary
- Scrollable body below

**Header (3-line layout matching session card):**
- Back button: `← Schedule` in green `#398032`, Montserrat Bold 14px
- Line 1: Time (clock icon) left | Track badge right, `marginBottom: 6px`
- Line 2: Session title in **Block Berthold** 22px `#001133`, `lineHeight: 1.15`, `marginBottom: 8px`
- Line 3: Room (map-pin icon) left | Bookmark toggle right

**Body:**
- Description: 14px Montserrat Medium `#5A6272`, `lineHeight: 1.7`, `marginBottom: 24px`
- Speaker card: white surface, `borderRadius: 14px`, border, `padding: 16px`
  - "SPEAKER" label: 11px Bold uppercase muted
  - Avatar: 52px circle, gradient bg using track dot color → `#1E2B5F`, person icon
  - Name: 15px Bold `#0D1117`
  - Bio: 13px `#5A6272`, `lineHeight: 1.6`
- Slido button (if session has Slido URL): full-width, `background: #1E2B5F`, white text, chat-bubble icon, "Ask a Question (Slido)", `borderRadius: 12px`
- Sponsor divider: `1px solid #EAECF0`, `margin: 8px 0 16px`
- Sponsor ad (varies by session — see Sponsor Ad Tiers below)

**Sponsor Ad Tiers by Session:**
- **Session 2 (Community Solar):** Michigan's Future Foundation (Climate Innovator) + GreenFaith Communities Community Pillar ad below
- **Session 3 (Youth Climate):** Circle Recycling Planet Protector ad (full-width logo, 2 paragraphs, Visit Website button)
- **All other sessions:** Michigan's Future Foundation (Climate Innovator) card

**Planet Protector Ad:**
- Header: "PLANET PROTECTOR SPONSOR", 11px Bold centered, `#F9F9F9` bg, `paddingBottom: 17px`
- Full-width logo on white bg, `maxHeight: 44px`, contain
- Org name: 15px ExtraBold
- 2 paragraphs body copy, 13px
- Green CTA button: "VISIT WEBSITE"

**Community Pillar Ad:**
- Header: "COMMUNITY PILLAR SPONSOR", same style
- Full-width logo, 1 paragraph, green "JOIN US" button

---

### 4. Venue Map Screen
**Purpose:** Show the Kellogg Center floor plan.

**Layout:**
- `paddingTop: 52px` to clear notch
- Full-width floor plan image (`assets/kellogg-floor-plan.png`), scrollable
- Bottom nav links: "← Back to Home" | "View Sessions →" in green

---

### 5. Summit Sponsors Screen
**Purpose:** List all sponsors grouped by tier level, descending.

**Layout:**
- Header: white surface, `paddingTop: 52px`, "Summit Sponsors" in Block Berthold 22px centered navy
- Scrollable list below, grouped by tier

**Tier order:** Climate Innovator → Planet Protector → Community Pillar → Nonprofit Partner

**Tier heading:** 11px Bold uppercase centered `#9CA3AF`, `paddingBottom: 5px`, bottom border, `marginBottom: 10px`

**Sponsor row card:**
- White bg, `borderRadius: 14px`, border, shadow
- Header section: `linear-gradient(135deg, #F4F6FA, #E8EBF2)`, `padding: 18px 16px`, flex row
  - Logo: 65×65px, `borderRadius: 10px`, white bg + border, `objectFit: contain`, `padding: 4px`
  - Name: 14px ExtraBold `#001133`
  - Tagline: 12px `#5A6272`
- Footer: right-aligned CTA in `sponsor.color`, 13px Bold, `›` chevron
- Tapping:
  - **Climate Innovator** → full Sponsor Detail page
  - **Planet Protector / Community Pillar** → Sponsor Ad page (existing ad content as standalone page)
  - **Nonprofit Partner** → opens website in new tab

---

### 6. Sponsor Detail Page (Climate Innovator)
**Purpose:** Full-page sponsor showcase for top-tier sponsor.

**Layout:**
- Header: `linear-gradient(135deg, #1E2B5F, #042A80)`, `padding: 52px 24px 28px`, centered
  - "← Back" button top-left, white 70% opacity
  - Logo: 80×80px circle, white bg, contain, `border: 2px solid rgba(255,255,255,0.2)`
  - Tier label: 11px Bold uppercase white 50% opacity
  - Org name: Block Berthold 26px white
- Body (scrollable):
  - "FEATURED INITIATIVE" label: 11px Bold uppercase muted
  - Initiative name: Block Berthold 20px `#001133`
  - Blurb paragraph: 14px `#5A6272`
  - Photo: full-width, `height: 200px`, `objectFit: cover`, `borderRadius: 14px`, `margin: 0 24px`
  - Two more paragraphs
  - Green "LEARN MORE →" button, full-width, `borderRadius: 12px`, `padding: 16px`

---

### 7. Sponsor Ad Page (Planet Protector / Community Pillar)
**Purpose:** Standalone page showing the sponsor's in-session ad content.

**Layout:**
- Header bar: white, `paddingTop: 52px`, "← Summit Sponsors" back button in green
- Ad card: white surface, `borderRadius: 12px`, border + shadow
  - Tier label header: 11px Bold centered muted, `#F9F9F9` bg, `paddingBottom: 17px`
  - Full-width logo on white bg, `borderRadius: 8px`, `maxHeight: 56px`, contain
  - Org name: 17px ExtraBold
  - Body copy paragraphs (1–2 depending on tier)
  - Green CTA button

---

## Bottom Tab Bar
Always visible (except when sponsor overlay is shown).
- 4 tabs: Home | Schedule | Map | Sponsors
- Icons: house / calendar / map-pin / heart (Lucide stroke icons, 22px)
- Active: `stroke: #398032`, `strokeWidth: 2.5`, label `#398032`; heart fill `#398032` when active
- Inactive: `stroke: #9CA3AF`, `strokeWidth: 1.8`, label `#9CA3AF`
- Height: `paddingBottom: 20px` (accounts for iOS home indicator)
- Background: white, `borderTop: 1px solid #EAECF0`

---

## Sessions Data

| ID | Title | Track | Time | Room | Slido |
|---|---|---|---|---|---|
| 1 | Opening Keynote: Michigan's Clean Energy Roadmap | Courage of Our Convictions | 9:00 - 10:00 AM | Big Ten ABC | Yes |
| 2 | Community Solar: Who Gets Left Behind? | Practicing Courage | 10:30 - 11:30 AM | Lincoln | No |
| 3 | Youth Climate Organizing - Building Power | Community Climate Action Fellowship | 10:30 - 11:30 AM | Red Cedar AB | Yes |
| 4 | Clean Energy Workforce: Jobs of the Future | Powering the Network | 1:00 - 2:00 PM | 103AB - 105AB | No |
| 5 | Tribal Nations & Great Lakes Climate Resilience | Courage of Our Convictions | 1:00 - 2:00 PM | Big Ten ABC | Yes |
| 6 | Line 5 & The Fight for Our Waters | Practicing Courage | 2:30 - 3:30 PM | Willy | No |
| 7 | Art as Resistance: Climate Storytelling | Art/Collective Courage | 2:30 - 3:30 PM | Nook 106 | No |
| 8 | Closing Panel: What Victory Looks Like | Courage of Our Convictions | 4:00 - 5:00 PM | Big Ten ABC | Yes |

---

## Sponsors Data

| ID | Tier | Name | Tagline | Logo | CTA |
|---|---|---|---|---|---|
| mff | Climate Innovator | Michigan's Future Foundation | Powering Michigan's Clean Future | sponsor-logo-square.png | Learn More |
| circle | Planet Protector | Circle Recycling | Keeping Michigan's Materials in Motion | circle-logo.png | Visit Website |
| gf | Community Pillar | GreenFaith Communities | Protecting Creation Across Michigan | greenfaith-logo.png | Join Us |
| aapp | Nonprofit Partner | Ann Arbor for Public Power | Renewable, Reliable, Affordable Electricity for Ann Arbor | ann-arbor-public-power.png | Visit Website → https://annarborpublicpower.org/ |

---

## Design Tokens

### Colors
```
Navy Darkest:   #001133  — page backgrounds, utility bar
Navy Dark:      #1E2B5F  — nav, sponsor gradients
Blue Medium:    #042A80  — gradient endpoint
Green:          #398032  — primary CTA, active states, bookmarks
Purple:         #7C0770  — Powering the Network track
Sky:            #5FCAE7  — accent (logo only)
Gray:           #4F4F4F  — light nav text
Surface:        #FFFFFF  — cards, nav bar
Background:     #F7F8FA  — page bg (light screens)
Border:         #EAECF0  — all borders
Text Primary:   #0D1117
Text Secondary: #5A6272
Text Muted:     #9CA3AF
```

### Typography
```
Display:  Block Berthold Regular — hero headings, session titles in detail
Section:  Londrina Solid Regular — (website only, not used in app)
UI:       Montserrat — all app text
  Regular 400  — body
  Bold 700     — nav, buttons, labels
  ExtraBold 800 — CTA buttons, org names

Font sizes used: 10, 11, 12, 13, 14, 15, 16, 17, 20, 22, 26px
```

### Spacing
```
Notch clearance:   paddingTop: 52px (all screen headers)
Card padding:      12–16px
Section padding:   16–24px
Border radius:     8px (inner elements), 12px (ad cards), 14px (session cards), 16px (sponsor card)
Tab bar bottom:    paddingBottom: 20px
```

### Shadows
```
Session cards:   0 1px 3px rgba(0,0,0,0.05)
Sponsor cards:   0 1px 4px rgba(0,0,0,0.06)
Home sponsor:    0 2px 12px rgba(0,0,0,0.06)
Green CTA btn:   0 4px 16px rgba(57,128,50,0.3)
```

---

## Icons
Lucide Icons (stroke, 22px at tab bar, 11–20px inline). No filled icons except the active heart tab.

Key icons used:
- `calendar` — View Schedule button + Schedule tab
- `map-pin` — Venue Map button + Map tab + room labels
- `heart` — Sponsors tab (filled green when active)
- `clock` — session time
- `bookmark` — save session (filled green when saved)
- `chevron-left/right` — back navigation
- `search` — (website nav only)
- `message-square` — Slido button

---

## Assets
All assets are in `../assets/` relative to this README:

| File | Usage |
|---|---|
| `summit-hero.png` | Home screen hero image |
| `sponsor-logo-square.png` | Michigan's Future Foundation logo (square crop) |
| `sponsor-temp-logo.png` | Michigan's Future Foundation full logo (home card) |
| `circle-logo.png` | Circle Recycling logo |
| `greenfaith-logo.png` | GreenFaith Communities logo |
| `ann-arbor-public-power.png` | Ann Arbor for Public Power logo |
| `energy-climate-change.jpg` | Sponsor detail photo (wind turbines) |
| `kellogg-floor-plan.png` | Venue map floor plan |
| `mican-logo-allwhite.png` | MiCAN logo white (PNG) |
| `mican-logo-bug.png` | MiCAN logomark |
| `event-photo.jpg` | Event/community photo |
| `hero-bg.jpg` | Outdoor/landscape photo |

Fonts: Block Berthold Regular, Montserrat (Regular/Bold/ExtraBold) — woff2 files in `../fonts/`

---

## Files in This Package

```
design_handoff_summit_app/
  README.md                  ← This file (implement from here)
  MiCAN Summit App.html      ← Interactive prototype (open in browser)
  standalone-ready.html      ← Same, fully self-contained for hosting

../assets/                   ← All image assets
../fonts/                    ← Webfont files
../colors_and_type.css       ← Full design token CSS file
```

---

## Key Implementation Notes

1. **Notch/Dynamic Island clearance** — all screen headers use `paddingTop: 52px`. In a native app, use `SafeAreaView` or equivalent.
2. **No em dashes** — use " - " (space-hyphen-space) instead of — or –.
3. **No emoji** — none used anywhere in the design.
4. **Bookmark state** is local/session only in the prototype. Wire to user auth / local storage in production.
5. **Slido links** open in a new browser tab/webview.
6. **Ann Arbor for Public Power** has no in-app page — tapping opens `https://annarborpublicpower.org/` externally.
7. **Sponsor ads in session feed** appear every 3 sessions in the "All" view only — not in By Track, By Time, or My Schedule views.
8. **The `initialFilter` prop** on ScheduleScreen pre-selects "My Schedule" when navigating from the Saved tab — wire accordingly.
