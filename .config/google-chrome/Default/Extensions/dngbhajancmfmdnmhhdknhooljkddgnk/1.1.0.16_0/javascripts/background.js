// list of users
g_user_id_list = [];
g_server_url = "https://www.cloudhq.net/";
var popup_hash_by_port_name = {};

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

  console.log("gmail_save_to_pdf: gmail_port=",gmail_port);

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

      //var port_name = msg.port_name;
      var url = msg.url;
      var left = Math.round(window.screenLeft);
      var top = Math.round(window.screenTop);
      var width = Math.round(window.outerWidth);
      var height = Math.round(window.outerHeight);

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

      //if url has anchor separate it before appending new parameters
      if (url.indexOf('#') > 0) {
        var a_sep = url.split('#');
        url = a_sep[0] + "&port_name=" + encodeURIComponent(port_name) + "#" + a_sep[1];
      } else {
        url = url + "&port_name=" + encodeURIComponent(port_name);
      }

      popup_hash_by_port_name[port_name] = { 'gmail_port': gmail_port, url: url };
      chrome.windows.create({ url: url, type: "popup", focused: true }, function(win) {
        popup_hash_by_port_name[port_name]['window_id'] = win.id;
        chrome.windows.update(win.id, {
            left: Math.round(left),
            top: Math.round(top),
            width: Math.round(width),
            height: Math.round(height),
            focused: true
          });
      });
      
    // when gmail sends message CHQ_CLOSE_POPUP_IFRAME then popup window will be closed
    } else if (msg.type === 'CHQ_CLOSE_POPUP_IFRAME') {
      
      popup = popup_hash_by_port_name[gmail_port.name];
      if (popup) {

        try {
          var win_id = popup['window_id'];
          chrome.windows.remove(win_id, function() {
            if (chrome.runtime.lastError) {
              console.log('error: in closing window', chrome.runtime.lastError)
            }
            console.log('chrome.windows.remove done');
          });
        } catch(e) {
          console.log('chrome.windows.remove: e=',e);
        }

      }
 
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
          if (chrome.runtime.lastError) {
            console.log('error: in closing window', chrome.runtime.lastError)
          }
        });
      } catch(e) {

      }
      // since popup_hash_by_draft_id is going to be null we will reply abort on next save causing
      // everything to die

      popup_hash_by_port_name[gmail_port_disconnected.name] = {};
      if (popup['popup_port']) {
        popup_port = popup['popup_port'];
        popup_port.postMessage({ type: 'CHQ_GMAIL_CLOSE' });
      }
    }
  });
});


// start listening to this external processed and proxy all messages if there is a port
chrome.runtime.onConnectExternal.addListener(function(popup_port, extension_sender) {

  console.log("chrome.runtime.onConnectExternal.addListener popup_port=",popup_port);

  var port_name = popup_port.name;
  var popup = popup_hash_by_port_name[port_name];
  var gmail_port = null;
  if (popup && popup['gmail_port']) {
    gmail_port = popup['gmail_port'];
  }
  if (popup_hash_by_port_name[port_name]) {
    popup_hash_by_port_name[port_name]['popup_port'] = popup_port;
  }
 
  if (gmail_port) {

    // listed on popup port
    popup_port.onMessage.addListener(function(message) {
      
      // forward messages
      gmail_port.postMessage(message);
      popup_port.postMessage(message); 
  
      // on close focus the window back
      if (message && message.type == 'CHQ_IFRAME_CLOSE') {

        console.log("gmail_screenshot: fosucing gmail since we received CHQ_IFRAME_CLOSE from the popup ");
        if (extension_sender && extension_sender.tab) {
          chrome.windows.getAll({ populate: true, windowTypes: ["normal", "popup"]}, function(windows_list) {
            
            for (var i = 0; i < windows_list.length; i++) {
              var win = windows_list[i];
              if (win && win.tabs && win.tabs.indexOf(extension_sender.tab.id) > 0) {
                chrome.windows.update(win.id, { focused: true });
              }
            }
            
          });
        
          chrome.tabs.update(extension_sender.tab.id, { active: true });
        }

        // When we get CHQ_IFRAME_CLOSE we need to delete popup window because the window cannot delete
        // itself
        try {
          var win_id = popup['window_id'];
          chrome.windows.remove(win_id, function() {
            if (chrome.runtime.lastError) {
              console.log('error: in closing window', chrome.runtime.lastError)
            }
            console.log('chrome.windows.remove done');
          });
        } catch(e) {
          console.log('chrome.windows.remove: e=',e);
        }

      }
      
    });

    // listed on popup port
    popup_port.onDisconnect.addListener(function(message) {
      
      console.log("chrome.runtime.onConnectExternal: popup is disconnected but maybe it is just doing redirect");

      // wait if popup is going to connect in two seconds
      popup_hash_by_port_name[port_name]['popup_port'] = null;
      setTimeout(function() {
        if (popup_hash_by_port_name[port_name]['popup_port']) {
          console.log("chrome.runtime.onConnectExternal: popup reconnected")
        } else {
          console.log("chrome.runtime.onConnectExternal: sending CHQ_IFRAME_CLOSE to gmail since popup got disconnected");

          try {
            gmail_port.postMessage({ type: 'CHQ_IFRAME_CLOSE' });
          } catch(ex) {
            console.log('gmail_port:disconnect:error:ex:', ex);
          }
        }
      }, 2000);

    });

  } else {

    // if there is no gmail port related to this popup answer 
    popup_port.postMessage({ type: 'CHQ_GMAIL_CLOSE' });

  }
  return true;

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


chrome.runtime.setUninstallURL("https://www.cloudhq.net/uninstall_chrome_extension?product_what=gmail_save_to_pdf");