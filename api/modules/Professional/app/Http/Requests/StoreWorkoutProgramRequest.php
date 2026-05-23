<?php

namespace Modules\Professional\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkoutProgramRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'client_uuid' => ['required', 'uuid', 'exists:clients,uuid'],
            'goal' => ['required', 'string', 'max:120'],
            'level' => ['required', 'string', 'max:80'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'string', 'in:active,draft,archived'],
            'general_notes' => ['nullable', 'string', 'max:5000'],

            'days' => ['required', 'array', 'min:1'],
            'days.*.name' => ['required', 'string', 'max:255'],
            'days.*.week_days' => ['nullable', 'string', 'max:255'],
            'days.*.order' => ['nullable', 'integer', 'min:0'],

            'days.*.exercises' => ['required', 'array', 'min:1'],
            'days.*.exercises.*.name' => ['required', 'string', 'max:255'],
            'days.*.exercises.*.sets' => ['required', 'integer', 'min:1', 'max:999'],
            'days.*.exercises.*.reps' => ['required', 'integer', 'min:1', 'max:999'],
            'days.*.exercises.*.rest_seconds' => ['required', 'integer', 'min:0', 'max:9999'],
            'days.*.exercises.*.notes' => ['nullable', 'string', 'max:5000'],
            'days.*.exercises.*.order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];

        foreach (['title', 'client_uuid', 'goal', 'level', 'status', 'general_notes'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $normalized[$field] = trim($this->input($field));
            }
        }

        if ($this->has('days') && is_array($this->input('days'))) {
            $normalized['days'] = collect($this->input('days'))
                ->map(function ($day) {
                    if (! is_array($day)) {
                        return $day;
                    }

                    foreach (['name', 'week_days'] as $field) {
                        if (isset($day[$field]) && is_string($day[$field])) {
                            $day[$field] = trim($day[$field]);
                        }
                    }

                    if (isset($day['exercises']) && is_array($day['exercises'])) {
                        $day['exercises'] = collect($day['exercises'])
                            ->map(function ($exercise) {
                                if (! is_array($exercise)) {
                                    return $exercise;
                                }

                                foreach (['name', 'notes'] as $field) {
                                    if (isset($exercise[$field]) && is_string($exercise[$field])) {
                                        $exercise[$field] = trim($exercise[$field]);
                                    }
                                }

                                return $exercise;
                            })
                            ->all();
                    }

                    return $day;
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
