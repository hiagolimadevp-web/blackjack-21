# blackjack-21

Blackjack 21 completo em HTML - Mesa com bots, contagem Hi-Lo, estratégia básica, seguro e modo treino.

## Testes

Este projeto usa o Node.js Test Runner como padrão oficial para validar módulos JavaScript puros.

### Executar todos os testes

```bash
npm test
```

### Executar testes em modo observação

```bash
npm run test:watch
```

### Estrutura de testes

Os testes ficam em [tests](tests):

- [tests/gameLogic.test.js](tests/gameLogic.test.js)
- [tests/counting.test.js](tests/counting.test.js)
- [tests/statistics.test.js](tests/statistics.test.js)

No futuro, novos testes podem ser organizados em subpastas por módulo conforme a quantidade crescer.
