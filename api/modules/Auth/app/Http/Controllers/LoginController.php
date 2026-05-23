<?php

namespace Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Services\CheckUserCredentialsService;

class LoginController extends Controller
{
    public function __invoke(LoginRequest $request, CheckUserCredentialsService $checkUserCredentialsService)
    {
        $inputs = $request->validated();

        $user = $checkUserCredentialsService->handle(
            email: $inputs['email'],
            password: $inputs['password']
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
        ]);
    }
}
