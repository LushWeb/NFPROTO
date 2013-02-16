<?php

	require 'general.php';
	
	
	$localUID=1;
	$GLOBALS["gUsrID"]=$localUID;
	
	//trigger_error("WTF!!",E_USER_WARNING);
	$params=NULL;
	$sTransformFile=realpath("../transforms/subs.xsl");
	$subsFile=realpath("../data/subs_$localUID.xml");
	
	
	echo getTransformedXML($subsFile, $sTransformFile, $params, TRUE);
	

?>