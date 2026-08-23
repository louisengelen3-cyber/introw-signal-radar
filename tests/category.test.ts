import { describe, expect, it } from 'vitest';
import { assessCategory } from '../src/suitability/category.js';

const obs = (quote: string, sourceUrl = 'https://x.com/partners') => ({ quote, sourceUrl });

describe('assessCategory', () => {
  it('excludes on product self-description alone', () => {
    const v = assessCategory([obs('our partner portal software gives channel partners a self-service platform')]);
    expect(v.state).toBe('excluded');
    expect(v.signals).toContain('sells_partner_tech');
  });

  it('does NOT exclude on a single second-person hit — one indicator is never enough', () => {
    // Phase 1 firm-type suppression had a 67% false-positive rate under single-indicator
    // matching. The same two-indicator rule applies here for the same reason.
    const v = assessCategory([obs('grow your partner program faster')]);
    expect(v.state).toBe('review_required');
  });

  it('excludes when two independent indicators agree', () => {
    const v = assessCategory([
      obs('what is a reseller partner portal?'),
      obs('helps you recruit partners at scale'),
    ]);
    expect(v.state).toBe('excluded');
    expect(v.signals.length).toBeGreaterThanOrEqual(2);
  });

  it('leaves a genuine operator clear', () => {
    const v = assessCategory([
      obs('resell our communications platform and earn margin'),
      obs('our partners register deals through the partner portal'),
    ]);
    expect(v.state).toBe('clear');
  });

  it('does not fire on supply-side partner language', () => {
    const v = assessCategory([
      obs('restaurant partners join our marketplace to reach more customers'),
      obs('become a delivery partner and earn per trip'),
    ]);
    expect(v.state).toBe('clear');
  });

  it('flags evidence sourced entirely from content-marketing paths', () => {
    const v = assessCategory([
      obs('partners resell the product', 'https://x.com/blog/channel-tips'),
      obs('deal registration explained', 'https://x.com/glossary/deal-registration'),
      obs('tiering models compared', 'https://x.com/resources/tiering'),
    ]);
    expect(v.signals).toContain('content_marketing_path');
  });

  it('does not flag content paths when a real programme surface is also present', () => {
    const v = assessCategory([
      obs('partners resell the product', 'https://x.com/blog/channel-tips'),
      obs('apply here', 'https://x.com/partners/apply'),
      obs('tiering', 'https://x.com/resources/tiering'),
    ]);
    expect(v.signals).not.toContain('content_marketing_path');
  });

  it('never returns a state meaning "confirmed not a competitor"', () => {
    const v = assessCategory([]);
    expect(v.state).toBe('clear');
    expect(v.rationale).toMatch(/not proof/i);
  });
});
