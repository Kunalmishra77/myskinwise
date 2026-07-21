import "@testing-library/jest-dom/vitest";

/*
 * jsdom has no layout engine, so `window.scrollTo` is a stub that prints
 * "Not implemented: Window's scrollTo() method" to stderr every time a
 * component calls it. The calls are harmless — nothing under test asserts
 * on scroll position — but the noise scrolls real failures out of view in
 * CI output. Replace it with a no-op so the only stderr in a run is a
 * genuine problem.
 */
window.scrollTo = () => {};
