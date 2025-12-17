<?php
include_once('../../../settings.php');
include_once('../../entities/StatusResponse.php');
include_once('../../utility.php');

function checkStatus()
{
    $response = new StatusResponse();
    $response->status = file_exists(PAUSE_FILE) ? StatusResponse::STATUS_STOPPED : StatusResponse::STATUS_STARTED;

    // Get system uptime
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows
        $uptime = shell_exec('net statistics workstation | find "Statistics since"');
        if ($uptime) {
            $response->uptime = "Available";
        } else {
            $response->uptime = "N/A";
        }
    } else {
        // Linux/Unix
        $uptime = shell_exec('uptime -p');
        if ($uptime) {
            $response->uptime = trim(str_replace('up ', '', $uptime));
        } else {
            $response->uptime = "N/A";
        }
    }

    // Get storage information
    $uploadPath = '/config/downloads';
    if (is_dir($uploadPath)) {
        $total = disk_total_space($uploadPath);
        $free = disk_free_space($uploadPath);
        $used = $total - $free;

        $usedTB = round($used / (1024 ** 4), 2);
        $totalTB = round($total / (1024 ** 4), 2);

        $response->storage = "$usedTB TB / $totalTB TB";
    } else {
        $response->storage = "N/A";
    }

    return json_encode($response);
}

function updateStatus($action)
{
    // Enable error logging
    error_log("Status update requested: Action=$action");

    if ($action === 'pause') {
        // Create pause file to pause uploads
        error_log("Creating pause file: " . PAUSE_FILE);
        $result = file_put_contents(PAUSE_FILE, '');
        if ($result === false) {
            error_log("Failed to create pause file. Check permissions.");
            // Try to fix permissions
            $dir = dirname(PAUSE_FILE);
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
                error_log("Created directory: $dir");
            }
            chmod($dir, 0777);
            error_log("Set directory permissions: $dir");

            // Try again
            $result = file_put_contents(PAUSE_FILE, '');
            error_log("Second attempt to create pause file: " . ($result !== false ? "success" : "failed"));
        }
    } else if ($action === 'continue') {
        // Remove pause file to resume uploads
        error_log("Removing pause file: " . PAUSE_FILE);
        if (file_exists(PAUSE_FILE)) {
            $result = unlink(PAUSE_FILE);
            error_log("Unlink result: " . ($result ? "success" : "failed"));
            if (!$result) {
                error_log("Failed to remove pause file. Error: " . error_get_last()['message']);
                // Try to fix permissions
                chmod(PAUSE_FILE, 0666);
                $result = unlink(PAUSE_FILE);
                error_log("Second attempt: " . ($result ? "success" : "failed"));
            }
        } else {
            error_log("Pause file doesn't exist, nothing to remove.");
        }
    }
}

/** actual logic */
header('Content-Type: application/json; charset=utf-8');

$method = filter_input(\INPUT_SERVER, 'REQUEST_METHOD', \FILTER_SANITIZE_SPECIAL_CHARS);
if ($method === 'POST') {
    // Get the action from POST data
    if (isset($_POST["action"])) {
        $action = $_POST["action"];
        error_log("Received POST with action: $action");
        updateStatus($action);
    } else {
        // Try to get data from JSON input if POST array is empty
        $input = file_get_contents('php://input');
        error_log("Received raw input: $input");

        if (!empty($input)) {
            $data = json_decode($input, true);
            if (isset($data['action'])) {
                $action = $data['action'];
                error_log("Parsed action from JSON: $action");
                updateStatus($action);
            }
        }
    }
}

echo checkStatus();
