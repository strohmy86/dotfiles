function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


function getExtensionInfo() {
  chrome.identity.getProfileUserInfo(function(userInfo) {
   chrome.management.getAll(function(extensionInfo) {
      var data = {};

      for (var i = 0; i < extensionInfo.length; i++) {
        data[extensionInfo[i].id] = {'version': extensionInfo[i].version, 'name': extensionInfo[i].name}
      }

      chrome.storage.sync.get(['data'], function(result) {
          if (JSON.stringify(data) != result.data) {
            console.log("Change detected")
            chrome.storage.managed.get('secret', function(result) {
              postData(data, userInfo.email, result.secret)
            });
          } else {
            console.log("No change")
          }
      });
     });
  });
}


function postData(data, user, secret) {
  fetch('https://api.crxcavator.io/v1/group/users/extensions/' + user, {
    method: 'post',
    body: JSON.stringify({
      extensions: data,
      secret: secret
    })
  })
  .then(results => {
    console.log(results)
      return results.json();
  }).then(responseData => {
    console.log(responseData)
    chrome.storage.sync.set({data: JSON.stringify(data)}, function() {
      });
  }).catch(err => {
    console.log(err);
  });

}

chrome.storage.managed.get('enable_collect_extensions', function(result) {
  if (result.enable_collect_extensions == true) {
    chrome.alarms.create("Grab_Extension_Info", {
      delayInMinutes: getRandomInt(55) + 1,
      periodInMinutes: 60
    });
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === "Grab_Extension_Info") {
    getExtensionInfo();
  }
});


function showBlockedNotification(extension_id, title) {
  chrome.notifications.create(extension_id + "_" + title , {
    "message": "Click here to if you'd like to request this extension",
    "type": "basic",
    "title": "Requires Approval",
    "iconUrl": "icons/128x128.png",
    "requireInteraction": true})
}


function handleDiscoveredExtension(extension_id, secret, title) {
  fetch('https://api.crxcavator.io/v1/group/extensions/query/' + extension_id, {
    method: 'post',
    body: JSON.stringify({
      secret: secret
    })
  })
  .then(results => {
      return results.json();
  }).then(responseData => {

    if (responseData.found == false) {
      showBlockedNotification(extension_id, title)
    }

  }).catch(err => {
    console.log(err);
  });
}

function submitExtensionRequest(extension_id, business_justification) {
    chrome.identity.getProfileUserInfo(function(userInfo) {
      chrome.storage.managed.get('secret', function(result) {
        fetch('https://api.crxcavator.io/v1/group/extensions/request', {
          method: 'post',
          body: JSON.stringify({
            secret: result.secret,
            extensionID: extension_id,
            username: userInfo.email,
            businessJustification: business_justification
          })
        })
        .then(results => {
            return results.json();
        }).then(responseData => {
          console.log(responseData)
        }).catch(err => {
          console.log(err);
        });
      });
    })
}


chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  if ((msg.from === 'request') && (msg.subject === 'submit')) {
    submitExtensionRequest(msg.extension_id, msg.business_justification)
    response("Success");
  }
});


chrome.storage.managed.get('enable_extension_requesting', function(result) {
  if (result.enable_extension_requesting == true) {
    chrome.tabs.onUpdated.addListener(function(tab_id, change_info, tab) {
        if (tab.active == true && change_info.title && change_info.title.endsWith(" - Chrome Web Store") && tab.url.startsWith('https://chrome.google.com/webstore/detail/')) {
          chrome.storage.managed.get('secret', function(result) {
            handleDiscoveredExtension(tab.url.split("/")[6].split("?")[0], result.secret, change_info.title.slice(0, -19))
          })
        }
    });
  }
});


chrome.notifications.onClicked.addListener(function(notificationId) {
  chrome.tabs.create({ url: "chrome-extension://jonckgamcbbnkkoagphccopgcjocaggf/src/pages/request.html?extension_id=" + notificationId.split("_")[0] + "&title=" + notificationId.split("_")[1] });
  chrome.notifications.clear(notificationId)
})
