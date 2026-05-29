"use client";

import { useEffect } from "react";

export default function ScrollRevealObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const observedElements = new WeakSet<HTMLElement>();

    function revealNow() {
      document
        .querySelectorAll<HTMLElement>("[data-scroll-reveal]")
        .forEach((element) => element.classList.add("is-visible"));
    }

    function observeNewElements() {
      document
        .querySelectorAll<HTMLElement>("[data-scroll-reveal]")
        .forEach((element) => {
          if (observedElements.has(element)) {
            return;
          }

          observedElements.add(element);
          observer.observe(element);
        });
    }

    if (reduceMotion) {
      revealNow();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.08,
      },
    );

    requestAnimationFrame(observeNewElements);

    const mutationObserver = new MutationObserver(observeNewElements);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
