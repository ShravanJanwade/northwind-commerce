import { randomInt } from 'node:crypto';
import type { Coupon } from './discounts.ts';

/** No 0/O or 1/I, so codes survive being read aloud or retyped. */
export const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const COUPON_LENGTH = 5;

export function generateCouponCode(length = COUPON_LENGTH, random: (max: number) => number = randomInt): string {
  let code = '';
  for (let i = 0; i < length; i += 1) code += COUPON_ALPHABET[random(COUPON_ALPHABET.length)];
  return code;
}

export interface Campaign {
  name: string;
  percentOff: number;
  minimumSpend: number;
  expiresOn: string;
  codes: string[];
}

/** One single-use code per recipient of a campaign. */
export function createCampaign(
  name: string,
  recipients: number,
  options: { percentOff: number; minimumSpend: number; expiresOn: string },
): Campaign {
  if (!Number.isInteger(recipients) || recipients < 1) throw new RangeError('A campaign needs at least one recipient');
  const codes = Array.from({ length: recipients }, () => generateCouponCode());
  return { name, ...options, codes };
}

export function couponFor(campaign: Campaign, code: string, today: string): Coupon | null {
  const normalized = code.trim().toUpperCase();
  if (today > campaign.expiresOn || !campaign.codes.includes(normalized)) return null;
  return { code: normalized, percentOff: campaign.percentOff, minimumSpend: campaign.minimumSpend };
}
