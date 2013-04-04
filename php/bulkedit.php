<?php
	
	require 'general.php';
	
	$usrID = $_GET["usrID"];
	$subID = $_GET["subID"];
	$grpID = $_GET["grpID"];
	$cStatus = $_GET["cStatus"];
	$nStatus = $_GET["nStatus"];
	$selCriteria = "";
	
	$GLOBALS["gUsrID"] = $usrID;
	
	if ( $subID == 0 && $grpID == 0 ) {
		
		$selCriteria = "status=$cStatus";
	}
	else {
		if ( $subID != 0 ) {
			
			$selCriteria = "sub_id=$subID and status=$cStatus"; 
		}
		else {
	
			$selCriteria = makeSubSelectFromGrp( $usrID, $grpID ) . " and status=$cStatus";
		}
	}	
	
	bulkUpdateStatusXML( $usrID, $selCriteria, $nStatus );

function bulkUpdateStatusXML( $pUsrID, $pSelCrit, $pNewStatus ) {
	
	$_masterFile = realpath( gcFOLDER_DATA."master_$pUsrID.xml" );
	$_masterXML = getLoadedDOMDoc( $_masterFile );

	if ( $_masterXML ) {
		
		$_xpath = new DOMXPath( $_masterXML );
		$_nodes = $_xpath->query( "/items/item[$pSelCrit]/status" );
		foreach ( $_nodes as $_node ) {
			
			$_node->nodeValue = $pNewStatus;	
		}
		$_masterXML->save( $_masterFile );
		writeToLog( "INFORMATION: Bulk update of articles[$pSelCrit] updated to status: $pNewStatus" );
	}
	unset( $_masterXML, $_masterFile );
}

function makeSubSelectFromGrp( $pUsrID, $pGrpIndex ){
	
	/* OUTPUT STRING OF SUBS CONTAINED IN A GRP (sub_id=? or ) ETC.. 
	 * FOR EDITING DATA FROM GRPS */
		
 	$_grpArray = makeGroupArray( $pUsrID );
	$_subList = "(";
	$_sGrpLevel = (int) $_grpArray[$pGrpIndex - 1][gcGRP_FIELD_LEVEL];
	
	for (  $_i = $pGrpIndex; $_i < count($_grpArray); $_i++ ) {
	
		$_cLevel = (int) $_grpArray[$_i][gcGRP_FIELD_LEVEL];
		
		if ( $_cLevel == $_sGrpLevel ) break;
		
		if ( $_grpArray[$_i][gcGRP_FIELD_TYPE] == "SUB" ) $_subList .= "sub_id=" . $_grpArray[$_i][gcGRP_FIELD_DESCRIPTOR] . " or ";

	}		
	$_subList = substr($_subList, 0, -4) . ")";
	/* DEBUG ONLY */
	//writeToLog( "INFORMATION: Group '".$_grpArray[$pGrpIndex - 1][gcGRP_FIELD_DESCRIPTOR]."' selected contains: ".$_subList );
	unset( $_grpArray );
	return $_subList;
}
?>