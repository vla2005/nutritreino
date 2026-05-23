<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\User\Http\Requests\UpdateMeRequest;
use Modules\User\Transformers\UserResource;

class MeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        if ($user->role === 'professional') {
            $user->load('professional');
        }

        if ($user->role === 'client') {
            $user->load('client');
        }
        return new UserResource($user);
    }

    public function update(UpdateMeRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $user = DB::transaction(function () use ($user, $data, $request) {
            if ($request->hasFile('avatar_file')) {
                $path = $request->file('avatar_file')->store('avatars', 'public');
                $data['avatar'] = url(Storage::url($path));
            }

            $user->update(Arr::only($data, [
                'name',
                'email',
                'phone',
                'cpf',
                'avatar',
            ]));

            if ($user->role === 'professional' && $user->professional) {
                $user->professional->update(Arr::only($data, [
                    'speciality',
                    'registration',
                    'bio',
                ]));
            }

            if ($user->role === 'client' && $user->client) {
                $user->client->update([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'cpf' => $data['cpf'] ?? null,
                    ...Arr::only($data, [
                        'gender',
                        'birth_date',
                        'height',
                        'weight',
                    ]),
                ]);
            }

            return $user->fresh(['professional', 'client']);
        });

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'data' => new UserResource($user),
        ]);
    }

}
