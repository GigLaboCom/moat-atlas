/**
 * The reading guide under the section — a `<details>` the page folds shut.
 * It is deliberately not part of the 3D module: the guide is this page's
 * documentation, so it has to open even where WebGL never starts. Every
 * string is server-rendered; the script only opens, closes and remembers.
 *
 * Open is a piece of the address (`?guide=1`) like the rest of sheet I's
 * state, so a shared link can arrive with the guide unfolded. The `?` button
 * in the HUD opens the same element — help on demand, not instruction first.
 */
import { trackGuideOpen } from "../lib/analytics";

const guide = document.getElementById("guide") as HTMLDetailsElement | null;
const opener = document.getElementById("guide-open");

if (guide) {
  const details: HTMLDetailsElement = guide;

  function syncUrl(): void {
    const url = new URL(window.location.href);
    if (details.open) url.searchParams.set("guide", "1");
    else url.searchParams.delete("guide");
    history.replaceState(null, "", url);
  }

  if (new URLSearchParams(window.location.search).get("guide") === "1") details.open = true;

  details.addEventListener("toggle", () => {
    syncUrl();
    if (details.open) trackGuideOpen();
  });

  opener?.addEventListener("click", () => {
    details.open = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    details.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    details.querySelector("summary")?.focus({ preventScroll: true });
  });
}
