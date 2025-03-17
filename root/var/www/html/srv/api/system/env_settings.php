<?php
include_once('../../../settings.php');

header('Content-Type: application/json; charset=utf-8');

/**
 * Get environment settings from the uploader.env file
 */
function getEnvSettings()
{
    $envFile = '/system/uploader/uploader.env';
    $settings = array();

    if (!file_exists($envFile)) {
        return json_encode($settings);
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Skip comments and section headers
        if (strpos($line, '#') === 0 || strpos($line, '##') === 0 || strpos($line, '----') === 0) {
            continue;
        }

        // Parse variable assignments
        if (preg_match('/([A-Za-z0-9_]+)=(.*)/', $line, $matches)) {
            $key = strtolower($matches[1]);
            $value = trim($matches[2]);

            // Remove quotes and default values
            $value = preg_replace('/^["\'](.*)["\']$/', '$1', $value);
            $value = preg_replace('/\${([^:}]+):-([^}]+)}/', '$2', $value);
            $value = preg_replace('/\${([^}]+)}/', '', $value);

            // Convert value type if necessary
            if ($value === 'true' || $value === 'false') {
                $value = $value === 'true';
            } elseif (is_numeric($value)) {
                $value = strpos($value, '.') !== false ? (float) $value : (int) $value;
            } elseif ($value === 'null') {
                $value = null;
            }

            $settings[$key] = $value;
        }
    }

    return json_encode($settings);
}

echo getEnvSettings();
