<?php

namespace Modules\User\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct() {}

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $verificationUrl = $frontendUrl.'/verify-email?token='.urlencode($notifiable->uuid);

        return (new MailMessage)
            ->subject('Verifique seu email na NutriTreino')
            ->view('emails.nutritreino-message', [
                'title' => 'Verifique seu email na NutriTreino',
                'eyebrow' => 'Confirmacao de cadastro',
                'headline' => 'Bem-vindo(a), '.$notifiable->name.'.',
                'intro' => 'Sua conta foi criada com sucesso. Confirme seu email para liberar seu acesso com segurança.',
                'highlight' => 'A verificação protege seus dados e garante que você receba apenas comunicações importantes da plataforma.',
                'actionUrl' => $verificationUrl,
                'actionLabel' => 'Verificar email',
                'footerNote' => 'Se você não solicitou este cadastro, pode ignorar este email.',
            ]);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [];
    }
}
