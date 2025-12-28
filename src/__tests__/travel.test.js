import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PostOfficeView from "../components/views/PostOfficeView";
import { canCreateTravelRequest, applyEntryFee } from "../lib/travelUtils";

describe("travelUtils", () => {
  test("rejects when target closeBorders", () => {
    const res = canCreateTravelRequest({
      session: { role: "CITOYEN" },
      sourceCountry: { id: "A" },
      targetCountry: { id: "B", laws: { closeBorders: true } },
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("closeBorders");
  });

  test("rejects when source forbidExit for normal citizen", () => {
    const res = canCreateTravelRequest({
      session: { role: "CITOYEN" },
      sourceCountry: { id: "A", laws: { forbidExit: true } },
      targetCountry: { id: "B" },
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("forbidExit");
  });

  test("allows EMPEREUR despite forbidExit", () => {
    const res = canCreateTravelRequest({
      session: { role: "EMPEREUR" },
      sourceCountry: { id: "A", laws: { forbidExit: true } },
      targetCountry: { id: "B" },
    });
    expect(res.allowed).toBe(true);
  });

  test("applyEntryFee deducts and pays treasury", () => {
    const state = {
      citizens: [{ id: "u1", balance: 100 }],
      countries: [{ id: "B", treasury: 10, laws: { entryVisaFee: 25 } }],
    };
    const res = applyEntryFee({ state, citizenId: "u1", toCountryId: "B" });
    expect(res.ok).toBe(true);
    expect(res.state.citizens[0].balance).toBe(75);
    expect(res.state.countries.find((c) => c.id === "B").treasury).toBe(35);
    expect(res.entryFee).toBe(25);
  });

  test("applyEntryFee fails on insufficient funds", () => {
    const state = {
      citizens: [{ id: "u1", balance: 5 }],
      countries: [{ id: "B", treasury: 0, laws: { entryVisaFee: 10 } }],
    };
    const res = applyEntryFee({ state, citizenId: "u1", toCountryId: "B" });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("insufficient_funds");
  });
});

describe("PostOfficeView integration", () => {
  test("validates exit then entry and moves citizen", () => {
    const citizen = { id: "u1", name: "Alice", countryId: "A" };
    const from = { id: "A", name: "Pays A", laws: {} };
    const to = { id: "B", name: "Pays B", laws: {} };

    const req = {
      id: "r1",
      citizenId: "u1",
      citizenName: "Alice",
      fromCountry: "A",
      toCountry: "B",
      toRegion: "Frontière",
      status: "PENDING",
      validations: { exit: false, entry: false },
    };

    const onUpdateRequests = jest.fn();
    const onUpdateCitizen = jest.fn();

    render(
      <PostOfficeView
        travelRequests={[req]}
        countries={[from, to]}
        citizens={[citizen]}
        session={{ role: "EMPEREUR", countryId: "A" }}
        onUpdateRequests={onUpdateRequests}
        onUpdateCitizen={onUpdateCitizen}
      />
    );

    // The card shows Valider SORTIE
    const btn = screen.getByText(/Valider SORTIE/i);
    fireEvent.click(btn);

    // After clicking, exit should be validated (onUpdateRequests called with updated request)
    expect(onUpdateRequests).toHaveBeenCalled();
    const firstCalls = onUpdateRequests.mock.calls;
    const firstArg = firstCalls[firstCalls.length - 1][0];
    expect(firstArg.find((r) => r.id === "r1")).toBeDefined();

    // Simulate second click: now it should present Valider ENTRÉE; click again
    // Re-render with updated request (exit validated)
    const updatedReq = { ...req, validations: { exit: true, entry: false } };
    render(
      <PostOfficeView
        travelRequests={[updatedReq]}
        countries={[from, to]}
        citizens={[citizen]}
        session={{ role: "EMPEREUR", countryId: "B" }}
        onUpdateRequests={onUpdateRequests}
        onUpdateCitizen={onUpdateCitizen}
      />
    );

    const btn2 = screen.getByText(/Valider ENTRÉE/i);
    fireEvent.click(btn2);

    expect(onUpdateCitizen).toHaveBeenCalledWith("u1", "B");

    // After final approval, the request should be removed from active requests
    const calls = onUpdateRequests.mock.calls;
    const lastArg = calls[calls.length - 1][0];
    expect(lastArg.find((r) => r.id === "r1")).toBeUndefined();
  });
});
