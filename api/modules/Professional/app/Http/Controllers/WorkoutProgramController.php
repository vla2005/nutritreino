<?php

namespace Modules\Professional\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Professional\Http\Requests\StoreWorkoutProgramRequest;
use Modules\Professional\Http\Requests\UpdateWorkoutProgramRequest;
use Modules\Professional\Models\WorkoutProgram;
use Modules\Professional\Services\ListWorkoutProgramsService;
use Modules\Professional\Services\ShowWorkoutProgramService;
use Modules\Professional\Services\StoreWorkoutProgramService;
use Modules\Professional\Services\UpdateWorkoutProgramService;
use Modules\Professional\Transformers\WorkoutProgramResource;

class WorkoutProgramController extends Controller
{
    public function index(Request $request, ListWorkoutProgramsService $listWorkoutProgramsService)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:active,draft,archived'],
            'goal' => ['nullable', 'string', 'max:120'],
        ]);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $workoutPrograms = $listWorkoutProgramsService->handle(
            $request->user(),
            $perPage,
            $request->query('client_uuid'),
            [
                'search' => trim((string) ($filters['search'] ?? '')) ?: null,
                'status' => $filters['status'] ?? null,
                'goal' => $filters['goal'] ?? null,
            ]
        );

        return response()->json([
            'data' => WorkoutProgramResource::collection($workoutPrograms->items())->resolve($request),
            'meta' => [
                'current_page' => $workoutPrograms->currentPage(),
                'last_page' => $workoutPrograms->lastPage(),
                'per_page' => $workoutPrograms->perPage(),
                'total' => $workoutPrograms->total(),
                'from' => $workoutPrograms->firstItem(),
                'to' => $workoutPrograms->lastItem(),
                'stats' => $listWorkoutProgramsService->stats($request->user(), $request->query('client_uuid')),
                'filters' => [
                    'goals' => $listWorkoutProgramsService->goals($request->user(), $request->query('client_uuid')),
                ],
            ],
        ]);
    }

    public function store(StoreWorkoutProgramRequest $request, StoreWorkoutProgramService $storeWorkoutProgramService)
    {
        $workoutProgram = $storeWorkoutProgramService->handle($request->user(), $request->validated());

        return response()->json([
            'message' => 'Programa de treino criado com sucesso.',
            'data' => (new WorkoutProgramResource($workoutProgram))->resolve($request),
        ], 201);
    }

    public function show(Request $request, WorkoutProgram $workoutProgram, ShowWorkoutProgramService $showWorkoutProgramService)
    {
        $workoutProgram = $showWorkoutProgramService->handle($request->user(), $workoutProgram);

        return response()->json([
            'data' => (new WorkoutProgramResource($workoutProgram))->resolve($request),
        ]);
    }

    public function update(UpdateWorkoutProgramRequest $request, WorkoutProgram $workoutProgram, UpdateWorkoutProgramService $updateWorkoutProgramService)
    {
        $workoutProgram = $updateWorkoutProgramService->handle($request->user(), $workoutProgram, $request->validated());

        return response()->json([
            'message' => 'Programa de treino atualizado com sucesso.',
            'data' => (new WorkoutProgramResource($workoutProgram))->resolve($request),
        ]);
    }
}
