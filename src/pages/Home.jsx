import React, { useState, useEffect } from "react";
import Banner from "../components/Banner";
import ShowMovies from "../components/ShowMovies";
import PageLoader from "../components/loading/PageLoader";
import { useGlobalLoading } from "../context/UnifiedLoadingContext";

const Home = () => {
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [moviesLoaded, setMoviesLoaded] = useState(false);
  const [allContentReady, setAllContentReady] = useState(false);
  const { updateProgress } = useGlobalLoading();

  console.log("🏠 Home component mounted");

  // Check if both components are ready
  useEffect(() => {
    console.log("🏠 Home state check:", { bannerLoaded, moviesLoaded });
    if (bannerLoaded && moviesLoaded) {
      updateProgress(95, "Hoàn thiện giao diện...");
      console.log("✅ All content ready, finalizing...");

      // Small delay to ensure smooth transition
      setTimeout(() => {
        updateProgress(100, "Hoàn thành!");
        setTimeout(() => {
          console.log("🚀 Home page fully loaded!");
          setAllContentReady(true);
        }, 200);
      }, 300);
    }
  }, [bannerLoaded, moviesLoaded, updateProgress]);

  const handleBannerLoaded = (success) => {
    console.log("🎬 Banner loaded:", success);
    setBannerLoaded(true);
  };

  const handleMoviesLoaded = (success) => {
    console.log("🎭 Movies loaded:", success);
    setMoviesLoaded(true);
  };

  // Show loading until both components are ready
  if (!allContentReady) {
    console.log("🏠 Home showing PageLoader");
    return (
      <>
        <PageLoader
          isVisible={true}
          message="Đang chuẩn bị trang chủ"
          progress={
            bannerLoaded && moviesLoaded
              ? 95
              : bannerLoaded || moviesLoaded
                ? 50
                : 10
          }
          showProgress={true}
        />
        {/* Render components in background to start loading */}
        <div style={{ display: "none" }}>
          <Banner onDataLoaded={handleBannerLoaded} />
          <ShowMovies onDataLoaded={handleMoviesLoaded} />
        </div>
      </>
    );
  }

  console.log("🏠 Home rendering main content");

  return (
    <div
      className="opacity-0"
      style={{
        animation: "fadeInHome 1s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes fadeInHome {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>

      {/* Banner Section */}
      <Banner onDataLoaded={handleBannerLoaded} />

      {/* Movies Section */}
      <ShowMovies onDataLoaded={handleMoviesLoaded} />
    </div>
  );
};

export default Home;
