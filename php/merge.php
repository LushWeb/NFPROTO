<?php
	
	/* NOTE: THIS ROUTINE ONLY CALLED IF THERE IS NEW DATA */
	require 'general.php';
	
	$uID = $_GET["usrID"];
	$GLOBALS["gUsrID"] = $uID;
	
	$byteCount = 0; $oldRecordCount = 0; $newRecordCount = 0;
	
	/* LIST OF NEW FEED DATA IS CREATED SUCCESSFULLY */
	if ( createFileList( $uID ) == TRUE ) {
	
		writeToLog( "INFORMATION: New data found. Attempting master update..." );
		
		$xslConcatFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_CONCATERNATE );
		$xmlListFile = realpath( gcFOLDER_DATA."files_$uID.xml" );
		$xmlOutputFile = gcFOLDER_DATA."concat_$uID.xml";
		$masterFile = realpath( gcFOLDER_DATA."master_$uID.xml" );
		$params = NULL;
		$outputXML = new DOMDocument( "1.0" );
		$outputXML->preserveWhiteSpace = FALSE;
		/* DANGER POINT */
		$outputXML = getTransformedXML( $xmlListFile, $xslConcatFile, $params, FALSE );
		
		/* IF WE GET NO ERRORS THEN ADD UNIOQUE IDS & SAVE CONCAT FILE */
		if ( $outputXML != NULL ) {
				
			/* do loop for setting ids at this point */  
			$oldRecordCount = getUserArticleCountFromFile( $uID );
			$newRecordCount = addArticleIds( $outputXML, $oldRecordCount );
			writeUserArticleCountToFile( $uID, $newRecordCount );
			$outputXML->formatOutput = TRUE;
			$byteCount = $outputXML->save( $xmlOutputFile );
			$fileSize = $byteCount / 1024;
		
			 /* UPDATE MASTER FILE WITH CONCAT FILE */	
			if ( file_exists( $xmlOutputFile ) ) {
		
				if ( copy( $xmlOutputFile, $masterFile ) ) {
						
					/* DELETE OLD MASTER FILE */
					unlink( $xmlOutputFile );
					if ( updateAllSubDateXML( $uID ) == FALSE ) writeToLog( "ERROR: Unable to update last published dates." );
					
				}
				else {
					
					writeToLog( "ERROR: Unable to copy concat file to Master." );
				}
			}	
			else {
				
				writeToLog( "ERROR: Missing concat file, Master cannot be updated." );
			}
			writeToLog( "INFORMATION: Master updated. Size: ".number_format($fileSize)." KB" );
		}
		else {
			
			writeToLog("ERROR: Concat file transformation failed. Master NOT updated!");
		}	
	}
	else {
		writeToLog("ERROR: Unable to create list file. Master NOT updated!");
	}
	
	/* TIDY UP OUTPUT FILES */
	tidyUp( $uID );
	
	/* CONSTRUCT FEEDBACK DATA */
	header("Content-type: text/xml");
	echo "<?xml version='1.0' encoding='UTF-8'?>";
	echo "<file>";
	echo "<name>concat_$uID.xml</name>";
	echo "<bytes>$byteCount</bytes>"; 
	echo "</file>";

/* SOME OF THESE FUNCTIONS NEED TIDYING/ERROR CHECKING */

function getUserArticleCountFromFile( $pUsrID ){
	
	/* GET NUMBER OF ARTICLES FROM FILE */	
	$_recordCount = 0;
	$_countFile = realpath( gcFOLDER_DATA."mastercount_$pUsrID.xml" );
	$_countXML = getLoadedDOMDoc( $_countFile );
	$_recordCount = $_countXML->getElementsByTagName("count")->item(0)->nodeValue;
	unset( $_countXML );
	return $_recordCount;
}

function writeUserArticleCountToFile( $pUsrID, $pNewCount){
		
	/* ADD THE NEW HIGHEST UNIQUE ARTICLE ID TO THE MASTERCOUNT FILE */
	$_returnValue = FALSE;
	$_countFile = realpath( gcFOLDER_DATA."mastercount_$pUsrID.xml" );
	$_countXML = getLoadedDOMDoc( $_countFile );
	
	if ( $_countXML != FALSE ){
		
		$_countXML->getElementsByTagName("count")->item(0)->nodeValue = $pNewCount;
		$_countXML->save( $_countFile );
		$_returnValue = TRUE;
	}
	unset( $_countXML );
	return $_returnValue;
}

function addArticleIds( $pConcatXML, $pIDStartNumber ){
	
	/* ADD A UNIQUE ARTICLE ID TO ALL NEW ARTICLES*/
	$_itemId = $pIDStartNumber;
	$_items = $pConcatXML->getElementsByTagName("item");
	
	foreach ( $_items as $_item ){
		
		$_currentId = $_item->getElementsByTagName("item_id")->item(0)->nodeValue;
		
		if ( $_currentId == "0" ) {
			
			$_itemId++;
			$_item->getElementsByTagName("item_id")->item(0)->nodeValue = $_itemId;
		}
		else {
			break;
		}
	}
	unset( $_items );
	return $_itemId;	
}

function updateAllSubDateXML( $pUsrID ) {
	
	/* UPDATE ALL SUB_UPDATE FIELDS WITH TEMP VALUES */
	/* AND RESET TEMPS TO BLANK */
	$_result = FALSE;
	$_subsFile = realpath( gcFOLDER_DATA."subs_$pUsrID.xml" );
	$_subsXML = getLoadedDOMDoc( $_subsFile );
	$_subs = $_subsXML->getElementsByTagName("sub");
	
	foreach ( $_subs as $_sub ){
	
		$_sTempUpdate = $_sub->getElementsByTagName("sub_temp_update")->item(0)->nodeValue;
		
		if ( $_sTempUpdate != "" ) $_sub->getElementsByTagName("sub_update")->item(0)->nodeValue = $_sTempUpdate;
	
		$_sub->getElementsByTagName("sub_temp_update")->item(0)->nodeValue = "";
	}
	
	if ( $_subsXML->save($_subsFile) > 0 ) $_result = TRUE;
	unset( $_subs, $_subsXML );
	return $_result;
}

function createFileList( $pUsrID ){
		
	/* MAKE A LIST OF XML FILES TO BE MERGED WITH THE MASTER FILE */
	$_returnValue = FALSE;
	$_usrSubFile = realpath( gcFOLDER_DATA."subs_$pUsrID.xml" );
	$_usrFileList = gcFOLDER_DATA."files_$pUsrID.xml";
	$_outputFile = "";
	$_handle = fopen( $_usrFileList, "w" );
		
	/* GET DATA FROM SUBS FILE */
	$_xmlDoc = new DOMDocument();
	$_xmlDoc->load( $_usrSubFile );
	$_subCount = $_xmlDoc->getElementsByTagName("sub")->length;
	$_subItems = $_xmlDoc->getElementsByTagName("sub");
	
	fwrite( $_handle, '<?xml version="1.0" encoding="UTF-8"?>');
	fwrite( $_handle, '<files>');

	/* LOOP THRU' ALL SUBS AND FIND WHICH ONES HAVE AN OUTPUT FILE */	
	for ( $_count = 0; $_count < $_subCount; $_count++ ) {
		
		$_sID = $_subItems->item($_count)->getElementsByTagName("sub_id")->item(0)->childNodes->item(0)->nodeValue;
		$_outputFile = "output_".$pUsrID."_".$_sID.".xml";
		if ( file_exists( gcFOLDER_DATA.$_outputFile ) ) fwrite( $_handle, '<file>'.$_outputFile.'</file>' );
		
	}
	fwrite( $_handle, '<file>master_'.$pUsrID.'.xml</file>' );
	fwrite( $_handle, '</files>' );
	fclose( $_handle );

	unset( $_xmlDoc, $_handle);
	
	$_returnValue = TRUE;
	return $_returnValue;
}

function tidyUp( $pUsrID ) {
		
	
	$_listFile = gcFOLDER_DATA."files_$pUsrID.xml";
	$_mask = gcFOLDER_DATA."output_".$pUsrID."_*.xml";

	/* DELETE CONCAT FILE */
	if ( file_exists( $_listFile ) ) unlink( $_listFile );

	/* DELETE UPDATE FILES */
	foreach ( glob( $_mask ) as $_outputFileName ) {
		
		unlink($_outputFileName); 
	}  
}
?>