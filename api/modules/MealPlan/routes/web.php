<?php

use Illuminate\Support\Facades\Route;
use Modules\MealPlan\Http\Controllers\MealPlanController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('mealplans', MealPlanController::class)->names('mealplan');
});
