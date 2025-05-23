import React from "react";
import { fetchCategories } from "../services/api";
import {useState , useEffect} from 'react';
import { Link } from 'react-router-dom';
import {FaHamburger, FaWindowClose} from 'react-icons/fa';

function Navbar() {
    const [categories, setCategories] = useState([]);

    const [navIcon, setNavIcon] = useState(false);

    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        }
        getCategories();
    },[]);

    return (
        <>
            <div className="w-full items-start">
                <button className="md:hidden p-4 flex items-start"
                onClick={() => setNavIcon(!navIcon)}
                >
                    <FaHamburger size={26}/>
                </button>
            </div>
            <div className={`fixed top-0 left-0 w-full h-full flex items-start bg-black/80 z-20 transition-transform transform ${navIcon ? "translate-x-0" : "-translate-x-full"} md-hidden`} onClick={() => setNavIcon(false)}>

                <div
                    className="bg-white w-3/4 h-full p-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full flex items-end justify-end flex-row">
                        <button
                            className="text-black mb-4"
                            onClick={() => setNavIcon(false)}
                        >
                            <FaWindowClose/>
                        </button>
                    </div>

                    <ul>
                        {categories.map((item, index) => (
                            <li key={index} className="cursor-pointer hover:text-blue-400 transition"
                                onClick={() => setNavIcon(false)}
                            >
                                <Link to={`/category/${item.name}`}>
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>


            <nav className="hidden md:flex bg-gray-700 text-white p-2 w-full justify-center items-center">
                <ul className="flex justify-center gap-8">
                    {categories.map((item, index) => (
                        <li key={index} className="cursor-pointer hover:text-blue-400 transition">
                            <Link to={`/category/${item.name}`}>
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}

export default Navbar;
