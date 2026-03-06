import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const PageLoader = ({
  isVisible = true,
  message,
  messages = [],
  progress = 0,
  showProgress = false,
  variant,
}) => {
  const { t } = useTranslation();
  void variant;
  const fallbackMessages = useMemo(
    () => [
      t("loading.movie_tip_1", {
        defaultValue: "Đang khởi động rạp phim của bạn...",
      }),
      t("loading.movie_tip_2", {
        defaultValue: "Chuẩn bị danh sách phim hot hôm nay...",
      }),
      t("loading.movie_tip_3", {
        defaultValue: "Bắp rang sẵn sàng, phim sắp lên sóng...",
      }),
      t("loading.movie_tip_4", { defaultValue: "Kết nối máy chủ WeMovies..." }),
    ],
    [t],
  );

  const availableMessages = useMemo(() => {
    if (message) return [message];
    if (Array.isArray(messages) && messages.length > 0) return messages;
    return fallbackMessages;
  }, [fallbackMessages, message, messages]);

  const [messageIndex, setMessageIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    setMessageIndex(0);
  }, [availableMessages]);

  useEffect(() => {
    if (availableMessages.length <= 1 || !isVisible) return;

    const intervalId = window.setInterval(() => {
      setTextVisible(false);
      window.setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % availableMessages.length);
      }, 220);
    }, 2600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [availableMessages.length, isVisible]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setTextVisible(true));
    return () => window.cancelAnimationFrame(rafId);
  }, [messageIndex]);

  const resolvedMessage =
    availableMessages[messageIndex] || t("loading.preparing_default");

  const titleWordsBase = useMemo(
    () => [
      "Wemovies",
      "Phim Hay",
      "Xem Miễn Phí",
      "Phim Cực Chất",
      "Bom Tấn Mới",
      "Phim Hot Nhất",
      "Chill Cùng Phim",
      "Phim Hay Mỗi Ngày",
      "Đỉnh Cao Giải Trí",
      "Không Quảng Cáo",
      "Cập Nhật 24/7",
    ],
    [],
  );

  const titleWords = useMemo(
    () => ["Wemovies", ...shuffleArray(titleWordsBase.slice(1)).slice(0, 5)],
    [titleWordsBase],
  );

  const [titleIndex, setTitleIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isVisible || titleWords.length === 0) return;

    const currentWord = titleWords[titleIndex % titleWords.length] || "";
    let timeoutId;

    if (!isDeleting && typedTitle.length < currentWord.length) {
      const nextChar = currentWord[typedTitle.length] || "";
      const baseSpeed = /\s/.test(nextChar) ? 92 : 62;
      const jitter = Math.floor(Math.random() * 75);
      timeoutId = window.setTimeout(() => {
        setTypedTitle(currentWord.slice(0, typedTitle.length + 1));
      }, baseSpeed + jitter);
    } else if (!isDeleting && typedTitle.length === currentWord.length) {
      timeoutId = window.setTimeout(
        () => {
          setIsDeleting(true);
        },
        920 + Math.floor(Math.random() * 240),
      );
    } else if (isDeleting && typedTitle.length > 0) {
      timeoutId = window.setTimeout(
        () => {
          setTypedTitle(currentWord.slice(0, typedTitle.length - 1));
        },
        34 + Math.floor(Math.random() * 30),
      );
    } else {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(false);
        setTitleIndex((prev) => (prev + 1) % titleWords.length);
      }, 220);
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isDeleting, isVisible, titleIndex, titleWords, typedTitle]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://i.pinimg.com/1200x/3b/88/8a/3b888ae33caddd009ea0262a6dace304.jpg)",
        }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/65" />

      <div className="relative z-10 w-[92%] max-w-2xl text-center">
        <h1 className="mx-auto min-h-[72px] sm:min-h-[88px] text-3xl sm:text-5xl md:text-6xl font-semibold tracking-wide text-orange-200">
          {typedTitle}
          <span className="inline-block w-[10px] h-[1.05em] ml-1 align-middle bg-orange-300 animate-pulse" />
        </h1>

        <p
          className={`mt-5 text-base sm:text-xl text-white/95 transition-opacity duration-500 ${
            textVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {resolvedMessage}
        </p>

        <div className="mt-8 h-1.5 w-full rounded-full bg-white/25 overflow-hidden">
          {showProgress ? (
            <div
              className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className="h-full w-1/3 bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 animate-progress-bar" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
