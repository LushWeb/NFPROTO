function showStructure( pShowEmpty ) {
	
	var _ofw = document.getElementById("grp-container");

	while ( _ofw.hasChildNodes() == true ) _ofw.removeChild( _ofw.lastChild );

	/* MAKE SUB DISPLAY AND ATTACH EVENTS */
	_sHTML = makeContainerHTML( "subs-outer-div", "subs-outer" );
	
	_cLevel = ""; _cType = ""; _cDesc = "";
	
	/* MAKE TOP LEVEL */
	
	/* MAKE GROUP CONTAINER DIV */
	_sHTML += makeContainerHTML( "gc_0", "g-con" );
	/* MAKE GROUP DIV */
	_sHTML += makeContainerHTML( "grp_0", "g-item" );
	_sHTML += makeElementHTML( "div", "xpand_0", "xpand", "-" );
	_sHTML += makeElementHTML( "div", "grpt_0", "grp", "All" );
	_sHTML += makeElementHTML( "div", "grpn_0", "grp-num", "" );
	_sHTML += makeContainerEndHTML();
	/* GRP HAS ITEMS WITHIN IT SO ADD AN INNER CONTAINER */
	_sHTML += makeContainerHTML( "gci_0", "g-in-con" );
	

	for ( var _i = 0; _i < window.gGroups.length; _i++ ) {
	
		_cLevel = Number( gGroups[_i][window.gcGRP_LEVEL] );
		_cType = gGroups[_i][window.gcGRP_TYPE];
		_cDesc = gGroups[_i][window.gcGRP_DESCRIPTOR];
		_index = _i + 1;
		
		if ( _i == window.gGroups.length - 1 ) {
		
			_nextLevel = 0; 
			_nextType = "GRP";
		}
		else {
		
			_nextLevel = Number( gGroups[_i + 1][window.gcGRP_LEVEL] );
			_nextType = gGroups[_i + 1][window.gcGRP_TYPE];
		}
		
		if ( _cType == "GRP" ) {
			
			/* IF GRP IS EMPTY */
			if ( _nextLevel <= _cLevel ) {
				
				if ( pShowEmpty ){
					
					/* MAKE GROUP CONTAINER DIV */
					_sHTML += makeContainerHTML( "gc_" + _index, "g-con" );
					
					/* MAKE EMPTY GROUP DIV */
					_sHTML += makeContainerHTML( "grp_" + _index, "g-item" );
					_sHTML += makeElementHTML( "div", "grpt_" + _index, "grp-empty", _cDesc );
					_sHTML += makeElementHTML( "div", "grpn_" + _index, "grp-num", "*" );
					_sHTML += makeContainerEndHTML();
					
					_sHTML += makeContainerEndHTML();
				}
			} 
			else {
			
				/* MAKE GROUP CONTAINER DIV */
				_sHTML += makeContainerHTML( "gc_" + _index, "g-con" );
				
				/* MAKE GROUP DIV */
				_sHTML += makeContainerHTML( "grp_" + _index, "g-item" );
				_sHTML += makeElementHTML( "div", "xpand_" + _index, "xpand", "-" );
				_sHTML += makeElementHTML( "div", "grpt_" + _index, "grp", _cDesc );
				_sHTML += makeElementHTML( "div", "grpn_" + _index, "grp-num", "" );
				_sHTML += makeContainerEndHTML();
				/* GRP HAS ITEMS WITHIN IT SO ADD AN INNER CONTAINER */
				_sHTML += makeContainerHTML( "gci_" + _index, "g-in-con" );
			}
		}
		else {
		
			/* MAKE SUB DIV */
			_subID = Number( _cDesc );
			_subName = getSubFieldByID( _subID, window.gcSUB_NAME );
			
			_sHTML += makeContainerHTML( "sub_" + _subID, "s-item" );
			_sHTML += makeElementHTML( "img", "subi_" + _subID, "rss-img", "images/rss_small.jpg" );
			_sHTML += makeElementHTML( "div", "subt_" + _subID, "sub", _subName );
			_sHTML += makeElementHTML( "div", "subn_" + _subID, "sub-num", "" );
			_sHTML += makeContainerEndHTML();		
		}
		
		/* MAKE SURE ALL DIVS END CORRECTLY */
		if ( _nextLevel < _cLevel && _nextType == "GRP") {
			
			for ( var _lC = 0; _lC <  (_cLevel - _nextLevel) * 2; _lC++ ) _sHTML += makeContainerEndHTML();
		}
	}		

	_sHTML += makeContainerEndHTML();
	_sHTML += makeContainerEndHTML();_sHTML += makeContainerEndHTML();

	_ofw.innerHTML = _sHTML;
	var _thing = document.getElementById("thing");
	_thing.value = _sHTML;
	attachGroupEvents();
	_ofw.scrollIntoView( true );

}

function makeContainerHTML( pId, pClass ) { return '<div id="' + pId + '" class="' + pClass + '">'; }
function makeContainerEndHTML(){ return '</div>'; }

function makeElementHTML( pType, pId, pClass, pContent ){ 

	if (pType == "img" ){
		strHTML = '<div class="img-div"><img id="' + pId + '" class="' + pClass + '" src="' + pContent + '"></div>';
	}
	else {
		strHTML = '<div id="' + pId + '" class="' + pClass + '">' + pContent + '</' + pType + '>';
	} 
	return strHTML;
}


function makeGroupsArray() {
	
	/* CONSTRUCT THE ARRAY THAT HOLDS ALL GRP/SUB DATA */
	var _qString = "php/structure.php?usrID=" + window.gUsrID;
	var _gXML = syncQuery( _qString, true );
	
	if ( _gXML != null ) {
	
		var	_groupsXML = _gXML.getElementsByTagName("grp");
		var _sString = "";
		
		for ( var _i = 0; _i < _groupsXML.length; _i++ ) {
			
			_sString = _groupsXML[_i].childNodes[0].nodeValue;
			window.gGroups.push( _sString.split("|"));
			
		}
	}
}
