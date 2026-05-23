<?php

namespace Modules\Chat\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:5000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'max:10240', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required_without' => 'Digite uma mensagem ou envie um arquivo.',
            'attachment.max' => 'O arquivo deve ter no máximo 10MB.',
            'attachment.mimetypes' => 'Envie uma imagem, PDF, TXT ou documento do Word.',
        ];
    }
}
