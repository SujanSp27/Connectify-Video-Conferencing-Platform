# Connectify

Connectify is a browser-based video conferencing application built with React, Node.js, and WebRTC. Create a meeting, share a room link, and connect through video, audio, screen sharing, and live chat.

## Features

- **Video and audio meetings** with camera and microphone controls.
- **Meeting rooms** with generated codes and shareable links.
- **Pre-meeting lobby** with a display name and media preview.
- **Screen sharing** in browsers that support it.
- **Live chat and emoji reactions** during a call.
- **Participant list** with microphone and camera status.
- **Account registration and login** using hashed passwords and JWT authentication.
- **Meeting history** with search, room codes, and rejoining.
- **Responsive interface** with meeting themes and fullscreen controls.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, React Router, Material UI, CSS Modules |
| API client | Axios |
| Backend | Node.js, Express 5 |
| Real-time signaling and chat | Socket.IO |
| Browser media | WebRTC |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcrypt |
| Frontend tooling | Create React App (`react-scripts`) |

## How It Works

The React frontend communicates with the Express API for registration, login, and meeting history. MongoDB stores user accounts and meeting activity. Socket.IO exchanges WebRTC signaling messages, participant updates, chat messages, and reactions. WebRTC carries media between participants' browsers.

Room membership and chat buffers are held in server memory. Each room retains up to 100 chat messages while active; its messages are removed when the last participant disconnects. Chat is separate from the meeting history stored in MongoDB.

## Project Structure

```text
connectify/
|-- backend/
|   |-- src/
|   |   |-- controllers/     # Authentication, meeting history, and sockets
|   |   |-- middleware/      # JWT verification
|   |   |-- models/          # User and meeting schemas
|   |   |-- routes/          # REST API routes
|   |   `-- app.js           # Express, HTTP server, and MongoDB setup
|   `-- package.json
|-- frontend/
|   |-- public/             # Static assets and route rewrite configuration
|   |-- src/
|   |   |-- contexts/       # Authentication state and API calls
|   |   |-- pages/          # Landing, authentication, dashboard, history, meetings
|   |   |-- styles/         # CSS Modules
|   |   |-- utils/          # Authentication helper
|   |   |-- App.js          # Client-side routes
|   |   `-- environment.js  # Fallback backend URL
|   `-- package.json
|-- render.yaml             # Frontend static-site configuration
`-- README.md
```

## Local Setup

### Prerequisites

- Node.js and npm. The locked Mongoose dependency requires Node.js **20.19.0 or newer**.
- A running MongoDB instance or a MongoDB Atlas connection string.
- A browser with WebRTC support and permission to use your camera and microphone.

### 1. Install dependencies

From the repository root:

```sh
cd backend
npm ci
cd ../frontend
npm ci
cd ..
```

### 2. Configure the backend

Create `backend/.env`:

```dotenv
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/connectify
JWT_SECRET=replace_with_a_long_random_secret
```

Replace `MONGODB_URI` with your database connection string if using a hosted database. Set `JWT_SECRET` to your own random value. Keep backend secrets out of source control and frontend environment variables.

### 3. Configure the frontend

Create `frontend/.env`:

```dotenv
REACT_APP_API_URL=http://localhost:8000
```

Use the backend origin without a trailing slash or `/api/v1/users` suffix. Both API requests and Socket.IO use this value. If it is omitted, the frontend uses the hosted backend URL in `frontend/src/environment.js`.

Restart the frontend development server after changing this file. Production builds embed the value at build time.

### 4. Start the application

In one terminal, from the repository root:

```sh
cd backend
npm run dev
```

In a second terminal, from the repository root:

```sh
cd frontend
npm start
```

Open **http://localhost:3000**. The backend listens on **http://localhost:8000** by default and connects to MongoDB before starting its HTTP server.

## Using Connectify

1. Register an account and sign in. Usernames must contain 3–30 alphanumeric characters; passwords must contain at least 8 characters.
2. Create a meeting from the dashboard, or enter a room code to join an existing meeting.
3. Choose a display name and check your camera and microphone in the lobby.
4. Share the meeting link with participants. Open full meeting links directly in the browser.
5. Use the call controls to toggle media, present your screen, chat, and send reactions.
6. View previously recorded meeting activity from the history page.

For a local smoke check, open the same room link in two browser sessions and check participant updates, media, and chat. Use headphones to avoid audio feedback.

## API Routes

All routes below are relative to `/api/v1/users`.

| Method | Route | Request body | Authentication |
| --- | --- | --- | --- |
| POST | `/register` | `name`, `username`, `password` | None |
| POST | `/login` | `username`, `password` | None |
| POST | `/add_to_activity` | `meeting_code` | Bearer token |
| GET | `/get_all_activity` | None | Bearer token |

Login returns a token and user details under `data`. Authenticated requests use `Authorization: Bearer <token>`. Tokens expire after seven days.

## Available Commands

Run each command from its corresponding directory.

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Start the backend with nodemon |
| `backend` | `npm start` | Start the backend with Node.js |
| `frontend` | `npm start` | Start the development server |
| `frontend` | `npm run build` | Generate static assets in `frontend/build` |
| `frontend` | `npm test` | Run the configured React test runner |

The frontend test file currently contains the default Create React App assertion and does not validate Connectify's meeting flows. The backend has no test script configured.

## Deployment

The repository includes Render static-site configuration for the frontend and a `frontend/public/_redirects` file for hosts that support that format. Client-side routes must resolve to `index.html` so direct meeting links and page refreshes work.

- **Backend:** install dependencies in `backend` with `npm ci`, run `npm start`, and supply `MONGODB_URI`, `JWT_SECRET`, and the service's `PORT`. The service must support Socket.IO connections.
- **Frontend:** install dependencies in `frontend` with `npm ci`, set `REACT_APP_API_URL` to your backend's HTTPS origin, run `npm run build`, and serve `frontend/build`.
- **Database:** provide a MongoDB instance reachable by the backend. The included static-site configuration does not provision the backend or database.

Camera, microphone, and screen capture require a secure browser context: use HTTPS outside localhost.


