<?php

class StatusResponse
{
    public $status;

    public const STATUS_UNKNOWN = 'UNKNOWN';
    public const STATUS_STARTED = 'STARTED';
    public const STATUS_STOPPED = 'STOPPED';

    public function __construct(){
        $status = StatusResponse::STATUS_UNKNOWN;
    }
}