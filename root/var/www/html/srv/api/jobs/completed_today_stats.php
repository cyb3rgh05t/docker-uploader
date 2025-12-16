<?php
include_once('../../../settings.php');
include_once('../../utility.php');

header('Content-Type: application/json; charset=utf-8');

/**
 * Get statistics for all uploads completed today
 */
function getCompletedTodayStats()
{
    $response = array(
        'count' => 0,
        'total_size' => 0
    );

    $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);

    // Get start of today timestamp
    $startOfToday = strtotime('today midnight');

    // Count uploads completed today
    $countQuery = "SELECT COUNT(*) as count FROM completed_uploads WHERE endtime >= $startOfToday";
    $countResult = $db->query($countQuery);
    $response['count'] = $countResult->fetchArray()['count'];

    // First try to get total size in bytes from filesize_bytes column
    $sizeQuery = "SELECT SUM(filesize_bytes) as total_bytes FROM completed_uploads WHERE endtime >= $startOfToday AND filesize_bytes > 0";
    $sizeResult = $db->query($sizeQuery);
    $totalBytes = $sizeResult->fetchArray()['total_bytes'];

    // If filesize_bytes returns null or 0, fall back to calculating from filesize string
    if (!$totalBytes) {
        $fallbackQuery = "SELECT filesize FROM completed_uploads WHERE endtime >= $startOfToday";
        $fallbackResult = $db->query($fallbackQuery);
        $totalBytes = 0;

        while ($row = $fallbackResult->fetchArray()) {
            $totalBytes += convertSizeToBytes($row['filesize']);
        }
    }

    $response['total_size'] = $totalBytes ?: 0;

    $db->close();
    unset($db);

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

echo getCompletedTodayStats();
