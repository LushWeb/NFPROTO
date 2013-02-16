<?php
	
	require 'general.php';
	
	$usrID=$_GET["usrID"];
	$subID=$_GET["subID"];
	$grpID=$_GET["grpID"];
	$cStatus=$_GET["cStatus"];
	$nStatus=$_GET["nStatus"];
	$selCriteria="";
	
	$GLOBALS["gUsrID"]=$usrID;
	
	if ($subID==0 && $grpID==0) {
		
		$selCriteria="status=".$cStatus;
	}
	else {
		if ($subID!=0) {
			
			$selCriteria="sub_id=$subID and status=$cStatus"; 
		}
		else {
			
			$selCriteria="grp_id=$grpID and status=$cStatus";
		}
	}	
	
	bulkUpdateStatusXML($usrID, $selCriteria, $nStatus);

function bulkUpdateStatusXML($usrID, $selCrit, $newStatus) {
		
	$masterFile=realpath("../data/master_$usrID.xml");
	$masterXML = getLoadedDOMDoc($masterFile);

	if ($masterXML) {
		
		$xpath = new DOMXPath($masterXML);
		$nodes = $xpath->query("/items/item[$selCrit]/status");
		foreach ($nodes as $node) {
			$node->nodeValue = $newStatus;	
		}
		$masterXML->save($masterFile);
		writeToLog("INFORMATION: Bulk update of articles[$selCrit] updated to status: $newStatus");
	}
	unset($masterXML);
	unset($masterFile);
}
?>