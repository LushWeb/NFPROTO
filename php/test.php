<?php

	require 'general.php';
	
	$localUID = 1;
	$GLOBALS["gUsrID"] = $localUID;
	
	
	$params = NULL;
	$sTransformFile = realpath(gcFOLDER_TRANSFORM."getSubsData.xsl");
	$subsFile = realpath(gcFOLDER_DATA."subs_$localUID.xml");
	
	echo getTransformedXML($subsFile, $sTransformFile, $params, TRUE);
	

?>