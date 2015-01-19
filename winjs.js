(function(window, undefined){
	var pi = {
		file: {
			standardizeFile: function(file){
				data = {
					name: file.name, 
				}

				data.path = file.path;
				data.displayPath = file.path;

				data.originalEntry = file;

				return data;
			},
			chooseFile: function(){
				var deferred = $.Deferred(),
					filePicker;

				filePicker = new Windows.Storage.Pickers.FileOpenPicker();
				filePicker.fileTypeFilter.append("*");

				filePicker.pickSingleFileAsync().done(function(file){
					file = app.system.file.standardizeFile(file);
					deferred.resolve(file);
				});	

				return deferred.promise();
			},
			chooseFolder: function(){
				var deferred = $.Deferred(),
					folderPicker;

				folderPicker = new Windows.Storage.Pickers.FolderPicker();
				folderPicker.fileTypeFilter.replaceAll(["*"]);

				folderPicker.pickSingleFolderAsync().done(function (file) {
					deferred.resolve(file);
				});

				return deferred.promise();
			},
			retainEntry: function(entry){
				console.error('Warning: pi.file.retainEntry is not yet supported in WinJS.');

				return entry;
			},
			refreshEntry: function(entry){
				var deferred = $.Deferred();

				console.error('Warning: pi.file.refreshEntry not yet supported in WinJS.');

				deferred.resolve(entry);

				return deferred.promise();
			},
			openFile: function(entry){
				var storageMode = Windows.Storage.FileAccessMode.readWrite;

				Windows.Storage.FileIO.readTextAsync(entry.originalEntry).done(function (data) {
					entry.fileData = entry.originalEntry;
					entry.fileContents = data;
					entry.modified = entry.originalEntry.dateCreated;
					
					deferred.resolve(entry);
				});
			}.
			saveFile: function(entry, contents){
				var deferred = $.Deferred();

				console.error('Warning: pi.file.saveFile not yet supported in WinJS.');

				deferred.resolve(entry);

				return deferred.promise();
			},
			readFolder: function(opts) {
				var reader,
					entry = opts.entry,
					callback = opts.callback,
					check = opts.check || function(){return true;},
					list = [],
					options;

				if (!check(entry)){
					return false;
				};

				options = new Windows.Storage.Search.QueryOptions(Windows.Storage.Search.CommonFileQuery.defaultQuery, ['*']);
				options.folderDepth = Windows.Storage.Search.FolderDepth.deep;
				
				entry.originalEntry.createFileQueryWithOptions(options).getFilesAsync().then(function (files) {
					files.forEach(function (file) {
						callback(file);
					});
				});
			},
			restoreFolder: function(folder){
				var deferred = $.Deferred();

				console.error('Warning: pi.file.restoreFolder not yet supported in WinJS.');

				deferred.resolve(entry);

				return deferred.promise();
			}
		},
		storage: {
			set: function(data){
				var deferred = $.Deferred();

				console.error('Warning: pi.storage.set not yet supported in WinJS.');

				deferred.resolve();

				return deferred.promise();
			},
			get: function(data, callback){
				var deferred = $.Deferred();

				console.error('Warning: pi.storage.get not yet supported in WinJS.');

				deferred.resolve(entry);

				return deferred.promise();
			}
		},
		window: {
			current: function(){
				console.error('Warning: pi.window.current not yet supported in WinJS.');
			},
			create: function(){
				console.error('Warning: pi.window.create not yet supported in WinJS.');
			},
			close: function(){
				console.error('Warning: pi.window.close not yet supported in WinJS.');
			},
			getAll: function(){
				console.error('Warning: pi.window.getAll not yet supported in WinJS.');
			}
		}
	}

	window.pi = pi;
})(window);
