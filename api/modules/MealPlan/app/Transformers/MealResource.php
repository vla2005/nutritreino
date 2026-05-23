<?php

namespace Modules\MealPlan\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MealResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'time' => $this->time,
            'instructions' => $this->instructions,
            'foods' => MealFoodResource::collection($this->whenLoaded('foods')),
        ];
    }
}
