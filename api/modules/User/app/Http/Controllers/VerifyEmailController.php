<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\User\Http\Requests\VerifyEmailRequest;
use Modules\User\Services\VerifyEmailService;

class VerifyEmailController extends Controller
{
    public function verify(VerifyEmailRequest $request, VerifyEmailService $verifyEmailService )
    {
        $inputs = $request->validated();

        $verifyEmailService->handle($inputs['token']);

        return response()->noContent();
    }
}
