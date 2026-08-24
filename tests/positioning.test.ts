import { describe, expect, it } from 'vitest';
import { isAuthWall, isLocaleChrome } from '../src/evidence/positioning.js';
import { denoise, stripTags } from '../src/lib/http.js';

describe('extraction hygiene', () => {
  it('drops CSS that survived tag stripping', () => {
    // Accenture's homepage leaked `.sr-only, .herotext { position: absolute; ... }` into
    // the extracted hero, where it was available to match detector patterns.
    const t = denoise('Together We Reinvented .sr-only, .herotext { position: absolute; width: 1px; } more copy');
    expect(t).not.toMatch(/position:/);
    expect(t).toMatch(/Together We Reinvented/);
    expect(t).toMatch(/more copy/);
  });

  it('strips script and style blocks before denoising', () => {
    expect(stripTags('<style>.a{color:red}</style><p>Real copy</p>')).toBe('Real copy');
  });

  it('treats a login title as an auth wall, not a product description', () => {
    // expediapartnercentral.com's homepage is "Partner Central - Login". Reading it as
    // positioning produced a confident category from a sign-in form.
    expect(isAuthWall('Partner Central - Login')).toBe(true);
    expect(isAuthWall('Sign in to your partner account')).toBe(true);
  });

  it('does not treat ordinary copy mentioning login as an auth wall', () => {
    expect(isAuthWall('Aircall is a cloud phone system. Partners log in to submit deals.')).toBe(false);
  });

  it('recognises a language switcher as chrome', () => {
    expect(isLocaleChrome('English (US) English UK Español Italiano Français Deutsch 日本語')).toBe(true);
  });

  it('does not mistake a bilingual tagline for a switcher', () => {
    expect(isLocaleChrome('Available in English and Deutsch for teams across Europe, with onboarding support')).toBe(false);
  });
});
