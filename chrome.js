(function(window, undefined){
	var pi = {
		file: {
			standardizeFile: function(file){
				data = {
					name: file.name, 
				}

				data.path = file.fullPath;
				data.displayPath = file.fullPath.replace(/^\/.*?\//, '');

				data.originalEntry = file;

				return data;
			},
			retainEntry: function(entry) {
				return chrome.fileSystem.retainEntry(entry);
			},
			chooseFile: function(opts){
				var deferred = $.Deferred();

				if (!opts) {
					opts = {type: 'openWritableFile'}
				}

				chrome.fileSystem.chooseEntry(opts, function(entry){
					entry = app.system.file.standardizeFile(entry);
					deferred.resolve(entry);
				});

				return deferred.promise();
			},
			chooseFolder: function(){
				var deferred = $.Deferred();

				chrome.fileSystem.chooseEntry({type:'openDirectory'}, function(entry){
					deferred.resolve(entry);
				});

				return deferred.promise();
			},
			refreshEntry: function(entry){
				var deferred = $.Deferred();

				// Newly saved files do not have entry ids
				if (!entry.entryId) {
					entry.entryId = chrome.fileSystem.retainEntry(entry.originalEntry);
				}

				chrome.fileSystem.isRestorable(entry.entryId, function(isRestorable){
					if (isRestorable) {
						chrome.fileSystem.restoreEntry(entry.entryId, function(originalEntry){
							entry.originalEntry = originalEntry;

							originalEntry.file(function(file) {
								entry.fileData = file;
								entry.modified = file.lastModifiedDate;

								deferred.resolve(entry);
							});
						});
					} else {
						deferred.resolve(entry);
					}
				});

				return deferred.promise();
			},
			openFile: function(entry){
				var deferred = $.Deferred();

				entry.entryId = chrome.fileSystem.retainEntry(entry.originalEntry);

				entry.originalEntry.file(function(file) {
					entry.fileData = file;
					entry.modified = file.lastModifiedDate;

					var fileReader = new FileReader();

					fileReader.onload = function(e) {
						entry.fileContents = e.target.result;

						deferred.resolve(entry);
					}

					fileReader.onerror = function(e) {
						app.Notice("Read failed: " + e.toString());
					};

					fileReader.readAsText(file);
				});
				
				return deferred.promise();
			},
			saveFile: function(entry, contents) {
				var deferred = $.Deferred();

				entry.originalEntry.createWriter(function(fileWriter) {
					fileWriter.onerror = function(e) {
						console.error("Write failed: " + e.toString());
						app.Notice("Write failed: " + e.toString());
					};

						var blob = new Blob([contents]);
					
					fileWriter.truncate(blob.size);

					fileWriter.onwriteend = function() {
						fileWriter.onwriteend = function(ev) {
							pi.file.refreshEntry(entry).done(function(){
								deferred.resolve(entry);
							});
						};

						fileWriter.write(blob);
					}

				});

				return deferred.promise();
			},
			readFolderRecursive: function(opts) {
				var reader,
					entry = opts.entry,
					callback = opts.callback,
					check = opts.check || function(){return true;},
					list = [],
					options;

				// @!! Move this
				entry = app.system.file.standardizeFile(entry);

				if (!check(entry)){
					return false;
				};

				// @!! Move this
				app.Notice('Reading ' + entry.path);

				if (entry.originalEntry.isFile) {
					callback(entry);
				} else if (entry.originalEntry.isDirectory) {
					reader = entry.originalEntry.createReader();

					reader.readEntries(function(results) {
						var i, _len;

						for (i = 0, _len = results.length; i < _len; i++) {
							// @!! Maybe don't call it this way
							pi.file.readFolderRecursive({
								entry: results[i],
								callback: callback,
								check: check
							});
						}
					});
				}
			},
			restoreFolder: function(folder){
				var deferred = $.Deferred();

				chrome.fileSystem.isRestorable(folder, function(isRestorable){
					if (isRestorable) {
						chrome.fileSystem.restoreEntry(folder, deferred.resolve);
					}
				});

				return deferred.promise();
			}
		},
		storage: {
			local: {
				set: function(data){
					return chrome.storage.local.set(data);
				},
				get: function(key){
					var deferred = $.Deferred();

					chrome.storage.local.get(key, deferred.resolve);

					return deferred.promise();
				}
			},
			set: function(data){
				// !@todo Need a queue here if not online, to be uploaded next time the client is online
				if (navigator.onLine) {
					$.ajax({
						type: 'POST',
						url: 'http://www.subtexteditor.com/api/storage.set.php',
						data: JSON.stringify(_.extend({}, data, {token: app.user.token})),
						dataType: 'json'
					});
				}

				pi.storage.local.set(data);
			},
			get: function(key){
				var deferred = $.Deferred(),
					url = 'http://www.subtexteditor.com/api/storage.get.php';

				if (navigator.onLine && url != null) {
					$.getJSON(url, {key: key, token: app.user.token}).done(function(resp){
						deferred.resolve(resp);
					});
				} else {
					chrome.storage.local.get(key, function(data){
						deferred.resolve(data);
					});
				}

				return deferred.promise();
			}
		},
		window: {
			current: function(){
				return chrome.app.window.current();
			},
			create: function(file, opts){
				var deferred = $.Deferred();

				chrome.app.window.create(file, opts, deferred.resolve);

				return deferred.promise();
			},
			close: function(){
				chrome.app.window.current().close();
			},
			getAll: function(){
				return chrome.app.window.getAll();
			}
		},
		auth: {
			google: {
				getAuthToken: function(){
					var deferred = $.Deferred();

					chrome.identity.getAuthToken({'interactive': true}, function(token) {
						deferred.resolve(token);
					});

					return deferred.promise();
				},
				getUserInfo: function(){
					var deferred = $.Deferred(),
						retry = true;

					pi.auth.google.getAuthToken().done(function(token){
						$.ajax({
							url: 'https://www.googleapis.com/plus/v1/people/me',
							type: 'GET',
							beforeSend: function(xhr) {
								xhr.setRequestHeader('Authorization', 'Bearer ' + token);
							}
						}).done(function(resp){
							deferred.resolve(resp);
						}).fail(function(jqXHR){
							if (retry) {
								retry = false;

								chrome.identity.removeCachedAuthToken(
									{'token': token},
									pi.auth.google.getUserInfo
								);
							} else {
								deferred.reject(jqXHR);
							}
						});
					});

					return deferred.promise();
				}
			}
		}
	}

	window.pi = pi;
})(window);