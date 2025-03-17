<?php
include_once('../../../settings.php');


$db = new SQLite3(DATABASE);
$count_result = $db->exec('DELETE FROM completed_uploads');
$db->close();
unset($db);