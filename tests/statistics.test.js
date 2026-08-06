const assert = require('assert');
const path = require('path');
const { createRequire } = require('module');

const requireFromTest = createRequire(path.join(__dirname, 'statistics.test.js'));
const {
  createSessionStore,
  recordEvent,
  recordDecision,
  getDecisionSummary,
} = requireFromTest('../js/modules/analytics/statistics');

function runCase(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

runCase('createSessionStore initializes empty analytics state', () => {
  const store = createSessionStore();
  assert.deepStrictEqual(store.events, []);
  assert.deepStrictEqual(store.decisions, []);
  assert.deepStrictEqual(store.metrics, {
    totalEvents: 0,
    totalDecisions: 0,
    correctDecisions: 0,
    incorrectDecisions: 0,
  });
});

runCase('recordEvent stores a serializable event', () => {
  const store = createSessionStore();
  const event = recordEvent(store, {
    type: 'round_started',
    payload: { roundNumber: 1 },
  });
  assert.strictEqual(store.metrics.totalEvents, 1);
  assert.strictEqual(event.type, 'round_started');
  assert.strictEqual(store.events[0].payload.roundNumber, 1);
});

runCase('recordDecision tracks correctness and context', () => {
  const store = createSessionStore();
  recordDecision(store, {
    action: 'stand',
    expected: 'stand',
    actual: 'stand',
    correct: true,
    context: { dealer: '10', hand: '16', rc: 2, tc: 1 },
  });
  recordDecision(store, {
    action: 'hit',
    expected: 'stand',
    actual: 'hit',
    correct: false,
    context: { dealer: '9', hand: '15', rc: -1, tc: -0.5 },
  });
  const summary = getDecisionSummary(store);
  assert.strictEqual(store.metrics.totalDecisions, 2);
  assert.strictEqual(store.metrics.correctDecisions, 1);
  assert.strictEqual(store.metrics.incorrectDecisions, 1);
  assert.strictEqual(summary.accuracy, 50);
});

console.log('statistics tests passed');
