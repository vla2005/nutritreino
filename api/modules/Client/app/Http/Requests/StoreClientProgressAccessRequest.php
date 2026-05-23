<?php

namespace Modules\Client\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientProgressAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'client' && (bool) $this->user()?->client;
    }

    public function rules(): array
    {
        return [
            'professional_uuid' => ['required', 'string', 'exists:professionals,uuid'],
        ];
    }

    public function messages(): array
    {
        return [
            'professional_uuid.required' => 'Selecione um profissional para liberar o acesso.',
            'professional_uuid.exists' => 'Profissional não encontrado.',
        ];
    }
}
