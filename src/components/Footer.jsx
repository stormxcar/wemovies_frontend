import React from "react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const Footer = memo(() => {
  const { themeClasses, isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <footer
      className={`${themeClasses.secondary} ${themeClasses.textPrimary} relative w-full overflow-hidden border-t ${themeClasses.borderLight} pt-20`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-orange-500/20 via-red-500/10 to-transparent" />

      <div className="container mx-auto px-6 pb-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/15 via-transparent to-black/10 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-red-900/40">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold tracking-wide">
                    Wemovies
                  </span>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("footer.slogan")}
                  </span>
                </div>
              </div>

              <p
                className={`max-w-2xl text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("footer.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["faq", "privacy", "terms", "about", "contact"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isDarkMode
                      ? "border-gray-700 text-gray-300 hover:border-orange-500 hover:text-white"
                      : "border-gray-300 text-gray-700 hover:border-orange-500 hover:text-gray-900"
                  }`}
                >
                  {t(`footer.links.${item}`)}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`mt-6 border-t pt-4 text-xs ${themeClasses.borderLight}`}
          >
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
