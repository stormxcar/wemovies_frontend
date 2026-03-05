import React from "react";
import { GooeyToaster } from "goey-toast";
import { toast } from "./appToast";

export { toast };

const mapPosition = (position = "bottom-right") => {
  if (
    position === "top-center" ||
    position === "top-left" ||
    position === "bottom-left" ||
    position === "bottom-center" ||
    position === "bottom-right"
  ) {
    return position;
  }
  return "bottom-right";
};

export const ToastContainer = ({
  position = "bottom-right",
  autoClose = 3500,
  theme = "dark",
  limit,
  newestOnTop,
  hideProgressBar,
  closeButton,
  toastStyle,
  toastClassName,
  richColors,
  visibleToasts,
  ...rest
}) => (
  <GooeyToaster
    position={mapPosition(position)}
    duration={typeof autoClose === "number" ? autoClose : 3500}
    theme={theme === "dark" ? "dark" : "light"}
    maxQueue={typeof limit === "number" ? limit : 6}
    queueOverflow={newestOnTop ? "drop-oldest" : "drop-newest"}
    closeButton={closeButton ?? true}
    richColors={richColors ?? true}
    visibleToasts={typeof visibleToasts === "number" ? visibleToasts : 4}
    preset="smooth"
    showProgress={!hideProgressBar}
    closeOnEscape
    swipeToDismiss
    toastOptions={{
      className: ["app-toast-lg", toastClassName].filter(Boolean).join(" "),
      style: toastStyle,
    }}
    {...rest}
  />
);

export const Toaster = ({ position = "bottom-right", ...rest }) => (
  <GooeyToaster
    position={mapPosition(position)}
    theme="dark"
    preset="smooth"
    showProgress
    closeOnEscape
    swipeToDismiss
    maxQueue={6}
    toastOptions={{
      className: "app-toast-lg",
    }}
    {...rest}
  />
);

export default { toast, ToastContainer, Toaster };
