<?php
include_once('../../../settings.php');

function getFailedCount()
{
    $response = array(
        'count' => 0
    );

    try {
        if (!file_exists(DATABASE)) {
            $response['error'] = 'Database file not found';
            return json_encode($response);
        }

        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);
        $db->busyTimeout(5000);

        try {
            $result = $db->querySingle("SELECT count(*) as COUNT FROM completed_uploads WHERE status = 0", true);
            if ($result && is_array($result)) {
                $response['count'] = (int)$result['COUNT'];
            }
        } catch (Exception $e) {
            $response['error'] = $db->lastErrorMsg();
        }

        $db?->close();
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }

    return json_encode($response);
}

/** actual logic */
header('Content-Type: application/json; charset=utf-8');
echo getFailedCount();
