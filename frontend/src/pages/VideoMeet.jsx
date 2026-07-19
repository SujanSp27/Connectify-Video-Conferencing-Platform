import React, { useEffect, useRef, useState } from 'react'
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

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])





    // let getDislayMedia = () => {
    //     if (screen) {
    //         if (navigator.mediaDevices.getDisplayMedia) {
    //             navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    //                 .then(getDislayMediaSuccess)
    //                 .then((stream) => { })
    //                 .catch((e) => console.log(e))
    //         }
    //     }
    // }


      const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }
}, [video, audio]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        // connectToSocketServer();

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

                <div>
                    <video
                        ref={localVideoref}
                        autoPlay
                        muted
                    ></video>
                </div>

            </div>
        </div>
    </div>
);
}