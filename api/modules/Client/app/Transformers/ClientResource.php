<?php

namespace Modules\Client\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->user?->name ?: $this->name,
            'registered_name' => $this->name,
            'avatar' => $this->user?->avatar,
            'email' => $this->email,
            'phone' => $this->phone,
            'cpf' => $this->cpf,
            'gender' => $this->gender,
            'birth_date' => optional($this->birth_date)->format('Y-m-d'),
            'height' => $this->height,
            'weight' => $this->weight,
            'status' => $this->pivot?->status ?? $this->status ?? null,
            'invitation_sent_at' => $this->pivot?->invitation_sent_at ?? $this->invitation_sent_at ?? null,
            'invitation_accepted_at' => $this->pivot?->invitation_accepted_at ?? $this->invitation_accepted_at ?? null,
            'invitation_expires_at' => $this->pivot?->invitation_expires_at ?? $this->invitation_expires_at ?? null,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
