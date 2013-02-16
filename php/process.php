<?php

  	require 'general.php';
	
	$uID=$_GET["usrID"];
	$subID=$_GET["subID"];
	$subURL=$_GET["subURL"];
	$subDate=$_GET["subDate"];
	$subGrpId=$_GET["subGrpId"];
	$subFeedName=urldecode($_GET["subFeedName"]);
	$subMinimal=$_GET["subMinimal"];
	$errorMsg="NA";
	$byteCount=0;
	
	$GLOBALS["gUsrID"]=$uID;
	
	/* DEBUG ONLY */	
	//writeToLog("INFORMATION: Attempting process for sub id:'$subID' from: '$subURL', date: '$subDate'");
	
	$rssTransformFile=realpath("../transforms/sub.xsl");
	$xmlOutputFile="../data/output_".$uID."_$subID.xml";
	$subStatus="Bad";
	$newLUDate = date('Y-m-d H:i:s');
	
	
	$params=array(array("subid", $subID),
				array("feedname", $subFeedName), 
				array("minimal", $subMinimal));
				
	$outputXML = new DOMDocument("1.0");
	$outputXML->preserveWhiteSpace=FALSE;
	$outputXML = getTransformedXML($subURL, $rssTransformFile, $params, FALSE);
	
	/* IF NO ERRORS ON TRANSFORMATION */
	if ($outputXML != FALSE) {
		
		$itemCount=0;
		$domItemsToRemove=array();
		$subItems=$outputXML->getElementsByTagName("item");
	
		/* LOOP THRU' ALL FEED ITEMS */
		for ($i=0; $i < $subItems->length; $i++)	{
				
			/* PROCESS ELEMENT NODES ONLY */
			if ($subItems->item($i)->nodeType==1) {
			
				/* CONSTRUCT 'INTERVAL' */
				$currentPubDate=strftime("%Y-%m-%d %H:%M:%S", strtotime($subItems->item($i)->getElementsByTagName("pubdate")->item(0)->childNodes->item(0)->nodeValue));
				
				if ($currentPubDate>$subDate) {
						
					/* ADD DATA TO BLANK FIELDS */
					$subItems->item($i)->getElementsByTagName("interval")->item(0)->childNodes->item(0)->nodeValue=$currentPubDate;
					$subItems->item($i)->getElementsByTagName("grp_id")->item(0)->childNodes->item(0)->nodeValue=$subGrpId;
					$currentSubArticle = $subItems->item($i)->getElementsByTagName("article")->item(0)->childNodes->item(0)->nodeValue;
					/* CLEAN ARTICLE FIELD */
					$subItems->item($i)->getElementsByTagName("article")->item(0)->childNodes->item(0)->nodeValue=cleanArticle($currentSubArticle);					
					$itemCount+=1;
				}	
				else {
										
					/* FLAG ITEM AS BOGUS  - REMOVED LATER */ 
					$domItemsToRemove[]=$subItems->item($i);
				}
			}

		}

		/* DELETE BOGUS NODES */
		foreach( $domItemsToRemove as $domItemNode )	{
			 deleteNode($domItemNode); 
		} 
		/* IF THERE ARE NEW ITEMS */
		if ($itemCount!=0) {
			
			$outputXML->formatOutput=TRUE;
			$byteCount = $outputXML->save($xmlOutputFile);
			
			/* IF SAVE WORKED */
			if ($byteCount > 0) {
				
				/* SUCCESS WITH ARTICLES SENT TO FILE */
				writeToLog("INFORMATION: $itemCount article(s) from: '$subURL' saved to file: '$xmlOutputFile'");
				$subStatus="Good";
				
				// THIS NEEDS WORK
				updateSubDateXML($uID, $subID, $newLUDate);
			}
		}
		else {
				
			/* SUCCESS WITH NO ARTICLES */
			$subStatus="Good";
			
			/* DEBUG ONLY */
			//writeToLog("INFORMATION: No articles from: '$subURL'.");
		}
	} 
	else {

		/* UNSUCCESSFUL DOWNLOAD OF DATA */
		$errorMsg="Unable to process RSS data.";
		writeToLog("WARNING: Unable to process: '$subURL'");
		$itemCount=0;
	}
	
	unset($outputXML);
	/* SEND PROCESSING DETAILS BACK TO CALLING SCRIPT ON NETFEED.JS */
	header("Content-type: text/xml");
	echo "<?xml version='1.0' encoding='UTF-8'?>";
	echo "<sub>";
	echo "<sub_id>".$subID."</sub_id>";
	echo "<sub_status>".$subStatus."</sub_status>";
	echo "<error_msg>".$errorMsg."</error_msg>";
	echo "<sub_item_count>".$itemCount."</sub_item_count>";
	echo "<sub_update>".$newLUDate."</sub_update>";
	echo "</sub>";
	
	/* DEBUG ONLY */
	//writeToLog("INFORMATION: Done : ".$subID." Status is ".$subStatus);
	

function cleanArticle($articleText) {
	
	$outputText = $articleText;
	/* CLEAN UP ALL THE CRAP FROM THE ARTICLE FIELD */
	$outputText = str_replace('<a ', '<a target="_blank" ', $outputText);
	$outputText = str_replace('<p></p>', '', $outputText);
	return $outputText;
}

function updateSubDateXML($usrID, $subID, $newDate) {
		
	/* EDIT A USERS SUBSCRIPTION LAST UPDATED DATE */
	/* NEEDS ERROR CHECKING */

	$subsFile="../data/subs_$usrID.xml";
	$subsXML = getLoadedDOMDoc($subsFile);
	$xpath = new DOMXPath($subsXML);
	$nodes = $xpath->query("/grps/grp/subs/sub[sub_id=$subID]/sub_temp_update");
	$node = $nodes->item(0);
	$node->nodeValue = $newDate;
	$subsXML->save($subsFile);
	unset($subsXML);
}
	
		
?>