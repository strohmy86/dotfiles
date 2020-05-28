getProviders();
getTLYCustomDomains();
var settingsSaved = function () {
	Swal.fire({
		type: 'success',
		title: 'Settings Saved',
		showConfirmButton: false,
		timer: 1500,
	});
};

$('#tly-key').val(helpers.storage.getValue('tlyapi'));

$('#tly-domain').val(helpers.storage.getValue('tlydomain'));

$('#tly-key').blur(function () {
	helpers.storage.setValue('tlyapi', $('#tly-key').val());
	getTLYCustomDomains();
});

$('#bitly-key').val(helpers.storage.getValue('bitlyapi'));
$('#rebrandly-key').val(helpers.storage.getValue('rebrandlyapi'));
$('#notification-sound').prop('checked', helpers.storage.getValue('notificationSound'));
$('#include-https').prop('checked', helpers.storage.getValue('includeHttps'));
$('#copy-to-clipboard').prop('checked', helpers.storage.getValue('copyToClipboard'));

$('#settings-form').submit(function (e) {
	e.preventDefault();

	helpers.storage.setValue('provider', $('#providers').val());
	helpers.storage.setValue('tlyapi', $('#tly-key').val());
	helpers.storage.setValue('tlydomain', $('#tly-domain').val());
	helpers.storage.setValue('bitlyapi', $('#bitly-key').val());
	helpers.storage.setValue('rebrandlyapi', $('#rebrandly-key').val());
	helpers.storage.setValue('notificationSound', $('#notification-sound')[0].checked);
	helpers.storage.setValue('includeHttps', $('#include-https')[0].checked);
	helpers.storage.setValue('copyToClipboard', $('#copy-to-clipboard')[0].checked);

	settingsSaved();
});
