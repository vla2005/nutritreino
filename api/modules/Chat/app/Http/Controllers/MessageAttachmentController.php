<?php

namespace Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Modules\Chat\Models\Message;
use Modules\Chat\Services\ConversationAccessService;

class MessageAttachmentController extends Controller
{
    public function __construct(private readonly ConversationAccessService $access) {}

    public function show(Request $request, Message $message)
    {
        $message->load('conversation');

        $this->access->assertCanUseConversation($request->user(), $message->conversation);

        abort_unless($message->hasAttachment(), 404);
        abort_unless($message->attachment_disk === 'local', 404);
        abort_unless(is_string($message->attachment_path) && str_starts_with($message->attachment_path, 'chat/'), 404);
        abort_unless(Storage::disk($message->attachment_disk)->exists($message->attachment_path), 404);
        abort_unless(in_array($message->attachment_mime, $this->allowedMimeTypes(), true), 415);

        $encrypted = Storage::disk($message->attachment_disk)->get($message->attachment_path);
        $contents = Crypt::decrypt($encrypted);
        $name = $message->attachmentName() ?: 'arquivo';

        return response($contents, 200, [
            'Content-Type' => $message->attachment_mime ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.$this->asciiFilename($name).'"',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    private function asciiFilename(string $name): string
    {
        return str_replace('"', '', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) ?: 'arquivo');
    }

    private function allowedMimeTypes(): array
    {
        return [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
    }
}
