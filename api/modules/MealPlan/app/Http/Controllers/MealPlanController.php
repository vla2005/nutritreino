<?php

namespace Modules\MealPlan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\MealPlan\Http\Requests\StoreMealPlanRequest;
use Modules\MealPlan\Http\Requests\UpdateMealPlanRequest;
use Modules\MealPlan\Models\MealPlan;
use Modules\MealPlan\Services\ListMealPlansService;
use Modules\MealPlan\Services\ShowMealPlanService;
use Modules\MealPlan\Services\StoreMealPlanService;
use Modules\MealPlan\Services\UpdateMealPlanService;
use Modules\MealPlan\Transformers\MealPlanResource;

class MealPlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, ListMealPlansService $listMealPlansService)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:active,inactive,finished'],
        ]);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $mealPlans = $listMealPlansService->handle(
            $request->user(),
            $perPage,
            $request->query('client_uuid'),
            [
                'search' => trim((string) ($filters['search'] ?? '')) ?: null,
                'status' => $filters['status'] ?? null,
            ]
        );

        return response()->json([
            'data' => MealPlanResource::collection($mealPlans->items())->resolve($request),
            'meta' => [
                'current_page' => $mealPlans->currentPage(),
                'last_page' => $mealPlans->lastPage(),
                'per_page' => $mealPlans->perPage(),
                'total' => $mealPlans->total(),
                'from' => $mealPlans->firstItem(),
                'to' => $mealPlans->lastItem(),
                'stats' => $listMealPlansService->stats($request->user(), $request->query('client_uuid')),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('mealplan::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMealPlanRequest $request, StoreMealPlanService $storeMealPlanService)
    {
        $mealPlan = $storeMealPlanService->handle($request->user(), $request->validated());

        return response()->json([
            'message' => 'Plano alimentar criado com sucesso.',
            'data' => (new MealPlanResource($mealPlan))->resolve($request),
        ], 201);
    }

    /**
     * Show the specified resource.
     */
    public function show(Request $request, MealPlan $mealPlan, ShowMealPlanService $showMealPlanService)
    {
        $mealPlan = $showMealPlanService->handle($request->user(), $mealPlan);

        return response()->json([
            'data' => (new MealPlanResource($mealPlan))->resolve($request),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('mealplan::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMealPlanRequest $request, MealPlan $mealPlan, UpdateMealPlanService $updateMealPlanService)
    {
        $mealPlan = $updateMealPlanService->handle($request->user(), $mealPlan, $request->validated());

        return response()->json([
            'message' => 'Plano alimentar atualizado com sucesso.',
            'data' => (new MealPlanResource($mealPlan))->resolve($request),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}
}
