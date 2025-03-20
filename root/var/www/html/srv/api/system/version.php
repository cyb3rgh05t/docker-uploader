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

$version = '0.0.0'; // Default version
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
                    if (isset($json['newversion'])) {
                        $version = $json['newversion'];
                        $found_path = $path;
                        $debug_info[$path] .= " - Found version: " . $version;
                        break;
                    } else {
                        $debug_info[$path] .= " - No 'newversion' field found";
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

// Try file_get_contents on a known file to verify permissions
$test_file = '/var/www/html/index.html';
$can_read_test = file_exists($test_file) ? "Yes" : "No";
$test_content = file_exists($test_file) ? (file_get_contents($test_file) !== false ? "Can read" : "Cannot read") : "N/A";

// Let's also print information about the current script
$current_script = [
    'script_path' => __FILE__,
    'script_dir' => __DIR__,
    'parent_dir' => dirname(__DIR__),
    'cwd' => getcwd(),
    'file_perms' => function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'Unknown user'
];

// Return comprehensive debug information
echo json_encode([
    'version' => $version,
    'success' => true,
    'found_path' => $found_path,
    'paths_checked' => $debug_info,
    'test_file_exists' => $can_read_test,
    'test_file_readable' => $test_content,
    'script_info' => $current_script
]);

// Also log this information to the error log
error_log('Version API result: ' . $version . ' from path: ' . $found_path);
error_log('Debug paths: ' . json_encode($debug_info));
