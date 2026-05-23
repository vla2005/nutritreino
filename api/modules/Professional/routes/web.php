<?php

use Illuminate\Support\Facades\Route;
use Modules\Professional\Http\Controllers\ProfessionalController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('professionals', ProfessionalController::class)->names('professional');
});
