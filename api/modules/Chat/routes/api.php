<?php

use Illuminate\Support\Facades\Route;
use Modules\Chat\Http\Controllers\ConversationController;
use Modules\Chat\Http\Controllers\MessageAttachmentController;
use Modules\Chat\Http\Controllers\MessageController;
use Modules\Chat\Http\Controllers\VideoCallSignalController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('conversations', [ConversationController::class, 'index']);
    Route::post('conversations/professionals/{professional}', [ConversationController::class, 'storeWithProfessional']);
    Route::post('conversations/clients/{client}', [ConversationController::class, 'storeWithClient']);
    Route::get('conversations/{conversation}', [ConversationController::class, 'show']);
    Route::post('conversations/{conversation}/read', [ConversationController::class, 'markRead']);
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store']);
    Route::post('conversations/{conversation}/calls/signals', [VideoCallSignalController::class, 'store']);
    Route::get('messages/{message}/attachment', [MessageAttachmentController::class, 'show']);
});
