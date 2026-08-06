(function () {
  var shoe = [];
  var bankroll = 1000;
  var currentBet = 0;
  var dealer = { cards: [] };
  var roundActive = false;
  var turnPointer = { seat: 0, hand: 0 };
  var runningCount = 0;
  var dealerHoleCounted = false;
  var countGuessHistory = [];
  var flashDeck = [];
  var flashRunningCount = 0;
  var flashShownCount = 0;
  var flashTotalCount = 0;
  var insuranceOffered = false;
  var playerTookInsurance = false;
  var insuranceBet = 0;
  var roundHistory = [];
  var roundCardLog = [];
  var roundNumber = 0;
  var USER_SEAT_INDEX = 0;
  var seats = [];
  var selectedBotCount = 3;
  var selectedPosition = 3;

  window.BlackjackState = {
    get shoe() { return shoe; },
    set shoe(value) { shoe = value; },
    get bankroll() { return bankroll; },
    set bankroll(value) { bankroll = value; },
    get currentBet() { return currentBet; },
    set currentBet(value) { currentBet = value; },
    get dealer() { return dealer; },
    set dealer(value) { dealer = value; },
    get roundActive() { return roundActive; },
    set roundActive(value) { roundActive = value; },
    get turnPointer() { return turnPointer; },
    set turnPointer(value) { turnPointer = value; },
    get runningCount() { return runningCount; },
    set runningCount(value) { runningCount = value; },
    get dealerHoleCounted() { return dealerHoleCounted; },
    set dealerHoleCounted(value) { dealerHoleCounted = value; },
    get countGuessHistory() { return countGuessHistory; },
    set countGuessHistory(value) { countGuessHistory = value; },
    get flashDeck() { return flashDeck; },
    set flashDeck(value) { flashDeck = value; },
    get flashRunningCount() { return flashRunningCount; },
    set flashRunningCount(value) { flashRunningCount = value; },
    get flashShownCount() { return flashShownCount; },
    set flashShownCount(value) { flashShownCount = value; },
    get flashTotalCount() { return flashTotalCount; },
    set flashTotalCount(value) { flashTotalCount = value; },
    get insuranceOffered() { return insuranceOffered; },
    set insuranceOffered(value) { insuranceOffered = value; },
    get playerTookInsurance() { return playerTookInsurance; },
    set playerTookInsurance(value) { playerTookInsurance = value; },
    get insuranceBet() { return insuranceBet; },
    set insuranceBet(value) { insuranceBet = value; },
    get roundHistory() { return roundHistory; },
    set roundHistory(value) { roundHistory = value; },
    get roundCardLog() { return roundCardLog; },
    set roundCardLog(value) { roundCardLog = value; },
    get roundNumber() { return roundNumber; },
    set roundNumber(value) { roundNumber = value; },
    get USER_SEAT_INDEX() { return USER_SEAT_INDEX; },
    set USER_SEAT_INDEX(value) { USER_SEAT_INDEX = value; },
    get seats() { return seats; },
    set seats(value) { seats = value; },
    get selectedBotCount() { return selectedBotCount; },
    set selectedBotCount(value) { selectedBotCount = value; },
    get selectedPosition() { return selectedPosition; },
    set selectedPosition(value) { selectedPosition = value; },
  };
})();
