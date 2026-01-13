import { useEffect, useRef } from 'react';
import { fetchJson } from '../services/api';
import { toast } from 'react-hot-toast';

export const useWatchingTracker = (movieId, movieTitle, userId, isAuthenticated) => {
  const watchingSessionRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  // Start watching session
  const startWatching = async (totalDuration) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      const response = await fetchJson('/api/redis-watching/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          movieId,
          movieTitle,
          totalDuration: Math.round(totalDuration)
        })
      });
      
      if (response.status === 'SUCCESS') {
        watchingSessionRef.current = true;
        console.log('✅ Bắt đầu theo dõi tiến độ xem phim');
      }
    } catch (error) {
      console.error('❌ Lỗi khi bắt đầu theo dõi:', error);
    }
  };

  // Update watching progress
  const updateProgress = async (currentTime, totalDuration, episodeInfo = {}) => {
    if (!watchingSessionRef.current || !isAuthenticated || !userId) return;
    
    // Only update every 30 seconds to avoid spam
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 30000) return;
    lastUpdateTimeRef.current = now;
    
    try {
      const payload = {
        movieId,
        currentTime: Math.round(currentTime),
        totalDuration: Math.round(totalDuration),
        ...episodeInfo
      };

      await fetchJson(`/api/redis-watching/progress?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log(`📊 Cập nhật tiến độ: ${((currentTime / totalDuration) * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Lỗi cập nhật tiến độ:', error);
    }
  };

  // Stop watching session
  const stopWatching = async () => {
    if (!watchingSessionRef.current || !isAuthenticated || !userId) return;
    
    try {
      await fetchJson(`/api/redis-watching/stop?userId=${userId}&movieId=${movieId}`, {
        method: 'DELETE'
      });
      
      watchingSessionRef.current = false;
      console.log('⏹️ Dừng theo dõi tiến độ xem phim');
    } catch (error) {
      console.error('❌ Lỗi khi dừng theo dõi:', error);
    }
  };

  // Auto-update interval
  const startUpdateInterval = (videoElement) => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = setInterval(() => {
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        updateProgress(
          videoElement.currentTime,
          videoElement.duration
        );
      }
    }, 30000); // Update every 30 seconds
  };

  const stopUpdateInterval = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdateInterval();
      if (watchingSessionRef.current) {
        stopWatching();
      }
    };
  }, []);

  return {
    startWatching,
    updateProgress,
    stopWatching,
    startUpdateInterval,
    stopUpdateInterval,
    isWatchingActive: !!watchingSessionRef.current
  };
};