/**
 * Motion presets (framer) — one harmonic family per intent, mirroring
 * the DiskGenie motion language so the app feels identical in
 * weight and timing.
 */
import type { Transition, Variants } from "framer-motion";

/** Spring for standard UI moves (toggles, panels, tiles). */
export const SPRING_UI: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

/** Spring for playful pops (badges, checkmarks, gauges). */
export const POP: Transition = {
  type: "spring",
  stiffness: 560,
  damping: 22,
  mass: 0.6,
};

/** Toast entrance. */
export const TOAST: Transition = {
  type: "spring",
  stiffness: 480,
  damping: 30,
  mass: 1,
};

/** View-swap fade. */
export const FADE_SWAP: Transition = {
  duration: 0.18,
  ease: [0.2, 0.8, 0.3, 1],
};

export const FADE_IN: Variants = {
  hidden: { opacity: 0, y: 6 },
  shown: { opacity: 1, y: 0, transition: FADE_SWAP },
};

export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  shown: { opacity: 1, scale: 1, transition: { ...POP } },
};
