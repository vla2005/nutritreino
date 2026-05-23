<?php

namespace Modules\Client\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Client\Models\Client;
use Modules\Client\Http\Requests\AcceptClientInvitationRequest;
use Modules\Client\Http\Requests\StoreClientInvitationRequest;
use Modules\Client\Services\AcceptClientInvitationService;
use Modules\Client\Services\ShowClientInvitationService;
use Modules\Client\Services\StoreClientInvitationService;
use Modules\Client\Transformers\ClientResource;
use Modules\User\Transformers\UserResource;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        if ($user->role !== 'professional' || ! $user->professional) {
            return response()->json([
                'errors' => 'Only professionals can list clients',
            ], 403);
        }

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $baseQuery = $user->professional->clients();
        $statsQuery = clone $baseQuery;
        $clients = $baseQuery
            ->with('user')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => ClientResource::collection($clients->items())->resolve(request()),
            'meta' => [
                'current_page' => $clients->currentPage(),
                'last_page' => $clients->lastPage(),
                'per_page' => $clients->perPage(),
                'total' => $clients->total(),
                'from' => $clients->firstItem(),
                'to' => $clients->lastItem(),
                'stats' => [
                    'total' => (clone $statsQuery)->count(),
                    'active' => (clone $statsQuery)->wherePivot('status', 'active')->count(),
                    'pending' => (clone $statsQuery)->wherePivot('status', 'pending_invite')->count(),
                    'latest_update' => (clone $statsQuery)->max('clients.updated_at'),
                ],
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('client::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(
        StoreClientInvitationRequest $request,
        StoreClientInvitationService $storeClientInvitationService
    ): JsonResponse {
        $client = $storeClientInvitationService->handle(
            professionalUser: $request->user(),
            data: $request->validated()
        );

        return response()->json([
            'message' => 'Convite enviado com sucesso.',
            'data' => (new ClientResource($client))->resolve($request),
        ], 201);
    }

    public function acceptInvite(
        AcceptClientInvitationRequest $request,
        AcceptClientInvitationService $acceptClientInvitationService
    ): JsonResponse {
        $user = $acceptClientInvitationService->handle($request->validated());

        return response()->json([
            'message' => 'Convite aceito com sucesso.',
            'data' => new UserResource($user),
        ], 201);
    }

    public function showInvite(Request $request, ShowClientInvitationService $showClientInvitationService): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        return response()->json([
            'data' => $showClientInvitationService->handle($request->string('token')->toString()),
        ]);
    }

    /**
     * Show the specified resource.
     */
    public function show(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        $canViewOwnProfile = $user->role === 'client'
            && $user->client
            && $user->client->is($client);

        $linkedClient = null;

        if ($user->role === 'professional' && $user->professional) {
            $linkedClient = $user->professional->clients()
                ->where('clients.id', $client->id)
                ->first();
        }

        $canViewLinkedClient = (bool) $linkedClient;

        abort_unless($canViewOwnProfile || $canViewLinkedClient, 403, 'Cliente não encontrado para este usuário.');

        $client = $linkedClient ?: $client;

        return response()->json([
            'data' => (new ClientResource($client->load(['user', 'professionals.user'])))->resolve($request),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('client::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id) {}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}
}
