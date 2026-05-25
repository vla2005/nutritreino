<?php

namespace Modules\Client\Services;

use Modules\Client\Models\Client;
use Modules\Client\Models\ClientProgressRecord;
use Modules\Client\Transformers\ClientProgressRecordResource;

class ShowClientProgressService
{
    public function handle(Client $client): array
    {
        $records = $client->progressRecords()
            ->with(['measurements', 'photos', 'professional.user', 'feedbacks.professional.user'])
            ->orderByDesc('record_date')
            ->orderByDesc('created_at')
            ->get();

        $latest = $records->first();
        $previous = $records->skip(1)->first();
        $monthBaseline = $records
            ->filter(fn (ClientProgressRecord $record) => $record->record_date?->gte(now()->subDays(31)))
            ->last() ?? $previous;

        return [
            'client' => [
                'uuid' => $client->uuid,
                'name' => $client->name,
                'weight' => $client->weight,
                'height' => $client->height,
            ],
            'summary' => [
                'current_weight' => $latest?->weight !== null ? (float) $latest->weight : (float) ($client->weight ?: 0),
                'current_weight_source' => $latest ? 'record' : 'profile',
                'current_weight_date' => $latest?->record_date?->toDateString(),
                'month_variation' => $this->variation($latest, $monthBaseline),
                'month_variation_percent' => $this->variationPercent($latest, $monthBaseline),
                'target_weight' => $latest?->target_weight !== null ? (float) $latest->target_weight : null,
                'target_remaining' => $this->targetRemaining($latest),
                'last_check_in_date' => $latest?->record_date?->toDateString(),
            ],
            'weight_history' => $this->weightHistory($client, $records),
            'measurements' => $this->measurementSummary($latest, $previous),
            'latest_photos' => $this->latestPhotos($records),
            'latest_check_in' => $latest ? [
                'sleep' => $latest->sleep_score,
                'hunger' => $latest->hunger_score,
                'energy' => $latest->energy_score,
                'diet_adherence' => $latest->diet_adherence_score,
                'training_adherence' => $latest->training_adherence_score,
            ] : null,
            'records' => ClientProgressRecordResource::collection($records)->resolve(request()),
            'recent_records' => ClientProgressRecordResource::collection($records->take(4))->resolve(request()),
            'feedbacks' => $this->feedbacks($records),
            'feedback' => $this->feedbacks($records)[0] ?? $this->legacyFeedback($records),
        ];
    }

    private function weightHistory(Client $client, $records)
    {
        if ($records->isEmpty()) {
            return filled($client->weight)
                ? collect([[
                    'date' => null,
                    'weight' => (float) $client->weight,
                    'source' => 'profile',
                ]])
                : collect();
        }

        return $records
            ->sortBy('record_date')
            ->values()
            ->map(fn (ClientProgressRecord $record) => [
                'date' => $record->record_date?->toDateString(),
                'weight' => (float) $record->weight,
                'source' => 'record',
            ]);
    }

    private function variation(?ClientProgressRecord $latest, ?ClientProgressRecord $baseline): ?float
    {
        if (! $latest || ! $baseline) return null;

        return round((float) $latest->weight - (float) $baseline->weight, 2);
    }

    private function variationPercent(?ClientProgressRecord $latest, ?ClientProgressRecord $baseline): ?float
    {
        if (! $latest || ! $baseline || (float) $baseline->weight === 0.0) return null;

        return round(($this->variation($latest, $baseline) / (float) $baseline->weight) * 100, 1);
    }

    private function targetRemaining(?ClientProgressRecord $latest): ?float
    {
        if (! $latest || $latest->target_weight === null) return null;

        return round(abs((float) $latest->weight - (float) $latest->target_weight), 2);
    }

    private function measurementSummary(?ClientProgressRecord $latest, ?ClientProgressRecord $previous): array
    {
        $labels = ['waist', 'hip', 'chest', 'arm', 'thigh'];
        $current = $latest?->measurements?->keyBy('type') ?? collect();
        $old = $previous?->measurements?->keyBy('type') ?? collect();

        return collect($labels)->map(fn (string $type) => [
            'type' => $type,
            'value' => $current->has($type) ? (float) $current[$type]->value : null,
            'delta' => $current->has($type) && $old->has($type)
                ? round((float) $current[$type]->value - (float) $old[$type]->value, 2)
                : null,
        ])->values()->all();
    }

    private function latestPhotos($records): array
    {
        return collect(['front', 'side', 'back'])
            ->map(function (string $type) use ($records) {
                $record = $records->first(fn ($item) => $item->photos->firstWhere('type', $type));
                $photo = $record?->photos->firstWhere('type', $type);

                if (! $photo) return null;

                return [
                    'type' => $photo->type,
                    'url' => url(\Illuminate\Support\Facades\Storage::url($photo->path)),
                    'size' => (int) $photo->size,
                    'mime_type' => $photo->mime_type,
                    'record_date' => $record->record_date?->toDateString(),
                    'weight' => (float) $record->weight,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function feedbacks($records): array
    {
        return $records
            ->flatMap(fn (ClientProgressRecord $record) => $record->feedbacks->map(fn ($feedback) => [
                'uuid' => $feedback->uuid,
                'text' => $feedback->feedback,
                'date' => $record->record_date?->toDateString(),
                'created_at' => $feedback->created_at?->toISOString(),
                'record_uuid' => $record->uuid,
                'record_date' => $record->record_date?->toDateString(),
                'professional' => [
                    'uuid' => $feedback->professional?->uuid,
                    'name' => $feedback->professional?->user?->name,
                    'avatar' => $feedback->professional?->user?->avatar,
                    'speciality' => $feedback->professional?->speciality,
                ],
            ]))
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    private function legacyFeedback($records): ?array
    {
        $record = $records->first(fn ($item) => filled($item->professional_feedback));
        if (! $record) return null;

        return [
            'text' => $record->professional_feedback,
            'date' => $record->record_date?->toDateString(),
            'professional' => [
                'name' => $record->professional?->user?->name,
                'avatar' => $record->professional?->user?->avatar,
            ],
        ];
    }
}
