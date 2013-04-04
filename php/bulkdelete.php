<?php

	require 'general.php';
	
	$func = $_GET["func"];
	$uID = $_GET["usrID"];
	$subID = $_GET["subID"];
	$numDays = $_GET["numDays"];
	
	$GLOBALS["gUsrID"] = $uID;
	
	switch($func){
		
		case "DEL":
			
			bulkDeleteAfterDays( $uID, $numDays );
			break;
			
		case "SUBS":
			
			bulkDeleteBySub( $uID,$subID );
			break;
			
		default:
			
	  		writeToLog( "ERROR: [User:$uID] Programmer Error. Unknown command passed to bulkdelete.php" );
	}
	
function bulkDeleteBySub( $pUsrID, $pSubID ){

	$_delCount = 0;
	$_selCrit = "sub_id=$pSubID";
	$_masterFile = realpath( gcFOLDER_DATA."master_$pUsrID.xml" );
	$_masterXML = getLoadedDOMDoc( $_masterFile );

	if ( $_masterXML ) {
		
		$_xpath = new DOMXPath( $_masterXML );
		$_nodes = $_xpath->query( "/items/item[$selCrit]" );
		
		foreach ( $_nodes as $_node ) {
			
			$_delCount++;
			deleteNode( $_node );
		}
		$_masterXML->save( $_masterFile );
		
	}
	unset( $_masterXML, $_masterFile );
	writeToLog("INFORMATION: Bulk delete of $_delCount article(s) with a subID of : $pSubID");
	
}

function bulkDeleteAfterDays( $pUsrID, $pNumDays ) {
	
	$_delCount = 0;
	$_strDate = "- $pNumDays days";
	$_delDate = date("Ymd", strtotime( $_strDate ) );
	
	$_selCrit = "substring(translate(interval, '-',''), 1, 8) < '$_delDate' and status=1";
	$_masterFile = realpath( gcFOLDER_DATA."master_$pUsrID.xml" );
	$_masterXML = getLoadedDOMDoc( $_masterFile );

	if ( $_masterXML ) {
		
		$_xpath = new DOMXPath( $_masterXML );
		$_nodes = $_xpath->query( "/items/item[$_selCrit]" );
		
		foreach ( $_nodes as $_node ) {
			
			$_delCount++;
			deleteNode( $_node );
		}
		$_masterXML->save( $_masterFile );
		
	}
	unset( $_masterXML, $_masterFile );
	
	writeToLog("INFORMATION: Bulk delete of $_delCount article(s) with date before : $_delDate");
}

?>