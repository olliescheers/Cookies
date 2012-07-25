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
* BT Cookies API
*
* @version	1.0
* @author	LBi
* @license	GPL v3
**/

var btCookiesAPI = btCookiesAPI || {};

btCookiesAPI = function () 
{
	var getCookie = function getCookie(name) 
	{
		//Get the cookie value
		//Returns a number as a string
		
		//Original function written by ppk - http://www.quirksmode.org/js/cookies.html
		//Tweaked slightly to make it more readable
		var nameEQ = name + "=",
			ca = document.cookie.split(';'),
			i;
		
		for (i = 0; i < ca.length; i += 1)
		{
			var c = ca[i];
			while (c.charAt(0) === ' ') 
			{
				c = c.substring(1, c.length);
			}
		
			if (c.indexOf(nameEQ) === 0)
			{
				return c.substring(nameEQ.length, c.length);
			}
		}
	},
	
	oc = function oc(a) 
	{
		//Convert array (a) into an object (o) so you can use the 'in' operator to search the array
		//Function written by snook - http://snook.ca/archives/javascript/testing_for_a_v
		var o = {}, i;
		for (i = 0; i < a.length; i += 1) 
		{
			o[a[i]] = '';
		}
		return o;
	},
	
	//Create object supported cookies setting levels 1 through 4
	supportedCookies = 
	{
		'necessary': 1,
		'performance': 2,
		'functional': 3,
		'sharing': 4,
		'targeting': 4
	};

	return {
			//Create function getAllPossibleCookieLevels
			//This method returns the list of all available cookie levels. This takes the form of a JavaScript array with a list of cookie levels which are lowercase strings.. 
			getAllPossibleCookieLevels: function () 
			{
				//Declare array listOfCookies and empty variable cookieName
				var listOfCookies = [],
					cookieName;
				//Iterate through supportedCookies object. Assigning the property names to cookieName i.e.(necessary, performance, functional etc)
				for (cookieName in supportedCookies) 
				{
					//Push cookieName into listOfCookies[] 
					listOfCookies.push(cookieName);
				}
				//Reurn the populated listOfCookies[]
				return listOfCookies;
			},
		
			//Create function getSupportedCookieLevels
			//This method returns the list of cookie levels that the user has currently opted into. This takes the form of a JavaScript array with a list of cookie levels which are lowercase strings. 
			getSupportedCookieLevels: function () 
			{
				//Declare array listOfCookies, currentCookieLevel which is assigned to the current cookie level, and empty variable cookieName
				var listOfCookies = [],
					currentCookieLevel = Number(getCookie('cookie_level')),
					cookieName;
					
				//Iterate through supportedCookies object. Assigning the property names to cookieName i.e.(necessary, performance, functional etc)
				for (cookieName in supportedCookies) 
				{
					//Conditional statement checks through all supported cookies that are less than or equal to the current cookie level of the site. 
					if (supportedCookies[cookieName] <= currentCookieLevel) 
					{
						//Push cookieName into listOfCookies[]
						listOfCookies.push(cookieName);
					}
				}
				//Reurn the populated listOfCookies[]
				return listOfCookies;
			},
			
			//Create function hasSupportFor
			//This method receives any number of cookie level strings and will return true if each of them is a currently supported cookie level, otherwise it will return false.
			//This is the principal method that will be used by developers, to help determine whether they have permission to use particular cookies categories.
			hasSupportFor: function () 
			{
				//Declare array supportedCookies assigned to array returned by getSupportedCookieLevels, supportedCookies[] is then converted to an object 'supportedCookiesObject', result is defaulted to true and empty variable i. 
				var supportedCookies = btCookiesAPI.getSupportedCookieLevels(),
				supportedCookiesObject = oc(supportedCookies),
				result = true,
				i;
				//Check to see if supportedCookies[] has any data
				if (supportedCookies.length > 0) 
				{
					//Iterate through arguments sent through function call 
					for (i = 0; i < arguments.length; i += 1) 
					{
						//Check to see if the argument/arguments passed through are in the supportedCookiesObject, if not then set result to false.
						if (!(arguments[i] in supportedCookiesObject)) 
						{
							result = false;
							break;
						}
					}
				}
				//Return either true or false. 
				return result;
			},

			//Create function getCurrentCookieLevel
			//This method provides the grade of your cookie settings based on the 5 grades available 
			getCurrentCookieLevel: function () 
			{
				//Assigns result to the current cookie level.
				var result = getCookie('cookie_level');
				return result;
			}
	};
}();