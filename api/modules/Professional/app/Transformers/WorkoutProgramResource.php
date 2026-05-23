<?php

namespace Modules\Professional\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'title' => $this->title,
            'goal' => $this->goal,
            'level' => $this->level,
            'status' => $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'general_notes' => $this->general_notes,
            'client' => $this->whenLoaded('client', fn () => [
                'uuid' => $this->client?->uuid,
                'name' => $this->client?->name,
                'email' => $this->client?->email,
            ]),
            'trainer' => $this->whenLoaded('professional', fn () => [
                'uuid' => $this->professional?->uuid,
                'name' => $this->professional?->user?->name,
                'email' => $this->professional?->user?->email,
                'avatar' => $this->professional?->user?->avatar,
                'registration' => $this->professional?->registration,
            ]),
            'days' => WorkoutDayResource::collection($this->whenLoaded('days')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
