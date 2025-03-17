<?php
include_once('../../../settings.php');
include_once('../../entities/StatusResponse.php');
include_once('../../utility.php');

function checkStatus()
{
    $response = new StatusResponse();
    $response->status = file_exists(PAUSE_FILE) ? StatusResponse::STATUS_STOPPED : StatusResponse::STATUS_STARTED;
    return json_encode($response);
}

function updateStatus($action)
{
    if ($action === 'pause') {
        $pfile = fopen(PAUSE_FILE, 'w');
        fwrite($pfile, '');
        fclose($pfile);
    } else {
        unlink(PAUSE_FILE);
    }
}

/** actual logic */
header('Content-Type: application/json; charset=utf-8');

$method = filter_input(\INPUT_SERVER, 'REQUEST_METHOD', \FILTER_SANITIZE_SPECIAL_CHARS);
if ($method === 'POST') {
    updateStatus($_POST["action"]);
}
echo checkStatus();
