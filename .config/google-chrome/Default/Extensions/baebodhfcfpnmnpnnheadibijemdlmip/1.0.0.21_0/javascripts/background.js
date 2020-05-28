
// list of users
g_user_id_list = [];
var popup_hash_by_port_name = {};
g_server_url = "https://www.cloudhq.net/";

/* process xhr calls through background */
chrome.runtime.onMessage.addListener(
  function(input_request, sender, sendResponse) {
    if (input_request.what == 'PROXY_AJAX') {
      var out_request = input_request.payload;
      if (!out_request['url'] || !out_request['url'].startsWith(g_server_url)) {
        sendResponse({ what: 'error', payload: 'Invalid request' });
        return;
      }
      try {
        if (out_request.responseType === 'blob') {  // handle blob using XMLHttpRequest
          var xhr = new XMLHttpRequest();
          xhr.open(out_request.type || 'post', out_request.url, true);
          xhr.responseType = 'blob';
          if (out_request.headers) {
            $.each(out_request.headers, function(key, value) {
              xhr.setRequestHeader(key, value);
            });
          }
          xhr.onerror = function () {
            sendResponse({ what: 'error', payload: data, status: xhr.status });
          };
          xhr.onload = function (e) {
            var headerMap = {};
            var headers = xhr.getAllResponseHeaders();  // Get the raw header string
            var arr = headers.trim().split(/[\r\n]+/);
            arr.forEach(function (line) {
              var parts = line.split(': ');
              var header = parts.shift().toLowerCase();
              var value = parts.join(': ');
              headerMap[header] = value;
            });
            
            var reader = new FileReader();
            reader.readAsDataURL(this.response);
            reader.onload = function() {
              sendResponse({ what: 'success', payloadType: 'blob', payload: reader.result, headers: headerMap, status: xhr.status });
            };
          };
          
          xhr.send(JSON.stringify(out_request.data));

        } else {

          // use jquery ajax call to 
          out_request.success = function (data, textStatus, jqXHR) {
            sendResponse({ what: 'success', payload: data, status: jqXHR.status });
          };
          out_request.error = function (data, textStatus, jqXHR) {
            sendResponse({ what: 'error', payload: data, status: jqXHR.status });
          };

          $.ajax(out_request);
        }
      } catch(e) {
        sendResponse({ what: 'error', payload: e });
      }

      return true;  // Will respond asynchronously.
    }
  }
);


chrome.runtime.onConnect.addListener(function(gmail_port) {

  console.log("gmail_bulk_forward: gmail_port=",gmail_port);

  var port_name = gmail_port.name;
  if (port_name) {
    popup_hash_by_port_name[port_name] = { 'gmail_port': gmail_port };
  }
  
  gmail_port.onMessage.addListener(function (msg) {

    console.log('MESSAGE', msg);

    if (msg.type === 'CHQ_REGISTER_USER_ID') {

      if (g_user_id_list.indexOf(msg.user_id) == -1) {
        g_user_id_list.push(msg.user_id);
      }
    } else if (msg.type === 'CHQ_REFRESH_WINDOW') {

      refreshBrowser(msg.target, false);

    } else if (msg.type === 'CHQ_FOCUS_WINDOW') {
    
      focusWindow(gmail_port.sender.tab.id);

    } else if (msg.type === 'CHQ_CREATE_TAB') {
     
      openTab(msg.tab, msg.match_url);

    } else if (msg.type === 'CHQ_OPEN_POPUP_IFRAME') {

      var port_name = msg.port_name;
      var url = msg.url;
      var left = 0;
      var top = 0;
      var width = 800;
      var height = 800;

      if (msg.options) {
        if (msg.options.left) {
          left = msg.options.left;
        }
        if (msg.options.top) {
          top = msg.options.top;
        }
        if (msg.options.width) {
          width = msg.options.width;
        }
        if (msg.options.height) {
          height = msg.options.height;
        }
      }

      popup_hash_by_port_name[port_name] = { 'gmail_port': gmail_port, url: url };
      chrome.windows.create({ url: url, type: "popup", focused: true, left: left, top: top, width: width, height: height });
      
    } else {

      // find the popup from the name and forward it
      popup = popup_hash_by_port_name[gmail_port.name];
      if (popup) {

        if (popup['popup_port']) {

          popup_port = popup['popup_port'];
          console.log("gmail_campaigns: forward message gmail_port=",gmail_port, " popup_port=", popup_port, " msg=",msg);

          popup_port.postMessage(msg);
        }
      }
    }
  });

  gmail_port.onDisconnect.addListener(function(gmail_port_disconnected) {

    popup = popup_hash_by_port_name[gmail_port_disconnected.name];
    if (popup) {

      var win_id = popup_hash_by_port_name[port_name]['window_id'];
      try {
        chrome.windows.remove(win_id, function() {
          
        });
      } catch(e) {

      }
      // since popup_hash_by_draft_id is going to be null we will reply abort on next save causing
      // everything to die

      popup_hash_by_port_name[gmail_port_disconnected.name] = null;
      if (popup['popup_port']) {
        popup_port = popup['popup_port'];
        popup_port.postMessage({ type: 'CHQ_GMAIL_CLOSE' });
      }
    }
  });
});

function focusWindow(tab_id) {
  chrome.windows.getCurrent(function(window) {
    chrome.windows.update(window.id, {focused: true}, function(window) {
       chrome.tabs.update(tab_id, { active: true });
    });
  });
}

function openTab(tab_data, match_url) {
  console.log("openTab:",match_url)
  if (match_url) {
    chrome.tabs.query({ }, function(tabs) {
      var tabs_length = tabs.length;
      var tab_found = false;
      for (var i = 0; i < tabs_length; i++) {
        var tab = tabs[i];
        if (!tab_found && tab && tab.url && tab.url.match(match_url) && tab.status == "complete") {
          tab_found = true;
          tab_data['active'] = true;
          chrome.tabs.update(tab.id, tab_data);
          focusWindow(tab.id);
        }
      }
      window.setTimeout(function() {
        if (!tab_found) {
          chrome.tabs.create(tab_data);
        }
      }, 0);
    });
  } else {
    chrome.tabs.create(tab_data);
  }
}

function refreshBrowser(target, bring_to_foreground_flag) {

  chrome.windows.getAll({
    populate: true
  }, function(windows) {
    var found_existing_flag = false;

    windows.forEach(function(win) {
      win.tabs.forEach(function(tab) {
        // Ignore tabs not matching the target.
        if (target === 'gmail') {
          if (!/https:\/\/(mail|inbox)\.google\.com/.test(tab.url)) return;
        } else {
          return; // Unknown target.
        }

        // Reload the matching tab.
        chrome.tabs.reload(tab.id);

        // If this is the first one found, activate it.
        if (bring_to_foreground_flag && !found_existing_flag) {
          chrome.tabs.update(tab.id, {
            active: true
          });
        }

        found_existing_flag = true;
      });
    });

    // If no gmail tab found, just open a new one.
    if (bring_to_foreground_flag && !found_existing_flag) {
      chrome.tabs.create({
        url: 'https://mail.google.com',
        active: true
      });
    }
  });


  chrome.permissions.contains({
    permissions: ['storage']
  }, function(result) {
    if (result) {
      // get current information about extension
      var install_timestamp = new Date().getTime();
      chrome.storage.sync.get("install_timestamp", function (result) {
        if (!result) {
          try { 
            chrome.storage.sync.set(timestamp, function() {
            }); 
          } catch (err) {}
        } else {
          install_timestamp = result;
        }
      });

    } else {
      alert('storage permissions missing');
      // The extension doesn't have the permissions.
    }
  });
}

// Refresh on install and update
chrome.runtime.onInstalled.addListener(function(details) {
  if ((details.reason === 'install') || (details.reason === 'update')) {
    refreshBrowser('gmail', true  );
  }
});


chrome.runtime.setUninstallURL("https://www.cloudhq.net/uninstall_chrome_extension?product_what=gmail_bulk_forward");