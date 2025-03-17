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

    // Get total size in bytes of uploads completed today
    $sizeQuery = "SELECT SUM(filesize_bytes) as total_bytes FROM completed_uploads WHERE endtime >= $startOfToday";
    $sizeResult = $db->query($sizeQuery);
    $response['total_size'] = $sizeResult->fetchArray()['total_bytes'] ?: 0;

    $db->close();
    unset($db);

    return json_encode($response);
}

echo getCompletedTodayStats();
