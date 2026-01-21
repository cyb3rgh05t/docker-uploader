<?php
include_once('../../../settings.php');

header('Content-Type: application/json');

// Get the type parameter (all or failed)
$type = isset($_POST['type']) ? $_POST['type'] : 'all';

try {
    $db = new SQLite3(DATABASE);
    $db->busyTimeout(5000); // Wait up to 5 seconds if database is locked

    if ($type === 'failed') {
        // Only delete failed uploads (status = 0 means failed)
        $count_result = $db->exec("DELETE FROM completed_uploads WHERE status = 0");
    } else {
        // Delete all uploads (default behavior)
        $count_result = $db->exec('DELETE FROM completed_uploads');
    }

    $db->close();
    unset($db);

    echo json_encode(['success' => true, 'type' => $type]);
} catch (Exception $e) {
    error_log("Database error in clean_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
