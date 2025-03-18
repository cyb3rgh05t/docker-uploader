<?php
include_once('../../../settings.php');

function updateEnvFile($settings)
{
    $envFile = '/system/uploader/uploader.env';

    // Read the current file
    $lines = file($envFile, FILE_IGNORE_NEW_LINES);
    if (!$lines) {
        return ['success' => false, 'message' => 'Could not read env file'];
    }

    // Create backup
    $backupFile = $envFile . '.bak_' . date('YmdHis');
    if (!copy($envFile, $backupFile)) {
        return ['success' => false, 'message' => 'Could not create backup of env file'];
    }

    // Update the values
    foreach ($settings as $key => $value) {
        $found = false;
        foreach ($lines as &$line) {
            if (preg_match('/^' . $key . '=/', $line)) {
                // Properly format the value
                if ($value === 'true' || $value === 'false' || $value === 'null' || is_numeric($value)) {
                    // Boolean, null, or numeric values don't need quotes
                    $line = $key . '=' . $value;
                } else {
                    // String values should be quoted
                    $line = $key . '="' . $value . '"';
                }
                $found = true;
                break;
            }
        }

        // If key wasn't found, add it to appropriate section
        if (!$found) {
            // Determine which section to add it to
            $sectionFound = false;

            // Common settings categories
            $sections = [
                'USER VALUES' => ['PUID', 'PGID', 'TIMEZONE'],
                'CRITICAL SETUP FOR CRYPT USER' => ['HASHPASSWORD', 'GDSA_NAME', 'DB_NAME', 'DB_TEAM'],
                'RCLONE - SETTINGS' => ['BANDWIDTH_LIMIT', 'GOOGLE_IP', 'PROXY', 'LOG_LEVEL', 'DLFOLDER', 'TRANSFERS'],
                'USER - SETTINGS' => ['DRIVEUSEDSPACE', 'FOLDER_DEPTH', 'FOLDER_PRIORITY', 'MIN_AGE_UPLOAD'],
                'VFS - SETTINGS' => ['VFS_REFRESH_ENABLE', 'MOUNT'],
                'LOG - SETTINGS' => ['LOG_ENTRY', 'LOG_RETENTION_DAYS'],
                'AUTOSCAN - SETTINGS' => ['AUTOSCAN_URL', 'AUTOSCAN_USER', 'AUTOSCAN_PASS'],
                'NOTIFICATION - SETTINGS' => ['NOTIFICATION_URL', 'NOTIFICATION_LEVEL', 'NOTIFICATION_SERVERNAME'],
                'STRIPARR - SETTINGS' => ['STRIPARR_URL'],
                'LANGUAGE MESSAGES' => ['LANGUAGE']
            ];

            // Find which section this key belongs to
            $targetSection = null;
            foreach ($sections as $section => $keys) {
                if (in_array($key, $keys)) {
                    $targetSection = $section;
                    break;
                }
            }

            // Default to USER - SETTINGS if no matching section found
            if ($targetSection === null) {
                $targetSection = 'USER - SETTINGS';
            }

            // Find the section in the file
            for ($i = 0; $i < count($lines); $i++) {
                if (strpos($lines[$i], '## ' . $targetSection) !== false) {
                    // Find the end of the section
                    $j = $i + 1;
                    while ($j < count($lines) && !preg_match('/^##\s+/', $lines[$j])) {
                        $j++;
                    }

                    // Format the value
                    $valueFormatted = $value;
                    if ($value !== 'true' && $value !== 'false' && $value !== 'null' && !is_numeric($value)) {
                        $valueFormatted = '"' . $value . '"';
                    }

                    // Insert the new key-value at the end of the section
                    array_splice($lines, $j, 0, $key . '=' . $valueFormatted);
                    $sectionFound = true;
                    break;
                }
            }

            // If section not found, add it at the end before the footer
            if (!$sectionFound) {
                // Find the footer
                $footerIdx = array_search('#-------------------------------------------------------', $lines);
                if ($footerIdx !== false) {
                    $valueFormatted = $value;
                    if ($value !== 'true' && $value !== 'false' && $value !== 'null' && !is_numeric($value)) {
                        $valueFormatted = '"' . $value . '"';
                    }

                    array_splice($lines, $footerIdx, 0, [
                        '',
                        '## CUSTOM - SETTINGS',
                        $key . '=' . $valueFormatted
                    ]);
                }
            }
        }
    }

    // Write the file back
    if (file_put_contents($envFile, implode("\n", $lines)) === false) {
        // Restore backup on failure
        copy($backupFile, $envFile);
        return ['success' => false, 'message' => 'Could not write env file'];
    }

    // Set proper permissions
    chmod($envFile, 0755);
    chown($envFile, 'abc');
    chgrp($envFile, 'abc');

    // Remove backups older than 7 days
    $oldBackups = glob($envFile . '.bak_*');
    foreach ($oldBackups as $backup) {
        if (filemtime($backup) < time() - 7 * 24 * 60 * 60) {
            unlink($backup);
        }
    }

    return ['success' => true, 'message' => 'Settings updated successfully'];
}

function readEnvFile()
{
    $envFile = '/system/uploader/uploader.env';
    $settings = [];

    // Check if file exists
    if (!file_exists($envFile)) {
        return ['success' => false, 'message' => 'Environment file not found'];
    }

    // Read file
    $lines = file($envFile, FILE_IGNORE_NEW_LINES);
    foreach ($lines as $line) {
        // Skip comments and empty lines
        if (empty($line) || $line[0] == '#' || strpos($line, '=') === false) {
            continue;
        }

        // Parse key=value
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        // Remove quotes if present
        if (preg_match('/^"(.*)"$/', $value, $matches)) {
            $value = $matches[1];
        }

        // Convert special values
        if ($value === 'true') {
            $value = true;
        } elseif ($value === 'false') {
            $value = false;
        } elseif ($value === 'null') {
            $value = null;
        } elseif (is_numeric($value)) {
            $value = $value + 0; // Convert to number
        }

        $settings[$key] = $value;
    }

    return ['success' => true, 'settings' => $settings];
}

// Handle requests
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        echo json_encode(readEnvFile());
        break;

    case 'POST':
        $settings = json_decode(file_get_contents('php://input'), true);
        if ($settings) {
            echo json_encode(updateEnvFile($settings));
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        }
        break;

    default:
        header('HTTP/1.1 405 Method Not Allowed');
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
