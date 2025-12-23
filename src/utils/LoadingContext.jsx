// import React, { createContext, useContext, useState } from "react";

// const LoadingContext = createContext();

// export const LoadingProvider = ({ children }) => {
//   const [loadingStates, setLoadingStates] = useState({});

//   const setLoading = (key, isLoading) => {
//     setLoadingStates((prev) => {
//       const newState = { ...prev, [key]: isLoading };
//       console.log(`Setting loading for ${key} to ${isLoading}`, newState); // Debug
//       return newState;
//     });
//   };

//   return (
//     <LoadingContext.Provider value={{ loadingStates, setLoading }}>
//       {children}
//     </LoadingContext.Provider>
//   );
// };

// export const useLoading = () => useContext(LoadingContext);