/*
Responsabilidade:
- Registrar eventos de sessão, decisões do jogador, acertos/erros e contexto de decisão em formato puro e serializável.
Dependências permitidas:
- Dados recebidos por parâmetro, funções puras e objetos simples.
Dependências proibidas:
- DOM, window, localStorage, UI, renderização e estado global compartilhado.
Consumidores do módulo:
- Performance Analyzer, Coach, Dashboard, Histórico detalhado e futuras camadas de analytics.
*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.BlackjackStatistics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createSessionStore() {
    return {
      events: [],
      decisions: [],
      metrics: {
        totalEvents: 0,
        totalDecisions: 0,
        correctDecisions: 0,
        incorrectDecisions: 0,
      },
    };
  }

  function recordEvent(store, event) {
    const snapshot = {
      type: event && event.type ? event.type : 'event',
      timestamp: event && event.timestamp ? event.timestamp : Date.now(),
      payload: event && event.payload ? event.payload : {},
    };
    store.events.push(snapshot);
    store.metrics.totalEvents += 1;
    return snapshot;
  }

  function recordDecision(store, decision) {
    const snapshot = {
      action: decision && decision.action ? decision.action : 'unknown',
      expected: decision && decision.expected ? decision.expected : null,
      actual: decision && decision.actual ? decision.actual : null,
      correct: Boolean(decision && decision.correct),
      context: decision && decision.context ? decision.context : {},
      timestamp: decision && decision.timestamp ? decision.timestamp : Date.now(),
    };
    store.decisions.push(snapshot);
    store.metrics.totalDecisions += 1;
    if (snapshot.correct) {
      store.metrics.correctDecisions += 1;
    } else {
      store.metrics.incorrectDecisions += 1;
    }
    return snapshot;
  }

  function getDecisionSummary(store) {
    return {
      total: store.metrics.totalDecisions,
      correct: store.metrics.correctDecisions,
      incorrect: store.metrics.incorrectDecisions,
      accuracy: store.metrics.totalDecisions > 0
        ? Math.round((store.metrics.correctDecisions / store.metrics.totalDecisions) * 100)
        : 0,
    };
  }

  return {
    createSessionStore,
    recordEvent,
    recordDecision,
    getDecisionSummary,
  };
});
