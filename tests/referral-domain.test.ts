import assert from "node:assert/strict";
import { normalizeReferralDomain } from "../src/services/referral-domain";

assert.equal(normalizeReferralDomain("https://www.example.vn/path"), "example.vn");
assert.equal(normalizeReferralDomain("EXAMPLE.VN:443"), "example.vn");
assert.equal(normalizeReferralDomain("example.vn, proxy.local"), "example.vn");
assert.equal(normalizeReferralDomain("not a domain"), "");

console.log("Referral domain normalization tests passed.");
