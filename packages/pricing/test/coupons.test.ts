import { describe, expect, it } from 'vitest';
import { COUPON_ALPHABET, couponFor, createCampaign, generateCouponCode } from '../src/index.ts';

describe('coupon codes', () => {
  it('uses only unambiguous characters', () => {
    const code = generateCouponCode();
    expect(code).toHaveLength(5);
    for (const char of code) expect(COUPON_ALPHABET).toContain(char);
  });

  it('is deterministic for a given source of randomness', () => {
    let next = 0;
    expect(generateCouponCode(4, () => next++)).toBe('ABCD');
  });

  it('issues unique codes for a newsletter-sized campaign', () => {
    const campaign = createCampaign('spring-newsletter', 2600, {
      percentOff: 0.15,
      minimumSpend: 3000,
      expiresOn: '2027-04-30',
    });
    expect(new Set(campaign.codes).size).toBe(campaign.codes.length);
  });

  it('redeems a valid code until the campaign expires', () => {
    const campaign = { name: 'test', percentOff: 0.1, minimumSpend: 0, expiresOn: '2027-01-31', codes: ['ABCDE'] };
    expect(couponFor(campaign, ' abcde ', '2027-01-15')).toEqual({ code: 'ABCDE', percentOff: 0.1, minimumSpend: 0 });
    expect(couponFor(campaign, 'ABCDE', '2027-02-01')).toBeNull();
    expect(couponFor(campaign, 'ZZZZZ', '2027-01-15')).toBeNull();
  });
});
