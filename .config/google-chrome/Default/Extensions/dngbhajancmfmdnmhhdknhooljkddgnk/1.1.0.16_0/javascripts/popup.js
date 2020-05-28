
  g_server_url          = "https://www.cloudhq.net/"

  
  function fn_load_synch_status(email_or_login, tab_id)
  {
    // load synch status
    $("#cloudHQ_synch_status").load(g_server_url + "main_save_to_pdf/chrome_extension_status_popup", {
      'email_or_login': (!!email_or_login) ? email_or_login : '',
      'switch_login': '1'
    }, function() {
      var pending_count = $('#cloudHQ_synch_status #emails_pending_count').val() * 1;
      if (pending_count > 0) {
        window.setTimeout(function() {
          fn_load_synch_status(email_or_login, tab_id);
        }, 8000);
      }

      $('a.remove-download-url').click(function() {
        var a = $(this);
        var li = a.closest('li');
        var id = a.attr('data-download-url-id') * 1;
        li.html('Are you sure? ');
        confirm_el = $('<a id="remove-download-url-configm" style="color: white; cursor: pointer; font-weight: bold">Yes</a>');
        li.append(confirm_el);
        li.css({'background': 'none'});

        confirm_el.click(function() {
          $.ajax({
            type: "POST",
            url: g_server_url + "main_save_to_pdf/chrome_extension_remove_download_url/" + id,
            dataType: "json",
            data: { 'email_or_login': email_or_login, 'switch_login': '1' },
            async: true
          });
          li.fadeOut();
        });
      });

      if (tab_id) {
        $("#show_request_for_teams_dialog").show().click(function() {
          chrome.tabs.sendMessage(tab_id, { action: "showRequestForTeamsDialog" }, function() {
        
          });
        });
      }

    });
  }

  /*chrome.tabs.onUpdated.addListener(function(tabId , info) {
    if (info.status == "complete") {

    }
  });*/
   
  $(document).ready(function() {

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      var email_or_login = null;
      if (tab && tab.url && tab.url.startsWith('https://mail.google.com/') && tab.status == "complete") {
        chrome.tabs.sendMessage(tab.id, { action: "getUserEmailAddress" }, function(email_or_login) {
          fn_load_synch_status(email_or_login, tab.id);
        });
      } else {
        fn_load_synch_status();
      }
    });
  }); 