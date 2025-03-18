<?php
include_once('../../../settings.php');

header('Content-Type: application/json; charset=utf-8');

/**
 * Update environment settings in the uploader.env file
 */
function updateEnvSettings()
{
    // Enable error logging for debugging
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    error_log("update_env.php called");

    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
        return json_encode(array(
            'success' => false,
            'message' => 'Invalid request method. Only POST is allowed.'
        ));
    }

    // Get the request data
    $rawInput = file_get_contents('php://input');
    error_log("Raw input received: " . $rawInput);

    $data = json_decode($rawInput, true);

    if (!$data || !is_array($data)) {
        error_log("Invalid data format received");

        // Try to get regular POST data if JSON parsing failed
        if (!empty($_POST)) {
            $data = $_POST;
            error_log("Using standard POST data instead: " . print_r($data, true));
        } else {
            return json_encode(array(
                'success' => false,
                'message' => 'Invalid request data.',
                'received' => $rawInput
            ));
        }
    }

    error_log("Processing data: " . print_r($data, true));

    // Use the full path defined in the Docker container
    $envFile = '/system/uploader/uploader.env';

    // Check if file exists and is writable
    if (!file_exists($envFile)) {
        error_log("Environment file not found: $envFile");
        return json_encode(array(
            'success' => false,
            'message' => 'Environment file not found.',
            'path' => $envFile
        ));
    }

    // Check permissions
    $filePerms = substr(sprintf('%o', fileperms($envFile)), -4);
    error_log("File permissions: $filePerms");

    if (!is_writable($envFile)) {
        error_log("Environment file is not writable: $envFile");

        // Try to fix permissions
        $chmodResult = chmod($envFile, 0666);
        error_log("Attempted to fix permissions: " . ($chmodResult ? "success" : "failed"));

        if (!is_writable($envFile)) {
            return json_encode(array(
                'success' => false,
                'message' => 'Environment file is not writable.',
                'permissions' => $filePerms
            ));
        }
    }

    // Create a backup before modifying
    $backupFile = $envFile . '.bak.' . date('YmdHis');
    if (!copy($envFile, $backupFile)) {
        error_log("Failed to create backup file");
        return json_encode(array(
            'success' => false,
            'message' => 'Failed to create backup file.'
        ));
    }

    // Read the current env file
    $lines = file($envFile, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        error_log("Failed to read environment file");
        return json_encode(array(
            'success' => false,
            'message' => 'Failed to read environment file.'
        ));
    }

    error_log("Read " . count($lines) . " lines from environment file");
    $updated = false;

    // Process input data - special handling for certain fields
    foreach ($data as $key => &$value) {
        // Skip empty or invalid keys
        if (empty($key) || !is_string($key)) {
            continue;
        }

        // Remove any dangerous characters
        $key = preg_replace('/[^A-Za-z0-9_]/', '', $key);

        // Special handling for BANDWIDTH_LIMIT
        if ($key === 'BANDWIDTH_LIMIT' && !empty($value) && $value !== 'null' && !preg_match('/[KMG]$/i', $value)) {
            // Append 'M' if no unit is specified
            $value = $value . 'M';
            error_log("Added M suffix to bandwidth limit: $value");
        }

        error_log("Processed setting: $key=$value");
    }
    // Important: unset the reference to avoid issues
    unset($value);

    // Update the env file with new values
    foreach ($lines as $i => $line) {
        foreach ($data as $key => $value) {
            // Match the exact key at the start of the line
            $upperKey = strtoupper($key);
            $pattern = '/^' . preg_quote($upperKey, '/') . '=/';

            if (preg_match($pattern, $line)) {
                $oldLine = $lines[$i];

                // Check if the value needs quotes
                if ($value === 'true' || $value === 'false' || $value === 'null' || is_numeric($value)) {
                    $formattedValue = $value;
                } else {
                    // If the value already has quotes, keep them
                    if (preg_match('/^".*"$/', $value) || preg_match("/^'.*'$/", $value)) {
                        $formattedValue = $value;
                    } else {
                        $formattedValue = '"' . $value . '"';
                    }
                }

                $lines[$i] = $upperKey . '=' . $formattedValue;

                error_log("Updated line: '$oldLine' to '{$lines[$i]}'");
                $updated = true;

                // Remove from data array to keep track of what's been processed
                unset($data[$key]);
            }
        }
    }

    // Add any settings that weren't found (new settings)
    if (!empty($data)) {
        error_log("Adding new settings: " . print_r($data, true));

        // Find the end section marker
        $endMarkerPattern = '/^#-+$/';
        $endIndex = null;

        foreach ($lines as $i => $line) {
            if (preg_match($endMarkerPattern, $line) && $i > count($lines) / 2) {
                $endIndex = $i;
                break;
            }
        }

        if ($endIndex !== null) {
            $insertIndex = $endIndex;

            // Find the appropriate section to add the setting
            foreach ($data as $key => $value) {
                // Convert key to uppercase for env file
                $upperKey = strtoupper($key);

                // Check if the value needs quotes
                if ($value === 'true' || $value === 'false' || $value === 'null' || is_numeric($value)) {
                    $formattedValue = $value;
                } else {
                    if (preg_match('/^".*"$/', $value) || preg_match("/^'.*'$/", $value)) {
                        $formattedValue = $value;
                    } else {
                        $formattedValue = '"' . $value . '"';
                    }
                }

                $newLine = "$upperKey=$formattedValue";

                error_log("Inserting new line at $insertIndex: $newLine");

                // Insert the new line before the end section
                array_splice($lines, $insertIndex, 0, $newLine);
                $insertIndex++;
                $updated = true;
            }
        } else {
            error_log("Could not find end marker in env file");
        }
    }

    if (!$updated) {
        error_log("No settings were updated");
        return json_encode(array(
            'success' => false,
            'message' => 'No settings were updated.'
        ));
    }

    error_log("Writing " . count($lines) . " lines back to file");

    // Write the updated content back to the file
    $result = file_put_contents($envFile, implode("\n", $lines));
    if ($result === false) {
        error_log("Failed to write to environment file");
        return json_encode(array(
            'success' => false,
            'message' => 'Failed to write to environment file.'
        ));
    }

    error_log("Successfully wrote $result bytes to environment file");
    return json_encode(array(
        'success' => true,
        'message' => 'Settings updated successfully.',
        'bytes_written' => $result
    ));
}

echo updateEnvSettings();
