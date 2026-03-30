"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface UseWebRTCProps {
  vibe: string;
  onMatched?: () => void;
  onPartnerLeft?: () => void;
  onFriendRequest?: () => void;
  onFriendshipConfirmed?: () => void;
  onReaction?: (emoji: string) => void;
}

export function useWebRTC({
  vibe,
  onMatched,
  onPartnerLeft,
  onFriendRequest,
  onFriendshipConfirmed,
  onReaction,
}: UseWebRTCProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to signaling server");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from signaling server");
      setIsConnected(false);
    });

    socketRef.current.on("waiting", () => {
      setIsWaiting(true);
    });

    socketRef.current.on("matched", async ({ roomId, isInitiator }) => {
      console.log("Matched! Room:", roomId, "Initiator:", isInitiator);
      roomIdRef.current = roomId;
      setIsWaiting(false);
      setIsInCall(true);
      onMatched?.();

      if (isInitiator) {
        await createOffer();
      }
    });

    socketRef.current.on("offer", async ({ offer }) => {
      console.log("Received offer");
      await handleOffer(offer);
    });

    socketRef.current.on("answer", async ({ answer }) => {
      console.log("Received answer");
      await handleAnswer(answer);
    });

    socketRef.current.on("ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on("partner-left", () => {
      console.log("Partner left");
      cleanupCall();
      onPartnerLeft?.();
    });

    socketRef.current.on("friend-request-received", () => {
      onFriendRequest?.();
    });

    socketRef.current.on("friendship-confirmed", () => {
      onFriendshipConfirmed?.();
    });

    socketRef.current.on("reaction", ({ emoji }) => {
      onReaction?.(emoji);
    });

    return () => {
      socketRef.current?.disconnect();
      cleanupCall();
    };
  }, []);

  // Get user media
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError("Could not access camera/microphone. Please allow permissions.");
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && roomIdRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId: roomIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log("Setting remote stream with tracks:", event.streams[0].getTracks().map(t => t.kind));
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        onPartnerLeft?.();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [onPartnerLeft]);

  // Create and send offer
  const createOffer = useCallback(async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit("offer", {
      roomId: roomIdRef.current,
      offer: pc.localDescription,
    });
  }, [createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit("answer", {
      roomId: roomIdRef.current,
      answer: pc.localDescription,
    });
  }, [createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  // Join queue
  const joinQueue = useCallback(async () => {
    try {
      await startLocalStream();
      socketRef.current?.emit("join-queue", { vibe });
    } catch (err) {
      console.error("Failed to join queue:", err);
    }
  }, [vibe, startLocalStream]);

  // Skip current call
  const skip = useCallback(() => {
    if (roomIdRef.current) {
      socketRef.current?.emit("skip", { roomId: roomIdRef.current });
    }
    cleanupCall();
  }, []);

  // Send friend request
  const sendFriendRequest = useCallback(() => {
    if (roomIdRef.current) {
      socketRef.current?.emit("friend-request", { roomId: roomIdRef.current });
    }
  }, []);

  // Accept friend request
  const acceptFriendRequest = useCallback(() => {
    if (roomIdRef.current) {
      socketRef.current?.emit("friend-accept", { roomId: roomIdRef.current });
    }
  }, []);

  // Send reaction
  const sendReaction = useCallback((emoji: string) => {
    if (roomIdRef.current) {
      socketRef.current?.emit("reaction", { roomId: roomIdRef.current, emoji });
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // Cleanup call
  const cleanupCall = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    roomIdRef.current = null;
    setRemoteStream(null);
    setIsInCall(false);
  }, []);

  // Stop all streams
  const stopStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    cleanupCall();
  }, [cleanupCall]);

  return {
    isConnected,
    isWaiting,
    isInCall,
    localStream,
    remoteStream,
    error,
    joinQueue,
    skip,
    sendFriendRequest,
    acceptFriendRequest,
    sendReaction,
    toggleMute,
    toggleVideo,
    stopStreams,
  };
}
