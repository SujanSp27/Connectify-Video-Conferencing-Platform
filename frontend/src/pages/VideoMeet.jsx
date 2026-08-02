import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import { TextField, Button } from "@mui/material";
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

const [showModal, setModal] = useState(true);

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

    connectToSocketServer();

}
   let connect = () => {

    if (!username.trim()) {

        alert("Please enter username");

        return;

    }

    setAskForUsername(false);

    getMedia();

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
            connections[id].addStream(window.localStream);
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
                    connections[id].addStream(window.localStream);
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
            connections[id].addStream(window.localStream);
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

        let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }


    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

return (
    <div>
        <div>
            <div>

                <h2>Enter into Lobby</h2>

                <TextField
                    id="outlined-basic"
                    label="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    variant="outlined"
                />

                <Button
                    variant="contained"
                    onClick={connect}
                >
                    Connect
                </Button>

                      <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

            </div>
        </div>
    </div>
);
}