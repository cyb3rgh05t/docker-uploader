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
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
