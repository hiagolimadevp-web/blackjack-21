# Roadmap do Blackjack Trainer Platform

## Visão

Evoluir o projeto de um simulador de blackjack para uma plataforma de treinamento orientada a decisão. O foco não é apenas reproduzir uma mesa, mas criar uma experiência que ajude o usuário a aprender, refletir e melhorar consistentemente.

## Pilares

### 1. Simulação

Objetivo: manter a experiência de jogo sólida, confiável e próxima do uso real.

Prioridades:

- preservar regras e fluxo atual;
- melhorar a clareza do estado da rodada;
- facilitar a criação de cenários reutilizáveis;
- preparar a base para sessões de treino mais ricas.

### 2. Treinamento

Objetivo: transformar cada rodada em oportunidade de aprendizado.

Prioridades:

- coach contextualizado por decisão;
- explicação de por que uma ação é recomendada;
- revisão da última mão e feedback imediato;
- drills por cenário e metas de prática.

### 3. Analytics

Objetivo: dar visibilidade ao progresso e ao padrão de decisão.

Prioridades:

- métricas de desempenho por sessão;
- análise de acerto/erro por cenário;
- indicadores de tendência e consistência;
- comparação entre decisões e resultados esperados;
- infraestrutura de eventos e decisões como base para performance analyzer, luck index e dashboard.

### 4. Personalização

Objetivo: adaptar o treino ao perfil do usuário.

Prioridades:

- identificar erros recorrentes;
- sugerir drills e revisão com base em padrões;
- criar planos de treino progressivos;
- oferecer recomendações de foco e dificuldade.

---

## Fase 1 — Base sólida

Objetivo: consolidar a estrutura atual e preparar a evolução.

Entregas:

- arquitetura modular documentada;
- estado compartilhado centralizado;
- separação clara entre lógica de jogo e interface;
- persistência básica de configuração e histórico.

Resultado esperado:

- a aplicação continua estável e com menor risco de regressão.

---

## Fase 2 — Treinamento guiado

Objetivo: transformar o jogo em um ambiente de estudo.

Entregas:

- modo coach com feedback imediato;
- explicações de regras e decisões;
- revisão da última rodada;
- flashcards e exercícios curtos.

Resultado esperado:

- o usuário passa a receber orientação sem interromper a experiência de jogo.

---

## Fase 3 — Analytics e performance

Objetivo: medir decisões e progresso com profundidade.

Entregas:

- painel de desempenho por sessão;
- métricas por situação, posição e mão;
- tendências de evolução;
- indicadores de consistência e risco de erro.

Resultado esperado:

- o usuário entende o que está melhorando e onde precisa de atenção.

---

## Fase 4 — Personalização e progressão

Objetivo: tornar o treinamento adaptativo.

Entregas:

- planos de treino personalizados;
- recomendação automática de drills;
- repetição espaçada de erros recorrentes;
- dashboard de progresso e próximos objetivos.

Resultado esperado:

- cada sessão se torna mais eficiente e alinhada ao perfil do usuário.

---

## Estrutura modular planejada

### Simulação

- roundEngine
- dealer
- bots
- betting
- deck
- counting
- rules

### Treinamento

- coach
- explanations
- review
- drills
- flashcards
- practiceGoals

### Analytics

- performanceAnalyzer
- metrics
- sessionStats
- categoryStats
- trendAnalyzer

### Personalização

- adaptiveCoach
- spacedRepetition
- trainingPlan
- progressDashboard

### Infraestrutura e interface

- state
- persistence
- eventBus
- renderer
- events
- dom

---

## Critérios de sucesso

- a aplicação continua funcionando sem regressão;
- o usuário recebe feedback útil durante a prática;
- as decisões podem ser analisadas com clareza;
- o conteúdo de treino evolui com o comportamento do usuário.

---

## Recomendações de execução

1. Não adicionar muitas funcionalidades novas de uma vez;
2. Consolidar cada camada antes de avançar;
3. Validar comportamento do jogo após cada mudança;
4. Manter a experiência simples, educativa e sem ruído.

## Regras de sprint

- Cada módulo extraído precisa ter testes automatizados realmente executáveis.
- Os testes devem verificar comportamento esperado de funções puras.
- Cada módulo precisa ter um contrato de responsabilidades explícito, com:
  - o que faz;
  - o que não faz;
  - dependências permitidas;
  - dependências proibidas.
- A validação não pode se limitar à ausência de erros no editor; ela deve incluir execução real dos testes e verificação do comportamento.
- Antes de iniciar cada sprint, a justificativa técnica deve explicitar:
  - por que esse módulo foi escolhido;
  - qual risco ele reduz;
  - qual benefício ele traz para a arquitetura;
  - como ele contribui para um dos quatro pilares do produto.
