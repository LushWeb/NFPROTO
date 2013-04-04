<?php
    
    require 'general.php';
	
	$uID = $_GET["usrID"];
	$passedShowEmpty = $_GET["showEmpty"];
	$passedShowAll = $_GET["showAll"];
	
	$GLOBALS["gUsrID"] = $uID;
    $subArray =  array();
	
	if ( $passedShowEmpty == "true" ) $showEmpty = TRUE;
	else $showEmpty = FALSE;
	
	if ( $passedShowAll == "true" ) $showAll = TRUE;
	else $showAll = FALSE;
	
	define( "cSUB_ID", 0 );
	define( "cSUB_TITLE", 1 );
	
	$subArray = makeSubsArray( $uID );
	$grpArray = makeGroupArray( $uID ); 
	$outputHTML = makeGrpStructureHTML( $showEmpty, $showAll, $grpArray, $subArray );
	writeToLog("INFORMATION: Group structure retrieved.");
	header("Content-type: text/html");
	echo $outputHTML;

	
function makeGrpStructureHTML( $pShowEmpty, $pShowAll, $pGrpsArray, $pSubsArray ) {

	$_cLevel = ""; $_cType = ""; $_cDesc = "";	$_sHTML = "";
	
	/* MAKE TOP LEVEL IF NECESSARY */
	if ( $pShowAll ) {
		
		$_sHTML .= makeContainerHTML( "grp_0", "g-item-root" );
		$_sHTML .= makeElementHTML( "div", "grpt_0", "grp", "All articles" );
		$_sHTML .= makeElementHTML( "div", "grpn_0", "grp-num", "" );
		$_sHTML .= makeContainerEndHTML();
		$_sHTML .= makeContainerHTML( "gc_0", "g-con" );
	}
	
	for (  $_i = 0; $_i < count($pGrpsArray); $_i++ ) {
	
		$_index = $_i + 1;
		$_cLevel = (int) $pGrpsArray[$_i][gcGRP_FIELD_LEVEL];
		$_cType = $pGrpsArray[$_i][gcGRP_FIELD_TYPE];
		$_cDesc = $pGrpsArray[$_i][gcGRP_FIELD_DESCRIPTOR];
		
		if ( $_i == count($pGrpsArray) - 1 ) {
			$_nextLevel = 0; $_nextType = "GRP";
		}
		else {
			$_nextLevel = (int) $pGrpsArray[$_i + 1][gcGRP_FIELD_LEVEL];
			$_nextType = $pGrpsArray[$_i + 1][gcGRP_FIELD_TYPE];
		}
		
		if ( $_cType == "GRP" ) {
			
			/* IF GRP IS EMPTY */
			if ( $_nextLevel <= $_cLevel ) {
				
				if ( $pShowEmpty ){
					
					/* MAKE GROUP CONTAINER DIV */
					$_sHTML .= makeContainerHTML( "gc_" . $_index, "g-con" );
					
					/* MAKE GROUP DIV */
					$_sHTML .= makeContainerHTML( "grp_" . $_index, "g-item" );
					$_sHTML .= makeElementHTML( "div", "grpt_" . $_index, "grp-empty", $_cDesc );
					$_sHTML .= makeElementHTML( "div", "grpn_" . $_index, "grp-num", "*" );
					$_sHTML .= makeContainerEndHTML();
					$_sHTML .= makeContainerEndHTML();
				}
			} 
			else {
			
				/* MAKE GROUP CONTAINER DIV */
				$_sHTML .= makeContainerHTML( "gc_" . $_index, "g-con" );
				
				/* MAKE GROUP DIV */
				$_sHTML .= makeContainerHTML( "grp_" . $_index, "g-item" );
				$_sHTML .= makeElementHTML( "div", "xpand_" . $_index, "xpand", "-" );
				$_sHTML .= makeElementHTML( "div", "grpt_" . $_index, "grp", $_cDesc );
				$_sHTML .= makeElementHTML( "div", "grpn_" . $_index, "grp-num", "" );
				$_sHTML .= makeContainerEndHTML();
				
				/* GRP HAS ITEMS WITHIN IT SO ADD AN INNER CONTAINER */
				$_sHTML .= makeContainerHTML( "gci_" . $_index, "g-in-con" );
			}
		}
		else {
		
			/* MAKE SUB DIV */
			$_subID = (int) $_cDesc ;
			$_subName = getSubNameByID( $_subID, $pSubsArray );
			$_sHTML .= makeContainerHTML( "sub_" . $_subID, "s-item" );
			$_sHTML .= makeElementHTML( "img", "subi_" . $_subID, "rss-img", "images/rss_small.jpg" );
			$_sHTML .= makeElementHTML( "div", "subt_" . $_subID, "sub", $_subName );
			$_sHTML .= makeElementHTML( "div", "subn_" . $_subID, "sub-num", "" );
			$_sHTML .= makeContainerEndHTML();
		}
		
		/* MAKE SURE ALL DIVS END CORRECTLY */
		if ( $_nextLevel < $_cLevel && $_nextType == "GRP") {
			
			for (  $_lC = 0; $_lC < ( $_cLevel - $_nextLevel ) * 2 ; $_lC++ ) $_sHTML .= makeContainerEndHTML(); 
		
		}
	}
	if ( $pShowAll ) $_sHTML .= makeContainerEndHTML();
	return $_sHTML;
}

function getSubNameByID( $pSubID, $pSubArray ){
	
	/* is there a way of shortening this ???? */
	for (  $_i = 0; $_i < count($pSubArray) ; $_i++ ){
		
		if ( $pSubArray[$_i][cSUB_ID] == $pSubID ) return $pSubArray[$_i][cSUB_TITLE]; 
	}
	//$key = array_search( $pSubID, $pSubArray );
	//return $pSubArray[$key][cSUB_TITLE];
}

function makeContainerHTML( $pId, $pClass ) { return '<div id="' . $pId . '" class="' . $pClass . '">'; }
function makeContainerEndHTML(){ return '</div>'; }

function makeElementHTML( $pType, $pId, $pClass, $pContent ){ 

	if ( $pType == "img" ){
		$_strHTML = '<div class="img-div"><img id="' . $pId . '" class="' . $pClass . '" src="' . $pContent . '"></div>';
	}
	else {
		$_strHTML = '<div id="' . $pId . '" class="' . $pClass . '">' . $pContent . '</' . $pType . '>';
	} 
	return $_strHTML;
}

?>