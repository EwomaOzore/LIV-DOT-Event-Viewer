# LIV DOT — Event Viewer (assessment)

A small **React Native (Expo)** flow for opening a ticketed live event and attempting to watch it. It uses **mocked API delays**, a **scenario picker**, and **`expo-network`** so you can exercise loading, access, live/replay, and degraded connectivity without a backend.

## Setup

Requirements: **Node 18+** and **npm**.

```bash
cd LIV_DOT_EventViewer
npm install
npx expo start
```

Then open in **Expo Go** (iOS/Android), or press `i` / `a` for a simulator.

## What’s implemented

Single **Event Viewer** screen with:

- Pull-to-refresh and explicit **Retry** actions (aborts in-flight requests via `AbortController`)
- **Scenario chips** at the bottom mapping to mocked server shapes (not purchased, verification pending/failed, upcoming, live + playable, live but stream down, replay, ended without replay, slow load, hard request error)
- **Simulate device offline** toggle (forces the offline path before a successful load, or use airplane mode — `expo-network` also updates when the real connection changes)
- **Force next refresh to fail** — simulates HTTP-style failure after data was already loaded (stale-while-revalidate is supported: content can stay on screen while a refresh is in flight; a failed refresh shows the error state)

Playback is represented as a **dedicated UI region** (live badge, replay CTA) — no real video stack — so the focus stays on **state clarity** and messaging.

---

## Brief explanation (deliverable)

### How the screen / flow is structured

- **`src/eventViewer/types.ts`** — Domain model: `EventDetail` (phase, access, playback flags) and a **`ViewerPresentation`** discriminated union: one variant per UI “mode.”
- **`src/eventViewer/presentation.ts`** — **Pure `deriveViewerPresentation`** maps `(fetch phase, connectivity flags, event payload) → presentation`. Access rules are resolved **before** time-based rules (e.g. pending verification blocks live even if the calendar says “live”).
- **`src/eventViewer/mockFetch.ts`** — Async mock with configurable delay and abort; `request_failed` scenario throws like a bad HTTP response.
- **`src/eventViewer/useEventViewer.ts`** — Subscribes to **`expo-network`**, runs loads with abort, exposes refresh and demo toggles.
- **`src/screens/EventViewerScreen.tsx`** — **Exhaustive `switch` on `presentation.kind`** so every state has explicit layout and copy — no opaque “magic string” UI.

### How state transitions are handled

1. **Network / fetch layer**: `fetchPhase` is `loading | success | error`. Scenario or refresh triggers a new load; prior requests are aborted.
2. **Presentation layer**: One reducer-like function turns **authoritative backend shape + connectivity** into a **single presentation**. That avoids impossible combos (e.g. “live player” while `verification === pending`).
3. **UX layer**: Loading with **no cached event** shows a full-screen skeleton. **With cached event**, the same derivation runs on the last good payload so the UI can stay stable during refresh (spinner in header + pull-to-refresh).

### Network and playback edge cases

- **Offline before first successful load** → clear copy + retry; no fake “play” affordance.
- **Offline after success** → last presentation can remain visible while a **“No network”** indicator shows in the header (production would gate actual playback start on connectivity).
- **Live but CDN / encoder down** → `live_unavailable` with a reason string from the mock (maps to polling / refresh in real apps).
- **Replay vs ended** → separate branches so entitlement and catalog state stay explicit.

### Optional: state management at scale

This repo uses **React hooks + a pure derivation function** instead of Redux/Zustand. In a larger app, the same `deriveViewerPresentation` could sit behind a query cache (**TanStack Query**) or a small global store; the important part is keeping **server truth** and **derived UI state** separate.

### Assumptions

- Ticket and verification state arrive in a **single event detail** response (could be split into parallel queries later).
- **`isInternetReachable === null`** is treated as “unknown but OK” to match common mobile behavior where reachability is briefly indeterminate.
- Real **DRM, entitlement tokens, and player errors** would add parallel substates; the presentation split here is meant to **scale to those concerns** without turning the screen into nested `if` soup.

---

## Submitting

Push this folder to **GitHub** or zip/upload to **Google Drive** with this README. Evaluators can run `npm install` and `npx expo start` as above.
