/* 	Geoff Lush - October 2012+ */

/* VARIABLES */
	
	/* TO BE PASSED FROM LOGIN */
	var gUsrID=1;
	var gBulkDeleteDays=3;
	
	/* VIEW SELECTION */ 
	var gViewType=0;
	var gSubID=0;
	var gGrpID=0;
	
	
	/* CONSTANTS */
	var gcIDTYPE_GRP = 0, gcIDTYPE_SUB = 1;
	
	/* VIEW MENU ARRAY */
	var gViewMnuItems = new  Array("Unread", "Read", "Bookmarked");
	
	/* STRUCTURE ARRAY */
	var gStructure = [];					// HOLDS ALL GRP/SUB DATA
	
	/* gStructure Offset Reference 
	 * Group ID 					0
	 * Group Name 					1
	 * Sub ID						2
	 * Sub Name						3
	 * Sub Link						4
	 * Sub Last Updated				5
	 * Sub New Last Updated	(Temp)	6
	 * Sub New Articles (Temp)		7
	 * Sub Getminimal data			8
	 */
	
	/* VARIOUS GLOBALS */
	var gFirstRun = true;					// IS THIS THE FIRST UPDATE RUN
	var gTimerViewMenu;						// TIMER FOR VIEW SELECTION HIDE
	var gTimerItemMenu;						// TIMER FOR ARTICLE SELECTION HIDE
	var gCurrentItemCount=0;				// NO OF ARTICLES DISPLAYED
	var gUpdateCount=0;						// COUNT OF UPDATES FOUND IN CURRENT PROCESSING RUN
	var gUpdateMax=0;						// SET TO NUMBER OF SUBS
	var gbadData = new Array();				// HOLDS DETAILS ON WHICH FEEDS HAVE FAILED - TO DO !!!
	
	/* DEFAULTS */
	var gDefaultUpdateStatus = "Waiting";
	var gDefaultViewText = "Unread";
	var gDefaultArticleText = "All Articles";
	var gDefaultPageTitle="NET.Feed";
	
	/* NO DATA DISPLAY */
	var gNoDataHTML = '<div class="noItemWrapper"><p class="noItem">No items found!</p></div>';
	
	/* DEBUG VARIABLES */
	var ph;	

/* FUNCTIONS */ 

/* MAIN - THE MOST IMPORTANT STUFF */

function pageSetup() {
	
	//gUsrID = Number(window.prompt("Enter User ID:",1));
	makeStructureArray();
	makeArticleMenu();
	makeViewMenu();
	attachEvents();
	/* SET THE UPDATE MECHANISM TO RUN EVERY TEN MINS */
	var interval = self.setInterval(function(){ updateWrapper() }, 600000);
	/* POP SCREEN */
	displaySubs();
	setUpdateStatusMessage(gDefaultUpdateStatus);
	/* DELAY FIRST UPDATE 2 SECS */
	doBulkDelete();
	window.setTimeout('updateWrapper();', 2000);
}

function updateWrapper() {

	/* KICK OFF UPDATE MECHANISM */
	initUpdateStatusMessage();
	setUpdateStatusMessage("Requesting subscription updates");
	/* GET NUMBER OF SUBSCRIPTIONS TO CHECK */
	if (gUpdateMax==0) gUpdateMax=getUpdateMaxCount();
	/* RESET COUNT OF updates */
	gUpdateCount=0;
	
	/* DEBUG ONLY */
	ph = document.getElementById("debug-process-history");
	ph.innerHTML = "";
	
	/* RUN MAIN UPDATE PROCESS */
	updateSubs();
}

/* GENERIC ROUTINES TO QUERY PHP FILES */

function syncQuery(queryString, asXML) {
	
	var xhttp=new XMLHttpRequest();
	
	xhttp.open("GET", queryString, false);
	xhttp.send();
	if (asXML==true) {
		return xhttp.responseXML;
	} 
	else {
		return xhttp.responseText;
	}
}

asyncQuery = function(queryString, asXML, cbSuccess, cbFailure){
	
	var cNOT_INITIALISED=0, cCONN_ESTABLISHED=1, cQUERY_RECIEVED=2, cPROCESSING_QUERY=3, cFINISHED=4;
	var cOK=200, cFILE_NOT_FOUND=404; 
		
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange=function() {
		
		if (xmlhttp.readyState==cFINISHED) {
			
			if (xmlhttp.status==cOK) {
			
				if (asXML==true) cbSuccess(xmlhttp.responseXML);
				else cbSuccess(xmlhttp.responseText);
			}
			else {
			
				if (asXML==true) cbFailure(xmlhttp.responseXML);
				else cbFailure(xmlhttp.responseText);
			}
		}
	}
	xmlhttp.open("GET", queryString, true);
	xmlhttp.send();
}

/* SPECIFIC PHP CALLS */

/* SYNCH'ED */

function doTest() {
	
	document.getElementById("feed-data-wrapper").innerHTML =  '<div class="noItemWrapper"><p class="noItem">There has been an error!</p><p class="noItem">The connection to your feed database has been lost, <br />please check your internet connection and try again.</p></div>';
	
}

function editMasterItemStatus(itemId, newStatus) {

	/* CHANGE STATUS FOR A PARTICULAR ARTICLE */
	var qString = "php/edit.php?usrID="+gUsrID+"&itemID="+itemId+"&newStatus="+newStatus;
	var response = syncQuery(qString, false);
}

function makeStructureArray () {
	
	/* CONSTRUCT THE ARRAY THAT HOLDS ALL GRP/SUB DATA */
	var qString = "php/misc.php?usrID="+gUsrID+"&func=STRUC&itemStatus=0&grpID=0&subID=0";
	var subsDataXML = syncQuery(qString, true);
	gStructure=[]; 

	if (subsDataXML!=null) {
	
		var	subsXML = subsDataXML.getElementsByTagName("sub");
		var sString="";
		
		for (var i=0; i < subsXML.length; i++) {
			
			sString = subsXML[i].childNodes[0].nodeValue;
			gStructure.push(sString.split("|"));
		}	
	}
}

function mergeSubs(){

	/* MERGE ALL SUB DATA TO THE MASTER  VIA merge.php */	
	var mergeFeedbackXML = syncQuery("php/merge.php?usrID="+gUsrID, true);
	var rVal = false;
	
	if (mergeFeedbackXML!=null) {

		byteCount = Number(mergeFeedbackXML.getElementsByTagName("bytes")[0].childNodes[0].nodeValue);
		
		if (byteCount>0) {
		
			/* DEBUG ONLY */
			ph.innerHTML += "<p>New Master Size: "+byteCount + " bytes.</p>";
			
			rVal=true;
		}
	}
	return rVal;
}

function bulkUpdateStatus(newStatus) {
	
	/* NEEDS WORK */
	var qString="php/bulkedit.php?usrID="+gUsrID+"&subID="+gSubID+"&grpID="+gGrpID+"&cStatus="+gViewType+"&nStatus="+newStatus;
	syncQuery(qString, false);
	resetArticleDisplay();
	showNoItems();
	getStats();
}

function getStats() {
	
	resetItemSelectionClassNames();
	
	var qString = "php/misc.php?usrID="+gUsrID+"&func=STATS&itemStatus="+gViewType+"&grpID=0&subID=0";
	var statXML = syncQuery(qString, true);

	if (statXML!=null) {
	
		var cids = statXML.getElementsByTagName("cid");
		var cidcounts = statXML.getElementsByTagName("cidcount");
		
		for (var i=0; i < cids.length; i++) {
			
			document.getElementById("subln_"+cids[i].childNodes[0].nodeValue).innerHTML = cidcounts[i].childNodes[0].nodeValue;
		}
	}
}


/* UNSYNCH'ED */

function displaySubs() {
	
	/* RESET NEW ARTICLE TELLS */
	document.getElementById("btnRefresh").className = "btn bNormal";
	document.title = gDefaultPageTitle;
	
	var qString="php/misc.php?func=DISP&usrID="+gUsrID+"&grpID="+gGrpID+ "&subID="+gSubID+"&itemStatus="+gViewType;
	asyncQuery(qString, false, asDisplaySuccess, asDisplayFailure);
}

function updateSubs(){
	
	var qString="";
	var subID, subURL, subDate, subGrpId;
	
	/* LOOP THROUGH ALL gStructure[] ELEMENTS EXTRACTING DATA NEEDED FOR UPDATE */
	for (var i=0; i < gStructure.length; i++) {
		
		subID = gStructure[i][2]; subURL = gStructure[i][4];
		subDate = gStructure[i][5]; subGrpId = gStructure[i][0];
		subMinimal = gStructure[i][8]; subFeedName = escape(gStructure[i][3]);
		qString="php/process.php?usrID="+gUsrID+"&subID="+subID+"&subURL="+subURL+"&subDate="+subDate+"&subGrpId="+subGrpId+"&subFeedName="+subFeedName+"&subMinimal="+subMinimal ;
		asyncQuery(qString, true, asUpdateSuccess, asUpdateFailure);
	}
}

function doBulkDelete() {

	/* SET TO 3 DAYS ATM */
	var qString="php/bulkdelete.php?func=DEL&usrID="+gUsrID+"&subID=0&numDays="+gBulkDeleteDays;
	asyncQuery(qString, false, asBulkDeleteSuccess, asBulkDeleteFailure);
}

/* UNSYNCH'ED CALLBACKS */

function asBulkDeleteSuccess(respXML){}

function asBulkDeleteFailure(respXML){
	
	/* DEBUG ONLY */
	ph.innerHTML += "<p>ERROR: Unable to delete data from master file.</p>";
}

function asDisplaySuccess(respHTML){
	
	var ofw =document.getElementById("feed-data-wrapper");
	
	ofw.className="content-hidden";
	resetArticleDisplay();
	
	/* WE HAVE DATA */
	if (respHTML!=="") {
		
		ofw.innerHTML = respHTML;
		gCurrentItemCount=ofw.childNodes.length-1;
		formatArticleDates();
	}
	else {
		
		showNoItems();
		gCurrentItemCount=0;
	}
	
	setItemCountText();
	ofw.scrollIntoView(true);
	ofw.className="content-visible";
	getStats();
}

function asDisplayFailure(respXML) {

	/* DEBUG ONLY */
	ph.innerHTML += "<p>ERROR: Unable to fetch data for display.</p>";
	
	document.getElementById("feed-data-wrapper").innerHTML =  '<div class="noItemWrapper"><p class="noItem">There has been an error!</p><p>The connection to your feed database has been lost, <br />please check your internet connection and try again.</p></div>';
}

function asUpdateSuccess(respXML){
	
	var cSTATUS_GOOD="Good", cSTATUS_BAD="Bad";
	
	if (respXML==null) {
		
		/* ADD ERROR COLLECTION */
		gUpdateCount++;
		ph.innerHTML += "<p>ERROR: Timeout exceeded whilst requesting feed data.</p>";
	}
	else {
	
		/* GRAB DATA FEED BACK FROM process.php */
		var subID = respXML.getElementsByTagName("sub_id")[0].childNodes[0].nodeValue;
		var subStatus = respXML.getElementsByTagName("sub_status")[0].childNodes[0].nodeValue;
		var subCount = Number(respXML.getElementsByTagName("sub_item_count")[0].childNodes[0].nodeValue);
		var subError = respXML.getElementsByTagName("error_msg")[0].childNodes[0].nodeValue;
		var subLADate = respXML.getElementsByTagName("sub_update")[0].childNodes[0].nodeValue;
		var subItemCount=0;
		
		/* INCREMENT COUNT OF UPDATES IN THIS RUN */ 
		gUpdateCount++;
		
		/* DEBUG ONLY */
		ph.innerHTML += "<p>UPDATE - SubID:"+subID +", UpdateCount:" +gUpdateCount + "/" + gUpdateMax + " , Status:" + subStatus + ", Records:" + subCount + ", Error Message: "+ subError +"</p>";	
		
		if (subStatus==cSTATUS_GOOD) {
			
			/* DATA USED FOR COUNTING NUMBER OF ARTICLES ADDED */
			editCount(subID, subCount);
			
			/* LAST UPDATED DATE */
			if (subCount!=0)  {
				
				editLastUpdated(subID, subLADate); 
			}
		}
		else {
			
			/* WHAT SHOULD I DO HERE */
			
			/* add to an array a list of feeds that did not run !
			 * and show user some how
			 */
		}
	}	
	/* IF ALL SUBS HAVE REQUESTED DATA AND RECEIVED AN ANSWER */
	if (gUpdateCount==gUpdateMax) {
		
		mergeWrapper();
	}	
}

function asUpdateFailure(respXML) {
	
	gUpdateCount++;
	/* DEBUG ONLY */
	ph.innerHTML += "<p>ERROR: Unable to access Feed.</p>";
	
	if(respXML!=null) {
	
		/* DEBUG ONLY */
		ph.innerHTML += "<p>Attached Error:</p>";
		ph.innerHTML += "<p>"+ respXML + "</p>";
	}
	
	if (gUpdateCount==gUpdateMax) {
		
		mergeWrapper();
	}
}

/* OTHERS */

function mergeWrapper() {
	
	var subItemCount=0
	
	/* RESET COUNTER FOR NEXT RUN THROUGH */
	gUpdateCount=0;
	/* CALC NUMBER OF ARTICLES ADDED FROM gStructure[] */
	subItemCount = getNewItemCount();
	
	/* DEBUG ONLY */
	ph.innerHTML += "<p>New ItemCount = "+ subItemCount +"</p>";
		
	/* IF NO NEW ARTICLES */
	if (subItemCount==0) {
		
		setUpdateStatusMessage("No new Articles");
	}
	/* YAY DATA! */
	else {
		
		/* THIS NEEDS ATTENTION */
		setUpdateStatusMessage("Updating Articles list");
		/* DEBUG ONLY */
		ph.innerHTML += "<p>Merging subs</p>";
		
		/* KICK OFF MERGE */
		if (mergeSubs()==true) {
			
			updateStructureUpdates();
			setUpdateStatusMessage("Success - "+ subItemCount+ " new Article(s) available");
			
			/* POP PAGE WITH DATA IF THERE ARE NO ARTICLES SELECTED OR ON FIRST LOAD */
			/* OTHERWISE FIND A WAY TO TELL THE USER THAT NEW ITEMS ARE AVAILABLE */
			if (gCurrentItemCount==0 || gFirstRun==true) {
				
				sDefault();	
			}
			else {
				
				alertUser();
			}
		}
		else {
			/* MERGE FAILED */
			resetStructureUpdates();
			
			/* WHAT SHOULD I DO HERE ?
			 * add to an array a list of errors that did not run !
			 * and show user some how */
		}			
	}
	/* RESET ARTICLE COUNT DATA */
	resetNewItemCounts();
	gFirstRun = false;
	window.setTimeout('defaultStatusUpdate();',10000);
			
}

function makeViewMenu() {
	
	var mnu=document.getElementById("view-drop-down");
	
	for (var i=0; i < gViewMnuItems.length; i++) {
		
		var newViewDiv = createNewDiv(mnu,'vItem_'+i,'drop-item', gViewMnuItems[i]);
		newViewDiv.onclick = function() {vSelect(this);};
	}
}

function makeArticleMenu() {
	
	var mnu=document.getElementById("item-drop-down");
	var groupName="";
	
	var newArticleDiv = createNewDiv(mnu,'grp_0','drop-item', gDefaultArticleText);
	newArticleDiv.onclick = function() {sAllArticles()};
	
	for (var i=0; i < gStructure.length; i++) {
	
		if (gStructure[i][1] != groupName) {
			
			/* MAKE GROUP DIV */
			var newArticleDiv = createNewDiv(mnu,'grp_'+gStructure[i][0],'drop-item', gStructure[i][1]);
			newArticleDiv.onclick = function() { gSelect(this)};
		}
		/* MAKE SUB DIV */
		var newArticleDiv = createNewDiv(mnu,'subw_'+gStructure[i][2],'drop-item', '');
		newArticleDiv.onclick = function() { sSelect(this)};
		var newArticleSub = createNewDiv(newArticleDiv, 'sub_'+gStructure[i][2], 'sub', gStructure[i][3]);
		var newArticleSub = createNewDiv(newArticleDiv, 'subln_'+gStructure[i][2], 'list-num', '');
		groupName = gStructure[i][1];
	}
}

function createNewDiv(ndParentObj, ndId, ndClass, ndValue){
	
	/* ADD A NEW CHILD DIV TO A MENU DIV */
	var newDiv = document.createElement('div');
	newDiv.setAttribute('id', ndId);
	newDiv.setAttribute('class', ndClass);
	newDiv.innerHTML = ndValue;
	ndParentObj.appendChild(newDiv);
	return newDiv;
} 

/* TO BE MOVED AND ORGANISED*/

function markStatusAs(oArticle, newStatus, subID) {

	var artId = Number(oArticle.id.match(/\d+$/)[0]);
	removeArticle(artId, subID);
	editMasterItemStatus(artId, newStatus);
}

function removeArticle(aID, subID) {

	var oParent = document.getElementById("feed-data-wrapper");
	var cItem = document.getElementById("art_"+aID);
	
	gCurrentItemCount--;
	setItemCountText();
	oParent.removeChild(cItem);
	decrementMenuCount(subID);

	if (gCurrentItemCount==0) {
		showNoItems();	
	}
}

function showNoItems() {
	
	// MORE TO COME HERE....
	document.getElementById("feed-data-wrapper").innerHTML = gNoDataHTML;
}

function decrementMenuCount(subID) {
	
	/* WHERE CAN I GET SUB ID FROM ??? */
	var subCountDiv = document.getElementById("subln_"+subID);
	var cValue = Number(subCountDiv.innerHTML);
	if (cValue-1 == 0) {
		subCountDiv.innerHTML="";
	}
	else {
		subCountDiv.innerHTML=cValue-1;
	}
}


function sDefault() {

	gSubID=0; gGrpID=0; gViewType=0;
	document.getElementById("btnItem").innerHTML = gDefaultArticleText;
	document.getElementById("btnView").innerHTML = gDefaultViewText
	displaySubs();
	displayDefaultButton();
	
}

function sAllArticles() {
	
	if (gSubID!=0 || gGrpID!=0) {
		
		gSubID=0; gGrpID=0;
		document.getElementById("btnItem").innerHTML = gDefaultArticleText;
		hideSelect("ITEM");
		displaySubs();
		displayDefaultButton();
	}
}

function vSelect(vVal) {
	
	/* GET NEW VIEW TYPE FROM PASSED OBJECT'S ID */
	var newViewType= Number(vVal.id.match(/\d+$/)[0]);
	
	if (newViewType!=gViewType){
		
		gViewType=newViewType;
		document.getElementById("btnView").innerHTML = gViewMnuItems[newViewType];
		hideSelect("VIEW");
		displaySubs();
		displayDefaultButton();
	}
}

function gSelect(gVal) {
	
	/* GET NEW gGrpID FROM PASSED OBJECT'S ID */
	var newGroupId= Number(gVal.id.match(/\d+$/)[0]);
	
	if (newGroupId!=gGrpID){
		
		gGrpID=newGroupId;
		gSubID=0;
		document.getElementById("btnItem").innerHTML = getNameFromID(gcIDTYPE_GRP, newGroupId);
		hideSelect("ITEM");
		displaySubs();
		displayDefaultButton();
	}
}

function sSelect(gVal) {
	
	/* GET NEW gSubID FROM PASSED OBJECT'S ID */
	var newSubId= Number(gVal.id.match(/\d+$/)[0]);
	
	if (newSubId!=gSubID){
		
		gSubID=newSubId;
		gGrpID=0;
		document.getElementById("btnItem").innerHTML = getNameFromID(gcIDTYPE_SUB, newSubId);
		hideSelect("ITEM");
		displaySubs();
		displayDefaultButton();
	}
}

function editLastUpdated(subID, newDateTime) {
	
	/* ADD A NEW LAST UPDATED DATE TO A TEMP PART OF gStructure[] */
	
	for (var i=0; i < gStructure.length; i++) {
	
		if (Number(gStructure[i][2])==subID) {
			gStructure[i][6]=newDateTime;
			break;
		}	
	}
}

function editCount(subID, newCount) {
	
	/* ADD A NEW TEMP COUNT TO A TEMP PART OF gStructure[] */
	
	for (var i=0; i < gStructure.length; i++) {
	
		if (Number(gStructure[i][2])==subID) {
			gStructure[i][7]=Number(newCount);
			break;
		}	
	}
}

function updateStructureUpdates() {
	
	/* UPDATE ALL LAST UPDATED DATES WITH TEMP VALUES AND RESET TEMPS */
	
	for (var i=0; i < gStructure.length; i++) {
	
		if (gStructure[i][6]!="") {
			
			gStructure[i][5]=gStructure[i][6];
		}
		gStructure[i][6]="";
	}
}

function resetStructureUpdates() {
	
	/* DELETE ALL TEMP LAST UPDATE DATES */
	for (var i=0; i < gStructure.length; i++) {
	
		gStructure[i][6]="";
	}
}

function formatArticleDates() {
	
	var itemDateArray = document.getElementsByClassName("itemDate");
	var itemDate;
	
	for (var i=0; i < itemDateArray.length; i++) {
		
		itemDate = new Date(itemDateArray[i].innerHTML);
		itemDateArray[i].innerHTML = "Published: " + itemDate.toLocaleDateString() + " " + itemDate.toLocaleTimeString();
		
	}
	//use getTimezoneOffset() to get the diff in minutes between UTC and local
}

function getNameFromID(idType, idValue) {
	
	var cGRP_ID_INDEX = 0, cGRP_NAME_INDEX = 1;
	var cSUB_ID_INDEX = 2, cSUB_NAME_INDEX = 3;
	var idName="";
	
	if (idType==gcIDTYPE_GRP){
	
		for (var i=0; i < gStructure.length; i++) {
	
			if (Number(gStructure[i][cGRP_ID_INDEX])==idValue) {
				idName=gStructure[i][cGRP_NAME_INDEX];
				break;
			}	
		}
	}
	else {
		
		for (var i=0; i < gStructure.length; i++) {
	
			if (Number(gStructure[i][cSUB_ID_INDEX])==idValue) {
				idName=gStructure[i][cSUB_NAME_INDEX];
				break;
			}	
		}
	}
	return idName;
}

function resetItemSelectionClassNames() {

	/* RESET CONTENTS OF ALL'SUB' ITEMS FROM gStructure[] */
	for (var i=0; i < gStructure.length; i++) {
		
		document.getElementById("subln_"+gStructure[i][2]).innerHTML = '';
	}
}

function resetArticleDisplay () {

	/* RESET DISPLAY AREA */
	var ofw = document.getElementById("feed-data-wrapper");

	while (ofw.hasChildNodes()==true) {

		ofw.removeChild(ofw.lastChild);
	}
}

function displayDefaultButton() {
	
	var articleButton = document.getElementById("btnItem");
	var viewButton = document.getElementById("btnView");
	
	if (articleButton.innerHTML!=gDefaultArticleText || viewButton.innerHTML!=gDefaultViewText) {
	
		document.getElementById("btnAutoUp").className = "btn bSlim";
	}	
	else {
	
		document.getElementById("btnAutoUp").className = "btn bSlim bNotHere";
	}
}

function getUpdateMaxCount() {
	
	return gStructure.length;
}

function setItemCountText() {
	
	switch (gCurrentItemCount) {
		case 0:
			document.getElementById("item-count-text").innerHTML = "[ Selected: No Articles ]";
			break;
		case 1:
			document.getElementById("item-count-text").innerHTML = "[ Selected: <b>1</b> Article ]";
			break;
		default:
			document.getElementById("item-count-text").innerHTML = "[ Selected: <b>"+ gCurrentItemCount +"</b> Articles ]";
			break;
	}
}

function getNewItemCount() {
	
	/* GET ARTICLE COUNT FROM DATA CREATED IN asUpdateSuccess() STORED IN gStructure */
	var itemCount = 0; 
	for (var i=0; i < gStructure.length; i++) {
		
		itemCount+=Number(gStructure[i][7]);
	}	
	return itemCount;		
}

function resetNewItemCounts() {
	
	for (var i=0; i < gStructure.length; i++) {
		gStructure[i][7] = 0;
	}
}

function alertUser() {
	
	/* HEY YOU HAVE NEW ITEMS! */
	document.getElementById("btnRefresh").className = "btn bRefreshNeeded";
	document.title = gDefaultPageTitle + " [New]";	
}

function initUpdateStatusMessage() {
	
	document.getElementById("update-status-text").className = "footer-text-working";
}

function setUpdateStatusMessage(message) {
	
	document.getElementById("update-status-text").innerHTML="[ Update: "+message + " ]";
}

function attachEvents() {

	document.getElementById("btnRefresh").onclick = function(){displaySubs();}
	document.getElementById("btnUpdStatus").onclick = function(){bulkUpdateStatus(1);}
	document.getElementById("btnAutoUp").onclick = function(){sDefault();}
	
	var bv = document.getElementById("btnView");
	bv.onclick = function(){showSelect('VIEW');}
	bv.onmouseout = function(){delayedHideSelect('VIEW');}
	
	var bi = document.getElementById("btnItem");
	bi.onclick = function(){showSelect('ITEM');}
	bi.onmouseout = function(){delayedHideSelect('ITEM');}
	
	var vd = document.getElementById("view-drop-down");
	vd.onmouseover = function(){keepSelect('VIEW');}
	vd.onmouseout = function(){delayedHideSelect('VIEW');}
	
	var vi = document.getElementById("item-drop-down");
	vi.onmouseover = function(){keepSelect('ITEM');}
	vi.onmouseout = function(){delayedHideSelect('ITEM');}

}

function showSelect(selectType) {
	
	if (selectType=="VIEW") {
	
		document.getElementById("view-drop-down").className="drop-down-div";
		document.getElementById("btnView").className="btn bCriteria-Pressed";	
	}
	else {
		
		document.getElementById("item-drop-down").className="drop-down-div";	
		document.getElementById("btnItem").className="btn bCriteria-Pressed";	
	}
}

function delayedHideSelect(selectType) {
	
	if (selectType=="VIEW") {
	
		gTimerViewMenu = window.setTimeout("hideSelect('VIEW');",500);
	}
	else {
		
		gTimerItemMenu = window.setTimeout("hideSelect('ITEM');",500);
	}
}

function hideSelect(selectType) {

	if (selectType=="VIEW") {
		
		document.getElementById("view-drop-down").className="drop-down-div-closed";
		document.getElementById("btnView").className="btn bCriteria";
	}
	else {

		document.getElementById("item-drop-down").className="drop-down-div-closed"; 
		document.getElementById("btnItem").className="btn bCriteria";	
	}
}

function defaultStatusUpdate() {

	setUpdateStatusMessage(gDefaultUpdateStatus);
	document.getElementById("update-status-text").className = "footer-text";
}

function keepSelect(selectType){
	
	if (selectType=="VIEW") {
		
		window.clearTimeout(gTimerViewMenu);
	}
	else {
		
		window.clearTimeout(gTimerItemMenu);
	}
}