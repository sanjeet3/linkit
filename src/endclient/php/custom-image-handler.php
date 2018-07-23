<?php

require_once(dirname(__FILE__).'/fpd-image-utils.php');

$uploads_dir = $_POST['uploadsDir'];
$uploads_dir_url = $_POST['uploadsDirURL'];
$save_on_server = isset($_POST['saveOnServer']) ? (int) $_POST['saveOnServer'] : false;

if(empty($uploads_dir) || empty($uploads_dir_url)) {
	echo json_encode(array('error' => 'You need to define a directory, where you want to save the uploaded user images!'));
	die;
}

if(!function_exists('getimagesize')) {
	echo json_encode(array('error' => 'The php function getimagesize is not installed on your server. Please contact your server provider!'));
	die;
}

//upload image
if(isset($_FILES) && sizeof($_FILES) > 0) {

	foreach($_FILES as $fieldName => $file) {

		$parts = explode('.', $file['name'][0]);
		$filename = $parts[0];
		$ext = $parts[1];

		//check if its an image
		if(!getimagesize($file['tmp_name'][0]) && $ext !== 'svg') {
			echo json_encode(array('error' => 'This file is not an image!', 'filename' => $filename));
			die;
		}

		//check for php errors
		if($file['error'][0] !== UPLOAD_ERR_OK) {
			echo json_encode(array('error' => FPD_Image_Utils::file_upload_error_message($file['error']), 'filename' => $filename));
			die;
		}

		$sanitized_name = FPD_Image_Utils::sanitize_filename($filename);
		$upload_path = FPD_Image_Utils::get_upload_path($uploads_dir, $sanitized_name, $ext);
		$image_path = $upload_path['full_path'].'.'.$ext;
		$image_url = $uploads_dir_url.'/'.$upload_path['date_path'].'.'.$ext;

		if( @move_uploaded_file($file['tmp_name'][0], $image_path) ) {

			if($ext === 'jpg' || $ext === 'jpeg') {

				if(  function_exists('exif_read_data') ) {
					$exif = exif_read_data($image_path);
				    if (!empty($exif['Orientation'])) {

				        $image = imagecreatefromjpeg($image_path);
				        unlink($image_path);
				        switch ($exif['Orientation']) {
				            case 3:
				                $image = imagerotate($image, 180, 0);
				                break;

				            case 6:
				                $image = imagerotate($image, -90, 0);
				                break;

				            case 8:
				                $image = imagerotate($image, 90, 0);
				                break;
				        }

				        imagejpeg($image, $image_path, 90);
				    }
				}

			}

			echo json_encode( array(
				'image_src' => $image_url,
				'filename' => $filename,
				//'dim' => $image_dimensions
			) );

		}
		else {

			echo json_encode( array(
				'error' => 'PHP Issue - move_uploaed_file failed',
				'filename' => $filename
			) );

		}

	}

	die;

}

$url = $_POST['url'];
$mime_type = FPD_Image_Utils::is_image($url);
if ( $mime_type === false ) {
	echo json_encode(array('error' => 'This is not an image file!'));
    die;
}

$ext = str_replace('image/', '', $mime_type);

if($save_on_server) {

	$unique_name = @date() === false ? md5(gmdate('Y-m-d H:i:s:u')) : md5(date('Y-m-d H:i:s:u')); //create an unique name
	$upload_path = FPD_Image_Utils::get_upload_path($uploads_dir, $unique_name);
	$image_path = $upload_path['full_path'].'.'.$ext;
	$image_url = $uploads_dir_url.'/'.$upload_path['date_path'].'.'.$ext;

}

//use curl
$result = false;
if( function_exists('curl_exec') ) {

	try {

		////create image on server from url
		if($save_on_server) {

			$ch = curl_init($url);
			$fp = fopen($image_path, 'wb');
			curl_setopt($ch, CURLOPT_FILE, $fp);
			curl_setopt($ch, CURLOPT_HEADER, 0);
			$result = curl_exec($ch);
			curl_close($ch);
			fclose($fp);

		}
		//get data uri from url
		else {

			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_HEADER, 0);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_BINARYTRANSFER,1);
			$result = curl_exec($ch);
			curl_close($ch);

			$info = getimagesize($url);
			$image_url = 'data: '.$info['mime'].';base64,'.base64_encode($result);

		}

	}
	catch(Exception $e) {

	}

}

//curl not working, try other functions
if($result === false) {

	//create image on server from data uri
	if($save_on_server) {
		file_put_contents($image_path, file_get_contents($url));
		$result = file_get_contents($url);
	}
	//get data uri from url
	else {
		$result = file_get_contents($url);
		$info = getimagesize($url);
		$image_url = 'data: '.$info['mime'].';base64,'.base64_encode($result);
	}

}

if($result) {
	echo json_encode(array( 'image_src' => $image_url));
}
else {
	echo json_encode(array('error' => 'The image could not be created. Please view the error log file of your server to see what went wrong!'));
}

?>