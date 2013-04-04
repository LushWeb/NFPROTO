<?php
	    
	/* CURRENTLY ALL master.xml EDITS BY itemId */
	
	require 'general.php';
	
	$uID = $_GET["usrID"];
	$itemId = $_GET["itemID"];
	$newStatus = $_GET["newStatus"];
	$returnValue = 0;
	
	$GLOBALS["gUsrID"] = $uID;
		
	$masterFile = realpath( gcFOLDER_DATA."master_$uID.xml" );
	$masterXML = getLoadedDOMDoc( $masterFile );

	if ( $masterXML ) {
		
		$xpath = new DOMXPath( $masterXML );
		$nodes = $xpath->query( "/items/item[item_id=$itemId]/status" );
		
		if( $nodes ) {
		
			$nodes->item(0)->nodeValue = $newStatus;
			$masterXML->save( $masterFile );
			writeToLog( "INFORMATION: Article id: $itemId updated to status: $newStatus" );
			$returnValue = 1;
		}
		else {
		
			writeToLog( "ERROR: Unable to edit Article with id: $itemId it doesn't exist!" );	
		}
	}
	else {
		writeToLog( "ERROR: Unable to edit Master.xml id: $itemId " );
	}
	
	echo $returnValue;
	unset( $masterXML, $masterFile );
?>