error_localhost = 'Found a local hostname or private IP address. You can only use this extension on public IP addresses or public domains.';
error_url = 'Could not get the information, possible invalid url. Perhaps you are on a blank or chrome:// page?';
error_api = 'Could not get the information, possible server timeout or network error. Please wait a few minutes and try again.';

$(function() {
	restore_options();
	$("#tabs").tabs(  {
        active: defaulttab,
        beforeActivate: function(e, ui) {
            loadtab(String(ui.newTab.index())); 
            return true;
        }
	});
	document.querySelector('#defaulttab').addEventListener('change', ChangeDefaultTab);
	document.querySelector('#pluginkey').addEventListener('change', ChangePluginKey);
	loadtab(defaulttab);
})

function apicall(div,api) {
	if ($(div).html()=='') {
		browserinterface.tabs.query( {'active': true, currentWindow: true}, function(tabArray) {
			$(div).html('<p>Getting information....<img src="images/loading.gif" /></p>');
			try {
				hostname = punycode.toASCII(getHostname(tabArray[0].url));
				if (hostname == null || ispvt(hostname)) {
					$(div).html(error_localhost);
				} else {
					var urlparams = {
						version: '1.1',
						type: api,
						hostname: hostname,
						source: source,
						extversion: extversion
					};
					if (pluginkey != '') urlparams.pluginkey = pluginkey;
					var components = [];
					for (var i in urlparams) {
						components.push(i + "=" + encodeURIComponent(urlparams[i]));
					}
					$(div).load('https://www.utlsapi.com/plugin.php?' + components.join("&"), function(r, s, x) {
					  if (s=="error") {
						if (r!='') $(div).text(r);
						else $(div).text(error_api);
					  }
					});
				}
			} catch(e) {
				$(div).text(error_url);
			}
		});
	}
}

function loadmyip() {
	if ($('#myip').html()=='') {
		$('#myip').html('<p>Getting My IP Address information....<img src="images/loading.gif" /></p>');
		var urlparams = {
			version: '1.1',
			type: 'myipinfo',
			source: source,
			extversion: extversion
		};
		if (pluginkey != '') urlparams.pluginkey = pluginkey;
		var components = [];
		for (var i in urlparams) {
			components.push(i + "=" + encodeURIComponent(urlparams[i]));
		}
		$('#myip').load('https://www.utlsapi.com/plugin.php?' + components.join("&"), function(r, s, x) {
		  if (s=="error") {
			if (r!='') $('#myip').text(r);
			else $('#myip').text(error_api);
		  }
		});
	}
}

function restore_options() {
  if (typeof chrome.tabs !== 'undefined') browserinterface=chrome; else browserinterface=browser;
  if (navigator.userAgent.search('OPR')>0) source = "operaext";
  else if (navigator.userAgent.search('Edge')>0) source = "edgeext";
  else if (navigator.userAgent.search('Chrome')>0) source = "chromeext";
  else source = "foxext";
  extversion=browserinterface.runtime.getManifest().version;
  try {
	defaulttab = localStorage["defaulttab"];
  } catch (e) {
	defaulttab = "0";
	localStorage["defaulttab"] = defaulttab;
  }
  try {
	pluginkey = localStorage["pluginkey"];
  } catch (e) {
	pluginkey = "";
	localStorage["pluginkey"] = pluginkey;
  }
  if (!defaulttab) {
	defaulttab = "0";
	localStorage["defaulttab"] = defaulttab;
  }
  if (!pluginkey) {
	pluginkey = "";
	localStorage["pluginkey"] = pluginkey;
  }
  document.getElementById("pluginkey").value=pluginkey;
  var select = document.getElementById("defaulttab");
  for (var i = 0; i < select.children.length; i++) {
	var child = select.children[i];
	if (child.value == defaulttab) {
	  child.selected = "true";
	  break;
	}
  }
}

function loadtab(tab) {
	switch(tab) {
	case "0":
	  apicall('#ipv4','ipv4info');
	  break;
	case "1":
	  apicall('#ipv6','ipv6info');
	  break;
	case "2":
	  apicall('#isp','asinfo');
	  break;
	case "3":
	  apicall('#domain','domaininfo');
	  break;
	case "4":
	  loadmyip();
	  break;
	}
};

function ChangeDefaultTab() {
	localStorage['defaulttab'] = this.options[this.selectedIndex].value;
	defaulttab = this.options[this.selectedIndex].value;
};

function ChangePluginKey() {
	localStorage['pluginkey'] = this.value;
	pluginkey = this.value;
}

function getHostname(str) {
	try {
		var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/|:]+)', 'im');
		return str.match(re)[1].toString();
	} catch (e) {
		return null;
	}
};

function ispvt(hostname) {
	var re = /^((^[a-z0-9-_]+$)|((10|127)\.\d+|(172\.(1[6-9]|2[0-9]|3[01])|192\.168))\.\d+\.\d+)$/i;
	return re.test(hostname);
}
