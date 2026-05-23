<?php

namespace Modules\MealPlan\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MealPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'title' => $this->title,
            'status' => $this->status,
            'client_goal' => $this->client_goal,
            'plan_type' => $this->plan_type,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'general_notes' => $this->general_notes,
            'client' => $this->whenLoaded('client', fn () => [
                'uuid' => $this->client?->uuid,
                'name' => $this->client?->name,
                'email' => $this->client?->email,
            ]),
            'nutritionist' => $this->whenLoaded('professional', fn () => [
                'uuid' => $this->professional?->uuid,
                'name' => $this->professional?->user?->name,
                'email' => $this->professional?->user?->email,
                'avatar' => $this->professional?->user?->avatar,
                'registration' => $this->professional?->registration,
            ]),
            'meals' => MealResource::collection($this->whenLoaded('meals')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
