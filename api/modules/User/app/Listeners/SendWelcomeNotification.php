<?php

namespace Modules\User\Listeners;

use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Modules\User\Events\UserRegistered;
use Modules\User\Notifications\WelcomeNotification;

class SendWelcomeNotification
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the event.
     */
    public function handle(UserRegistered $event): void
    {
        $event->user->notify(new WelcomeNotification());
    }
}
