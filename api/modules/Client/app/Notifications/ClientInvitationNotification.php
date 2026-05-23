<?php

namespace Modules\Client\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Modules\Client\Models\Client;
use Modules\User\Models\User;

class ClientInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Client $client,
        private readonly string $token,
        private readonly User $professionalUser,
        private readonly bool $requiresPassword = true,
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $invitationUrl = $frontendUrl.'/accept-invite?token='.urlencode($this->token);

        $professionalName = $this->professionalUser->name ?: 'NutriTreino';

        return (new MailMessage)
            ->subject($this->requiresPassword ? 'Crie seu acesso na NutriTreino' : 'Novo convite na NutriTreino')
            ->view('emails.nutritreino-message', [
                'title' => $this->requiresPassword ? 'Crie seu acesso na NutriTreino' : 'Aceite seu convite na NutriTreino',
                'eyebrow' => 'Convite de acompanhamento',
                'headline' => 'Ola, '.$this->client->name.'.',
                'intro' => $professionalName.' convidou você para acompanhar seus planos, treinos e orientações pela NutriTreino.',
                'highlight' => $this->requiresPassword
                    ? 'Para comecar, crie uma senha segura e acesse sua area do cliente.'
                    : 'Sua conta ja existe. Basta aceitar o convite e entrar com seu login atual.',
                'actionUrl' => $invitationUrl,
                'actionLabel' => $this->requiresPassword ? 'Criar minha senha' : 'Aceitar convite',
                'footerNote' => 'Se você não reconhece este convite, pode ignorar este email com segurança.',
            ]);
    }

    public function toArray($notifiable): array
    {
        return [];
    }
}
