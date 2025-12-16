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

    try {
        // Check if database file exists
        if (!file_exists(DATABASE)) {
            error_log("Database file does not exist: " . DATABASE);
            $response['error'] = "Database file not found";
            return json_encode($response);
        }

        // Check if database is readable
        if (!is_readable(DATABASE)) {
            error_log("Database file is not readable: " . DATABASE);
            $response['error'] = "Database file not readable";
            return json_encode($response);
        }

        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);

        // Check if upload_queue table exists
        $tableCheck = $db->querySingle("SELECT name FROM sqlite_master WHERE type='table' AND name='upload_queue'");
        if (!$tableCheck) {
            error_log("Table 'upload_queue' does not exist in database");
            $response['error'] = "Table 'upload_queue' not found";
            $db->close();
            return json_encode($response);
        }

        // Count files in the queue
        $countQuery = "SELECT COUNT(*) as count FROM upload_queue";
        $countResult = $db->query($countQuery);

        if ($countResult) {
            $countRow = $countResult->fetchArray();
            $response['count'] = $countRow ? $countRow['count'] : 0;
        }

        // Calculate total size of files in the queue
        $filesResult = $db->query("SELECT filesize FROM upload_queue");
        $totalBytes = 0;

        if ($filesResult) {
            while ($row = $filesResult->fetchArray()) {
                $sizeStr = $row['filesize'];
                $totalBytes += convertSizeToBytes($sizeStr);
            }
        }

        $response['total_size'] = $totalBytes;

        $db->close();
        unset($db);
    } catch (Exception $e) {
        error_log("Error in getQueueStats: " . $e->getMessage());
        $response['error'] = "Error: " . $e->getMessage();
    }

    return json_encode($response);
}

/**
 * Convert a file size string to bytes
 * @param string $sizeStr File size string (e.g. "2.5 GiB", "500 MiB") or numeric string
 * @return int Size in bytes
 */
function convertSizeToBytes($sizeStr)
{
    if (empty($sizeStr)) {
        return 0;
    }

    // If it's already a number (or a numeric string), return it directly
    if (is_numeric($sizeStr)) {
        return (int)$sizeStr;
    }

    // Extract numeric part and unit for formatted strings
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
