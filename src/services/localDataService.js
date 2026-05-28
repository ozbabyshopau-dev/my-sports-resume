function cloneLocalValue(value) {
  return JSON.parse(JSON.stringify(value));
}

export function readLocalData(key, fallback) {
  if (typeof window === "undefined") {
    return cloneLocalValue(fallback);
  }

  try {
    const value = window.localStorage.getItem(key);
    if (!value) {
      return cloneLocalValue(fallback);
    }

    return cloneLocalValue(JSON.parse(value));
  } catch {
    return cloneLocalValue(fallback);
  }
}

export function writeLocalData(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function removeLocalData(key) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {}
}
