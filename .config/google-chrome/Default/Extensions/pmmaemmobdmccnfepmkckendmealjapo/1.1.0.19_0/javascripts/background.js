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

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    var email_or_login = null;
    
    if (tab && tab.url && tab.url.startsWith('https://mail.google.com/') && tab.status == "complete") {
      chrome.tabs.sendMessage(tab.id, { action: "getUserEmailAddress" }, function(email_or_login) {
        var url_dashboard;
        if (email_or_login) {
          url_dashboard = g_server_url + 'dashboard/apps/gmail_label_sharing/?email_or_login='+encodeURIComponent(email_or_login)+'&switch_login=1&registration_code=via_label_sharing&provider_mode=google_docs_google_gmail&auto_login=true';
        } else {
          url_dashboard = g_server_url + 'dashboard/apps/gmail_label_sharing?registration_code=via_label_sharing&provider_mode=google_docs_google_gmail&auto_login=true';
        }
        openTab({url: url_dashboard}, url_dashboard);
      });
    } else {

      var url_dashboard = g_server_url + 'dashboard/apps/gmail_label_sharing?registration_code=via_label_sharing&provider_mode=google_docs_google_gmail&auto_login=true';
      openTab({url: url_dashboard}, url_dashboard);
    }
    
  });
    
});


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
}


// Refresh on install and update
chrome.runtime.onInstalled.addListener(function(details) {
  if ((details.reason === 'install') || (details.reason === 'update')) {
    refreshBrowser('gmail', true  );
  }
});

chrome.runtime.setUninstallURL("https://www.cloudhq.net/uninstall_chrome_extension?product_what=label_sharing");

chrome.runtime.onSuspend.addListener(function() {
  localStorage['cloudhq_ext_lock'] = '';
  localStorage['cloudhq_ext_registered'] = '[]';
});

chrome.runtime.onStartup.addListener(function(e) {
  // this one is only invoked when user profile is started.
});
