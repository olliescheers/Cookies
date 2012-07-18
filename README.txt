<br />
1. Replace `mydomain.com` with your domain in **cookies.js**
```javascript
// Sets cookie to the page
function setCookie(newLevel) {
  jQuery.cookie("cookie_level", newLevel, { domain: 'mydomain.com', path: '/',expires: 365 });
}
```
2. Upload the cookie code to your site
<br/>
3. Add **bt.cookies.api.js** to the head tag - ideally just before the head tag is closed
```javascript
	<script src="http://www.mydomain.com/bt.cookies.api.js" type="text/javascript"></script>
</head>
```
4. Add **cookies.js** before the end body tag - ideally just before the body tag is closed
```javascript
	<script src="http://www.mydomain.com/cookies.js" type="text/javascript"></script>
</body>
```
Any inline code which drops a cookie can be wrapped with a call to `hasSupportFor()`. For more information see [Wrapping Cookies](https://github.com/BritishTelecom/Cookies/wiki/Wrapping-Cookies)

[View an example of the implementation](https://www.bt.com/static/includes/globalheader/cookies/example/)