<?php

namespace Tests\Fixtures;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;

class ContainerQueueProbe implements ShouldQueue
{
    public function handle(): void
    {
        Cache::put('container-queue-probe', 'processed', 60);
    }
}
