//third_party/javascript/foam/v0_1/js/foam/chromeapp/ui/ZoomView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.chromeapp.ui',

  name: 'ZoomView',
  extendsModel: 'View',

  imports: [ 'window', 'document' ],

  documentation: 'Add zoom in/out support to ChromeApps.',

  properties: [
    {
      name: 'zoom',
      defaultValue: 1,
      postSet: function(_, z) { this.document.body.style.zoom = z; }
    }
  ],
  methods: {
    resizeBy: function(dx, dy) {
      this.window.resizeBy(dx, dy);

      // generate a resize event in case the window is already maximized
      // so that components that relayout on resize will still relayout
      var event = this.document.createEvent('Event');
      event.initEvent('resize', true, true);
      this.document.dispatchEvent(event);
    }
  },
  actions: [
    {
      name: 'zoomIn',
      keyboardShortcuts: [ 'ctrl-shift-187', 'ctrl-187' ],
      action: function() {
        this.resizeBy(this.document.body.clientWidth/10, this.document.body.clientHeight/10);
        this.zoom *= 1.1;
      }
    },
    {
      name: 'zoomOut',
      keyboardShortcuts: [ 'ctrl-shift-189', 'ctrl-189' ],
      action: function() {
        this.resizeBy(-this.document.body.clientWidth/10, -this.document.body.clientHeight/10);
        this.zoom /= 1.1;
      }
    },
    {
      name: 'zoomReset',
      action: function() { this.zoom = 1.0; }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/core/dao/CloningDAO.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.core.dao',
  name: 'CloningDAO',
  extendsModel: 'ProxyDAO',
  methods: {
    select: function(sink, options) {
      sink = sink || [].sink;
      var future = afuture();
      this.delegate.select({
        put: function(obj, s, fc) {
          obj = obj.deepClone();
          sink.put && sink.put(obj, s, fc);
        },
        error: function() {
          sink.error && sink.error.apply(sink, argumentS);
        },
        eof: function() {
          sink.eof && sink.eof();
          future.set(sink);
        }
      }, options);
      return future.get;
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/core/dao/MergeDAO.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.core.dao',
  name: 'MergeDAO',
  extendsModel: 'ProxyDAO',

  properties: [
    {
      model_: 'FunctionProperty',
      name: 'mergeStrategy',
      required: true
    }
  ],

  methods: {
    put: function(obj, sink) {
      var self = this;
      this.delegate.find(obj.id, {
        put: function(oldValue) {
          aseq(
            function(ret) {
              self.mergeStrategy(ret, oldValue, obj);
            },
            function(ret, obj) {
              self.delegate.put(obj, sink);
            })();
        },
        error: function() {
          // TODO: Distinguish internal versus external errors.
          self.delegate.put(obj, sink);
        }
      });
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/core/dao/StripPropertiesDAO.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.core.dao',
  name: 'StripPropertiesDAO',
  extendsModel: 'ProxyDAO',
  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'propertyNames'
    }
  ],
  methods: {
    process_: function(obj) {
      obj = obj.clone();
      for ( var i = 0 ; i < this.propertyNames.length ; i++ ) {
        obj.clearProperty(this.propertyNames[i]);
      }
      return obj;
    },
    select: function(sink, options) {
      sink = sink || [].sink;
      var self = this;
      var future = afuture();

      this.SUPER({
        put: function(obj, _, fc) {
          sink.put && sink.put(self.process_(obj), null, fc);
        },
        error: function() {
          sink.error && sink.error.apply(sink, arguments);
        },
        eof: function() {
          sink.eof && sink.eof();
        }
      }, options)(function() {
        future.set(sink);
      });

      return future.get;
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/core/dao/Sync.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.core.dao',
  name: 'Sync',
  properties: [
    {
      name: 'local',
      hidden: true
    },
    {
      name: 'remote',
      hidden: true
    },
    {
      name: 'localVersionProp',
      hidden: true,
    },
    {
      name: 'remoteVersionProp',
      hidden: true,
    },
    {
      name: 'deletedProp',
      hidden: true
    },
    {
      model_: 'IntProperty',
      name: 'syncs'
    },
    {
      model_: 'BooleanProperty',
      name: 'syncing',
      defaultValue: false
    },
    {
      model_: 'IntProperty',
      help: 'Number of objects to sync from client if client store is empty.  0 to sync them all',
      name: 'initialSyncWindow',
      defaultValue: 0
    },
    {
      model_: 'IntProperty',
      name: 'syncedFromServer',
    },
    {
      model_: 'IntProperty',
      name: 'syncedFromClient'
    },
    {
      model_: 'IntProperty',
      name: 'purgedFromClient'
    }
  ],

  methods: {
    purge: function(ret, remoteLocal) {
      var local = this.local;
      local = local.where(
        AND(
          LTE(this.localVersionProp, remoteLocal),
          EQ(this.deletedProp, true)));
      local.removeAll(COUNT())(ret);
    }
  },

  actions: [
    {
      name: 'sync',
      isEnabled: function() { return ! this.syncing; },
      action: function() {
        this.syncing = true;
        this.syncs += 1;

        var self = this;

        aseq(
          apar(
            aseq(
              function(ret) {
                self.local.select(MAX(self.remoteVersionProp))(function(m) {
                  ret((m && m.max) || 0);
                });
              },
              function(ret, localRemote) {
                var remote = self.remote;
                if ( localRemote == 0 && self.initialSyncWindow > 0 ) {
                  remote = remote.limit(self.initialSyncWindow);
                }
                remote = remote.where(GT(self.remoteVersionProp, localRemote));
                remote.select(SEQ(self.local, COUNT()))(ret);
              }),
            aseq(
              function(ret) {
                self.remote.select(MAX(self.localVersionProp))(function(m) {
                  ret((m && m.max) || 0);
                });
              },
              apar(
                function(ret, remoteLocal) {
                  var local = self.local;
                  local = local.where(GT(self.localVersionProp, remoteLocal));
                  local.select(SEQ(self.remote, COUNT()))(ret);
                },
                self.purge.bind(self)))),
          function(ret, downstream, upstream, purged) {
            self.syncedFromServer += downstream.args[1].count;
            self.syncedFromClient += upstream.args[1].count;
            self.purgedFromClient -= purged.count;
            ret();
          })(function() {
            self.syncing = false;
          });
      }
    }
  ],
});

//third_party/javascript/foam/v0_1/js/foam/core/dao/VersionNoDAO.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.core.dao',
  name: 'VersionNoDAO',

  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'property',
      type: 'Property',
      required: true,
      hidden: true,
      transient: true
    },
    {
      model_: 'IntProperty',
      name: 'version',
      defaultValue: 1
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      var future = afuture();
      this.WHEN_READY = future.get;

      // Scan all DAO values to find the largest
      this.delegate.select(MAX(this.property))(function(max) {
        if ( max.max ) this.version = max.max + 1;
        future.set(true);
      }.bind(this));
    },
    put: function(obj, sink) {
      this.WHEN_READY(function() {
        var val = this.property.f(obj);
        obj[this.property.name] = this.version++;
        this.delegate.put(obj, sink);
      }.bind(this));
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/dao/ChromeFile.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ChromeFile',
  package: 'foam.dao',

  ids: ['path'],

  constants: [
    {
      name: 'DIR_MIME_TYPE',
      value: ''
    },
    {
      name: 'DEFAULT_MIME_TYPE',
      value: 'text/plain'
    }
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'path',
      defaultValue: '',
      required: true
    },
    {
      model_: 'StringProperty',
      name: 'parentPath',
      defaultValue: '',
      required: true
    },
    // {
    //   name: 'fileSystem',
    //   type: 'foam.dao.ChromeFileSystem',
    //   defaultValue: null
    // },
    // Directory only:
    {
      model_: 'BooleanProperty',
      name: 'isDirectory',
      defaultValue: false
    },
    {
      model_: 'ArrayProperty',
      name: 'entries',
      defaultValue: []
    },
    // File only:
    {
      model_: 'StringProperty',
      name: 'mimeType',
      defaultValue: ''
    },
    {
      model_: 'StringProperty',
      name: 'contents',
      defaultValue: ''
    }
  ],

  relationships: [
    {
      relatedModel: 'foam.dao.ChromeFile',
      relatedProperty: 'parentPath'
    }
  ]

  // actions: [
  //   {
  //     name: 'expand',
  //     action: function() {
  //       if ( ! this.isDirectory ) return false;
  //       this.loadEntries();
  //       return true;
  //     }
  //   }
  // ],

  // methods: [
  //   {
  //     name: 'agetEntries',
  //     code: function() {
  //       if ( ! this.isDirectory ||
  //           ! this.fileSystem ||
  //           ! this.fileSystem.ready )
  //         return aconstant({ error: {
  //           message: 'Attempt to agetEntries in bad state'
  //         } });
  //       return this.fileSystem.aentries(this.path).aseq(function(ret, entries) {
  //         this.entries = entries;
  //         ret && ret(entries);
  //         return entries;
  //       }.bind(this));
  //     }
  //   },
  //   {
  //     name: 'agetContents',
  //     code: function() {
  //       if ( this.isDirectory ||
  //           ! this.fileSystem ||
  //           ! this.fileSystem.ready )
  //         return aconstant({ error: {
  //           message: 'Attempt to agetContents in bad state'
  //         } });
  //       return this.fileSystem.aread(this.path).aseq(function(ret, entries) {
  //         this.entries = entries;
  //         ret && ret(entries);
  //         return entries;
  //       }.bind(this));
  //     }
  //   }
  // ]
});

//third_party/javascript/foam/v0_1/js/foam/dao/ChromeFileSystem.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

MODEL({
  name: 'ChromeFileSystem',
  package: 'foam.dao',

  requires: [
    'foam.dao.ChromeFile'
  ],

  properties: [
    {
      name: 'cfs',
      factory: function() {
        return chrome.fileSystem;
      }
    },
    {
      name: 'root',
      defaultValue: null
    },
    {
      name: 'rootChromeFile',
      type: 'foam.dao.ChromeFile',
      defaultValue: null
    },
    {
      model_: 'StringProperty',
      name: 'suggestedDirName',
      defaultValue: ''
    },
    {
      model_: 'BooleanProperty',
      name: 'ready',
      defaultValue: false
    },
    {
      name: 'error',
      defaultValue: undefined
    },
    {
      model_:  'StringProperty',
      name:  'mode',
      defaultValue: 'read-write',
      view: {
        factory_: 'ChoiceView',
        choices: [
          'read-only',
          'read-write'
        ]
      }
    },
    {
      name: 'getDirectoryConfig',
      factory: function() { return { create: true, exclusive: false }; }
    },
    {
      name: 'getFileConfig',
      factory: function() { return { create: true, exclusive: false }; }
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.SUPER();

        Events.map(
            this.root$,
            this.rootChromeFile$,
            function(dirEntry) {
              return ! dirEntry ? null : this.ChromeFile.create({
                path: dirEntry.fullPath,
                parentPath: dirEntry.fullPath.slice(
                    0,
                    dirEntry.fullPath.lastIndexOf('/')),
                isDirectory: dirEntry.isDirectory
              });
            }.bind(this));

        var config = { type: 'openDirectory' };
        if ( this.suggestedDirName )
          config.suggestedName = this.suggestedDirName;
        var seq = [this.chooseEntry.bind(this, config)];
        if ( this.mode === 'read-write' )
          seq.push(this.getWritableEntry.bind(this));
        seq.push(this.putRoot.bind(this));
        return aseq.apply(null, seq)();
      }
    },
    {
      name: 'chooseEntry',
      code: function(config, ret) {
        this.cfs.chooseEntry(config, ret);
      }
    },
    {
      name: 'getWritableEntry',
      code: function(ret, dirEntry) {
        if ( this.checkForError(dirEntry, ret, 'getWritableEntry') )
          return dirEntry;
        this.cfs.getWritableEntry(dirEntry, ret);
        return dirEntry;
      }
    },
    {
      name: 'putRoot',
      code: function(ret, dirEntry) {
        if ( this.checkForError(dirEntry, ret, 'putRoot') ) return dirEntry;
        this.root = dirEntry;
        this.ready = true;
        this.clearError();
        ret && ret(dirEntry);
        return dirEntry;
      }
    },
    {
      name: 'awrite',
      code: function(rawPath, data) {
        if ( this.mode !== 'read-write' ) throw 'Cannot write to ' +
            'non-read-write Chrome filesystem';
        var path = this.canonicalizePath(rawPath);
        if ( path[0] === '..' ) throw 'Cannot write to path: ' + path;
        var writeCtx = { path: '/' + path.join('/') };
        var seq = [];
        for ( var i = 0; i < path.length - 1; ++i ) {
          seq.push(this.getDirectory.bind(this, writeCtx, path[i]));
        }
        seq.push(this.getFile.bind(this, writeCtx, path[path.length - 1]));
        seq.push(this.createWriter.bind(this, writeCtx));
        seq.push(this.writeFile.bind(this, writeCtx, data));
        return aseq.apply(null, seq);
      }
    },
    {
      name: 'aread',
      code: function(rawPath, opt_mimeType) {
        console.log('aread', rawPath, opt_mimeType);
        var path = this.canonicalizePath(rawPath);
        if ( path[0] === '..' ) throw 'Cannot read from: ' + path;
        var readCtx = { mimeType: opt_mimeType };
        var seq = [];
        for ( var i = 0; i < path.length - 1; ++i ) {
          seq.push(this.getDirectory.bind(this, readCtx, path[i]));
        }
        seq.push(this.getFile.bind(this, readCtx, path[path.length - 1]));
        seq.push(this.getFile_.bind(this, readCtx));
        seq.push(this.readFile.bind(this, readCtx));
        return aseq.apply(null, seq);
      }
    },
    {
      name: 'aentries',
      code: function(rawPath, sink) {
        var path = this.canonicalizePath(rawPath);
        if ( path[0] === '..' ) throw 'Cannot get entries from: ' + path;
        var readCtx = { sink: sink, entries: [] };
        var seq = [];
        for ( var i = 0; i < path.length; ++i ) {
          seq.push(this.getDirectory.bind(this, readCtx, path[i]));
        }
        seq.push(this.startReadEntries.bind(this, readCtx));
        seq.push(this.readMoreEntries.bind(this, readCtx));
        return aseq.apply(null, seq);
      }
    },
    {
      name: 'aentriesAll',
      code: function(rawPath, sink) {
        console.log('aentriesAll_', rawPath);
        var ctx = {
          sink: sink,
          future: afuture(),
          entries: []
        };
        var allSink = {
          put: function(X, o) {
            X.entries.push(o);
            X.sink && X.sink.put && X.sink.put(o);
          }.bind(this, ctx),
          error: function(X, e) {
            X.sink && X.sink.error && X.sink.error(e);
          }.bind(this, ctx)
        };
        this.aentriesAll_(ctx, rawPath, allSink);
        return ctx.future.get;
      }
    },
    {
      name: 'aentriesAll_',
      code: function(X, rawPath, sink) {
        console.log('aentriesAll_', rawPath);
        this.aentries(rawPath, sink)(function(X, sink, chromeFiles) {
          chromeFiles.forEach(function(X, sink, chromeFile) {
            if ( chromeFile.isDirectory ) {
              var properDirName = chromeFile.path.slice(
                  this.rootChromeFile.path.length);
              console.log('Recurse into dir', properDirName);
              this.aentriesAll_(X, properDirName, sink);
            }
          }.bind(this, X, sink));
        }.bind(this, X, sink));
      }
    },
    {
      name: 'startReadEntries',
      code: function(X, ret, dirEntry) {
        console.log('startReadEntries', dirEntry);
        if ( this.checkForError(dirEntry, undefined, 'startReadEntries') ) {
          X && X.sink && X.sink.error && X.sink.error(this.error);
          ret && ret(this.error);
          return dirEntry;
        }
        var dirReader = dirEntry.createReader();
        X.dirReader = dirReader;
        dirReader.readEntries(ret, ret);
        return dirReader;
      }
    },
    {
      name: 'readMoreEntries',
      code: function(X, ret, entries) {
        console.log('readMoreEntries', entries);
        if ( this.checkForError(entries, undefined, 'startReadEntries') ) {
          X && X.sink && X.sink.error && X.sink.error(this.error);
          ret && ret(this.error);
          return entries;
        }
        if ( ! entries.length ) {
          ret && ret(X.entries);
          return entries;
        }
        entries.forEach(function(X, entry) {
          var chromeFile = this.ChromeFile.create({
            path: entry.fullPath,
            parentPath: entry.fullPath.slice(
                0,
                entry.fullPath.lastIndexOf('/')),
            isDirectory: entry.isDirectory
          });
          if ( entry.isDirectory ) {
            X && X.sink && X.sink.put && X.sink.put(chromeFile);
            X.entries.push(chromeFile);
          } else {
            this.getFile_({}, function(chromeFile, file) {
              chromeFile.mimeType = file.type;
              X && X.sink && X.sink.put && X.sink.put(chromeFile);
              X.entries.push(chromeFile);
            }.bind(this, chromeFile), entry);
          }
        }.bind(this, X));
        var cb = this.readMoreEntries.bind(this, X, ret);
        X.dirReader.readEntries(cb, cb);
        return X.dirReader;
      }
    },
    {
      name: 'getDirectory',
      code: function(X, dirName, ret, dirEntry) {
        console.log('getDirectory', dirName, dirEntry);
        var source = dirEntry || this.root;
        if ( this.checkForError(source, ret, 'getDirectory') ) return source;
        return source.getDirectory(
            dirName,
            this.getDirectoryConfig,
            ret,
            ret);
      }
    },
    {
      name: 'getFile',
      code: function(X, fileName, ret, dirEntry) {
        console.log('getFile', fileName, dirEntry);
        var source = dirEntry || this.root;
        if ( this.checkForError(source, ret, 'getFile') ) return source;
        return source.getFile(
            fileName,
            this.getFileConfig,
            ret,
            ret);
      }
    },
    {
      name: 'getFile_',
      code: function(X, ret, fileEntry) {
        console.log('getfile_', fileEntry);
        if ( this.checkForError(fileEntry, ret, 'getFile_') ) return fileEntry;
        X.fileEntry = fileEntry;
        return fileEntry.file(ret, ret);
      }
    },
    {
      name: 'readFile',
      code: function(X, ret, file) {
        console.log('readFile', file);
        if ( this.checkForError(file, ret, 'readFile') ) return file;
        if ( X.mimeType && file.type !== X.mimeType ) {
          var errMsg = 'Unexpected MIME type: "' + file.type + '" ' +
              '(expected "' + X.mimeType + '")';
          this.console.warn(errMsg);
          ret && ret({ error: { message: errMsg } });
          return file;
        }

        X.file = file;
        var fileReader = new FileReader();
        var cbX = Object.create(X);
        cbX.done = false;

        var cb = function(X, ret, e) {
          if ( X.done ) return;
          // TODO(markdittmer): We do not handle errors here (yet).
          var args = argsToArray(arguments);
          X.done = true;
          ret && ret.call(this, this.ChromeFile.create({
            path: X.fileEntry.fullPath,
            parentPath: X.fileEntry.fullPath.slice(
                0,
                X.fileEntry.fullPath.lastIndexOf('/')),
            isDirectory: false,
            mimeType: X.file.type,
            contents: e.target.result
          }));
        }.bind(this, cbX, ret);
        fileReader.onloadend = cb;
        fileReader.onerror = cb;
        fileReader.readAsText(file);
        return fileReader;
      }
    },
    {
      name: 'createWriter',
      code: function(X, ret, fileEntry) {
        console.log('createWriter', fileEntry);
        if ( this.checkForError(fileEntry, ret, 'crateWriter') )
          return fileEntry;
        fileEntry.createWriter(ret, ret);
        return fileEntry;
      }
    },
    {
      name: 'writeFile',
      code: function(X, data, ret, fileWriter) {
        console.log('writeFile', data.slice(0, 19), fileWriter);
        if ( this.checkForError(fileWriter, ret, 'writeFile') )
          return fileWriter;
        var cbX = Object.create(X);
        cbX.done = false;
        cbX.contents = data;
        cbX.mimeType = 'text/plain';
        var cb = function(X, ret, e) {
          if ( X.done ) return;
          if ( this.isFileError(e) ) {
            this.error = e;
            X.error = e;
          }
          X.event = e;
          X.done = true;
          ret && ret.call(this, X);
        }.bind(this, cbX, ret);
        fileWriter.onwriteend = cb;
        fileWriter.onerror = cb;
        fileWriter.write(new Blob([data], {type: cbX.mimeType}));
        return fileWriter;
      }
    },
    {
      name: 'canonicalizePath',
      code: function(path) {
        var parts = path.split('/').filter(function(part) {
          return part !== '.';
        });
        for ( var i = 1; i < parts.length; ++i ) {
          if ( i > 0 && parts[i] === '..' && parts[i - 1] !== '..' ) {
            parts = parts.slice(0, i - 1).concat(parts.slice(i + 1));
            i = i - 2;
          }
        }
        return parts;
      }
    },
    {
      name: 'isFileError',
      code: function(o) {
        return o && o.constructor &&
            o.constructor.toString().indexOf('function FileError(') === 0;
      }
    },
    {
      name: 'checkForError',
      code: function(arg, ret, contextStr) {
        if ( chrome.runtime.lastError ) {
          this.error = chrome.runtime.lastError;
        } else if ( this.isFileError(arg) ) {
          this.error = arg;
        } else if ( ! arg ) {
          this.error = {
            message: 'Missing argument in context: "' + contextStr + '"'
          };
        }
        if ( this.error ) {
          ret && ret({ error: this.error });
          return true;
        }
        return false;
      }
    },
    {
      name: 'clearError',
      code: function() { this.error = undefined; }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/dao/ChromeFileSystemDAO.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

MODEL({
  name: 'ChromeFileSystemDAO',
  package: 'foam.dao',
  extendsModel: 'AbstractDAO',

  requires: [
    'foam.dao.ChromeFileSystem'
  ],

  imports: [
    'console'
  ],

  properties: [
    {
      name: 'cfs',
      factory: function() {
        return this.ChromeFileSystem.create();
      }
    }
  ],

  methods: [
    {
      name: 'put',
      code: function(o, sink) {
        this.cfs.awrite(o.path, o.contents)(function(o, sink, status) {
          if ( status.error ) {
            sink && sink.error && sink.error(status.error);
            return status.error;
          }
          if ( status.mimeType ) o.mimeType = status.mimeType;
          sink && sink.put && sink.put(o);
          return o;
        }.bind(this, o, sink));
      }
    },
    {
      name: 'find',
      code: function(hash, sink) {
        this.console.assert(hash.path);
        this.cfs.aread(hash.path)(function(sink, o) {
          if ( o.error ) {
            sink && sink.error && sink.error(o.error);
            return o.error;
          }
          sink && sink.put && sink.put(o);
          return o;
        }.bind(this, sink));
      }
    }// ,
    // {
    //   name: 'select',
    //   code: function(sink, options) {
    //     return this.cfs.aentriesAll(this.decorateSink_(sink, options));
    //   }
    // }
  ],

  actions: [
    {
      name: 'testWrite',
      action: function() {
        this.cfs.awrite('test/test.txt', 'Hello world!\n')(function() {
          console.log('Write', arguments);
          this.cfs.clearError();
        }.bind(this));
      }
    },
    {
      name: 'testRead',
      action: function() {
        this.cfs.aread('test/test.txt')(function() {
          console.log('Read', arguments);
          this.cfs.clearError();
        }.bind(this));
      }
    },
    {
      name: 'testEntries',
      action: function() {
        this.cfs.aentries(
            '/test',
            {
              put: function(o) { console.log('Put', o); },
              error: function(e) { console.log('Error', e); },
              eof: function() { console.log('EOF'); }
            })(function() {
              console.log('Entries done', arguments);
              this.cfs.clearError();
            }.bind(this));
      }
    },
    {
      name: 'testEntriesAll',
      action: function() {
        this.cfs.aentriesAll(
            '/',
            {
              put: function(o) { console.log('Put', o.path); },
              error: function(e) { console.log('Error', e); },
              eof: function() { console.log('EOF'); }
            })(function() {
              console.log('Entries all done', arguments);
              this.cfs.clearError();
            }.bind(this));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/dao/DatastoreDAO.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

MODEL({
  name: 'DatastorePropertyTrait',
  documentation: 'Enhances a property model with (de)serialization to Google Cloud Datastore\'s JSON format.',
  properties: [
    {
      name: 'datastoreKey',
      documentation: 'The key that should be used for this property in the datastore. Defaults to the FOAM property\'s name.',
      defaultValueFn: function() { return this.name; }
    }
  ],

  constants: {
    TYPE_MAP: {
      'int': 'integerValue',
      'Int': 'integerValue',
      'String': 'stringValue',
      'string': 'stringValue',
      'Boolean': 'booleanValue',
      'float': 'doubleValue',
      'datetime': 'dateTimeValue'
    }
  },

  methods: {
    fromDatastore: function(json) {
      // Keys, blobs, lists and entities require special handling.
      // I'm not going to handle them for now, but as needed.
      // TODO(braden): Datastore should support Key properties.
      // TODO(braden): Datastore should support list properties.
      // TODO(braden): Datastore should support Entity properties.
      // TODO(braden): Datastore should support Blob properties.
      if ( this.TYPE_MAP[this.type] ) {
        var key = this.TYPE_MAP[this.type];
        return json[key];
      } else {
        console.warn('Skipping property ' + this.name + ' because it has unknown type "' + this.type + '".');
      }
    },
    toDatastore: function(value) {
      if ( this.TYPE_MAP[this.type] ) {
        var key = this.TYPE_MAP[this.type];
        var obj = {};
        obj[key] = value;
        return obj;
      } else {
        console.warn('Skipping property ' + this.name + ' because it has unknown type "' + this.type + '".');
      }
    }
  }
});

MODEL({
  name: 'DatastoreSerializationTrait',
  requires: ['DatastoreKey'],
  methods: {
    // Takes the JSON-parsed object from the Datastore and pulls it apart into
    // the FOAM model.
    fromDatastore: function(json) {
      // Datastore object is a "key" field and "properties" object.
      // Ignoring the key for now, iterate the properties object.
      var key = this.DatastoreKey.create({ path: json.key.path });
      this.id = key.string;

      for ( var i = 0 ; i < this.model_.properties.length ; i++ ) {
        var prop = this.model_.properties[i];
        if ( prop.datastoreKey ) {
          this[prop.name] = prop.fromDatastore(json.properties[prop.datastoreKey]);
        }
      }
    },

    toDatastore: function() {
      // Returns the serialized object with its key and properties.
      var json = {
        properties: {}
      };
      if ( this.id ) {
        var key = this.DatastoreKey.create({ string: this.id });
        json.key = { path: key.path };
      }

      for ( var i = 0 ; i < this.model_.properties.length ; i++ ) {
        var prop = this.model_.properties[i];
        if ( prop.datastoreKey ) {
          json.properties[prop.datastoreKey] = prop.toDatastore(this[prop.name]);
        }
      }
      return json;
    }
  }
});

MODEL({
  name: 'DatastoreIntProperty',
  extendsModel: 'IntProperty',
  traits: ['DatastorePropertyTrait']
});

MODEL({
  name: 'DatastoreStringProperty',
  extendsModel: 'StringProperty',
  traits: ['DatastorePropertyTrait']
});

MODEL({
  name: 'DatastoreFloatProperty',
  extendsModel: 'FloatProperty',
  traits: ['DatastorePropertyTrait']
});

MODEL({
  name: 'DatastoreDateTimeProperty',
  extendsModel: 'DateTimeProperty',
  traits: ['DatastorePropertyTrait']
});

MODEL({
  name: 'DatastoreBooleanProperty',
  extendsModel: 'BooleanProperty',
  traits: ['DatastorePropertyTrait']
});


MODEL({
  name: 'Datastore',
  documentation: 'Wrapper for the googleapis calls around the Datastore.',
  properties: [
    {
      name: 'datasetId',
      required: true
    },
    {
      name: 'gapi',
      factory: function() {
        return require('googleapis');
      }
    },
    {
      name: 'clientFuture',
      factory: function() {
        var comp = new this.gapi.auth.Compute();
        var fut = afuture();
        var self = this;
        comp.authorize(function(err) {
          if ( err ) {
            console.error('Google API auth error: ' + err);
            return;
          }
          self.gapi.discover('datastore', 'v1beta2')
              .withAuthClient(comp)
              .execute(function(err, client) {
                if ( err ) {
                  console.error('Google API discovery error: ' + err);
                  return;
                }
                fut.set(client.datastore.withDefaultParams({
                  datasetId: self.datasetId
                }).datasets);
              });
        });
        return fut.get;
      }
    }
  ],

  methods: {
    withClientExecute: function(method, payload) {
      return aseq(
        this.clientFuture,
        function(ret, client) {
          client[method](payload).execute(function(err, res) {
            if (err) {
              console.error('Error in ' + method + ' call: ' + require('util').inspect(err, { depth: null }));
              return;
            }
            ret(res);
          });
        }
      );
    }
  }
});

MODEL({
  name: 'DatastoreKey',
  properties: [
    {
      name: 'path',
      factory: function() { return []; },
      postSet: function(old, nu) {
        delete this.instance_['string'];
      }
    },
    {
      name: 'string',
      getter: function() {
        if ( ! this.instance_['string'] ) {
          var str = '';
          for ( var i = 0 ; i < this.path.length ; i++ ) {
            str += '/' + this.path[i].kind + '/' + this.path[i].id;
          }
          this.instance_['string'] = str;
        }

        return this.instance_['string'];
      },
      setter: function(nu) {
        var parts = nu.split('/');
        var path = [];
        for ( var i = 1 ; i < parts.length ; i += 2 ) {
          path.push({ kind: parts[i], id: parts[i+1] });
        }
        this.path = path;
        this.instance_['string'] = nu; // Needs to be at the end, or it will get overwritten.
      }
    }
  ]
});


MODEL({
  name: 'DatastoreDAO',
  extendsModel: 'AbstractDAO',
  requires: [
    'DatastoreKey'
  ],

  documentation: function() {/*
    <p>Represents a connection to the Datastore JSON API. Will support all of the DAO operations eventually.</p>
    <p>Keys are represented in the Datastore as one or more (EntityType, ID) pairs. In the DAO, these are handled by keys of the form: <tt>/EntityType1/id1/EntityType2/id2</tt>. Therefore other DAOs see an opaque string ID, as they expect, while the DatastoreDAO can extract the structure.</p>
    <p>$$DOC{ref:".put"} knows how to allocate IDs for new entities without one, and it will prepend any $$DOC{ref:".keyPrefix"} you have defined.</p>
  */},

  imports: [
    'datastore'
  ],
  properties: [
    {
      name: 'model',
      required: true
    },
    {
      name: 'kind',
      documentation: 'The Datastore Entity kind for this DAO. Defaults to the model name.',
      defaultValueFn: function() { return this.model.name; }
    },
    {
      name: 'keyPrefix',
      documentation: 'Set this to a string ("/SomeEntity/someId/AnotherEntity/otherId"), array thus [{ kind: "SomeEntity", id: "someId" }, { kind: "AnotherEntity", id: "otherId" }], or DatastoreKey.',
      factory: function() { return this.DatastoreKey.create(); },
      preSet: function(old, nu) {
        if ( this.DatastoreKey.isInstance(nu) ) return nu;
        if ( Array.isArray(nu) ) return this.DatastoreKey.create({ path: nu });
        if ( typeof nu === 'string' ) return this.DatastoreKey.create({ string: nu });

        console.warn('Unknown keyPrefix! ' + nu);
        return nu;
      }
    }
  ],

  methods: {
    find: function(id, sink) {
      if ( typeof id === 'object' ) id = id.id;
      // id should be the /EntityType1/id1/Type2/id2 string.
      // TODO: Datastore /lookup API supports multiple keys at a time, even for
      // different entities. Could batch these together, and reduce bills.

      // TODO: Lookups can integrate with a transaction, but need not. If they
      // are part of a transaction, they will be consistent with edits made so
      // far in the transaction.
      // Currently ignoring this, and letting the consistency be the default
      // (strong for ancestor queries, ie. those with key length > 1, eventual
      // otherwise.
      var key = this.DatastoreKey.create({ string: id });
      var req = { keys: [{ path: key.path }] };

      aseq(this.datastore.withClientExecute('lookup', req))(function(res) {
        // Response contains "found", "missing" and "deferred" sections.
        // No idea how to handle "deferred", but "found" is put() and "missing"
        // is error().
        if ( res.deferred && res.deferred.length ) {
          // TODO(braden): Handle "deferred".
          console.warn('Deferred response to find(). Not implemented.');
        }

        if ( res.found && res.found.length ) {
          var obj = this.model.create();
          console.log(res.found[0].entity);
          obj.fromDatastore(res.found[0].entity);
          sink && sink.put && sink.put(obj);
        } else if ( res.missing && res.missing.length ) {
          sink && sink.error && sink.error('Failed to find ' + id);
        }
      }.bind(this));
    },

    put: function(obj, sink) {
      aseq(
        this.datastore.withClientExecute('beginTransaction', {}),
        function(ret, res) {
          // This contains the key, if an ID is defined.
          var serialized = obj.toDatastore();

          var requestKey;
          if ( obj.id ) {
            requestKey = 'update';
          } else {
            requestKey = 'insertAutoId';
            var key = this.keyPrefix.deepClone();
            // Augment this key with a final segment, giving the kind.
            key.path.push({ kind: this.kind });
            serialized.key = { path: key.path };
          }

          var req = {
            transaction: res.transaction,
            mode: 'TRANSACTIONAL',
            mutation: {}
          };
          req.mutation[requestKey] = [serialized];
          aseq(this.datastore.withClientExecute('commit', req))(ret);
        }.bind(this)
      )(function(res) {
        // The response contains insertAutoIdKeys, if applicable.
        if ( res && res.mutationResult && res.mutationResult.insertAutoIdKeys ) {
          var key = this.DatastoreKey.create({ path: res.mutationResult.insertAutoIdKeys[0].path });
          obj = obj.clone();
          obj.id = key.string;
        }

        // Send a put.
        this.notify_('put', [obj]);
        sink && sink.put && sink.put(obj);
      }.bind(this));
    },

    remove: function(id, sink) {
      id = id.id || id;
      var key = this.DatastoreKey.create({ string: id });
      aseq(
        this.datastore.withClientExecute('beginTransaction', {}),
        function(ret, res) {
          var req = {
            transaction: res.transaction,
            mode: 'TRANSACTIONAL',
            mutation: {
              delete: [{ path: key.path }]
            }
          };
          this.datastore.withClientExecute('commit', req)(ret);
        }.bind(this)
      )(function(res) {
        if ( res ) {
          sink && sink.remove && sink.remove(id);
          this.notify_('remove', [id]);
        }
      }.bind(this));
    },

    runQuery_: function(options, callback) {
      // Datastore doesn't support OR with a single query, only AND.
      // We also always add a filter on the __key__ for the ancestor, if the
      // prefix is set.
      // TODO(braden): Skip and limit.
      // TODO(braden): Handle OR queries by merging several requests.
      var query = options && options.query;
      var clauses = [];
      if ( query ) {
        query = query.partialEval();
        var q = [query];
        while ( q.length ) {
          var next = q.shift();
          if ( AndExpr.isInstance(next) ) {
            next.args.forEach(function(e) { q.push(e); });
          } else if ( OrExpr.isInstance(next) ) {
            console.warn('Cannot express OR conditions. Skipping the whole clause!');
          } else if ( InExpr.isInstance(next) ) {
            console.warn('Datastore DAO cannot express IN expressions (equivalent to OR). Skipping the whole clause!');
          } else {
            // EQ, LT(E), GT(E).
            var operator = EqExpr.isInstance(next) ? 'equal' :
                LtExpr.isInstance(next) ? 'lessThan' :
                LteExpr.isInstance(next) ? 'lessThanOrEqual' :
                GtExpr.isInstance(next) ? 'greaterThan' :
                GteExpr.isInstance(next) ? 'greaterThanOrEqual' : '';
            if ( operator === '' ) {
              console.warn('Unrecognized operator type: ' + next.model_.name);
              continue;
            }
            var propName = next.arg1.datastoreKey;
            var value = next.arg1.toDatastore(next.arg2.f ? next.arg2.f() : next.arg2);
            clauses.push({
              propertyFilter: {
                operator: operator,
                property: { name: propName },
                value: value
              }
            });
          }
        }
      }

      if ( this.keyPrefix ) {
        // Add ancestor filters for each segment of the prefix.
        clauses.push({
          propertyFilter: {
            operator: 'hasAncestor',
            property: { name: '__key__' },
            value: { keyValue: { path: this.keyPrefix.path } }
          }
        });
      }

      // That's all the clauses. Now to build the whole query.
      var req = {
        query: {
          kinds: [{ name: this.kind }]
        }
      };
      if ( clauses.length === 1 ) {
        req.query.filter = clauses[0];
      } else if ( clauses.length > 1 ) {
        req.query.filter = {
          compositeFilter: {
            operator: 'AND',
            filters: clauses
          }
        };
      }

      if ( options.skip ) req.query.offset = options.skip;
      if ( options.limit ) req.query.limt = options.limit;
      if ( options.order ) {
        req.query.order = options.order.map(function(o) {
          var dir = DescExpr.isInstance(o) ? 'DESCENDING' : 'ASCENDING';
          return {
            property: {
              name: o.arg1 ? o.arg1.datastoreKey : o.datastoreKey
            },
            direction: dir
          };
        });
      }
      if ( options.__datastore_projection )
        req.query.projection = options.__datastore_projection;

      this.datastore.withClientExecute('runQuery', req)(callback);
    },

    select: function(sink, options) {
      var future = afuture();
      this.runQuery_(options, function(res) {
        // TODO(braden): Handle Datastore's pagination of large single requests.
        // We need to follow the DAO API of returning either all the values or
        // up to the limit.
        // We get a batch with some entries, and info about whether there are
        // more.

        var rawEntries = res.batch.entityResults;
        for ( var i = 0 ; i < rawEntries.length ; i++ ) {
          var cooked = this.model.create();
          cooked.fromDatastore(rawEntries[i].entity);
          sink && sink.put && sink.put(cooked);
        }

        sink && sink.eof && sink.eof();
        future.set(sink);
      }.bind(this));
      return future.get;
    },

    removeAll: function(sink, options) {
      var future = afuture();
      var opts = {
        __proto__: options,
        __datastore_projection: [{
          property: { name: '__key__' }
          //aggregationFunction: 'FIRST'
          // TODO(braden): The doc specifies sending the aggregation function,
          // but it causes a 400 in practice because "aggregationFunction not
          // allowed without group by", even though that's not what's happening
          // here. We're aggregating multiple values for one property, not
          // multiple entities.
          // Anyway, projecting just the __key__ works fine without it.
        }]
      };
      this.runQuery_(opts, function(res) {
        aseq(
          this.datastore.withClientExecute('beginTransaction', {}),
          function(ret, trans) {
            var req = {
              transaction: trans.transaction,
              mode: 'TRANSACTIONAL',
              mutation: {}
            };

            req.mutation.delete = res.batch.entityResults.map(function(e) {
              return { path: e.entity.key.path };
            });
            this.datastore.withClientExecute('commit', req)(ret);
          }.bind(this),
          function(ret) {
            // Since there wasn't an error, fire remove for each entity.
            var items = res.batch.entityResults;
            for ( var i = 0 ; i < items.length ; i++ ) {
              var key = this.DatastoreKey.create({ path: items[i].entity.key.path }).string;
              sink && sink.remove && sink.remove(key);
              this.notify_('remove', [key]);
            }
            sink && sink.eof && sink.eof();
            ret(sink);
          }.bind(this)
        )(future.set);
      }.bind(this));
      return future.get;
    }
  }
});


//third_party/javascript/foam/v0_1/js/foam/graphics/AbstractCViewView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'AbstractCViewView',
  extendsModel: 'View',

  documentation: function() {  /*
    Forming the DOM component for a $$DOC{ref:'foam.graphics.CView',text:'canvas view'},
    the $$DOC{ref:'.'} provides a canvas and DOM event integration. When you
    create a $$DOC{ref:'foam.graphics.CView'} and $$DOC{ref:'foam.graphics.CView.write'} it into your
    document, an $$DOC{ref:'.'} is created automatically to host your view.</p>
    <p>Changes to your $$DOC{ref:'foam.graphics.CView'} or its children ripple down and
    cause a repaint, starting with a $$DOC{ref:'.paint'} call.
  */},

  properties: [
    {
      name: 'cview',
      type: 'foam.graphics.CView',
      postSet: function(_, cview) {
        cview.view = this;
      },
      documentation: function() {/*
          The $$DOC{ref:'foam.graphics.CView'} root node that contains all the content to render.
        */}
    },
    {
      name: 'className',
      help: 'CSS class name(s), space separated.',
      defaultValue: '',
      documentation: 'CSS class name(s), space separated.'
    },
    {
      model_: 'IntProperty',
      name: 'scalingRatio',
      preSet: function(_, v) { if ( v < 0 ) return 1; return v; },
      postSet: function(_, v) { /* console.log('Scaling to: ' , v); */ },
      defaultValue: 1,
      documentation: function() {/*
          If scaling is required to render the canvas at a higher resolution than
          CSS pixels (for high DPI devices, for instance), the scaling value can
          be used to set the pixel scale. This is set automatically by
          $$DOC{ref:'.initHTML'}.
        */}
    },
    'speechLabel',
    'role',
    'tabIndex',
    {
      model_: 'IntProperty',
      name:  'width',
      defaultValue: 100,
      documentation: function() {/*
          The CSS width of the canvas. See also $$DOC{ref:'.canvasWidth'} and
          $$DOC{ref:'.styleWidth'}.
        */}
    },
    {
      model_: 'IntProperty',
      name:  'height',
      defaultValue: 100,
      documentation: function() {/*
          The CSS height of the canvas. See also $$DOC{ref:'.canvasHeight'} and
          $$DOC{ref:'.styleHeight'}.
        */}
    },
    {
      name: 'canvas',
      getter: function() {
        return this.instance_.canvas ?
          this.instance_.canvas :
          this.instance_.canvas = this.$ && this.$.getContext('2d');
      },
      documentation: 'The HTML canvas context. Use this to render.'
    }
  ],

  listeners: [
    {
      name: 'resize',
      isFramed: true,
      code: function() {
        if ( ! this.$ ) return;
        this.$.width           = this.canvasWidth();
        this.$.style.width     = this.styleWidth();
        this.$.style.minWidth  = this.styleWidth();
        this.$.height          = this.canvasHeight();
        this.$.style.height    = this.styleHeight();
        this.$.style.minHeight = this.styleHeight();
        this.paint();
      },
      documentation: 'Reacts to resize events to fix the size of the canvas.'
    },
    {
      name: 'paint',
      isFramed: true,
      code: function() {
        if ( ! this.$ ) throw EventService.UNSUBSCRIBE_EXCEPTION;
        this.canvas.save();
        this.canvas.scale(this.scalingRatio, this.scalingRatio);
        this.cview.erase();
        this.cview.paint();
        this.canvas.restore();
      },
      documentation: function() {/*
          Clears the canvas and triggers a repaint of the root $$DOC{ref:'foam.graphics.CView'}
          and its children.
        */}
    }
  ],

  methods: {
    init: function() { /* Connects resize listeners. */
      this.SUPER();
      this.X.dynamic(
        function() { this.scalingRatio; this.width; this.height; }.bind(this),
        this.resize);
    },

    styleWidth:   function() { /* The CSS width string */ return (this.width) + 'px'; },
    canvasWidth:  function() { /* The scaled width */ return this.width * this.scalingRatio; },
    styleHeight:  function() { /* The CSS height string */ return (this.height) + 'px'; },
    canvasHeight: function() { /* The scaled height */ return this.height * this.scalingRatio; },

    toString: function() { /* The description of this. */ return 'CViewView(' + this.cview + ')'; },

    toHTML: function() { /* Creates the canvas element. */
      var className = this.className ? ' class="' + this.className + '"' : '';
      var title     = this.speechLabel ? ' aria-role="button" aria-label="' + this.speechLabel + '"' : '';
      var tabIndex  = this.tabIndex ? ' tabindex="' + this.tabIndex + '"' : '';
      var role      = this.role ? ' role="' + this.role + '"' : '';

      return '<canvas id="' + this.id + '"' + className + title + tabIndex + role + ' width="' + this.canvasWidth() + '" height="' + this.canvasHeight() + '" style="width:' + this.styleWidth() + ';height:' + this.styleHeight() + ';min-width:' + this.styleWidth() + ';min-height:' + this.styleHeight() + '"></canvas>';
    },

    initHTML: function() { /* Computes the scaling ratio from the window.devicePixelRatio
                              and canvas.backingStoreRatio. */
      if ( ! this.$ ) return;

      this.maybeInitTooltip();

      this.canvas = this.$.getContext('2d');

      var devicePixelRatio = this.X.window.devicePixelRatio|| 1;
      var backingStoreRatio = this.canvas.backingStoreRatio ||
        this.canvas.webkitBackingStorePixelRatio || 1;

      if ( devicePixelRatio !== backingStoreRatio )
        this.scalingRatio = devicePixelRatio / backingStoreRatio;

      var style = this.X.window.getComputedStyle(this.$);

      // Copy the background colour from the div styling.
      // TODO: the same thing for other CSS attributes like 'font'
      if ( style.backgroundColor && ! this.cview.hasOwnProperty('background') )
        this.cview.background = style.backgroundColor;

      this.paint();
    },

    destroy: function() { /* Call to clean up this and child views. */
      this.SUPER();
      this.cview.destroy();
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/graphics/ActionButtonCView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'ActionButtonCView',

  extendsModel: 'foam.graphics.CView',

  requires: [ 'foam.graphics.Circle' ],
  imports: [ 'gestureManager' ],

  properties: [
    {
      name: 'action',
      postSet: function(oldValue, action) {
        //  oldValue && oldValue.removeListener(this.render)
        // action.addListener(this.render);
        this.bindIsAvailable();
      }
    },
    {
      name:  'font',
      type:  'String',
      defaultValue: ''
    },
    {
      name: 'data',
      postSet: function() {
        this.bindIsAvailable();
      }
    },
    {
      name: 'showLabel',
      defaultValueFn: function() { return this.action.showLabel; }
    },
    {
      name: 'iconUrl',
      postSet: function(_, v) { this.image_ && (this.image_.src = v); },
      defaultValueFn: function() { return this.action.iconUrl; }
    },
    {
      name: 'haloColor',
      defaultValue: 'rgb(241, 250, 65)'
    },
    {
      name: 'halo',
      factory: function() { return this.Circle.create({
        alpha: 0,
        r: 10,
        color: this.haloColor
        /* This gives a ring halo:
        color: 'rgba(0,0,0,0)',
        borderWidth: 12,
        border: this.haloColor
        */
      });}
    },
    {
      name:  'iconWidth',
      type:  'int',
      defaultValue: 0
    },
    {
      name:  'iconHeight',
      type:  'int',
      defaultValue: 0
    },
    {
      name:  'radius',
      type:  'int',
      defaultValue: 0,
      postSet: function(_, r) {
        if ( r ) this.width = this.height = 2 * r;
      }
    },
    {
      name: 'tapGesture',
      hidden: true,
      transient: true,
      lazyFactory: function() {
        return this.X.GestureTarget.create({
          containerID: this.view.id,
          handler: this,
          gesture: 'tap'
        });
      }
    },
    {
      name: 'className',
      help: 'CSS class name(s), space separated.',
      defaultValueFn: function() {
        return 'actionButtonCView actionButtonCView-' + this.action.name;
      }
    },
    {
      name: 'tooltip',
      defaultValueFn: function() { return this.action.help; }
    },
    {
      name: 'speechLabel',
      defaultValueFn: function() { return this.action.speechLabel; }
    },
    'tabIndex',
    'role',
    {
      name: 'state_',
      defaultValue: 'default' // pressed, released
    }
  ],

  listeners: [
    {
      name: 'tapClick',
      code: function() { this.action.callIfEnabled(this.X, this.data); }
    },
    {
      name: 'onMouseDown',
      code: function(evt) {
        // console.log('mouseDown: ', evt, this.state_);
        if ( this.state_ !== 'default' ) return;

        this.state_ = 'pressing';

        if ( evt.type === 'touchstart' ) {
          var rect = this.$.getBoundingClientRect();
          var t = evt.touches[0];
          this.halo.x = t.pageX - rect.left;
          this.halo.y = t.pageY - rect.top;
        } else {
          this.halo.x = evt.offsetX;
          this.halo.y = evt.offsetY;
        }
        this.halo.r = 2;
        this.halo.alpha = 0.4;
        this.X.animate(150, function() {
          this.halo.x = this.width/2;
          this.halo.y = this.height/2;
          this.halo.r = Math.min(28, Math.min(this.width, this.height)/2);
          this.halo.alpha = 1;
        }.bind(this), undefined, function() {
          if ( this.state_ === 'cancelled' ) {
            this.state_ = 'pressed';
            this.onMouseUp();
          } else {
            this.state_ = 'pressed';
          }
        }.bind(this))();
      }
    },
    {
      name: 'onMouseUp',
      code: function(evt) {
        // This line shouldn't be necessary but we're getting stray
        // onMouseUp events when the cursor moves over the button.
        if ( this.state_ === 'default' ) return;

        // console.log('mouseUp: ', evt, this.state_);
        if ( this.state_ === 'pressing' ) { this.state_ = 'cancelled'; return; }
        if ( this.state_ === 'cancelled' ) return;
        this.state_ = 'released';

        this.X.animate(
          200,
          function() { this.halo.alpha = 0; }.bind(this),
          Movement.easeIn(.5),
          function() { this.state_ = 'default' }.bind(this))();
      }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      if ( this.iconUrl ) {
        this.image_ = new Image();

        this.image_.onload = function() {
          if ( ! this.iconWidth  ) this.iconWidth  = this.image_.width;
          if ( ! this.iconHeight ) this.iconHeight = this.image_.height;
          if ( this.canvas ) {
            this.canvas.save();
            this.paint();
            this.canvas.restore();
          }
        }.bind(this);

        this.image_.src = this.iconUrl;
      }
    },

    bindIsAvailable: function() {
      if ( ! this.action || ! this.data ) return;

      var self = this;
      Events.dynamic(
        function() { self.action.isAvailable.call(self.data, self.action); },
        function() {
          if ( self.action.isAvailable.call(self.data, self.action) ) {
            if ( self.oldWidth_ && self.oldHeight_ ) {
              self.x = self.oldX_;
              self.y = self.oldY_;
              self.width = self.oldWidth_;
              self.height = self.oldHeight_;
            }
          } else if ( self.width || self.height ) {
            self.oldX_ = self.x;
            self.oldY_ = self.y;
            self.oldWidth_ = self.width;
            self.oldHeight_ = self.height;
            self.width = 0;
            self.height = 0;
            self.x = 0;
            self.y = 0;
          }
        });

      /*
      var b = this;
      // Subscribe to action firing and show halo animation
      b.data.subscribe(['action', this.action.name], function() {
        if ( b.state_ !== 'default' ) return;
        b.halo.r = 2;
        b.halo.alpha = 0.4;
        b.halo.x = b.width/2;
        b.halo.y = b.height/2;
        Movement.compile([
          [150, function() {
            b.halo.r = Math.min(28, Math.min(b.width, b.height)/2);
            b.halo.alpha = 1;
          }],
          [200, function() { b.halo.alpha = 0; }]
        ])();
      }.bind(this));
      */
    },

    initCView: function() {
      // Don't add halo as a child because we want to control
      // its paint order, but still set it up as though we had added it.
      // this.addChild(this.halo);
      this.halo.view = this.view;
      this.halo.addListener(this.view.paint);
      if ( this.gestureManager ) {
        // TODO: Glow animations on touch.
        this.gestureManager.install(this.tapGesture);
      }

      // Pressing space when has focus causes a synthetic press
      this.$.addEventListener('keypress', function(e) {
        if ( e.charCode == 32 && ! ( e.altKey || e.ctrlKey || e.shiftKey ) ) {
          e.preventDefault();
          e.stopPropagation();
          this.tapClick();
        }
      }.bind(this));

      // This is so that shift-search-spacebar performs a click with ChromeVox
      // which otherwise only delivers mouseDown and mouseUp events but no click
      this.$.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // If no X & Y then it was simulated by ChromeVox
        if ( ! e.x && ! e.y ) this.tapClick();
      }.bind(this));

      this.$.addEventListener('mousedown',   this.onMouseDown);
      this.$.addEventListener('mouseup',     this.onMouseUp);
      this.$.addEventListener('mouseleave',  this.onMouseUp);

      this.$.addEventListener('touchstart',  this.onMouseDown);
      this.$.addEventListener('touchend',    this.onMouseUp);
      this.$.addEventListener('touchleave',  this.onMouseUp);
      this.$.addEventListener('touchcancel', this.onMouseUp);
    },

    destroy: function() {
      this.SUPER();
      if ( this.gestureManager ) {
        this.gestureManager.uninstall(this.tapGesture);
      }
    },

    erase: function() {
      var c = this.canvas;

      c.clearRect(0, 0, this.width, this.height);

      var r = Math.min(this.width, this.height)/2;
      c.fillStyle = this.background;
      c.beginPath();
      c.arc(this.width/2, this.height/2, r, 0, Math.PI*2, true);
      c.closePath();
      c.fill();
    },

    paintSelf: function() {
      var c = this.canvas;

      this.halo.paint();

      if ( this.font ) c.font = this.font;

      c.globalAlpha  = this.alpha;
      c.textAlign    = 'center';
      c.textBaseline = 'middle';
      c.fillStyle    = this.color;

      if ( this.image_ && this.image_.width ) {
        c.drawImage(
          this.image_,
          this.x + (this.width  - this.iconWidth)/2,
          this.y + (this.height - this.iconHeight)/2,
          this.iconWidth,
          this.iconHeight);
      }

      c.fillText(
        this.action.labelFn.call(this.data, this.action),
        this.x+this.width/2,
        this.y+this.height/2);
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/graphics/CView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name:  'CView',
  label: 'CView',

  requires: [
    'foam.graphics.PositionedCViewView',
    'foam.graphics.CViewView'
  ],
  
  traits: [ 'foam.patterns.ChildTreeTrait' ],

  documentation: function() {/*
      The base class for a canvas item. A $$DOC{ref:'.'} can be directly inserted
      into the DOM with $$DOC{ref:'.write'}, and will generate a $$DOC{ref:'CViewView'}
      wrapper.</p>
      <p>$$DOC{ref:'.'} submodels directly nest inside each other, with a single
      root $$DOC{ref:'.'} attached to the canvas. Use $$DOC{ref:'.addChild'} to attach a new
      $$DOC{ref:'.'} to the scene graph:</p>
      <p><code>
            var rootNode = this.X.CView.create({width:300, height:200});<br/>
            <br/>
            rootNode.write(document); // a CViewView wrapper is created for us<br/>
            <br/>
            rootNode.addChild(this.X.Circle.create({x:30, y:50, radius: 30, color: 'blue'});<br/>
            rootNode.addChild(this.X.Label.create({x: 50, y: 30, text: "Hello", color: 'black'});<br/>
      </code></p>
      <p>When modeling your own $$DOC{ref:'foam.graphics.CView'} submodel, override $$DOC{ref:'.paintSelf'}
      to render your content. Children will automatically be painted for you. For more direct
      control over child rendering, override $$DOC{ref:'.paint'}.
    */},

  properties: [
    {
      name:  'view',
      type:  'Canvas2',
      postSet: function(_, view) {
        for ( var key in this.children ) {
          var child = this.children[key];
          child.view = view;
          if (view) child.addListener(view.paint);
        }
      },
      transient: true,
      hidden: true,
      documentation: function() {/* The canvas view this scene draws into */ }
    },
    {
      name:  'canvas',
      getter: function() { return this.view && this.view.canvas; },
      transient: true,
      hidden: true,
      documentation: function() {/* Safe getter for the canvas view this scene draws into */ }
    },
    {
      name:  '$',
      getter: function() { return this.view && this.view.$; },
      transient: true,
      hidden: true,
      documentation: function() {/* Safe getter for the canvas DOM element this scene draws into */ }
    },
    {
      name: 'state',
      defaultValue: 'initial',
      documentation: function() {/* Indicates if canvas setup is in progress ('initial'),
                                  or ready to paint ('active'). */}
    },
    {
      name: 'suspended',
      model_: 'BooleanProperty',
      defaultValue: false,
      documentation: function() {/*
          Suspend painting. While this property is true, this 
          $$DOC{ref:'foam.graphics.CView'} will not paint itself or its
          children.
        */},
    },
    {
      name: 'className',
      help: 'CSS class name(s), space separated. Used if adapted with a CViewView.',
      defaultValue: '',
      documentation: function() {/* CSS class name(s), space separated.
          Only used if this is the root node adapted with a $$DOC{ref:'CViewView'}. */}
    },
    {
      name:  'x',
      type:  'int',
      view:  'IntFieldView',
      defaultValue: 0,
      documentation: function() {/*
          The X offset of this view relative to its parent. */}
    },
    {
      name:  'y',
      type:  'int',
      view:  'IntFieldView',
      defaultValue: 0,
      documentation: function() {/*
          The Y offset of this view relative to its parent. */}
    },
    {
      name:  'width',
      type:  'int',
      view:  'IntFieldView',
      defaultValue: 10,
      documentation: function() {/*
          The width of this view. Painting is not automatically clipped, so a view
          may render outside of its apparent rectangle. */},
    },
    {
      name:  'height',
      type:  'int',
      view:  'IntFieldView',
      defaultValue: 10,
      documentation: function() {/*
          The height of this view. Painting is not automatically clipped, so a view
          may render outside of its apparent rectangle. */}
    },
    {
      name:  'alpha',
      type:  'float',
      defaultValue: 1,
      documentation: function() {/*
          The desired opacity of the content, from 0:transparent to 1:opaque.
          Child views do not inherit and are not limited by this value. */}
    },
    {
      name:  'color',
      label: 'Foreground Color',
      type:  'String',
      defaultValue: 'black',
      documentation: function() {/*
          The foreground color for rendering primary content. */}
    },
    {
      name:  'background',
      label: 'Background Color',
      type:  'String',
      defaultValue: 'white',
      documentation: function() {/*
          The optional background color for opaque items that $$DOC{ref:'.erase'}
          their background. */}
    },
    {
      name: 'font',
      documentation: function() {/*
          The font to use for rendering text, in CSS string format: <code>'24px Roboto'</code>. */}
    },
    {
      name: 'clipped',
      model_: 'BooleanProperty',
      defaultValue: false
    }
  ],

  methods: {
    toView_: function() { /* Internal. Creates a CViewView wrapper. */
      if ( ! this.view ) {
        var params = {cview: this};
        if ( this.className )   params.className   = this.className;
        if ( this.tooltip )     params.tooltip     = this.tooltip;
        if ( this.speechLabel ) params.speechLabel = this.speechLabel;
        if ( this.tabIndex )    params.tabIndex    = this.tabIndex;
        if ( this.role )        params.role        = this.role;
        this.view = this.CViewView.create(params);
      }
      return this.view;
    },

    toPositionedView_: function() { /* Internal. Creates a PositionedCViewView wrapper. */
      if ( ! this.view ) {
        var params = {cview: this};
        if ( this.className ) params.className = this.className;
        this.view = this.PositionedCViewView.create(params);
      }
      return this.view;
    },

    initCView: function() { /* Override in submodels for initialization. Callled
          once on first $$DOC{ref:'.paint'} when transitioning from 'initial'
          to 'active' '$$DOC{ref:'.state'}. */ },

    write: function(document) { /* Inserts this $$DOC{ref:'foam.graphics.CView'} into the DOM
                                   with an $$DOC{ref:'foam.graphics.AbstractCViewView'} wrapper. */
      var v = this.toView_();
      document.writeln(v.toHTML());
      v.initHTML();
    },

    addChild: function(child) { /* Adds a child $$DOC{ref:'foam.graphics.CView'} to the scene
                                   under this. */
      this.SUPER(child);

      if ( this.view ) {
        child.view = this.view;
        child.addListener(this.view.paint);
      }     
      return this;
    },

    removeChild: function(child) { /* Removes a child from the scene. */
      this.SUPER(child);
      child.view = undefined;
      child.removeListener(this.view.paint);
      return this;
    },

    erase: function() { /* Wipes the canvas area of this $$DOC{ref:'.'}. Primarily used
                          by the root node to clear the entire canvas, but an opaque child
                          may choose to erase its own area, if required. */
      this.canvas.clearRect(0, 0, this.width, this.height);
      this.canvas.fillStyle = this.background;
      this.canvas.fillRect(0, 0, this.width, this.height);
    },

    paintChildren: function() { /* Paints each child. */
      for ( var i = 0 ; i < this.children.length ; i++ ) {
        var child = this.children[i];
        this.canvas.save();
        this.canvas.beginPath(); // reset any existing path (canvas.restore() does not affect path)
        child.paint();
        this.canvas.restore();
      }
    },

    paintSelf: function() { /* Implement this in sub-models to do your painting. */ },

    paint: function() { /* Translates the canvas to our ($$DOC{ref:'.x'}, $$DOC{ref:'.y'}),
                          does a $$DOC{ref:'.paintSelf'} then paints all the children. */
      if ( ! this.$ ) return; // no canvas element, so do nothing
      if ( this.state === 'initial' ) {
        this.initCView();
        this.state = 'active';
      }
      if ( this.suspended ) return; // we allowed initialization, but if suspended don't paint
      
      this.canvas.save();
      this.canvas.translate(this.x, this.y);
      if (this.clipped) {
        this.canvas.rect(0,0,this.width,this.height);
        this.canvas.clip();
      }
      this.paintSelf();
      this.paintChildren();
      this.canvas.restore();
    },

    mapToParent: function(point) { /* Maps a coordinate from this to our parents'. */
      point.x += this.x;
      point.y += this.y;
      return point;
    },

    mapToCanvas: function(point) { /* Maps a coordinate from this to the canvas.
                    Useful for sharing a point between sibling or cousin items. */
      this.mapToParent(point);
      if (this.parent && this.parent.mapToCanvas) {
        return this.parent.mapToCanvas(point);
      } else {
        return point;
      }
    },
  }
});

//third_party/javascript/foam/v0_1/js/foam/graphics/CViewView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'CViewView',
  extendsModel: 'foam.graphics.AbstractCViewView',
  help: 'DOM wrapper for a CView, auto adjusts it size to fit the given cview.',
  documentation: function() {/*
      DOM wrapper for a $$DOC{ref:'foam.graphics.CView'}, that auto adjusts it size to fit
      he given view.
    */},
  properties: [
    {
      name: 'cview',
      postSet: function(_, cview) {
        cview.view = this;
        this.X.dynamic(function() {
          this.width  = cview.x + cview.width;
          this.height = cview.y + cview.height;
        }.bind(this));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/graphics/CanvasScrollView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'CanvasScrollView',
  extendsModel: 'foam.graphics.CView',
  properties: [
    {
      model_: 'DAOProperty',
      name: 'dao',
      onDAOUpdate: 'onDAOUpdate'
    },
    {
      model_: 'IntProperty',
      name: 'scrollTop',
      preSet: function(_, v) { if ( v < 0 ) return 0; return v; }
    },
    {
      name: 'renderer'
    },
    {
      model_: 'IntProperty',
      name: 'selectNumber'
    },
    {
      name: 'objs',
      factory: function() { return []; }
    },
    {
      name: 'offset',
      defaultValue: 0
    }
  ],
  methods: {
    init: function() {
      this.SUPER();
      this.X.dynamic(
        function() { this.width; this.renderer; this.offset; this.objs; }.bind(this),
        function() {
          this.renderer.width = this.width;
          this.view && this.view.paint();
        }.bind(this));
    },
    initCView: function() {
      this.X.dynamic(
        function() {
          this.scrollTop; this.height; this.renderer;
        }.bind(this), this.onDAOUpdate);

      if ( this.X.gestureManager ) {
        var manager = this.X.gestureManager;
        var target = this.X.GestureTarget.create({
          containerID: this.view.id,
          handler: this,
          gesture: 'verticalScrollMomentum'
        });
        manager.install(target);
      }
    },
    verticalScrollMove: function(dy) {
      this.scrollTop -= dy;
    },
    paintSelf: function() {
      var self = this;
      var offset = this.offset;
      for ( var i = 0; i < this.objs.length; i++ ) {
        self.canvas.save();
        self.canvas.translate(0, offset + (i * self.renderer.height));
        self.renderer.render(self.canvas, self.objs[i]);
        self.canvas.restore();
      }
    }
  },
  listeners: [
    {
      name: 'onDAOUpdate',
      code: function() {
        if ( ! this.canvas ) return;

        var selectNumber = this.selectNumber + 1;
        this.selectNumber = selectNumber;

        var limit = Math.floor(this.height / this.renderer.height) + 2;
        var skip = Math.floor(this.scrollTop / this.renderer.height);
        var self = this;


        var offset = -(this.scrollTop % this.renderer.height);

        var i = 0;
        this.dao.skip(skip).limit(limit).select([])(function(objs) {
          self.offset = offset;
          self.objs = objs;
        });

/*{
          put: function(obj, _, fc) {
            if ( selectNumber != self.selectNumber ||
                 ! self.canvas ) {
              fc.stop();
              return;
            }
            if ( i == 0 ) self.erase();

            self.canvas.save();
            self.canvas.translate(0, offset + (i * self.renderer.height));
            i = i + 1;
            self.renderer.render(self.canvas, obj);
            self.canvas.restore();
          }
        });*/
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/graphics/Circle.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name:  'Circle',

  extendsModel: 'foam.graphics.CView',

  properties: [
    {
      name:  'border',
      label: 'Border Color',
      type:  'String',
      defaultValue: undefined
    },
    {
      name:  'borderWidth',
      type:  'int',
      defaultValue: 1
    },
    {
      name: 'r',
      label: 'Radius',
      type: 'int',
      defaultValue: 20
    },
    {
      name: 'startAngle',
      defaultValue: 0
    },
    {
      name: 'endAngle',
      label: 'Radius',
      type: 'int',
      defaultValue: Math.PI*2
    }
  ],

  methods: {
    paintSelf: function() {
      var c = this.canvas;
      if ( ! c ) return;

      c.globalAlpha = this.alpha;

      if ( ! this.r ) return;

      if ( this.color) {
        c.beginPath();
        c.moveTo(0,0);
        c.arc(0, 0, this.r, -this.endAngle, -this.startAngle, false);
        c.closePath();

        c.fillStyle = this.color;
        c.fill();
      }
      if ( this.border ) {
        c.lineWidth = this.borderWidth;

        c.beginPath();
        c.arc(0, 0, this.r+this.borderWidth/2-0.1, -this.endAngle, -this.startAngle, false);
        c.closePath();

        c.strokeStyle = this.border;
        c.stroke();
      }
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/graphics/DAOListCView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'DAOListCView',
  extendsModel: 'foam.graphics.CView',

  properties: [
    { model_: 'DAOProperty', name: 'dao' },
    { model_: 'IntProperty', name: 'scrollTop', preSet: function(_,t) { return Math.max(t, 0); }, postSet: function() { this.scroll(); } },
    { name: 'rowRenderer' },
    { name: 'objs', postSet: function() { this.view && this.view.paint(); }, factory: function() { return []; } }
  ],

  methods: {
    init: function(args) {
      this.SUPER(args);
      this.dao.listen(this.scroll);
    },
    paintSelf: function() {
      var renderer = this.rowRenderer;

      var offset = -(this.scrollTop % renderer.height);
      this.canvas.save();
      this.canvas.translate(0, offset);
      for ( var i = 0; i < this.objs.length; i++ ) {
        renderer.render(this.canvas, this.objs[i]);
        this.canvas.translate(0, renderer.height);
      }
      this.canvas.restore();
    }
  },

  listeners: [
    {
      name: 'scroll',
      code: function() {
        var renderer = this.rowRenderer;
        var limit = Math.floor(this.height / renderer.height);
        var skip = Math.floor(this.scrollTop / renderer.height);
        var self = this;
        this.dao.skip(skip).limit(limit).select()(function(objs) {
          self.objs = objs;
        });
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/graphics/MotionBlur.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'MotionBlur',
  methods: {
    paint: function() {
      this.SUPER();
      var c = this.canvas;
      var oldAlpha = this.alpha;

      c.save();
      c.translate(-this.vx, -this.vy);
      this.alpha = 0.6;
      this.SUPER();
      c.translate(-this.vx, -this.vy);
      this.alpha = 0.3;
      this.SUPER();
      c.restore();

      this.alpha = oldAlpha;
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/graphics/Point.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'Point',
  package: 'canvas',

  properties: [
    {
      model_: 'IntProperty',
      name: 'x',
      defaultValue: 0
    },
    {
      model_: 'IntProperty',
      name: 'y',
      defaultValue: 0
    }
  ],
  
  methods: {
    toString: function() { return "canvas.Point("+this.x+", "+this.y+")"; }
  }
})

//third_party/javascript/foam/v0_1/js/foam/graphics/PositionedCViewView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'PositionedCViewView',
  extendsModel: 'foam.graphics.AbstractCViewView',
  traits: ['PositionedDOMViewTrait'],
  properties: [
    {
      name: 'tagName',
      factory: function() { return 'canvas'; }
    }
  ],
  methods: {
    init: function() {
      this.SUPER();
      this.X.dynamic(function() {
        this.cview; this.width; this.height;
      }.bind(this), function() {
        if ( ! this.cview ) return;
        this.cview.width = this.width;
        this.cview.height = this.height;
      }.bind(this));
    },
    toHTML: function() {
      var className = this.className ? ' class="' + this.className + '"' : '';
      return '<canvas id="' + this.id + '"' + className + ' width="' + this.canvasWidth() + '" height="' + this.canvasHeight() + '" ' + this.layoutStyle() + '></canvas>';
    }
  },
  listeners: [
    {
      name: 'resize',
      isFramed: true,
      code: function() {
        if ( ! this.$ ) return;
        this.$.width = this.canvasWidth();
        this.$.style.width = this.styleWidth();
        this.$.height = this.canvasHeight();
        this.$.style.height = this.styleHeight();
        this.cview.width = this.width;
        this.cview.height = this.height;
        this.paint();
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/graphics/PositionedDOMViewTrait.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'PositionedCViewView',
  extendsModel: 'foam.graphics.AbstractCViewView',
  traits: ['PositionedDOMViewTrait'],
  properties: [
    {
      name: 'tagName',
      factory: function() { return 'canvas'; }
    }
  ],
  methods: {
    init: function() {
      this.SUPER();
      this.X.dynamic(function() {
        this.cview; this.width; this.height;
      }.bind(this), function() {
        if ( ! this.cview ) return;
        this.cview.width = this.width;
        this.cview.height = this.height;
      }.bind(this));
    },
    toHTML: function() {
      var className = this.className ? ' class="' + this.className + '"' : '';
      return '<canvas id="' + this.id + '"' + className + ' width="' + this.canvasWidth() + '" height="' + this.canvasHeight() + '" ' + this.layoutStyle() + '></canvas>';
    }
  },
  listeners: [
    {
      name: 'resize',
      isFramed: true,
      code: function() {
        if ( ! this.$ ) return;
        this.$.width = this.canvasWidth();
        this.$.style.width = this.styleWidth();
        this.$.height = this.canvasHeight();
        this.$.style.height = this.styleHeight();
        this.cview.width = this.width;
        this.cview.height = this.height;
        this.paint();
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/graphics/Shadow.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.graphics',
  name: 'Shadow',
  methods: {
    paint: function() {
      var c = this.canvas;
      var oldAlpha = this.alpha;
      var oldColor = this.color;

      c.save();
      c.translate(4, 4);
      this.alpha = 0.2;
      this.color = 'black';
      this.SUPER();
      c.restore();

      this.alpha = oldAlpha;
      this.color = oldColor;

      this.SUPER();
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/i18n/ChromeMessagesBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ChromeMessagesBuilder',
  package: 'foam.i18n',
  extendsModel: 'foam.i18n.MessagesBuilder',

  methods: [
    {
      name: 'visitModel',
      code: function(model) {
        var modelPrefix = model.translationHint ?
            model.translationHint + ' ' : '';
        var key;
        if ( model.messages ) model.messages.forEach(
            function(model, msg) {
              key = model.name + '__Message__' + msg.name;
              this.messageBundle[key] = {
                  message: msg.value,
                  description: modelPrefix + msg.translationHint
              };
            }.bind(this, model));
        if ( model.actions ) model.actions.forEach(
            function(model, action) {
              if ( action.translationHint ) {
                if ( action.label ) {
                  key = model.name + '__ActionLabel__' + action.name;
                  this.messageBundle[key] =
                      {
                        message: action.label,
                        description: modelPrefix +
                            action.translationHint +
                            ' (text label)'
                      };
                }
                if ( action.speechLabel ) {
                  key = model.name + '__ActionSpeechLabel__' + action.name;
                  this.messageBundle[key] =
                      {
                        message: action.speechLabel,
                        description: modelPrefix +
                            action.translationHint +
                            ' (speech label)'
                      };
                }
              }
            }.bind(this, model));
        return this.messageBundle;
      }
    },
    {
      name: 'messagesToString',
      code: function() {
        return JSON.stringify(this.messageBundle);
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/i18n/GlobalController.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'GlobalController',
  package: 'foam.i18n',

  requires: [
    'foam.i18n.ChromeMessagesBuilder'
  ],

  imports: [
    'console'
  ],

  properties: [
    {
      name: 'builders',
      factory: function() {
        return this.getBuilders();
      }
    }
  ],

  methods: [
    {
      name: 'visitModels',
      code: function() {
        var afuncs = [];
        [
          {
            name: 'USED_MODELS',
            coll: USED_MODELS
          },
          {
            name: 'UNUSED_MODELS',
            coll: UNUSED_MODELS
          }
        ].forEach(function(coll) {
          if (!coll.coll) {
            this.console.warn('Attempt to build XMB from missing model' +
                'collection: "' + coll.name + '"');
            return;
          }
          Object.getOwnPropertyNames(coll.coll).forEach(
              function(modelName) {
                afuncs.push(arequire(modelName).aseq(function(ret, model) {
                  Object.getOwnPropertyNames(this.builders).forEach(
                      function(model, builderName) {
                        this.builders[builderName].visitModel(model);
                      }.bind(this, model));
                  ret();
                }.bind(this)));
              }.bind(this));
        }.bind(this));
        return apar.apply(null, afuncs);
      }
    },
    {
      name: 'getBuilders',
      code: function() {
        return {
          chromeMessages: this.ChromeMessagesBuilder.create()
        };
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/i18n/MessagesBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'MessagesBuilder',
  package: 'foam.i18n',

  imports: [
    'console'
  ],

  properties: [
    {
      name: 'messageBundle',
      factory: function() { return {}; }
    }
  ],

  methods: [
    {
      name: 'visitModel',
      code: function(model) {
        this.console.warn(
            'Message builder without visitModel implementation: ' +
                this.name_);
        return this.messageBundle;
      }
    },
    {
      name: 'messagesToString',
      code: function() {
        this.console.warn(
            'Message builder without messagesToString implementation: ' +
                this.name_);
        return '';
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/lib/email/Conversation.js
CLASS({
   "model_": "Model",
   "id": "foam.lib.email.Conversation",
   "package": "foam.lib.email",
   "name": "Conversation",
   "tableProperties": [
      "recipients",
      "subject",
      "timestamp"
   ],
   "properties": [
      {
         "model_": "Property",
         "name": "id"
      },
      {
         "model_": "Property",
         "name": "recipients",
         "tableWidth": "100"
      },
      {
         "model_": "StringProperty",
         "name": "subject",
         "shortName": "s",
         "mode": "read-write",
         "required": true,
         "displayWidth": 100,
         "tableFormatter": function (s, self, view) {
        var sanitizedSubject = view.strToHTML(s);
        return self.isUnread ?
          '<b>' + sanitizedSubject + '</b>' :
          sanitizedSubject ;
      },
         "tableWidth": "45%",
         "view": "TextFieldView"
      },
      {
         "model_": "DateProperty",
         "name": "timestamp",
         "tableWidth": "75"
      },
      {
         "model_": "Property",
         "name": "emails",
         "view": "EMailsView"
      },
      {
         "model_": "Property",
         "name": "isUnread"
      },
      {
         "model_": "StringArrayProperty",
         "name": "labels",
         "postSet": function (oldValue, newValue) {
        if (!newValue || !newValue.length) return;
        var self = this;
        this.isUnread = false;
        EMailLabelDAO.find(EQ(EMailLabel.DISPLAY_NAME, '^u'), {put: function(unreadLabel) {
          newValue.forEach(function(label) {
            if (label == unreadLabel.id) {
              self.isUnread = true;
            }
          });
        }});
      },
         "help": "Email labels.",
         "view": "LabelView"
      }
   ],
   "actions": [
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "Action",
            "name": "reply",
            "help": "Reply to an email.",
            "children": [],
            "action": function (X) {
        var replyMail = X.EMail.create({
          to: [this.from],
          subject: this.subject,
          body: this.body,
          labels: ['DRAFT'],
        });
        openComposeView(X, replyMail);
      },
            "keyboardShortcuts": []
         },
         "applyOnAll": false
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "Action",
            "name": "replyAll",
            "help": "Reply to all recipients of an email.",
            "children": [],
            "action": function (X) {
        var replyMail = X.EMail.create({
          to: [this.from],
          cc: this.cc,
          subject: 'Re.: ' + this.subject,
          body: this.body,
          labels: ['DRAFT'],
        });

        for ( var i = 0 ; i < this.to ; i++ ) {
          replyMail.to.push(this.to[i]);
        }
        openComposeView(X, replyMail);
      },
            "keyboardShortcuts": []
         },
         "applyOnAll": false
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "Action",
            "name": "forward",
            "help": "Forward an email.",
            "children": [],
            "action": function (X) {
        var forwardedMail = X.EMail.create({
          subject: this.subject,
          body: this.body,
          labels: ['DRAFT'],
        });
        openComposeView(X, forwardedMail);
      },
            "keyboardShortcuts": []
         },
         "applyOnAll": false
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "foam.lib.email.EMailMutationAction",
            "name": "star",
            "help": "Star an email.",
            "children": [],
            "keyboardShortcuts": [],
            "action": function (X, action) {
          var obj = this;
          a.apply(obj, arguments);
          var self = this;
          var sink = action.backOnComplete ?
            { put: function() { X.stack.back(); },
              error: function() { X.stack.back(); } } : undefined;
          X.EMailDAO && X.EMailDAO.put(obj, sink);
        }
         },
         "applyOnAll": false
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "foam.lib.email.EMailMutationAction",
            "name": "archive",
            "help": "Archive an email.",
            "isAvailable": function () { return this.hasLabel('INBOX'); },
            "children": [],
            "keyboardShortcuts": [],
            "action": function (X, action) {
          var obj = this;
          a.apply(obj, arguments);
          var self = this;
          var sink = action.backOnComplete ?
            { put: function() { X.stack.back(); },
              error: function() { X.stack.back(); } } : undefined;
          X.EMailDAO && X.EMailDAO.put(obj, sink);
        }
         }
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "foam.lib.email.EMailMutationAction",
            "name": "spam",
            "help": "Report an email as SPAM.",
            "isAvailable": function () { return ! this.hasLabel('SPAM'); },
            "children": [],
            "keyboardShortcuts": [],
            "action": function (X, action) {
          var obj = this;
          a.apply(obj, arguments);
          var self = this;
          var sink = action.backOnComplete ?
            { put: function() { X.stack.back(); },
              error: function() { X.stack.back(); } } : undefined;
          X.EMailDAO && X.EMailDAO.put(obj, sink);
        }
         }
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate":          {
            "model_": "foam.lib.email.EMailMutationAction",
            "name": "trash",
            "help": "Move an email to the trash.",
            "isAvailable": function () { return ! this.hasLabel('TRASH'); },
            "children": [],
            "keyboardShortcuts": [],
            "action": function (X, action) {
          var obj = this;
          a.apply(obj, arguments);
          var self = this;
          var sink = action.backOnComplete ?
            { put: function() { X.stack.back(); },
              error: function() { X.stack.back(); } } : undefined;
          X.EMailDAO && X.EMailDAO.put(obj, sink);
        }
         }
      },
      {
         "model_": "foam.lib.email.ConversationAction",
         "children": [],
         "keyboardShortcuts": [],
         "delegate": null
      }
   ],
   "constants": [],
   "messages": [],
   "methods": [
      {
         "model_": "Method",
         "name": "put",
         "code": function (email) {
      if ( ! this.emails ) this.emails = [];
      this.emails.put(email);
      this.id = email.convId;
      this.update();
    },
         "args": []
      },
      {
         "model_": "Method",
         "name": "remove",
         "code": function (email) {
      if ( ! this.emails ) this.emails = [];
      for ( var i = 0; i < this.emails.length; i++ ) {
        if ( email.id === this.emails[i].id ) {
          this.emails.splice(i--, 1);
        }
      }
      this.update();
    },
         "args": []
      }
   ],
   "listeners": [
      {
         "model_": "Method",
         "name": "update",
         "code": function () {
        if ( ! this.emails || this.emails.length === 0 ) return;
        // TODO the primary email should be the most recent email that matches the query
        // that we haven't yet given this model.
        var primaryEmail = this.emails[0];

        this.subject = primaryEmail.subject;

        var allSenders = [];
        var seenSenders = {};
        for (var i = 0, m; m = this.emails[i]; i++) {
          // TODO this needs work:
          // 1. bold unread
          // 2. strip last names when more than one name
          // 3. limit to 3 senders (first sender followed by last two i think)
          // 4. dont dedupe senders that have an unread and a read message. They should show twice.
          if (!seenSenders[m.from]) {
            allSenders.push(EMail.FROM.tableFormatter(m.from));
            seenSenders[m.from] = true;
          }
        }
        this.recipients = allSenders.join(', ');
        if ( this.emails.length > 1 ) {
          this.recipients += ' (' + this.emails.length + ')';
        }
        this.timestamp = primaryEmail.timestamp;

        // Concat all of the labels together.
        var m = {};
        this.emails.forEach(function(e) { e.labels.forEach(function(l) { m[l] = 1; }); });
        this.labels = Object.keys(m);
      },
         "args": []
      }
   ],
   "templates": [],
   "models": [],
   "tests": [],
   "relationships": [],
   "issues": []
});

//third_party/javascript/foam/v0_1/js/foam/lib/email/ConversationAction.js
CLASS({
   "model_": "Model",
   "id": "foam.lib.email.ConversationAction",
   "package": "foam.lib.email",
   "name": "ConversationAction",
   "extendsModel": "Action",
   "requires": [],
   "imports": [],
   "exports": [],
   "properties": [
      {
         "model_": "Property",
         "name": "label",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.name.labelize(); },
         "help": "The display label for the action."
      },
      {
         "model_": "Property",
         "name": "speechLabel",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.label; },
         "help": "The speech label for the action."
      },
      {
         "model_": "DocumentationProperty",
         "name": "documentation",
         "getter": function () {
        var doc = this.instance_.documentation;
        if (doc && typeof Documentation != "undefined" && Documentation // a source has to exist (otherwise we'll return undefined below)
            && (  !doc.model_ // but we don't know if the user set model_
               || !doc.model_.getPrototype // model_ could be a string
               || !Documentation.isInstance(doc) // check for correct type
            ) ) {
          // So in this case we have something in documentation, but it's not of the
          // "Documentation" model type, so FOAMalize it.
          if (doc.body) {
            this.instance_.documentation = Documentation.create( doc );
          } else {
            this.instance_.documentation = Documentation.create({ body: doc });
          }
        }
        // otherwise return the previously FOAMalized model or undefined if nothing specified.
        return this.instance_.documentation;
      }
      },
      {
         "model_": "Property",
         "name": "default",
         "type": "Boolean",
         "view": "BooleanView",
         "defaultValue": false,
         "help": "Indicates if this is the default action."
      },
      {
         "model_": "FunctionProperty",
         "name": "isAvailable",
         "label": "Available",
         "displayHeight": 3,
         "help": "Function to determine if action is available.",
         "displayWidth": 70,
         "defaultValue": function () { return true; }
      },
      {
         "model_": "FunctionProperty",
         "name": "isEnabled",
         "label": "Enabled",
         "displayHeight": 3,
         "help": "Function to determine if action is enabled.",
         "displayWidth": 70,
         "defaultValue": function () { return true; }
      },
      {
         "model_": "FunctionProperty",
         "name": "labelFn",
         "label": "Label Function",
         "help": "Function to determine label. Defaults to 'this.label'.",
         "defaultValue": function (action) { return action.label; }
      },
      {
         "model_": "Property",
         "name": "showLabel",
         "type": "String",
         "defaultValue": true,
         "help": "Property indicating whether the label should be rendered alongside the icon"
      },
      {
         "model_": "Property",
         "name": "children",
         "type": "Array",
         "subType": "Action",
         "view": "ArrayView",
         "factory": function () { return []; },
         "help": "Child actions of this action."
      },
      {
         "model_": "Property",
         "name": "parent",
         "type": "String",
         "help": "The parent action of this action"
      },
      {
         "model_": "StringArrayProperty",
         "name": "keyboardShortcuts"
      },
      {
         "model_": "Property",
         "name": "translationHint",
         "label": "Description for Translation",
         "type": "String",
         "defaultValue": ""
      },
      {
         "model_": "Property",
         "name": "name",
         "type": "String",
         "required": true,
         "displayWidth": 30,
         "displayHeight": 1,
         "defaultValue": "",
         "defaultValueFn": function () {
        return this.delegate ? this.delegate.name : 'ConversationAction';
      },
         "help": "The coding identifier for the action."
      },
      {
         "model_": "Property",
         "name": "iconUrl",
         "type": "String",
         "defaultValue": "",
         "defaultValueFn": function () { return this.delegate.iconUrl; },
         "help": "Provides a url for an icon to render for this action"
      },
      {
         "model_": "Property",
         "name": "help",
         "label": "Help Text",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 6,
         "defaultValue": "",
         "defaultValueFn": function () { return this.delegate.help; },
         "help": "Help text associated with the action."
      },
      {
         "model_": "ModelProperty",
         "name": "delegate"
      },
      {
         "model_": "FunctionProperty",
         "name": "action",
         "displayHeight": 20,
         "help": "Function to implement action.",
         "displayWidth": 80,
         "defaultValue": function (action) {
        var emails = this.emails;
        if ( action.applyOnAll ) {
          emails.forEach(function(e) {
            action.delegate.action.call(e);
          });
        } else if ( emails.length ) {
          var e = emails[emails.length - 1];
          action.delegate.action.call(e);
        }
      }
      },
      {
         "model_": "Property",
         "name": "applyOnAll",
         "defaultValue": true
      }
   ],
   "actions": [],
   "constants": [],
   "messages": [],
   "methods": [],
   "listeners": [],
   "templates": [],
   "models": [],
   "tests": [],
   "relationships": [],
   "issues": []
});

//third_party/javascript/foam/v0_1/js/foam/lib/email/EMail.js
CLASS({
   "model_": "Model",
   "id": "foam.lib.email.EMail",
   "package": "foam.lib.email",
   "name": "EMail",
   "plural": "EMail",
   "tableProperties": [
      "from",
      "subject",
      "timestamp"
   ],
   "properties": [
      {
         "model_": "StringProperty",
         "name": "id",
         "label": "Message ID",
         "mode": "read-write",
         "required": true,
         "hidden": true,
         "displayWidth": 50,
        "compareProperty": function(a, b) {
          if ( a.length !==  b.length ) return a.length < b.length ? -1 : 1;
          var TABLE = "0123456789abcdef";

          for ( var i = 0; i < a.length; i++ ) {
            var ia = TABLE.indexOf(a[i]);
            var ib = TABLE.indexOf(b[i]);

            if ( ia !== ib ) {
              return ia < ib ? -1 : 1;
            }
          }
          return 0;
        }
      },
      {
         "model_": "StringProperty",
         "name": "convId",
         "label": "Conversation ID",
         "mode": "read-write",
         "hidden": true,
         "displayWidth": 30
      },
      {
         "model_": "DateProperty",
         "name": "timestamp",
         "label": "Date",
         "aliases": [
            "time",
            "modified",
            "t"
         ],
         "mode": "read-write",
         "required": true,
         "displayHeight": 1,
         "factory": function () { return new Date(); },
         "tableWidth": "100",
         "displayWidth": 45,
         "view": "TextFieldView",
         "preSet": function (_, d) {
        return ( typeof d === 'string' || typeof d === 'number' ) ? new Date(d) : d;
      }
      },
      {
         "model_": "StringProperty",
         "name": "from",
         "shortName": "f",
         "mode": "read-write",
         "required": true,
         "displayWidth": 90,
         "factory": function () { return GLOBAL.user || ""; },
         "tableFormatter": function (t) {
        var ret;
        if (t.search('<.*>') != -1) {
          // If it's a name followed by <email>, just use the name.
          ret = t.replace(/<.*>/, '').replace(/"/g, '');
        } else {
          // If it's just an email, only use everything before the @.
          ret = t.replace(/@.*/, '');
        }
        return ret.trim();
      },
         "tableWidth": "120"
      },
      {
         "model_": "StringArrayProperty",
         "name": "to",
         "shortName": "t",
         "required": true,
         "tableFormatter": function (t) { return t.replace(/"/g, '').replace(/<.*/, ''); },
         "displayWidth": 90
      },
      {
         "model_": "StringArrayProperty",
         "name": "cc",
         "required": true,
         "tableFormatter": function (t) { return t.replace(/"/g, '').replace(/<.*/, ''); },
         "displayWidth": 90
      },
      {
         "model_": "StringArrayProperty",
         "name": "bcc",
         "required": true,
         "tableFormatter": function (t) { return t.replace(/"/g, '').replace(/<.*/, ''); },
         "displayWidth": 90
      },
      {
         "model_": "StringArrayProperty",
         "name": "replyTo"
      },
      {
         "model_": "Property",
         "name": "subject",
         "type": "String",
         "shortName": "s",
         "mode": "read-write",
         "required": true,
         "displayWidth": 100,
         "view": "TextFieldView",
         "tableWidth": "45%"
      },
      {
         "model_": "StringArrayProperty",
         "name": "labels",
         "postSet": function (_, a) {
        if ( a ) for ( var i = 0 ; i < a.length ; i++ ) a[i] = a[i].intern();
      },
         "help": "Email labels.",
         "view": "LabelView"
      },
      {
         "model_": "Property",
         "name": "attachments",
         "label": "Attachments",
         "tableLabel": "@",
         "type": "Array[Attachment]",
         "subType": "Attachment",
         "view": "ArrayView",
         "factory": function () { return []; },
         "tableFormatter": function (a) { return a.length ? a.length : ''; },
         "tableWidth": "20",
         "help": "Email attachments."
      },
      {
         "model_": "StringProperty",
         "name": "body",
         "label": "",
         "shortName": "b",
         "displayWidth": 70,
         "summaryFormatter": function (t) {
        return '<div class="messageBody">' + t.replace(/\n/g,'<br/>') + '</div>';
      },
         "help": "Email message body.",
         "displayHeight": 20,
         "view": "TextFieldView"
      },
      {
         "model_": "foam.lib.email.EMailLabelProperty",
         "name": "starred",
         "labelName": "STARRED"
      },
      {
         "model_": "foam.lib.email.EMailLabelProperty",
         "name": "unread",
         "labelName": "UNREAD"
      },
      {
         "model_": "foam.lib.email.EMailLabelProperty",
         "name": "isDraft",
         "labelName": "DRAFT"
      },
      {
         "model_": "foam.lib.email.EMailLabelProperty",
         "name": "inInbox",
         "labelName": "INBOX"
      },
      {
         "model_": "StringProperty",
         "name": "snippet",
         "mode": "read-only",
         "defaultValueFn": function () { return this.body.substr(0, 100); }
      },
      {
         "model_": "BooleanProperty",
         "name": "messageSent",
         "help": "True if the user has marked this message to be sent.",
         "defaultValue": false
      },
      {
         "model_": "BooleanProperty",
         "name": "deleted"
      },
      {
         "model_": "IntProperty",
         "name": "clientVersion"
      },
      {
         "model_": "Property",
         "name": "type",
         "hidden": true,
         "defaultValue": "EMail"
      },
      {
         "model_": "Property",
         "name": "iconURL",
         "view": "ImageView",
         "defaultValue": "images/email.png"
      }
   ],
   "actions": [
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "send",
         "help": "Send the email.",
         "isAvailable": function () { return this.isDraft; },
         "isEnabled": function () { return ! this.messageSent; },
         "children": [],
         "keyboardShortcuts": [],
         "backOnComplete": true,
         "action": function() { this.messageSent = true; }
      },
      {
         "model_": "Action",
         "name": "reply",
         "help": "Reply to an email.",
         "children": [],
         "action": function (X) {
        var replyMail = X.EMail.create({
          to: [this.from],
          subject: this.subject,
          body: this.body,
          labels: ['DRAFT'],
        });
        openComposeView(X, replyMail);
      },
         "keyboardShortcuts": []
      },
      {
         "model_": "Action",
         "name": "replyAll",
         "help": "Reply to all recipients of an email.",
         "children": [],
         "action": function (X) {
        var replyMail = X.EMail.create({
          to: [this.from],
          cc: this.cc,
          subject: 'Re.: ' + this.subject,
          body: this.body,
          labels: ['DRAFT'],
        });

        for ( var i = 0 ; i < this.to ; i++ ) {
          replyMail.to.push(this.to[i]);
        }
        openComposeView(X, replyMail);
      },
         "keyboardShortcuts": []
      },
      {
         "model_": "Action",
         "name": "forward",
         "help": "Forward an email.",
         "children": [],
         "action": function (X) {
        var forwardedMail = X.EMail.create({
          subject: this.subject,
          body: this.body,
          labels: ['DRAFT'],
        });
        openComposeView(X, forwardedMail);
      },
         "keyboardShortcuts": []
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "star",
         "help": "Star an email.",
         "children": [],
         "keyboardShortcuts": [],
         "action": function() { this.toggleLabel('STARRED'); }
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "archive",
         "help": "Archive an email.",
         "isAvailable": function () { return this.hasLabel('INBOX'); },
         "children": [],
         "keyboardShortcuts": [],
         "action": function() { this.removeLabel('INBOX'); }
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "moveToInbox",
         "help": "Un-archive an email.",
         "isAvailable": function () { return ! this.hasLabel('INBOX'); },
         "children": [],
         "keyboardShortcuts": [],
         "action": function() {
           this.addLabel('INBOX');
           this.removeLabel('SPAM');
           this.removeLabel('TRASH');
         }
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "spam",
         "help": "Report an email as SPAM.",
         "isAvailable": function () { return ! this.hasLabel('SPAM'); },
         "children": [],
         "keyboardShortcuts": [],
         "action": function () {
            this.removeLabel('INBOX');
            this.addLabel('SPAM');
         }
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "trash",
         "help": "Move an email to the trash.",
         "isAvailable": function () { return ! this.hasLabel('TRASH'); },
         "children": [],
         "keyboardShortcuts": [],
         "action": function () {
        this.removeLabel('INBOX');
        this.addLabel('TRASH');
      }
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "markRead",
         "help": "Mark an email as read.",
         "isAvailable": function () { return this.hasLabel('UNREAD'); },
         "children": [],
         "keyboardShortcuts": [],
         "action": function () { this.removeLabel('UNREAD'); }
      },
      {
         "model_": "foam.lib.email.EMailMutationAction",
         "name": "markUnread",
         "help": "Mark an email as unread.",
         "isAvailable": function () { return ! this.hasLabel('UNREAD'); },
         "children": [],
         "keyboardShortcuts": [],
         "action": function () { this.addLabel('UNREAD'); }
      }
   ],
   "constants": [],
   "messages": [],
   "methods": [
      {
         "model_": "Method",
         "name": "updateLabelByName",
         "code": function (id) {
      var self = this;
      EMailLabelDAO.find(EQ(EMailLabel.DISPLAY_NAME, id), {put: function(label) {
        var mail = self.clone(); mail.toggleLabel(label.id); EMailDAO.put(mail);
      }});
    },
         "args": []
      },
      {
         "model_": "Method",
         "name": "hasLabel",
         "code": function (l) { return this.labels.indexOf(l) != -1; },
         "args": []
      },
      {
         "model_": "Method",
         "name": "toggleLabel",
         "code": function (l) { this.hasLabel(l) ? this.removeLabel(l) : this.addLabel(l); },
         "args": []
      },
      {
         "model_": "Method",
         "name": "addLabel",
         "code": function (l) { this.labels = this.labels.deleteF(l).pushF(l); },
         "args": []
      },
      {
         "model_": "Method",
         "name": "removeLabel",
         "code": function (l) { this.labels = this.labels.deleteF(l); },
         "args": []
      },
      {
         "model_": "Method",
         "name": "atoMime",
         "code": function (ret) {
      // Filter attachments into inline and non-inline attachments.
      var inline = [];
      var attachments = []
      for ( var i = 0; i < this.attachments.length; i++ ) {
        if ( this.attachments[i].inline )
          inline.push(this.attachments[i]);
        else
          attachments.push(this.attachments[i]);
      }

      // Utility function for defining unique bounday values.
      var newBoundary = (function() {
        var boundary = Math.floor(Math.random() * 10000);
        return function() { return (boundary += 1).toString(16); };
      })();

      var body = "Content-Type: text/html; charset=UTF-8\r\n\r\n";

      var fragment = new DocumentFragment();
      fragment.appendChild(document.createElement('body'));
      fragment.firstChild.innerHTML = this.body;
      var images = fragment.querySelectorAll('img');
      for ( var i = 0; i < images.length; i++ ) {
        if ( images[i].id ) {
          images[i].src = 'cid:' + images[i].id;
          images[i].removeAttribute('id');
        }
      }
      body += fragment.firstChild.innerHTML + "\r\n";

      var i;
      var self = this;

      var addAttachments = function(attachments, inline) {
        return aseq(
          function(ret) {
            boundary = newBoundary();

            body = "Content-Type: multipart/" +
              ( inline ? 'related' : 'mixed' ) + "; boundary=" + boundary + "\r\n\r\n"
              + "--" + boundary + "\r\n"
              + body
              + "\r\n--" + boundary;
            i = 0;
            ret();
          },
          awhile(
            function() { return i < attachments.length; },
            aseq(
              function(ret) {
                var att = attachments[i];
                i++;
                att.atoMime(ret);
              },
              function(ret, data) {
                body += "\r\n" + data;
                body += "--" + boundary;
                ret();
              })),
          function(ret) {
            body += "--";
            ret();
          });
      };

      aseq(
        aif(inline.length > 0,
            addAttachments(inline, true)),
        aif(attachments.length > 0,
            addAttachments(attachments, false)))(function() {
              body = "From: " + self.from + "\r\n" +
                "To: " + self.to.join(', ') + "\r\n" +
                (self.cc.length ? "Cc: " + self.cc.join(", ") + "\r\n" : "") +
                (self.bcc.length ? "Bcc: " + self.bcc.join(", ") + "\r\n" : "") +
                "Subject: " + self.subject + "\r\n" +
                body;
              ret(body);
            });
    },
         "args": []
      }
   ],
   "listeners": [],
   "templates": [],
   "models": [],
   "tests": [],
   "relationships": [],
   "issues": []
});

//third_party/javascript/foam/v0_1/js/foam/lib/email/EMailLabelProperty.js
CLASS({
   "model_": "Model",
   "id": "foam.lib.email.EMailLabelProperty",
   "package": "foam.lib.email",
   "name": "EMailLabelProperty",
   "extendsModel": "BooleanProperty",
   "requires": [],
   "imports": [],
   "exports": [],
   "properties": [
      {
         "model_": "Property",
         "name": "name",
         "type": "String",
         "required": true,
         "displayWidth": 30,
         "displayHeight": 1,
         "defaultValue": "",
         "help": "The coding identifier for the property."
      },
      {
         "model_": "Property",
         "name": "label",
         "type": "String",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.name.labelize(); },
         "help": "The display label for the property."
      },
      {
         "model_": "Property",
         "name": "speechLabel",
         "type": "String",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.label; },
         "help": "The speech label for the property."
      },
      {
         "model_": "Property",
         "name": "tableLabel",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.name.labelize(); },
         "help": "The table display label for the entity."
      },
      {
         "model_": "Property",
         "name": "protobufType",
         "type": "String",
         "required": false,
         "defaultValueFn": function () { return this.type.toLowerCase(); },
         "help": "The protobuf type that represents the type of this property."
      },
      {
         "model_": "Property",
         "name": "javascriptType",
         "type": "String",
         "required": false,
         "defaultValueFn": function () { return this.type; },
         "help": "The javascript type that represents the type of this property."
      },
      {
         "model_": "Property",
         "name": "shortName",
         "type": "String",
         "required": true,
         "displayWidth": 10,
         "displayHeight": 1,
         "defaultValue": "",
         "help": "A short alternate name to be used for compact encoding."
      },
      {
         "model_": "Property",
         "name": "aliases",
         "type": "Array[String]",
         "view": "StringArrayView",
         "defaultValue": [],
         "help": "Alternate names for this property."
      },
      {
         "model_": "Property",
         "name": "mode",
         "type": "String",
         "view":          {
                        "factory_": "ChoiceView",
            "choices": [
               "read-only",
               "read-write",
               "final"
            ]
         },
         "defaultValue": "read-write"
      },
      {
         "model_": "Property",
         "name": "subType",
         "label": "Sub-Type",
         "type": "String",
         "displayWidth": 30,
         "help": "The type of the property."
      },
      {
         "model_": "Property",
         "name": "units",
         "type": "String",
         "required": true,
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValue": "",
         "help": "The units of the property."
      },
      {
         "model_": "Property",
         "name": "required",
         "type": "Boolean",
         "view": "BooleanView",
         "defaultValue": true,
         "help": "Indicates if the property is a required field."
      },
      {
         "model_": "Property",
         "name": "hidden",
         "type": "Boolean",
         "view": "BooleanView",
         "defaultValue": false,
         "help": "Indicates if the property is hidden."
      },
      {
         "model_": "Property",
         "name": "transient",
         "type": "Boolean",
         "view": "BooleanView",
         "defaultValue": false,
         "help": "Indicates if the property is transient."
      },
      {
         "model_": "Property",
         "name": "displayWidth",
         "type": "int",
         "displayWidth": 8,
         "displayHeight": 1,
         "defaultValue": "30",
         "help": "The display width of the property."
      },
      {
         "model_": "Property",
         "name": "displayHeight",
         "type": "int",
         "displayWidth": 8,
         "displayHeight": 1,
         "defaultValue": 1,
         "help": "The display height of the property."
      },
      {
         "model_": "Property",
         "name": "detailView",
         "type": "view",
         "defaultValueFn": function () { return this.view; },
         "help": "View component for the property when rendering within a DetailView."
      },
      {
         "model_": "Property",
         "name": "citationView",
         "type": "view",
         "defaultValueFn": function () { return this.view; },
         "help": "View component for the property when rendering within a CitationView."
      },
      {
         "model_": "Property",
         "name": "detailViewPreRow",
         "defaultValue": function () { return ""; },
         "help": "Inject HTML before row in DetailView."
      },
      {
         "model_": "Property",
         "name": "detailViewPostRow",
         "defaultValue": function () { return ""; },
         "help": "Inject HTML before row in DetailView."
      },
      {
         "model_": "Property",
         "name": "defaultValueFn",
         "label": "Default Value Function",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "postSet": function (old, nu) {
        if ( nu && this.defaultValue ) this.defaultValue = undefined;
      },
         "help": "The property's default value function."
      },
      {
         "model_": "Property",
         "name": "dynamicValue",
         "label": "Value's Dynamic Function",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "A dynamic function which computes the property's value."
      },
      {
         "model_": "Property",
         "name": "factory",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "Factory for creating initial value when new object instantiated."
      },
      {
         "model_": "Property",
         "name": "lazyFactory",
         "type": "Function",
         "required": false,
         "view": "FunctionView",
         "help": "Factory for creating the initial value. Only called when the property is accessed for the first time."
      },
      {
         "model_": "Property",
         "name": "postSet",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "A function called after normal setter logic, but before property change event fired."
      },
      {
         "model_": "Property",
         "name": "tableFormatter",
         "label": "Table Cell Formatter",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "Function to format value for display in TableView."
      },
      {
         "model_": "Property",
         "name": "summaryFormatter",
         "label": "Summary Formatter",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "Function to format value for display in SummaryView."
      },
      {
         "model_": "Property",
         "name": "tableWidth",
         "type": "String",
         "required": false,
         "defaultValue": "",
         "help": "Table View Column Width."
      },
      {
         "model_": "Property",
         "name": "help",
         "label": "Help Text",
         "type": "String",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 6,
         "view": "TextAreaView",
         "defaultValue": "",
         "help": "Help text associated with the property."
      },
      {
         "model_": "Property",
         "name": "documentation",
         "type": "Documentation",
         "view": function () { return DetailView.create({model: Documentation}); },
         "getter": function () {
    if ( ! DEBUG ) return '';
    var doc = this.instance_.documentation;
    if (doc && typeof Documentation != "undefined" && Documentation // a source has to exist (otherwise we'll return undefined below)
        && (  !doc.model_ // but we don't know if the user set model_
           || !doc.model_.getPrototype // model_ could be a string
           || !Documentation.isInstance(doc) // check for correct type
        ) ) {
      // So in this case we have something in documentation, but it's not of the
      // "Documentation" model type, so FOAMalize it.
      if (doc.body) {
        this.instance_.documentation = Documentation.create( doc );
      } else {
        this.instance_.documentation = Documentation.create({ body: doc });
      }
    }
    // otherwise return the previously FOAMalized model or undefined if nothing specified.
    //console.log("getting ", this.instance_.documentation)
    return this.instance_.documentation;
  },
         "setter": function (nu) {
    if ( ! DEBUG ) return;
    this.instance_.documentation = nu;
  },
         "help": "Documentation associated with this entity."
      },
      {
         "model_": "Property",
         "name": "actionFactory",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "Factory to create the action objects for taking this property from value A to value B"
      },
      {
         "model_": "Property",
         "name": "compareProperty",
         "type": "Function",
         "displayWidth": 70,
         "displayHeight": 5,
         "view": "FunctionView",
         "defaultValue": function (o1, o2) {
        return (o1.localeCompare || o1.compareTo).call(o1, o2);
      },
         "help": "Comparator function."
      },
      {
         "model_": "Property",
         "name": "fromElement",
         "defaultValue": function (e, p) { p.fromString.call(this, e.innerHTML, p); },
         "help": "Function to extract from a DOM Element."
      },
      {
         "model_": "Property",
         "name": "toJSON",
         "defaultValue": function (visitor, output, o) {
        if ( ! this.transient ) output[this.name] = visitor.visit(o[this.name]);
      },
         "help": "Function to extract from a DOM Element."
      },
      {
         "model_": "Property",
         "name": "autocompleter",
         "subType": "Autocompleter",
         "help": "Name or model for the autocompleter for this property."
      },
      {
         "model_": "Property",
         "name": "install",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": "",
         "help": "A function which installs additional features into the Model's prototype."
      },
      {
         "model_": "Property",
         "name": "exclusive",
         "type": "Boolean",
         "view": "BooleanView",
         "defaultValue": true,
         "help": "Indicates if the property can only have a single value."
      },
      {
         "model_": "Property",
         "name": "type",
         "type": "String",
         "required": true,
         "displayWidth": 20,
         "view":          {
                        "factory_": "ChoiceView",
            "choices": [
               "Array",
               "Boolean",
               "Color",
               "Date",
               "DateTime",
               "Email",
               "Enum",
               "Float",
               "Function",
               "Image",
               "Int",
               "Object",
               "Password",
               "String",
               "String[]",
               "URL"
            ]
         },
         "defaultValue": "Boolean",
         "help": "The FOAM type of this property."
      },
      {
         "model_": "Property",
         "name": "javaType",
         "type": "String",
         "required": false,
         "displayWidth": 70,
         "defaultValue": "bool",
         "defaultValueFn": "",
         "help": "The Java type of this property."
      },
      {
         "model_": "Property",
         "name": "view",
         "type": "view",
         "defaultValue": "BooleanView",
         "help": "View component for the property."
      },
      {
         "model_": "Property",
         "name": "defaultValue",
         "type": "String",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValue": false,
         "postSet": function (old, nu) {
        if ( nu && this.defaultValueFn ) this.defaultValueFn = undefined;
      },
         "help": "The property's default value."
      },
      {
         "model_": "Property",
         "name": "preSet",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": function (_, v) { return !!v; },
         "help": "An adapter function called before normal setter logic."
      },
      {
         "model_": "Property",
         "name": "prototag",
         "label": "Protobuf tag",
         "type": "Int",
         "required": false,
         "help": "The protobuf tag number for this field."
      },
      {
         "model_": "Property",
         "name": "fromString",
         "defaultValue": function (s, p) {
        var txt = s.trim();
        this[p.name] =
          txt.equalsIC('y')    ||
          txt.equalsIC('yes')  ||
          txt.equalsIC('true') ||
          txt.equalsIC('t');
      },
         "help": "Function to extract value from a String."
      },
      {
         "model_": "Property",
         "name": "labelName",
         "required": true
      },
      {
         "model_": "Property",
         "name": "setter",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": function (v, name) {
        var old = this.v;
        var label = this.model_[name.constantize()].labelName;
        if ( v ) this.addLabel(label); else this.removeLabel(label);
        this.propertyChange_(this.propertyTopic(name), old, v);
      },
         "help": "The property's default value function."
      },
      {
         "model_": "Property",
         "name": "getter",
         "type": "Function",
         "required": false,
         "displayWidth": 70,
         "displayHeight": 3,
         "view": "FunctionView",
         "defaultValue": function (name) {
        var label = this.model_[name.constantize()].labelName;
        return this.hasLabel(label);
      },
         "help": "The property's default value function."
      }
   ],
   "actions": [],
   "constants": [],
   "messages": [],
   "methods": [],
   "listeners": [],
   "templates": [],
   "models": [],
   "tests": [],
   "relationships": [],
   "issues": []
});

//third_party/javascript/foam/v0_1/js/foam/lib/email/EMailMutationAction.js
CLASS({
   "model_": "Model",
   "id": "foam.lib.email.EMailMutationAction",
   "package": "foam.lib.email",
   "name": "EMailMutationAction",
   "extendsModel": "Action",
   "requires": [],
   "imports": [],
   "exports": [],
   "properties": [
      {
         "model_": "Property",
         "name": "name",
         "type": "String",
         "required": true,
         "displayWidth": 30,
         "displayHeight": 1,
         "defaultValue": "",
         "help": "The coding identifier for the action."
      },
      {
         "model_": "Property",
         "name": "label",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.name.labelize(); },
         "help": "The display label for the action."
      },
      {
         "model_": "Property",
         "name": "speechLabel",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 1,
         "defaultValueFn": function () { return this.label; },
         "help": "The speech label for the action."
      },
      {
         "model_": "Property",
         "name": "help",
         "label": "Help Text",
         "type": "String",
         "displayWidth": 70,
         "displayHeight": 6,
         "defaultValue": "",
         "help": "Help text associated with the action."
      },
      {
         "model_": "DocumentationProperty",
         "name": "documentation",
         "getter": function () {
        var doc = this.instance_.documentation;
        if (doc && typeof Documentation != "undefined" && Documentation // a source has to exist (otherwise we'll return undefined below)
            && (  !doc.model_ // but we don't know if the user set model_
               || !doc.model_.getPrototype // model_ could be a string
               || !Documentation.isInstance(doc) // check for correct type
            ) ) {
          // So in this case we have something in documentation, but it's not of the
          // "Documentation" model type, so FOAMalize it.
          if (doc.body) {
            this.instance_.documentation = Documentation.create( doc );
          } else {
            this.instance_.documentation = Documentation.create({ body: doc });
          }
        }
        // otherwise return the previously FOAMalized model or undefined if nothing specified.
        return this.instance_.documentation;
      }
      },
      {
         "model_": "Property",
         "name": "default",
         "type": "Boolean",
         "view": "BooleanView",
         "defaultValue": false,
         "help": "Indicates if this is the default action."
      },
      {
         "model_": "FunctionProperty",
         "name": "isAvailable",
         "label": "Available",
         "displayHeight": 3,
         "help": "Function to determine if action is available.",
         "displayWidth": 70,
         "defaultValue": function () { return true; }
      },
      {
         "model_": "FunctionProperty",
         "name": "isEnabled",
         "label": "Enabled",
         "displayHeight": 3,
         "help": "Function to determine if action is enabled.",
         "displayWidth": 70,
         "defaultValue": function () { return true; }
      },
      {
         "model_": "FunctionProperty",
         "name": "labelFn",
         "label": "Label Function",
         "help": "Function to determine label. Defaults to 'this.label'.",
         "defaultValue": function (action) { return action.label; }
      },
      {
         "model_": "Property",
         "name": "iconUrl",
         "type": "String",
         "defaultValue": "",
         "help": "Provides a url for an icon to render for this action"
      },
      {
         "model_": "Property",
         "name": "showLabel",
         "type": "String",
         "defaultValue": true,
         "help": "Property indicating whether the label should be rendered alongside the icon"
      },
      {
         "model_": "Property",
         "name": "children",
         "type": "Array",
         "subType": "Action",
         "view": "ArrayView",
         "factory": function () { return []; },
         "help": "Child actions of this action."
      },
      {
         "model_": "Property",
         "name": "parent",
         "type": "String",
         "help": "The parent action of this action"
      },
      {
         "model_": "StringArrayProperty",
         "name": "keyboardShortcuts"
      },
      {
         "model_": "Property",
         "name": "translationHint",
         "label": "Description for Translation",
         "type": "String",
         "defaultValue": ""
      },
      {
         "model_": "BooleanProperty",
         "name": "backOnComplete",
         "defaultValue": false
      },
      {
         "model_": "FunctionProperty",
         "name": "action",
         "displayHeight": 20,
         "help": "Function to implement action.",
         "displayWidth": 80,
         "defaultValue": "",
         "preSet": function (_, a) {
        return function(X, action) {
          var obj = this;
          a.apply(obj, arguments);
          var self = this;
          var sink = action.backOnComplete ?
            { put: function() { X.stack.back(); },
              error: function() { X.stack.back(); } } : undefined;
          X.EMailDAO && X.EMailDAO.put(obj, sink);
        };
      }
      }
   ],
   "actions": [],
   "constants": [],
   "messages": [],
   "methods": [],
   "listeners": [],
   "templates": [],
   "models": [],
   "tests": [],
   "relationships": [],
   "issues": []
});

//third_party/javascript/foam/v0_1/js/foam/lib/gmail/Sync.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.lib.gmail',
  name: 'Sync',
  extendsModel: 'foam.core.dao.Sync',
  requires: [
    'FOAMGMailMessage'
  ],
  methods: {
    purge: function(ret, remoteLocal) {
      // Drafts that were created and sent from the client with no sync in
      // between, do not get marked as deleted.  However if the client version
      // is old and the draft is marked as sent, then it is no longer needed.
      var self = this;
      this.SUPER(function(purged) {
        this.local
          .where(AND(LTE(this.localVersionProp, remoteLocal),
                     EQ(this.FOAMGMailMessage.IS_SENT, true),
                     EQ(this.FOAMGMailMessage.LABEL_IDS, 'DRAFT')))
          .removeAll(purged)(ret);
      }.bind(this), remoteLocal);
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/lib/gmail/SyncDecorator.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.lib.gmail',
  name: 'SyncDecorator',
  extendsModel: 'ProxyDAO',
  requires: [
    'FOAMGMailMessage'
  ],

  methods: {
    put: function(obj, sink) {
      if ( obj.deleted ) {
        this.delegate
          .where(EQ(this.FOAMGMailMessage.MESSAGE_ID, obj.id))
          .update(SET(this.FOAMGMailMessage.DELETED, true));
      }
      this.SUPER(obj, sink);
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/navigator/BasicFOAMlet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'BasicFOAMlet',
  extendsModel: 'foam.navigator.FOAMlet',
  package: 'foam.navigator',

  documentation: function() {/* A base model for native FOAMlets. If you are
    wrapping an existing model, use a $$DOC{ref:'foam.navigator.WrappedFOAMlet'}.
  */},

  properties: [
    {
      name: 'type',
      defaultValueFn: function() { return this.model_.label; }
    },
    {
      name: 'model',
      defaultValueFn: function() { return this.model_; }
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.SUPER();
        this.subscribe(
            ['property'],
            function(model, o, notificationData) {
              if ( notificationData[0] !== 'property' ||
                  notificationData[1] === 'lastModified' ||
                  ! model || ! model.properties ) return;
              var propName = notificationData[1];
              var propMatch = model.properties.filter(function(propName, prop) {
                return prop.name == propName;
              }.bind(this, propName))[0];
              if ( ! propMatch || propMatch.hidden ) return;
              console.log('Updating lastModified');
              o.lastModified = Date.now();
            }.bind(this, this.model_));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/BrowserConfig.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'BrowserConfig',
  package: 'foam.navigator',

  documentation: function() {/*  */},

  requires: [
    'EasyDAO',
    'FutureDAO'
  ],

  constants: [
  ],

  properties: [
    {
      name: 'name',
      defaultValueFn: function() {
        if ( ! this.model ) return '';
        return (this.model.package ? this.model.package + '.' : '') + this.model.name;
      }
    },
    {
      model_: 'ModelProperty',
      name: 'model',
      required: true
    },
    {
      name: 'dao',
      lazyFactory: function() {
        return this.EasyDAO.create({
          model: this.model,
          cache: true,
          seqNo: true,
          daoType: 'IDB'
        });
      }
    },
    {
      model_: 'FunctionProperty',
      name: 'queryParserFactory'
    },
    {
      name: 'iconURL',
      model_: 'StringProperty',
      label: 'Icon'
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/Controller.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Controller',
  package: 'foam.navigator',
  extendsModel: 'View',
  requires: [
    'CachingDAO',
    'FutureDAO',
    'IDBDAO',
    'MDAO',
    'TableView',
    'TextFieldView',
    'ToolbarView',
    'foam.navigator.BrowserConfig',
    'foam.navigator.FOAMlet',
    'foam.navigator.FOAMletBrowserConfig',
    'foam.navigator.types.Todo',
    'foam.navigator.views.OverlayView',
    'foam.navigator.views.SelectTypeView',
    'foam.navigator.dao.MultiDAO'
  ],
  exports: [
    'dao',
    'overlay',
    'selection$'
  ],

  properties: [
    {
      name: 'config',
      documentation: 'Sets up the default BrowserConfig, which loads FOAMlets.',
      factory: function() {
        return this.FOAMletBrowserConfig.create();
      }
    },
    {
      name: 'dao',
      factory: function() {
        return this.config.dao;
      }
    },
    {
      name: 'queryParser',
      factory: function() {
        // Constructs and returns our query parser. This parser is
        // model-agnostic and simply turns any "foo:bar" into an axis search.
        // TODO(braden): Actually implement the sophisticated parsing here.
        return function(q) {
          return this.config.queryParser;
        };
      }
    },
    {
      name: 'q',
      view: {
        factory_: 'TextFieldView',
        name: 'search',
        type: 'search',
        onKeyMode: true,
        displayWidth: 95
      }
    },
    {
      name: 'count',
      view: {
        factory_: 'TextFieldView',
        name: 'count',
        mode: 'read-only',
        displayWidth: 10
      }
    },
    {
      name: 'table',
      factory: function() {
        return this.TableView.create({
          model: this.config.model,
          dao: this.dao,
          scrollEnabed: true,
          rows: 20
        });
      },
      postSet: function(old, nu) {
        if (old) Events.unlink(old.scrollbar.value$, this.count$);
        Events.link(nu.scrollbar.value$, this.count$);
      }
    },
    {
      name: 'selection',
      postSet: function(old, nu) {
        this.itemToolbar.destroy();
        this.itemToolbar.addActions(nu.model_.actions);
        this.itemToolbar.addActions(nu.model_.actions.map(function(a) {
          a = a.clone();
          a.action.bind(nu);
          return a;
        }));
        this.itemToolbar.updateHTML();
      }
    },
    {
      name: 'itemToolbar',
      documentation: 'The toolbar for each selected item.',
      factory: function() {
        return this.ToolbarView.create({
          className: 'browser-action-bar',
          extraClassName: 'browser-item-actions'
        });
      }
    },
    {
      name: 'configToolbar',
      documentation: 'The toolbar for the whole config, with top-level ' +
          'operations like creating new items.',
      factory: function() {
        var view = this.ToolbarView.create({
          className: 'browser-action-bar',
          extraClassName: 'browser-top-actions'
        });
        var config = this.config;
        view.addActions(this.config.model_.actions.map(function(a) {
          a = a.clone();
          a.action = a.action.bind(config);
          return a;
        }));
        return view;
      }
    },
    {
      name: 'overlay',
      factory: function() {
        return this.OverlayView.create();
      }
    },
  ],

  methods: { init: function() { this.SUPER(); window.ctlrDAO = this.dao; } },

  templates: [
    function CSS() {/*
      .browser-top {
        height: 40px;
        line-height: 40px;
      }

      .browser-action-bar {
      }
    */},
    function toInnerHTML() {/*
      %%overlay
      <div class="browser-top">
        Search: $$q
        Count: $$count
      </div>
      %%configToolbar
      %%itemToolbar
      <div class="browser-main-view">
        %%table
      </div>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/FOAMlet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'FOAMlet',
  package: 'foam.navigator',

  tableProperties: [
    'iconURL',
    'type',
    'name',
    'labels',
    'lastModified'
  ],

  properties: [
    {
      name: 'id',
      mode: 'read-only',
      hidden: true
    },
    {
      name: 'type',
      tableWidth: 80,
    },
    {
      name: 'model',
      type: 'Model',
      hidden: true
    },
    {
      name: 'name',
      model_: 'StringProperty'
    },
    {
      name: 'iconURL',
      model_: 'StringProperty',
      label: 'Icon',
      view: 'ImageView',
      tableLabel: 'Icon',
      tableWidth: 30,
      todo: multiline(function() {/*
        Add support for (1) rendering icons, and (2) icon import (upload, etc.)
      */})
    },
    {
      name: 'lastModified',
      model_: 'DateTimeProperty',
      tableWidth: 100,
    },
    {
      name: 'labels',
      model_: 'StringArrayProperty',
      factory: function() { return []; }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/FOAMletBrowserConfig.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'FOAMletBrowserConfig',
  package: 'foam.navigator',
  extendsModel: 'foam.navigator.BrowserConfig',
  requires: [
    'CachingDAO',
    'FutureDAO',
    'IDBDAO',
    'MDAO',
    'foam.navigator.dao.MultiDAO',
    'foam.navigator.BrowserConfig',
    'foam.navigator.FOAMlet',
    'foam.navigator.types.Todo',
    'foam.navigator.types.Audio',
    'foam.navigator.views.SelectTypeView'
  ],

  imports: [
    'overlay'
  ],

  properties: [
    {
      name: 'name',
      defaultValue: 'FOAMletBrowser'
    },
    {
      name: 'model',
      defaultValueFn: function() { return this.FOAMlet; }
    },
    {
      name: 'configDAO',
      factory: function() {
        // The BrowserConfig DAO we'll be passing to the MultiDAO that drives
        // the FOAMlet system.
        // TODO(braden): This needs to arequire the model of incoming
        // BrowserConfigs and delay the put until that's done. AsyncAdapterDAO?
        // Doesn't exist yet, but it needs to exist soon.
        var configDAO = this.CachingDAO.create({
          cache: this.MDAO.create({ model: this.BrowserConfig }),
          src: this.IDBDAO.create({
            useSimpleSerialization: false,
            name: 'FOAMletBrowserConfigs',
            model: this.BrowserConfig
          })
        });

        var future = afuture();
        var futureDAO = this.FutureDAO.create({
          future: future.get
        });

        configDAO.select(COUNT())(function(c) {
          if (c.count > 0) future.set(configDAO);
          else {
            [
              this.BrowserConfig.create({ model: 'foam.navigator.types.Todo' }),
              this.BrowserConfig.create({ model: 'foam.navigator.types.Audio' })
            ].dao.select(configDAO)(function() {
              future.set(configDAO);
            });
          }
        }.bind(this));

        return futureDAO;
      }
    },
    {
      name: 'dao',
      lazyFactory: function() {
        return this.MultiDAO.create({
          configDAO: this.configDAO
        });
      }
    }
  ],

  actions: [
    {
      name: 'newItem',
      label: 'Create...',
      action: function() {
        var self = this;
        this.configDAO.select([])(function(configs) {
          this.overlay.open(this.SelectTypeView.create({
            dao: configs.map(function(c) { return c.model; }).dao
          }));
        }.bind(this));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/IssueConfig.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'IssueConfig',
  package: 'foam.navigator',
  extendsModel: 'foam.navigator.BrowserConfig',
  requires: [
    'XHR',
    'foam.navigator.types.Issue',
  ],

  properties: [
    {
      name: 'name',
      defaultValue: 'IssueBrowser'
    },
    {
      name: 'model',
      defaultValueFn: function() { return this.Issue; }
    },
    {
      name: 'dao',
      factory: function() {
        return this.EasyDAO.create({
          model: this.Issue,
          cache: true
        });
      }
    },
    {
      name: 'queryParserFactory',
      defaultValue: function() {
        // Produces a query parser function. Currently this parser understands:
        // - assignee:me and assignee:adamvy
        // - reporter:me and reporter:kgr
        // - status:open
        // - cc:kgr
        // - star:true and star:false
        // - text searches against title and comment.
        var model = this.Issue;
        return function(q) {
          var terms = q.split(/ +/);
          var queries = [];
          for ( var i = 0 ; i < terms.length ; i++ ) {
            var t = terms[i];
            var parts = t.split(':');
            if (parts.length === 1) {
              queries.push(CONTAINS_IC(SEQ(model.TITLE, model.COMMENT), t));
            } else if ( parts[0] === 'assignee' ) {
              queries.push(EQ(model.ASSIGNEE, parts[1]));
            } else if ( parts[0] === 'reporter' ) {
              queries.push(EQ(model.REPORTER, parts[1]));
            } else if ( parts[0] === 'status' ) {
              var base = IN(model.STATUS, ['NEW', 'ASSIGNED', 'ACCEPTED']);
              if ( parts[1] === 'closed' ) {
                queries.push(NOT(base));
              } else if ( parts[1] === 'open' ) {
                queries.push(base);
              } else {
                queries.push(EQ(model.STATUS, parts[1]));
              }
            } else if ( parts[0] === 'star' ) {
              queries.push(EQ(model.STARRED, parts[1]));
            } else if ( parts[0] === 'cc' ) {
              queries.push(CONTAINS_IC(model.CC, parts[1]));
            }
          }
          return AND.apply(null, queries).partialEval();
        };
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/SearchController.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'SearchController',
  package: 'foam.navigator',
  extendsModel: 'View',
  requires: [
    'foam.navigator.views.GSnippet',
    'foam.navigator.views.EMailGSnippet',
    'foam.navigator.views.ContactGSnippet',
    'foam.navigator.views.IssueGSnippet',
    'foam.navigator.views.PhoneGSnippet',
    'foam.navigator.views.TodoGSnippet',
    'foam.navigator.views.AudioGSnippet',
    'foam.navigator.BrowserConfig',
    'foam.navigator.FOAMlet',
    'foam.navigator.IssueConfig',
    'foam.navigator.dao.MultiDAO',
    'foam.navigator.types.Issue',
    'foam.navigator.types.Mail',
    'foam.navigator.types.Todo',
    'foam.navigator.types.Audio',
    'CachingDAO',
    'IDBDAO',
    'FOAMGMailMessage',
    'foam.lib.email.EMail',
    'MDAO',
    'GMailToEMailDAO',
    'lib.contacts.Contact',
    'Phone'
  ],
  imports: [
    'window'
  ],
  properties: [
    {
      name: 'configDao',
      factory: function() {
        var self = this;

        return [
          this.BrowserConfig.create({
            model: 'foam.navigator.types.Todo',
            dao: this.CachingDAO.create({
              src: this.IDBDAO.create({
                model: this.Todo,
                useSimpleSerialization: false
              }),
              delegate: this.MDAO.create({ model: this.Audio })
            })
          }),
          this.BrowserConfig.create({
            model: 'foam.navigator.types.Audio',
            dao: this.CachingDAO.create({
              src: this.IDBDAO.create({
                model: this.Audio,
                useSimpleSerialization: false
              }),
              delegate: this.MDAO.create({ model: this.Audio })
            })
          }),
          this.IssueConfig.create(),
          this.BrowserConfig.create({
            model: 'foam.lib.email.EMail',
            dao: this.CachingDAO.create({
              src: this.GMailToEMailDAO.create({
                delegate: this.IDBDAO.create({
                  model: this.FOAMGMailMessage, useSimpleSerialization: false
                })
              }),
              delegate: this.MDAO.create({ model: this.EMail })
            })
          }),
          this.BrowserConfig.create({
            model: this.Contact,
            dao: this.CachingDAO.create({
              src: this.IDBDAO.create({
                model: this.Contact,
                useSimpleSerialization: false
              }),
              delegate: this.MDAO.create({ model: this.Contact })
            })
          }),
          this.BrowserConfig.create({
            model: this.Phone,
            dao: phones
          })
        ].dao;
      }
    },
    {
      model_: 'DAOProperty',
      name: 'dao',
      factory: function() {
        return this.MultiDAO.create({ configDAO: this.configDao });
      }
    },
    {
      name: 'logo',
      defaultValue: 'https://www.google.ca/images/srpr/logo11w.png',
      view: 'ImageView'
    },
    {
      model_: 'StringProperty',
      name: 'query',
      postSet: function(old, nu) { if (nu) this.expanded = true; }
    },
    {
      model_: 'DAOProperty',
      name: 'filteredDao',
      view: {
        factory_: 'DAOListView',
        rowView: 'foam.navigator.views.GSnippet'
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'expanded',
      defaultValue: false,
      postSet: function(old, nu) {
        if ( old != nu ) this.updateHTML();
      }
    },
    {
      name: 'modelNames',
      factory: function() {
        return [
          'All',
          'EMail',
          'Todo',
          'Audio',
          'Contacts'
        ].sink;
      }
    },
    {
      name: 'modelFilter',
      defaultValue: 'All',
      view: { factory_: 'ChoiceListView', extraClassName: 'model-names' }
    }
  ],
  methods: {
    init: function() {
      this.SUPER();
      Events.dynamic(
        function() { this.dao; this.query; this.modelFilter }.bind(this),
        function() {
          var modelQuery = this.modelFilter === 'All' ? TRUE :
              EQ(this.FOAMlet.TYPE, this.modelFilter);
          this.filteredDao = this.dao &&
              this.dao.where(AND(modelQuery, MQL(this.query))).limit(10);
        }.bind(this));
      this.maybeLoadData('Todo', 'Audio');
    },
    updateHTML: function() {
      if ( ! this.$ ) return;
      this.$.outerHTML = this.toHTML();
      this.initHTML();
    },
    initHTML: function() {
      this.SUPER();
      // TODO: Hack, should views should have a focus() method?
      this.queryView.$.focus();
    },
    toHTML: function() {
      return this.expanded ? this.expandedHTML() : this.collapsedHTML();
    },
    maybeLoadData: function() {
      var args = argsToArray(arguments);
      args.forEach(function(modelName) {
        this.dao.where(EQ(this.FOAMlet.TYPE, modelName)).select(COUNT())(
            function(res) {
              if ( res.count <= 0 && this.window[modelName + 'Data']) {
                console.log('Adding canned data for ' + modelName);
                this.window[modelName + 'Data'].forEach(function(item) {
                  console.log('Putting', item, 'for', modelName);
                  this.dao.put(item);
                }.bind(this));
              }
            }.bind(this));
      }.bind(this));
    }
  },
  templates: [
    function CSS() {/*
      .searchBox {
        width: 523px;
        font: 16px arial,sans-serif;
        flex-grow: 0;
        flex-string: 0;
      }
      body {
        margin: 0;
        padding: 0;
        border: 0;
      }

      .search-results {
        padding: 20px 80px;
      }
      .filters {
        border-bottom: 1px solid #ccc;
        padding-left: 70px;
        width: 100%;
      }
      .model-names .choice {
        margin: 0;
        padding: 0 12px 10px;
        cursor: pointer;
      }
      .model-names .choice.selected {
        border-bottom: 3px solid #dd4b39;
        color: #dd4b39;
      }
    */},
    function expandedHTML() {/*
      <div id="<%= this.id %>">
        <div style="background: #f1f1f1; height: 60px; display:flex; align-items: center;">
          <div style="display: inline-block; flex-grow: 0; flex-shrink: 0; padding-right: 12px; margin-left: 12px; background: url('<%= this.logo %>') no-repeat; background-size: 92px 33px; height: 33px; width: 92px"></div>
          $$query{ onKeyMode: true, extraClassName: 'searchBox' }
        </div>
        <div class="filters">$$modelFilter{ choices: this.modelNames }</div>
        <div class="search-results">$$filteredDao</div>
      </div>
    */},
    function collapsedHTML() {/*
      <div id="<%= this.id %>" style="padding-top: 120px">
        <center>
          <div style="background: url('<%= this.logo %>') no-repeat; background-size: 269px 95px; height: 95px; width:269px; padding-bottom: 20px"></div>
          <div>$$query{ onKeyMode: true, extraClassName: 'searchBox' }</div>
          <div>$$filteredDao</div>
        </center>
      </div> */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/WrappedFOAMlet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 CLASS({
  name: 'WrappedFOAMlet',
  extendsModel: 'foam.navigator.FOAMlet',
  package: 'foam.navigator',

  documentation: function() {/* A wrapper for $$DOC{ref:'foam.navigator.FOAMlet'}
    based on existing models. Set data to be your instance, and the override
    or set the FOAMlet properties based on the instance.
  */},

  properties: [
    {
      name: 'data',
      postSet: function(_,nu) {
        this.model = nu.model_;
      }
    },
    {
      name: 'model',
      type: 'Model'
    },
    {
      name: 'id',
      getter: function() { return this.data && this.data.id; },
      documentation: function() {/* $$DOC{ref:'id'} should match the wrapped object. */},
    },
    {
      name: 'type',
      defaultValueFn: function() { return this.model && this.model.label; },
      documentation: function() {/* Override this to extract the item's model label */}
    },
    {
      name: 'name',
      model_: 'StringProperty',
      defaultValueFn: function() { return this.data && this.data.name; },
      documentation: function() {/* Override this to extract a useful name */}
    },
    {
      name: 'iconURL',
      documentation: function() {/* Override this to extract a useful icon URL */},
    },
    {
      name: 'lastModified',
      model_: 'DateTimeProperty',
      tableWidth: 100,
      documentation: function() {/* Override this to extract and/or apply the last
        modified time of the item, or something approximating it.
      */},
    },
    {
      name: 'labels',
      model_: 'StringArrayProperty',
      factory: function() { return []; },
      documentation: function() {/* Override this to extract useful labels or tags
        from the item.
      */}
    }
  ]

});

//third_party/javascript/foam/v0_1/js/foam/navigator/dao/FOAMletDecoratorDAO.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'FOAMletDecoratorDAO',
  package: 'foam.navigator.dao',
  extendsModel: 'AbstractAdapterDAO',

  requires: [
    'foam.navigator.WrappedFOAMlet'
  ],

  properties: [
    {
      name: 'model',
      model_: 'ModelProperty',
      documentation: function() {/* If a valid WrappedFOAMlet is not specified
        here, model-for-model will attempt to load the closest it can find.
      */},  
    }
  ],   
  
  methods: {
    bToA: function(obj) { 
      if ( this.model ) {
        return this.model.create({ data: obj });
      } else {
        // try model-for-model if none was specified
        return this.WrappedFOAMlet.create({ model: obj.model_, data: obj });
      }
    },
    aToB: function(obj) {
      return obj.data;
    },
    adaptOptions_: function(opts) { return opts; }
  }

});

//third_party/javascript/foam/v0_1/js/foam/navigator/dao/IDConfig.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'IDConfig',
  package: 'foam.navigator.dao',

  properties: [
    {
      name: 'getModelName',
      defaultValue: function(id) {
        if ( id.id ) id = id.id;
        return id.split(':')[0];
      }
    },
    {
      name: 'getIDPart',
      defaultValue: function(id) {
        if ( id.id ) id = id.id;
        return id.split(':').slice(1).join(':');
      }
    },
    {
      name: 'decorateID',
      defaultValue: function(data, id) {
        return data.name + ':' + id;
      }
    },
    {
      name: 'dedecorateID',
      defaultValue: function(id) {
        return this.getIDPart(id);
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/dao/ModelIDDecoratorDAO.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ModelIDDecoratorDAO',
  package: 'foam.navigator.dao',
  extendsModel: 'ProxyDAO',

  requires: [
    'foam.navigator.dao.IDConfig'
  ],

  todo: multiline(function() {/*
    (markdittmer): Implement ID rewriting support for removeAll(), select(),
                   where(), orderBy().
  */}),

  properties: [
    {
      name: 'model'
    },
    {
      name: 'config',
      type: 'foam.navigator.dao.IDConfig',
      required: true,
      factory: function() { return this.IDConfig.create(); }
    },
    {
      name: 'put_',
      model_: 'FunctionProperty',
      defaultValue: function(sink, obj) {
        var decoratedObj = obj.clone();
        decoratedObj.id = this.config.decorateID(obj.model_, obj.id);
        sink && sink.put && sink.put(decoratedObj);
      }
    },
    {
      name: 'error_',
      defaultValue: function(sink) {
        var args = argsArray(arguments).slice(1);
        sink.error.apply(sink, args);
      }
    },
    {
      name: 'remove_',
      defaultValue: function(model, sink, id) {
        sink.remove(this.config.decorateID(model, id));
      }
    },
    {
      name: 'relay_'
    }
  ],

  methods: [
    {
      name: 'relay',
      code: function(sink, id) {
        if ( ! this.relay_ ) {
          this.relay_ = this.newRelay(sink, id);
        }

        return this.relay_;
      }
    },
    {
      name: 'newRelay',
      code: function(sink, id) {
        var objID = id;
        if ( objID && objID.id ) objID = objID.id;
        var model = { name: objID && this.config.getModelName(objID) };
        return {
          put: function(o) {
            sink && sink.put && this.put_.bind(this, sink)(o);
          }.bind(this),
          error: sink && sink.error && this.error_.bind(this, sink),
          remove: model && sink && sink.remove &&
              this.remove_.bind(this, model, sink)
        };
      }
    },
    {
      name: 'put',
      code: function(obj, opt_sink) {
        var delegateObj = obj.clone();
        if ( delegateObj.id ) delegateObj.id = this.config.dedecorateID(obj.id);
        this.delegate.put(delegateObj, this.newRelay(opt_sink));
      }
    },
    {
      name: 'remove',
      code: function(id, opt_sink) {
        this.delegate.remove(
            this.config.dedecorateID(id),
            this.newRelay(opt_sink, id));
      }
    },
    {
      name: 'find',
      code: function(id, sink) {
        this.delegate.find(
            this.config.dedecorateID(id),
            this.newRelay(sink, id));
      }
    },
    {
      name: 'listen',
      code: function(sink, options) {
        if ( ! this.daoListeners_.length && this.delegate ) {
          this.delegate.listen(this.relay(sink));
        }
        this.SUPER(sink, options);
      }
    },
    {
      name: 'unlisten',
      code: function(sink) {
        this.SUPER(sink);
        if ( ! this.daoListeners_.length && this.delegate ) {
          this.delegate.unlisten(this.relay());
        }
      }
    },
    {
      name: 'select',
      code: function(sink, options) {
        // TODO(braden): Handle queries for ID here.
        return this.delegate.select({
          put: this.put_.bind(this, sink),
          eof: sink && sink.eof && sink.eof.bind(sink)
        }, options);
      }
    },
    {
      name: 'removeAll',
      code: function(sink, options) {
        // TODO(braden): Handle queries for ID here. Since in removeAll it's
        // dangerous to ignore a query, removeAll is disabled.
        console.error('ModelIDDecoratorDAO does not implement removeAll');
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/dao/MultiDAO.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'MultiDAO',
  package: 'foam.navigator.dao',
  extendsModel: 'AbstractDAO',

  requires: [
    'EasyDAO',
    'foam.navigator.BrowserConfig',
    'foam.navigator.dao.ModelIDDecoratorDAO',
    'foam.navigator.dao.IDConfig'
  ],

  imports: [
    'console'
  ],

  properties: [
    {
      name: 'models',
      model_: 'StringArrayProperty',
      factory: function() { return []; }
    },
    {
      name: 'configDAO',
      model_: 'DAOProperty',
      documentation: multiline(function() {/*
        A DAO of objects that must each have o.dao (a DAO) and o.model (a
        model).
      */}),
      factory: function() {
        return this.EasyDAO.create({
          model: this.BrowserConfig,
          daoType: 'IDB',
          seqNo: true,
          cache: true
        });
      }
    },
    {
      name: 'daos',
      factory: function() { return {}; }
    },
    {
      name: 'idDecoratorConfig',
      factory: function() { return this.IDConfig.create(); }
    },
    {
      name: 'listeners_',
      model_: 'ArrayProperty',
      factory: function() { return []; }
    }
  ],

    methods: [
      {
        name: 'init',
        code: function() {
          this.SUPER();
          this.configDAO.pipe({
            put: function(config) {
              this.buildDAO(config);
            }.bind(this)
          });
        }
      },
      {
        name: 'put',
        code: function(obj, opt_sink) {
          var model = obj.model_;
          var name = model.package ?
              model.package + '.' + model.name : model.name;
          if ( ! this.daos[name] ) {
            var msg = 'Model: "' + name + '" unknown to MultiDAO';
            this.console.warn(msg);
            opt_sink && opt_sink.error(msg);
          } else {
            this.daos[name].put(obj, opt_sink);
          }
        }
      },
      {
        name: 'remove',
        code: function(id, opt_sink) {
          var modelName = this.idDecoratorConfig.getModelName(id);
          this.daos[modelName].remove(id, opt_sink);
        }
      },
      {
        name: 'removeAll',
        code: function(sink, options) {
          var proxySink = {
            remove: sink && sink.remove,
            error: sink && sink.error
          };
          var self = this;
          return apar.apply(null, this.models.map(function(modelName) {
            return self.daos[modelName].aseq(function(ret, dao) {
              dao.removeAll(proxySink, options)(ret);
            });
          })).aseq(function(ret) {
            sink && sink.eof && sink.eof();
            ret && ret(sink);
          });
        }
      },
      {
        name: 'find',
        code: function(id, sink) {
          var modelName = this.idDecoratorConfig.getModelName(id);
          if ( ! this.dao[modelName] ) {
            sink.error('Unknown model name prefix in ID: ' + id);
            return;
          }
          this.dao[modelName](function(dao) {
            dao.find(id, sink);
          });
        }
      },
      {
        name: 'select',
        todo: 'Need proper options support',
        code: function(sink, options) {
          sink = sink || [].sink;
          var proxySink = {
            put: function(o) {
              sink && sink.put && sink.put(o);
            },
            error: function() {
              sink && sink.error && sink.error.apply(this, arguments);
            }
          };
          var self = this;
          var future = afuture();

          var pars = [];
          this.models.forEach(function(modelName) {
            pars.push(function(ret) {
              self.daos[modelName].select(proxySink, options)(ret);
            });
          });
          apar.apply(null, pars)(function() {
            sink.eof && sink.eof();
            future.set(sink);
          });
          return future.get;
        }
      },
      {
        name: 'update',
        code: function(expr) {
          throw 'update() not supported on MultiDAO (yet)';
        }
      },
      {
        name: 'listen',
        code: function(sink) {
          this.models.forEach(function(modelName) {
            this.daos[modelName].listen(sink);
          }.bind(this));
          this.listeners_.push(sink);
        }
      },
      {
        name: 'pipe',
        code: function(sink) {
          this.models.forEach(function(modelName) {
            this.daos[modelName].pipe(sink);
          }.bind(this));
        }
      },
      {
        name: 'unlisten',
        code: function(sink) {
          this.models.forEach(function(modelName) {
            this.daos[modelName].unlisten(sink);
          }.bind(this));
          this.listeners_ = this.listeners_.filter(function(listener) {
            return listener !== sink;
          }.bind(this));
        }
      },
      {
        name: 'limit',
        todo: 'This is an alright approximation, but we can probably do better',
        code: function(count) {
          this.models.forEach(function(modelName) {
            this.daos[modelName].limit(count);
          }.bind(this));
        }
      },
      {
        name: 'buildDAO',
        code: function(config) {
          var model = config.model;
          var modelName = model.package ?
              model.package + '.' + model.name : model.name;
          var decoratedConfigDAO = this.ModelIDDecoratorDAO.create({
            config: this.idDecoratorConfig,
            delegate: config.dao
          });
          this.addListenersToDAO(decoratedConfigDAO);
          this.daos[modelName] = decoratedConfigDAO;
          this.models.push(modelName);
          return decoratedConfigDAO;
        }
      },
      {
        name: 'addListenersToDAO',
        code: function(dao) {
          this.listeners_.forEach(function(listener) {
            dao.listen(listener);
          }.bind(this));
        }
      }
    ]
  });

//third_party/javascript/foam/v0_1/js/foam/navigator/types/Audio.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Audio',
  package: 'foam.navigator.types',
  extendsModel: 'foam.navigator.BasicFOAMlet',

  requires: [
    'foam.navigator.types.AudioSource',
    'foam.navigator.views.AudioView'
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'name',
      dynamicValue: function() {
        return [
          this.title,
          this.creator,
          this.collection
        ].filter(function(o) { return o; }).join(' - ');
      },
      required: true
    },
    {
      name: 'iconURL',
      defaultValue: 'images/audio.png',
      view: 'ImageView',
      todo: 'tableFormatter: This should be the view\'s concern',
      tableFormatter: function(iconURL, self) {
        debugger;
        return '<img src="' + iconURL + '"></img>';
      }
    },
    {
      model_: 'StringProperty',
      name: 'title'
    },
    {
      model_: 'StringProperty',
      name: 'creator'
    },
    {
      model_: 'StringProperty',
      name: 'collection'
    },
    {
      name: 'audioData',
      label: 'Audio File',
      type: 'foam.navigator.types.AudioSource',
      preSet: function(old, nu) {
        if ( typeof nu === 'string' ) {
          return this.AudioSource.create({ src: nu });
        } else {
          return nu;
        }
      },
      view: 'foam.navigator.views.AudioView',
      todo: 'tableFormatter: This abuses view lifecycle',
      tableFormatter: function(audioData, self) {
        return self.AudioView.create({
          data: audioData
        }).toHTML();
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/types/AudioSource.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'AudioSource',
  package: 'foam.navigator.types',
  extendsModel: 'foam.navigator.BasicFOAMlet',

  constants: [
    {
      name: 'TYPES',
      value: {
        mp3: 'audio/mpeg',
        mpeg: 'audio/mpeg',
        ogg: 'audio/ogg',
        wav: 'audio/wav',
        m4a: 'audio/mpeg'
      }
    }
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'src',
      required: true
    },
    {
      model_: 'StringProperty',
      name: 'type',
      factory: function() {
        return this.TYPES[this.src.split('.').pop()] || 'audio/mpeg';
      },
      view: {
        factory_: 'ChoiceListView',
        choices: [
          'audio/mpeg',
          'audio/ogg',
          'audio/wav'
        ]
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/types/Issue.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Issue',
  package: 'foam.navigator.types',
  extendsModel: 'foam.navigator.BasicFOAMlet',

  properties: [
    {
      name: 'id'
    },
    {

      model_: 'StringEnumProperty',
      name: 'type',
      defaultValue: 'BUG',
      view: 'ChoiceView',
      choices: [
        ['BUG', 'Bug'],
        ['FEATURE_REQUEST', 'Feature Request'],
        ['CUSTOMER_ISSUE', 'Customer Issue'],
        ['INTERNAL_CLEANUP', 'Internal Cleanup'],
        ['PROCESS', 'Process']
      ]
    },
    {
      model_: 'StringEnumProperty',
      name: 'status',
      defaultValue: 'NEW',
      view: 'ChoiceView',
      choices: [
        ['NEW', 'New'],
        ['ASSIGNED', 'Assigned'],
        ['ACCEPTED', 'Accepted'],
        ['FIXED', 'Fixed'],
        ['VERIFIED', 'Verified'],
        ['NOT_REPRODUCIBLE', 'Not Reproducible'],
        ['INTENDED_BEHAVIOR', 'Working as Intended'],
        ['OBSOLETE', 'Obsolete'],
        ['INFEASIBLE', 'Infeasible'],
        ['DUPLICATE', 'Duplicate']
      ]
    },
    {
      model_: 'StringEnumProperty',
      name: 'priority',
      defaultValue: 'P2',
      view: 'ChoiceView',
      choices: ['P0', 'P1', 'P2', 'P3', 'P4']
    },
    {
      model_: 'StringEnumProperty',
      name: 'severity',
      defaultValue: 'S2',
      view: 'ChoiceView',
      choices: ['S0', 'S1', 'S2', 'S3', 'S4']
    },
    {
      model_: 'BooleanProperty',
      name: 'starred',
      defaultValue: false
    },
    {
      name: 'title'
    },
    {
      name: 'comment'
    },
    {
      model_: 'StringArrayProperty',
      name: 'cc',
      preSet: function(old, nu) {
        return nu || [];
      }
    },
    {
      name: 'assignee'
    },
    {
      name: 'reporter'
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/types/Mail.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Mail',
  package: 'foam.navigator.types',
  extendsModel: 'foam.navigator.WrappedFOAMlet'
});

//third_party/javascript/foam/v0_1/js/foam/navigator/types/Todo.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Todo',
  package: 'foam.navigator.types',
  extendsModel: 'foam.navigator.BasicFOAMlet',

  properties: [
    {
      model_: 'StringProperty',
      name: 'name',
      required: true
    },
    {
      name: 'iconURL',
      view: 'ImageView',
      defaultValueFn: function() {
        return this.done ? 'images/todo-checked.png' : 'images/todo-empty.png';
      }
    },
    {
      model_: 'IntProperty',
      name: 'priority',
      defaultValue: 3,
      view: {
        factory_: 'ChoiceView',
        choices: [1, 2, 3, 4, 5]
      }
    },
    {
      model_: 'DateProperty',
      name: 'dueDate',
      defaultValue: null
    },
    {
      model_: 'StringProperty',
      name: 'notes',
      view: 'TextAreaView'
    },
    {
      model_: 'BooleanProperty',
      name: 'done',
      defaultValue: false
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/AudioGSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'AudioGSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'foam.navigator.views.GSnippet',

  requires: [
    'foam.navigator.views.GSnippetMetadata',
    'foam.navigator.views.GSnippetMetadatum',
    'foam.navigator.views.AudioView',
    'foam.navigator.types.AudioSource'
  ],

  properties: [
    {
      name: 'title',
      defaultValueFn: function() {
        return this.data && this.data.title || 'Audio';
      }
    },
    {
      name: 'metadata',
      view: 'foam.navigator.views.GSnippetMetadata',
      defaultValueFn: function() {
        if ( ! this.data ) return [];
        var basicMetadata = this.data.labels.map(function(label) {
          return this.GSnippetMetadatum.create({ text: label });
        }.bind(this));
        var audioMetadata = [];
        var sources = this.AudioSource.isInstance(this.data.audioData) ?
            [this.data.audioData] :
            (this.data.audioData && this.data.audioData.sources || []);
        if ( sources )
          audioMetadata.push(this.GSnippetMetadatum.create({
            view: this.AudioView.create({
              data: this.data,
              defaultControls: false
            })
          }));
        var nameMap = {
          creator: 'Artist',
          collection: 'Album'
        };
        for ( var key in nameMap ) {
          if ( nameMap.hasOwnProperty(key) && this.data[key] )
            audioMetadata.push(this.GSnippetMetadatum.create({
              text: nameMap[key] + ': ' + this.data[key]
            }));
        }
        return audioMetadata.concat(basicMetadata);
      }
    },
    {
      name: 'snippet',
      defaultValueFn: function() {
        return this.data && this.data.name || 'Musical selection';
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/AudioView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'AudioView',
  package: 'foam.navigator.views',
  extendsModel: 'DetailView',

  imports: [
    'PropertyView',
    'document'
  ],

  properties: [
    {
      name: 'data',
      required: true
    },
    {
      model_: 'BooleanProperty',
      name: 'defaultControls',
      defaultValue: true
    },
    {
      name: 'sourceCollection',
      dynamicValue: function() {
        return this.data && [this.data.audioData];
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'playing',
      defaultValue: false
    },
    {
      model_: 'StringProperty',
      name: 'playImgURL',
      defaultValue: 'images/play.png'
    },
    {
      model_: 'StringProperty',
      name: 'pauseImgURL',
      defaultValue: 'images/pause.png'
    }
  ],

  methods: [
    {
      name: 'initHTML',
      code: function() {
        var play = this.playElement();
        var pause = this.pauseElement();
        if ( play && pause && ! this.defaultControls ) {
          play.addEventListener('click', this.onPlayPause);
          pause.addEventListener('click', this.onPlayPause);
        }
      }
    },
    {
      name: 'audioElement',
      code: function() {
        return this.document.getElementById(this.id + '-audio');
      }
    },
    {
      name: 'playElement',
      code: function() {
        return this.document.getElementById(this.id + '-play');
      }
    },
    {
      name: 'pauseElement',
      code: function() {
        return this.document.getElementById(this.id + '-pause');
      }
    }
  ],

  listeners: [
    {
      name: 'onPlayPause',
      code: function() {
        var audio = this.audioElement();
        var play = this.playElement();
        var pause = this.pauseElement();
        if ( ! play || ! pause || ! audio ) return;
        if ( this.playing ) {
          pause.className = 'hide';
          play.className = '';
          audio.pause();
          this.playing = false;
        } else {
          play.className = 'hide';
          pause.className = '';
          audio.play();
          this.playing = true;
        }
      }
    }
  ],

  templates: [
    function toHTML() {/*
      <audio id="{{{this.id}}}-audio" preload="none" <% if ( this.defaultControls ) { %>controls<% } %> >
      <% for ( var i = 0; i < this.sourceCollection.length; ++i ) {
        var src = this.sourceCollection[i]; %>
        <source src="{{{src.src}}}" type="{{{src.type}}}"></source>
      <% } %>
      </audio>
      <% if ( ! this.defaultControls ) { %>
        <img id="{{{this.id}}}-play" src="{{{this.playImgURL}}}" class=""></img>
        <img id="{{{this.id}}}-pause" src="{{{this.pauseImgURL}}}" class="hide"></img>
      <% } %>
    */},
    function CSS() {/*
      img.hide { display: none; }

    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/ContactGSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ContactGSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'foam.navigator.views.GSnippet',
  properties: [
    {
      name: 'title',
      lazyFactory: function() { return this.data.title || this.data.email; }
    },
    {
      name: 'snippet',
      defaultValue: '',
    },
    {
      name: 'url',
      lazyFactory: function() {
        return 'https://www.google.com/contacts/u/0/?cplus=0#contact/' + this.data.id.split(':')[1];
      }
    },
    {
      name: 'metadata',
      lazyFactory: function() {
        return [
          this.GSnippetMetadatum.create({ label: 'EMail', text: this.data.email })
        ];
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/CreateView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'CreateView',
  package: 'foam.navigator.views',
  extendsModel: 'View',
  requires: [
    'DetailView',
  ],
  imports: [
    'dao',
    'overlay'
  ],

  properties: [
    {
      name: 'model',
      required: true
    },
    {
      name: 'label',
      defaultValueFn: function() { return 'Create a new ' + this.model.label; }
    },
    {
      name: 'innerView',
      factory: function() {
        return this.DetailView.create({
          model: this.model,
          data: this.model.create()
        });
      }
    }
  ],

  actions: [
    {
      name: 'done',
      label: 'Create',
      // TODO(braden): Make this toggle enabled based on required fields and
      // form validation.
      action: function() {
        this.dao.put(this.innerView.data, {
          put: function(x) {
            this.overlay.close();
          }.bind(this)
        });
      }
    }
  ],

  templates: [
    function toInnerHTML() {/*
      %%innerView
      $$done
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/EMailGSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'EMailGSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'foam.navigator.views.GSnippet',

  properties: [
    {
      name: 'title',
      lazyFactory: function() {
        return this.data.subject || this.data.snippet || this.data.from;
      }
    },
    {
      name: 'snippet',
      lazyFactory: function() {
        return this.data.snippet;
      }
    },
    {
      name: 'url',
      lazyFactory: function() {
        return 'https://mail.google.com/mail/u/0#inbox/' + this.data.id.split(':')[1]
      }
    },
    {
      name: 'metadata',
      lazyFactory: function() {
        return [
          this.GSnippetMetadatum.create({ label: 'From', text: this.data.from }),
          this.GSnippetMetadatum.create({ label: 'Date', text: this.data.timestamp.toString() }),
          this.GSnippetMetadatum.create({ label: 'Labels', text: this.data.labels.join(',') })
        ];
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/GSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'GSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'DetailView',

  requires: [
    'foam.navigator.views.GSnippetMetadata',
    'foam.navigator.views.GSnippetMetadatum'
  ],

  properties: [
    {
      name: 'url',
      defaultValue: '#'
    },
    {
      name: 'title',
      defaultValue: 'Default Text for a Title that May Happen to be Very Long'
    },
    {
      name: 'metadata',
      view: 'foam.navigator.views.GSnippetMetadata',
      defaultValueFn: function() {
        return [
          this.GSnippetMetadatum.create({ text: 'snippet' }),
          this.GSnippetMetadatum.create({
            text: 'FOAM Framework',
            url: 'https://github.com/foam-framework/foam' })
        ];
      }
    },
    {
      name: 'snippet',
      defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat'
    }
  ],

  templates: [
    function toHTML() {/*
      <div id="{{{this.id}}}" class="gsnippet">
        <span class="gs-type">
          <% if ( this.data.iconURL ) { %>
            <img src="{{{this.data.iconURL}}}">
          <% } else { %>
            <span>{{this.data.model_.label}}</span>
          <% } %>
        </span>
        <div class="gs-heading">
          <h3 class="gs-header">
            <a href="{{{this.url}}}">{{{this.title}}}</a>
          </h3>
        </div>
        $$metadata
        <div class="gs-snippet">
          {{{this.snippet}}}
        </div>
      </div>
    */},
    function CSS() {/*
      div.gsnippet {
        position: relative;
        margin-bottom: 25px;
      }
      div.gsnippet a {
        text-decoration: none;
      }
      div.gs-heading {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        align-content: center;
      }
      h3.gs-header {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 16px;
        font-weight: normal;
        margin: 0;
        padding: 0;
      }
      div.gs-header a:link {
        cursor: pointer;
        color: #1a0dab;
      }
      .gs-type {
        align-items: flex-start;
        color: #999;
        display:flex;
        float: left;
        justify-content: flex-end;
        margin-left: -80px;
        width: 70px;
        padding: 0px 5px 0px 0px;
      }
      h3.gs-header a:visited {
        color: #609;
      }
      div.gs-snippet {
        font-size: small;
        line-height: 1.4;
        word-wrap: break-word;
        font-weight: normal;
      }
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/GSnippetMetadata.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'GSnippetMetadata',
  package: 'foam.navigator.views',
  extendsModel: 'View',

  properties: [
    {
      name: 'data',
      factory: function() { return []; }
    }
  ],

  templates: [
    function toHTML() {/*
      <div class="gs-metadata">
        <% for ( var i = 0; i < this.data.length; ++i ) { %>
          <div class="gs-metadatum">
            <% if ( this.data[i].label ) { %>
              <span class="gs-label">{{ this.data[i].label }}</span>
            <% } %>
            <span>
              <% if ( this.data[i].view ) { %>
                {{{this.data[i].view}}}
              <% } else { %>
                <% if ( this.data[i].url ) { %><a href="{{{this.data[i].url}}}"><% } %>
                <% if ( this.data[i].text ) { %>{{{this.data[i].text}}}<% } %>
                <% if ( this.data[i].url ) { %></a><% } %>
              <% } %>
            </span>
          </div>
        <% } %>
      </div>
    */},
    function CSS() {/*
      div.gs-metadata {
        white-space: nowrap;
        line-height: 16px;
        display: block;
        font-weight: normal;
      }
      div.gs-metadata span {
        font-size: 14px;
        font-style: normal;
        color: #006621;
        white-space: nowrap;
        line-height: 16px;
        padding: 0px 4px 0px 0px;
      }
      div.gs-metadata span.gs-label {
        font-weight: bold;
      }
      div.gs-metadata a, div.gs-metadata a:link, div.gs-metadata a:visited {
        font-weight: bold;
        color: #006621;
      }
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/GSnippetMetadatum.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'GSnippetMetadatum',
  package: 'foam.navigator.views',
  documentation: function() {/*
    Specify $$DOC{.view} as a view object or $$DOC{.text} (and optionally
    $$DOC{.url}).
  */},

  properties: [
    {
      name: 'text',
      model_: 'StringProperty'
    },
    {
      name: 'url',
      model_: 'StringProperty'
    },
    {
      name: 'view',
      defaultValue: ''
    },
    {
      name: 'label',
      defaultValue: ''
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/IssueGSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'IssueGSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'foam.navigator.views.GSnippet',

  properties: [
    {
      name: 'title',
      lazyFactory: function() {
        return this.data && this.data.title;
      }
    },
    {
      name: 'snippet',
      lazyFactory: function() {
        return (this.data && this.data.comment && this.data.comment.substring(0, 200) || '');
      }
    },
    {
      name: 'url',
      lazyFactory: function() {
        return 'https://b2.corp.google.com/issues/' + this.data.id.split(':')[1];
      }
    },
    {
      name: 'metadata',
      lazyFactory: function() {
        return [
          this.GSnippetMetadatum.create({
            label: 'Status',
            text: this.data.status
          }),
          this.GSnippetMetadatum.create({
            label: 'Reporter',
            text: this.data.reporter
          }),
          this.GSnippetMetadatum.create({
            label: 'Assignee',
            text: this.data.assignee
          }),
          this.GSnippetMetadatum.create({
            label: 'CCs',
            text: this.data.cc.join(', ')
          })
        ];
      }
    }
  ],
  
  templates: [
    function toHTML() {/*
      <div id="{{{this.id}}}" class="gsnippet">
        <span class="gs-type">
          <img src="images/bug.png">
        </span>
        <div class="gs-heading">
          <h3 class="gs-header">
            <a href="{{{this.url}}}">{{{this.title}}}</a>
          </h3>
        </div>
        $$metadata
        <div class="gs-snippet">
          {{{this.snippet}}}
        </div>
      </div>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/MultiView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'MultiView',
  package: 'foam.navigator.views',
  extendsModel: 'View',

  requires: [
    'DetailView'
  ],

  properties: [
    {
      name: 'data',
      postSet: function(old, nu) {
        if ( old.model_ === nu.model_ ) return;
        if ( old ) Events.unlink(this.data$, this.delegate.data$);
        this.delegate = this.getDelegate();
      }
    },
    {
      name: 'viewFactory',
      model_: 'ViewFactoryProperty',
      defaultValueFn: function() { return this.DetailView; }
    },
    {
      name: 'delegate',
      factory: function() {
        return this.getDelegate();
      }
    }
  ],

  methods: [
    {
      name: 'toHTML',
      code: function() {
        if ( ! this.delegate ) return '';
        return this.delegate.toHTML();
      }
    },
    {
      name: 'initHTML',
      code: function() { this.delegate && this.delegate.initHTML(); }
    },
    {
      name: 'destroy',
      code: function() { this.delegate && this.delegate.destroy(); }
    },
    {
      name: 'getDelegate',
      code: function() {
        if ( ! this.data ) return '';
        return this.viewFactory({
          model: this.data.model_,
          data$: this.data$
        }, this.X);
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/OverlayView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'OverlayView',
  package: 'foam.navigator.views',
  extendsModel: 'View',
  properties: [
    {
      name: 'delegate'
    },
    {
      name: 'title',
      defaultValueFn: function() {
        return this.delegate && (this.delegate.label ||
          (this.delegate.model_ && this.delegate.model_.label));
      }
    },
    {
      name: 'opened',
      defaultValue: false
    },
    {
      name: 'tagName',
      defaultValue: 'div'
    },
    {
      name: 'className',
      defaultValue: 'overlay'
    }
  ],

  listeners: [
    {
      name: 'open',
      documentation: 'Re-renders the overlay and makes sure it is open. Safe to call multiple times.',
      code: function(opt_view) {
        if (opt_view) this.delegate = opt_view;
        this.opened = true;
        this.updateHTML();
        this.$.style.display = 'block';
      }
    },
    {
      name: 'close',
      code: function() {
        this.opened = false;
        this.$.style.display = 'none';
      }
    }
  ],

  templates: [
    function CSS() {/*
      .overlay {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .overlay-inner {
        display: flex;
        align-items: center;
        justify-content: center;

        position: relative;
        height: 100%;
        width: 100%;
      }
      .overlay-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #000;
        opacity: 0.5;
        z-index: 5;
      }
      .overlay-container {
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        z-index: 10;
      }
      .overlay-container .title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 12px;
      }
    */},
    function toInnerHTML() {/*
      <div class="overlay-inner">
        <div id="<%= this.id %>-background" class="overlay-background"></div>
        <div class="overlay-container">
          <div class="title">%%title</div>
          <%= this.delegate %>
        </div>
      </div>
      <% this.on('click', this.close, this.id + '-background'); %>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/PhoneGSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'PhoneGSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'foam.navigator.views.GSnippet',

  requires: [
    'foam.navigator.views.GSnippetMetadata',
    'foam.navigator.views.GSnippetMetadatum'
  ],

  properties: [
    {
      name: 'title',
      lazyFactory: function() {
        return this.data && this.data.name || 'Phone';
      }
    },
    {
      name: 'url',
      lazyFactory: function() {
        return '/apps/phonecat/Cat.html#' + this.data.id.split(':')[1];
      }
    },
    {
      name: 'metadata',
      view: 'foam.navigator.views.GSnippetMetadata',
      lazyFactory: function() {
        return [
          this.GSnippetMetadatum.create({ label: 'CPU', text: this.data.hardware.cpu }),
          this.GSnippetMetadatum.create({ label: 'Screen', text: this.data.display.screenSize}),
          this.GSnippetMetadatum.create({ label: 'OS', text: this.data.android.os })
        ];
      }
    },
    {
      name: 'snippet',
      lazyFactory: function() {
        return this.data.description;
      }
    }
  ],
  
  templates: [
    function toHTML() {/*
      <div id="{{{this.id}}}" class="gsnippet">
        <span class="gs-type">
          <% if ( this.data.imageUrl ) { %>
            <img src="/apps/phonecat/{{{this.data.imageUrl}}}" width=40 height=40 />
          <% } else { %>
            <span>{{this.data.model_.label}}</span>
          <% } %>
        </span>
        <div class="gs-heading">
          <h3 class="gs-header">
            <a href="{{{this.url}}}">{{{this.title}}}</a>
          </h3>
        </div>
        $$metadata
        <div class="gs-snippet">
          {{{this.snippet}}}
        </div>
      </div>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/SelectTypeView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'SelectTypeView',
  package: 'foam.navigator.views',
  extendsModel: 'DAOListView',
  label: 'Create what type?',
  requires: [
    'foam.navigator.views.CreateView',
    'foam.navigator.views.TypeCitationView',
  ],
  imports: ['overlay'],
  exports: ['selection$'],
  properties: [
    {
      name: 'rowView',
      defaultValue: function(args, opt_X) {
        return this.TypeCitationView.create(args, opt_X);
      }
    },
    {
      name: 'selection',
      postSet: function(old, nu) {
        if (nu && SimpleValue.isInstance(nu)) nu = nu.get();
        if (nu) {
          this.overlay.open(this.CreateView.create({
            model: nu
          }));
        }
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/TodoGSnippet.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'TodoGSnippet',
  package: 'foam.navigator.views',
  extendsModel: 'foam.navigator.views.GSnippet',

  requires: [
    'foam.navigator.views.GSnippetMetadata',
    'foam.navigator.views.GSnippetMetadatum'
  ],

  properties: [
    {
      name: 'title',
      defaultValueFn: function() {
        return this.data && this.data.name || 'Todo';
      }
    },
    {
      name: 'metadata',
      view: 'foam.navigator.views.GSnippetMetadata',
      defaultValueFn: function() {
        if ( ! this.data ) return [];
        var basicMetadata = this.data.labels.map(function(label) {
          return this.GSnippetMetadatum.create({ text: label });
        }.bind(this));
        var todoMetadata = [
          this.GSnippetMetadatum.create({ text: 'Priority: ' + this.data.priority})
        ];
        if ( this.data.dueDate )
          todoMetadata = todoMetadata.concat([
            this.GSnippetMetadatum.create({ text: 'Due date: ' + this.data.dueDate })
          ]);
        return todoMetadata.concat(basicMetadata);
      }
    },
    {
      name: 'snippet',
      defaultValueFn: function() {
        return this.data && (
            this.data.name + (this.data.notes ? (': ' + this.data.notes) : '')
            ) || '';
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/TypeCitationView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'TypeCitationView',
  package: 'foam.navigator.views',
  extendsModel: 'DetailView',
  properties: [
    {
      name: 'className',
      defaultValue: 'type-citation-view'
    }
  ],
  templates: [
    function CSS() {/*
      .type-citation-view {
        align-items: center;
        border-bottom: 1px solid black;
        display: flex;
        height: 40px;
        line-height: 40px;
        min-width: 300px;
        font-size: 18px;
      }
      .type-citation-view span {
        flex-grow: 1;
      }
      .type-citation-view .arrow {
        flex-grow: 0;
        flex-shrink: 0;
      }
    */},
    function toHTML() {/*
      <div id="<%= this.id %>" <%= this.cssClassAttr() %>>
        $$name{ mode: 'read-only' }
        <span class="arrow">&gt;</span>
      </div>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/navigator/views/WrappedFOAMletCreateView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'WrappedFOAMletCreateView',
  package: 'foam.navigator.views',
  extendsModel: 'CreateView',

  requires: [ 'foam.navigator.WrappedFOAMlet' ],

  documentation: function() {/* Replaces CreateView to enable to creation of a
    FOAMlet-wrapped object.
  */},

  properties: [
    {
      name: 'label',
      defaultValueFn: function() {
        if ( this.model && this.model.model && this.model.model.label ) {
          return 'Create a new ' + this.model.model.label;
        } else {
          console.warn("Can't find WrappedFOAMlet model name!");
          return 'Create a new ' + this.model_.label + '(name error!)';
        }
      }
    },
    {
      name: 'innerView',
      factory: function() {
        if ( this.model && this.model.model && this.model.model ) {
          return this.DetailView.create({
              model: this.model.model,
              data: this.model.model.create()
          });
        } else {
          console.warn("Can't find WrappedFOAMlet model.model!", this);
        }
      }
    }
  ],

  actions: [
    {
      name: 'done',
      label: 'Create',
      // TODO(braden): Make this toggle enabled based on required fields and
      // form validation.
      action: function() {
        this.dao.put(
          this.model.create({ data: this.innerView.data }),
          {
            put: function(x) {
              this.overlay.close();
            }.bind(this)
          }
        );
      }
    }
  ],

  templates: [
    function toInnerHTML() {/*
      %%innerView
      $$done
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/animated/ImageView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.animated',
  name: 'ImageView',

  extendsModel: 'View',

  properties: [
    {
      name: 'data',
      postSet: function() { this.onDataChange(); }
    },
    {
      name: 'displayWidth',
      postSet: function(_, newValue) {
        if ( this.$ ) {
          this.$.style.width = newValue;
        }
      }
    },
    {
      name: 'displayHeight',
      postSet: function(_, newValue) {
        if ( this.$ ) {
          this.$.style.height = newValue;
        }
      }
    },
    {
      name: 'className',
      defaultValue: 'aImageView'
    }
  ],

  listeners: [
    {
      name: 'onDataChange',
      code: function() {
        if ( ! this.$ ) return;
        var $ = this.$;
        var height = $.querySelector('img').height;
        var newImage = '<img ' + this.cssClassAttr() + ' src="' + this.data + '" style="position: absolute;transition:top .4s;top:' + height + '">';
        $.insertAdjacentHTML('beforeend', newImage);
        var vs = $.querySelectorAll('img');
        if ( vs.length == 3 ) vs[0].remove();
        setTimeout(function() {
          vs[vs.length-2].style.top = '-' + height +'px';
          vs[vs.length-1].style.top = 0;
        }, 1);
      }
    }
  ],

  methods: {
    initHTML: function() {
      this.SUPER();

      this.displayHeight = this.displayHeight;
      this.displayWidth = this.displayWidth;
    },
    toHTML: function() {
      return '<span id="' + this.id + '"><img ' + this.cssClassAttr() + ' src="' + this.data + '" style="position: absolute;transition:top .4s;top:0"></span>' ;
    }
  }
});

//third_party/javascript/foam/v0_1/js/foam/ui/animated/Label.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.animated',
  name: 'Label',

  extendsModel: 'View',

  imports: [ 'window' ],

  properties: [
    {
      name: 'data'
    },
    {
      name: 'className',
      defaultValue: 'alabel'
    },
    {
      name: 'left',
      postSet: function(_, l) {
        this.$.querySelector('.f1').style.left = l;
      }
    }
  ],

  methods: {
    toInnerHTML: function() {
      var tabIndex  = this.tabIndex ? ' tabindex="' + this.tabIndex + '"' : '';
      return '<div' + tabIndex + ' class="f1"></div><div class="f2"></div>';
    },
    initHTML: function() {
      this.data$.addListener(this.onDataChange);
      this.window.addEventListener('resize', this.onResize);
    }
  },

  templates: [
    function CSS() {/*
      .f1 {
        position: absolute;
        white-space: nowrap;
      }
      .f1.animated {
        transition: left .4s;
      }
      .f2 {
        display: inline;
        float: right;
        visibility: hidden;
        white-space: nowrap;
      }
    */}
  ],

  listeners: [
    {
      name: 'onDataChange',
//      isFramed: true, // interferes with CSS animation
      code: function(_, _, oldValue, newValue) {
        if ( ! this.$ ) return;
        var f1$ = this.$.querySelector('.f1');
        var f2$ = this.$.querySelector('.f2');

        var data = this.data || '&nbsp;';
        f1$.innerHTML = data;
        f2$.innerHTML = data;

//        f1$.style.top  = f2$.offsetTop;
        f1$.style.left = f2$.offsetLeft;
        // Don't animate to the empty string
        DOM.setClass(this.$.querySelector('.f1'), 'animated', this.data.length);
      }
    },
    {
      name: 'onResize',
      isFramed: true,
      code: function() {
        if ( ! this.$ ) return;
        DOM.setClass(this.$.querySelector('.f1'), 'animated', false);
        this.onDataChange();
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/layout/ResponsiveView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.layout',
  name: 'ResponsiveView',
  extendsModel: 'View',
  requires: [
    'foam.ui.layout.ResponsiveViewOption'
  ],
  imports: ['window'],
  properties: [
    {
      model_: 'ArrayProperty',
      subType: 'foam.ui.layout.ResponsiveViewOption',
      name: 'options',
      preSet: function(_, v) {
        return v.slice().sort(toCompare(this.ResponsiveViewOption.MIN_WIDTH));
      }
    },
    {
      name: 'current',
      type: 'foam.ui.layout.ResponsiveViewOption',
      postSet: function(old, v) {
        if ( old !== v ) this.updateHTML();
      }
    },
    {
      name: 'tagName',
      defaultValue: 'div'
    }
  ],
  methods: {
    initHTML: function() {
      this.SUPER();
      this.window.addEventListener('resize', this.onResize);
      this.onResize_();
    },
    destory: function() {
      this.window.removeEventListener('resize', this.onResize);
    },
    onResize_: function() {
      if (!this.$) return;

      var width = this.$.clientWidth;

      for (var i = 0; i < this.options.length; i++) {
        var option = this.options[i];
        if ( option.minWidth > width ) break;
      }
      i = Math.max(i - 1, 0);

      this.current = this.options[i];
    }
  },
  listeners: [
    {
      name: 'onResize',
      isMerged: 100,
      code: function() {
        this.onResize_();
      }
    }
  ],
  templates: [
    function toInnerHTML() {/*<%= this.current ? this.current.controller() : '' %>*/}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/layout/ResponsiveViewOption.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.layout',
  name: 'ResponsiveViewOption',
  properties: [
    { model_: 'ViewFactoryProperty', name: 'controller' },
    { model_: 'IntProperty', name: 'minWidth' }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/md/Flare.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.md',
  name: 'Flare',

  requires: [ 'foam.graphics.Circle' ],

  properties: [
    'color',
    'element',
    {
      name: 'startX',
      defaultValue: 1
    },
    {
      name: 'startY',
      defaultValue: 1
    }
  ],

  listeners: [
    {
      name: 'fire',
      code: function() {
        var w = this.element.clientWidth;
        var h = this.element.clientHeight;
        var c = this.Circle.create({
          r: 0,
          startAngle: Math.PI/2,
          endAngle: Math.PI,
          width: w,
          height: h,
          x: this.startX * w,
          y: this.startY * h,
          color: this.color
        });
        var view = c.toView_();
        var div = document.createElement('div');
        var dStyle = div.style;
        dStyle.position = 'fixed';
        dStyle.left = 0;
        dStyle.top = 0;
        dStyle.zIndex = 101;

        var id = View.getPrototype().nextID();
        div.id = id;
        div.innerHTML = view.toHTML();
        this.element.appendChild(div);
        view.initHTML();

        Movement.compile([
          [400, function() { c.r = 1.25 * Math.sqrt(w*w + h*h); }],
          [200, function() { c.alpha = 0; }],
          function() { div.remove(); }
        ])();

        c.r$.addListener(EventService.framed(view.paint.bind(view)));
        c.alpha$.addListener(EventService.framed(view.paint.bind(view)));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/md/ResponsiveAppControllerView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.md',
  name: 'ResponsiveAppControllerView',
  extendsModel: 'foam.ui.layout.ResponsiveView',

  requires: [
    'foam.ui.layout.ResponsiveViewOption',
    'foam.ui.md.TwoPane',
    'DetailView'
  ],

  properties: [
    {
      name: 'options',
      factory: function() {
        return [
          this.ResponsiveViewOption.create({
            controller: 'DetailView',
            minWidth: 0
          }),
          this.ResponsiveViewOption.create({
            controller: 'foam.ui.md.TwoPane',
            minWidth: 600
          })          
        ];
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/md/TwoPane.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.ui.md',
  name: 'TwoPane',
  requires: [
    'DOMPanel'
  ],
  extendsModel: 'DetailView',
  properties: [
    { model_: 'ModelProperty', name: 'model', defaultValue: 'AppController' }
  ],
  templates: [
    function CSS() {/*
      .panes {
      display: flex;
      }
      .right-pane {
        flex-grow: 1;
      }
      .left-pane {
        display: flex;
        flex-direction: column;
        width: 300px;
      }
    */},
    function toHTML() {/*
    <div id="<%= this.setClass('searchMode', function() { return self.data.searchMode; }, this.id) %>"  class="mdui-app-controller">
       <div class="header">
         <span class="default">
           $$name{mode: 'read-only', className: 'name'}
           <% if ( this.data.refreshAction ) { out(this.createActionView(this.data.refreshAction, { data: this.data })); } %>
           <% if ( this.data.spinner ) { %>
             <span class="mdui-app-controller-spinner">
               <%= this.data.spinner %>
             </span>
           <% } %>
           $$enterSearchMode %%data.sortOrderView
         </span>
         <span class="search">
           $$leaveSearchMode{className: 'backButton'} $$q
         </span>
       </div>
       <div class="panes">
         <%= this.DOMPanel.create({ className: 'left-pane', view: this.data.menuFactory() }) %>
         <div class="right-pane">
           %%data.filteredDAOView
           <% if ( this.data.createAction ) out(this.createActionView(this.data.createAction, { data: this.data, className: 'createButton', color: 'white', font: '30px Roboto Arial', alpha: 1, width: 44, height: 44, radius: 22, background: '#e51c23'})); %>
         </div>
       </div>
    </div>
    <%
      this.addInitializer(function() {
        if ( self.filterChoices ) {
          var v = self.data.filteredDAOView;
          v.index$.addListener(function() {
            self.qView.$.placeholder = "Search " + v.views[v.index].label.toLowerCase();
          });
        }
        self.data.searchMode$.addListener(EventService.merged(function() {
          self.qView.$.focus();
        }, 100));
      });

      this.on('touchstart', function(){ console.log('blurring'); self.qView.$.blur(); }, this.data.filteredDAOView.id);
      this.on('click', function(){ console.log('focusing'); self.qView.$.focus(); }, this.qView.id);
    %>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/ActionButton.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ActionButton',
  package: 'foam.ui.polymer',

  extendsModel: 'ActionButton',
  traits: [
    'foam.ui.polymer.View'
  ],
  requires: ['Action'],
  imports: ['warn'],

  properties: [
    {
      type: 'Action',
      name: 'action',
      factory: function() {
        return this.Action.create({
          action: function() {
            this.warn('Polymer button: action not set:', this);
            }.bind(this)
        });
      }
    },
    {
      name: 'className',
      defaultValue: ''
    },
    {
      name: 'tagName',
      defaultValue: 'paper-button'
    },
    {
      name: 'iconUrl',
      defaultValue: false
    },
    {
      model_: 'BooleanProperty',
      name: 'raised',
      defaultValue: false,
      postSet: function(prev, next) {
        this.updateAttribute('raised', prev, next);
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'recenteringTouch',
      defaultValue: false,
      postSet: function(prev, next) {
        this.updateAttribute('recenteringTouch', prev, next);
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'fill',
      defaultValue: true,
      postSet: function(prev, next) {
        this.updateAttribute('fill', prev, next);
      }
    }
  ],

  constants: {
    HREF: '/bower_components/paper-button/paper-button.html',
    POLYMER_PROPERTIES: [
      'raised',
      'recenteringTouch',
      'fill'
    ]
  },

  templates: [
    function CSS() {/*
      paper-button { display: none; }
      paper-button.actionButton { display: none; }
      paper-button.available { display: inline-block; }
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/Tooltip.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Tooltip',
  package: 'foam.ui.polymer',

  extendsModel: 'foam.ui.polymer.View',
  imports: ['document'],

  todo: function() {/*
    (markdittmer): We should probably inherit from Tooltip and implement
    open/close/destroy, but Polymer tooltips prefer to animate themselves.
  */},

  properties: [
    {
      model_: 'StringProperty',
      name: 'text',
      help: 'Help text to be shown in tooltip.',
      postSet: function() {
        this.updateContents();
      }
    },
    {
      model_: 'StringProperty',
      name: 'html',
      help: 'Rich (HTML) help contents. Overrides "text" property.',
      postSet: function() { this.updateContents(); }
    },
    {
      name: 'target',
      help: 'Target element to provide tooltip for.',
      postSet: function(_, next) { this.attach(next); }
    },
    {
      model_: 'StringProperty',
      name: 'tagName',
      defaultValue: 'core-tooltip'
    },
    {
      name: 'tooltip',
      documentation: function() {/*
        HTML element encapsulating the tooltip'd content and the tooltip.
      */},
      postSet: function(prev, next) { this.detach(); this.attach(this.target); }
    },
    {
      name: 'tipContents',
      documentation: function() {/*
        HTML element encapsulating the tooltip (rich) text.
      */},
      defaultValue: null
    },
    {
      name: 'attached',
      documentation: function() {/*
        Indicator variable for whether tooltip has been attached to the
        tooltip'd content.
      */},
      defaultValue: false
    },
    {
      model_: 'BooleanProperty',
      name: 'noarrow',
      documentation: function() {/*
        Polymer attribute: noarrow.
      */},
      defaultValue: false,
      postSet: function(prev, next) {
        this.updateAttribute('noarrow', prev, next);
      }
    },
    {
      name: 'position',
      documentation: function() {/*
        Polymer attribute: position.
      */},
      defaultValue: 'bottom',
      preSet: function(prev, next) {
        if ( this.POSITIONS.some(function(pos) { return pos === next; }) ) {
          return next;
        } else {
          return prev;
        }
      },
      postSet: function(prev, next) {
        this.updateAttribute('bottom', prev, next);
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'show',
      documentation: function() {/*
        Polymer attribute: show.
      */},
      defaultValue: false,
      postSet: function(prev, next) {
        this.updateAttribute('show', prev, next);
      }
    },
    {
      name: 'tipAttribute',
      documentation: function() {/*
        Polymer attribute: tipAttribute.
      */},
      todo: function() {/*
        (markdittmer): This isn't working with non-default values
      */},
      defaultValue: 'tip',
      postSet: function(prev, next) {
        this.updateAttribute('tipAttribute', prev, next);
      }
    }
  ],

  constants: {
    HREF: '/bower_components/core-tooltip/core-tooltip.html',
    POSITIONS: ['top', 'bottom', 'left', 'right'],
    POLYMER_PROPERTIES: [
      'noarrow',
      'position',
      'bottom',
      'show',
      'tipAttribute'
    ]
  },

  methods: [
    { name: 'open', code: function() {} },
    { name: 'close', code: function() {} },
    { name: 'destroy', code: function() {} },
    {
      name: 'init',
      code: function() {
        var rtn = this.SUPER();
        this.tooltip = this.document.createElement(this.tagName);
        this.tooltip.setAttribute('id', this.id);
        this.updateProperties();
        return rtn;
      }
    },
    {
      name: 'setContents',
      documentation: function() {/*
        Set the contents of the tooltip (rich) text in the view.
      */},
      code: function() {
        if ( this.html ) this.tipContents.innerHTML   = this.html;
        else             this.tipContents.textContent = this.text;
      }
    },
    {
      name: 'updateContents',
      documentation: function() {/*
        Update the contents of the tooltip (rich) text in the view. Add or
        remove main tooltip HTML when switching from/to the empty string.
      */},
      code: function() {
        if ( this.html || this.text ) {
          if ( ! this.attached ) this.attach();
          else                   this.setContents();
        } else if ( this.attached ) {
          this.detach();
        }
      }
    },
    {
      name: 'attach',
      documentation: function() {/*
       The Polymer tooltip element wraps around the element for which it
       provides help. As such, attaching entails juggling the main content
       and the new tooltip element within the main content's parent's DOM
       sub-tree.
     */},
      code: function(elem) {
        if ( ! ( ( this.text || this.html ) && this.tooltip ) ||
             this.attached ) return;

        this.tooltip.setAttribute('id', this.id);

        var parent = elem.parentNode;
        parent.insertBefore(this.tooltip, elem);
        parent.removeChild(elem);

        this.tooltip.insertBefore(elem, this.tooltip.firstChild);

        this.tipContents = this.document.createElement('div');
        this.tipContents.setAttribute(this.tipAttribute, '');
        this.tooltip.appendChild(this.tipContents);
        this.setContents();

        this.attached = true;
      }
    },
    {
      name: 'detach',
      documentation: function() {/*
       The Polymer tooltip element wraps around the element for which it
       provides help. As such, detaching entails juggling the main content
       and the new tooltip element within the main tooltip's parent's DOM
       sub-tree.
     */},
      todo: function() {/*
        (markdittmer): Use of children below will skip text that is not wrapped
        in a node.
      */},
      code: function(prevTooltip) {
        if ( ! this.attached ) return;

        if ( this.tipContents ) {
          prevTooltip.removeChild(this.tipContents);
          this.tipContents = null;
        }

        var parent = prevTooltip.parentNode;
        var newHTML = prevTooltip.innerHTML;
        for (var i = 0; i < prevTooltip.children.length; ++i) {
          var child = prevTooltip.children[i];
          prevTooltip.removeChild(child);
          parent.insertBefore(child, prevTooltip);
        }
        parent.removeChild(prevTooltip);
        prevTooltip.setAttribute('id', '');

        this.attached = false;
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/View.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'View',
  package: 'foam.ui.polymer',

  extendsModel: 'View',

  properties: [
    {
      model_: 'ModelProperty',
      name: 'tooltipModel',
      defaultValue: 'foam.ui.polymer.Tooltip'
    }
  ],

  methods: [
    {
      name: 'installInDocument',
      code: function(X, document) {
        var superRtn = this.SUPER.apply(this, arguments);
        if ( ! this.HREF ) return superRtn;

        var l = document.createElement('link');
        l.setAttribute('rel', 'import');
        l.setAttribute('href', this.HREF);
        document.head.appendChild(l);

        return superRtn;
      }
    },
    {
      name: 'maybeInitTooltip',
      code: function() {
        if ( this.tooltipModel && ! this.tooltip_ ) {
          this.tooltip_ = this.tooltipModel.create({
            text: this.tooltip,
            target: this.$
          });
        }
      }
    },
    {
      name: 'updateAttribute',
      code: function(name, prev, next) {
        if ( ! this.$ || prev === next ) return;

        if ( next ) {
          if (next !== true) this.$.setAttribute(name, next);
          else               this.$.setAttribute(name, '');
        } else {
          this.$.removeAttribute(name);
        }
      }
    },
    {
      name: 'updateProperties',
      code: function() {
        if ( ! this.POLYMER_PROPERTIES ) return;

        this.POLYMER_PROPERTIES.forEach(function(attrName) {
          this.updateAttribute(attrName, undefined, this[attrName]);
        }.bind(this));
      }
    },
    {
      name: 'initHTML',
      code: function() {
        var rtn = this.SUPER();
        this.updateProperties();
        return rtn;
      }
    }
  ],

  listeners: [
    {
      name: 'openTooltip',
      documentation: function() {/*
        The base View class binds an openTooltip listener to anything with a
        tooltip. Polymer tooltips attach/detach when tooltip text is available,
        so this is a no-op.
      */},
      code: function() {}
    },
    {
      name: 'closeTooltip',
      documentation: function() {/*
        The base View class binds an closeTooltip listener to anything with a
        tooltip. Polymer tooltips attach/detach when tooltip text is available,
        so this is a no-op.
      */},
      code: function() {}
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/demo/ActionButtonDemo.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ActionButtonDemo',
  package: 'foam.ui.polymer.demo',
  extendsModel: 'View',
  requires: [
    'Action',
    'foam.ui.polymer.ActionButton',
    'foam.ui.polymer.demo.ActionState'
  ],
  imports: ['log'],

  properties: [
    {
      type: 'foam.ui.polymer.demo.ActionState',
      name: 'data',
      view: 'foam.ui.polymer.ActionButton',
      factory: function() { return {}; }
    },
    {
      type: 'Action',
      name: 'mainAction',
      factory: function() {
        return this.Action.create({
          label: 'Main Action',
          action: function() {
            this.log('Main action committed');
          }.bind(this),
          isAvailable: function() {
            return this.available;
          },
          isEnabled: function() {
            return this.enabled;
          }
        });
      }
    },
    {
      type: 'Action',
      name: 'toggleAvailable',
      factory: function() {
        return this.Action.create({
          label: 'Toggle Available',
          help: 'Make the "Main Action" button appear or disappear',
          action: function() {
            this.available = !this.available;
          }
        });
      }
    },
    {
      type: 'Action',
      name: 'toggleEnabled',
      factory: function() {
        return this.Action.create({
          label: 'Toggle Enabled',
          help: 'Enable or disable the "Main Action" button',
          action: function() {
            this.enabled = !this.enabled;
          }
        });
      }
    },
    {
      type: 'foam.ui.polymer.demo.ActionState',
      name: 'raised',
      view: { model_: 'foam.ui.polymer.ActionButton', raised: true },
      factory: function() { return {}; }
    },
    {
      type: 'Action',
      name: 'raisedAction',
      factory: function() {
        return this.Action.create({
          label: 'Raised',
          action: function() {
            this.log('Raised action committed');
          }.bind(this)
        });
      }
    }
  ],

  templates: [
    function toHTML() {/*
      <div>
        $$raised{ action: this.raisedAction }
      </div><div>
        $$data{ action: this.toggleAvailable }
        $$data{ action: this.toggleEnabled }
        $$data{ action: this.mainAction }
      </div>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/demo/ActionState.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ActionState',
  package: 'foam.ui.polymer.demo',

  properties: [
    { name: 'available', defaultValue: true },
    { name: 'enabled', defaultValue: true }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/demo/ElementWithTooltip.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ElementWithTooltip',
  package: 'foam.ui.polymer.demo',

  extendsModel: 'foam.ui.polymer.View',

  properties: [
    {
      model_: 'StringProperty',
      name: 'tagName',
      defaultValue: 'div'
    },
    {
      model_: 'StringProperty',
      name: 'data',
      defaultValue: 'Text with tooltip'
    },
    {
      name: 'tooltipConfig',
      defaultValue: {}
    }
  ],

  methods: [
    {
      name: 'maybeInitTooltip',
      code: function() {
        if ( this.tooltipConfig ) this.tooltipConfig.target = this.$;
        if ( ! this.tooltip_ ) {
          this.tooltip_ = this.tooltipModel.create(this.tooltipConfig);
        }
      }
    }
  ],

  templates: [
    function toHTML() {/*
      <{{{this.tagName}}} id="{{{this.id}}}">{{this.data}}</{{{this.tagName}}}>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/demo/TooltipDemo.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'TooltipDemo',
  package: 'foam.ui.polymer.demo',
  extendsModel: 'View',
  requires: [
    'foam.ui.polymer.demo.ElementWithTooltip',
    'foam.ui.polymer.Tooltip'
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'right',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'Right'
    },
    {
      model_: 'StringProperty',
      name: 'top',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'Top'
    },
    {
      model_: 'StringProperty',
      name: 'left',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'Left'
    },
    {
      model_: 'StringProperty',
      name: 'bottom',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'Bottom'
    },
    {
      model_: 'StringProperty',
      name: 'noArrow',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'NoArrow'
    },
    {
      model_: 'StringProperty',
      name: 'richText',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'RichText'
    },
    {
      model_: 'StringProperty',
      name: 'show',
      view: 'foam.ui.polymer.demo.ElementWithTooltip',
      defaultValue: 'Show'
    }
  ],

  templates: [
    function toHTML() {/*
      <div class="centeredDiv">
        $$top{ tooltipConfig: {
          text: 'Tooltip on the top',
          position: 'top'
        } }
      </div><div class="centeredDiv">
        $$left{ tooltipConfig: {
          text: 'Tooltip on the left',
          position: 'left'
        } }
      </div><div class="centeredDiv">
        $$right{ tooltipConfig: {
          text: 'Tooltip on the right',
          position: 'right'
        } }
      </div><div class="centeredDiv">
        $$bottom{ tooltipConfig: {
          text: 'Tooltip on the bottom',
          position: 'bottom'
        } }
      </div><div class="centeredDiv">
        $$noArrow{ tooltipConfig: {
          text: 'Tooltip without arrow',
          noarrow: true
        } }
      </div><div class="centeredDiv">
        $$richText{ tooltipConfig: {
          html: 'Tooltip with <b>rich</b> <i>text</i>'
        } }
      </div><div class="centeredDiv">
        $$show{ tooltipConfig: {
          text: 'Tooltip always shown',
          show: true
        } }
      </div>
    */},
    function CSS() {/*
      .centeredDiv { cursor: pointer; width: 0; margin: 0 auto; }
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/Component.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Component',
  package: 'foam.ui.polymer.gen',

  requires: [
    'MultiLineStringArrayView'
  ],

  imports: [
    'ELLIPSIS',
    'shortenURL'
  ],

  ids: ['url'],

  constants: [
    {
      name: 'SRC_HTML_PREFIX',
      type: 'String',
      value: multiline(function() {/* <code> */})
    },
    {
      name: 'SRC_HTML_POSTFIX',
      type: 'String',
      value: multiline(function() {/* </code> */})
    }
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'url',
      tableFormatter: function(url, self, tableView) {
        return self.shortenURL(url);
      },
      required: true
    },
    {
      model_: 'StringProperty',
      name: 'name',
      defaultValue: ''
    },
    {
      model_: 'StringProperty',
      name: 'extends',
      defaultValue: ''
    },
    {
      model_: 'StringProperty',
      name: 'tagName',
      defaultValue: ''
    },
    {
      model_: 'StringProperty',
      name: 'source',
      view: 'MultiLineStringArrayView',
      tableFormatter: function(src, self, tableView) {
        var size = 128;
        var escapeHTML = self.X.XMLUtil.escape;
        var compSrc = /<\s*polymer-element[^>]*>[\s\S]*<\s*[/]\s*polymer-element\s*>/gm
            .exec(src) ||
            /<\s*script[^>]*>[\s\S]*<\s*[/]\s*script\s*>/gm
            .exec(src) ||
            /<\s*style[^>]*>[\s\S]*<\s*[/]\s*style\s*>/gm
            .exec(src);
        src = ((compSrc && compSrc[0]) || src);
        var cutSrc = src.slice(0, size);
        var srcPreview = '';
        if ( compSrc && compSrc.index ) srcPreview += self.ELLIPSIS + '\n';
        srcPreview += cutSrc;
        if ( cutSrc.length < src.length ) srcPreview += self.ELLIPSIS;
        return self.SRC_HTML_PREFIX +
            escapeHTML(srcPreview)
            .replace(/ /g, '&nbsp;')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/\n/g, '<br />') +
            self.SRC_HTML_POSTFIX;
      },
      defaultValue: ''
    },
    {
      model_: 'StringArrayProperty',
      name: 'deps',
      view: 'MultiLineStringArrayView',
      tableFormatter: function(arr, self, tableView) {
        return arr.map(self.shortenURL.bind(self)).join('<br />');
      },
      factory: function() {
        return [];
      }
    },
    {
      name: 'prototype',
      hidden: true
    }
  ],

  relationships: [
    {
      relatedModel: 'foam.ui.polymer.gen.ComponentProperty',
      relatedProperty: 'url'
    },
    {
      relatedModel: 'foam.ui.polymer.gen.PolymerPrototype',
      relatedProperty: 'tagName'
    }
  ],

  methods: [
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ComponentAttributesBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ComponentAttributesBuilder',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'foam.ui.polymer.gen.ComponentBuilderBase',

  requires: [
    'foam.ui.polymer.gen.ComponentProperty'
  ],

  imports: [
    'propertyDAO as dao',
    'parser',
    'filterNodes',
    'getNodeAttribute'
  ],

  constants: [
    {
      name: 'NOT_CUSTOM_ATTRIBUTES',
      type: 'Array[String]',
      value: ['name', 'extends', 'attributes', 'noscript', 'constructor']
    }
  ],

  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'listensTo',
      factory: function() {
        return ['source'];
      }
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.run();
        return this.SUPER();
      }
    },
    {
      name: 'run',
      code: function() {
        var node = this.filterNodes(
            this.parser.parseString(this.comp.source),
            function(node) {
              return node.nodeName === 'polymer-element';
            })[0];
        if ( ! node ) return;
        this.getAttributesAttribute(node);
        this.getCustomAttributes(node);
      }
    },
    {
      name: 'getAttributesAttribute',
      code: function(node) {
        var attrsStr = this.getNodeAttribute(node, 'attributes');
        if ( ! attrsStr ) return;
        var attrs = attrsStr.replace(/\s+/g, ' ').trim().split(' ');
        attrs.forEach(function(attrName) {
          if ( ! attrName ) return;
          this.dao.put(this.ComponentProperty.create({
            url: this.comp.url,
            name: attrName
          }));
        }.bind(this));
      }
    },
    {
      name: 'getCustomAttributes',
      code: function(node) {
        node.attributes.filter(function(attr) {
          return ! this.NOT_CUSTOM_ATTRIBUTES.some(
              function(attr, notCustomAttrName) {
                return notCustomAttrName === attr.name;
              }.bind(this, attr));
        }.bind(this)).forEach(function(attr) {
          this.dao.put(this.ComponentProperty.create({
            url: this.comp.url,
            name: attr.name,
            propertyModel: 'StringProperty',
            defaultValue: attr.value
          }));
        }.bind(this));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ComponentBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ComponentBuilder',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'foam.ui.polymer.gen.ComponentBuilderBase',

  requires: [
    'XHR',
    'foam.ui.polymer.gen.Component',
    'foam.ui.polymer.gen.ComponentNameBuilder',
    'foam.ui.polymer.gen.ComponentAttributesBuilder',
    'foam.ui.polymer.gen.ComponentDependencyBuilder',
    'foam.ui.polymer.gen.PolymerPrototypeImporter'
  ],

  imports: [
    'componentDAO as dao'
  ],


  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'provides',
      factory: function() {
        return ['source'];
      }
    },
    {
      name: 'nameBuilder',
      type: 'foam.ui.polymer.gen.ComponentNameBuilder',
      defaultValue: null
    },
    {
      name: 'attrsBuilder',
      type: 'foam.ui.polymer.gen.ComponentAttributesBuilder',
      defaultValue: null
    },
    {
      name: 'depBuilder',
      type: 'foam.ui.polymer.gen.ComponentDependencyBuilder',
      defaultValue: null
    },
    {
      name: 'polyImporter',
      type: 'foam.ui.polymer.gen.PolymerPrototypeImporter',
      defaultValue: null
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        var ret = this.SUPER();
        this.run();
        return ret;
      }
    },
    {
      name: 'run',
      code: function() {
        var xhr = this.XHR.create();
        var url = this.comp.url;
        var dir = url.slice(0, url.lastIndexOf('/') + 1);
        xhr.asend(function(textContent) {
          this.comp.source = textContent;
          this.dao.put(this.comp);
          this.nameBuilder = this.ComponentNameBuilder.create();
          this.attrsBuilder = this.ComponentAttributesBuilder.create();
          this.depBuilder = this.ComponentDependencyBuilder.create();
          this.polyImporter = this.PolymerPrototypeImporter.create();
        }.bind(this), url);
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ComponentBuilderBase.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ComponentBuilderBase',
  package: 'foam.ui.polymer.gen',

  imports: [
    'comp'
  ],

  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'provides',
      factory: function() {
        return [];
      }
    },
    {
      model_: 'StringArrayProperty',
      name: 'listensTo',
      factory: function() {
        return [];
      }
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        var ret = this.SUPER();
        this.listensTo.forEach(function(propName) {
          Events.dynamic(function() {
            var prop = this.comp[propName];
            this.onChange();
          }.bind(this));
        }.bind(this));
        return ret;
      }
    },
    {
      name: 'run',
      code: function() {
        this.dao.put(this.comp);
      }
    }
  ],
  listeners: [
    {
      name: 'onChange',
      code: function() {
        return this.run();
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ComponentDependencyBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ComponentDependencyBuilder',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'foam.ui.polymer.gen.ComponentBuilderBase',

  imports: [
    'componentDAO as dao',
    'canonicalizeURL',
    'controller',
    'parser',
    'filterNodes'
  ],

  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'provides',
      factory: function() {
        return ['deps'];
      }
    },
    {
      model_: 'StringArrayProperty',
      name: 'listensTo',
      factory: function() {
        return ['source'];
      }
    },
    {
      model_: 'StringProperty',
      name: 'dir'
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.dir = this.dirFromURL(this.comp.url);
        Events.map(this.comp.url$, this.dir$, this.dirFromURL);

        var ret = this.SUPER();
        this.run();
        return ret;
      }
    },
    {
      name: 'dirFromURL',
      code: function(url) {
        return url.slice(0, url.lastIndexOf('/') + 1);
      }
    },
    {
      name: 'run',
      code: function() {
        var src = this.comp.source;
        var dir = this.dir;
        if ( dir === '' ) debugger;
        this.filterNodes(
            this.parser.parseString(src),
            this.importLinkFilter.bind(this))
                .map(this.extractHrefFromNode.bind(this))
                .forEach(function(href) {
                  var path = href.charAt(0) === '/' ? href : dir + href;
                  var url = this.canonicalizeURL(path);
                  if ( ! this.comp.deps.some(function(dep) {
                    return dep === url;
                  }) ) {
                    this.comp.deps.push(url);
                    this.controller.registerComponent(path);
                  }
                }.bind(this));
      }
    },
    {
      name: 'importLinkFilter',
      code: function(node) {
        if ( node.nodeName !== 'link') return false;
        var attrs = node.attributes, rel = false, href = false;
        for ( var i = 0; i < attrs.length; ++i ) {
          if ( attrs[i].name === 'rel' && attrs[i].value === 'import' ) {
            rel = true;
          }
          if ( attrs[i].name === 'href' ) {
            href = true;
          }
        }
        return rel && href;
      }
    },
    {
      name: 'extractHrefFromNode',
      code: function(node) {
        var attrs = node.attributes, rel = false, href = false;
        for ( var i = 0; i < attrs.length; ++i ) {
          if ( attrs[i].name === 'href' ) {
            return attrs[i].value;
          }
        }
        return '';
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ComponentNameBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ComponentNameBuilder',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'foam.ui.polymer.gen.ComponentBuilderBase',

  imports: [
    'componentDAO as dao',
    'parser',
    'filterNodes',
    'getNodeAttribute'
  ],

  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'provides',
      factory: function() {
        return ['tagName', 'name', 'extends'];
      }
    },
    {
      model_: 'StringArrayProperty',
      name: 'listensTo',
      factory: function() {
        return ['source'];
      }
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.run();
        return this.SUPER();
      }
    },
    {
      name: 'run',
      code: function() {
        var node = this.filterNodes(
            this.parser.parseString(this.comp.source),
            function(node) {
              return node.nodeName === 'polymer-element';
            })[0];
        if ( ! node ) return;
        var tagName = this.getNodeAttribute(node, 'name');
        if ( ! tagName ) return;
        var extendsTagName = this.getNodeAttribute(node, 'extends');
        this.comp.tagName = tagName;
        this.comp.name = this.getComponentName(tagName);
        if ( extendsTagName )
          this.comp.extends = this.getComponentName(extendsTagName);
        this.dao.put(this.comp);
      }
    },
    {
      name: 'getComponentName',
      code: function(tagName) {
        var name = tagName.charAt(0).toUpperCase() + tagName.slice(1);
        while ( name.indexOf('-') >= 0 ) {
          name = name.slice(0, name.indexOf('-')) +
              name.charAt(name.indexOf('-') + 1).toUpperCase() +
              name.slice(name.indexOf('-') + 2);
        }
        return name;
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ComponentProperty.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ComponentProperty',
  package: 'foam.ui.polymer.gen',

  requires: [
    'MultiLineStringArrayView'
  ],

  imports: [
    'ELLIPSIS',
    'shortenURL'
  ],

  ids: ['id'],

  properties: [
    {
      name: 'id',
      getter: function() {
        return this.url + '?' + this.name;
      },
      hidden: true
    },
    {
      model_: 'StringProperty',
      name: 'url',
      tableFormatter: function(url, self, tableView) {
        return self.shortenURL(url);
      },
      required: true
    },
    {
      model_: 'StringProperty',
      name: 'name',
      required: true
    },
    {
      model_: 'StringProperty',
      name: 'propertyModel'
    },
    {
      name: 'defaultValue',
      defaultValue: undefined
    },
    {
      model_: 'FunctionProperty',
      name: 'factory',
      defaultValue: null
    },
    {
      model_: 'StringArrayProperty',
      name: 'importHints',
      view: 'MultiLineStringArrayView',
      factory: function() { return []; }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/Controller.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Controller',
  package: 'foam.ui.polymer.gen',

  requires: [
    'EasyDAO',
    'MultiLineStringArrayView',
    'TableView',
    'foam.ui.polymer.gen.Component',
    'foam.ui.polymer.gen.ComponentBuilder',
    'foam.ui.polymer.gen.ComponentProperty',
    'foam.ui.polymer.gen.PolymerPrototype',
    'foam.ui.polymer.gen.PolymerPrototypeBuilder'
  ],

  exports: [
    'componentDAO',
    'propertyDAO',
    'prototypeDAO',
    'parser',
    'canonicalizeURL',
    'shortenURL',
    'filterNodes',
    'getNodeAttribute',
    'ELLIPSIS'
  ],

  imports: [
    'document'
  ],

  properties: [
    {
      model_: 'StringArrayProperty',
      name: 'componentsToRegister',
      view: 'MultiLineStringArrayView',
      factory: function() {
        return [
          '../bower_components/paper-button/paper-button.html',
          '../bower_components/paper-checkbox/paper-checkbox.html'
        ];
      }
    },
    {
      name: 'componentDAOConfig',
      factory: function() {
        return {
          daoType: 'MDAO',
          model: this.Component
        };
      },
      hidden: true
    },
    {
      name: 'componentDAO',
      label: 'Registered Components',
      view: 'TableView',
      factory: function() {
        return this.EasyDAO.create(this.componentDAOConfig);
      }
    },
    {
      name: 'propertyDAOConfig',
      factory: function() {
        return {
          daoType: 'MDAO',
          model: this.ComponentProperty
        };
      },
      hidden: true
    },
    {
      name: 'propertyDAO',
      label: 'Registered Component Properties',
      view: 'TableView',
      factory: function() {
        return this.EasyDAO.create(this.propertyDAOConfig);
      }
    },
    {
      name: 'prototypeDAOConfig',
      factory: function() {
        return {
          daoType: 'MDAO',
          model: this.PolymerPrototype
        };
      },
      hidden: true
    },
    {
      name: 'prototypeDAO',
      label: 'Component Prototypes',
      view: 'TableView',
      factory: function() {
        return this.EasyDAO.create(this.prototypeDAOConfig);
      }
    },
    {
      name: 'polymerPrototypeBuilder',
      type: 'foam.ui.polymer.gen.PolymerPrototypeBuilder',
      factory: function() {
        return this.PolymerPrototypeBuilder.create();
      },
      hidden: true
    },
    {
      type: 'HTMLParser',
      name: 'parser',
      factory: function() { return HTMLParser.create(); },
      hidden: true
    },
    {
      model_: 'FunctionProperty',
      name: 'canonicalizeURL',
      factory: function() {
        return function(url) {
          var parts = url.split('/').filter(function(part) {
            return part !== '.';
          });
          for ( var i = 1; i < parts.length; ++i ) {
            if ( i > 0 && parts[i] === '..' && parts[i - 1] !== '..' ) {
              parts = parts.slice(0, i - 1).concat(parts.slice(i + 1));
              i = i - 2;
            }
          }
          return parts.join('/');
        };
      },
      hidden: true
    },
    {
      model_: 'FunctionPropety',
      name: 'shortenURL',
      factory: function() {
        return function(url) {
          var firstIdx = url.indexOf('/');
          var lastIdx  = url.lastIndexOf('/');
          if ( firstIdx !== lastIdx )
          return this.ELLIPSIS + url.slice(lastIdx);
          else
          return url;
        };
      },
      hidden: true
    },
    {
      model_: 'FunctionProperty',
      name: 'filterNodes',
      factory: function() {
        return function(node, fltr, opt_acc) {
          var acc = opt_acc || [];
          if ( fltr(node) ) acc.push(node);
          node.children.forEach(function(child) {
            this.filterNodes(child, fltr, acc);
          }.bind(this));
          return acc;
        };
      },
      hidden: true
    },
    {
      model_: 'FunctionProperty',
      name: 'getNodeAttribute',
      factory: function() {
        return function(node, attrName) {
          var attr = node.attributes.filter(function(attr) {
            return attr.name === attrName;
          })[0];
          if ( attr ) return attr.value;
          else        return undefined;
        };
      },
      hidden: true
    },
    {
      model_: 'StringProperty',
      name: 'ELLIPSIS',
      defaultValue: '\u2026',
      todo: function() {/*
        TODO(markdittmer): This should be a constant, but we want to export it,
        and exporting constants isn't supported (yet).
      */},
      hidden: true
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        var ret = this.SUPER();
        window.propertyDAO = this.propertyDAO;
        return ret;
      }
    },
    {
      name: 'registerComponent',
      code: function(rawURL) {
        var url = this.canonicalizeURL(rawURL);
        this.componentDAO.find(url, {
          error: function(url) {
            this.ComponentBuilder.create(
                {},
                this.X.sub({
                  controller: this,
                  comp: this.Component.create({ url: url })
                }));
            this.loadComponent(url);
          }.bind(this, url)
        });
      }
    },
    {
      name: 'loadComponent',
      code: function(url) {
        if (  this.document.querySelector('link[href="' + url + '"]') ) return;
        var link = this.document.createElement('link');
        link.setAttribute('rel', 'import');
        link.setAttribute('href', url);
        document.head.appendChild(link);
      }
    }
  ],

  actions: [
    {
      name: 'registerComponents',
      action: function() {
        this.componentsToRegister.forEach(this.registerComponent.bind(this));
        this.componentsToRegister = [];
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ControllerView.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ControllerView',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'DetailView',

  properties: [
    {
      name: 'showActions',
      factory: function() { return true; }
    },
    {
      name: 'actionBorderPosition',
      factory: function() { return 'top'; }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/DemoView.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'DemoView',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'View',

  properties: [
    {
      name: 'data',
      postSet: function() {
        if ( this.data && this.data.create ) {
          this.instance = this.data.create({ content: 'Content' });
        }
      }
    },
    {
      name: 'instance',
      postSet: function() {
        if ( this.instance ) this.proxy = this.instance.proxy;
      }
    }
  ],

  methods: [
    {
      name: 'initHTML',
      code: function() {
        var rtn = this.SUPER();
        this.instance.initHTML();
        return rtn;
      }
    }
  ],

  templates: [
    function toHTML() {/*
      <div id="{{{this.id}}}">
        <% if ( this.instance ) { %>
          <style>
            div.detailAndPreviewContainer {
              display: flex;
              justify-content: space-around;
              align-items: center;
              align-content: center;
            }
          </style>
          <div class="detailAndPreviewContainer">
            $$instance{ model_: 'DetailView' }
            <%= this.instance.toHTML() %>
          </div>
        <% } %>
      </div>
    */}
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/FunctionWrapper.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'FunctionWrapper',
  package: 'foam.ui.polymer.gen',

  properties: [
    {
      model_: 'ArrayProperty',
      name: 'impls',
      factory: function() { return []; }
    },
    {
      name: 'object',
      factory: function() { return window; }
    },
    {
      name: 'name',
      defaultValue: 'wrapper'
    },
    {
      name: 'ctx',
      defaultValue: null
    },
    {
      model_: 'FunctionProperty',
      name: 'fn',
      factory: function() {
        return function() {
          var rtn = undefined;
          for ( var i = 0; i < this.impls.length; ++i ) {
            if ( typeof this.impls[i] === 'function' ) {
              rtn = this.impls[i].apply(this.ctx || this, arguments);
            }
          }
          return rtn;
        }.bind(this);
      }
    },
    {
      name: 'property',
      factory: function() {
        return {
          configurable: true,
          enumerable: true,
          get: function() { return this.fn; }.bind(this),
          set: function(newValue) {
            this.impls.push(newValue);
          }.bind(this)
        };
      }
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        var rtn = this.SUPER();
        this.bindToObject();
        return rtn;
      }
    },
    {
      name: 'bindToObject',
      code: function(opt_o, opt_n, opt_p) {
        if ( opt_o ) this.object = opt_o;
        if ( opt_n ) this.name = opt_n;
        if ( opt_p ) this.property = opt_p;
        var oldValue = this.object[this.name];
        Object.defineProperty(
            this.object,
            this.name,
            this.property);
        if ( typeof oldValue === 'function' ) this.object[this.name] = oldValue;
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/Input.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Input',
  package: 'foam.ui.polymer.gen',
  documentation: function() {/*
    Polymer's CoreInput component extends something named Input that doesn't
    exist. This is a placeholder.
  */}
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/Link.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'Link',
  package: 'foam.ui.polymer.gen',

  properties: [
    {
      model_: 'StringProperty',
      name: 'href'
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/ModelGenerator.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'ModelGenerator',
  package: 'foam.ui.polymer.gen',

  requires: [
    'XHR',
    'EasyDAO',
    'DAOListView',
    'foam.ui.polymer.gen.PolymerPrototype',
    'foam.ui.polymer.gen.FunctionWrapper',
    'foam.ui.polymer.gen.DemoView',
    'foam.ui.polymer.gen.Link'
  ],

  constants: {
    BASE_MODEL: {
      package: 'foam.ui.polymer.gen',
      extendsModel: 'foam.ui.polymer.gen.View',
      traits: [],
      properties: [
        'id',
        'children',
        'shortcuts',
        'className',
        'extraClassName',
        'showActions',
        'initializers_',
        'destructors_',
        'tooltip',
        'tooltipModel'
      ].map(function(propName) {
        return { name: propName, hidden: true };
      }),
      constants: { POLYMER_PROPERTIES: [] }
    }
  },

  properties: [
    {
      type: 'foam.ui.polymer.gen.FunctionWrapper',
      name: 'polymerFn',
      factory: function() {
        var fn = this.FunctionWrapper.create({
          name: 'Polymer'
        });
        fn.object[fn.name] = this.polymerFnImpl;
        return fn;
      },
      hidden: true
    },
    {
      model_: 'FunctionProperty',
      name: 'polymerFnImpl',
      factory: function() {
        return function(name, proto) {
          // Follow polymer's name+proto parameter matching.
          if (typeof name !== 'string') {
            var script = proto || document._currentScript;
            proto = name;
            name = (script &&
                script.parentNode &&
                script.parentNode.getAttribute) ?
                script.parentNode.getAttribute('name') : '';
          }
          // Store name+proto in polymers queue for processing by
          // ModelGenerator.
          this.polymers.put(this.PolymerPrototype.create({
            tagName: name,
            proto: proto
          }));
        }.bind(this);
      },
      hidden: true
    },
    {
      model_: 'StringArrayProperty',
      name: 'linksToLoad',
      factory: function() {
        return [
          '../bower_components/paper-button/paper-button.html',
          '../bower_components/paper-checkbox/paper-checkbox.html'
        ];
      },
      view: 'TextAreaView'
    },
    {
      name: 'polymers',
      factory: function() {
        return this.EasyDAO.create({
          daoType: 'MDAO',
          model: 'foam.ui.polymer.gen.PolymerPrototype'
        });
      },
      hidden: true
    },
    {
      model_: 'ArrayProperty',
      name: 'components',
      factory: function() { return []; },
      hidden: true
    },
    {
      name: 'componentsJSON',
      view: 'TextAreaView',
      defaultValue: ''
    },
    {
      type: 'HTMLParser',
      todo: function() {/*
                         (markdittmer): HTMLParser isn't a proper model. It should be upgraded.
                         */},
      name: 'parser',
      factory: function() { return HTMLParser.create(); },
      hidden: true
    },
    {
      name: 'links',
      factory: function() {
        return this.EasyDAO.create({
          daoType: 'MDAO',
          model: 'foam.ui.polymer.gen.Link'
        });
      },
      hidden: true
    },
    {
      name: 'urls',
      factory: function() { return {}; },
      hidden: true
    },
    {
      name: 'sources',
      factory: function() { return {}; },
      hidden: true
    },
    {
      name: 'xhrCount',
      defaultValue: 0
    },
    {
      name: 'defaultValueTypes',
      factory: function() {
        return {
          'boolean': true,
          number: true,
          string: true
        };
      },
      hidden: true
    },
    {
      name: 'nonPolymerProperties',
      factory: function() {
        return [
          'tagName'
        ];
      },
      hidden: true
    },
    {
      model_: 'BooleanProperty',
      name: 'demosRendered',
      defaultValue: false,
      hidden: true
    },
    {
      model_: 'StringArrayProperty',
      name: 'demoNameWhitelist',
      factory: function() {
        return [
          'paper'
        ];
      },
      hidden: true
    },
    {
      model_: 'StringArrayProperty',
      name: 'demoNameBlacklist',
      factory: function() {
        return [
          'base',
          'demo',
          'test'
        ];
      },
      hidden: true
    },
    {
      model_: 'IntProperty',
      name: 'modelsLoadingCount',
      defaultValue: 0
    },
    {
      name: 'models',
      view: {
        model_: 'DAOListView',
        rowView: 'foam.ui.polymer.gen.DemoView'
      },
      factory: function() {
        return this.EasyDAO.create({
          daoType: 'MDAO',
          model: 'Model'
        });
      }
    },
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.SUPER();

        this.polymers.pipe({
          put: this.storeComponentFromProto.bind(this)
        });

        this.links.pipe({
          put: this.loadLink.bind(this)
        });

        this.putLinks(
            document.head.innerHTML +
                document.body.innerHTML);
        // TODO: Just for debugging.
        window.polyFoamComponents = this.components;
      }
    },
    {
      name: 'canonicalizeURL',
      code: function(url) {
        var parts = url.split('/').filter(function(part) {
          return part !== '.';
        });
        for ( var i = 1; i < parts.length; ++i ) {
          if ( i > 0 && parts[i] === '..' && parts[i - 1] !== '..' ) {
            parts = parts.slice(0, i - 1).concat(parts.slice(i + 1));
            i = i - 2;
          }
        }
        return parts.join('/');
      }
    },
    {
      name: 'getComponent',
      code: function(compName) {
        return this.components.filter(function(comp) {
          return comp.name === compName;
        })[0];
      }
    },
    {
      name: 'getOrCreateComponent',
      code: function(compName) {
        var comp = this.getComponent(compName);
        if ( ! compName ) debugger;
        if ( ! comp ) {
          comp = JSON.parse(JSON.stringify(this.BASE_MODEL));
          comp.name = compName;
          this.putComponent(comp);
        }
        return comp;
      }
    },
    {
      name: 'putComponent',
      code: function(comp) {
        if ( ! comp.name || this.getComponent(comp.name) ) debugger;
        this.components.push(comp);
        this.components.sort(function(c1, c2) { return c1.name > c2.name; });
        this.componentsJSON = JSON.stringify(this.components);
      }
    },
    {
      name: 'putLinks',
      code: function(src, opt_dir) {
        var dir = opt_dir || '';
        this.filterNodes(
            this.parser.parseString(src),
            this.importLinkFilter.bind(this))
                .map(this.extractHrefFromNode.bind(this))
                .forEach(function(href) {
                  var path = href.charAt(0) === '/' ? href : dir + href;
                  this.links.put(this.Link.create({ href: path }));
                }.bind(this));
      }
    },
    {
      name: 'filterNodes',
      code: function(node, fltr, opt_acc) {
        var acc = opt_acc || [];
        if ( fltr(node) ) acc.push(node);
        node.children.forEach(function(child) {
          this.filterNodes(child, fltr, acc);
        }.bind(this));
        return acc;
      }
    },
    {
      name: 'importLinkFilter',
      code: function(node) {
        if ( node.nodeName !== 'link') return false;
        var attrs = node.attributes, rel = false, href = false;
        for ( var i = 0; i < attrs.length; ++i ) {
          if ( attrs[i].name === 'rel' && attrs[i].value === 'import' ) {
            rel = true;
          }
          if ( attrs[i].name === 'href' ) {
            href = true;
          }
        }
        return rel && href;
      }
    },
    {
      name: 'extractHrefFromNode',
      code: function(node) {
        var attrs = node.attributes, rel = false, href = false;
        for ( var i = 0; i < attrs.length; ++i ) {
          if ( attrs[i].name === 'href' ) {
            return attrs[i].value;
          }
        }
        return '';
      }
    },
    {
      name: 'loadLink',
      code: function(link) {
        var url = this.canonicalizeURL(link.href);
        if ( this.urls[url] ) return;
        this.urls[url] = true;

        var xhr = this.XHR.create();
        var dir = url.slice(0, url.lastIndexOf('/') + 1);
        var X = {
          self: this,
          dir: dir
        };
        ++this.xhrCount;
        xhr.asend(function(textContent) {
          var hashCode = '' + textContent.hashCode();
          if ( ! this.self.sources[hashCode] ) {
            this.self.sources[hashCode] = true;
            this.self.putLinks(textContent, this.dir);
            this.self.putComponents(textContent);
          }
          --this.self.xhrCount;
        }.bind(X), url);
      }
    },
    {
      name: 'putComponents',
      code: function(src) {
        this.filterNodes(this.parser.parseString(src), function(node) {
          return node.nodeName === 'polymer-element';
        })
            .map(this.componentHashFromNode.bind(this))
            .forEach(this.storeComponentFromHash.bind(this));
      }
    },
    {
      name: 'componentHashFromNode',
      code: function(node) {
        // Use __metadata__ in hash to allow for non-meta-level properties
        // named 'name' or 'extends'.
        var compHash = {__metadata__: {} };
        var attrs = node.attributes;
        for ( var i = 0; i < attrs.length; ++i ) {
          if ( attrs[i].name === 'name' ) {
            compHash.tagName = attrs[i].value;
            compHash.__metadata__['name'] =
                this.getComponentName(compHash.tagName);
          } else if ( attrs[i].name === 'extends' ) {
            compHash.__metadata__['extends'] =
                this.getComponentName(attrs[i].value);
          } else if ( attrs[i].name === 'attributes' ) {
            var attrNames = attrs[i].value
                .replace(/\s+/g, ' ')
                .trim()
                .split(' ');
            attrNames.forEach(function(attrName) {
              compHash[attrName] = undefined;
            });
          }
        }
        return compHash;
      }
    },
    {
      name: 'storeComponentFromHash',
      code: function(compHash) {
        var name = compHash.__metadata__['name'];
        var ext  = compHash.__metadata__['extends'];
        var comp = this.getOrCreateComponent(name);
        Object.getOwnPropertyNames(compHash).forEach(function(key) {
          if ( key !== '__metadata__' ) {
            this.updateProperty(comp, key, compHash[key]);
          }
        }.bind(this));
        if ( ext ) {
          comp.traits.push(
              'foam.ui.polymer.gen.' + ext);
        }
      }
    },
    {
      name: 'getComponentName',
      code: function(tagName) {
        var name = tagName.charAt(0).toUpperCase() + tagName.slice(1);
        while ( name.indexOf('-') >= 0 ) {
          name = name.slice(0, name.indexOf('-')) +
              name.charAt(name.indexOf('-') + 1).toUpperCase() +
              name.slice(name.indexOf('-') + 2);
        }
        return name;
      }
    },
    {
      name: 'storeComponentFromProto',
      code: function(p) {
        var name = this.getComponentName(p.tagName);
        var comp = this.getOrCreateComponent(name);

        // Attributes either come from:
        //   HTML:  <polymer-element attributes="attr1 attr2">
        //   Proto: { attr1: ..., attr2: ... }
        // or:
        //   Proto: { publish: { attr1: ..., attr2: ... }, ... }

        // Default to proto.publish (or empty).
        var attrs = p.proto && p.proto.publish ? p.proto.publish : {};
        var protoNames = p.proto ? Object.getOwnPropertyNames(p.proto) : [];
        var protoPublishNames = Object.getOwnPropertyNames(attrs);
        // Look up names that presumably came from <polymer-element ...>.
        var existingPropNames = comp.properties.map(function(prop) {
          return prop.name;
        });
        // Props to add to default: ones from <polymer-element ...> that
        // appear in proto, but not in proto.publish.
        var extraPropNames = existingPropNames.filter(function(epn) {
          return protoNames.some(function(pn) { return pn === epn; }) &&
              ! protoPublishNames.some(function(ppn) { return ppn === epn; });
        });
        extraPropNames.forEach(function(epn) {
          attrs[epn] = p.proto[epn];
        });

        Object.getOwnPropertyNames(attrs).forEach(function(key) {
          this.updateProperty(comp, key, attrs[key]);
        }.bind(this));
      }
    },
    {
      name: 'updateProperty',
      code: function(modelHash, propName, opt_propValue) {
        try {
          if ( ! modelHash.properties ) modelHash.properties = [];
        } catch (e) { debugger; }
        var properties = modelHash.properties;
        var matchingProps = properties.filter(function(prop) {
          return prop.name === propName;
        });
        var prop;
        if ( matchingProps.length === 0 ) {
          prop = { name: propName };
          properties.push(prop);
        } else {
          prop = matchingProps[0];
        }
        var propValue = this.getPropertyValue(opt_propValue);
        var propModelName = this.getPropertyModel(propValue);
        if ( propModelName ) prop.model_ = propModelName;
        var typeOf = typeof propValue;
        if ( this.defaultValueTypes[typeOf] ) {
          prop.defaultValue = propValue;
        } else if ( propValue !== undefined ) {
          eval('prop.factory = function() { return ' +
              JSON.stringify(propValue) +
              '; }');
        }
        if ( ! prop.postSet ) {
          eval(
              'prop.postSet = function() { this.postSet(\'PROPNAME\'); }'
                  .replace('PROPNAME', prop.name));
        }

        // Some properties that get 'updated' are not Polymer properties.
        if ( ! this.nonPolymerProperties.some(function(propName) {
          return prop.name === propName;
        }) ) {
          var polyProps = modelHash.constants.POLYMER_PROPERTIES;
          if ( ! polyProps.some(function(propName) {
            return propName === prop.name;
          }) ) {
            polyProps.push(prop.name);
          }
        }
      }
    },
    {
      name: 'getPropertyModel',
      code: function(value) {
        if (value === undefined) return '';

        var typeOf = typeof value;
        if ( typeOf === 'boolean' ) {
          return 'BooleanProperty';
        } else if ( typeOf === 'number' ) {
          if ( Number.isInteger(value) ) {
            return 'IntProperty';
          } else {
            return 'FloatProperty';
          }
        } else if ( typeOf === 'string' ) {
          return 'StringProperty';
        } else if ( Array.isArray(value) ) {
          return 'ArrayProperty';
        } else {
          return '';
        }
      }
    },
    {
      name: 'getPropertyValue',
      code: function(value) {
        if ( value !== null && typeof value === 'object' &&
            Object.getOwnPropertyNames(value).some(function(name) {
              return name === 'value';
            }) ) { return value.value; }
        else       return value;
      }
    },
    {
      name: 'componentFilter',
      code: function(comp) {
        return this.demoNameWhitelist.some(function(wlName) {
          return comp.name.indexOfIC(wlName) >= 0;
        }) && ! this.demoNameBlacklist.some(function(blName) {
          return comp.name.indexOfIC(blName) >= 0;
        }) && comp.POLYMER_PROPERTIES.length > 0;
      }
    }
  ],

  actions: [
    {
      name: 'loadLinks',
      action: function() {
        var linksHTML = '';
        this.linksToLoad.forEach(function(linkToLoad) {
          var link = document.createElement('link');
          link.setAttribute('rel', 'import');
          link.setAttribute('href', linkToLoad);
          document.head.appendChild(link);
          linksHTML += link.outerHTML;
        }.bind(this));
        this.putLinks(linksHTML);
      }
    },
    {
      name: 'importModels',
      isEnabled: function() {
        this.xhrCount;
        return this.xhrCount <= 0;
      },
      action: function() {
        this.components.forEach(function(comp) {
          try {
            CLASS(comp);
            ++this.modelsLoadingCount;
          } catch (e) { debugger; }
        }.bind(this));
        this.components.forEach(function(comp) {
          try {
            arequire(comp.package + '.' + comp.name)(
                function(model) {
                  if ( this.componentFilter(model) ) {
                    this.models.put(model);
                  }
                  --this.modelsLoadingCount;
                  if ( this.modelsLoadingCount <= 0 ) {
                    this.modelsLoadingCount = 0;
                    this.linksToLoad = [];
                  }
                }.bind(this));
          } catch (e) { debugger; }
        }.bind(this));
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/PolymerPrototype.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'PolymerPrototype',
  package: 'foam.ui.polymer.gen',

  ids: ['tagName'],

  properties: [
    {
      name: 'tagName',
      defaultValue: 'PolymerPrototype'
    },
    {
      name: 'proto',
      factory: function() { return {}; }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/PolymerPrototypeBuilder.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'PolymerPrototypeBuilder',
  package: 'foam.ui.polymer.gen',

  requires: [
    'foam.ui.polymer.gen.Component',
    'foam.ui.polymer.gen.FunctionWrapper',
    'foam.ui.polymer.gen.PolymerPrototype'
  ],

  imports: [
    'prototypeDAO as dao'
  ],

  properties: [
    {
      model_: 'FunctionProperty',
      name: 'polymerFnImpl',
      factory: function() {
        return function(name, proto) {
          // Follow polymer's name+proto parameter matching.
          if (typeof name !== 'string') {
            var script = proto || document._currentScript;
            proto = name;
            name = (script &&
                script.parentNode &&
                script.parentNode.getAttribute) ?
                script.parentNode.getAttribute('name') : '';
          }
          // Store name+proto in polymers queue for processing by
          // ModelGenerator.
          this.dao.put(this.PolymerPrototype.create({
            tagName: name,
            proto: proto
          }));
        }.bind(this);
      },
      hidden: true
    },
    {
      type: 'foam.ui.polymer.gen.FunctionWrapper',
      name: 'polymerFn',
      factory: function() {
        var fn = this.FunctionWrapper.create({
          name: 'Polymer'
        });
        fn.object[fn.name] = this.polymerFnImpl;
        return fn;
      },
      hidden: true
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/PolymerPrototypeImporter.js
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'PolymerPrototypeImporter',
  package: 'foam.ui.polymer.gen',
  extendsModel: 'foam.ui.polymer.gen.ComponentBuilderBase',

  requires: [
    'foam.ui.polymer.gen.Component',
    'foam.ui.polymer.gen.ComponentProperty',
    'foam.ui.polymer.gen.PolymerPrototype'
  ],

  imports: [
    'propertyDAO',
    'prototypeDAO'
  ],

  properties: [
    {
      model_: 'BooleanProperty',
      name: 'imported',
      defaultValue: false
    }
  ],

  methods: [
    {
      name: 'init',
      code: function() {
        this.run();
        return this.SUPER();
      }
    },
    {
      name: 'run',
      code: function() {
        if ( this.imported ) return;
        this.prototypeDAO.find(this.comp.tagName, {
          put: function(p) {
            this.importPrototype(p.proto);
          }.bind(this),
          error: function() {
            this.prototypeDAO.pipe({
              put: function(p) {
                if ( p.tagName !== this.comp.tagName ) return;
                this.importPrototype(p.proto);
              }.bind(this)
            });
          }.bind(this)
        });
      }
    },
    {
      name: 'importPrototype',
      code: function(p) {
        var proto = {};
        Object.getOwnPropertyNames(p).forEach(function(p, propName) {
          if ( propName !== 'publish' ) proto[propName] = p[propName];
        }.bind(this, p));
        if ( p.publish ) {
          Object.getOwnPropertyNames(p.publish).forEach(
              function(p, proto, propName) {
                if ( Object.getOwnPropertyNames(proto).some(function(pn1, pn2) {
                  return pn1 === pn2;
                }.bind(this, propName)) )
                  console.warn('Overwriting property: ', propName);
                proto[propName] = p.publish[propName];
              }.bind(this, p, proto));
        }
        Object.getOwnPropertyNames(proto).forEach(function(proto, propName) {
          this.putProperty(propName, proto[propName]);
        }.bind(this, proto));
      }
    },
    {
      name: 'putProperty',
      code: function(name, rawValue) {
        var propConfig = {
          url: this.comp.url,
          name: name
        };
        var value = this.getPropertyValue(rawValue);
        var propertyModel = this.getPropertyModel(value);
        if ( propertyModel ) propConfig.propertyModel = propertyModel;
        if ( value !== undefined ) {
          if ( propertyModel === '' ||
              propertyModel === 'FunctionProperty' ||
              propertyModel === 'ArrayProperty' ) {
                console.log('Building factory for ', propConfig.url, propConfig.name, propertyModel);
                var valueStr = propertyModel === 'FunctionProperty' ?
                    value.toString() : JSON.stringify(value);
                var evalStr = multiline(function() {/*
                  propConfig.factory = function() {
                    return */}) +
                    valueStr +
                    multiline(function() {/*;
                      };
                    */});
                eval(evalStr);
              } else {
                propConfig.defaultValue = value;
              }
        }
        this.propertyDAO.put(this.ComponentProperty.create(propConfig));
        this.imported = true;
      }
    },
    {
      name: 'getPropertyValue',
      code: function(value) {
        if ( value !== null && typeof value === 'object' &&
            Object.getOwnPropertyNames(value).some(function(name) {
              return name === 'value';
            }) ) { return value.value; }
        else       return value;
      }
    },
    {
      name: 'getPropertyModel',
      code: function(value) {
        if (value === undefined) return '';

        var typeOf = typeof value;
        if ( typeOf === 'boolean' ) {
          return 'BooleanProperty';
        } else if ( typeOf === 'number' ) {
          if ( Number.isInteger(value) ) {
            return 'IntProperty';
          } else {
            return 'FloatProperty';
          }
        } else if ( typeOf === 'string' ) {
          return 'StringProperty';
        } else if ( typeOf === 'function' ) {
          return 'FunctionProperty';
        } else if ( Array.isArray(value) ) {
          return 'ArrayProperty';
        } else {
          return '';
        }
      }
    }
  ]
});

//third_party/javascript/foam/v0_1/js/foam/ui/polymer/gen/View.js
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'View',
  package: 'foam.ui.polymer.gen',

  extendsModel: 'foam.ui.polymer.View',

  properties: [
    {
      model_: 'StringProperty',
      name: 'content',
      defaultValue: '',
      postSet: function() {
        if ( this.$ ) this.$.textContent = this.content;
      }
    }
  ],

  methods: [
    {
      name: 'postSet',
      code: function(propName) {
        if ( ! this.$ ) return;
        this.$[propName] = this[propName];
      }
    }
  ],

  templates: [
    function toHTML() {/*
      <{{{this.tagName}}} id="{{{this.id}}}"
      <% for ( var i = 0; i < this.POLYMER_PROPERTIES.length; ++i ) {
           var propName = this.POLYMER_PROPERTIES[i];
           if ( this[propName] ) { %>
             <%= propName %>
             <% if ( this[propName] !== true ) { %>
               ="<%= this[propName] %>"
             <% }
           }
         } %>
      >{{this.content}}
     </{{{this.tagName}}}>
    */}
  ]
});

