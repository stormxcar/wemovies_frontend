class LocalWatchingService {
  static cacheSession(sessionId, data) {
    try {
      const sessions = this.getCachedSessions();
      sessions[sessionId] = { ...data, timestamp: Date.now() };
      localStorage.setItem("watchingSessions", JSON.stringify(sessions));
      return true;
    } catch (error) {
      return false;
    }
  }

  static getCachedSession(sessionId) {
    try {
      const sessions = this.getCachedSessions();
      return sessions[sessionId] || null;
    } catch (error) {
      return null;
    }
  }

  static getCachedSessions() {
    try {
      return JSON.parse(localStorage.getItem("watchingSessions") || "{}");
    } catch (error) {
      return {};
    }
  }

  static startWatchingSession(userId, movieId, movieData) {
    const sessionId = `${userId}_${movieId}`;
    const session = {
      userId,
      movieId,
      movieTitle: movieData.title || movieData.name,
      startTime: Date.now(),
      lastProgress: 0,
      totalDuration: movieData.totalDuration || 7200,
      isActive: true,
    };

    this.cacheSession(sessionId, session);
    return { success: true, source: "local", sessionId, ...session };
  }

  static updateProgress(userId, movieId, currentTime, duration) {
    const sessionId = `${userId}_${movieId}`;
    const session = this.getCachedSession(sessionId);

    if (session) {
      session.lastProgress = currentTime;
      session.totalDuration = duration;
      session.lastUpdate = Date.now();
      this.cacheSession(sessionId, session);
    }

    return { success: true, source: "local" };
  }

  static stopSession(userId, movieId) {
    const sessionId = `${userId}_${movieId}`;
    const sessions = this.getCachedSessions();

    if (sessions[sessionId]) {
      sessions[sessionId].isActive = false;
      sessions[sessionId].endTime = Date.now();
      localStorage.setItem("watchingSessions", JSON.stringify(sessions));
    }

    return { success: true, source: "local" };
  }

  static clearOldSessions() {
    try {
      const sessions = this.getCachedSessions();
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

      Object.keys(sessions).forEach((sessionId) => {
        if (sessions[sessionId].timestamp < cutoff) {
          delete sessions[sessionId];
        }
      });

      localStorage.setItem("watchingSessions", JSON.stringify(sessions));
    } catch (error) {
    }
  }
}

export default LocalWatchingService;
