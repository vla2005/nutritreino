<?php

namespace Modules\MealPlan\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMealPlanRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'client_uuid' => ['required', 'uuid', 'exists:clients,uuid'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'client_goal' => ['required', 'string', 'in:weight_loss,muscle_gain,body_recomposition,maintenance'],
            'plan_type' => ['required', 'string', 'in:hypocaloric,balanced,hypercaloric,low_carb'],
            'general_notes' => ['nullable', 'string', 'max:5000'],

            'meals' => ['required', 'array', 'min:1'],
            'meals.*.name' => ['required', 'string', 'max:255'],
            'meals.*.time' => ['required', 'date_format:H:i'],
            'meals.*.instructions' => ['nullable', 'string', 'max:5000'],

            'meals.*.foods' => ['required', 'array', 'min:1'],
            'meals.*.foods.*.name' => ['required', 'string', 'max:255'],
            'meals.*.foods.*.amount' => ['required', 'numeric', 'gt:0', 'max:999999.99'],
            'meals.*.foods.*.unit' => ['required', 'string', 'in:g,ml,un,colheres,fatias'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];

        foreach (['title', 'client_uuid', 'status', 'client_goal', 'plan_type', 'general_notes'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $normalized[$field] = trim($this->input($field));
            }
        }

        if ($this->has('meals') && is_array($this->input('meals'))) {
            $normalized['meals'] = collect($this->input('meals'))
                ->map(function ($meal) {
                    if (! is_array($meal)) {
                        return $meal;
                    }

                    foreach (['name', 'time', 'instructions'] as $field) {
                        if (isset($meal[$field]) && is_string($meal[$field])) {
                            $meal[$field] = trim($meal[$field]);
                        }
                    }

                    if (isset($meal['foods']) && is_array($meal['foods'])) {
                        $meal['foods'] = collect($meal['foods'])
                            ->map(function ($food) {
                                if (! is_array($food)) {
                                    return $food;
                                }

                                foreach (['name', 'unit'] as $field) {
                                    if (isset($food[$field]) && is_string($food[$field])) {
                                        $food[$field] = trim($food[$field]);
                                    }
                                }

                                return $food;
                            })
                            ->all();
                    }

                    return $meal;
                })
                ->all();
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    public function authorize(): bool
    {
        return true;
    }
}
