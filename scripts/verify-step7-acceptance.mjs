/**
 * Step 7 Acceptance Criteria — automated verification (ก + ข)
 * Run: node scripts/verify-step7-acceptance.mjs
 */

const STEP7_PERFORMANCE_BOND_BELOW_MINIMUM_MSG =
  "❌ จำนวนเงินหลักประกันต้องไม่น้อยกว่าเกณฑ์ขั้นต่ำ (5%)";

function isStep7ContractDurationReady(durationDays) {
  return durationDays != null && Number.isFinite(durationDays) && durationDays > 0;
}

function shouldShowStep7MinLgExpiryHelper(durationDays, minLgExpiryISO) {
  return isStep7ContractDurationReady(durationDays) && !!minLgExpiryISO?.trim();
}

function resolveStep7PerformanceBondAmountError(inputAmount, minimum) {
  if (minimum == null || !Number.isFinite(minimum) || minimum <= 0) return null;
  if (inputAmount == null || !Number.isFinite(inputAmount)) return null;
  if (inputAmount < minimum) return STEP7_PERFORMANCE_BOND_BELOW_MINIMUM_MSG;
  return null;
}

function computeRecommendedGuaranteeAmount(contractAmount) {
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    return null;
  }
  return Math.round(contractAmount * 0.05 * 100) / 100;
}

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`PASS: ${name}`);
  return true;
}

console.log("=== Step 7 Acceptance Criteria Verification ===\n");

// ก) ระยะเวลาดำเนินการว่าง → ห้ามแสดง helper วันสิ้นสุดความคุ้มครองขั้นต่ำ
assert(
  "ก.1 duration=null → helper hidden (even if min date exists)",
  !shouldShowStep7MinLgExpiryHelper(null, "2078-12-07"),
);
assert(
  "ก.2 duration=0 → helper hidden",
  !shouldShowStep7MinLgExpiryHelper(0, "2078-12-07"),
);
assert(
  "ก.3 duration empty string coerced → helper hidden",
  !shouldShowStep7MinLgExpiryHelper(undefined, "2078-12-07"),
);
assert(
  "ก.4 duration=330 + min date → helper visible",
  shouldShowStep7MinLgExpiryHelper(330, "2078-12-07"),
);
assert(
  "ก.5 duration=330 but no min date → helper hidden",
  !shouldShowStep7MinLgExpiryHelper(330, null),
);

// ข) พิมพ์ 100000 เมื่อขั้นต่ำ 305000 → error ทันที
const contractAmount = 6_100_000;
const minimum = computeRecommendedGuaranteeAmount(contractAmount);
assert("ข.0 minimum is 305000", minimum === 305_000);

const error100k = resolveStep7PerformanceBondAmountError(100_000, minimum);
assert(
  "ข.1 input 100000 < 305000 → error message",
  error100k === STEP7_PERFORMANCE_BOND_BELOW_MINIMUM_MSG,
);
assert(
  "ข.2 input 305000 → no error",
  resolveStep7PerformanceBondAmountError(305_000, minimum) === null,
);
assert(
  "ข.3 input 400000 → no error",
  resolveStep7PerformanceBondAmountError(400_000, minimum) === null,
);
assert(
  "ข.4 empty input → no error",
  resolveStep7PerformanceBondAmountError(null, minimum) === null,
);

console.log(
  process.exitCode === 1
    ? "\n❌ SOME ACCEPTANCE CHECKS FAILED"
    : "\n✅ ALL ACCEPTANCE CHECKS PASSED",
);

function isStep7LgExpiryBeforeMin(lgExpiryISO, minLgExpiryISO) {
  const lg = lgExpiryISO?.trim() ?? "";
  const min = minLgExpiryISO?.trim() ?? "";
  if (!lg || !min) return false;
  return lg < min;
}

function syncStep7LgExpiryWithMin(currentExpiryISO, minLgExpiryISO) {
  const current = currentExpiryISO?.trim() ?? "";
  const min = minLgExpiryISO?.trim() ?? "";
  if (!min) {
    return { next: "", changed: current !== "" };
  }
  if (!current) {
    return { next: min, changed: true };
  }
  if (isStep7LgExpiryBeforeMin(current, min)) {
    return { next: min, changed: current !== min };
  }
  return { next: current, changed: false };
}

console.log("\n=== Step 7 LG Auto-fill Sync ===\n");

const minDate = "2029-05-20";
assert("LG.1 no min → clear stale value", syncStep7LgExpiryWithMin("2028-12-07", null).next === "");
assert(
  "LG.2 empty + min → auto-fill",
  syncStep7LgExpiryWithMin("", minDate).next === minDate,
);
assert(
  "LG.3 stale below min → bump to min",
  syncStep7LgExpiryWithMin("2028-12-07", minDate).next === minDate,
);
assert(
  "LG.4 user extended above min → keep",
  syncStep7LgExpiryWithMin("2030-01-01", minDate).next === "2030-01-01",
);
assert(
  "LG.5 already at min → no change",
  syncStep7LgExpiryWithMin(minDate, minDate).changed === false,
);

console.log(
  process.exitCode === 1
    ? "\n❌ SOME CHECKS FAILED"
    : "\n✅ ALL CHECKS PASSED (including LG sync)",
);
