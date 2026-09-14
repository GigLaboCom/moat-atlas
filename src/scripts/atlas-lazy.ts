/**
 * When to draw the section. The home page opens on the hero, and the
 * cross-section sits a screen below it, so three.js is not fetched until the
 * canvas is within 200px of the viewport — or at all, for a page that opens
 * into the list view and never leaves it. A deep link into the drawing
 * (`/#moat-7`, `/?hl=19,6#section`) scrolls the stage into view first; the
 * observer then fires like any other approach.
 *
 * The scene module boots on import, so the import *is* the decision.
 */
import { onSectionChange, sectionState } from "./section-state";

const canvas = document.getElementById("scene");
const stage = document.getElementById("stage");
const NEAR = "200px 0px";

let requested = false;
function load(): void {
  if (requested) return;
  requested = true;
  void import("./atlas");
}

function armWhenNear(): void {
  if (!canvas || !("IntersectionObserver" in window)) {
    load();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      load();
    },
    { rootMargin: NEAR },
  );
  io.observe(canvas);
}

const coreHash = /^#moat-\d+$/.test(window.location.hash);

/** An address that names a shaft lands on the drawing, not on the hero. */
function deepLinked(): boolean {
  return coreHash || sectionState().hl.length > 0;
}

/**
 * Land on the stage itself, not on the section's heading: the hand-off link
 * carries `#section`, which the browser scrolls to on its own once the page
 * has loaded — after this module runs — so the correction waits for that.
 */
function landOnStage(): void {
  if (!stage) return;
  const go = () => requestAnimationFrame(() => stage.scrollIntoView({ block: "start" }));
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

if (sectionState().view === "scene") {
  if (deepLinked()) landOnStage();
  armWhenNear();
} else {
  // The list is asked for by address, so it is where the page opens — unless
  // the address names an entry, which the browser already walks to.
  if (!coreHash) landOnStage();
  onSectionChange((s, change) => {
    if (change === "view" && s.view === "scene") armWhenNear();
  });
}
