import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactPlayer from "react-player";
import "./VideoPlayer.css";

const VideoPlayer = ({
  src,
  onTimeUpdate,
  onLoadedMetadata,
  onReady,
  onPlay,
  onPause,
  onEnded,
  startTime = 0,
  poster,
  className = "",
  options = {},
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const progressUpdateRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackSources, setFallbackSources] = useState([]);

  // Fallback video sources for when original URL doesn't work
  const createFallbackSources = useCallback((originalSrc) => {
    return [
      originalSrc,
      // YouTube video samples
      "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      // Vimeo samples
      "https://vimeo.com/90509568",
      // Direct MP4 samples that usually work
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    ];
  }, []);

  // Initialize fallback sources
  useEffect(() => {
    if (src) {
      setFallbackSources(createFallbackSources(src));
      setHasError(false);
      setIsLoading(true);
    }
  }, [src, createFallbackSources]);

  // Handle player ready
  const handleReady = useCallback(() => {
    setIsLoading(false);
    setHasError(false);

    if (startTime > 0 && playerRef.current) {
      playerRef.current.seekTo(startTime, "seconds");
    }

    if (onReady) {
      onReady(playerRef.current);
    }
  }, [startTime, onReady]);

  // Handle duration change
  const handleDuration = useCallback(
    (duration) => {
      setDuration(duration);

      if (onLoadedMetadata) {
        onLoadedMetadata({ duration });
      }
    },
    [onLoadedMetadata],
  );

  // Handle progress update
  const handleProgress = useCallback(
    (state) => {
      setCurrentTime(state.playedSeconds);

      if (onTimeUpdate && !progressUpdateRef.current) {
        // Throttle progress updates
        progressUpdateRef.current = setTimeout(() => {
          onTimeUpdate(state.playedSeconds);
          progressUpdateRef.current = null;
        }, 250);
      }
    },
    [onTimeUpdate],
  );

  // Handle play/pause
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (onPlay) onPlay();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (onPause) onPause();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  }, [onEnded]);

  // Handle errors with fallback
  const handleError = useCallback((error) => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  // Custom controls
  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e) => {
      if (!playerRef.current || duration === 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;

      playerRef.current.seekTo(newTime, "seconds");
      setCurrentTime(newTime);
    },
    [duration],
  );

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Mouse movement for controls
  useEffect(() => {
    let timeout;
    const container = containerRef.current;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", () => setShowControls(true));
      container.addEventListener(
        "mouseleave",
        () => isPlaying && setShowControls(false),
      );
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseMove);
      }
    };
  }, [isPlaying]);

  // Format time helper
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={`professional-video-player ${className} ${isFullscreen ? "fullscreen" : ""}`}
    >
      {/* React Player */}
      <ReactPlayer
        ref={playerRef}
        url={fallbackSources[0]} // Use first source (original)
        width="100%"
        height="100%"
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        muted={isMuted}
        controls={false} // We use custom controls
        light={poster ? poster : false}
        onReady={handleReady}
        onDuration={handleDuration}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        config={{
          youtube: {
            playerVars: {
              showinfo: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
            },
          },
          vimeo: {
            playerOptions: {
              title: false,
              byline: false,
              portrait: false,
            },
          },
          file: {
            attributes: {
              crossOrigin: "anonymous",
              preload: "metadata",
            },
          },
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Đang tải video...</p>
        </div>
      )}

      {/* Error Overlay with Fallbacks */}
      {hasError && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Không thể tải video</h3>
            <p>Thử các nguồn video khác:</p>

            <div className="fallback-sources">
              {fallbackSources.slice(1).map((source, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFallbackSources((prev) => {
                      const newSources = [...prev];
                      [newSources[0], newSources[index + 1]] = [
                        newSources[index + 1],
                        newSources[0],
                      ];
                      return newSources;
                    });
                    setHasError(false);
                    setIsLoading(true);
                  }}
                  className="fallback-btn"
                >
                  {source.includes("youtube")
                    ? "📺 YouTube"
                    : source.includes("vimeo")
                      ? "🎬 Vimeo"
                      : "🎥 Direct Video"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className={`custom-controls ${showControls ? "visible" : ""}`}>
        {/* Progress Bar */}
        <div className="progress-container" onClick={handleSeek}>
          <div
            className="progress-bar"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
            }}
          ></div>
          <div className="progress-handle"></div>
        </div>

        {/* Control Buttons */}
        <div className="controls-row">
          <div className="left-controls">
            <button onClick={togglePlay} className="control-btn play-btn">
              {isPlaying ? "⏸️" : "▶️"}
            </button>

            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="center-controls">
            <div className="volume-control">
              <button onClick={toggleMute} className="control-btn">
                {isMuted ? "🔇" : volume > 0.5 ? "🔊" : "🔉"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>

          <div className="right-controls">
            <button onClick={toggleFullscreen} className="control-btn">
              {isFullscreen ? "🗗" : "⛶"}
            </button>
          </div>
        </div>
      </div>

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="play-overlay" onClick={togglePlay}>
          <div className="play-button">▶️</div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
