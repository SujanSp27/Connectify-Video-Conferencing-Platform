# Design Document — Connectify Production

## Overview

This document describes the architectural changes, component redesigns, and implementation patterns needed to transform the existing Connectify MERN app into a production-ready platform. The approach is surgical — every change targets a specific file and a specific problem. No new frameworks are introduced beyond what already exists in `package.json`.

**Detected language:** JavaScript (React 19 / Node.js ESM)

---

## Architecture

```
connectify/
├── backend/
│   └── src/
│       ├── app.js                     ← add dotenv, remove hardcoded URI
│       ├── middleware/
│       │   └── auth.middleware.js     ← NEW: JWT verification middleware
│       ├── controllers/
│       │   ├── user.controller.js     ← replace crypto token with JWT, sanitise errors
│       │   └── socketManager.js       ← no changes needed
│       ├── models/
│       │   ├── user.model.js          ← remove token field, add indexes
│       │   └── meeting.model.js       ← add compound index
│       └── routes/
│           └── users.routes.js        ← protect activity routes with AuthMiddleware
├── .env                               ← NEW (backend root)
└── frontend/
    └── src/
        ├── index.css                  ← NEW: CSS design tokens + Google Fonts
        ├── App.js                     ← fix /home route typo
        ├── App.css                    ← keep + extend with shared layout utilities
        ├── contexts/
        │   └── AuthContext.jsx        ← read API URL from env, remove token from history calls
        ├── pages/
        │   ├── landing.jsx            ← full redesign: hero + features + how-it-works + footer
        │   ├── authentication.jsx     ← redesign: branded panel + loading + password toggle
        │   ├── home.jsx               ← redesign: create/join cards + recent meetings
        │   ├── history.jsx            ← redesign: navbar + cards + empty state + skeleton
        │   └── VideoMeet.jsx          ← fix conditional render + avatar fallback + redesign controls
        └── styles/
            └── videoComponent.module.css  ← extend for avatar, grid improvements
```

---

## Section 1 — Backend Changes

### 1.1 Environment Configuration (`backend/.env` + `app.js`)

Create `backend/.env`:
```
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.bunvszu.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_here
```

Update `app.js` to import `dotenv` and use `process.env.MONGODB_URI`:

```javascript
import "dotenv/config";   // add at top
// replace hardcoded string:
await mongoose.connect(process.env.MONGODB_URI);
```

Install `dotenv` as a dependency: `npm install dotenv`.

### 1.2 JWT Authentication (`backend/src/middleware/auth.middleware.js`)

```javascript
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { _id, username, iat, exp }
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
```

Install `jsonwebtoken`: `npm install jsonwebtoken`.

### 1.3 Updated User Controller (`user.controller.js`)

**login** — replace `crypto.randomBytes` token with JWT, remove `user.token` save:

```javascript
import jwt from "jsonwebtoken";

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required" });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }
        const token = jwt.sign(
            { _id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        return res.status(200).json({ success: true, data: { token } });
    } catch (e) {
        next(e); // handled by global error middleware
    }
};
```

**register** — add validation, use envelope, pass errors to `next`:

```javascript
const register = async (req, res, next) => {
    try {
        const { name, username, password } = req.body;
        // Validation
        if (!name || name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ success: false, message: "Name must be 2–50 characters" });
        }
        if (!username || !/^[a-zA-Z0-9]{3,30}$/.test(username)) {
            return res.status(400).json({ success: false, message: "Username must be 3–30 alphanumeric characters" });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(302).json({ success: false, message: "Username already taken" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ name, username, password: hashedPassword }).save();
        return res.status(201).json({ success: true, data: { message: "User registered successfully" } });
    } catch (e) {
        next(e);
    }
};
```

**getUserHistory** — read user from `req.user` (set by AuthMiddleware):

```javascript
const getUserHistory = async (req, res, next) => {
    try {
        const meetings = await Meeting.find({ user_id: req.user.username })
            .sort({ date: -1 });
        return res.status(200).json({ success: true, data: meetings });
    } catch (e) {
        next(e);
    }
};
```

**addToHistory** — same, no token from body:

```javascript
const addToHistory = async (req, res, next) => {
    try {
        const { meeting_code } = req.body;
        await new Meeting({ user_id: req.user.username, meetingCode: meeting_code }).save();
        return res.status(201).json({ success: true, data: { message: "Added to history" } });
    } catch (e) {
        next(e);
    }
};
```

### 1.4 Global Error Middleware (`app.js`)

Add after all routes:

```javascript
// Global error handler — 4-argument signature
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "An internal error occurred" });
});
```

### 1.5 Updated Routes (`users.routes.js`)

```javascript
import { authMiddleware } from "../middleware/auth.middleware.js";

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(authMiddleware, addToHistory);
router.route("/get_all_activity").get(authMiddleware, getUserHistory);
```

### 1.6 Updated Models

**user.model.js** — remove `token` field:

```javascript
const userScheme = new Schema({
    name:     { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
```

**meeting.model.js** — add compound index:

```javascript
meetingSchema.index({ user_id: 1, date: -1 });
```

---

## Section 2 — Frontend Changes

### 2.1 App.js — Fix Route Typo

Change:
```jsx
<Route path='/home's element={<HomeComponent />} />
```
To:
```jsx
<Route path='/home' element={<HomeComponent />} />
```

### 2.2 AuthContext.jsx — Use Env Var + JWT Header

```javascript
const client = axios.create({
    baseURL: process.env.REACT_APP_API_URL + "/api/v1/users"
});

// Add request interceptor to attach JWT
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

The `getHistoryOfUser` and `addToUserHistory` functions no longer need to pass `token` in params/body — the interceptor handles it automatically.

### 2.3 Global Design System (`frontend/src/index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Brand colours */
  --color-primary:       #FF9839;
  --color-primary-dark:  #d97500;
  --color-bg-dark:       #010430;
  --color-bg-dark-2:     #0a0e3a;
  --color-white:         #ffffff;
  --color-text-muted:    rgba(255,255,255,0.7);

  /* Neutral */
  --color-surface:       #f8f9fa;
  --color-border:        #e0e0e0;
  --color-error:         #e53e3e;
  --color-success:       #38a169;

  /* Spacing scale */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Typography */
  --font-family:   'Inter', Arial, sans-serif;
  --font-sm:       0.875rem;
  --font-base:     1rem;
  --font-lg:       1.125rem;
  --font-xl:       1.25rem;
  --font-2xl:      1.5rem;
  --font-3xl:      1.875rem;
  --font-4xl:      2.25rem;
  --font-5xl:      3rem;

  /* Borders */
  --radius-sm:    6px;
  --radius-md:    12px;
  --radius-lg:    20px;
  --radius-full:  9999px;

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.12);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.12);
  --shadow-lg:  0 10px 40px rgba(0,0,0,0.2);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #root {
  width: 100%;
  min-height: 100%;
  font-family: var(--font-family);
}

body { overflow-x: hidden; }
```

### 2.4 Landing Page (`landing.jsx`) — Component Structure

The redesigned landing page has five distinct sections rendered in a single scrollable page:

**Navbar** — fixed, transparent-to-solid on scroll:
- Left: Connectify wordmark using `var(--color-primary)`
- Right: "Login" text link and "Get Started" filled button, both navigating to `/auth`

**Hero section**:
- Left: Large headline ("Connect with Anyone, Anywhere"), sub-headline, primary CTA button
- Right: `mobile.png` with floating animation (kept from existing CSS)

**Features section** — three cards in a CSS Grid:
- 📹 HD Video Calls — "Crystal-clear video with adaptive quality"
- 🔒 Secure by Default — "End-to-end encrypted signaling"
- 💬 Built-in Chat — "Real-time messaging during your call"

**How It Works section** — three numbered steps:
1. Create an account
2. Share your meeting code
3. Start your call

**Footer**:
- `© 2024 Connectify — All rights reserved`
- "Get Started" link to `/auth`

### 2.5 Authentication Page (`authentication.jsx`) — Component Structure

Two-column layout using CSS Grid (not MUI Grid v2):

**Left panel** (`--color-bg-dark` gradient background):
- Connectify logo + tagline in white

**Right panel** (white card):
- "Sign In" / "Sign Up" tab toggle (styled buttons, not MUI Tabs)
- Form fields with MUI TextField (already in use)
- Password field includes an `InputAdornment` with an eye icon to toggle `type="password"` / `type="text"`
- Submit button shows MUI `CircularProgress` (size 20) when `loading` state is true
- Error displayed in a `<p>` with `color: var(--color-error)`
- On success (register), MUI Snackbar appears and form resets to Sign In

State additions:
```javascript
const [loading, setLoading] = React.useState(false);
const [showPassword, setShowPassword] = React.useState(false);
```

### 2.6 Dashboard / Home Page (`home.jsx`) — Component Structure

```jsx
// Layout
<div className="homeContainer">
  <Navbar />           {/* logo + history icon + logout */}
  <main className="homeMain">
    <ActionCards />    {/* New Meeting card + Join Meeting card side by side */}
    <RecentMeetings /> {/* last 3 history entries or empty state */}
  </main>
</div>
```

**New Meeting card**: clicking generates `crypto.randomUUID()`, copies code to clipboard via `navigator.clipboard.writeText()`, then navigates.

**Join Meeting card**: controlled TextField + Join button with inline error if empty.

**Recent Meetings**: fetched from `getHistoryOfUser()` on mount, sliced to 3, rendered as small cards. Empty state shows a calendar SVG icon and "No meetings yet — start one above".

### 2.7 VideoMeet Component (`VideoMeet.jsx`) — Critical Conditional Fix

**The single most important fix** — wrap each view in a conditional:

```jsx
return (
  <div className={styles.meetContainer}>
    {askForUsername ? (
      <LobbyView
        username={username}
        setUsername={setUsername}
        connect={connect}
        localVideoRef={localVideoref}
        meetingCode={window.location.pathname.slice(1)}
      />
    ) : (
      <MeetingRoomView
        videos={videos}
        localVideoRef={localVideoref}
        showModal={showModal}
        messages={messages}
        message={message}
        newMessages={newMessages}
        username={username}
        video={video}
        audio={audio}
        screen={screen}
        screenAvailable={screenAvailable}
        handlers={{ handleVideo, handleAudio, handleScreen, handleEndCall,
                    openChat, closeChat, sendMessage, handleMessage }}
      />
    )}
  </div>
);
```

**Avatar fallback** — inside the participant tile, check if `video.stream` has active video tracks:

```jsx
const hasVideoTrack = (stream) =>
  stream && stream.getVideoTracks().some(t => t.enabled && t.readyState === "live");

// In the tile JSX:
{hasVideoTrack(video.stream) ? (
  <video ref={...} autoPlay playsInline />
) : (
  <div className={styles.avatarFallback}>
    {(video.username || "P")[0].toUpperCase()}
  </div>
)}
```

**handleEndCall** update:

```javascript
let handleEndCall = () => {
    try {
        window.localStream?.getTracks().forEach(t => t.stop());
    } catch {}
    if (socketRef.current) socketRef.current.disconnect();
    window.location.href = "/home";
};
```

**Socket URL from env**:

```javascript
const server_url = process.env.REACT_APP_API_URL || "http://localhost:8000";
```

### 2.8 History Page (`history.jsx`) — Component Structure

```jsx
<div className="historyContainer">
  <nav className="historyNav">
    <IconButton onClick={() => navigate("/home")}><ArrowBackIcon /></IconButton>
    <h2>Meeting History</h2>
  </nav>

  {loading ? (
    <SkeletonList />  // 3× MUI Skeleton cards
  ) : meetings.length > 0 ? (
    <ul className="meetingList">
      {meetings.map((m, i) => <MeetingCard key={i} meeting={m} />)}
    </ul>
  ) : (
    <EmptyState />  // CalendarTodayIcon + "No meeting history yet"
  )}
</div>
```

Add `loading` state:
```javascript
const [loading, setLoading] = useState(true);
// set to false in fetchHistory finally block
```

---

## Section 3 — VideoMeet CSS Additions (`videoComponent.module.css`)

Add avatar fallback styles:

```css
.avatarFallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-dark-2, #0a0e3a);
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  border-radius: 10px;
}
```

Add participant name overlay:

```css
.participantName {
  position: absolute;
  bottom: 8px;
  left: 10px;
  padding: 4px 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-sm, 0.875rem);
  backdrop-filter: blur(4px);
}
```

Update conference grid to CSS Grid:

```css
.conferenceView {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lobby-only rendering when waiting for username

For any render of the VideoMeet component where `askForUsername` is `true`, the Lobby view (username input + connect button) SHALL be present in the rendered output and the MeetingRoom view (control bar + video grid) SHALL NOT be present.

**Validates: Requirements 1.2, 7.1**

### Property 2: MeetingRoom-only rendering when username is set

For any render of the VideoMeet component where `askForUsername` is `false`, the MeetingRoom view (control bar + video grid) SHALL be present in the rendered output and the Lobby view SHALL NOT be present.

**Validates: Requirements 1.3, 7.2**

### Property 3: AuthMiddleware rejects all unauthenticated requests

For any HTTP request to a protected route (`/add_to_activity` or `/get_all_activity`) that is missing the `Authorization` header, carries a malformed token, or carries an expired token, the AuthMiddleware SHALL return HTTP 401 and SHALL NOT invoke the route handler.

**Validates: Requirements 2.3, 2.4, 3.6**

### Property 4: Error responses never leak internal details

For any server-side exception thrown in any controller, the HTTP response body SHALL contain the key `message` with the value `"An internal error occurred"` and SHALL NOT contain a JavaScript error object, stack trace, or the string representation of the exception.

**Validates: Requirements 2.5**

### Property 5: Registration validation rejects invalid inputs

For any registration request where `name` has fewer than 2 or more than 50 characters, OR `username` contains non-alphanumeric characters or has fewer than 3 or more than 30 characters, OR `password` has fewer than 8 characters, the Backend SHALL return HTTP 400 and SHALL NOT create a new User document.

**Validates: Requirements 2.6**

### Property 6: All API responses conform to the success/error envelope

For any response returned by any route handler, the JSON body SHALL contain either `{ "success": true, "data": ... }` for successful outcomes or `{ "success": false, "message": "..." }` for error outcomes, and SHALL NOT return a bare object outside this envelope.

**Validates: Requirements 3.1, 3.2**
