<?php

if(!class_exists('FPD_Image_Utils')) {

	class FPD_Image_Utils {

		public static function get_upload_path( $upload_path, $filename, $ext='' ) {

			$date_path = '';

			if(!file_exists($upload_path))
				mkdir($upload_path);

			$year = @date() === false ? gmdate('Y') : date('Y');
			$date_path .= '/'. $year . '/';
			if(!file_exists($upload_path . $date_path))
				mkdir($upload_path . $date_path);

			$month = @date() === false ? gmdate('m') : date('m');
			$date_path .= $month . '/';
			if(!file_exists($upload_path . $date_path))
				mkdir($upload_path . $date_path);

			$day = @date() === false ? gmdate('d') : date('d');
			$date_path .= $day . '/';
			if(!file_exists($upload_path . $date_path))
				mkdir($upload_path . $date_path);

			$file_path = $upload_path.$date_path.$filename;

			$file_counter = 1;
			$real_filename = $filename;

			while(file_exists($file_path.'.'.$ext)) {
				$real_filename = $file_counter.'-'.$filename;
				$file_path = $upload_path.$date_path.$real_filename;
				$file_counter++;
			}

			return array(
				'full_path' => $file_path,
				'date_path' => $date_path.$real_filename
			);

		}

		public static function get_image_dpi( $filename ) {

		    $image = fopen($filename,'r');
		    $string = fread($image, 20);
		    fclose($image);

		    $data = bin2hex(substr($string,14,4));
		    $x = substr($data,0,4);
		    $y = substr($data,0,4);

		    return array(hexdec($x),hexdec($y));

		}

		public static function is_image( $url ) {

			$img_formats = array("image/png", "image/jpg", "image/jpeg", "image/svg");

			if( FPD_Image_Utils::is_base64($url) ) {

				$key = false;
				foreach($img_formats as $k => $img_format) {

					if(strpos($url, $img_format) !== false) {
						$key = $k;
					}

				}

				return $key === false ? false : $img_formats[$key];

			}
			else {

				$img_info = getimagesize($url);
				$key = array_search(strtolower($img_info['mime']), $img_formats);
				return $key === false ? false : $img_formats[$key];

			}

		}

		public static function is_base64( $data_uri_str ) {

			$regex = '/^data:(.+?){0,1}(?:(?:;(base64)\,){1}|\,)(.+){0,1}$/';
			return (preg_match($regex, $data_uri_str) === 1);

		}

		public static function sanitize_filename($filename) {

			return preg_replace("/[^a-z0-9\.]/", "", strtolower($filename));

		}

		public static function file_upload_error_message($error_code) {

		    switch ($error_code) {
		        case UPLOAD_ERR_INI_SIZE:
		            return 'The uploaded file exceeds the upload_max_filesize directive in php.ini';
		        case UPLOAD_ERR_FORM_SIZE:
		            return 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form';
		        case UPLOAD_ERR_PARTIAL:
		            return 'The uploaded file was only partially uploaded';
		        case UPLOAD_ERR_NO_FILE:
		            return 'No file was uploaded';
		        case UPLOAD_ERR_NO_TMP_DIR:
		            return 'Missing a temporary folder';
		        case UPLOAD_ERR_CANT_WRITE:
		            return 'Failed to write file to disk';
		        case UPLOAD_ERR_EXTENSION:
		            return 'File upload stopped by extension';
		        default:
		            return 'Unknown upload error';
		    }

		}

	}

}


?>