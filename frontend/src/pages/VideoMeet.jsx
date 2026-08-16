import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
const server_url = "http://localhost:8000";

const connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
const socketRef = useRef();
const socketIdRef = useRef();

const localVideoref = useRef();

const [videoAvailable, setVideoAvailable] = useState(true);
const [audioAvailable, setAudioAvailable] = useState(true);

const [video, setVideo] = useState(false);
const [audio, setAudio] = useState(false);
const [screen, setScreen] = useState(false);

const [showModal, setModal] = useState(false);

const [screenAvailable, setScreenAvailable] = useState(false);

const [messages, setMessages] = useState([]);
const [message, setMessage] = useState("");
const [newMessages, setNewMessages] = useState(0);

const [askForUsername, setAskForUsername] = useState(true);

const [username, setUsername] = useState("");

const videoRef = useRef([]);

const [videos, setVideos] = useState([]);

useEffect(() => {
    getPermissions();

    return () => {

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) {
            console.log(e);
        }

        for (let id in connections) {
            try {
                connections[id].close();
            } catch (e) { }
        }
    };
}, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }


     const getPermissions = async () => {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        setVideoAvailable(true);
        setAudioAvailable(true);

        window.localStream = stream;

        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        }

    } catch (e) {

        console.log(e);

        setVideoAvailable(false);
        setAudioAvailable(false);

    }

};

  useEffect(() => {

    getUserMedia();

}, [video, audio]);

let getMedia = () => {

    setVideo(videoAvailable);

    setAudio(audioAvailable);

    getUserMedia();

    connectToSocketServer();

}
    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }
   let connect = () => {

    if (!username.trim()) {

        alert("Please enter username");

        return;

    }

   setAskForUsername(false);

getMedia();

if (screen) {
    getDislayMedia();
}

}

function silence() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();

    const track = dst.stream.getAudioTracks()[0];
    track.enabled = false;

    return track;
}

function black({ width = 640, height = 480 } = {}) {

    const canvas = Object.assign(document.createElement("canvas"), {
        width,
        height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);

    const stream = canvas.captureStream();

    const track = stream.getVideoTracks()[0];

    track.enabled = false;

    return track;
}


  let getUserMediaSuccess = (stream) => {

    try {
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
    } catch (e) {
        console.log(e);
    }

    window.localStream = stream;

    if (localVideoref.current) {
        localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {

        if (id === socketIdRef.current) continue;

        if (window.localStream) {
           window.localStream.getTracks().forEach(track => {
    connections[id].addTrack(track, window.localStream);
});
        }

        connections[id]
            .createOffer()
            .then((description) => {

                console.log(description);

                connections[id]
                    .setLocalDescription(description)
                    .then(() => {

                        socketRef.current.emit(
                            "signal",
                            id,
                            JSON.stringify({
                                sdp: connections[id].localDescription
                            })
                        );

                    })
                    .catch(e => console.log(e));

            })
            .catch(e => console.log(e));
    }

    stream.getTracks().forEach(track => {

        track.onended = () => {

            setVideo(false);
            setAudio(false);

            try {

                if (localVideoref.current &&
                    localVideoref.current.srcObject) {

                    let tracks =
                        localVideoref.current.srcObject.getTracks();

                    tracks.forEach(track => track.stop());

                }

            } catch (e) {
                console.log(e);
            }

            let blackSilence = (...args) =>
                new MediaStream([
                    black(...args),
                    silence()
                ]);

            window.localStream = blackSilence();

            if (localVideoref.current) {
                localVideoref.current.srcObject =
                    window.localStream;
            }

            for (let id in connections) {

                if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
    connections[id].addTrack(track, window.localStream);
});
                }

                connections[id]
                    .createOffer()
                    .then((description) => {

                        connections[id]
                            .setLocalDescription(description)
                            .then(() => {

                                socketRef.current.emit(
                                    "signal",
                                    id,
                                    JSON.stringify({
                                        sdp: connections[id].localDescription
                                    })
                                );

                            })
                            .catch(e => console.log(e));

                    })
                    .catch(e => console.log(e));
            }

        };

    });

};
     let getDislayMediaSuccess = (stream) => {

    console.log("HERE");

    try {
        window.localStream.getTracks().forEach(track => track.stop());
    } catch (e) {
        console.log(e);
    }

    window.localStream = stream;

    if (localVideoref.current) {
        localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {

        if (id === socketIdRef.current) continue;

        if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
    connections[id].addTrack(track, window.localStream);
});
        }

        connections[id]
            .createOffer()
            .then((description) => {

                connections[id]
                    .setLocalDescription(description)
                    .then(() => {

                        socketRef.current.emit(
                            "signal",
                            id,
                            JSON.stringify({
                                sdp: connections[id].localDescription,
                            })
                        );

                    })
                    .catch((e) => console.log(e));

            })
            .catch((e) => console.log(e));
    }

    stream.getTracks().forEach(track => {

        track.onended = () => {

            setScreen(false);

            try {

                let tracks = localVideoref.current.srcObject.getTracks();

                tracks.forEach(track => track.stop());

            } catch (e) {

                console.log(e);

            }

            let blackSilence = (...args) =>
                new MediaStream([
                    black(...args),
                    silence()
                ]);

            window.localStream = blackSilence();

            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }

            getUserMedia();

        };

    });

};

      let gotMessageFromServer = async (fromId, message) => {

    let signal;

    try {
        signal = JSON.parse(message);
    } catch (e) {
        console.log("Invalid Signal:", e);
        return;
    }

    if (fromId === socketIdRef.current) return;

    if (!connections[fromId]) return;

    try {

        if (signal.sdp) {

            await connections[fromId].setRemoteDescription(
                new RTCSessionDescription(signal.sdp)
            );

            if (signal.sdp.type === "offer") {

                const description =
                    await connections[fromId].createAnswer();

                await connections[fromId].setLocalDescription(description);

                socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({
                        sdp: connections[fromId].localDescription
                    })
                );
            }

        }

        if (signal.ice) {

            await connections[fromId].addIceCandidate(
                new RTCIceCandidate(signal.ice)
            );

        }

    } catch (e) {

        console.log(e);

    }

};
 let handleVideo = () => {
        setVideo(!video);
        getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        getUserMedia();
    }
   let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

     useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }
let addMessage = (data, sender, socketIdSender) => {

    setMessages(prevMessages => [
        ...prevMessages,
        {
            sender: sender,
            data: data
        }
    ]);

    if (socketIdSender !== socketIdRef.current) {
        setNewMessages(prev => prev + 1);
    }

};
let sendMessage = () => {

    if (message.trim() === "") return;

    console.log("SEND CLICKED");
    console.log("Message:", message);
    console.log("Socket:", socketRef.current);

    // Show the message immediately
    setMessages(prevMessages => [
        ...prevMessages,
        {
            sender: username,
            data: message
        }
    ]);

    // Send to other users
    if (socketRef.current) {
        socketRef.current.emit(
            "chat-message",
            message,
            username
        );
    }

    setMessage("");
};
   let connectToSocketServer = () => {
        if (socketRef.current?.connected) return;
    socketRef.current = io.connect(server_url, {
        secure: false
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {

        socketRef.current.emit("join-call", window.location.href);

        socketIdRef.current = socketRef.current.id;

        if (typeof addMessage === "function") {
            socketRef.current.on("chat-message", addMessage);
        }

        socketRef.current.on("user-left", (id) => {

            try {
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            } catch (e) {
                console.log(e);
            }

            setVideos((videos) =>
                videos.filter(video => video.socketId !== id)
            );

        });

        socketRef.current.on("user-joined", (id, clients) => {

            clients.forEach((socketListId) => {

                if (connections[socketListId]) return;

                connections[socketListId] =
                    new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId].onconnectionstatechange = () => {

    console.log(
        socketListId,
        connections[socketListId].connectionState
    );

};

                connections[socketListId].onicecandidate = (event) => {

                    if (event.candidate) {

                        socketRef.current.emit(
                            "signal",
                            socketListId,
                            JSON.stringify({
                                ice: event.candidate
                            })
                        );

                    }

                };

                connections[socketListId].ontrack = (event) => {

    const remoteStream = event.streams[0];

                    let videoExists =
                        videoRef.current.find(
                            video => video.socketId === socketListId
                        );

                    if (videoExists) {

                        setVideos(videos => {

                            const updatedVideos = videos.map(video =>

                                video.socketId === socketListId
                                    ? {
                                        ...video,
                                        stream: remoteStream,
                                    }
                                    : video

                            );

                            videoRef.current = updatedVideos;

                            return updatedVideos;

                        });

                    } else {

                        const newVideo = {

                            socketId: socketListId,

                            stream: remoteStream,

                            autoplay: true,

                            playsinline: true

                        };

                        setVideos(videos => {

                            const updatedVideos = [
                                ...videos,
                                newVideo
                            ];

                            videoRef.current = updatedVideos;

                            return updatedVideos;

                        });

                    }

                };

            

                 if (window.localStream) {

    window.localStream.getTracks().forEach(track => {
        connections[socketListId].addTrack(track, window.localStream);
    });

}

                 else {

                    let blackSilence = (...args) =>
                        new MediaStream([
                            black(...args),
                            silence()
                        ]);

                    window.localStream = blackSilence();
window.localStream.getTracks().forEach(track => {
    connections[socketListId].addTrack(track, window.localStream);
});

                }

            });

                        if (id === socketIdRef.current) {

                for (let id2 in connections) {

                    if (id2 === socketIdRef.current) continue;

                    try {

                        if (window.localStream) {

                           window.localStream.getTracks().forEach(track => {
    connections[id2].addTrack(track, window.localStream);
});

                        }

                    } catch (e) {

                        console.log(e);

                    }

                    connections[id2]
                        .createOffer()
                        .then((description) => {

                            connections[id2]
                                .setLocalDescription(description)
                                .then(() => {

                                    socketRef.current.emit(
                                        "signal",
                                        id2,
                                        JSON.stringify({
                                            sdp: connections[id2].localDescription
                                        })
                                    );

                                })
                                .catch(e => console.log(e));

                        })
                        .catch(e => console.log(e));

                }

            }

        });

    });

};

return (
    <div className={styles.meetContainer}>

        {/* Lobby Section */}
        <div className={styles.lobbyContainer}>
            <h2>Enter into Lobby</h2>

            <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
            />

            <Button
                variant="contained"
                onClick={connect}
            >
                Connect
            </Button>
        </div>

        {/* Meeting Container */}
        <div className={styles.meetVideoContainer}>

            {/* Chat Room */}
            {showModal && (
                <div className={styles.chatRoom}>

                    <div className={styles.chatContainer}>

                        <div className={styles.chatHeader}>
                            <h1>Chat</h1>

                            <IconButton
                                onClick={() => setModal(false)}
                                style={{ color: "white" }}
                            >
                                ✕
                            </IconButton>
                        </div>

                        {/* Messages */}
                        <div className={styles.chattingDisplay}>

                            {messages.length > 0 ? (
                                messages.map((item, index) => (
                                    <div
                                        key={index}
                                        className={styles.message}
                                    >
                                        <p className={styles.sender}>
                                            {item.sender}
                                        </p>

                                        <p className={styles.messageText}>
                                            {item.data}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noMessages}>
                                    No Messages Yet
                                </p>
                            )}

                        </div>

                        {/* Chat Input */}
                        <div className={styles.chattingArea}>

                            <TextField
                                fullWidth
                                value={message}
                                onChange={(e) =>
                                    setMessage(e.target.value)
                                }
                                label="Enter your message"
                                variant="outlined"
                            />

                            <Button
                                variant="contained"
                                onClick={sendMessage}
                            >
                                Send
                            </Button>

                        </div>

                    </div>
                </div>
            )}

            {/* Control Buttons */}
            <div className={styles.buttonContainers}>

                {/* Video */}
                <IconButton
                    onClick={handleVideo}
                    style={{ color: "white" }}
                >
                    {video ? (
                        <VideocamIcon />
                    ) : (
                        <VideocamOffIcon />
                    )}
                </IconButton>

                {/* End Call */}
                <IconButton
                    onClick={handleEndCall}
                    style={{ color: "red" }}
                >
                    <CallEndIcon />
                </IconButton>

                {/* Audio */}
                <IconButton
                    onClick={handleAudio}
                    style={{ color: "white" }}
                >
                    {audio ? (
                        <MicIcon />
                    ) : (
                        <MicOffIcon />
                    )}
                </IconButton>

                {/* Screen Share */}
                {screenAvailable && (
                    <IconButton
                        onClick={handleScreen}
                        style={{ color: "white" }}
                    >
                        {screen ? (
                            <ScreenShareIcon />
                        ) : (
                            <StopScreenShareIcon />
                        )}
                    </IconButton>
                )}

                {/* Chat */}
                <Badge
                    badgeContent={newMessages}
                    max={999}
                    color="primary"
                >
                    <IconButton
                        onClick={() => setModal(!showModal)}
                        style={{ color: "white" }}
                    >
                        <ChatIcon />
                    </IconButton>
                </Badge>

            </div>

            {/* Local Video */}
            <video
                className={styles.meetUserVideo}
                ref={localVideoref}
                autoPlay
                muted
                playsInline
            />

            {/* Other Participants */}
            <div className={styles.conferenceView}>

                {videos.map((video) => (
                    <div
                        key={video.socketId}
                        className={styles.videoWrapper}
                    >
                        <video
                            data-socket={video.socketId}
                            ref={(ref) => {
                                if (ref && video.stream) {
                                    ref.srcObject = video.stream;
                                }
                            }}
                            autoPlay
                            playsInline
                        />

                        <span className={styles.participantName}>
                            Participant
                        </span>
                    </div>
                ))}

            </div>

        </div>

    </div>
);
}