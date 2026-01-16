<?php
// File: /var/www/html/srv/api/system/version.php
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_log('Version API called');

// Try multiple possible locations for release.json
$possible_paths = [
    '/app/release.json',           // Main app directory
    '../../../release.json',       // Relative to this file
    '/release.json',               // Root directory
    '/var/www/html/release.json',   // Web root
    '/system/release.json',        // System directory
    __DIR__ . '/../../../release.json', // Absolute path based on this file
    __DIR__ . '/../../../../release.json', // One level up
    dirname(__DIR__, 3) . '/release.json' // Another way to go up 3 directories
];

$webui_version = '5.0.0'; // Default WebUI version
$uploader_version = '3.0.0'; // Default Uploader version
$found_path = 'None found';
$debug_info = [];

foreach ($possible_paths as $path) {
    $debug_info[$path] = file_exists($path) ? "Exists" : "Not found";

    if (file_exists($path)) {
        $content = file_get_contents($path);
        if ($content !== false) {
            $debug_info[$path] .= " - Content length: " . strlen($content);

            try {
                $json = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $debug_info[$path] .= " - Valid JSON";

                    // New dual version format
                    if (isset($json['webui_version']) && isset($json['uploader_version'])) {
                        $webui_version = $json['webui_version'];
                        $uploader_version = $json['uploader_version'];
                        $found_path = $path;
                        $debug_info[$path] .= " - Found webui: " . $webui_version . ", uploader: " . $uploader_version;
                        break;
                    }
                    // Legacy single version format (fallback)
                    elseif (isset($json['newversion'])) {
                        $webui_version = $json['newversion'];
                        $uploader_version = $json['newversion'];
                        $found_path = $path;
                        $debug_info[$path] .= " - Found legacy version: " . $webui_version;
                        break;
                    } else {
                        $debug_info[$path] .= " - No version fields found";
                        $debug_info[$path] .= " - Available keys: " . implode(', ', array_keys($json));
                    }
                } else {
                    $debug_info[$path] .= " - Invalid JSON: " . json_last_error_msg();
                }
            } catch (Exception $e) {
                $debug_info[$path] .= " - Exception: " . $e->getMessage();
            }
        } else {
            $debug_info[$path] .= " - Couldn't read file";
        }
    }
}

// Return comprehensive version information
echo json_encode([
    'webui_version' => $webui_version,
    'uploader_version' => $uploader_version,
    'version' => $webui_version, // Legacy compatibility
    'success' => true,
    'found_path' => $found_path
]);

// Also log this information to the error log
error_log('Version API result: WebUI=' . $webui_version . ', Uploader=' . $uploader_version . ' from path: ' . $found_path);
