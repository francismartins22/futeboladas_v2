# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two groups, with equal weight:

- **Pelada groups** (casual or weekly): friends in Portugal who play together regularly. The organiser (admin) sets the date, collects money and makes the teams. Players confirm attendance, follow the chat and check results and their stats.
- **League teams**: amateur teams playing in an official competition. The admin manages the fixture calendar, call-ups, tactics and training sessions. Players confirm attendance at training and follow the results.

They use it almost always on the phone, in a hurry, in the days and hours before a game, or straight after it to record the result.

## Product Purpose

To replace the WhatsApp group plus spreadsheet that every group uses to organise football. Success means the organiser stops chasing confirmations and payments by hand, and the players always know when they play, with whom, and what they owe.

## Positioning

Everything in one place for a football group: confirmations with a waiting list, teams balanced from the players' own ratings, clear accounts (monthly fees, pay-per-game, debts) and a career history (goals, assists, MVPs, achievements). It covers both a friends' pelada and a league team, in the same product.

## Operating Context

- Each group has one mode, fixed when it is created: Casual, Semanal (weekly) or Liga (league).
- A typical pelada cycle: the admin sets the date. Players tap "Vou jogar" or "Não vou", and anyone who confirms after the spots fill up joins the waiting list. On the day, the teams are generated (Branco vs Preto) and shared on WhatsApp. At the end, the score and goals are saved. MVP voting stays open for 48h, and payments are tracked in Tesouraria.
- A league cycle: the official fixture calendar (home or away), the call-up (starters and subs by position), the tactics board, training sessions and results with an MVP.
- Group chat, push notifications (game confirmed, 24h before, new messages), invite code to join.
- PWA installed on the phone (Vercel); backend on Firebase.

## Capabilities and Constraints

- React 19 + Vite, inline styles plus one CSS string (`src/styles.js`), icons from `lucide-react`. No CSS framework.
- Roles: member, admin, owner. Permissions are enforced in `firestore.rules`; the UI only reflects them.
- Domain vocabulary that stays: pelada/peladinha, convocatória, convocados, lista de espera, Branco/Preto, plantel, tesouraria, mensalidade, MVP, craque, época.

## Brand Commitments

- Name: **Futeboladas**.
- Copy voice: European Portuguese, informal and playful ("Bora 💪", "peladinha", "craque", "Entrar em campo").
- **Dark theme** stays (user decision).

## Evidence on Hand

- No real testimonials, numbers or customers. Don't invent them.
- Assets: `public/pwa-192x192.png`, `public/pwa-512x512.png` (current icon).

## Product Principles

1. The next game first: when and where, who's going and what I need to do.
2. One tap to answer: confirming, paying or voting never takes more than a gesture.
3. Clear accounts: money and debts are always unambiguous.
4. The group's memory: results, goals and MVPs build up into a career people want to look at.

## Accessibility & Inclusion

Keep what was done in the polish pass: keyboard focus, labelled fields, touch targets of at least 32–36px, 16px inputs on touch screens, and respect for `prefers-reduced-motion`.
