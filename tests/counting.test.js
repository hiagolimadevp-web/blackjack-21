const assert = require('assert');
const path = require('path');
const { createRequire } = require('module');

const requireFromTest = createRequire(path.join(__dirname, 'counting.test.js'));
const { hiLoValue, runningCount, trueCount } = requireFromTest('../js/modules/domain/counting');

function runCase(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

runCase('hiLoValue classifies low cards as +1', () => {
  assert.strictEqual(hiLoValue({ rank: '2' }), 1);
  assert.strictEqual(hiLoValue({ rank: '6' }), 1);
});

runCase('hiLoValue classifies neutral cards as 0', () => {
  assert.strictEqual(hiLoValue({ rank: '7' }), 0);
  assert.strictEqual(hiLoValue({ rank: '9' }), 0);
});

runCase('hiLoValue classifies high cards as -1', () => {
  assert.strictEqual(hiLoValue({ rank: '10' }), -1);
  assert.strictEqual(hiLoValue({ rank: 'A' }), -1);
});

runCase('runningCount sums the values of the cards', () => {
  const cards = [{ rank: '2' }, { rank: '10' }, { rank: '7' }];
  assert.strictEqual(runningCount(cards), 1);
});

runCase('trueCount divides the count by the remaining decks', () => {
  const cards = [{ rank: '2' }, { rank: '10' }, { rank: '7' }];
  assert.strictEqual(trueCount(cards, 2), 0.5);
});

console.log('counting tests passed');
