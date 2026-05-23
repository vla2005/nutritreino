<?php

use Illuminate\Support\Facades\Route;
use Modules\Client\Http\Controllers\ClientController;
use Modules\Client\Http\Controllers\ClientProgressController;

Route::get('/clients/invite', [ClientController::class, 'showInvite']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients/invite', [ClientController::class, 'store']);
    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::get('/progress/access', [ClientProgressController::class, 'accessIndex']);
    Route::post('/progress/access', [ClientProgressController::class, 'grantAccess']);
    Route::delete('/progress/access/{professional}', [ClientProgressController::class, 'revokeAccess']);
    Route::get('/progress', [ClientProgressController::class, 'show']);
    Route::post('/progress', [ClientProgressController::class, 'store']);
    Route::post('/progress/records/{record}/feedback', [ClientProgressController::class, 'feedback']);
});

Route::post('/clients/accept-invite', [ClientController::class, 'acceptInvite']);
