<?php
/**
 * @author https://stackoverflow.com/a/55634720/2098536
 */
function readLastLines($filename, $num, $reverse = false)
{
    $file = new \SplFileObject($filename, 'r');
    $file->seek(PHP_INT_MAX);
    $last_line = $file->key();
    //If we're hard unlucky we read the file with less lines then $num...
    $offset = ($last_line - $num) > 0 ? $last_line - $num : $last_line;
    $lines = new \LimitIterator($file, $offset, $last_line);
    $arr = iterator_to_array($lines);
    if ($reverse) $arr = array_reverse($arr);
    return implode('', $arr);
}

/*
 * @link https://jonlabelle.com/snippets/view/php/convert-seconds-to-human-readable
 */
function secs_to_str($duration)
{
    $periods = array(
        'd' => 86400,
        'h' => 3600,
        'm' => 60,
        's' => 1
    );

    $parts = array();

    foreach ($periods as $name => $dur) {
        $div = floor($duration / $dur);

        if ($div == 0)
            continue;
        else
            $parts[] = $div . $name;
        $duration %= $dur;
    }

    $last = array_pop($parts);

    if (empty($parts))
        return $last;
    else
        return join(', ', $parts) . ' ' . $last;
}