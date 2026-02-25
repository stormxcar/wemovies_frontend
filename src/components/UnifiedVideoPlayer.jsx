import React, { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";

const UnifiedVideoPlayer = ({
  src,
  startTime = 0,
  autoPlay = false,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
}) => {
  const [playerMode, setPlayerMode] = useState("determining");
  const [error, setError] = useState(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(autoPlay);
  const reactPlayerRef = useRef(null);
  const iframeRef = useRef(null);

  console.log("🎬 UnifiedVideoPlayer autoPlay prop:", autoPlay);

  // Determine best player mode based on URL
  useEffect(() => {
    const determinePlayerMode = () => {
      if (!src) {
        setError("No video URL provided");
        return;
      }

      // If ReactPlayer can handle it directly (YouTube, Vimeo, direct files)
      if (ReactPlayer.canPlay(src)) {
        setPlayerMode("reactplayer");
        return;
      }

      // If it's a streaming site, use iframe with embedded player
      if (
        src.includes("opstream") ||
        src.includes("streamtape") ||
        src.includes("/share/")
      ) {
        setPlayerMode("iframe");
        return;
      }

      // For unknown URLs, try ReactPlayer first
      setPlayerMode("reactplayer");
    };

    determinePlayerMode();
  }, [src]);

  // Handle ReactPlayer events and forward to parent
  const handleReactPlayerTimeUpdate = (state) => {
    if (onTimeUpdate && state.playedSeconds) {
      onTimeUpdate({
        currentTime: state.playedSeconds,
        duration: state.loadedSeconds || state.duration || 0,
      });
    }
  };

  const handleReactPlayerPlay = () => {
    if (onPlay) onPlay();
  };

  const handleReactPlayerPause = () => {
    if (onPause) onPause();
  };

  const handleReactPlayerEnded = () => {
    const duration = reactPlayerRef.current?.getDuration() || 0;
    if (onEnded) onEnded({ duration });
  };

  // Handle iframe player events (limited tracking)
  const handleIframeLoad = () => {
    // Simulate play event for iframe (since we can't detect real events)
    if (onPlay) {
      setTimeout(() => {
        onPlay();
      }, 1000);
    }

    // Simulate time updates for iframe mode (basic tracking)
    const simulateTracking = () => {
      let currentTime = startTime;
      const interval = setInterval(() => {
        currentTime += 10; // Update every 10 seconds
        if (onTimeUpdate) {
          onTimeUpdate({
            currentTime,
            duration: 7200, // Default 2 hours, since we can't get real duration from iframe
          });
        }
      }, 10000);

      // Store interval reference for cleanup
      iframeRef.current.trackingInterval = interval;
    };

    simulateTracking();
  };

  // Cleanup iframe tracking on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current?.trackingInterval) {
        clearInterval(iframeRef.current.trackingInterval);
      }
    };
  }, []);

  // Error state
  if (error) {
    return (
      <div className="w-full h-96 bg-red-900 bg-opacity-50 flex items-center justify-center rounded-lg">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-bold">Player Error</h3>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (playerMode === "determining") {
    return (
      <div className="w-full h-96 bg-gray-900 flex items-center justify-center rounded-lg">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Determining best player...</p>
        </div>
      </div>
    );
  }

  // ReactPlayer mode
  if (playerMode === "reactplayer") {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden relative">
        <ReactPlayer
          ref={reactPlayerRef}
          key={`reactplayer-${src}`}
          url={src}
          width="100%"
          height="400px"
          controls={true}
          playing={autoPlay}
          muted={shouldAutoPlay} // Muted required for autoplay in most browsers          onProgress={handleReactPlayerTimeUpdate}
          onPlay={handleReactPlayerPlay}
          onPause={handleReactPlayerPause}
          onEnded={handleReactPlayerEnded}
          onReady={() => {
            console.log("🎬 Video ready, autoPlay was:", autoPlay);
            // Seek to start time when player is ready
            if (startTime > 0 && reactPlayerRef.current) {
              reactPlayerRef.current.seekTo(startTime, "seconds");
            }
            // Try to enable autoplay after ready
            if (autoPlay && reactPlayerRef.current) {
              console.log("🎬 Attempting autoplay...");
              setShouldAutoPlay(true);
            }
          }}
          onError={(error) => {
            setError("ReactPlayer failed to load video");
          }}
          config={{
            file: {
              attributes: {
                crossOrigin: "anonymous",
                autoPlay: autoPlay,
                muted: autoPlay, // Mute for autoplay support
                onTimeUpdate: (e) => {
                  if (onTimeUpdate) {
                    onTimeUpdate({
                      currentTime: e.target.currentTime,
                      duration: e.target.duration,
                    });
                  }
                },
              },
            },
          }}
        />

        <div className="absolute bottom-2 left-2 bg-green-900 bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          ⚡ ReactPlayer | ✅ Full Tracking
        </div>
      </div>
    );
  }

  // Iframe mode for streaming sites
  if (playerMode === "iframe") {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden relative">
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-96 border-0"
          allowFullScreen
          title="Video Player"
          onLoad={handleIframeLoad}
        />

        <div className="absolute bottom-2 left-2 bg-blue-900 bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          🎭 Iframe Player | ⚠️ Limited Tracking
        </div>

        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-yellow-300 px-2 py-1 rounded text-xs">
          🌐 Streaming Site Player
        </div>
      </div>
    );
  }

  return null;
};

export default UnifiedVideoPlayer;
