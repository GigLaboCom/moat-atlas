import { COOKIE_CONSENT_CSS } from './styles';
import { t } from './translations';
import {
  loadConsent,
  saveConsent,
  buildConsentParams,
  applyToGtag,
  grantAll,
  denyAll,
} from '../../lib/cookie-consent';
import type { ConsentCategories } from '../../lib/cookie-consent';
import { trackEvent } from '../../lib/analytics';

const EU_CACHE_KEY = 'moat-atlas-eu-check';

/**
 * Optional geo endpoint returning `{ ip: { isEu: boolean } }` (or `{ is_eu }`).
 * When it is not configured the banner is shown to everyone — the conservative
 * default for a site that does not know where its visitor is.
 */
const GEO_ENDPOINT = (import.meta.env.PUBLIC_GEO_ENDPOINT as string | undefined) ?? '';

export class CookieConsentBanner extends HTMLElement {
  private _lang = 'en';
  private _customizing = false;
  private _categories: ConsentCategories = {
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._lang = this.getAttribute('lang') || document.documentElement.lang || 'en';

    // Re-open from the cookie policy page ("Manage preferences").
    document.addEventListener('cookie-consent:open', () => {
      const current = loadConsent();
      if (current) this._categories = { ...current.categories };
      this._customizing = false;
      this._render();
      this._show();
    });

    const stored = loadConsent();
    if (stored) {
      applyToGtag(buildConsentParams(stored.categories));
      return; // Choice already made — no banner.
    }

    void this._checkAndShow();
  }

  private async _checkAndShow() {
    if (await this._needsBanner()) {
      this._render();
      this._show();
    } else {
      this._autoGrant();
    }
  }

  /** EU visitors always get the banner; without a geo endpoint, so does everyone. */
  private async _needsBanner(): Promise<boolean> {
    if (!GEO_ENDPOINT) return true;

    const cached = sessionStorage.getItem(EU_CACHE_KEY);
    if (cached !== null) return cached === 'true';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(GEO_ENDPOINT, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const isEu = Boolean(data?.ip?.isEu ?? data?.is_eu);
      sessionStorage.setItem(EU_CACHE_KEY, String(isEu));
      return isEu;
    } catch {
      // Detection failed — show the banner rather than assume consent.
      sessionStorage.setItem(EU_CACHE_KEY, 'true');
      return true;
    }
  }

  private _autoGrant() {
    const categories = grantAll();
    saveConsent(categories);
    applyToGtag(buildConsentParams(categories));
    trackEvent('cookie_consent', { action: 'auto_grant', region: 'non_eu' });
  }

  private _show() {
    // Double rAF so the initial translateY(100%) is painted before .visible lands
    // and the transition actually animates.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.shadowRoot?.querySelector('.banner')?.classList.add('visible');
      });
    });
  }

  private _hide() {
    const banner = this.shadowRoot?.querySelector('.banner');
    if (!banner) return;
    banner.classList.remove('visible');
    banner.addEventListener(
      'transitionend',
      () => {
        if (this.shadowRoot) this.shadowRoot.innerHTML = '';
      },
      { once: true },
    );
  }

  private _commit(categories: ConsentCategories, action: string) {
    saveConsent(categories);
    applyToGtag(buildConsentParams(categories));
    trackEvent('cookie_consent', {
      action,
      analytics: categories.analytics,
      marketing: categories.marketing,
      personalization: categories.personalization,
    });
    this._hide();
  }

  private _handlePolicyClick() {
    const lang = this._lang;
    window.location.href = lang === 'en' ? '/cookies/' : `/${lang}/cookies/`;
  }

  private _render() {
    const shadow = this.shadowRoot;
    if (!shadow) return;
    const lang = this._lang;

    shadow.innerHTML = `
      <style>${COOKIE_CONSENT_CSS}</style>
      <div class="banner" role="dialog" aria-label="${t(lang, 'banner_title')}">
        <div class="banner-inner">
          <div class="banner-header">
            <span class="banner-title">${t(lang, 'banner_title')}</span>
          </div>
          <p class="banner-text">${t(lang, 'banner_text')}</p>
          <div class="banner-actions">
            <button class="btn btn-accept" data-action="accept">${t(lang, 'accept_all')}</button>
            <button class="btn btn-reject" data-action="reject">${t(lang, 'reject_all')}</button>
            <button class="btn btn-customize" data-action="customize">${t(lang, 'customize')}</button>
            <button class="policy-link" data-action="policy">${t(lang, 'cookie_policy_link')}</button>
          </div>
          ${this._customizing ? this._renderCustomize(lang) : ''}
        </div>
      </div>
    `;

    shadow.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        switch (action) {
          case 'accept': this._commit(grantAll(), 'accept_all'); break;
          case 'reject': this._commit(denyAll(), 'reject_all'); break;
          case 'save': this._commit(this._categories, 'custom_save'); break;
          case 'policy': this._handlePolicyClick(); break;
          case 'customize':
            this._customizing = !this._customizing;
            this._render();
            this._show();
            break;
        }
      });
    });

    shadow.querySelectorAll('input[data-category]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement;
        const cat = el.dataset.category as keyof Omit<ConsentCategories, 'essential'>;
        this._categories[cat] = el.checked;
      });
    });
  }

  private _renderCustomize(lang: string): string {
    const categories = [
      { key: 'essential', disabled: true, checked: true },
      { key: 'analytics', disabled: false, checked: this._categories.analytics },
      { key: 'marketing', disabled: false, checked: this._categories.marketing },
      { key: 'personalization', disabled: false, checked: this._categories.personalization },
    ];

    return `
      <div class="customize-panel">
        ${categories
          .map(
            (cat) => `
          <div class="category">
            <div class="category-info">
              <div class="category-name">${t(lang, `cat_${cat.key}`)}</div>
              <div class="category-desc">${t(lang, `cat_${cat.key}_desc`)}</div>
            </div>
            ${
              cat.disabled
                ? `<span class="category-status">${t(lang, 'always_active')}</span>`
                : `<label class="toggle">
                    <input type="checkbox" data-category="${cat.key}" ${cat.checked ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>`
            }
          </div>
        `,
          )
          .join('')}
        <div class="banner-actions" style="margin-top: 12px;">
          <button class="btn btn-save" data-action="save">${t(lang, 'save_preferences')}</button>
        </div>
      </div>
    `;
  }
}
