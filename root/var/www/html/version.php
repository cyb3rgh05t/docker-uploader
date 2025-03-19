<?php
header('Content-Type: application/json');
$version = json_decode(file_get_contents('../app/release.json'), true)['newversion'] ?? '0.0.0';
echo json_encode(['version' => $version]);
