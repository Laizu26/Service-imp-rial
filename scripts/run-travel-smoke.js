const {
  canCreateTravelRequest,
  applyEntryFee,
} = require("../src/lib/travelUtils");

function assert(condition, msg) {
  if (!condition) {
    console.error("Assertion failed:", msg);
    process.exit(1);
  }
}

// Test 1: closeBorders
let res = canCreateTravelRequest({
  session: { role: "CITOYEN" },
  sourceCountry: { id: "A" },
  targetCountry: { id: "B", laws: { closeBorders: true } },
});
assert(
  res.allowed === false && res.reason === "closeBorders",
  "closeBorders should reject"
);
console.log("OK: closeBorders rejects");

// Test 2: forbidExit blocks citizen
res = canCreateTravelRequest({
  session: { role: "CITOYEN" },
  sourceCountry: { id: "A", laws: { forbidExit: true } },
  targetCountry: { id: "B" },
});
assert(
  res.allowed === false && res.reason === "forbidExit",
  "forbidExit should reject citizen"
);
console.log("OK: forbidExit blocks citizen");

// Test 3: EMPEREUR bypass
res = canCreateTravelRequest({
  session: { role: "EMPEREUR" },
  sourceCountry: { id: "A", laws: { forbidExit: true } },
  targetCountry: { id: "B" },
});
assert(res.allowed === true, "EMPEREUR should bypass forbidExit");
console.log("OK: EMPEREUR bypasses forbidExit");

// Test 4: applyEntryFee normal
let state = {
  citizens: [{ id: "u1", balance: 100 }],
  countries: [{ id: "B", treasury: 10, laws: { entryVisaFee: 25 } }],
};
let feeRes = applyEntryFee({ state, citizenId: "u1", toCountryId: "B" });
assert(feeRes.ok === true, "applyEntryFee should succeed");
assert(feeRes.state.citizens[0].balance === 75, "citizen balance deducted");
assert(
  feeRes.state.countries.find((c) => c.id === "B").treasury === 35,
  "treasury increased"
);
console.log("OK: entry fee applied");

// Test 5: insufficient funds
state = {
  citizens: [{ id: "u1", balance: 5 }],
  countries: [{ id: "B", treasury: 0, laws: { entryVisaFee: 10 } }],
};
feeRes = applyEntryFee({ state, citizenId: "u1", toCountryId: "B" });
assert(
  feeRes.ok === false && feeRes.reason === "insufficient_funds",
  "should fail on insufficient funds"
);
console.log("OK: insufficient funds detected");

console.log("\nAll smoke checks passed");
process.exit(0);
