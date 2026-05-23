<?php

namespace Modules\Auth\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class AuthException extends Exception
{
    protected $code = 401;
    protected $message = 'Invalid Authentication';

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
        ], 401);
    }
}
