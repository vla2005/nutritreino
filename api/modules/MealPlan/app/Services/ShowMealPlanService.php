<?php

namespace Modules\MealPlan\Services;

use Modules\MealPlan\Models\MealPlan;
use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class ShowMealPlanService
{
    public function handle(User $user, MealPlan $mealPlan): MealPlan
    {
        $this->ensureUserCanAccessMealPlan($user, $mealPlan);

        return $mealPlan->load('client', 'professional.user', 'meals.foods');
    }

    private function ensureUserCanAccessMealPlan(User $user, MealPlan $mealPlan): void
    {
        $isClient = $user->role === 'client'
            && $user->client
            && $mealPlan->client_id === $user->client->id;

        $isProfessional = $user->role === 'professional'
            && $user->professional
            && $mealPlan->professional_id === $user->professional->id;

        if (! $isClient && ! $isProfessional) {
            throw new UserException('User cannot access this meal plan');
        }
    }
}
