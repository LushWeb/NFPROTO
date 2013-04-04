/* 	Geoff Lush - October 2012+ */

/* VARIABLES & CONSTANTS */
	
	/* TO BE PASSED FROM LOGIN */
	window.gUsrID 					= 1;
	
	/* TO BE TAKEN FROM auth_?.xml */ 
	window.gBulkDeleteDays; window.gMarkReadOnVisit; window.gFeedOrder; window.gDefaultFormats = [];
	
	/* ARTICLE SELECTION */ 
	window.gStatus 					= 0;
	window.gSubID 					= 0;
	window.gGrpID 					= 0;
	window.gFunction				= 0;
	window.gFormat					= 0;
	
	/* DEALING WITH GRPS OR SUBS */
	window.gcIDTYPE_GRP 			= 0; 
	window.gcIDTYPE_SUB 			= 1;
	
	/* MENU ARRAYS */
	window.gStatusMnuItems 			= new Array("Unread", "Read", "Bookmarked");
	window.gFuncMnuItems 			= new Array( "Mark all as read", "Bookmark all", "Mark all as unread" );
	
	window.gcSTATUS_UNREAD			= 0;
	window.gcSTATUS_READ			= 1;
	window.gcSTATUS_BOOKMARKED		= 2;
	
	window.gcFUNC_MAAR				= 0;
	window.gcFUNC_BA				= 1;
	window.gcFUNC_MAAU				= 2;
	
	/* SUBS ARRAYS */
	window.gSubs	 				= [];		// HOLDS ALL GRP/SUB DATA
	window.gSubsSI		 			= [];		// LOOKUP FOR SUB IDS
	
	/* gSubs[] OFFSETS */ 
	window.gcSUB_ID 				= 0;
	window.gcSUB_NAME 				= 1;
	window.gcSUB_NAMEORIG 			= 2;
	window.gcSUB_LINK 				= 3;
	window.gcSUB_NEWNUM_T			= 4;
	window.gcSUB_COPYRIGHT			= 5;
	window.gcSUB_COUNTS				= 6;
	window.gcSUB_UPDATESTATUS_T		= 7;

	/* VARIOUS GLOBALS */
	window.gFirstRun 				= true;		// IS THIS THE FIRST UPDATE RUN
	window.gCurrentItemCount 		= 0;		// NO OF ARTICLES DISPLAYED
	window.gUpdateCount 			= 0;		// COUNT OF UPDATES FOUND IN CURRENT PROCESSING RUN
	window.gUpdateMax 				= 0;		// SET TO NUMBER OF SUBS
	window.gInterval;							// TIMER TO RUN UPDATE

	/*MENU TIMERS */
	window.gTimerStatusMenu;
	window.gTimerArticleMenu;
	window.gTimerFuncMenu;
	window.gTimerPopup;
	
	/* MENU ICONS */
	window.gMnuIconOff 				= "images/rss_small_grey.jpg";
	window.gMnuIconOn 				= "images/rss_small.jpg";
		
	/* DEFAULTS */
	window.gDefaultUpdateStatus 	= "Waiting";
	window.gDefaultStatusText 		= "Unread";
	window.gDefaultArticleText 		= "All articles";
	window.gDefaultFuncText 		= "Mark all as read"
	window.gDefaultPageTitle 		= "Reader";	

/* FUNCTIONS */ 

/* MAIN - THE MOST IMPORTANT STUFF */

function getUserOptions() {

	/* READ USER SETTINGS FILE HERE */	
	window.gBulkDeleteDays = 3;
	window.gMarkReadOnVisit = true;
	window.gFeedOrder = 0;
	window.gDefaultFormats = [ 0, 1, 0];
	window.gFormat = gDefaultFormats[gcSTATUS_UNREAD];
}

function pageSetup() {
	
	/* DEBUG ONLY */
	//gUsrID = Number(window.prompt("Enter User ID:",1));
	getUserOptions()
	makeSubsArray();
	/* MAKE MENUS */
	getStructure( false, true ); 
	makeMenu( "status", window.gStatusMnuItems );
	makeMenu( "func", window.gFuncMnuItems );
	/* MAKE THE BUTTONS WORK */
	attachEvents();
	/* SET THE UPDATE MECHANISM TO RUN EVERY 30 MINS */
	window.gInterval = self.setInterval( function(){ updateWrapper() }, 1800000 );
	/* POP SCREEN */
	displaySubs();
	setUpdateStatusMessage( window.gDefaultUpdateStatus );
	/* DELAY FIRST UPDATE 2 SECS */
	window.setTimeout( "updateWrapper();", 2000 );
}

function updateWrapper() {

	/* SET UP FEED UPDATE MECHANISM */
	initUpdateStatusMessage();
	setUpdateStatusMessage("Requesting subscription updates");
	
	/* RESET UPDATE STATUS TO BAD */
	resetSubsArrayField( window.gcSUB_UPDATESTATUS_T, 0 );
	
	/* DO A BULK DELETE OF OLD READ ITEMS */
	if ( gFirstRun ) doBulkDelete();
	
	/* GET NUMBER OF SUBSCRIPTIONS TO CHECK */
	if ( gUpdateMax == 0 ) window.gUpdateMax = window.gSubs.length;
	
	/* RESET COUNT OF UPDATES */
	window.gUpdateCount = 0;
	
	/* RUN MAIN UPDATE PROCESS */
	updateSubs();
}

function mergeWrapper() {
	
	window.gUpdateCount = 0;
	var _subItemCount = getNewItemCount();
	
	/* IF NO NEW ARTICLES */
	if ( _subItemCount == 0 ) {
		
		setUpdateStatusMessage( "No new articles" ); 
	}
	else {
		
		setUpdateStatusMessage( "Updating articles list" );
			
		/* KICK OFF MERGE */
		if ( mergeSubs() ) {
			
			setUpdateStatusMessage( "Success - "+ _subItemCount+ " new article(s) available" );
			/* ALERT USER? */
			if ( window.gCurrentItemCount == 0 || window.gFirstRun ) selectDefault(); 
			else alertUser( newDataInView() );
		}			
	}
	/* RESET ARTICLE COUNT DATA */
	resetSubsArrayField( window.gcSUB_NEWNUM_T, 0 );
	window.gFirstRun = false;
	window.setTimeout( 'defaultStatusUpdate();' , 10000 );
}

/* SPECIFIC PHP CALLS */

/* SYNCH'ED */

function editMasterItemStatus( pItemId, pNewStatus ) {

	/* CHANGE STATUS FOR A PARTICULAR ARTICLE */
	var _qString = "php/edit.php?usrID=" + window.gUsrID + "&itemID=" + pItemId + "&newStatus=" + pNewStatus;
	var _response = syncQuery( _qString, false );
}

function mergeSubs(){

	/* MERGE ALL SUB DATA TO THE MASTER  VIA merge.php */	
	var _mergeFeedbackXML = syncQuery( "php/merge.php?usrID=" + window.gUsrID, true );
	var _rVal = false; var _byteCount = 0;
	
	if ( _mergeFeedbackXML != null ) {

		_byteCount = Number( _mergeFeedbackXML.getElementsByTagName("bytes")[0].childNodes[0].nodeValue );
		if ( _byteCount > 0 ) _rVal = true;
	}
	_mergeFeedbackXML = null;
	return _rVal;
}

function bulkUpdateStatus( pNewStatus ) {
	
	/* NEEDS WORK */
	var _qString = "php/bulkedit.php?usrID=" + window.gUsrID + "&subID=" + window.gSubID + "&grpID=" + window.gGrpID + "&cStatus=" + window.gStatus + "&nStatus=" + pNewStatus;
	syncQuery( _qString, false );
	resetArticleDisplay();
	displayNoItemHTML();
	getStats();
}

function getStats() {
	
	var _qString = "php/misc.php?usrID=" + window.gUsrID + "&func=STATS&itemStatus=" + window.gStatus + "&grpID=0&subID=0&itemOrder=0&format=0";
	var _statXML = syncQuery( _qString, true );
	var _cIndex = 0;
	
	if ( _statXML != null ) {
	
		var _cids = _statXML.getElementsByTagName("cid");
		var _cidcounts = _statXML.getElementsByTagName("cidcount");
		resetSubsArrayField( window.gcSUB_COUNTS, 0 );
			
		/* ADD COUNT DATA TO gSubs[] */
		for ( var _i = 0; _i < _cids.length; _i++ ) {
			
			var _curSubID = Number( _cids[_i].childNodes[0].nodeValue );
			var _curSubCount = Number( _cidcounts[_i].childNodes[0].nodeValue );
			_cIndex = window.gSubsSI.indexOf(_curSubID);
			window.gSubs[_cIndex][window.gcSUB_COUNTS] = _curSubCount;
		}
		formatArticleMenu();
	}
}

/* UNSYNCH'ED */

function getStructure( pShowEmpty, pShowAll ) {
	
	var _qString = "php/structure.php?usrID=" + window.gUsrID + "&showEmpty=" + pShowEmpty + "&showAll=" + pShowAll;
	asyncQuery( _qString, false, asGetStrucSuccess, asGetStrucFailure);
}

function displaySubs() {
	
	resetAlerts();
	var _qString = "php/misc.php?func=DISP&usrID=" + window.gUsrID + "&grpID=" + window.gGrpID + "&subID=" + window.gSubID + "&itemStatus=" 
		+ window.gStatus + "&itemOrder=" + window.gFeedOrder + "&format=" + window.gFormat;
	asyncQuery( _qString, false, asDisplaySuccess, asDisplayFailure);
}

function updateSubs(){
	
	var _qString = "";
	var _subID;
	
	/* LOOP THROUGH ALL gSubs[] ELEMENTS KICKING OFF UPDATE MECHANISM */
	for ( var _i = 0; _i < window.gSubs.length; _i++ ) {
		
		_subID = window.gSubs[_i][window.gcSUB_ID];
		_qString = "php/process.php?usrID=" + window.gUsrID + "&subID=" + _subID;
		asyncQuery( _qString, true, asUpdateSuccess, asUpdateFailure );
	}
}

function doBulkDelete() {

	/* USES gBulkDeleteDays DAYS TO CALC WHICH READ ITEMS TO DELETE  */
	var _qString = "php/bulkdelete.php?func=DEL&usrID=" + window.gUsrID + "&subID=0&numDays=" + window.gBulkDeleteDays;
	asyncQuery( _qString, false, asBulkDeleteSuccess, asBulkDeleteFailure );
}

/* UNSYNCH'ED CALLBACKS */

function asGetStrucSuccess( prHTML ){ if ( prHTML !== "" ) makeArticleMenu( prHTML ); }

function asGetStrucFailure( prXML) { alert("You fucked up!"); }

function asBulkDeleteSuccess( prXML ){}

function asBulkDeleteFailure( prXML ){}

function asDisplaySuccess( prHTML ){
	
	var _ofw = document.getElementById("feed-data-wrapper");
	_ofw.className = "content-hidden";
	resetArticleDisplay();
	
	/* WE HAVE DATA */
	if ( prHTML !== "" ) {
		
		_ofw.innerHTML = prHTML;
		
		window.gCurrentItemCount = getCurrentCount();
		formatArticleDates();
	}
	else {
		
		displayNoItemHTML();
		window.gCurrentItemCount = 0;
	}
	
	setItemCountText();
	_ofw.scrollIntoView( true );
	_ofw.className = "content-visible";
	getStats();
}

function asDisplayFailure( prXML) {

	/* DEBUG ONLY */
	console.log( "ERROR: Unable to fetch data for display.");
	
	document.getElementById("feed-data-wrapper").innerHTML =  '<div class="noItemWrapper"><p class="noItem">There has been an error!</p><p>The connection to your feed database has been lost, <br />please check your internet connection and try again.</p></div>';
}

function asUpdateSuccess( prXML ){
	
	var _cSTATUS_GOOD = "Good", _cSTATUS_BAD = "Bad"; // look at this ??????????
	
	if ( prXML == null ) {
		
		window.gUpdateCount++;
		/* DEBUG ONLY */
		console.log( "ERROR: Timeout exceeded whilst requesting feed data.");
	}
	else {
	
		/* GRAB DATA FEED BACK FROM process.php */
		var _subID = prXML.getElementsByTagName("sub_id")[0].childNodes[0].nodeValue;
		var _subStatus = prXML.getElementsByTagName("sub_status")[0].childNodes[0].nodeValue;
		var _subCount = Number( prXML.getElementsByTagName("sub_item_count")[0].childNodes[0].nodeValue );
		var _subError = prXML.getElementsByTagName("error_msg")[0].childNodes[0].nodeValue;
		var _subItemCount = 0;
		/* INCREMENT COUNT OF UPDATES IN THIS RUN */ 
		window.gUpdateCount++;
		/* DEBUG ONLY */
		//console.log("UPDATE - SubID:"+_subID +", UpdateCount:" +window.gUpdateCount + "/" + window.gUpdateMax + " , Status:" + _subStatus + ", Records:" + _subCount + ", Error Message: "+ _subError );	
		
		if ( _subStatus == _cSTATUS_GOOD ) {
			
			/* DATA USED FOR COUNTING NUMBER OF ARTICLES ADDED */
			editSubsArrayBySubID( window.gcSUB_NEWNUM_T, _subID, _subCount );
			/* SET STRUCTURE UPDATESTATUS_T AS GOOD */
			editSubsArrayBySubID( window.gcSUB_UPDATESTATUS_T, _subID, 1);
		}
	}	
	/* IF ALL SUBS HAVE REQUESTED DATA AND RECEIVED AN ANSWER */
	if ( window.gUpdateCount == window.gUpdateMax ) mergeWrapper();	
}

function asUpdateFailure( prXML ) {
	
	window.gUpdateCount++;
	/* DEBUG ONLY */
	console.log("ERROR: Unable to access Feed.");
	if ( window.gUpdateCount == window.gUpdateMax) mergeWrapper(); 
}

/* OTHERS */

function selectMenuOption( pOptObj ) {
	
	var _oName = pOptObj.id;
	var _sType = _oName.substr( 0, _oName.indexOf( "_" ) );
	var _newValue = Number( _oName.match(/\d+$/)[0] );
	var _doUpdate = false;
		
	switch ( _sType ) {
	
		case "status":
		
			if ( _newValue != window.gStatus ){
				window.gStatus = _newValue;
				document.getElementById("btn-status").innerHTML = window.gStatusMnuItems[_newValue];
				window.gFormat = window.gDefaultFormats[_newValue];
				selectDefaultFunction();
				_doUpdate = true;
			}
			break;
	
		case "func":
		
			document.getElementById("btn-func").innerHTML = window.gFuncMnuItems[_newValue];
			window.gFunction = _newValue;
			hideSelect( _sType );
			break;
	}
	if ( _doUpdate ) {
		
		hideSelect( _sType );
		displaySubs();
		displayDefaultButton();
	}
}

function selectDefaultFunction() {
	
	switch ( window.gStatus ){
		case window.gcSTATUS_UNREAD:
		case window.gcSTATUS_BOOKMARKED:
			document.getElementById("btn-func").innerHTML = window.gFuncMnuItems[window.gcFUNC_MAAR];
			window.gFunction = window.gcFUNC_MAAR;
			break;
		case window.gcSTATUS_READ:
			document.getElementById("btn-func").innerHTML = window.gFuncMnuItems[window.gcFUNC_MAAU];
			window.gFunction = window.gcFUNC_MAAU;
			break;
	}
}

function doFunction() {
	
	if ( window.gGrpID == 0 && window.gSubID == 0 )	if ( confirm("You have all items selected, are you sure you want to go ahead?") == false ) return;
	
	switch ( window.gFunction ) {
		
		case window.gcFUNC_MAAR :
			bulkUpdateStatus( gcSTATUS_READ );
			break;
		case window.gcFUNC_BA:
			bulkUpdateStatus( gcSTATUS_BOOKMARKED );
			break;
		case window.gcFUNC_MAAU:
			bulkUpdateStatus( gcSTATUS_UNREAD );
			break;
	} 
}

function makeArticleMenu( pMenuHTML ) {
	
	
	/* MAKE ARTICLE SELECTION MENU AND ATTACH EVENTS */
	var _oOuterMenu = document.getElementById( "item-drop-down-o");
	var _oPadDiv = createNewElement( 'div', _oOuterMenu, 'item-ddpa', 'drop-down-pad-a', '');
	var _oPadDiv = createNewElement( 'div', _oOuterMenu, 'item-ddpb', 'drop-down-pad-b', '');
	var _mnu = createNewElement( 'div', _oOuterMenu, 'item-drop-down', 'drop-down-inner', '');
	_mnu.innerHTML = pMenuHTML;
	attachGroupEvents();
}

function attachGroupEvents() {
	
	var _eXDivs = document.getElementsByClassName('xpand');
	for ( var _i = 0; _i < _eXDivs.length; _i++ ) _eXDivs[_i].onclick = function() { eXpand( this ); }; 
	var _eSubItems = document.getElementsByClassName("s-item");
	for ( var _i = 0; _i < _eSubItems.length; _i++ ) _eSubItems[_i].onclick = function() { selectArticles( this ); };
	var _eGrpItems = document.getElementsByClassName("grp");
	for ( var _i = 0; _i < _eGrpItems.length; _i++ ) _eGrpItems[_i].onclick = function() { selectArticles( this ); }; 
}

function newDataInView() {
	
	/* NB. THIS ROUTINE IS ONLY CALLED WHEN WE ALREADY KNOW THAT NEW ITEMS HAVE BEEN FOUND & ADDED */
	var _cIndex = 0;
	
	if ( window.gStatus == window.gcSTATUS_READ || window.gStatus == window.gcSTATUS_BOOKMARKED ) return false;
	if ( window.gSubID == 0 && window.gGrpID == 0 ) return true;
	
	if ( window.gSubID != 0 ) {
		
		_cIndex = window.gSubs.indexOf( window.gSubID );
		if ( Number(window.gSubs[_cIndex][window.gcSUB_NEWNUM_T]) > 0 ) return true;	
		else return false;
	}
	else {
		
		/* MAKE LIST OF SUBS IN SELECTED GRP */
		var _grpSubsContainer = document.getElementById( "gci_" + window.gGrpID );
		var _subsInGroup = _grpSubsContainer.getElementsByClassName("s-item");
		var _subsStr = "";	
		 
		for ( var _i = 0; _i < _subsInGroup.length; _i++ ) _subsStr +=  "-" + _subsInGroup[_i].id.match(/\d+$/)[0];
		_subsStr += "-";

		/* ARE THERE ANY SUBS WITH NEW ITEMS THAT ARE IN THE CONSTRUCTED SUB LIST */
		for ( var _i = 0; _i < window.gSubs.length; _i++ ) {
			
			if ( Number(window.gSubs[_i][window.gcSUB_NEWNUM_T]) > 0 ) {
					
				_strSubId = "-" + window.gSubs[_i][window.gcSUB_ID].toString() + "-";
				if ( _subsStr.indexOf( _strSubId ) != -1 ) return true;
			}
		}
		return false;
	}
}

function slo( pArtURL, pItemID, pSubID ){
	
	/* SIDE LOAD ARTICLE */
	var newWindow = window.open( pArtURL, "_blank" );
	ftl( pItemID, pSubID );
}

function ftl( pItemID, pSubID ){
	
	/* FOLLOW TITLE LINK */
	if ( window.gMarkReadOnVisit ) {	
	
		removeArticle( pItemID, pSubID );
		editMasterItemStatus( pItemID, window.gcSTATUS_READ);
	}
	return true;
}

function msa( pArtID, pNewStatus, pSubID ) {

	/*MARK STATUS AS */
	removeArticle( pArtID, pSubID );
	editMasterItemStatus( pArtID, pNewStatus );
}

function removeArticle( pArtID, pSubID ) {

	deleteItem( "art_" + pArtID );	
	window.gCurrentItemCount--;
	setItemCountText();
	decrementCounts( pSubID );
	if ( window.gCurrentItemCount == 0 ) displayNoItemHTML();
}

function displayNoItemHTML() {

	// MORE TO COME HERE....	
	
	var _noDataHTML = '<div class="noItemWrapper"><p class="noItem">No items found!</p></div>';
	document.getElementById("feed-data-wrapper").innerHTML = _noDataHTML;
}

function decrementCounts( pSubID ) {
	
	var _sIndex = window.gSubsSI.indexOf( Number( pSubID ) ); 
	window.gSubs[_sIndex][window.gcSUB_COUNTS]--
	formatArticleMenu();
}

function selectDefault() {

	window.gSubID = 0; window.gGrpID = 0; window.gStatus = window.gcSTATUS_UNREAD; window.gOrder = 0;
	window.gFormat = gDefaultFormats[window.gStatus];
	document.getElementById("btn-item").innerHTML = window.gDefaultArticleText;
	document.getElementById("btn-status").innerHTML = window.gDefaultStatusText;
	displaySubs();
	displayDefaultButton();
}

function showUpdateErrorsAlert(){
	
	/* THIS IS TEMPORARY */
	var _tError = "WARNING:\n\nThe last update process produced some errors. The following feeds were not updated:\n\n";
				 
	for ( var _i = 0; _i < window.gSubs.length; _i++ ) {
		
		if ( window.gSubs[_i][window.gcSUB_UPDATESTATUS_T] != 1 ){
			
			_tError += window.gSubs[_i][window.gcSUB_NAME] + "\n";
		}
	}
	_tError += "\nFeeds do fail occasionally, this is usually not a problem. However, if a feed is consistently failing then you might want to go to the 'Organise' page and check the feed's validity.\n"
	alert(_tError);
}

function selectArticles( pObj ){
	
	var _cGROUP = "g"; var _cSUB = "s";
	var _newID = Number( pObj.id.match(/\d+$/)[0] );
	var _sType = pObj.id.charAt(0);
	var _bArticle = document.getElementById("btn-item");
	
	switch ( _sType ) {
		
		case _cGROUP:
			window.gSubID = 0; window.gGrpID = _newID;
			if ( _newID == 0 ) _bArticle.innerHTML = window.gDefaultArticleText;
			else _bArticle.innerHTML = document.getElementById("grpt_" + _newID).innerHTML; 
			break;
		
		case _cSUB:
			window.gSubID = _newID; window.gGrpID = 0;
			_bArticle.innerHTML = document.getElementById("subt_" + _newID).innerHTML;
			break;
	}
	hideSelect("item");
	displaySubs();
	displayDefaultButton();
}

function editSubsArrayBySubID( pSIndex, pSubID, pNewValue) {
	
	var _sIndex = window.gSubsSI.indexOf( Number( pSubID ) );
	window.gSubs[_sIndex][pSIndex] = pNewValue;
}

function resetAlerts() {

	document.getElementById("btn-refresh").className = "btn btn-normal";
	document.title = window.gDefaultPageTitle;
}

function resetSubsArrayField( pSIndex, pNewValue ) { for ( var _i = 0; _i < window.gSubs.length; _i++ ) window.gSubs[_i][pSIndex] = pNewValue; }

function formatArticleDates() {
	
	/* DOESN'T WORK IN FIREFOX !!! 
	
	var itemDateArray = document.getElementsByClassName("itemDate");
	var itemDate;
	
	for ( var i = 0; i < itemDateArray.length; i++ ) {
		
		itemDate = new Date(itemDateArray[i].innerHTML);
		itemDateArray[i].innerHTML = "Published: " + itemDate.toLocaleDateString() + " " + itemDate.toLocaleTimeString();
	}
	
	*/
	//use getTimezoneOffset() to get the diff in minutes between UTC and local
}


function formatArticleMenu() {

	var _total = 0;
	
	for ( var _i = 0; _i < window.gSubs.length; _i++ ) {
		
		formatArticleSubMenuItem( window.gSubs[_i][window.gcSUB_ID], window.gSubs[_i][window.gcSUB_COUNTS] );
		_total += Number( window.gSubs[_i][window.gcSUB_COUNTS] );
	}
	formatArticleMenuTotal( _total );
	resetGrpFormats();
	makeGroupCounts();
}

function makeGroupCounts() {
	
	/* LOOP THRU' SUBS ARRAY */
	for ( var _i = 0; _i < window.gSubs.length; _i++ ) {
		
		var _subId = window.gSubs[_i][window.gcSUB_ID];
		var _subCount = Number( window.gSubs[_i][window.gcSUB_COUNTS] );
	
		/* IF COUNT IS NON-ZERO THEN PROCESS */
		if (  _subCount > 0 ) {
			
			/* GET THE SUBS CONTAINER DIV */
			var _subContainer = document.getElementById( "sub_" + _subId )
			_parentName = _subContainer.parentNode.parentNode.id;
			
			/* IF SUBS CONTAINER DIV IS NOT THE OUTER LAYER THEN PROCESS */
			if ( _parentName != "item-drop-down" ) {
				
				var _grpId = document.getElementById("sub_" + _subId).parentNode.id.match(/\d+$/)[0];
				
				while ( _parentName != "item-drop-down-o" ) {
					
					formatArticleGrpMenuItem( _grpId, _subCount );
					_grpId = document.getElementById("grp_" + _grpId).parentNode.parentNode.id.match(/\d+$/)[0];
					_parentName = document.getElementById("grp_" + _grpId).parentNode.parentNode.id;
				}
			}
		}
	}
}

function resetGrpFormats() {

	var _grps = document.getElementsByClassName("g-item");
	
	for ( var _i = 0; _i < _grps.length; _i++ ) {
			
   		var _grpId =  _grps[_i].id.match(/\d+$/)[0] ;
   		document.getElementById( "grpt_" + _grpId ).className = "grp";
		document.getElementById( "grpn_" + _grpId ).innerHTML = ""
		document.getElementById( "grpn_" + _grpId ).className = "grp-num";
	}
}

function formatArticleSubMenuItem( pId, pCount ){
	
	var _suffix = ""; var _countStr = ""; 
	var _iconName = window.gMnuIconOff;
		 
	if ( pCount > 0 ) {
		 
		_suffix = "-w";
		_countStr = pCount.toString();
		_iconName = window.gMnuIconOn;
	}
	document.getElementById( "subi_" + pId).src = _iconName;
	document.getElementById( "subt_" + pId ).className = "sub" + _suffix;
	document.getElementById( "subn_" + pId ).innerHTML = _countStr;
	document.getElementById( "subn_" + pId ).className = "sub-num" + _suffix;
}

function formatArticleMenuTotal( pCount ){
	
	var _topLevelNum = document.getElementById( "grpn_0" );
	var _topLevelText = document.getElementById( "grpt_0" );
	
	if ( pCount == 0 ){
		_topLevelText.className = "grp";
		_topLevelNum.className = "grp-num";
		_topLevelNum.innerHTML = "";
	}
	else {
		_topLevelText.className = "grp-w";
		_topLevelNum.className = "grp-num-w";
		_topLevelNum.innerHTML = pCount.toString(); 
	}
}

function formatArticleGrpMenuItem( pId, pNewCount ){
	
	/* ONLY CALLED WHEN pNewCount IS NON ZERO */
	/* ITEMS ARE RESET IN resetGrpFormats() */
	
	var _countStr = ""; var _oldCount = 0; var _countSum = 0;
	var _grpNumElement = document.getElementById("grpn_" + pId );
	if ( _grpNumElement.innerHTML != "" ) _oldCount = Number( _grpNumElement.innerHTML );
	_countSum = _oldCount + pNewCount;
		
	if ( _oldCount == 0 ) {
		document.getElementById( "grpt_" + pId ).className = "grp-w";
		_grpNumElement.className = "grp-num-w";
	}
	_grpNumElement.innerHTML = _countSum.toString();
	
}

function getCurrentCount() {
	
	if ( window.gStatus == gcSTATUS_READ ) {
			
		var _rows = document.getElementById("t-read").getElementsByTagName("tr");
		_count = _rows.length;	
	}
	else {
		
		var _ofw = document.getElementById("feed-data-wrapper");
		_count = _ofw.childNodes.length - 1;
	}
	return _count;
}

function resetArticleDisplay () {

	var _ofw = document.getElementById("feed-data-wrapper");
	while ( _ofw.hasChildNodes() == true ) _ofw.removeChild( _ofw.lastChild );
}

function displayDefaultButton() {
	
	if ( window.gStatus != 0 || window.gSubID != 0 || window.gGrpID != 0 ) {
	
		document.getElementById("btn-auto-up").className = "btn btn-slim";
	}	
	else {
	
		document.getElementById("btn-auto-up").className = "btn btn-slim btn-not-here";
	}
}

function setItemCountText() {
	
	switch ( window.gCurrentItemCount ) {
		case 0:
			document.getElementById("item-count-text").innerHTML = "[ Selected: No articles ]";
			break;
		case 1:
			document.getElementById("item-count-text").innerHTML = "[ Selected: <b>1</b> article ]";
			break;
		default:
			document.getElementById("item-count-text").innerHTML = "[ Selected: <b>"+ window.gCurrentItemCount +"</b> articles ]";
			break;
	}
}

function getNewItemCount() {
	
	/* GET ARTICLE COUNT FROM DATA CREATED IN asUpdateSuccess() STORED IN gSubs */
	var _itemCount = 0; 
	for ( var _i = 0; _i < window.gSubs.length; _i++ ) _itemCount += Number( window.gSubs[_i][window.gcSUB_NEWNUM_T]);	
	return _itemCount;		
}

function alertUser( pHasNewInCurrentView ) {
	
	if ( pHasNewInCurrentView ) document.getElementById("btn-refresh").className = "btn btn-refresh-needed";
	document.title = window.gDefaultPageTitle + " [!]";	
}

function attachEvents() {

	document.getElementById("btn-refresh").onclick = function(){ displaySubs(); }
	document.getElementById("btn-do-func").onclick = function(){ doFunction(); }
	document.getElementById("btn-auto-up").onclick = function(){ selectDefault(); }
	
	var _bv = document.getElementById("btn-status");
	_bv.onclick = function(){ showSelect('status'); }
	_bv.onmouseover = function(){ keepSelect('status'); }
	_bv.onmouseout = function(){ delayedHideSelect('status'); }
	
	var _bo = document.getElementById("btn-func");
	_bo.onclick = function(){ showSelect('func'); }
	_bo.onmouseover = function(){ keepSelect('func'); }
	_bo.onmouseout = function(){ delayedHideSelect('func'); }
	
	var _bi = document.getElementById("btn-item");
	_bi.onclick = function(){ showSelect('item'); }
	_bi.onmouseover = function(){ keepSelect('item'); }
	_bi.onmouseout = function(){ delayedHideSelect('item'); }
	
	var _vd = document.getElementById("status-drop-down-o");
	_vd.onmouseover = function(){ keepSelect('status'); }
	_vd.onmouseout = function(){ delayedHideSelect('status'); }
	
	var _vi = document.getElementById("item-drop-down-o");
	_vi.onmouseover = function(){ keepSelect('item'); }
	_vi.onmouseout = function(){ delayedHideSelect('item'); }
	
	var _vf = document.getElementById("func-drop-down-o");
	_vf.onmouseover = function(){ keepSelect('func'); }
	_vf.onmouseout = function(){ delayedHideSelect('func'); }
}

function showSelect( pMnuType ) {

	if ( pMnuType == "item" || pMnuType == "func" ) alignMenu( pMnuType );
	document.getElementById( "btn-s-" + pMnuType ).className = "btn btn-select btn-high";
	document.getElementById( pMnuType + "-drop-down-o" ).className = "drop-down-div";
	document.getElementById( "btn-" + pMnuType ).className = "btn btn-criteria-pressed";
}
function keepSelect( pMenuType ){ 
	
	switch (pMenuType){
		case "status": window.clearTimeout( window.gTimerStatusMenu ); break;
		case "item": window.clearTimeout( window.gTimerArticleMenu ); break;
		case "func": window.clearTimeout( window.gTimerFuncMenu ); break;
	}
}

function delayedHideSelect( pMenuType ) {
	
	switch (pMenuType){
		case "status": window.gTimerStatusMenu = window.setTimeout( "hideSelect('status');", 500 ); break;
		case "item": window.gTimerArticleMenu =  window.setTimeout( "hideSelect('item');", 500 ); break;
		case "func": window.gTimerFuncMenu = window.setTimeout( "hideSelect('func');", 500 ); break;
	}
}

function hideSelect( pMenuType ) {

	document.getElementById( "btn-s-" + pMenuType ).className = "btn btn-select";
	document.getElementById( "btn-" + pMenuType ).className = "btn btn-criteria";
	document.getElementById( pMenuType + "-drop-down-o" ).className = "drop-down-div-closed";
}

function mtt( pObj ){ 
	
	_artID = Number( pObj.id.match(/\d+$/)[0] );
	document.getElementById("art_" + _artID).scrollIntoView( true ); 

}

function sip( pArtID ) { 
	
	document.getElementById( "cog_" + pArtID.toString()).className = "cog-o-on";
	document.getElementById( "mtt_" + pArtID.toString()).className = "i-e-on"; 
}

function hip( pArtID ) { 
	
	document.getElementById( "cog_" + pArtID.toString()).className = "cog-o-off";
	document.getElementById( "mtt_" + pArtID.toString()).className = "i-e-off";
}

function sopt( pObj ){
	
	/* MAKE POP-UP MENU FOR ARTICLE */
	var _DefaultStatusChange, _OtherStatusChange;
	var _TitleClass, _ItemClass, _MenuClass;
	
	var _StatusText = new Array();
		_StatusText[0] = new Array(",0,", "Mark as Unread");
		_StatusText[1] = new Array(",1,", "Mark as Read");
		_StatusText[2] = new Array(",2,", "Bookmark");
	var _strHTML = ""; var _strExtraOptions = ""; var _URL = "";
	
	var _mnu = document.getElementById("optionMenu");
	var _newSubID = Number( pObj.id.match(/\d+$/)[0] );
	var _newArtID = Number( pObj.parentNode.id.match(/\d+$/)[0] );
	
	// have a look at this ??????????????????????????????????????????????
	//var _art = document.getElementById("art_" + _newArtID);
	//_art.className = "i-w-high";
	var _srcX = getPos( pObj ).left;
	var _srcY = getPos( pObj ).top;
	
	switch ( window.gStatus ) {
			
		case window.gcSTATUS_UNREAD:
			_DefaultStatusChange = window.gcSTATUS_READ; _OtherStatusChange = window.gcSTATUS_BOOKMARKED;
			break;
		case window.gcSTATUS_READ:
			_DefaultStatusChange = window.gcSTATUS_UNREAD; _OtherStatusChange = window.gcSTATUS_BOOKMARKED;
			break;
		case window.gcSTATUS_BOOKMARKED:
			_DefaultStatusChange = window.gcSTATUS_READ; _OtherStatusChange = window.gcSTATUS_UNREAD;
		break;
	}
	
	switch ( window.gFormat ) {
	
		case 0:
	
			_TitleClass = "o-mnu-t";
			_ItemClass = "o-mnu-i";
			_MenuClass = "o-mnu-on";
			_mnu.style.left = _srcX + "px";
			_mnu.style.top =  _srcY + "px";
			/* CONSTRUCT EXTRA OPTIONS */
			_URL = "'" + document.getElementById( "ml_" + _newArtID ).href + "'";
			_strExtraOptions += '<div class="' + _ItemClass + '" onclick="slo(' + _URL + ',' + _newArtID + ',' + _newSubID + ');hideSopt();">Go to Article</div>';
			break;
			
		case 1:
		
			_TitleClass = "o-mnu-g-t";
			_ItemClass = "o-mnu-g-i";
			_MenuClass = "o-mnu-g-on";
			_mnu.style.left = ( _srcX - 193 ) + "px";
			_mnu.style.top =  ( _srcY  ) + "px";
			break;
	}
	_strHTML += '<div class="' + _TitleClass + '" onclick="msa(' + _newArtID + _StatusText[_DefaultStatusChange][0] + _newSubID + ');hideSopt();">Options</div>';
	_strHTML += '<div class="' + _ItemClass + '" default" onclick="msa(' + _newArtID + _StatusText[_DefaultStatusChange][0] + _newSubID + ');hideSopt();">' + _StatusText[_DefaultStatusChange][1] + '</div>';
	_strHTML += '<div class="' + _ItemClass + '" onclick="msa(' + _newArtID + _StatusText[_OtherStatusChange][0] + _newSubID + ');hideSopt();">' + _StatusText[_OtherStatusChange][1] + '</div>';
	_strHTML += _strExtraOptions;
	_mnu.innerHTML = _strHTML;
	_mnu.className = _MenuClass;
}

function keepSopt(){ window.clearTimeout( window.gTimerPopup ); }
function delayedHideSopt() { window.gTimerPopup = window.setTimeout( "hideSopt();", 500 )}

function hideSopt(){ 
	//var _art = document.getElementById("art_" + _newArtID);
	//_art.className = "i-w";
	
	document.getElementById("optionMenu").innerHTML = "";
	document.getElementById("optionMenu").className = "o-mnu-off";
}
