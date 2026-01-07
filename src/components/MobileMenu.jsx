import React, { useState } from "react";
import { ChevronDown, Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";

const MobileMenu = ({ categories, types, countries, navigateToMovies }) => {
  const [typeSearch, setTypeSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [activeSection, setActiveSection] = useState(null);

  const filteredTypes = types.filter((type) =>
    type.name.toLowerCase().includes(typeSearch.toLowerCase())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] bg-gray-900 text-white border-gray-700"
      >
        <SheetHeader>
          <SheetTitle className="text-white text-left">Menu</SheetTitle>
          <SheetDescription className="text-gray-400 text-left">
            Điều hướng trang web và khám phá phim
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {/* Thể loại Section */}
          <div className="space-y-2">
            <button
              onClick={() =>
                setActiveSection((prev) => (prev === "types" ? null : "types"))
              }
              className="flex items-center justify-between w-full py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium">Thể loại ({types.length})</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  activeSection === "types" ? "rotate-180" : ""
                }`}
              />
            </button>
            {activeSection === "types" && (
              <div className="ml-4 space-y-2">
                {/* Search box for types */}
                {types.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm thể loại..."
                      value={typeSearch}
                      onChange={(e) => setTypeSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                )}
                {/* Types grid */}
                <div className="max-h-48 overflow-y-auto">
                  <div
                    className={`grid gap-1 ${
                      filteredTypes.length > 8 ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {filteredTypes.length > 0 ? (
                      filteredTypes.map((item) => (
                        <button
                          key={item.name}
                          className="text-left py-2 px-2 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
                          onClick={() => {
                            navigateToMovies(
                              `/api/movies/types/id/${item.id}`,
                              item.name
                            );
                            setActiveSection(null);
                          }}
                        >
                          {item.name}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-gray-400 text-sm">
                        Không tìm thấy thể loại
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Section */}
          <div className="space-y-2">
            <div className="font-medium py-2 px-3">Danh mục</div>
            <div className="ml-4 space-y-1">
              <div className="grid grid-cols-2 gap-1">
                {categories.map((item) => (
                  <button
                    key={item.name}
                    className="text-left py-2 px-2 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
                    onClick={() => {
                      navigateToMovies(
                        `/api/movies/category/id/${item.id}`,
                        item.name
                      );
                      setActiveSection(null);
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quốc gia Section */}
          <div className="space-y-2">
            <button
              onClick={() =>
                setActiveSection((prev) =>
                  prev === "countries" ? null : "countries"
                )
              }
              className="flex items-center justify-between w-full py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium">Quốc gia ({countries.length})</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  activeSection === "countries" ? "rotate-180" : ""
                }`}
              />
            </button>
            {activeSection === "countries" && (
              <div className="ml-4 space-y-2">
                {/* Search box for countries */}
                {countries.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm quốc gia..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                )}
                {/* Countries grid with better layout */}
                <div className="max-h-48 overflow-y-auto">
                  <div
                    className={`grid gap-1 ${
                      filteredCountries.length > 8
                        ? "grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((item) => (
                        <button
                          key={item.name}
                          className="text-left py-2 px-2 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
                          onClick={() => {
                            navigateToMovies(
                              `/api/movies/country/${item.id}`,
                              item.name
                            );
                            setActiveSection(null);
                          }}
                        >
                          {item.name}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-gray-400 text-sm">
                        Không tìm thấy quốc gia
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
