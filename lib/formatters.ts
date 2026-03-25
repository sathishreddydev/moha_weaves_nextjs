import { useLocale } from 'next-intl';

// Country-based currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  IN: 'INR',
  GB: 'GBP',
  EU: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  SA: 'SAR',
  CA: 'CAD',
  AU: 'AUD',
};

// Country-based locale mapping for formatting
const COUNTRY_LOCALE_MAP: Record<string, string> = {
  US: 'en-US',
  IN: 'en-IN', // Use English for India, local languages later
  GB: 'en-GB',
  EU: 'de-DE', // Use German as default for EU
  JP: 'ja-JP',
  CN: 'zh-CN',
  KR: 'ko-KR',
  SA: 'ar-SA',
  CA: 'en-CA',
  AU: 'en-AU',
};



const getBaseLocale = (locale: string) => locale.split('-')[0];

/**
 * Format price based on current locale
 */
export const formatPrice = (
  price: number | string,
  locale: string = 'en',
  currency?: string
): string => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return '0';
  }

  // Extract the base locale (e.g., 'en' from 'en-US')
  const baseLocale = locale.split('-')[0];
  const country = 'IN'; // Hardcoded for India
  const formatLocale = COUNTRY_LOCALE_MAP[country] || COUNTRY_LOCALE_MAP['US'];
  const mappedCurrency = COUNTRY_CURRENCY_MAP[country];
  const targetCurrency = currency || mappedCurrency || 'USD';

  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: targetCurrency,
    maximumFractionDigits: 0,
  }).format(numPrice);
};

/**
 * Format date based on current locale
 */
export const formatDate = (
  date: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const baseLocale = getBaseLocale(locale);
  const country = 'IN';
  const formatLocale = COUNTRY_LOCALE_MAP[country] || COUNTRY_LOCALE_MAP['US'];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(
    formatLocale,
    options ?? defaultOptions
  ).format(dateObj);
};

/**
 * Format date only
 */
export const formatDateOnly = (
  date: string | Date,
  locale: string
): string => {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format time only
 */
export const formatTimeOnly = (
  date: string | Date,
  locale: string
): string => {
  return formatDate(date, locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get currency symbol for a locale
 */
export const getCurrencySymbol = (locale: string): string => {
  const baseLocale = getBaseLocale(locale);
  const country = 'IN';
  const currency = COUNTRY_CURRENCY_MAP[country] || 'USD';
  const formatLocale = COUNTRY_LOCALE_MAP[country] || COUNTRY_LOCALE_MAP['US'];

  const parts = new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);

  const currencyPart = parts.find((part) => part.type === 'currency');
  return currencyPart?.value ?? currency;
};

/**
 * Hook for using formatters with current locale
 */
export const useFormatters = () => {
  const locale = useLocale();
  const baseLocale = getBaseLocale(locale);

  return {
    formatPrice: (price: number | string, overrideLocale?: string, currency?: string) =>
      formatPrice(price, overrideLocale || locale, currency),

    formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),

    formatDateOnly: (date: string | Date) =>
      formatDateOnly(date, locale),

    formatTimeOnly: (date: string | Date) =>
      formatTimeOnly(date, locale),

    getCurrencySymbol: () => getCurrencySymbol(locale),

    currentCurrency: COUNTRY_CURRENCY_MAP['IN'] ?? 'USD',
    currentLocale: locale,
  };
};