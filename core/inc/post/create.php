<?php
global $config;
if (isset($_POST['wantjson']) && $_POST['wantjson'])
    $wantjson = true;

if (!isset($_POST['body'], $_POST['board']))
    error($config['error']['bot']);

if (!isset($_POST['name']))
    $_POST['name'] = $config['anonymous'];

if (!isset($_POST['email']))
    $_POST['email'] = '';

if (!isset($_POST['subject']))
    $_POST['subject'] = '';

if (!isset($_POST['password']))
    $_POST['password'] = '';

$post = array('board' => $_POST['board']);

if (isset($_POST['thread'])) {
    $post['op'] = false;
    $post['thread'] = round($_POST['thread']);
} else
    $post['op'] = true;

// Check the referrer
if (!isset($_SERVER['HTTP_REFERER']) || !preg_match($config['referer_match'], $_SERVER['HTTP_REFERER']))
    error($config['error']['referer']);

checkDNSBL();

// Check if board exists
if (!openBoard($post['board']))
    error($config['error']['noboard']);

// Check if banned
$ban_types = array(FULL_BAN);
if (isset($_FILES['file']) && $_FILES['file']['tmp_name'] != '')
    $ban_types[] = IMAGE_BAN;
checkBan($board['uri'], $ban_types);

// Check for CAPTCHA right after opening the board so the "return" link is in there
if ($config['recaptcha']) {
    if (!isset($_POST['recaptcha_challenge_field']) || !isset($_POST['recaptcha_response_field']))
        error($config['error']['bot']);
    // Check what reCAPTCHA has to say...
    $resp = recaptcha_check_answer($config['recaptcha_private'],
        $_SERVER['REMOTE_ADDR'],
        $_POST['recaptcha_challenge_field'],
        $_POST['recaptcha_response_field']);
    if (!$resp->is_valid) {
        error($config['error']['captcha']);
    }
}

if ($post['mod'] = isset($_POST['mod']) && $_POST['mod']) {
    require 'inc/mod.php';
    if (!$mod) {
        // Liar. You're not a mod.
        error($config['error']['notamod']);
    }

    $post['sticky'] = $post['op'] && isset($_POST['sticky']);
    $post['locked'] = $post['op'] && isset($_POST['lock']);
    $post['raw'] = isset($_POST['raw']);

    if ($post['sticky'] && !hasPermission('sticky', $board['uri']))
        error($config['error']['noaccess']);
    if ($post['locked'] && !hasPermission('lock', $board['uri']))
        error($config['error']['noaccess']);
    if ($post['raw'] && !hasPermission('rawhtml', $board['uri']))
        error($config['error']['noaccess']);
}

if (!$post['mod']) {
    if (checkSpam(array($board['uri'], isset($post['thread']) ? $post['thread'] : ''))) {
        if (!$userhash) {
            error($config['error']['spam']);
        }
    }
}

//Check if thread exists
if (!$post['op']) {
    $query = prepare(sprintf("SELECT `sticky`,`locked`,`sage`,`bump`,`mature`,`body` FROM `posts_%s` WHERE `id` = :id AND `thread` IS NULL LIMIT 1", $board['uri']));
    $query->bindValue(':id', $post['thread'], PDO::PARAM_INT);
    $query->execute() or error(db_error());

    if (!$thread = $query->fetch()) {
        // Non-existant
        error($config['error']['nonexistant']);
    }
}

// Check for an embed field
if ($config['enable_embedding'] && isset($_POST['embed']) && !empty($_POST['embed'])) {
    // yep; validate it
    $value = $_POST['embed'];
    foreach ($config['embedding'] as $embed) {
        if (preg_match($embed[0], $value)) {
            // Valid link
            $post['embed'] = $value;
            // This is bad, lol.
            $post['no_longer_require_an_image_for_op'] = true;
            break;
        }
    }
    if (!isset($post['embed'])) {
        error($config['error']['invalid_embed']);
    }
}

if (!hasPermission('bypass_field_disable', $board['uri'])) {
    if ($config['field_disable_name'])
        $_POST['name'] = $config['anonymous']; // "forced anonymous"

    if ($config['field_disable_email'])
        $_POST['email'] = '';

    if ($config['field_disable_password'])
        $_POST['password'] = '';

    if ($config['field_disable_subject'] || (!$post['op'] && $config['field_disable_reply_subject']))
        $_POST['subject'] = '';
}

// Check for a file
if ($post['op'] && $config['force_image_op'] && !isset($post['no_longer_require_an_image_for_op'])) {
    if (!isset($_FILES['file']['tmp_name']) || $_FILES['file']['tmp_name'] == '')
        error($config['error']['noimage']);
}

$post['ip'] = $_SERVER['REMOTE_ADDR'];
$post['userhash'] = $userhash;
$post['name'] = $_POST['name'] != '' ? $_POST['name'] : $config['anonymous'];
$post['subject'] = $_POST['subject'];
$post['email'] = $_POST['email'];
$post['body'] = $_POST['body'];
$post['password'] = hashPostPassword($_POST['password']);
$post['has_file'] = !isset($post['embed']) && (($post['op'] && !isset($post['no_longer_require_an_image_for_op']) && $config['force_image_op']) || (isset($_FILES['file']) && $_FILES['file']['tmp_name'] != ''));

if ($post['has_file']) {
    $post['filename'] = urldecode($_FILES['file']['name']);
    $post['filehash'] = $config['file_hash']($_FILES['file']['tmp_name']);
    $post['filesize'] = filesize($_FILES['file']['tmp_name']);
}

if (!($post['has_file'] || isset($post['embed'])) || (($post['op'] && $config['force_body_op']) || (!$post['op'] && $config['force_body']))) {
    $stripped_whitespace = preg_replace('/[\s]/u', '', $post['body']);
    if ($stripped_whitespace == '') {
        error($config['error']['tooshort_body']);
    }
}

if (!$post['op']) {
    // Check if thread is locked
    // but allow mods to post
    if ($thread['locked'] && !hasPermission('postinlocked', $board['uri']))
        error($config['error']['locked']);

    $thread['cyclic'] = (stripos($thread['body'], '<span class="hashtag">#cyclic</span>') !== FALSE);
    $thread['no_image_reposts'] = (stripos($thread['body'], '<span class="hashtag">#pic</span>') !== FALSE);

    if ($thread['cyclic']) {
        cyclicThreadCleanup($post['thread']);

        // this gets used later elsewhere
        $numposts = numPosts($post['thread']);
    } else {
        $numposts = numPosts($post['thread']);

        if ($config['reply_hard_limit'] != 0 && $config['reply_hard_limit'] <= $numposts['replies'])
            error($config['error']['reply_hard_limit']);

        if ($post['has_file'] && $config['image_hard_limit'] != 0 && $config['image_hard_limit'] <= $numposts['images'])
            error($config['error']['image_hard_limit']);
    }
}

$post['capcode'] = false;

if ($mod && isset($_POST['use_capcode'])) {
    $available_capcode = isset($config['mod']['capcode'][$mod['type']]) &&
    isset($config['mod']['capcode'][$mod['type']][0]) ?
        $config['mod']['capcode'][$mod['type']][0] : false;
    if ($available_capcode === false)
        error($config['error']['noaccess']);
    $post['capcode'] = $available_capcode;
}

if ($mod && preg_match('/^((.+) )?## (.+)$/', $post['name'], $matches)) {
    $name = $matches[2] != '' ? $matches[2] : $config['anonymous'];
    $cap = $matches[3];

    if (isset($config['mod']['capcode'][$mod['type']])) {
        if (	$config['mod']['capcode'][$mod['type']] === true ||
            (is_array($config['mod']['capcode'][$mod['type']]) &&
                in_array($cap, $config['mod']['capcode'][$mod['type']])
            )) {

            $post['capcode'] = utf8tohtml($cap);
            $post['name'] = $name;
        }
    }
}

if (isset($_POST['activate_egg']) && $_POST['activate_egg'] == '1') {
    error('egg temporarily disabled');
}

$trip = generate_tripcode($post['name']);
$post['name'] = $trip[0];
$post['trip'] = isset($trip[1]) ? $trip[1] : '';

if (strtolower($post['email']) == 'noko') {
    $post['noko'] = true;
    if ($config['hide_noko'])
        $post['email'] = '';
} else $post['noko'] = false;

if (strtolower($post['email']) == 'sage') {
    $post['sage'] = true;
    if ($config['hide_sage'])
        $post['email'] = '';
} else $post['sage'] = false;

$post['mature'] = $post['op'] ? false : $thread['mature'];

if (isset($_POST['mature'])) {
    $post['mature'] = true;
}

$has_mature_tag_in_post = (stripos($post['body'], '[#mature]') !== false);
if (!$post['mature'] && $has_mature_tag_in_post) {
    $post['mature'] = true;
} elseif ($post['mature'] && $post['op'] && !$has_mature_tag_in_post) {
    $post['body'] = "[#Mature]\n" . $post['body'];
}

if ($post['mature']) {
    if (!$config['mature_allowed']) {
        undoFile($post);
        error("This board doesn't allow mature content threads");
    } elseif (!$post['op'] && !$thread['mature']) {
        undoFile($post);
        error("Only threads can be marked as mature");
    }
}

$has_spoiler_tag_in_post = (stripos($post['body'], '[#spoiler]') !== false);
if (isset($_POST['spoiler_thread']) && !$has_spoiler_tag_in_post) {
    $post['body'] = "[#Spoiler]\n" . $post['body'];
}

// Check string lengths
if (mb_strlen($post['name']) > 75)
    error(sprintf($config['error']['toolong'], 'name'));
if (mb_strlen($post['email']) > 254)
    error(sprintf($config['error']['toolong'], 'email'));
if (mb_strlen($post['subject']) > 100)
    error(sprintf($config['error']['toolong'], 'subject'));
if (!$mod && mb_strlen($post['body']) > $config['max_body'])
    error($config['error']['toolong_body']);
if (mb_strlen($_POST['password']) > 200)
    error(sprintf($config['error']['toolong'], 'password'));

wordfilters($post['body']);

$post['body_nomarkup'] = $post['body'];

if (!($mod && isset($post['raw']) && $post['raw']))
    $post['tracked_cites'] = markup($post['body'], true);

// Check for a flood
if (!hasPermission('flood', $board['uri']) && checkFlood($post)) {
    error($config['error']['flood']);
}

require_once 'inc/filters.php';

do_filters($post);

if ($post['has_file']) {
    $upload = $_FILES['file']['tmp_name'];
    $file_result = check_post_file($upload, $_FILES['file']['size']);

    $mime_type = $file_result['mime_type'];
    $file_type = $file_result['file_type'];
    $post['extension'] = $file_result['extension'];

    // Keep incrementing the filename until we get an untaken one.
    $counter = 0;
    do {
        $m = microtime(true) + ($counter++/1000);
        $seconds = floor($m);
        $millis = round(($m - $seconds) * 1000);
        $post['file_id'] = $seconds . str_pad($millis, 3, '0', STR_PAD_LEFT);

        if ($post['mature']) {
            $post['file_id'] = 'mtr_' . $post['file_id'];
        }

        $post['file'] = $board['dir'] . $config['dir']['img'] . $post['file_id'] . '.' . $post['extension'];
        $fd = @fopen($post['file'], 'x');
    } while ($fd === FALSE);
    fclose($fd);

    $post['thumb'] = $board['dir'] . $config['dir']['thumb'] . $post['file_id'] . '.' .
        ($file_type === 'video' ?
            $config['video_thumb_ext'] :
            ($config['thumb_ext'] ? $config['thumb_ext'] : $post['extension']));

    // Truncate filename if it is too long
    $post['filename'] = mb_substr($post['filename'], 0, $config['max_filename_len']);

    if ($file_type === 'image' || $file_type === 'video') {
        require_once 'inc/image.php';

        if (!$size = getUploadSize($upload, $file_type, $mime_type)) {
            error($config['error']['invalid_file']);
        }

        if ($size[0] > $config['max_width'] || $size[1] > $config['max_height']) {
            error($config['error']['maxsize']);
        }

        if ($mime_type === 'image/jpeg') {
            // The following code corrects the image orientation.
            // Currently only works with the 'convert' option selected but it could easily be expanded to work with the rest if you can be bothered.
            if (!($config['redraw_image'] || ($config['strip_exif'] && $mime_type === 'image/jpeg'))) {
                if ($config['thumb_method'] == 'convert' || $config['thumb_method'] == 'convert+gifsicle') {
                    $exif = @exif_read_data($upload);
                    if (isset($exif['Orientation']) && $exif['Orientation'] != 1) {
                        shell_exec('convert ' . escapeshellarg($upload) . ' -auto-orient ' . escapeshellarg($upload));
                    }
                }
            }
        }

        if ($file_type === 'image') {
            // create image object
            $image = new Image($upload, $post['extension']);

            if ($image->size->width > $config['max_width'] || $image->size->height > $config['max_height']) {
                $image->delete();
                error($config['error']['maxsize']);
            }

            $post['width'] = $image->size->width;
            $post['height'] = $image->size->height;
        } elseif ($file_type === 'video') {
            $post['width'] = $size[0];
            $post['height'] = $size[1];
        } else {
            die("should not happen, invalid file_type $file_type");
        }

        if ($config['spoiler_images'] && isset($_POST['spoiler'])) {
            $post['thumb'] = 'spoiler';

            $thumb_size = getimagesize($config['spoiler_image']);
            $post['thumbwidth'] = $thumb_size[0];
            $post['thumbheight'] = $thumb_size[1];
        } elseif (
            $file_type === 'image' &&
            ($config['minimum_copy_resize'] && filesize($upload) < $config['max_thumb_filesize']) &&
            $post['width'] <= $config['thumb_width'] &&
            $post['height'] <= $config['thumb_height'] &&
            (!$config['thumb_ext'] || $post['extension'] == $config['thumb_ext']))
        {
            // Copy, because there's nothing to resize
            copy($upload, $post['thumb']);

            $post['thumbwidth'] = $post['width'];
            $post['thumbheight'] = $post['height'];
        } else {
            if ($file_type === 'image') {
                timing_mark('thumb_resize_start');
                $thumb = $image->resize(
                    $config['thumb_ext'] ? $config['thumb_ext'] : $post['extension'],
                    $post['op'] ? $config['thumb_op_width'] : $config['thumb_width'],
                    $post['op'] ? $config['thumb_op_height'] : $config['thumb_height']
                );
                timing_mark('thumb_resize_end');
            } elseif ($file_type === 'video') {
                timing_mark('video_resize_start');
                $newRes = computeResize(
                    $size[0], $size[1],
                    $post['op'] ? $config['thumb_op_width'] : $config['thumb_width'],
                    $post['op'] ? $config['thumb_op_height'] : $config['thumb_height']
                );
                exec('avconv -ss 00:00:00 -i ' . escapeshellarg($upload) .
                    ' -filter:v scale=' . $newRes['width'] . ':' . $newRes['height'] .
                    ' -vframes 1 ' . escapeshellarg($post['thumb']), $__ignore, $ret);
                if ($ret !== 0)
                    die('video thumbnailing error');
                $thumb = new Image($post['thumb'], $config['video_thumb_ext']);
                $thumb = $thumb->image;
                timing_mark('video_resize_end');
            } else {
                die("should not happen, invalid file_type $file_type");
            }

            $thumb->to($post['thumb']);

            $post['thumbwidth'] = $thumb->width;
            $post['thumbheight'] = $thumb->height;

            $thumb->_destroy();
        }

        if ($file_type === 'image') {
            if ($config['redraw_image'] || ($config['strip_exif'] && $mime_type === 'image/jpeg')) {
                $image->to($post['file']);
                $dont_copy_file = true;
            }
            $image->destroy();
        } elseif ($file_type === 'video') {
            // Nothing else needs to be done here.
        } else {
            die("should not happen, invalid file_type $file_type");
        }
    } else {
        // not an image
        die("file not really supported, extension is wrong");
        $post['thumb'] = 'file';

        $thumb_size = @getimagesize($config['file_thumb']);
        $post['thumbwidth'] = $thumb_size[0];
        $post['thumbheight'] = $thumb_size[1];
    }

    if (!isset($dont_copy_file) || !$dont_copy_file) {
        if (!move_uploaded_file($_FILES['file']['tmp_name'], $post['file']))
            error($config['error']['nomove']);
    }

    if ($config['image_reject_repost']) {
        if ($p = getPostByHash($post['filehash'])) {
            undoFile($post);
            error(sprintf($config['error']['fileexists'],
                ( $post['mod'] ? $config['root'] . $config['file_mod'] . '?/' : $config['root'] ) .
                $board['dir'] . $config['dir']['res'] .
                ($p['thread'] ?
                    $p['thread'] . '.html#' . $p['id']
                    :
                    $p['id'] . '.html'
                )
            ));
        }
    } else if (!$post['op'] && ($thread['no_image_reposts'] || $config['image_reject_repost_in_thread'])) {
        if ($p = getPostByHashInThread($post['filehash'], $post['thread'])) {
            undoFile($post);
            error(sprintf($config['error']['fileexistsinthread'],
                ( $post['mod'] ? $config['root'] . $config['file_mod'] . '?/' : $config['root'] ) .
                $board['dir'] . $config['dir']['res'] .
                ($p['thread'] ?
                    $p['thread'] . '.html#' . $p['id']
                    :
                    $p['id'] . '.html'
                )
            ));
        }
    }
}

// Remove board directories before inserting them into the database.
if ($post['has_file']) {
    $post['file_path'] = $post['file'];
    $post['file'] = substr_replace($post['file'], '', 0, mb_strlen($board['dir'] . $config['dir']['img']));
    if (($file_type === 'image' || $file_type === 'video') && $post['thumb'] != 'spoiler')
        $post['thumb'] = substr_replace($post['thumb'], '', 0, mb_strlen($board['dir'] . $config['dir']['thumb']));
}

$post = (object)$post;
if ($error = event('post', $post)) {
    undoFile((array)$post);
    error($error);
}
$post = (array)$post;

$post['id'] = $id = post($post);

if (isset($post['tracked_cites'])) {
    foreach ($post['tracked_cites'] as $cite) {
        $query = prepare('INSERT INTO `cites` (`board`, `post`, `target_board`, `target`) VALUES (:board, :post, :target_board, :target)');
        $query->bindValue(':board', $board['uri']);
        $query->bindValue(':post', $id, PDO::PARAM_INT);
        $query->bindValue(':target_board',$cite[0]);
        $query->bindValue(':target', $cite[1], PDO::PARAM_INT);
        $query->execute() or error(db_error($query));
    }
}

timing_mark('build_thread_start');
buildThread($post['op'] ? $id : $post['thread']);
timing_mark('build_thread_end');

if (!$post['op'] && !$post['sage'] && !$thread['sage'] &&
    !($config['no_sticky_reply_bump'] && $thread['sticky']) &&
    ($config['reply_limit'] == 0 || $numposts['replies']+1 < $config['reply_limit'] ||
        (($obi = calculateOldThreadBumpInterval($post['thread'], $thread['bump'])) && time()-$thread['bump'] >= $obi))) {
    bumpThread($post['thread']);
}

if ($post['op'])
    clean();

event('post-after', $post);

if (isset($_SERVER['HTTP_REFERER'])) {
    // Tell Javascript that we posted successfully
    if (isset($_COOKIE[$config['cookies']['js']]))
        $js = json_decode($_COOKIE[$config['cookies']['js']]);
    else
        $js = (object) array();
    // Tell the client it doesn't need to remember the post
    $thread_id = $board['uri'] . ':' . ($post['op'] ? 0 : $post['thread']);
    $js->{$thread_id} = intval($id);
    // Encode and set cookie
    setcookie($config['cookies']['js'], json_encode($js), 0, $config['cookies']['jail'] ? $config['cookies']['path'] : '/', null, false, false);
}

$root = $post['mod'] ? $config['root'] . $config['file_mod'] . '?/' : $config['root'];

if ($wantjson || $config['always_noko'] || $post['noko']) {
    $redirect = $root . $board['dir'] . $config['dir']['res'] .
        sprintf($config['file_page'], $post['op'] ? $id:$post['thread']) . (!$post['op'] ? '#' . $id : '');

    if (!$post['op'] && isset($_SERVER['HTTP_REFERER'])) {
        $regex = array(
            'board' => str_replace('%s', '(\w{1,8})', preg_quote($config['board_path'], '/')),
            'page' => str_replace('%d', '(\d+)', preg_quote($config['file_page'], '/')),
            'page50' => str_replace('%d', '(\d+)', preg_quote($config['file_page50'], '/')),
            'res' => preg_quote($config['dir']['res'], '/'),
        );

        if (preg_match('/\/' . $regex['board'] . $regex['res'] . $regex['page50'] . '([?&#].*)?$/', $_SERVER['HTTP_REFERER'])) {
            $redirect = $root . $board['dir'] . $config['dir']['res'] .
                sprintf($config['file_page50'], $post['op'] ? $id:$post['thread']) . (!$post['op'] ? '#' . $id : '');
        }
    }
} else {
    $redirect = $root . $board['dir'];

}

if ($config['syslog'])
    _syslog(LOG_INFO, 'New post: /' . $board['dir'] . $config['dir']['res'] .
        sprintf($config['file_page'], $post['op'] ? $id : $post['thread']) . (!$post['op'] ? '#' . $id : ''));

if (isset($config['action_log'])) {
    $logdata = array();
    $logdata['userhash'] = $post['userhash'];
    $logdata['action'] = 'post';
    $logdata['board'] = $board['uri'];
    $logdata['number'] = intval($id);
    $logdata['body_nomarkup'] = $post['body_nomarkup'];
    $logdata['time'] = date(DATE_ATOM);
    $logdata['thread'] = $post['op'] ? null : intval($post['thread']);
    $logdata['ip'] = $post['ip'];
    $logdata['name'] = $post['name'];
    if ($post['trip'])
        $logdata['trip'] = $post['trip'];
    if ($post['email'])
        $logdata['email'] = $post['email'];
    if ($post['subject'])
        $logdata['subject'] = $post['subject'];
    if ($post['capcode'])
        $logdata['capcode'] = $post['capcode'];
    if ($post['has_file']) {
        $logdata['filehash'] = $post['filehash'];
        $logdata['filesize'] = $post['filesize'];
        $logdata['filename'] = $post['filename'];
    }
    $logdata['commentsimplehash'] = simplifiedHash($post['body_nomarkup']);
    $logline = json_encode($logdata);
    logToFile($config['action_log'], $logline);
}

rebuildThemes($post['op'] ? 'post-thread' : 'post-reply', $board['uri']);

if ($wantjson) {
    $response = array();
    $response['status'] = 'success';
    $response['postid'] = intval($id);
    $response['threadid'] = $post['op'] ? null : intval($post['thread']);
    $response['board'] = $board['uri'];
    $response['url'] = $redirect;

    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    header('Location: ' . $redirect, true, $config['redirect_http']);
}

if ($wantjson || $config['always_noko'] || $post['noko']) {
    close_request();
}

timing_mark('build_index_start');
buildIndex($post['op'] ? false : $thread['bump']);
timing_mark('build_index_end');
