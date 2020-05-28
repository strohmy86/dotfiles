
g_user_id_list = [];
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


/*
 * Load manifest and get server url from it if available
 * @param {function} next_step
 */
function fn_load_manifest(next_step) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.extension.getURL("manifest.json"), false);
  xhr.onreadystatechange = function() {
    
    if (this.readyState == 4) {
      g_manifest = JSON.parse(this.responseText);
      if (g_manifest.server_url) {
        g_server_url = g_manifest.server_url;
      }
      next_step();
    }
    
  };
  try {
    xhr.send();
  } catch (e) {
  }
}

/*
 * On click of extension icon on top right corner, try to switch email if multiple gmail accounts and redirect them to dashboard
 */
chrome.browserAction.onClicked.addListener(function(tab) { 

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


  fn_load_manifest(function(){
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      var email_or_login = null;
      
      if (tab && tab.url && tab.url.startsWith('https://mail.google.com/') && tab.status == "complete") {
        chrome.tabs.sendMessage(tab.id, { action: "getUserEmailAddress" }, function(email_or_login) {
          var url_dashboard;
          if (email_or_login) {
            url_dashboard = g_server_url + 'dashboard/apps/gmail_mail_tracker?email_or_login='+email_or_login+'&switch_login=1&registration_code=via_gmail_mail_tracker&provider_mode=google_gmail&auto_login=true';
          } else {
            url_dashboard = g_server_url + 'dashboard/apps/gmail_mail_tracker?registration_code=via_gmail_mail_tracker&provider_mode=google_gmail&auto_login=true';
          }
          openTab({url: url_dashboard}, url_dashboard);
        });
      } else {
        var url_dashboard = g_server_url + 'dashboard/apps/gmail_mail_tracker?registration_code=via_gmail_mail_tracker&provider_mode=google_gmail&auto_login=true';
        openTab({url: url_dashboard}, url_dashboard);
      }
      
    });
    
  });
});


// messages from cloudhq.net webpages
chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
  var result = false;
  if (message && message.type === 'CHQ_REFRESH_WINDOW' && message.target) {
    refreshBrowser(message.target, false);
    result = true;
  }
  sendResponse(result);
});

chrome.runtime.onConnect.addListener(function(port) {
  
  port.onMessage.addListener(function (message) {
    if (message.type === 'CHQ_CREATE_NOTIFICATION') {
      createNotification(message);
    } else if (message.type === 'CHQ_CLEAR_NOTIFICATION') {
      closeNotification(message.message_id);
    } else if (message.type === 'CHQ_CREATE_TAB') {
      openTab(message.tab, message.match_url);
    } else if (message.type === 'CHQ_FOCUS_WINDOW') {
      focusWindow(port.sender.tab.id);
    } else if (message.type === 'CHQ_REFRESH_WINDOW') {
      refreshBrowser(message.target, false);      
    } else if (message.type === 'CHQ_REGISTER_USER_ID') {
      if (g_user_id_list.indexOf(message.user_id) == -1) {
        g_user_id_list.push(message.user_id);
      }
    }
  });

  chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId.startsWith("CHQ_CREATE_NOTIFICATION")) {
      var message_id = notificationId.replace("CHQ_CREATE_NOTIFICATION_", "");
      port.postMessage({
        "type": "CHQ_NOTIFICATION_ACTION",
        "message_id": message_id,
        "button": buttonIndex
      });
    }
  });
});

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

function createNotification(message) {
  var notification_id = "CHQ_CREATE_NOTIFICATION_" + message.message_id;
  chrome.notifications.create(notification_id, {
    type: "basic",
    iconUrl: chrome.extension.getURL('icons/icon-48x48.png'),
    title: message.title,
    message: message.content,
    buttons: message.buttons || [],
    requireInteraction: true
  }, function(notificationId) {

  });
}

function closeNotification(message_id) {
  var notification_id = "CHQ_CREATE_NOTIFICATION_" + message_id;
  chrome.notifications.clear(notification_id, function() { 

  });
}

function focusWindow(tab_id) {
  // get current window to focus back after screenshot was taken.
  chrome.windows.getCurrent(function(window) {
    chrome.windows.update(window.id, {focused: true}, function(window) {
       chrome.tabs.update(tab_id, { active: true });
    });
  });
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
          url: 'https://mail.google.com?from_extension=gmail_mailtracker',
          active: true
        });
      }
    });
  }
  
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    var url = details.url;
    if (url && url.match(/googleusercontent.*proxy.*mail_track.*mail.*uid=/)) {
      for (var index in g_user_id_list) {
        user_id = g_user_id_list[index];
        match_with_user_id = new RegExp('googleusercontent.*proxy.*mail_track.*mail.*uid=' + user_id + '$', 'gi');
        if (url.match(match_with_user_id)) {
          console.log('blocked: url=',url);
          return { cancel: true };
        }
      }
    }
    // console.log('not blocked: url=',url);
    return { cancel: false };
  },
  { urls: ["*://*.googleusercontent.com/*"] },
  ["blocking"]
);

// Refresh on install and update
chrome.runtime.onInstalled.addListener(function(details) {
  if ((details.reason === 'install') || (details.reason === 'update')) {
    refreshBrowser('gmail', true  );
  }
});

chrome.runtime.setUninstallURL("https://www.cloudhq.net/uninstall_chrome_extension?product_what=gmail_mail_tracker");
  