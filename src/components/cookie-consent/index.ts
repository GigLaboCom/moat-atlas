import { CookieConsentBanner } from './CookieConsent';

if (!customElements.get('cookie-consent-banner')) {
  customElements.define('cookie-consent-banner', CookieConsentBanner);
}

export { CookieConsentBanner };
