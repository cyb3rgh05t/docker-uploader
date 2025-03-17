<?php
include_once('../../../settings.php');

header('Content-Type: application/json; charset=utf-8');

/**
 * Update environment settings in the uploader.env file
 */
function updateEnvSettings()
{
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return json_encode(array(
            'success' => false,
            'message' => 'Invalid request method. Only POST is allowed.'
        ));
    }

    // Get the request data
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !is_array($data)) {
        return json_encode(array(
            'success' => false,
            'message' => 'Invalid request data.'
        ));
    }

    $envFile = '/system/uploader/uploader.env';

    // Check if file exists and is writable
    if (!file_exists($envFile)) {
        return json_encode(array(
            'success' => false,
            'message' => 'Environment file not found.'
        ));
    }

    if (!is_writable($envFile)) {
        return json_encode(array(
            'success' => false,
            'message' => 'Environment file is not writable.'
        ));
    }

    // Read the current env file
    $lines = file($envFile, FILE_IGNORE_NEW_LINES);
    $updated = false;

    // Sanitize and validate input data
    foreach ($data as $key => &$value) {
        // Remove any dangerous characters
        $key = preg_replace('/[^A-Za-z0-9_]/', '', $key);

        // Format the value properly based on type
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        } elseif (is_null($value)) {
            $value = 'null';
        } elseif (is_string($value) && strpos($value, ' ') !== false) {
            $value = '"' . $value . '"';
        }
    }

    // Update the env file with new values
    foreach ($lines as $i => $line) {
        foreach ($data as $key => $value) {
            $pattern = '/^(' . strtoupper($key) . '=).*/i';

            if (preg_match($pattern, $line)) {
                $lines[$i] = preg_replace($pattern, '$1' . $value, $line);
                $updated = true;

                // Remove from data array to keep track of what's been processed
                unset($data[$key]);
            }
        }
    }

    // Add any settings that weren't found (new settings)
    if (!empty($data)) {
        // Find the end section marker
        $endIndex = array_search('#-------------------------------------------------------', $lines);

        if ($endIndex !== false) {
            $insertIndex = $endIndex;

            // Find the appropriate section to add the setting
            foreach ($data as $key => $value) {
                // Convert key to uppercase for env file
                $upperKey = strtoupper($key);
                $newLine = "$upperKey=$value";

                // Insert the new line before the end section
                array_splice($lines, $insertIndex, 0, $newLine);
                $insertIndex++;
                $updated = true;
            }
        }
    }

    if (!$updated) {
        return json_encode(array(
            'success' => false,
            'message' => 'No settings were updated.'
        ));
    }

    // Write the updated content back to the file
    if (file_put_contents($envFile, implode("\n", $lines)) === false) {
        return json_encode(array(
            'success' => false,
            'message' => 'Failed to write to environment file.'
        ));
    }

    return json_encode(array(
        'success' => true,
        'message' => 'Settings updated successfully.'
    ));
}

echo updateEnvSettings();
