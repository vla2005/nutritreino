<?php

namespace Modules\Client\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Modules\Client\Models\Client;
use Modules\Client\Models\ClientProgressRecord;
use Modules\User\Models\User;

class StoreClientProgressService
{
    public function handle(User $user, Client $client, array $data): ClientProgressRecord
    {
        return DB::transaction(function () use ($user, $client, $data) {
            $record = ClientProgressRecord::create([
                'client_id' => $client->id,
                'professional_id' => $user->professional?->id,
                ...Arr::only($data, [
                    'record_date',
                    'weight',
                    'target_weight',
                    'notes',
                    'sleep_score',
                    'hunger_score',
                    'energy_score',
                    'diet_adherence_score',
                    'training_adherence_score',
                ]),
            ]);

            foreach (($data['measurements'] ?? []) as $type => $value) {
                if ($value === null || $value === '') continue;

                $record->measurements()->create([
                    'type' => $type,
                    'value' => $value,
                ]);
            }

            foreach (($data['photos'] ?? []) as $type => $file) {
                if (! $file) continue;

                $path = $file->store("progress/{$client->uuid}", 'public');
                $record->photos()->create([
                    'type' => $type,
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            $client->forceFill(['weight' => $data['weight']])->save();

            return $record->load(['measurements', 'photos', 'professional.user', 'feedbacks.professional.user']);
        });
    }
}
