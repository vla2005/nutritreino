<?php

namespace Modules\User\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Professional\Models\Professional;
use Modules\User\Events\UserRegistered;
use Modules\User\Models\User;

class StoreUserService
{
    public function handle(array $data): User
    {
        return DB::transaction(function () use ($data) {
            if (! empty($data['avatar_file'])) {
                $path = $data['avatar_file']->store('avatars', 'public');
                $data['avatar'] = url(Storage::url($path));
            }

            $user = User::create(Arr::only($data, [
                'role',
                'name',
                'email',
                'avatar',
                'phone',
                'cpf',
                'password',
            ]));

            if ($data['role'] === 'professional') {
                Professional::create([
                    'user_id' => $user->id,
                    ...Arr::only($data, [
                        'speciality',
                        'registration',
                        'bio',
                    ]),
                ]);
            }

            UserRegistered::dispatch($user);

            return $user;
        });
    }
}
