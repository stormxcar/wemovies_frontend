// import React, { useState, useEffect } from "react";
// // Toast Component
// const Toast = ({ message, type, onClose }) => {
//   useEffect(() => {
//     const timer = setTimeout(() => onClose(), 3000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   return (
//     <div
//       className={`fixed bottom-4 right-4 p-4 rounded-md text-white ${
//         type === "success" ? "bg-green-500" : "bg-red-500"
//       }`}
//     >
//       {message}
//     </div>
//   );
// };

// export default Toast;
