<?php

namespace App\Http\Controllers;

use App\Services\GeminiPlanSuggestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Client\Models\Client;
use Modules\User\Exceptions\UserException;

class AiPlanSuggestionController extends Controller
{
    public function mealPlan(Request $request, GeminiPlanSuggestionService $gemini): JsonResponse
    {
        $data = $this->validated($request, 'meal');
        $client = $this->clientForProfessional($request, $data['client_uuid'], 'nutritionist');

        return response()->json([
            'data' => $gemini->mealPlan($client, $data),
        ]);
    }

    public function workoutProgram(Request $request, GeminiPlanSuggestionService $gemini): JsonResponse
    {
        $data = $this->validated($request, 'workout');
        $client = $this->clientForProfessional($request, $data['client_uuid'], 'trainer');

        return response()->json([
            'data' => $gemini->workoutProgram($client, $data),
        ]);
    }

    private function validated(Request $request, string $type): array
    {
        $rules = [
            'client_uuid' => ['required', 'uuid', 'exists:clients,uuid'],
            'objective' => ['required', 'string', 'max:500'],
            'preferences' => ['nullable', 'string', 'max:2000'],
            'limitations' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];

        if ($type === 'meal') {
            $rules += [
                'target_calories' => ['required', 'integer', 'min:800', 'max:8000'],
                'meals_count' => ['nullable', 'integer', 'min:1', 'max:10'],
                'plan_type' => ['nullable', 'string', 'max:80'],
            ];
        }

        if ($type === 'workout') {
            $rules += [
                'weekly_frequency' => ['required', 'integer', 'min:1', 'max:7'],
                'session_duration' => ['nullable', 'integer', 'min:15', 'max:240'],
                'equipment' => ['nullable', 'string', 'max:1000'],
                'level' => ['nullable', 'string', 'max:80'],
            ];
        }

        return $request->validate($rules);
    }

    private function clientForProfessional(Request $request, string $uuid, string $speciality): Client
    {
        $user = $request->user();

        if ($user->role !== 'professional' || ! $user->professional || $user->professional->speciality !== $speciality) {
            throw new UserException('Professional is not allowed to generate this suggestion');
        }

        $client = Client::where('uuid', $uuid)->firstOrFail();
        $belongsToProfessional = $client->professionals()
            ->where('professionals.id', $user->professional->id)
            ->wherePivotIn('status', ['active', 'pending_invite'])
            ->exists();

        if (! $belongsToProfessional) {
            throw new UserException('Client does not belong to this professional');
        }

        return $client;
    }
}
