<?php

namespace Modules\User\Exceptions;

use Exception;

class UserException extends Exception
{
    protected $code = 400;
    protected $message = 'UserException';

    public function render()
    {
        return response()->json([
            'errors' => $this->getMessage(),
        ], $this->getCode()
        );
    }
}
