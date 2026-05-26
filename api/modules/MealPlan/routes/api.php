<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AiPlanSuggestionController;
use Modules\MealPlan\Http\Controllers\MealPlanController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('mealplans/ai-suggestion', [AiPlanSuggestionController::class, 'mealPlan']);
    Route::get('mealplans', [MealPlanController::class, 'index'])->name('mealplan.index');
    Route::post('mealplans', [MealPlanController::class, 'store'])->name('mealplan.store');
    Route::get('mealplans/{mealPlan}', [MealPlanController::class, 'show'])->name('mealplan.show');
    Route::put('mealplans/{mealPlan}', [MealPlanController::class, 'update'])->name('mealplan.update');
    Route::patch('mealplans/{mealPlan}', [MealPlanController::class, 'update']);
});
