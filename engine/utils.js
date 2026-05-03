window.TeyvatUtils = (() => {
  const rnd = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (value, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, value));

  function pickWeighted(items, weightFn) {
    if (!items || items.length === 0) return null;
    const weights = items.map(weightFn);
    const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
    if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];
    let cursor = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      cursor -= Math.max(0, weights[i]);
      if (cursor <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function createStars(count = 110) {
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      x: (index * 37.17 + 3) % 100,
      y: (index * 23.71 + 7) % 100,
      size: (index % 3) + 1,
      dur: (index % 4) + 2.5,
      delay: (index % 5) * 0.55,
      opacity: ((index % 8) / 8) * 0.65 + 0.08,
    }));
  }

  return {
    rnd,
    pick,
    clamp,
    pickWeighted,
    createStars,
  };
})();
