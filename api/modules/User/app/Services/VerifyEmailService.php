<?php

namespace Modules\User\Services;

use Modules\User\Exceptions\UserException;
use Modules\User\Models\User;

class VerifyEmailService
{
    public function handle(string $token)
    {
        $user = User::where('uuid', $token)->first();
        if (! $user) {
            throw new UserException('Invalid Verification Token');
        }

        if ($user->email_verified_at) {
            return $user;
        }

        $user->update([
            'email_verified_at' => now(),
        ]);

        return $user;
    }
}
