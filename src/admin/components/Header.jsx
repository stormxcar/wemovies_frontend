import React, { useState, useEffect } from "react";
import axios from "axios";

// Header Component
const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const verifyResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/verifyUser`,
          { withCredentials: true }
        );
        // console.log("Verify User Response:", verifyResponse.data);
        setUser(verifyResponse.data);
        // console.log("User state updated:", verifyResponse.data);
      } catch (error) {
        console.error(
          "Error verifying user:",
          error.response?.data || error.message
        );
        console.log("Error Response Headers:", error.response?.headers);
        console.log("Request Headers:", error.response?.config.headers);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-gray-800 text-white p-4 flex justify-between items-center z-50">
      <div className="text-xl font-bold">Movie Admin</div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          {/* <button className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button> */}
        </div>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="focus:outline-none"
          >
            {user ? (
              <img
                src={user.avatar || "https://via.placeholder.com/40"}
                alt="Avatar"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            ) : (
              <span>Loading...</span>
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-2 z-10">
              <div className="px-4 py-2">
                {user && (
                  <>
                    <p className="font-bold">{user.username}</p>
                    <p className="text-sm">{user.email}</p>
                  </>
                )}
              </div>
              {/* <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                Profile
              </button> */}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
