<?php

namespace Modules\Client\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcceptClientInvitationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:255', 'unique:users,phone'],
            'cpf' => ['nullable', 'string', 'size:11', 'unique:users,cpf'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
