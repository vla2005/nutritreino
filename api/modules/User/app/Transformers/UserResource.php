<?php

namespace Modules\User\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Client\Transformers\ClientResource;
use Modules\Professional\Transformers\ProfessionalResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'avatar' => $this->avatarUrl($this->avatar),
            'email' => $this->email,
            'document' => $this->document,
            'phone' => $this->phone,
            'cpf' => $this->cpf,
            'role' => $this->role,

            'professional' => $this->when(
                $this->role === 'professional',
                fn () => [
                    'uuid' => $this->professional?->uuid,
                    'speciality' => $this->professional?->speciality,
                    'registration' => $this->professional?->registration,
                    'bio' => $this->professional?->bio,
                ]
            ),
            'client' => $this->when(
                $this->role === 'client',
                fn () => $this->client ? [
                    ...((new ClientResource($this->client))->resolve($request)),
                    'professionals' => $this->whenLoaded('client', fn () => ProfessionalResource::collection($this->client?->professionals ?? collect())),
                ] : null
            ),
        ];
    }

    private function avatarUrl(?string $avatar): ?string
    {
        if (! $avatar) {
            return null;
        }

        $avatar = trim(str_replace('\/', '/', $avatar));

        if (
            str_starts_with($avatar, 'http://') ||
            str_starts_with($avatar, 'https://') ||
            str_starts_with($avatar, 'data:') ||
            str_starts_with($avatar, 'blob:')
        ) {
            return $avatar;
        }

        if (str_starts_with($avatar, '/storage/')) {
            return url($avatar);
        }

        if (str_starts_with($avatar, 'storage/')) {
            return url('/' . $avatar);
        }

        return $avatar;
    }
}
