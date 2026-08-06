# Arquitetura do projeto Blackjack 21

## 1. Visão geral da arquitetura

Este projeto é uma aplicação web estática de treinamento de Blackjack, com interface em HTML, estilo em CSS e lógica em JavaScript. Atualmente, a aplicação já foi organizada em arquivos separados para apresentação e comportamento, mas ainda preserva uma estrutura monolítica em termos de responsabilidade lógica.

O objetivo desta arquitetura é permitir evolução incremental sem quebrar o comportamento atual do jogo. A proposta é manter a aplicação simples, com baixo acoplamento, alta legibilidade e clareza de responsabilidades, sem introduzir framework desnecessário.

### Princípios arquiteturais

- Simplicidade primeiro: evitar abstrações complexas antes do necessário.
- Baixo acoplamento: cada módulo deve ter uma responsabilidade clara e depender de interfaces simples.
- Alta coesão: funções relacionadas devem permanecer agrupadas.
- Preservação de comportamento: refatorações não devem alterar regras, fluxo ou aparência do jogo.
- Evolução incremental: dividir em módulos de maneira segura, em etapas pequenas e verificáveis.

### Estilo arquitetural adotado

A arquitetura proposta é uma estrutura modular em camadas, com:

- camada de domínio: regras do jogo, estratégia, baralho, contagem e estado;
- camada de apresentação: renderização da interface, eventos e manipulação do DOM;
- camada de aplicação: orquestração do fluxo de rodada e setup;
- camada de infraestrutura: persistência local e integração com o browser.

Esta abordagem é suficiente para o porte atual do projeto e escala bem para futuras funcionalidades como coach, estatísticas, histórico avançado e modo de estudo.

---

## 2. Responsabilidade de cada módulo

A aplicação deve ser organizada em módulos com responsabilidades bem delimitadas.

### 2.1 Módulo de constantes e configuração
Responsável por:
- definir constantes do jogo, como número de baralhos, valores de aposta, limites de corte e pool de bots;
- manter rótulos e textos fixos usados por várias partes do sistema;
- centralizar valores configuráveis para facilitar ajustes futuros.

### 2.2 Módulo de estado
Responsável por:
- guardar o estado da sessão atual: saldo, rodadas, dealer, mãos, turnos, contagem, seguro e histórico;
- servir como ponto único de verdade para o restante do sistema;
- expor operações simples de leitura e atualização do estado.

### 2.3 Módulo de persistência
Responsável por:
- salvar e restaurar o estado do jogo no localStorage;
- manter compatibilidade com a experiência do usuário entre recarregamentos;
- encapsular a lógica de serialização e recuperação.

### 2.4 Módulo de baralho e rodada
Responsável por:
- criar e embaralhar o shoe;
- distribuir cartas;
- controlar o ciclo de compra de cartas e manipulação do baralho.

### 2.5 Módulo de contagem
Responsável por:
- aplicar a contagem Hi-Lo;
- calcular o running count e true count;
- atualizar a UI de contagem e as sugestões de aposta.

### 2.6 Módulo de regras do jogo
Responsável por:
- definir pontuação de mãos;
- identificar blackjack, mãos macias e mãos duras;
- fornecer estratégia básica e desvios com base na contagem.

### 2.7 Módulo de interface e renderização
Responsável por:
- criar e atualizar elementos do DOM;
- renderizar dealer, assentos, cartas, mensagens, contadores e histórico;
- abstrair o acesso direto ao DOM para os demais módulos.

### 2.8 Módulo de fluxo de jogo
Responsável por:
- controlar o ciclo completo de uma rodada;
- coordenar início da rodada, ações do usuário, turnos dos bots, dealer, seguro e resolução;
- orquestrar a comunicação entre estado, regras e interface.

### 2.9 Módulo de setup e configuração da mesa
Responsável por:
- configurar saldo inicial;
- selecionar número de bots e posição do jogador;
- montar a mesa inicial e iniciar a partida.

### 2.10 Módulo de recursos de estudo
Responsável por:
- tratar flashcards, guia integrado, checagem de contagem e histórico de rodadas;
- manter esse conjunto de recursos isolado do fluxo principal do jogo.

### 2.11 Módulo de inicialização
Responsável por:
- montar a aplicação;
- registrar listeners de eventos;
- conectar cada módulo à sua integração inicial.

---

## 3. Fluxo de dados entre os módulos

O fluxo de dados deve ser simples e previsível.

### Fluxo principal

1. O módulo de setup prepara a mesa e define o estado inicial.
2. O módulo de baralho fornece cartas para a rodada.
3. O módulo de contagem atualiza a contagem conforme as cartas são distribuídas.
4. O módulo de regras avalia as mãos e produz decisões estratégicas.
5. O módulo de fluxo de jogo coordena as ações do usuário e dos bots.
6. O módulo de interface renderiza o estado atualizado no DOM.
7. O módulo de persistência salva periodicamente o estado.

### Exemplo de fluxo de uma rodada

```text
Setup → Estado inicial → Baralho → Distribuição → Contagem → Regras → Fluxo de jogo → Renderização → Persistência
```

### Fluxo de eventos

- Interação do usuário (clicar em botões) passa pelo módulo de inicialização ou de eventos.
- O módulo de fluxo de jogo recebe a ação e altera o estado.
- O módulo de interface renderiza a nova situação.
- O módulo de persistência registra mudanças relevantes.

### Regras de fluxo

- O módulo de interface não deve decidir regras de blackjack.
- O módulo de regras não deve manipular DOM.
- O módulo de estado não deve conter lógica de renderização.
- O módulo de fluxo de jogo deve orquestrar, não implementar detalhes de UI.

---

## 4. Dependências permitidas e proibidas

### Dependências permitidas

- O módulo de estado pode ser consumido por quase todos os demais módulos.
- O módulo de regras pode ser usado por fluxo de jogo, interface e recursos de estudo.
- O módulo de interface pode consumir estado e regras para renderizar.
- O módulo de fluxo de jogo pode depender de estado, regras, baralho, contagem e interface.
- O módulo de persistência pode depender do estado.

### Dependências proibidas

- O módulo de regras não deve depender de DOM.
- O módulo de interface não deve conter lógica de decisão de jogo.
- O módulo de fluxo de jogo não deve manipular diretamente o localStorage sem passar pelo módulo de persistência.
- O módulo de baralho não deve decidir a estratégia do jogador.
- O módulo de contagem não deve ter responsabilidade de renderização direta de cartas ou layout.
- Nenhum módulo deve depender de outro módulo de forma circular.

### Regra prática

Se uma função precisar de DOM, ela deve ficar em interface. Se precisar de regra de jogo, deve ficar em regras. Se precisar alterar o estado da partida, deve passar pelo estado ou pelo fluxo de jogo.

---

## 5. Convenções de código

### 5.1 Nomes de arquivos

- usar nomes descritivos e em lowercase;
- preferir arquivos curtos e específicos;
- exemplos:
  - constants.js
  - state.js
  - deck.js
  - rules.js
  - game.js
  - ui.js
  - persistence.js

### 5.2 Nomes de funções

- usar camelCase;
- nomes devem indicar ação ou intenção clara;
- exemplos:
  - startRound
  - renderAll
  - updateCountDisplay
  - applyOutcome
  - saveState

### 5.3 Nomes de variáveis

- usar camelCase para variáveis e parâmetros;
- usar UPPER_SNAKE_CASE para constantes verdadeiras;
- evitar nomes genéricos como data, value, item sem contexto.

### 5.4 Organização interna

- manter funções pequenas e com uma responsabilidade única;
- separar lógica pura de lógica com efeitos colaterais;
- preferir funções retornando valores a funções com muitos efeitos laterais;
- manter comentários apenas quando agregarem clareza técnica.

### 5.5 Estrutura de módulo

Cada módulo deve seguir um padrão consistente:

```js
// 1. imports / dependências
// 2. constantes internas
// 3. funções auxiliares
// 4. funções exportadas ou expostas
// 5. inicialização, se houver
```

### 5.6 Padrão de estado

- todo estado mutável deve passar por um único módulo de estado;
- não criar estado paralelo disperso em vários módulos;
- qualquer leitura de estado deve ser explícita.

---

## 6. Estrutura de pastas recomendada

A estrutura abaixo é simples, profissional e adequada ao projeto atual.

```text
/blackjack-21
  /css
    style.css
  /js
    app.js                  # ponto de entrada principal
    /modules
      /core
        constants.js
        state.js
        persistence.js
      /domain
        deck.js
        counting.js
        rules.js
        game.js
        setup.js
      /ui
        dom.js
        renderer.js
        events.js
      /features
        flashcards.js
        guide.js
        history.js
      /bootstrap
        init.js
  /index.html
  /README.md
  /ARCHITECTURE.md
```

### Observações sobre a estrutura

- manter arquivos pequenos e focados;
- evitar uma pasta genérica com dezenas de funções soltas;
- se um módulo crescer demais, dividi-lo por subtema.

---

## 7. Plano de evolução da arquitetura para as próximas versões

A evolução deve ser gradual e segura.

### Versão atual
- aplicação estática com HTML, CSS e JavaScript separados;
- lógica concentrada em um único arquivo de comportamento;
- comportamento preservado e estável.

### Fase 1 — organização estrutural
- criar módulos básicos para constantes, estado, persistência e regras;
- manter o jogo funcionando exatamente como hoje;
- não alterar regras nem UX.

### Fase 2 — separação do fluxo de jogo
- mover o ciclo de rodada para um módulo dedicado;
- deixar a interface mais fina e mais orientada a eventos.

### Fase 3 — isolamento de UI
- centralizar renderização e manipulação do DOM em módulos próprios;
- reduzir o espalhamento de código no fluxo de jogo.

### Fase 4 — recursos avançados
- adicionar coach, estatísticas, modo de estudo e revisão de mãos;
- garantir que as novas camadas utilizem os mesmos princípios de modularização.

### Fase 5 — testabilidade e manutenção
- introduzir testes de regras e fluxo de jogo;
- separar lógica pura da lógica dependente de DOM;
- tornar o sistema mais previsível e menos frágil.

### Diretriz de evolução

Não introduzir novas camadas antes de consolidar as atuais. Cada etapa deve ser pequena, verificável e documentada.

---

## 8. Riscos da refatoração e como evitá-los

### Risco 1 — alterar comportamento sem perceber
Como o app possui regras de blackjack, contagem e saldo, pequenas mudanças podem quebrar o jogo.

Mitigação:
- refatorar em etapas pequenas;
- manter testes manuais por rodada após cada etapa;
- evitar mudanças simultâneas de regra e estrutura.

### Risco 2 — acoplamento excessivo entre módulos
Se o fluxo de jogo manipular DOM diretamente, a manutenção fica difícil.

Mitigação:
- deixar interface em módulos dedicados;
- passar dados por funções ou estado, não por efeitos indiretos.

### Risco 3 — estado espalhado
Se várias partes do código alterarem o estado de forma independente, o sistema fica inconsistente.

Mitigação:
- centralizar estado em um único módulo;
- usar funções de atualização bem definidas.

### Risco 4 — dependências circulares
Se módulos dependerem uns dos outros em loop, a manutenção fica complexa.

Mitigação:
- manter dependência unidirecional;
- usar o fluxo de jogo como ponto de orquestração principal.

### Risco 5 — refatoração excessiva demais
Uma refatoração muito grande aumenta o risco de regressão e dificulta revisão.

Mitigação:
- dividir em pequenas entregas;
- validar cada etapa antes de seguir.

---

## 9. Checklist de validação após cada etapa da refatoração

Cada etapa de refatoração deve ser acompanhada por validação explícita.

### Checklist básico
- [ ] a aplicação carrega sem erros no navegador;
- [ ] o jogo inicia normalmente;
- [ ] o saldo e as apostas funcionam como antes;
- [ ] as rodadas continuam fluindo corretamente;
- [ ] os bots jogam sem comportamento anômalo;
- [ ] o seguro continua funcionando;
- [ ] a contagem continua atualizando corretamente;
- [ ] o histórico e o placar continuam consistentes;
- [ ] a persistência continua funcionando após recarregar a página.

### Checklist estrutural
- [ ] cada função está em um módulo com responsabilidade clara;
- [ ] não há lógica de regra em módulos de interface;
- [ ] não há manipulação de DOM em módulos de domínio;
- [ ] o estado continua centralizado;
- [ ] não há dependências circulares;
- [ ] o fluxo principal ainda é fácil de seguir;
- [ ] a documentação foi atualizada quando necessário.

### Checklist de qualidade
- [ ] o código continua legível;
- [ ] os nomes refletem claramente a responsabilidade;
- [ ] o módulo não ficou excessivamente grande;
- [ ] os testes manuais foram registrados;
- [ ] não houve regressão perceptível na experiência do usuário.

---

## Recomendação final

Para este projeto, a melhor abordagem é manter a arquitetura simples, com módulos pequenos, responsabilidade única e dependências claras. O foco deve ser preservar o comportamento do jogo enquanto a estrutura evolui em etapas pequenas e previsíveis.

A prioridade não é “modularizar por modularizar”, mas criar uma base saudável para crescimento futuro, sem introduzir complexidade desnecessária.
