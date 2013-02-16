<?php

	require 'general.php';
	
	$func=$_GET["func"];
	$uID=$_GET["usrID"];
	$subID=$_GET["subID"];
	$numDays=$_GET["numDays"];
	
	$GLOBALS["gUsrID"]=$uID;
	
	switch($func){
		
		case "DEL":
			bulkDeleteAfterDays($uID, $numDays);
			break;
		case "SUBS":
			bulkDeleteBySub($uID,$subID);
			break;
		default:
	  		writeToLog("ERROR: [User:$uID] Programmer Error. Unknown command passed to bulkdelete.php");
	}
	

// OK done. so where do I put this?

function bulkDeleteBySub($uID, $sID){

	$delCount = 0;
	$selCrit="sub_id=$sID";
	$masterFile=realpath("../data/master_$uID.xml");
	$masterXML = getLoadedDOMDoc($masterFile);

	if ($masterXML) {
		
		$xpath = new DOMXPath($masterXML);
		$nodes = $xpath->query("/items/item[$selCrit]");
		
		foreach ($nodes as $node) {
			
			$delCount++;
			deleteNode($node);
		}
		$masterXML->save($masterFile);
		
	}
	unset($masterXML);
	unset($masterFile);
	
	writeToLog("INFORMATION: Bulk delete of $delCount article(s) with a subID of : $sID");
	
}

function bulkDeleteAfterDays($usrID, $numDays) {
	
	$delCount = 0;
	$strDate = "- $numDays days";
	$delDate = date('Ymd', strtotime($strDate));
	
	$selCrit="substring(translate(interval, '-',''), 1, 8) < '$delDate' and status=1";
	$masterFile=realpath("../data/master_$usrID.xml");
	$masterXML = getLoadedDOMDoc($masterFile);

	if ($masterXML) {
		
		$xpath = new DOMXPath($masterXML);
		$nodes = $xpath->query("/items/item[$selCrit]");
		
		foreach ($nodes as $node) {
			
			$delCount++;
			deleteNode($node);
		}
		$masterXML->save($masterFile);
		
	}
	unset($masterXML);
	unset($masterFile);
	
	writeToLog("INFORMATION: Bulk delete of $delCount article(s) with date before : $delDate");
	echo $delCount;
}
?>