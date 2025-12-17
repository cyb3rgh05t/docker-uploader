<?php

/**
 * API endpoint for getting files in the upload queue
 * File: srv/api/jobs/queue.php
 */

include_once('../../../settings.php');
include_once('../../utility.php');

header('Content-Type: application/json; charset=utf-8');

/**
 * Get list of files in the upload queue
 */
function getQueueFiles()
{
    $response = array(
        'success' => true,
        'files' => array()
    );

    try {
        // Check if database file exists
        if (!file_exists(DATABASE)) {
            $response['success'] = false;
            $response['error'] = 'Database file not found';
            return json_encode($response);
        }

        $db = new SQLite3(DATABASE, SQLITE3_OPEN_READONLY);
        $db->busyTimeout(5000); // Wait up to 5 seconds if database is locked

        // Get all files from the queue ordered by time (oldest first)
        $query = "SELECT time, drive, filedir, filebase, filesize, metadata FROM upload_queue ORDER BY time ASC";
        $result = $db->query($query);

        if ($result === false) {
            $response['success'] = false;
            $response['error'] = $db->lastErrorMsg();
            $db->close();
            return json_encode($response);
        }

        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $response['files'][] = array(
                'filename' => $row['filebase'],
                'filesize' => $row['filesize'],
                'drive' => $row['drive'],
                'filedir' => $row['filedir'],
                'metadata' => $row['metadata'],
                'created_at' => $row['time']
            );
        }

        $db->close();
        unset($db);
    } catch (Exception $e) {
        $response['success'] = false;
        $response['error'] = $e->getMessage();
    }

    return json_encode($response);
}

// Return the queue files
echo getQueueFiles();
