// Performance utilities for optimizing DOM operations
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;

  return (...args) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime),
      );
    }
  };
};

export const debounce = (func, delay) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const requestIdleCallbackShim = (callback, options = {}) => {
  if (typeof requestIdleCallback !== "undefined") {
    return requestIdleCallback(callback, options);
  } else {
    return setTimeout(callback, options.timeout || 0);
  }
};

// Optimize DOM operations to prevent forced reflow
export const batchDOMReads = (operations) => {
  return requestAnimationFrame(() => {
    operations.forEach((op) => op());
  });
};

export const batchDOMWrites = (operations) => {
  return requestAnimationFrame(() => {
    operations.forEach((op) => op());
  });
};
