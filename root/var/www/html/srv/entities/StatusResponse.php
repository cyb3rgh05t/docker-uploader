<?php

class StatusResponse
{
    public $status;
    public $uptime;
    public $storage;

    public const STATUS_UNKNOWN = 'UNKNOWN';
    public const STATUS_STARTED = 'STARTED';
    public const STATUS_STOPPED = 'STOPPED';

    public function __construct()
    {
        $status = StatusResponse::STATUS_UNKNOWN;
        $uptime = null;
        $storage = null;
    }
}
