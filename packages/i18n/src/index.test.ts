import { describe, expect, it } from 'vitest';
import { translate, locate, type Locale } from '.';

describe('i18n', () => {
  it('translates a nested key into Vietnamese', () => {
    expect(translate('vi', 'nav.workers')).toBe('Nhân sự');
    expect(translate('vi', 'common.offline')).toBe('Bạn đang ngoại tuyến');
  });

  it('translates into Korean', () => {
    expect(translate('ko', 'actions.approve')).toBe('승인');
  });

  it('falls back to English for an unknown locale', () => {
    expect(translate('fr' as unknown as Locale, 'nav.projects')).toBe('Projects');
  });

  it('locate returns a supported locale', () => {
    expect(locate('ko')).toBe('ko');
    expect(locate(null)).toBe('en');
    expect(locate(undefined)).toBe('en');
  });
});
