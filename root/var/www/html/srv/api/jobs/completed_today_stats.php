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

    try {
        // Check if database file exists
        if (!file_exists(DATABASE)) {
            error_log("Database file not found: " . DATABASE);
            return json_encode($response);
        }

        // Check if database is readable
        if (!is_readable(DATABASE)) {
            error_log("Database file not readable: " . DATABASE);
            return json_encode($response);
        }

        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);

        // Check if completed_uploads table exists
        $tableCheck = $db->querySingle("SELECT name FROM sqlite_master WHERE type='table' AND name='completed_uploads'");
        if (!$tableCheck) {
            error_log("Table 'completed_uploads' not found in database");
            $db->close();
            return json_encode($response);
        }

        // Get start of today timestamp
        $startOfToday = strtotime('today midnight');

        // Count uploads completed today
        $countQuery = "SELECT COUNT(*) as count FROM completed_uploads WHERE endtime >= $startOfToday";
        $countResult = $db->query($countQuery);

        if (!$countResult) {
            error_log("Query failed: " . $db->lastErrorMsg());
            $db->close();
            return json_encode($response);
        }

        $countRow = $countResult->fetchArray();
        if ($countRow) {
            $response['count'] = $countRow['count'];
        }

        $countRow = $countResult->fetchArray();
        if ($countRow) {
            $response['count'] = $countRow['count'];
        }

        // First try to get total size in bytes from filesize_bytes column
        $sizeQuery = "SELECT SUM(filesize_bytes) as total_bytes FROM completed_uploads WHERE endtime >= $startOfToday AND filesize_bytes > 0";
        $sizeResult = $db->query($sizeQuery);

        if (!$sizeResult) {
            error_log("Size query failed: " . $db->lastErrorMsg());
            $db->close();
            return json_encode($response);
        }

        $sizeRow = $sizeResult->fetchArray();
        $totalBytes = $sizeRow ? $sizeRow['total_bytes'] : null;

        // If filesize_bytes returns null or 0, fall back to calculating from filesize string
        if (!$totalBytes) {
            $fallbackQuery = "SELECT filesize FROM completed_uploads WHERE endtime >= $startOfToday";
            $fallbackResult = $db->query($fallbackQuery);

            if ($fallbackResult) {
                $totalBytes = 0;

                while ($row = $fallbackResult->fetchArray()) {
                    $totalBytes += convertSizeToBytes($row['filesize']);
                }
            } else {
                error_log("Fallback query failed: " . $db->lastErrorMsg());
            }
        }

        $response['total_size'] = $totalBytes ?: 0;

        $db->close();
        unset($db);
    } catch (Exception $e) {
        error_log("Error in getCompletedTodayStats: " . $e->getMessage());
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

echo getCompletedTodayStats();
