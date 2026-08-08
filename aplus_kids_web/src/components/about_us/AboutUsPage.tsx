"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "@/utils/sitePath";
import {
  aboutCopy,
  impactCards,
  storyScenes,
  type AboutLanguage,
} from "./aboutUsData";
import styles from "./AboutUsPage.module.css";

type StoryStyle = CSSProperties & {
  "--journey-progress"?: string;
  "--chapter-progress"?: string;
};

type ImageStyle = CSSProperties & {
  "--image-x"?: string;
  "--image-y"?: string;
  "--image-z"?: string;
  "--image-scale"?: string;
  "--image-rotate"?: string;
  "--image-blur"?: string;
  "--image-brightness"?: string;
  "--image-clip-top"?: string;
  "--image-clip-right"?: string;
  "--image-clip-bottom"?: string;
  "--image-clip-left"?: string;
  "--image-inner-scale"?: string;
  "--image-inner-y"?: string;
};

type CaptionStyle = CSSProperties & {
  "--caption-x"?: string;
  "--caption-y"?: string;
  "--caption-scale"?: string;
  "--caption-origin"?: string;
  "--caption-number-opacity"?: string;
  "--caption-title-opacity"?: string;
  "--caption-body-opacity"?: string;
  "--caption-number-y"?: string;
  "--caption-title-y"?: string;
  "--caption-body-y"?: string;
};

const STORY_HEIGHT = 520;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(value: number) {
  const next = clamp(value, 0, 1);
  return next * next * (3 - 2 * next);
}

function scenePresence(progress: number, index: number) {
  const center = (index + 0.5) / storyScenes.length;
  const distance = Math.abs(progress - center);
  return smoothstep(1 - distance / 0.23);
}

function sceneLocalProgress(progress: number, index: number) {
  const start = index / storyScenes.length;
  const end = (index + 1) / storyScenes.length;
  return clamp((progress - start) / (end - start), 0, 1);
}

export default function AboutUsPage() {
  const [language, setLanguage] = useState<AboutLanguage>("en");

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-about-reveal]"),
    );

    if (reduceMotion) {
      elements.forEach((element) => element.classList.add(styles.revealed));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(styles.revealed, entry.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page} lang={language}>
      <Hero language={language} onLanguageChange={setLanguage} />
      <Intro language={language} />
      <TransformationStory language={language} />
      <Impact language={language} />
      <Mission language={language} />
      <Moments language={language} />
      <CTA language={language} />
    </main>
  );
}

function Hero({
  language,
  onLanguageChange,
}: {
  language: AboutLanguage;
  onLanguageChange: (language: AboutLanguage) => void;
}) {
  const isSinhala = language === "si";

  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        <div>
          <div className={styles.languageToggle} aria-label="Choose language">
            {(["en", "si"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.languageButton} ${
                  language === item ? styles.languageButtonActive : ""
                }`}
                onClick={() => onLanguageChange(item)}
              >
                {aboutCopy.language[item]}
              </button>
            ))}
          </div>
          <p className={styles.eyebrow}>{aboutCopy.hero.eyebrow[language]}</p>
          <h1
            className={`${styles.heroTitle} ${
              isSinhala ? styles.sinhalaTitle : ""
            }`}
          >
            {aboutCopy.hero.title[language]}{" "}
            <span className={styles.highlight}>
              {aboutCopy.hero.highlight[language]}
            </span>
          </h1>
          <p
            className={`${styles.heroText} ${
              isSinhala ? styles.sinhalaBody : ""
            }`}
          >
            {aboutCopy.hero.body[language]}
          </p>
          <div className={styles.heroActions}>
            <a className={styles.button} href="#about-story">
              {aboutCopy.hero.primary[language]}
            </a>
            <Link className={styles.ghostButton} href="/kids-zone">
              {aboutCopy.hero.secondary[language]}
            </Link>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.yellowPanel} />
          <div className={styles.imageFrame}>
            <Image
              src={sitePath("/images/home/kids_champ.png")}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 92vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Intro({ language }: { language: AboutLanguage }) {
  return (
    <section className={styles.intro} data-about-reveal>
      <div className={styles.introInner}>
        <div>
          <p className={styles.eyebrow}>{aboutCopy.intro.eyebrow[language]}</p>
          <h2 className={styles.sectionTitle}>
            {aboutCopy.intro.title[language]}
          </h2>
        </div>
        <p className={styles.sectionText}>{aboutCopy.intro.body[language]}</p>
      </div>
    </section>
  );
}

function TransformationStory({ language }: { language: AboutLanguage }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<AboutLanguage>(language);
  const activeScene = storyScenes[activeIndex] ?? storyScenes[0];
  const chapterProgress = sceneLocalProgress(progress, activeIndex);
  const finalPresence = smoothstep((progress - 0.88) / 0.12);
  const progressPercent = Math.round(progress * 100);
  const caption = useMemo(
    () => storyScenes[activeIndex] ?? storyScenes[0],
    [activeIndex],
  );


  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      if (motionQuery.matches) {
        setReducedMotion(true);
        setProgress(1);
        setActiveIndex(storyScenes.length - 1);
        return;
      }

      setReducedMotion(false);
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(rect.height - window.innerHeight, 1);
      const nextProgress = clamp(-rect.top / scrollable, 0, 1);
      const nextActiveIndex = clamp(
        Math.floor(nextProgress * storyScenes.length),
        0,
        storyScenes.length - 1,
      );

      setProgress(nextProgress);
      setActiveIndex((current) =>
        current === nextActiveIndex ? current : nextActiveIndex,
      );
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    motionQuery.addEventListener("change", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      motionQuery.removeEventListener("change", requestUpdate);
    };
  }, []);

  if (reducedMotion) {
    return (
      <section id="about-story" className={styles.staticStory}>
        <div className={styles.sectionInner}>
          <div className={styles.storyHeading}>
            <p className={styles.eyebrow}>{aboutCopy.story.eyebrow[storyLanguage]}</p>
            <h2>{aboutCopy.story.title[storyLanguage]}</h2>
          </div>
          <div className={styles.staticSceneGrid}>
            {storyScenes.map((scene) => (
              <article key={scene.id} className={styles.mobileScene}>
                <Image
                  src={sitePath(scene.image)}
                  alt={scene.alt[storyLanguage]}
                  width={1200}
                  height={675}
                />
                <div className={styles.mobileSceneText}>
                  <p className={styles.captionNumber}>{scene.number} / 04</p>
                  <h3 className={styles.captionTitle}>
                    {scene.title[storyLanguage]}
                  </h3>
                  <p className={styles.sectionText}>{scene.body[storyLanguage]}</p>
                </div>
              </article>
            ))}
            <div className={styles.mobileFinalCard}>
              <p className={styles.eyebrow}>A+ Kids TV</p>
              <h3>{aboutCopy.story.finalStatement[storyLanguage]}</h3>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="about-story"
      className={styles.story}
      style={
        {
          height: reducedMotion ? "auto" : `${STORY_HEIGHT}vh`,
          "--journey-progress": progress.toFixed(4),
          "--chapter-progress": chapterProgress.toFixed(4),
        } as StoryStyle
      }
    >
      <div className={styles.storyViewport}>
        <div
          className={styles.storyBackground}
          style={{ backgroundColor: activeScene.theme.background }}
        />
        <div className={styles.storyDepth} aria-hidden="true" />
        <div className={styles.storyLayer}>
          {storyScenes.map((scene, index) => {
            const local = sceneLocalProgress(progress, index);
            const easedLocal = smoothstep(local);
            const presence = reducedMotion ? 1 : scenePresence(progress, index);
            const imageOnLeft = scene.side === "left";
            const sideSign = imageOnLeft ? -1 : 1;
            const enter = smoothstep(local * 1.24);
            const exit = smoothstep((local - 0.76) / 0.24);
            const depthPeak = Math.sin(easedLocal * Math.PI);
            const imageScale =
              0.82 + enter * 0.18 + depthPeak * 0.008 + exit * 0.012;
            const imageStartDistance = imageOnLeft ? 42 : 48;
            const imageX =
              -sideSign * (1 - enter) * imageStartDistance +
              sideSign * enter * 1.2;
            const imageY = (1 - enter) * 14 - exit * 7;
            const imageZ = (1 - enter) * -320 + exit * 40;
            const imageRotate = -sideSign * (1 - enter) * 2.4;
            const imageBrightness = 0.76 + presence * 0.24;
            const imageClipBlock = (1 - enter) * 9;
            const imageClipInline = (1 - enter) * 56;
            const innerScale = 1.04 - enter * 0.04 + depthPeak * 0.006;
            const innerY = (1 - enter) * -2.8 + exit * 1.6;

            return (
              <div
                key={scene.id}
                className={styles.sceneLayer}
                style={{
                  opacity: presence,
                  zIndex: Math.round(presence * 10) + index,
                }}
                aria-hidden={index !== activeIndex}
              >
                <div
                  className={styles.sceneGlow}
                  style={{
                    background: `radial-gradient(circle at ${
                      imageOnLeft ? "28%" : "72%"
                    } 52%, ${scene.theme.glow} 0 18%, transparent 44%)`,
                  }}
                />
                <div
                  className={`${styles.storyImagePanel} ${
                    imageOnLeft ? styles.imageLeft : styles.imageRight
                  }`}
                  style={
                    {
                      "--image-x": `${imageX.toFixed(2)}%`,
                      "--image-y": `${imageY.toFixed(2)}%`,
                      "--image-z": `${imageZ.toFixed(2)}px`,
                      "--image-scale": imageScale.toFixed(4),
                      "--image-rotate": `${imageRotate.toFixed(2)}deg`,
                      "--image-blur": "0px",
                      "--image-brightness": imageBrightness.toFixed(3),
                      "--image-clip-top": `${imageClipBlock.toFixed(2)}%`,
                      "--image-clip-right": `${
                        imageOnLeft ? imageClipInline.toFixed(2) : "0"
                      }%`,
                      "--image-clip-bottom": `${imageClipBlock.toFixed(2)}%`,
                      "--image-clip-left": `${
                        imageOnLeft ? "0" : imageClipInline.toFixed(2)
                      }%`,
                      "--image-inner-scale": innerScale.toFixed(4),
                      "--image-inner-y": `${innerY.toFixed(2)}%`,
                      transformOrigin: imageOnLeft ? "58% 52%" : "42% 52%",
                    } as ImageStyle
                  }
                >
                  <Image
                    src={sitePath(scene.image)}
                    alt={scene.alt[storyLanguage]}
                    width={1200}
                    height={675}
                    priority={index < 2}
                    sizes="(min-width: 1600px) 760px, (min-width: 1024px) 48vw, 86vw"
                    className={styles.storyImage}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.storyFadesTop} />
        <div className={styles.storyFadesBottom} />
        <div className={styles.storyContent}>
          <div className={styles.storyHeader}>
            <div className={styles.storyHeading}>
              <p className={styles.eyebrow}>
                {aboutCopy.story.eyebrow[storyLanguage]}
              </p>
              <h2>{aboutCopy.story.title[storyLanguage]}</h2>
            </div>
            <div className={styles.storyControls}>
              <StoryLanguageToggle
                language={storyLanguage}
                onChange={setStoryLanguage}
              />
              <div className={styles.progressBadge}>
                {String(progressPercent).padStart(2, "0")}%
              </div>
            </div>
          </div>
          <div
            className={`${styles.captionGrid} ${
              caption.side === "left" ? styles.captionRight : styles.captionLeft
            }`}
          >
            <CaptionPanel
              scene={caption}
              language={storyLanguage}
              finalPresence={finalPresence}
              chapterProgress={chapterProgress}
            />
          </div>
          <div className={styles.storyLayerMobile}>
            {storyScenes.map((scene) => (
              <article key={scene.id} className={styles.mobileScene}>
                <Image
                  src={sitePath(scene.image)}
                  alt={scene.alt[storyLanguage]}
                  width={1200}
                  height={675}
                />
                <div className={styles.mobileSceneText}>
                  <p className={styles.captionNumber}>{scene.number} / 04</p>
                  <h3 className={styles.captionTitle}>
                    {scene.title[storyLanguage]}
                  </h3>
                  <p className={styles.sectionText}>{scene.body[storyLanguage]}</p>
                </div>
              </article>
            ))}
            <div className={styles.mobileFinalCard}>
              <p className={styles.eyebrow}>A+ Kids TV</p>
              <h3>{aboutCopy.story.finalStatement[storyLanguage]}</h3>
            </div>
          </div>
        </div>
        <div
          className={styles.finalStatement}
          style={{
            opacity: finalPresence,
            transform: `translate3d(0, ${
              (1 - finalPresence) * 24
            }px, 0) scale(${0.96 + finalPresence * 0.04})`,
          }}
          aria-hidden={finalPresence < 0.5}
        >
          <div className={styles.finalCard}>
            <p className={styles.eyebrow}>A+ Kids TV</p>
            <h3>{aboutCopy.story.finalStatement[storyLanguage]}</h3>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryLanguageToggle({
  language,
  onChange,
}: {
  language: AboutLanguage;
  onChange: (language: AboutLanguage) => void;
}) {
  return (
    <div className={styles.storyLanguageToggle} aria-label="Choose story language">
      {(["en", "si"] as const).map((item) => (
        <button
          key={item}
          type="button"
          className={`${styles.storyLanguageButton} ${
            language === item ? styles.storyLanguageButtonActive : ""
          }`}
          onClick={() => onChange(item)}
        >
          {aboutCopy.language[item]}
        </button>
      ))}
    </div>
  );
}
function CaptionPanel({
  scene,
  language,
  finalPresence,
  chapterProgress,
}: {
  scene: (typeof storyScenes)[number];
  language: AboutLanguage;
  finalPresence: number;
  chapterProgress: number;
}) {
  const captionOnLeft = scene.side !== "left";
  const easedProgress = smoothstep(chapterProgress);
  const captionReveal = smoothstep((chapterProgress - 0.12) / 0.62);
  const numberReveal = smoothstep((chapterProgress - 0.08) / 0.22);
  const titleReveal = smoothstep((chapterProgress - 0.2) / 0.26);
  const bodyReveal = smoothstep((chapterProgress - 0.32) / 0.34);
  const captionX = (captionOnLeft ? 1 : -1) * (1 - easedProgress) * 108;
  const captionScale = 0.82 + easedProgress * 0.18 + finalPresence * 0.02;

  return (
    <article
      className={styles.captionPanel}
      style={
        {
          opacity: (1 - finalPresence) * captionReveal,
          "--caption-x": `${captionX.toFixed(2)}px`,
          "--caption-y": `${((1 - easedProgress) * 54 - finalPresence * 26).toFixed(2)}px`,
          "--caption-scale": captionScale.toFixed(4),
          "--caption-origin": captionOnLeft ? "100% 50%" : "0% 50%",
          "--caption-number-opacity": numberReveal.toFixed(3),
          "--caption-title-opacity": titleReveal.toFixed(3),
          "--caption-body-opacity": bodyReveal.toFixed(3),
          "--caption-number-y": `${((1 - numberReveal) * 22).toFixed(2)}px`,
          "--caption-title-y": `${((1 - titleReveal) * 26).toFixed(2)}px`,
          "--caption-body-y": `${((1 - bodyReveal) * 28).toFixed(2)}px`,
        } as CaptionStyle
      }
    >
      <p className={styles.captionNumber}>{scene.number} / 04</p>
      <h3 className={styles.captionTitle}>{scene.title[language]}</h3>
      <p className={styles.captionBody}>{scene.body[language]}</p>
    </article>
  );
}

function Impact({ language }: { language: AboutLanguage }) {
  return (
    <section className={styles.section} data-about-reveal>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{aboutCopy.impact.eyebrow[language]}</p>
        <h2 className={styles.sectionTitle}>
          {aboutCopy.impact.title[language]}
        </h2>
        <div className={styles.impactGrid}>
          {impactCards.map((card) => (
            <article
              key={card.title.en}
              className={styles.impactCard}
              data-about-reveal
            >
              <h3>{card.title[language]}</h3>
              <p>{card.body[language]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mission({ language }: { language: AboutLanguage }) {
  return (
    <section className={styles.mission} data-about-reveal>
      <div className={styles.missionInner}>
        <div>
          <p className={styles.eyebrow}>{aboutCopy.mission.eyebrow[language]}</p>
          <h2 className={styles.sectionTitle}>
            {aboutCopy.mission.title[language]}
          </h2>
          <p>{aboutCopy.mission.body[language]}</p>
        </div>
        <div className={styles.missionPoints}>
          {aboutCopy.mission.points.map((point) => (
            <div key={point.en} className={styles.missionPoint}>
              {point[language]}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Moments({ language }: { language: AboutLanguage }) {
  return (
    <section className={`${styles.section} ${styles.moments}`} data-about-reveal>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{aboutCopy.moments.eyebrow[language]}</p>
        <h2 className={styles.sectionTitle}>
          {aboutCopy.moments.title[language]}
        </h2>
        <p className={styles.sectionText}>{aboutCopy.moments.body[language]}</p>
      </div>
    </section>
  );
}

function CTA({ language }: { language: AboutLanguage }) {
  return (
    <section className={`${styles.section} ${styles.cta}`} data-about-reveal>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{aboutCopy.cta.eyebrow[language]}</p>
        <h2 className={styles.sectionTitle}>{aboutCopy.cta.title[language]}</h2>
        <p className={styles.sectionText}>{aboutCopy.cta.body[language]}</p>
        <div className={styles.heroActions} style={{ justifyContent: "center" }}>
          <Link className={styles.button} href="/watch">
            Watch A+ Kids
          </Link>
          <Link className={styles.ghostButton} href="/kids-zone">
            Kids Zone
          </Link>
        </div>
      </div>
    </section>
  );
}
