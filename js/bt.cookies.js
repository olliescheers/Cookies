/**
* BT Cookies JS
*
* @version	1.0
* @author	LBi
* @license	GPL v3
**/

var jQueryScriptOutputted = false;
	
function initJQuery() {
	//If the jQuery object isn't available
	if (typeof(jQuery) == 'undefined') {
		if (! jQueryScriptOutputted) {
			//Only output the script once..
			jQueryScriptOutputted = true;
			
			//Output the script (load it from google api)
			document.write("<script type=\"text/javascript\" src=\"http://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js\" onload=\"jQuery.noConflict();\"></script>");
		}
	setTimeout("initJQuery()", 50);
	} else {
		//If the jQuery object is avaliable add cookies.css and cookies.js to the head and body of the html 
		jQuery(function() {
			jQuery('head').append('<link rel="stylesheet" href="css/cookies.css" type="text/css" />');
			jQuery('body').append('<script src="js/cookies.js"></script>');
		});
	}
}

initJQuery();