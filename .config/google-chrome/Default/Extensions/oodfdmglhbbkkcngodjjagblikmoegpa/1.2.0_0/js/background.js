//Set browser for Firefox extensions to be chrome
if (typeof browser !== 'undefined') {
	window.chrome = browser;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
	chrome.runtime.onInstalled.addListener(function(details) {
		if (helpers.storage.getValue('copyToClipboard') === null) {
			helpers.storage.setValue('copyToClipboard', true);
		}

		if (details.reason == 'install') {
			chrome.tabs.create({
				url: 'https://timleland.com/link-shortener-extension-install/'
			});
		} else if (details.reason == 'update') {
		}
	});
}

if (chrome && chrome.contextMenus) {
	chrome.contextMenus.create({
		title: 'Shorten Link and Copy',
		type: 'normal',
		contexts: ['link', 'page', 'image'],
		onclick: function(data) {
			if (data && data.mediaType === 'image' && data.srcUrl) {
				getShortLink(data.srcUrl);
			} else if (data && data.linkUrl) {
				getShortLink(data.linkUrl);
			} else if (data && data.pageUrl) {
				getShortLink(data.pageUrl);
			}
		}
	});
}
