<?php
	    
	require 'general.php';
	
	/* NB. ALL VARIABLES MUST BE PASSED DESPITE WHICH FUNC */
	/* YOU ARE USING */
	$uID = $_GET["usrID"];
	$fCall = $_GET["func"];
	$status = $_GET["itemStatus"];
	$order = $_GET["itemOrder"];
	$format = $_GET["format"];
	$sID = $_GET["subID"];
	$gID = $_GET["grpID"];
	
	$GLOBALS["gUsrID"] = $uID;
	
	switch ( $fCall )	{
		
		case "DISP":
			
			echo displayArticles( $uID, $sID, $gID, $status, $order, $format );
			break;
			
		case "STATS":
			
	  		echo getStats( $uID, $status );
	  		break;
	  
		case "SUBS":
			
			echo getSubs( $uID );
			break;

		default:
	  		writeToLog("ERROR: Programmer Error. Unknown command passed to misc.php");
	}

function getSubs( $pUsrID ){
		
	$_tFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_SUBS_DATA );
	$_sFile = realpath( gcFOLDER_DATA."subs_$pUsrID.xml" );
	$_params = NULL;
	deleteLog();
	writeToLog( "INFORMATION: Subs data retrieved." );
	return getTransformedXML( $_sFile, $_tFile, $_params, TRUE );
}

function displayArticles( $pUsrID, $pSubID, $pGrpID, $pStatus, $pOrder, $pFormat ) {
	
	$_selectString = "";
	
	if ( $pSubID == 0 && $pGrpID == 0 ) {
		
		$_selType = "ALL";
	}
	else {
	
		if ( $pSubID > 0 ) {
			
			$_selType = "SUB";
		}
		else {
			
			$_selType = "GRP";
			$_selectString = makeSubListFromGrp( $pUsrID, $pGrpID );
		}
	}
	/* GET ARTICLE DATA */
	$_masterFile = realpath( gcFOLDER_DATA."master_$pUsrID.xml" );
	
	switch ( $pFormat ){
		case 0:
			$_transformFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_DISPLAY_COMPLETE );
			break;
		case 1:
			$_transformFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_DISPLAY_GRID );
			break;
	}
	switch ( $pOrder ){
		case 0:
			$_sortField = "interval";
			$_sortOrder = "descending";
			break;	
		case 1:
			$_sortField = "interval";
			$_sortOrder = "ascending";
			break;	
	}		
	$_params = array(	array( "seltype", $_selType ),
						array( "subid", $pSubID ),
						array( "grpidlist", $_selectString ), 
						array( "sortfield", $_sortField ),
						array( "sortorder", $_sortOrder ),
						array( "status", $pStatus )  );
	
	return getTransformedXML($_masterFile, $_transformFile, $_params, TRUE);
}

function makeSubListFromGrp( $pUsrID, $pGrpIndex ){
	
	/* OUTPUT HYPHEN DELIMITED STRING FOR USE IN SELECTION CRITERIA
	 * FOR DISPLAYING DATA FROM GRPS */
		
 	$_grpArray = makeGroupArray( $pUsrID );
	$_subList = "";
	$_sGrpLevel = (int) $_grpArray[$pGrpIndex - 1][gcGRP_FIELD_LEVEL];
	
	for (  $_i = $pGrpIndex; $_i < count($_grpArray); $_i++ ) {
	
		$_cLevel = (int) $_grpArray[$_i][gcGRP_FIELD_LEVEL];
		
		if ( $_cLevel == $_sGrpLevel ) break;
		
		if ( $_grpArray[$_i][gcGRP_FIELD_TYPE] == "SUB" ) $_subList .= "-" . $_grpArray[$_i][gcGRP_FIELD_DESCRIPTOR];

	}		
	
	$_subList .= "-";
	/* DEBUG ONLY */
	//writeToLog( "INFORMATION: Group '".$_grpArray[$pGrpIndex - 1][gcGRP_FIELD_DESCRIPTOR]."' selected contains: ".$_subList );
	unset( $_grpArray );
	return $_subList;
}

function getStats( $pUsrID, $pStatus) {
	
	/* GET ARTICLE COUNT DATA FOR EACH SUB OF A PARTICULAR STATUS*/
	$_params = array( array( "itemstatus", $pStatus ) );
	$_tFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_COUNTS );
	$_mFile = realpath( gcFOLDER_DATA."master_$pUsrID.xml");
	return getTransformedXML( $_mFile, $_tFile, $_params, TRUE );
}

?>