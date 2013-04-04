/* 	Geoff Lush - October 2012+ */

/* VARIABLES & CONSTANTS */
	
	/* TO BE PASSED FROM LOGIN */
	window.gUsrID 					= 1;
	window.gBulkDeleteDays 			= 3;
	window.gMarkReadOnVisit 		= true;
	
	/* MAIN */
	window.gSubs	 				= [];
	window.gSubsSI	 				= [];
	window.gGroups	 				= [];
		
	/* gSubs[] OFFSETS */ 
	window.gcSUB_ID 				= 0;
	window.gcSUB_NAME 				= 1;
	window.gcSUB_NAMEORIG 			= 2;
	window.gcSUB_LINK 				= 3;
	window.gcSUB_NEWNUM_T			= 4;
	window.gcSUB_COPYRIGHT			= 5;
	window.gcSUB_COUNTS				= 6;
	window.gcSUB_UPDATESTATUS_T		= 7;
	
	/* gGroups[] OFFSETS */
	window.gcGRP_LEVEL 				= 0;
	window.gcGRP_TYPE				= 1;
	window.gcGRP_DESCRIPTOR			= 2;
	
/* FUNCTIONS */ 

/*  ASYNCHRONOUS CALLS */

function getStructure( pShowEmpty, pShowAll ) {
	
	var _qString = "php/structure.php?usrID=" + window.gUsrID + "&showEmpty=" + pShowEmpty + "&showAll=" + pShowAll;
	asyncQuery( _qString, false, asGetStrucSuccess, asGetStrucFailure);
}

/* ASYNCHRONOUS RETURNS */

function asGetStrucSuccess( prHTML ){
	
	var _container = document.getElementById("grp-container");
	/* DEBUG ONLY */
	var _thing = document.getElementById("thing");

	/* WE HAVE DATA */
	if ( prHTML !== "" ) {
		_container.innerHTML = prHTML;
		attachGroupEvents();
		/* DEBUG ONLY */
		_thing.value = prHTML;
	}
}

function asGetStrucFailure( prXML) { alert("You fucked up!"); }

/* MAIN */

function pageSetup() {
	
	makeSubsArray();
	attachEvents();
	getStructure( true, false );
}

/* OTHER */

function doTest() {
	
}

function attachGroupEvents() {
	
	var _eXDivs = document.getElementsByClassName('xpand');
	for ( var _i = 0; _i < _eXDivs.length; _i++ ) { 
  		
  		_eXDivs[_i].onclick = function() { eXpand( this ); };
	}
}

function getSubFieldByID( pSubID, pFieldIndex ) {

	var _sIndex = window.gSubsIndex.indexOf( pSubID );
	return window.gSubs[_sIndex][pFieldIndex];
}

function attachEvents() {

	document.getElementById("btn-subscribe").onclick = function(){ addFeed(); }
	document.getElementById("btn-save").onclick = function(){ saveFeeds(); }
}

function loadReader() { window.open('reader.html', '_self'); }

function addFeed() {}

function saveFeeds() {}
