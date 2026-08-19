type Locale = 'en' | 'ru';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    banner_title: 'Cookie settings',
    banner_text:
      'We use cookies to measure how the atlas is used and to remember your language and theme. You choose which categories to allow.',
    accept_all: 'Accept all',
    reject_all: 'Reject all',
    customize: 'Customize',
    save_preferences: 'Save preferences',
    cat_essential: 'Essential',
    cat_essential_desc: 'Required for the site to work. Cannot be disabled.',
    cat_analytics: 'Analytics',
    cat_analytics_desc: 'Help us see which sheets and groupings people actually use.',
    cat_marketing: 'Marketing',
    cat_marketing_desc: 'Used to deliver relevant advertisements.',
    cat_personalization: 'Personalization',
    cat_personalization_desc: 'Let the atlas remember your language, theme and last grouping.',
    cookie_policy_link: 'Cookie policy',
    always_active: 'Always active',
  },
  ru: {
    banner_title: 'Настройки cookie',
    banner_text:
      'Мы используем cookie, чтобы измерять, как читают атлас, и запоминать язык и тему. Вы выбираете, какие категории разрешить.',
    accept_all: 'Принять все',
    reject_all: 'Отклонить все',
    customize: 'Настроить',
    save_preferences: 'Сохранить настройки',
    cat_essential: 'Обязательные',
    cat_essential_desc: 'Нужны для работы сайта. Нельзя отключить.',
    cat_analytics: 'Аналитика',
    cat_analytics_desc: 'Помогают понять, какие листы и группировки реально читают.',
    cat_marketing: 'Маркетинг',
    cat_marketing_desc: 'Используются для показа релевантной рекламы.',
    cat_personalization: 'Персонализация',
    cat_personalization_desc: 'Позволяют атласу помнить язык, тему и последнюю группировку.',
    cookie_policy_link: 'Политика cookie',
    always_active: 'Всегда активны',
  },
};

export function t(lang: string, key: string): string {
  const locale = (lang === 'ru' ? 'ru' : 'en') as Locale;
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
