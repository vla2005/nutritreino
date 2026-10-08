import PlanField from "@/features/plans/components/PlanField/PlanField.jsx";

const unitOptions = [
  { value: "g", label: "gramas" },
  { value: "ml", label: "ml" },
  { value: "un", label: "unidades" },
  { value: "colheres", label: "colheres" },
  { value: "fatias", label: "fatias" },
];

export default function MealCard({
  meal,
  onUpdate,
  onRemove,
  onAddFood,
  onUpdateFood,
  onRemoveFood,
  readOnly = false,
}) {
  const foodCount = meal.foods.filter((food) => food.name.trim()).length;

  return (
    <article className="plan-meal-card">
      <header
        className="plan-meal-header plan-meal-toggle-header"
        onClick={() => onUpdate({ expanded: !meal.expanded })}
      >
        <div className="plan-meal-title">
          <span aria-hidden="true">
            <UtensilsMiniIcon />
          </span>
          <div>
            <h3>{meal.name || "Sem nome"}</h3>
            <p>
              {meal.time || "--:--"} <span>-</span> {foodCount} alimento(s)
            </p>
          </div>
        </div>
        <div className="plan-meal-actions">
          {!readOnly ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              aria-label="Remover refeição"
            >
              <TrashIcon />
            </button>
          ) : null}
          <span className="plan-chevron-indicator" aria-hidden="true">
            <ChevronIcon open={meal.expanded} />
          </span>
        </div>
      </header>

      <div
        className={`plan-meal-body ${meal.expanded ? "is-open" : ""}`}
        aria-hidden={!meal.expanded}
      >
        <div className="plan-meal-body-inner">
          <div className="plan-meal-fields">
            <PlanField label="Nome da Refeição">
              <input
                value={meal.name}
                disabled={readOnly}
                onChange={(event) => onUpdate({ name: event.target.value })}
              />
            </PlanField>
            <PlanField label="Horário Sugerido">
              <input
                type="time"
                value={meal.time}
                disabled={readOnly}
                onChange={(event) => onUpdate({ time: event.target.value })}
              />
            </PlanField>
          </div>
          <FoodList
            meal={meal}
            readOnly={readOnly}
            onAdd={onAddFood}
            onUpdate={onUpdateFood}
            onRemove={onRemoveFood}
          />
          <PlanField label="Instruções Específicas" className="is-full">
            <textarea
              value={meal.instructions}
              disabled={readOnly}
              placeholder="Ex: comer lentamente, evitar líquidos..."
              onChange={(event) =>
                onUpdate({ instructions: event.target.value })
              }
            />
          </PlanField>
        </div>
      </div>
    </article>
  );
}

function FoodList({ meal, readOnly, onAdd, onUpdate, onRemove }) {
  return (
    <div className="plan-food-block">
      <label>Alimentos</label>
      {meal.foods.map((food) => (
        <div className="plan-food-row" key={food.id}>
          <PlanField label="Alimento" className="plan-row-field">
            <input
              value={food.name}
              disabled={readOnly}
              placeholder="Nome do alimento"
              onChange={(event) =>
                onUpdate(food.id, { name: event.target.value })
              }
            />
          </PlanField>
          <PlanField label="Quantidade" className="plan-row-field">
            <input
              value={food.amount}
              disabled={readOnly}
              inputMode="decimal"
              placeholder="0"
              onChange={(event) =>
                onUpdate(food.id, {
                  amount: event.target.value.replace(/[^\d.,]/g, ""),
                })
              }
            />
          </PlanField>
          <PlanField label="Unidade" className="plan-row-field">
            <select
              value={food.unit}
              disabled={readOnly}
              onChange={(event) =>
                onUpdate(food.id, { unit: event.target.value })
              }
            >
              {unitOptions.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </PlanField>
          {!readOnly ? (
            <button
              type="button"
              onClick={() => onRemove(food.id)}
              aria-label="Remover alimento"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>
      ))}
      {!readOnly ? (
        <button type="button" className="plan-add-food" onClick={onAdd}>
          <PlusIcon />
          Adicionar Alimento
        </button>
      ) : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M10 11v6M14 11v6M9 7l1-3h4l1 3M7 7l1 14h8l1-14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronIcon({ open }) {
  return (
    <svg
      className={open ? "is-open" : ""}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m8 10 4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function UtensilsMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4v7M10 4v7M7 8h3M8.5 11v9M16.5 4v16M14 4c0 4.8.8 7 2.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
