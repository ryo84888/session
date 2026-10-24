"use strict";

const hero = document.querySelector(".hero");
const progressBar = document.querySelector(".reading-progress");
const sections = [...document.querySelectorAll("main section[id]")];
const indexLinks = [...document.querySelectorAll(".page-index a")];
let framePending = false;
let introPlayed = false;

document.querySelectorAll("[data-ocean-image]").forEach((image) => {
  const showImageFallback = () => {
    image.closest("[data-image-frame]")?.classList.add("image-unavailable");
  };

  image.addEventListener("error", showImageFallback, { once: true });

  if (image.complete && image.naturalWidth === 0) {
    showImageFallback();
  }
});

function updateReadingPosition() {
  framePending = false;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;

  if (progressBar) {
    progressBar.style.transform = `scaleX(${progress})`;
  }

  const readingLine = window.scrollY + window.innerHeight * 0.42;
  let activeSection = "";

  sections.forEach((section) => {
    if (section.offsetTop <= readingLine) activeSection = section.id;
  });

  indexLinks.forEach((link) => {
    if (link.hash === `#${activeSection}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function scheduleReadingUpdate() {
  if (!framePending) {
    framePending = true;
    window.requestAnimationFrame(updateReadingPosition);
  }
}

function initializeMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();

  motion.add({
    allowMotion: "(prefers-reduced-motion: no-preference)",
    desktop: "(min-width: 761px)"
  }, (context) => {
    if (!context.conditions.allowMotion) return;

    const inkUnits = [];
    const introText = [];

    document.querySelectorAll("[data-ink]").forEach((element, index) => {
      const sentences = [...element.querySelectorAll(":scope > p")];
      const units = sentences.length ? sentences : element.matches(".hero__subtitle")
        ? [...element.children]
        : [element];

      inkUnits.push(...units);
      units.forEach((unit) => unit.classList.add("ink-unit"));
      gsap.set(units, { opacity: 0.2 });

      if (element.dataset.ink === "intro") {
        introText.push(units);
        return;
      }

      gsap.fromTo(units, { opacity: 0.2 }, {
        opacity: 1,
        duration: 1,
        stagger: 0.65,
        ease: "sine.inOut",
        scrollTrigger: {
          id: `ink-${index}`,
          trigger: element,
          start: "top 84%",
          end: "clamp(bottom 52%)",
          scrub: 0.65,
          invalidateOnRefresh: true
        }
      });
    });

    const playIntro = !introPlayed && hero && window.scrollY < hero.offsetHeight * 0.45;
    introPlayed = true;

    if (playIntro) {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro.fromTo(".hero__portal", { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 2.2 }, 0);
      intro.fromTo(".hero__label", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.6 }, 0.25);
      intro.fromTo(".hero__orbit", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 2 }, 0.6);
      intro.fromTo(".hero__portal-line", { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 1.8 }, 1.1);
      intro.fromTo(".hero__note, .hero__footer, .hero__vertical-note", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 1.6, stagger: 0.12 }, 1);

      introText.forEach((units, index) => {
        intro.to(units, {
          opacity: 1,
          duration: 1.2,
          stagger: 0.3,
          ease: "sine.inOut"
        }, index === 0 ? 0.4 : 0.75);
      });
    } else {
      introText.forEach((units) => gsap.set(units, { opacity: 1 }));
    }

    document.querySelectorAll("[data-reveal]").forEach((element) => {
      if (element.matches("[data-ink]")) return;
      const containsInk = Boolean(element.querySelector("[data-ink]"));

      gsap.fromTo(element, {
        y: containsInk ? 12 : 24,
        opacity: containsInk ? 1 : 0.35
      }, {
        y: 0,
        opacity: 1,
        duration: 1.6,
        ease: "power3.out",
        immediateRender: false,
        scrollTrigger: { trigger: element, start: "top 91%", once: true }
      });
    });

    gsap.fromTo(".hero__image", { y: 0, scale: 1.12 }, {
      y: () => Math.min(32, hero.offsetHeight * 0.025),
      scale: 1.12,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    gsap.fromTo(".session-visual__frame img", { yPercent: -3, scale: 1.12 }, {
      yPercent: 3,
      scale: 1.12,
      ease: "none",
      scrollTrigger: { trigger: ".session-visual", start: "top bottom", end: "bottom top", scrub: 1.2 }
    });

    document.querySelectorAll(".heading-rule").forEach((line) => {
      gsap.fromTo(line, { scaleX: 0, transformOrigin: "left" }, {
        scaleX: 1,
        duration: 1.5,
        ease: "power3.out",
        immediateRender: false,
        scrollTrigger: { trigger: line, start: "top 91%", once: true }
      });
    });

    return () => {
      inkUnits.forEach((unit) => unit.classList.remove("ink-unit"));
    };
  });

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) ScrollTrigger.refresh();
  });
  ScrollTrigger.refresh();
}

window.addEventListener("scroll", scheduleReadingUpdate, { passive: true });
window.addEventListener("resize", scheduleReadingUpdate);
window.addEventListener("load", scheduleReadingUpdate, { once: true });

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => {
  initializeMotion();
  scheduleReadingUpdate();
});

updateReadingPosition();
