const assert = require('assert');
const path = require('path');
const { createRequire } = require('module');

const requireFromTest = createRequire(path.join(__dirname, 'gameLogic.test.js'));
const {
  cardValue,
  hiLoValue,
  handScore,
  isSoft,
  isBlackjack,
} = requireFromTest('../js/modules/domain/gameLogic');

function runCase(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

runCase('cardValue returns 11 for Aces', () => {
  assert.strictEqual(cardValue({ rank: 'A' }), 11);
});

runCase('cardValue returns 10 for face cards', () => {
  assert.strictEqual(cardValue({ rank: 'K' }), 10);
  assert.strictEqual(cardValue({ rank: 'Q' }), 10);
  assert.strictEqual(cardValue({ rank: 'J' }), 10);
});

runCase('hiLoValue classifies low cards as +1', () => {
  assert.strictEqual(hiLoValue({ rank: '2' }), 1);
  assert.strictEqual(hiLoValue({ rank: '6' }), 1);
});

runCase('hiLoValue classifies neutral cards as 0', () => {
  assert.strictEqual(hiLoValue({ rank: '8' }), 0);
  assert.strictEqual(hiLoValue({ rank: '9' }), 0);
});

runCase('hiLoValue classifies high cards as -1', () => {
  assert.strictEqual(hiLoValue({ rank: '10' }), -1);
  assert.strictEqual(hiLoValue({ rank: 'A' }), -1);
});

runCase('handScore handles soft totals', () => {
  assert.strictEqual(handScore([{ rank: 'A' }, { rank: '9' }]), 20);
  assert.strictEqual(handScore([{ rank: 'A' }, { rank: 'A' }, { rank: '9' }]), 21);
});

runCase('handScore handles hard totals', () => {
  assert.strictEqual(handScore([{ rank: '10' }, { rank: '7' }]), 17);
});

runCase('isSoft detects soft hands', () => {
  assert.strictEqual(isSoft([{ rank: 'A' }, { rank: '6' }]), true);
  assert.strictEqual(isSoft([{ rank: '10' }, { rank: '9' }]), false);
});

runCase('isBlackjack recognizes natural blackjack', () => {
  assert.strictEqual(isBlackjack([{ rank: 'A' }, { rank: 'K' }]), true);
  assert.strictEqual(isBlackjack([{ rank: '10' }, { rank: '9' }]), false);
  assert.strictEqual(isBlackjack([{ rank: 'A' }, { rank: '6' }]), false);
});

console.log('gameLogic tests passed');
