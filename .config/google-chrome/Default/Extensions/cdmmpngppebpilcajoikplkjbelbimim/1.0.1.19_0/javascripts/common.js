/**
 * @author Senad Dizdar
 * Copyright (C) 2010-2011, cloudHQ 
 * All rights reserved.
 *
 */
 
/**
 * Common class
 */
g_notif_win = null;
  
c_cmn = function() 
{
  /*********************************************/
  /* PUBLIC FUNCTIONS                          */
  /*********************************************/
 

  var fn_get_function_name = function(func) 
  {
    try {
    if (typeof func == "function" || typeof func == "object") {
      var fName = (""+func).match(/function\s*([\w\$]*)\s*\(/); 
      if ( fName !== null ) return fName[1];
    }
    } catch (e) {}
    return "unknown";
  }
  
  /***
   * logs message - if possible sends to server
   * @param message
   * @param serverCategory
   * @param serverLevel
   */
  this.fn_log = function(message, serverCategory, serverLevel) 
  {
    try {
      if (window.top && window.top.console) {
        window.top.console.log(message);
      } else if (window.console) {
        window.console.log(message);
      }
    } catch (e) {}
    if (serverCategory) {
      if (g_logger) {
        var level = serverLevel ? serverLevel : "debug";
        g_logger.log(level, serverCategory, message);
      } 
    }
  }
  
  /***
   * Refresh all trees we have
   * @param {Object} dir_id
   * @param {Object} operation
   */
  this.fn_refresh_all = function(obj, operation)
  {
    var d = null;
    if (obj !=null)
      d = { "obj" : $.toJSON(obj), "operation" : $.toJSON(operation) }
    var ajax_params = {
        type: "GET",
        url: g_server_url + "main_cloud_fs_interface/refresh_cloudhq_dir",
        dataType: "json",
        data: d,
        async: true
    };
    c_cmn.fn_execute_via_background('fn_ajax', ajax_params, 
      function(response) { 
        if (response['s'] && response['s']['error']) 
        {
          // error :(
        }
        else
        {
          $("#left_jstree_container").jstree('refresh');
          $("#right_jstree_container").jstree('refresh');
          $("#synchpopup_jstree_container").jstree('refresh');
          $("#copypopup_jstree_container").jstree('refresh');
        } 
      },
      function(response) {  }
    );
  }
    
  /***
   * Executes with logging
   * @param description
   * @param continuation
   * @return
   */
  this.fn_loggily = function(description, continuation) 
  {
    return function () 
    {
        try {
            return continuation.apply(this, arguments);
        } catch (e) {
            c_cmn.fn_log("cloudHQ exception: " + description + ": " + e, "google docs", "error");
        throw e;
        }
    };
  }
  
  /**
   * Logger class which does sending logs directly to server
   * TODO: we should probably move it to backgroud.html
   * @param server
   * @param minLevel
   * @return
   */
  this.c_logger = function(server, minLevel) 
  {
      var bad_params = {
          user_id: 1,
          type: 1,
          timestamp: 1,
          controller: 1,
          action: 1,
          callback: 1,
          category: 1,
          level: 1,
          path: 1,
          format: 1
      };
      var levels = {
          all: 0,
          debug: 10,
          info: 20,
          warn: 30,
          warning: 30,
          error: 40,
          fatal: 100
      };
      var callbackCount = (new Date()).getTime();
      this.server = server;
      this.minLevel = minLevel;
      this.baseUrl = function (level, category) {
          return this.server + "logger?c=" + encodeURIComponent(category) + "&l=" + encodeURIComponent(level);
      };
      this.log = function (level, category, message, params) {
          if (message === undefined && params === undefined) {
              throw new Error("Please specify level, category and message");
          }
          if (levels[level] < levels[this.minLevel]) {
              return;
          }
          message = "[" + g_google_id + "] " + message;
          var callback = 'logger-' + callbackCount;
          callbackCount += 1;
          var data = { 'level': level, 'category': category, 'message': message, 'callback': callback, 'params': params }
          chrome.extension.sendRequest({'action_name' : 'fn_logger', 'action_params' : data }, function(r) {   }  );
      };
      this.debug = function (category, message, params) {
          this.log("debug", category, message, params);
      };
      this.info = function (category, message, params) {
          this.log("info", category, message, params);
      };
      this.warning = this.warn = function (category, message, params) {
          this.log("warning", category, message, params);
      };
      this.error = function (category, message, params) {
          this.log("error", category, message, params);
      };
      this.fatal = function (category, message, params) {
          this.log("fatal", category, message, params);
      };
      this.track = function (message, params, probability) {
          if (undefined !== probability) {
              params.probability = probability;
          }
          this.log("info", "track", message, params);
      };
  }
  
  /**
   * Conditionally executes method  
   * @param options
   * @return
   */
  this.fn_delayed_conditional_execute = function(options) {
    var default_options = {
        poll_delay: 200,
        max_poll_attempts: 1,
        retry_message: "Scheduling another delayedConditionalExecute search.",
        failure_message: null,
        error_message: "Condition threw an exception!",
        error_continuation: null,
        condition: null,
        continuation: null,
        log_category: "gmail",
        log_level_on_failure: "error",
        log_level_on_error: null
    };
    options = $.extend(default_options, options);
    var attempts = 0;
    
    function log(message, additional_message, category, level) 
    {
      if (typeof(message) === "function") 
      {
        message = message();
      }
      if (message) 
      {
        c_cmn.fn_log(message + " " + (additional_message || ""), category, level);
      }
    }
    
    function doAttempt() 
    {
      var condition;
      try {
          condition = options.condition();
      } catch (e) {
          var eStr = e.message ? e.message : e;
          log(options.error_message, 
              "(after " + attempts + " attempts, '" + eStr + "')", options.log_category, 
              (options.log_level_on_error || options.log_level_on_failure));
          return;
      }
      if (condition) {
          options.continuation();
      } else {
          if (attempts < options.max_poll_attempts) {
              attempts += 1;
              if (options.retry_message) {
                log(options.retry_message, "Attempts so far: " + attempts);
              }
              window.setTimeout(c_cmn.fn_loggily('fn_delayed_conditional_execute attempt', doAttempt), options.poll_delay);
          } else {
              if (options.failure_message) {
                c_cmn.fn_log(options.failure_message, null, options.log_category, options.log_level_on_failure);
                g_sdk.ButterBar.showMessage({ text: options.failure_message, messageKey: 'cloudHQ_butter_error'});
              }
              if (options.error_continuation) {
                options.error_continuation();
              }
          }
      }
    }
    doAttempt();
  }
  
  /***
   * Execute request in background.html and then process request by function func
   * @param action_name   action to be executed in background.html
   * @param action_params parameter passed to function in background.html
   * @param func_ok       method to be called after request if everything is ok
   * @param func_error    method to be called after request if failed (optional)
   * @return
   */
  this.fn_execute_via_background = function(action_name, action_params, func_ok, func_error) 
  {
    chrome.extension.sendRequest({'action_name' : action_name, 'action_params': action_params}, 
        function(data) {
          try { 
            c_cmn.fn_log('received answer from background.html on request to run ' + action_name, 'gdoc', 'debug');
            var t;
            if (data == null)
            {
              t = 'Failed to call ' + action_name + '. Unable to connect to background.html';
              if (jQuery.isFunction(func_error))
              {
                c_cmn.fn_log(t, 'gdoc', 'debug');
                func_error(null);
              }
              else
                throw(t);
            }
            else if (data.error)
            {
              t = 'Action ' + action_name + ' failed. error: '+ JSON.stringify(data.error);
              if (jQuery.isFunction(func_error))
              {
                c_cmn.fn_log(t, 'gdoc', 'debug');
                func_error(data.error);
              }
              else
                throw(t);
            }
            else if (jQuery.isFunction(func_ok))
            {
              func_ok(data.result);
            }
          } catch(e) {
            // throw(e);
          }
        }  
      ); 
  }
  
  this.fn_insert_overlay = function()
  {
    // Adding overlay window
    $g_overlay = $('<div id="cloudHQ_overlay" class="ui-widget-overlay" style="z-index: 9999;"></div>').hide();
    $('body').append($g_overlay);
  }
  
  /***
   * Insert notification and error window
   * @return
   */
  this.fn_insert_notif_error_win = function()
  {
    // add notification window
    $('body').append(
      '<div id="cloudHQ_notif_win_msg" style="display:none;">' +
          '<div id="cloudHQ_notif_win_msg_content">'  +
            '<span>'  + 
            'TESt1 <br/>' +
            'TEST2' +
            '</span>' +
          '</div>'+
        '</div>' +
      '</div>');
      
    // add error window
    $('body').append(
      '<div id="cloudHQ_error_win_msg" style="display:none;">' +
          '<div id="cloudHQ_error_win_msg_content">'  +
            '<span>'  + 
            'TEST1 <br/>' +
            'TEST2' +
            '</span>' +
          '</div>'+
        '</div>' +
      '</div>');
      
     $('#cloudHQ_notif_win_msg_content').bind('click', function() { c_cmn.fn_notif_win(false); });
     $('#cloudHQ_error_win_msg_content').bind('click', function() { c_cmn.fn_error_win(false); });
  }
  
  /***
   * Displays notification when cloudHQ is doing things
   * @param display_flag     on or off
   * @param msg              message to be displayed
   * @param display_timeout  timeout after which message is deleted
   * @return
   */
  this.fn_notif_win = function(display_flag, msg, display_timeout) 
  {
    $('#cloudHQ_error_win_msg').hide();
    g_error_win = null;
    if (display_flag == true) 
    {
      $('#cloudHQ_notif_win_msg').hide();
      g_notif_win = null;
      $("#cloudHQ_notif_win_msg_content").html(msg); // + '<br/>(message from cloudHQ)');
      $('#cloudHQ_notif_win_msg').show();
      if (display_timeout != null) 
      { 
        if (g_notif_win == null)
          g_notif_win = setTimeout(function() { $("#cloudHQ_notif_win_msg").hide(); g_notif_win = null; }, display_timeout);
      }
    }
    else 
    {
      $('#cloudHQ_notif_win_msg').hide();
      g_notif_win = null;
    }
  }
  
  /***
   * Displays error notifation when cloudHQ fails at something
   * @param display_flag     on or off
   * @param msg              message to be displayed
   * @param display_timeout  timeout after which message is deleted
   * @return
   */
  this.fn_error_win = function(display_flag, msg, display_timeout) 
  {
    $('#cloudHQ_notif_win_msg').hide();
    g_notif_win = null;
    if (display_flag == true) 
    {
      $('#cloudHQ_error_win_msg').hide();
      g_error_win = null;
      $("#cloudHQ_error_win_msg_content").html(msg); //  + '<br/>(error from cloudHQ)');
      $('#cloudHQ_error_win_msg').show();
      if (display_timeout != null) 
      { 
        if (g_error_win == null)
          g_error_win = setTimeout(function() { $("#cloudHQ_error_win_msg").hide(); g_notif_win = null; }, display_timeout);
      }
    }
    else 
    {
      $('#cloudHQ_error_win_msg').hide();
      g_error_win = null;
    }
  }

  /***************************************************/
  /* PRIVATE METHODS */
  /***************************************************/
 
} 
// end of c_cmn
