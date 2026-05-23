<?php

namespace Modules\Professional\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessionalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'user_uuid' => $this->user?->uuid,
            'name' => $this->user?->name,
            'avatar' => $this->user?->avatar,
            'email' => $this->user?->email,
            'phone' => $this->user?->phone,
            'cpf' => $this->user?->cpf,
            'role' => $this->user?->role,
            'email_verified_at' => $this->user?->email_verified_at?->toISOString(),
            'speciality' => $this->speciality,
            'registration' => $this->registration,
            'bio' => $this->bio,
            'status' => $this->pivot?->status,
            'stats' => [
                'active_clients' => (int) ($this->active_clients_count ?? 0),
                'workout_programs' => (int) ($this->workout_programs_count ?? 0),
                'meal_plans' => (int) ($this->meal_plans_count ?? 0),
            ],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
