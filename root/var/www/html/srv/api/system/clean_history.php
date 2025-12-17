<?php
include_once('../../../settings.php');

try {
    $db = new SQLite3(DATABASE);
    $db->busyTimeout(5000); // Wait up to 5 seconds if database is locked
    $count_result = $db->exec('DELETE FROM completed_uploads');
    $db->close();
    unset($db);
} catch (Exception $e) {
    error_log("Database error in clean_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
