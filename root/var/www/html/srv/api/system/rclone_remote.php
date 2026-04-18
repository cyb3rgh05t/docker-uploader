<?php

/**
 * API endpoint to get rclone remote configuration info.
 * GET: Returns the current remote name, type, and config details.
 */

header('Content-Type: application/json');

$configFile = '/app/rclone/rclone.conf';
$sourceConfig = '/system/servicekeys/rclonegdsa.conf';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = [
        'success' => true,
        'configured' => false,
        'remotes' => [],
        'raw_config' => '',
        'config_source' => ''
    ];

    // Determine which config file exists
    if (file_exists($configFile)) {
        $result['config_source'] = 'active';
        $configPath = $configFile;
    } elseif (file_exists($sourceConfig)) {
        $result['config_source'] = 'source';
        $configPath = $sourceConfig;
    } else {
        echo json_encode($result);
        exit;
    }

    // Read raw config for display
    $rawConfig = file_get_contents($configPath);
    if ($rawConfig === false) {
        echo json_encode($result);
        exit;
    }

    // Sanitize sensitive values in raw config display
    $sanitizedConfig = preg_replace(
        '/(pass|password|token|client_secret|service_account_credentials)\s*=\s*.+/i',
        '$1 = ********',
        $rawConfig
    );
    $result['raw_config'] = trim($sanitizedConfig);
    $result['editable_config'] = trim($rawConfig);

    // Parse rclone config (INI-style)
    $remotes = [];
    $currentRemote = null;
    $currentConfig = [];

    foreach (explode("\n", $rawConfig) as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;

        // Section header [remotename]
        if (preg_match('/^\[(.+)\]$/', $line, $matches)) {
            if ($currentRemote !== null) {
                $remotes[$currentRemote] = $currentConfig;
            }
            $currentRemote = $matches[1];
            $currentConfig = [];
            continue;
        }

        // Key = value
        if (strpos($line, '=') !== false) {
            list($key, $value) = array_map('trim', explode('=', $line, 2));
            // Don't expose sensitive values
            $sensitiveKeys = ['pass', 'password', 'token', 'client_secret', 'service_account_credentials'];
            if (in_array(strtolower($key), $sensitiveKeys)) {
                $currentConfig[$key] = '********';
            } else {
                $currentConfig[$key] = $value;
            }
        }
    }

    if ($currentRemote !== null) {
        $remotes[$currentRemote] = $currentConfig;
    }

    // Find the primary (non-crypt) remote
    $primaryRemote = null;
    foreach ($remotes as $name => $config) {
        $type = $config['type'] ?? 'unknown';
        if ($type !== 'crypt') {
            $primaryRemote = $name;
            break;
        }
    }

    // If no non-crypt found, use first one
    if ($primaryRemote === null && !empty($remotes)) {
        $primaryRemote = array_key_first($remotes);
    }

    $result['configured'] = !empty($remotes);
    foreach ($remotes as $name => $config) {
        $remote = [
            'name' => $name,
            'type' => $config['type'] ?? 'unknown',
            'is_primary' => ($name === $primaryRemote),
            'config' => $config
        ];
        $result['remotes'][] = $remote;
    }

    echo json_encode($result);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Save new rclone configuration
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['config']) || empty(trim($input['config']))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No configuration provided']);
        exit;
    }

    $newConfig = trim($input['config']);

    // Validate it looks like a valid rclone config (must have at least one [section])
    if (!preg_match('/^\[.+\]/m', $newConfig)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid rclone config format. Must contain at least one [remote] section.']);
        exit;
    }

    // Create backup of existing config
    if (file_exists($configFile)) {
        $backupFile = $configFile . '.bak.' . date('Ymd_His');
        copy($configFile, $backupFile);
    }

    // Write new config
    $written = file_put_contents($configFile, $newConfig . "\n");
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to write configuration file']);
        exit;
    }

    // Also update the source config so it persists across restarts
    $sourceDir = dirname($sourceConfig);
    if (is_dir($sourceDir)) {
        copy($configFile, $sourceConfig);
    }

    echo json_encode(['success' => true, 'message' => 'Configuration saved successfully']);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
