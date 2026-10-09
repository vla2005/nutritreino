<?php

// No Artisan bootstrap or secrets in output; no jobs are consumed by this check.
try {
    $mode = $argv[1] ?? 'api';
    if (! in_array($mode, ['api', 'queue'], true)) {
        throw new RuntimeException('Unknown healthcheck mode');
    }

    $connection = new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', getenv('DB_HOST'), getenv('DB_PORT') ?: '3306', getenv('DB_DATABASE')),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD'),
        [PDO::ATTR_TIMEOUT => 2, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );
    $connection->query('SELECT 1')->fetchColumn();

    foreach (['/app/storage/app/private', '/app/storage/app/public', '/app/bootstrap/cache'] as $directory) {
        if (! is_writable($directory)) {
            throw new RuntimeException('Runtime directory is not writable');
        }
    }

    if ($mode === 'api') {
        $context = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true]]);
        $response = @file_get_contents('http://127.0.0.1:8080/up', false, $context);
        if ($response === false || ! preg_match('/^HTTP\/\S+ 200\b/', $http_response_header[0] ?? '')) {
            throw new RuntimeException('API health endpoint is unavailable');
        }
    } else {
        $workerFound = false;
        foreach (glob('/proc/[0-9]*/cmdline') ?: [] as $file) {
            $command = str_replace("\0", ' ', @file_get_contents($file) ?: '');
            if (preg_match('/\bphp\s+artisan\s+queue:work\b/', $command)) {
                $workerFound = true;
                break;
            }
        }
        if (! $workerFound) {
            throw new RuntimeException('Queue worker process is unavailable');
        }
    }
    exit(0);
} catch (Throwable $exception) {
    // PDO exceptions can contain connection details; deliberately do not echo them.
    fwrite(STDERR, "NutriTreino healthcheck failed\n");
    exit(1);
}
