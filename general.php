<?php
	
	static $mainTitle = "NET.Feed";
	static $lwdHTML = "<b>lush :: </b>web<b>&nbsp;</b>design";
	static $usrID=1;
	
	$gLogFile = "../data/netfeed.log";
	
	date_default_timezone_set("UTC");
	set_error_handler("netFeedErrorHandler");


	function netFeedErrorHandler($error_level, $error_message, $error_file, $error_line, $error_context) {
    	
	    if (!(error_reporting() & $error_level)) {
	        // This error code is not included in error_reporting
	        return;
	    }
	
	    switch ($error_level) {
	    	
			case E_RECOVERABLE_ERROR:
			case E_USER_ERROR:
				
				writeToLog("FATAL ERROR WARNING: '$error_message' Error on line $error_line in file $error_file. Ending processing.");
				echo "<b>FATAL ERROR</b> No.[$error_level] $error_message<br />\n";
				echo "Fatal error on line $error_line in file $error_file";
				echo ", PHP " . PHP_VERSION . " (" . PHP_OS . ")<br />\n";
				echo "Ending Script...<br />\n";
	    		die();
	    		break;
			
				
			case E_WARNING:
			case E_USER_WARNING:
				
				writeToLog("WARNING: '$error_message' Error on line $error_line in file $error_file");
				
				echo "<b>NETFEED WARNING</b> No.[$error_level] $error_message<br />\n";
				echo "Error on line $error_line in file $error_file<br />\n";
				break;
	
			case E_NOTICE:
			case E_USER_NOTICE:
	    		
				writeToLog("NOTICE: '$error_message' Error on line $error_line in file $error_file");
				
	    		echo "<b>NETFEED NOTICE</b> No.[$error_level] $error_message<br />\n";
	    		echo "Error on line $error_line in file $error_file<br />\n";
	    		break;
	
			default:
				
				writeToLog("UNKNOWN THING HAPPENED!: '$error_message' Error on line $error_line in file $error_file");
				echo "<b>NETFEED Unknown error type:</b> No.[$error_level] $error_message<br />\n";
				echo "Error on line $error_line in file $error_file<br />\n";
	    		break;
		}

		/* Don't execute PHP internal error handler */
		return true;
			
	}
	function writeToLog($message){
		
		$handle = fopen($GLOBALS["gLogFile"], "a");
		$date = date('Y-m-d H:i:s', time());
		fwrite($handle, "[$date] - $message\r\n");
		fclose($handle);
		unset($handle);
	
	}
	
	function getTransformedXML($xmlFile, $xslFile, $paramArray) {
		
		$domXML = getLoadedDOMDoc($xmlFile);
		
		if ($domXML!=FALSE) {
			
			$domXSL = getLoadedDOMDoc($xslFile);
			
			if ($domXSL!=FALSE) {
				
			
				$xsltProc = new XSLTProcessor;
				$paramCount=count($paramArray);
				
				for ($i = 0; $i < $paramCount; $i++) {
				
					$xsltProc->setParameter("", $paramArray[$i][0], $paramArray[$i][1]);
				}
				
				$xsltProc->importStyleSheet($domXSL);
				
				header("Content-type: text/xml");
				return $xsltProc->transformToXML($domXML);
				unset($domXSL, $domXML, $xsltProc);
			}
			else {
				
				unset($domXSL, $domXML);
				return FALSE;
			}
		}
		else {
				
			unset($domXML);
			return FALSE;
		}				
	}
		
	function getLoadedDOMDoc($fileString) {
			
		$domDoc=new DOMDocument("1.0");
		$domDoc->preserveWhiteSpace = FALSE;
		
		if ($domDoc->load($fileString)) {
				
			$domDoc->formatOutput=TRUE;
			return $domDoc;	
		}
		else {
			
			return FALSE;
		}
	}
	
	function benchMark() {
		
		//$start=microtime('get_as_float');
		
		//$end=microtime('get_as_float');
		// echo "<div>Routine (s):".($end-$start)."</div>";
	
	}
	
	function rsstotime($rss_time) {
    
	    $day = substr($rss_time, 5, 2);
	    $month = substr($rss_time, 8, 3);
	    $month = date('m', strtotime("$month 1 2011"));
	    $year = substr($rss_time, 12, 4);
	    $hour = substr($rss_time, 17, 2);
	    $min = substr($rss_time, 20, 2);
	    $second = substr($rss_time, 23, 2);
	    $timezone = substr($rss_time, 26);
	
	    $timestamp = mktime($hour, $min, $second, $month, $day, $year);
	
	    date_default_timezone_set('UTC');
	
	    if(is_numeric($timezone)) {
	    	
	        $hours_mod = $mins_mod = 0;
	        $modifier = substr($timezone, 0, 1);
	        $hours_mod = (int) substr($timezone, 1, 2);
	        $mins_mod = (int) substr($timezone, 3, 2);
	        $hour_label = $hours_mod>1 ? 'hours' : 'hour';
	        $strtotimearg = $modifier.$hours_mod.' '.$hour_label;
			
	        if($mins_mod) {
	        	
	            $mins_label = $mins_mod>1 ? 'minutes' : 'minute';
	            $strtotimearg .= ' '.$mins_mod.' '.$mins_label;
	        }
			
	        $timestamp = strtotime($strtotimearg, $timestamp);
	    }
	
	    return $timestamp;
	}


			
?>
