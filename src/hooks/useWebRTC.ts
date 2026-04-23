"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";

const rawSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
const SOCKET_URL = rawSocketUrl
  ? /^https?:\/\//i.test(rawSocketUrl)
    ? rawSocketUrl
    : `https://${rawSocketUrl}`
  : "http://localhost:3001";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

interface UseWebRTCProps {
  vibe: string;
  roomCode?: string | null;
  userId?: string;
  onMatched?: (partnerUserId?: string, crossVibe?: boolean) => void;
  onPartnerLeft?: () => void;
  onFriendRequest?: (fromUserId?: string) => void;
  onFriendshipConfirmed?: (user1Id?: string, user2Id?: string) => void;
  onReaction?: (emoji: string) => void;
  onCrossVibeMatch?: (originalVibe: string, matchedVibe: string) => void;
}

export function useWebRTC({
  vibe,
  roomCode,
  userId,
  onMatched,
  onPartnerLeft,
  onFriendRequest,
  onFriendshipConfirmed,
  onReaction,
  onCrossVibeMatch,
}: UseWebRTCProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState("Looking for someone...");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const supabase = createClient();

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to signaling server");
      setIsConnected(true);
      setError(null);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from signaling server");
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      setIsConnected(false);
      setError("Unable to connect to call server. Please try again in a few seconds.");
    });

    socketRef.current.on("waiting", () => {
      setIsWaiting(true);
      setWaitingMessage("Finding your match...");
    });

    socketRef.current.on("waiting-room", ({ message }) => {
      setIsWaiting(true);
      setWaitingMessage(message || "Waiting for your friend to join...");
    });

    socketRef.current.on("still-waiting", ({ message }) => {
      console.log("Still waiting:", message);
      setWaitingMessage(message || "Still searching...");
    });

    socketRef.current.on("queue-error", ({ message }) => {
      setError(message || "Could not join matching queue.");
      setIsWaiting(false);
    });

    socketRef.current.on("room-error", ({ message }) => {
      setError(message || "Could not join call room.");
      setIsWaiting(false);
    });

    socketRef.current.on("matched", async ({ roomId, isInitiator, partnerUserId: pId, crossVibe }) => {
      console.log("Matched! Room:", roomId, "Initiator:", isInitiator, "Partner:", pId);
      roomIdRef.current = roomId;
      setPartnerUserId(pId || null);
      setIsWaiting(false);
      setWaitingMessage("");
      setIsInCall(true);
      onMatched?.(pId, crossVibe);

      if (isInitiator) {
        await createOffer();
      }
    });

    socketRef.current.on("cross-vibe-match", ({ originalVibe, matchedVibe }) => {
      console.log(`Cross-vibe match: ${originalVibe} -> ${matchedVibe}`);
      onCrossVibeMatch?.(originalVibe, matchedVibe);
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
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.log("Error adding ICE candidate:", err);
        }
      }
    });

    socketRef.current.on("partner-left", () => {
      console.log("Partner left");
      cleanupCall();
      onPartnerLeft?.();
    });

    socketRef.current.on("friend-request-received", ({ fromUserId }) => {
      onFriendRequest?.(fromUserId);
    });

    socketRef.current.on("friendship-confirmed", async ({ user1Id, user2Id }) => {
      // Save friendship to Supabase
      if (user1Id && user2Id) {
        try {
          await supabase.rpc('create_friendship', {
            user_a: user1Id,
            user_b: user2Id
          });
          console.log("Friendship saved to database");
        } catch (err) {
          console.error("Failed to save friendship:", err);
        }
      }
      onFriendshipConfirmed?.(user1Id, user2Id);
    });

    socketRef.current.on("reaction", ({ emoji }) => {
      onReaction?.(emoji);
    });

    const connectionTimeout = setTimeout(() => {
      if (!socketRef.current?.connected) {
        setError("Call server connection timed out. Check deployment URL and try again.");
      }
    }, 12000);

    return () => {
      clearTimeout(connectionTimeout);
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
      setError(null);
      await startLocalStream();
      socketRef.current?.emit("join-queue", { vibe, userId });
    } catch (err) {
      console.error("Failed to join queue:", err);
    }
  }, [vibe, userId, startLocalStream]);

  const joinRoomCall = useCallback(async () => {
    if (!roomCode) return;

    try {
      setError(null);
      await startLocalStream();
      socketRef.current?.emit("join-room-call", { roomCode, userId });
    } catch (err) {
      console.error("Failed to join call room:", err);
    }
  }, [roomCode, userId, startLocalStream]);

  // Cleanup call
  const cleanupCall = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    roomIdRef.current = null;
    setRemoteStream(null);
    setPartnerUserId(null);
    setIsInCall(false);
  }, []);

  // Skip current call
  const skip = useCallback(() => {
    if (roomIdRef.current) {
      if (roomCode) {
        socketRef.current?.emit("leave-call", { roomId: roomIdRef.current });
      } else {
        socketRef.current?.emit("skip", { roomId: roomIdRef.current });
      }
    }
    cleanupCall();
  }, [cleanupCall, roomCode]);

  // Send friend request
  const sendFriendRequest = useCallback(() => {
    if (roomIdRef.current && userId) {
      socketRef.current?.emit("friend-request", { roomId: roomIdRef.current, userId });
    }
  }, [userId]);

  // Accept friend request
  const acceptFriendRequest = useCallback(() => {
    if (roomIdRef.current && userId) {
      socketRef.current?.emit("friend-accept", { roomId: roomIdRef.current, userId });
    }
  }, [userId]);

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

  // Stop all streams
  const stopStreams = useCallback(() => {
    if (roomIdRef.current) {
      socketRef.current?.emit("leave-call", { roomId: roomIdRef.current });
    }
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
    waitingMessage,
    partnerUserId,
    joinQueue,
    joinRoomCall,
    skip,
    sendFriendRequest,
    acceptFriendRequest,
    sendReaction,
    toggleMute,
    toggleVideo,
    stopStreams,
  };
}
