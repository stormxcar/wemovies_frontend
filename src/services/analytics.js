/**
 * Analytics Service
 * Handles user tracking and analytics with cookie consent compliance
 */

import { hasConsentForCookie, trackIfConsented } from "../utils/cookieUtils";

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  initialize() {
    // Only initialize analytics if user has consented
    if (hasConsentForCookie("analytics")) {
      this.setupAnalytics();
    } else {
      console.log("📊 Analytics not initialized - no user consent");
    }
  }

  setupAnalytics() {
    try {
      // Example: Google Analytics setup (replace with your analytics)
      if (window.gtag) {
        window.gtag("config", "YOUR_GA_ID", {
          anonymize_ip: true,
          cookie_flags: "max-age=7200;secure;samesite=strict",
        });
        this.isInitialized = true;
        console.log("📊 Analytics initialized with user consent");
      }
    } catch (error) {
      console.error("Analytics setup error:", error);
    }
  }

  // Track page views
  trackPageView(path, title) {
    trackIfConsented(() => {
      if (window.gtag && this.isInitialized) {
        window.gtag("event", "page_view", {
          page_title: title,
          page_location: window.location.href,
          page_path: path,
        });
        console.log("📊 Page view tracked:", path);
      }
    });
  }

  // Track movie views
  trackMovieView(movieId, movieTitle) {
    trackIfConsented(() => {
      if (window.gtag && this.isInitialized) {
        window.gtag("event", "movie_view", {
          custom_parameter_movie_id: movieId,
          custom_parameter_movie_title: movieTitle,
          event_category: "movie",
          event_label: movieTitle,
        });
        console.log("📊 Movie view tracked:", movieTitle);
      }
    });
  }

  // Track search queries
  trackSearch(query, resultsCount) {
    trackIfConsented(() => {
      if (window.gtag && this.isInitialized) {
        window.gtag("event", "search", {
          search_term: query,
          custom_parameter_results_count: resultsCount,
          event_category: "search",
        });
        console.log("📊 Search tracked:", query);
      }
    });
  }

  // Track user interactions
  trackUserAction(action, category = "user", label = "") {
    trackIfConsented(() => {
      if (window.gtag && this.isInitialized) {
        window.gtag("event", action, {
          event_category: category,
          event_label: label,
        });
        console.log("📊 User action tracked:", action);
      }
    });
  }

  // Track errors
  trackError(error, context = "general") {
    trackIfConsented(() => {
      if (window.gtag && this.isInitialized) {
        window.gtag("event", "exception", {
          description: error.message || error,
          fatal: false,
          custom_parameter_context: context,
        });
        console.log("📊 Error tracked:", error);
      }
    });
  }

  // Re-initialize analytics when user gives consent
  onConsentGiven() {
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  // Clean up analytics when consent is withdrawn
  onConsentWithdrawn() {
    // Clear analytics cookies and stop tracking
    this.isInitialized = false;

    // Clear GA cookies if they exist
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.startsWith("_ga") || name.startsWith("_gid")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }
    });

    console.log("📊 Analytics consent withdrawn - tracking stopped");
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;

// Export utility functions for easy use in components
export const trackPageView = (path, title) =>
  analyticsService.trackPageView(path, title);
export const trackMovieView = (movieId, title) =>
  analyticsService.trackMovieView(movieId, title);
export const trackSearch = (query, count) =>
  analyticsService.trackSearch(query, count);
export const trackUserAction = (action, category, label) =>
  analyticsService.trackUserAction(action, category, label);
export const trackError = (error, context) =>
  analyticsService.trackError(error, context);
