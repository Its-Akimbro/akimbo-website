// Placeholder images the owner hasn't supplied yet (spec #28). They live apart
// from `placeholders.ts` because the Marketing Worker imports that module (via
// `site.ts`), and the Worker's bundler has no loader for image files.

/**
 * The service-area map: a self-hosted image, never a third-party map embed.
 * Swap the file for the owner's map before launch.
 */
export { default as SERVICE_AREA_MAP } from "./assets/service-area-map-placeholder.svg";
