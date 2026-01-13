import { fetchJson } from '../services/api';
import { toast } from 'react-hot-toast';

export const useStartWatching = () => {
  const startWatchingMovie = async (movieId, movieTitle, userId, duration = 7200) => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để theo dõi tiến trình xem!");
      return;
    }

    try {
      const response = await fetchJson('/api/redis-watching/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          movieId,
          movieTitle,
          totalDuration: Math.round(duration)
        })
      });
      
      if (response.status === 'SUCCESS') {
        console.log('✅ Bắt đầu theo dõi tiến độ xem phim:', movieTitle);
        return true;
      }
    } catch (error) {
      console.error('❌ Lỗi khi bắt đầu theo dõi:', error);
    }
    return false;
  };

  return { startWatchingMovie };
};