<?php

namespace Modules\MealPlan\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MealFoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'amount' => $this->amount,
            'unit' => $this->unit,
        ];
    }
}
