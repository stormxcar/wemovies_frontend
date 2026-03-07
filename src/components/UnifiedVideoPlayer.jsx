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
  // Debug logging for startTime
  const [playerMode, setPlayerMode] = useState("determining");
  const [error, setError] = useState(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(autoPlay);
  const reactPlayerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    setShouldAutoPlay(autoPlay);
  }, [autoPlay]);

  const buildIframeSrc = (url) => {
    if (!url) return "";
    try {
      const parsedUrl = new URL(url, window.location.origin);

      if (shouldAutoPlay) {
        parsedUrl.searchParams.set("autoplay", "1");
        parsedUrl.searchParams.set("autostart", "1");
        parsedUrl.searchParams.set("mute", "1");
        parsedUrl.searchParams.set("muted", "1");
        parsedUrl.searchParams.set("playsinline", "1");
      }

      if (startTime > 0) {
        parsedUrl.searchParams.set("t", String(Math.floor(startTime)));
      }

      return parsedUrl.toString();
    } catch {
      return url;
    }
  };

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
    if (onTimeUpdate && state.playedSeconds > 0) {
      // Get duration from player internal state or fallback to loadedSeconds
      const duration =
        reactPlayerRef.current?.getDuration() ||
        state.duration ||
        state.loadedSeconds ||
        0;

      if (duration > 0) {
        onTimeUpdate({
          currentTime: state.playedSeconds,
          duration: duration,
        });
      }
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
            duration: 0,
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
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
          playing={shouldAutoPlay}
          muted={shouldAutoPlay}
          onProgress={handleReactPlayerTimeUpdate}
          onPlay={handleReactPlayerPlay}
          onPause={handleReactPlayerPause}
          onEnded={handleReactPlayerEnded}
          onReady={() => {
            // Seek to start time when player is ready
            if (startTime > 0 && reactPlayerRef.current) {
              reactPlayerRef.current.seekTo(startTime, "seconds");
            }
            // Try to enable autoplay after ready
            if (autoPlay && reactPlayerRef.current) {
              setShouldAutoPlay(true);
            }
          }}
          progressInterval={5000} // Update progress every 5 seconds instead of default 1 second
          config={{
            youtube: {
              playerVars: { showinfo: 1 },
            },
            file: {
              attributes: {
                crossOrigin: "anonymous",
              },
            },
          }}
          onError={(error) => {
            setError("ReactPlayer failed to load video");
          }}
        />
      </div>
    );
  }

  // Iframe mode for streaming sites
  if (playerMode === "iframe") {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden relative">
        <iframe
          ref={iframeRef}
          src={buildIframeSrc(src)}
          className="w-full h-[600px] border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video Player"
          onLoad={handleIframeLoad}
        />
      </div>
    );
  }

  return null;
};

export default UnifiedVideoPlayer;
