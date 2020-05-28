var url = new URL(window.location.href);
var extension_id = url.searchParams.get("extension_id");
var title = url.searchParams.get("title");

function form_submit() {

  var justification = document.getElementById("justification").value;
  chrome.runtime.sendMessage({from: "request", subject: "submit", business_justification: justification, extension_id: extension_id});

  document.getElementById("request_form").innerHTML = '<p align="center">Thank you. You will be notified when your request is approved or denied.</p>'

  return false;
}

function getExtensionMetadata() {
  fetch('https://api.crxcavator.io/v1/metadata/' + extension_id, {
    method: 'get',
  })
  .then(results => {
      return results.json();
  }).then(responseData => {
    if (responseData && responseData.icon) {
      document.getElementById("icon").src=responseData.icon
    } else {
      document.getElementById("icon_div").innerHTML='<i class="ui center aligned massive question icon"></i>'
    }
  }).catch(err => {
    console.log(err);
  });
}

window.onload = function () {
  //document.getElementById("request_form").addEventListener("submit", form_submit)
  document.getElementById("request_form").onsubmit = function() {form_submit(); return false;};
  document.getElementById("header").appendChild( document.createTextNode(title) )
  getExtensionMetadata()
}
