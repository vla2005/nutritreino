<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\MeController;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Controllers\VerifyEmailController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/me', [MeController::class, 'index']);
    Route::match(['post', 'put'], '/me', [MeController::class, 'update']);
});

Route::post('/user/register', [UserController::class, 'store']);
Route::post('/verify-email', [VerifyEmailController::class, 'verify']);
