/*------------------------------------------------------------------------------
This file is part of the BT cookie solution.

The BT cookie solution is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The BT cookie solution is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with the BT cookie solution.  If not, see <http://www.gnu.org/licenses/>.

Copyright BT plc 2012
---------------------------------------------------------------------------------*/
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