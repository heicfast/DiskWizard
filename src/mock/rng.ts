/**
 * Re-export — the PRNG lives in src/lib (product utilities must not
 * import from the mock tree; the mock may import from lib).
 */
export { mulberry32, pick, randInt } from "../lib/rng";
