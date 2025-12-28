export function canCreateTravelRequest({
  session,
  sourceCountry,
  targetCountry,
}) {
  // If target closes borders, request is rejected
  if (targetCountry?.laws?.closeBorders) {
    return { allowed: false, reason: "closeBorders" };
  }

  // If source forbids exit and actor is not EMPEREUR or GRAND_FONC_GLOBAL => rejected
  if (
    sourceCountry?.laws?.forbidExit &&
    !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
  ) {
    return { allowed: false, reason: "forbidExit" };
  }

  return { allowed: true };
}

export function applyEntryFee({ state, citizenId, toCountryId }) {
  const entryFee =
    state.countries.find((c) => c.id === toCountryId)?.laws?.entryVisaFee || 0;
  if (entryFee <= 0) return { ok: true, state };

  const meIdx = state.citizens.findIndex((c) => c.id === citizenId);
  if (meIdx === -1) return { ok: false, reason: "citizen_not_found" };

  if (state.citizens[meIdx].balance < entryFee) {
    return { ok: false, reason: "insufficient_funds" };
  }

  const newCitizens = [...state.citizens];
  newCitizens[meIdx] = {
    ...newCitizens[meIdx],
    balance: newCitizens[meIdx].balance - entryFee,
  };

  const cIdx = state.countries.findIndex((c) => c.id === toCountryId);
  const newCountries = [...state.countries];
  if (cIdx !== -1)
    newCountries[cIdx] = {
      ...newCountries[cIdx],
      treasury: (newCountries[cIdx].treasury || 0) + entryFee,
    };

  return {
    ok: true,
    state: { ...state, citizens: newCitizens, countries: newCountries },
    entryFee,
  };
}

export function validateRequest({ req, session, countries }) {
  const updatedReq = { ...req, validations: { ...req.validations } };
  let moveCitizen = false;
  const isIntra = req.fromCountry === req.toCountry;

  if (isIntra) {
    updatedReq.validations.exit = true;
    updatedReq.validations.entry = true;
    updatedReq.status = "APPROVED";
    moveCitizen = true;
    return { ok: true, updatedReq, moveCitizen };
  }

  if (!updatedReq.validations.exit) {
    // EXIT validation
    const fromCountry = countries.find((c) => c.id === req.fromCountry);
    if (
      fromCountry?.laws?.forbidExit &&
      !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
    ) {
      return { ok: false, error: "forbidExit" };
    }

    if (
      ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role) ||
      session.countryId === req.fromCountry
    ) {
      updatedReq.validations.exit = true;
      return { ok: true, updatedReq, moveCitizen: false };
    }

    return { ok: false, error: "no_exit_authority" };
  } else {
    // ENTRY validation
    const toCountry = countries.find((c) => c.id === req.toCountry);
    if (
      toCountry?.laws?.closeBorders &&
      !["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role)
    ) {
      return { ok: false, error: "closeBorders" };
    }

    if (
      ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(session.role) ||
      session.countryId === req.toCountry
    ) {
      updatedReq.validations.entry = true;
      updatedReq.status = "APPROVED";
      moveCitizen = true;
      return { ok: true, updatedReq, moveCitizen };
    }
    return { ok: false, error: "no_entry_authority" };
  }
}
