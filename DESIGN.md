---
name: Futeboladas
description: Team app for football groups where every player is a cromo in the group's sticker album.
colors:
  grass: "#22c55e"
  grass-deep: "#16a34a"
  grass-bright: "#4ade80"
  lime: "#c6f24a"
  gold: "#f5c542"
  blue: "#6aa9e0"
  danger: "#f0563a"
  danger-ink: "#ff9684"
  ground: "#0a0f0e"
  panel: "#0d1411"
  card: "#111b16"
  raised: "#16221c"
  field-well: "#0a120f"
  line: "#22312b"
  text: "#e9f0eb"
  dim: "#90a69b"
  faint: "#7d958a"
  chalk: "#f5f8f6"
  cromo-green: "#1d6b3e"
  on-grass: "#04130a"
typography:
  display:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    fontFeature: "tnum"
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  cromo-name:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1.35
rounded:
  cromo-face: "5px"
  cromo: "7px"
  sm: "8px"
  input: "12px"
  button: "14px"
  card: "16px"
  pill: "999px"
spacing:
  cromo-gap: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.grass}"
    textColor: "{colors.on-grass}"
    rounded: "{rounded.button}"
    padding: "13px"
  button-primary-hover:
    backgroundColor: "{colors.grass-bright}"
  button-ghost:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    padding: "13px"
  button-answer:
    backgroundColor: "{colors.grass}"
    textColor: "{colors.on-grass}"
    rounded: "{rounded.button}"
    height: "52px"
  input:
    backgroundColor: "{colors.field-well}"
    textColor: "{colors.text}"
    rounded: "{rounded.input}"
    padding: "12px 14px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  pill-countdown:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  cromo:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.ground}"
    typography: "{typography.cromo-name}"
    rounded: "{rounded.cromo}"
    padding: "3px"
  cromo-mvp:
    backgroundColor: "{colors.gold}"
  subtab-active:
    backgroundColor: "{colors.grass-deep}"
    textColor: "{colors.on-grass}"
    rounded: "{rounded.sm}"
    padding: "8px 4px"
---

# Design System: Futeboladas

## Overview

**Creative North Star: "The Group's Caderneta"**

A calm, familiar team app on a flat near-black green ground, where the players are cromos: white-framed 3:4 stickers with a photo or initials on green and the name in condensed caps. The chrome stays quiet and conventional (cards, a bottom bar, two answer buttons) so that the one invented object, the cromo, carries the identity. Opening a group shows when the next game is, whose cromo is already stuck in, and which slots still say "Falta".

Density is phone-first and compact: 15px base text, 16px gaps between sections, a 5-column cromo grid. Colour is spent by meaning, not decoration: grass answers, lime points at the user, gold rewards. The system refuses the "AI sports app" default of radial glows, glowing gradient buttons, pitch-stripe heroes and tracked uppercase labels.

**Key Characteristics:**
- Flat dark-green ground with bordered cards; no ambient glows.
- The cromo (3:4, white frame, condensed name) is the signature object.
- Barlow for interface text, Barlow Condensed 800 for numbers, dates and cromo names.
- Each accent has one job; rarity keeps lime and gold legible.
- One authored motion: the cromo "sticks" onto the page.

## Colors

A dark pitch-at-night palette: green-black neutrals, one grass action colour, and three signal accents each tied to a single meaning.

### Primary
- **Grass** (`grass`): the primary action fill ("Vou jogar", "Entrar em campo", success toasts), with near-black on-grass text. Hover lifts to **Bright Grass** (`grass-bright`), which also colours positive figures (goals, wins), links and the active bottom-bar item. **Deep Grass** (`grass-deep`) marks the focused input border and the active sub-tab.

### Secondary
- **Lime** (`lime`): "it's on you". The countdown pill to the next game and the user's own waiting-list position. Also the keyboard focus ring and text selection tint.
- **Trophy Gold** (`gold`): MVP and achievements. The gold cromo frame, MVP vote, unlocked achievement rows, filled rating stars, ranking leader.

### Tertiary
- **Away Blue** (`blue`): assists and secondary stats (kept by user request); also away fixtures and the Casual group mode.
- **Red Card** (`danger`, with `danger-ink` for text on tinted fills): destructive actions, "Não vou" when chosen, error toasts, unread badges, losses.

### Neutral
- **Night Ground** (`ground`): the page.
- **Panel** (`panel`): sticky header backing.
- **Card** (`card`) and **Raised** (`raised`): containers and ghost buttons, one step apart.
- **Field Well** (`field-well`): sunken input and sub-tab track fill.
- **Touchline** (`line`): every 1px border and divider.
- **Text / Dim / Faint** (`text`, `dim`, `faint`): primary copy, secondary copy and section labels, placeholders and inactive tabs.
- **Chalk** (`chalk`): the cromo frame, white bib and condensed headings.
- **Cromo Green** (`cromo-green`): the face behind initials when a player has no photo.

### Named Rules
**The One Job Rule.** Lime means "you need to act", gold means "earned". Neither is used as decoration or as a generic highlight.

**The Grass Answers Rule.** The single filled green button on a screen is the user's answer. Everything else is ghost, link or tinted.

## Typography

**Display Font:** Barlow Condensed 800 (with system-ui, sans-serif)
**Body Font:** Barlow 400–700 (with system-ui, sans-serif)

**Character:** Barlow is a plain, sturdy grotesk for the interface; its condensed cut at 800 does the scoreboard work: dates, scores, counts and names on cromos, always with tabular figures.

Both are loaded from Google Fonts (`@import` in the global stylesheet). They are not self-hosted, so in the offline PWA the whole app falls back to `system-ui`.

### Hierarchy
- **Display** (Condensed 800, 44px, 1): the wordmark on the sign-in screen, uppercase.
- **Headline** (Condensed 800, 34px, 1.05): the next-game date line and the next opponent, uppercase, in chalk.
- **Title** (Barlow 700, 15–18px): section and card headings, sentence case.
- **Body** (Barlow 400, 15px; 14px for secondary lines): copy and list content.
- **Label** (Barlow 600, 13px, dim): section labels, sentence case, no tracking.
- **Numbers** (Condensed 800, tabular): scores, stats, steppers, ranks at any size.
- **Cromo name** (Condensed 800, 12px, 1.35, uppercase): first name only, ellipsised.

### Named Rules
**The Sentence-Case Label Rule.** Section labels are 13px semibold dim text in sentence case. Uppercase belongs only to condensed numerals, dates, opponents and cromo names.

**The Condensed Is For Facts Rule.** Barlow Condensed sets numbers, dates and names, never running copy or buttons.

## Layout

Single phone column, max 760px, fixed bottom navigation of 5 sections with safe-area padding. Sections stack with 16px gaps; cards pad 14–16px (24px on the sign-in card); inline groups use 8–12px gaps. On the Agenda screen the answer buttons ("Vou jogar" 2fr, "Não vou" 1fr, 52px tall) stick above the bottom bar.

The cromo grid is 5 columns with 6px gaps, becoming 6 columns from 520px wide. Touch targets stay at 32–36px minimum; inputs grow to 16px text on coarse pointers to stop iOS zoom.

## Elevation & Depth

Flat by default. Depth comes from tonal steps (ground → card → raised) and 1px Touchline borders, not shadows. The two floating layers, the bottom bar and the sticky header, use a translucent ground with a 12px backdrop blur. The only real shadow is under the toast.

### Shadow Vocabulary
- **Toast lift** (`box-shadow: 0 12px 30px -8px rgba(0,0,0,.6)`): the floating toast only.

### Named Rules
**The Flat Pitch Rule.** Cards sit on the ground with a border, never with a glow or drop shadow.

## Shapes

Soft rectangles at a consistent ladder: 16px cards, 14px buttons and toasts, 12px inputs and sub-tab tracks, 8px small controls and bibs, full pills for countdown and status chips. The cromo is deliberately tighter (7px frame, 5px face, 3px white border) so it reads as a printed sticker, not a UI card. Empty states and "Falta" slots use a 1.5px dashed border; Branco/Preto bibs are 26px rounded squares.

## Components

### Buttons
Solid, compact, with a press squash.
- **Shape:** gently rounded (14px), 700 weight, icon gap 8px.
- **Primary (grass):** grass fill, on-grass text; hover to bright grass.
- **Ghost:** raised fill, text colour, 1px line border; hover darkens the border (#33473f).
- **Danger:** 12% red tint, danger-ink text, 30% red border; hover 20% tint.
- **Press / Disabled:** active scales to 0.96 (off under reduced motion); disabled at 45% opacity.
- **Link:** no fill, 8px padding and radius, underline on hover.

### Inputs / Fields
- **Style:** field-well fill, 1px line border, 12px radius, 12px 14px padding, 14px text (16px on touch).
- **Focus:** border shifts to deep grass plus a 3px soft grass ring (rgba(34,197,94,.3)).
- **Placeholder:** faint.

### Focus
Keyboard-only ring: 2px lime outline at 2px offset on every focusable element; mouse and touch show none.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** card, with raised for nested blocks.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px Touchline.
- **Internal Padding:** 14px 16px typical.

### Navigation
Fixed bottom bar, translucent ground with blur, top border. Each item is an icon (22px) over a 12px bold label; active is bright grass with a heavier stroke and `aria-current`, inactive is faint. Red count badges on the icon. Inside a section, sub-tabs sit in a sunken field-well track; the active tab is a deep-grass fill.

### Cromo (signature)
The player as a sticker-album card.
- **Default:** 3:4 chalk frame (7px radius, 3px padding); face fills the space with the photo or condensed initials on cromo green; first name below in 12px condensed caps on dark text.
- **MVP:** the frame turns gold. Used for the match MVP in History (40px wide) and the centre cromo on sign-in.
- **Falta:** an empty slot of the same 3:4 shape, 1.5px dashed border (#3a4d44), "Falta" in 12px bold dim. Fills the grid up to the player limit.
- **Stick:** a cromo that joins after the screen opened animates in once: from 6px up, -4° and 106% scale to rest, 320ms, cubic-bezier(.2,.8,.25,1). Disabled under reduced motion. This is the app's authored motion.

### Countdown Pill
Lime fill, ground-coloured 13px bold text, full pill, 4px 10px. Sits top-right in the next-game card.

## Do's and Don'ts

### Do:
- **Do** show players as cromos wherever a squad or call-up is listed, with "Falta" slots for missing places.
- **Do** keep lime for the user's pending action and gold for MVP and achievements.
- **Do** set dates, scores and counts in Barlow Condensed 800 with tabular figures.
- **Do** write section labels in sentence case, 13px semibold dim.
- **Do** keep the lime keyboard focus ring and the reduced-motion fallbacks.

### Don't:
- **Don't** add radial glows, glowing gradient buttons or pitch-stripe hero backgrounds.
- **Don't** use tracked uppercase eyebrows on labels.
- **Don't** add new entrance animations; the cromo stick is the only authored motion.
- **Don't** put shadows on cards; depth is tone and a 1px border.
