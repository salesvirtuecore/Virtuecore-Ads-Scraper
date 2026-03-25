import type { AccountTier } from "@/lib/types";

const ULTIMATE_DAYS = 7;
const PRO_DAYS = 3; // after ultimate ends, pro lasts this long

/**
 * Returns the effective tier for a user based on their signup date.
 * Only applies to accounts whose stored tier is "free" — paid accounts
 * (pro, client, ultimate) are returned unchanged.
 */
export function getEffectiveTier(
    storedTier: AccountTier,
    signupDate: string | Date
): AccountTier {
    // Paid accounts are never downgraded by trial logic
    if (storedTier !== "free") return storedTier;

    const signedUpAt = new Date(signupDate).getTime();
    if (isNaN(signedUpAt)) return "free";

    const daysSinceSignup = (Date.now() - signedUpAt) / (1000 * 60 * 60 * 24);

    if (daysSinceSignup < ULTIMATE_DAYS) return "ultimate";
    if (daysSinceSignup < ULTIMATE_DAYS + PRO_DAYS) return "pro";
    return "free";
}

/**
 * Returns trial status info for display in the UI.
 */
export function getTrialStatus(
    storedTier: AccountTier,
    signupDate: string | Date
): {
    onTrial: boolean;
    trialTier: AccountTier | null;
    daysLeft: number;
    nextTier: AccountTier | null;
} {
    if (storedTier !== "free") {
        return { onTrial: false, trialTier: null, daysLeft: 0, nextTier: null };
    }

    const signedUpAt = new Date(signupDate).getTime();
    if (isNaN(signedUpAt)) {
        return { onTrial: false, trialTier: null, daysLeft: 0, nextTier: null };
    }

    const daysSinceSignup = (Date.now() - signedUpAt) / (1000 * 60 * 60 * 24);

    if (daysSinceSignup < ULTIMATE_DAYS) {
        const daysLeft = Math.ceil(ULTIMATE_DAYS - daysSinceSignup);
        return { onTrial: true, trialTier: "ultimate", daysLeft, nextTier: "pro" };
    }

    if (daysSinceSignup < ULTIMATE_DAYS + PRO_DAYS) {
        const daysLeft = Math.ceil((ULTIMATE_DAYS + PRO_DAYS) - daysSinceSignup);
        return { onTrial: true, trialTier: "pro", daysLeft, nextTier: "free" };
    }

    return { onTrial: false, trialTier: null, daysLeft: 0, nextTier: null };
}
