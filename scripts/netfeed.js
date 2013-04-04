/* 	Geoff Lush - October 2012+ */

/* GENERIC ROUTINES TO QUERY PHP FILES */

function syncQuery( pQStr, pAsXML ) {
	
	var _xhttp = new XMLHttpRequest();
	_xhttp.open("GET", pQStr, false);
	_xhttp.send();
	if ( pAsXML ) return _xhttp.responseXML;
	else return _xhttp.responseText;
}

asyncQuery = function( pQStr, pAsXML, pcbSuccess, pcbFailure){
	
	var _cNOT_INITIALISED = 0, _cCONN_ESTABLISHED = 1, _cQUERY_RECIEVED = 2, _cPROCESSING_QUERY = 3, _cFINISHED = 4;
	var _cOK = 200, _cFILE_NOT_FOUND = 404; 
		
	var _xmlhttp = new XMLHttpRequest();
	
	_xmlhttp.onreadystatechange = function() {
		
		if ( _xmlhttp.readyState == _cFINISHED ) {
			if ( _xmlhttp.status == _cOK ) {
				if ( pAsXML == true ) pcbSuccess( _xmlhttp.responseXML );
				else pcbSuccess( _xmlhttp.responseText );
			}
			else {
				if ( pAsXML == true ) pcbFailure( _xmlhttp.responseXML );
				else pcbFailure( _xmlhttp.responseText);
			}
		}
	}
	_xmlhttp.open( "GET" , pQStr, true );
	_xmlhttp.send();
}

/* OTHERS */

function loadAppPage( pPageName ) {
	
	var newWindow = window.open( pPageName + ".html", "_self" );
}

function makeSubsArray () {
	
	/* CONSTRUCT THE ARRAY THAT HOLDS ALL GRP/SUB DATA */
	var _qString = "php/misc.php?usrID=" + window.gUsrID + "&func=SUBS&itemStatus=0&grpID=0&subID=0&itemOrder=0&format=0";
	var _subsDataXML = syncQuery( _qString, true );
	
	if ( _subsDataXML != null ) {
	
		var	_subsXML = _subsDataXML.getElementsByTagName("sub");
		var _sString = "";
		
		for ( var _i = 0; _i < _subsXML.length; _i++ ) {
			
			_sString = _subsXML[_i].childNodes[0].nodeValue;
			window.gSubs.push( _sString.split("|"));
			window.gSubsSI.push( Number(window.gSubs[_i][window.gcSUB_ID]));
		}
	}
}

function createNewElement( pType, pParent, pId, pClass, pContent){
	
	/* ADD A NEW CHILD DIV OR IMG TO A MENU DIV */
	var _newE = document.createElement( pType );
	_newE.setAttribute( 'id', pId );
	_newE.setAttribute( 'class', pClass );
	
	switch ( pType ){
		
		case 'div': 
			_newE.innerHTML = pContent; 
			break;
		
		case 'img': 
			_newE.src = pContent; 
			break;
	}
	pParent.appendChild( _newE );
	return _newE;
}

function eXpand( pObj ){

	var _gcID = Number( pObj.id.match(/\d+$/)[0] );
	var _gc = document.getElementById( "gci_" + _gcID);
	var _eX = document.getElementById( "xpand_" + _gcID);
	
	if ( _eX.innerHTML == "+" ){
		_gc.className = "g-in-con";
		_eX.innerHTML = "-";
	}
	else {
		_gc.className = "g-in-con-b";
		_eX.innerHTML = "+";
	}
}

function getPos( pObj ) {

	var _rect = pObj.getBoundingClientRect();
	_height = _rect.bottom - _rect.top;
	_width =  _rect.right - _rect.left;
	
	return { top: _rect.top, left: _rect.left, right: _rect.right, bottom: _rect.bottom, height: _height, width: _width };
}

function deleteItem( pItemID )  {
	   
    var _item = document.getElementById( pItemID );
    _item.parentNode.removeChild( _item );
}

function makeMenu( pMnuType, pMnuArray ) {
	
	var _oOuterMenu = document.getElementById( pMnuType + "-drop-down-o");
	var _oPadDiv = createNewElement( 'div', _oOuterMenu, pMnuType + '-ddpa', 'drop-down-pad-a', '');
	var _oPadDiv = createNewElement( 'div', _oOuterMenu, pMnuType + '-ddpb', 'drop-down-pad-b', '');
	var _oInnerMenu = createNewElement( 'div', _oOuterMenu, pMnuType + '-drop-down', 'drop-down-inner', '');
	
	for ( var _i = 0; _i < pMnuArray.length; _i++ ) {
		
		var _newMenuDiv = createNewElement( 'div', _oInnerMenu, pMnuType + '_' + _i, 'drop-item', pMnuArray[_i]);
		_newMenuDiv.onclick = function() { selectMenuOption( this ); };
	}
	alignMenu( pMnuType );
}

function alignMenu( pMnuType ) {

	var _btn = document.getElementById( "btn-" + pMnuType );
	var _dropDown = document.getElementById( pMnuType + "-drop-down-o" );
	var _padA = document.getElementById( pMnuType + "-ddpa" );
	var _padB = document.getElementById( pMnuType + "-ddpb" );
	var _scrollWidth = 18;
	/* RESET PADDING */
	_padA.style.width = null; _padB.style.width = null;
		
	var _btnPos = _btn.getBoundingClientRect();
	var _dropDownPos = _dropDown.getBoundingClientRect();
	_dropDown.style.left = _btnPos.left + "px";
	
	_padA.style.width = _btnPos.width - 4 + "px";

	var _innerDropDown = document.getElementById( pMnuType + "-drop-down" );
	
	/* REVISIT */
	if ( _dropDownPos.height > ( window.innerHeight - _btnPos.bottom - 30 ) ) {
		
		_padB.style.width = _dropDownPos.width - _btnPos.width + 3 + _scrollWidth + "px";
		_innerDropDown.style.height = window.innerHeight - _btnPos.bottom - 90 + "px";
	}
	else {
		
		_padB.style.width = _dropDownPos.width - _btnPos.width + 3 + "px";
		_innerDropDown.style.height = null;	
	}
}

function initUpdateStatusMessage() { document.getElementById("update-status-text").className = "footer-text-working"; }

function setUpdateStatusMessage( pMsg ) { document.getElementById("update-status-text").innerHTML = "[ Update: " + pMsg + " ]"; }

function defaultStatusUpdate() {

	setUpdateStatusMessage(window.gDefaultUpdateStatus);
	document.getElementById("update-status-text").className = "footer-text";
}
