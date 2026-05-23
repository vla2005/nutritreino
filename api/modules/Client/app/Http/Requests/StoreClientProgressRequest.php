<?php

namespace Modules\Client\Http\Requests;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;

class StoreClientProgressRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'client_uuid' => ['nullable', 'string', 'exists:clients,uuid'],
            'record_date' => ['required', 'date'],
            'weight' => ['required', 'numeric', 'min:20', 'max:400'],
            'target_weight' => ['nullable', 'numeric', 'min:20', 'max:400'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'measurements' => ['nullable', 'array'],
            'measurements.*' => ['nullable', 'numeric', 'min:1', 'max:400'],
            'sleep_score' => ['nullable', 'integer', 'between:1,5'],
            'hunger_score' => ['nullable', 'integer', 'between:1,5'],
            'energy_score' => ['nullable', 'integer', 'between:1,5'],
            'diet_adherence_score' => ['nullable', 'integer', 'between:1,5'],
            'training_adherence_score' => ['nullable', 'integer', 'between:1,5'],
            'photos' => ['nullable', 'array'],
            'photos.front' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'photos.side' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'photos.back' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'photos.compare' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['measurements'] as $field) {
            if (is_string($this->input($field))) {
                $decoded = json_decode($this->input($field), true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->merge([$field => $decoded]);
                }
            }
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->role === 'client' && (bool) $this->user()?->client;
    }

    protected function failedAuthorization(): void
    {
        throw new AuthorizationException('Somente o cliente pode adicionar registros e fotos ao próprio progresso.');
    }
}
