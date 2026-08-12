const PREFIX = "habitus:";

export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("Failed to read from localStorage", key, err);
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to write to localStorage", key, err);
  }
}

export function removeFromStorage(key) {
  localStorage.removeItem(PREFIX + key);
}

export function clearAllAppStorage() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
