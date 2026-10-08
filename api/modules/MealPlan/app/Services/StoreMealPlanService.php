<?php

namespace Modules\MealPlan\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Modules\Client\Models\Client;
use Modules\MealPlan\Models\MealPlan;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class StoreMealPlanService
{
    public function handle(User $user, array $data): MealPlan
    {
        $this->ensureUserIsNutritionist($user);

        return DB::transaction(function () use ($user, $data) {
            $client = Client::where('uuid', $data['client_uuid'])->firstOrFail();

            $this->ensureClientBelongsToProfessional($client, $user);

            $mealPlan = MealPlan::create([
                'professional_id' => $user->professional->id,
                'client_id' => $client->id,
                ...Arr::only($data, [
                    'title',
                    'start_date',
                    'end_date',
                    'status',
                    'client_goal',
                    'plan_type',
                    'general_notes',
                ]),
            ]);

            foreach ($data['meals'] as $mealData) {
                $meal = $mealPlan->meals()->create(Arr::only($mealData, [
                    'name',
                    'time',
                    'instructions',
                ]));

                foreach ($mealData['foods'] as $foodData) {
                    $meal->foods()->create(Arr::only($foodData, [
                        'name',
                        'amount',
                        'unit',
                    ]));
                }
            }

            return $mealPlan->load('client', 'professional.user', 'meals.foods');
        });
    }

    private function ensureUserIsNutritionist(User $user): void
    {
        if (
            $user->role !== 'professional'
            || ! $user->professional
            || $user->professional->speciality !== 'nutritionist'
        ) {
            throw new UserException('Only nutritionists can create meal plans');
        }
    }

    private function ensureClientBelongsToProfessional(Client $client, User $user): void
    {
        $belongsToProfessional = $client->professionals()
            ->where('professionals.id', $user->professional->id)
            ->wherePivotIn('status', ['active', 'pending_invite'])
            ->exists();

        if (! $belongsToProfessional) {
            throw new UserException('Client does not belong to this nutritionist');
        }
    }
}
