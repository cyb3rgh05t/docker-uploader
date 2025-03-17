<?php

class ApiResponse
{
    public $jobs;
    public $total_count;

    public function __construct(){
        $jobs = [];
        $total_count = 0;
    }
}