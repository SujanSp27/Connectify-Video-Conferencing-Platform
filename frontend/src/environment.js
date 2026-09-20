let IS_PROD = true;

const server = IS_PROD
    ? "https://connectify-video-conferencing.onrender.com"
    : "http://localhost:8000";

export default server;