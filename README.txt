

1. Replace `mydomain.com` with your domain in **cookies.js**
2. Upload the cookie code to your site.
3. Add **bt.cookies.api.js** to the head tag - ideally just before the head tag is closed.
4. Add **cookies.js** before the end body tag - ideally just before the body tag is closed.

Any inline code which drops a cookie can be wrapped with a call to the hasSupportFor function – this function will stop the inner code being executed and ensure that cookies are not created if the appropriate level doesn’t match the cookie category. 

Valid arguments for `btCookiesAPI.hasSupportFor(‘level’)` are:
* functional
* targeting

The function also accepts multiple arguments e.g. `btCookiesAPI.hasSupportFor(‘level1’,’level2’)`