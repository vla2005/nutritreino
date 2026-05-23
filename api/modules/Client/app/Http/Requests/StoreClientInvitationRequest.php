<?php

namespace Modules\Client\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientInvitationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'size:11'],
            'gender' => ['nullable', 'string', 'in:male,female'],
            'birth_date' => ['nullable', 'date'],
            'height' => ['nullable', 'string', 'max:3'],
            'weight' => ['nullable', 'string', 'max:3'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => mb_strtolower(trim($this->input('email'))),
            ]);
        }

        foreach (['phone', 'cpf'] as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => preg_replace('/\D/', '', (string) $this->input($field)),
                ]);
            }
        }
    }

    public function authorize(): bool
    {
        return true;
    }
}
