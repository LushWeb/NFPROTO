<?php
	    
	require 'general.php';
	
	/* NB. ALL VARIABLES MUST BE PASSED DESPITE WHICH FUNC */
	/* YOU ARE USING */
	$uID=$_GET["usrID"];
	$fCall=$_GET["func"];
	$status=$_GET["itemStatus"];
	$sID=$_GET["subID"];
	$gID=$_GET["grpID"];
	
	$GLOBALS["gUsrID"]=$uID;
	
	switch ($fCall)	{
		
		case "DISP":
			echo displayMaster($uID, $sID, $gID, $status);
			break;
			
		case "STATS":
	  		echo getStats($uID, $status);
	  		break;
	  
		case "STRUC":
			echo getGroupStructure($uID);
			break;

		default:
	  		writeToLog("ERROR: Programmer Error. Unknown command passed to misc.php");
	}

function getGroupStructure ($uID){
		
	/* under construction */
	$sTransformFile=realpath("../transforms/subsdata.xsl");
	$subsFile=realpath("../data/subs_$uID.xml");
	$params=NULL;
	deleteLog();
	writeToLog("INFORMATION: Session Started. Group/Sub data structure retrieved.");
	return getTransformedXML($subsFile, $sTransformFile, $params, TRUE);
}

function displayMaster($usrID, $subID, $grpID, $reqStatus) {
	
	/* GET ARTICLE DATA */
	$masterFile=realpath("../data/master_$usrID.xml");
	$transformFile=realpath("../transforms/master.xsl");
	
	$params=array(array("subid", $subID),
				array("grpid", $grpID), 
				array("itemstatus", $reqStatus));
	
	return getTransformedXML($masterFile, $transformFile, $params, TRUE);
}
		
function getStats($usrID, $ofStatus) {
	
	/* GET ARTICLE COUNT DATA FOR EACH SUB OF A PARTICULAR STATUS*/
	$params=array(array("itemstatus", $ofStatus));
	$transformFile=realpath("../transforms/counts.xsl");
	$masterFile=realpath("../data/master_$usrID.xml");
	return getTransformedXML($masterFile, $transformFile, $params, TRUE);
}

?>