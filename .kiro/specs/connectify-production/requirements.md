# Requirements Document

## Introduction

Connectify is an existing MERN-stack video conferencing application that is functional at the WebRTC/Socket.IO level but has critical bugs that prevent it from running, several security vulnerabilities, and a UI that needs a professional redesign. This spec covers the changes needed to turn the existing codebase into a production-ready platform — no rebuild from scratch.

The work is grouped into ten areas: critical bug fixes, backend security, backend quality improvements, landing page redesign, authentication UI redesign, dashboard redesign, video meet room redesign, history page redesign, a global design system, and responsive design.

---

## Glossary

- **System**: The Connectify application (frontend + backend together)
- **Backend**: The Node.js/Express/Socket.IO server in `backend/src/`
- **Frontend**: The React application in `frontend/src/`
- **AuthMiddleware**: An Express middleware function that validates the JWT from the `Authorization` header and attaches the decoded user to `req.user`
- **JWT**: JSON Web Token used to authenticate API requests after login
- **Lobby**: The pre-join screen in `VideoMeet.jsx` where a user enters their display name before entering a meeting room
- **MeetingRoom**: The active video call view inside `VideoMeet.jsx` shown after the user clicks Connect in the Lobby
- **DesignToken**: A CSS custom property (variable) defined on `:root` that encodes a shared design value such as a colour, spacing unit, or font size

---

## Requirements

### Requirement 1 — Critical Bug Fixes

**User Story:** As a developer, I want all routing and rendering bugs fixed, so that the application actually loads and navigates correctly.

#### Acceptance Criteria

1. WHEN the React application initialises, THE Frontend SHALL resolve the `/home` route without a syntax error (fixing the `'/home's` typo in `App.js` so the Route `path` prop is the string `"/home"`).
2. WHEN `askForUsername` state is `true`, THE VideoMeet component SHALL render only the Lobby view and SHALL NOT render the MeetingRoom view.
3. WHEN `askForUsername` state is `false`, THE VideoMeet component SHALL render only the MeetingRoom view and SHALL NOT render the Lobby view.
4. WHEN the Backend starts, THE Backend SHALL read the MongoDB connection URI from a `.env` file via `process.env.MONGODB_URI` instead of a hardcoded string.
5. WHEN the Frontend makes API requests, THE Frontend SHALL read the base URL from `process.env.REACT_APP_API_URL` instead of the hardcoded `http://localhost:8000`.
6. WHEN the WebSocket client connects, THE VideoMeet component SHALL read the server URL from `process.env.REACT_APP_API_URL` instead of the hardcoded `http://localhost:8000`.

---

### Requirement 2 — Backend Security

**User Story:** As a system administrator, I want the backend to use secure authentication and protect sensitive data, so that user accounts and meeting history cannot be trivially compromised.

#### Acceptance Criteria

1. WHEN a user logs in successfully, THE Backend SHALL generate a signed JWT containing the user's `_id` and `username`, with an expiry of 7 days, using a secret read from `process.env.JWT_SECRET`.
2. WHEN a JWT is issued at login, THE Backend SHALL remove the `token` field from the `User` document and SHALL NOT store the JWT in the database.
3. WHEN a protected route receives a request, THE AuthMiddleware SHALL verify the `Authorization: Bearer <token>` header and attach the decoded payload to `req.user`.
4. IF the `Authorization` header is absent or the JWT is invalid or expired, THEN THE AuthMiddleware SHALL return HTTP 401 with the message `"Unauthorized"` and SHALL NOT call the next handler.
5. WHEN a server-side error is caught in any controller, THE Backend SHALL return a generic message `"An internal error occurred"` and SHALL NOT include the error object or stack trace in the response body.
6. WHEN a registration request is received, THE Backend SHALL validate that `name` is between 2 and 50 characters, `username` is between 3 and 30 alphanumeric characters, and `password` is at least 8 characters; IF any field fails validation THEN THE Backend SHALL return HTTP 400 with a descriptive field-level error message.
7. WHEN a login request is received, THE Backend SHALL validate that both `username` and `password` are non-empty strings; IF either is missing THEN THE Backend SHALL return HTTP 400 with the message `"Username and password are required"`.

---

### Requirement 3 — Backend Quality Improvements

**User Story:** As a backend developer, I want consistent API responses, proper indexes, and centralised error handling, so that the codebase is maintainable and performs well under load.

#### Acceptance Criteria

1. THE Backend SHALL wrap every successful API response in a consistent JSON envelope: `{ "success": true, "data": <payload> }`.
2. THE Backend SHALL wrap every error API response in a consistent JSON envelope: `{ "success": false, "message": "<human-readable message>" }`.
3. THE Backend SHALL register a global Express error-handling middleware (four-argument function) that catches any unhandled errors and returns HTTP 500 with the envelope from criterion 3.2.
4. WHEN the application starts, THE Backend SHALL define a compound index on `Meeting` for `{ user_id: 1, date: -1 }` so that history queries are covered by an index.
5. WHEN the application starts, THE Backend SHALL define an index on `User` for `{ username: 1 }` (already `unique: true` in schema — this confirms the index exists explicitly).
6. THE `/add_to_activity` and `/get_all_activity` routes SHALL be protected by AuthMiddleware, and the controllers SHALL read the user identity from `req.user` instead of accepting a raw token in the request body or query string.
7. WHEN the Backend starts, THE Backend SHALL log the MongoDB host and the listening port to the console using the existing `console.log` statements, and SHALL NOT expose the connection string.

---

### Requirement 4 — Landing Page Redesign

**User Story:** As a visitor, I want a professional landing page with clear sections explaining Connectify's value, so that I understand the product and am motivated to sign up.

#### Acceptance Criteria

1. THE Landing page SHALL display a fixed navigation bar with the Connectify logo on the left and "Login" and "Get Started" links on the right.
2. THE Landing page SHALL display a hero section with a headline, a sub-headline, a primary CTA button that navigates to `/auth`, and the existing `mobile.png` illustration.
3. THE Landing page SHALL display a Features section with at least three feature cards, each containing an icon, a title, and a two-sentence description.
4. THE Landing page SHALL display a "How It Works" section with three numbered steps: create an account, share a meeting code, and start a video call.
5. THE Landing page SHALL display a footer with the copyright notice and links to the auth page.
6. WHEN a visitor clicks any navigation CTA, THE Landing page SHALL navigate to `/auth`.

---

### Requirement 5 — Authentication UI Redesign

**User Story:** As a user, I want a polished login and registration form with clear feedback, so that I can sign up or sign in without confusion.

#### Acceptance Criteria

1. THE Authentication page SHALL display a two-column layout: a branded left panel with a gradient background and the Connectify logo, and a form panel on the right.
2. THE Authentication page SHALL display a tab/toggle row with "Sign In" and "Sign Up" options to switch between forms.
3. WHEN the "Sign Up" tab is active, THE Authentication page SHALL display fields for Full Name, Username, and Password with a show/hide password toggle.
4. WHEN the "Sign In" tab is active, THE Authentication page SHALL display fields for Username and Password with a show/hide password toggle.
5. WHEN a form is submitted, THE Authentication page SHALL display a loading spinner inside the submit button and disable the button until the request completes.
6. IF the API returns an error, THEN THE Authentication page SHALL display the error message directly below the form in red text.
7. IF registration succeeds, THEN THE Authentication page SHALL display a success snackbar and switch to the Sign In tab.

---

### Requirement 6 — Dashboard Redesign

**User Story:** As an authenticated user, I want a well-organised dashboard where I can create or join a meeting with a single action, so that starting a call is fast.

#### Acceptance Criteria

1. THE Dashboard SHALL display a top navigation bar with the Connectify logo, a "History" icon button, and a "Logout" button.
2. THE Dashboard SHALL display a "New Meeting" card that generates a random UUID meeting code, copies it to the clipboard when clicked, and navigates to that meeting URL.
3. THE Dashboard SHALL display a "Join Meeting" card with a text field for the meeting code and a "Join" button; WHEN the Join button is clicked THE Dashboard SHALL navigate to `/<meetingCode>` and record the code in history.
4. IF the meeting code field is empty when the Join button is clicked, THEN THE Dashboard SHALL display an inline error message `"Please enter a meeting code"` and SHALL NOT navigate.
5. THE Dashboard SHALL display a "Recent Meetings" section showing the three most recent history entries with the meeting code and formatted date; IF there is no history THEN THE Dashboard SHALL display an empty-state illustration and the message `"No meetings yet — start one above"`.
6. WHEN the History icon button is clicked, THE Dashboard SHALL navigate to `/history`.
7. WHEN the Logout button is clicked, THE Dashboard SHALL remove the `token` key from `localStorage` and navigate to `/auth`.

---

### Requirement 7 — Video Meet Room Redesign

**User Story:** As a meeting participant, I want a professional video room with clear controls and a working lobby, so that I can manage my camera, microphone, and chat without confusion.

#### Acceptance Criteria

1. WHILE `askForUsername` is `true`, THE VideoMeet component SHALL render the Lobby view exclusively: a centred card with the meeting code displayed, a username text field, a "Join Meeting" button, and a camera/mic preview.
2. WHILE `askForUsername` is `false`, THE VideoMeet component SHALL render the MeetingRoom view exclusively: a participant grid, a local video tile, a control bar, and optionally a chat panel.
3. WHEN a participant has no active video stream, THE VideoMeet component SHALL display a circular avatar with the participant's first initial as a fallback inside that participant's tile.
4. THE control bar SHALL contain buttons for toggle video, toggle audio, toggle screen share, toggle chat, and end call, each with a visible icon and a tooltip label.
5. WHEN the end-call button is clicked, THE VideoMeet component SHALL stop all local media tracks, disconnect the socket, and navigate to `/home`.
6. WHEN a new chat message arrives while the chat panel is closed, THE VideoMeet component SHALL increment and display a badge count on the chat icon button.
7. WHEN the chat panel is open, THE VideoMeet component SHALL reset the unread-message badge count to zero.
8. THE participant grid SHALL arrange video tiles in a responsive CSS Grid layout that adapts from a single column on mobile to a 2×N grid on tablet and a dynamic grid on desktop.

---

### Requirement 8 — History Page Redesign

**User Story:** As a user, I want a well-styled meeting history page that clearly presents past meetings and handles the empty state gracefully.

#### Acceptance Criteria

1. THE History page SHALL display a top navigation bar consistent with the Dashboard navbar, with a back-arrow button that navigates to `/home`.
2. THE History page SHALL display each meeting record as a styled card showing the meeting code and the formatted date (DD/MM/YYYY).
3. WHEN there are no meeting records, THE History page SHALL display a centred empty-state message: `"No meeting history yet"` with a calendar icon.
4. WHEN the history fetch is in progress, THE History page SHALL display a loading skeleton in place of the meeting cards.

---

### Requirement 9 — Global Design System

**User Story:** As a frontend developer, I want a shared set of CSS variables and typography rules, so that the entire application looks cohesive and changes to colours or spacing only need to be made in one place.

#### Acceptance Criteria

1. THE Frontend SHALL define all brand colours, font sizes, spacing scale, border-radius values, and box-shadow tokens as CSS custom properties on `:root` in `index.css`.
2. THE Frontend SHALL define the primary brand colour as `--color-primary: #FF9839` and the dark background as `--color-bg-dark: #010430`.
3. WHEN any component applies colour, spacing, or typography, THE Frontend component SHALL reference DesignTokens (CSS variables) rather than hardcoded hex values or pixel literals, except within CSS module files that import via `var(--token)` syntax.
4. THE Frontend SHALL use `Inter` as the primary typeface, loaded from Google Fonts, applied globally via `font-family` in `body`.

---

### Requirement 10 — Responsive Design

**User Story:** As a user on any device, I want every page to be usable on screens ranging from 320 px to 1440 px wide, so that I can use Connectify on my phone or laptop.

#### Acceptance Criteria

1. THE Landing page SHALL be usable and visually correct at viewport widths of 320 px, 768 px, and 1440 px.
2. THE Authentication page SHALL stack its two columns into a single column at viewport widths below 768 px.
3. THE Dashboard SHALL arrange its action cards in a single column at viewport widths below 600 px.
4. THE Video MeetingRoom SHALL adapt its participant grid so that each tile is at least 280 px wide, wrapping to the next row when necessary.
5. THE History page SHALL stack its meeting cards in a full-width single column at viewport widths below 600 px.
6. WHILE the viewport width is below 480 px, THE control bar in the MeetingRoom SHALL reduce icon button sizes so that the bar does not overflow horizontally.
