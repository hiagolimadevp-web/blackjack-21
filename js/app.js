(function () {
  const state = window.BlackjackState;
  with (state) {
    const SUITS = [
    { symbol: "♠", color: "black" },
    { symbol: "♥", color: "red" },
    { symbol: "♦", color: "red" },
    { symbol: "♣", color: "black" },
  ];
  const RANKS = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const NUM_DECKS = 6;
  const BOT_BET = 25;
  const CUT_CARD = 78;

  shoe = [];
  bankroll = 1000;
  currentBet = 0;
  dealer = { cards: [] };
  roundActive = false;
  turnPointer = { seat: 0, hand: 0 };
  runningCount = 0;
  dealerHoleCounted = false;
  countGuessHistory = [];
  flashDeck = [];
  flashRunningCount = 0;
  flashShownCount = 0;
  flashTotalCount = 0;
  insuranceOffered = false;
  playerTookInsurance = false;
  insuranceBet = 0;

  const BOT_POOL = [
    { name: "Ana", avatar: "👩" },
    { name: "Bruno", avatar: "🧔" },
    { name: "Carla", avatar: "👩‍🦰" },
  ];

  USER_SEAT_INDEX = 0;
  seats = [];

  // ---------- Persistência ----------
  function loadState() {
    try {
      const saved = localStorage.getItem("bj21_state");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.bankroll && data.bankroll > 0) bankroll = data.bankroll;
        if (Array.isArray(data.countGuessHistory))
          countGuessHistory = data.countGuessHistory;
        if (Array.isArray(data.roundHistory))
          roundHistory = data.roundHistory;
        if (typeof data.roundNumber === "number")
          roundNumber = data.roundNumber;
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(
        "bj21_state",
        JSON.stringify({
          bankroll,
          countGuessHistory,
          roundHistory,
          roundNumber,
        }),
      );
    } catch (e) {}
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function initializeSeats(numBots, userPos) {
    seats = [];
    const pos = Math.max(0, Math.min(userPos, numBots)); // trava dentro do range válido
    let botIndex = 0;
    for (let i = 0; i <= numBots; i++) {
      if (i === pos) {
        seats.push({
          name: "Você",
          avatar: "🧑",
          isBot: false,
          chips: null,
          hands: [],
        });
      } else {
        const b = BOT_POOL[botIndex++];
        seats.push({
          name: b.name,
          avatar: b.avatar,
          isBot: true,
          chips: 500,
          hands: [],
        });
      }
    }
    USER_SEAT_INDEX = pos;
  }

  const el = (id) => document.getElementById(id);

  function buildShoe() {
    let deck = [];
    for (let d = 0; d < NUM_DECKS; d++) {
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          deck.push({ rank, suit: suit.symbol, color: suit.color });
        }
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    shoe = deck;
    runningCount = 0;
    updateDeckCount();
    updateCountDisplay();
  }

  function drawCard() {
    if (shoe.length === 0) buildShoe();
    updateDeckCount();
    return shoe.pop();
  }

  function updateDeckCount() {
    el("deckCount").textContent = shoe.length + " cartas";
  }

  function cardValue(card) {
    if (card.rank === "A") return 11;
    if (["J", "Q", "K"].includes(card.rank)) return 10;
    return parseInt(card.rank);
  }

  function hiLoValue(card) {
    const v = cardValue(card);
    if (v >= 2 && v <= 6) return 1;
    if (v >= 7 && v <= 9) return 0;
    return -1;
  }

  roundHistory = [];
  roundCardLog = [];
  roundNumber = 0;
  const MAX_HISTORY = 15;

  function countCard(card) {
    runningCount += hiLoValue(card);
    roundCardLog.push({
      rank: card.rank,
      suit: card.suit,
      color: card.color,
      hiLo: hiLoValue(card),
      rcAfter: runningCount,
    });
    updateCountDisplay();
  }

  function revealHoleCard() {
    if (!dealerHoleCounted && dealer.cards.length >= 2) {
      countCard(dealer.cards[1]);
      dealerHoleCounted = true;
    }
  }

  function decksRemaining() {
    return Math.max(shoe.length / 52, 0.25);
  }

  function updateCountDisplay() {
    const el2 = el("countDisplay");
    if (!el2) return;
    if (el("showCountToggle").checked) {
      const tc = (runningCount / decksRemaining()).toFixed(1);
      el2.textContent = `RC ${runningCount > 0 ? "+" : ""}${runningCount} | TC ${tc > 0 ? "+" : ""}${tc}`;
    } else {
      el2.textContent = "🙈 oculta";
    }
    updateBetSuggestion();
  }

  function recordGuess(correct) {
    countGuessHistory.push({ correct });
    if (countGuessHistory.length > 200)
      countGuessHistory = countGuessHistory.slice(-200);
    updateScoreboard();
    saveState();
  }

  function updateScoreboard() {
    const disp = el("scoreboardDisplay");
    if (!disp) return;
    const total = countGuessHistory.length;
    const correct = countGuessHistory.filter((g) => g.correct).length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    let streak = 0;
    for (let i = countGuessHistory.length - 1; i >= 0; i--) {
      if (countGuessHistory[i].correct) streak++;
      else break;
    }
    disp.textContent = `${correct}/${total} (${pct}%) · seq: ${streak}`;
  }

  function betSpreadMultiplier(tc) {
    if (tc < 1) return 1;
    if (tc < 2) return 1;
    if (tc < 3) return 2;
    if (tc < 4) return 4;
    return 6;
  }

  function updateBetSuggestion() {
    const div = el("betSuggestion");
    if (!div) return;
    if (!el("showCountToggle").checked) {
      div.textContent = "";
      return;
    }
    const tc = runningCount / decksRemaining();
    const mult = betSpreadMultiplier(tc);
    div.textContent = `💡 TC ${tc >= 0 ? "+" : ""}${tc.toFixed(1)} → aposta sugerida ≈ ${mult}x unidade`;
  }

  function handScore(cards) {
    let total = 0,
      aces = 0;
    for (const c of cards) {
      total += cardValue(c);
      if (c.rank === "A") aces++;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  function isSoft(cards) {
    let total = 0,
      aces = 0;
    for (const c of cards) {
      total += cardValue(c);
      if (c.rank === "A") aces++;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return aces > 0;
  }

  function isBlackjack(cards) {
    return cards.length === 2 && handScore(cards) === 21;
  }

  // ---------- Estratégia básica (mesma para dicas e bots) ----------
  function getAdvice(cards, dealerUpCard) {
    const dVal = cardValue(dealerUpCard);
    const canDoubleSplit = cards.length === 2;

    if (canDoubleSplit && cards[0].rank === cards[1].rank) {
      const rank = cards[0].rank;
      const val = cardValue(cards[0]);
      if (rank === "A")
        return { action: "split", txt: "Divida os Ases!" };
      if (rank === "8") return { action: "split", txt: "Divida os 8!" };
      if (val === 10)
        return { action: "stand", txt: "Pare. Par de 10 já é ótimo." };
      if (rank === "9") {
        if ([7, 10, 11].includes(dVal))
          return { action: "stand", txt: "Pare com o par de 9." };
        return { action: "split", txt: "Divida os 9." };
      }
      if (rank === "7")
        return dVal <= 7
          ? { action: "split", txt: "Divida os 7." }
          : { action: "hit", txt: "Peça carta." };
      if (rank === "6")
        return dVal <= 6
          ? { action: "split", txt: "Divida os 6." }
          : { action: "hit", txt: "Peça carta." };
      if (rank === "5")
        return dVal <= 9
          ? { action: "double", txt: "Trate como 10: dobre." }
          : { action: "hit", txt: "Peça carta." };
      if (rank === "4")
        return dVal === 5 || dVal === 6
          ? { action: "split", txt: "Pode dividir os 4." }
          : { action: "hit", txt: "Peça carta." };
      if (rank === "2" || rank === "3")
        return dVal <= 7
          ? { action: "split", txt: "Divida." }
          : { action: "hit", txt: "Peça carta." };
    }

    const total = handScore(cards);
    const soft = isSoft(cards);

    if (soft) {
      if (total >= 19)
        return { action: "stand", txt: "Pare. Mão macia forte." };
      if (total === 18) {
        if (dVal >= 9)
          return { action: "hit", txt: "Peça carta. Dealer forte." };
        if (dVal >= 3 && dVal <= 6)
          return canDoubleSplit
            ? { action: "double", txt: "Dobre!" }
            : { action: "hit", txt: "Peça carta." };
        return { action: "stand", txt: "Pare em 18 macio." };
      }
      if (total === 17)
        return dVal >= 3 && dVal <= 6
          ? canDoubleSplit
            ? { action: "double", txt: "Dobre." }
            : { action: "hit", txt: "Peça." }
          : { action: "hit", txt: "Peça carta." };
      if (total === 15 || total === 16)
        return dVal >= 4 && dVal <= 6
          ? canDoubleSplit
            ? { action: "double", txt: "Dobre." }
            : { action: "hit", txt: "Peça." }
          : { action: "hit", txt: "Peça carta." };
      if (total === 13 || total === 14)
        return dVal === 5 || dVal === 6
          ? canDoubleSplit
            ? { action: "double", txt: "Dobre." }
            : { action: "hit", txt: "Peça." }
          : { action: "hit", txt: "Peça carta." };
      return { action: "hit", txt: "Peça carta." };
    }

    if (total >= 17) return { action: "stand", txt: "Pare. 17 ou mais." };
    if (total >= 13 && total <= 16)
      return dVal <= 6
        ? { action: "stand", txt: "Pare. Dealer fraco." }
        : { action: "hit", txt: "Peça carta." };
    if (total === 12)
      return dVal >= 4 && dVal <= 6
        ? { action: "stand", txt: "Pare." }
        : { action: "hit", txt: "Peça carta." };
    if (total === 11)
      return canDoubleSplit
        ? { action: "double", txt: "Dobre! 11 é a melhor mão." }
        : { action: "hit", txt: "Peça carta." };
    if (total === 10)
      return dVal <= 9 && canDoubleSplit
        ? { action: "double", txt: "Dobre." }
        : { action: "hit", txt: "Peça carta." };
    if (total === 9)
      return dVal >= 3 && dVal <= 6 && canDoubleSplit
        ? { action: "double", txt: "Dobre." }
        : { action: "hit", txt: "Peça carta." };
    return { action: "hit", txt: "Peça carta." };
  }

  const actionLabels = {
    hit: "PEDIR",
    stand: "PARAR",
    double: "DOBRAR",
    split: "DIVIDIR",
  };

  function getIndexPlay(cards, dealerUpCard, tc) {
    const isPair = cards.length === 2 && cards[0].rank === cards[1].rank;
    if (isPair) return null;
    const total = handScore(cards);
    if (isSoft(cards)) return null;
    const dVal = cardValue(dealerUpCard);

    if (total === 16 && dVal === 10)
      return tc >= 0
        ? {
            action: "stand",
            txt: `Desvio (TC ${tc.toFixed(1)}): pare no 16 vs 10.`,
          }
        : null;
    if (total === 15 && dVal === 10)
      return tc >= 4
        ? {
            action: "stand",
            txt: `Desvio (TC ${tc.toFixed(1)}): pare no 15 vs 10.`,
          }
        : null;
    if (total === 12 && dVal === 3)
      return tc >= 2
        ? {
            action: "stand",
            txt: `Desvio (TC ${tc.toFixed(1)}): pare no 12 vs 3.`,
          }
        : null;
    if (total === 12 && dVal === 2)
      return tc >= 3
        ? {
            action: "stand",
            txt: `Desvio (TC ${tc.toFixed(1)}): pare no 12 vs 2.`,
          }
        : null;
    if (total === 11 && dVal === 11 && cards.length === 2)
      return tc >= 1
        ? {
            action: "double",
            txt: `Desvio (TC ${tc.toFixed(1)}): dobre 11 vs Ás.`,
          }
        : null;
    if (total === 10 && dVal === 10 && cards.length === 2)
      return tc >= 4
        ? {
            action: "double",
            txt: `Desvio (TC ${tc.toFixed(1)}): dobre 10 vs 10.`,
          }
        : null;
    if (total === 9 && dVal === 2 && cards.length === 2)
      return tc >= 1
        ? {
            action: "double",
            txt: `Desvio (TC ${tc.toFixed(1)}): dobre 9 vs 2.`,
          }
        : null;
    if (total === 9 && dVal === 7 && cards.length === 2)
      return tc >= 3
        ? {
            action: "double",
            txt: `Desvio (TC ${tc.toFixed(1)}): dobre 9 vs 7.`,
          }
        : null;
    return null;
  }

  function refreshTipBox() {
    const tipBox = el("tipBox");
    if (
      !roundActive ||
      turnPointer.seat !== USER_SEAT_INDEX ||
      !el("tipsToggle").checked
    ) {
      tipBox.style.display = "none";
      return;
    }
    const hand = seats[USER_SEAT_INDEX].hands[turnPointer.hand];
    if (!hand || hand.done || dealer.cards.length < 1) {
      tipBox.style.display = "none";
      return;
    }

    let advice = getAdvice(hand.cards, dealer.cards[0]);

    // Sempre considera a contagem real para desvios (Illustrious 18),
    // independentemente de a contagem estar visível ou não.
    const tc = runningCount / decksRemaining();
    const deviation = getIndexPlay(hand.cards, dealer.cards[0], tc);
    if (deviation) advice = deviation;

    tipBox.innerHTML = `💡 Sugestão: <b>${actionLabels[advice.action]}</b> — ${advice.txt}`;
    tipBox.style.display = "block";
  }

  // ---------- Rendering ----------
  function renderCard(card, faceDown = false) {
    const div = document.createElement("div");
    if (faceDown) {
      div.className = "card back";
      return div;
    }
    div.className = "card" + (card.color === "red" ? " red" : "");
    div.innerHTML = `<div class="corner">${card.rank}<br>${card.suit}</div><div class="suit-big">${card.suit}</div><div class="corner bottom">${card.rank}<br>${card.suit}</div>`;
    const showValues =
      el("showCardValuesToggle") && el("showCardValuesToggle").checked;
    if (showValues) {
      const v = hiLoValue(card);
      const badge = document.createElement("div");
      badge.style.cssText = `position:absolute;top:2px;right:2px;width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;background:${v > 0 ? "#1a7f37" : v < 0 ? "#c0272d" : "#777"};`;
      badge.textContent = v > 0 ? "+1" : v < 0 ? "-1" : "0";
      div.appendChild(badge);
    }
    return div;
  }

  function renderAll(revealDealer = false) {
    const dealerCardsEl = el("dealerCards");
    dealerCardsEl.innerHTML = "";
    dealer.cards.forEach((c, idx) => {
      const faceDown = !revealDealer && idx === 1;
      dealerCardsEl.appendChild(renderCard(c, faceDown));
    });
    if (revealDealer || dealer.cards.length === 0) {
      el("dealerScore").textContent = dealer.cards.length
        ? handScore(dealer.cards)
        : "";
    } else {
      el("dealerScore").textContent = dealer.cards.length
        ? cardValue(dealer.cards[0]) + " + ?"
        : "";
    }

    const seatsRow = el("seatsRow");
    seatsRow.innerHTML = "";
    const n = seats.length;
    const mid = (n - 1) / 2;
    const isDesktopView = window.innerWidth > 700;
    seats.forEach((seat, si) => {
      const seatDiv = document.createElement("div");
      seatDiv.className =
        "seat" +
        (si === USER_SEAT_INDEX ? " you-seat" : "") +
        (roundActive && turnPointer.seat === si ? " active-turn" : "");

      // Curva os assentos como se estivessem ao redor da base arredondada
      // da mesa (efeito "meia-lua"): assento do meio fica mais "descido",
      // os das pontas ficam mais próximos do topo reto (onde é o dealer).
      if (isDesktopView && n > 1) {
        const t = si - mid;
        const maxT = mid || 1;
        const curveDepth = 26;
        const offset = curveDepth * (1 - Math.pow(t / maxT, 2));
        seatDiv.style.marginTop = offset.toFixed(1) + "px";
      }

      const header = document.createElement("div");
      header.className = "seat-header";
      header.innerHTML =
        `<span>${seat.avatar} ${seat.name}</span>` +
        (seat.isBot ? `<span class="chips">🪙 ${seat.chips}</span>` : "");
      seatDiv.appendChild(header);

      const handsWrap = document.createElement("div");
      handsWrap.className = "split-hands";
      seat.hands.forEach((hand, hi) => {
        const hDiv = document.createElement("div");
        hDiv.className = "split-hand";
        const label = document.createElement("div");
        label.className = "hand-label";
        const scoreText = hand.cards.length ? handScore(hand.cards) : "";
        const resultText = hand.result ? ` — ${hand.result}` : "";
        label.innerHTML = `<span>${seat.hands.length > 1 ? "Mão " + (hi + 1) : ""}</span><span class="score">${scoreText}${resultText}</span>`;
        const cardsDiv = document.createElement("div");
        cardsDiv.className = "cards";
        hand.cards.forEach((c) => cardsDiv.appendChild(renderCard(c)));
        hDiv.appendChild(label);
        hDiv.appendChild(cardsDiv);
        handsWrap.appendChild(hDiv);
      });
      seatDiv.appendChild(handsWrap);
      seatsRow.appendChild(seatDiv);
    });

    el("bankroll").textContent = bankroll;
    const totalUserBet = seats[USER_SEAT_INDEX]
      ? seats[USER_SEAT_INDEX].hands.reduce((s, h) => s + (h.bet || 0), 0)
      : 0;
    el("currentBetDisplay").textContent = roundActive
      ? totalUserBet
      : currentBet || 0;

    refreshTipBox();
  }

  function setMessage(msg) {
    el("message").textContent = msg;
  }

  // ---------- Round flow ----------
  function startRound() {
    const betVal = parseInt(el("betInput").value);
    if (!betVal || betVal < 5) {
      setMessage("Aposta mínima é 5.");
      return;
    }
    if (betVal > bankroll) {
      setMessage("Saldo insuficiente!");
      return;
    }

    let justShuffled = false;
    if (shoe.length < CUT_CARD) {
      buildShoe();
      justShuffled = true;
    }

    currentBet = betVal;
    bankroll -= betVal;
    dealer = { cards: [] };
    dealerHoleCounted = false;
    insuranceOffered = false;
    playerTookInsurance = false;
    insuranceBet = 0;
    roundCardLog = [];
    roundNumber++;

    seats.forEach((seat) => {
      seat.hands = [
        {
          cards: [],
          bet: seat.isBot ? BOT_BET : betVal,
          done: false,
          isDoubled: false,
          result: null,
          isBlackjack: false,
        },
      ];
    });
    roundActive = true;
    turnPointer = { seat: 0, hand: 0 };

    for (let round = 0; round < 2; round++) {
      seats.forEach((seat) => {
        const c = drawCard();
        seat.hands[0].cards.push(c);
        countCard(c);
      });
      const dc = drawCard();
      dealer.cards.push(dc);
      if (round === 0) countCard(dc);
    }

    el("betArea").style.display = "none";
    el("newRoundControls").style.display = "none";
    el("insuranceArea").style.display = "none";
    setMessage(
      justShuffled
        ? "🔀 Baralho embaralhado (nova contagem começa em 0)!"
        : "",
    );
    renderAll(false);
    saveState();

    // Oferecer Seguro ANTES de saber se o dealer tem Blackjack —
    // é assim que funciona numa mesa de verdade: você decide sobre o
    // seguro só vendo a carta aberta (Ás), sem saber a carta escondida.
    if (dealer.cards[0].rank === "A") {
      insuranceOffered = true;
      el("insuranceArea").style.display = "flex";
      setMessage("Dealer mostrou Ás. Deseja fazer Seguro?");
      return; // espera decisão do jogador
    }

    resolveDealerBlackjackCheck();
  }

  function resolveDealerBlackjackCheck() {
    el("insuranceArea").style.display = "none";
    const dealerBJ = isBlackjack(dealer.cards);

    if (dealerBJ) {
      revealHoleCard();

      // Resolve o seguro primeiro, se foi feito
      if (playerTookInsurance) {
        const payout = insuranceBet * 2;
        bankroll += insuranceBet + payout; // devolve a aposta de seguro + paga 2:1
        setMessage(
          "Dealer tem Blackjack! Seguro pagou 2:1 (+" + payout + ")",
        );
        vibrate([40, 30, 40, 30, 80]);
      }

      seats.forEach((seat, si) => {
        const hand = seat.hands[0];
        const outcome = isBlackjack(hand.cards) ? "push" : "lose";
        applyOutcome(seat, hand, outcome, si === USER_SEAT_INDEX);
      });

      if (!playerTookInsurance) {
        setMessage(
          "Dealer tem Blackjack! " +
            (isBlackjack(seats[USER_SEAT_INDEX].hands[0].cards)
              ? "Você empatou."
              : "Você perdeu."),
        );
        vibrate([80, 40, 80]);
      }
      renderAll(true);
      endRound();
      return;
    }

    // Dealer não tem Blackjack: se o jogador fez seguro, ele perde
    // o valor do seguro (já foi debitado do saldo na hora de apostar).
    if (playerTookInsurance) {
      setMessage(
        "Seguro não pagou (dealer sem Blackjack). Jogo continua...",
      );
    }

    continueAfterInsurance();
  }

  function continueAfterInsurance() {
    el("insuranceArea").style.display = "none";

    seats.forEach((seat) => {
      const hand = seat.hands[0];
      if (isBlackjack(hand.cards)) {
        hand.done = true;
        hand.isBlackjack = true;
      }
    });

    startTurns();
  }

  function takeInsurance() {
    const half = Math.floor(currentBet / 2);
    if (bankroll < half) {
      setMessage("Saldo insuficiente para o Seguro.");
      return;
    }
    bankroll -= half;
    insuranceBet = half;
    playerTookInsurance = true;
    el("bankroll").textContent = bankroll;
    setMessage("Seguro feito! (+" + half + " de aposta de seguro)");
    vibrate(30);
    resolveDealerBlackjackCheck();
  }

  function declineInsurance() {
    playerTookInsurance = false;
    resolveDealerBlackjackCheck();
  }

  function startTurns() {
    turnPointer = { seat: 0, hand: 0 };
    advanceTurn();
  }

  function advanceTurn() {
    while (turnPointer.seat < seats.length) {
      const seat = seats[turnPointer.seat];
      if (turnPointer.hand >= seat.hands.length) {
        turnPointer.seat++;
        turnPointer.hand = 0;
        continue;
      }
      const hand = seat.hands[turnPointer.hand];
      if (hand.done) {
        turnPointer.hand++;
        continue;
      }

      if (seat.isBot) {
        el("gameControls").style.display = "none";
        el("waitingIndicator").style.display = "block";
        el("waitingIndicator").textContent =
          `${seat.avatar} ${seat.name} está jogando...`;
        setMessage(`Vez de ${seat.name}...`);
        renderAll(false);
        setTimeout(() => playBotHandStep(seat, hand), 650);
        return;
      } else {
        el("gameControls").style.display = "flex";
        el("waitingIndicator").style.display = "none";
        setMessage("Sua vez! O que deseja fazer?");
        renderAll(false);
        updateControlsState();
        return;
      }
    }
    dealerTurn();
  }

  // ---------- IA dos bots (usa estratégia básica) ----------
  function playBotHandStep(seat, hand) {
    if (hand.done) {
      turnPointer.hand++;
      advanceTurn();
      return;
    }

    const dealerUp = dealer.cards[0];
    let advice = getAdvice(hand.cards, dealerUp);

    // Bots também respeitam limitações de fichas
    const canDouble =
      hand.cards.length === 2 &&
      seat.chips >= hand.bet &&
      !hand.isDoubled;
    const canSplit =
      hand.cards.length === 2 &&
      cardValue(hand.cards[0]) === cardValue(hand.cards[1]) &&
      hand.cards[0].rank === hand.cards[1].rank &&
      seat.chips >= hand.bet &&
      seat.hands.length < 4;

    if (advice.action === "double" && !canDouble)
      advice = { action: "hit" };
    if (advice.action === "split" && !canSplit)
      advice = { action: handScore(hand.cards) >= 17 ? "stand" : "hit" };

    if (advice.action === "stand") {
      hand.done = true;
      renderAll(false);
      setTimeout(() => {
        turnPointer.hand++;
        advanceTurn();
      }, 450);
      return;
    }

    if (advice.action === "double" && canDouble) {
      seat.chips -= hand.bet;
      hand.bet *= 2;
      hand.isDoubled = true;
      const c = drawCard();
      hand.cards.push(c);
      countCard(c);
      if (handScore(hand.cards) > 21) hand.result = "Estourou";
      hand.done = true;
      renderAll(false);
      setTimeout(() => {
        turnPointer.hand++;
        advanceTurn();
      }, 550);
      return;
    }

    if (advice.action === "split" && canSplit) {
      seat.chips -= hand.bet;
      const card1 = hand.cards[0];
      const card2 = hand.cards[1];
      const newHand = {
        cards: [card2],
        bet: hand.bet,
        done: false,
        isDoubled: false,
        result: null,
        isBlackjack: false,
      };
      hand.cards = [card1];
      const c1 = drawCard();
      hand.cards.push(c1);
      countCard(c1);
      const c2 = drawCard();
      newHand.cards.push(c2);
      countCard(c2);
      seat.hands.splice(turnPointer.hand + 1, 0, newHand);
      renderAll(false);
      // continua na mesma mão (agora com a nova carta)
      setTimeout(() => playBotHandStep(seat, hand), 550);
      return;
    }

    // hit
    const c = drawCard();
    hand.cards.push(c);
    countCard(c);
    renderAll(false);
    const newScore = handScore(hand.cards);
    if (newScore > 21) {
      hand.done = true;
      hand.result = "Estourou";
      setTimeout(() => {
        turnPointer.hand++;
        advanceTurn();
      }, 500);
    } else if (newScore === 21 || hand.isDoubled) {
      hand.done = true;
      setTimeout(() => {
        turnPointer.hand++;
        advanceTurn();
      }, 450);
    } else {
      setTimeout(() => playBotHandStep(seat, hand), 600);
    }
  }

  function getUserActiveHand() {
    if (turnPointer.seat !== USER_SEAT_INDEX) return null;
    return seats[USER_SEAT_INDEX].hands[turnPointer.hand];
  }

  function updateControlsState() {
    const hand = getUserActiveHand();
    if (!hand) return;
    const canDouble =
      hand.cards.length === 2 && bankroll >= hand.bet && !hand.isDoubled;
    const canSplit =
      hand.cards.length === 2 &&
      cardValue(hand.cards[0]) === cardValue(hand.cards[1]) &&
      hand.cards[0].rank === hand.cards[1].rank &&
      bankroll >= hand.bet &&
      seats[USER_SEAT_INDEX].hands.length < 4;
    el("doubleBtn").disabled = !canDouble;
    el("splitBtn").disabled = !canSplit;
    refreshTipBox();
  }

  function hit() {
    const hand = getUserActiveHand();
    if (!hand) return;
    const c = drawCard();
    hand.cards.push(c);
    countCard(c);
    const score = handScore(hand.cards);
    renderAll(false);
    if (score >= 21) {
      hand.done = true;
      if (score > 21) {
        hand.result = "Estourou";
        vibrate([60, 30, 60]);
      }
      renderAll(false);
      turnPointer.hand++;
      advanceTurn();
    } else {
      updateControlsState();
    }
  }

  function stand() {
    const hand = getUserActiveHand();
    if (!hand) return;
    hand.done = true;
    turnPointer.hand++;
    advanceTurn();
  }

  function doubleDown() {
    const hand = getUserActiveHand();
    if (!hand || bankroll < hand.bet) return;
    bankroll -= hand.bet;
    hand.bet *= 2;
    hand.isDoubled = true;
    const c = drawCard();
    hand.cards.push(c);
    countCard(c);
    renderAll(false);
    if (handScore(hand.cards) > 21) {
      hand.result = "Estourou";
      vibrate([60, 30, 60]);
    }
    hand.done = true;
    turnPointer.hand++;
    advanceTurn();
  }

  function split() {
    const hand = getUserActiveHand();
    if (!hand || bankroll < hand.bet) return;
    bankroll -= hand.bet;
    const card1 = hand.cards[0];
    const card2 = hand.cards[1];
    const newHand = {
      cards: [card2],
      bet: hand.bet,
      done: false,
      isDoubled: false,
      result: null,
      isBlackjack: false,
    };
    hand.cards = [card1];
    const c1 = drawCard();
    hand.cards.push(c1);
    countCard(c1);
    const c2 = drawCard();
    newHand.cards.push(c2);
    countCard(c2);
    seats[USER_SEAT_INDEX].hands.splice(turnPointer.hand + 1, 0, newHand);
    renderAll(false);
    updateControlsState();
  }

  function dealerTurn() {
    el("gameControls").style.display = "none";
    el("waitingIndicator").style.display = "block";
    el("waitingIndicator").textContent = "🎩 Dealer está jogando...";
    setMessage("Dealer revelando e jogando...");
    revealHoleCard();
    renderAll(true);

    const allBusted = seats.every((seat) =>
      seat.hands.every((h) => handScore(h.cards) > 21 || h.isBlackjack),
    );
    const playSteps = () => {
      const score = handScore(dealer.cards);
      if (!allBusted && score < 17) {
        const c = drawCard();
        dealer.cards.push(c);
        countCard(c);
        renderAll(true);
        setTimeout(playSteps, 550);
      } else {
        el("waitingIndicator").style.display = "none";
        resolveAll();
      }
    };
    setTimeout(playSteps, 500);
  }

  function applyOutcome(seat, hand, outcome, isUser) {
    const pScore = handScore(hand.cards);
    let label;
    if (pScore > 21) {
      label = "Estourou";
      if (!isUser) seat.chips -= hand.bet;
    } else if (outcome === "blackjack") {
      label = "Blackjack!";
      if (isUser) bankroll += Math.floor(hand.bet * 2.5);
      else seat.chips += Math.floor(hand.bet * 1.5);
      if (isUser) vibrate([30, 40, 30, 40, 100]);
    } else if (outcome === "win") {
      label = "Ganhou!";
      if (isUser) bankroll += hand.bet * 2;
      else seat.chips += hand.bet;
      if (isUser) vibrate([40, 30, 60]);
    } else if (outcome === "push") {
      label = "Empate";
      if (isUser) bankroll += hand.bet;
    } else {
      label = "Perdeu";
      if (!isUser) seat.chips -= hand.bet;
      if (isUser) vibrate([80]);
    }
    hand.result = label;
  }

  function resolveAll() {
    const dealerScore = handScore(dealer.cards);
    const dealerBust = dealerScore > 21;
    let userMessages = [];

    seats.forEach((seat, si) => {
      seat.hands.forEach((hand, hi) => {
        const pScore = handScore(hand.cards);
        let outcome;
        if (pScore > 21) {
          outcome = "lose";
        } else if (hand.isBlackjack) {
          outcome = "blackjack";
        } else if (dealerBust) {
          outcome = "win";
        } else if (pScore > dealerScore) {
          outcome = "win";
        } else if (pScore === dealerScore) {
          outcome = "push";
        } else {
          outcome = "lose";
        }
        applyOutcome(seat, hand, outcome, si === USER_SEAT_INDEX);
        if (si === USER_SEAT_INDEX) {
          const prefix = seat.hands.length > 1 ? `Mão ${hi + 1}: ` : "";
          userMessages.push(prefix + hand.result);
        }
      });
    });

    renderAll(true);
    setMessage(userMessages.join(" | "));
    endRound();
  }

  function endRound() {
    roundActive = false;
    el("gameControls").style.display = "none";
    el("waitingIndicator").style.display = "none";
    el("insuranceArea").style.display = "none";
    el("newRoundControls").style.display = "flex";
    el("tipBox").style.display = "none";

    // Salva a rodada no histórico (pra revisão de contagem depois)
    const userHand = seats[USER_SEAT_INDEX].hands[0];
    roundHistory.push({
      roundNumber,
      cards: roundCardLog.slice(),
      rcEnd: runningCount,
      tcEnd: (runningCount / decksRemaining()).toFixed(1),
      dealerScore: handScore(dealer.cards),
      userResult:
        seats[USER_SEAT_INDEX].hands
          .map((h) => h.result)
          .filter(Boolean)
          .join(", ") || "—",
    });
    if (roundHistory.length > MAX_HISTORY)
      roundHistory = roundHistory.slice(-MAX_HISTORY);

    if (bankroll <= 0) {
      setMessage("Você ficou sem fichas! Recarregando saldo... 💸");
      bankroll = 1000;
    }
    seats.forEach((seat) => {
      if (seat.isBot && seat.chips <= 0) seat.chips = 500;
    });
    saveState();
  }

  function newRound() {
    seats.forEach((seat) => (seat.hands = []));
    dealer = { cards: [] };
    turnPointer = { seat: 0, hand: 0 };
    insuranceOffered = false;
    playerTookInsurance = false;
    insuranceBet = 0;
    el("newRoundControls").style.display = "none";
    el("betArea").style.display = "flex";
    setMessage("Faça sua aposta.");
    renderAll(false);
    updateBetSuggestion();
  }

  // Event listeners
  el("dealBtn").addEventListener("click", startRound);
  el("clearBetBtn").addEventListener("click", () => {
    el("betInput").value = 0;
  });
  el("hitBtn").addEventListener("click", hit);
  el("standBtn").addEventListener("click", stand);
  el("doubleBtn").addEventListener("click", doubleDown);
  el("splitBtn").addEventListener("click", split);
  el("newRoundBtn").addEventListener("click", newRound);
  el("tipsToggle").addEventListener("change", refreshTipBox);
  el("showCountToggle").addEventListener("change", updateCountDisplay);
  el("showCardValuesToggle").addEventListener("change", () =>
    renderAll(dealer.cards.length > 0 && dealerHoleCounted),
  );
  el("checkCountBtn").addEventListener("click", () => {
    el("countCheckPanel").style.display = "block";
    el("countCheckInput").value = "";
    el("countCheckFeedback").textContent = "";
    el("countCheckInput").focus();
  });
  el("countCheckCloseBtn").addEventListener("click", () => {
    el("countCheckPanel").style.display = "none";
  });
  function submitCountCheck() {
    const guessNum = parseInt(el("countCheckInput").value);
    if (isNaN(guessNum)) {
      el("countCheckFeedback").textContent =
        "⚠️ Digite um número válido.";
      return;
    }
    const tc = (runningCount / decksRemaining()).toFixed(1);
    const correct = guessNum === runningCount;
    recordGuess(correct);
    el("countCheckFeedback").textContent = correct
      ? `✅ Acertou! RC = ${runningCount} (TC ≈ ${tc})`
      : `❌ Sua resposta: ${guessNum}. RC real = ${runningCount} (TC ≈ ${tc})`;
  }
  el("countCheckSubmitBtn").addEventListener("click", submitCountCheck);
  el("countCheckInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitCountCheck();
  });
  el("resetScoreBtn").addEventListener("click", () => {
    countGuessHistory = [];
    updateScoreboard();
    saveState();
  });

  el("insuranceYesBtn").addEventListener("click", takeInsurance);
  el("insuranceNoBtn").addEventListener("click", declineInsurance);

  // ---------- Modo Flashcard ----------
  function buildFlashDeck(n) {
    const decksNeeded = Math.max(Math.ceil(n / 52), 1);
    let deck = [];
    for (let d = 0; d < decksNeeded; d++) {
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          deck.push({ rank, suit: suit.symbol, color: suit.color });
        }
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function openFlashcardOverlay() {
    el("flashcardOverlay").style.display = "flex";
    el("flashSetup").style.display = "block";
    el("flashRunning").style.display = "none";
    el("flashResult").style.display = "none";
  }

  function startFlashcards() {
    const n = parseInt(el("flashCount").value);
    const speed = parseInt(el("flashSpeed").value);
    flashDeck = buildFlashDeck(n);
    flashRunningCount = 0;
    flashShownCount = 0;
    flashTotalCount = n;
    el("flashSetup").style.display = "none";
    el("flashResult").style.display = "none";
    el("flashRunning").style.display = "block";
    showNextFlashCard(speed);
  }

  function showNextFlashCard(speed) {
    if (flashShownCount >= flashTotalCount || flashDeck.length === 0) {
      finishFlashcards();
      return;
    }
    const card = flashDeck.pop();
    flashRunningCount += hiLoValue(card);
    flashShownCount++;
    const colorStyle =
      card.color === "red" ? "color:#ff6b6b" : "color:#fff";
    el("flashCardDisplay").innerHTML =
      `<span style="${colorStyle}">${card.rank}${card.suit}</span>`;
    el("flashProgress").textContent =
      `${flashShownCount} / ${flashTotalCount}`;
    setTimeout(() => showNextFlashCard(speed), speed);
  }

  function finishFlashcards() {
    el("flashRunning").style.display = "none";
    el("flashResult").style.display = "block";
    el("flashTotalShown").textContent = flashShownCount;
    el("flashGuessInput").value = "";
    el("flashFeedback").textContent = "";
    el("flashRestartBtn").style.display = "none";
    el("flashCloseBtn2").style.display = "none";
  }

  el("openFlashcardBtn").addEventListener("click", openFlashcardOverlay);
  el("flashStartBtn").addEventListener("click", startFlashcards);
  el("flashCloseBtn").addEventListener("click", () => {
    el("flashcardOverlay").style.display = "none";
  });
  el("flashCloseBtn2").addEventListener("click", () => {
    el("flashcardOverlay").style.display = "none";
  });
  el("flashRestartBtn").addEventListener("click", () => {
    el("flashResult").style.display = "none";
    el("flashSetup").style.display = "block";
  });
  el("flashSubmitBtn").addEventListener("click", () => {
    const guess = parseInt(el("flashGuessInput").value);
    if (isNaN(guess)) {
      el("flashFeedback").textContent = "⚠️ Digite um número válido.";
      return;
    }
    const correct = guess === flashRunningCount;
    recordGuess(correct);
    el("flashFeedback").textContent = correct
      ? `✅ Acertou! Contagem real era ${flashRunningCount}.`
      : `❌ Contagem real era ${flashRunningCount}. Você disse ${guess}.`;
    el("flashRestartBtn").style.display = "inline-block";
    el("flashCloseBtn2").style.display = "inline-block";
  });

  // ---------- Guia de Estudo ----------
  function openGuide() {
    el("guideOverlay").style.display = "flex";
  }
  function closeGuide() {
    el("guideOverlay").style.display = "none";
  }
  el("openGuideBtn").addEventListener("click", openGuide);
  el("closeGuideBtn").addEventListener("click", closeGuide);
  el("guideOverlay").addEventListener("click", (e) => {
    if (e.target === el("guideOverlay")) closeGuide();
  });

  // ---------- Histórico de Rodadas ----------
  function renderHistory() {
    const list = el("historyList");
    if (roundHistory.length === 0) {
      list.innerHTML =
        '<div class="history-empty">Nenhuma rodada jogada ainda nesta sessão.</div>';
      return;
    }
    // mais recente primeiro
    const html = roundHistory
      .slice()
      .reverse()
      .map((r) => {
        const cardsHtml = r.cards
          .map((c) => {
            const badgeColor =
              c.hiLo > 0 ? "#1a7f37" : c.hiLo < 0 ? "#c0272d" : "#777";
            const badgeText = c.hiLo > 0 ? "+1" : c.hiLo < 0 ? "-1" : "0";
            const redClass = c.color === "red" ? " hc-red" : "";
            return `<span class="hist-card${redClass}">${c.rank}${c.suit} <span class="hlbadge" style="background:${badgeColor}">${badgeText}</span></span>`;
          })
          .join("");
        return `
      <div class="history-round">
        <div class="history-round-header">
          <span>Rodada #${r.roundNumber} · Dealer: ${r.dealerScore} · <span class="hr-result">${r.userResult}</span></span>
          <span>RC final: ${r.rcEnd > 0 ? "+" : ""}${r.rcEnd} · TC: ${r.tcEnd > 0 ? "+" : ""}${r.tcEnd}</span>
        </div>
        <div class="history-cards">${cardsHtml}</div>
      </div>`;
      })
      .join("");
    list.innerHTML = html;
  }

  function openHistory() {
    renderHistory();
    el("historyOverlay").style.display = "flex";
  }
  function closeHistory() {
    el("historyOverlay").style.display = "none";
  }
  el("openHistoryBtn").addEventListener("click", openHistory);
  el("historyCloseBtn").addEventListener("click", closeHistory);
  el("historyOverlay").addEventListener("click", (e) => {
    if (e.target === el("historyOverlay")) closeHistory();
  });

  document.querySelectorAll(".guide-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".guide-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".guide-section")
        .forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      const section = el("guide-" + tab.dataset.section);
      if (section) section.classList.add("active");
    });
  });

  document.querySelectorAll("#betArea .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const cur = parseInt(el("betInput").value) || 0;
      el("betInput").value = cur + parseInt(chip.dataset.val);
    });
  });

  // ---------- Configuração inicial ----------
  selectedBotCount = 3;
  selectedPosition = 3; // padrão: último a jogar (comportamento antigo)

  document.querySelectorAll("#setupOverlay .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      el("setupBankrollInput").value = chip.dataset.bankroll;
    });
  });

  function renderPositionButtons() {
    const wrap = el("setupPositionWrap");
    const container = el("setupPositionButtons");
    if (selectedBotCount === 0) {
      wrap.style.display = "none";
      selectedPosition = 0;
      return;
    }
    wrap.style.display = "block";
    if (selectedPosition > selectedBotCount)
      selectedPosition = selectedBotCount;

    container.innerHTML = "";
    for (let i = 0; i <= selectedBotCount; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "botCountBtn" + (i === selectedPosition ? " selected" : "");
      btn.dataset.pos = i;
      if (i === 0) btn.textContent = "1ª (primeiro)";
      else if (i === selectedBotCount)
        btn.textContent = `${i + 1}ª (último)`;
      else btn.textContent = `${i + 1}ª`;
      btn.addEventListener("click", () => {
        selectedPosition = i;
        container
          .querySelectorAll(".botCountBtn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      container.appendChild(btn);
    }
  }

  document.querySelectorAll(".botCountBtn[data-bots]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".botCountBtn[data-bots]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedBotCount = parseInt(btn.dataset.bots);
      renderPositionButtons();
    });
  });

  function startGame() {
    const bankrollVal = parseInt(el("setupBankrollInput").value);
    // Se já tinha saldo salvo e o usuário não mudou muito, respeita o salvo
    if (bankrollVal && bankrollVal > 0) bankroll = bankrollVal;
    initializeSeats(selectedBotCount, selectedPosition);
    dealer = { cards: [] };
    roundActive = false;
    turnPointer = { seat: 0, hand: 0 };

    el("setupOverlay").style.display = "none";
    el("tableWrapper").style.display = "block";
    el("betArea").style.display = "flex";
    el("newRoundControls").style.display = "none";
    el("gameControls").style.display = "none";
    el("insuranceArea").style.display = "none";
    if (!el("betInput").value || parseInt(el("betInput").value) < 5) {
      el("betInput").value = 25;
    }

    buildShoe();
    renderAll(false);
    updateScoreboard();
    const botMsg =
      selectedBotCount === 0
        ? "Só você na mesa hoje."
        : `${selectedBotCount} bot(s) sentaram com você — você joga na posição ${selectedPosition + 1}.`;
    setMessage(`Faça sua aposta para começar! ${botMsg}`);
    saveState();
  }

  el("setupStartBtn").addEventListener("click", startGame);

  el("reconfigureBtn").addEventListener("click", () => {
    el("setupBankrollInput").value = bankroll;
    const numBots = seats.length - 1;
    document.querySelectorAll(".botCountBtn[data-bots]").forEach((b) => {
      b.classList.toggle(
        "selected",
        parseInt(b.dataset.bots) === numBots,
      );
    });
    selectedBotCount = numBots;
    selectedPosition = USER_SEAT_INDEX;
    renderPositionButtons();
    el("tableWrapper").style.display = "none";
    el("setupOverlay").style.display = "flex";
  });

  // Inicializa os botões de posição pro estado padrão (3 bots)
  renderPositionButtons();

  // Carrega estado salvo ao iniciar
  loadState();
  el("setupBankrollInput").value = bankroll;
  updateScoreboard();
  }
})();
