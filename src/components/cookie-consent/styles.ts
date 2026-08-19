export const COOKIE_CONSENT_CSS = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #ede3d1;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999999;
  background: #18130e;
  border-top: 1px solid #3d3123;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.45);
  padding: 20px 24px;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.banner.visible { transform: translateY(0); }

.banner-inner { max-width: 1100px; margin: 0 auto; }

.banner-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }

.banner-title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  letter-spacing: 0.04em;
  color: #ede3d1;
}

.banner-text {
  font-size: 13px;
  color: #a8987f;
  margin-bottom: 16px;
  max-width: 720px;
}

.banner-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

.btn {
  border: 1px solid #3d3123;
  border-radius: 0;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  white-space: nowrap;
}

.btn-accept { background: rgba(237, 227, 209, 0.1); color: #ede3d1; border-color: #a8987f; }
.btn-accept:hover { background: rgba(237, 227, 209, 0.18); }

.btn-reject { background: transparent; color: #a8987f; }
.btn-reject:hover { color: #ede3d1; border-color: #a8987f; }

.btn-customize {
  background: transparent;
  color: #a8987f;
  border-color: transparent;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 10px 8px;
}
.btn-customize:hover { color: #ede3d1; }

.btn-save { background: rgba(237, 227, 209, 0.1); color: #ede3d1; border-color: #a8987f; }

.policy-link {
  color: #a8987f;
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-left: auto;
  cursor: pointer;
  background: none;
  border: none;
}
.policy-link:hover { color: #ede3d1; }

/* Customize panel */
.customize-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #3d3123;
}

.category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(61, 49, 35, 0.6);
}
.category:last-child { border-bottom: none; }

.category-info { flex: 1; margin-right: 16px; }
.category-name { font-size: 13px; font-weight: 600; color: #ede3d1; }
.category-desc { font-size: 12px; color: #6f6250; margin-top: 2px; }

.category-status {
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
  font-size: 11px;
  color: #a8987f;
}

/* Toggle switch */
.toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #3d3123;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: #ede3d1;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle input:checked + .toggle-slider { background: #a8987f; }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
.toggle input:disabled + .toggle-slider { opacity: 0.5; cursor: not-allowed; }

.toggle input:focus-visible + .toggle-slider { outline: 1px solid #ede3d1; outline-offset: 2px; }

@media (max-width: 640px) {
  .banner { padding: 16px; }
  .banner-actions { flex-direction: column; align-items: stretch; }
  .btn { text-align: center; }
  .policy-link { margin-left: 0; text-align: center; padding-top: 4px; }
}
`;
