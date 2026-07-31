"use client";

import { useEffect, useRef, useState } from "react";

export function useAdminStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(key);
        if (saved) setValue(JSON.parse(saved) as T);
      } catch {
        // Keep the safe defaults when browser storage is unavailable or invalid.
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  function reset() {
    setValue(initialValue);
  }

  return { value, setValue, ready, reset };
}

export function makeAdminId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function publishAdminKeys(keys: Array<{ draft: string; published: string }>) {
  keys.forEach(({ draft, published }) => {
    const value = window.localStorage.getItem(draft);
    if (value) window.localStorage.setItem(published, value);
  });
  window.localStorage.setItem("aplus-admin-last-published", new Date().toISOString());
  window.dispatchEvent(new Event("aplus-content-published"));
}

export function usePublishedContent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const fallbackRef = useRef(fallback);

  useEffect(() => {
    function load() {
      try {
        const saved = window.localStorage.getItem(key);
        setValue(saved ? (JSON.parse(saved) as T) : fallbackRef.current);
      } catch {
        setValue(fallbackRef.current);
      }
    }

    load();
    window.addEventListener("storage", load);
    window.addEventListener("aplus-content-published", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("aplus-content-published", load);
    };
  }, [key]);

  return value;
}

export function useAdminDisplayContent<T>(draftKey: string, publishedKey: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const fallbackRef = useRef(fallback);

  useEffect(() => {
    function load() {
      try {
        const preview = new URLSearchParams(window.location.search).get("adminPreview") === "1";
        const saved = window.localStorage.getItem(preview ? draftKey : publishedKey);
        setValue(saved ? (JSON.parse(saved) as T) : fallbackRef.current);
      } catch {
        setValue(fallbackRef.current);
      }
    }

    load();
    window.addEventListener("storage", load);
    window.addEventListener("aplus-content-published", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("aplus-content-published", load);
    };
  }, [draftKey, publishedKey]);

  return value;
}
