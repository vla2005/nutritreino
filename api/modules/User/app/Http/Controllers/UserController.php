<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\User\Events\UserRegistered;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Services\StoreUserService;
use Modules\User\Transformers\UserResource;

class UserController extends Controller
{
    public function store(StoreUserRequest $request, StoreUserService $storeUserService): JsonResponse
    {
        $user = $storeUserService->handle($request->validated());

        return response()->json([
            'message' => 'Usuário criado com sucesso.',
            'data' => new UserResource($user),
        ], 201);
    }
}
