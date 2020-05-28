$(function() {
	$("#tabs").tabs();
	chrome.tabs.query( {'active': true, currentWindow: true}, function(tabArray) {
		 var names=new Array("dnsrecord","dnsbl","domsearch","domtypos","ipgeolocation","reversemx","reverseanalytics",
							 "reversens","pinghost","tracerthost","reverseadsense","reverseip","whois");
		 var hostname = getHostname(tabArray[0].url);
		 for(var i = 0; i < names.length ; i++){
			arr = document.getElementsByName(names[i]);
			if (names[i] == "email") arr[0].value = 'info@' + hostname
			else arr[0].value = hostname;
		}
	});
});

function getHostname(str) {
	var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
	return str.match(re)[1].toString();
};