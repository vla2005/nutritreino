<?php

namespace Modules\Chat\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Chat\Events\MessageSent;
use Modules\Chat\Models\Conversation;
use Modules\Chat\Models\Message;
use Modules\User\Models\User;

class MessageService
{
    public function create(Conversation $conversation, User $sender, ?string $body, ?UploadedFile $attachment): Message
    {
        return DB::transaction(function () use ($conversation, $sender, $body, $attachment): Message {
            $payload = [
                'sender_id' => $sender->id,
                'encrypted_body' => filled($body) ? Crypt::encryptString($body) : null,
                'type' => $attachment ? $this->typeFor($attachment) : 'text',
            ];

            if ($attachment) {
                $payload = [
                    ...$payload,
                    ...$this->storeEncryptedAttachment($conversation, $attachment),
                ];
            }

            $message = $conversation->messages()->create($payload);

            $conversation->forceFill(['last_message_at' => now()])->save();

            $message->load('sender', 'conversation.firstUser', 'conversation.secondUser');

            broadcast(new MessageSent($message))->toOthers();

            return $message;
        });
    }

    private function storeEncryptedAttachment(Conversation $conversation, UploadedFile $attachment): array
    {
        $disk = 'local';
        $extension = $attachment->getClientOriginalExtension() ?: 'bin';
        $path = sprintf('chat/%s/%s.%s', $conversation->uuid, Str::uuid(), $extension);

        Storage::disk($disk)->put($path, Crypt::encrypt($attachment->get()));

        return [
            'attachment_disk' => $disk,
            'attachment_path' => $path,
            'encrypted_attachment_name' => Crypt::encryptString($attachment->getClientOriginalName()),
            'attachment_mime' => $attachment->getClientMimeType(),
            'attachment_size' => $attachment->getSize(),
        ];
    }

    private function typeFor(UploadedFile $attachment): string
    {
        return str_starts_with((string) $attachment->getClientMimeType(), 'image/') ? 'image' : 'file';
    }
}
