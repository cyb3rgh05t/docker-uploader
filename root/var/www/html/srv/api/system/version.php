<?php
header('Content-Type: application/json');

// Try multiple possible locations for release.json
$possible_paths = [
    '/app/release.json',           // Main app directory
    '../../../release.json',       // Relative to this file
    '/release.json',               // Root directory
    '/var/www/html/release.json'   // Web root
];

$version = '0.0.0'; // Default version

foreach ($possible_paths as $path) {
    if (file_exists($path)) {
        $content = file_get_contents($path);
        if ($content !== false) {
            $json = json_decode($content, true);
            if (isset($json['newversion'])) {
                $version = $json['newversion'];
                break;
            }
        }
    }
}

// Return the version as JSON
echo json_encode(['version' => $version, 'success' => true]);
