----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------
Legal Disclaimer The comments throughout the project files are not intended, and should not be interpreted, 
as legal advice by BT. BT makes no representation nor gives any warranty that the solution as implemented 
will comply with the requirements of the E Privacy Regulations and takes no responsibility for any implementation 
of this code on other websites. Poor implementation or categorisation of cookies may result in a poor or 
misleading solution and anyone adopting this solution should seek their own legal advice before implementing it is 
a condition of using this solution that a website operator enters into a licence provided here [ ] and that the 
categorisation of cookies follows the ICC UK guidelines, and the implementation is complete (i.e. all concepts 
described below are incorporated), if you are unsure if your implementation satisfies the legal requirements for 
the jurisdiction you operate in you should seek independent legal advice.

Your use of the BT cookie solution is at your own risk and BT accepts no liability for any loss or damage which 
you may incur no matter how caused.

Copyright BT 2012
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------

The main use-case for this API is to allow cookie-dependant CMS, application or 3rd party JavaScript code to be 
wrapped in a conditional statement such that it will execute only if cookies of a particular category have been given 
consent to by the user.

1. Replace `mydomain.com` with your domain in **cookies.js**
2. Upload the cookie code to your site.
3. Add **bt.cookies.api.js** to the head tag - ideally just before the head tag is closed.
4. Add **cookies.js** before the end body tag - ideally just before the body tag is closed.

Any inline code which drops a cookie can be wrapped with a call to the hasSupportFor function – this function will 
stop the inner code being executed and ensure that cookies are not created if the appropriate level doesn’t match the 
cookie category. 

Valid arguments for `btCookiesAPI.hasSupportFor(‘level’)` are:
* functional
* targeting

The function also accepts multiple arguments e.g. `btCookiesAPI.hasSupportFor(‘level1’,’level2’)`