/**
 * 
 * Copyright (C) 2010-2015, cloudHQ 
 * All rights reserved.
 *
 */


function fn_is_early_adopter() {
  return true;
}

function fn_url_is_for_iframely_only(url) {

  var url_obj = null;

  try {
    url_obj = new URL(url);
  } catch(e) {}


  if ((url.indexOf("youtube.co") > -1) || // youtube
      (url.indexOf('https://cloudhq.net/c/') > -1) || 
      (url.indexOf('https://www.cloudhq.net/c/') > -1) || 
      (url.indexOf('https://www.cloudhq.net/screencast/') > -1) || 
      (url.indexOf('https://cloudhq.net/screencast/') > -1) || 
      (url.indexOf('https://www.cloudhq.net/screencast/') > -1) || 
      (url.indexOf('https://www.cloudhq.net/s/') > -1) || 
      (url.indexOf('https://www.cloudhq.net/watch/') > -1) || 
      (url.indexOf('https://cloudhq.net/watch/') > -1) || 
      (url.indexOf('https://cloudhq.net/meeting/') > -1) || 
      (url.indexOf('https://www.cloudhq.net/meeting/') > -1) || 
      (url.indexOf('https://chrome.google.com/webstore') > -1) || 
      (url.indexOf('google') > -1 && url.indexOf("/maps/") > -1) || // google maps
      (url.match(/twitter.com\/.*status/) != null)) { // twitter
    return true;
  }
  return false;
}


function fn_url_is_for_readibility_only(url) {

  var url_obj = null;

  try {
    url_obj = new URL(url);
  } catch(e) {}

  if ((url.indexOf('linkedin.co') > -1) || 
      (url.match(/\.amazon\.co/) != null) || 
      (url.match(/\/\/\.amazon\.co/) != null) ||
      (url.match(/\/\/blog.cloudhq/) != null) ||
      (url.match(/\/\/support.cloudhq/) != null) ||
      (url.match(/\/\/www.amazon\.co/) != null) ||
      (url.match(/\/\/docs.google.com/) != null) ||
      (url_obj && url_obj.hostname.match(/stackoverflow\.com/) != null) ||
      (url_obj && url_obj.hostname.match(/\.evernote\.com/) != null) ||
      (url_obj && url_obj.hostname.match(/\.google\..*/) != null && url.match(/\/\/.*\.google\..*\/search\?q=/) != null)) {
    return true;
  }
  return false;

}

function fn_get_state_from_local_storage(next_step) {
  try {
    console.log('gmail_url_previews:')
    chrome.storage.sync.get(g_key_for_local_storage, function (obj) {
      console.log("g_key_for_local_storage:obj:", obj);
      if (obj && obj[g_key_for_local_storage]) {
        if (typeof obj[g_key_for_local_storage]['g_do_not_show_gmail_url_previews_getting_started'] !== 'undefined') {
          g_do_not_show_gmail_url_previews_getting_started = obj[g_key_for_local_storage]['g_do_not_show_gmail_url_previews_getting_started'];
        }
        if (typeof obj[g_key_for_local_storage]['g_intention_to_gmail_url_previews'] !== 'undefined') {
          g_intention_to_gmail_url_previews = obj[g_key_for_local_storage]['g_intention_to_gmail_url_previews'];
        }
        if (typeof obj[g_key_for_local_storage]['g_cloudHQ_auto_preview'] !== 'undefined') {
          g_cloudHQ_auto_preview = obj[g_key_for_local_storage]['g_cloudHQ_auto_preview'];
        } 
        
        if (typeof obj[g_key_for_local_storage]['g_last_login_check_timestamp'] !== 'undefined') {
          g_last_login_check_timestamp = obj[g_key_for_local_storage]['g_last_login_check_timestamp'];
        }

        if (typeof obj[g_key_for_local_storage]['g_ignore_account_list'] !== 'undefined') {
          g_ignore_account_list = obj[g_key_for_local_storage]['g_ignore_account_list'];
        }
        
        if (typeof obj[g_key_for_local_storage]['g_do_not_show_getting_started'] !== 'undefined') {
          g_do_not_show_getting_started = obj[g_key_for_local_storage]['g_do_not_show_getting_started'];
        }

        g_cloudHQ_auto_preview = false;

        console.log('fn_get_state_from_local_storage: g_do_not_show_gmail_url_previews_getting_started=' + g_do_not_show_gmail_url_previews_getting_started);
        console.log('fn_get_state_from_local_storage: g_intention_to_gmail_url_previews=' + g_intention_to_gmail_url_previews);
        console.log('fn_get_state_from_local_storage: g_cloudHQ_auto_preview=' + g_cloudHQ_auto_preview);
      }
      if (next_step) {
        next_step();
      }
    });

  } catch(err) {
    g_do_not_show_gmail_url_previews_getting_started = true;
    g_intention_to_gmail_url_previews = false;
    g_cloudHQ_auto_preview = false;
    if (next_step) {
      next_step();
    }
  }

}
  
function fn_save_state_to_local_storage(next_step) {
  var data_to_store = {};
  data_to_store[g_key_for_local_storage] = { 
    'g_do_not_show_gmail_url_previews_getting_started': g_do_not_show_gmail_url_previews_getting_started,
    'g_intention_to_gmail_url_previews': g_intention_to_gmail_url_previews,
    'g_cloudHQ_auto_preview': g_cloudHQ_auto_preview,
    'g_last_login_check_timestamp': g_last_login_check_timestamp,
    'g_ignore_account_list' : g_ignore_account_list,
    'g_do_not_show_getting_started': g_do_not_show_getting_started
  };
  chrome.storage.sync.set(data_to_store, function() { 
    console.log('fn_save_state_to_local_storage: g_do_not_show_gmail_url_previews_getting_started=' + g_do_not_show_gmail_url_previews_getting_started);
    console.log('fn_save_state_to_local_storage: g_intention_to_gmail_url_previews=' + g_intention_to_gmail_url_previews);
    console.log('fn_save_state_to_local_storage: g_cloudHQ_auto_preview=' + g_cloudHQ_auto_preview);
    if (next_step) {
      next_step();
    }
  });

}

function fn_create_popup_for_toolbar_button(el, btn, options) {
  // if there is already a popup or there is a dialog do not show it.
  if ($('.popover').length > 0 || $('.inboxsdk__modal_fullscreen').length > 0) {
    return;
  }

  var h = 180;
  var w = 350;
  var html = $('<center></center>');
  
  $('<h3>'+ options.title + '</h3>').appendTo(html);
  $('<div style="color:#666">'+ options.text + '</div>').appendTo(html);
  $('<div class="T-I J-J5-Ji aoO T-I-atl L3" role="button" tabindex="1" style="-webkit-user-select: none;margin-top:15px">' + options.btn_text + '</div>').click(function() {
    options.btn_click.call(this);    
    popup.remove();
  }).appendTo(html);
  
  var popup = fn_create_popup(html, 'bottom').css({
    width : w + 'px',
    height : h + 'px',
    display: 'block'
  }).appendTo(el);
  
  function set_position() {
    popup.offset({
      top : btn.offset().top + btn.height() + 15,
      left : btn.offset().left - (w / 2) + (btn.width() / 2)
    });
  };

  set_position();

  $(window).resize(function() {
    set_position();
  });
  
}

function fn_create_popup(html, direction) {
  var popup = $('<div class="popover ' + direction + '"><div class="arrow"></div></div>');
  var btn_close = $('<div class="close">\&times;</div>').appendTo(popup).click(function() {
    popup.remove();
  });
  var content = $('<div class="popover-content"></div>').appendTo(popup);
  $(html).appendTo(content);
  return popup;
}

function fn_display_error_butter_bar() {        
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
  g_sdk.ButterBar.showMessage({ text:'Temporary Error. Please refresh your browser.', messageKey: 'cloudHQ_butter_1'});
}

function fn_close_misc_dialog() {
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
}

function fn_display_misc_dialog_prompt(text_dialog, dialog_title, input_text, callback) {
  console.log("sukhvir:fn_display_misc_dialog_prompt");
  var buttons = [{
    text: "  OK  ",
    string: "OK",
    type: 'PRIMARY_ACTION',
    onClick: function() { 
      modal_view.close();
      callback.call(this, input.val());
    }
  }, {
    text: "  Cancel  ",
    string: "CANCEL",
    onClick: function() {
      modal_view.close();
    }
  }];
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
  var el = $('<div id="div_for_misc_dialog" style="width: 450px; height: auto"></div>');
  var span = $('<p>' + text_dialog + '</p>');
  var input = $('<textarea rows="3" maxlength="512" style="width:100%" />');
  el.append(span);
  el.append(input);
  input.val(input_text || '');
  input.keyup(function(e) {
    if (e.keyCode == 13) {
      modal_view.close();
      callback.call(this, input.val());
    }
  });
  modal_view = g_sdk.Widgets.showModalView({
    el: el.get(0),
    title: dialog_title,
    buttons: buttons
  });
  $('.inboxsdk__modal_container .inboxsdk__button').css('min-width', '50px');
  g_misc_modal_view = modal_view;
  window.setTimeout(function() {
    input.focus();
  }, 100)
  return modal_view;
}

function fn_display_misc_dialog_confirm(text_dialog, dialog_title, callback) {
  console.log("sukhvir:fn_display_misc_dialog_confirm");
  var buttons = [{
    text: "  Yes  ",
    string: "YES",
    type: 'PRIMARY_ACTION',
    onClick: function() { 
      modal_view.close();
      callback.call(this, true);
    }
  }, {
    text: "  No  ",
    string: "NO",
    onClick: function() {
      modal_view.close();
      callback.call(this, false);
    }
  }];
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
  var el = $('<div id="div_for_misc_dialog" style="width: 500px; height: auto"></div>');
  el.append(text_dialog);
  modal_view = g_sdk.Widgets.showModalView({
    el: el.get(0),
    title: dialog_title,
    buttons: buttons
  });
  $('.inboxsdk__modal_container .inboxsdk__button').css('min-width', '50px');
  g_misc_modal_view = modal_view;
  return modal_view;
}

function fn_display_misc_dialog(text_dialog, dialog_title, text_butter, add_ok_button_flag) {
console.log("sukhvir:fn_display_misc_dialog");
  if (add_ok_button_flag) {
    buttons = [{
      text: "OK",
      string: "OK",
      onClick: function() { 
        modal_view.close();
      }
    }];
  } else {
    buttons = null;
  }
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
  var el = $('<div id="div_for_misc_dialog" style="width: 400px; height: auto"></div>');
  el.append(text_dialog);

  modal_view = g_sdk.Widgets.showModalView({
    el: el.get(0),
    title: dialog_title,
    buttons: buttons
  });
  if (text_butter) {
    g_sdk.ButterBar.showMessage({ text: text_butter, messageKey: 'cloudHQ_butter_1'});
  }
  g_misc_modal_view = modal_view;
  return modal_view;
}

function fn_show_inbox_modal(options) {
  console.log("sukhvir:fn_show_inbox_modal");
  var modal_view;
  options = $.extend({
    id : 'chq_dialog_' + (new Date().getTime()),
    title : 'cloudHQ',
    content : '',
    buttons : [],
    onButtonClicked: function(btn) { }
  }, options);
  var el = $('<div id="' + options.id + '" style="width: auto; height: auto"></div>');
  el.html(options['content']);
  var buttons = [];
  $.each(options['buttons'], function(e) {
    var button = this;
    if (button['action'] == 'SUBMIT') {
      button['onClick'] = function() {
        var selector = button.form_id ? ('#' + button.form_id) : 'form';
        var form = $('#' + options.id).find(selector);
        if (button['butter_message']) {
          g_sdk.ButterBar.showMessage({ text: button['butter_message'], messageKey: 'cloudHQ_butter_1'});
        } else if (button['modal_message']) {
          fn_display_misc_dialog('<div style="width: 400px"><center>' + button['modal_message'] + '</center></div>', '', null);
        }
        if (button.ajax == true) {
          fn_ajax({
            type: form.attr('method'),
            url: form.attr('action'),
            data: form.serialize(),
            success: function(res) {
              if (options && $.isFunction(options.ajaxSuccess)) {
                options.ajaxSuccess.call(this, button, res);
              }
            },
            failure: function(res) {
              if (options && $.isFunction(options.ajaxFailure)) {
                options.ajaxFailure.call(this, button, res);
              }
            }
          });
        } else {
          form.submit();
        }
        if (!button.manual_close) {
          modal_view.close();
        }
      };
    } else if (button['action'] == 'CLOSE_DIALOG') {
      button['onClick'] = function() {
        modal_view.close();
      };
    } else if (button['action'] == 'LINK') {
      button['onClick'] = function() {
        window.location = button['url'];
      };
    } else if (button['action'] == 'CALL') {
      button['onClick'] = function() {
        button['function_to_call']();
      };
    } else {
      button['onClick'] = function() {
        if (options.onButtonClicked) {
          options.onButtonClicked.call(modal_view, button);
        }
      };
    } 
    buttons.push(button);
  });
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
  modal_view = g_sdk.Widgets.showModalView({
    el : el.get(0),
    title : options['title'],
    buttons : buttons
  });
  return modal_view;
}

function fn_display_inbox_modal_info(modal_el, text, params) {
  console.log("sukhvir:fn_display_inbox_modal_info");
  var p = $.extend({
    timeout: 6000,
    color: '#666'
  }, params || {});
  var c = $(modal_el).closest('.inboxsdk__modal_content');
  var b = c.next('.inboxsdk__modal_buttons');
  var i = $('<span class="modal_buttons_text" style="float:right;font-size:12px;color:' + p['color'] + ';line-height: 29px"></span>');
  b.find('.modal_buttons_text').remove();  
  i.text(text);
  i.prependTo(b);
  window.setTimeout(function() {
    i.remove();
  }, p['timeout'] * 1);
}

function fn_get_gmail_current_path() {
  return decodeURIComponent(window.location.hash.substring(1)).replace(/^\//, '').replace(/\+/g, " ");
}

function fn_show_inbox_modal_for_signup(options) {  

  if($("#cloudHQ_signup_form").length > 0) {
    return;
  }
  var modal_view;
  options = $.extend({
    id : 'chq_dialog_' + (new Date().getTime()),
    title : 'cloudHQ',
    content : '',
    buttons : []
  }, options);
  var el = $('<div id="div_for_create_dialog" style="width: auto; height: auto"></div>');
  el.html(options['content']);
  var buttons = [];
  
  if (g_misc_modal_view) {
    try { g_misc_modal_view.close(); } catch(err) {}
  }
  modal_view = g_sdk.Widgets.showModalView({
    el : el.get(0)
  });

  $('#cloudHQ_signup_btn').click(function() {
    var form = $('#cloudHQ_signup_form');
    var consentCb = el.find('#checkbox_consent_terms_of_use');
    if (consentCb.length > 0) {
      if (!consentCb.is(':checked')) {
        alert('Please read and agree to our terms of use and privacy policy.');
        consentCb.closest('label').css('background', '#FFFBCC');
        return false;
      } else {
        form.find('[name="consent_terms_of_use"]').val('1');
      }
    }
    
    form.submit();
  });

  $('#cloudHQ_ignore_this_account_checkbox').unbind('click').bind('click', function(event) {
    if ($('#cloudHQ_ignore_this_account_checkbox').is(':checked')) {
      g_ignore_account_list.indexOf(g_email_or_login) === -1 ? g_ignore_account_list.push(g_email_or_login) : console.log("This item already exists");
      fn_save_state_to_local_storage(function() {
        modal_view.close();
      });
    }
  });

  return modal_view;

}

function fn_get_redirect_url(params) {
  var url = window.location.href;
  url = url.split(/[?#]/)[0];
  if (params) {
    var qs = [];
    $.each(params, function(key, value) {
      qs.push(key + "=" + encodeURIComponent(value));
    });
    url = url + "?" + qs.join('&');
  }
  url = url + window.location.hash;
  return url;
}

function fn_is_string_url(str) {
  var pattern = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
  if(!pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

function fn_check_login_and_signup_dialog_if_needed(next_step_logged_in, next_step_not_logged_in) {

  c_cmn.fn_log("fn_check_login_and_signup_dialog_if_needed: ENTERING");

  // trigger load of html page via ajax
  fn_ajax({
    type: "GET",
    url: g_server_url + "home_apps/chrome_extension_login_or_signup_dialog",
    dataType: "json",
    data: { 
      'email_or_login': g_email_or_login, 
      'switch_login': '1',
      'next_step_url': fn_get_redirect_url(),
      'what': g_cloudHQ_feature_name
    },
    async: true,
    success: function(response, t, x) { 
      if (response['status'] == 'OK') {
        g_logged_in = true;
        if (next_step_logged_in) {
          next_step_logged_in(response);
        }
      } else {
        if (next_step_not_logged_in) {
          next_step_not_logged_in(response);
        } else {
          fn_show_inbox_modal_for_signup(response);
        }
      }
    },
    error: function(response, t, x) { 
      g_fatal_error_flag = true;
      fn_display_error_butter_bar();
      if (next_step_not_logged_in) {
        next_step_not_logged_in(response);
      } else {
        fn_show_inbox_modal_for_signup(response);
      }
    }

  });

  c_cmn.fn_log("fn_check_login_and_signup_dialog_if_needed: EXITING");
}

function fn_show_referrals_dialog() {
  
  fn_display_misc_dialog('<div style="width: 300px"><center>Loading...</center></div>', '', null);

  fn_ajax({
    type: "GET",
    url: g_server_url + "main_share/chrome_extension_referrals_dialog",
    dataType: "json",
    data: { 'email_or_login': g_email_or_login },
    async: true,
    success: function(response, t, x) { 
      c_cmn.fn_log('fn_display_share_label_dialog: response:' + response);
      if (!response || (response && response['error'])) {
        fn_display_error_butter_bar();
      } else {
        g_sdk.ButterBar.hideMessage('cloudHQ_butter_1');
        fn_show_inbox_modal($.extend(response, {
          id: 'div_for_referrals_dialog',
          ajaxSuccess: function(button, res) {
            if (button.action == 'SUBMIT') {
              g_sdk.ButterBar.showMessage({ text: (res['msg'] || 'Invitation sent to friends!'), messageKey: 'cloudHQ_butter_1'});
              if (res['valid'] == 0) {
                window.setTimeout(fn_show_referrals_dialog, 1500);
              }
            }
          },
          ajaxFailure: function(button, res) {
            g_sdk.ButterBar.showMessage({ text:'Something went wrong! Please try again ...', messageKey: 'cloudHQ_butter_1'});
          }
        }));
        var email_suggestions = response['email_suggestions'] || [];
        var inputToken = $('#div_for_referrals_dialog #referrals_token_input').tokenInput(email_suggestions, {
          hintText: '',
          noResultsText: "",
          searchingText: "Enter email address",
          theme: 'gmail',
          preventDuplicates: true,
          animateDropdown: false,
          autoSelectFirstResult: true,
          tokenDelimiter: ',', // /,|\n/i,
          propertyToSearch: 'id',
          useCache: false,
          searchDelay: 100,
          resultsLimit: 5,
          resultsFormatter: function(item) {
            if (item.name == item.id) {
              return "<li><div>" + item.id + "</div></li>";
            } else {
              return "<li><div>" + item.name + "</div><div class=\"muted\">" + item.id + "</div></li>";
            }            
          },
          onResult: function (results) {
            function validateEmail(email) {
              var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
              return re.test(email);
            }            
            var val = $('#div_for_referrals_dialog #token-input-referrals_token_input').val();
            if(validateEmail(val)) {
              results.push({
                id: val,
                name: val
              });
            }
            return results;
          }
        });
      }
    },
    error: function(response, t, x) { 
      fn_check_login_and_signup_dialog_if_needed();
    }
  });
}

function fn_check_for_extension_toolbar_updates(sdk, cb) {
 
  if ($('html').attr('cloudhq__has_apps_toolbar_updates') != 'true') {
    $('html').attr('cloudhq__has_apps_toolbar_updates', 'true');
  } else {
    return;
  }

  $('<style>' + 
      '.cloudhq__app_iconImg > .inboxsdk__button_iconImg { position: relative; } ' +
      '.cloudhq__app_iconImg.cloudhq__app_iconImg_badge::after { content: \'1\'; -webkit-animation: cloudhq__app_iconImg_fadein 1s; background: #d11124; position: absolute; display: block; height: 12px; line-height: 12px; border-radius: 6px; color: white; padding: 0 3px; font-size: 9px; font-weight: bold; top: 0;right: 0;} ' +
      '@keyframes cloudhq__app_iconImg_fadein { from { opacity: 0; } to { opacity: 1; }}' +
      '.cloudHQ__apps_menu .cloudhq__apps_message { padding: 16px 26px 10px; } ' +
      '.cloudHQ__apps_menu .cloudhq__apps_message > a { color: #111;text-align: left;display: block;font-weight: 500;width: auto;border-radius: 3px; overflow: hidden;margin-bottom: 1em;white-space: pre-wrap;text-decoration: none; line-height: 1.27; -webkit-line-clamp: 2; -webkit-box-orient: vertical;} ' + 
      '.cloudHQ__apps_menu .cloudhq__apps_message > a:hover { background: #FFFACD !important } ' +
      '.cloudHQ__apps_menu .cloudhq__apps_message.cloudhq__apps_highlighted_message > a { background: #FFFACD; } ' +
      '.cloudHQ__apps_menu .cloudhq__apps_message .cloudHQ__apps_menu_sep { margin-bottom: -1em !important; }' +
    '</style>')
  .appendTo($('head'));

  var updates_url = g_server_url + "chrome_extensions_menu_updates?email_or_login=" + encodeURIComponent(g_email_or_login);

  fn_ajax({
    type: "GET",
    url: updates_url,
    dataType: "json",
    async: true,
    success: function(resp, t, x) {
      if(resp && resp.success) {
        var item = resp.items[0];
        if (item) {
          c_cmn.fn_delayed_conditional_execute({
            poll_delay: 1000,
            max_poll_attempts: 10,
            retry_message: null,
            condition: function () {
              var pass = false;
              var is_new = !!item.is_new;
              $('.cloudhq__app_iconImg').each(function(i, val) {
                var t = $(this).toggleClass('cloudhq__app_iconImg_badge', is_new);
                var title = $('<div />').html(item.title).text();
                t.click(function() {
                  window.setTimeout(function() {
                    t.removeClass('cloudhq__app_iconImg_badge');
                    var m = $('<div class="cloudhq__apps_message" />')
                      .append($('<a />')
                        .attr('href', item.url)
                        .attr('target', '_blank')
                        .html(item.title.replace(/New!/gi, '<b>New!</b>')))
                      .append('<div class="cloudHQ__apps_menu_sep"></div>')
                      .toggleClass('cloudhq__apps_highlighted_message', is_new)
                      .prependTo('.cloudHQ__apps_menu');
                    // touch
                    if (is_new) {
                      fn_post(updates_url + "&touch=1");
                    }
                  });                 
                });
                pass = true;
              });
              return pass;
            },
            continuation: function() {
              return true;
            }
          });
        }
      }
    }
  });

}

function fn_create_extension_toolbar(sdk, cb) {

  var tb = null;
  
  if ($('html').attr('cloudhq__has_apps_toolbar') != 'true') {
    $('html').attr('cloudhq__has_apps_toolbar', 'true');
  } else {
    return;
  }

  $('<style>' + 
      '.inboxsdk__appButton { line-height: 32px; }' +
      '.cloudhq__app_iconImg > .inboxsdk__button_iconImg { height: 32px; width: 32px; vertical-align: middle; margin-top: -2px; }' + 
    '</style>')
  .appendTo($('head'));

  var loading = false;
  var loaded_html = '';
  var dd_el;

  function init(el, html) {
    el.html(html);
    el.find('#cloudHQ__apps_menu_show_more').click(function() {
      $(this).remove();
      el.find('.cloudHQ__apps_menu').addClass('has_more');
      el.find("#cloudHQ__apps_menu_show_even_more").css({position: 'relative', 'background': 'none'});
      el.find('.cloudHQ__apps_menu').animate({
        scrollTop: el.find(".cloudHQ__apps_menu_sep").offset().top - 50
      }, 750);
    });
  }

  fn_ajax({
    type: "GET",
    url: g_server_url + "chrome_extensions_menu"+ 
                        "?email_or_login=" + encodeURIComponent(g_email_or_login) + 
                        "&switch_login=1",
    dataType: "html",
    async: true,
    success: function(resp, t, x) {
      loaded_html = resp;
      if (dd_el) {
        init(dd_el, loaded_html);
      }
    }
  });

  tb = sdk.Toolbars.addToolbarButtonForApp({
    iconUrl: 'https://www.cloudhq.net/images/cHQ_64x64_o.png',
    iconClass: 'cloudhq__app_iconImg',
    onClick: function(e) {
      var dd = e.dropdown;
      dd_el = $(dd.el);
      dd_el.css({
        "width": "335px"
      });
      init(dd_el, loaded_html);
    }
  });

  c_cmn.fn_delayed_conditional_execute({
    poll_delay: 100,
    max_poll_attempts: 10,
    retry_message: null,
    condition: function () {
      var pass = false;
      $('.cloudhq__app_iconImg').each(function(i, val) {
        $(this).closest('.inboxsdk__appButton').attr('title', 'cloudHQ Gmail Apps');
        pass = true;
      });
      return pass;
    },
    continuation: function() {
      return true;
    }
  });
}

function fn_pre_user_check() {
  try {

    var check_flag_key = g_email_or_login + g_cloudHQ_feature_name + "_pre_check_flag";
    var pre_user_check_key = false;

    var check_obj_key = g_email_or_login + g_cloudHQ_feature_name + "_pre_check_obj"; 
    var timestamp = new Date().getTime();
    var pre_user_check_new_obj = {value: "true", timestamp: new Date().getTime()}

    var data_to_store = {};
    data_to_store[check_obj_key] = pre_user_check_new_obj;

    // use new one
    chrome.storage.local.get(check_obj_key, function(result) {
      if (!result || !result[check_obj_key] || result[check_obj_key]['timestamp'] < g_two_weeks_ago_timestamp) {

        try {
          var email_switcher_list = [];
          $.each(g_sdk.User.getAccountSwitcherContactList(), function(index, account) {
            email = account['emailAddress'];
            email_switcher_list.push(email);
          });
          fn_ajax({
            type: "POST",
            url: g_server_url + "main_pre_user/check",
            dataType: "json",
            data: {
              'email': g_email_or_login,
              'email_switcher_list': email_switcher_list,
              'email_or_login': g_email_or_login, 
              'chrome_extension_name': g_cloudHQ_feature_name,
              'switch_login': '1',
            },
            complete: function(xhr, data){
              //check if there is no serious error while checking
              if(["error", "timeout", "abort"].indexOf(data) === -1) {
                //if no error set the localStorage variable
                try { chrome.storage.local.set(data_to_store, function() {}); } catch (err) {}
              }
            }
          });
        } catch(e) {
        }
      }
    
    });
  } catch(e) {
    console.log('precheck failed e=', e);
  }
}

function fn_create_screen_dialog(element) {
  var overlayElement = $('<div class="chq-screenshot-overlay"></div>').appendTo('body');
  var wrapperElement = $('<div class="chq-screenshot-wrapper" style="padding:25px;text-align:center"></div>').appendTo(overlayElement);
  element.css({ 'min-width': '100%', 'min-height': '100%' });
  wrapperElement.html(element);
  return {
    close: function() {
      overlayElement.remove();
    }
  }
}

function fn_register_message_listeners() {

  window.addEventListener('message', function(event) {

    var origin  = event.origin;
    var message = event.data;

    if (message.type && (message.type === 'CHQ_IMAGE_EDITOR_SAVE')) {
      var image = message.blob_image;
      $('.chq-screenshot-overlay').remove();
      var compose_view = g_gmail_web_clipper_compose_view;
      var draft_id = g_gmail_web_clipper_draft_id;
      compose_view.attachInlineFiles([image]);
    }

    if (message.type && (message.type === 'CHQ_IMAGE_EDITOR_CLOSE')) {
      $('.chq-screenshot-overlay').remove();
    }

  });
}

function fn_handle_cloudHQ_simulateClick(ele) {
  var evt = document.createEvent("MouseEvents");
  evt.initMouseEvent("click", true, true, window,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
  //var a = ;
  ele.dispatchEvent(evt);
}

function fn_simulate_key_press(el, which) {
   $(el).trigger($.Event('keypress', { keycode: which }));
}

function fn_replace_url_preceding_caret(containerEl, replace_with, url) {
  var preceding = "",
    sel,
    range,
    precedingRange;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      range.setStart(containerEl, 0);
      preceding = range.toString();
    }
  } else if ((sel = document.selection) && sel.type != "Control") {
    range = sel.createRange();
    precedingRange = range.duplicate();
    precedingRange.moveToElementText(containerEl);
    precedingRange.setEndPoint("EndToStart", range);
    preceding = precedingRange.text;
  }

  var words = range.toString().trim().split(' '),
    lastWord = words[words.length - 1];
  
  //sometimes it still contains space
  if(lastWord.indexOf(" ") > -1) {
    var temp = lastWord.split(" ");
    lastWord = temp[temp.length - 1];
  }

  if (lastWord && lastWord.trim() === url.trim()) {
    var resultValue = replace_with; // this value is coming from some other function
    if (resultValue == lastWord) {
      // do nothing
    } else {
      
      /* Find word start and end */
      var wordStart = range.endContainer.data.lastIndexOf(lastWord);
      var wordEnd = wordStart + lastWord.length;
      
      range.setStart(range.endContainer, wordStart);
      range.setEnd(range.endContainer, wordEnd);
      range.deleteContents();
      range.insertNode(document.createTextNode(resultValue));
      // delete That specific word and replace if with resultValue

      /* Merge multiple text nodes */
      containerEl.normalize();
    }
    return lastWord;
  }
}

function fn_handle_paste_link(e) {
  if (e && e.clipboardData && e.clipboardData.types.length >= 1) {
    var text = $.trim(e.clipboardData.getData("text/plain"));
    if (text && text !== '' && fn_is_string_url(text)) {
      var target = e.target;
      if (target.isContentEditable) {

        e.preventDefault();

        setTimeout(function () {
          //sometimes e.preventDefault() does not work and url is pasted, we should remove that url, as we are already going to call "createLink" event to create anchor tag from that url
          try {
            var selection = window.getSelection();
            var is_link = false;
            
            if (selection.anchorNode) {
              // remove everything
              selection.getRangeAt(0).startContainer.parentNode = text;
              fn_replace_url_preceding_caret(selection.anchorNode, '', text);
            }
          } catch (err) {
            console.log('fn_replace_url_preceding_caret error=', err);

          }
          //end

          document.execCommand("createLink", false, text);
          try {
            var selection = window.getSelection();
            var range = selection.getRangeAt(0);
            range.collapse(false);

          }
          catch (err) {
            console.log('error=', err);
          }

        }, 10);
        
        return false;

      }
    }
  }
  return true;
}

function fn_handle_cloudHQ_composer_view(compose_view) {
  
  setTimeout(function(){
    fn_register_cloudHQ_track_email_links(compose_view);
  }, 500);
    
  if (window.location.href.match('from_extension=gmail_url_previews') && !g_do_not_show_gmail_url_previews_getting_started) {
      
      g_do_not_show_gmail_url_previews_getting_started = true;
      fn_save_state_to_local_storage();

      // make some text here
      compose_view.insertHTMLIntoBodyAtCursor("Hi there,<br/><br/>");
      compose_view.insertHTMLIntoBodyAtCursor("To insert preview or full content of a web page, just paste a URL into your email compose view, click on it, then click on 'Add preview' or 'Add content'. The 'Add preview' will generate just a small preview of the page, while 'Add content' will generate a full content of the page. <br/>As shown here: <br/><img style='height: 180px; border: 1px solid ' src='https://s3.amazonaws.com/cloudhq-image-share/d059d47afa.png'/>. "+ 
        "<br/><br/>" + 
        "So let's try this link - click on 'Add content': <a href='https://blog.cloudhq.net/new-send-visually-appealing-url-link-previews-in-gmail/'>https://blog.cloudhq.net/new-send-visually-appealing-url-link-previews-in-gmail/</a>"+
        "<br/><br/>"+
        "Here are some examples to try:<br/>"+ 
        "<ol>" +
        "<li>News articles: <a href='https://www.huffingtonpost.com/entry/futurist-naomi-assaraf-on-virtual-reality-self-driving_us_5a1b45f0e4b0250a107c0098'>https://www.huffingtonpost.com/entry/futurist-naomi-assaraf-on-virtual-reality-self-</a><br/><br/></li>" + 
        "<li>Support notes: <a href='https://support.cloudhq.net/how-to-troubleshoot-google-chrome-extensions/'>https://support.cloudhq.net/how-to-troubleshoot-google-chrome-extensions/</a><br/><br/></li>" + 
        "<li>YouTube videos: <a href='https://www.youtube.com/watch?v=KB6Xlj5KRZY'>https://www.youtube.com/watch?v=KB6Xlj5KRZY</a><br/><br/></li>" + 
        "<li>Amazon Products: <a href='https://www.amazon.com/dp/B06XDSDNJJ/'>https://www.amazon.com/dp/B06XDSDNJJ</a><br/><br/></li>" +
        "<li>Tweets: <a href='https://twitter.com/NistleRealtor/status/1040698070579597312'>https://twitter.com/NistleRealtor/status/1040698070579597312</a><br/><br/</li>" +
        "<li>And more... </li>" +
        "</ol>" +
        "<br/>");
      compose_view.insertHTMLIntoBodyAtCursor("Cheers,<br/><br/>");
      compose_view.insertHTMLIntoBodyAtCursor("cloudHQ");
      compose_view.setSubject("Automatically add website previews directly in Gmail compose");
      compose_view.setFullscreen(true);
  }

  c_cmn.fn_log("fn_handle_cloudHQ_composer_view: EXITING");
}


function fn_cloudHQ_check_pause_in_detection() {
  /*pause url detection for some time, so that code does not accidently tries to detect same url twice*/
  console.log("g_cloudHQ_pause_for_url_check:", g_cloudHQ_pause_for_url_check);
  if(g_cloudHQ_pause_for_url_check === true) {
    return false;
  } else {
    g_cloudHQ_pause_for_url_check = true;
    setTimeout(function(){
      g_cloudHQ_pause_for_url_check = false;
    },500);
    return true;
  }
  /*end*/
}

function fn_cloudHQ_check_if_plain_mode_for_current_compose_window(body_element){
  g_cloudHQ_text_mode = false;
  console.log('$(body_element).parents(".inboxsdk__compose"):', $(body_element).parents(".inboxsdk__compose"));
  $(body_element).parents(".inboxsdk__compose").find('[role="menuitemcheckbox"]').each(function(){
    if($(this).text() === "Plain text mode" && $(this).attr('aria-checked') == 'true'){
      g_cloudHQ_text_mode = true;
    }
  });
}

function fn_register_cloudHQ_track_email_links(compose_view) {
  var content_el = $(compose_view.getBodyElement());
  var composer_el = content_el.closest('.inboxsdk__compose');

  function render_link_toolbar() {
    var div = $('#tr_link-div');
    if (div.length > 0 && div.find(".tr_chq_add_preview").length === 0) {
      var link_el = div.find('#tr_test-link');
      var link_text = link_el.text() + '';
      var link_text_regexp = new RegExp(link_text.replace('....', '__ANY_STRING__').replace('...', '__ANY_STRING__').replace(/([.*+?^=!:${}()|\[\]\/\\-])/g, "\\$1").replace('__ANY_STRING__', '.*'));
      var link_url = link_text;
      var changediv = div.find('span').get(3);

      console.log("link_text=", link_text, ' link_text_regexp', link_text_regexp);
      
      // find the link which matches this - maybe it is not same but oh well...
      // actually selection should give us the clue?
      // wind
      try {
        var body_link_el = $(window.getSelection().anchorNode).closest('a');
        if (body_link_el && body_link_el.length > 0 && body_link_el.attr('href')) {
          link_url = body_link_el.attr('href') + '';
        }
      } catch(err) {}

      var link_toolbar = $('<div style="user-select: none;margin-top: 4px;padding-top: 6px;border-top: 1px solid #ddd;"></div>').appendTo(div);
      if (fn_url_is_for_readibility_only(link_url)) {
        $('<span class="Lh HN02Se" tabindex="0" role="link" data-preview="content" style="color: gray; text-decoration: none; user-select: none;font-weight:600">Add preview</span>').appendTo(link_toolbar);
        $('<span class="a5u" style="user-select: none;">|</span>').appendTo(link_toolbar);
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="content" style="user-select: none;font-weight:600">Add content</span>').appendTo(link_toolbar);
        $('<span class="a5u" style="user-select: none;">|</span>').appendTo(link_toolbar);
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="screenshot" style="user-select: none;font-weight:600">Add screenshot</span>').appendTo(link_toolbar);
      } else if (fn_url_is_for_iframely_only(link_url)) {
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="preview" style="user-select: none;font-weight:600">Add preview</span>').appendTo(link_toolbar);
        $('<span class="a5u" style="user-select: none;">|</span>').appendTo(link_toolbar);
        $('<span class="Lh HN02Se" tabindex="0" role="link" data-preview="preview" style="color: gray; text-decoration: none; user-select: none;font-weight:600">Add content</span>').appendTo(link_toolbar);
        $('<span class="a5u" style="user-select: none;">|</span>').appendTo(link_toolbar);
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="screenshot" style="user-select: none;font-weight:600">Add screenshot</span>').appendTo(link_toolbar);
      }
      else {
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="preview" style="user-select: none;font-weight:600">Add preview</span>').appendTo(link_toolbar);
        $('<span class="a5u" style="user-select: none;">|</span>').appendTo(link_toolbar);
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="content" style="user-select: none;font-weight:600">Add content</span>').appendTo(link_toolbar);
        $('<span class="a5u" style="user-select: none;">|</span>').appendTo(link_toolbar);
        $('<span class="Lh HN02Se tr_chq_add_preview" tabindex="0" role="link" data-preview="screenshot" style="user-select: none;font-weight:600">Add screenshot</span>').appendTo(link_toolbar);
      }

      div.find('.tr_chq_add_preview').click(function() {
        var foundthatelement = false;
        var preview = $(this).attr('data-preview') === 'preview';
        var screenshot = $(this).attr('data-preview') === 'screenshot';
        var content = $(this).attr('data-preview') === 'content';

        var body_link_el = $(window.getSelection().anchorNode).closest('a');

        if (body_link_el && body_link_el.length > 0 && body_link_el.attr('href')) {

          var this_link = body_link_el.attr('href') + '';
          
          console.log("link_text=", link_text, ' this_link', this_link);

          if ($(body_link_el).closest('[data_collected_url]').length > 0) {

            console.log("SKIP CONTENT EDIABLE FALSE link_text=", link_text, ' link_text_regexp=', link_text_regexp, ' this_link', this_link);

          } else {

            console.log("MATCH link_text=", link_text, ' link_text_regexp=', link_text_regexp, ' this_link', this_link);
            try { $(body_link_el).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_received_error/g, ''); }); } catch(e) {}
            try { $(body_link_el).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_showing_as_url/g, ''); }); } catch(e) {}
            try { $(body_link_el).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_auto_preview_off/g, ''); }); } catch(e) {}
            try { $(body_link_el).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_checking_url/g, ''); }); } catch(e) {}
            try { $(body_link_el).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_already_requested/g, ''); }); } catch(e) {}
            $(body_link_el).removeClass('cloudHQ__webclip_target_auto_preview_off').removeClass('cloudHQ__webclip_target_showing_as_url').removeClass('cloudHQ__webclip_target_received_error').addClass('cloudHQ__webclip_target_checking_url'); 

            fn_cloudHQ_set_border_bottom_for_progress_view_and_set_web_clips_for_urls(content, preview, screenshot);
            foundthatelement = true;
          }
        } else {

          // selection is not working - do the scan

          var bodyelem = compose_view.getBodyElement();
          $(bodyelem).find("a").each(function(){
            
            var this_link = $(this).attr('href') + '';
            
            console.log("link_text=", link_text, ' link_text_regexp=', link_text_regexp, ' this_link', this_link);

            if ($(this).closest('[data_collected_url]').length > 0) {

              console.log("SKIP CONTENT EDIABLE FALSE link_text=", link_text, ' link_text_regexp=', link_text_regexp, ' this_link', this_link);
            } else {

              if (this_link.match(link_text_regexp) && foundthatelement === false){
                console.log("MATCH link_text=", link_text, ' link_text_regexp=', link_text_regexp, ' this_link', this_link);
                try { $(this).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_received_error/g, ''); }); } catch(e) {}
                try { $(this).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_showing_as_url/g, ''); }); } catch(e) {}
                try { $(this).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_auto_preview_off/g, ''); }); } catch(e) {}
                try { $(this).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_target_checking_url/g, ''); }); } catch(e) {}
                try { $(this).attr('class', function(i, c){ return c.replace(/(^|\s)\S+cloudHQ__webclip_already_requested/g, ''); }); } catch(e) {}
                $(this).removeClass('cloudHQ__webclip_target_auto_preview_off').removeClass('cloudHQ__webclip_target_showing_as_url').removeClass('cloudHQ__webclip_target_received_error').addClass('cloudHQ__webclip_target_checking_url'); 

                fn_cloudHQ_set_border_bottom_for_progress_view_and_set_web_clips_for_urls(content, preview, screenshot);
                foundthatelement = true;
              }
            }
          });
        }

        if(foundthatelement === false) {
          g_sdk.ButterBar.showMessage({ text:'The URL is inside generated preview', messageKey: 'cloudHQ_butter_gmail_url_previews_1'});
        }

          
        div.closest('.a5s').hide();
      });
    }
  };

  if (content_el.length > 0) {
    content_el.mouseup(function() { window.setTimeout(render_link_toolbar, 0); });
    content_el.keyup(function() { window.setTimeout(render_link_toolbar, 300); });
  }
}

function fn_cloudHQ_set_web_clip_for_urls(content, preview, screenshot) {
  
  var called_a_url = false;
  $("[class*=cloudHQ__webclip_target_checking_url]").each(function () {
    if ($(this).attr('class').indexOf("cloudHQ__webclip_already_requested") === -1) {
      $(this).addClass('cloudHQ__webclip_already_requested');
      $(this).removeClass('cloudHQ__webclip_target_received_error');

      var url = $(this).attr('href') + '';
      var curr_element = $(this);
      var clipping_url = false;
      
      if($(curr_element).attr('contenteditable') == "false" || (typeof $(curr_element).attr('class') !== 'undefined' && ($(curr_element).attr('class').indexOf("cloudHQ__webclip_target_received_error") > -1 || $(curr_element).attr('class').indexOf("cloudHQ__webclip_target_showing_as_url") > -1))){
        clipping_url = true;
      } else if($(curr_element).length > 0 && $(curr_element).parent().length > 0 && ($(curr_element).parent().attr('contenteditable') == "false" || (typeof $(curr_element).parent().attr('class') !=='undefined' && ($(curr_element).parent().attr('class').indexOf("cloudHQ__webclip_target_received_error") > -1 || $(curr_element).parent().attr('class').indexOf("cloudHQ__webclip_target_showing_as_url") > -1)))) {
        clipping_url = true;
      } 
      
      if (url !== '' && called_a_url === false && fn_cloudHQ_test_for_url_existence(url) && clipping_url === false) {
        if(url.indexOf("http") === -1){
          url = "http://" + url;
        }
      
        called_a_url = true;

        if (preview === true) {
          chrome.runtime.sendMessage(chrome.runtime.id, {type: "CHQ_GET_IFRAMELY_PREVIEW", 'url': url}, function (json) {
            g_sdk.ButterBar.hideMessage('cloudHQ_butter_gmail_url_previews_1');
            fn_cloudHQ_generate_webclip_html_from_iframely(json, curr_element, url);
          });
        } else {
          chrome.runtime.sendMessage(chrome.runtime.id, {type: "CHQ_CLIP_WEB_CONTENT_FROM_TAB", 'url': url, 'screenshot': screenshot}, function (json) {
            console.log("json:", json);
            if (json && json.url !== '' && json.contentText == 'check_clipboard' ) {
              range = document.createRange();
              range.selectNodeContents($(curr_element).get(0));
              sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
              range.collapse(false);

              document.execCommand('paste');
              fn_cloudHQ_generate_webclip_html_from_readability(json, curr_element);
            } else if (json && json.url !== '') {
              g_sdk.ButterBar.hideMessage('cloudHQ_butter_gmail_url_previews_1');
              fn_cloudHQ_generate_webclip_html_from_readability(json, curr_element);
            } else {

              g_sdk.ButterBar.hideMessage('cloudHQ_butter_gmail_url_previews_1');
              chrome.runtime.sendMessage(chrome.runtime.id, {type: "CHQ_GET_IFRAMELY_PREVIEW", 'url': url }, function (json) {
                g_sdk.ButterBar.hideMessage('cloudHQ_butter_gmail_url_previews_1');
                fn_cloudHQ_generate_webclip_html_from_iframely(json, curr_element, url);
              });
            }
          });
        }
      } else {
        g_sdk.ButterBar.hideMessage('cloudHQ_butter_gmail_url_previews_1');
        fn_cloudHQ_remove_requesting_underline(curr_element);
      }
    }
  });
}

function fn_cloudHQ_remove_requesting_underline(curr_element) {
  var class_splt = $(curr_element).attr('class').split(" ");
  for (var i = 0; i < class_splt.length; i++) {
    if (class_splt[i].trim().indexOf('cloudHQ__webclip_already_requested')) {
      $(curr_element).removeClass(class_splt[i]);
    } else if (class_splt[i].trim().indexOf('cloudHQ__webclip_target_checking_url')) {
      $(curr_element).removeClass(class_splt[i]);
      $(curr_element).removeAttr('style');
      $(curr_element).addClass('cloudHQ__webclip_target_received_error');
    }
  }
}

function fn_cloudHQ_generate_webclip_html_from_iframely(json, curr_element, url) {
  console.log("json:youtube:", json);
  var main_table = fn_cloudHQ_get_main_table_of_web_clip_table("iframely", url);
  var main_tr = fn_cloudHQ_get_main_tr_of_web_clip_table();
  var main_td = fn_cloudHQ_get_main_td_of_web_clip_table();

  var second_table = $('<table class="cloudHQ__second_table" cellpadding=0 cellspacing=0 border=0 style="border-collapse:collapse;width:100%;text-align:left"></table>');

  var img_src = null;

  if (json && json['screenshot_href']) {
    img_src = json['screenshot_href'];
  } else if (json && json['links'] && json['links']['thumbnail'] && json['links']['thumbnail'][0] && json['links']['thumbnail'][0]['href_with_play']) {
    img_src = json['links']['thumbnail'][0]['href_with_play'];
  } else if (json && json['links'] && json['links']['thumbnail'] && json['links']['thumbnail'][0] && json['links']['thumbnail'][0]['href']) {
    img_src = json['links']['thumbnail'][0]['href'];
  }

  if (img_src !== null) {
    var second_tr = $('<tr></tr>');
    var second_td = $('<td style="padding-bottom:6px"></td>');
    var image_a = $('<a href="' + url + '" target="_blank" class="video"></a>');
    if(url.indexOf('google') > -1 && url.indexOf("/maps/place")){
      img_src = img_src.replace("?center=","?markers=");
      img_src = img_src.replace("size=600x450","size=400x300&scale=2");
    }
    var image = $('<img src="' + img_src + '" width="558" style="display:block;width:100%;min-width:100%;max-width:100%;vertical-align:top" alt="Preview image" />');

    image_a.append(image);
    second_td.append(image_a);
    second_tr.append(second_td);
    second_table.append(second_tr);
  }

  var ret_title = null;
  if (json && json['meta'] && json['meta']['title']) {
    ret_title = json['meta']['title'];

    var title_tr = $('<tr></tr>');
    var title_td = $('<td style="min-width:100%;padding-top:6px;padding-bottom:6px;line-height:26px;font-weight:600;font-size:18px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"></td>');

    title_td.append(ret_title);
    title_tr.append(title_td);
    second_table.append(title_tr);
  }
  
  if (json && json['meta'] && json['meta']['description']) {
    var ret_description = json['meta']['description'];

    var description_tr = $('<tr></tr>');
    var description_td = $('<td style="min-width:100%;padding-top:6px;padding-bottom:6px;line-height:16px;font-weight:normal;font-size:13px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"></td>');
    var description_a = $('<a href="' + url + '" target="_blank" class="title" style="text-decoration:none;display:block;color:#333;border:none">' + ret_description + '</a>');

    description_td.append(description_a);
    description_tr.append(description_td);
    second_table.append(description_tr);
  }

  if (json && json['html_content']) {
    var ret_description = json['html_content'];

    var description_tr = $('<tr></tr>');
    var description_td = $('<td style="min-width:100%;padding-top:6px;padding-bottom:6px;line-height:16px;font-weight:normal;font-size:13px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"></td>');
    var description_a = $('<a href="' + url + '" target="_blank" class="title" style="text-decoration:none;display:block;color:#333;border:none">' + ret_description + '</a>');

    description_td.append(description_a);
    description_tr.append(description_td);
    second_table.append(description_tr);
  }

  var bottom_tr = fn_cloudHQ_get_bottom_tr_of_webclip(url);
  second_table.append(bottom_tr);
  
  main_td.append(second_table);
  main_tr.append(main_td);
  main_table.append(main_tr);
  
  var main_div = $("<div></div>");
  main_div.append(main_table);

  var br = $('<br />');
  $(curr_element).after(br);
  br.after(main_div);
  main_div.after('<br />');

  fn_cloudHQ_remove_requesting_underline(curr_element);
  
}

function fn_cloudHQ_get_main_table_of_web_clip_table(data_collected_from, url) {
  var main_table = $('<table data_collected_from="'+data_collected_from+'" data_collected_url="'+url+'" cellpadding=0 cellspacing=0 style="color:rgb(51,51,51);border:0px solid #f5ffff; border-radius:4px; width:98%; max-width:578px; mso-border-alt: none;"></table>');
  main_table.addClass("cloudHQ__webclip_target_completed");
  return main_table;
}

function fn_cloudHQ_get_main_tr_of_web_clip_table() {
  var main_tr = $('<tr style="border:0px solid #d5ecff; mso-border-alt:none; display:block; border-radius: 3px;"></tr>');
  return main_tr;
}

function fn_cloudHQ_get_main_td_of_web_clip_table() {
  var main_td = $('<td class="cloudHQ__main_td" style="display:block;padding:0px;border-radius:2px;border:0px solid #99b0e1;font-size:1em;vertical-align:top;background-color:white"></td>');
  return main_td;
}

function fn_cloudHQ_get_bottom_tr_of_webclip(mainurl) {
  const url = document.createElement('a');
  //  Set href to any path
  url.setAttribute('href', mainurl);

  var bottom_tr = $('<tr ></tr>');
  var bottom_td = $('<td class="cloudHQ__bottom_td" style="line-height:11px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"></td>');

  var icon_table = $('<table class="cloudHQ__bottom_table" cellpadding=0 cellspacing=0 border=0 style="width:100%; padding-left: 3px; padding-bottom: 5px; padding-right: 3px"></table>');
  var icon_tbody = $('<tbody></tbody>');
  var icon_tr = $('<tr></tr>');
  if (typeof url.hostname !== 'undefined' && url.hostname !== null && url.hostname !== '') {
    var domain_td = $('<td style="color:darkgray;text-align:left;line-height:11px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"><a href="' + mainurl + '" style="color:#aab;display:block;font-size:9px;margin:0;letter-spacing:1px;padding-left:1px;text-decoration:none;text-transform:uppercase">' + url.hostname.toUpperCase() + '&nbsp;<br/>'+new Date().toLocaleString()+'&nbsp;</a></td>');
    icon_tr.append(domain_td);
  }

  var install_url = "https://chrome.google.com/webstore/detail/url-link-preview/cdmmpngppebpilcajoikplkjbelbimim";
  icon_tr.append('<td style="position:relative;text-align:right;line-height:11px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'" align="right" valign="bottom"><a href="' + install_url + '" style="color:#aab;display:block;font-size:9px;margin:0;letter-spacing:1px;padding-left:1px;text-decoration:none;text-transform:uppercase">Generated by <br/>Gmail URL Link Preview by cloudHQ</a></td>');
  icon_tbody.append(icon_tr);
  icon_table.append(icon_tbody);
  bottom_td.append(icon_table);
  bottom_tr.append(bottom_td);
  return bottom_tr;
}

function fn_cloudHQ_generate_webclip_html_from_readability(json, curr_element) {

  console.log("in json:", json);
  var main_table = fn_cloudHQ_get_main_table_of_web_clip_table("readability", json.url);

  var main_tbody = $("<tbody></tbody>");
  main_table.append(main_tbody);

  var main_tr = fn_cloudHQ_get_main_tr_of_web_clip_table();
  var main_td = fn_cloudHQ_get_main_td_of_web_clip_table();

  var second_table = $('<table cellpadding=0 cellspacing=0 border=0 style="border-collapse:separate;text-align:left"></table>');
  var second_tbody = $('<tbody class="cloudHQ__second_tbody"></tbody>');
  var second_tr = $('<tr class="cloudHQ__second_tr"></tr>');
  var img_table = $('<table cellpadding=0 cellspacing=0 border=0 style="border-collapse:separate"></table>');
  var img_tbody = $('<tbody class="cloudHQ__image_tbody"></tbody>');

  // add image
  if (typeof json.metadata !== 'undefined' && typeof json.metadata.image !== 'undefined' && typeof json.metadata.image.url !== 'undefined') {
    var img_tr = $('<tr></tr>');
    var img_td = $('<td valign="top"></td>');

    var img_a = $('<a href="' + json.url + '" target="_blank" style="display:block"></a>');
    var img = $('<img src="' + json.metadata.image.url + '" alt="Preview image" width="558" style="display:block;vertical-align:top" />');

    img_a.append(img);
    img_td.append(img_a);
    img_tr.append(img_td);
    img_tbody.append(img_tr);
    img_table.append(img_tbody);
    main_td.append(img_table);

  }
  

  if (typeof json.title !== 'undefined' && json.title !== '') {
    var detail_top_td = $('<td class="cloudHQ__detail_top_td" style="font-size:13px;"></td>');
    var detail_table = $('<table class="cloudHQ__detail_table"  cellpadding=0 cellspacing=0 border=0  style="border-collapse:separate;font-size:13px"></table>');
    var detail_tr = $('<tr></tr>');
    var detail_td = $('<td valign="top"></td>');
    var detail_second_table = $('<table cellpadding=0 cellspacing=0 style="border-collapse:collapse" valign="top"></table>');
    var title_tr = $('<tr></tr>');
    var title_td = $('<td valign="top" style="min-width:100%;padding-bottom:2px;font-size:16px;line-height:22px;font-weight:600;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"></td>');

    title_td.append(json.title);
    title_tr.append(title_td);
    detail_second_table.append(title_tr);

    var meta_desc = "";
    if (typeof json.metadata !== 'undefined' && typeof json.metadata.description !== 'undefined' && json.metadata.description !== '') {
      meta_desc = json.metadata.description;
    } else if (typeof json["contentHtml"] !== 'undefined' && json["contentHtml"] !== '') {
      var htmldiv = $("<div></div>").html(json.contentHtml);
      meta_desc = $(htmldiv).text();
    }

    if (typeof meta_desc !== 'undefined' && meta_desc !== '' && !json["contentHtml"]) {
      if (meta_desc.length > 120) {
        meta_desc = meta_desc.substr(0, 120) + "...";
      }
      var desc_tr = $('<tr></tr>');
      var desc_td = $('<td valign="top" style="min-width:100%;padding-bottom:4px;font-size:15px;line-height:17px;font-family: -apple-system, BlinkMacSystemFont, \'segoe ui\', Helvetica, Arial, sans-serif, \'apple color emoji\', \'segoe ui emoji\', \'segoe ui symbol\'"></td>');

      desc_tr.append(desc_td);
      desc_tr.append(desc_td);
      detail_second_table.append(desc_tr);
    }

    detail_td.append(detail_second_table);
    detail_tr.append(detail_td);
    detail_table.append(detail_tr);
    
    if(json["contentHtml"]){
      var tempdiv = $("<div></div>").html(json["contentHtml"]);
      tempdiv.find('.entry-content').attr('style','');
      tempdiv.find('.markdown-body').css({'border':'0px', 'border-radius':'0px', 'padding':'0px'});
      tempdiv.find('.markdown-body h1').remove();

      // if there is already an image remove this one
      if (json.metadata && json.metadata.image && json.metadata.image.url) {
        tempdiv.find('img').remove();
      }

      if(tempdiv.find('.markdown-body').find('div').length > 0){
        var sdiv = tempdiv.find('.markdown-body').find('div').get(0);
        if($(sdiv).text().indexOf("Source:") > -1){
          $(sdiv).remove(); 
        }
      }
      var webclip_tr = $('<tr></tr>');
      var webclip_td = $('<td valign="top"></td>');
      var w_table = $('<table cellpadding=0 cellspacing=0 border=0 valign="top"></table>');
      var w_tbody = $("<tbody></tbody>");
      var w_tr = $('<tr></tr>');
      var w_td = $('<td valign="top"></td>');
      w_td.html(tempdiv.html());
      w_tr.append(w_td);
      w_tbody.append(w_tr);
      w_table.append(w_tbody);
      webclip_td.append(w_table);
      webclip_tr.append(webclip_td);
      detail_table.append(webclip_tr);
    }
    

    var bottom_tr = fn_cloudHQ_get_bottom_tr_of_webclip(json.url);
    detail_table.append(bottom_tr);

    detail_top_td.append(detail_table);

  }

  second_tr.append(detail_top_td);
  second_tbody.append(second_tr);
  second_table.append(second_tbody);

  main_td.append(second_table);
  main_tr.append(main_td);

  main_tbody.append(main_tr);
  main_table.append(main_tbody);
      
  main_table.find('*').css('font-family','');

  var main_div = $("<div></div>");
  main_div.append(main_table);

  var br = $('<br />');
  $(curr_element).after(br);
  br.after(main_div);
  main_div.after('<br />');

  fn_cloudHQ_remove_requesting_underline(curr_element);
  
}

function fn_cloudHQ_show_as_url_impl(current_web_clip, cls){
  if (current_web_clip.find('a').length > 0) {
    var first_a = current_web_clip.find('a').get(0);
    var a_url = $(first_a).attr('href');
    var a_href = a_url;
    if(a_url.indexOf('http') === -1){
      a_href = "http://"+a_url;
    }
    var span = $("<a class='"+cls+"' href='"+a_href+"'>" + a_url + "&nbsp;</a>");
    current_web_clip.parent().replaceWith(span);
  }
}

function fn_cloudHQ_set_border_bottom_for_progress_view_and_set_web_clips_for_urls(content, preview, screenshot) {

  g_sdk.ButterBar.showMessage({ text:'Generating preview...', messageKey: 'cloudHQ_butter_gmail_url_previews_1'});
  
  $("[class*=cloudHQ__webclip_target_checking_url]").not("[class*=cloudHQ__webclip_already_requested]")
    .css('padding-bottom', '2px')
    .css('background-image', '-webkit-gradient(linear, 0 50%, 100% 50%, color-stop(0, rgba(0,113,255,0.3)), color-stop(25%, #1a7fff), color-stop(75%, #00a60c), color-stop(100%, rgba(0,140,10,0.3)))')
    .css('background-size', '100% 1px')
    .css('background-repeat', 'repeat-x')
    .css('background-position', 'bottom')
    .css('background-color', 'transparent')
    .css('-webkit-animation', 'cloudHQ__mymove 10s linear 0s infinite');
  setTimeout(function () {
    fn_cloudHQ_set_web_clip_for_urls(content, preview, screenshot);
  }, 100);

}

function fn_cloudHQ_test_for_url_existence(text) {
  //var reg = new RegExp(g_url_matching_regex, 'gi');
  text = text.replace("http://", "");
  text = text.replace("https://", "");
  return /^([a-zA-Z0-9]+(\.[a-zA-Z0-9]+)+.*)$/gi.test(text);
}

/* Handle ajax calls through background page */
function fn_post(url, data, callback, type) {

  // Shift arguments if data argument was omitted
  if ( typeof data === "function" ) {
    type = type || callback;
    callback = data;
    data = undefined;
  }

  // The url can be an options object (which then must have .url)
  return fn_ajax($.extend({
    url: url,
    type: "post",
    dataType: type,
    data: data,
    success: callback
  }, $.isPlainObject(url) && url));

};

function fn_ajax(params) {

  // fallback to $.ajax
  // return $.ajax(params);

  //console.log('fn_ajax=(INIT)' + params.url, params);
  chrome.runtime.sendMessage({ what: 'PROXY_AJAX', payload: params} , function(r) {
    if (r) {
      var payload = r.payload;
      var responseText = $.isPlainObject(payload) ? JSON.stringify(payload) : payload + '';
      var xhr = {
        status: r.status,
        response: responseText,
        getResponseHeader: function(header) {
          return r.headers && r.headers[header.toLowerCase()];
        }
      };

      if (r.payloadType === 'blob') {
        
        var dataURI = r.payload;
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);

        // set the bytes of the buffer to the correct values
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        var blob = new Blob([ab], { type: mimeString });
        xhr.response = blob;
      }

      if (r.what == 'success' && $.isFunction(params.success)) {
        //console.log('fn_ajax=(SUCCESS)' + params.url, r);
        params.success.call(this, payload, 'success', xhr); /* success(data) */
      } else if ($.isFunction(params.error)) {
        //console.log('fn_ajax=(ERROR)' + params.url, r);
        params.error.call(this, payload, 'error', xhr); /* error(data) */
      } else if ($.isFunction(params.failure)) {
        //console.log('fn_ajax=(FAILURE)' + params.url, r);
        params.failure.call(this, payload, 'failure', xhr); /* failure(data) */
      }
      if ($.isFunction(params.complete)) {
        //console.log('fn_ajax=(COMPLETE)' + params.url, xhr);
        params.complete.call(this, xhr, responseText); /* complete(xhr, string); */
      }
    }
  });
}

c_cmn = new c_cmn();
fn_init();

var g_cloudHQ_feature_name = 'gmail_url_previews';

function fn_init() {

  // global variables
  // NOTE: we don't use var becasue we want that variables are declared in global context. 
  //       Each of the files is wrapped by Google Chrome into its own enclosure so var really does
  //       makes variable global.
  g_server_url          = "https://www.cloudhq.net/";
  g_server_log_level    = "debug";
  g_login_path          = "login?next_step=";
  g_create_account_path = "create_account?auto_click=1&source=chrome_extension_email&last_step=";
  g_inbox_sdk_id        = 'sdk_gmail_link_pre_278ac45fcd';
  g_misc_modal_view     = null;
  g_logged_in           = false;
  g_logger              = null;
  g_flash               = null;
  g_flash_received      = false;
  g_email_or_login      = null;
  g_sdk                 = null;
  g_do_not_show_gmail_url_previews_getting_started = false;
  g_key_for_local_storage = "cloudHQ_url_previews";
  g_local_state           = {};
  g_gmail_timezone_offset = new Date().getTimezoneOffset();
  g_do_not_show_getting_started = false;

  g_show_splash_screen_for_gmail_web_clipper_button = true; 
  g_intention_to_gmail_url_previews = null;

  g_gmail_web_clipper_impl = null;
  g_gmail_web_clipper_draft_id = null;
  g_gmail_web_clipper_compose_view = null;
  
  g_fatal_error_flag = false; /* this flag is set to false when entire system needs to be reloaded - i.e., server is down */
  g_checking_links_flag = false;
  
  g_url_matching_regex = "^(?:([^:\\/?#]+):)?(?:\\/\\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\\/?#]*)(?::(\\d*))?))?((((?:[^?#\\/]*\\/)*)([^?#]*))(?:\\?([^#]*))?(?:#(.*))?)";
  g_current_body_elem = null;
  g_cloudHQ_after_div = null;
  g_cloudHQ_pause_for_url_check = false;
  
  g_cloudHQ_auto_preview = false;
  g_cloudHQ_text_mode = false;
  
  g_new_gmail_interface = false;
  g_is_dark_theme = false;
  
  g_last_login_check_timestamp = new Date().getTime();
  g_two_weeks_ago_timestamp = new Date(Date.now() - 12096e5).getTime(); //12096e5
  g_ignore_account_list = [];

  try {
    var location_url = document.location.href;

    if (location_url.match(g_server_url)) {
      
      console.log('We are on cloudHQ page.');
      if (location_url.match('/main_gmail_web_clipper/check_intention')) {
        setTimeout(function() {

          console.log('INTENTION');
          chrome.storage.sync.get("cloudHQ_gmail_web_clipper_redir_url", function (obj) {
            var url = obj["cloudHQ_gmail_web_clipper_redir_url"];
            if (url && url != "") {
              chrome.storage.sync.set({"cloudHQ_gmail_web_clipper_redir_url": ""}, function() { 
                // send message to background to clip url.
                chrome.runtime.sendMessage(chrome.runtime.id, {type: "CHQ_CLIP_WEB_CONTENT_EXECUTE", 'url': url, 'current_tab': true }, function (json) {

                });
              });
            }
          });
        }, 2000);
      }


    } else if (location_url.match("https://mail.google.com/*") || location_url.match("https://inbox.google.com/*")) {

      if (window.self == window.top) {

        console.log('main_gmail_url_previews: loading ref=' + document.location.href);
        setTimeout(function() {

          InboxSDK.load('2.0', g_inbox_sdk_id, { 'appName': 'Gmail Link URL Preview' }).then(function(sdk) {

            try {

              console.log('main: START ref=' + document.location.href);

              try {
                g_new_gmail_interface = $('script').text().match(/GM_RFT_ENABLED="true"/);
                if (g_new_gmail_interface) {
                  g_new_gmail_interface = true;
                }
              } catch (e) {
              }
              
              try {
                g_is_dark_theme = $('style').text().match(/delete_white_20dp/);
                if (g_is_dark_theme) {
                  g_is_dark_theme = true;
                }
              } catch(e) {

              }

              // Making CSRF Token for each Ajax request.
              $(document).ajaxSend(
                function(e, xhr, options) {
                  try {
                    if ($("meta[name='csrf-token']").size > 0) {
                      var token = $("meta[name='csrf-token']").attr("content");
                      if (token) {
                        xhr.setRequestHeader("X-CSRF-Token", token);
                      }
                    }
                  }
                  catch (e) {
                  }
                }
              );

              document.addEventListener('paste', fn_handle_paste_link);

              g_sdk = sdk; // save SDK into global variable
              g_email_or_login = g_sdk.User.getEmailAddress();
              g_key_for_local_storage = g_key_for_local_storage + '_' + g_email_or_login;
              
               $('<style></style>')
              .html('.inboxsdk__modal_fullscreen { overflow-y: auto !important;} ' +
                    '.cloudHQ__tour_highlight { position: absolute; z-index: 100; top: 0px; height: 0px; width: 0px; background: black; opacity: 0.5; } ' + 
                    '.cloudHQ__rotating { -webkit-animation: cloudHQ__rotating_type 2s linear infinite; }' + 
                    '@-webkit-keyframes cloudHQ__rotating_type { from{ -webkit-transform: rotate(0deg); } to{ -webkit-transform: rotate(360deg); } }')
              .appendTo($('head'));

              $('head').append('<style>' +
                '.chq-screenshot-overlay { position: fixed; width: 100%; height: 100%; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 10000; }' +
                '.chq-screenshot-wrapper { position: fixed; overflow: hidden; top: 55px; left: 60px; right: 60px; bottom: 55px; border-radius: 5px; box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.36); background-color: white; z-index: 10001; }' +
                '</style>'
              );

              console.log('main: gmail_url_previews START (after sleep) ref=' + document.location.href);
            
              //***

              fn_create_extension_toolbar(sdk);

              fn_check_for_extension_toolbar_updates(sdk);

              chrome.extension.onMessage.addListener(function(req, sender, sendResponse) {
                if (req && req.action == "getUserEmailAddress") {
                  sendResponse(g_email_or_login || null);
                  return false;
                } else if (req && req.action == "setLocationHash") {
                  window.location.hash = req.hash;
                } /*else if(req && req.action ==="CHQ_URL_WEB_CLIP_DATA"){
                  console.log("requ:", req);
                  sendResponse(null);
                }*/else {
                  sendResponse(null);
                }
              });
              
              if (g_is_dark_theme) {
                $('head').append('<style>' + 
                                 '.inboxsdk__button .inboxsdk__button_icon { filter: invert(100%) !important; }' + 
                                 '.inboxsdk__appButton .inboxsdk__button_icon { filter: invert(100%) !important; }' + 
                                 '</style>')
              }

              fn_pre_user_check();

              fn_get_state_from_local_storage(function() {

                //fn_register_message_listeners();

                sdk.Compose.registerComposeViewHandler(function(compose_view) {
                  fn_handle_cloudHQ_composer_view(compose_view);
                });

                //fn_create_extension_toolbar(sdk);
                console.log("g_last_login_check_timestamp:", g_last_login_check_timestamp);
                console.log("g_ignore_account_list:", g_ignore_account_list);
                console.log("g_do_not_show_getting_started:", g_do_not_show_getting_started);
                console.log("g_two_weeks_ago_timestamp:", g_two_weeks_ago_timestamp);
                
                if (!window.location.href.match('from_extension=' + g_cloudHQ_feature_name)) {
                  if (!g_do_not_show_getting_started) {
                    g_do_not_show_getting_started = true;
                    fn_save_state_to_local_storage(function() {
                      // just try to login
                      fn_check_login_and_signup_dialog_if_needed();
                    });
                  } else if (g_last_login_check_timestamp < g_two_weeks_ago_timestamp) {
                    g_last_login_check_timestamp = new Date().getTime();
                    fn_save_state_to_local_storage(function() {
                      if (g_ignore_account_list.indexOf(g_email_or_login) === -1) {
                        fn_check_login_and_signup_dialog_if_needed();
                      }
                    });
                  }
                }
              });
            }
            catch (e) {
              console.log('FATAL_ERROR: e=' + e);
              g_fatal_error_flag = true;
            }

          });
        }, 2000);

      }
    } else {
      // web page, ignore ...
    }
  } catch (e) {
    g_fatal_error = true;
    // c_cmn.fn_log("ERROR: e=" + e, "gmail", "fatal");
  }
}




