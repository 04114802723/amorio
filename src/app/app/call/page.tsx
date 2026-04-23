"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SkipForward, UserPlus, Mic, MicOff, Video, VideoOff,
  Sparkles, X, Heart, ThumbsUp, Flame, PartyPopper, Loader2, CheckCircle, Users, MessageCircle, User, RefreshCw
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuth } from "@/hooks/useAuth";
import { FriendsPanel } from "@/components/FriendsPanel";

const icebreakers = [
  "What's your most unpopular opinion?",
  "If you could have dinner with anyone, who would it be?",
  "What's the weirdest thing you've ever eaten?",
  "What's your go-to karaoke song?",
  "If you won the lottery, what's the first thing you'd buy?",
  "What's your most embarrassing moment?",
  "What superpower would you choose?",
  "What's on your bucket list?",
  "What's the best advice you've ever received?",
  "If you could live anywhere, where would it be?",
];

const dares = [
  "Do your best dramatic movie intro in 10 seconds.",
  "Show one object near you and explain why it matters.",
  "Speak in a robot voice for your next answer.",
  "Tell a tiny story using only three sentences.",
  "Give your best 5-second dance move.",
  "Say one honest compliment about your call partner.",
  "Act like a game show host for one question.",
  "Share a harmless fun fact nobody expects.",
  "Do a one-word mood check, then explain it.",
  "Pretend you are narrating a documentary for 15 seconds.",
];

const reactionEmojis = [
  { emoji: "❤️", icon: Heart, color: "text-red-500" },
  { emoji: "👍", icon: ThumbsUp, color: "text-blue-500" },
  { emoji: "🔥", icon: Flame, color: "text-orange-500" },
  { emoji: "🎉", icon: PartyPopper, color: "text-yellow-500" },
];

function CallPageContent() {
  const searchParams = useSearchParams();
  const vibe = searchParams.get("vibe") || "chill";
  const roomCode = searchParams.get("room");
  const isRoomCall = Boolean(roomCode);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [currentIcebreaker, setCurrentIcebreaker] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [showDare, setShowDare] = useState(false);
  const [currentDare, setCurrentDare] = useState("");
  const [isDareSpinning, setIsDareSpinning] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendRequestReceived, setFriendRequestReceived] = useState(false);
  const [friendshipConfirmed, setFriendshipConfirmed] = useState(false);
  const [flyingReactions, setFlyingReactions] = useState<{id: number; emoji: string; x: number}[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const [crossVibeNotice, setCrossVibeNotice] = useState<string | null>(null);
  const reactionIdRef = useRef(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const search = searchParams.toString();
      const redirect = search ? `/app/call?${search}` : "/app/call";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, authLoading, router, searchParams]);

  const {
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
  } = useWebRTC({
    vibe,
    roomCode,
    userId: user?.id,
    onMatched: (partnerId, crossVibe) => {
      setShowIcebreaker(true);
      spinIcebreaker();
      if (crossVibe) {
        setCrossVibeNotice("Matched with someone from a different vibe!");
        setTimeout(() => setCrossVibeNotice(null), 5000);
      }
    },
    onPartnerLeft: () => {
      setFriendRequestSent(false);
      setFriendRequestReceived(false);
      setFriendshipConfirmed(false);
    },
    onFriendRequest: (fromUserId) => {
      setFriendRequestReceived(true);
    },
    onFriendshipConfirmed: (user1Id, user2Id) => {
      setFriendshipConfirmed(true);
    },
    onReaction: (emoji) => {
      addFlyingReaction(emoji);
    },
    onCrossVibeMatch: (originalVibe, matchedVibe) => {
      setCrossVibeNotice(`Switched from ${originalVibe} to ${matchedVibe} vibe!`);
      setTimeout(() => setCrossVibeNotice(null), 5000);
    },
  });

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element and ensure audio plays
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // Ensure audio is not muted on remote video
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      // Try to play (may need user interaction)
      remoteVideoRef.current.play().then(() => {
        setAudioBlocked(false);
      }).catch(err => {
        console.log("Autoplay blocked, waiting for user interaction:", err);
        setAudioBlocked(true);
      });
    }
  }, [remoteStream]);

  // Start matching when component mounts (only if user is authenticated)
  useEffect(() => {
    if (user) {
      if (isRoomCall) {
        joinRoomCall();
      } else {
        joinQueue();
      }
    }
    return () => {
      stopStreams();
    };
  }, [user, isRoomCall, joinRoomCall, joinQueue, stopStreams]);

  const enableAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play();
      setAudioBlocked(false);
    }
  };

  const spinIcebreaker = () => {
    setIsSpinning(true);
    let spins = 0;
    const maxSpins = 15;
    const interval = setInterval(() => {
      setCurrentIcebreaker(icebreakers[Math.floor(Math.random() * icebreakers.length)]);
      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const spinDare = () => {
    setIsDareSpinning(true);
    let spins = 0;
    const maxSpins = 12;
    const interval = setInterval(() => {
      setCurrentDare(dares[Math.floor(Math.random() * dares.length)]);
      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        setIsDareSpinning(false);
      }
    }, 100);
  };

  const addFlyingReaction = (emoji: string) => {
    const id = reactionIdRef.current++;
    const x = Math.random() * 80 + 10;
    setFlyingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFlyingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const handleSendReaction = (emoji: string) => {
    sendReaction(emoji);
    addFlyingReaction(emoji);
  };

  const handleSkip = () => {
    skip();
    setFriendRequestSent(false);
    setFriendRequestReceived(false);
    setShowIcebreaker(false);
    if (!isRoomCall) {
      joinQueue();
    }
  };

  const handleAddFriend = () => {
    sendFriendRequest();
    setFriendRequestSent(true);
  };

  const handleAcceptFriend = () => {
    acceptFriendRequest();
  };

  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleEndCall = () => {
    stopStreams();
    window.location.href = "/app";
  };

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingFallback />;
  }

  // Don't render if not logged in (will redirect)
  if (!user) {
    return <LoadingFallback />;
  }

  // Waiting screen
  if (!isInCall) {
    return (
      <main className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="fixed inset-0 bg-hero-gradient" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          {error ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <X className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
              <p className="text-dark-400 mb-6">{error}</p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-32 h-32 mx-auto mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 border-r-secondary-500"
                />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isConnected ? (isRoomCall ? "Joining Friend Call..." : "Finding Your Match...") : "Connecting..."}
              </h2>
              <p className="text-dark-400">
                {isRoomCall ? (
                  waitingMessage
                ) : (
                  <>
                    Looking for someone in <span className="text-primary-400 capitalize">{vibe}</span> mode
                  </>
                )}
              </p>
              <Button variant="secondary" onClick={handleEndCall} className="mt-8">
                Cancel
              </Button>
            </>
          )}
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark-950 flex flex-col">
      {/* Flying Reactions */}
      <AnimatePresence>
        {flyingReactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{ y: "100vh", x: `${reaction.x}%`, opacity: 1, scale: 1 }}
            animate={{ y: "-100vh", opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed text-5xl z-50 pointer-events-none"
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Friendship Confirmed Toast */}
      <AnimatePresence>
        {friendshipConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-strong rounded-full px-6 py-3 flex items-center gap-3 glow-primary">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-white font-semibold">🎉 You're now friends!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cross-Vibe Notice */}
      <AnimatePresence>
        {crossVibeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-strong rounded-full px-6 py-3 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white">{crossVibeNotice}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends Panel */}
      {user && (
        <FriendsPanel
          isOpen={showFriendsPanel}
          onClose={() => setShowFriendsPanel(false)}
          userId={user.id}
        />
      )}

      {/* Friends Button - Fixed position */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowFriendsPanel(true)}
        className="fixed top-4 left-4 z-40 px-4 py-2 rounded-full glass flex items-center gap-2 text-white hover:bg-white/10"
      >
        <Users className="w-5 h-5" />
        <span className="hidden sm:inline">Friends</span>
      </motion.button>

      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <Link
          href="/app/chat"
          className="px-4 py-2 rounded-full glass flex items-center gap-2 text-white hover:bg-white/10"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Link>
        <Link
          href="/app/profile"
          className="px-4 py-2 rounded-full glass flex items-center gap-2 text-white hover:bg-white/10"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        {/* Remote Video */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-dark-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            controls={false}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👤</span>
                </div>
                <p className="text-dark-400">Connecting...</p>
              </div>
            </div>
          )}
          
          {/* Audio Blocked Overlay */}
          {audioBlocked && remoteStream && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={enableAudio}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold flex items-center gap-3"
              >
                <span className="text-2xl">🔊</span>
                Click to Enable Audio
              </motion.button>
            </motion.div>
          )}
          
          {/* Friend Request UI */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {friendRequestReceived && !friendshipConfirmed && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-strong rounded-xl p-4"
              >
                <p className="text-white text-sm mb-2">They want to be friends!</p>
                <Button variant="primary" size="sm" onClick={handleAcceptFriend}>
                  <Heart className="w-4 h-4 mr-1" /> Accept
                </Button>
              </motion.div>
            )}
            
            {!friendshipConfirmed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddFriend}
                disabled={friendRequestSent}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                  friendRequestSent
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {friendRequestSent ? "Request Sent!" : "Add Friend"}
              </motion.button>
            )}
          </div>
        </div>

        {/* Local Video */}
        <div className="w-full md:w-80 h-48 md:h-auto relative rounded-2xl overflow-hidden bg-dark-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-dark-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-dark-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full glass text-xs text-dark-300">
            You
          </div>
        </div>
      </div>

      {/* Icebreaker */}
      <AnimatePresence>
        {showIcebreaker && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mx-4 mb-4"
          >
            <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-400" />
                  <span className="text-white font-semibold">Icebreaker</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={spinIcebreaker} disabled={isSpinning}>
                    🎲 Spin Again
                  </Button>
                  <button onClick={() => setShowIcebreaker(false)} className="text-dark-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <motion.p
                key={currentIcebreaker}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xl text-center ${isSpinning ? "text-dark-400" : "text-white"}`}
              >
                {currentIcebreaker}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dare Mode */} 
      <AnimatePresence>
        {showDare && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mx-4 mb-4"
          >
            <div className="glass rounded-2xl p-6 max-w-2xl mx-auto border border-primary-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-semibold">Anonymous Dare Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={spinDare} disabled={isDareSpinning}>
                    <RefreshCw className="w-4 h-4 mr-1" /> New Dare
                  </Button>
                  <button onClick={() => setShowDare(false)} className="text-dark-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <motion.p
                key={currentDare}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xl text-center ${isDareSpinning ? "text-dark-400" : "text-white"}`}
              >
                {currentDare || "Tap New Dare to start challenge mode."}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="p-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Skip */}
          {isRoomCall ? (
            <div />
          ) : (
            <Button variant="secondary" onClick={handleSkip}>
              <SkipForward className="w-5 h-5 mr-2" />Skip
            </Button>
          )}

          {/* Media Controls */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? "bg-red-500 text-white" : "glass text-white"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isVideoOff ? "bg-red-500 text-white" : "glass text-white"
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowIcebreaker(true)}
              className="w-12 h-12 rounded-full glass flex items-center justify-center text-white"
            >
              <Sparkles className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowDare(true);
                if (!currentDare) spinDare();
              }}
              className="w-12 h-12 rounded-full glass flex items-center justify-center text-white"
              title="Anonymous Dare Mode"
            >
              <Flame className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEndCall}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-2">
            {reactionEmojis.map((reaction) => (
              <motion.button
                key={reaction.emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleSendReaction(reaction.emoji)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl hover:bg-white/10"
              >
                {reaction.emoji}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="fixed inset-0 bg-hero-gradient" />
      <div className="relative z-10 text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 border-r-secondary-500"
          />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
      </div>
    </main>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallPageContent />
    </Suspense>
  );
}
