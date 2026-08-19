import type { ConsentParams } from './consent';

export interface ConsentCategories {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface ConsentState {
  categories: ConsentCategories;
  timestamp: number;
  version: number;
}

export const CONSENT_KEY = 'moat-atlas-consent';
const CONSENT_VERSION = 1;

export function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(categories: ConsentCategories): ConsentState {
  const state: ConsentState = {
    categories,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  return state;
}

export function buildConsentParams(categories: ConsentCategories): ConsentParams {
  const g = 'granted' as const;
  const d = 'denied' as const;
  return {
    analytics_storage: categories.analytics ? g : d,
    ad_storage: categories.marketing ? g : d,
    ad_user_data: categories.marketing ? g : d,
    ad_personalization: categories.marketing ? g : d,
    personalization_storage: categories.personalization ? g : d,
    functionality_storage: categories.personalization ? g : d,
    security_storage: g,
  };
}

export function grantAll(): ConsentCategories {
  return { essential: true, analytics: true, marketing: true, personalization: true };
}

export function denyAll(): ConsentCategories {
  return { essential: true, analytics: false, marketing: false, personalization: false };
}

export function applyToGtag(params: ConsentParams): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', params);
  }
}
