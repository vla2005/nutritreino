<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // General
            'role' => 'required|in:client,professional,admin',
            'name' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'avatar' => 'nullable|string|max:255',
            'avatar_file' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'phone' => 'nullable|string|max:255|unique:users,phone',
            'cpf' => 'required|string|size:11|unique:users,cpf',
            'password' => 'required|string|min:6',

            // Professional
            'speciality' => 'nullable|string|max:255',
            'registration' => 'nullable|string|max:255|unique:professionals,registration',
            'bio' => 'nullable',

            // Client
            'gender' => 'nullable|string|max:255|in:male,female',
            'height' => 'nullable|string|max:3',
            'weight' => 'nullable|string|max:3',
            'birth_date' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            // General
            'role.required' => 'O campo função é obrigatório.',
            'role.in' => 'A função deve ser client, professional ou admin.',

            'name.string' => 'O nome deve ser um texto válido.',
            'name.max' => 'O nome não pode ultrapassar 255 caracteres.',

            'email.required' => 'O e-mail é obrigatório.',
            'email.string' => 'O e-mail deve ser um texto válido.',
            'email.email' => 'Informe um e-mail válido.',
            'email.max' => 'O e-mail não pode ultrapassar 255 caracteres.',
            'email.unique' => 'Este e-mail já está em uso.',

            'avatar.string' => 'O avatar deve ser um texto válido.',
            'avatar.max' => 'O avatar não pode ultrapassar 255 caracteres.',

            'phone.string' => 'O telefone deve ser um texto válido.',
            'phone.max' => 'O telefone não pode ultrapassar 255 caracteres.',
            'phone.unique' => 'Este telefone já está em uso.',

            'cpf.required' => 'O CPF é obrigatório.',
            'cpf.string' => 'O CPF deve ser um texto válido.',
            'cpf.size' => 'O CPF deve ter exatamente 11 caracteres.',
            'cpf.unique' => 'Este CPF já está em uso.',

            'password.required' => 'A senha é obrigatória.',
            'password.string' => 'A senha deve ser um texto válido.',
            'password.min' => 'A senha deve ter no mínimo 6 caracteres.',

            // Professional
            'speciality.string' => 'A especialidade deve ser um texto válido.',
            'speciality.max' => 'A especialidade não pode ultrapassar 255 caracteres.',

            'registration.string' => 'O registro deve ser um texto válido.',
            'registration.max' => 'O registro não pode ultrapassar 255 caracteres.',
            'registration.unique' => 'Este registro é inválido.',

            'bio.nullable' => 'A biografia é opcional.',

            // Client
            'gender.string' => 'O gênero deve ser um texto. ',

            'height.string' => 'A altura deve ser um texto válido.',
            'height.max' => 'A altura não pode ultrapassar 3 caracteres.',

            'weight.string' => 'O peso deve ser um texto válido.',
            'weight.max' => 'O peso não pode ultrapassar 3 caracteres.',

            'birth_date.date' => 'A data de nascimento deve ser uma data válida.',
        ];
    }


    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
}
