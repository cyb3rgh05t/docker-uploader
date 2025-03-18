<?php

/**
 * API endpoint for getting queue statistics
 * File: srv/api/jobs/queue_stats.php
 */

include_once('../../../settings.php');
include_once('../../utility.php');

header('Content-Type: application/json; charset=utf-8');

/**
 * Get statistics for files in the upload queue
 */
function getQueueStats()
{
    $response = array(
        'count' => 0,
        'total_size' => 0
    );

    $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);

    // Count files in the queue
    $countQuery = "SELECT COUNT(*) as count FROM upload_queue";
    $countResult = $db->query($countQuery);
    $response['count'] = $countResult->fetchArray()['count'];

    // Calculate total size of files in the queue
    $filesResult = $db->query("SELECT filesize FROM upload_queue");
    $totalBytes = 0;

    while ($row = $filesResult->fetchArray()) {
        $sizeStr = $row['filesize'];
        $totalBytes += convertSizeToBytes($sizeStr);
    }

    $response['total_size'] = $totalBytes;

    $db->close();
    unset($db);

    return json_encode($response);
}

/**
 * Convert a file size string to bytes
 * @param string $sizeStr File size string (e.g. "2.5 GiB", "500 MiB")
 * @return int Size in bytes
 */
function convertSizeToBytes($sizeStr)
{
    if (empty($sizeStr)) {
        return 0;
    }

    // Extract numeric part and unit
    if (preg_match('/^([0-9.]+)\s*([KMGT]i?B?)$/i', $sizeStr, $matches)) {
        $num = (float) $matches[1];
        $unit = strtoupper($matches[2]);

        // Convert based on unit
        switch ($unit) {
            case 'B':
                return (int) $num;
            case 'KB':
            case 'KIB':
                return (int) ($num * 1024);
            case 'MB':
            case 'MIB':
                return (int) ($num * 1024 * 1024);
            case 'GB':
            case 'GIB':
                return (int) ($num * 1024 * 1024 * 1024);
            case 'TB':
            case 'TIB':
                return (int) ($num * 1024 * 1024 * 1024 * 1024);
            default:
                return 0;
        }
    }

    return 0;
}

echo getQueueStats();
