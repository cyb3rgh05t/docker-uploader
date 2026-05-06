<?php
include_once(__DIR__ . '/../../../settings.php');
include_once(__DIR__ . '/../../utility.php');

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

$MAIN_LOG = '/system/uploader/logs/uploader.log';

$lines     = isset($_GET['lines'])  ? (int)$_GET['lines']  : 200;
$lines     = max(10, min($lines, 2000));
$offset    = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$filter    = isset($_GET['filter']) ? trim($_GET['filter']) : '';

if (!file_exists($MAIN_LOG)) {
    echo json_encode([
        'success' => true,
        'lines'   => [],
        'total'   => 0,
        'message' => 'Log file not yet created. Waiting for first upload activity.',
    ]);
    exit;
}

// Read all lines, strip any stray ANSI codes
$raw = file($MAIN_LOG, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($raw === false) {
    echo json_encode(['success' => false, 'message' => 'Could not read log file.']);
    exit;
}

// Strip ANSI escape sequences just in case
$raw = array_map(function ($l) {
    return preg_replace('/\x1b\[[0-9;]*m/', '', $l);
}, $raw);

// Apply filter if given
if ($filter !== '') {
    $filterLower = strtolower($filter);
    $raw = array_values(array_filter($raw, function ($l) use ($filterLower) {
        return strpos(strtolower($l), $filterLower) !== false;
    }));
}

$total = count($raw);

// Return last $lines lines from the end (newest last, so keep natural order)
$slice = array_slice($raw, max(0, $total - $lines - $offset), $lines);

// Classify each line for colour-coding
$classified = array_map(function ($line) {
    $lower = strtolower($line);
    if (strpos($lower, '✅') !== false || strpos($lower, 'upload successful') !== false || strpos($lower, 'success') !== false) {
        $type = 'success';
    } elseif (strpos($lower, '❌') !== false || strpos($lower, 'failed') !== false || strpos($lower, 'error') !== false) {
        $type = 'error';
    } elseif (strpos($lower, '⚠') !== false || strpos($lower, 'warn') !== false || strpos($lower, 'stale') !== false) {
        $type = 'warning';
    } elseif (strpos($lower, '🔍') !== false || strpos($lower, 'autoscan') !== false) {
        $type = 'info';
    } elseif (strpos($lower, 'starting upload') !== false || strpos($lower, 'background:') !== false) {
        $type = 'upload';
    } else {
        $type = 'default';
    }
    return ['text' => $line, 'type' => $type];
}, $slice);

$payload = [
    'success' => true,
    'lines'   => $classified,
    'total'   => $total,
];

$json = json_encode($payload);
if ($json === false) {
    echo '{"success":false,"message":"Failed to encode log response."}';
    exit;
}

echo $json;
