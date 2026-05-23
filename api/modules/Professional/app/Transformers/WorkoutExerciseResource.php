<?php

namespace Modules\Professional\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'sets' => $this->sets,
            'reps' => $this->reps,
            'rest_seconds' => $this->rest_seconds,
            'notes' => $this->notes,
            'order' => $this->order,
        ];
    }
}
