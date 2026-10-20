---
version: alpha
name: NutriTreino
description: Acompanhamento nutricional e físico com leitura direta das orientações profissionais
colors:
  primary: '#288562'
  primaryDark: '#226d50'
  background: '#f7faf8'
  surface: '#ffffff'
  ink: '#20352d'
  muted: '#65756b'
  line: '#e4ece6'
typography:
  body:
    fontFamily: 'DM Sans Variable, system-ui, sans-serif'
  heading:
    fontFamily: 'Outfit, system-ui, sans-serif'
rounded:
  card: '13px'
  control: '8px'
spacing:
  pageDesktop: '34px'
  sectionGap: '29px'
components:
  accordion: {}
  planOverview: {}
  measurementInput: {}
---

# NutriTreino Design System

## Overview

Área de produto para nutricionistas, treinadores e seus clientes. O uso no celular deve lembrar uma ficha de acompanhamento que se consulta durante a refeição ou o exercício, não um formulário administrativo. Interface em português brasileiro, preservando a identidade clínica já aprovada. Não há escopo de mercado japonês.

Os tokens em `web/src/shared/styles/tokens.css` são a fonte canônica (modelo B). Este documento espelha esses valores; não gera CSS. `ClinicTheme.css` adapta o tema para o shell autenticado, inclusive o fundo do documento. O tema de autenticação não é alterado por esta decisão.

## Colors

`--nt-canvas`, `--nt-ink`, `--nt-muted`, `--nt-green`, `--nt-green-dark` e `--nt-line` mapeiam respectivamente os valores background, ink, muted, primary, primaryDark e line. Superfícies são brancas. Cor verde destaca porções e ações sem substituir rótulos. O fundo do documento deve acompanhar o fundo do shell, inclusive após fechar accordions.

## Typography

DM Sans para conteúdo e números; Outfit para títulos. Valores numéricos usam algarismos tabulares quando comparados. Refeições, alimentos e exercícios podem quebrar linha; nomes extensos não devem ser truncados na consulta. Porções usam vírgula decimal, sem zeros desnecessários.

## Layout

Desktop mantém o editor com coluna de resumo. A leitura do cliente usa uma coluna de até 1080px, sem resumo duplicado. No celular, mostrar alimentos com suas porções na mesma linha e exercícios com três medidas identificadas. A edição compacta reúne quantidade e unidade; séries, repetições e descanso ficam juntos. Navegação inferior mantém a área segura existente e a rolagem natural da página.

## Elevation & Depth

Manter bordas suaves e a sombra discreta já usada nos cartões. Não criar elevação em cada alimento ou medida. Orientações são texto com separação simples, não cartões aninhados.

## Shapes

Cartões de 13px e controles de 8px conforme `PlanEditor.css`. Manter o vocabulário existente de ícones de alimentação e treino.

## Components

`features/plans/components/PlanSectionCard` é o disclosure comum das refeições e dias de treino. O título é um botão com `aria-expanded` e `aria-controls`; remover é uma ação separada. Conteúdo fechado é oculto e não recebe foco. O usuário pode abrir mais de uma seção para comparar orientações.

`PlanOverview` apresenta dados de consulta como texto, mantendo a navegação para o autor. `MealCard` e `WorkoutDayCard` escolhem leitura ou edição a partir da autorização já existente na página. A leitura não oferece controles de gravação.

`progress-measure-value` mantém o input e seu sufixo em colunas flexíveis distintas: a unidade nunca fica sobre o número, inclusive com casas decimais. Campos numéricos mantêm o teclado apropriado.

## Do's and Don'ts

- Preservar autorizações, persistência, rotas e ordem dos dados.
- Datas de medição são dias de calendário, não instantes UTC.
- Não usar inputs desabilitados como apresentação principal das orientações do cliente.
- Não esconder conteúdo ou controles para disfarçar overflow.
- Verificar 320px, 390px e desktop, além de abertura e fechamento por teclado.
