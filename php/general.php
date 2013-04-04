<?php
	
	/* VARIABLES USED ON ALL PHP SCRIPTS */	
	$gUsrID;
	$gProcessDescr = "";
	
	/* CONSTANTS */
	define( "gcFOLDER_TRANSFORM", "../transforms/" );
	define( "gcFOLDER_DATA", "../data/" );
	
	define( "gcFILE_TRANSFORM_DISPLAY_COMPLETE", "displayComplete.xsl" );
	define( "gcFILE_TRANSFORM_DISPLAY_GRID", "displayGrid.xsl" );
	define( "gcFILE_TRANSFORM_CONCATERNATE", "doConcaternate.xsl" );
	define( "gcFILE_TRANSFORM_COUNTS", "getCounts.xsl" );
	define( "gcFILE_TRANSFORM_SUBS_DATA", "getSubsData.xsl" );
	define( "gcFILE_TRANSFORM_PROCESS_RSS2", "processRSS2.xsl" );
	define( "gcFILE_TRANSFORM_PROCESS_ATOM", "processATOM.xsl" );
	define( "gcFILE_TRANSFORM_PROCESS_RDF", "processRDF.xsl" );
		
	define( "gcGRP_FIELD_LEVEL", 0 );
	define( "gcGRP_FIELD_TYPE", 1 );
	define( "gcGRP_FIELD_DESCRIPTOR", 2 );
	
	$gLogFileStart = gcFOLDER_DATA."php_session_";
	$gLogFileEnd = ".log";
	
	
	date_default_timezone_set("UTC");
	set_error_handler("netFeedErrorHandler");
	
	
function netFeedErrorHandler($error_level, $error_message, $error_file, $error_line, $error_context) {
	
    if ( !(error_reporting() & $error_level )) {
    
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
		case E_NOTICE:
		case E_USER_NOTICE:
 			
			writeToLog("ERROR: '$error_message' Error on line $error_line in file $error_file");
			break;

		default:
			
			writeToLog("UNKNOWN THING HAPPENED!: '$error_message' Error on line $error_line in file $error_file");
			echo "<b>NETFEED Unknown error type:</b> No.[$error_level] $error_message<br />\n";
			echo "Error on line $error_line in file $error_file<br />\n";
    		break;
	}

	/* NO PHP INTERNAL ERROR HANDLER */
	return true;
}

function writeToLog( $pLogMessage ){
		
	$_handle = fopen( $GLOBALS["gLogFileStart"].$GLOBALS["gUsrID"].$GLOBALS["gLogFileEnd"], "a" );
	$_mDate = date( "Y-m-d H:i:s", time() );
	fwrite( $_handle, "$_mDate | $pLogMessage\r\n" );
	fclose( $_handle );
	unset( $_handle );
}
function makeSubsArray( $pUsrID ){
	
	$_sFile = realpath( gcFOLDER_DATA."subs_$pUsrID.xml" );
	$_array = array();
	$_subsXML = getLoadedDOMDoc( $_sFile );
	$_subs = $_subsXML->getElementsByTagName("sub");
	
	foreach ( $_subs as $_sub ){
	
		$_sID = $_sub->getElementsByTagName("sub_id")->item(0)->nodeValue;
		$_sTitle = $_sub->getElementsByTagName("sub_title")->item(0)->nodeValue;
		array_push( $_array, array( $_sID, $_sTitle ) );
	}
	
	unset( $_subs, $_subsXML, $_sFile );
	return $_array;
}

function makeGroupArray( $pUsrID ) {
	
	$_sFile = gcFOLDER_DATA."structure_$pUsrID.gwl";
	$_array = array();
	$_fHandle = fopen( $_sFile, "r" );
	
	if ( $_fHandle != FALSE ) {
		
		while (( $_grpData = fgetcsv( $_fHandle, 4096, "|") ) !== FALSE ) {
	        
			array_push( $_array, $_grpData );
  		}
	}
	fclose( $_fHandle );
	unset( $_fHandle );	
	return $_array;
}	

function deleteLog() {
	
	$_logFile = $GLOBALS["gLogFileStart"].$GLOBALS["gUsrID"].$GLOBALS["gLogFileEnd"];
	if ( file_exists($_logFile) ) unlink($_logFile); 
}

function getTransformedXML( $pXMLFile, $pXSLFile, $pParamArray, $pAsXML) {
	
	$_domXML = getLoadedDOMDoc( $pXMLFile );
	
	if ( $_domXML != FALSE ) {

		$_domXSL = getLoadedDOMDoc( $pXSLFile );
		
		if ( $_domXSL != FALSE ) {
			
			$_xsltProc = new XSLTProcessor;
			$_paramCount = count( $pParamArray );
			
			for ( $_i = 0; $_i < $_paramCount; $_i++ ) $_xsltProc->setParameter("", $pParamArray[$_i][0], $pParamArray[$_i][1]); 
			$_xsltProc->importStyleSheet( $_domXSL );
			
			if ( $pAsXML == TRUE ) {
					
				header("Content-type: text/xml");
				return $_xsltProc->transformToXML( $_domXML );	
			}
			else {

				return $_xsltProc->transformToDoc( $_domXML );
			}
			unset( $_domXSL, $_domXML, $_xsltProc );
		}
		else {
			
			unset( $_domXSL, $_domXML );
			return FALSE;
		}
	}
	else {
			
		unset($_domXML);
		return FALSE;
	}				
}
	
function getLoadedDOMDoc( $pFileString ) {
		
	$_domDoc = new DOMDocument( "1.0" );
	$_domDoc->preserveWhiteSpace = FALSE;
	
	if ( $_domDoc->load( $pFileString )) {
			
		$_domDoc->formatOutput = TRUE;
		return $_domDoc;	
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
function convertRSSDateTime( $pRSSDateTime ) {
	
	/* PREVIOUSLY CALLED rsstotime  BUT NOT USED ??? */

    $_day = substr( $pRSSDateTime, 5, 2 );
    $_month = substr( $pRSSDateTime, 8, 3 );
    $_month = date( 'm', strtotime( "$_month 1 2011" ) );
    $_year = substr( $pRSSDateTime, 12, 4 );
    $_hour = substr( $pRSSDateTime, 17, 2 );
    $_min = substr( $pRSSDateTime, 20, 2 );
    $_second = substr( $pRSSDateTime, 23, 2 );
    $_timeZone = substr( $pRSSDateTime, 26 );

    $_timeStamp = mktime( $_hour, $_min, $_second, $_month, $_day, $_year );

    if ( is_numeric( $_timeZone ) ) {
    	
        $_hoursMod = $_minsMod = 0;
        $_modifier = substr( $_timeZone, 0, 1 );
        $_hoursMod = (int) substr( $_timeZone, 1, 2 );
        $_minsMod = (int) substr( $_timeZone, 3, 2 );
        $_hourLabel = $_hoursMod > 1 ? "hours" : "hour";
        $_strToTimeArg = $_modifier.$_hours_mod." ".$_hourLabel;
		
        if ( $_minsMod ) {
        	
            $_minsLabel = $_minsMod > 1 ? "minutes" : "minute";
            $_strToTimeArg .= " ".$_minsMod." ".$_minsLabel;
        }
		
        $_timeStamp = strtotime( $_strToTimeArg, $_timeStamp );
    }

    return $_timeStamp;
}

function deleteNode( $pNode ) {
	 
    deleteChildren( $pNode ); 
    $_parent = $pNode->parentNode; 
    $_oldnode = $_parent->removeChild( $pNode ); 
} 

function deleteChildren( $pNode ) {
	 
    while ( isset( $pNode->firstChild )) {
    	 
        deleteChildren( $pNode->firstChild ); 
        $pNode->removeChild( $pNode->firstChild ); 
    }
}
		
?>
