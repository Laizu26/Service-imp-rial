const { validateRequest } = require("../src/lib/travelUtils");

function assert(condition, msg) {
  if (!condition) {
    console.error("Assertion failed:", msg);
    process.exit(1);
  }
}

const countries = [
  { id: "A", name: "A", laws: { forbidExit: true } },
  { id: "B", name: "B", laws: { closeBorders: false } },
];

const req = {
  id: "r1",
  citizenId: "u1",
  citizenName: "X",
  fromCountry: "A",
  toCountry: "B",
  toRegion: "Frontière",
  status: "PENDING",
  validations: { exit: false, entry: false },
};

// Normal clerk (not EMPEREUR) should be blocked by forbidExit
let out = validateRequest({
  req,
  session: { role: "ADMIN_LOCAL", countryId: "A" },
  countries,
});
assert(
  out.ok === false && out.error === "forbidExit",
  "local admin should be blocked by forbidExit"
);
console.log(
  "OK: forbidExit blocks local admin when not EMPEREUR/GRAND_FONC_GLOBAL"
);

// EMPEREUR can validate exit
out = validateRequest({
  req,
  session: { role: "EMPEREUR", countryId: "Z" },
  countries,
});
assert(
  out.ok === true && out.updatedReq.validations.exit === true,
  "EMPEREUR should validate exit"
);
console.log("OK: EMPEREUR validates exit");

// GRAND_FONC_GLOBAL can validate exit
out = validateRequest({
  req,
  session: { role: "GRAND_FONC_GLOBAL", countryId: "Z" },
  countries,
});
assert(
  out.ok === true && out.updatedReq.validations.exit === true,
  "GRAND_FONC_GLOBAL should validate exit"
);
console.log("OK: GRAND_FONC_GLOBAL validates exit");

// Now simulate exit validated -> entry validation but target closes borders
const req2 = { ...req, validations: { exit: true, entry: false } };
const countries2 = [
  { id: "A", name: "A", laws: {} },
  { id: "B", name: "B", laws: { closeBorders: true } },
];

out = validateRequest({
  req: req2,
  session: { role: "EMPEREUR" },
  countries: countries2,
});
assert(
  out.ok === true && out.updatedReq.validations.entry === true,
  "EMPEREUR should bypass closeBorders and validate entry"
);
console.log("OK: EMPEREUR bypasses closeBorders and validates entry");

// Normal clerk should be blocked by closeBorders
out = validateRequest({
  req: req2,
  session: { role: "ADMIN_LOCAL", countryId: "B" },
  countries: countries2,
});
assert(
  out.ok === false && out.error === "closeBorders",
  "Local clerk should be blocked by closeBorders"
);
console.log("OK: closeBorders blocks local clerk on entry");

console.log("\nPostOffice validation smoke tests passed");
process.exit(0);
