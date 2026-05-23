<?php

namespace Modules\Client\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Client\Http\Requests\StoreClientProgressAccessRequest;
use Modules\Client\Models\Client;
use Modules\Client\Models\ClientProgressAccess;
use Modules\Client\Models\ClientProgressRecord;
use Modules\Client\Http\Requests\StoreClientProgressRequest;
use Modules\Client\Services\ClientProgressAccessService;
use Modules\Client\Services\ShowClientProgressService;
use Modules\Client\Services\StoreClientProgressService;
use Modules\Client\Transformers\ClientProgressRecordResource;
use Modules\Professional\Models\Professional;
use Modules\Professional\Transformers\ProfessionalResource;

class ClientProgressController extends Controller
{
    public function accessIndex(Request $request): JsonResponse
    {
        $client = $this->resolveOwnClient($request);

        $granted = $client->progressAccesses()
            ->whereNull('revoked_at')
            ->with('professional.user')
            ->latest('granted_at')
            ->get()
            ->map(fn (ClientProgressAccess $access) => [
                'granted_at' => $access->granted_at?->toISOString(),
                'professional' => (new ProfessionalResource($access->professional))->resolve($request),
            ]);

        $grantedIds = $client->progressAccesses()
            ->whereNull('revoked_at')
            ->pluck('professional_id');

        $candidateIds = $client->professionals()
            ->wherePivotIn('status', ['active', 'pending_invite'])
            ->pluck('professionals.id')
            ->merge($client->workoutPrograms()->pluck('professional_id'))
            ->merge($client->mealPlans()->pluck('professional_id'))
            ->filter()
            ->unique()
            ->values();

        $available = Professional::query()
            ->whereIn('id', $candidateIds)
            ->whereNotIn('professionals.id', $grantedIds)
            ->with('user')
            ->get();

        return response()->json([
            'data' => [
                'granted' => $granted,
                'available' => ProfessionalResource::collection($available)->resolve($request),
            ],
        ]);
    }

    public function grantAccess(StoreClientProgressAccessRequest $request): JsonResponse
    {
        $client = $this->resolveOwnClient($request);
        $professional = Professional::where('uuid', $request->validated('professional_uuid'))->firstOrFail();

        $isLinked = $client->professionals()
            ->where('professionals.id', $professional->id)
            ->wherePivotIn('status', ['active', 'pending_invite'])
            ->exists();

        $hasWorkout = $client->workoutPrograms()
            ->where('professional_id', $professional->id)
            ->exists();

        $hasMealPlan = $client->mealPlans()
            ->where('professional_id', $professional->id)
            ->exists();

        if (! $isLinked && ! $hasWorkout && ! $hasMealPlan) {
            abort(403, 'Esse profissional não está vinculado ao seu acompanhamento.');
        }

        $access = ClientProgressAccess::updateOrCreate(
            [
                'client_id' => $client->id,
                'professional_id' => $professional->id,
            ],
            [
                'granted_at' => now(),
                'revoked_at' => null,
            ]
        );

        $access->load('professional.user');

        return response()->json([
            'message' => 'Acesso ao progresso liberado com sucesso.',
            'data' => [
                'granted_at' => $access->granted_at?->toISOString(),
                'professional' => (new ProfessionalResource($access->professional))->resolve($request),
            ],
        ], 201);
    }

    public function revokeAccess(Request $request, Professional $professional): JsonResponse
    {
        $client = $this->resolveOwnClient($request);

        $access = ClientProgressAccess::where('client_id', $client->id)
            ->where('professional_id', $professional->id)
            ->whereNull('revoked_at')
            ->first();

        if (! $access) {
            abort(404, 'Acesso não encontrado.');
        }

        $access->forceFill(['revoked_at' => now()])->save();

        return response()->json([
            'message' => 'Acesso ao progresso removido com sucesso.',
        ]);
    }

    public function show(
        Request $request,
        ClientProgressAccessService $accessService,
        ShowClientProgressService $showClientProgressService
    ): JsonResponse {
        $client = $accessService->resolveClient($request->user(), $request);

        return response()->json([
            'data' => $showClientProgressService->handle($client),
        ]);
    }

    public function store(
        StoreClientProgressRequest $request,
        StoreClientProgressService $storeClientProgressService
    ): JsonResponse {
        $client = $this->resolveOwnClient($request);
        $record = $storeClientProgressService->handle($request->user(), $client, $request->validated());

        return response()->json([
            'message' => 'Registro de progresso salvo com sucesso.',
            'data' => (new ClientProgressRecordResource($record))->resolve($request),
        ], 201);
    }

    public function feedback(Request $request, ClientProgressRecord $record, ClientProgressAccessService $accessService): JsonResponse
    {
        $user = $request->user();

        if ($user?->role !== 'professional' || ! $user->professional) {
            abort(403, 'Somente profissionais podem enviar feedback.');
        }

        $record->load('client');
        $accessService->authorizeClient($user, $record->client);

        $validated = $request->validate([
            'feedback' => ['required', 'string', 'min:2', 'max:1000'],
        ]);

        $feedback = $record->feedbacks()->updateOrCreate(
            ['professional_id' => $user->professional->id],
            ['feedback' => $validated['feedback']]
        );

        $feedback->load('professional.user');
        $record->load(['measurements', 'photos', 'professional.user', 'feedbacks.professional.user']);

        return response()->json([
            'message' => 'Feedback salvo com sucesso.',
            'data' => (new ClientProgressRecordResource($record))->resolve($request),
        ]);
    }

    private function resolveOwnClient(Request $request): Client
    {
        $client = $request->user()?->client;

        if ($request->user()?->role !== 'client' || ! $client) {
            abort(403, 'Somente o cliente pode gerenciar o acesso ao próprio progresso.');
        }

        return $client;
    }
}
