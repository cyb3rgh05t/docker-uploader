<?php
include_once('../../../settings.php');
include_once('../../entities/StatusResponse.php');
include_once('../../utility.php');

function checkStatus()
{
    $response = new StatusResponse();
    $response->status = file_exists(PAUSE_FILE) ? StatusResponse::STATUS_STOPPED : StatusResponse::STATUS_STARTED;

    // Get container uptime (not host system uptime)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows - fallback to basic info
        $response->uptime = "Running";
    } else {
        // Linux/Unix - Get the uptime of PID 1 (container's main process)
        $stat = @file_get_contents('/proc/1/stat');
        if ($stat) {
            // Extract start time from /proc/1/stat
            $parts = explode(' ', $stat);
            $startTimeJiffies = isset($parts[21]) ? (float)$parts[21] : 0;

            // Get system clock ticks per second
            $clockTicks = 100; // Sensible default for many Linux systems
            $clkTckOutput = @shell_exec('getconf CLK_TCK 2>/dev/null');
            if ($clkTckOutput !== null) {
                $clkTckOutput = trim($clkTckOutput);
                if (is_numeric($clkTckOutput) && (float)$clkTckOutput > 0) {
                    $clockTicks = (float)$clkTckOutput;
                }
            }

            // Get system uptime
            $uptimeData = @file_get_contents('/proc/uptime');
            if ($uptimeData && $startTimeJiffies > 0) {
                $uptimeParts = explode(' ', trim($uptimeData));
                $systemUptime = (float)$uptimeParts[0];

                // Calculate process start time in seconds
                $processStartTime = $startTimeJiffies / $clockTicks;

                // Calculate how long the process has been running
                $processUptime = $systemUptime - $processStartTime;

                // Format the uptime
                $days = floor($processUptime / 86400);
                $hours = floor(($processUptime % 86400) / 3600);
                $minutes = floor(($processUptime % 3600) / 60);

                $uptimeParts = [];
                if ($days > 0) $uptimeParts[] = "$days day" . ($days > 1 ? 's' : '');
                if ($hours > 0) $uptimeParts[] = "$hours hour" . ($hours > 1 ? 's' : '');
                if ($minutes > 0) $uptimeParts[] = "$minutes minute" . ($minutes > 1 ? 's' : '');

                $response->uptime = !empty($uptimeParts) ? implode(', ', $uptimeParts) : 'Just started';
            } else {
                $response->uptime = "N/A";
            }
        } else {
            $response->uptime = "N/A";
        }
    }

    // Get storage information
    $possiblePaths = [
        '/data/downloads',
        '/config/downloads',
        '/downloads',
        dirname(__DIR__, 4) . '/data/downloads',
        __DIR__,
        '/'
    ];

    $storage = "N/A";
    foreach ($possiblePaths as $uploadPath) {
        if (is_dir($uploadPath) && is_readable($uploadPath)) {
            $total = @disk_total_space($uploadPath);
            $free = @disk_free_space($uploadPath);

            if ($total !== false && $free !== false && $total > 0) {
                $used = $total - $free;

                // Use GB for smaller values, TB for larger
                if ($total < 1024 ** 4) {
                    $usedGB = round($used / (1024 ** 3), 2);
                    $totalGB = round($total / (1024 ** 3), 2);
                    $storage = "$usedGB GB / $totalGB GB";
                } else {
                    $usedTB = round($used / (1024 ** 4), 2);
                    $totalTB = round($total / (1024 ** 4), 2);
                    $storage = "$usedTB TB / $totalTB TB";
                }
                break;
            }
        }
    }

    $response->storage = $storage;

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
