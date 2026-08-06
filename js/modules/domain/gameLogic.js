(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.BlackjackDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeCard(card) {
    if (!card || typeof card !== 'object') return null;
    return {
      rank: card.rank,
      suit: card.suit,
      color: card.color,
    };
  }

  function cardValue(card) {
    const normalized = normalizeCard(card);
    if (!normalized) return 0;
    if (normalized.rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(normalized.rank)) return 10;
    const numeric = parseInt(normalized.rank, 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  function hiLoValue(card) {
    const value = cardValue(card);
    if (value >= 2 && value <= 6) return 1;
    if (value >= 7 && value <= 9) return 0;
    return -1;
  }

  function handScore(cards) {
    let total = 0;
    let aces = 0;
    for (const card of Array.isArray(cards) ? cards : []) {
      const normalized = normalizeCard(card);
      if (!normalized) continue;
      total += cardValue(normalized);
      if (normalized.rank === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  function isSoft(cards) {
    let total = 0;
    let aces = 0;
    for (const card of Array.isArray(cards) ? cards : []) {
      const normalized = normalizeCard(card);
      if (!normalized) continue;
      total += cardValue(normalized);
      if (normalized.rank === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return aces > 0;
  }

  function isBlackjack(cards) {
    return Array.isArray(cards) && cards.length === 2 && handScore(cards) === 21;
  }

  return {
    cardValue,
    hiLoValue,
    handScore,
    isSoft,
    isBlackjack,
  };
});
