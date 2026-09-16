# Implementation Plan: Connectify Production

## Overview

Convert the existing Connectify MERN app into a production-ready platform through targeted, incremental changes. Tasks are ordered so every step leaves the app in a working state: critical bugs first, then backend security, then UI redesigns. No file is deleted — every change is a modification or addition to an existing file (or the creation of a small new one).

---

## Tasks

- [x] 1. Fix critical routing and rendering bugs
  - [x] 1.1 Fix the `/home` route typo in `frontend/src/App.js`
    - Change `path='/home's` to `path='/home'` so the JSX compiles and the home route resolves
    - _Requirements: 1.1_

  - [x] 1.2 Fix VideoMeet conditional rendering in `frontend/src/pages/VideoMeet.jsx`
    - Wrap the Lobby JSX block in `{askForUsername ? (...) : null}`
    - Wrap the MeetingRoom JSX block in `{!askForUsername ? (...) : null}`
    - Ensure both blocks reference the same `askForUsername` state variable that already exists
    - _Requirements: 1.2, 1.3_

  - [ ]* 1.3 Write property tests for VideoMeet conditional rendering
    - **Property 1: Lobby-only rendering when waiting for username** — render component with `askForUsername=true` and assert Lobby is present, MeetingRoom is absent
    - **Property 2: MeetingRoom-only rendering when username is set** — render with `askForUsername=false` and assert MeetingRoom present, Lobby absent
    - **Validates: Requirements 1.2, 1.3**

- [x] 2. Set up environment variables for backend and frontend
  - [x] 2.1 Create `backend/.env` and update `backend/src/app.js`
    - Add `backend/.env` with `PORT`, `MONGODB_URI`, and `JWT_SECRET` fields (use existing values)
    - Add `backend/.env` to `backend/.gitignore`
    - Install `dotenv` (`npm install dotenv --save`) in the backend
    - Add `import "dotenv/config"` at the top of `app.js`
    - Replace the hardcoded MongoDB URI string with `process.env.MONGODB_URI`
    - _Requirements: 1.4_

  - [x] 2.2 Create `frontend/.env` and update `frontend/src/contexts/AuthContext.jsx`
    - Add `frontend/.env` with `REACT_APP_API_URL=http://localhost:8000`
    - Add `frontend/.env` to `frontend/.gitignore`
    - Replace the hardcoded `"http://localhost:8000"` baseURL in `AuthContext.jsx` with `process.env.REACT_APP_API_URL + "/api/v1/users"`
    - Replace the hardcoded `server_url` in `VideoMeet.jsx` with `process.env.REACT_APP_API_URL || "http://localhost:8000"`
    - _Requirements: 1.5, 1.6_

- [x] 3. Implement JWT authentication in the backend
  - [x] 3.1 Install `jsonwebtoken` and create `auth.middleware.js`
    - Run `npm install jsonwebtoken --save` in `backend/`
    - Create `backend/src/middleware/auth.middleware.js` with the `authMiddleware` function from the design document
    - Middleware reads `Authorization: Bearer <token>`, calls `jwt.verify`, attaches decoded payload to `req.user`, or returns 401
    - _Requirements: 2.3, 2.4_

  - [ ]* 3.2 Write property test for AuthMiddleware
    - **Property 3: AuthMiddleware rejects all unauthenticated requests** — for any request missing the Authorization header, with a malformed token, or an expired token, assert HTTP 401 is returned and next() is not called
    - **Validates: Requirements 2.3, 2.4**

  - [x] 3.3 Update `user.controller.js` — login with JWT
    - Import `jsonwebtoken`
    - Replace `crypto.randomBytes` token generation with `jwt.sign({ _id, username }, process.env.JWT_SECRET, { expiresIn: "7d" })`
    - Remove the `user.token = token; await user.save();` lines
    - Return `{ success: true, data: { token } }` on success
    - Wrap the catch block to call `next(e)` instead of returning a raw error string
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Update `user.controller.js` — register with validation
    - Add field validation for `name` (2–50 chars), `username` (3–30 alphanumeric), `password` (8+ chars)
    - Return `{ success: false, message: "<field error>" }` with HTTP 400 for invalid inputs
    - Pass caught errors to `next(e)` instead of `res.json({ message: \`Something went wrong ${e}\` })`
    - _Requirements: 2.6_

  - [ ]* 3.5 Write property test for registration validation
    - **Property 5: Registration validation rejects invalid inputs** — for any combination of inputs violating name/username/password constraints, assert HTTP 400 is returned and no User document is created
    - **Validates: Requirements 2.6**

  - [x] 3.6 Update `user.controller.js` — getUserHistory and addToHistory use `req.user`
    - Remove `const { token } = req.query` and `User.findOne({ token })` from `getUserHistory`
    - Use `req.user.username` directly to query meetings
    - Remove `const { token } = req.body` and `User.findOne({ token })` from `addToHistory`
    - Use `req.user.username` directly when creating the Meeting document
    - _Requirements: 3.6_

  - [x] 3.7 Add global error middleware to `app.js` and protect routes in `users.routes.js`
    - In `app.js`, register a 4-argument error handler after all routes: `app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success: false, message: "An internal error occurred" }); })`
    - In `users.routes.js`, import `authMiddleware` and apply it to the `add_to_activity` and `get_all_activity` routes
    - _Requirements: 2.5, 3.3, 3.6_

  - [ ]* 3.8 Write property test for error response envelope
    - **Property 4: Error responses never leak internal details** — for any controller that throws, assert the response body has `message: "An internal error occurred"` and does not contain stack trace text
    - **Property 6: All API responses conform to the success/error envelope** — for any successful or error response, assert the body has either `{ success: true, data: ... }` or `{ success: false, message: ... }`
    - **Validates: Requirements 2.5, 3.1, 3.2**

- [x] 4. Update models and add indexes
  - [x] 4.1 Update `user.model.js` — remove token field
    - Remove the `token: { type: String }` field from `userScheme`
    - _Requirements: 2.2_

  - [x] 4.2 Update `meeting.model.js` — add compound index
    - Add `meetingSchema.index({ user_id: 1, date: -1 });` after the schema definition
    - _Requirements: 3.4_

- [x] 5. Checkpoint — backend is secure and functional
  - Ensure the backend starts with `npm run dev`, the `/login` route returns a JWT, the `/get_all_activity` route requires a Bearer token, and raw errors are not exposed. Ask the user if any questions arise.

- [x] 6. Update AuthContext to send JWT and remove token-in-body pattern
  - [x] 6.1 Add axios request interceptor in `AuthContext.jsx`
    - Add an `axios` request interceptor on the `client` instance that reads `localStorage.getItem("token")` and sets `config.headers.Authorization = \`Bearer ${token}\`` if present
    - _Requirements: 2.3_

  - [x] 6.2 Remove token from `getHistoryOfUser` and `addToUserHistory` call sites
    - Remove `params: { token: localStorage.getItem("token") }` from the `getHistoryOfUser` GET request
    - Remove `token: localStorage.getItem("token")` from the `addToUserHistory` POST body
    - _Requirements: 3.6_

- [x] 7. Implement global design system
  - [x] 7.1 Update `frontend/src/index.css` with CSS custom properties and Google Fonts
    - Add the `@import` for Inter from Google Fonts at the top
    - Define all DesignTokens (colours, spacing, typography, border-radius, shadows) as CSS variables on `:root` per the design document
    - Apply `font-family: var(--font-family)` on `body`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 8. Redesign the Landing page
  - [x] 8.1 Rewrite `frontend/src/pages/landing.jsx` with five sections
    - **Navbar**: fixed bar with Connectify wordmark (left) and "Login" + "Get Started" links (right), both navigating to `/auth`; use `var(--color-primary)` for the logo colour
    - **Hero**: two-column flex layout — headline, sub-headline, and CTA on the left; `mobile.png` with existing floating animation on the right; keep existing background image + dark overlay from `App.css`
    - **Features**: `<section>` with a CSS Grid of three cards (HD Video, Secure by Default, Built-in Chat) — each with an MUI icon, a bold title, and a two-sentence description
    - **How It Works**: three numbered step items (Create Account → Share Code → Start Call) in a horizontal row
    - **Footer**: `© 2024 Connectify` copyright text and a "Get Started" link to `/auth`
    - All colours via CSS variables; no hardcoded hex values in JSX inline styles
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 8.2 Update `App.css` with landing page section styles
    - Add styles for `.featuresSection`, `.featureCard`, `.howItWorksSection`, `.stepItem`, `.landingFooter`
    - Use `var(--color-primary)`, `var(--space-*)`, and `var(--radius-*)` tokens throughout
    - Add `@media` breakpoints for 768 px (stack features grid to 1 column, stack hero columns)
    - _Requirements: 4.3, 4.4, 10.1_

- [x] 9. Redesign the Authentication page
  - [x] 9.1 Rewrite `frontend/src/pages/authentication.jsx` with branded two-column layout
    - Replace the MUI Grid v2 layout with a plain CSS two-column grid (`display: grid; grid-template-columns: 1fr 1fr`)
    - **Left panel**: dark gradient background using `var(--color-bg-dark)`, Connectify logo in `var(--color-primary)`, tagline in white
    - **Right panel**: white card with Sign In / Sign Up toggle buttons, form fields, and submit button
    - Add `showPassword` state and an `InputAdornment` eye icon on the Password `TextField` to toggle `type`
    - Add `loading` state; when `true`, disable the submit button and show MUI `CircularProgress` size={20} inside it
    - Import `CircularProgress` from `@mui/material`
    - Keep existing `handleAuth`, `handleLogin`, `handleRegister` logic; wrap in `setLoading(true)/finally setLoading(false)`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 9.2 Add auth page CSS to `App.css`
    - Add `.authContainer` (full-height grid), `.authBrandPanel`, `.authFormPanel` styles
    - Add `@media (max-width: 768px)` to collapse to single column
    - _Requirements: 5.1, 10.2_

- [x] 10. Redesign the Dashboard (Home) page
  - [x] 10.1 Rewrite `frontend/src/pages/home.jsx` with action cards and recent meetings
    - **Navbar**: keep existing structure but style with CSS variables; history icon button navigates to `/history`; logout button clears token and navigates to `/auth`
    - **New Meeting card**: button generates `crypto.randomUUID()`, calls `addToUserHistory(code)`, copies code to clipboard via `navigator.clipboard.writeText(code)`, then `navigate(\`/${code}\`)`
    - **Join Meeting card**: controlled `TextField` for meeting code; "Join" button calls `addToUserHistory(meetingCode)` then `navigate(\`/${meetingCode}\`)`; IF `meetingCode.trim() === ""` set inline error state `"Please enter a meeting code"` and do not navigate
    - **Recent Meetings**: call `getHistoryOfUser()` on mount, slice to 3 items, render as small cards with code + formatted date; empty state shows `CalendarTodayIcon` + `"No meetings yet — start one above"`
    - Keep `withAuth` HOC wrapping
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 10.2 Add dashboard CSS to `App.css`
    - Add `.homeContainer`, `.homeNav`, `.homeMain`, `.actionCards`, `.actionCard`, `.recentMeetings`, `.meetingCard`, `.emptyState` styles
    - `.actionCards` uses `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6)` with `@media (max-width: 600px)` fallback to single column
    - _Requirements: 6.1, 10.3_

- [x] 11. Checkpoint — frontend routing, auth, and dashboard working end-to-end
  - Verify: landing page loads at `/`, auth page at `/auth`, dashboard at `/home` (protected), history at `/history`. Ensure JWT is attached to API calls and history loads correctly. Ask the user if any questions arise.

- [x] 12. Redesign the Video Meet room
  - [x] 12.1 Refactor `VideoMeet.jsx` — enforce conditional rendering and add avatar fallback
  - [x] 12.2 Redesign the Lobby view within `VideoMeet.jsx`
  - [x] 12.3 Redesign the control bar and chat panel in `VideoMeet.jsx`
  - [x] 12.4 Update `videoComponent.module.css` — participant grid, avatar fallback, control bar

- [x] 13. Redesign the History page
  - [x] 13.1 Rewrite `frontend/src/pages/history.jsx` with navbar, skeletons, and empty state
  - [x] 13.2 Add history page CSS to `App.css`

- [x] 14. Final checkpoint — full application end-to-end

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The backend must be restarted after creating `.env` for env vars to take effect
- The frontend dev server auto-reloads when `.env` is created (requires restart if added mid-session)
- `jsonwebtoken` and `dotenv` are the only new npm packages added to the backend
- No new frontend packages are required — `@mui/material`, `axios`, `react-router-dom`, and `socket.io-client` are already in `package.json`
