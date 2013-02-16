<?php
	
	/* NOTE: THIS ROUTINE ONLY CALLED IF THERE IS NEW DATA */
	require 'general.php';
	
	$uID=$_GET["usrID"];
	$GLOBALS["gUsrID"]=$uID;
	
	$byteCount=0; $oldRecordCount=0; $newRecordCount=0;
	
	/* LIST OF NEW FEED DATA IS CREATED SUCCESSFULLY */
	if (createFileList($uID)==TRUE) {
	
		writeToLog("INFORMATION: Attempting master update.");
		
		$xslConcatFile=realpath("../transforms/concat.xsl");
		$xmlListFile=realpath("../data/files_$uID.xml");
		$xmlOutputFile="../data/concat_$uID.xml";
		$masterFile=realpath("../data/master_$uID.xml");
		
		$params=NULL;
		$outputXML = new DOMDocument("1.0");
		$outputXML->preserveWhiteSpace=FALSE;
		/* DANGER POINT */
		$outputXML = getTransformedXML($xmlListFile, $xslConcatFile, $params, FALSE);
		
		/* IF WE GET NO ERRORS THEN SAVE CONCAT FILE TO DISK */
		if ($outputXML!=NULL) {
				
			/* do loop for setting ids at this point */  
			$oldRecordCount = getUserArticleCountFromFile($uID);
			$newRecordCount = addArticleIds($outputXML, $oldRecordCount);
			writeUserArticleCountToFile($uID, $newRecordCount);
			
			/* DEBUG ONLY */
			//writeToLog("INFORMATION: Old Record Count: $oldRecordCount, New Record Count: $newRecordCount");
			
			$outputXML->formatOutput=TRUE;
			$byteCount = $outputXML->save($xmlOutputFile);
			$fileSize = $byteCount/1024;
		
			 /* UPDATE MASTER FILE WITH CONCAT FILE */	
			if (file_exists($xmlOutputFile)) {
		
				if (copy($xmlOutputFile, $masterFile)) {
				
					unlink($xmlOutputFile);
					if (updateAllSubDateXML($uID)!=TRUE) {
						
						writeToLog("ERROR: Unable to update last published dates.");
					}
					else {
						/* DEBUG ONLY */
						//writeToLog("INFORMATION: Last Published dates written to sub file.");
					}
				}
				else {
					writeToLog("ERROR: Unable to copy concat file to Master.");
				}
			}	
			else {
				writeToLog("ERROR: Missing concat file, Master cannot be updated.");
			}
			writeToLog("INFORMATION: Master updated. Size: ".number_format($fileSize)." KB");
		}
		else {
			writeToLog("ERROR: Concat file transformation failed. Master NOT updated!");
		}	
	}
	else {
		writeToLog("ERROR: Unable to create list file. Master NOT updated!");
	}
	
	/* TIDY UP OUTPUT FILES */
	tidyUp($uID);
	
	/* CONSTRUCT FEEDBACK DATA */
	header("Content-type: text/xml");
	echo "<?xml version='1.0' encoding='UTF-8'?>";
	echo "<file>";
	echo "<name>concat_$uID.xml</name>";
	echo "<bytes>$byteCount</bytes>"; 
	echo "</file>";

/* SOME OF THESE FUNCTIONS NEED TIDYING/ERROR CHECKING */

function getUserArticleCountFromFile($usrID){
	
	/* GET NUMBER OF ARTICLES FROM FILE */	
	$recordCount=0;
	$countFile="../data/mastercount_$usrID.xml";
	$countXML = getLoadedDOMDoc($countFile);	
	$counts = $countXML->getElementsByTagName("count");
	$recordCount=$counts->item(0)->nodeValue;
	unset($countXML, $counts);
	return $recordCount;
}

function writeUserArticleCountToFile($usrID, $newCount){
	
	$returnValue=FALSE;
	
	$countFile="../data/mastercount_$usrID.xml";
	$countXML = getLoadedDOMDoc($countFile);
	
	if ($countXML!=FALSE){
		
		$counts = $countXML->getElementsByTagName("count");
		$counts->item(0)->nodeValue=$newCount;
		$countXML->save($countFile);
		$returnValue= TRUE;
		unset($counts);
	}
	unset($countXML);
	return $returnValue;
}

function addArticleIds($concatXML, $idStartNumber){
	
	$itemId=$idStartNumber;
	$items=$concatXML->getElementsByTagName("item");
	
	foreach ($items as $item){
		
		$currentId = $item->getElementsByTagName("item_id")->item(0)->nodeValue;
		
		if ($currentId == "0") {
			
			$itemId++;
			$item->getElementsByTagName("item_id")->item(0)->nodeValue=$itemId;
		}
		else {
			break;
		}
	}
	unset($items);
	return $itemId;	
}

function updateAllSubDateXML($usrID) {
	
	/* UPDATE ALL SUB_UPDATE FIELDS WITH TEMP VALUES */
	/* AND RESET TEMPS TO BLANK */
	$result=FALSE;
	$subsFile="../data/subs_$usrID.xml";
	$subsXML = getLoadedDOMDoc($subsFile);
	$subs = $subsXML->getElementsByTagName('sub');
	
	foreach ($subs as $sub){
	
		$sTempUpdate = $sub->getElementsByTagName('sub_temp_update')->item(0)->nodeValue;
		/* DEBUG ONLY */
		$sID = $sub->getElementsByTagName('sub_id')->item(0)->nodeValue;
		
		if ($sTempUpdate!=""){
			
			$sub->getElementsByTagName('sub_update')->item(0)->nodeValue=$sTempUpdate;
			$sub->getElementsByTagName('sub_temp_update')->item(0)->nodeValue="";
			/* DEBUG ONLY */
			//writeToLog("INFORMATION: Update date changed: $sTempUpdate for $sID");
		}
	}
	
	if ($subsXML->save($subsFile)>0) {
		
		$result=TRUE;
	}
	unset($subs);
	return $result;
}

function createFileList($usrID){
	
	$returnValue=FALSE;
	$usrSubFile="../data/subs_$usrID.xml";
	$usrFileList="../data/files_$usrID.xml";
	$outputFile="";
	
	$handle = fopen($usrFileList, "w");
		
	/* GET DATA FROM SUBS FILE */
	$xmlDoc = new DOMDocument();
	$xmlDoc->load($usrSubFile);
	$subCount= $xmlDoc->getElementsByTagName('sub')->length;
	$subItems=$xmlDoc->getElementsByTagName('sub');
	
	fwrite($handle, '<?xml version="1.0" encoding="UTF-8"?>');
	fwrite($handle, "<files>");

	/* LOOP THRU' ALL SUBS AND FIND WHICH ONES HAVE AN OUTPUT FILE */	
	for ($count=0; $count<=$subCount-1; $count++) {
		
		$sID = $subItems->item($count)->getElementsByTagName('sub_id') ->item(0)->childNodes->item(0)->nodeValue;
		$outputFile="output_".$usrID."_$sID.xml";
		
		if (file_exists("../data/$outputFile")) {
			
			fwrite($handle, "<file>$outputFile</file>");
		}
	}

	fwrite($handle, "<file>master_$usrID.xml</file>");
	fwrite($handle, "</files>");
	fclose($handle);
	unset($handle);
	unset($xmlDoc);
	
	$returnValue=TRUE;
	return $returnValue;
}

function tidyUp($uID) {
	
	$listFile="../data/files_$uID.xml";
	$mask = "../data/output_".$uID."_*.xml";

	/* DELETE CONCAT FILE */
	if (file_exists($listFile)) unlink($listFile);

	/* DELETE UPDATE FILES */
	foreach (glob($mask) as $outputFileName) {
		
		unlink($outputFileName); 
	}  
}
	