<?php

namespace Modules\Professional\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutDayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'week_days' => $this->week_days,
            'order' => $this->order,
            'exercises' => WorkoutExerciseResource::collection($this->whenLoaded('exercises')),
        ];
    }
}
