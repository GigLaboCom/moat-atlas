/**
 * The "how it works" dialog on the cross-section. It is deliberately not part
 * of the 3D module: the guide is this page's documentation, so it has to open
 * even where WebGL never starts. Every string is server-rendered — the script
 * only opens and closes.
 */
import { trackGuideOpen } from "../lib/analytics";

const dialog = document.getElementById("guide-modal") as HTMLDialogElement | null;
const opener = document.getElementById("guide-open");

if (dialog && opener) {
  opener.addEventListener("click", () => {
    dialog.showModal();
    dialog.scrollTop = 0;
    trackGuideOpen();
  });

  document.getElementById("guide-close")?.addEventListener("click", () => dialog.close());

  // A click on the backdrop lands on the dialog itself, never on its content.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}
