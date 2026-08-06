/*
Contrato de responsabilidade:
- Faz: calcular valores Hi-Lo e manter a lógica pura de contagem de cartas.
- Não faz: manipular DOM, acessar estado global, executar fluxo de rodada ou modificar a interface.
- Dependências permitidas: apenas funções puras e dados de entrada simples.
- Dependências proibidas: DOM, window, localStorage, estado compartilhado e lógica de UI.
*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.BlackjackCounting = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function hiLoValue(card) {
    const rank = card && card.rank;
    if (rank === 'A' || ['J', 'Q', 'K', '10'].includes(rank)) return -1;
    if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
    if (['7', '8', '9'].includes(rank)) return 0;
    const numeric = parseInt(rank, 10);
    if (!Number.isNaN(numeric) && numeric >= 2 && numeric <= 10) {
      if (numeric >= 2 && numeric <= 6) return 1;
      if (numeric >= 7 && numeric <= 9) return 0;
      return -1;
    }
    return 0;
  }

  function runningCount(cards) {
    return (Array.isArray(cards) ? cards : []).reduce(
      (total, card) => total + hiLoValue(card),
      0,
    );
  }

  function trueCount(cards, decksRemaining) {
    const count = runningCount(cards);
    if (!decksRemaining || decksRemaining <= 0) return count;
    return count / decksRemaining;
  }

  return {
    hiLoValue,
    runningCount,
    trueCount,
  };
});
