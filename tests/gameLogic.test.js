const assert = require('assert');
const {
  cardValue,
  hiLoValue,
  handScore,
  isSoft,
  isBlackjack,
} = require('../js/modules/domain/gameLogic');

assert.strictEqual(cardValue({ rank: 'A' }), 11);
assert.strictEqual(cardValue({ rank: 'K' }), 10);
assert.strictEqual(hiLoValue({ rank: '2' }), 1);
assert.strictEqual(hiLoValue({ rank: '10' }), -1);
assert.strictEqual(hiLoValue({ rank: '8' }), 0);
assert.strictEqual(handScore([{ rank: 'A' }, { rank: '9' }]), 20);
assert.strictEqual(handScore([{ rank: 'A' }, { rank: 'A' }, { rank: '9' }]), 21);
assert.strictEqual(isSoft([{ rank: 'A' }, { rank: '6' }]), true);
assert.strictEqual(isSoft([{ rank: '10' }, { rank: '9' }]), false);
assert.strictEqual(isBlackjack([{ rank: 'A' }, { rank: 'K' }]), true);
assert.strictEqual(isBlackjack([{ rank: '10' }, { rank: '9' }]), false);

console.log('gameLogic tests passed');
