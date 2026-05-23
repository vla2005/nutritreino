<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\Http\Controllers\LoginController;
use Modules\Auth\Http\Controllers\LogoutController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', LogoutController::class);
});

Route::post('/login', LoginController::class);

