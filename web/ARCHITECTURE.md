# Arquitetura do frontend

Este documento define a arquitetura-alvo e as regras usadas durante a refatoracao incremental. A migracao deve preservar as rotas, o comportamento e a aparencia enquanto cada dominio e isolado.

## Estrutura-alvo

```text
src/
|-- app/                 # bootstrap, providers e roteamento
|-- layouts/             # shells de navegacao e composicao de rotas
|-- pages/               # componentes associados diretamente a rotas
|-- features/            # regras, hooks, API e componentes de dominio
|-- shared/              # infraestrutura genuinamente reutilizavel
`-- assets/              # imagens e outros arquivos estaticos
```

## Responsabilidades

### Pages

Cada rota deve ter uma pasta com o componente principal e seu CSS:

```text
pages/messages/MessagesPage/
|-- MessagesPage.jsx
|-- MessagesPage.css
`-- components/
```

Uma page coordena parametros de rota, carregamento principal e composicao. Elementos visuais ou fluxos independentes devem ser extraidos para componentes.

### Features

Uma feature concentra uma capacidade de negocio reutilizada por uma ou mais pages:

```text
features/messaging/
|-- api/
|-- components/
|-- hooks/
`-- utils/
```

Codigo exclusivo de uma unica page permanece dentro da pasta dessa page. Ele so deve ser promovido para `features` quando representar uma responsabilidade de dominio independente.

### Shared

`shared` recebe apenas codigo sem conhecimento de um dominio especifico:

- componentes UI reutilizaveis;
- hooks de infraestrutura;
- clientes HTTP e configuracoes;
- formatadores realmente genericos;
- tokens e estilos globais.

## Convencoes de componentizacao

- Pages devem preferencialmente permanecer abaixo de 250 linhas.
- Componentes devem preferencialmente permanecer abaixo de 200 linhas.
- Hooks devem possuir uma responsabilidade principal.
- JSX repetido ou blocos com estado/comportamento proprio devem ser extraidos.
- Nao criar componentes que apenas renomeiam uma `div` sem adicionar semantica ou comportamento.
- Componentes exclusivos ficam proximos da page ou feature que os utiliza.
- Componentes so vao para `shared` quando forem reutilizaveis entre dominios.

Os limites de linha sao indicadores de revisao, nao regras mecanicas. Coesao e clareza prevalecem.

## CSS

- Cada page importa seu proprio arquivo CSS.
- Cada componente complexo pode possuir CSS ao lado do JSX.
- Estilos de page devem ser subordinados a sua classe raiz durante a migracao.
- `shared/styles` deve conter somente tokens, reset, globais e utilitarios.
- O `src/style.css` atual sera reduzido por dominio ate poder ser removido.
- A ordem da cascata deve ser preservada durante cada extracao.
- CSS Modules nao sera introduzido durante a primeira migracao para evitar misturar reorganizacao com renomeacao massiva de classes.

## Imports

O alias `@` representa `src`:

```js
import Button from '@/shared/components/ui/Button.jsx'
```

Imports relativos curtos sao permitidos entre arquivos da mesma pasta. Pages nao devem importar implementacoes internas de outras pages.

## Sequencia de migracao

1. Fundacao compartilhada.
2. Autenticacao publica.
3. Convites.
4. Router e shell autenticado.
5. Home por perfil.
6. Pacientes e profissionais.
7. Configuracoes de perfil.
8. Planos alimentares.
9. Treinos.
10. Mensagens.
11. Videochamadas.
12. Progresso do cliente.
13. Consolidacao e remocao do legado.

## Criterios de conclusao por etapa

- rotas e contratos de API preservados;
- CSS correspondente removido do arquivo global;
- pagina dividida em responsabilidades claras;
- nenhum import entre internals de pages diferentes;
- `npm run lint` executado;
- `npm run build` concluido;
- verificacao visual das rotas afetadas;
- etapa entregue em commit isolado.

## Inventario atual de rotas

| Rota | Componente atual | Destino planejado |
|---|---|---|
| `/login` | `pages/Login.jsx` | `pages/auth/LoginPage` |
| `/register` | `pages/Register.jsx` | `pages/auth/RegisterPage` |
| `/verify-email` | `pages/VerifyEmail.jsx` | `pages/auth/VerifyEmailPage` |
| `/accept-invite` | `pages/AcceptInvite.jsx` | `pages/invitations/AcceptInvitePage` |
| `/patients` | `pages/patients/Patients.jsx` | `pages/patients/PatientsPage` |
| `/dashboard/home` | `pages/dashboard/DashboardHome.jsx` | `pages/home/DashboardHomePage` |
| `/dashboard/clients/:uuid` | `pages/dashboard/ClientProfile.jsx` | `pages/patients/ClientProfilePage` |
| `/dashboard/meal-plans` | `pages/dashboard/MealPlans.jsx` | `pages/meal-plans/MealPlansPage` |
| `/dashboard/messages` | `pages/dashboard/Messages.jsx` | `pages/messages/MessagesPage` |
| `/dashboard/progress` | `pages/dashboard/ClientProgress.jsx` | `pages/progress/ClientProgressPage` |
| `/dashboard/settings` | `pages/dashboard/ProfileSettings.jsx` | `pages/settings/ProfileSettingsPage` |
| `/dashboard/plans` | `pages/dashboard/NutritionPlanForm.jsx` | `pages/meal-plans/NutritionPlanPage` |
| `/dashboard/plans/:uuid` | `pages/dashboard/NutritionPlanForm.jsx` | `pages/meal-plans/NutritionPlanPage` |
| `/dashboard/professionals/:uuid` | `pages/dashboard/ProfessionalProfile.jsx` | `pages/professionals/ProfessionalProfilePage` |
| `/dashboard/workouts` | `pages/dashboard/WorkoutPrograms.jsx` | `pages/workouts/WorkoutProgramsPage` |
| `/dashboard/workouts/new` | `pages/dashboard/WorkoutPlanForm.jsx` | `pages/workouts/WorkoutPlanPage` |
| `/dashboard/workouts/:uuid` | `pages/dashboard/WorkoutPlanForm.jsx` | `pages/workouts/WorkoutPlanPage` |
