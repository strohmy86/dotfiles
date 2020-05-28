
var g_server_url = "https://www.cloudhq.net/";
var g_sender_hash_per_tab_id = {};

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

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    var email_or_login = null;
    
    if (tab && tab.url && tab.url.startsWith('https://mail.google.com/') && tab.status == "complete") {
      chrome.tabs.sendMessage(tab.id, { action: "getUserEmailAddress" }, function(email_or_login) {
        var url_dashboard;
        if (email_or_login) {
          url_dashboard = g_server_url + 'dashboard/apps/gmail_url_previews?email_or_login='+encodeURIComponent(email_or_login)+'&switch_login=1&auto_login=true';
        } else {
          url_dashboard = g_server_url + 'dashboard/apps/gmail_url_previews?registration_code=via_gmail_url_link_previews&auto_login=true';
        }
        openTab({url: url_dashboard}, url_dashboard);
      });
    } else {
      var url_dashboard = g_server_url + 'dashboard/apps/gmail_url_previews?registration_code=via_gmail_url_link_previews&auto_login=true';
      openTab({url: url_dashboard}, url_dashboard);
    }
    
  });

  //  var url = g_server_url + 'dashboard/apps/gmail_receipts?email_or_login='+encodeURIComponent(email_or_login)+'&switch_login=1&registration_code=save_to_googledrive&provider_mode=google_gmail&auto_login=true';
  //  var url = 'https://support.cloudhq.net/category/browser-extensions/url-link-preview-for-gmail';
  //  openTab({url: url}, url);
    //  var url_dashboard = g_server_url + 'gmail_link_';
    //  openTab({url: url_dashboard}, url_dashboard);
});



function uploadContentToGmail(data, sendResponse) {

  var jsonData = JSON.stringify({
    "title": data["title"],
    "url": data["url"],
    "label": data["label"],
    "content_as_html": data["contentHtml"],
    "content_as_text": data["contentText"]
  });
  
  var xhr = new XMLHttpRequest();
  var url = g_server_url + 'main_gmail_web_clipper/save_to_gmail';
  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if(xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status == 200) {
        sendResponse.call(this, xhr.response);
      } else {
        sendResponse.call(this, {'success' : false});
      }
    }
  };
  xhr.send(jsonData);
  return xhr;
}

function getIframelyPreview(website_url, sendResponse) {

  var jsonData = JSON.stringify({
    "website_url": website_url
  });
  var xhr = new XMLHttpRequest();
  var url = g_server_url + 'main_gmail_web_clipper/get_iframely_preview';
  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if(xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status == 200) {
        sendResponse.call(this, xhr.response);
      } else {
        sendResponse.call(this, {'success' : false});
      }
    }
  };
  xhr.send(jsonData);
  return xhr;
}


function getEmbedlyPreview(website_url, sendResponse) {

  var jsonData = JSON.stringify({
    "website_url": website_url
  });
  var xhr = new XMLHttpRequest();
  var url = g_server_url + 'main_gmail_web_clipper/get_embedly_preview';
  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if(xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status == 200) {
        sendResponse.call(this, xhr.response);
      } else {
        sendResponse.call(this, {'success' : false});
      }
    }
  };
  xhr.send(jsonData);
  return xhr;
}

function createComposeDraft(subject, body, sendResponse) {
  var xhr = new XMLHttpRequest();
  var url = g_server_url + 'main_gmail_web_clipper/create_draft';
  var jsonData = JSON.stringify({subject: subject, body: body});
  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if(xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status == 200) {
        sendResponse.call(this, xhr.response);
      } else {
        sendResponse.call(this, {'success' : false});
      }
    }
  };
  xhr.send(jsonData);
  return xhr;
}

function getSaveForm(redir_url, sendResponse) {
  var xhr = new XMLHttpRequest();
  var url = g_server_url + 'main_gmail_web_clipper';
  var next_step_url = g_server_url + 'main_gmail_web_clipper/check_intention';
  var jsonData = JSON.stringify({ next_step_url: next_step_url });
  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if(xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status == 200) {
        var resp = xhr.response;
        if (resp["status"] == "SIGN_UP") {
          var data_to_store = { "cloudHQ_gmail_web_clipper_redir_url": redir_url };
          chrome.storage.sync.set(data_to_store, function() { 
            sendResponse.call(this, resp);
          });
        } else {
          sendResponse.call(this, resp);
        }
      } else {
        sendResponse.call(this, {'status' : 'ERROR'});
      }
    }
  };
  xhr.send(jsonData);
  return xhr;
}

function addContextMenu(){
  // we do not all because we do not want also menu of right click. Evernote has "bookmark" while OneNote has nothing.
  // var contexts = ["all"]
  // var contexts = ["page", "frame", "selection", "link", "editable", "image", "video", "audio", "page_action"];
  /*for(var i=0;i<contexts.length;i++){
    var context = contexts[i];
    var title = "Clip Selection to Gmail";
    id = chrome.contextMenus.create({"title":title,"contexts":[context],"id":"context"+context});
  }*/
}

function focusWindow() {
  // get current window to focus back after screenshot was taken.
  chrome.windows.getCurrent(function(window) {
    chrome.windows.update(window.id, {focused: true}, function(res) {

    });
  });
}

function refreshAllBrowserTabs(reason) {

  chrome.windows.getAll({
    populate: true
  }, function(windows) {

    var found_existing_flag = false;
    windows.forEach(function(win) {
      win.tabs.forEach(function(tab) {
        // Reload the  tab.
        // chrome.tabs.reload(tab.id);

        try {
          var code = 'window.location.reload();';
          chrome.tabs.executeScript(tab.id, {code: code}, function () {
            if (chrome.runtime.lastError) {
               return;
            }
          });
          if (!(tab.url.match(/https:\/\/blog.cloudhq.net/i)) || reason != 'install') {
            return;
          }
        } catch(e) {
          return;
        }

        if (!found_existing_flag) {
          chrome.tabs.update(tab.id, {
            url : "https://blog.cloudhq.net/congratulations-lets-try-gmail-web-clipper/",
            active: true
          });
        }

        found_existing_flag = true;

      });
    });
    if (!found_existing_flag && reason == 'install') {
      chrome.tabs.create({
        url : "https://blog.cloudhq.net/congratulations-lets-try-gmail-web-clipper/",
        active: true
      });
    }
  });
}

function executeSiteScript(initCode, sendResponse) {
  chrome.tabs.executeScript(null, {
    code: initCode || 'var a = 1;'
  }, function() {
    console.log('executeSiteScript: executeScript')
    chrome.tabs.executeScript(null, { file: "javascripts/main_gmail_url_previews_site.js" }, sendResponse);
  });
}

function executeScriptImpl(tabId, outerCallback) {
  var file_list = [ "javascripts/jquery-3.2.1.min.js",
                    "javascripts/jquery.json.js",
                    "javascripts/common.js",
                    "javascripts/findAndReplaceDOMText.js",
                    "javascripts/readability.js",
                    "javascripts/main_gmail_url_previews_site.js" ];

  function createCallback(tabId, file_name, innerCallback) {
    return function () {
      if (innerCallback) {
        chrome.tabs.executeScript(tabId, { file: file_name }, innerCallback);
      } else {
        chrome.tabs.executeScript(tabId, { file: file_name }, outerCallback);
      }
    };
  }

  var callback = null;
  for (var i = file_list.length - 1; i >= 0; --i) {
    callback = createCallback(tabId, file_list[i], callback);
  }
  if (callback !== null) {
    callback();   // execute outermost function
  } 
}


function getWebContentFromTab(url, screenshot, sender, sendResponse) {

  // remove trailing '/' and hash
  url = (url + '').replace(/\/#/, '').replace(/\/$/, ''); 
  var do_active = false;
  var zoom_factor = null;
  var create_new = false;

  if (url.match(/linkedin.com/)) {
    do_active = true;
  }

  if (create_new && zoom_factor) {
    chrome.tabs.create({
      url: url,
      active: do_active
    }, function (tab) {
      var newtabid = tab.id;

      chrome.tabs.onUpdated.addListener(function (tabID, info) {
        zoom_settings = { 'scope': 'per-tab' };
        chrome.tabs.setZoomSettings(newtabid, zoom_settings, function() {
          chrome.tabs.setZoom(newtabid, zoom_factor, function() {
            if (typeof info.status !== 'undefined' && info.status === 'complete' && tabID === newtabid) {
              g_sender_hash_per_tab_id[tab.id] = { 'sender': sender, 'sendResponse': sendResponse, 'foundExisting': false, 'screenshot': screenshot };
              chrome.tabs.executeScript(newtabid, {
                code: 'var isContextMenu = false; var skipPreview = true; var cloudHQ_request_tab_id = ' + newtabid + '; var cloudHQ_screenshot = ' + screenshot + '; '
              }, function () {
                executeScriptImpl(newtabid, function (res) { console.log("res:",res); });

              });
            }
          });
        });
      });
    });
  } else {
    chrome.windows.getAll({
      populate: true
    }, function (windows) {
      var found_existing_tab = false;
      windows.forEach(function (win) {
        win.tabs.forEach(function (tab) {
          var tab_url =  (tab.url  + '').replace(/\/#/, '').replace(/\/$/, ''); 
          if (tab_url === url && found_existing_tab === false) {
            chrome.tabs.update(tab.id, { active: do_active });
            found_existing_tab = true;
            g_sender_hash_per_tab_id[tab.id] = { 'sender': sender, 'sendResponse': sendResponse, 'foundExisting': true, 'screenshot': screenshot };
            chrome.tabs.executeScript(tab.id, {
              code: 'var isContextMenu = false; var skipPreview = true; var cloudHQ_request_tab_id = ' + tab.id + '; var cloudHQ_screenshot = ' + screenshot + '; console.log("getWebContentFromTab: one")'
            }, function () {
              executeScriptImpl(tab.id, function (res) { console.log("res:",res); });
            });
          }
        });
      });
      if (!found_existing_tab) {
        chrome.tabs.create({
          url: url,
          active: do_active
        }, function (tab) {
          var newtabid = tab.id;
          chrome.tabs.onUpdated.addListener(function (tabID, info) {
            if (typeof info.status !== 'undefined' && info.status === 'complete' && tabID === newtabid) {
              g_sender_hash_per_tab_id[tab.id] = { 'sender': sender, 'sendResponse': sendResponse, 'foundExisting': false, 'screenshot': screenshot };
              chrome.tabs.executeScript(newtabid, {
                code: 'var isContextMenu = false; var skipPreview = true; var cloudHQ_request_tab_id = ' + newtabid + '; var cloudHQ_screenshot = ' + screenshot + '; ' 
              }, function () {
                executeScriptImpl(newtabid, function (res) { console.log("res:",res); });
              });
            }
          });
        });
      }
    });
  }
}

var TabIdToExecuteScript = null;

chrome.tabs.onUpdated.addListener(function(tabId , info) {
  if (TabIdToExecuteScript && TabIdToExecuteScript == tabId && info.status === 'complete') {
    TabIdToExecuteScript = null;
    console.log('chrome.tabs.onUpdated.addListener: executeScript')
    chrome.tabs.executeScript(tabId, {
      code: 'var isContextMenu = false; var skipPreview = true;'
    }, function() {
      console.log('chrome.tabs.onUpdated.addListener: executeScript - real')  
      executeScriptImpl(tabId, function(res) {});
    });

  }
});

function fn_data_url_to_blob(data_url) {
  var arr = data_url.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

function uploadToS3(data_url, next_step) {

  var image = fn_data_url_to_blob(data_url);
  var get_upload_link_url = g_server_url + "main_gmail_screenshot/get_amazon_s3_presigned_url_and_share_link";
  var get_upload_link_xhr = new XMLHttpRequest();
  get_upload_link_xhr.open('POST', get_upload_link_url, true);
  get_upload_link_xhr.setRequestHeader("Content-type", "application/json");
  get_upload_link_xhr.responseType = "json";
  get_upload_link_xhr.onreadystatechange = function() {
    if (get_upload_link_xhr.readyState == XMLHttpRequest.DONE) {
      if (get_upload_link_xhr.status == 200) {

        var response = get_upload_link_xhr.response;
        var shared_link_preview_url = response['shared_link_preview_url'];
        var upload_url = response['presigned_url'];
        var upload_xhr = new XMLHttpRequest();
        upload_xhr.open('PUT', upload_url, true);
        upload_xhr.setRequestHeader("Content-type", "image/png");
        upload_xhr.onreadystatechange = function() {

          if (get_upload_link_xhr.readyState == XMLHttpRequest.DONE) {
            if (get_upload_link_xhr.status == 200) {
              next_step(shared_link_preview_url);
            } else {
              next_step(null)
            }
          }
        }
        upload_xhr.send(image);

      } else {
        next_step(null);
      }
    }
  };
  get_upload_link_xhr.send(null);
}

function getScreenshotFromTabImpl(next_step) {
  chrome.tabs.captureVisibleTab(null, {format: 'jpeg', quality: 100}, function(data_url) {
    if (chrome.runtime.lastError) {

      if (chrome.runtime.lastError.message == 'The extensions gallery cannot be scripted.') {
        alert('Gmail Screenshot cannot capture Chrome Web Store because Google does not allow it. Please try a different web page.');
      } else {
        alert(chrome.runtime.lastError.message);
      } 
      next_step(null);
    }
    next_step(data_url);
  });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case "CHQ_CLIP_WEB_CONTENT":
      var data = message.data;
      if (data['request_tab_id'] && g_sender_hash_per_tab_id[data['request_tab_id']]) {
        var requestTabId = data['request_tab_id'];
        var sendResponse = g_sender_hash_per_tab_id[requestTabId]['sendResponse'];
        var originalSender = g_sender_hash_per_tab_id[requestTabId]['sender'];
        var screenshot = g_sender_hash_per_tab_id[requestTabId]['screenshot'];
        var foundExisting = g_sender_hash_per_tab_id[requestTabId]['foundExisting'];

        if (screenshot) {

          // create sreenshot for website
          chrome.tabs.update(requestTabId, { active: true }, function() {
            setTimeout(function() {
              getScreenshotFromTabImpl(function(data_url) {
                if (!data_url) {
                  sendResponse.call(this, data);

                } else {
                  uploadToS3(data_url, function(url) {
                    if (url) {
                      if (data['metadata']) {
                        data['metadata']['image'] = { 'url': url };
                      } else {
                        data['metadata'] = { 'image': { 'url': url } };
                      }
                    }
                    sendResponse.call(this, data);

                  });
                }

                chrome.tabs.update(originalSender.tab.id, { active: true });
                if (foundExisting !== true) {
                  chrome.tabs.remove(requestTabId);
                }
                g_sender_hash_per_tab_id[data['request_tab_id']] = null;

              });
            }, 1000);
          });
        } else {
          sendResponse.call(this, data);

          chrome.tabs.update(originalSender.tab.id, { active: true });
          if (foundExisting !== true) {
            chrome.tabs.remove(requestTabId);
          }
          g_sender_hash_per_tab_id[data['request_tab_id']] = null;
        }
      } else {
        uploadContentToGmail(data, sendResponse);
      }
      return true;

    case "CHQ_GET_IFRAMELY_PREVIEW":
      var url = message.url;
      getIframelyPreview(url, sendResponse);
      return true;

    case "CHQ_GET_EMBEDLY_PREVIEW":
      var url = message.url;
      getEmbedlyPreview(url, sendResponse);
      return true;

    case "CHQ_CLIP_WEB_CONTENT_GET_SAVE_FORM":
      var redir_url = message['url'];
      getSaveForm(redir_url, sendResponse);
      return true;

    case "CHQ_CLIP_WEB_CONTENT_OPEN_EMAIL":
      var data = message.data;
      var gmailHash = '#label/' + data.label_name + '/' + data.message_id;
      var gmail_tab_id = null;
      chrome.tabs.query({ }, function(tabs) {
        var tabs_length = tabs.length;
        var tab_found = false;
        for (var i = 0; i < tabs_length; i++) {
          var tab = tabs[i];
          if (!tab_found && tab && tab.url && tab.url.startsWith('https://mail.google.com/') && tab.status == "complete") {
            gmail_tab_id = tab.id;
            chrome.tabs.sendMessage(tab.id, { action: "getUserEmailAddress" }, function(email_or_login) {
              console.log('GOT MESSAGE', email_or_login);
              if (email_or_login && data.email_or_login.toLowerCase() == email_or_login.toLowerCase()) {
                console.log('send message: tab.id=', tab.id);
                tab_found = true;
                chrome.tabs.update(gmail_tab_id, { active: true });
                chrome.tabs.sendMessage(gmail_tab_id, { action: "setLocationHash", hash: gmailHash }, function() {

                });
              }
            });
          } 
        }
        window.setTimeout(function() {
          console.log('tab_found', tab_found);
          if (!tab_found) {
            chrome.tabs.create({ url: 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(data.email_or_login) + gmailHash });
          }
        }, 500);
      });
      return true;
    
    case "CHQ_CLIP_WEB_CONTENT_SHARE":
      var data = message.data;
      createComposeDraft(data.title, data.content, function(res) {
        var draft_url = 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(res['email_or_login']) + '#inbox?compose=' + res['draft_id'];
        chrome.tabs.create({ url: draft_url, active: true }, function(tab) {
          sendResponse.call(this, res);
        });
      });
      return true;
    case "CHQ_CLIP_WEB_CONTENT_EXECUTE":
      var url = message.url;
      var current_tab = !!message.current_tab;
      if (current_tab) {
        chrome.tabs.update({url: url}, function(tab) {
          console.log('TabIdToExecuteScript=', tab.id);
          TabIdToExecuteScript = tab.id;
          console.log('TabIdToExecuteScript', TabIdToExecuteScript);
        });
      } else {
        chrome.tabs.create({ url: url, active: true }, function(tab) {
          executeSiteScript('var isContextMenu = false; var skipPreview = true;', sendResponse);
        });
      }
      return true;
      
    case "CHQ_CLIP_WEB_CONTENT_FROM_TAB":
      var url = message.url;
      var screenshot = message.screenshot;
      getWebContentFromTab(url, screenshot, sender, sendResponse);

      return true;
  }
  return false;
});

/*
chrome.contextMenus.onClicked.addListener(function() {
  executeSiteScript('var isContextMenu = true; console.log("isContextMenu = true")', function(res) {
    if (res ==undefined) {
      alert('Due to the restrictions set by the browser, you cannot clip this page');
    }
    console.log('executeSiteScript', res); 
  });
});*/

// Refresh on install and update
chrome.runtime.onInstalled.addListener(function(details) {
  if ((details.reason === 'install') || (details.reason === 'update')) {
    //refreshAllBrowserTabs(details.reason);
    refreshBrowser('gmail', true, details.reason);
  }
});

function refreshBrowser(target, bring_to_foreground_flag, install_or_update) {
  chrome.windows.getAll({
    populate: true
  }, function(windows) {
    var found_existing_flag = false;

    windows.forEach(function(win) {
      win.tabs.forEach(function(tab) {
        // Ignore tabs not matching the target.
        /*if (target === 'gmail') {
          if (!/https:\/\/(mail|inbox)\.google\.com/.test(tab.url)) return;
        } else {
          return; // Unknown target.
        }*/
        if (/chrome:\/\//.test(tab.url)) {
          return;
        }

        // Reload the matching tab.
        chrome.tabs.reload(tab.id);

        // If this is the first one found, activate it.
        if (bring_to_foreground_flag && !found_existing_flag) {
          if (/https:\/\/(mail|inbox)\.google\.com/.test(tab.url)){

            if (install_or_update === 'install') {

              chrome.tabs.update(tab.id, {
                url : "https://mail.google.com?from_extension=gmail_url_previews#inbox?compose=new",
                active: true
              });
            } else {
              chrome.tabs.update(tab.id, {
                active: true
              });
            }
            found_existing_flag = true;
          }
        }
      });
    });

    // If no gmail tab found, just open a new one.
    if (bring_to_foreground_flag  && !found_existing_flag && install_or_update === 'install') {
      chrome.tabs.create({
        url : "https://mail.google.com?from_extension=gmail_url_previews#inbox?compose=new",
        active: true
      });
    }
  });
}


// register context menu.
addContextMenu();

// TODO: UNINSTALL URL for NOTES
chrome.runtime.setUninstallURL("https://www.cloudhq.net/uninstall_chrome_extension?product_what=gmail_url_previews");

