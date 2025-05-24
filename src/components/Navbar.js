// import React, { useState, useEffect } from "react";
// import { fetchCategories } from "../services/api";
// import { Link } from "react-router-dom";
// import { FaHamburger, FaWindowClose } from "react-icons/fa";

// function Navbar() {
//     const [categories, setCategories] = useState([]);
//     const [navOpen, setNavOpen] = useState(false);

//     useEffect(() => {
//         fetchCategories()
//             .then(setCategories)
//             .catch((error) => console.error("Error fetching categories:", error));
//     }, []);

//     const handleNavToggle = () => setNavOpen((prev) => !prev);
//     const handleNavClose = () => setNavOpen(false);

//     const renderCategories = (onClick) =>
//         categories.map((item) => (
//             <li
//                 key={item.name}
//                 className="cursor-pointer hover:text-blue-400 transition"
//                 onClick={onClick}
//             >
//                 <Link to={`/category/${item.name}`}>{item.name}</Link>
//             </li>
//         ));

//     return (
//         <>
//             {/* Mobile Hamburger Button */}
//             <div className="w-full items-start">
//                 <button
//                     className="md:hidden p-4 flex items-start"
//                     onClick={handleNavToggle}
//                     aria-label="Open navigation"
//                 >
//                     <FaHamburger size={26} />
//                 </button>
//             </div>

//             {/* Mobile Sidebar */}
//             <div
//                 className={`fixed top-0 left-0 w-full h-full flex items-start bg-black/80 z-20 transition-transform transform ${
//                     navOpen ? "translate-x-0" : "-translate-x-full"
//                 } md:hidden`}
//                 onClick={handleNavClose}
//             >
//                 <div
//                     className="bg-white w-3/4 h-full p-4"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="w-full flex items-end justify-end">
//                         <button
//                             className="text-black mb-4"
//                             onClick={handleNavClose}
//                             aria-label="Close navigation"
//                         >
//                             <FaWindowClose />
//                         </button>
//                     </div>
//                     <ul>{renderCategories(handleNavClose)}</ul>
//                 </div>
//             </div>

//             {/* Desktop Navbar */}
//             <nav className="hidden md:flex bg-gray-700 text-white p-2 w-full justify-center items-center">
//                 <ul className="flex justify-center gap-8">
//                     {renderCategories()}
//                 </ul>
//             </nav>
//         </>
//     );
// }

// export default Navbar;
