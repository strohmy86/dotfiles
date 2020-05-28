
  g_server_url          = "https://www.cloudhq.net/"

  function fn_load_manifest(next_step)
  {
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
  
  function fn_load_synch_status(email_or_login)
  {
    // load synch status
    $("#cloudHQ_synch_status").load(g_server_url + "main_gmail_bulk_forward/chrome_extension_status_popup", {
      'email_or_login': (!!email_or_login) ? email_or_login : '',
      'switch_login': '1'
    }, function() {
      var pending_count = $('#cloudHQ_synch_status #emails_pending_count').val() * 1;
      if (pending_count > 0) {
        window.setTimeout(function() {
          fn_load_synch_status(email_or_login);
        }, 8000);
      }
    });
  }

  /*chrome.tabs.onUpdated.addListener(function(tabId , info) {
    if (info.status == "complete") {

    }
  });*/
   
  $(document).ready(function() {
    fn_load_manifest(function() { 
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs[0];
        var email_or_login = null;
        if (tab && tab.url && tab.url.startsWith('https://mail.google.com/') && tab.status == "complete") {
          chrome.tabs.sendMessage(tab.id, { action: "getUserEmailAddress" }, function(email_or_login) {
            fn_load_synch_status(email_or_login);
          });
        } else {
          fn_load_synch_status();
        }
      });

    });
  }); 