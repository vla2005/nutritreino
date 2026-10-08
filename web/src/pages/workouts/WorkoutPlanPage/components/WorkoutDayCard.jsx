import PlanField from "@/features/plans/components/PlanField/PlanField.jsx";

export default function WorkoutDayCard({
  day,
  onUpdate,
  onRemove,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  readOnly = false,
}) {
  const exerciseCount = day.exercises.filter((exercise) =>
    exercise.name.trim(),
  ).length;
  return (
    <article className="plan-meal-card">
      <header
        className="plan-meal-header workout-day-header"
        onClick={() => onUpdate({ expanded: !day.expanded })}
      >
        <div className="plan-meal-title">
          <span aria-hidden="true">
            <DumbbellIcon />
          </span>
          <div>
            <h3>{day.name || "Sem nome"}</h3>
            <p>
              {day.weekDays || "Dias não definidos"} <span>-</span>{" "}
              {exerciseCount} exercício(s)
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
              aria-label="Remover dia de treino"
            >
              <TrashIcon />
            </button>
          ) : null}
          <span className="workout-chevron-indicator" aria-hidden="true">
            <ChevronIcon open={day.expanded} />
          </span>
        </div>
      </header>
      <div
        className={`plan-meal-body ${day.expanded ? "is-open" : ""}`}
        aria-hidden={!day.expanded}
      >
        <div className="plan-meal-body-inner">
          <div className="plan-meal-fields">
            <PlanField label="Nome do Dia">
              <input
                placeholder="Ex: Treino A - Peito e Tríceps"
                value={day.name}
                disabled={readOnly}
                onChange={(event) => onUpdate({ name: event.target.value })}
              />
            </PlanField>
            <PlanField label="Dias da Semana">
              <input
                placeholder="Ex: Segunda e quinta"
                value={day.weekDays}
                disabled={readOnly}
                onChange={(event) => onUpdate({ weekDays: event.target.value })}
              />
            </PlanField>
          </div>
          <ExerciseList
            day={day}
            readOnly={readOnly}
            onAdd={onAddExercise}
            onUpdate={onUpdateExercise}
            onRemove={onRemoveExercise}
          />
        </div>
      </div>
    </article>
  );
}

function ExerciseList({ day, readOnly, onAdd, onUpdate, onRemove }) {
  return (
    <div className="workout-exercise-block">
      <label>Exercícios</label>
      <div className="workout-exercise-head" aria-hidden="true">
        <span>Exercício</span>
        <span>Séries</span>
        <span>Reps</span>
        <span>Descanso</span>
        <span>Observação</span>
      </div>
      {day.exercises.map((exercise) => (
        <ExerciseRow
          key={exercise.id}
          exercise={exercise}
          readOnly={readOnly}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
      <button
        type="button"
        className="plan-add-food"
        onClick={onAdd}
        hidden={readOnly}
      >
        <PlusIcon />
        Adicionar Exercício
      </button>
    </div>
  );
}

function ExerciseRow({ exercise, readOnly, onUpdate, onRemove }) {
  return (
    <div className="workout-exercise-row">
      <PlanField label="Exercício" className="plan-row-field">
        <input
          value={exercise.name}
          disabled={readOnly}
          placeholder="Nome do exercício"
          onChange={(event) =>
            onUpdate(exercise.id, { name: event.target.value })
          }
        />
      </PlanField>
      <PlanField label="Séries" className="plan-row-field">
        <input
          value={exercise.sets}
          disabled={readOnly}
          inputMode="numeric"
          onChange={(event) =>
            onUpdate(exercise.id, { sets: digits(event.target.value) })
          }
        />
      </PlanField>
      <PlanField label="Repetições" className="plan-row-field">
        <input
          value={exercise.reps}
          disabled={readOnly}
          inputMode="numeric"
          onChange={(event) =>
            onUpdate(exercise.id, { reps: digits(event.target.value) })
          }
        />
      </PlanField>
      <PlanField label="Descanso (segundos)" className="plan-row-field">
        <span className="workout-rest-input">
          <input
            value={exercise.rest}
            disabled={readOnly}
            inputMode="numeric"
            onChange={(event) =>
              onUpdate(exercise.id, { rest: digits(event.target.value) })
            }
          />
          <span aria-hidden="true">s</span>
        </span>
      </PlanField>
      <PlanField label="Observação" className="plan-row-field">
        <input
          value={exercise.note}
          disabled={readOnly}
          placeholder="Cadência, variação..."
          onChange={(event) =>
            onUpdate(exercise.id, { note: event.target.value })
          }
        />
      </PlanField>
      {!readOnly ? (
        <button
          type="button"
          onClick={() => onRemove(exercise.id)}
          aria-label="Remover exercício"
        >
          <TrashIcon />
        </button>
      ) : null}
    </div>
  );
}

function digits(value) {
  return String(value).replace(/\D/g, "");
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
function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8v8M18 8v8M4 10v4M20 10v4M6 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
