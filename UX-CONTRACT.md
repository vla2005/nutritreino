# Contrato de interface NutriTreino

Escopo desta revisão: consulta e edição de planos e treinos, datas de progresso e medidas do check-in. As permissões são definidas nos serviços da API e nas verificações de autoria já existentes nas páginas; este documento não cria novas regras de acesso.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | PlanField com select nativo | Controles existentes em MealCard e WorkoutPlanPage | Popup do sistema operacional aceito para edição | Seleção no navegador e build |
| Date | shared/utils/calendarDate.js e input date nativo | Datas de medição YYYY-MM-DD retornadas pela API | Dia de calendário local; timestamp mantém conversão de fuso | tests/calendarDate.test.js |
| Form | PlanField e formulários existentes | Validações das páginas e requests da API | Edição do autor; consulta sem inputs | Lint e validação no navegador |
| Toast | useToast e AppProviders | Sistema compartilhado existente | success, warning, error | Fluxos de salvamento existentes |
| CRUD | NutritionPlanPage e WorkoutPlanPage | Serviços create/update/get existentes | Salvar mantém a página; voltar usa a navegação existente | Consulta e persistência local |
| Disclosure | PlanSectionCard | DESIGN.md | Seções independentes; leitura e edição | Botões por teclado e conteúdo fechado fora do foco |

## Fontes de domínio

- `api/modules/MealPlan/app/Services` e `api/modules/Professional/app/Services`: autorização de criação, consulta e edição.
- `api/modules/Client/app/Transformers/ClientProgressRecordResource.php`: dia da medição sem horário e timestamps do feedback.
- `NutritionPlanPage` e `WorkoutPlanPage`: autoria determina readOnly; expansão não altera os dados persistidos.

## Comportamento da revisão

Consulta de cliente apresenta os dados como texto, preserva ordem, autor, período, quantidades, horários e orientações. Não cria botão de salvar nem envia requisição de edição. Abertura e fechamento dos accordions preservam o formulário do autor.

Datas YYYY-MM-DD são interpretadas como calendário local, sem deslocamento UTC. Instantes com horário e fuso continuam sendo convertidos para o horário local. O valor inicial da data do registro acompanha o dia local inclusive próximo da meia-noite.

Campos de medidas conservam valor e unidade em regiões separadas. Não mudam dados físicos nem permissões de progresso. Casos de erro, feedback e navegação fora deste escopo conservam o comportamento existente; a revisão não certifica conformidade integral dos fluxos legados.
