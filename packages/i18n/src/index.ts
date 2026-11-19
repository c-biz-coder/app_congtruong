import type { Dictionary } from './types';
import { en } from './locales/en';
import { vi } from './locales/vi';
import { ko } from './locales/ko';

export const LOCALES = ['vi', 'en', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];

export { en, vi, ko };
export type { Dictionary } from './types';

type Primitive = string | number | boolean | null | undefined;

type DottedKeys<T> = T extends Primitive
  ? never
  : {
      [K in keyof T]: K extends string
        ? T[K] extends Primitive
          ? K
          : K | `${K}.${DottedKeys<T[K]>}`
        : never;
    }[keyof T];

const dictionaries: Record<Locale, Dictionary> = { vi, en, ko };

export function translate(locale: Locale, key: DottedKeys<Dictionary>): string {
  const dictionary = dictionaries[locale] ?? en;
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], dictionary);
  return typeof value === 'string' ? value : key;
}

export function locate(locale: Locale | null | undefined): Locale {
  return locale !== undefined && locale !== null && locale in dictionaries ? locale : 'en';
}
