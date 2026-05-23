<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Hash;
use Modules\Auth\Exceptions\AuthException;
use Modules\User\Models\User;

class CheckUserCredentialsService
{
    public function handle(string $email, string $password)
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw new AuthException('Invalid Authentication');
        }

        if ( is_null($user->email_verified_at)){
            throw new AuthException('Email is not verified');
        }

        return $user;
    }
}
