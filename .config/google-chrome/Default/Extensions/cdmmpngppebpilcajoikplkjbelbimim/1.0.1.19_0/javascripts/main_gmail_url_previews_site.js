
var url = window.location.href;

var ExtensionURL = "https://chrome.google.com/webstore/detail/" + encodeURIComponent(chrome.runtime.id);

// *******
// Styles
var GithubCSS = '@font-face{font-family:octicons-link;src:url(data:font/woff;charset=utf-8;base64,d09GRgABAAAAAAZwABAAAAAACFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEU0lHAAAGaAAAAAgAAAAIAAAAAUdTVUIAAAZcAAAACgAAAAoAAQAAT1MvMgAAAyQAAABJAAAAYFYEU3RjbWFwAAADcAAAAEUAAACAAJThvmN2dCAAAATkAAAABAAAAAQAAAAAZnBnbQAAA7gAAACyAAABCUM+8IhnYXNwAAAGTAAAABAAAAAQABoAI2dseWYAAAFsAAABPAAAAZwcEq9taGVhZAAAAsgAAAA0AAAANgh4a91oaGVhAAADCAAAABoAAAAkCA8DRGhtdHgAAAL8AAAADAAAAAwGAACfbG9jYQAAAsAAAAAIAAAACABiATBtYXhwAAACqAAAABgAAAAgAA8ASm5hbWUAAAToAAABQgAAAlXu73sOcG9zdAAABiwAAAAeAAAAME3QpOBwcmVwAAAEbAAAAHYAAAB/aFGpk3jaTY6xa8JAGMW/O62BDi0tJLYQincXEypYIiGJjSgHniQ6umTsUEyLm5BV6NDBP8Tpts6F0v+k/0an2i+itHDw3v2+9+DBKTzsJNnWJNTgHEy4BgG3EMI9DCEDOGEXzDADU5hBKMIgNPZqoD3SilVaXZCER3/I7AtxEJLtzzuZfI+VVkprxTlXShWKb3TBecG11rwoNlmmn1P2WYcJczl32etSpKnziC7lQyWe1smVPy/Lt7Kc+0vWY/gAgIIEqAN9we0pwKXreiMasxvabDQMM4riO+qxM2ogwDGOZTXxwxDiycQIcoYFBLj5K3EIaSctAq2kTYiw+ymhce7vwM9jSqO8JyVd5RH9gyTt2+J/yUmYlIR0s04n6+7Vm1ozezUeLEaUjhaDSuXHwVRgvLJn1tQ7xiuVv/ocTRF42mNgZGBgYGbwZOBiAAFGJBIMAAizAFoAAABiAGIAznjaY2BkYGAA4in8zwXi+W2+MjCzMIDApSwvXzC97Z4Ig8N/BxYGZgcgl52BCSQKAA3jCV8CAABfAAAAAAQAAEB42mNgZGBg4f3vACQZQABIMjKgAmYAKEgBXgAAeNpjYGY6wTiBgZWBg2kmUxoDA4MPhGZMYzBi1AHygVLYQUCaawqDA4PChxhmh/8ODDEsvAwHgMKMIDnGL0x7gJQCAwMAJd4MFwAAAHjaY2BgYGaA4DAGRgYQkAHyGMF8NgYrIM3JIAGVYYDT+AEjAwuDFpBmA9KMDEwMCh9i/v8H8sH0/4dQc1iAmAkALaUKLgAAAHjaTY9LDsIgEIbtgqHUPpDi3gPoBVyRTmTddOmqTXThEXqrob2gQ1FjwpDvfwCBdmdXC5AVKFu3e5MfNFJ29KTQT48Ob9/lqYwOGZxeUelN2U2R6+cArgtCJpauW7UQBqnFkUsjAY/kOU1cP+DAgvxwn1chZDwUbd6CFimGXwzwF6tPbFIcjEl+vvmM/byA48e6tWrKArm4ZJlCbdsrxksL1AwWn/yBSJKpYbq8AXaaTb8AAHja28jAwOC00ZrBeQNDQOWO//sdBBgYGRiYWYAEELEwMTE4uzo5Zzo5b2BxdnFOcALxNjA6b2ByTswC8jYwg0VlNuoCTWAMqNzMzsoK1rEhNqByEyerg5PMJlYuVueETKcd/89uBpnpvIEVomeHLoMsAAe1Id4AAAAAAAB42oWQT07CQBTGv0JBhagk7HQzKxca2sJCE1hDt4QF+9JOS0nbaaYDCQfwCJ7Au3AHj+LO13FMmm6cl7785vven0kBjHCBhfpYuNa5Ph1c0e2Xu3jEvWG7UdPDLZ4N92nOm+EBXuAbHmIMSRMs+4aUEd4Nd3CHD8NdvOLTsA2GL8M9PODbcL+hD7C1xoaHeLJSEao0FEW14ckxC+TU8TxvsY6X0eLPmRhry2WVioLpkrbp84LLQPGI7c6sOiUzpWIWS5GzlSgUzzLBSikOPFTOXqly7rqx0Z1Q5BAIoZBSFihQYQOOBEdkCOgXTOHA07HAGjGWiIjaPZNW13/+lm6S9FT7rLHFJ6fQbkATOG1j2OFMucKJJsxIVfQORl+9Jyda6Sl1dUYhSCm1dyClfoeDve4qMYdLEbfqHf3O/AdDumsjAAB42mNgYoAAZQYjBmyAGYQZmdhL8zLdDEydARfoAqIAAAABAAMABwAKABMAB///AA8AAQAAAAAAAAAAAAAAAAABAAAAAA==) format("woff")}.markdown-body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;line-height:1.5;color:#24292e;font-family:-apple-system,BlinkMacSystemFont,segoe ui,Helvetica,Arial,sans-serif,apple color emoji,segoe ui emoji,segoe ui symbol;font-size:16px;line-height:1.5;word-wrap:break-word}.markdown-body .pl-c{color:#6a737d}.markdown-body .pl-c1,.markdown-body .pl-s .pl-v{color:#005cc5}.markdown-body .pl-e,.markdown-body .pl-en{color:#6f42c1}.markdown-body .pl-smi,.markdown-body .pl-s .pl-s1{color:#24292e}.markdown-body .pl-ent{color:#22863a}.markdown-body .pl-k{color:#d73a49}.markdown-body .pl-s,.markdown-body .pl-pds,.markdown-body .pl-s .pl-pse .pl-s1,.markdown-body .pl-sr,.markdown-body .pl-sr .pl-cce,.markdown-body .pl-sr .pl-sre,.markdown-body .pl-sr .pl-sra{color:#032f62}.markdown-body .pl-v,.markdown-body .pl-smw{color:#e36209}.markdown-body .pl-bu{color:#b31d28}.markdown-body .pl-ii{color:#fafbfc;background-color:#b31d28}.markdown-body .pl-c2{color:#fafbfc;background-color:#d73a49}.markdown-body .pl-c2::before{content:"^M"}.markdown-body .pl-sr .pl-cce{font-weight:700;color:#22863a}.markdown-body .pl-ml{color:#735c0f}.markdown-body .pl-mh,.markdown-body .pl-mh .pl-en,.markdown-body .pl-ms{font-weight:700;color:#005cc5}.markdown-body .pl-mi{font-style:italic;color:#24292e}.markdown-body .pl-mb{font-weight:700;color:#24292e}.markdown-body .pl-md{color:#b31d28;background-color:#ffeef0}.markdown-body .pl-mi1{color:#22863a;background-color:#f0fff4}.markdown-body .pl-mc{color:#e36209;background-color:#ffebda}.markdown-body .pl-mi2{color:#f6f8fa;background-color:#005cc5}.markdown-body .pl-mdr{font-weight:700;color:#6f42c1}.markdown-body .pl-ba{color:#586069}.markdown-body .pl-sg{color:#959da5}.markdown-body .pl-corl{text-decoration:underline;color:#032f62}.markdown-body .octicon{display:inline-block;vertical-align:text-top;fill:currentColor}.markdown-body a{background-color:transparent;-webkit-text-decoration-skip:objects}.markdown-body a:active,.markdown-body a:hover{outline-width:0}.markdown-body strong{font-weight:inherit}.markdown-body strong{font-weight:bolder}.markdown-body h1{font-size:2em;margin:.67em 0}.markdown-body img{border-style:none}.markdown-body svg:not(:root){overflow:hidden}.markdown-body code,.markdown-body kbd,.markdown-body pre{font-family:monospace,monospace;font-size:1em}.markdown-body hr{box-sizing:content-box;height:0;overflow:visible}.markdown-body input{font:inherit;margin:0}.markdown-body input{overflow:visible}.markdown-body [type=checkbox]{box-sizing:border-box;padding:0}.markdown-body *{box-sizing:border-box}.markdown-body input{font-family:inherit;font-size:inherit;line-height:inherit}.markdown-body a{color:#0366d6;text-decoration:none}.markdown-body a:hover{text-decoration:underline}.markdown-body strong{font-weight:600}.markdown-body hr{height:0;margin:15px 0;overflow:hidden;background:transparent;border:0;border-bottom:1px solid #dfe2e5}.markdown-body hr::before{display:table;content:""}.markdown-body hr::after{display:table;clear:both;content:""}.markdown-body table{border-spacing:0;border-collapse:collapse}.markdown-body td,.markdown-body th{padding:0}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:0;margin-bottom:0}.markdown-body h1{font-size:32px;font-weight:600}.markdown-body h2{font-size:24px;font-weight:600}.markdown-body h3{font-size:20px;font-weight:600}.markdown-body h4{font-size:16px;font-weight:600}.markdown-body h5{font-size:14px;font-weight:600}.markdown-body h6{font-size:12px;font-weight:600}.markdown-body p{margin-top:0;margin-bottom:10px}.markdown-body blockquote{margin:0}.markdown-body ul,.markdown-body ol{padding-left:0;margin-top:0;margin-bottom:0}.markdown-body ol ol,.markdown-body ul ol{list-style-type:lower-roman}.markdown-body ul ul ol,.markdown-body ul ol ol,.markdown-body ol ul ol,.markdown-body ol ol ol{list-style-type:lower-alpha}.markdown-body dd{margin-left:0}.markdown-body code{font-family:sfmono-regular,Consolas,liberation mono,Menlo,Courier,monospace;font-size:12px}.markdown-body pre{margin-top:0;margin-bottom:0;font:12px sfmono-regular,Consolas,liberation mono,Menlo,Courier,monospace}.markdown-body .octicon{vertical-align:text-bottom}.markdown-body .pl-0{padding-left:0!important}.markdown-body .pl-1{padding-left:4px!important}.markdown-body .pl-2{padding-left:8px!important}.markdown-body .pl-3{padding-left:16px!important}.markdown-body .pl-4{padding-left:24px!important}.markdown-body .pl-5{padding-left:32px!important}.markdown-body .pl-6{padding-left:40px!important}.markdown-body::before{display:table;content:""}.markdown-body::after{display:table;clear:both;content:""}.markdown-body>*:first-child{margin-top:0!important}.markdown-body>*:last-child{margin-bottom:0!important}.markdown-body a:not([href]){color:inherit;text-decoration:none}.markdown-body .anchor{float:left;padding-right:4px;margin-left:-20px;line-height:1}.markdown-body .anchor:focus{outline:0}.markdown-body p,.markdown-body blockquote,.markdown-body ul,.markdown-body ol,.markdown-body dl,.markdown-body table,.markdown-body pre{margin-top:0;margin-bottom:16px}.markdown-body hr{height:.25em;padding:0;margin:24px 0;background-color:#e1e4e8;border:0}.markdown-body blockquote{padding:0 1em;color:#6a737d;border-left:.25em solid #dfe2e5}.markdown-body blockquote>:first-child{margin-top:0}.markdown-body blockquote>:last-child{margin-bottom:0}.markdown-body kbd{display:inline-block;padding:3px 5px;font-size:11px;line-height:10px;color:#444d56;vertical-align:middle;background-color:#fafbfc;border:solid 1px #c6cbd1;border-bottom-color:#959da5;border-radius:3px;box-shadow:inset 0 -1px 0 #959da5}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:24px;margin-bottom:16px;font-weight:600;line-height:1.25}.markdown-body h1 .octicon-link,.markdown-body h2 .octicon-link,.markdown-body h3 .octicon-link,.markdown-body h4 .octicon-link,.markdown-body h5 .octicon-link,.markdown-body h6 .octicon-link{color:#1b1f23;vertical-align:middle;visibility:hidden}.markdown-body h1:hover .anchor,.markdown-body h2:hover .anchor,.markdown-body h3:hover .anchor,.markdown-body h4:hover .anchor,.markdown-body h5:hover .anchor,.markdown-body h6:hover .anchor{text-decoration:none}.markdown-body h1:hover .anchor .octicon-link,.markdown-body h2:hover .anchor .octicon-link,.markdown-body h3:hover .anchor .octicon-link,.markdown-body h4:hover .anchor .octicon-link,.markdown-body h5:hover .anchor .octicon-link,.markdown-body h6:hover .anchor .octicon-link{visibility:visible}.markdown-body h1{padding-bottom:.3em;font-size:2em;border-bottom:1px solid #eaecef}.markdown-body h2{padding-bottom:.3em;font-size:1.5em;border-bottom:1px solid #eaecef}.markdown-body h3{font-size:1.25em}.markdown-body h4{font-size:1em}.markdown-body h5{font-size:.875em}.markdown-body h6{font-size:.85em;color:#6a737d}.markdown-body ul,.markdown-body ol{padding-left:2em}.markdown-body ul ul,.markdown-body ul ol,.markdown-body ol ol,.markdown-body ol ul{margin-top:0;margin-bottom:0}.markdown-body li>p{margin-top:16px}.markdown-body li+li{margin-top:.25em}.markdown-body dl{padding:0}.markdown-body dl dt{padding:0;margin-top:16px;font-size:1em;font-style:italic;font-weight:600}.markdown-body dl dd{padding:0 16px;margin-bottom:16px}.markdown-body table{display:block;width:100%;overflow:auto}.markdown-body table th{font-weight:600}.markdown-body table th,.markdown-body table td{padding:6px 13px;border:1px solid #dfe2e5}.markdown-body table tr{background-color:#fff;border-top:1px solid #c6cbd1}.markdown-body table tr:nth-child(2n){background-color:#f6f8fa}.markdown-body img{max-width:100%;box-sizing:content-box;background-color:#fff}.markdown-body code{padding:0;padding-top:.2em;padding-bottom:.2em;margin:0;font-size:85%;background-color:rgba(27,31,35,.05);border-radius:3px}.markdown-body code::before,.markdown-body code::after{letter-spacing:-.2em;content:"\00a0"}.markdown-body pre{word-wrap:normal}.markdown-body pre>code{padding:0;margin:0;font-size:100%;word-break:normal;white-space:pre;background:transparent;border:0}.markdown-body .highlight{margin-bottom:16px}.markdown-body .highlight pre{margin-bottom:0;word-break:normal}.markdown-body .highlight pre,.markdown-body pre{padding:16px;overflow:auto;font-size:85%;line-height:1.45;background-color:#f6f8fa;border-radius:3px}.markdown-body pre code{display:inline;max-width:auto;padding:0;margin:0;overflow:visible;line-height:inherit;word-wrap:normal;background-color:transparent;border:0}.markdown-body pre code::before,.markdown-body pre code::after{content:normal}.markdown-body .full-commit .btn-outline:not(:disabled):hover{color:#005cc5;border-color:#005cc5}.markdown-body kbd{display:inline-block;padding:3px 5px;font:11px sfmono-regular,Consolas,liberation mono,Menlo,Courier,monospace;line-height:10px;color:#444d56;vertical-align:middle;background-color:#fafbfc;border:solid 1px #d1d5da;border-bottom-color:#c6cbd1;border-radius:3px;box-shadow:inset 0 -1px 0 #c6cbd1}.markdown-body :checked+.radio-label{position:relative;z-index:1;border-color:#0366d6}.markdown-body .task-list-item{list-style-type:none}.markdown-body .task-list-item+.task-list-item{margin-top:3px}.markdown-body .task-list-item input{margin:0 .2em .25em -1.6em;vertical-align:middle}.markdown-body hr{border-bottom-color:#eee} .markdown-body { font-size: 1.0em; border: 1px solid #ddd; border-radius: 6px; padding: 20px; max-width: 800px; }';

var ButtonCSS = "reset:all;font-family:Verdana;display: inline-block;padding: 6px 12px;margin-bottom: 0;font-size: 16px;font-weight: normal;line-height: 22px;text-align: center;text-decoration: none;white-space: nowrap;vertical-align: middle;cursor: pointer;background-image: none;border: 1px solid transparent;border-radius: 4px;-webkit-user-select: none;-o-user-select: none;user-select: none;color: #195070;background: url(https://www.cloudhq.net/images/ui-bg_highlight-hard_100_ffd67f_1x100.png) repeat-x scroll 50% 45% #FFD67F; border-color: #1f6792;";

var InputCSS = "reset:all; font-family:Verdana;display: block; width: 100%;margin: 0;height: auto;padding: 8px 12px;font-size: 14px;line-height: 22px;color: #555555;vertical-align: middle;background-color: #ffffff;background-image: none;border: 1px solid #bbb;box-shadow:none";

function cloudHQ_run() {
  function inlineCssStyles(html, title, url, cssText, metadata, callback) {

    var htmlContent = null;
    if (typeof cloudHQ_content_full != 'undefined' && cloudHQ_content_full) {

      callback("");

    } else {

      var heading = $('<h1></h1>');
      heading.text(title);

      var urlText = url;
      if (url.length > 60) {
        urlText = url.substr(0, 40);
        urlText = urlText + '...';
        urlText = urlText + url.substr(url.length - 20, 20);
      }

      var source = $('<div style="margin:1em 0; padding-bottom: 1em;font-size:1.05em;line-height:1.8em"><b>Source: </b></div>');
      var sourceLink = $('<a href="#"></a>').attr('href', url).appendTo(source);
      sourceLink.text(urlText);
      source.append('<br/><b>Capture Date: </b>');
      source.append(new Date().toLocaleString());

      var htmlContent = $('<div>' + html + '</div>');
      htmlContent.find('[class]').removeAttr('class');
      htmlContent.find('[id]').removeAttr('id');
      htmlContent.prepend(source);
      htmlContent.prepend(heading);

      htmlContent.find('style').remove();
      htmlContent.find('script').remove();


      var iframe = $('<iframe style="display:none"><html><head></head><body></body></html></iframe>').appendTo($('body'));
      iframe.contents().find('html head').append('<style>' + cssText + '</style>');
      iframe.contents().find('html body').append('<div class="entry-content" style="width:700px"><div class="markdown-body">' + htmlContent.html() + '</div></div>');

      window.setTimeout(function() {

        var iframeDoc = iframe.get(0).contentWindow.document;
        var rules = iframeDoc.styleSheets[iframeDoc.styleSheets.length-1].cssRules || [];
        var iframeContents = iframe.contents();
        var cssRule;
      
        for (var idx = 0, len = rules.length; idx < len; idx++) {
          cssRule = rules[idx];
          try {
            if (cssRule) {
              iframeContents.find(cssRule.selectorText).each(function (i, elem) {
                elem.style.cssText += cssRule.style.cssText;
              });
            }
          }
          catch(err) {
            // ignore.
          }
        }
      
        var ret = iframeContents.find('body');
        if (ret.length == 0) {
          ret = iframeContents.find('html');
        }

        callback(ret.html());
      }, 200);

    }
  }

  function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
      var sel = window.getSelection();
      if (sel.rangeCount) {
        var container = document.createElement("div");
        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
          container.appendChild(sel.getRangeAt(i).cloneContents());
        }
        html = container.innerHTML;
      }
    } else if (typeof document.selection != "undefined") {
      if (document.selection.type == "Text") {
        html = document.selection.createRange().htmlText;
      }
    }
    return html;
  }


  function openPreview(html, next_step_save, next_step_close) {
    if (typeof skipPreview == 'undefined') {
      skipPreview = false;
    }
    if (skipPreview) {
      next_step_save();
      return;
    }
    var height = window.innerHeight;
    var width = 700;
    var bodyElement = document.querySelector('body');
    var overlayElement = document.createElement('div');
    var wrapperElement = document.createElement('div');
    bodyElement.appendChild(overlayElement);
    overlayElement.appendChild(wrapperElement);
    overlayElement.setAttribute("style", "all: initial; position: fixed; width: 100%; height: 100%; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999;");
    wrapperElement.setAttribute("style", "all: initial; position: fixed; overflow: scroll; padding: 25px; top: calc(51vh); left: 50%; width:" + width + "px; height: calc(92vh); margin-left:" + Math.round(width/-2) +"px; margin-top:" + Math.round(height/-2) +"px; border-radius: 5px; box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.36); background-color: white; z-index: 99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999;");
    saveButton = '<button class="chq_save_to_gmail" tabindex="0" style="reset:all;font-family:Verdana;display: inline-block;padding: 6px 12px;margin-bottom: 0;font-size: 16px;font-weight: normal;line-height: 22px;text-align: center;text-decoration: none;white-space: normal;vertical-align: middle;cursor: pointer;background-image: none;border: 1px solid transparent;border-radius: 4px;-webkit-user-select: none;-o-user-select: none;user-select: none;color: #195070;background: url(https://www.cloudhq.net/images/ui-bg_highlight-hard_100_ffd67f_1x100.png) repeat-x scroll 50% 45% #FFD67F; border-color: #1f6792;;cursor: pointer; margin: auto; margin-bottom: 0px; display: block; width: 50%; "><span>Save to Gmail</span></button>'
    wrapperElement.innerHTML = saveButton + '</div><a class="chq_close_window" href="#" style="position:absolute;top:5px;right:10px;color:#aaa;font-weight:normal;text-decoration: none;font-family:Verdana;font-size: 12px;">close</a><br/>' + html;
    $(wrapperElement).find('button').each(function() {
      $(this).attr('style', ButtonCSS + ';' + $(this).attr('style'));
    })
    $(wrapperElement).find('input[type=text]').each(function() {
      $(this).attr('style', InputCSS + ';' + $(this).attr('style'));
    })
    $(overlayElement).find('.chq_close_window').click(function() {
      methods.close();
      next_step_close();
    });
    $(overlayElement).find('.chq_save_to_gmail').click(function() {
      next_step_save();
      methods.close();
    });
    var methods = {
      close: function() {
        overlayElement.parentElement.removeChild(overlayElement);
      }
    };


    // 

  }

  function openModal(html, width, height) {
    var bodyElement = document.querySelector('body');
    var overlayElement = document.createElement('div');
    var wrapperElement = document.createElement('div');
    bodyElement.appendChild(overlayElement);
    overlayElement.appendChild(wrapperElement);
    overlayElement.setAttribute("style", "all: initial; position: fixed; width: 100%; height: 100%; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 100010;");
    wrapperElement.setAttribute("style", "all: initial; position: fixed; overflow: hidden; padding: 25px; top: 50%; left: 50%; width:" + width + "px; height: " + height + "px; margin-left:" + Math.round(width/-2) +"px; margin-top:" + Math.round(height/-2) +"px; border-radius: 5px; box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.36); background-color: white; z-index: 100010;");
    wrapperElement.innerHTML = html;
    $(wrapperElement).find('button').each(function() {
      $(this).attr('style', ButtonCSS + ';' + $(this).attr('style'));
    })
    $(wrapperElement).find('input[type=text]').each(function() {
      $(this).attr('style', InputCSS + ';' + $(this).attr('style'));
    })
    $(overlayElement).find('.chq_close_window').click(function() {
      methods.close();
    });
    var methods = {
      close: function() {
        overlayElement.parentElement.removeChild(overlayElement);
      }
    };
    return methods;
  }

  function parseHtmlData() {
    
  	var clutteredMeta = {
  		author: $('meta[name=author i]').first().attr('content'), //author <meta name="author" content="">
  		authorlink: $('link[rel=author i]').first().attr('href'), //author link <link rel="author" href="">
  		url: $('link[rel=canonical i]').first().attr('href'), //canonical link <link rel="canonical" href="">
  		description: $('meta[name=description i]').attr('content'), //meta description <meta name ="description" content="">
  		publisher: $('link[rel=publisher i]').first().attr('href'), //publisher link <link rel="publisher" href="">
  		robots: $('meta[name=robots i]').first().attr('content'), //robots <meta name ="robots" content="">
  		shortlink: $('link[rel=shortlink i]').first().attr('href'), //short link <link rel="shortlink" href="">
  		title: $('title').first().text(), //title tag <title>
  		lang: $('html').first().attr('lang') //lang <html lang="">
  	};

  	// Copy key-value pairs with defined values to meta
  	var meta = {};
  	var value;
  	Object.keys(clutteredMeta).forEach(function(key){
  		value = clutteredMeta[key];
  		if (value){ // Only add if has value
  			meta[key] = value;
  		}
  	});

  	// Reject promise if meta is empty
  	if (Object.keys(meta).length === 0){
      return null;  
    }

  	// Resolve on meta
  	return meta;
  }

  // title, description, url, image
  function parseOpenGraph() {
    var itemType;
  	var property;
  	var node;
  	var meta = {};
  	var metaTags = $('meta');
  	var namespace = ['og','fb'];
  	var subProperty = {
  			image : 'url',
  			video : 'url',
  			audio : 'url'
  		};
  	var roots = {}; // Object to store roots of different type i.e. image, audio
  	var subProp; // Current subproperty of interest

  	if (!metaTags || metaTags.length === 0){ return null; }

  	metaTags.each(function() {
  		var element = $(this);
  		var propertyValue = element.attr('property');
  		var content = element.attr('content');

  		if (!propertyValue || !content){
  			return;
  		} else {
  			propertyValue = propertyValue.toLowerCase().split(':');
  		}

  		// If the property isn't in namespace, exit
  		if (namespace.indexOf(propertyValue[0]) < 0){
  			return;
  		}

  		if (propertyValue.length === 2){
  			property = propertyValue[1]; // Set property to value after namespace
  			if (property in subProperty){ // If has valid subproperty
  				node = {};
  				node[subProperty[property]] = content;
  				roots[property] = node;
  			} else {
  				node = content;
  			}
  			// If the property already exists, make the array of contents
  			if (meta[property]) {
  				if (meta[property] instanceof Array) {
  					meta[property].push(node);
  				} else {
  					meta[property] = [meta[property], node];
  				}
  			} else {
  				meta[property] = node;
  			}
  		} else if (propertyValue.length === 3){ // Property part of a vertical
  			subProp = propertyValue[1].toLowerCase(); // i.e. image, audio - as properties, not values, these should be lower case
  			property = propertyValue[2].toLowerCase(); // i.e. height, width - as properties, not values, these should be lower case
  			// If root for subproperty exists, and there isn't already a property
  			// called that in there already i.e. height, add property and content.
  			if (roots[subProp] && !roots[subProp][property]){
  				roots[subProp][property] = content.toLowerCase(); // As properties, not values, these should be lower case
  			}
  		} else {
  			return; // Discard values with length <2 and >3 as invalid
  		}

  		// Check for "type" property and add to namespace if so
  		// If any of these type occur in order before the type attribute is defined,
  		// they'll be skipped; spec requires they be placed below type definition.
  		// For nested types (e.g. video.movie) the OG protocol uses the super type
  		// (e.g. movie) as the new namespace.
  		if (property === 'type'){
  			namespace.push(content.split('.')[0].toLowerCase()); // Add the type to the acceptable namespace list - as a property, should be lower case
  		}
  	});
  	if (Object.keys(meta).length === 0){
  		return null;
  	}
  	if (meta.type){
  		meta.type = meta.type.toLowerCase(); // Make type case insensitive as this may be used programmatically
  	}
  	return meta;
  }

  function parseJsonLd() {
    var json = [];
  	var jsonLd = $('script[type="application/ld+json"]');

  	jsonLd.each(function() {
  		var contents = $(this).text().trim();
  		try {
  			contents = JSON.parse(contents);
  		} catch (e) {
  			// Fail silently, just in case there are valid tags
  			return;
  		}
  		if (contents){
  			json.push(contents);
  		} else {
  			return;
  		}
  	});

  	if (json.length === 0) {
      return null;
  	}

  	return json.length > 1 ? json : json[0];
  }

  function parseTwitter() {
    
  	var meta = {};
  	var metaTags = $('meta');

  	// These properties can either be strings or objects
  	var dualStateSubProperties = {
  			image : 'url',
  			player : 'url',
  			creator : '@username'
  		};

  	metaTags.each(function() {
  		var element = $(this);
  		var name = element.attr('name');

  		var property;
  		var content = element.attr('content');
  		var node;

  		// Exit if not a twitter tag or content is missing
  		if (!name|| !content){
  			return;
  		} else {
  			name = name.toLowerCase().split(':');
  			property = name[1];
  		}

  		// Exit if tag not twitter metadata
  		if(name[0] !== 'twitter') {
  			return null;
  		}

  		// Handle nested properties
  		if(name.length > 2) {
  			var subProperty = name[2];

  			// Upgrade the property to an object if it needs to be
  			if(property in dualStateSubProperties && !(meta[property] instanceof Object)) {
  				node = {};
  				node[dualStateSubProperties[property]] = meta[property];
  				meta[property] = []; // Clear out the existing string as we just placed it into our new node
  			}else {
  				node = meta[property] ? meta[property] : {}; // Either create a new node or ammend the existing one
  			}

  			// Differentiate betweeen twice and thrice nested properties
  			// Not the prettiest solution, but twitter metadata guidelines are fairly strict so it's not nessesary
  			// to anticipate strange data.
  			if(name.length === 3) {
  				node[subProperty] = content;
  			} else if (name.length === 4) {
  				// Solve the very specific twitter:player:stream:content_type case where stream needs to be upgraded to an object
  				if(subProperty.toLowerCase() === "stream"){
  					node[subProperty] = {url: node[subProperty] };
  				}else {
  					node[subProperty] = node[subProperty] ? node[subProperty] : {}; //Either create a new subnode or ammend the existing one
  				}
  				node[subProperty][name[3]] = content;
  			} else {
  				// Something is malformed, so exit
  				return;
  			}
  		}else {
  			node = content;
  		}

  		// Create array if property exists and is not a nested object
  		if(meta[property] && !(meta[property] instanceof Object)) {
  			if (meta[property] instanceof Array) {
  				meta[property].push(node);
  			} else {
  				meta[property] = [meta[property], node];
  			}
  		}else {
  			meta[property] = node;
  		}
  	});

  	if(Object.keys(meta).length === 0) {
      return null;
  	}

  	return meta;
  }

  function extractMetadata(next_step) {
    
    var html, text, title, content, url, image, date;
    var metadata = {};

    tite = document.title;

    ['parseHtmlData', 'parseTwitter', 'parseOpenGraph', 'parseJsonLd'].forEach(function(fnName) { 
      var data;
      try {
        data = eval(fnName + '()');
        if (data) {
          if (data.title && $.trim(data.title) != '') {
            title = data.title;
          }
          if (data.description && $.trim(data.description) != '') {
            if (!content || data.description.length > content.lenght) {
              content = data.description;
            }
          }
          if (data.image) {
            if ($.isPlainObject(data.image)) {
              if ($.trim(data.image['url']) != '') {
                image = data.image['url'];
              }
            } else {
              image = data.image + '';
            }
          }
          if (data.pubdate) {
            date = new Date(data.pubdate);
          }
          if (data.url) {
            url = data.url;
          }
          if (fnName == 'parseJsonLd') {

            // extract Google extra info.
          }
          $.extend(true, metadata, data); 
        }
        //console.log(fnName, data);
      } catch(err) {
        console.log(fnName, err);
      }
    });

    if (!title || $.trim(title) == '') {
      title = 'Untitled';
    }

    var htmlEl = $('<div></div>');

    if (date) {
      var paraDate = $('<p></p>');
      paraDate.html('<b>Published on: </b>');
      paraDate.append(date.toLocaleString());
      paraDate.appendTo(htmlEl);
    }

    if (content) {
      var para = $('<p></p>');
      para.text(content || '');
      para.appendTo(htmlEl);
    } else if (!cloudHQ_screenshot) {
      var extractHtml = extractFromHtml($('body'));
      htmlEl.append(extractHtml);
    }

    if (image) {
      var img = $('<img />');
      img.attr('src', image);
      img.appendTo(htmlEl);
    }

    next_step({ html: htmlEl.html(), text: htmlEl.text(), title: title, url: url, metadata: metadata });

  }

  function extractFromHtml(element) {
    var t;
    var html = $('<div></div>');
    $(element).find('p,h1,h2,h3,h4,h5,h6,ul').each(function() {
      t = $(this);
      if (!t.is(':visible')) {
        // ignore
      } else if (t.get(0).tagName.toLowerCase() == 'ul') {
        var use = false;
        t.find('li').each(function() {
          if ($(this).text().lenght > 25) {
            use = true;
          }
        });
        if (use) {
          html.append(t.clone());
        }
      } else if (t.get(0).tagName.toLowerCase() == 'p') {
        if (t.text().lenght < 80) {
          // ignore
        } else {
          html.append(t.clone());
        }
      } else {
        html.append(t.clone());
      }
    });

    text = html.html().toString()
      .replace( /< *(br|p|div|section|aside|button|header|footer|li|article|blockquote|cite|code|h1|h2|h3|h4|h5|h6|legend|nav)((.*?)>)/g, '<$1$2' )
      .replace( /< *\/(td|a|option) *>/g, ' </$1>' ) // spacing some things out so text doesn't get smashed together
      .replace( /< *(a|td|option)/g, ' <$1' ) // spacing out links
      .replace( /< *(br|hr) +\/>/g, '<$1\\>' )
      .replace( /<\/ +?(p|div|section|aside|button|header|footer|li|article|blockquote|cite|code|h1|h2|h3|h4|h5|h6|legend|nav)>/g, '</$1>' );

    var el = $('<div>' + text + '<div>');
    
        el.find( 'script' ).remove();
        el.find( 'style' ).remove();
        el.find( 'noscript' ).remove();
    
    try {

      /*
      text = el.text().replace( /\|\|\|\|\|/g, '\n' )
        .replace( /(\n\u00A0|\u00A0\n|\n | \n)+/g, '\n' )
        .replace( /(\r\u00A0|\u00A0\r|\r | \r)+/g, '\n' )
        .replace( /(\v\u00A0|\u00A0\v|\v | \v)+/g, '\n' )
        .replace( /(\t\u00A0|\u00A0\t|\t | \t)+/g, '\n' )
        .replace( /[\n\r\t\v]+/g, '\n' )
        ;*/
    } catch ( err ) {
      throw err;
    }

    return el;
  }


  function extractWellKnownContent(next_step) {
    
    var config;

    $("img").each(function(){
      var hrefReplace = $(this).attr("src");

      if (hrefReplace && !hrefReplace.match(/^\/\//)) {
        $(this).attr("src",hrefReplace.replace(/^\//,"https://" + window.location.hostname + "/"));
      }
    });
    $("a").each(function(){
      var hrefReplace = $(this).attr("href");

      if (hrefReplace&& !hrefReplace.match(/^\/\//)) {
        $(this).attr("href",hrefReplace.replace(/^\//,"https://" + window.location.hostname + "/"));
      }
    });

    // TODO: cover https://www.alexa.com/topsites/countries/US
    var configs = [
    {
      "label": "Google Search",
      "identifier": ".hdp-content-wrapper",
      "titleSelector": ".zsg-content-header.addr, .print-header .print-title",

      checkSite: function() {
        if (url.match(/http[s]:\/\/[a-z]*\.google\..*\/search/i)) {
          return true;
        }
      },
      getContent: function(next_step) {
        var html = '';

        $(':hidden').addClass('cloudHQ_markedForRemoval');
        var $page_clone = $('body').clone();
        $page_clone.find("a").each(function(){
          var hrefReplace = $(this).attr("href");

          if (hrefReplace) {
            $(this).attr("href",hrefReplace.replace(/^\//,"https://" + window.location.hostname + "/"));
          }
        });
        $page_clone.find("img").each(function(){
          var srcReplace = $(this).attr("src");

          if (srcReplace) {
            
            $(this).attr("src",$(this).get(0).src);
          }
        });

        $page_clone.find(".cloudHQ_markedForRemoval,.action-menu,._P4k,._xe").each(function(){
          $(this).remove();
        });

        $page_clone.find("g-img").each(function(){
          $(this).parent().parent().remove();
        });

        $page_clone.find("*").each(function(){
          if ($(this).prop("tagName") && $(this).prop("tagName").match(/g\-/i)) {
            $(this).remove();
          }
        });

        ret_title = $page_clone.find('form').find('[name=q]').text();
        var html = "";
        $page_clone.find('.srg').each(function () {
          html += $(this).html();
        });
        html += "<br/>"

        // html = html + '<p>' + $page_clone.find('#twister_feature_div').html() + '</p>';
        next_step(html, { 'title': ret_title });

      }
    },
    {
      "host": "zillow.com",
      "label": "Zillow",
      "identifier": "#home-details-render",
      "titleSelector": ".zsg-content-header.addr, .print-header .print-title",
      getContent: function(next_step) {
        var html = '';

        chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_GET_IFRAMELY_PREVIEW", 'url': window.location.href }, function (json) {

          var img_src;
          if (json && json['links'] && json['links']['thumbnail'] && json['links']['thumbnail'][0] && json['links']['thumbnail'][0]['href']) {
            img_src = json['links']['thumbnail'][0]['href'];
          }
          
          var ret_title = null;
          if (json && json['meta'] && json['meta']['title']) {
            ret_title = json['meta']['title'];
          }
          var canonical_url = null;
          if (json && json['meta'] && json['meta']['canonical']) {
            canonical_url = json['meta']['canonical'];
          }
          if (img_src) {
            html = html + '<img src="' + img_src + '"><br/><br/>';
          } else {
            html = html + ($('ul.photo-wall-content li:first div').html() || '');
          }
          html = html + '<h3>';
          $('#home-value-wrapper:visible .estimates .home-summary-row:visible').each(function() {
            html = html + $(this).html();
          });
          html = html + '</h3><p>';
          $('.hdp-header-description .zsg-content-component .zsg-content-item:visible').each(function() {
            html = html + $(this).html();
          });

          html = html + '</p>';
          
          html = html + $('.zsg-content-section').html();
          


          next_step(html, { 'title': ret_title, 'canonical_url': canonical_url});

        });
      }
    },  
      {
      "host": "support.cloudhq.net",
      "label": "cloudHQ Support",
      "identifier": "article",
      "titleSelector": ".page-title",
      getContent: function(next_step) {
        var support_post;
        if ($("article").length > 1) {
          support_post = $("article").closest('#content').clone();
        } else {
          support_post = $("article").clone();
        }
        support_post.find('#breadcrumbs').remove();
        support_post.find('.page-navigation').remove();
        support_post.find('.tags').remove();

        // remove image height if width is set
        support_post.find('img').each(function() {

          var attr_height = $(this).attr("height");
          var attr_width = $(this).attr("width");
          if (attr_width && attr_height) {
            $(this).removeAttr('height');
          }
        });
        next_step(support_post.html());
      }
    }, {
      "host": "linkedin.com",
      "label": "LinkedIn",
      "identifier": "#profile-content .pv-top-card-section__body, #profile-content .pv-top-card-v2-section__meta-info, .profile-card.vcard",
      "titleSelector": ".pv-top-card-section__name",
      getContent: function(next_step) {
        $(document).ready(function() {

          var evObj = document.createEvent('Events');
          evObj.initEvent('click', true, false);
          $("a.lt-line-clamp__more").each(function(){ $(this).get(0).dispatchEvent(evObj); })

          $("html, body").animate({ scrollTop: 10000 }, 3000);
          $("html, body").animate({ scrollTop: 0 }, 3000);

          setTimeout(function() {
            var evObj = document.createEvent('Events');
            evObj.initEvent('click', true, false);
            $("a.lt-line-clamp__more").each(function(){ $(this).get(0).dispatchEvent(evObj); })
          }, 1000);

          setTimeout(function() {
            var $page_clone = $('body').clone();

            var html = "";
            $page_clone.find("a").each(function(){
              var hrefReplace = $(this).attr("href");

              if (hrefReplace) {
                $(this).attr("href",hrefReplace.replace(/^\//,"https://" + window.location.hostname + "/"));
              }
            });


            $page_clone.find(".lt-line-clamp__less").each(function(){
              $(this).remove();
            });
            $page_clone.find(".lt-line-clamp__more").each(function(){
              $(this).remove();
            });

            $page_clone.find(".lt-line-clamp__ellipsis--dummy").each(function(){
              $(this).remove();
            });

            $page_clone.find(".visually-hidden").each(function(){
              $(this).remove();
            });

            $page_clone.find('.pv-highlights-section').each(function() {
               $(this).remove();
            });

            $page_clone.find('.pv-recent-activity-section').each(function() {
               $(this).remove();
            });

            $page_clone.find('.pv-browsemap-section').each(function() {
               $(this).remove();
            });

            $page_clone.find('.pv-treasury-carousel').each(function() {
               $(this).remove();
            });
            $page_clone.find('a').each(function() {
              var cnt = $(this).contents();
              $(this).replaceWith(cnt);
            });

            var $photo = $page_clone.find('.pv-top-card-section__photo img').parent();
            var img_src = null;
            if ($photo.length > 0) {
              img_src = $photo.attr('src');
            } else if ($page_clone.find('.pv-top-card-section__photo').length > 0 && 
                      $page_clone.find('.pv-top-card-section__photo').css('background-image')) {
               img_src = $page_clone.find('.pv-top-card-section__photo').css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            }
            var $info = $page_clone.find('.pv-top-card-section__body .pv-top-card-section__information');
            $info.find('.pv-top-card-section__name').each(function() {
               $(this).remove();
            });
            $info.find('.pv-top-card-section__connections').each(function() {
               $(this).remove();
            });

            $page_clone.find('h1,h2,h3,h4,h5,h6,div,p,a').each(function() {
              $(this).removeAttr('style');
            });

            $page_clone.find('h4').each(function() {
              $(this).replaceWith($('<i>' + this.innerHTML + '</i>'));
            });
            var $summary = $page_clone.find('.pv-top-card-section__body .pv-top-card-section__summary-text');

            var experience_h3_count = $info.find('.pv-top-card-section__experience h3').length;

             $info.find('.pv-top-card-section__experience h3').each(function(index){
              if (index ==  experience_h3_count - 1) {
                $(this).replaceWith($('<span>' + this.innerHTML + '</span> '));
              }
              else {
                $(this).replaceWith($('<span>' + this.innerHTML + '</span><span> • </span>'));
              }
            }); 

             $info.find('h3.pv-top-card-section__location').each(function(){
              $(this).replaceWith($('<div>' + this.innerHTML + '</div>'));
            });
            var $headline = $page_clone.find('.pv-top-card-section__body:visible .pv-top-card-section__information .pv-top-card-section__headline');
            var $current_company = $page_clone.find('.pv-top-card-section__body:visible .pv-top-card-section__information .pv-top-card-section__company');
            var $experience =  $page_clone.find('.pv-profile-section.experience-section');
            var $education = $page_clone.find('.pv-profile-section.education-section');

            $experience.find('.pv-entity__logo').each(function(){
              $(this).remove();
            });
            $experience.find('.pv-profile-section__card-item').each(function() {
              var h4_count = $(this).find('h4').length;
              $(this).find('h4').each(function(index){
                if (index ==  h4_count - 1) {
                  $(this).replaceWith($('<span>' + this.innerHTML + '</span>'));
                } else {

                  $(this).replaceWith($('<span>' + this.innerHTML + '</span><span> • </span>'));
                }
              });
            });

            $experience.find('h3').each(function(){
              $(this).replaceWith($('<h3>' + this.innerHTML + '</h3>'));
            });
            $experience.find('ul').each(function(){
              $(this).replaceWith($('<div>' + this.innerHTML + '</div>'));
            });
            $experience.find('li').each(function(){
              $(this).replaceWith($('<div>' + this.innerHTML + '</div>'));
            });
            $education.find('ul').each(function(){
              $(this).replaceWith($('<div>' + this.innerHTML + '</div>'));
            });
            $education.find('li').each(function(){
              $(this).replaceWith($('<div>' + this.innerHTML + '</div>'));
            });
            html = img_src ? "<img style='width: 100px;' class='users_photo' src='" + img_src + "'>" : '';
            html = html + ($info.length > 0 ? $info.html() : '');
            html = html + ($summary.length > 0 ? '<br/>' + $summary.html() : '');
            html = html + ($experience.length > 0 ? $experience.html() : '');
            html = html + ($education.length > 0 ? $education.html() : '');

            // parse html and add max-witdh to all images
            var $save_html = $('<div>' + html + '</div>');
            $save_html.find('img').not('.users_photo').css({'display': 'none'});
            html = $save_html.html();


            // var html = $('.pv-top-card-section__body:visible').html();
            next_step(html);

          }, 6000);
        });
      }
    }, {
      "host": "amazon.co",
      "label": "Amazon",
      "identifier": "#TitleSection,#booksTitle,#title",
      "titleSelector": "#titleSection",
      getContent: function(next_step) {
        var html = '';

        $(':hidden').addClass('cloudHQ_markedForRemoval');

        var $page_clone = $('body').clone();

        chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_GET_IFRAMELY_PREVIEW", 'url': url }, function (json) {

          var img_src;
          if (json && json['links'] && json['links']['thumbnail'] && json['links']['thumbnail'][0] && json['links']['thumbnail'][0]['href']) {
            img_src = json['links']['thumbnail'][0]['href'];
          }
          if (!img_src) {
            var tmp_url = url.replace(/\/ref=.*/, '')
            tmp_url = tmp_url.replace(/\?.*/, '')
            var product_id = tmp_url.replace(/.*\//, '')
            img_src = 'http://z2-ec2.images-amazon.com/images/P/' + product_id + '.01._SX_SCRMZZZZZZZ_V196021930_.jpg'
          }
          var ret_title = null;
          if (json && json['meta'] && json['meta']['title']) {
            ret_title = json['meta']['title'];
          }
          var canonical_url = null;
          if (json && json['meta'] && json['meta']['canonical']) {
            canonical_url = json['meta']['canonical'];
          }


          $page_clone.find('a').each(function(){
            var hrefReplace = $(this).attr("href");
            if (hrefReplace) {
              $(this).attr("href", hrefReplace.replace(/^\//,"https://" + window.location.hostname + "/"));
            }
          });
          $page_clone.find('.cloudHQ_markedForRemoval').each(function() {
            if ($(this).is('noscript')) {
              $(this).replaceWith($('<div/>').html(this.innerHTML).text());

            } else {
              $(this).remove();
            }
          });
          $page_clone.find('.a-link-expander,.a-expander-prompt').remove();

          if (json && json['meta'] && json['meta']['author']) {
            html = html + '<p>Author: ' + json['meta']['author'] + '</p>'
          }

          if (img_src) {
            html = html + '<img src="' + img_src + '"><br/><br/>';
          }

          $price = $page_clone.find('#price');
          if ($price.length > 0) {
            html = html + '<h3>' + $page_clone.find('#price').first().html() + '</h3>';
          }

          $media_matrix = $page_clone.find('#MediaMatrix')
          if ($media_matrix.length > 0) {
            html = html + '<div>' + $media_matrix.html() + '</dib>';
          }


          $description = $page_clone.find('#featurebullets_feature_div,#bookDescription_feature_div');
          $description.find('div').each(function() {
            if ($(this).text().replace(/\s/g, '').length == 0) {
              $(this).remove();
            }
          });
          if ($description.length > 0) {
            html = html + '<p>' + $description.html() + '</p>';
          } else if (json['meta']['description']) {
            html = html + '<p>' + json['meta']['description'] + '</p>';
          }

          $description_and_details = $page_clone.find('#descriptionAndDetails');
          if ($description_and_details.length > 0) {
            html = html + '<p>' + $description_and_details.html() + '</p>';
          }


          // html = html + '<p>' + $page_clone.find('#twister_feature_div').html() + '</p>';
          next_step(html, { 'title': ret_title, 'canonical_url': canonical_url});

        });
      }
    }, {
      "host": "youtube.co",
      "label": "YouTube",
      "identifier": "ytd-video-primary-info-renderer",
      "titleSelector": ".title",
      getContent: function(next_step) {
        var html = '';

        $(':hidden').addClass('cloudHQ_markedForRemoval');

        var $page_clone = $('body').clone();

        chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_GET_IFRAMELY_PREVIEW", 'url': url }, function (json) {


          var ret_title = null;
          if (json && json['meta'] && json['meta']['title']) {
            ret_title = json['meta']['title'];
          }
          var canonical_url = null;
          if (json && json['meta'] && json['meta']['canonical']) {
            canonical_url = json['meta']['canonical'];
          }

          $page_clone.find('a').each(function(){
            var hrefReplace = $(this).attr("href");
            if (hrefReplace) {
              $(this).attr("href", hrefReplace.replace(/^\//,"https://" + window.location.hostname + "/"));
            }
          });

          var author_url;
          var author;
          if (json && json['meta'] && json['meta']) {
            author_url = json['meta']['author_url'];
            author = json['meta']['author'];
          }

          if (author) {
            if (author_url) {
              html = html +  '<a href="' + author_url + '">' + '<p>Author: ' + author + '</a></p>'
            } else {
              html = html + '<p>Author: ' + author + '</p>'
            }
          }

          if (json && json['meta'] && json['meta']['description']) {
            html = html + '<pre style="white-space: pre-wrap; ">' + json['meta']['description'] + '</pre>'
          }
          var img_src;
          var play_url;
          if (json && json['links'] && json['links']['thumbnail'] && json['links']['thumbnail'][0] && json['links']['thumbnail'][0]['href']) {
            img_src = json['links']['thumbnail'][0]['href'];
          }

          if (json && json['links'] && json['links']['player'] && json['links']['player'][0] && json['links']['player'][0]['html']) {
            play_url =  json['links']['player'][0]['href'];
          }
          if (img_src) {
            html = html + '<a href="' + url + '">' + '<img src="' + img_src + '"></a><br/><br/>';
          }
          // html = html + '<p>' + $page_clone.find('#twister_feature_div').html() + '</p>';
          next_step(html, { 'title': ret_title, 'canonical_url': canonical_url});

        });
      }
    }, {
      "host": "github.com",
      "label": "Github",
      "identifier": "#readme article",
      "titleSelector": "#readme article h1",
      getContent: function(next_step) {
        var readme = $("#readme article").clone();
        readme.find('h1').first().remove();
        next_step(readme.html());
      }
    },  {
      "host": "stackoverflow.com",
      "label": "stackpverflow answer",
      "identifier": '[itemtype="http://schema.org/Question"]',
      getContent: function(next_step) {
        var answer_id = window.location.hash;
        $('iframe').remove();
        $('.votecell').remove();
        if (answer_id) {
          answer_id = answer_id.replace('#', '');
        }
        if  (answer_id) {
          console.log('stackoverflow: answer_id=', answer_id);
          $('.answer').not('#answer-' + answer_id).addClass('cloudHQ_markedForRemoval');
        }
        next_step(null);
      }
    }
    ,{
      // Google Docs: we probably need to invoke "Save to "
      "host": "docs.google.com",
      "label": "Google Docs",
      "identifier": ".kix-zoomdocumentplugin-outer",
      "titleSelector": ".docs-title-input",
      getContent: function(next_step) {

        var reader = new window.CHQWCReadability(document.cloneNode(true))
        var article = reader.parse();

        next_step(article.content, { 'text': null });
      
      }
    }
    ];
    
    var el = $(document);
    var config_found = false;
    for(var i = 0; i < configs.length; i++) {
      config = configs[i];
      if (config.checkSite) {
        if (!config.checkSite()) {
          continue;
        }
      } else {
        if (document.location.host.indexOf(config.host) == -1) {
          continue;
        }
        if (el.find(config.identifier).length == '0') {
          continue;
        }
      }
      var title, html, label;
      var titleElement;
      if (config.titleSelector) {
        titleElement = el.find(config.titleSelector);
      }
      if (titleElement && titleElement.length > 0) {
        title = $.trim(titleElement.first().text());
      } else {
        title = el.find('title').text();
      }
      label = config.label;
      config_found = true;
      config.getContent(function(ret_content, ret_metdata) {
        var html = $('<div></div>').html(ret_content);
        var text = null;
        console.log('html', html);
        html.find('input, button, select').remove();
        html.find('[aria-hidden="true"]').remove();
        if (ret_metdata && ret_metdata['title']) {
          title = ret_metdata['title'];
        }      
        if (ret_metdata && ret_metdata['text']) {
          text = ret_metdata['text'];
        }      
        var canonical_url = null;
        if (ret_metdata && ret_metdata['canonical_url']) {
          canonical_url = ret_metdata['canonical_url'];
        }
        next_step({
          title: title,
          html: html.html(),
          text: text,
          canonical_url: canonical_url,
          label: label || null
        });
        return;
      });
    }
    if (!config_found) {
      // fix basic things
      // remove all iframes
      $('iframe').remove();

      // remove image height if width is set
      $('img').each(function() {

        var attr_height = $(this).attr("height");
        var attr_width = $(this).attr("width");
        if (attr_width && attr_height) {
          $(this).removeAttr('height');
        }
      });
      $('iframe').remove();

      next_step(null);
      
    }
  };


  function inlineCssStylesAndSave(contentHtml, contentText, title, label, url, metadata) {
    inlineCssStyles(contentHtml, title, url, GithubCSS, metadata, function(contentHtml) {
      
      // pview what we did
      openPreview(contentHtml, function() {

        //getSignupForm({}, function(json) {
        // If we are called from Gmail then we do not need any account or something
        if (typeof cloudHQ_request_tab_id !== 'undefined') {
          var data = { 'url': url, contentHtml: contentHtml, contentText: contentText, title: title, label: label, request_tab_id: cloudHQ_request_tab_id };
          chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_CLIP_WEB_CONTENT", url: url, data: data }, function (res) {
          });
        } else {

          chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_CLIP_WEB_CONTENT_GET_SAVE_FORM", 'url': url }, function (json) {
            if (json["status"] == "OK") {
              var email_or_login = json["email_or_login"];
              // show modal.
              var modal = openModal(json["content"], 320, 220);
              var statusText = document.querySelector('.chq_status_text');
              // send command to background.
              var data = { url: url, contentHtml: contentHtml, contentText: contentText, title: title, label: label };
              chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_CLIP_WEB_CONTENT", url: url, data: data }, function (res) {
                var message_id = res['message_id'];
                var label_name = res['label_name'];
                if (message_id) {
                  var div = $('<div></div>');
                  var link = $('<a style="color:#0366D6;text-decoration:underline;font-size:0.9em;">View in Gmail</a>')
                  div.append('<span>Saved to Gmail!</span><br />');
                  div.append(link);
                  link.attr('href', '#'); // 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(email_or_login) + '#label/' + label_name + '/' + message_id);
                  link.attr('onclick', 'return false;');
                  link.click(function() {
                    var linkData = {}
                    linkData['email_or_login'] = email_or_login;
                    linkData['message_id'] = message_id;
                    linkData['label_name'] = label_name;
                    chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_CLIP_WEB_CONTENT_OPEN_EMAIL", url: url, data: linkData }, function (res) {

                    });
                  });
                  $(statusText).html(div);

                  // sharing content
                  $('.chq_share_content').show();
                  $('.chq_share_content button').click(function () {
                    var self = $(this);
                    self.text('Creating email ...');
                    self.attr('disabled', 'disabled');
                    var shareData = {};
                    shareData['title'] = data['title'];
                    shareData['content'] = '<p>Check out this article shared via <a href="' + ExtensionURL + '">Gmail Web Clipper</a></p>' + data['contentHtml'];
                    shareData['content'] = shareData['content'] + '<p>This content was clipped using cloudHQ <a href="' + ExtensionURL + '">Gmail Web Clipper</a> Chrome Extension. <a href="' + ExtensionURL + '">Install it for free!</a></p>';
                    chrome.runtime.sendMessage(chrome.runtime.id, { type: "CHQ_CLIP_WEB_CONTENT_SHARE", url: url, data: shareData }, function (res) {
                      self.replaceWith('<center>Email ready! Send it to your friends.</center>');
                    });
                  });

                } else {
                  statusText.innerHTML = "<div>Error Saving to Gmail!<br>Please refresh this page.</div>";
                }
              });

            } else if (json["status"] == "SIGN_UP") {
              openModal(json["content"], 320, 360);
            } else {
              openModal('Server error. Please refresh and try again!', 260, 120);
            }
          });
        }
      },
      function() {

      }); // openPreview
    });
  }

  console.log("main_gmail_web_clipper_site: extract started");

  extractWellKnownContent(function(contentData) {

    // extract content.
    var title = null, label = null;
    var contentHtml = null, contentText = null, contentType = null, documentNode = null, metadata = null;

    //console.log('extractFromHtml', extractFromHtml($('body')).html());
    //console.log('extractMetadata', extractMetadata());


    // should we extract only selection.
    if (typeof isContextMenu == 'undefined') {
      isContextMenu = false;
    }

    if (isContextMenu) {
      contentHtml = getSelectionHtml();
      contentText = window.getSelection().toString();
    }

    if (contentData) {
      if (contentData.title) {
        title = contentData.title;
      }
      if (contentData.canonical_url) {
        url = contentData.canonical_url;
      }
      if (contentData.label) {
        label = contentData.label;
      }
      contentHtml = contentData.html;
      if (!contentData.text) {
        contentText = $(contentHtml).text();
      } else {
        contentText = contentData.text;
      }
      
    }
    
    function copy_all_to_clipboard() {
      
      referenceNode = document.getElementsByTagName("html")[0];
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(referenceNode);
      selection.removeAllRanges();
      selection.addRange(range);        
      window.document.execCommand("copy");
    }    

    // now lets extract metadata
    extractMetadata(function(contentMetaData) {
      
      if (!title || $.trim(title) == '') {
        title = contentMetaData.title;
      } 

      contentType = contentMetaData.metadata['type'];

      // is screenshot just get metadata
      if (typeof cloudHQ_screenshot != 'undefined' && cloudHQ_screenshot) {
        
        contentHtml = contentMetaData.html;
        contentText = contentMetaData.text; 

      } else {

        if (false)  {
          
          try {

            referenceNode = $('article .article--post').get(0);

            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(referenceNode);
            selection.removeAllRanges();
            selection.addRange(range);        
            window.document.execCommand("copy");

            contentHtml = "check_clipboard";
            contentText = "check_clipboard";

          } catch(e){
            console.log('e=',e);
          }

        } 
        
        // if we still do not have anything then just try
        if (!contentHtml || contentHtml == "") {

          // call server to give us 
          $(':hidden').addClass('cloudHQ_markedForRemoval');

          if (!documentNode) {
            documentNode = document.cloneNode(true);
          }
          $(documentNode).find('.cloudHQ_markedForRemoval').each(function() {
            if ($(this).is('noscript')) {
              $(this).replaceWith($('<div/>').html(this.innerHTML).text());

            } else {
              $(this).remove();
            }
          });
          $(documentNode).find('img').each(function() {
            if ($(this).attr('src') && $(this).attr('src').toLowerCase().match(/\.svg$/)) {
              $(this).remove();
            } 
          });
          $(documentNode).find('.sfsibeforpstwpr').remove();
          $(documentNode).find('.sfsiaftrpstwpr').remove();
          $(documentNode).find('aside').remove();
          
          var loc = document.location;
          var uri = {
            spec: loc.href,
            host: loc.host,
            prePath: loc.protocol + "//" + loc.host,
            scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
            pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
          };

          var reader = new window.CHQWCReadability(uri, documentNode);
          var isProbablyReaderable_before = reader.isProbablyReaderable();
          var article = reader.parse();
          var isProbablyReaderable_after = reader.isProbablyReaderable();
          /*if calling from Gmail comopse don't check for readability*/
          if(typeof cloudHQ_request_tab_id !== 'undefined' && typeof article !=='undefined' && article !== null){
            console.log("not checked article:", article);
            if (article.title && article.title != "") {
              title = article.title;
            }
            contentText = article.textContent;
            contentHtml = article.content;
          } else if (contentType == 'article' || isProbablyReaderable_before || isProbablyReaderable_after || isContextMenu) {
            if(typeof article !=='undefined' && article !== null){
              console.log("article:", article);
              if (article.title && article.title != "") {
                title = article.title;
              }
              contentText = article.textContent;
              contentHtml = article.content;
            }
          }
        } 
      }

      // extract metadata
      if (!contentText || contentText === "") {
        contentHtml = contentMetaData.html;
        contentText = contentMetaData.text; 
      }
      
      if(contentMetaData.metadata){
        metadata = contentMetaData.metadata;
      }
      
      // if contentHtml does not have any image add one from metadata

      if ($(contentHtml).find('img').length == 0 && metadata.image && metadata.image.url) {
        contentHtml = '<img src="' + metadata.image.url + '"><br/><br/>' + contentHtml;
      }

      inlineCssStylesAndSave(contentHtml, contentText, title, label, url, metadata);
      
    });

  });
}

// Immediately-invoked function expression
// Load the script - just to be sure
console.log("main_gmail_web_clipper_site: extract started");
try {
  cloudHQ_run();
} catch(e) {
  var $ = window.jQuery;
  console.log('e=', e);
  $.noConflict(); var $$ = jQuery;
  cloudHQ_run();
}
console.log("main_gmail_web_clipper_site: extract ended");



