<?php

use Illuminate\Support\Facades\Route;
use Modules\Professional\Http\Controllers\NutritionistDashboardController;
use Modules\Professional\Http\Controllers\ProfessionalController;
use Modules\Professional\Http\Controllers\TrainerDashboardController;
use Modules\Professional\Http\Controllers\WorkoutProgramController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('dashboard/nutritionist', NutritionistDashboardController::class);
    Route::get('dashboard/trainer', TrainerDashboardController::class);
    Route::get('professionals/{professional}', [ProfessionalController::class, 'show'])->name('professional.show');
    Route::get('workout-programs', [WorkoutProgramController::class, 'index'])->name('workout-program.index');
    Route::post('workout-programs', [WorkoutProgramController::class, 'store'])->name('workout-program.store');
    Route::get('workout-programs/{workoutProgram}', [WorkoutProgramController::class, 'show'])->name('workout-program.show');
    Route::put('workout-programs/{workoutProgram}', [WorkoutProgramController::class, 'update'])->name('workout-program.update');
    Route::patch('workout-programs/{workoutProgram}', [WorkoutProgramController::class, 'update']);
});
