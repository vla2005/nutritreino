<?php

namespace Modules\Client\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ClientProgressRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'record_date' => $this->record_date?->toDateString(),
            'weight' => (float) $this->weight,
            'target_weight' => $this->target_weight !== null ? (float) $this->target_weight : null,
            'notes' => $this->notes,
            'professional_feedback' => $this->professional_feedback,
            'feedbacks' => $this->whenLoaded('feedbacks', fn () => $this->feedbacks->map(fn ($feedback) => [
                'uuid' => $feedback->uuid,
                'text' => $feedback->feedback,
                'created_at' => $feedback->created_at?->toISOString(),
                'updated_at' => $feedback->updated_at?->toISOString(),
                'professional' => [
                    'uuid' => $feedback->professional?->uuid,
                    'name' => $feedback->professional?->user?->name,
                    'avatar' => $feedback->professional?->user?->avatar,
                    'speciality' => $feedback->professional?->speciality,
                ],
            ])->values()),
            'check_in' => [
                'sleep' => $this->sleep_score,
                'hunger' => $this->hunger_score,
                'energy' => $this->energy_score,
                'diet_adherence' => $this->diet_adherence_score,
                'training_adherence' => $this->training_adherence_score,
            ],
            'measurements' => $this->whenLoaded('measurements', fn () => $this->measurements->mapWithKeys(fn ($measurement) => [
                $measurement->type => (float) $measurement->value,
            ])),
            'photos' => $this->whenLoaded('photos', fn () => $this->photos->map(fn ($photo) => [
                'type' => $photo->type,
                'url' => url(Storage::url($photo->path)),
                'original_name' => $photo->original_name,
                'mime_type' => $photo->mime_type,
                'size' => (int) $photo->size,
            ])->values()),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
