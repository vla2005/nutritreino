<?php

namespace Modules\User\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use Modules\User\Events\UserRegistered;
use Modules\User\Listeners\SendWelcomeNotification;

class EventServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Event::listen(UserRegistered::class, SendWelcomeNotification::class);
    }
}
