export function computeResourcePrice(resource, companies, tradeContracts, activeEvents, settings) {
  const supply = (companies || []).reduce((sum, c) => {
    const p = (c.productions || []).find((pr) => pr.resourceId === resource.id);
    return sum + (p ? p.outputPerCycle : 0);
  }, 0);
  const demand = (tradeContracts || [])
    .filter((c) => c.resourceId === resource.id && c.status === "active")
    .reduce((sum, c) => sum + c.quantity, 0);
  const K = settings?.priceSensitivity ?? 0.3;
  const raw = resource.basePrice * (1 + K * (demand - supply) / (demand + supply + 1));
  const modifier = (activeEvents || [])
    .filter((e) => e.active && (!e.resourceId || e.resourceId === resource.id))
    .reduce((prod, e) => prod * (e.modifier ?? 1), 1);
  const min = resource.basePrice * (settings?.minPriceMult ?? 0.2);
  const max = resource.basePrice * (settings?.maxPriceMult ?? 5);
  return Math.round(Math.min(max, Math.max(min, raw * modifier)) * 10) / 10;
}

export function computeSupplyDemand(resourceId, companies, tradeContracts) {
  const supply = (companies || []).reduce((sum, c) => {
    const p = (c.productions || []).find((pr) => pr.resourceId === resourceId);
    return sum + (p ? p.outputPerCycle : 0);
  }, 0);
  const demand = (tradeContracts || [])
    .filter((c) => c.resourceId === resourceId && c.status === "active")
    .reduce((sum, c) => sum + c.quantity, 0);
  return { supply, demand };
}

export function computeTransformationCost(recipe, currentPrices) {
  return (recipe.inputs || []).reduce((sum, input) => {
    const price = (currentPrices || {})[input.resourceId] ?? 0;
    return sum + price * input.qty;
  }, 0);
}
