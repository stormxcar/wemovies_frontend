import { gooeyToast } from "goey-toast";

const toDuration = (options) => {
  if (!options || typeof options !== "object") return undefined;
  const value = options.autoClose ?? options.duration;
  if (value === false) return 1000000;
  if (typeof value === "number") return value;
  return undefined;
};

const normalizeOptions = (options = {}) => {
  if (!options || typeof options !== "object") return {};

  const toastId = options.toastId ?? options.id;

  return {
    ...options,
    id: toastId,
    duration: toDuration(options),
  };
};

const createToast =
  (method) =>
  (message, options = {}) =>
    method(String(message ?? ""), normalizeOptions(options));

const loading = (message, options = {}) =>
  gooeyToast(String(message ?? ""), {
    ...normalizeOptions(options),
    duration: 1000000,
  });

const update = (id, options = {}) => {
  const normalized = normalizeOptions(options);
  const nextType = normalized.type;

  if (
    nextType === "success" ||
    nextType === "error" ||
    nextType === "info" ||
    nextType === "warning"
  ) {
    gooeyToast.update(id, {
      title: normalized.render || normalized.title,
      type: nextType,
      description: normalized.description,
      icon: normalized.icon,
      action: normalized.action,
    });
    return;
  }

  gooeyToast.update(id, {
    title: normalized.render || normalized.title,
    description: normalized.description,
    icon: normalized.icon,
    action: normalized.action,
  });
};

const dismiss = (id) => {
  if (id === undefined || id === null) {
    gooeyToast.dismiss();
    return;
  }
  gooeyToast.dismiss(id);
};

const promise = (inputPromise, messages) =>
  gooeyToast.promise(inputPromise, {
    loading: messages?.loading || "Loading...",
    success: messages?.success || "Success",
    error: messages?.error || "Error",
  });

const POSITION = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  TOP_CENTER: "top-center",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_CENTER: "bottom-center",
};

export const toast = Object.assign(createToast(gooeyToast), {
  success: createToast(gooeyToast.success),
  error: createToast(gooeyToast.error),
  info: createToast(gooeyToast.info),
  warning: createToast(gooeyToast.warning),
  warn: createToast(gooeyToast.warning),
  loading,
  update,
  dismiss,
  promise,
  POSITION,
  TYPE: {
    DEFAULT: "default",
    SUCCESS: "success",
    ERROR: "error",
    INFO: "info",
    WARNING: "warning",
  },
  isActive: () => false,
});

export default toast;
