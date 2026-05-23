<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $user = $this->user();
        $professionalId = $user?->professional?->id;
        $clientId = $user?->client?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone' => ['nullable', 'string', 'max:255', Rule::unique('users', 'phone')->ignore($user?->id)],
            'cpf' => ['nullable', 'string', 'size:11', Rule::unique('users', 'cpf')->ignore($user?->id)],
            'avatar_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            'speciality' => ['nullable', 'required_if:role,professional', 'string', 'max:255'],
            'registration' => ['nullable', 'required_if:role,professional', 'string', 'max:255', Rule::unique('professionals', 'registration')->ignore($professionalId)],
            'bio' => ['nullable', 'string', 'max:3000'],

            'gender' => ['nullable', 'in:male,female'],
            'birth_date' => ['nullable', 'date'],
            'height' => ['nullable', 'string', 'max:3'],
            'weight' => ['nullable', 'string', 'max:5'],

            'client_email' => ['nullable', 'email', 'max:255', Rule::unique('clients', 'email')->ignore($clientId)],
            'client_phone' => ['nullable', 'string', 'max:255', Rule::unique('clients', 'phone')->ignore($clientId)],
            'client_cpf' => ['nullable', 'string', 'size:11', Rule::unique('clients', 'cpf')->ignore($clientId)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'role' => $this->user()?->role,
            'phone' => $this->onlyDigits($this->input('phone')),
            'cpf' => $this->onlyDigits($this->input('cpf')),
            'client_phone' => $this->onlyDigits($this->input('phone')),
            'client_cpf' => $this->onlyDigits($this->input('cpf')),
            'client_email' => $this->input('email'),
        ]);
    }

    private function onlyDigits(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return preg_replace('/\D+/', '', (string) $value);
    }
}
