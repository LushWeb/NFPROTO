<?php

  	require 'general.php';
	
	/* CONSTANTS */
	define( "cNAMESPACE_RSS2", 1 );
	define( "cNAMESPACE_ATOM", 2 );
	define( "cNAMESPACE_RDF", 3 );
	
	define( "cFEED_STATUS_GOOD", "Good" );
	define( "cFEED_STATUS_BAD", "Bad" );
	
	/* VARIABLES */
	
	/* VARIABLES - PASSED FROM CALLING JAVASCRIPT */	
	$uID 					= $_GET["usrID"];
	$subID 					= $_GET["subID"];
	
	$GLOBALS["gUsrID"] 		= $uID;
	
	/* VARIABLES - OTHER */
	$itemCount 				= 0;
	$errorMsg 				= "NA";
	$subStatus 				= cFEED_STATUS_BAD;
	$byteCount 				= 0;
	$hasBuildDate 			= FALSE;
	$hasDifferentBuildDate 	= FALSE;
	$hasPubDate 			= FALSE;
	
	/* DEBUG ONLY */
	$buildDateStr 			= "NULL";
	$pubDateStr 			= "NULL";
	
	/* FILES */
	$subsFile 				= realpath( gcFOLDER_DATA."subs_$uID.xml" );
	$xmlOutputFile 			= gcFOLDER_DATA."output_".$uID."_$subID.xml";
	
	/* MAIN PROCESSING */
	
	/* GET ALL RELEVENT SUB DATA FROM SUBS FILE */
	$subsXML = getLoadedDOMDoc( $subsFile );
	$subsXPath = new DOMXPath( $subsXML ); 
	$currentSubNodes = $subsXPath->query( "/subs/sub[sub_id=$subID]" );
	$subURL = getXMLFieldValue( $currentSubNodes, "sub_link" );
	$subLastUpdateDate = getXMLFieldValue( $currentSubNodes, "sub_update" );
	$subName = getXMLFieldValue( $currentSubNodes, "sub_title" );
	$subMinimal = getXMLFieldValue( $currentSubNodes, "sub_minimal" );
	$subType = getXMLFieldValue( $currentSubNodes, "sub_type" );
	$subLastBuildDate = getXMLFieldValue( $currentSubNodes, "sub_build_date" );
	unset( $subsXPath , $origFeedXML, $subsXML, $currentSubNodes );
		
	/* MAKE NEW LAST UPDATED DATE */
	$newLUDate = date( "Y-m-d H:i:s" );

	/* DOWNLOAD FEED DATA */
	$origFeedXML = getLoadedDOMDoc( $subURL );
	
	/* WE HAVE FEED DATA */
	if ( $origFeedXML != NULL ){
		
		/* DETERMINE HOW TO PROCESS IT */		
		switch ( $subType ) {
		
			case "RSS2.0":
				
				$rssTransformFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_PROCESS_RSS2 );
				
				/* ITEM PUBDATE */
				$firstItemPubDate = getXMLValueNS( $origFeedXML, "/rss/channel/item/pubDate", cNAMESPACE_RSS2 );
				
				if ( !is_null($firstItemPubDate) ) $hasPubDate = TRUE;
				
				/* FEED BUILD DATE */
				$feedLastBuildDate = getXMLValueNS( $origFeedXML, "/rss/channel/lastBuildDate", cNAMESPACE_RSS2 );
				
				if ( is_null($feedLastBuildDate)) $feedLastBuildDate = getXMLValueNS( $origFeedXML, "/rss/channel/pubDate", cNAMESPACE_RSS2 ); 
				
				if ( !is_null($feedLastBuildDate) )  {
						
					$hasBuildDate = TRUE;	
					if ( $subLastBuildDate != $feedLastBuildDate )  $hasDifferentBuildDate = TRUE;
					 
				}
				break;
				
			case "ATOM":
				
				$rssTransformFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_PROCESS_ATOM );
				
				/* ITEM PUBDATE */
				$firstItemPubDate = getXMLValueNS( $origFeedXML, "/atom:feed/atom:entry/atom:updated", cNAMESPACE_ATOM );
				
				if ( is_null($firstItemPubDate) ) $firstItemPubDate = getXMLValueNS( $origFeedXML, "/atom:feed/atom:entry/atom:published", cNAMESPACE_ATOM ); 
				
				if ( !is_null($firstItemPubDate) ) $hasPubDate = TRUE; 
								
				/* FEED BUILD DATE */
				$feedLastBuildDate = getXMLValueNS( $origFeedXML, "/atom:feed/atom:updated", cNAMESPACE_ATOM );
				
				if ( is_null($feedLastBuildDate)) $feedLastBuildDate = getXMLValueNS( $origFeedXML, "/atom:feed/atom:published", cNAMESPACE_ATOM ); 
				
				if ( !is_null($feedLastBuildDate) )  {
						
					$hasBuildDate = TRUE;	
					if ( $subLastBuildDate != $feedLastBuildDate ) $hasDifferentBuildDate = TRUE;
				}
				break;
				
			case "RDF":
			
				$rssTransformFile = realpath( gcFOLDER_TRANSFORM.gcFILE_TRANSFORM_PROCESS_RDF );
				
				/* ITEM PUBDATE */
				$firstItemPubDate = getXMLValueNS( $origFeedXML, "/rdf:RDF/root:item/dc:date", cNAMESPACE_RDF );
				
				if ( !is_null($firstItemPubDate) ) $hasPubDate = TRUE; 
				
				/* FEED BUILD DATE */
				$feedLastBuildDate = NULL;
				$hasBuildDate = FALSE;	
				break;
		}

		/* DEBUG ONLY */
		if ( !is_null($feedLastBuildDate) ) $buildDateStr = $feedLastBuildDate;
		if ( !is_null($firstItemPubDate) ) $pubDateStr = $firstItemPubDate;
		writeToLog("INFORMATION: Preparing $subName [id:$subID]. Type: $subType, Build Date: $buildDateStr, First Pub Date : $pubDateStr");
		
		/* DO NOT PROCESS ITEMS THAT HAVE NO DATE/TIME INFO ( BUILD DATE OR PUBDATE )*/
		if ( !$hasPubDate && !$hasBuildDate ) {
			
			$errorMsg = "Invalid Feed. No date/time data contained within this feed.";
			writeToLog("WARNING: Unable to process feed $subName ['$subURL'] it contains no valid date/time data.");
		}
		else {
			
			if ( $hasDifferentBuildDate || !$hasBuildDate ) {
				
				/* SET UP THE RSS FEED */
				$outputXML = new DOMDocument("1.0");
				$outputXML->preserveWhiteSpace = FALSE;
				$domXSL = getLoadedDOMDoc( $rssTransformFile );
				$xsltProc = new XSLTProcessor;
				$xsltProc->setParameter( "", "minimal", $subMinimal );
				$xsltProc->importStyleSheet( $domXSL );
				
				/* DO THE TRANSFORM */
				$outputXML = $xsltProc->transformToDoc( $origFeedXML );
								
				/* IF NO ERRORS ON TRANSFORMATION */
				if ( $outputXML != FALSE ) {
						
					/* DO THE PROCESSING - DIFFERENT DEPENDANT ON WHETHER THERE IS A PUBDATE */
					if ( $hasPubDate ) {
						
						$itemCount = processItems( $subID, $subName, $outputXML, $subLastUpdateDate );
					}
					else {
						
						$itemCount = processItemsNoPubDate( $subID, $subName, $outputXML, $feedLastBuildDate );
					}
					
					/* IF THERE ARE NEW ITEMS */
					if ( $itemCount > 0 ) {
						
						$outputXML->formatOutput = TRUE;
						$byteCount = $outputXML->save($xmlOutputFile);
						
						/* IF SAVE WORKED */
						if ( $byteCount > 0 ) {
							
							/* SUCCESS WITH ARTICLES SENT TO FILE */
							writeToLog("INFORMATION: Done with $subName [id:$subID] with $itemCount new article(s)");
							$subStatus = cFEED_STATUS_GOOD;
							/* UPDATE TEMP LU DATE IN SUBS FILE */
							updateSubXML( $uID, $subID, "sub_temp_update", $newLUDate );
						}
						else {
							
							/* UNSUCCESSFUL SAVE OF DATA */
							$errorMsg = "Unable to save RSS data.";
							writeToLog("WARNING: Unable to save $subName ['$subURL'] data file.");							
						}
					}
					else {
							
						/* SUCCESS WITH NO ARTICLES */
						$subStatus = cFEED_STATUS_GOOD;
						writeToLog("INFORMATION: Done with $subName [id:$subID] No new article(s)");
			
					}
					/* WRITE NEW BUILD DATE TO SUBS FILE */
					if ( $hasDifferentBuildDate ) updateSubXML($uID, $subID, "sub_build_date", $feedLastBuildDate);
					
				} 
				else {
			
					/* UNSUCCESSFUL TRANSFORMATION OF DATA */
					$errorMsg = "Unable to process RSS data.";
					writeToLog("WARNING: Unable to process $subName ['$subURL']");
				}
			}
			else {
				
				/* SUCCESS SAME BUILD DATE AS LAST NO NEED TO ACCESS ARTICLES */
				$subStatus = cFEED_STATUS_GOOD;
				writeToLog("INFORMATION: Done with $subName [id:$subID] No processing needed, same build date as last.");
			}
		}			
	}	
	else {
		
		/* UNSUCCESSFUL READ OF DATA URL */
		$errorMsg = "Unable to read RSS data.";
		writeToLog("WARNING: Unable to access URL $subName ['$subURL']");
	}
	
	/* RESET VARS HERE */
	unset( $outputXML, $xsltProc, $origFeedXML, $domXSL );
	
	/* SEND PROCESSING DETAILS BACK TO CALLING SCRIPT ON NETFEED.JS */
	header("Content-type: text/xml");
	echo "<?xml version='1.0' encoding='UTF-8'?>";
	echo "<sub>";
	echo "<sub_id>$subID</sub_id>";
	echo "<sub_status>$subStatus</sub_status>";
	echo "<error_msg>$errorMsg</error_msg>";
	echo "<sub_item_count>$itemCount</sub_item_count>";
	echo "</sub>";
	

function processItems( $pSubID, $pSubName, $pOutputXML, $pSubLUDate ) {
	
	$_domItemsToRemove = array();
	$_itemCount = 0;
	$_domURL = "";
	$_subNodeSet = $pOutputXML->getElementsByTagName("item");
	
	if ( $_subNodeSet->length > 0) $_domURL = getDomainName( $_subNodeSet->item(0)->getElementsByTagName("source_link")->item(0)->childNodes->item(0)->nodeValue );
	
	/* LOOP THRU' ALL FEED ITEMS */
	for ( $_lCount = 0; $_lCount < $_subNodeSet->length; $_lCount++ )	{
		
		/* PROCESS ELEMENT NODES ONLY */
		if ( $_subNodeSet->item($_lCount)->nodeType == 1 ) {
					
			/* CONSTRUCT 'INTERVAL' */
			$_pubDate = strftime("%Y-%m-%d %H:%M:%S", strtotime($_subNodeSet->item($_lCount)->getElementsByTagName("pubdate")->item(0)->childNodes->item(0) -> nodeValue));
				
			if ( $_pubDate > $pSubLUDate ) {
					
				/* ADD DATA TO BLANK FIELDS NB. THESE FIELDS MUST HAVE SOMETHING IN THEM TO BE ACCESSED IN THIS WAY */
				$_subNodeSet->item($_lCount)->getElementsByTagName("sub_id")->item(0)->childNodes->item(0)->nodeValue = $pSubID;
				$_subNodeSet->item($_lCount)->getElementsByTagName("source")->item(0)->childNodes->item(0)->nodeValue = $pSubName;
				$_subNodeSet->item($_lCount)->getElementsByTagName("interval")->item(0)->childNodes->item(0)->nodeValue = $_pubDate;
				$_currentSubArticle = $_subNodeSet->item($_lCount)->getElementsByTagName("article")->item(0)->childNodes->item(0)->nodeValue;
				$_subNodeSet->item($_lCount)->getElementsByTagName("article")->item(0)->childNodes->item(0)->nodeValue = cleanArticle( $_currentSubArticle, $_domURL );					
				$_itemCount++;
				
			}	
			else {
				/* FLAG ITEM FOR REMOVAL */ 
				$_domItemsToRemove[] = $_subNodeSet->item($_lCount);
			}
		}
	}
	foreach( $_domItemsToRemove as $_domItemNode ) {
		
		deleteNode( $_domItemNode ); 
	}
	 
	unset( $_domItemsToRemove, $_subNodeSet );
	
	return $_itemCount;
}

function processItemsNoPubDate( $pSubID, $pSubName, $pOutputXML, $pBuildDate ) {
	
	$_itemCount = 0;
	
	/* CONSTRUCT 'INTERVAL' FROM FEED'S BUILD DATE */
	$_pubDate = strftime("%Y-%m-%d %H:%M:%S", strtotime($pBuildDate));
	$_subNodeSet = $pOutputXML->getElementsByTagName("item");

	if ( $_subNodeSet->length > 0){
		
		$_domURL = getDomainName( $_subNodeSet->item(0)->getElementsByTagName("source_link")->item(0)->childNodes->item(0)->nodeValue );
	}

	/* LOOP THRU' ALL FEED ITEMS */
	for ( $_lCount = 0; $_lCount < $_subNodeSet->length; $_lCount++ )	{
		
		/* PROCESS ELEMENT NODES ONLY */
		if ( $_subNodeSet->item($_lCount)->nodeType == 1 ) {

			/* ADD DATA TO BLANK FIELDS NB. THESE FIELDS MUST HAVE SOMETHING IN THEM TO BE ACCESSED IN THIS WAY */
			$_subNodeSet->item($_lCount)->getElementsByTagName("sub_id")->item(0)->childNodes->item(0)->nodeValue = $pSubID;
			$_subNodeSet->item($_lCount)->getElementsByTagName("source")->item(0)->childNodes->item(0)->nodeValue = $pSubName;
			$_subNodeSet->item($_lCount)->getElementsByTagName("interval")->item(0)->childNodes->item(0)->nodeValue = $_pubDate;
			$_currentSubArticle = $_subNodeSet->item($_lCount)->getElementsByTagName("article")->item(0)->childNodes->item(0)->nodeValue;
			$_subNodeSet->item($_lCount)->getElementsByTagName("article")->item(0)->childNodes->item(0)->nodeValue = cleanArticle( $_currentSubArticle, $_domURL );					
			$_itemCount++;
		}
	}
	unset( $_subNodeSet );
	
	return $_itemCount;
}

function getDomainName( $pSourceURL ){

	$pSourceURL = strtolower( $pSourceURL );
	$_parsedURL = parse_url( $pSourceURL );
	return "http://".$_parsedURL['host'];
}

function getXMLValueNS( $pNodeSet, $xPathStr, $NSType ) {
	
	$_XPath = new DOMXPath( $pNodeSet );
	
	switch ( $NSType ) {
		case cNAMESPACE_ATOM:
			$_XPath->registerNamespace( "atom" , "http://www.w3.org/2005/Atom" );
			break;
		case cNAMESPACE_RDF:
			$_XPath->registerNamespace( "rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#" );
			$_XPath->registerNamespace( "dc", "http://purl.org/dc/elements/1.1/" );
			$_XPath->registerNamespace( "rdfs", "http://www.w3.org/2000/01/rdf-schema#");
			$_XPath->registerNamespace( "root", "http://purl.org/rss/1.0/" );		
			break;
	}
	$_nodes = $_XPath->query($xPathStr);

	if( isset($_nodes->item(0)->nodeValue) ) return $_nodes->item(0)->nodeValue; 
	else return NULL;
}	

function getXMLFieldValue( $pNodeSet, $pField ){ return $pNodeSet->item(0)->getElementsByTagName($pField)->item(0)->childNodes->item(0)->nodeValue; }

function cleanArticle( $pArticleText, $pDomainName ) {
	
	$_imgSearchStr = 'src="/'; $_imgReplaceStr = 'src="'.$pDomainName.'/';
	$_ancSearchStr = 'href="/'; $_ancReplaceStr = 'href="'.$pDomainName.'/';
	
	$_outputText = $pArticleText;
	/* CLEAN UP ALL THE CRAP FROM THE ARTICLE FIELD */
	$_outputText = str_replace( '<a ', '<a target="_blank" ', $_outputText );
	$_outputText = str_replace( '<p></p>', '', $_outputText );
	
	// cant do this every time too time consuming
	
	/* SOME IMG AND ANCHOR TAGS HAVE NO HTTP DOMAINNAME ETC - THIS IS OUTRAGEOUS */
	$_outputText = str_replace( $_imgSearchStr, $_imgReplaceStr, $_outputText );
	$_outputText = str_replace( $_ancSearchStr, $_ancReplaceStr, $_outputText );
	/* CEHECK FOR CODE INJECTION */
	$_outputText = str_replace( '<?', ' CODE INJECTION(', $_outputText );
	$_outputText = str_replace( '?>', ')END INJECTION ', $_outputText );
	return $_outputText;
}

function updateSubXML($pUsrID, $pSubID, $pFieldName, $pNewDate) {
		
	/* EDIT A USERS SUBSCRIPTION DATA */

	$_subsFile = realpath( gcFOLDER_DATA."subs_$pUsrID.xml" );
	$_subsXML = getLoadedDOMDoc($_subsFile);
	$_xpath = new DOMXPath($_subsXML);
	$_nodes = $_xpath->query("/subs/sub[sub_id=$pSubID]/$pFieldName");
	$_node = $_nodes->item(0)->nodeValue = $pNewDate;
	$_subsXML->save($_subsFile);
	unset( $_subsFile, $_subsXML, $_xpath, $_nodes, $_node );
}
?>