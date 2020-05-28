
/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

var DEBUG = DEBUG || false;
var _DOC_ = _DOC_ || false;
var FLAGS = FLAGS || {};
FLAGS.javascript = true;
FLAGS.debug = DEBUG;
FLAGS.documentation = _DOC_;

function FEATURE_ENABLED(labels) {
  for ( var i = 0 ; i < labels.length ; i++ ) {
    if ( FLAGS[labels[i]] ) return true;
  }
}

var GLOBAL = GLOBAL || this;

function MODEL(model) {
  var proto;

  function defineProperty(proto, key, map) {
    if ( ! map.value || proto === Object.prototype || proto === Array.prototype )
      Object.defineProperty.apply(this, arguments);
    else
      proto[key] = map.value;
  }

  if ( model.name ) {
    if ( ! GLOBAL[model.name] ) {
      if ( model.extends ) {
        GLOBAL[model.name] = { __proto__: GLOBAL[model.extends] };
      } else {
        GLOBAL[model.name] = {};
      }
    }
    proto = GLOBAL[model.name];
  } else {
    proto = model.extendsProto ? GLOBAL[model.extendsProto].prototype :
                                 GLOBAL[model.extendsObject] ;
  }

  if ( model.properties ) {
    for ( var i = 0 ; i < model.properties.length ; i++ ) {
      var p = model.properties[i];
      defineProperty(
        proto,
        p.name,
        { get: p.getter, enumerable: false });
    }
  }

  for ( key in model.constants )
    defineProperty(
      proto,
      key,
      { value: model.constants[key], writable: true, enumerable: false });

  if ( Array.isArray(model.methods) ) {
    for ( var i = 0 ; i < model.methods.length ; i++ ) {
      var m = model.methods[i];
      defineProperty(
        proto,
        m.name,
        { value: m, writable: true, enumerable: false });
    }
  } else {
    for ( var key in model.methods )
      defineProperty(
        proto,
        key,
        { value: model.methods[key], writable: true, enumerable: false });
  }
}

var MODEL0 = MODEL;

MODEL({
  extendsObject: 'GLOBAL',

  methods: [
    function memoize(f) {
      var cache = {};
      var g = function() {
        var key = argsToArray(arguments).toString();
        if ( ! cache.hasOwnProperty(key) ) cache[key] = f.apply(this, arguments);
        return cache[key];
      };
      g.name = f.name;
      return g;
    },

    function memoize1(f) {
      /** Faster version of memoize() when only dealing with one argument. **/
      var cache = {};
      var g = function(arg) {
        var key = arg ? arg.toString() : '';
        if ( ! cache.hasOwnProperty(key) ) cache[key] = f.call(this, arg);
        return cache[key];
      };
      g.name = f.name;
      return g;
    },

    function constantFn(v) {
      /* Create a function which always returns the supplied constant value. */
      return function() { return v; };
    },

    function latchFn(f) {
      var tripped = false;
      var val;
      /* Create a function which always returns the supplied constant value. */
      return function() {
        if ( ! tripped ) {
          tripped = true;
          val = f();
          f = undefined;
        }
        return val;
      };
    },

    function argsToArray(args) {
      var array = new Array(args.length);
      for ( var i = 0; i < args.length; i++ ) array[i] = args[i];
      return array;
    },

    function StringComparator(s1, s2) {
      if ( s1 == s2 ) return 0;
      return s1 < s2 ? -1 : 1;
    },

    function equals(a, b) {
      if ( a === b ) return true;
      if ( ! a || ! b ) return false;
      if ( a.equals ) return a.equals(b);
      if ( a.compareTo ) return a.compareTo(b) === 0;
      if ( b.compareTo ) return b.compareTo(a) === 0;
      return a == b;
    },

    function compare(a, b) {
      if ( a === b   ) return 0;
      if ( a == null ) return -1;
      if ( b == null ) return  1;
      if ( a.compareTo ) return  a.compareTo(b);
      if ( b.compareTo ) return -b.compareTo(a);
      return a > b ? 1 : -1 ;
    },

    function toCompare(c) {
      if ( Array.isArray(c) ) return CompoundComparator.apply(null, c);

      return c.compare ? c.compare.bind(c) : c;
    },

    function CompoundComparator() {
      var args = argsToArray(arguments);
      var cs = [];

      // Convert objects with .compare() methods to compare functions.
      for ( var i = 0 ; i < args.length ; i++ )
        cs[i] = toCompare(args[i]);

      var f = function(o1, o2) {
        for ( var i = 0 ; i < cs.length ; i++ ) {
          var r = cs[i](o1, o2);
          if ( r != 0 ) return r;
        }
        return 0;
      };

      f.toSQL = function() { return args.map(function(s) { return s.toSQL(); }).join(','); };
      f.toMQL = function() { return args.map(function(s) { return s.toMQL(); }).join(' '); };
      f.toBQL = function() { return args.map(function(s) { return s.toBQL(); }).join(' '); };
      f.toString = f.toSQL;

      return f;
    },

    function randomAct() {
      /**
       * Take an array where even values are weights and odd values are functions,
       * and execute one of the functions with propability equal to it's relative
       * weight.
       */
      // TODO: move this method somewhere better
      var totalWeight = 0.0;
      for ( var i = 0 ; i < arguments.length ; i += 2 ) totalWeight += arguments[i];

      var r = Math.random();

      for ( var i = 0, weight = 0 ; i < arguments.length ; i += 2 ) {
        weight += arguments[i];
        if ( r <= weight / totalWeight ) {
          arguments[i+1]();
          return;
        }
      }
    },

    // Workaround for crbug.com/258552
    function Object_forEach(obj, fn) {
      for ( var key in obj ) if ( obj.hasOwnProperty(key) ) fn(obj[key], key);
    },

    function predicatedSink(predicate, sink) {
      if ( predicate === TRUE || ! sink ) return sink;

      return {
        __proto__: sink,
        $UID: sink.$UID,
        put: function(obj, s, fc) {
          if ( sink.put && ( ! obj || predicate.f(obj) ) ) sink.put(obj, s, fc);
        },
        remove: function(obj, s, fc) {
          if ( sink.remove && ( ! obj || predicate.f(obj) ) ) sink.remove(obj, s, fc);
        },
        reset: function() {
          sink.reset && sink.reset();
        },
        toString: function() {
          return 'PredicatedSink(' +
            sink.$UID + ', ' + predicate + ', ' + sink + ')';
        }
      };
    },

    function limitedSink(count, sink) {
      var i = 0;
      return {
        __proto__: sink,
        $UID: sink.$UID,
        put: function(obj, s, fc) {
          if ( i++ >= count && fc ) {
            fc.stop();
          } else {
            sink.put(obj, s, fc);
          }
        }/*,
           eof: function() {
           sink.eof && sink.eof();
           }*/
      };
    },

    function skipSink(skip, sink) {
      var i = 0;
      return {
        __proto__: sink,
        $UID: sink.$UID,
        put: function(obj, s, fc) {
          if ( i++ >= skip ) sink.put(obj, s, fc);
        }
      };
    },

    function orderedSink(comparator, sink) {
      comparator = toCompare(comparator);
      return {
        __proto__: sink,
        $UID: sink.$UID,
        i: 0,
        arr: [],
        put: function(obj, s, fc) {
          this.arr.push(obj);
        },
        eof: function() {
          this.arr.sort(comparator);
          this.arr.select(sink);
        }
      };
    },

    function defineLazyProperty(target, name, definitionFn) {
      Object.defineProperty(target, name, {
        get: function() {
          var definition = definitionFn.call(this);
          Object.defineProperty(this, name, definition);
          return definition.get ?
            definition.get.call(this) :
            definition.value;
        },
        configurable: true
      });
    },

    // Function for returning multi-line strings from commented functions.
    // Ex. var str = multiline(function() { /* multi-line string here */ });
    function multiline(f) {
      if ( typeof f === 'string' ) return f;
      var s = f.toString();
      var start = s.indexOf('/*');
      var end   = s.lastIndexOf('*/');
      return s.substring(start+2, end);
    },

    // Computes the XY coordinates of the given node
    // relative to the containing elements.
    // TODO: findViewportXY works better... but do we need to find parent?
    function findPageXY(node) {
      var x = 0;
      var y = 0;
      var parent;

      while ( node ) {
        parent = node;
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }

      return [x, y, parent];
    },

    // Computes the XY coordinates of the given node
    // relative to the viewport.
    function findViewportXY(node) {
      var rect = node.getBoundingClientRect();
      return [rect.left, rect.top];
    },

    function nop() { /** NOP function. **/ },

    function stringtoutf8(str) {
      var res = [];
      for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);

        var count = 0;
        if ( code < 0x80 ) {
          res.push(code);
          continue;
        }

        // while(code > (0x40 >> count)) {
        //     res.push(code & 0x3f);
        //     count++;
        //     code = code >> 7;
        // }
        // var header = 0x80 >> count;
        // res.push(code | header)
      }
      return res;
    },

    function createGUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }
  ]
});

var labelize = memoize1(function(str) {
  if ( str === '' ) return str;
  return capitalize(str.replace(/[a-z][A-Z]/g, function (a) { return a.charAt(0) + ' ' + a.charAt(1); }));
});

var constantize = memoize1(function(str) {
  // switchFromCamelCaseToConstantFormat to SWITCH_FROM_CAMEL_CASE_TO_CONSTANT_FORMAT
  // TODO: add property to specify constantization. For now catch special case to avoid conflict with context this.X and this.Y.
  if ( str === 'x' ) return 'X_';
  if ( str === 'y' ) return 'Y_';
  if ( str === '$' ) return '$_';
  return str.replace(/[a-z][^0-9a-z_]/g, function(a) {
    return a.substring(0,1) + '_' + a.substring(1,2);
  }).toUpperCase();
});

var capitalize = memoize1(function(str) {
  // switchFromProperyName to //SwitchFromPropertyName
  return str[0].toUpperCase() + str.substring(1);
});

var camelize = memoize1(function (str) {
  // change css-name-style or 'space separated words' to camelCase
  var ret = str.replace (/(?:[-\s_])(\w)/g, function (_, a) {
    return a ? a.toUpperCase () : '';
  });
  return ret[0].toLowerCase() + ret.substring(1);
});

var daoize = memoize1(function(str) {
  // Changes ModelName to modelNameDAO for relationships, reference properties, etc.
  return str[0].toLowerCase() + str.substring(1) + 'DAO';
});

// Replaces . with -, for eg. foam.u2.md.Input -> foam-u2-md-Input
var cssClassize = memoize1(function (str) {
  return str.replace(/\./g, '-');
});


MODEL({
  extendsProto: 'Object',

  properties: [
    {
      name: '$UID',
      getter: (function() {
        var id = 1;
        return function() {
          if ( Object.hasOwnProperty.call(this, '$UID__') ) return this.$UID__;
          this.$UID__ = id;
          id++;
          return this.$UID__;
        };
      })()
    }
  ],

  methods: [
    function become(other) {
      var local = Object.getOwnPropertyNames(this);
      for ( var i = 0; i < local.length; i++ ) {
        delete this[local[i]];
      }

      var remote = Object.getOwnPropertyNames(other);
      for ( i = 0; i < remote.length; i++ ) {
        Object.defineProperty(
          this,
          remote[i],
          Object.getOwnPropertyDescriptor(other, remote[i]));
      }
      this.__proto__ = other.__proto__;
    }
  ]
});


MODEL({
  extendsProto: 'Array',

  constants: {
    oldForEach_: Array.prototype.forEach
  },

  methods: [
    function clone() { return this.slice(); },

    function deepClone() {
      var a = this.clone();
      for ( var i = 0 ; i < a.length ; i++ ) {
        var o = a[i];
        if ( o ) {
          if ( o.deepClone ) {
            a[i] = o.deepClone();
          } else if ( o.clone ) {
            a[i] = o.clone();
          }
        }
      }
      return a;
    },

    function forEach(f, opt_this) {
      /* Replace Array.forEach with a faster version. */
      if ( ! this || ! f || opt_this ) return this.oldForEach_.call(this, f, opt_this);

      var l = this.length;
      for ( var i = 0 ; i < l ; i++ ) f(this[i], i, this);
    },

    function diff(other) {
      var added = other.slice(0);
      var removed = [];
      for ( var i = 0 ; i < this.length ; i++ ) {
        for ( var j = 0 ; j < added.length ; j++ ) {
          if ( this[i].compareTo(added[j]) == 0 ) {
            added.splice(j, 1);
            j--;
            break;
          }
        }
        if ( j == added.length ) removed.push(this[i]);
      }
      return { added: added, removed: removed };
    },

    function binaryInsert(item) {
      /* binaryInsert into a sorted array, removing duplicates */
      var start = 0;
      var end = this.length-1;

      while ( end >= start ) {
        var m = start + Math.floor((end-start) / 2);
        var c = item.compareTo(this[m]);
        if ( c == 0 ) return this; // already there, nothing to do
        if ( c < 0 ) { end = m-1; } else { start = m+1; }
      }

      this.splice(start, 0, item);

      return this;
    },

    function union(other) {
      return this.concat(
        other.filter(function(o) { return this.indexOf(o) == -1; }.bind(this)));
    },

    function intersection(other) {
      return this.filter(function(o) { return other.indexOf(o) != -1; });
    },

    function intern() {
      for ( var i = 0 ; i < this.length ; i++ )
        if ( this[i].intern ) this[i] = this[i].intern();

      return this;
    },

    function compareTo(other) {
      if ( this.length !== other.length ) return -1;

      for ( var i = 0 ; i < this.length ; i++ ) {
        var result = this[i].compareTo(other[i]);
        if ( result !== 0 ) return result;
      }
      return 0;
    },

    // Clone this Array and remove 'v' (only 1 instance)
    // TODO: make faster by copying in one pass, without splicing
    function deleteF(v) {
      var a = this.clone();
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( a[i] === v ) {
          a.splice(i, 1);
          break;
        }
      }
      return a;
    },

    // Remove 'v' from this array (only 1 instance removed)
    // return true iff the value was removed
    function deleteI(v) {
      for ( var i = 0 ; i < this.length ; i++ ) {
        if ( this[i] === v ) {
          this.splice(i, 1);
          return true;
        }
      }
      return false;
    },

    // Clone this Array and remove first object where predicate 'p' returns true
    function removeF(p) {
      var a = [];
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( p.f(a[i]) ) {
          // Copy the rest of the array since we only want to remove one match
          for ( i++ ; i < a.length ; i++ ) a.push(a[i]);
        }
      }
      return a;
    },

    // Remove first object in this array where predicate 'p' returns true
    // return true iff the value was removed
    function removeI(p) {
      for ( var i = 0 ; i < this.length ; i++ ) {
        if ( p.f(this[i]) ) {
          this.splice(i, 1);
          return true;
        }
      }
      return false;
    },

    function pushF(obj) {
      var a = this.clone();
      a.push(obj);
      return a;
    },

    function spliceF(start, end /*, args */) {
      /** Functional version of splice. **/
      var r = [], i;

      for ( i = 0   ; i < start             ; i++ ) r.push(this[i]);
      for ( i = 2   ; i < arguments.length  ; i++ ) r.push(arguments[i]);
      for ( i = start+end ; i < this.length ; i++ ) r.push(this[i]);

      return r;
    },

    function fReduce(comparator, arr) {
      compare = toCompare(comparator);
      var result = [];

      var i = 0;
      var j = 0;
      var k = 0;
      while ( i < this.length && j < arr.length ) {
        var a = compare(this[i], arr[j]);
        if ( a < 0 ) {
          result[k++] = this[i++];
          continue;
        }
        if ( a == 0) {
          result[k++] = this[i++];
          result[k++] = arr[j++];
          continue;
        }
        result[k++] = arr[j++];
      }

      if ( i != this.length ) result = result.concat(this.slice(i));
      if ( j != arr.length ) result = result.concat(arr.slice(j));

      return result;
    },

    function pushAll(arr) {
      /**
       * Push an array of values onto an array.
       * @param arr array of values
       * @return new length of this array
       */
      // TODO: not needed, port and replace with pipe()
      this.push.apply(this, arr);
      return this.length;
    },

    function mapFind(map) {
      /**
       * Search for a single element in an array.
       * @param predicate used to determine element to find
       */
      for ( var i = 0 ;  i < this.length ; i++ ) {
        var result = map(this[i], i);
        if ( result ) return result;
      }
    },

    function mapProp(prop) {
      // Called like myArray.mapProp('name'), that's equivalent to:
      // myArray.map(function(x) { return x.name; });
      return this.map(function(x) { return x[prop]; });
    },

    function mapCall() {
      var args = Array.prototype.slice.call(arguments, 0);
      var func = args.shift();
      return this.map(function(x) { return x[func] && x[func].apply(x[func], args); });
    }
  ],

  properties: [
    {
      name: 'memento',
      getter: function() {
        throw "Array's can not be memorized properly as a memento.";
      }
    }
  ]
});


MODEL({
  extendsProto: 'String',

  methods: [
    function indexOfIC(a) {
      return ( a.length > this.length ) ? -1 : this.toUpperCase().indexOf(a.toUpperCase());
    },

    function equals(other) { return this.compareTo(other) === 0; },

    function equalsIC(other) { return other && this.toUpperCase() === other.toUpperCase(); },

    // deprecated, use global instead
    function capitalize() { return this.charAt(0).toUpperCase() + this.slice(1); },

    // deprecated, use global instead
    function labelize() {
      return this.replace(/[a-z][A-Z]/g, function (a) { return a.charAt(0) + ' ' + a.charAt(1); }).capitalize();
    },

    function compareTo(o) { return ( o == this ) ? 0 : this < o ? -1 : 1; },

    // Polyfil
    String.prototype.startsWith || function startsWith(a) {
      // This implementation is very slow for some reason
      return 0 == this.lastIndexOf(a, 0);
    },

    // Polyfil
    String.prototype.endsWith || function endsWith(a) {
      return (this.length - a.length) == this.lastIndexOf(a);
    },

    function startsWithIC(a) {
      if ( a.length > this.length ) return false;
      var l = a.length;
      for ( var i = 0 ; i < l; i++ ) {
        if ( this[i].toUpperCase() !== a[i].toUpperCase() ) return false;
      }
      return true;
    },

    function put(obj) { return this + obj.toJSON(); },

    (function() {
      var map = {};

      return function intern() {
        /** Convert a string to an internal canonical copy. **/
        return map[this] || (map[this] = this.toString());
      };
    })(),

    function hashCode() {
      var hash = 0;
      if ( this.length == 0 ) return hash;

      for (i = 0; i < this.length; i++) {
        var code = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash &= hash;
      }

      return hash;
    }
  ]
});


MODEL({
  extendsProto: 'Function',

  methods: [
    /**
     * Replace Function.bind with a version
     * which is ~10X faster for the common case
     * where you're only binding 'this'.
     **/
    (function() {
      var oldBind    = Function.prototype.bind;
      var simpleBind = function(f, self) {
        return function() { return f.apply(self, arguments); };
        /*
        var ret = function() { return f.apply(self, arguments); };
        ret.toString = function bind() {
          return f.toString();
        };
        return ret;
        */
      };

      return function bind(arg) {
        if ( arguments.length == 1 ) return simpleBind(this, arg);
        var args = new Array(arguments.length);
        for ( var i = 0 ; i < arguments.length ; i++ ) args[i] = arguments[i];
        return oldBind.apply(this, args);
      };
    })(),

    function equals(o) { return this === o; },

    function compareTo(o) {
      return this === o ? 0 : ( this.name.compareTo(o.name) || 1 );
    },

    function o(f2) {
      var f1 = this;
      return function() {
        return f1.call(this, f2.apply(this, argsToArray(arguments)));
      };
    }
  ]
});


MODEL({
  extendsObject: 'Math',

  methods: [
    function sign(n) { return n > 0 ? 1 : -1; }
  ]
});


MODEL({
  extendsProto: 'Date',

  methods: [
    function toRelativeDateString(){
      var seconds = Math.floor((Date.now() - this.getTime())/1000);

      if ( seconds < 60 ) return 'moments ago';

      var minutes = Math.floor((seconds)/60);

      if ( minutes == 1 ) return '1 minute ago';

      if ( minutes < 60 ) return minutes + ' minutes ago';

      var hours = Math.floor(minutes/60);
      if ( hours == 1 ) return '1 hour ago';

      if ( hours < 24 ) return hours + ' hours ago';

      var days = Math.floor(hours / 24);
      if ( days == 1 ) return '1 day ago';

      if ( days < 7 ) return days + ' days ago';

      if ( days < 365 ) {
        var year = 1900+this.getYear();
        var noyear = this.toDateString().replace(' ' + year, '');
        return noyear.substring(4);
      }

      return this.toDateString().substring(4);
    },

    function equals(o) {
      if ( ! o ) return false;
      if ( ! o.getTime ) return false;
      return this.getTime() === o.getTime();
    },

    function compareTo(o){
      if ( o === this ) return 0;
      if ( ! o ) return 1;
      var d = this.getTime() - o.getTime();
      return d == 0 ? 0 : d > 0 ? 1 : -1;
    },

    function toMQL() {
      return this.getFullYear() + '/' + (this.getMonth() + 1) + '/' + this.getDate();
    },

    function toBQL() {
      var str = this.toISOString(); // eg. 2014-12-04T16:37:33.420Z
      return str.substring(0, str.indexOf('.')); // eg. 2014-12-04T16:37:33
    }
  ]
});


MODEL({
  extendsProto: 'Number',

  methods: [
    function compareTo(o) { return ( o == this ) ? 0 : this < o ? -1 : 1; },
  ]
});


MODEL({
  extendsProto: 'Boolean',

  methods: [
    function compareTo(o) { return (this.valueOf() ? 1 : 0) - (o ? 1 : 0); }
  ]
});


MODEL({
  extendsProto: 'RegExp',

  methods: [
    function quote(str) {
      return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }
  ]
});


console.log.json = function() {
   var args = [];
   for ( var i = 0 ; i < arguments.length ; i++ ) {
     var arg = arguments[i];
     args.push(arg && arg.toJSON ? arg.toJSON() : arg);
   }
   console.log.apply(console, args);
};

console.log.str = function() {
   var args = [];
   for ( var i = 0 ; i < arguments.length ; i++ ) {
     var arg = arguments[i];
     args.push(arg && arg.toString ? arg.toString() : arg);
   }
   console.log.apply(console, args);
};

// Promote 'console.log' into a Sink
console.log.put          = console.log.bind(console);
console.log.remove       = console.log.bind(console, 'remove: ');
console.log.error        = console.log.bind(console, 'error: ');
console.log.json.put     = console.log.json.bind(console);
console.log.json.reduceI = console.log.json.bind(console, 'reduceI: ');
console.log.json.remove  = console.log.json.bind(console, 'remove: ');
console.log.json.error   = console.log.json.bind(console, 'error: ');
console.log.str.put      = console.log.str.bind(console);
console.log.str.remove   = console.log.str.bind(console, 'remove: ');
console.log.str.error    = console.log.str.bind(console, 'error: ');

document.put = function(obj) {
  if ( obj.write ) {
    obj.write(this.X);
  } else {
    this.write(obj.toString());
  }
};


// Promote webkit apis; fallback on Node.js alternatives
// TODO(kgr): this should be somewhere web specific

window.requestFileSystem     = window.requestFileSystem ||
  window.webkitRequestFileSystem;
window.requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.setImmediate;
if ( window.Blob ) {
  Blob.prototype.slice = Blob.prototype.slice || Blob.prototype.webkitSlice;
}

if ( window.XMLHttpRequest ) {
  /**
   * Add an afunc send to XMLHttpRequest
   */
  XMLHttpRequest.prototype.asend = function(ret, opt_data) {
    var xhr = this;
    xhr.onerror = function() {
      console.log('XHR Error: ', arguments);
    };
    xhr.onloadend = function() {
      ret(xhr.response, xhr);
    };
    xhr.send(opt_data);
  };
}

String.fromCharCode = (function() {
  var oldLookup = String.fromCharCode;
  var lookupTable = [];
  return function(a) {
    if ( arguments.length == 1 ) return lookupTable[a] || (lookupTable[a] = oldLookup(a));
    var result = '';
    for ( var i = 0 ; i < arguments.length ; i++ )
      result += lookupTable[arguments[i]] || (lookupTable[arguments[i]] = oldLookup(arguments[i]));
    return result;
  };
})();

var MementoProto = {};
Object.defineProperty(MementoProto, 'equals', {
  enumerable: false,
  configurable: true,
  value: function(o) {
    var keys = Object.keys(this);
    var otherKeys = Object.keys(o);
    if ( keys.length != otherKeys.length ) {
      return false;
    }
    for ( var i = 0 ; i < keys.length ; i++ ) {
      if ( ! equals(this[keys[i]], o[keys[i]]) )
        return false;
    }
    return true;
  }
});

/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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
// TODO: time-travelling debugger, ala:
//    "Debugging Standard ML Without Reverse Engineering"

MODEL({
  extendsProto: 'Function',

  methods: [
    function abind(self) {
      /** Adapt a synchronous method into a psedo-afunc. **/
      return function(ret) { this.apply(self, arguments); ret(); }.bind(this);
    },

    function ao(f2) {
      /** Async Compose (like Function.prototype.O, but for async functions **/
      var f1 = this;
      return function(ret) {
        var args = argsToArray(arguments);
        args[0] = f1.bind(this, ret);
        f2.apply(this, args);
      }
    },

    function aseq(f2) { return f2.ao(this); }
  ]
});


MODEL({
  // TODO(kgr): put in a package rather than global, maybe foam.async

  extendsObject: 'GLOBAL',

  methods: [
    /** NOP afunc. **/
    function anop(ret) { ret && ret(undefined); },

    /** afunc log. **/
    function alog() {
      var args = arguments;
      return function (ret) {
        console.log.apply(console, args);
        ret && ret.apply(this, [].slice.call(arguments, 1));
      };
    },

    /** console.profile an afunc. **/
    function aprofile(afunc) {
      return function(ret) {
        var a = argsToArray(arguments);
        console.profile('aprofile');
        var ret2 = function () {
          console.profileEnd();
          ret && ret(arguments);
        };
        aapply_(afunc, ret2, a);
      };
    },

    /** Create an afunc which always returns the supplied constant value. **/
    function aconstant(v) { return function(ret) { ret && ret(v); }; },

    /** Execute the supplied afunc N times. **/
    function arepeat(n, afunc) {
      if ( ! n ) return anop;
      return function(ret) {
        var a = argsToArray(arguments);
        a.splice(1, 0, 0, n); // insert (0, n) after 'ret' argument
        var next = atramp(function() {
          if ( a[1] == n-1 ) { a[0] = ret; afunc.apply(this, a); return; };
          afunc.apply(this, a);
          a[1]++;
        });

        a[0] = next;
        next.apply(this, a);
      };
    },

    /** Execute the supplied afunc on each element of an array. */
    function aforEach(arr, afunc) {
      // TODO: implement
    },

    /** Execute the supplied afunc until cond() returns false. */
    function awhile(cond, afunc) {
      return function(ret) {
        var a = argsToArray(arguments);

        var g = function() {
          if ( ! cond() ) { ret.apply(undefined, arguments); return; }
          afunc.apply(this, a);
        };

        a[0] = g;
        g.apply(this, a);
      };
    },

    /** Execute the supplied afunc if cond. */
    function aif(cond, afunc, aelse) {
      return function(ret) {
        if ( typeof cond === 'function' ?
            cond.apply(this, argsToArray(arguments).slice(1)) : cond ) {
          afunc.apply(this, arguments);
        } else {
          if ( aelse ) aelse.apply(this, arguments);
          else ret();
        }
      };
    },

    /** Execute afunc if the acond returns true */
    function aaif(acond, afunc, aelse) {
      return function(ret) {
        var args = argsToArray(arguments);
        args[0] = function(c) {
          args[0] = ret;
          if ( c ) afunc.apply(null, args);
          else if ( aelse ) aelse.apply(null, args);
          else ret();
        };
        acond.apply(null, args);
      }
    },

    /** Time an afunc. **/
    (function() {
      // Add a unique suffix to timer names in case multiple instances
      // of the same timing are active at once.
      var id = 1;
      var activeOps = {};
      return function atime(str, afunc, opt_endCallback, opt_startCallback) {
        var name = str;
        return aseq(
          function(ret) {
            if ( activeOps[str] ) {
              name += '-' + id++;
              activeOps[str]++;
            } else {
              activeOps[str] = 1;
            }
            var start = performance.now();
            if ( opt_startCallback ) opt_startCallback(name);
            if ( ! opt_endCallback ) console.time(name);
            ret.apply(null, [].slice.call(arguments, 1));
          },
          afunc,
          function(ret) {
            activeOps[str]--;
            if ( opt_endCallback ) {
              var end = performance.now();
              opt_endCallback(name, end - start);
            } else {
              console.timeEnd(name);
            }
            ret && ret.apply(null, [].slice.call(arguments, 1));
          }
        );
      };
    })(),

    /** Time an afunc and record its time as a metric. **/
    function ametric() {
      return this.atime.apply(this, arguments);
    },

    /** Sleep for the specified delay. **/
    function asleep(ms) {
      return function(ret) {
        window.setTimeout(ret, ms);
      };
    },

    function ayield() {
      return function(ret) {
        window.setTimeout(ret, 0);
      };
    },

    /** Create a future value. **/
    function afuture() {
      var set     = false;
      var values  = undefined;
      var waiters = [];

      return {
        isSet: function() { return set; },
        set: function() {
          if ( set ) {
            console.log('ERROR: redundant set on future');
            return;
          }
          values = arguments;
          set = true;
          for (var i = 0 ; i < waiters.length; i++) {
            waiters[i].apply(null, values);
          }
          waiters = undefined;
          return this;
        },

        get: function(ret) {
          if ( set ) { ret.apply(null, values); return; }
          waiters.push(ret);
        }
      };
    },

    function aapply_(f, ret, args) {
      args.unshift(ret);
      f.apply(this, args);
    },

    /**
     * A request queue that reduces each request against the pending requests.
     * Also limits the queue to a maximum size and operates in a LIFO manner.
     * TODO: This could probably be split into decorators and integrated with asynchronized.
     */
    function arequestqueue(f, opt_lock, opt_max) {
      var lock = opt_lock || {};
      if ( ! lock.q ) { lock.q = []; lock.active = null; }

      var onExit = function() {
        var next = lock.active = lock.q.pop();

        if ( next ) {
          setTimeout(function() { f(onExit, next); }, 0);
        }
      };

      var reduceDown = function(o, q) {
        for ( var i = q.length -1 ; i >= 0 ; i-- ) {
          var result = o.reduce(q[i]);
          if ( result ) {
            q.splice(i, 1);
            reduceDown(result, q);
            break;
          }
        }
        q.push(o);
      }

      return function(o) {
        if ( lock.active ) {
          // If the next request reduces into the active one, then forget about it.
          var first = o.reduce(lock.active);
          if ( first && first.equals(lock.active) ) return;
        }

        reduceDown(o, lock.q, lock.q.length - 1);
        if ( lock.q.length > opt_max ) lock.q.length = opt_max;

        if ( ! lock.active ) onExit();
      };
    },

    /**
     * A Binary Semaphore which only allows the delegate function to be
     * executed by a single thread of execution at once.
     * Like Java's synchronized blocks.
     * @param opt_lock an empty map {} to be used as a lock
     *                 sharable across multiple asynchronized instances
     **/
    function asynchronized(f, opt_lock) {
      var lock = opt_lock || {};
      if ( ! lock.q ) { lock.q = []; lock.active = false; }

      // Decorate 'ret' to check for blocked continuations.
      function onExit(ret) {
        return function() {
          var next = lock.q.shift();

          if ( next ) {
            setTimeout(next, 0);
          } else {
            lock.active = false;
          }

          ret();
        };
      }

      return function(ret) {
        // Semaphore is in use, so just queue f for execution when the current
        // continuation exits.
        if ( lock.active ) {
          lock.q.push(function() { f(onExit(ret)); });
          return;
        }

        lock.active = true;

        f(onExit(ret));
      };
    },

    /**
     * Execute an optional timeout function and abort the continuation
     * of the delegate function, if it doesn't finish in the specified
     * time.
     **/
    // Could be generalized into an afirst() combinator which allows
    // for the execution of multiple streams but only the first to finish
    // gets to continue.
    function atimeout(delay, f, opt_timeoutF) {
      return function(ret) {
        var timedOut  = false;
        var completed = false;
        setTimeout(function() {
          if ( completed ) return;
          timedOut = true;
          console.log('timeout');
          opt_timeoutF && opt_timeoutF();
        }, delay);

        f(aseq(
          function(ret) {
            if ( ! timedOut ) completed = true;
            if ( completed ) ret();
          }, ret));
      };
    },

    /**
     * Memoize an async function.
     **/
    function amemo(f, opt_ttl) {
      var memoized = false;
      var values;
      var waiters;
      var age = 0;
      var pending = false

      return function(ret) {
        if ( memoized ) {
          ret.apply(null, values);
          if ( opt_ttl != undefined && ! pending && Date.now() > age + opt_ttl ) {
            pending = true;
            f(function() {
              values = arguments;
              age = Date.now();
              pending = false;
            })
          }
          return;
        }

        var first = ! waiters;

        if ( first ) waiters = [];

        waiters.push(ret);

        if ( first ) {
          f(function() {
            values = arguments;
            age = Date.now();
            for (var i = 0 ; i < waiters.length; i++) {
              waiters[i] && waiters[i].apply(null, values);
            }
            if ( opt_ttl == undefined ) f = undefined;
            memoized = true;
            waiters = undefined;
          });
        }
      };
    },

    function amemo1(afunc) {
      var cache = {};
      return function(ret, arg) {
        var key = arg ? arg.toString() : '';

        if ( ! cache[key] ) {
          cache[key] = afuture();
          afunc(cache[key].set, arg);
        }

        cache[key].get(ret);
      };
    },

    /**
     * Decorates an afunc to merge all calls to one active execution of the
     * delegate.
     * Similar to asynchronized, but doesn't queue up a number of calls
     * to the delegate.
     */
    function amerged(f) {
      var waiters;

      return function(ret) {
        var first = ! waiters;

        if ( first ) {
          waiters = [];
          var args = argsToArray(arguments);
        }

        waiters.push(ret);

        if ( first ) {
          args[0] = function() {
            var calls = waiters;
            waiters = undefined;
            for (var i = 0 ; i < calls.length; i++) {
              calls[i] && calls[i].apply(null, arguments);
            }
          }

          f.apply(null, args);
        }
      };
    },

    /**
     * Decorates an afunc to merge calls.
     * NB: This does not return an afunc itself!
     *
     * Immediately fires on the first call. If more calls come in while the first is
     * active, they are merged into one subsequent call with the latest arguments.
     * Once the first call is complete, the afunc will fire again if any further
     * calls have come in. If there are no more, then it will rest.
     *
     * The key difference from amerged is that it makes one call to the afunc but
     * calls its own ret once for *each* call it has received. This calls only once.
     */
    function mergeAsync(f) {
      var active = false;
      var args;

      return function() {
        if ( active ) {
          args = argsToArray(arguments);
          return;
        }

        active = true;

        // Otherwise, call f with the arguments I've been given, plus the ret
        // handler.
        var ret = function() {
          // If args is set, we have received further calls.
          if ( args ) {
            args.unshift(ret);
            f.apply(null, args);
            args = undefined;
          } else {
            active = false;
          }
        };

        var a = argsToArray(arguments);
        a.unshift(ret);
        f.apply(null, a);
      };
    },

    /** Compose a variable number of async functions. **/
    function ao(/* ... afuncs */) {
      var ret = arguments[arguments.length-1];

      for ( var i = 0 ; i < arguments.length-1 ; i++ ) {
        ret = arguments[i].ao(ret);
      }

      return ret;
    },

    /** Compose a variable number of async functions. **/
    function aseq(/* ... afuncs */) {
      if ( arguments.lenth == 0 ) return anop;

      var f = arguments[arguments.length-1];

      for ( var i = arguments.length-2 ; i >= 0 ; i-- )
        f = arguments[i].aseq(i % 100 == 99 ? atramp(f) : f);

      return f;
    },

    /**
     * Create a function which executes several afunc's in parallel and passes
     * their joined return values to an optional afunc.
     *
     * Usage: apar(f1,f2,f3)(opt_afunc, opt_args)
     * @param opt_afunc called with joined results after all afuncs finish
     * @param opt_args passed to all afuncs
     **/
    function apar(/* ... afuncs */) {
      var aargs = [];
      var count = 0;
      var fs = arguments;

      return function(ret /* opt_args */) {
        if ( fs.length == 0 ) {
          ret && ret();
          return;
        }
        var opt_args = Array.prototype.splice.call(arguments, 1);
        var ajoin = function (i) {
          aargs[i] = Array.prototype.splice.call(arguments, 1);
          if ( ++count == fs.length ) {
            var a = [];
            for ( var j = 0 ; j < fs.length ; j++ )
              for ( var k = 0 ; k < aargs[j].length ; k++ )
                a.push(aargs[j][k]);
            ret && ret.apply(null, a);
          }
        };

        for ( var i = 0 ; i < fs.length ; i++ )
          fs[i].apply(null, [ajoin.bind(null, i)].concat(opt_args));
      };
    },

    /** Convert the supplied afunc into a trampolined-afunc. **/
    (function() {
      var active = false;
      var jobs = [];

      return function atramp(afunc) {
        return function() {
          jobs.push([afunc, arguments]);
          if ( ! active ) {
            console.assert( jobs.length <= 1, 'atramp with multiple jobs');
            active = true;
            var job;
            // Take responsibility for bouncing
            while ( (job = jobs.pop()) != null ) {
              job[0].apply(this, job[1]);
            }
            active = false;
          }
        };
      };
    })(),

    /** Execute the supplied afunc concurrently n times. **/
    function arepeatpar(n, afunc) {
      return function(ret /* opt_args */) {
        if ( n === 0 ) {
          ret && ret();
          return;
        }
        var aargs = [];
        var count = 0;

        var opt_args = Array.prototype.splice.call(arguments, 1);
        var ajoin = function (i) {
          // aargs[i] = Array.prototype.splice.call(arguments, 1);
          if ( ++count == n ) {
            var a = [];
            /*
              for ( var j = 0 ; j < n ; j++ )
              for ( var k = 0 ; k < aargs[j].length ; k++ )
              a.push(aargs[j][k]);
            */
            ret && ret.apply(null, a);
          }
        };

        for ( var i = 0 ; i < n ; i++ ) {
          afunc.apply(null, [ajoin.bind(null, i)].concat([i, n]).concat(opt_args));
        }
      };
    },

    function axhr(url, opt_op, opt_params) {
      var op = opt_op || "GET";
      var params = opt_params || [];

      return function(ret) {
        var xhr = new XMLHttpRequest();
        xhr.open(op, url);
        xhr.asend(function(json) { ret(JSON.parse(json)); }, params && params.join('&'));
      };
    },

    function futurefn(future) {
      return function() {
        var args = arguments;
        future.get(function(f) {
          f.apply(undefined, args);
        });
      };
    },

    function adelay(afunc, delay) {
      var queue = [];
      var timeout;

      function pump() {
        if ( timeout ) return;
        if ( ! queue.length ) return;

        var top = queue.shift();
        var f = top[0];
        var args = top[1];
        var ret = args[0];
        args[0] = function() {
          ret.apply(null, arguments);
          pump();
        };

        timeout = setTimeout(function() {
          timeout = 0;
          f.apply(null, args);
        }, delay)
      }

      return function() {
        var args = arguments;

        queue.push([
          afunc,
          args
        ]);

        pump();
      };
    },

    function adebugger(fn) {
      return function(ret) {
        debugger
        fn.apply(null, arguments);
      };
    }
  ]
});


// TODO(kgr): Move somewhere better.
var __JSONP_CALLBACKS__ = {};
var wrapJsonpCallback = (function() {
  var nextID = 0;

  return function(ret, opt_nonce) {
    var id = 'c' + (nextID++);
    if ( opt_nonce ) id += Math.floor(Math.random() * 0xffffff).toString(16);

    var cb = __JSONP_CALLBACKS__[id] = function(data) {
      delete __JSONP_CALLBACKS__[id];

      // console.log('JSONP Callback', id, data);

      ret && ret.call(this, data);
    };
    cb.id = id;

    return cb;
  };
})();

// Note: this doesn't work for packaged-apps
var ajsonp = function(url, params) {
  return function(ret) {
    var cb = wrapJsonpCallback(ret);

    var script = document.createElement('script');
    script.src = url + '?callback=__JSONP_CALLBACKS__.' + cb.id + (params ? '&' + params.join('&') : '');
    script.onload = function() {
      document.body.removeChild(this);
    };
    script.onerror = function() {
      cb(null);
      document.body.removeChild(this);
    };
    document.body.appendChild(script);
  };
};

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
/*
  var ErrorReportingPS = {
  create: function(delegate, opt_pos) {
  console.log('ERPS:',delegate.head);
  return {
  __proto__: this,
  pos: opt_pos || 0,
  delegate: delegate
  };
  },
  get head() {
  console.log('head:',this.pos, this.delegate.head);
  return this.delegate.head;
  },
  get tail() {
  return this.tail_ || (this.tail_ = this.create(this.delegate.tail, this.pos+1));
  },
  get value() {
  return this.delegate.value;
  },
  setValue: function(value) {
  console.log('setValue:',value);
  //    return ErrorReportingPS.create(this.delegate.setValue(value));
  this.delegate = this.delegate.setValue(value);
  return this;
  }
  };
*/

/** String PStream **/
var StringPS = {
  create: function(str) {
    var o = Object.create(this);
    o.pos = 0;
    o.str_ = [str];
    o.tail_ = [];
    return o;
  },
  set str(str) { this.str_[0] = str; },
  get head() { return this.pos >= this.str_[0].length ? null : this.str_[0].charAt(this.pos); },
  // TODO(kgr): next line is slow because it can't bet JITed, fix.
  get value() { return this.hasOwnProperty('value_') ? this.value_ : this.str_[0].charAt(this.pos-1); },
  get tail() {
    if ( ! this.tail_[0] ) {
      var tail = Object.create(this.__proto__);
      tail.str_ = this.str_;
      tail.pos = this.pos+1;
      tail.tail_ = [];
      this.tail_[0] = tail;
    }
    return this.tail_[0];
  },
  setValue: function(value) {
    var ret = Object.create(this.__proto__);

    ret.str_ = this.str_;
    ret.pos = this.pos;
    ret.tail_ = this.tail_;
    ret.value_ = value;

    return ret;
  },
  toString: function() {
    return this.str_[0].substring(this.pos);
  }
};

function prep(arg) {
  if ( typeof arg === 'string' ) return literal(arg);

  return arg;
}

function prepArgs(args) {
  for ( var i = 0 ; i < args.length ; i++ ) {
    args[i] = prep(args[i]);
  }

  return args;
}

function range(c1, c2) {
  var f = function(ps) {
    if ( ! ps.head ) return undefined;
    if ( ps.head < c1 || ps.head > c2 ) return undefined;
    return ps.tail.setValue(ps.head);
  };

  f.toString = function() { return 'range(' + c1 + ', ' + c2 + ')'; };

  return f;
}

var literal = (function() {
  // Cache of literal parsers, which repeat a lot
  var cache = {};

  return function(str, opt_value) {
    if ( ! opt_value && cache[str] ) return cache[str];

    var f;
    if ( str.length === 1 ) {
      f = function(ps) {
      return str === ps.head ? ps.tail.setValue(opt_value || str) : undefined;
    };
    } else {
      f = function(ps) {
        for ( var i = 0 ; i < str.length ; i++, ps = ps.tail ) {
          if ( str.charAt(i) !== ps.head ) return undefined;
        }

        return ps.setValue(opt_value || str);
      };
    }

    f.toString = function() { return '"' + str + '"'; };

    if ( ! opt_value ) return cache[str] = f;

    return f;
  };
})();

/**
 * Case-insensitive String literal.
 * Doesn't work for Unicode characters.
 **/
function literal_ic(str, opt_value) {
  str = str.toLowerCase();

  var f = function(ps) {
    for ( var i = 0 ; i < str.length ; i++, ps = ps.tail ) {
      if ( ! ps.head || str.charAt(i) !== ps.head.toLowerCase() ) return undefined;
    }

    return ps.setValue(opt_value || str);
  };

  f.toString = function() { return '"' + str + '"'; };

  return f;
}

var alphaChar    = alt(range('a','z'), range('A', 'Z'));
var alphaNumChar = alt(alphaChar, range('0', '9'));
var wordChar     = alt(alphaNumChar, '_');

function anyChar(ps) {
  return ps.head ? ps.tail/*.setValue(ps.head)*/ : undefined;
}

function fail(ps) {
  return undefined;
}

function notChar(c) {
  return function(ps) {
    return ps.head && ps.head !== c ? ps.tail.setValue(ps.head) : undefined;
  };
}

function notChars(s) {
  return function(ps) {
    return ps.head && s.indexOf(ps.head) == -1 ? ps.tail.setValue(ps.head) : undefined;
  };
}

function not(p, opt_else) {
  p = prep(p);
  opt_else = prep(opt_else);
  var f = function(ps) {
    return this.parse(p,ps) ? undefined :
      opt_else ? this.parse(opt_else, ps) : ps;
  };

  f.toString = function() { return 'not(' + p + ')'; };

  return f;
}

function optional(p) {
  p = prep(p);
  var f = function(ps) { return this.parse(p,ps) || ps.setValue(undefined); };

  f.toString = function() { return 'optional(' + p + ')'; };

  return f;
}

function copyInput(p) {
  p = prep(p);
  var f = function(ps) {
    var res = this.parse(p, ps);

    return res ? res.setValue(ps.str_.toString().substring(ps.pos, res.pos)) : res;
  };

  f.toString = function() { return 'copyInput(' + p + ')'; };

  return f;
}

/** Parses if the delegate parser parses, but doesn't advance the pstream. **/
function lookahead(p) {
  p = prep(p);
  var f = function(ps) { return this.parse(p,ps) && ps; };

  f.toString = function() { return 'lookahead(' + p + ')'; };

  return f;
}

function repeat(p, opt_delim, opt_min, opt_max) {
  p = prep(p);
  opt_delim = prep(opt_delim);

  var f = function(ps) {
    var ret = [];

    for ( var i = 0 ; ! opt_max || i < opt_max ; i++ ) {
      var res;

      if ( opt_delim && ret.length != 0 ) {
        if ( ! ( res = this.parse(opt_delim, ps) ) ) break;
        ps = res;
      }

      if ( ! ( res = this.parse(p,ps) ) ) break;

      ret.push(res.value);
      ps = res;
    }

    if ( opt_min && ret.length < opt_min ) return undefined;

    return ps.setValue(ret);
  };

  f.toString = function() { return 'repeat(' + p + ', ' + opt_delim + ', ' + opt_min + ', ' + opt_max + ')'; };

  return f;
}

function plus(p, opt_delim) { return repeat(p, opt_delim, 1); }

function noskip(p) {
  return function(ps) {
    this.skip_ = false;
    ps = this.parse(p, ps);
    this.skip_ = true;
    return ps;
  };
}

/** A simple repeat which doesn't build an array of parsed values. **/
function repeat0(p) {
  p = prep(p);

  var f = function(ps) {
    var res;
    while ( res = this.parse(p, ps) ) ps = res;
    return ps.setValue('');
  };

  f.toString = function() { return 'repeat0(' + p + ')'; };

  return f;
}

/** A repeat-at-least-once which doesn't build an array of parsed values. **/
function plus0(p) {
  p = prep(p);

  var f = function(ps) {
    var res;
    if ( ! (res = this.parse(p, ps)) ) return undefined;
    ps = res;
    while ( res = this.parse(p, ps) ) ps = res;
    return ps.setValue('');
  };

  f.toString = function() { return 'repeat0(' + p + ')'; };

  return f;
}

function seq(/* vargs */) {
  var args = prepArgs(arguments);

  var f = function(ps) {
    var ret = [];

    for ( var i = 0 ; i < args.length ; i++ ) {
      if ( ! ( ps = this.parse(args[i], ps) ) ) return undefined;
      ret.push(ps.value);
    }

    return ps.setValue(ret);
  };

  f.toString = function() { return 'seq(' + argsToArray(args).join(',') + ')'; };

  return f;
}

/**
 * A Sequence which only returns one of its arguments.
 * Ex. seq1(1, '"', sym('string'), '"'),
 **/
function seq1(n /*, vargs */) {
  var args = prepArgs(argsToArray(arguments).slice(1));

  var f = function(ps) {
    var ret;

    for ( var i = 0 ; i < args.length ; i++ ) {
      if ( ! ( ps = this.parse(args[i], ps) ) ) return undefined;
      if ( i == n ) ret = ps.value;
    }

    return ps.setValue(ret);
  };

  f.toString = function() { return 'seq1(' + n + ', ' + argsToArray(args).join(',') + ')'; };

  return f;
}

var parserVersion_ = 1;
function invalidateParsers() {
  parserVersion_++;
}

function simpleAlt(/* vargs */) {
//function alt(/* vargs */) {
  var args = prepArgs(arguments);

  if ( args.length == 1 ) return args[0];

  var f = function(ps) {
    for ( var i = 0 ; i < args.length ; i++ ) {
      var res = this.parse(args[i], ps);

      if ( res ) return res;
    }

    return undefined;
  };

  f.toString = function() { return 'simpleAlt(' + argsToArray(args).join(' | ') + ')'; };

  return f;
}

var TrapPStream = {
  create: function(ps) {
    return {
      __proto__: this,
      head: ps.head,
      value: ps.value,
      goodChar: false
    };
  },
  getValue: function() { return this.value; },
  setValue: function(v) { this.value = v; return this; },
  get tail() {
    this.goodChar = true;
    return {
      value: this.value,
      getValue: function() { return this.value; },
      setValue: function(v) { this.value = v; }
    };
  }
};

function alt(/* vargs */) {
  var SIMPLE_ALT = simpleAlt.apply(null, arguments);
  var args = prepArgs(arguments);
  var map  = {};
  var parserVersion = parserVersion_;

  function nullParser() { return undefined; }

  function testParser(p, ps) {
    var trapPS = TrapPStream.create(ps);
    this.parse(p, trapPS);

    // console.log('*** TestParser:',p,c,goodChar);
    return trapPS.goodChar;
  }

  function getParserForChar(ps) {
    var c = ps.head;
    var p = map[c];

    if ( ! p ) {
      var alts = [];

      for ( var i = 0 ; i < args.length ; i++ ) {
        var parser = args[i];

        if ( testParser.call(this, parser, ps) ) alts.push(parser);
      }

      p = alts.length == 0 ? nullParser :
        alts.length == 1 ? alts[0] :
        simpleAlt.apply(null, alts);

      map[c] = p;
    }

    return p;
  }

  var f = function(ps) {
    if ( parserVersion !== parserVersion_ ) {
      map = {};
      parserVersion = parserVersion_;
    }
    var r1 = this.parse(getParserForChar.call(this, ps), ps);
    // If alt and simpleAlt don't return same value then uncomment this
    // section to find out where the problem is occuring.
    /*
    var r2 = this.parse(SIMPLE_ALT, ps);
    if ( ! r1 !== ! r2 ) debugger;
    if ( r1 && ( r1.pos !== r2.pos ) ) debugger;
    */
    return r1;
  };

  f.toString = function() { return 'alt(' + argsToArray(args).join(' | ') + ')'; };

  return f;
}

/** Takes a parser which returns an array, and converts its result to a String. **/
function str(p) {
  p = prep(p);
  var f = function(ps) {
    var ps = this.parse(p, ps);
    return ps ? ps.setValue(ps.value.join('')) : undefined ;
  };

  f.toString = function() { return 'str(' + p + ')'; };

  return f;
}

/** Ex. attr: pick([0, 2], seq(sym('label'), '=', sym('value'))) **/
function pick(as, p) {
  p = prep(p);
  var f = function(ps) {
    var ps = this.parse(p, ps);
    if ( ! ps ) return undefined;
    var ret = [];
    for ( var i = 0 ; i < as.length ; i++ ) ret.push(ps.value[as[i]]);
    return ps.setValue(ret);
  };

  f.toString = function() { return 'pick(' + as + ', ' + p + ')'; };

  return f;
}

function parsedebug(p) {
  return function(ps) {
    debugger;
    var old = DEBUG_PARSE;
    DEBUG_PARSE = true;
    var ret = this.parse(p, ps);
    DEBUG_PARSE = old;
    return ret;
  };
}


// alt = simpleAlt;

function sym(name) {
  var f = function(ps) {
    var p = this[name];

    if ( ! p ) console.log('PARSE ERROR: Unknown Symbol <' + name + '>');

    return this.parse(p, ps);
  };

  f.toString = function() { return '<' + name + '>'; };

  return f;
}


// This isn't any faster because V8 does the same thing already.
// function sym(name) { var p; return function(ps) { return (p || ( p = this[name])).call(this, ps); }; }


// function sym(name) { return function(ps) { var ret = this[name](ps); console.log('<' + name + '> -> ', !! ret); return ret; }; }

var DEBUG_PARSE = false;

var grammar = {

  parseString: function(str, opt_start) {
    var ps = this.stringPS;
    ps.str = str;
    var res = this.parse(opt_start || this.START, ps);

    return res && res.value;
  },

  parse: function(parser, pstream) {
    //    if ( DEBUG_PARSE ) console.log('parser: ', parser, 'stream: ',pstream);
    if ( DEBUG_PARSE && pstream.str_ ) {
            console.log(new Array(pstream.pos).join('.'), pstream.head);
      console.log(pstream.pos + '> ' + pstream.str_[0].substring(0, pstream.pos) + '(' + pstream.head + ')');
    }
    var ret = parser.call(this, pstream);
    if ( DEBUG_PARSE ) {
      console.log(parser + ' ==> ' + (!!ret) + '  ' + (ret && ret.value));
    }
    return ret;
  },

  /** Export a symbol for use in another grammar or stand-alone. **/
  'export': function(str) {
    return this[str].bind(this);
  },

  addAction: function(sym, action) {
    var p = this[sym];
    this[sym] = function(ps) {
      var val = ps.value;
      var ps2 = this.parse(p, ps);

      return ps2 && ps2.setValue(action.call(this, ps2.value, val));
    };

    this[sym].toString = function() { return '<<' + sym + '>>'; };
  },

  addActions: function(map) {
    for ( var key in map ) this.addAction(key, map[key]);
    return this;
  }
};


// TODO(kgr): move this somewhere better
function defineTTLProperty(obj, name, ttl, f) {
  obj.__defineGetter__(name, function() {
    var accessed;
    var value = undefined;
    this.__defineGetter__(name, function() {
      function scheduleTimer() {
        var ref = setTimeout(function() {
          if ( accessed ) {
            scheduleTimer();
          } else {
            value = undefined;
          }
          accessed = false;
        }, ttl);
        if ( ref && ref.unref ) ref.unref();
      }
      if ( ! value ) {
        accessed = false;
        value = f();
        scheduleTimer();
      } else {
        accessed = true;
      }

      return value;
    });

    return this[name];
  });
}

defineTTLProperty(grammar, 'stringPS', 30000, function() { return StringPS.create(''); });


var SkipGrammar = {
  create: function(gramr, skipp) {
    return {
      __proto__: gramr,

      skip_: true,

      parse: function(parser, pstream) {
        if (this.skip_) pstream = this.skip.call(grammar, pstream) || pstream;
        return this.__proto__.parse.call(this, parser, pstream);
      },

      skip: skipp
    };
  }
};

// TODO: move this out of Core

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

// todo: add enabled/disabled support
// todo: bind
// todo: generateTopic()
// todo: cleanup empty topics after subscriptions removed

/** Publish and Subscribe Event Notification Service. **/
// ??? Whould 'Observable' be a better name?
// TODO(kgr): Model or just make part of FObject?

var __ROOT__ = {};

MODEL({
  name: 'EventService',

  extends: '__ROOT__',

  constants: {
    /** If listener thows this exception, it will be removed. **/
    UNSUBSCRIBE_EXCEPTION: 'unsubscribe',

    /** Used as topic suffix to specify broadcast to all sub-topics. **/
    WILDCARD: '*'
  },

  methods: {
    /** Create a "one-time" listener which unsubscribes itself after its first invocation. **/
    oneTime: function(listener) {
      return function() {
        listener.apply(this, argsToArray(arguments));

        throw EventService.UNSUBSCRIBE_EXCEPTION;
      };
    },

    /** Log all listener invocations to console. **/
    consoleLog: function(listener) {
      return function() {
        var args = argsToArray(arguments);
        console.log(args);

        listener.apply(this, args);
      };
    },

    /**
     * Merge all notifications occuring in the specified time window into a single notification.
     * Only the last notification is delivered.
     *
     * @param opt_delay time in milliseconds of time-window, defaults to 16ms, which is
     *        the smallest delay that humans aren't able to perceive.
     **/
    merged: function(listener, opt_delay, opt_X) {
      var setTimeoutX = ( opt_X && opt_X.setTimeout ) || setTimeout;
      var delay = opt_delay || 16;

      return function() {
        var triggered    = false;
        var unsubscribed = false;
        var lastArgs     = null;

        var f = function() {
          lastArgs = arguments;

          if ( unsubscribed ) throw EventService.UNSUBSCRIBE_EXCEPTION;

          if ( ! triggered ) {
            triggered = true;
            try {
              setTimeoutX(
                function() {
                  triggered = false;
                  var args = argsToArray(lastArgs);
                  lastArgs = null;
                  try {
                    listener.apply(this, args);
                  } catch (x) {
                    if ( x === EventService.UNSUBSCRIBE_EXCEPTION ) unsubscribed = true;
                  }
                }, delay);
            } catch(e) {
              // TODO: Clean this up when we move EventService into the context.
              throw EventService.UNSUBSCRIBE_EXCEPTION;
            }
          }
        };

        if ( DEBUG ) f.toString = function() {
          return 'MERGED(' + delay + ', ' + listener.$UID + ', ' + listener + ')';
        };

        return f;
      }();
    },

    /**
     * Merge all notifications occuring until the next animation frame.
     * Only the last notification is delivered.
     **/
    // TODO: execute immediately from within a requestAnimationFrame
    framed: function(listener, opt_X) {
      opt_X = opt_X || this.X;
      var requestAnimationFrameX = ( opt_X && opt_X.requestAnimationFrame ) || requestAnimationFrame;

      return function() {
        var triggered    = false;
        var unsubscribed = false;
        var lastArgs     = null;

        var f = function() {
          lastArgs = arguments;

          if ( unsubscribed ) throw EventService.UNSUBSCRIBE_EXCEPTION;

          if ( ! triggered ) {
            triggered = true;
            requestAnimationFrameX(
              function() {
                triggered = false;
                var args = argsToArray(lastArgs);
                lastArgs = null;
                try {
                  listener.apply(this, args);
                } catch (x) {
                  if ( x === EventService.UNSUBSCRIBE_EXCEPTION ) unsubscribed = true;
                }
              });
          }
        };

        if ( DEBUG ) f.toString = function() {
          return 'FRAMED(' + listener.$UID + ', ' + listener + ')';
        };

        return f;
      }();
    },

    /** Decorate a listener so that the event is delivered asynchronously. **/
    async: function(listener, opt_X) {
      return this.delay(0, listener, opt_X);
    },

    delay: function(delay, listener, opt_X) {
      opt_X = opt_X || this.X;
      return function() {
        var args = argsToArray(arguments);

        // Is there a better way of doing this?
        (opt_X && opt_X.setTimeout ? opt_X.setTimeout : setTimeout)( function() { listener.apply(this, args); }, delay );
      };
    },

    hasListeners: function (opt_topic) {
      if ( ! opt_topic ) return !! this.subs_;

      console.log('TODO: haslisteners');
      // TODO:
      return true;
    },

    /**
     * Publish a notification to the specified topic.
     *
     * @return number of subscriptions notified
     **/
    publish: function (topic) {
      return this.subs_ ?
        this.pub_(
          this.subs_,
          0,
          topic,
          this.appendArguments([this, topic], arguments, 1)) :
        0;
    },

    /** Publish asynchronously. **/
    publishAsync: function (topic) {
      var args = argsToArray(arguments);
      var me   = this;

      setTimeout( function() { me.publish.apply(me, args); }, 0);
    },

    /**
     * Publishes a message to this object and all of its children.
     * Objects/Protos which have children should override the
     * standard definition, which is the same as just calling publish().
     **/
    deepPublish: function(topic) {
      return this.publish.apply(this, arguments);
    },

    /**
     * Publish a message supplied by a factory function.
     *
     * This is useful if the message is expensive to generate and you
     * don't want to waste the effort if there are no listeners.
     *
     * arg fn: function which returns array
     **/
    lazyPublish: function (topic, fn) {
      if ( this.hasListeners(topic) ) return this.publish.apply(this, fn());

      return 0;
    },

    /** Subscribe to notifications for the specified topic. **/
    // TODO: Return subscription
    subscribe: function (topic, listener) {
      if ( ! this.subs_ ) this.subs_ = {};
      //console.log("Sub: ",this, listener);

      this.sub_(this.subs_, 0, topic, listener);
    },

    /** Unsubscribe a listener from the specified topic. **/
    unsubscribe: function (topic, listener) {
      if ( ! this.subs_ ) return;

      this.unsub_(this.subs_, 0, topic, listener);
    },

    /** Unsubscribe all listeners from this service. **/
    unsubscribeAll: function () {
      this.sub_ = {};
    },


    ///////////////////////////////////////////////////////
    //                                            Internal
    /////////////////////////////////////////////////////

    pub_: function(map, topicIndex, topic, msg) {
      /**
        map: topicMap, topicIndex: index into 'topic', topic: array of topic path
        return: number of listeners published to
       **/
      var count = 0;

      // There are no subscribers, so nothing to do
      if ( map == null ) return 0;

      if ( topicIndex < topic.length ) {
        var t = topic[topicIndex];

        // wildcard publish, so notify all sub-topics, instead of just one
        if ( t == this.WILDCARD )
          return this.notifyListeners_(topic, map, msg);

        if ( t ) count += this.pub_(map[t], topicIndex+1, topic, msg);
      }

      count += this.notifyListeners_(topic, map[null], msg);

      return count;
    },

    sub_: function(map, topicIndex, topic, listener) {
      if ( topicIndex == topic.length ) {
        if ( ! map[null] ) map[null] = [];
        map[null].push(listener);
      } else {
        var key = topic[topicIndex];

        if ( ! map[key] ) map[key] = {};

        this.sub_(map[key], topicIndex+1, topic, listener);
      }
    },

    unsub_: function(map, topicIndex, topic, listener) {
      /**
        map: topicMap, topicIndex: index into 'topic', topic: array of topic path
        return: true iff there are no subscritions for this topic left
      **/
      if ( topicIndex == topic.length ) {
        if ( ! map[null] ) return true;

        var i = map[null].indexOf(listener);
        if ( i == -1 ) {
          // console.warn('phantom unsubscribe, size: ', map[null].length);
        } else {
          map[null] = map[null].spliceF(i, 1);
        }

        if ( ! map[null].length ) delete map[null];
      } else {
        var key = topic[topicIndex];

        if ( ! map[key] ) return false;

        if ( this.unsub_(map[key], topicIndex+1, topic, listener) )
          delete map[key];
      }
      return Object.keys(map).length == 0;
    },

    /** @return true if the message was delivered without error. **/
    notifyListener_: function(topic, listener, msg) {
      try {
        listener.apply(null, msg);
      } catch ( err ) {
        if ( err !== this.UNSUBSCRIBE_EXCEPTION ) {
          console.error('Error delivering event (removing listener): ', topic.join('.'), err);
          if ( DEBUG ) console.error(err.stack);
        } else {
          // console.warn('Unsubscribing listener: ', topic.join('.'));
        }

        return false;
      }

      return true;
    },

    /** @return number of listeners notified **/
    notifyListeners_: function(topic, listeners, msg) {
      if ( listeners == null ) return 0;

      if ( Array.isArray(listeners) ) {
        for ( var i = 0 ; i < listeners.length ; i++ ) {
          var listener = listeners[i];

          if ( ! this.notifyListener_(topic, listener, msg) ) {
            this.unsubscribe(topic, listener);
          }
        }

        return listeners.length;
      }

      var count = 0;
      for ( var key in listeners ) {
        count += this.notifyListeners_(topic, listeners[key], msg);
      }
      return count;
    },

    // convenience method to turn 'arguments' into a real array
    appendArguments: function (a, args, start) {
      for ( var i = start ; i < args.length ; i++ ) a.push(args[i]);

      return a;
    }
  }
});


/** Extend EventService with support for dealing with property-change notification. **/
MODEL({
  name: 'PropertyChangeSupport',

  extends: 'EventService',

  constants: {
    /** Root for property topics. **/
    PROPERTY_TOPIC: 'property'
  },

  methods: {
    /** Create a topic for the specified property name. **/
    propertyTopic: memoize1(function (property) {
      return [ this.PROPERTY_TOPIC, property ];
    }),

    /** Indicate that a specific property has changed. **/
    propertyChange: function (property, oldValue, newValue) {
      // don't bother firing event if there are no listeners
      if ( ! this.subs_ ) return;

      // don't fire event if value didn't change
      if ( property != null && (
        oldValue === newValue ||
          (/*NaN check*/(oldValue !== oldValue) && (newValue !== newValue)) )
         ) return;

      this.publish(this.propertyTopic(property), oldValue, newValue);
    },

    propertyChange_: function (propertyTopic, oldValue, newValue) {
      // don't bother firing event if there are no listeners
      if ( ! this.subs_ ) return;

      // don't fire event if value didn't change
      if ( oldValue === newValue || (/*NaN check*/(oldValue !== oldValue) && (newValue !== newValue)) ) return;

      this.publish(propertyTopic, oldValue, newValue);
    },

    /** Indicates that one or more unspecified properties have changed. **/
    globalChange: function () {
      this.publish(this.propertyTopic(this.WILDCARD), null, null);
    },

    addListener: function(listener) {
      console.assert(listener, 'Listener cannot be null.');
      // this.addPropertyListener([ this.PROPERTY_TOPIC ], listener);
      this.addPropertyListener(null, listener);
    },

    removeListener: function(listener) {
      this.removePropertyListener(null, listener);
    },

    /** @arg property the name of the property to listen to or 'null' to listen to all properties. **/
    addPropertyListener: function(property, listener) {
      this.subscribe(this.propertyTopic(property), listener);
    },

    removePropertyListener: function(property, listener) {
      this.unsubscribe(this.propertyTopic(property), listener);
    },

    /** Create a Value for the specified property. **/
    propertyValue: function(prop) {
      if ( ! prop ) throw 'Property Name required for propertyValue().';
      var props = this.props_ || ( this.props_ = {} );
      return Object.hasOwnProperty.call(props, prop) ?
        props[prop] :
        ( props[prop] = PropertyValue.create(this, prop) );
    }
  }
});

var FunctionStack = {
  create: function() {
    var stack = [false];
    return {
      stack: stack,
      push: function(f) { stack.unshift(f); },
      pop: function() { stack.shift(); },
    };
  }
};


var Value = {
  __isValue__: true,
  isInstance: function(o) { return o && o.__isValue__; },
  follow: function(srcValue) { Events.follow(srcValue, this); }
};

var PropertyValue = {
  __proto__: Value,
  create: function(obj, prop) {
    var o = Object.create(this);
    o.$UID = obj.$UID + '.' + prop;
    o.obj  = obj;
    o.prop = prop;
    return o;
  },

  get: function() { return this.obj[this.prop]; },

  set: function(val) { this.obj[this.prop] = val; },

  // asDAO: function() {
  //   console.warn('ProperytValue.asDAO() deprecated.  Use property$Proxy instead.');
  //   if ( ! this.proxy ) {
  //     this.proxy = this.X.lookup('foam.dao.ProxyDAO').create({delegate: this.get()});
  //     this.addListener(function() { proxy.delegate = this.get(); }.bind(this));
  //   }
  //   return this.proxy;
  // },

  get value() { return this.get(); },

  set value(val) { this.set(val); },

  addListener: function(listener) { this.obj.addPropertyListener(this.prop, listener); },

  removeListener: function(listener) { this.obj.removePropertyListener(this.prop, listener); },

  toString: function () { return 'PropertyValue(' + this.prop + ')'; }
};


/** Static support methods for working with Events. **/
var Events = {

  /** Collection of all 'following' listeners. **/
  listeners_: new WeakMap(),

  recordListener: function(src, dst, listener, opt_dontCallListener) {
    var srcMap = this.listeners_.get(src);
    if ( ! srcMap ) {
      srcMap = new WeakMap();
      this.listeners_.set(src, srcMap);
    }
    console.assert( ! srcMap.get(dst), 'recordListener: duplicate follow');
    srcMap.set(dst, listener);
    src.addListener(listener);
    if ( ! opt_dontCallListener ) listener();
  },


  identity: function (x) { return x; },

  /** Have the dstValue listen to changes in the srcValue and update its value to be the same. **/
  follow: function (srcValue, dstValue) {
    if ( ! srcValue || ! dstValue ) return;

    this.recordListener(srcValue, dstValue, function () {
      var sv = srcValue.get();
      var dv = dstValue.get();

      if ( ! equals(sv, dv) ) dstValue.set(sv);
    });
  },


  /** Have the dstValue stop listening for changes to the srcValue. **/
  unfollow: function (src, dst) {
    if ( ! src || ! dst ) return;
    var srcMap = this.listeners_.get(src);
    if ( ! srcMap ) return;
    var listener = srcMap.get(dst);
    if ( listener ) {
      srcMap.delete(dst);
      src.removeListener(listener);
    }
  },


  /**
   * Maps values from one model to another.
   * @param f maps values from srcValue to dstValue
   */
  map: function (srcValue, dstValue, f) {
    if ( ! srcValue || ! dstValue ) return;

    this.recordListener(srcValue, dstValue, function () {
      var s = f(srcValue.get());
      var d = dstValue.get();

      if ( ! equals(s, d) ) dstValue.set(s);
    });
  },


  /**
   * Link the values of two models by having them follow each other.
   * Initial value is copied from srcValue to dstValue.
   **/
  link: function (srcValue, dstValue) {
    this.follow(srcValue, dstValue);
    this.follow(dstValue, srcValue);
  },


  /**
   * Relate the values of two models.
   * @param f maps value1 to model2
   * @param fprime maps model2 to value1
   * @param removeFeedback disables feedback
   */
  relate: function (srcValue, dstValue, f, fprime, removeFeedback) {
    if ( ! srcValue || ! dstValue ) return;

    var feedback = false;

    var l = function(sv, dv, f) { return function () {
      if ( removeFeedback && feedback ) return;
      var s = f(sv.get());
      var d = dv.get();

      if ( ! equals(s, d) ) {
        feedback = true;
        dv.set(s);
        feedback = false;
      }
    }};

    var l1 = l(srcValue, dstValue, f);
    var l2 = l(dstValue, srcValue, fprime);

    this.recordListener(srcValue, dstValue, l1, true);
    this.recordListener(dstValue, srcValue, l2, true);

    l1();
  },

  /** Unlink the values of two models by having them no longer follow each other. **/
  unlink: function (value1, value2) {
    this.unfollow(value1, value2);
    this.unfollow(value2, value1);
  },


  //////////////////////////////////////////////////
  //                                   FRP Support
  //////////////////////////////////////////////////

  /**
   * Trap the dependencies of 'fn' and re-invoke whenever
   * their values change.  The return value of 'fn' is
   * passed to 'opt_fn'.
   * @param opt_fn also invoked when dependencies change,
   *        but its own dependencies are not tracked.
   * @returns a cleanup object. call ret.destroy(); to
   *        destroy the dynamic function and listeners.
   */
  dynamicFn: function(fn, opt_fn, opt_X) {
    var fn2 = opt_fn ? function() { opt_fn(fn()); } : fn;
    var listener = EventService.framed(fn2, opt_X);
    var propertyValues = [];
    fn(); // Call once before capture to pre-latch lazy values
    Events.onGet.push(function(obj, name, value) {
      // Uncomment next line to debug.
      // obj.propertyValue(name).addListener(function() { console.log('name: ', name, ' listener: ', listener); });
      var l = obj.propertyValue(name);
      if ( propertyValues.indexOf(l) == -1 ) {
        obj.propertyValue(name).addListener(listener);
        propertyValues.push(l);
      }
    });
    var ret = fn();
    Events.onGet.pop();
    opt_fn && opt_fn(ret);
    return {
      destroy: function() { // TODO(jacksonic): just return the function?
        propertyValues.forEach(function(p) {
          p.removeListener(listener);
        });
      }
    };
  },

  onSet: FunctionStack.create(),
  onGet: FunctionStack.create(),

  // ???: would be nice to have a removeValue method
  // or maybe add an 'owner' property, combine with Janitor
}

// TODO: Janitor
/*
  subscribe(subject, topic, listener);
  addCleanupTask(fn)

  cleanup();

*/


MODEL({
  name: 'Movement',

  methods: {

    distance: function(x, y) { return Math.sqrt(x*x + y*y); },

    /** Combinator to create the composite of two functions. **/
    o: function(f1, f2) { return function(x) { return f1(f2(x)); }; },

    /** Combinator to create the average of two functions. **/
    avg: function(f1, f2) { return function(x) { return (f1(x) + f2(x))/2; }; },

    /** Combinator to create a progressive average of two functions. **/
    spline: function(f1, f2) { return function(x) { return (1-x)*f1(x) + x*f2(x); }; },

    /** Constant speed. **/
    linear: function(x) { return x; },

    /** Move to target value and then return back to original value. **/
    back: function(x) { return x < 0.5 ? 2*x : 2-2*x; },

    /** Start slow and accelerate until half-way, then start slowing down. **/
    accelerate: function(x) { return (Math.sin(x * Math.PI - Math.PI/2)+1)/2; },

    /** Start slow and ease-in to full speed. **/
    easeIn: function(a) {
      var v = 1/(1-a/2);
      return function(x) {
        var x1 = Math.min(x, a);
        var x2 = Math.max(x-a, 0);
        return (a ? 0.5*x1*(x1/a)*v : 0) + x2*v;
      };
    },

    /** Combinator to reverse behaviour of supplied function. **/
    reverse: function(f) { return function(x) { return 1-f(1-x); }; },

    /** Reverse of easeIn. **/
    easeOut: function(b) { return Movement.reverse(Movement.easeIn(b)); },

    /**
     * Cause an oscilation at the end of the movement.
     * @param b percentage of time to to spend bouncing [0, 1]
     * @param a amplitude of maximum bounce
     * @param opt_c number of cycles in bounce (default: 3)
     */
    oscillate:  function(b, a, opt_c) {
      var c = opt_c || 3;
      return function(x) {
        if ( x < (1-b) ) return x/(1-b);
        var t = (x-1+b)/b;
        return 1+(1-t)*2*a*Math.sin(2*c*Math.PI * t);
      };
    },

    /**
     * Cause an bounce at the end of the movement.
     * @param b percentage of time to to spend bouncing [0, 1]
     * @param a amplitude of maximum bounce
     */
    bounce:  function(b,a,opt_c) {
      var c = opt_c || 3;
      return function(x) {
        if ( x < (1-b) ) return x/(1-b);
        var t = (x-1+b)/b;
        return 1-(1-t)*2*a*Math.abs(Math.sin(2*c*Math.PI * t));
      };
    },
    bounce2: function(a) {
      var v = 1 / (1-a);
      return function(x) {
        if ( x < (1-a) ) return v*x;
        var p = (x-1+a)/a;
        return 1-(x-1+a)*v/2;
      };
    },

    /** Move backwards a% before continuing to end. **/
    stepBack: function(a) {
      return function(x) {
        return ( x < a ) ? -x : -2*a+(1+2*a)*x;
      };
    },

    /** Combination of easeIn and easeOut. **/
    ease: function(a, b) {
      return Movement.o(Movement.easeIn(a), Movement.easeOut(b));
    },

    seq: function(f1, f2) {
      return ( f1 && f2 ) ? function() { f1.apply(this, argsToArray(arguments)); f2(); } :
      f1 ? f1
        : f2 ;
    },

    liveAnimations_: 0,

    /** @return a latch function which can be called to stop the animation. **/
    animate: function(duration, fn, opt_interp, opt_onEnd, opt_X) {
      var requestAnimationFrameX = ( opt_X && opt_X.requestAnimationFrame ) || requestAnimationFrame;

      // console.assert( opt_X && opt_X.requestAnimationFrame, 'opt_X or opt_X.requestAnimationFrame not available');

      if ( duration == 0 ) return Movement.seq(fn, opt_onEnd);
      var interp = opt_interp || Movement.linear;

      return function() {
        var ranges    = [];
        var stopped = false;

        function stop() {
          var onEnd = opt_onEnd;
          if ( ! stopped ) {
            Movement.liveAnimations_--;
            stopped = true;
            onEnd && onEnd();
            onEnd = null;

            if ( Movement.liveAnimations_ === 0 ) {
              var tasks = Movement.idleTasks_;
              if ( tasks && tasks.length > 0 ) {
                Movement.idleTasks_ = [];
                setTimeout(function() {
                  // Since this is called asynchronously, there might be a new
                  // animation. If so, queue up the tasks again.
                  var i;
                  if ( Movement.liveAnimations_ > 0 ) {
                    for ( i = 0 ; i < tasks.length ; i++ )
                      Movement.idleTasks_.push(tasks[i]);
                  } else {
                    for ( i = 0 ; i < tasks.length ; i++ ) tasks[i]();
                  }
                }, 20);
              }
            }
          }
        }

        if ( fn ) {
          Events.onSet.push(function(obj, name, value2) {
            ranges.push([obj, name, obj[name], value2]);
          });
          fn.apply(this, argsToArray(arguments));
          Events.onSet.pop();
        }

        var startTime = Date.now();

        function go() {
          if ( stopped ) return;
          var now = Date.now();
          var p   = interp((Math.min(now, startTime + duration)-startTime)/duration);
          var last = now >= startTime + duration;

          for ( var i = 0 ; i < ranges.length ; i++ ) {
            var r = ranges[i];
            var obj = r[0], name = r[1], value1 = r[2], value2 = r[3];

            obj[name] = last ? value2 : value1 + (value2-value1) * p;
          }

          if ( last ) stop(); else requestAnimationFrameX(go);
        }

        if ( ranges.length > 0 ) {
          Movement.liveAnimations_++;
          requestAnimationFrameX(go);
        } else {
          var setTimeoutX = ( opt_X && opt_X.setTimeout ) || setTimeout;
          setTimeoutX(stop, duration);
        }

        return stop;
      };
    },

    whenIdle: function(fn) {
      // Decorate a function to defer execution until no animations are running
      return function() {
        if ( Movement.liveAnimations_ > 0 ) {
          if ( ! Movement.idleTasks_ ) Movement.idleTasks_ = [];
          var args = arguments;
          Movement.idleTasks_.push(function() { fn.apply(fn, args); });
        } else {
          fn.apply(fn, arguments);
        }
      };
    },

    // requires unsubscribe to work first (which it does now)
    /*
      animate2: function(timer, duration, fn) {
      return function() {
      var startTime = timer.time;
      Events.onSet.push(function(obj, name, value2) {
      var value1 = obj[name];

      Events.dynamicFn(function() {
      var now = timer.time;

      obj[name] = value1 + (value2-value1) * (now-startTime)/duration;

      if ( now > startTime + duration ) throw EventService.UNSUBSCRIBE_EXCEPTION;
      });

      return false;
      });
      fn.apply(this, argsToArray(arguments));
      Events.onSet.pop();
      update();
      };
      },
    */

    // TODO: if this were an object then you could sub-class to modify playback
    compile: function (a, opt_rest) {
      function noop() {}

      function isPause(op) {
        return Array.isArray(op) && op[0] == 0;
      }

      function compilePause(op, rest) {
        return function() {
          var l = function() {
            document.removeEventListener('click', l);
            rest();
          };
          document.addEventListener('click', l);
        };
      }

      function isSimple(op) {
        return Array.isArray(op) && typeof op[0] === 'number';
      }

      function compileSimple(op, rest) {
        op[3] = Movement.seq(op[3], rest);
        return function() { Movement.animate.apply(null, op)(); };
      }

      function isParallel(op) {
        return Array.isArray(op) && Array.isArray(op[0]);
      }

      function compileParallel(op, rest) {
        var join = (function(num) {
          return function() { --num || rest(); };
        })(op.length);

        return function() {
          for ( var i = 0 ; i < op.length ; i++ ) {
            if ( isSimple(op[i]) )
              Movement.animate(op[i][0], op[i][1], op[i][2], Movement.seq(op[i][3], join))();
            else
              Movement.compile(op[i], join)();
          }
        };
      }

      function compileFn(fn, rest) {
        return Movement.seq(fn, rest);
      }

      function compile_(a, i) {
        if ( i >= a.length ) return opt_rest || noop;

        var rest = compile_(a, i+1);
        var op = a[i];

        return isPause(op)    ? compilePause(op, rest)    :
               isSimple(op)   ? compileSimple(op, rest)   :
               isParallel(op) ? compileParallel(op, rest) :
                                compileFn(op, rest)       ;
      }

      return compile_(a, 0);
    },

    onIntersect: function (o1, o2, fn) {
      if ( o1.model_.R ) {
        Events.dynamicFn(function() { o1.x; o1.y; o2.x; o2.y; }, function() {
          var dx = o1.x - o2.x;
          var dy = o1.y - o2.y;
          var d = dx*dx + dy*dy;
          var r2 = o1.r + o2.r;
          if ( d < r2*r2 )
            fn.call(null, o1, o2);
        });
      } else {
        Events.dynamicFn(function() { o1.x; o1.y; o2.x; o2.y; }, function() {
          if ( ( o1.x <= o2.x && o1.x + o1.width > o2.x    &&
                 o1.y <= o2.y && o1.y + o1.height > o2.y ) ||
               ( o2.x <= o1.x && o2.x + o2.width > o1.x    &&
                 o2.y <= o1.y && o2.y + o2.height > o1.y ) )
          {
            fn.call(null, o1, o2);
          }
        });
      }
    },

    stepTowards: function(src, dst, maxStep) {
      var dx = src.x - dst.x;
      var dy = src.y - dst.y;
      var theta = Math.atan2(dy,dx);
      var r     = Math.sqrt(dx*dx+dy*dy);
      r = r < 0 ? Math.max(-maxStep, r) : Math.min(maxStep, r);

      dst.x += r*Math.cos(-theta);
      dst.y -= r*Math.sin(-theta);
    },


    /**
     * Cause one object to move towards another at a specified rate.
     *
     * @arg t timer
     * @arg body body to be orbitted
     * @arg sat object to orbit body
     * @arg r radius of orbit
     * @arg p period of orbit
     */
    moveTowards: function (t, body, sat, v) {
      var bodyX = body.propertyValue('x');
      var bodyY = body.propertyValue('y');
      var satX  = sat.propertyValue('x');
      var satY  = sat.propertyValue('y');

      t.addListener(function() {
        var dx = bodyX.get() - satX.get();
        var dy = (bodyY.get() - satY.get());
        var theta = Math.atan2(dy,dx);
        var r     = Math.sqrt(dx*dx+dy*dy);

        r = r < 0 ? Math.max(-v, r) : Math.min(v, r);

        satX.set(satX.get() + r*Math.cos(-theta));
        satY.set(satY.get() - r*Math.sin(-theta));
      });
    },

    /**
     * Cause one object to orbit another.
     *
     * @arg t timer
     * @arg body body to be orbitted
     * @arg sat object to orbit body
     * @arg r radius of orbit
     * @arg p period of orbit
     */
    orbit: function (t, body, sat, r, p, opt_start) {
      var bodyX = body.x$;
      var bodyY = body.y$;
      var satX  = sat.x$;
      var satY  = sat.y$;
      var start = opt_start || 0;

      t.addListener(EventService.framed(function() {
        var time = t.time;
        satX.set(bodyX.get() + r*Math.sin(time/p*Math.PI*2 + start));
        satY.set(bodyY.get() + r*Math.cos(time/p*Math.PI*2 + start));
      }));
    },

    strut: function(mouse, c, dx, dy) {
      Events.dynamicFn(function() { mouse.x; mouse.y; }, function() {
        c.x = mouse.x + dx;
        c.y = mouse.y + dy;
      });
    },

    gravity: function(c, opt_a, opt_theta) {
      // TODO(kgr): implement opt_theta, the ability to control the direction
      var a = opt_a || 1;
      var theta = opt_theta || Math.PI * 1.5;
      Events.dynamicFn(function() { c.vx; c.vy; }, function() {
        c.vy += a;
      });
    },

    friction: function(c, opt_coef) {
      var coef = opt_coef || 0.9;
      Events.dynamicFn(function() { c.vx; c.vy; }, function() {
        c.vx = Math.abs(c.vx) < 0.001 ? 0 : c.vx * coef;
        c.vy = Math.abs(c.vy) < 0.001 ? 0 : c.vy * coef;
      });
    },

    inertia: function(c) {
      var last = Date.now();

      Events.dynamicFn(function() { c.vx; c.vy; c.x; c.y; }, function() {
        // Take into account duration since last run
        // Don't skip more than 4 frames because it can cause
        // collisions to be missed.
        var now = Date.now();
        var time = Math.min(Math.max(16, now-last), 64)/16;

        // Dynamic Friction
        if ( Math.abs(c.vx) > 0.001 ) c.x += c.vx * time;
        if ( Math.abs(c.vy) > 0.001 ) c.y += c.vy * time;

        // StaticFriction
//        if ( Math.abs(c.vx) < 0.001 ) c.vx = 0;
//        if ( Math.abs(c.vy) < 0.001 ) c.vy = 0;

        last = now;
      });
    },

    spring: function(mouse, c, dx, dy, opt_strength) {
      var strength = opt_strength || 6;
      var d        = Movement.distance(dx, dy);
      Events.dynamicFn(function() { mouse.x; mouse.y; c.x; c.y; c.vx; c.vy; }, function() {
        if ( dx === 0 && dy === 0 ) {
          c.x = mouse.x;
          c.y = mouse.y;
        } else {
          var dx2 = mouse.x + dx - c.x;
          var dy2 = mouse.y + dy - c.y;
          var d2  = Movement.distance(dx2, dy2);
          var dv  = strength * d2/d;
          if ( Math.abs(dv) < 0.01 ) return;
          var a = Math.atan2(dy2, dx2);
          c.vx += dv * Math.cos(a);
          c.vy += dv * Math.sin(a);
        }
      });
    },

    spring2: function(c1, c2, length, opt_strength) {
      var strength = opt_strength || 4;

      Events.dynamicFn(function() { c1.x; c1.y; c2.x; c2.y; }, function() {
        var d = c1.distanceTo(c2);
        var a = Math.atan2(c2.y-c1.y, c2.x-c1.x);
        if ( d > length ) {
          c1.applyMomentum( strength * (d/length-1), a);
          c2.applyMomentum(-strength * (d/length-1), a);
        } else if ( d < length ) {
          c1.applyMomentum(-strength * (length/d-1), a);
          c2.applyMomentum( strength * (length/d-1), a);
        }
      });
    },

    createAnimatedPropertyInstallFn: function(duration, interpolation) {
      /* Returns a function that can be assigned as a $$DOC{ref:'Property'}
      $$DOC{ref:'Property.install'} function. Any assignments to the property
      will be automatically animated.</p>
      <p><code>
      properties: [
      &nbsp;&nbsp;  { name: 'myProperty',
      &nbsp;&nbsp;&nbsp;&nbsp;    install: createAnimatedPropertyInstallFn(500, Movement.ease(0.2, 0.2)),
      &nbsp;&nbsp;&nbsp;&nbsp;    ...
      &nbsp;&nbsp;  }]
      </code>*/
      return function(prop) {
        this.defineProperty(
          {
            name: prop.name+"$AnimationLatch",
            defaultValue: 0,
            hidden: true,
            documentation: function() { /* The animation controller. */ },
          }
        );

        var actualSetter = this.__lookupSetter__(prop.name);
        this.defineProperty(
          {
            name: prop.name+"$AnimationSetValue",
            defaultValue: 0,
            hidden: true,
            documentation: function() { /* The animation value setter. */ },
            postSet: function(_, nu) {
              actualSetter.call(this, nu);
            }
          }
        );

        // replace setter with animater
        this.__defineSetter__(prop.name, function(nu) {
          // setter will be called on the instance, so "this" is an instance now
          var latch = this[prop.name+"$AnimationLatch"] ;
          latch && latch();

          var anim = Movement.animate(
            duration,
            function() {
              this[prop.name+"$AnimationSetValue"] = nu;
            }.bind(this),
            interpolation
          );
          this[prop.name+"$AnimationLatch"] = anim();
        });
      };
    }
  }
});

Movement.easy = Movement.spline(
  Movement.spline(constantFn(0), Movement.linear),
  Movement.spline(Movement.linear, constantFn(1)));

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
 * JSONUtil -- Provides JSON++ marshalling support.
 *
 * Like regular JSON, with the following differences:
 *  1. Marshalls to/from FOAM Objects, rather than maps.
 *  2. Object Model information is encoded as 'model: "ModelName"'
 *  3. Default Values are not marshalled, saving disk space and network bandwidth.
 *  4. Support for marshalling functions.
 *  5. Support for property filtering, ie. only output non-transient properties.
 *  6. Support for 'pretty' and 'compact' modes.
 *
 *  TODO:
 *    Replace with JSONParser.js, when finished.
 *    Maybe rename to FON (FOAM Object Notation, pronounced 'phone') to avoid
 *    confusion with regular JSON syntax.
 **/

var AbstractFormatter = {
  keyify: function(str) { return '"' + str + '"'; },

  stringify: function(obj) {
    var buf = '';

    this.output(function() {
      for (var i = 0; i < arguments.length; i++)
        buf += arguments[i];
    }, obj);

    return buf;
  },

  stringifyObject: function(obj, opt_defaultModel) {
    var buf = '';

    this.outputObject_(function() {
      for (var i = 0; i < arguments.length; i++)
        buf += arguments[i];
    }, obj, opt_defaultModel);

    return buf;
  },

  /** @param p a predicate function or an mLang **/
  where: function(p) {
    return {
      __proto__: this,
      p: ( p.f && p.f.bind(p) ) || p
    };
  },

  p: function() { return true; }
};


var JSONUtil = {

  escape: function(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/[\x00-\x1f]/g, function(c) {
        return "\\u00" + ((c.charCodeAt(0) < 0x10) ?
                          '0' + c.charCodeAt(0).toString(16) :
                          c.charCodeAt(0).toString(16));
      });
  },

  parseToMap: function(str) {
    return eval('(' + str + ')');
  },

  aparse: function(ret, X, str) {
    var seq = [];
    var res = this.parse(X, str, seq);
    if ( seq.length ) {
      apar.apply(null, seq)(function() { ret(res); });
      return;
    }
    ret(res);
  },

  amapToObj: function(ret, X, obj, opt_defaultModel) {
    var seq = [];
    var res = this.mapToObj(X, obj, opt_defaultModel, seq);
    if ( seq.length ) {
      aseq.apply(null, seq)(function() { ret(res); });
      return;
    }
    return res;
  },

  parse: function(X, str, seq) {
    return this.mapToObj(X, this.parseToMap(str), undefined, seq);
  },

  arrayToObjArray: function(X, a, opt_defaultModel, seq) {
    for ( var i = 0 ; i < a.length ; i++ ) {
      a[i] = this.mapToObj(X, a[i], opt_defaultModel, seq);
    }
    return a;
  },

  /**
   * Convert JS-Maps which contain the 'model_' property, into
   * instances of that model.
   **/
  mapToObj: function(X, obj, opt_defaultModel, seq) {
    if ( ! obj || typeof obj.model_ === 'object' ) return obj;

    if ( Array.isArray(obj) ) return this.arrayToObjArray(X, obj, undefined, seq);

    if ( obj instanceof Function ) return obj;

    if ( obj instanceof Date ) return obj;

    if ( obj instanceof Object ) {

      // For Models, convert type: Value to model_: ValueProperty
      if ( obj.model_ === 'Model' || opt_defaultModel === 'Model' ) {
        if ( obj.properties ) {
          for ( var i = 0 ; i < obj.properties.length ; i++ ) {
            var p = obj.properties[i];
            if ( p.type && ! p.model_ && p.type !== 'Property' ) {
              p.model_ = p.type + 'Property';
              X.arequire(p.model_)((function(obj, p) { return function(m) {
                if ( Property && ! Property.isSubModel(m) ) {
                  console.log('ERROR: Use of non Property Sub-Model as Property type: ', obj.package + '.' + obj.name, p.type);
                }
              }; })(obj,p));
            }
          }
        }
      }

      for ( var key in obj )
        if ( key != 'model_' && key != 'prototype_' )
          obj[key] = this.mapToObj(X, obj[key], null, seq);

      if ( opt_defaultModel && ! obj.model_ ) return opt_defaultModel.create(obj, X);

      if ( obj.model_ ) {
        var newObj = X.lookup(obj.model_);
        if ( ( ! newObj || ! newObj.finished__ ) ) {
          var future = afuture();
          seq && seq.push(future.get);

          X.arequire(obj.model_)(function(model) {
            if ( ! model ) {
               if ( FLAGS.debug && obj.model_ !== 'Template' && obj.model_ !== 'ArrayProperty' && obj.model_ !== 'ViewFactoryProperty' && obj.model_ !== 'Documentation' && obj.model_ !== 'DocumentationProperty' && obj.model_ !== 'CSSProperty' && obj.model_ !== 'FunctionProperty' )
                 console.warn('Failed to dynamically load: ', obj.model_);
              future.set(obj);
              return;
            }

            // Some Properties have a preSet which calls JSONUtil.
            // If they do this before a model is loaded then that
            // property can have JSONUtil called twice.
            // This check avoids building the object twice.
            // Should be removed when JSONUtil made fully async
            // and presets removed.
            if ( ! obj.instance_ ) {
              var tmp = model.create(obj, X);
              obj.become(tmp);
              future.set(obj);
            }
          });

          return obj;
        }
        var ret = newObj ? newObj.create(obj, X) : obj;
        return ret.readResolve ? ret.readResolve() : ret;
      }
      return obj
    }

    return obj;
  },

  compact: {
    __proto__: AbstractFormatter,

    output: function(out, obj, opt_defaultModel) {
      if ( Array.isArray(obj) ) {
        this.outputArray_(out, obj);
      }
      else if ( typeof obj === 'string' ) {
        out('"');
        out(JSONUtil.escape(obj));
        out('"');
      }
      else if ( obj instanceof Function ) {
        this.outputFunction_(out, obj);
      }
      else if ( obj instanceof Date ) {
        out(obj.getTime());
      }
      else if ( obj instanceof RegExp ) {
        out(obj.toString());
      }
      else if ( obj instanceof Object ) {
        if ( obj.model_ && obj.model_.id )
          this.outputObject_(out, obj, opt_defaultModel);
        else
          this.outputMap_(out, obj);
      }
      else if ( typeof obj === 'number' ) {
        if ( ! isFinite(obj) ) obj = null;
        out(obj);
      }
      else {
        out(obj === undefined ? null : obj);
      }
    },

    outputObject_: function(out, obj, opt_defaultModel) {
      var str   = '';
      var first = true;

      out('{');
      if ( obj.model_.id !== opt_defaultModel ) {
        this.outputModel_(out, obj);
        first = false;
     }

      var properties = obj.model_.getRuntimeProperties();
      for ( var key in properties ) {
        var prop = properties[key];

        if ( ! this.p(prop, obj) ) continue;

        if ( prop.name in obj.instance_ ) {
          var val = obj[prop.name];
          if ( Array.isArray(val) && ! val.length ) continue;
          if ( ! first ) out(',');
          out(this.keyify(prop.name), ': ');
          if ( Array.isArray(val) && prop.subType ) {
            this.outputArray_(out, val, prop.subType);
          } else {
            this.output(out, val);
          }
          first = false;
        }
      }

      out('}');
    },

    outputModel_: function(out, obj) {
      out('model_:"')
      if ( obj.model_.package ) out(obj.model_.package, '.')
      out(obj.model_.name, '"');
    },

    outputMap_: function(out, obj) {
      var str   = '';
      var first = true;

      out('{');

      for ( var key in obj ) {
        var val = obj[key];

        if ( ! first ) out(',');
        out(this.keyify(key), ': ');
        this.output(out, val);

        first = false;
      }

      out('}');
    },

    outputArray_: function(out, a, opt_defaultModel) {
      if ( a.length == 0 ) { out('[]'); return out; }

      var str   = '';
      var first = true;

      out('[');

      for ( var i = 0 ; i < a.length ; i++, first = false ) {
        var obj = a[i];

        if ( ! first ) out(',');

        this.output(out, obj, opt_defaultModel);
      }

      out(']');
    },

    outputFunction_: function(out, obj) { out(obj); }
  },

  pretty: {
    __proto__: AbstractFormatter,

    output: function(out, obj, opt_defaultModel, opt_indent) {
      var indent = opt_indent || '';

      if ( Array.isArray(obj) ) {
        this.outputArray_(out, obj, null, indent);
      }
      else if ( typeof obj == 'string' ) {
        out('"');
        out(JSONUtil.escape(obj));
        out('"');
      }
      else if ( obj instanceof Function ) {
        this.outputFunction_(out, obj, indent);
      }
      else if ( obj instanceof Date ) {
        out(obj.getTime());
      }
      else if ( obj instanceof RegExp ) {
        out(obj.toString());
      }
      else if ( obj instanceof Object ) {
        if ( obj.model_ )
          this.outputObject_(out, obj, opt_defaultModel, indent);
        else
          this.outputMap_(out, obj, indent);
      } else if ( typeof obj === 'number' ) {
        if ( ! isFinite(obj) ) obj = null;
        out(obj);
      } else {
        if ( obj === undefined ) obj = null;
        out(obj);
      }
    },

    outputObject_: function(out, obj, opt_defaultModel, opt_indent) {
      var indent       = opt_indent || '';
      var nestedIndent = indent + '   ';
      var str          = '';
      var first        = true;

      out(/*"\n", */indent, '{\n');
      if ( obj.model_.id && obj.model_.id !== opt_defaultModel ) {
        this.outputModel_(out, obj, nestedIndent);
        first = false;
      }

      var properties = obj.model_.getRuntimeProperties();
      for ( var key in properties ) {
        var prop = properties[key];

        if ( ! this.p(prop, obj) ) continue;

        if ( prop.name === 'parent' ) continue;

        if ( prop.name in obj.instance_ ) {
          var val = obj[prop.name];

          if ( Array.isArray(val) && ! val.length ) continue;

          if ( equals(val, prop.defaultValue) ) continue;

          if ( ! first ) out(',\n');
          out(nestedIndent, this.keyify(prop.name), ': ');

          if ( Array.isArray(val) && prop.subType ) {
            this.outputArray_(out, val, prop.subType, nestedIndent);
          } else {
            this.output(out, val, null, nestedIndent);
          }

          first = false;
        }
      }

      out('\n', indent, '}');
    },

    outputModel_: function(out, obj, indent) {
      out(indent, '"model_": "', obj.model_.id, '"');
    },

    outputMap_: function(out, obj, opt_indent) {
      var indent       = opt_indent || '';
      var nestedIndent = indent + '   ';
      var str          = '';
      var first        = true;

      out(/*"\n",*/ indent, '{\n', nestedIndent);

      for ( var key in obj ) {
        var val = obj[key];

        if ( ! first ) out(',\n');
        out(nestedIndent, this.keyify(key), ': ');
        this.output(out, val, null, nestedIndent);

        first = false;
      }

      out('\n', indent, '}');
    },

    outputArray_: function(out, a, opt_defaultModel, opt_indent) {
      if ( a.length == 0 ) { out('[]'); return out; }

      var indent       = opt_indent || '';
      var nestedIndent = indent + '   ';
      var str          = '';
      var first        = true;

      out('[\n');

      for ( var i = 0 ; i < a.length ; i++, first = false ) {
        var obj = a[i];

        if ( ! first ) out(',\n');

        this.output(out, obj, opt_defaultModel, nestedIndent);
      }

      out('\n', indent, ']');
    },

    outputFunction_: function(out, obj, indent) {
      var str = obj.toString();
      var lines = str.split('\n');

      if ( lines.length == 1 ) { out(str); return; }

      var minIndent = 10000;
      for ( var i = 0 ; i < lines.length ; i++ ) {
        var j = 0;
        for ( ; j < lines[i].length && lines[i].charAt(j) === ' ' && j < minIndent ; j++ );
        if ( j > 0 && j < minIndent ) minIndent = j;
      }

      if ( minIndent === 10000 ) { out(str); return; }

      for ( var i = 0 ; i < lines.length ; i++ ) {
        if ( lines[i].length && lines[i].charAt(0) === ' ' ) {
          lines[i] = indent + lines[i].substring(minIndent);
        }
        out(lines[i]);
        if ( i < lines.length-1 ) out('\n');
      }
    }
  },

  moreCompact: {
    __proto__: AbstractFormatter,
    // TODO: use short-names
  },

  compressed: {
    __proto__: AbstractFormatter,

    stringify: function(obj) {
      return Iuppiter.Base64.encode(Iuppiter.compress(JSONUtil.compact.stringify(obj),true));
    }
  }

};

JSONUtil.prettyModel = {
  __proto__: JSONUtil.pretty,

  outputModel_: function(out, obj, indent) {
    out(indent, 'model_: "', obj.model_.id, '"');
  },

  keys_: {},

  keyify: function(str) {
    if ( ! this.keys_.hasOwnProperty(str) ) {
      this.keys_[str] =
        /^[a-zA-Z\$_][0-9a-zA-Z$_]*$/.test(str) ?
        str :
        '"' + str + '"';
    }

    return this.keys_[str];
  }
};

JSONUtil.stringify       = JSONUtil.pretty.stringify.bind(JSONUtil.pretty);
JSONUtil.stringifyObject = JSONUtil.pretty.stringifyObject.bind(JSONUtil.pretty);
JSONUtil.output          = JSONUtil.pretty.output.bind(JSONUtil.pretty);
JSONUtil.where           = JSONUtil.pretty.where.bind(JSONUtil.pretty);

var NOT_TRANSIENT = function(prop) { return ! prop.transient; };

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
var XMLParser = {
  __proto__: grammar,

  START: seq1(1, sym('whitespace'), sym('tag'), sym('whitespace')),

  tag: seq(
      '<',
      sym('tagName'),
      sym('whitespace'),
      repeat(sym('attribute'), sym('whitespace')),
      sym('whitespace'),
      '>',
      repeat(alt(
        sym('tag'),
        sym('text')
      )),
      '</', sym('tagName'), '>'
    ),

  label: str(plus(notChars(' =/\t\r\n<>\'"'))),

  tagName: sym('label'),

  text: str(plus(notChar('<'))),

  attribute: seq(sym('label'), '=', sym('value')),

  value: str(alt(
    seq1(1, '"', repeat(notChar('"')), '"'),
    seq1(1, "'", repeat(notChar("'")), "'")
  )),

  whitespace: repeat(alt(' ', '\t', '\r', '\n'))
};

XMLParser.addActions({
  // Trying to abstract all the details of the parser into one place,
  // and to use a more generic representation in XMLUtil.parse().
  tag: function(xs) {
    // < label ws attributes ws > children </ label >
    // 0 1     2  3          4  5 6        7  8     9

    // Mismatched XML tags
    // TODO: We should be able to set the error message on the ps here.
    if ( xs[1] != xs[8] ) return undefined;

    var obj = { tag: xs[1], attrs: {}, children: xs[6] };

    xs[3].forEach(function(attr) { obj.attrs[attr[0]] = attr[2]; });

    return obj;
  }
});


var XMLUtil = {

  escape: function(str) {
    return str && str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
  },

  unescape: function(str) {
    return str && str.toString()
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
  },

  escapeAttr: function(str) {
    return str && str.replace(/"/g, '&quot;');
  },

  unescapeAttr: function(str) {
    return str && str.replace(/&quot;/g, '"');
  },

  parse: function(str) {
    var result = XMLParser.parseString(str);
    if ( ! result ) return result; // Parse error on undefined.

    // Otherwise result is the <foam> tag.
    return this.parseArray(result.children);
  },

  parseObject: function(tag) {
    var obj = {};
    var self = this;
    tag.children.forEach(function(c) {
      // Ignore children which are not tags.
      if (typeof c === 'object' && c.attrs && c.attrs.name) {
        var result;
        if ( c.attrs.type && c.attrs.type == 'function' ) {
          var code = XMLUtil.unescape(c.children.join(''));
          if ( code.startsWith('function') ) {
            result = eval('(' + code + ')');
          } else {
            result = new Function(code);
          }
        } else {
          result = self.parseArray(c.children);
        }

        obj[self.unescapeAttr(c.attrs.name)] = result;
      }
    });

    if ( !tag.attrs.model ) return obj;
    var model = this.unescapeAttr(tag.attrs.model);
    return GLOBAL[model] ?  GLOBAL[model].create(obj) : obj;
  },

  parseArray: function(a) {
    // Turn <i> tags into primitive values, everything else goes through
    // parseObject.
    // Any loose primitive values are junk whitespace, and ignored.
    var self = this;
    var ret = [];
    a.forEach(function(x) {
      if ( typeof x !== 'object' ) return;
      if ( x.tag == 'i' ) {
        ret.push(XMLUtil.unescape(x.children[0])); // Literal content.
      } else {
        ret.push(self.parseObject(x));
      }
    });

    // Special case: If we found nothing, return all children as a string.
    return ret.length ? ret : XMLUtil.unescape(a.join(''));
  },

  compact: {
    stringify: function(obj) {
      var buf = [];

      this.output(buf.push.bind(buf), obj);

      return '<foam>' + buf.join('') + '</foam>';
    },

    output: function(out, obj) {
      if ( Array.isArray(obj) ) {
        this.outputArray_(out, obj);
      }
      else if ( typeof obj == 'string' ) {
        out(XMLUtil.escape(obj));
      }
      else if ( obj instanceof Function ) {
        this.outputFunction_(out, obj);
      }
      else if ( obj instanceof Date ) {
        out(obj.getTime());
      }
      else if ( obj instanceof Object ) {
        if ( obj.model_ )
          this.outputObject_(out, obj);
        else
          this.outputMap_(out, obj);
      }
      else {
        out(obj);
      }
    },

    outputObject_: function(out, obj) {
      out('<object model="', XMLUtil.escapeAttr(obj.model_.name), '">');

      var properties = obj.model_.getRuntimeProperties();
      for ( var key in properties ) {
        var prop = properties[key];

        if ( prop.name === 'parent' ) continue;
        if ( obj.instance_ && prop.name in obj.instance_ ) {
          var val = obj[prop.name];

          if ( Array.isArray(val) && val.length == 0 ) continue;

          if ( equals(val, prop.defaultValue) ) continue;

          out('<property name="', XMLUtil.escapeAttr(prop.name), '" ' +
              (typeof val === 'function' ? 'type="function"' : '') + '>');
          this.output(out, val);
          out('</property>');
        }
      }

      out('</object>');
    },

    outputMap_: function(out, obj) {
      out('<object>');

      for ( var key in obj ) {
        var val = obj[key];

        out('<property name="', XMLUtil.escapeAttr(key), '">');
        this.output(out, val);
        out('</property>');
      }

      out('</object>');
    },

    outputArray_: function(out, a) {
      if ( a.length == 0 ) return out;

      for ( var i = 0 ; i < a.length ; i++, first = false ) {
        var obj = a[i];

        if (typeof obj === 'string' || typeof obj === 'number')
          out('<i>', XMLUtil.escape(obj), '</i>');
        else
          this.output(out, obj);
      }
    },
    outputFunction_: function(out, f) {
      out(XMLUtil.escape(f.toString()));
    }
  },

  pretty: {
    stringify: function(obj) {
      var buf = [];

      this.output(buf.push.bind(buf), obj);

      return '<foam>\n' + buf.join('') + '</foam>\n';
    },

    output: function(out, obj, opt_indent) {
      var indent = opt_indent || "";

      if ( Array.isArray(obj) ) {
        this.outputArray_(out, obj, indent);
      }
      else if ( typeof obj == 'string' ) {
        out(XMLUtil.escape(obj));
      }
      else if ( obj instanceof Function ) {
        this.outputFunction_(out, obj, indent);
      }
      else if ( obj instanceof Date ) {
        out(obj.getTime());
      }
      else if ( obj instanceof Object ) {
        try {
          if ( obj.model_ && typeof obj.model_ !== 'string' )
            this.outputObject_(out, obj, indent);
          else
            this.outputMap_(out, obj, indent);
        }
        catch (x) {
          console.log('toXMLError: ', x);
        }
      }
      else {
        out(obj);
      }
    },

    outputObject_: function(out, obj, opt_indent) {
      var indent       = opt_indent || "";
      var nestedIndent = indent + "  ";

      out(indent, '<object model="', XMLUtil.escapeAttr(obj.model_.name), '">');

      var properties = obj.model_.getRuntimeProperties();
      for ( var key in properties ) {
        var prop = properties[key];

        if ( prop.name === 'parent' ) continue;
        if ( obj.instance_ && prop.name in obj.instance_ ) {
          var val = obj[prop.name];

          if ( Array.isArray(val) && val.length == 0 ) continue;

          if ( val == prop.defaultValue ) continue;

          var type = typeof obj[prop.name] == 'function' ?
              ' type="function"' : '';
          out("\n", nestedIndent, '<property name="',
              XMLUtil.escapeAttr(prop.name), '"', type, '>');
          this.output(out, val, nestedIndent);
          out('</property>');
        }
      }

      out('\n', indent, '</object>');
      out('\n');
    },

    outputMap_: function(out, obj, opt_indent) {
      var indent       = opt_indent || "";
      var nestedIndent = indent + "  ";

      out(indent, '<object>');

      for ( var key in obj ) {
        var val = obj[key];

        out("\n", nestedIndent, '<property name="', XMLUtil.escapeAttr(key), '">');
        this.output(out, val, nestedIndent);
        out('</property>');
      }

      out("\n", indent, '</object>\n');
    },

    outputArray_: function(out, a, opt_indent) {
      if ( a.length == 0 ) return out;

      var indent       = opt_indent || "";
      var nestedIndent = indent + "  ";

      for ( var i = 0 ; i < a.length ; i++, first = false ) {
        var obj = a[i];

        out('\n');
        if (typeof obj === 'string' || typeof obj === 'number')
          out(nestedIndent, '<i>', XMLUtil.escape(obj), '</i>');
        else
          this.output(out, obj, nestedIndent);
      }
      out('\n',indent);
    },
    outputFunction_: function(out, f, opt_indent) {
      out(XMLUtil.escape(f.toString()) + '\n' + (opt_indent || ''));
    }
  }
};

XMLUtil.stringify = XMLUtil.pretty.stringify.bind(XMLUtil.pretty);
XMLUtil.output = XMLUtil.pretty.output.bind(XMLUtil.pretty);;

/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

GLOBAL.lookupCache_ = {};

function lookup(key) {
  if ( ! key ) return undefined;
  if ( ! ( typeof key === 'string' ) ) return key;

  var root  = this

  var cache;

//  if ( this.hasOwnProperty('lookupCache_') ) {
    cache = this.lookupCache_;
//  } else {
//    cache = this.lookupCache_ = {};
//  }

  var ret = cache[key];

  // Special case for unregistered global models.
  if ( ret === undefined && key.indexOf('.') == -1 ) {
    ret = GLOBAL[key];
  }

  if ( ret === undefined ) {
    var path = key.split('.');
    for ( var i = 0 ; root && i < path.length ; i++ ) root = root[path[i]];
    ret = root;
    cache[key] = ret ? ret : null; // implements negative-caching
  }

  return ret;
}


/** Update a Context binding. **/
function set(key, value) {
  // It looks like the chrome debug console is overwriting
  // sub.window, but this prevents it.
  Object.defineProperty(
    this,
    key,
    {
      value: value,
      writable: key !== 'window',
      configurable: true
    });

  if ( GLOBAL.SimpleReadOnlyValue && key !== '$' && key !== '$$' )
    this[key + '$'] = SimpleReadOnlyValue.create({value: value});
}


function setValue(key, value) {
  var X = this;

  Object.defineProperty(
    this,
    key,
    {
      get: function() { return value.get(); },
      configurable: true
    }
  );

  if ( key !== '$' && key !== '$$' ) this[key + '$'] = value;
}


/** Create a sub-context, populating with bindings from opt_args. **/
function sub(opt_args, opt_name) {
  var sub = Object.create(this);

  if ( opt_args ) for ( var key in opt_args ) {
    if ( opt_args.hasOwnProperty(key) ) {
      var asValue = key !== '$' && key != '$$' && key.charAt(key.length-1) == '$';
      if ( asValue ) {
        sub.setValue(key.substring(0, key.length-1), opt_args[key]);
      } else {
        sub.set(key, opt_args[key]);
      }
    }
  }

  if ( opt_name ) {
    sub.NAME = opt_name;
    // This was commented out because it appears to be very slow
//    sub.toString = function() { return 'CONTEXT(' + opt_name + ')'; };
//    sub.toString = function() { return 'CONTEXT(' + opt_name + ', ' + this.toString() + ')'; };
  }

//  console.assert(this.lookupCache_, 'Missing cache.');
//  sub.lookupCache_ = Object.create(this.lookupCache_);

  return sub;
}


function subWindow(w, opt_name, isBackground) {
  if ( ! w ) return this.sub();

  return foam.ui.Window.create({window: w, name: opt_name, isBackground: isBackground}, this).Y;
}

var X = {
  lookupCache_: GLOBAL.lookupCache_,
  sub: sub,
  subWindow: subWindow,
  set: set,
  lookup: lookup,
  setValue: setValue,
  GLOBAL: GLOBAL
};

var foam = X.foam = {};

var registerFactory = function(model, factory) {
  // TODO
};

var registerModelForModel = function(modelType, targetModel, model) {

};

var registerFactoryForModel = function(factory, targetModel, model) {

};

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

/**
 * JSON Parser.
 */
var JSONParser = SkipGrammar.create({
  __proto__: grammar,

  START: copyInput(sym('objAsString')),

  objAsString: copyInput(sym('obj')),

  obj: seq1(1, '{', repeat(sym('pair'), ','), '}'),
    pair: seq(sym('key'), ':', sym('value')),

      key: alt(
        sym('symbol'),
        sym('string')),

        symbol: noskip(str(seq(sym('char'), str(repeat(sym('alpha')))))),
          char: alt(range('a','z'), range('A','Z'), '_', '$'),
          // Slightly faster to inline sym('char') until AltParser does it automatically
          alpha: alt(range('a','z'), range('A','Z'), '_', '$', /* sym('char') */ range('0', '9')),

  // TODO(kgr): This should just be 'alt' but that isn't working for some
  // unknown reason. Probably related to SkipGrammar.  Fix and change to
  // just 'alt'.
  value: simpleAlt(
    sym('null'),
    sym('undefined'),
    sym('function literal'),
    sym('expr'),
    sym('number'),
    sym('string'),
    sym('obj'),
    sym('bool'),
    sym('array')
  ),

  "null": literal("null"),
  "undefined": literal("undefined"),

  expr: str(seq(
    sym('symbol'), optional(str(alt(
      seq('.', sym('expr')),
      seq('(', str(repeat(sym('value'), ',')), ')')))))),

  number: noskip(seq(
    optional('-'),
    repeat(range('0', '9'), null, 1),
    optional(seq('.', repeat(range('0', '9')))))),

  string: noskip(alt(
    sym('single quoted string'),
    sym('double quoted string'))),

    'double quoted string': seq1(1, '"', str(repeat(sym('double quoted char'))), '"'),
    'double quoted char': alt(
      sym('escape char'),
      literal('\\"', '"'),
      notChar('"')),

    'single quoted string': seq1(1, "'", str(repeat(sym('single quoted char'))), "'"),
    'single quoted char': alt(
      sym('escape char'),
      literal("\\'", "'"),
      notChar("'")),

    'escape char': alt(
      literal('\\\\', '\\'),
      literal('\\n', '\n')),

  bool: alt(
    literal('true', true),
    literal('false', false)),

  array: seq1(1, '[', repeat(sym('value'), ','), ']'),

  'function prototype': seq(
    'function',
    optional(sym('symbol')),
    '(',
    repeat(sym('symbol'), ','),
    ')'),

  'function literal': seq(
    sym('function prototype'),
    '{',
    repeat(notChar('}')), // TODO(kgr): this is a very cheap/limited hack, replace with real JS grammar.
//    repeat(sym('value'), ';'), // TODO(kgr): replace with 'statement'.
    '}')

}.addActions({
  obj: function(v) {
    var m = {};
    for ( var i = 0 ; i < v.length ; i++ ) m[v[i][0]] = v[i][2];
    return m;
  },
  "null": function() { return null; },
  "undefined": function() { return undefined; },
  "number": function(v) {
    var str = ""
    if ( v[0] ) {
      str += v[0];
    }
    str += v[1].join("");
    if ( v[2] ){
      str += v[2][0] + v[2][1].join("");
    }
    return v[2] ? parseFloat(str) : parseInt(str);
  }
}), repeat0(alt(' ', '\t', '\n', '\r')));

/*
TODO: move to FUNTest
var res = JSONParser.parseString('{a:1,b:"2",c:false,d:f(),e:g(1,2),f:h.j.k(1),g:[1,"a",false,[]]}');
console.log(res);
*/

/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

/**
 * Simple template system modelled after JSP's.
 *
 * Syntax:
 *    <% code %>: code inserted into template, but nothing implicitly output
 *    <%= comma-separated-values %>: all values are appended to template output
 *    <%# expression %>: dynamic (auto-updating) expression is output
 *    \<new-line>: ignored
 *    %%value(<whitespace>|<): output a single value to the template output
 *    $$feature(<whitespace>|<): output the View or Action for the current Value
 */

MODEL({
  name: 'TemplateParser',
  extends: 'grammar',

  methods: {
    START: sym('markup'),

    markup: repeat0(alt(
      sym('comment'),
      sym('foamTag'),
      sym('create child'),
      sym('simple value'),
      sym('live value tag'),
      sym('raw values tag'),
      sym('values tag'),
      sym('code tag'),
      sym('ignored newline'),
      sym('newline'),
      sym('single quote'),
      sym('text')
    )),

    'comment': seq1(1, '<!--', repeat0(not('-->', anyChar)), '-->'),

    'foamTag': sym('foamTag_'),
    'foamTag_': function() { }, // placeholder until gets filled in after HTMLParser is built

    'create child': seq(
      '$$',
      repeat(notChars(' $\r\n<{,.')),
      optional(JSONParser.export('objAsString'))),

    'simple value': seq('%%', repeat(notChars(' ()-"\r\n><:;,')), optional('()')),

    'live value tag': seq('<%#', repeat(not('%>', anyChar)), '%>'),

    'raw values tag': alt(
      seq('<%=', repeat(not('%>', anyChar)), '%>'),
      seq('{{{', repeat(not('}}}', anyChar)), '}}}')
    ),

    'values tag': seq('{{', repeat(not('}}', anyChar)), '}}'),

    'code tag': seq('<%', repeat(not('%>', anyChar)), '%>'),
    'ignored newline': alt(
      literal('\\\r\\\n'),
      literal('\\\n')
    ),
    newline: alt(
      literal('\r\n'),
      literal('\n')
    ),
    'single quote': literal("'"),
    text: anyChar
  }
});


var TemplateOutput = {
  /**
   * obj - Parent object.  If objects are output and have an initHTML() method, then they
   * are added to the parent by calling obj.addChild().
   **/
  // TODO(kgr): redesign, I think this is actually broken.  If we call appendHTML() of
  // a sub-view then it will be added to the wrong parent.
  create: function(obj) {
    console.assert(obj, 'Owner required when creating TemplateOutput.');
    var buf = [];
    var f = function templateOut(/* arguments */) {
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        var o = arguments[i];
        if ( typeof o === 'string' ) {
          buf.push(o);
        } else if ( o && 'Element' === o.name_ ) {
          // Temporary bridge for working with foam.u2 Views
          var s = o.createOutputStream();
          o.output(s);
          buf.push(s.toString());
          // Needs to be bound, since o is a loop variable and will otherwise
          // be the final element of the arguments array, not the correct one.
          obj.addChild({ initHTML: o.load.bind(o) });
        } else {
          if ( o && o.toView_ ) o = o.toView_();
          if ( ! ( o === null || o === undefined ) ) {
            if ( o.appendHTML ) {
              o.appendHTML(this);
            } else if ( o.toHTML ) {
              buf.push(o.toHTML());
            } else {
              buf.push(o);
            }
            if ( o.initHTML && obj && obj.addChild ) obj.addChild(o);
          }
        }
      }
    };

    f.toString = function() {
      if ( buf.length === 0 ) return '';
      if ( buf.length > 1 ) buf = [buf.join('')];
      return buf[0];
    }

    return f;
  }
};


// Called from generated template code.
function elementFromString(str) {
  return str.element || ( str.element = HTMLParser.create().parseString(str).children[0] );
}

var ConstantTemplate = function(str) {
  var TemplateOutputCreate = TemplateOutput.create.bind(TemplateOutput);
  var f = function(opt_out) {
    var out = opt_out ? opt_out : TemplateOutputCreate(this);
    out(str);
    return out.toString();
  };

  f.toString = function() {
    return 'ConstantTemplate("' + str.replace(/\n/g, "\\n").replace(/"/g, '\\"').replace(/\r/g, '') + '")';
  };

  return f;
};

var TemplateCompiler = {
  __proto__: TemplateParser,

  out: [],

  simple: true, // True iff the template is just one string literal.

  push: function() { this.simple = false; this.pushSimple.apply(this, arguments); },

  pushSimple: function() { this.out.push.apply(this.out, arguments); }

}.addActions({
  markup: function (v) {
    var wasSimple = this.simple;
    var ret = wasSimple ? null : this.out.join('');
    this.out = [];
    this.simple = true;
    return [wasSimple, ret];
  },

  'create child': function(v) {
    var name = v[1].join('');
    this.push(
      "', self.createTemplateView('", name, "'",
      v[2] ? ', ' + v[2] : '',
      "),\n'");
  },
  foamTag: function(e) {
    // A Feature
    var fName = e.getAttribute('f');
    if ( fName ) {
      this.push("', self.createTemplateView('", fName, "',{}).fromElement(FOAM(");
      this.push(JSONUtil.where(NOT_TRANSIENT).stringify(e));
      this.push('))');
    }
    // A Model
    else {
      this.push("', (function() { var tagView = X.foam.ui.FoamTagView.create({element: FOAM(");
      this.push(JSONUtil.where(NOT_TRANSIENT).stringify(e));
      this.push(')}, Y); self.addDataChild(tagView); return tagView; })() ');
    }

    this.push(",\n'");
  },
  'simple value': function(v) { this.push("',\n self.", v[1].join(''), v[2], ",\n'"); },
  'raw values tag': function (v) { this.push("',\n", v[1].join(''), ",\n'"); },
  'values tag':     function (v) { this.push("',\nescapeHTML(", v[1].join(''), "),\n'"); },
  'live value tag': function (v) { this.push("',\nself.dynamicTag('span', function() { return ", v[1].join(''), "; }.bind(this)),\n'"); },
  'code tag': function (v) { this.push("');\n", v[1].join(''), ";out('"); },
  'single quote': function () { this.pushSimple("\\'"); },
  newline: function () { this.pushSimple('\\n'); },
  text: function(v) { this.pushSimple(v); }
});


MODEL({
  name: 'TemplateUtil',

  constants: {
    HEADER: 'var self = this, X = this.X, Y = this.Y;' +
        'var out = opt_out ? opt_out : TOC(this);' +
        "out('",
    FOOTERS: {
      html: "');return out.toString();",
      css: "');return X.foam.grammars.CSSDecl.create({model:this.model_}).parser.parseString(out.toString());"
    },
  },

  methods: {
    /** Create a method which only compiles the template when first used. **/
    lazyCompile: function(t) {
      var delegate;

      var f = function() {
        if ( ! delegate ) {
          if ( ! t.template )
            throw 'Must arequire() template model before use for ' + this.name_ + '.' + t.name;
          else
            delegate = TemplateUtil.compile(Template.isInstance(t) ? t : Template.create(t), this.model_);
        }

        return delegate.apply(this, arguments);
      };

      f.toString = function() { return delegate ? delegate.toString() : t.toString(); };

      return f;
    },

    compile_: function(t, code, model) {
      var args = ['opt_out'];
      for ( var i = 0 ; i < t.args.length ; i++ ) {
        args.push(t.args[i].name);
      }
      return eval(
        '(function() { ' +
          'var escapeHTML = XMLUtil.escape, TOC = TemplateOutput.create.bind(TemplateOutput); ' +
          'return function(' + args.join(',') + '){' + code + '};})()' +
          (model && model.id ? '\n\n//# sourceURL=' + model.id.replace(/\./g, '/') + '.' + t.name + '\n' : ''));
    },
    parseCSS: function(t, model) {
      var parser = this.CSSParser_ || ( this.CSSParser_ = X.foam.grammars.CSSDecl.create());
      parser.model = model;
      return parser.parser.parseString(t).toString();
    },
    parseU2: function(template, t, model) {
      X.foam.u2.ElementParser.getPrototype();

      var parser = this.U2Parser_ || ( this.U2Parser_ = X.foam.u2.ElementParser.parser__.create() );
      parser.modelName_ = cssClassize(model.id);
      var out = parser.parseString(
        t.trim(),
        template.name === 'initE' ? parser.initTemplate : parser.template);
      return out.toString();
    },
    compile: function(t, model) {
      if ( t.name !== 'CSS' ) {
        // TODO: this doesn't work
        if ( model.isSubModel(X.lookup('foam.u2.Element')) ) {
          return eval('(function() { return ' + this.parseU2(t, t.template, model) + '; })()');
        }
        if ( t.template.startsWith('#U2') ) {
          var code = '(function() { return ' + this.parseU2(t, t.template.substring(3), model) + '; })()';
          return eval(code);
        }
      }
      // Parse result: [isSimple, maybeCode]: [true, null] or [false, codeString].
      var parseResult = TemplateCompiler.parseString(t.template);

      // Simple case, just a string literal
      if ( parseResult[0] )
        return ConstantTemplate(t.language === 'css' ?
            this.parseCSS(t.template, model) :
            t.template) ;

      var code = this.HEADER + parseResult[1] + this.FOOTERS[t.language];

      // Need to compile an actual method
      try {
        return this.compile_(t, code, model);
      } catch (err) {
        console.log('Template Error: ', err);
        console.log(parseResult);
        return function() {};
      }
    },

    /**
     * Combinator which takes a template which expects an output parameter and
     * converts it into a function which returns a string.
     */
    stringifyTemplate: function (template) {
      return function() {
        var buf = [];

        this.output(buf.push.bind(buf), obj);

        return buf.join('');
      };
    },

    expandTemplate: function(self, t, opt_X) {
      /*
       * If a template is supplied as a function, treat it as a multiline string.
       * Parse function arguments to populate template.args.
       * Load template from file if external.
       * Setup template future.
       */
      var X = opt_X || self.X;

      if ( typeof t === 'function' ) {
        t = X.Template.create({
          name: t.name,
          // ignore first argument, which should be 'opt_out'
          args: t.toString().match(/\((.*?)\)/)[1].split(',').slice(1).map(function(a) {
            return X.Arg.create({name: a.trim()});
          }),
          template: multiline(t)});
      } else if ( typeof t === 'string' ) {
        t = docTemplate = X.Template.create({
          name: 'body',
          template: t
        });
      } else if ( ! t.template && ! t.code ) {
        t = X.Template.create(t);
        var future = afuture();
        var path   = self.sourcePath;

        t.futureTemplate = future.get;
        path = path.substring(0, path.lastIndexOf('/')+1);
        path += t.path ? t.path : self.name + '_' + t.name + '.ft';

        if ( typeof vm == "undefined" || ! vm.runInThisContext ) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", path);
          xhr.asend(function(data) {
            t.template = data;
            future.set(Template.create(t));
          });
        } else {
          var fs = require('fs');
          fs.readFile(path, function(err, data) {
            t.template = data.toString();
            future.set(Template.create(t));
          });
        }
      } else if ( typeof t.template === 'function' ) {
        t.template = multiline(t.template);
      }

      if ( ! t.futureTemplate ) t.futureTemplate = aconstant(t);

      // We haven't FOAMalized the template, and there's no crazy multiline functions.
      // Note that Model and boostrappy models must use this case, as Template is not
      // yet defined at bootstrap time. Use a Template object definition with a bare
      // string template body in those cases.
      if ( ! t.template$ ) {
        t = ( typeof X.Template !== 'undefined' ) ? JSONUtil.mapToObj(X, t, X.Template) : t ;
      }

      return t;
    },

    expandModelTemplates: function(self) {
      var templates = self.templates;
      for ( var i = 0; i < templates.length; i++ ) {
        templates[i] = TemplateUtil.expandTemplate(self, templates[i]);
      }
    }
  }
});


/** Is actually synchronous but is replaced in ChromeApp with an async version. **/
var aeval = function(src) {
  return aconstant(eval('(' + src + ')'));
};

var aevalTemplate = function(t, model) {
  return aseq(
    t.futureTemplate,
    function(ret, t) {
      ret(TemplateUtil.lazyCompile(t));
    });
};

var escapeHTML = XMLUtil.escape, TOC = TemplateOutput.create.bind(TemplateOutput);

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

var $documents = [];

if ( window ) $documents.push(window.document);

// TODO: clean this up, hide $WID__ in closure
var $WID__ = 0;
function $addWindow(w) {
   w.window.$WID = $WID__++;
   $documents.push(w.document);
}
function $removeWindow(w) {
  for ( var i = $documents.length - 1 ; i >= 0 ; i-- ) {
    if ( ! $documents[i].defaultView || $documents[i].defaultView === w )
      $documents.splice(i,1);
  }
}

/** Replacement for getElementById **/
// TODO(kgr): remove this is deprecated, use X.$ instead()
var $ = function (id) {
  console.log('Deprecated use of GLOBAL.$.');
  for ( var i = 0 ; i < $documents.length ; i++ ) {
    if ( document.FOAM_OBJECTS && document.FOAM_OBJECTS[id] )
      return document.FOAM_OBJECTS[id];

    var ret = $documents[i].getElementById(id);

    if ( ret ) return ret;
  }
  return undefined;
};
/** Replacement for getElementByClassName **/
// TODO(kgr): remove this is deprecated, use X.$$ instead()
var $$ = function (cls) {
  console.log('Deprecated use of GLOBAL.$$.');
  for ( var i = 0 ; i < $documents.length ; i++ ) {
    var ret = $documents[i].getElementsByClassName(cls);

    if ( ret.length > 0 ) return ret;
  }
  return [];
};


var FOAM = function(map, opt_X, seq) {
   var obj = JSONUtil.mapToObj(opt_X || X, map, undefined, seq);
   return obj;
};

/**
 * Register a lazy factory for the specified name within a
 * specified context.
 * The first time the name is looked up, the factory will be invoked
 * and its value will be stored in the named slot and then returned.
 * Future lookups to the same slot will return the originally created
 * value.
 **/
FOAM.putFactory = function(ctx, name, factory) {
  ctx.__defineGetter__(name, function() {
    console.log('Bouncing Factory: ', name);
    delete ctx[name];
    return ctx[name] = factory();
  });
};


var   USED_MODELS = {};
var UNUSED_MODELS = {};
var NONMODEL_INSTANCES = {}; // for things such as interfaces

FOAM.browse = function(model, opt_dao, opt_X) {
   var Y = opt_X || X.sub(undefined, "FOAM BROWSER");

   if ( typeof model === 'string' ) model = Y[model];

   var dao = opt_dao || Y[model.name + 'DAO'] || Y[model.plural];

   if ( ! dao ) {
      Y[model.name + 'DAO'] = [].dao;
   }

   var ctrl = Y.foam.ui.DAOController.create({
     model:     model,
     dao:       dao,
     useSearchView: false
   });

  if ( ! Y.stack ) {
    var w = opt_X ? opt_X.window : window;
    Y.stack = Y.foam.ui.StackView.create();
    var win = Y.foam.ui.layout.Window.create({ window: w, data: Y.stack }, Y);
    document.body.insertAdjacentHTML('beforeend', win.toHTML());
    win.initHTML();
    Y.stack.setTopView(ctrl);
  } else {
    Y.stack.pushView(ctrl);
  }
};


var arequire = function(modelName) {
  // If arequire is called as a global function, default to the
  // top level context X.
  var THIS = this === GLOBAL ? X : this;

  var model = THIS.lookup(modelName);
  if ( ! model ) {
    if ( ! THIS.ModelDAO ) {
      // if ( modelName !== 'Template' ) console.warn('Unknown Model in arequire: ', modelName);
      return aconstant();
    }

    // check whether we have already hit the ModelDAO to load the model
    if ( ! THIS.arequire$ModelLoadsInProgress ) {
      THIS.set('arequire$ModelLoadsInProgress', {} );
    } else {
      if ( THIS.arequire$ModelLoadsInProgress[modelName] ) {
        return THIS.arequire$ModelLoadsInProgress[modelName];
      }
    }

    var future = afuture();
    THIS.arequire$ModelLoadsInProgress[modelName] = future.get;

    THIS.ModelDAO.find(modelName, {
      put: function(m) {
        // Contextualize the model for THIS context
        m.X = THIS;

        var next_ = function(m) {
          THIS.arequire$ModelLoadsInProgress[modelName] = false;
          THIS.GLOBAL.X.registerModel(m);

          if ( ! THIS.lookupCache_[m.id] )
            THIS.lookupCache_[m.id] = m;
          future.set(m);
        };

        if ( m.arequire ) {
          m.arequire()(next_);
        } else {
          next_(m);
        }
      },
      error: function() {
        var args = argsToArray(arguments);
        if ( modelName !== 'DocumentationProperty' )
          console.warn.apply(console, ['Could not load model: ', modelName].concat(args));
        THIS.arequire$ModelLoadsInProgress[modelName] = false;
        future.set(undefined);
      }
    });

    return future.get;
  }

  return model.arequire ? model.arequire() : aconstant(model);
}

var FOAM_POWERED = '<a style="text-decoration:none;" href="https://github.com/foam-framework/foam/" target="_blank">\
<font size=+1 face="catull" style="text-shadow:rgba(64,64,64,0.3) 3px 3px 4px;">\
<font color="#3333FF">F</font><font color="#FF0000">O</font><font color="#FFCC00">A</font><font color="#33CC00">M</font>\
<font color="#555555" > POWERED</font></font></a>';

/** Lookup a '.'-separated package path, creating sub-packages as required. **/
function packagePath(X, path) {
  function packagePath_(Y, path, i) {
    if ( i === path.length ) return Y;
    if ( ! Y[path[i]] ) {
      Y[path[i]] = {};
      // console.log('************ Creating sub-path: ', path[i]);
      if ( i == 0 ) GLOBAL[path[i]] = Y[path[i]];
    }
    return packagePath_(Y[path[i]], path, i+1);
  }
  return path ? packagePath_(X, path.split('.'), 0) : GLOBAL;
}

function registerModel(model, opt_name, fastMode) {
  var root = model.package ? this : GLOBAL;
  var name = model.name;
  var pack = model.package;

  if ( opt_name ) {
    var a = opt_name.split('.');
    name = a.pop();
    pack = a.join('.');
  }

  var modelRegName = (pack ? pack + '.' : '') + name;

  if ( root === GLOBAL || root === X ) {
    var path = packagePath(root, pack);
    if ( fastMode )
      path[name] = model;
    else
      Object.defineProperty(path, name, { value: model, configurable: true });
    if ( path === GLOBAL ) {
      path = X;
      if ( fastMode )
        path[name] = model;
      else
        Object.defineProperty(path, name, { value: model, configurable: true });
    }
  }

  if ( ! Object.hasOwnProperty.call(this, 'lookupCache_') ) {
    this.lookupCache_ = Object.create(this.lookupCache_ || Object.prototype);
  }
  this.lookupCache_[modelRegName] = model;

  this.onRegisterModel(model);
}


var CLASS = function(m) {

  // Don't Latch these Models, as we know that we'll need them on startup
  var EAGER = {
    'Method': true,
    'BooleanProperty': true,
    'Action': true,
    'FunctionProperty': true,
    'Constant': true,
    'Message': true,
    'ArrayProperty': true,
    'StringArrayProperty': true,
    'Template': true,
    'Arg': true,
    'Relationship': true,
    'ViewFactoryProperty': true,
    'FactoryProperty': true,
    'foam.ui.Window': true,
    'StringProperty': true,
    'foam.html.Element': true,
    'Expr': true,
    'AbstractDAO': true
  };

  /** Lazily create and register Model first time it's accessed. **/
  function registerModelLatch(path, m) {
    var id = m.package ? m.package + '.' + m.name : m.name;

    if ( EAGER[id] ) {
      USED_MODELS[id] = true;
      var work = [];
      var model = JSONUtil.mapToObj(X, m, Model, work);
      if ( work.length > 0 ) {
        model.extra__ = aseq.apply(null, work);
      }

      X.registerModel(model, undefined, true);

      return model;
    }

    GLOBAL.lookupCache_[id] = undefined;
    UNUSED_MODELS[id] = true;
    var triggered = false;

    //console.log("Model Getting defined: ", m.name, X.NAME);
    Object.defineProperty(m.package ? path : GLOBAL, m.name, {
      get: function triggerModelLatch() {
        if ( triggered ) return null;
        triggered = true;
        // console.time('registerModel: ' + id);
        USED_MODELS[id] = true;
        UNUSED_MODELS[id] = undefined;

        var work = [];
        // console.time('buildModel: ' + id);
        var model = JSONUtil.mapToObj(X, m, Model, work);
        // console.timeEnd('buildModel: ' + id);

        if ( work.length > 0 ) {
          model.extra__ = aseq.apply(null, work);
        }

        X.registerModel(model);

        // console.timeEnd('registerModel: ' + id);
        return model;
      },
      configurable: true
    });
  }

  if ( document && document.currentScript ) m.sourcePath = document.currentScript.src;

  registerModelLatch(packagePath(X, m.package), m);
}

MODEL = CLASS;

function INTERFACE(imodel) {
  // Unless in DEBUG mode, just discard interfaces as they're only used for type checking.
  // if ( ! DEBUG ) return;
  var i = JSONUtil.mapToObj(X, imodel, Interface);
  packagePath(X, i.package)[i.name] = i;

  var id = i.package ? i.package + '.' + i.name : i.name;
  NONMODEL_INSTANCES[id] = true;
}

// For non-CLASS modeled things, like Enums.
function __DATA(obj) {
  var pkg = obj.package ?
      obj.package :
      obj.id.substring(0, obj.id.lastIndexOf('.'));

  var name = obj.name ?
      obj.name :
      obj.id.substring(obj.id.lastIndexOf('.') + 1);

  var path = packagePath(X, pkg);

  var triggered  = false;

  Object.defineProperty(path, name, {
    get: function triggerDataLatch() {
      if ( triggered ) return null;
      triggered = true;

      var object = JSONUtil.mapToObj(X, obj);

      X.registerModel(object);

      return object;
    },
    configurable: true
  });
}

/** Called when a Model is registered. **/
function onRegisterModel(m) {
  if ( ! m.package ) {
    GLOBAL[m.name] = m;
  }
}

X.$ = $;
X.$$ =$$;
X.registerModel = registerModel;
X.arequire = arequire;
X.onRegisterModel = onRegisterModel;

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
 * The Prototype for all Generated Prototypes.
 * The common ancestor of all FOAM Objects.
 **/
var FObject = {
  __proto__: PropertyChangeSupport,

  name_: 'FObject',

  get Y() {
    return Object.prototype.hasOwnProperty.call(this, 'Y_') ?
        this.Y_ :
        ( this.Y_ = DEBUG ?
        this.X.sub({}, (this.X.NAME ? this.X.NAME : '') + '_' + this.name_ ) : this.X.sub() );
  },

  replaceModel_: function(feature, dataModel, X) {
    // Removed the loop here because there are cases where following
    // registrations on the superclasses of my model is useful, and cases where
    // it is not. The key difference is that if this code is not recursive, I
    // can easily add registrations for eg. MySpecialEmail uses EmailDetailView.
    // When this code is recursive, there's no good way to stop it from doing
    // the replacement, if that's what I want.
    // while ( dataModel ) {
      // Try looking up the replacment in the same package as
      // the specifier:
      // i.e. [foam.u2].View + model:my.package.Email ==> my.package.EmailView
      // (Note: this will replace anything named View, as the to-be-replaced package is ignored)
      replacementName =                                 
        ( dataModel.package   ? dataModel.package + '.' : '' ) +
        ( dataModel.name ? dataModel.name     : dataModel ) +
        feature.name;

      var replacementModel = X.lookup(replacementName);
      if ( replacementModel ) return replacementModel;

      //dataModel = X.lookup(dataModel.extends);
    //}

    return undefined;
  },

  create_: function() { return Object.create(this); },

  create: function(args, opt_X) {
    // console.log('**** create ', this.model_.name, this.model_.count__ = (this.model_.count__ || 0)+1);
    // check for a model-for-model replacement, only if args.model is a Model instance
    var dataModel = args ?
        args.model ? args.model :
        args.data ? args.data.model_ :
        undefined : undefined;

    if ( dataModel && (opt_X || X).Model.isInstance(dataModel) ) {
      var ret = this.replaceModel_(this.model_, dataModel, opt_X || X);
      if ( ret ) return ret.create(args, opt_X);
    }

//    window.CREATES = (window.CREATES || {});
//    var id = this.model_.id ||
//      ((this.model_.package ? this.model_.package + '.' : '' ) + this.model_.name);

//    var log = window.CREATES[id] = window.CREATES[id] || {
//      count:0,
//      min: Infinity,
//      max: 0,
//      sum: 0,
//      all: []
//    };
//    log.count++;
//    var time = window.performance.now();

    var o = this.create_(this);
    o.instance_ = {};
    // Safari doesn't like to actually set this variable sometimes so we loop on
    // it until it takes.
    // TODO: Figure out why this is necessary and fix it properly.
    while (!o.instance_) {
      o.instance_ = {};
    }
    o.X = opt_X || X;

    if ( this.model_.instance_.imports_ && this.model_.instance_.imports_.length ) {
      if ( ! Object.prototype.hasOwnProperty.call(this, 'imports__') ) {
        this.imports__ = this.model_.instance_.imports_.map(function(e) {
          var s = e.split(' as ');
          return [s[0], s[1] || s[0]];
        });
      }
      for ( var i = 0 ; i < this.imports__.length ; i++ ) {
        var im = this.imports__[i];
        // Don't import from Context if explicitly passed in args
        if ( ( ! args || ! args.hasOwnProperty(im[1]) ) && typeof o.X[im[0]] !== 'undefined' ) o[im[1]] = o.X[im[0]];
      }
    }

//    if ( typeof args === 'object' ) o.copyFrom(args);

    if ( o.model_ ) {
      var agents = this.initAgents();
      for ( var i = 0 ; i < agents.length ; i++ ) agents[i][1](o, o.X, args);
    }

    o.init(args);

//    var end = window.performance.now();
//    time = end - time;
//    log.min = Math.min(time, log.min);
//    if ( time > log.max ) {
//      log.max = time;
//      log.maxObj = o;
//    }
//    log.all.push({
//      name: o.name,
//      time: time,
//      obj: o,
//    });
//    log.sum += time;
//    log.avg = log.sum / log.count;

    return o;
  },

  init: nop,

  // TODO: document
  xbind: function(map) {
    var newModel = {
      __proto__: this,
      create: function(args, X) {
        var createArgs = {};
        var key;

        // If args is a modelled object, just keep data from instance_.
        // TODO(kgr): Remove instance_ part when FObject.hasOwnProperty removed.
        args = args ? (args.instance_ || args) : {};

        for ( key in args ) {
          if ( args.hasOwnProperty(key) ) createArgs[key] = args[key];
        }
        for ( key in map ) {
          if ( ! createArgs.hasOwnProperty(key) ) createArgs[key] = map[key];
        }
        return this.__proto__.create(createArgs, X);
      },
      xbind: function(m2) {
        for ( var key in map ) {
          if ( ! m2.hasOwnProperty(key) ) m2[key] = map[key];
        }
        return this.__proto__.xbind(m2);
      }
    };

    if ( this.required__ )
      newModel.required__ = aseq(this.required__, aconstant(newModel));

    return newModel;
  },

  /** Context defaults to the global namespace by default. **/
  X: X,

  addInitAgent: function(priority, desc, agent) {
    agent.toString = function() { return desc; };
    this.initAgents_.push([priority, agent]);
  },

  initAgents: function() {
    if ( ! this.model_ ) return;

    // this == prototype
    if ( ! Object.hasOwnProperty.call(this, 'initAgents_') ) {
      var agents = this.initAgents_ = [];
      var self = this;

      // Four cases for export: 'this', a method, a property value$, a property
      Object_forEach(this.model_.instance_.exports_, function(e) {
        var exp = e.split('as ');

        if ( exp.length == 0 ) return;

        var key   = exp[0].trim();
        var alias = exp[1] || exp[0];

        if ( key ) {
          var asValue = key !== '$' && key != '$$' && key.charAt(key.length-1) == '$';
          if ( asValue ) {
            console.warn('Deprecated use of value$ export. Just remove the $. ', self.model_.id, this.name, key, alias);
          }
          if ( asValue ) key = key.slice(0, key.length-1);

          var prop = self.model_.getProperty(key);
          if ( prop ) {
            if ( asValue ) {
              self.addInitAgent(1, 'export property value ' + key, function(o, X) { o.Y.set(alias, o[prop.name$_]); });
            } else {
              self.addInitAgent(1, 'export property '       + key, function(o, X) { o.Y.setValue(alias, o[prop.name$_]); });
            }
          } else {
            self.addInitAgent(0, 'export other ' + key, function(o, X) {
              var out = typeof o[key] === "function" ? o[key].bind(o) : o[key];
              o.Y.set(alias, out);
            });
          }
        } else {
          // Exporting 'this'
          self.addInitAgent(0, 'export this', function(o, X) { o.Y.set(alias, o); });
        }
      });

      var fastInit = {
        Property: true,
        Method: true,
/*        Listener: true,
        Action: true,
        Constant: true,
        Message: true,
        Template: true,
        PropertyView: true,
//        TextFieldView: true,
        SimpleValue: true,
        DocumentationProperty: true,
//        Model: true,
        IntProperty: true,
        Element: true,
        StringProperty: true,
        BooleanProperty: true
*/      }[this.name_];

      if ( fastInit ) {
        var keys = {};
        var ps = this.model_.getRuntimeProperties();
        for ( var i = 0 ; i < ps.length ; i++ ) {
          var prop = ps[i];
          keys[prop.name] = keys[prop.name$_] = true;
        }
        this.addInitAgent(0, 'fast copy args', function fastCopyArgs(o, X, m) {
          if ( ! m ) return;
          if ( m.instance_ ) {
            m = m.instance_;
            for ( var key in m ) o[key] = m[key];
          } else {
            for ( var key in m ) if ( keys[key] ) o[key] = m[key];
          }
        });
      } /*else {
        this.addInitAgent(0, 'fast copy args', function(o, X, m) {
          console.log('slowInit: ', self.name_);
        });

      }*/

      var ps = this.model_.getRuntimeProperties();
      for ( var i = 0 ; i < ps.length ; i++ ) {
        var prop = ps[i];
        if ( prop.initPropertyAgents ) {
          prop.initPropertyAgents(self, fastInit);
        } else {
          (function (name) {
            self.addInitAgent(
              0,
              'set proto-property ' + name,
              function setProtoProperty(o, X, m) {
                if ( m && m.hasOwnProperty(name) )
                  o[name] = m[name];
              });
          })(prop.name);
        }
      }

      /*
      this.addInitAgent(9, 'copyFrom', function(o, X, m) {
        if( m ) for ( var key in m ) o[key] = m[key];
      });
      */
      // Add shortcut create() method to Models
      self.addInitAgent(0, 'Add create() to Model', function(o, X) {
        if ( Model.isInstance(o) && o.name != 'Model' ) o.create = BootstrapModel.create;
      });

      // Works if sort is 'stable', which it isn't in Chrome
      // agents.sort(function(o1, o2) { return o1[0] - o2[0]; });

      // TODO(kgr): make a stableSort() function in stdlib
      for ( var i = 0 ; i < agents.length ; i++ ) agents[i][2] = i;
      agents.sort(CompoundComparator(
        function(o1, o2) { return o1[0] - o2[0]; },
        function(o1, o2) { return o1[2] - o2[2]; }));

      // For debugging, prints list of init agents.
      /*
      for ( var i = 0 ; i < agents.length ; i++ )
        console.log(i, agents[i][0], agents[i][1].toString());
      */
    }

    return this.initAgents_;
  },

  fromElement: function(e) {
    var RESERVED_ATTRS = {
      id: true, model: true, view: true, showactions: true, oninit: true
    };
    var elements = this.elementMap_;

    // Build a map of properties keyed off of 'name'
    // TODO: do we have a method to lookupIC?
    if ( ! elements ) {
      elements = {};
      var properties = this.model_.getRuntimeProperties();
      for ( var i = 0 ; i < properties.length ; i++ ) {
        var p = properties[i];
        if ( ! RESERVED_ATTRS[p.name] ) {
          elements[p.name] = p;
          elements[p.name.toUpperCase()] = p;
        }
        elements['p:' + p.name] = p;
        elements['P:' + p.name.toUpperCase()] = p;
      }
      this.elementMap_ = elements;
    }

    for ( var i = 0 ; i < e.attributes.length ; i++ ) {
      var attr = e.attributes[i];
      var p    = elements[attr.name] || elements[attr.name.toUpperCase()];
      var val  = attr.value;
      if ( p ) {
        if ( val.startsWith('#') ) {
          val = val.substring(1);
          var $val = this.X.$(val);
          if ( $val ) {
            this[attr.name] = this.X.$(val);
          } else {
            this[p.name] = p.fromString(val);
          }
        } else {
          // Call fromString() for attribute values because they're
          // String values, not Elements.
          this[p.name] = p.fromString(val);
        }
      } else {
        if ( ! RESERVED_ATTRS[attr.name] )
          console.warn('Unknown attribute name: "' + attr.name + '"');
      }
    }

    for ( var i = 0 ; i < e.children.length ; i++ ) {
      var c = e.children[i];
      var p = elements[c.nodeName];
      if ( p ) {
        p.fromElement.call(this, c, p);
      } else {
        console.warn('Unknown element name: "' + c.nodeName + '"');
      }
    }

    return this;
  },

  createFOAMGetter: function(name, getter) {
    var stack = Events.onGet.stack;
    return function FOAMGetter() {
      var value = getter.call(this, name);
      var f = stack[0];
      f && f(this, name, value);
      return value;
    };
  },

  createFOAMSetter: function(name, setter) {
    var stack = Events.onSet.stack;
    return function FOAMSetter(newValue) {
      var f = stack[0];
      if ( f && ! f(this, name, newValue) ) return;
      setter.call(this, newValue, name);
    };
  },

  toString: function() {
    // TODO: do something to detect loops which cause infinite recurrsions.
    // console.log(this.model_.name + "Prototype");
    return this.model_.name + "Prototype";
    // return this.toJSON();
  },

  hasOwnProperty: function(name) {
    return typeof this.instance_[name] !== 'undefined';
//    return this.instance_.hasOwnProperty(name);
  },

  writeActions: function(other, out) {
    var properties = this.model_.getRuntimeProperties();

    for ( var i = 0, property ; property = properties[i] ; i++ ) {
      if ( property.actionFactory ) {
        var actions = property.actionFactory(this, property.f(this), property.f(other));
        for (var j = 0; j < actions.length; j++)
          out(actions[j]);
      }
    }
  },

  validateObject: function() {
    var ret = null;

    var ps = this.model_.getRuntimeProperties();

    // TODO: cache properties with validate defined
    for ( var i = 0 ; i < ps.length ; i++ ) {
      var p = ps[i];
      if ( p.validate ) {
        var e = p.validate.call(this);
        if ( e ) (ret || (ret = [])).push([p,e]);
      }
    }

    return ret;
  },

  isValid: function() { return ! this.validateObject(); },

  equals: function(other) { return this.compareTo(other) == 0; },

  compareTo: function(other) {
    if ( other === this ) return 0;
    if ( this.model_ !== other.model_ ) {
      // TODO: This provides unstable ordering if two objects have a different model_
      // but they have the same id.
      return this.model_.id.compareTo(other.model_ && other.model_.id) || 1;
    }

    var ps = this.model_.getRuntimeProperties();

    for ( var i = 0 ; i < ps.length ; i++ ) {
      var r = ps[i].compare(this, other);

      if ( r ) return r;
    }

    return 0;
  },

  diff: function(other) {
    var diff = {};

    var properties = this.model_.getRuntimeProperties();
    for ( var i = 0, property ; property = properties[i] ; i++ ) {
      if ( Array.isArray(property.f(this)) ) {
        var subdiff = property.f(this).diff(property.f(other));
        if ( subdiff.added.length !== 0 || subdiff.removed.length !== 0 ) {
          diff[property.name] = subdiff;
        }
        continue;
      }

      if ( property.compare(this, other) !== 0 ) {
        diff[property.name] = property.f(other);
      }
    }

    return diff;
  },

  /** Reset a property to its default value. **/
  clearProperty: function(name) { delete this.instance_[name]; },

  defineProperty: function(prop) {
    var name = prop.name;
    prop.name$_ = name + '$';
    this[constantize(prop.name)] = prop;

    // Add a 'name$' psedo-property if not already defined
    // Faster to define on __ROOT__, but not as good for auto-completion
    var obj = DEBUG ? this : __ROOT__;
    if ( ! obj.__lookupGetter__(prop.name$_) ) {
      Object.defineProperty(obj, prop.name$_, {
        get: function getValue() { return this.propertyValue(name); },
        set: function setValue(value) { Events.link(value, this.propertyValue(name)); },
        configurable: true
      });
    }

    var pgetter, psetter;

    if ( prop.getter ) {
      pgetter = this.createFOAMGetter(name, prop.getter);
    } else {
      if ( prop.lazyFactory || prop.factory ) {
        var f = prop.lazyFactory || prop.factory;
        getter = function factory() {
          if ( typeof this.instance_[name] === 'undefined' ) {
            this.instance_[name] = null; // prevents infinite recursion
            // console.log('Ahead of order factory: ', prop.name);
            //debugger;
            var val = f.call(this, prop);
            if ( typeof val === 'undefined' ) val = null;
            this[name] = val;
          }
          return this.instance_[name];
        };
      } else if ( prop.defaultValueFn ) {
        var f = prop.defaultValueFn;
        getter = function defaultValueFn() {
          return typeof this.instance_[name] !== 'undefined' ? this.instance_[name] : f.call(this, prop);
        };
      } else {
        var defaultValue = prop.defaultValue;
        getter = function getInstanceVar() {
          return typeof this.instance_[name] !== 'undefined' ? this.instance_[name] : defaultValue;
        };
      }
      pgetter = this.createFOAMGetter(name, getter);
    }

    if ( prop.setter ) {
      psetter = this.createFOAMSetter(name, prop.setter);
    } else {
      var setter = function setInstanceValue(oldValue, newValue) {
        this.instance_[name] = newValue;
      };

      if ( prop.type === 'int' || prop.type === 'float' ) {
        setter = (function(setter) { return function numberSetter(oldValue, newValue) {
          setter.call(this, oldValue, typeof newValue !== 'number' ? Number(newValue) : newValue);
        }; })(setter);
      }

      if ( prop.onDAOUpdate ) {
        if ( typeof prop.onDAOUpdate === 'string' ) {
          setter = (function(setter, onDAOUpdate, listenerName) { return function onDAOUpdateSetter(oldValue, newValue) {
            setter.call(this, oldValue, newValue);

            var listener = this[listenerName] || ( this[listenerName] = this[onDAOUpdate].bind(this) );

            if ( oldValue ) oldValue.unlisten(listener);
            if ( newValue ) {
              newValue.listen(listener);
              listener();
            }
          }; })(setter, prop.onDAOUpdate, prop.name + '_onDAOUpdate');
        } else {
          setter = (function(setter, onDAOUpdate, listenerName) { return function onDAOUpdateSetter2(oldValue, newValue) {
            setter.call(this, oldValue, newValue);

            var listener = this[listenerName] || ( this[listenerName] = onDAOUpdate.bind(this) );

            if ( oldValue ) oldValue.unlisten(listener);
            if ( newValue ) {
              newValue.listen(listener);
              listener();
            }
          }; })(setter, prop.onDAOUpdate, prop.name + '_onDAOUpdate');
        }
      }

      if ( prop.postSet ) {
        setter = (function(setter, postSet) { return function postSetSetter(oldValue, newValue) {
          setter.call(this, oldValue, newValue);
          postSet.call(this, oldValue, newValue, prop)
        }; })(setter, prop.postSet);
      }

      var propertyTopic = PropertyChangeSupport.propertyTopic(name);
      setter = (function(setter) { return function propertyChangeSetter(oldValue, newValue) {
        setter.call(this, oldValue, newValue);
        this.propertyChange_(propertyTopic, oldValue, newValue);
      }; })(setter);

      if ( prop.preSet ) {
        setter = (function(setter, preSet) { return function preSetSetter(oldValue, newValue) {
          setter.call(this, oldValue, preSet.call(this, oldValue, newValue, prop));
        }; })(setter, prop.preSet);
      }

      if ( prop.adapt ) {
        setter = (function(setter, adapt) { return function adaptSetter(oldValue, newValue) {
          setter.call(this, oldValue, adapt.call(this, oldValue, newValue, prop));
        }; })(setter, prop.adapt);
      }

      if ( prop.regex ) {
        setter = (function(setter, name, regex) { return function regexValidator(oldValue, newValue) {
          if ( ! ( newValue && ( typeof newValue === 'string' ) && newValue.match(regex) ) ) throw 'Invalid Property value for "' + name + '", "' + newValue + '" violates regex: ' + regex; 
          setter.call(this, oldValue, newValue);
        }; })(setter, prop.name, prop.regex);
      }

      setter = (function(setter, defaultValue) { return function setInstanceVar(newValue) {
        setter.call(this, typeof this.instance_[name] === 'undefined' ? defaultValue : this.instance_[name], newValue);
      }; })(setter, prop.defaultValue);

      psetter = this.createFOAMSetter(name, setter);
    }

    Object.defineProperty(this, name, { get: pgetter, set: psetter, configurable: true });

    // Let the property install other features into the Prototype
    prop.install && prop.install.call(this, prop);
  },

  addMethod: function(name, method) {
    if ( this.__proto__[name] ) {
      override(this, name, method);
    } else {
      this[name] = method;
    }
  },

  hashCode: function() {
    var hash = 17;

    var properties = this.model_.getRuntimeProperties();
    for ( var i = 0 ; i < properties.length ; i++ ) {
      var prop = this[properties[i].name];
      var code = ! prop ? 0 :
        prop.hashCode   ? prop.hashCode()
                        : prop.toString().hashCode();

      hash = ((hash << 5) - hash) + code;
      hash &= hash;
    }

    return hash;
  },

  // TODO: this should be monkey-patched from a 'ProtoBuf' library
  toProtobuf: function() {
    var out = ProtoWriter.create();
    this.outProtobuf(out);
    return out.value;
  },

  // TODO: this should be monkey-patched from a 'ProtoBuf' library
  outProtobuf: function(out) {
    var proprties = this.model_getRuntimeProperties();
    for ( var i = 0 ; i < properties.length ; i++ ) {
      var prop = properties[i];
      if ( Number.isFinite(prop.prototag) )
        prop.outProtobuf(this, out);
    }
  },

  /** Create a shallow copy of this object. **/
  clone: function() {
    var m = {};
    for ( var key in this.instance_ ) {
      var value = this[key];
      if ( value !== undefined ) {
        var prop = this.model_.getProperty(key);
        if ( prop && prop.cloneProperty )
          prop.cloneProperty.call(prop, value, m);
        else if ( ! prop.model_ ) // happens during bootstrap
          m[key] = value;
      }
    }
    return this.model_.create(m, this.X);
  },

  /** Create a deep copy of this object. **/
  deepClone: function() {
    var m = {};
    for ( var key in this.instance_ ) {
      var value = this[key];
      if ( value !== undefined ) {
        var prop = this.model_.getProperty(key);
        if ( prop && prop.deepCloneProperty ) {
          prop.deepCloneProperty.call(prop, value, m);
        }
      }
    }
    return this.model_.create(m, this.X);
  },

  /** @return this **/
  copyFrom: function(src) {
/*
    // TODO: remove the 'this.model_' check when all classes modelled
    if ( src && this.model_ ) {
      for ( var i = 0 ; i < this.model_.properties.length ; i++ ) {
        var prop = this.model_.properties[i];

        // If the src is modelled, and it has an instance_
        //   BUT the instance doesn't have a value for the property,
        //   then don't copy this value over since it's a default value.
        if ( src.model_ && src.instance_ &&
            !src.instance_.hasOwnProperty(prop.name) ) continue;

        if ( prop.name in src ) this[prop.name] = src[prop.name];
      }
    }
*/

    if ( src && this.model_ ) {
      var ps = this.model_.getRuntimeProperties();
      for ( var i = 0 ; i < ps.length ; i++ ) {
        var prop = ps[i];
        if ( src.hasOwnProperty(prop.name) ) this[prop.name] = src[prop.name];
        if ( src.hasOwnProperty(prop.name$_) ) this[prop.name$_] = src[prop.name$_];
      }
    }

    return this;
  },

  output: function(out) { return JSONUtil.output(out, this); },

  toJSON: function() { return JSONUtil.stringify(this); },

  toXML: function() { return XMLUtil.stringify(this); },

  write: function(opt_X, opt_view) {
    (opt_X || this.X).writeView(this.defaultView(opt_view));
  },

  defaultView: function(opt_view) {
    return (opt_view || X.foam.ui.DetailView).create({
      model: this.model_,
      data: this,
      showActions: true
    });
  },

  decorate: function(name, func, that) {
    var delegate = this[name];
    this[name] = function() {
      return func.call(this, that, delegate.bind(this), arguments);
    };
    return this;
  },

  addDecorator: function(decorator) {
    if ( decorator.decorateObject )
      decorator.decorateObject(this);

    for ( var i = 0 ; i < decorator.model_.methods.length ; i++ ) {
      var method = decorator.model_.methods[i];
      if ( method.name !== 'decorateObject' )
        this.decorate(method.name, method.code, decorator);
    }
    return this;
  }

};

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
 * Prototype for original proto-Models.
 * Used during bootstrapping to create the real Model
 * and PropertyModel.
 *
 * TODO: The handling of the various property types (properties,
 *   templates, listeners, etc.) shouldn't be handled here because
 *   it isn't extensible.  The handling should be defined in the
 *   properties property (so meta).
 *
 * TODO: Is still used by a few views in view.js.  Those views
 * should be fixed and then BootstrapModel should be deleted at
 * the end of metamodel.js once the real Model is created.
 **/

function defineLocalProperty(cls, name, factory) {
  Object.defineProperty(cls, name, { get: function() {
    console.assert(this !== cls, 'Called property getter from prototype: ' + name);
    var value = factory.call(this);
    Object.defineProperty(this, name, { configurable: true, value: value });
    return value;
  }, configurable: true });
}

this.Constant = null;
this.Method = null;
this.Action = null;
this.Relationship = null;

/**
 * Override a method, making calling the overridden method possible by
 * calling this.SUPER();
 **/
var CCC = 0;
function override(cls, methodName, method) {
  var super_ = cls[methodName];

  // No need to decorate if SUPER not called
  if ( method.toString().indexOf('SUPER') == -1 ) {
    cls[methodName] = method;
    return;
  }

  var SUPER = function() { return super_.apply(this, arguments); };

  var slowF = function(OLD_SUPER, args) {
    try {
      return method.apply(this, args);
    } finally {
      this.SUPER = OLD_SUPER;
    }
  };
  var f = function() {
    var OLD_SUPER = this.SUPER;
    this.SUPER = SUPER;

    if ( OLD_SUPER ) return slowF.call(this, OLD_SUPER, arguments);

    // Fast-Path when it doesn't matter if we restore SUPER or not
    var ret = method.apply(this, arguments);
    this.SUPER = null;
    return ret;
  };
  f.toString = function() { return method.toString(); };
  f.super_ = super_;

  cls[methodName] = f;
}


var BootstrapModel = {

  __proto__: PropertyChangeSupport,

  name_: 'BootstrapModel <startup only, error if you see this>',

  addTraitToModel_: function(traitModel, parentModel) {
    var parentName = parentModel && parentModel.id ? parentModel.id.replace(/\./g, '__') : '';
    var traitName  = traitModel.id ? traitModel.id.replace(/\./g, '__') : '';
    var name       = parentName + '_ExtendedWith_' + traitName;

    if ( ! lookup(name) ) {
      var models = traitModel.models;
      traitModel = traitModel.clone();
      traitModel.package = '';
      traitModel.name = name;
      traitModel.extends = parentModel && parentModel.id;
      traitModel.models = models; // unclone sub-models, we don't want multiple copies of them floating around
      traitModel.X.registerModel(traitModel);
    }

    var ret = traitModel.X.lookup(name);
    console.assert(ret, 'Error adding Trait to Model, unknown name: ', name);
    return ret;
  },

  createMethod_: function(X, name, fn) {
    var method = Method.create({
      name: name,
      code: fn
    });

    if ( FEATURE_ENABLED(['debug']) && Arg ) {
      var str = fn.toString();
      var match = str.match(/^function[ _$\w]*\(([ ,\w]+)/);
      if ( match )
        method.args = match[1].split(',').
        map(function(name) { return Arg.create({name: name.trim()}); });
    }

    return method;
  },

  buildProtoImports_: function(props) {
    // build imports as psedo-properties
    Object_forEach(this.instance_.imports_, function(i) {
      var imp   = i.split(' as ');
      var key   = imp[0];
      var alias = imp[1] || imp[0];

      if ( alias.length && alias.charAt(alias.length-1) == '$' )
        alias = alias.slice(0, alias.length-1);

      if ( ! this.getProperty(alias) ) {
        // Prevent imports from being cloned.
        var prop = ImportedProperty.create({ name: alias });
        props.push(prop);
      }
    }.bind(this));
  },

  buildProtoProperties_: function(cls, extendsModel, props) {
    // build properties
    for ( var i = 0 ; i < props.length ; i++ ) {
      var p = props[i];
      if ( extendsModel ) {
        var superProp = extendsModel.getProperty(p.name);
        if ( superProp ) {
          var p0 = p;
          p = superProp.clone().copyFrom(p);
          // A more elegant way to do this would be to have a ModelProperty
          // which has a ModelPropertyProperty called 'reduceWithSuper'.
          if ( p0.adapt && superProp.adapt ) {
//            console.log('(DEBUG) sub adapt: ', this.name + '.' + p.name);
            p.adapt = (function(a1, a2) { return function(oldValue, newValue, prop) {
              return a2.call(this, oldValue, a1.call(this, oldValue, newValue, prop), prop);
            };})(p0.adapt, superProp.adapt);
          }
          if ( p0.preSet && superProp.preSet ) {
//            console.log('(DEBUG) sub preSet: ', this.name + '.' + p.name);
            p.preSet = (function(a1, a2) { return function(oldValue, newValue, prop) {
              return a2.call(this, oldValue, a1.call(this, oldValue, newValue, prop), prop);
            };})(p0.preSet, superProp.preSet);
          }
          if ( p0.postSet && superProp.postSet ) {
//            console.log('(DEBUG) sub postSet: ', this.name + '.' + p.name);
            p.postSet = (function(a1, a2) { return function(oldValue, newValue, prop) {
              a2.call(this, oldValue, newValue, prop);
              a1.call(this, oldValue, newValue, prop);
            };})(p0.postSet, superProp.postSet);
          }
          props[i] = p;
          this[constantize(p.name)] = p;
        }
      }
      cls.defineProperty(p);
    }
    this.propertyMap_ = null;
  },

  buildProtoMethods_: function(cls) {
    if ( Array.isArray(this.methods) ) {
      for ( var i = 0 ; i < this.methods.length ; i++ ) {
        var m = this.methods[i];
        if ( typeof m == "function" ) {
          cls.addMethod(m.name, m);
        } else {
          cls.addMethod(m.name, m.code);
        }
      }
    } else {
      // add methods
      for ( key in this.methods ) {
        var m = this.methods[key];
        if ( Method && Method.isInstance(m) ) {
          cls.addMethod(m.name, m.generateFunction());
        } else {
          cls.addMethod(key, m);
        }
      }
    }
  },

  buildPrototype: function() { /* Internal use only. */
    // save our pure state
    // Note: Only documentation browser uses this, and it will be replaced
    // by the new Feature Oriented bootstrapping process, so only use the
    // extra memory in DEBUG mode.
    if ( _DOC_ ) BootstrapModel.saveDefinition(this);

    if ( this.extends && ! this.X.lookup(this.extends) ) throw new Error('Unknown Model in extends: ' + this.extends);

    var extendsModel = this.extends && this.X.lookup(this.extends);

    if ( this.traits ) for ( var i = 0 ; i < this.traits.length ; i++ ) {
      var trait      = this.traits[i];
      var traitModel = this.X.lookup(trait);

      console.assert(traitModel, 'Unknown trait: ' + trait);

      if ( traitModel ) {
        extendsModel = this.addTraitToModel_(traitModel, extendsModel);
      } else {
        console.warn('Missing trait: ', trait, ', in Model: ', this.name);
      }
    }

    var proto  = extendsModel ? extendsModel.getPrototype() : FObject;
    var cls    = Object.create(proto);

    cls.model_ = this;
    cls.name_  = this.name;

    // Install a custom constructor so that Objects are named properly
    // in the JS memory profiler.
    // Doesn't work for Model because of some Bootstrap ordering issues.
    /*
    if ( this.name && this.name !== 'Model' && ! ( window.chrome && chrome.runtime && chrome.runtime.id ) ) {
      var s = '(function() { var XXX = function() { }; XXX.prototype = this; return function() { return new XXX(); }; })'.replace(/XXX/g, this.name);
      try { cls.create_ = eval(s).call(cls); } catch (e) { }
    }*/

    // add sub-models
    //        this.models && this.models.forEach(function(m) {
    //          cls[m.name] = JSONUtil.mapToObj(m);
    //        });
    // Workaround for crbug.com/258552
    this.models && Object_forEach(this.models, function(m) {
      if ( this[m.name] ) {
        var model = this[m.name];
        defineLocalProperty(cls, m.name, function() {
          var Y = this.Y;
          return {
            __proto__: model,
            create: function(args, opt_X) {
              return model.create(args, opt_X || Y);
            }
          };
        });
      }
    }.bind(this));

    // build requires
    Object_forEach(this.requires, function(i) {
      var imp  = i.split(' as ');
      var m    = imp[0];
      var path = m.split('.');
      var key  = imp[1] || path[path.length-1];

      defineLocalProperty(cls, key, function() {
        var Y     = this.Y;
        var model = this.X.lookup(m);
        console.assert(model, 'Unknown Model: ' + m + ' in ' + this.name_);
        return {
          __proto__: model,
          create: function(args, X) { return model.create(args, X || Y); }
        };
      });
    });

    var props = this.instance_.properties_ = this.properties ? this.properties.clone() : [];

    this.instance_.imports_ = this.imports;
    if ( extendsModel ) this.instance_.imports_ = this.instance_.imports_.concat(extendsModel.instance_.imports_);

    this.buildProtoImports_(props);
    this.buildProtoProperties_(cls, extendsModel, props);

    // Copy parent Model's Property and Relationship Contants to this Model.
    if ( extendsModel ) {
      for ( var i = 0 ; i < extendsModel.instance_.properties_.length ; i++ ) {
        var p = extendsModel.instance_.properties_[i];
        var name = constantize(p.name);

        if ( ! this[name] ) this[name] = p;
      }
      for ( i = 0 ; i < extendsModel.relationships.length ; i++ ) {
        var r = extendsModel.relationships[i];
        var name = constantize(r.name);

        if ( ! this[name] ) this[name] = r;
      }
    }

    // Handle 'exports'
    this.instance_.exports_ = this.exports ? this.exports.clone() : [];
    if ( extendsModel ) this.instance_.exports_ = this.instance_.exports_.concat(extendsModel.instance_.exports_);

    // templates
    this.templates && Object_forEach(this.templates, function(t) {
      cls.addMethod(t.name, t.code ? t.code : TemplateUtil.lazyCompile(t));
    });

    // add actions
    this.instance_.actions_ = this.actions ? this.actions.clone() : [];
    if ( this.actions ) {
      for ( var i = 0 ; i < this.actions.length ; i++ ) {
        (function(a) {
          if ( extendsModel ) {
            var superAction = extendsModel.getAction(a.name);
            if ( superAction ) {
              a = superAction.clone().copyFrom(a);
            }
          }
          this.instance_.actions_[i] = a;
          if ( ! Object.prototype.hasOwnProperty.call(cls, constantize(a.name)) )
            cls[constantize(a.name)] = a;
          this[constantize(a.name)] = a;
          cls.addMethod(a.name, function(opt_x) { a.maybeCall(opt_x || this.X, this); });
        }.bind(this))(this.actions[i]);
      }
    }

    var key;

    // add constants
    if ( this.constants ) {
      for ( var i = 0 ; i < this.constants.length ; i++ ) {
        var c = this.constants[i];
        cls[c.name] = this[c.name] = c.value;
      }
    }

    // add messages
    if ( this.messages && this.messages.length > 0 && GLOBAL.Message ) {
      Object_forEach(this.messages, function(m, key) {
        if ( ! Message.isInstance(m) ) {
          m = this.messages[key] = Message.create(m);
        }
        var clsProps = {}, mdlProps = {}, constName = constantize(m.name);
        clsProps[m.name] = { get: function() { return m.value; } };
        clsProps[constName] = { value: m };
        mdlProps[constName] = { value: m };
        Object.defineProperties(cls, clsProps);
        Object.defineProperties(this, mdlProps);
      }.bind(this));
    }

    this.buildProtoMethods_(cls);

    var self = this;
    // add relationships
    this.instance_.relationships_ = this.relationships;

    if ( extendsModel ) this.instance_.relationships_ = this.instance_.relationships_.concat(extendsModel.instance_.relationships_);

    this.relationships && this.relationships.forEach(function(r) {
      // console.log('************** rel: ', r, r.name, r.label, r.relatedModel, r.relatedProperty);

      var name = constantize(r.name);
      if ( ! self[name] ) self[name] = r;
      defineLazyProperty(cls, r.name, function() {
        var m = this.X.lookup(r.relatedModel);
        var name = daoize(m.name);
        var dao = this.X[name];
        if ( ! dao ) {
          console.error('Relationship ' + r.name + ' needs ' + name +
              ' in the context, and it was not found.');
        }

        dao = RelationshipDAO.create({
          delegate: dao,
          relatedProperty: m.getProperty(r.relatedProperty),
          relativeID: this.id
        });

        return {
          get: function() { return dao; },
          configurable: true
        };
      });
    });

    // TODO: move this somewhere better
    var createListenerTrampoline = function(cls, name, fn, isMerged, isFramed, whenIdle) {
      // bind a trampoline to the function which
      // re-binds a bound version of the function
      // when first called
      console.assert( fn, 'createListenerTrampoline: fn not defined');
      fn.name = name;

      Object.defineProperty(cls, name, {
        get: function () {
          var l = fn.bind(this);
          /*
          if ( ( isFramed || isMerged ) && this.X.isBackground ) {
            console.log('*********************** ', this.model_.name);
          }
          */
          if ( whenIdle ) l = Movement.whenIdle(l);

          if ( isFramed ) {
            l = EventService.framed(l, this.X);
          } else if ( isMerged ) {
            l = EventService.merged(
              l,
              (isMerged === true) ? undefined : isMerged, this.X);
          }

          Object.defineProperty(this, name, { configurable: true, value: l });

          return l;
        },
        configurable: true
      });
    };

    // add listeners
    if ( Array.isArray(this.listeners) ) {
      for ( var i = 0 ; i < this.listeners.length ; i++ ) {
        var l = this.listeners[i];
        createListenerTrampoline(cls, l.name, l.code, l.isMerged, l.isFramed, l.whenIdle);
      }
    } else if ( this.listeners ) {
      //          this.listeners.forEach(function(l, key) {
      // Workaround for crbug.com/258522
      Object_forEach(this.listeners, function(l, key) {
        createListenerTrampoline(cls, key, l);
      });
    }

    // add topics
    //        this.topics && this.topics.forEach(function(t) {
    // Workaround for crbug.com/258522
    this.topics && Object_forEach(this.topics, function(t) {
      // TODO: something
    });

    // copy parent model's properties and actions into this model
    if ( extendsModel ) {
      this.getProperty('');
      var ips = []; // inherited properties
      var ps  = extendsModel.instance_.properties_;
      for ( var i = 0 ; i < ps.length ; i++ ) {
        var p = ps[i];
        if ( ! this.getProperty(p.name) ) {
          ips.push(p);
          this.propertyMap_[p.name] = p;
        }
      }
      if ( ips.length ) {
        this.instance_.properties_ = ips.concat(this.instance_.properties_);
      }

      var ias = [];
      var as = extendsModel.instance_.actions_;
      for ( var i = 0 ; i < as.length ; i++ ) {
        var a = as[i];
        if ( ! ( this.getAction && this.getAction(a.name) ) )
          ias.push(a);
      }
      if ( ias.length ) {
        this.instance_.actions_ = ias.concat(this.instance_.actions_);
      }
    }

    // build primary key getter and setter
    if ( this.instance_.properties_.length > 0 && ! cls.__lookupGetter__('id') ) {
      var primaryKey = this.ids;

      if ( primaryKey.length == 1 ) {
        cls.__defineGetter__('id', function() { return this[primaryKey[0]]; });
        cls.__defineSetter__('id', function(val) { this[primaryKey[0]] = val; });
      } else if (primaryKey.length > 1) {
        cls.__defineGetter__('id', function() {
          return primaryKey.map(function(key) { return this[key]; }.bind(this)); });
        cls.__defineSetter__('id', function(val) {
          primaryKey.map(function(key, i) { this[key] = val[i]; }.bind(this)); });
      }
    }

    return cls;
  },

  // ???(kgr): Who uses this?  If it's the build tool, then better putting it there.
  getAllRequires: function() {
    var requires = {};
    this.requires.forEach(function(r) { requires[r.split(' ')[0]] = true; });
    this.traits.forEach(function(t) { requires[t] = true; });
    if ( this.extends ) requires[this.extends] = true;

    function setModel(o) { if ( o && o.model_ ) requires[o.model_.id] = true; }

    this.properties.forEach(setModel);
    this.actions.forEach(setModel);
    this.templates.forEach(setModel);
    this.listeners.forEach(setModel);

    return Object.keys(requires);
  },

  getPrototype: function() { /* Returns the definition $$DOC{ref:'Model'} of this instance. */
    if ( ! this.instance_.prototype_ ) {
      this.instance_.prototype_ = this.buildPrototype();
      this.onLoad && this.onLoad();
    }

    return this.instance_.prototype_;
  },

  saveDefinition: function(self) {
    self.definition_ = {};
    // TODO: introspect Model, copy the other non-array properties of Model
    // DocumentationBootstrap's getter gets called here, which causes a .create() and an infinite loop
//       Model.properties.forEach(function(prop) {
//         var propVal = self[prop.name];
//         if (propVal) {
//           if (Array.isArray(propVal)) {
//             // force array copy, so we don't share changes made later
//             self.definition_[prop.name] = [].concat(propVal);
//           } else {
//             self.definition_[prop.name] = propVal;
//           }
//         }
//       }.bind(self));

    // TODO: remove these once the above loop works
    // clone feature lists to avoid sharing the reference in the copy and original
    if (Array.isArray(self.methods))       self.definition_.methods       = [].concat(self.methods);
    if (Array.isArray(self.templates))     self.definition_.templates     = [].concat(self.templates);
    if (Array.isArray(self.relationships)) self.definition_.relationships = [].concat(self.relationships);
    if (Array.isArray(self.properties))    self.definition_.properties    = [].concat(self.properties);
    if (Array.isArray(self.actions))       self.definition_.actions       = [].concat(self.actions);
    if (Array.isArray(self.listeners))     self.definition_.listeners     = [].concat(self.listeners);
    if (Array.isArray(self.models))        self.definition_.models        = [].concat(self.models);
    if (Array.isArray(self.tests))         self.definition_.tests         = [].concat(self.tests);
    if (Array.isArray(self.issues))        self.definition_.issues        = [].concat(self.issues);

    self.definition_.__proto__ = FObject;
  },

  create: function(args, opt_X) {
    if ( this.name === 'Model' ) {
      return FObject.create.call(this.getPrototype(), args, opt_X);
    }
    return this.getPrototype().create(args, opt_X);
  },

  isSubModel: function(model) {
    /* Returns true if the given instance extends this $$DOC{ref:'Model'} or a descendant of this. */

    if ( ! model || ! model.getPrototype ) return false;

    var subModels_ = this.subModels_ || ( this.subModels_ = {} );

    if ( ! subModels_.hasOwnProperty(model.id) ) {
      subModels_[model.id] = ( model.getPrototype() === this.getPrototype() || this.isSubModel(model.getPrototype().__proto__.model_) );
    }

    return subModels_[model.id];
  },

  getRuntimeProperties: function() {
    if ( ! this.instance_.properties_ ) this.getPrototype();
    return this.instance_.properties_;
  },

  getRuntimeActions: function() {
    if ( ! this.instance_.actions_ ) this.getPrototype();
    return this.instance_.actions_;
  },

  getRuntimeRelationships: function() {
    if ( ! this.instance_.relationships_ ) this.getPrototype();
    return this.instance_.relationships_;
  },

  getProperty: function(name) { /* Returns the requested $$DOC{ref:'Property'} of this instance. */
    // NOTE: propertyMap_ is invalidated in a few places
    // when properties[] is updated.
    if ( ! this.propertyMap_ ) {
      var m = this.propertyMap_ = {};

      var properties = this.getRuntimeProperties();
      for ( var i = 0 ; i < properties.length ; i++ ) {
        var prop = properties[i];
        m[prop.name] = prop;
      }

      this.propertyMap_ = m;
    }

    return this.propertyMap_[name];
  },

  getAction: function(name) { /* Returns the requested $$DOC{ref:'Action'} of this instance. */
    for ( var i = 0 ; i < this.instance_.actions_.length ; i++ )
      if ( this.instance_.actions_[i].name === name ) return this.instance_.actions_[i];
  },

  hashCode: function() {
    var string = '';
    var properties = this.getRuntimeProperties();
    for ( var key in properties ) {
      string += properties[key].toString();
    }
    return string.hashCode();
  },

  isInstance: function(obj) { /* Returns true if the given instance extends this $$DOC{ref:'Model'}. */
    return obj && obj.model_ && this.isSubModel(obj.model_);
  },

  toString: function() { return "BootstrapModel(" + this.name + ")"; },

  arequire: function() {
    if ( this.required__ ) return this.required__;

    var future = afuture();
    this.required__ = future.get;

    var go = function() {
      var args = [], model = this, i;

      if ( this.extends ) args.push(this.X.arequire(this.extends));

      if ( this.models ) {
        for ( i = 0; i < this.models.length; i++ ) {
          args.push(this.models[i].arequire());
        }
      }

      if ( this.traits ) {
        for ( i = 0; i < this.traits.length; i++ ) {
          args.push(this.X.arequire(this.traits[i]));
        }
      }

      if ( this.templates ) for ( i = 0 ; i < this.templates.length ; i++ ) {
        var t = this.templates[i];
        args.push(
          aif(!t.code,
              aseq(
                aevalTemplate(this.templates[i], this),
                (function(t) { return function(ret, m) {
                  t.code = m;
                  ret();
                };})(t))));
      }
      if ( args.length ) args = [aseq.apply(null, args)];

      if ( this.requires ) {
        for ( var i = 0 ; i < this.requires.length ; i++ ) {
          var r = this.requires[i];
          var m = r.split(' as ');
          if ( m[0] == this.id ) {
            console.warn("Model requires itself: " + this.id);
          } else {
            args.push(this.X.arequire(m[0]));
          }
        }
      }

      args.push(function(ret) {
        if ( this.X.i18nModel )
          this.X.i18nModel(ret, this, this.X);
        else
          ret();
      }.bind(this));

      aseq.apply(null, args)(function() {
        this.finished__ = true;
        future.set(this);
      }.bind(this));
    }.bind(this);

    if ( this.extra__ )
      this.extra__(go);
    else
      go();

    return this.required__;
  },

  getMyFeature: function(featureName) {
    /* Returns the feature with the given name from the runtime
      object (the features available to an instance of the model). */
    if ( ! Object.prototype.hasOwnProperty.call(this, 'featureMap_') ) {
      var map = this.featureMap_ = {};
      function add(a) {
        if ( ! a ) return;
        for ( var i = 0 ; i < a.length ; i++ ) {
          var f = a[i];
          map[f.name.toUpperCase()] = f;
        }
      }
      add(this.getRuntimeProperties());
      add(this.instance_.actions_);
      add(this.methods);
      add(this.listeners);
      add(this.templates);
      add(this.models);
      add(this.tests);
      add(this.relationships);
      add(this.issues);
    }
    return this.featureMap_[featureName.toUpperCase()];
  },

  getRawFeature: function(featureName) {
    /* Returns the raw (not runtime, not inherited, non-buildPrototype'd) feature
      from the model definition. */
    if ( ! Object.prototype.hasOwnProperty.call(this, 'rawFeatureMap_') ) {
      var map = this.featureMap_ = {};
      function add(a) {
        if ( ! a ) return;
        for ( var i = 0 ; i < a.length ; i++ ) {
          var f = a[i];
          map[f.name.toUpperCase()] = f;
        }
      }
      add(this.properties);
      add(this.actions);
      add(this.methods);
      add(this.listeners);
      add(this.templates);
      add(this.models);
      add(this.tests);
      add(this.relationships);
      add(this.issues);
    }
    return this.featureMap_[featureName.toUpperCase()];
  },

  getAllMyRawFeatures: function() {
    /* Returns the raw (not runtime, not inherited, non-buildPrototype'd) list
      of features from the model definition. */
    var featureList = [];
    var arrayOrEmpty = function(arr) {
      return ( arr && Array.isArray(arr) ) ? arr : [];
    };
    [
      arrayOrEmpty(this.properties),
      arrayOrEmpty(this.actions),
      arrayOrEmpty(this.methods),
      arrayOrEmpty(this.listeners),
      arrayOrEmpty(this.templates),
      arrayOrEmpty(this.models),
      arrayOrEmpty(this.tests),
      arrayOrEmpty(this.relationships),
      arrayOrEmpty(this.issues)
    ].map(function(list) {
      featureList = featureList.concat(list);
    });
    return featureList;
  },

  getFeature: function(featureName) {
    /* Returns the feature with the given name, including
       inherited features. */
    var feature = this.getMyFeature(featureName);

    if ( ! feature && this.extends ) {
      var ext = this.X.lookup(this.extends);
      if ( ext ) return ext.getFeature(featureName);
    } else {
      return feature;
    }
  },

  // getAllFeatures accounts for inheritance through extendsModel
  getAllRawFeatures: function() {
    var featureList = this.getAllMyRawFeatures();

    if ( this.extends ) {
      var ext = this.X.lookup(this.extends);
      if ( ext ) {
        ext.getAllFeatures().map(function(subFeat) {
          var subName = subFeat.name.toUpperCase();
          if ( ! featureList.mapFind(function(myFeat) { // merge in features we don't already have
            return myFeat && myFeat.name && myFeat.name.toUpperCase() === subName;
          }) ) {
            featureList.push(subFeat);
          }
        });
      }
    }
    return featureList;
  },

  atest: function() {
    var seq = [];
    var allPassed = true;

    for ( var i = 0 ; i < this.tests.length ; i++ ) {
      seq.push(
        (function(test, model) {
          return function(ret) {
            test.atest(model)(function(passed) {
              if ( ! passed ) allPassed = false;
              ret();
            })
          };
        })(this.tests[i], this));
    }

    seq.push(function(ret) {
      ret(allPassed);
    });

    return aseq.apply(null, seq);
  }
};

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
var BinaryProtoGrammar;

var DocumentationBootstrap = {
  name: 'documentation',
  type: 'Documentation',
  labels: ['javascript'],
  help: 'Documentation associated with this entity.',
  documentation: "The developer documentation for this $$DOC{ref:'.'}. Use a $$DOC{ref:'DocModelView'} to view documentation.",
  setter: function(nu) {
    if ( ! _DOC_ ) return;
    this.instance_.documentation = nu;
  },
  getter: function() {
    if ( ! _DOC_ ) return '';
    var doc = this.instance_.documentation;
    if ( doc && typeof Documentation != "undefined" && Documentation // a source has to exist (otherwise we'll return undefined below)
        && (  ! doc.model_ // but we don't know if the user set model_
           || ! doc.model_.getPrototype // model_ could be a string
           || ! Documentation.isInstance(doc) // check for correct type
        ) ) {
      // So in this case we have something in documentation, but it's not of the
      // "Documentation" model type, so FOAMalize it.
      if ( doc.body ) {
        this.instance_.documentation = Documentation.create( doc );
      } else {
        this.instance_.documentation = Documentation.create({ body: doc });
      }
    }
    // otherwise return the previously FOAMalized model or undefined if nothing specified.
    //console.log("getting ", this.instance_.documentation)
    return this.instance_.documentation;
  }
}


var Model = {
  __proto__: BootstrapModel,
  instance_: {},

  name:  'Model',
  plural:'Models',
  help:  "Describes the attributes and properties of an entity.",

  documentation: {
    body: function() { /*
      <p>In FOAM, $$DOC{ref:'Model'} is the basic unit for describing data and behavior.
      $$DOC{ref:'Model'} itself is a $$DOC{ref:'Model'}, since it defines what can be defined,
      but also defines itself. See
      $$DOC{ref:'developerDocs.Welcome.chapters.modelsAtRuntime', text: 'Models in Action'}
      for more details.</p>


      <p>To create an instance of a $$DOC{ref:'Model'}, add it in your
      $$DOC{ref:'Model.requires'} list, then, in Javascript:</p>
      <p>
        <code>this.YourModel.create({ propName: val... })</code> creates an instance.
      </p>
      <p>
      Under the covers, $$DOC{ref:'Model.requires'} is creating an alias for the
      $$DOC{ref:'Model'} instance that exists in your context. You can access it
      directly at <code>this.X.yourPackage.YourModel</code>.</p>

      <p>Note:
      <ul>
        <li>The definition of your model is a $$DOC{ref:'Model'} instance
        (with YourModel.model_ === Model), while instances
        of your model have your new type (myInstance.model_ === YourModel). This
        differs from other object-oriented systems where the definition of a class
        and instances of the class are completely separate entities. In FOAM every
        class definition
        is an instance of $$DOC{ref:'Model'}, including itself.</li>

        <li>$$DOC{ref:'Model.exports',text:'Exporting'} a model property allows
        seamless dependency injection. See the
        $$DOC{ref:'developerDocs.Context', text:'Context documentation'}
        for more information.</li>

        <li>Calling .create direclty on a $$DOC{ref:'Model'} from your context,
        without using the $$DOC{ref:'.requires'} shortcut, must include the
        context: <code>this.X.MyModel.create({args}, this.X);</code>. Use
        $$DOC{ref:'.requires'} unless you have some compelling reason not to!</li>
      </ul>
      </p>
      <p>For more information about how $$DOC{ref:'Model',usePlural:true} are instantiated,
      see $$DOC{ref:'developerDocs.Welcome.chapters.modelsAtRuntime',text:'Welcome to Models at Runtime'}.
    */ }
  },

  tableProperties: [
    'package', 'name', 'label', 'plural'
  ],

  properties: [
    {
      name: 'id',
      hidden: true,
      transient: true
    },
    {
      name:  'sourcePath',
      help: 'Source location of this Model.',
      defaultValue: '',
      mode: 'read-only',
      transient: true
    },
    {
      name:  'abstract',
      defaultValue: false,
      help: 'If the java class is abstract.',
      documentation: function() { /* When running FOAM in a Java environment, specifies whether the
        Java class built from this $$DOC{ref:'Model'} should be declared abstract.*/}
    },
    {
      name: 'package',
      help: 'Package that this Model belongs to.',
      defaultValue: '',
      javaType: 'String',
      postSet: function(_, p) { return this.id = p ? p + '.' + this.name : this.name; },
      documentation: function() { /*
        <p>The package (or namespace) in which the $$DOC{ref:'.'} belongs. The
        dot-separated package name is prepended to the $$DOC{ref:'.'} name.</p>
        <p>For example: </p>
        <p><code>MODEL ({ name: 'Train', package: 'com.company.modules' });<br/>
                 ...<br/>
                 // when creating an instance of the model (your $$DOC{ref:'developerDocs.Context', text:'context'}
                        is this.X):<br/>
                 this.X.com.company.modules.Train.create();<br/>
        </code></p>
        <p>Use $$DOC{ref:'Model.imports'} to avoid typing the package name repeatedly.</p>
        <p>When running FOAM in a Java environment, specifies the
        package in which to declare the Java class built from this $$DOC{ref:'Model'}.
        </p>
        */}
    },
    {
      name:  'name',
      type:  'String',
      javaType: 'String',
      postSet: function(_, n) { return this.id = this.package ? this.package + '.' + n : n; },
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The coding identifier for the entity.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'Model.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'Model'} definition names should use CamelCase starting with a capital letter, while
        $$DOC{ref:'Property',usePlural:true}, $$DOC{ref:'Method',usePlural:true}, and other features
        defined inside a $$DOC{ref:'Model'} should use camelCase staring with a lower case letter.
         */}
    },
    {
      name: 'label',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return labelize(this.name); },
      help: 'The display label for the entity.',
      documentation: function() { /* A human readable label for the $$DOC{ref:'Model'}. May
        contain spaces or other odd characters.
         */}
    },
    {
      name: 'javaClassName',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return (this.abstract ? 'Abstract' : '') + this.name; },
      help: 'The Java classname of this Model.',
      documentation: function() { /* When running FOAM in a Java environment, specifies the name of the
        Java class to be built from this $$DOC{ref:'Model'}.*/}
    },
    {
      name: 'javaClassImports',
      type: 'Array[String]',
      labels: ['java'],
      defaultValueFn: function() { return []; },
      help: 'Imports to add at the top of the generated java class.',
    },
    {
      name: 'swiftClassName',
      type: 'String',
      labels: ['swift'],
      defaultValueFn: function() { return (this.abstract ? 'Abstract' : '') + this.name; },
      help: 'The Swift classname of this model.'
    },
    {
      name: 'extends',
      label: 'Extends',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'The parent model of this model.',
      documentation: function() { /*
        <p>Specifies the $$DOC{ref:'Model.name'} of the $$DOC{ref:'Model'} that
        this model should inherit from. Like object-oriented inheritance, this $$DOC{ref:'Model'} will gain the
        $$DOC{ref:'Property',usePlural:true}, $$DOC{ref:'Method',usePlural:true}, and other features
        defined inside the $$DOC{ref:'Model'} you extend.</p>
        <p>You may override features by redefining them in your $$DOC{ref:'Model'}.</p>
        <p>Like most inheritance schemes, instances of your $$DOC{ref:'Model'} may be used in place of
        instances of the $$DOC{ref:'Model'} you extend.</p>
         */}
    },
    {
      name: 'extendsModel',
      hidden: true,
      compareProperty: constantFn(0),
      getter: function() {
        return null; },
      setter: function(e) {
        console.warn("Deprecated use of 'extendsModel'. Use 'extends' instead."); if ( e ) this.extends = e; },
    },
    {
      name: 'traits',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      defaultValueFn: function() { return []; },
      help: 'Traits to mix-into this Model.',
      documentation: function() { /* Traits allow you to mix extra features into your $$DOC{ref:'Model'}
         through composition, avoiding inheritance where unecesssary. */}
    },
    {
      name: 'plural',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return this.name + 's'; },
      help: 'The plural form of this model\'s name.',
      documentation: function() { /* The plural form of $$DOC{ref:'Model.name'}, for use in database
        table naming, labels and documentation. The format generally follows the same
        contsraints as $$DOC{ref:'.name'}. */}
    },
    {
      name: 'version',
      defaultValue: 1,
      help: 'Version number of model.',
      documentation: function() { /* For backwards compatibility, major changes should be marked by
        incrementing the version number. */}

    },
    {
      name: 'ids',
      label: 'Key Properties',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      defaultValueFn: function() {
        var id = this.getProperty('id');
        if ( id ) return ['id'];
        var props = this.getRuntimeProperties();
        return props.length ? [props[0].name] : [];
      },
      help: 'Properties which make up unique id.',
      documentation: function() { /* An optional list of names of $$DOC{ref:'Property',usePlural:true} from
        this $$DOC{ref:'Model'}, which can be used together as a primary key. The $$DOC{ref:'Property',usePlural:true},
        when combined, should uniquely identify an instance of your $$DOC{ref:'Model'}.
        $$DOC{ref:'DAO',usePlural:true} that support indexing can use this as a suggestion on how to index
        instances of your $$DOC{ref:'Model'}. */}

    },
    {
      name: 'requires',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      defaultValueFn: function() { return []; },
      help: 'Model imports.',
      documentation: function() { /*
          <p>List of model imports, as strings of the form:
            <code>'Model-Path [as Alias]'</code>.</p>
          <p>Aliases are created on your instances that reference the full
            path of the model, taking it from your this.X
            $$DOC{ref:'developerDocs.Context', text:'context'}.</p>
          <p>For example:</p>
          <p><code>requires: [ 'mypackage.DataLayer.BigDAO',
                   'mypackage.UI.SmallTextView as TextView' ]<br/>
                   ...<br/>
                   // in your Model's methods: <br/>
                  this.BigDAO.create();   // equivalent to this.X.mypackage.DataLayer.BigDAO.create()<br/>
                  this.TextView.create(); // equivalent to this.X.mypackage.UI.SmallTextView.create()<br/>
                  </code></p>
        */}
    },
    {
      name: 'imports',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      defaultValueFn: function() { return []; },
      help: 'Context imports.',
      documentation: function() { /*
          <p>List of context items to import, as strings of the form:
          <code>Key [as Alias]</code>.</p>
          <p>Imported items are installed into your $$DOC{ref:'Model'}
          as pseudo-properties, using their $$DOC{ref:'Model.name', text:'name'}
          or the alias specified here.</p>
          <p><code>imports: [ 'selectedItem',
                   'selectionDAO as dao' ]<br/>
                   ...<br/>
                   // in your Model's methods: <br/>
                  this.selectedItem.get(); // equivalent to this.X.selectedItem.get()<br/>
                  this.dao.select(); // equivalent to this.X.selectionDAO.select()<br/>
                  </code></p>
          <p>If you have $$DOC{ref:'.exports',text:'exported'} properties from a
          $$DOC{ref:'Model'} in a parent context, you can import those items and give
          them aliases for convenient access without the <code>this.X</code>.</p>
          <p>You can also re-export items you have imported, either with a different
          name or to replace the item you imported with a different property. While
          everyone can see changes to the value inside the imported property, only
          children (instances you create in your $$DOC{ref:'Model'}) will see
          $$DOC{ref:'Model.exports'} replacing the property itself.
        */}
    },
    {
      name: 'exports',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      defaultValueFn: function() { return []; },
      help: 'Context exports.',
      documentation: function() { /*
          <p>A list of $$DOC{ref:'Property',usePlural:true} to export to your sub-context,
           as strings of the form:
          <code>PropertyName [as Alias]</code>.</p>
          <p>Properties you wish to share with other instances you create
            (like sub-$$DOC{ref:'foam.ui.View',usePlural:true})
            can be exported automatically by listing them here.
            You are automatically sub-contexted, so your parent context does not
            see exported properties. In other words, exports are seen by children,
            not by parents.</p>
            <p>Instances you create can declare $$DOC{ref:'Model.imports'} to
            conveniently grab your exported items from the context.<p>
          <p><code>MODEL({ name: firstModel<br/>
               &nbsp;&nbsp;   exports: [ 'myProperty', 'name as parentName' ],<br/>
               &nbsp;&nbsp;   properties: [<br/>
               &nbsp;&nbsp;     {<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp; name: 'proper',<br/>
                <br/>
                 &nbsp;&nbsp;&nbsp;&nbsp; // This property will create a DetailView for us<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp; view: { factory_: 'foam.ui.DetailView',<br/>
                <br/>
v                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; // we can import the properties our creator exported.<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; imports: [ 'myProperty', 'parentName' ],<br/>
                <br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; methods: { toHTML: function() {<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; // our context is provided by firstModel, so:<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; this.myProperty = 4; // we can see exported myProperty<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; out.print(this.parentName); // aliased, links back to our name<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;     }}},<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;     ...<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;     { name: 'myProperty' },<br/>
                 &nbsp;&nbsp;&nbsp;&nbsp;     { name: 'name' }<br/>
                 &nbsp;&nbsp; ]<br/>
                 &nbsp;&nbsp; ...<br/>
                  </code></p>
        */}
    },
    {
      name: 'implements',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      defaultValueFn: function() { return []; },
      help: 'Interfaces implemented by this Model.',
      documentation: function() { /* $$DOC{ref:'Interface',usePlural:true} implemented by this $$DOC{ref:'Model'} .*/}
    },
    {
      name: 'swiftImplements',
      type: 'Array[String]',
      labels: ['compiletime', 'swift'],
      defaultValueFn: function() { return this.implements; },
      help: 'Swift interfaces implemented by this Model.',
    },
    {
      name: 'javaImplements',
      type: 'Array[String]',
      labels: ['compiletime', 'java'],
      defaultValueFn: function() { return this.implements; },
      help: 'Java interfaces implemented by this Model.',
    },
    {
      name: 'swiftClassImports',
      type: 'Array[String]',
      labels: ['compiletime', 'swift'],
      defaultValueFn: function() { return []; },
      help: 'Imports to add at the top of the generated swift class.',
    },
    {
      name: 'swiftCode',
      type: 'String',
      labels: ['compiletime', 'swift'],
      defaultValue: '',
      help: 'Swift code to drop in when generating the swift class for this model.',
    },
    {
      name: 'javaCode',
      type: 'String',
      labels: ['compiletime', 'java'],
      defaultValue: '',
      help: 'Java code to drop in when generating the java class for this model.',
    },
    {
      name: 'onLoad',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: "A function which is called when a Model's prototype is built.",
      documentation: function() { /*
      */}
    },
    {
      name: 'tableProperties',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      displayWidth: 70,
      lazyFactory: function() {
        return (this.properties || this.properties_).filter(function(o) {
          return !o.hidden;
        }).map(function(o) {
          return o.name;
        });
      },
      help: 'Properties to be displayed in table view. Defaults to all properties.',
      documentation: function() { /* Indicates the $$DOC{ref:'Property',usePlural:true} to display when viewing a list of instances
        of this $$DOC{ref:'Model'} in a table or other $$DOC{ref:'Property'} viewer. */}
    },
    {
      name: 'searchProperties',
      type: 'Array[String]',
      view: 'foam.ui.StringArrayView',
      displayWidth: 70,
      defaultValueFn: function() {
        return this.tableProperties;
      },
      help: 'Properties display in a search view. Defaults to table properties.',
      documentation: function() { /* Indicates the $$DOC{ref:'Property',usePlural:true} to display when viewing
        of this $$DOC{ref:'Model'} in a search view. */}
    },
    {
//      type: 'Array',
      name: 'properties',
      type: 'Array[Property]',
      subType: 'Property',
      javaType: 'java.util.List<foam.core.Property>',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      help: 'Properties associated with the entity.',
      preSet: function(oldValue, newValue) {
        // Convert Maps to Properties if required
        for ( var i = 0 ; i < newValue.length ; i++ ) {
          var p = newValue[i];

          if ( typeof p === 'string' ) {
            newValue[i] = p = { name: p };
          } else if ( Array.isArray(p) ) {
            newValue[i] = p = { name: p[0], defaultValue: p[1] };
          }

          if ( p.labels && ! FEATURE_ENABLED(p.labels) ) {
            newValue.splice(i,1);
            i--;
            continue;
          }

          if ( ! p.model_ ) {
            // The mapping from type to model_ is also done in JSONUtil,
            // but that doesn't handle Bootstrap models.
            if ( p.type && this.X.lookup(p.type + 'Property') ) {
              p.model_ = p.type + 'Property';
              p.type = undefined;
              p = newValue[i] = JSONUtil.mapToObj(this.X, p);
            } else {
              p = newValue[i] = Property.create(p);
            }
          } else if ( typeof p.model_ === 'string' ) {
            p = newValue[i] = JSONUtil.mapToObj(this.X, p);
          }

          // create property constant
          this[constantize(p.name)] = newValue[i];
        }

        this.propertyMap_ = null;

        return newValue;
      },
      postSet: function(_, newValue) {
        for ( var i = 0 ; i < newValue.length ; i++ ) {
          newValue[i].modelId = this.id;
        }
      },
      documentation: function() { /*
        <p>The $$DOC{ref:'Property',usePlural:true} of a $$DOC{ref:'Model'} act as data members
          and connection points. A $$DOC{ref:'Property'} can store a modelled value, and bind
          to other $$DOC{ref:'Property',usePlural:true} for easy reactive programming.</p>
        <p>Note that, like $$DOC{ref:'Model'} being a $$DOC{ref:'Model'} itself, the
          $$DOC{ref:'Model.properties'} feature of all models is itself a $$DOC{ref:'Property'}.
        */}
    },
    {
      name: 'actions',
      type: 'Array[Action]',
      subType: 'Action',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      help: 'Actions associated with the entity.',
      adapt: function(_, a) {
        if ( ! Action ) return a;

        // Convert Maps to Actions if required
        for ( var i = 0 ; i < a.length ; i++ ) {
          var p = a[i];

          if ( typeof p === 'function' ) {
            a[i] = Action.create({name: p.name, code: p});
          } else if ( ! p.model_ ) {
            a[i] = Action.create(p);
          } else if ( typeof p.model_ === 'string' ) {
            a[i] = FOAM(p);
          }

          // create property constant
          if ( p.name && ! this[constantize(p.name)] ) {
            this[constantize(p.name)] = a[i];
          }
        }

        return a;
      },
      documentation: function() { /*
        <p>$$DOC{ref:'Action',usePlural:true} implement a behavior and attach a label, icon, and typically a
        button-like $$DOC{ref:'foam.ui.View'} or menu item to activate the behavior.</p>
        */}

    },
    {
      name: 'constants',
      type: 'Array[Constant]',
      subType: 'Constant',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      help: 'Constants associated with the entity.',
      preSet: function(_, newValue) {
        if ( ! Constant ) return newValue;

        if ( Array.isArray(newValue) ) return JSONUtil.arrayToObjArray(this.X, newValue, Constant);

        // convert a map of values to an array of Constant objects
        var constants = [];

        for ( var key in newValue ) {
          var oldValue = newValue[key];

          var constant = Constant.create({
            name:  key,
            value: oldValue
          });

          constants.push(constant);
        }

        return constants;
      }
    },
    {
      name: 'messages',
      type: 'Array[Message]',
      subType: 'Constant',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      help: 'Messages associated with the entity.',
      preSet: function(_, ms) {
        if ( ! GLOBAL.Message ) return ms;

        if ( Array.isArray(ms) ) return JSONUtil.arrayToObjArray(this.X, ms, Message);

        // convert a map of values to an array of Message objects
        var messages = [];

        for ( var key in ms ) {
          var oldValue = ms[key];

          var message = Message.create({
            name:  key,
            value: oldValue
          });

          messages.push(message);
        }

        return messages;
      }
    },
    {
//      type: 'Array',
      name: 'methods',
      subType: 'Method',
      factory: function() { return []; },
      help: 'Methods associated with the entity.',
      adapt: function(_, a) {
        if ( ! Method ) return a;

        if ( Array.isArray(a) ) {
          for ( var i = 0 ; i < a.length ; i++ ) {
            a[i] = ( typeof a[i] === 'function' ) ?
              this.createMethod_(this.X, a[i].name, a[i]) :
              JSONUtil.mapToObj(this.X, a[i], Method, seq) ;
          }
          return a;
        }

        // convert a map of functions to an array of Method instances, DEPRECATED
        var methods = [];
        for ( var key in a )
          methods.push(this.createMethod_(this.X, key, a[key]));
        return methods;
      },
      documentation: function() { /*
        <p>$$DOC{ref:'Method',usePlural:true} contain code that runs in the instance's scope, so code
        in your $$DOC{ref:'Method'} has access to the other $$DOC{ref:'Property',usePlural:true} and
        features of your $$DOC{ref:'Model'}.</p>
        <ul>
          <li><code>this.propertyName</code> gives the value of a $$DOC{ref:'Property'}</li>
          <li><code>this.propertyName$</code> is the binding point for the $$DOC{ref:'Property'}. Assignment
              will bind bi-directionally, or <code>Events.follow(src, dst)</code> will bind from
              src to dst.</li>
          <li><code>this.methodName</code> calls another $$DOC{ref:'Method'} of this
                  $$DOC{ref:'Model'}</li>
          <li><code>this.SUPER()</code> calls the $$DOC{ref:'Method'} implementation from the
                    base $$DOC{ref:'Model'} (specified in $$DOC{ref:'Model.extends'}). Calling
                    <code>this.SUPER()</code> is extremely important in your <code>init()</code>
                     $$DOC{ref:'Method'}, if you provide one.</li>
        </ul>
        <p>In JSON, $$DOC{ref:'Model.methods'} may be specified as a dictionary:</p>
        <p><code>methods: { methodName: function(arg1) {  ...your code here... }, anotherMethod: ... }</code></p>
        */}
    },
    {
      name: 'listeners',
      type: 'Array[Method]',
      subType: 'Method',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      adapt: function(_, a) {
        if ( ! Method ) return a;

        if ( Array.isArray(a) ) {
          for ( var i = 0 ; i < a.length ; i++ ) {
            a[i] = ( typeof a[i] === 'function' ) ?
              this.createMethod_(this.X, a[i].name, a[i]) :
              JSONUtil.mapToObj(this.X, a[i], Method, seq) ;
          }
          return a;
        }

        console.error('Expecting array of listeners.');
      },
      help: 'Event listeners associated with the entity.',
      documentation: function() { /*
        <p>The $$DOC{ref:'Model.listeners'} $$DOC{ref:'Property'} contains a list of $$DOC{ref:'Method',usePlural:true},
          but is separate and differs from the $$DOC{ref:'Model.methods'} $$DOC{ref:'Property'} in how the scope
          is handled. For a listener, <code>this</code> is bound to your instance, so when the listener is
          invoked by an event from elsewhere in the system it can still access the features of its $$DOC{ref:'Model'}
          instance.</p>
        <p>In javascript, listeners are connected using
          <code>OtherProperty.addListener(myModelInstance.myListener);</code></p>
      */}
    },
    /*
      {
      name: 'topics',
      type: 'Array[topic]',
      subType: 'Topic',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      // defaultValue: [],
      help: 'Event topics associated with the entity.'
      },
    */
    {
      name: 'templates',
      type: 'Array[Template]',
      subType: 'Template',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      preSet: function(_, templates) {
        for ( var i = 0 ; i < templates.length ; i++ ) {
          if ( templates[i].labels && ! FEATURE_ENABLED(templates[i].labels) ) {
            templates.splice(i, 1);
            i--;
            continue;
          }
        }
        return templates;
      },
      postSet: function(_, templates) { TemplateUtil.expandModelTemplates(this); },
      help: 'Templates associated with this entity.',
      documentation: function() { /*
        The $$DOC{ref:'Template',usePlural:true} to process and install into instances of this
        $$DOC{ref:'Model'}. $$DOC{ref:'foam.ui.View',usePlural:true} created inside each $$DOC{ref:'Template'}
        using the $$DOC{ref:'.templates',text:'$$propertyName{args}'} view creation tag become available
        as <code>myInstance.propertyNameView</code>.
        */}
    },
    {
      name: 'models',
      type: 'Array[Model]',
      subType: 'Model',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      adapt: function(_, newValue) {
        if ( ! Model ) return newValue;
        if ( ! Array.isArray(newValue) ) return newValue;
        var id = this.id;
        return JSONUtil.arrayToObjArray(this.X, newValue, Model).map(function(m) {
          m.package = id;
          return m;
        });
      },
      postSet: function(_, models) {
        for ( var i = 0 ; i < models.length ; i++ ) this[models[i].name] = models[i];
      },
      help: 'Sub-models embedded within this model.',
      documentation: function() { /*
        $$DOC{ref:'Model',usePlural:true} may be nested inside one another to better organize them.
        $$DOC{ref:'Model',usePlural:true} declared this way do not gain special access to their containing
        $$DOC{ref:'Model'}, but are only accessible through their container.
        */}
    },
    {
      name: 'tests',
      label: 'Unit Tests',
      type: 'Array[Unit Test]',
      subType: 'UnitTest',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      adapt: function(_, a) {
        if ( ! a ) return a;
        for ( var i = 0 ; i < a.length ; i++ ) {
          if ( typeof a[i] === "function" ) {
            a[i] = UnitTest.create({
              name: a[i].name,
              code: a[i]
            });
          }
        }
        return a;
      },
      help: 'Unit tests associated with this model.',
      documentation: function() { /*
          Create $$DOC{ref:'UnitTest',usePlural:true} that should run to test the functionality of this
          $$DOC{ref:'Model'} here.
        */}
    },
    {
      name: 'relationships',
      subType: 'Relationship',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      help: 'Relationships of this model to other models.',
      preSet: function(_, newValue) {
        if ( ! Relationship ) return newValue;

        // Convert Maps to Relationships if required
        for ( var i = 0 ; i < newValue.length ; i++ ) {
          var p = newValue[i];

          if ( ! p.model_ ) {
            p = newValue[i] = Relationship.create(p);
          } else if ( typeof p.model_ === 'string' ) {
            p = newValue[i] = FOAM(p);
          }

          // create property constant
          this[constantize(p.name)] = newValue[i];
        }

        return newValue;
      },
      documentation: function() { /*
          <p>$$DOC{ref:'Relationship',usePlural:true} indicate a parent-child relation between instances of
          this $$DOC{ref:'Model'} and the indicated $$DOC{ref:'Model',usePlural:true}, through the indicated
          $$DOC{ref:'Property',usePlural:true}. If your $$DOC{ref:'Model',usePlural:true} build a tree
          structure of instances, they could likely benefit from a declared $$DOC{ref:'Relationship'}.
          </p>
        */}
    },
    {
      name: 'issues',
      type: 'Array[Issue]',
      subType: 'Issue',
      labels: ['debug'],
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      propertyToJSON: function(visitor, output, o) {
        if ( o[this.name].length ) visitor.visitArray(o[this.name]);
      },
      help: 'Issues associated with this model.',
      documentation: function() { /*
          Bug tracking inside the FOAM system can attach $$DOC{ref:'Issue',usePlural:true} directly to the
          affected $$DOC{ref:'Model',usePlural:true}.
        */}
    },
    {
      name: 'help',
      label: 'Help Text',
      type: 'String',
      displayWidth: 70,
      displayHeight: 6,
      view: 'foam.ui.TextAreaView',
      defaultValue: '',
      help: 'Help text associated with the entity.',
      documentation: function() { /*
          This $$DOC{ref:'.help'} text informs end users how to use the $$DOC{ref:'Model'} or
          $$DOC{ref:'Property'}, through field labels or tooltips.
        */}

    },
    {
      name: 'i18nComplete_',
      defaultValue: false,
      hidden: true,
      transient: true
    },
    {
      name: 'translationHint',
      label: 'Description for Translation',
      type: 'String',
      defaultValueFn: function() { return this.name; }
    },
    DocumentationBootstrap,
    {
      name: 'notes',
      type: 'String',
      displayWidth: 70,
      displayHeight: 6,
      view: 'foam.ui.TextAreaView',
      defaultValue: '',
      help: 'Internal documentation associated with this entity.',
      documentation: function() { /*
          Internal documentation or implementation-specific 'todo' notes.
        */}
    }
  ],

  templates:[
  //  {
  //    model_: 'Template',
  //    name: 'closureExterns',
  //    description: 'Closure Externs JavaScript Source',
  //    template: '/**\n' +
  //      ' * @constructor\n' +
  //      ' */\n' +
  //      '<%= this.name %> = function() {};\n' +
  //      '<% for ( var i = 0 ; i < this.properties.length ; i++ ) { var prop = this.properties[i]; %>' +
  //      '\n<%= prop.closureSource(undefined, this.name) %>\n' +
  //      '<% } %>' +
  //      '<% for ( var i = 0 ; i < this.methods.length ; i++ ) { var meth = this.methods[i]; %>' +
  //      '\n<%= meth.closureSource(undefined, this.name) %>\n' +
  //      '<% } %>'
  //  },
  //  {
  //    model_: 'Template',
  //    name: 'dartSource',
  //    description: 'Dart Class Source',
  //    template: '<% out(this.name); %>\n{\n<% for ( var key in this.properties ) { var prop = this.properties[key]; %>   var <%= prop.name %>;\n<% } %>\n\n   <%= this.name %>()\n   {\n\n   }\n\n   <%= this.name %>(<% for ( var key in this.properties ) { var prop = this.properties[key]; %>this.<%= prop.name, key < this.properties.length-1 ? ", ": "" %><% } %>)\n}'
  //  },
  //  {
  //    model_: 'Template',
  //    name: 'protobufSource',
  //    description: 'Protobuf source',
  //    template: 'message <%= this.name %> {\n<% for (var i = 0, prop; prop = this.properties[i]; i++ ) { if ( prop.prototag == null ) continue; if ( prop.help ) { %>//<%= prop.help %>\n<% } %>  <% if ( prop.type.startsWith("Array") ) { %>repeated<% } else if ( false ) { %>required<% } else { %>optional<% } %>  <%= prop.protobufType %> <%= prop.name %> = <%= prop.prototag %>;\n\n<% } %>}\n'
  //  }
  ],

  toString: function() { return "Model"; }
};

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

GLOBAL.Property = {
  __proto__: BootstrapModel,
  instance_: {},

  name:  'Property',
  swiftImplements: ['ExprProtocol'],
  javaImplements: ['foam.core2.ExprInterface'],
  plural:'Properties',
  help:  'Describes a properties of a modelled entity.',

  ids: [ 'name' ],

  tableProperties: [
    'name',
    'label',
    'type',
    'required',
    'defaultValue'
  ],

  documentation: function() { /*
    <p>The $$DOC{ref:'Property',usePlural:true} of a $$DOC{ref:'Model'} act as data members
      and connection points. A $$DOC{ref:'Property'} can store a modelled value, and bind
      to other $$DOC{ref:'Property',usePlural:true} for easy reactive programming.</p>
    <p>Note that, like $$DOC{ref:'Model'} being a $$DOC{ref:'Model'} itself, the
      $$DOC{ref:'Model.properties'} feature of all models is itself a $$DOC{ref:'Property'}.
    <p>
  */},

  properties: [
    {
      name: 'name',
      swiftType: 'String',
      javaType: 'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      mode: 'read-only', // TODO: this should be 'final' when available
      help: 'The coding identifier for the property.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
         */}
    },
    {
      name: 'labels',
      type: 'Array',
      subType: 'String',
      labels: ['debug', 'javascript'],
    },
    {
      name: 'label',
      swiftType: 'String',
      javaType: 'String',
      required: false,
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return labelize(this.name); },
      help: 'The display label for the property.',
      documentation: function() { /* A human readable label for the $$DOC{ref:'.'}. May
        contain spaces or other odd characters.
         */}
    },
    {
      name: 'translationHint',
      type: 'String',
      required: false,
      documentation: 'Used to describe the property for translators.',
    },
    {
      name: 'speechLabel',
      type: 'String',
      swiftType: 'String',
      required: false,
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return this.label; },
      help: 'The speech label for the property.',
      documentation: function() { /* A speakable label for the $$DOC{ref:'.'}. Used for accesibility.
         */}
    },
    {
      name: 'speechLabelTranslationHint',
      type: 'String',
      required: false,
      documentation: 'Used to describe the speech label for translators.',
      defaultValueFn: function() { return this.translationHint; },
    },
    {
      name: 'tableLabel',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return this.label; },
      help: 'The table display label for the entity.',
      documentation: function() { /* A human readable label for the $$DOC{ref:'Model'} for use in tables. May
        contain spaces or other odd characters.
         */}
    },
    {
      name: 'type',
      type: 'String',
      required: true,
      view: {
        factory_: 'foam.ui.ChoiceView',
        choices: [
          'Array',
          'Boolean',
          'Color',
          'Date',
          'DateTime',
          'Email',
          'Enum',
          'Float',
          'Function',
          'Image',
          'Int',
          'Object',
          'Password',
          'String',
          'String[]',
          'URL'
        ]
      },
      defaultValue: 'String',
      help: 'The type of the property.',
      documentation: function() { /* <p>The type of the $$DOC{ref:'.'}, either a primitive type or
          a $$DOC{ref:'Model'}.</p> <p>Primitives include:</p>
      <ul>
          <li>Array</li>
          <li>Boolean</li>
          <li>Color</li>
          <li>Date</li>
          <li>DateTime</li>
          <li>Email</li>
          <li>Enum</li>
          <li>Float</li>
          <li>Function</li>
          <li>Image</li>
          <li>Int</li>
          <li>Object</li>
          <li>Password</li>
          <li>String</li>
          <li>String[]</li>
          <li>URL</li>
      </ul>
         */}
    },
    {
      name: 'swiftDefaultValue',
      labels: ['swift', 'compiletime'],
      adapt: function(_, n) { return multiline(n); },
    },
    {
      name: 'swiftDefaultValueFn',
      labels: ['swift', 'compiletime'],
      adapt: function(_, n) { return multiline(n); },
    },
    {
      name: 'javaDefaultValue',
      labels: ['java', 'compiletime'],
      adapt: function(_, n) { return multiline(n); },
    },
    {
      name: 'javaDefaultValueFn',
      labels: ['java', 'compiletime'],
      adapt: function(_, n) { return multiline(n); },
    },
    {
      name: 'protobufType',
      type: 'String',
      required: false,
      help: 'The protobuf type that represents the type of this property.',
      defaultValueFn: function() { return this.type.toLowerCase(); },
      documentation: function() {/* When generating protobuf definitions, specifies the type to use for the field this represents. */}
    },
    {
      name: 'javaType',
      type: 'String',
      labels: ['compiletime', 'java'],
      required: false,
      defaultValue: 'Object',
      help: 'The java type that represents the type of this property.',
      documentation: function() { /* When running FOAM in a Java environment, specifies the Java type
        or class to use. */}
    },
    {
      name: 'javascriptType',
      type: 'String',
      labels: ['compiletime', 'javascript'],
      required: false,
      defaultValueFn: function() { return this.type; },
      help: 'The javascript type that represents the type of this property.',
      documentation: function() { /* When running FOAM in a javascript environment, specifies the javascript
         type to use. */}
    },
    {
      name: 'swiftType',
      type: 'String',
      required: false,
      labels: ['compiletime', 'swift'],
      defaultValue: 'AnyObject?',
      help: 'The Swift type that represents this type of property.',
    },
    {
      name: 'swiftNSCoderEncode',
      type: 'String',
      required: false,
      labels: ['compiletime', 'swift'],
      defaultValue: '// <%= this.name %> is unsupported for coding.',
    },
    {
      name: 'swiftNSCoderDecode',
      type: 'String',
      required: false,
      labels: ['compiletime', 'swift'],
      defaultValue: '// <%= this.name %> is unsupported for coding.',
    },
    {
      name: 'shortName',
      type: 'String',
      required: true,
      displayWidth: 10,
      displayHeight: 1,
      defaultValue: '',
      help: 'A short alternate name to be used for compact encoding.',
      documentation: "A short alternate $$DOC{ref:'.name'} to be used for compact encoding."
    },
    {
      name: 'singular',
      type: 'String',
      required: false,
      displayWidth: 70
    },
    {
      name: 'aliases',
      // type: 'Array[String]',
      labels: ['javascript'],
      view: 'foam.ui.StringArrayView',
      factory: function() { return []; },
      help: 'Alternate names for this property.',
      documentation: function() { /*
        Aliases can be used as synonyms for this $$DOC{ref:'Property'} in code or to look it up by name.
      */}
    },
    {
      name: 'mode',
      type: 'String',
      defaultValue: 'read-write',
      view: { factory_: 'foam.ui.ChoiceView', choices: ['read-only', 'read-write', 'final'] },
      documentation: function() { /*
        To restrict modification to a $$DOC{ref:'Property'}, the $$DOC{ref:'.mode'} can be set to read-only
        to block changes, or to final to block overriding this $$DOC{ref:'Property'} in descendents of
        the $$DOC{ref:'Model'} that owns this $$DOC{ref:'Property'}.
      */}
    },
    {
      name: 'subType',
      label: 'Sub-Type',
      type: 'String',
      displayWidth: 30,
      // todo: keyView of Models
      help: 'The type of the property.',
      documentation: function() { /*
        In array types, the $$DOC{ref:'.subType'} indicates the type that the array contains.
      */}
    },
    {
      name: 'subKey',
      // type: 'EXPR',
      labels: ['javascript'],
      displayWidth: 20,
      defaultValue: 'ID',
      help: 'The foreign key that this property references.',
      documentation: function() {/*
        Used to project whole objects of $$DOC{ref:'.subType'} into the value
        of this Property. For foreign key properties, this is the foreign property.
        For eg. an email property, when the subType is a whole Contact object,
        subKey will be EMAIL.
      */}
    },
    {
      name: 'units',
      type: 'String',
      required: true,
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'The units of the property.',
      documentation: function() { /*
        The units of the $$DOC{ref:'Property'}.
      */}
    },
    {
      name: 'required',
      type: 'Boolean',
      view: 'foam.ui.BooleanView',
      defaultValue: true,
      help: 'Indicates if the property is a required field.',
      documentation: function() { /*
        Indicates whether the $$DOC{ref:'Property'} is required for its owner $$DOC{ref:'Model'} to
        function properly.
      */}
    },
    {
      // For U2, replaces hidden
      name: 'visibility',
      choices: [ 'rw', 'final', 'ro', 'hidden' ],
      postSet: function(_, v) { if ( 'hidden' === v ) this.hidden = true; }
    },
    {
      name: 'hidden',
      type: 'Boolean',
      view: 'foam.ui.BooleanView',
      defaultValue: false,
      postSet: function(old, hidden) { if ( (! old) && hidden ) this.visibility = 'hidden'; },
      help: 'Indicates if the property is hidden.',
      documentation: function() { /*
        Indicates whether the $$DOC{ref:'Property'} is for internal use and should be hidden from
        the user when viewing tables or other views of $$DOC{ref:'Model'}
        $$DOC{ref:'Property',usePlural:true}.
      */}
    },
    {
      name: 'transient',
      type: 'Boolean',
      swiftType: 'Bool',
      javaType: 'boolean',
      view: 'foam.ui.BooleanView',
      defaultValue: false,
      help: 'Indicates if the property is transient.',
      documentation: function() { /*
        Indicates whether the $$DOC{ref:'Property'} is transient, and should not be saved permanently
        or serialized.
      */}
    },
    {
      name: 'modelId',
      type: 'String',
      view: 'foam.ui.TextFieldView',
      help: 'Id of the model that this is a property of',
      transient: true
    },
    {
      name: 'displayWidth',
      type: 'Int',
      displayWidth: 8,
      displayHeight: 1,
      defaultValue: 30,
      help: 'The display width of the property.',
      documentation: function() { /*
        A width suggestion for views that automatically render the $$DOC{ref:'Property'}.
      */}
    },
    {
      name: 'displayHeight',
      type: 'Int',
      displayWidth: 8,
      displayHeight: 1,
      defaultValue: 1,
      help: 'The display height of the property.',
      documentation: function() { /*
        A height suggestion for views that automatically render the $$DOC{ref:'Property'}.
      */}
    },
    {
//      type: 'ViewFactory',
      name: 'view',
      // type: 'view',
      labels: ['javascript'],
      defaultValue: 'foam.ui.TextFieldView',
      help: 'View component for the property.',
      documentation: function() { /*
        The default $$DOC{ref:'foam.ui.View'} to use when rendering the $$DOC{ref:'Property'}.
        Specify a string or an object with factory_ and other properties specified.
      */}
    },
    {
//      type: 'ViewFactory',
      name: 'toPropertyE',
      labels: ['javascript'],
      defaultValue: function toPropertyE(X) {
        var e = this.displayHeight > 1 ?
          X.lookup('foam.u2.MultiLineTextField').create(null, X) :
          X.lookup('foam.u2.TextField').create(null, X)    ;

        e.attrs({size: this.displayWidth});

        return e;
      },
      adapt: function(_, nu) {
        if ( typeof nu === 'string' ) {
          var f = function(X) { return X.lookup(nu).create(null, X); };
          f.toString = function() { return "'"+nu+"'"; };
          return f;
        } else {
          return nu;
        }
      },
    },
    {
//      type: 'ViewFactory',
      name: 'detailView',
      // type: 'view',
      labels: ['javascript'],
      defaultValueFn: function() { return this.view; },
      help: 'View component for the property when rendering within a DetailView.',
      documentation: function() { /*
        The default $$DOC{ref:'foam.ui.View'} to use when rendering the $$DOC{ref:'Property'}
        as a part of a $$DOC{ref:'foam.ui.DetailView'}. Specify a string or an object with
        factory_ and other properties specified.
      */}
    },
    {
//      type: 'ViewFactory',
      name: 'citationView',
      // type: 'view',
      labels: ['javascript'],
      defaultValueFn: function() { return this.view; },
      help: 'View component for the property when rendering within a CitationView.',
      documentation: function() { /*
        The default $$DOC{ref:'foam.ui.View'} to use when rendering the $$DOC{ref:'Property'}
        as a part of a $$DOC{ref:'CitationView'}. Specify a string or an object with
        factory_ and other properties specified.
      */}
    },
    {
      name: 'swiftView',
      type: 'String',
      labels: ['compiletime', 'swift'],
      help: 'The default view name for this property in swift.'
    },
    {
//      type: 'Function',
      name: 'detailViewPreRow',
      labels: ['javascript'],
      defaultValue: function() { return ""; },
      help: 'Inject HTML before row in DetailView.',
      documentation: function() { /*
        An optional function to
        inject HTML before the row in $$DOC{ref:'foam.ui.DetailView'}.
      */}
    },
    {
//      type: 'Function',
      name: 'detailViewPostRow',
      labels: ['javascript'],
      defaultValue: function() { return ""; },
      help: 'Inject HTML before row in DetailView.',
      documentation: function() { /*
        An optional function to
        inject HTML after the row in $$DOC{ref:'foam.ui.DetailView'}.
      */}
    },
    {
      name: 'defaultValue',
      type: 'String',
      required: false,
      labels: ['javascript'],
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      postSet: function(old, nu) {
        if ( nu && this.defaultValueFn ) this.defaultValueFn = undefined;
      },
      help: 'The property\'s default value.',
      documentation: function() { /*
        An optional function to
        inject HTML before the row in $$DOC{ref:'foam.ui.DetailView'}.
      */}
    },
    {
      name: 'defaultValueFn',
      label: 'Default Value Function',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      postSet: function(old, nu) {
        if ( nu && this.defaultValue ) this.defaultValue = undefined;
      },
      help: 'The property\'s default value function.',
      documentation: function() { /*
        Optional function that is evaluated when a default value is required. Will unset any
        $$DOC{ref:'.defaultValue'} that has been set.
      */}
    },
    {
      name: 'dynamicValue',
      label: "Value's Dynamic Function",
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: "A dynamic function which computes the property's value.",
      documentation: function() { /*
        Allows the value of this $$DOC{ref:'Property'} to be calculated dynamically.
        Other $$DOC{ref:'Property',usePlural:true} and bindable objects used inside the function will be
        automatically bound and the function re-evaluated when a dependency changes.
      */}

    },
    {
      name: 'factory',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'Factory for creating initial value when new object instantiated.',
      documentation: function() { /*
        An optional function that creates the instance used to store the $$DOC{ref:'Property'} value.
        This is useful when the $$DOC{ref:'Property'} type is a complex $$DOC{ref:'Model'} that requires
        construction parameters.
      */}
    },
    {
      name: 'lazyFactory',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      view: 'foam.ui.FunctionView',
      help: 'Factory for creating the initial value. Only called when the property is accessed for the first time.',
      documentation: function() { /*
        Like the $$DOC{ref:'.factory'} function, but only evaulated when this $$DOC{ref:'Property'} is
        accessed for the first time.
      */}
    },
    {
      name: 'regex',
      labels: ['javascript'],
    },
    {
      name: 'validate',
      type: 'Function',
      swiftType: 'FoamFunction?',
      javaType: 'FoamFunction<String>',
      required: false,
      view: 'foam.ui.FunctionView',
      help: 'Function for validating property value.',
      preSet: function(_, f) {
        if ( ! f.dependencies ) {
          var str = f.toString();
          var deps = str.match(/^function[ _$\w]*\(([ ,\w]*)/)[1];
          if ( deps )
            deps = deps.split(',').map(function(name) { return name.trim(); });
          else
            deps = [];

          var f2 = function() {
            var args = [];
            for ( var i = 0 ; i < deps.length ; i++ )
              args.push(this[deps[i]]);
            return f.apply(this, args);
          };

          f2.dependencies = deps;
          f2.toString = function() { return f.toString(); };

          return f2;
        }
        return f;
      },
      compareProperty: function(o1, o2) {
        return o1.toString() !== o2.toString();
      },
      documentation: function() { /*
        Arguments to the validate function should be named after the properties
        of this object. They will be passed in when the validate() function is
        run. Return an error string if validation fails.
      */}
    },
    {
      name: 'swiftValidate',
      labels: ['swift', 'compiletime'],
    },
    {
      name: 'javaValidate',
      labels: ['java', 'compiletime'],
    },
    {
      name: 'javaAdapt',
      type: 'String',
      labels: ['compiletime', 'java'],
      defaultValue: function() {/*
        return (<%= this.javaType %>) newValue;
      */},
    },
    {
      name: 'javaPreSet',
      type: 'String',
      labels: ['compiletime', 'java'],
      defaultValue: function() {/*
        return newValue;
      */},
    },
    {
      name: 'javaPostSet',
      type: 'String',
      labels: ['compiletime', 'java'],
      defaultValue: '//javaPostSet goes here.',
    },
    {
      name: 'javaGetter',
      type: 'String',
      labels: ['compiletime', 'java'],
    },
    {
      name: 'javaFactory',
      type: 'String',
      labels: ['compiletime', 'java'],
      adapt: function(_, n) {
        if ( typeof n == "function" ) return multiline(n);
        return n;
      }
    },
    {
      name: 'javaLazyFactory',
      type: 'String',
      labels: ['compiletime', 'java'],
      adapt: function(_, n) {
        if ( typeof n == "function" ) return multiline(n);
        return n;
      }
    },
    {
      name: 'swiftAdapt',
      type: 'String',
      labels: ['compiletime', 'swift'],
      defaultValue: function() {/*
        <% if (this.swiftType == 'AnyObject?') { %>
          return newValue
        <% } else { %>
          return newValue as! <%= this.swiftType %>
        <% } %>
      */},
    },
    {
      name: 'swiftPreSet',
      type: 'String',
      labels: ['compiletime', 'swift'],
      defaultValue: 'return newValue',
    },
    {
      name: 'swiftPostSet',
      type: 'String',
      labels: ['compiletime', 'swift'],
      defaultValue: '//swiftPostSet goes here.',
    },
    {
      name: 'swiftGetter',
      type: 'String',
      labels: ['compiletime', 'swift'],
    },
    {
      name: 'swiftFactory',
      type: 'String',
      labels: ['compiletime', 'swift'],
    },
    {
      name: 'swiftLazyFactory',
      type: 'String',
      labels: ['compiletime', 'swift'],
    },
    {
      name: 'getter',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'The property\'s default value function.',
      documentation: function() { /*
        For advanced use. Supplying a $$DOC{ref:'.getter'} allows you to completely re-implement the $$DOC{ref:'Property'}
        storage mechanism, to calculcate the value, or cache, or pre-process the value as it is requested.
        In most cases you can just supply a $$DOC{ref:'.preSet'} or $$DOC{ref:'.postSet'} instead.
      */}
    },
    {
      name: 'adapt',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'An adapter function called before preSet.',
      documentation: function() { /*
        Allows you to modify the incoming value before it is set. Parameters <code>(old, nu)</code> are
        supplied with the old and new value. Return the value you want to be set.
      */}
    },
    {
      name: 'preSet',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'An adapter function called before normal setter logic.',
      documentation: function() { /*
        Allows you to modify the incoming value before it is set. Parameters <code>(old, nu)</code> are
        supplied with the old and new value. Return the value you want to be set.
      */}
    },
    {
      name: 'postSet',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'A function called after normal setter logic, but before property change event fired.',
      documentation: function() { /*
        Allows you to react after the value of the $$DOC{ref:'Property'} has been set,
        but before property change event is fired.
        Parameters <code>(old, nu)</code> are supplied with the old and new value.
      */}
    },
    {
      name: 'setter',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'The property\'s default value function.',
      documentation: function() { /*
        For advanced use. Supplying a $$DOC{ref:'.setter'} allows you to completely re-implement the $$DOC{ref:'Property'}
        storage mechanism, to calculcate the value, or cache, or pre-process the value as it is set.
        In most cases you can just supply a $$DOC{ref:'.preSet'} or $$DOC{ref:'.postSet'} instead.
      */}
    },
    {
      name: 'tableFormatter',
      label: 'Table Cell Formatter',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'Function to format value for display in TableView.',
      documentation: "A function to format the value for display in a $$DOC{ref:'foam.ui.TableView'}."
    },
    {
      name: 'summaryFormatter',
      label: 'Summary Formatter',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'Function to format value for display in SummaryView.',
      documentation: "A function to format the value for display in a $$DOC{ref:'SummaryView'}."
    },
    {
      name: 'tableWidth',
      type: 'String',
      required: false,
      defaultValue: '',
      help: 'Table View Column Width.',
      documentation: "A Suggestion for $$DOC{ref:'foam.ui.TableView'} column width."
    },
    {
      name: 'help',
      label: 'Help Text',
      type: 'String',
      swiftType: 'String',
      swiftDefaultValue: '""',
      required: false,
      displayWidth: 70,
      displayHeight: 6,
      view: 'foam.ui.TextAreaView',
      defaultValue: '',
      help: 'Help text associated with the property.',
      documentation: function() { /*
          This $$DOC{ref:'.help'} text informs end users how to use the $$DOC{ref:'Property'},
          through field labels or tooltips.
        */}
    },
    {
      name: 'helpTranslationHint',
      type: 'String',
      help: 'The translation hint for the help property.',
    },
    DocumentationBootstrap,
    {
      name: 'prototag',
      label: 'Protobuf tag',
      type: 'Int',
      defaultValue: 0,
      required: false,
      help: 'The protobuf tag number for this field.',
      documentation: 'The protobuf tag number for this field.'
    },
    {
      name: 'actionFactory',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: 'Factory to create the action objects for taking this property from value A to value B',
      documentation: "Factory to create the $$DOC{ref:'Action'} objects for taking this $$DOC{ref:'Property'} from value A to value B"
    },
    {
      name: 'compareProperty',
      type: 'Function',
      swiftType: 'FoamFunction',
      javaType: 'FoamFunction<Integer>',
      view: 'foam.ui.FunctionView',
      displayWidth: 70,
      displayHeight: 5,
      defaultValue: function(o1, o2) {
        if ( o1 === o2 ) return 0;
        if ( ! o1 && ! o2 ) return 0;
        if ( ! o1 ) return -1;
        if ( ! o2 ) return  1;
        if ( o1.localeCompare ) return o1.localeCompare(o2);
        if ( o1.compareTo ) return o1.compareTo(o2);
        return o1.$UID.compareTo(o2.$UID);
      },
      swiftDefaultValue: function() {/*
        FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
          let o1 = self.f(args[0])
          let o2 = self.f(args[1])
          if o1 === o2 { return 0 as AnyObject? }
          if o1 == nil && o2 == nil { return 0 as AnyObject? }
          if o1 == nil { return -1 as AnyObject? }
          if o2 == nil { return 1 as AnyObject? }
          if o1!.isEqual(o2) { return 0 as AnyObject? }
          return o1!.hash ?? 0 > o2!.hash ?? 0 ?
              1 as AnyObject? :
              -1 as AnyObject?
        })
      */},
      javaDefaultValue: function() {/*
        new FoamFunction<Integer>() {
          @Override public Integer call(Object... args) {
            Object o1 = f(args[0]);
            Object o2 = f(args[1]);
            if (o1 == o2) return 0;
            if (o1 == null && o2 == null) return 0;
            if (o1 == null) return -1;
            if (o2 == null) return 1;
            if (o1.equals(o2)) return 0;
            if (o1 instanceof Comparable) {
              return ((Comparable) o1).compareTo(o2);
            }
            return o1.hashCode() > o2.hashCode() ? 1 : -1;
          }
        }
      */},
      help: 'Comparator function.',
      documentation: "A comparator function two compare two instances of this $$DOC{ref:'Property'}."
    },
    {
      name: 'fromString',
      labels: ['javascript'],
      defaultValue: function(s) { return s; },
      help: 'Function to extract value from a String.'
    },
    {
      name: 'fromElement',
      labels: ['javascript'],
      defaultValue: function propertyFromElement(e, p) {
        if ( ! p.subType || ! this.X.lookup || p.subType === 'String' ) {
          this[p.name] = p.fromString(e.innerHTML);
          return;
        }
        var model = this.X.lookup(p.subType);
        if ( ! model ) {
          this[p.name] = p.fromString(e.innerHTML);
          return;
        }
        var o = model.create();
        if ( ! o.fromElement ){
          this[p.name] = p.fromString(e.innerHTML);
          return;
        }
        this[p.name] = o.fromElement(e);
      },
      help: 'Function to extract from a DOM Element.',
      documentation: "Function to extract a value from a DOM Element."
    },
    {
      name: 'propertyToJSON',
      labels: ['javascript'],
      defaultValue: function(visitor, output, o) {
        if ( ! this.transient ) output[this.name] = visitor.visit(o[this.name]);
      },
      help: 'Function to extract from a DOM Element.',
      documentation: "Function to extract a value from a DOM Element."
    },
    {
      name: 'autocompleter',
      subType: 'Autocompleter',
      labels: ['javascript'],
      help: 'Name or model for the autocompleter for this property.',
      documentation: function() { /*
        Name or $$DOC{ref:'Model'} for the $$DOC{ref:'Autocompleter'} for this $$DOC{ref:'Property'}.
      */}
    },
    {
      name: 'install',
      type: 'Function',
      labels: ['javascript'],
      required: false,
      displayWidth: 70,
      displayHeight: 3,
      rows:3,
      view: 'foam.ui.FunctionView',
      defaultValue: '',
      help: "A function which installs additional features into the Model's prototype.",
      documentation: function() { /*
        A function which installs additional features into our $$DOC{ref:'Model'} prototype.
        This allows extra language dependent features or accessors to be added to instances
        for use in code.
      */}
    },
    {
      name: 'exclusive',
      type: 'Boolean',
      view: 'foam.ui.BooleanView',
      defaultValue: true,
      help: 'Indicates if the property can only have a single value.',
      documentation: function() { /*
        Indicates if the $$DOC{ref:'Property'} can only have a single value.
      */}
    },
    {
      name: 'memorable',
      type: 'Boolean',
      help: 'True if this value should be included in a memento for this object.',
      defaultValue: false
    },
    {
      name: 'attribute',
      type: 'Boolean',
      help: 'True if this property is settable as an element attribute.',
      defaultValue: false
    },
    {
      name: 'javaJsonParser',
      labels: ['java'],
      javaType: 'foam.lib.parse.Parser',
      javaFactory: function() {/*
        return new foam.lib.json.AnyParser();
      */},
    },
    {
      name: 'javaOutputJson',
      javaType: 'FoamFunction<Void>',
      labels: ['java'],
      javaFactory: function() {/*
        return new FoamFunction<Void>() {
          @Override public Void call(Object... args) {
            foam.lib.json.Outputter outputter =
                (foam.lib.json.Outputter)args[0];
            StringBuilder out = (StringBuilder)args[1];
            Object o = args[2];
            outputter.output(out, o);
            return null;
          }
        };
      */},
    },
  ],

  methods: [
    function partialEval() { return this; },
    {
      name: 'f',
      code: function(obj) { return obj[this.name] },
      args: [
        {
          name: 'obj',
          swiftType: 'AnyObject?',
          javaType: 'Object',
        },
      ],
      swiftReturnType: 'AnyObject?',
      javaReturnType: 'Object',
      swiftCode: function() {/*
        if let fobj = obj as? FObject {
          return fobj.get(self.name)
        }
        return nil
      */},
      javaCode: function() {/*
        if (obj instanceof FObject) {
          return ((FObject) obj).get(getName());
        }
        return null;
      */},
    },
    {
      name: 'compare',
      code: function(o1, o2) {
        return this.compareProperty(this.f(o1), this.f(o2));
      },
      args: [
        {
          name: 'o1',
          swiftType: 'AnyObject?',
          javaType: 'Object',
        },
        {
          name: 'o2',
          swiftType: 'AnyObject?',
          javaType: 'Object',
        },
      ],
      returnType: 'Int',
      swiftCode: function() {/*
        return compareProperty.call(o1, o2) as! Int
      */},
      javaCode: function() {/*
        return getCompareProperty().call(o1, o2);
      */},
    },
    function readResolve() {
      return this.modelId ?
        this.X.lookup(this.modelId)[constantize(this.name)] : this;
    },
    function toSQL() { return this.name; },
    function toMQL() { return this.name; },
    function toBQL() { return this.name; },
    function cloneProperty(value, cloneArgs) {
      cloneArgs[this.name] = ( value && value.clone ) ? value.clone() : value;
    },
    function deepCloneProperty(value, cloneArgs) {
      cloneArgs[this.name] = ( value && value.deepClone ) ? value.deepClone() : value;
    },
    function exprClone() {
      return this;
    },
    function dot(nextProp) {
      var PropertySequence = this.X.lookup('foam.mlang.PropertySequence');
      if ( ! PropertySequence ) {
        console.warn('Missing foam.mlang.PropertySequence for Property.dot()');
        return this;
      }
      if ( PropertySequence.isInstance(this) ) {
        if ( this.next_ ) this.next_ = this.next_.dot(nextProp);
        else              this.next_ = nextProp;
        return this;
      } else {
        return PropertySequence.xbind({ next_: nextProp }).create(this, this.Y);
      }
    },
    function initPropertyAgents(proto, fastInit) {
      var prop   = this;
      var name   = prop.name;
      var name$_ = prop.name$_;

      if ( ! fastInit ) proto.addInitAgent(
        (this.postSet || this.setter) ? 9 : 0,
        name + ': ' + (this.postSet || this.setter ? 'copy arg (postSet)' : 'copy arg'),
        function(o, X, m) {
          if ( ! m ) return;
          if ( m.hasOwnProperty(name)   ) o[name]   = m[name];
          if ( m.hasOwnProperty(name$_) ) o[name$_] = m[name$_];
        }
      );

      if ( this.dynamicValue ) {
        var dynamicValue = prop.dynamicValue;
        if ( Array.isArray(dynamicValue) ) {
          proto.addInitAgent(10, name + ': dynamicValue', function(o, X) {
            Events.dynamicFn(
                dynamicValue[0].bind(o),
                function() { o[name] = dynamicValue[1].call(o); },
                X || this.X);
          });
        } else {
          proto.addInitAgent(10, name + ': dynamicValue', function(o, X) {
            Events.dynamicFn(
                dynamicValue.bind(o),
                function(value) { o[name] = value; },
                X || this.X);
          });
        }
      }

      if ( this.factory ) {
        proto.addInitAgent(11, name + ': factory', function(o, X) {
          if ( ! o.hasOwnProperty(name) ) o[name];
        });
      }
    },
    function toE(opt_X) {
      var X = opt_X || this.X;
      return X.lookup('foam.u2.PropertyView').create({prop: this, view: this.toPropertyE(X)}, X);
    }
  ],

  //templates: [
  //  {
  //    model_: 'Template',
  //    name: 'closureSource',
  //    description: 'Closure Externs JavaScript Source',
  //    template:
  //    '/**\n' +
  //      ' * @type {<%= this.javascriptType %>}\n' +
  //      ' */\n' +
  //      '<%= arguments[1] %>.prototype.<%= this.name %> = undefined;'
  //  }
  //],

  toString: function() { return "Property"; }
};

Model.methods = {};
"createMethod_ getProperty getAction hashCode buildPrototype addTraitToModel_ buildProtoImports_ buildProtoProperties_ buildProtoMethods_ getPrototype isSubModel isInstance getAllRequires arequire getMyFeature getRawFeature getAllMyRawFeatures getFeature getAllRawFeatures atest getRuntimeProperties getRuntimeActions create".split(' ').forEach(function(k) { Model.methods[k] = BootstrapModel[k]; });


// This is the coolest line of code that I've ever written
// or ever will write. Oct. 4, 2011 -- KGR
Model = Model.create(Model);
Model.model_ = Model;
Model.create = BootstrapModel.create;

Property = Model.create(Property);

// Property properties are still Bootstrap Models, so upgrade them.
var ps = Property.getRuntimeProperties();
for ( var i = 0 ; i < ps.length ; i++ ) {
  Property[constantize(ps[i].name)] = ps[i] = Property.create(ps[i]);
}

USED_MODELS.Property = true;
USED_MODELS.Model = true;

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
  name: 'Message',
  plural: 'messages',

  tableProperties: [
    'name',
    'value',
    'translationHint'
  ],

  documentation: function() {/*
  */},

  properties: [
    {
      name:  'name',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The coding identifier for the message.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
        */}
    },
    {
      name: 'value',
      help: 'The message itself.'
    },
    {
      name: 'labels',
      type: 'StringArray',
      labels: ['debug', 'javascript'],
    },
    {
      name: 'meaning',
      help: 'Linguistic clarification to resolve ambiguity.',
      documentation: function() {/* A human readable discussion of the
        $$DOC{ref:'.'} to resolve linguistic ambiguities.
      */}
    },
    {
      name: 'placeholders',
      help: 'Placeholders to inject into the message.',
      documentation: function() {/* Array of plain Javascript objects
        describing in-message placeholders. The data can be expanded into
        $$DOC{ref:'foam.i18n.Placeholder'}, for example.
      */},
      factory: function() { return []; }
    },
    {
      name: 'replaceValues',
      documentation: function() {/* Function that binds values to message
        contents.
      */},
      defaultValue: function(unused_selectors, args) {
        var phs = this.placeholders || [];
        var value = this.value;
        // Bind known placeholders to message string.
        for ( var i = 0; i < phs.length; ++i ) {
          var name = phs[i].name;
          var replacement = args.hasOwnProperty(name) ? args[name] :
              phs[i].example;
          value = value.replace((new RegExp('[$]' + name + '[$]', 'g')),
                                replacement);
        }
        return value;
      }
    },
    {
      name: 'translationHint',
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'A brief description of this message and the context in which it used.',
      documentation: function() {/* A human readable description of the
        $$DOC{ref:'.'} and its context for the purpose of translation.
      */}
    }
  ]
});


CLASS({
  name: 'StringProperty',
  extends: 'Property',

  help: 'Describes a properties of type String.',
  label: 'Text',

  messages: [
    { name: 'errorPatternMismatch', value: 'The text does not match the pattern.' },
    {
      name: 'errorBelowMinLength',
      value: 'The text is too short. Minimum: $MIN$',
      placeholders: [ { name: 'MIN', example: '40' } ]
    },
    {
      name: 'errorAboveMaxLength',
      value: 'The text is too long. Maximum: $MAX$',
      placeholders: [ { name: 'MAX', example: '40' } ]
    }
  ],

  properties: [
    {
      name: 'displayHeight',
      displayWidth: 8,
      defaultValue: 1,
      help: 'The display height of the property.'
    },
    /*
    {
      name: 'type',
      displayWidth: 20,
      defaultValue: 'String',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'adapt',
      labels: ['javascript'],
      defaultValue: function (_, v) {
        return v === undefined || v === null ? '' :
        typeof v === 'function'              ? multiline(v) : v.toString() ;
      }
    },
    {
      name: 'swiftAdapt',
      defaultValue: function() {/*
        if newValue != nil { return String(describing: newValue!) }
        return ""
      */},
    },
    {
      name: 'javaType',
      displayWidth: 70,
      defaultValue: 'String',
      help: 'The Java type of this property.'
    },
    {
      name: 'swiftType',
      defaultValue: 'String',
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue:
          'aCoder.encode(`<%= this.name %>`, forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'swiftDefaultValue',
      defaultValueFn: function() {
        var defaultValue = this.defaultValue || '';
        return '"' + defaultValue + '"';
      },
    },
    {
      name: 'javaDefaultValue',
      defaultValueFn: function() {
        var defaultValue = this.defaultValue || '';
        return '"' + defaultValue + '"';
      },
    },
    {
      name: 'view',
      labels: ['javascript'],
      defaultValue: 'foam.ui.TextFieldView',
    },
    {
      name: 'swiftView',
      defaultValue: 'FoamUITextField',
    },
    {
      name: 'pattern',
      help: 'Regex pattern for property.'
    },
    {
      name: 'minChars',
      label: 'Minimum characters',
      help: 'The minimum number of characters required.',
      adapt: function(old,nu) {
        return nu === "" ? "" : parseInt(nu);
      }
    },
    {
      name: 'maxChars',
      label: 'Maximum characters',
      help: 'The maximum number of characters allowed.',
      adapt: function(old,nu) {
        return nu === "" ? "" : parseInt(nu);
      }
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    },
    {
      name: 'validate',
      lazyFactory: function() {
        var prop = this; // this == the property
        var ret = constantFn('');

        var min = prop.minChars;
        if ( min !== "" ) {
          ret = function(result) {
            return result ||
              ( this[prop.name].length < min ?
                  prop.ERROR_BELOW_MIN_LENGTH.replaceValues(null, { MIN: min }) :
                  ''
              );
          }.o(ret);
          ret.dependencies = [prop.name];
        }
        var max = prop.maxChars;
        if ( max !== "" ) {
          ret = function(result) {
            return result ||
              ( this[prop.name].length > max ?
                  prop.ERROR_ABOVE_MAX_LENGTH.replaceValues(null, { MAX: max }) :
                  ''
              );
          }.o(ret);
          ret.dependencies = [prop.name];
        }
        var pattern = prop.pattern;
        if ( pattern ) {
          var testable = pattern.test ? pattern : new RegExp(pattern.toString(), 'i');
          var errMsg = pattern.errorMessage ?
            pattern.errorMessage() : prop.errorPatternMismatch;
          ret = function(result) {
            return result ||
              ( ! testable.test(this[prop.name]) ? errMsg : '' );
          }.o(ret);
          ret.dependencies = [prop.name];
        }
        return ret;
      }
    }
  ]
});


CLASS({
  name: 'BooleanProperty',
  extends: 'Property',

  help: 'Describes a properties of type Boolean.',
  label: 'True or false',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Boolean',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'swiftType',
      type: 'String',
      displayWidth: 70,
      defaultValue: 'Bool'
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue:
          'aCoder.encode(`<%= this.name %>`, forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeBool(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'swiftDefaultValue',
      defaultValueFn: function() {
        return this.defaultValue + '';
      },
    },
    {
      name: 'javaDefaultValue',
      defaultValueFn: function() {
        return this.defaultValue + '';
      },
    },
    {
      name: 'javaType',
      type: 'String',
      displayWidth: 70,
      defaultValue: 'boolean',
      help: 'The Java type of this property.'
    },
    {
      name: 'view',
      labels: ['javascript'],
      defaultValue: 'foam.ui.BooleanView',
    },
    {
      name: 'swiftView',
      defaultValue: 'FoamUISwitch',
    },
    {
      name: 'toPropertyE',
      labels: ['javascript'],
      defaultValue: function(X) {
        return X.lookup('foam.u2.tag.Checkbox').create(null, X);
      }
    },
    [ 'defaultValue', false ],
    {
      name: 'adapt',
      defaultValue: function (_, v) { return !!v; },
      labels: ['javascript'],
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    },
    {
      name: 'fromString',
      labels: ['javascript'],
      defaultValue: function(s) {
        var txt = s.trim();
        return txt.equalsIC('y')    ||
          txt.equalsIC('yes')  ||
          txt.equalsIC('true') ||
          txt.equalsIC('t');
      },
      help: 'Function to extract value from a String.'
    },
    {
      name: 'fromMemento',
      labels: ['javascript'],
      defaultValue: function(mem) {
        if (mem && (mem.toLowerCase() === 'false' || mem === '0')) return false;
        return !!mem;
      }
    }
  ]
});


CLASS({
  name:  'DateProperty',
  extends: 'Property',

  help:  'Describes a properties of type Date.',
  label: 'Date',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Date',
      help: 'The FOAM type of this property.'
    },
    */
    [ 'displayWidth', 50 ],
    {
      name: 'swiftType',
      defaultValue: 'Date?',
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue: 'aCoder.encode(`<%= this.name %>`, ' +
          'forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'javaType',
      defaultValue: 'java.util.Date',
      help: 'The Java type of this property.'
    },
    {
      name: 'javaAdapt',
      defaultValue: function() {/*
        if (newValue instanceof Number) {
          return new java.util.Date(((Number)newValue).longValue());
        } else if (newValue instanceof String) {
          return new java.util.Date((String)newValue);
        }
        return (java.util.Date)newValue;
      */},
    },
    [ 'view', 'foam.ui.DateFieldView' ],
    {
      name: 'toPropertyE',
      labels: ['javascript'],
      defaultValue: function(X) {
        return X.lookup('foam.u2.DateView').create(null, X);
      }
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    },
    {
      name: 'adapt',
      defaultValue: function (_, d) {
        if (typeof d === 'number') return new Date(d);
        if (typeof d === 'string') {
          var ret = new Date(d);
          return ret.toUTCString() === 'Invalid Date' ? new Date(+d) : ret;
        }
        return d;
      }
    },
    [ 'tableFormatter', function(d) { return d ? d.toRelativeDateString() : ''; } ],
    [ 'compareProperty',
      function(o1, o2) {
        if ( ! o1 ) return ( ! o2 ) ? 0: -1;
        if ( ! o2 ) return 1;

        return o1.compareTo(o2);
      }
    ]
  ],
});


CLASS({
  name: 'DateTimeProperty',
  extends: 'DateProperty',

  help: 'Describes a properties of type DateTime.',
  label: 'Date and time',

  properties: [
    [ 'view', 'foam.ui.DateTimeFieldView' ],
    {
      name: 'toPropertyE',
      labels: ['javascript'],
      defaultValue: function(X) {
        return X.lookup('foam.u2.md.DateTimeField').create(null, X);
      }
    }
  ]
});


CLASS({
  name:  'NumericProperty_',
  extends: 'Property',

  help:  'Base model for a property of any numeric type.',

  messages: [
    {
      name: 'errorBelowMinimum',
      value: 'The value must be at least $MIN$.',
      placeholders: [ { name: 'MIN', example: '40' } ]
    },
    {
      name: 'errorAboveMaximum',
      value: 'The value can be at most $MAX$.',
      placeholders: [ { name: 'MAX', example: '40' } ]
    }
  ],

  properties: [
    {
      name: 'minValue',
      label: 'Minimum Value',
      required: false,
      help: 'The minimum value this property accepts.',
      defaultValue: '',
      adapt: function(old,nu) {
        return nu === "" ? "" : this.adapt(null, nu);
      }
    },
    {
      name: 'maxValue',
      label: 'Maximum Value',
      required: false,
      help: 'The maximum value this property accepts.',
      defaultValue: '',
      adapt: function(old,nu) {
        return nu === "" ? "" : this.adapt(null, nu);
      }
    },
    {
      name: 'compareProperty',
      defaultValue: function(o1, o2) { return o1 === o2 ? 0 : o1 > o2 ? 1 : -1; },
      swiftDefaultValue: function() {/*
        FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
          let o1 = self.f(args[0])
          let o2 = self.f(args[1])
          if o1 === o2 { return 0 as AnyObject? }
          if let o1 = o1 as? NSNumber {
            if let o2 = o2 as? NSNumber { return o1.compare(o2).rawValue as AnyObject? }
            return 1 as AnyObject?
          }
          return -1 as AnyObject?
        })
      */},
    },
    {
      name: 'validate',
      lazyFactory: function() {
        var prop = this; // this == the property
        var ret = constantFn('');

        var min = prop.minValue;
        if ( min !== "" ) {
          ret = function(result) {
            return result ||
              ( this[prop.name] < min ? prop.ERROR_BELOW_MINIMUM.replaceValues(null, { MIN: min }) : '');
          }.o(ret);
          ret.dependencies = [prop.name];
        }

        var max = prop.maxValue;
        if ( max !== "" ) {
          ret = function(result) {
            return result ||
              ( this[prop.name] > max ? prop.ERROR_ABOVE_MAXIMUM.replaceValues(null, { MAX: max }) : '');
          }.o(ret);
          ret.dependencies = [prop.name];
        }
        return ret;
      }
    },
    {
      name: 'swiftDefaultValue',
      defaultValueFn: function() { return '' + this.defaultValue; },
    },
  ]
});


CLASS({
  name:  'IntProperty',
  extends: 'NumericProperty_',

  help:  'Describes a properties of type Int.',
  label: 'Round numbers',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Int',
      help: 'The FOAM type of this property.'
    },
    */
    [ 'displayWidth', 10 ],
    {
      name: 'javaType',
      displayWidth: 10,
      defaultValue: 'int',
      help: 'The Java type of this property.'
    },
    {
      name: 'swiftType',
      defaultValue: 'Int',
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue: 'aCoder.encode(`<%= this.name %>`, ' +
          'forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeInteger(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'swiftAdapt',
      defaultValue: function() {/*
        if let intVal = newValue as? Int { return intVal }
        if let strVal = newValue as? String, let intVal = Int(strVal) {
          return intVal
        }
        return 0
      */},
    },
    {
      name: 'javaAdapt',
      defaultValue: function() {/*
        if (newValue instanceof Number) {
          return ((Number)newValue).intValue();
        }
        try {
          return Integer.parseInt(newValue.toString());
        } catch (Exception e) {
          return 0;
        }
      */},
    },
    {
      name: 'swiftDefaultValue',
      defaultValueFn: function() {
        return this.defaultValue + '';
      },
    },
    {
      name: 'javaDefaultValue',
      defaultValueFn: function() {
        return this.defaultValue + '';
      },
    },
    {
      name: 'view',
      labels: ['javascript'],
      defaultValue: 'foam.ui.IntFieldView',
    },
    {
      name: 'swiftView',
      defaultValue: 'FoamIntUITextField',
    },
    {
      name: 'adapt',
      labels: ['javascript'],
      defaultValue: function (_, v) {
        return typeof v === 'number' ? Math.round(v) : v ? parseInt(v) : 0 ;
      },
    },
    [ 'defaultValue', 0 ],
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    }
  ]
});


CLASS({
  name:  'LongProperty',
  extends: 'IntProperty',

  help:  'Describes a properties of type Long.',
  label: 'Round long numbers',

  properties: [
    /*
    {
      name: 'type',
      defaultValue: 'Long'
    },
    */
    {
      name: 'displayWidth',
      labels: ['javascript'],
      defaultValue: 12
    },
    {
      name: 'javaType',
      labels: ['javascript'],
      defaultValue: 'long',
    },
    {
      name: 'swiftType',
      labels: ['compiletime', 'swift'],
      defaultValue: 'NSNumber',
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue:
          'aCoder.encode(`<%= this.name %>`, forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'swiftAdapt',
      defaultValue: function() {/*
        // If it's already an int, use it.
        if let numVal = newValue as? NSNumber { return numVal }
        if let intVal = newValue as? Int64 { return NSNumber(value: intVal) }
        // If it's a string, convert it.
        if let strVal = newValue as? String, let intVal = Int64(strVal) {
          return NSNumber(value: intVal)
        }
        return 0
      */},
    },
    {
      name: 'javaAdapt',
      defaultValue: function() {/*
        if (newValue instanceof Number) {
          return ((Number)newValue).longValue();
        }
        try {
          return Long.parseLong(newValue.toString());
        } catch (Exception e) {
          return 0;
        }
      */},
    },
  ],
});


CLASS({
  name:  'FloatProperty',
  extends: 'NumericProperty_',

  help:  'Describes a properties of type Float.',
  label: 'Decimal numbers',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Float',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'defaultValue',
      defaultValue: 0.0
    },
    {
      name: 'swiftDefaultValue',
      defaultValueFn: function() { return '' + this.defaultValue; },
    },
    {
      name: 'javaDefaultValue',
      defaultValueFn: function() { return '' + this.defaultValue; },
    },
    {
      name: 'javaType',
      displayWidth: 10,
      defaultValue: 'double',
      help: 'The Java type of this property.'
    },
    {
      name: 'swiftType',
      defaultValue: 'Float',
    },
    {
      name: 'swiftView',
      defaultValue: 'FoamFloatUITextField',
    },
    {
      name: 'displayWidth',
      defaultValue: 15
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.FloatFieldView'
    },
    {
      name: 'adapt',
      defaultValue: function (_, v) {
        return typeof v === 'number' ? v : v ? parseFloat(v) : 0.0 ;
      }
    },
    {
      name: 'swiftAdapt',
      defaultValue: function() {/*
        var n: Float?
        switch newValue {
          case let newValue as String: n = Float(newValue)
          case let newValue as NSNumber: n = Float(truncating: newValue)
          default: break
        }
        if n != nil { return n! }
        return 0
      */},
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    },
  ]
});


CLASS({
  name:  'FunctionProperty',
  extends: 'Property',

  help:  'Describes a properties of type Function.',
  label: 'Code that can be run',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Function',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'javaType',
      displayWidth: 10,
      defaultValue: 'FoamFunction',
      help: 'The Java type of this property.'
    },
    {
      name: 'swiftType',
      defaultValue: 'FoamFunction',
    },
    {
      name: 'swiftDefaultValue',
      defaultValue: 'FoamFunction(fn: { (_: AnyObject?...) -> AnyObject? in return nil })',
    },
    {
      name: 'displayWidth',
      defaultValue: 15
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.FunctionView'
    },
    {
      name: 'toPropertyE',
      defaultValue: function(X) {
        return X.lookup('foam.u2.FunctionView').create(undefined, X);
      }
    },
    {
      name: 'defaultValue',
      defaultValue: function() {}
    },
    {
      name: 'fromElement',
      defaultValue: function(e, p) {
        var txt = e.innerHTML.trim();

        this[p.name] = txt;
      }
    },
    {
      name: 'adapt',
      defaultValue: function(_, value) {
        if ( typeof value === 'string' ) {
          var parse = JSONParser.parseString(value, JSONParser['function prototype']);
          if ( parse ) {
            var body = value.substring(value.indexOf('{') + 1, value.lastIndexOf('}'));
            return new Function(parse[3], body);
          }
          return new Function(value);
        }
        return value;
      }
    }
  ]
});


CLASS({
  name: 'TemplateProperty',
  extends: 'FunctionProperty',

  properties: [
    {
      name: 'adapt',
      defaultValue: function(_, value) {
        return TemplateUtil.expandTemplate(this, value);
      }
    },
    {
      name: 'defaultValue',
      adapt: function(_, value) {
        return TemplateProperty.ADAPT.defaultValue.call(this, _, value);
      }
    },
    {
      name: 'toPropertyE',
      defaultValue: function(X) {
        return X.lookup('foam.u2.MultiLineTextField').create(undefined, X);
      }
    },
    {
      name: 'install',
      defaultValue: function(prop) {
        defineLazyProperty(this, prop.name + '$f', function() {
          var f = TemplateUtil.lazyCompile(this[prop.name])
          return {
            get: function() { return f; },
            configurable: true
          };
        });
      }
    }
  ]
});


CLASS({
  name: 'ArrayProperty',
  extends: 'Property',
  javaClassImports: [
    'java.util.List',
  ],

  help:  'Describes a property of type Array.',
  label: 'List of items',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Array',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'swiftType',
      defaultValueFn: function() {
        return '[' + this.swiftSubType + ']';
      }
    },
    {
      name: 'swiftSubType',
      labels: ['compiletime', 'swift'],
      defaultValueFn: function() {
        var type = this.subType || 'FObject';
        return type.split('.').pop();
      }
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue:
          'aCoder.encode(`<%= this.name %>`, forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'swiftFactory',
      defaultValue: 'return [] as AnyObject?'
    },
    {
      name: 'singular',
      displayWidth: 70,
      defaultValueFn: function() { return this.name.replace(/s$/, ''); },
      help: 'The plural form of this model\'s name.',
      documentation: function() { /* The singular form of $$DOC{ref:'Property.name'}.*/}
    },
    {
      name: 'subType',
      displayWidth: 20,
      defaultValue: '',
      help: 'The FOAM sub-type of this property.'
    },
    {
      name: 'protobufType',
      defaultValueFn: function() { return this.subType; }
    },
    {
      name: 'adapt',
      defaultValue: function(_, a, prop) {
        var m = prop.subType_ || ( prop.subType_ =
          this.X.lookup(prop.subType) || GLOBAL.lookup(prop.subType) );

        if ( m ) {
          for ( var i = 0 ; i < a.length ; i++ ) {
            if ( ! m.isInstance(a[i]) )
              a[i] = a[i].model_ ? FOAM(a[i]) : m.create(a[i]);
          }
        }

        return a;
      }
    },
    {
      name: 'postSet',
      defaultValue: function(oldA, a, prop) {
        var name = prop.nameArrayRelay_ || ( prop.nameArrayRelay_ = prop.name + 'ArrayRelay_' );
        var l = this[name] || ( this[name] = function() {
          this.propertyChange(prop.name, null, this[prop.name]);
        }.bind(this) );
        if ( oldA && oldA.unlisten ) oldA.unlisten(l);
        if ( a && a.listen ) a.listen(l);
      }
    },
    {
      name: 'javaSubType',
      labels: ['compiletime', 'java'],
      defaultValueFn: function() {
        return this.subType || 'FObject';
      }
    },
    {
      name: 'javaType',
      displayWidth: 10,
      defaultValueFn: function(p) {
        return 'java.util.List<' + this.javaSubType + '>';
      },
      help: 'The Java type of this property.'
    },
    {
      name: 'javaLazyFactory',
      defaultValueFn: function(p) {
        return 'return new java.util.ArrayList<' + this.javaSubType + '>();';
      },
    },
    {
      name: 'javaAdapt',
      defaultValue: function() {/*
        if (newValue instanceof Object[]) {
          java.util.List<<%=this.javaSubType%>> l = new java.util.ArrayList<>();
          for (Object s : (Object[])newValue) {
            l.add((<%=this.javaSubType%>)s);
          }
          return l;
        }
        return (java.util.List<<%=this.javaSubType%>>)newValue;
      */},
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.ArrayView'
    },
    {
      name: 'factory',
      defaultValue: function() { return []; }
    },
    {
      name: 'propertyToJSON',
      defaultValue: function(visitor, output, o) {
        if ( ! this.transient && o[this.name].length )
          output[this.name] = visitor.visitArray(o[this.name]);
      }
    },
    {
      name: 'install',
      defaultValue: function(prop) {
        defineLazyProperty(this, prop.name + '$Proxy', function() {
          var proxy = this.X.lookup('foam.dao.ProxyDAO').create({delegate: this[prop.name].dao});

          this.addPropertyListener(prop.name, function(_, __, ___, a) {
            proxy.delegate = a.dao;
          });

          return {
            get: function() { return proxy; },
            configurable: true
          };
        });

        this.addMethod('get' + capitalize(prop.singular), function(id) {
          for ( var i = 0; i < this[prop.name].length; i++ ) {
            if ( this[prop.name][i].id === id ) return this[prop.name][i];
          }
        });
      }
    },
    {
      name: 'fromElement',
      defaultValue: function(e, p) {
        var model = this.X.lookup(e.getAttribute('model') || p.subType);
        var children = e.children;
        var a = [];
        for ( var i = 0 ; i < children.length ; i++ ) {
          var o = model.create(null, this.Y);
          o.fromElement(children[i], p);
          a.push(o);
        }
        this[p.name] = a;
      }
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    },
    {
      name: 'compareProperty',
      swiftDefaultValue: function() {/*
        FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
          let o1 = self.f(args[0]) as? [AnyObject]
          let o2 = self.f(args[1]) as? [AnyObject]
          if (o1 == nil) && (o2 == nil) { return 0 as AnyObject? }
          if o1 == nil { return -1 as AnyObject? }
          if o2 == nil { return 1 as AnyObject? }

          if o1!.count != o2!.count {
            return (o1!.count > o2!.count ? -1 as AnyObject? : 1 as AnyObject?)
          }

          for i in 0 ..< o1!.count {
            let o1Current = o1![i] as! FObject
            let o2Current = o2![i] as! FObject
            let result = o1Current.compareTo(o2Current)
            if result != 0 { return result as AnyObject? }
          }

          return 0 as AnyObject?
        })
      */},
      javaDefaultValue: function() {/*
        new FoamFunction<Integer>() {
          @Override public Integer call(Object... args) {
            Object o1 = f(args[0]);
            Object o2 = f(args[1]);
            if (o1 == o2) return 0;

            boolean o1List = o1 instanceof List;
            boolean o2List = o2 instanceof List;
            if (!o1List && !o2List) return 0;
            if (!o1List) return -1;
            if (!o2List) return 1;

            List lo1 = (List) o1;
            List lo2 = (List) o2;
            if (lo1.size() != lo2.size()) {
              return lo1.size() > lo2.size() ? -1 : 1;
            }

            for (int i = 0; i < lo1.size(); i++) {
              FObject o1Current = (FObject) lo1.get(i);
              FObject o2Current = (FObject) lo2.get(i);
              int result = o1Current.compareTo(o2Current);
              if (result != 0) return result;
            }

            return 0;
          }
        }
      */},
    },
    {
      name: 'javaJsonParser',
      javaFactory: function() {/*
        return new foam.lib.json.FObjectArrayParser();
      */},
    },
  ],
});


CLASS({
  name: 'BlobProperty',
  extends: 'Property',
  help: 'A chunk of binary data.',
  label: 'Binary data',

  properties: [
    {
      name: 'type',
      type: 'String',
      defaultValue: 'Blob',
      help: 'The FOAM type of this property.',
    },
    {
      name: 'javaType',
      type: 'String',
      defaultValue: 'byte[]',
      help: 'The Java type for this property.',
    },
  ]
});


CLASS({
  name:  'ReferenceProperty',
  extends: 'Property',

  help:  'A foreign key reference to another Entity.',
  label: 'Reference to another object',

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      displayWidth: 20,
      defaultValue: 'Reference',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'subType',
      displayWidth: 20,
      defaultValue: '',
      help: 'The FOAM sub-type of this property.'
    },
    {
      name: 'subKey',
      displayWidth: 20,
      defaultValue: 'ID',
      help: 'The foreign key that this property references.'
    },
    {
      name: 'javaType',
      displayWidth: 10,
      defaultValueFn: function() {
        return this.X.lookup(this.subType)[this.subKey].javaType;
      },
      help: 'The Java type of this property.'
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.TextFieldView'
// TODO: Uncomment when all usages of ReferenceProperty/ReferenceArrayProperty fixed.
//      defaultValue: 'KeyView'
    },
    {
      name: 'toPropertyE',
      defaultValue: function(X) { return X.lookup('foam.u2.ReferenceView').create(null, X); }
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    }
  ]
});


CLASS({
  name: 'StringArrayProperty',
  extends: 'Property',
  javaClassImports: [
    'java.util.List',
  ],

  help: 'An array of String values.',
  label: 'List of text strings',

  properties: [
    /*
    {
      name: 'type',
      displayWidth: 20,
      defaultValue: 'Array',
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'swiftType',
      defaultValue: '[String]'
    },
    {
      name: 'swiftFactory',
      defaultValue: 'return [] as AnyObject'
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue: 'aCoder.encode(`<%= this.name %>`, ' +
          'forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'javaLazyFactory',
      defaultValue: 'return new java.util.ArrayList<String>();',
    },
    {
      name: 'javaAdapt',
      defaultValue: function() {/*
        if (newValue instanceof Object[]) {
          java.util.List<String> l = new java.util.ArrayList<>();
          for (Object s : (Object[])newValue) {
            l.add((String)s);
          }
          return l;
        }
        return (java.util.List<String>)newValue;
      */},
    },
    {
      name: 'singular',
      displayWidth: 70,
      defaultValueFn: function() { return this.name.replace(/s$/, ''); },
      help: 'The plural form of this model\'s name.',
      documentation: function() { /* The singular form of $$DOC{ref:'Property.name'}.*/}
    },
    {
      name: 'subType',
      displayWidth: 20,
      defaultValue: 'String',
      help: 'The FOAM sub-type of this property.'
    },
    {
      name: 'displayWidth',
      defaultValue: 50
    },
    {
      name: 'adapt',
      defaultValue: function(_, v) {
        return Array.isArray(v) ? v : ((v || v === 0) ? [v] : []);
      }
    },
    {
      name: 'factory',
      defaultValue: function() { return []; }
    },
    {
      name: 'javaType',
      displayWidth: 10,
      defaultValue: 'java.util.List<String>',
      help: 'The Java type of this property.'
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.StringArrayView'
    },
    {
      name: 'prototag',
      label: 'Protobuf tag',
      required: false,
      help: 'The protobuf tag number for this field.'
    },
    {
      name: 'exclusive',
      defaultValue: false
    },
    {
      name: 'fromString',
      defaultValue: function(s) {
        return s.split(',');
      }
    },
    {
      name: 'fromElement',
      defaultValue: function(e, p) {
        var val = [];
        var name = p.singular || 'item';
        for ( var i = 0 ; i < e.children.length ; i++ )
          if ( e.children[i].nodeName === name ) val.push(e.children[i].innerHTML);
        this[p.name] = val;
      }
    },
    {
      name: 'toMemento',
      defaultValue: function(o, p) {
        return o.map(function(x) { return x.replace(/,/g, '&#44;'); }).join(',');
      }
    },
    {
      name: 'fromMemento',
      defaultValue: function(s, p) {
        return s ? s.split(',').map(function(x) { return x.replace(/&#44;/g, ','); }) : undefined;
      }
    },
    {
      name: 'compareProperty',
      swiftDefaultValue: function() {/*
        FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
          let o1 = self.f(args[0]) as? [AnyObject]
          let o2 = self.f(args[1]) as? [AnyObject]
          if (o1 == nil) && (o2 == nil) { return 0 as AnyObject? }
          if o1 == nil { return -1 as AnyObject? }
          if o2 == nil { return 1 as AnyObject? }

          if o1!.count != o2!.count {
            return o1!.count > o2!.count ? -1 as AnyObject? : 1 as AnyObject?
          }

          for i in 0 ..< o1!.count {
            let o1Current = o1![i] as! String
            let o2Current = o2![i] as! String
            let result = o1Current.compare(o2Current).rawValue
            if result != 0 { return result as AnyObject? }
          }

          return 0 as AnyObject?
        })
      */},
      javaDefaultValue: function() {/*
        new FoamFunction<Integer>() {
          @Override public Integer call(Object... args) {
            Object o1 = f(args[0]);
            Object o2 = f(args[1]);
            if (o1 == o2) return 0;

            boolean o1List = o1 instanceof List;
            boolean o2List = o2 instanceof List;
            if (!o1List && !o2List) return 0;
            if (!o1List) return -1;
            if (!o2List) return 1;

            List lo1 = (List) o1;
            List lo2 = (List) o2;
            if (lo1.size() != lo2.size()) {
              return lo1.size() > lo2.size() ? -1 : 1;
            }

            for (int i = 0; i < lo1.size(); i++) {
              String o1Current = (String) lo1.get(i);
              String o2Current = (String) lo2.get(i);
              int result = o1Current.compareTo(o2Current);
              if (result != 0) return result;
            }

            return 0;
          }
        }
      */},
    },
    {
      name: 'javaJsonParser',
      javaFactory: function() {/*
        return new foam.lib.json.ArrayParser();
      */},
    },
  ],
});


CLASS({
  name: 'ModelProperty',
  extends: 'Property',

  help: 'Describes a Model property.',
  label: 'Data Model definition',

  properties: [
//    [ 'type', 'Model' ],
    {
      name: 'getter',
      labels: ['javascript'],
      defaultValue: function(name) {
        var value = this.instance_[name];
        if ( typeof value === 'undefined' ) {
          var prop = this.model_.getProperty(name);
          if ( prop ) {
            if ( prop.lazyFactory ) {
              value = this.instance_[prop.name] = prop.lazyFactory.call(this, prop);
            } else if ( prop.factory ) {
              value = this.instance_[prop.name] = prop.factory.call(this, prop);
            } else if ( prop.defaultValueFn ) {
              value = prop.defaultValueFn.call(this, prop);
            } else if ( typeof prop.defaultValue !== undefined ) {
              value = prop.defaultValue;
            } else {
              value = '';
            }
          } else {
            value = '';
          }
        }
        if ( typeof value === 'string' ) {
          if ( ! value ) return '';
          var ret = this.X.lookup(value);
          // console.assert(Model.isInstance(ret), 'Invalid model specified for ' + this.name_);
          return ret;
        }
        if ( Model.isInstance(value) ) return value;
        return '';
      }
    },
    {
      name: 'propertyToJSON',
      labels: ['javascript'],
      defaultValue: function(visitor, output, o) {
        if ( ! this.transient ) output[this.name] = o[this.name].id;
      }
    }
  ]
});


CLASS({
  name: 'ViewProperty',
  extends: 'Property',

  help: 'Describes a View-Factory property.',

  properties: [
    {
      name: 'adapt',
      doc: "Can be specified as either a function, a Model, a Model path, or a JSON object.",
      defaultValue: function(_, f) {
        if ( typeof f === 'function' ) return f;

        if ( typeof f === 'string' ) {
          return function(d, opt_X) {
            return (opt_X || this.X).lookup(f).create(d, opt_X || this.Y);
          }.bind(this);
        }

        if ( typeof f.create === 'function' ) return f.create.bind(f);
        if ( typeof f.model_ === 'string' ) return function(d, opt_X) {
          return FOAM(f, opt_X || this.Y).copyFrom(d);
        }

        console.error('******* Unknown view factory: ', f);
        return f;
      }
    },
    {
      name: 'defaultValue',
      adapt: function(_, f) { return ViewProperty.ADAPT.defaultValue.call(this, null, f); }
    }
  ]
});


CLASS({
  name: 'FactoryProperty',
  extends: 'Property',

  help: 'Describes a Factory property.',

  properties: [
    {
      name: 'preSet',
      doc: "Can be specified as either a function, a Model, a Model path, or a JSON object.",
      defaultValue: function(_, f) {
        // Undefined values
        if ( ! f ) return f;

        // A Factory Function
        if ( typeof f === 'function' ) return f;

        // A String Path to a Model
        if ( typeof f === 'string' ) return function(map, opt_X) {
          return (opt_X || this.X).lookup(f).create(map, opt_X || this.Y);
        }.bind(this);

        // An actual Model
        if ( Model.isInstance(f) ) return f.create.bind(f);

        // A JSON Model Factory: { factory_ : 'ModelName', arg1: value1, ... }
        if ( f.factory_ ) return function(map, opt_X) {
          var X = opt_X || this.X;
          var m = X.lookup(f.factory_);
          console.assert(m, 'Unknown Factory Model: ' + f.factory_);
          return m.create(f, opt_X || this.Y);
        }.bind(this);

        console.error('******* Invalid Factory: ', f);
        return f;
      }
    }
  ]
});


CLASS({
  name: 'ViewFactoryProperty',
  extends: 'FactoryProperty',

  help: 'Describes a View Factory property.',

  /* Doesn't work yet!
  constants: {
    VIEW_CACHE: {}
  },
  */

  properties: [
    {
      name: 'defaultValue',
      preSet: function(_, f) { return ViewFactoryProperty.ADAPT.defaultValue.call(this, null, f); }
    },
    {
      name: 'defaultValueFn',
      preSet: function(_, f) {
        // return a function that will adapt the given f's return
        var fp = function(prop) {
          // call the defaultValue function, adapt the result, return it
          return ViewFactoryProperty.ADAPT.defaultValue.call(this, null, f.call(this, prop));
        };
        fp.toString = function() { return f.toString(); };
        return fp;
      }
    },
    {
      name: 'fromElement',
      defaultValue: function(e, p) {
        this[p.name] = e.innerHTML_ || ( e.innerHTML_ = e.innerHTML );
      }
    },
    {
      name: 'adapt',
      doc: "Can be specified as either a function, String markup, a Model, a Model path, or a JSON object.",
      defaultValue: function(_, f) {
        // Undefined values
        if ( ! f ) return f;

        // A Factory Function
        if ( typeof f === 'function' ) return f;

        var ret;

        // A String Path to a Model
        if ( typeof f === 'string' ) {
          // if not a valid model path then treat as a template
          if ( /[^0-9a-zA-Z$_.]/.exec(f) ) {
            // Cache the creation of an DetailView so that we don't
            // keep recompiling the template
            var VIEW_CACHE = ViewFactoryProperty.VIEW_CACHE ||
              ( ViewFactoryProperty.VIEW_CACHE = {} );
            var viewModel = VIEW_CACHE[f];
            if ( ! viewModel ) {
                viewModel = VIEW_CACHE[f] = Model.create({
                  name: 'InnerDetailView' + this.$UID,
                  extends: 'foam.ui.DetailView',
                  templates:[{name: 'toHTML', template: f}]
                });

              // TODO(kgr): this isn't right because compiling the View template
              // is async.  Should add a READY state to View to handle this.
              viewModel.arequire();
            }
            ret = function(args, X) { return viewModel.create(args, X || this.Y); };
          } else {
            ret = function(map, opt_X) {
              var model = (opt_X || this.X).lookup(f);
              console.assert(!!model, 'Unknown model: ' + f + ' in ' + this.name + ' property');
              return model.create(map, opt_X || this.Y);
            }.bind(this);
          }

          ret.toString = function() { return '"' + f + '"'; };
          return ret;
        }

        // An actual Model
        if ( Model.isInstance(f) ) return function(args, opt_X) {
          return f.create(args, opt_X || this.Y)
        }.bind(this);

        // A JSON Model Factory: { factory_ : 'ModelName', arg1: value1, ... }
        if ( f.factory_ ) {
          ret = function(map, opt_X) {
            var m = (opt_X || this.X).lookup(f.factory_);
            console.assert(m, 'Unknown ViewFactory Model: ' + f.factory_);
            return m.create(f, opt_X || this.Y).copyFrom(map);
          };

          ret.toString = function() { return JSONUtil.compact.stringify(f); };
          return ret;
        }

        if ( this.X.lookup('foam.ui.BaseView').isInstance(f) ) return constantFn(f);

        console.error('******* Invalid Factory: ', f);
        return f;
      }
    }
  ]
});


CLASS({
  name: 'ReferenceArrayProperty',
  extends: 'ReferenceProperty',

  properties: [
    /*
    {
      name: 'type',
      defaultValue: 'Array',
      displayWidth: 20,
      help: 'The FOAM type of this property.'
    },
    */
    {
      name: 'factory',
      defaultValue: function() { return []; },
    },
    {
      name: 'javaType',
      defaultValueFn: function() {
        return this.X.lookup(this.subType).ID.javaType + '[]';
      }
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.StringArrayView',
// TODO: Uncomment when all usages of ReferenceProperty/ReferenceArrayProperty fixed.
//      defaultValue: 'DAOKeyView'
    }
  ]
});


CLASS({
  name: 'EMailProperty',
  extends: 'StringProperty',
  label: 'Email address',

  properties: [
    [ 'pattern', '^.+\@.+$' ]
  ]
});


CLASS({
  name: 'ImageProperty',
  extends: 'StringProperty',
  label: 'Image data or link',
  properties: [
    {
      name: 'view',
      labels: ['javascript'],
      defaultValue: 'foam.ui.md.ImagePickerView',
    }
  ]
});


CLASS({
  name: 'URLProperty',
  extends: 'StringProperty',
  label: 'Web link (URL or internet address)',
});


CLASS({
  name: 'ColorProperty',
  extends: 'StringProperty',
  label: 'Color',
  properties: [
    [ 'view', 'foam.ui.md.ColorFieldView' ]
  ]
});


CLASS({
  name: 'PasswordProperty',
  extends: 'StringProperty',
  label: 'Password that displays protected or hidden text',
  properties: [
    {
      name: 'swiftView',
      defaultValue: 'FoamPasswordUITextField',
    },
  ],
});


CLASS({
  name: 'PhoneNumberProperty',
  extends: 'StringProperty',
  label: 'Phone number',

  properties: [
    [ 'pattern', '^[0-9\-\+\(\)\*\ ]*$' ]
  ]

});


if ( DEBUG ) CLASS({
  name: 'DocumentationProperty',
  extends: 'Property',
  help: 'Describes the documentation properties found on Models, Properties, Actions, Methods, etc.',
  documentation: "The developer documentation for this $$DOC{ref:'.'}. Use a $$DOC{ref:'DocModelView'} to view documentation.",

  properties: [
    /*
    {
      name: 'type',
      type: 'String',
      defaultvalue: 'Documentation'
    },
    */
    { // Note: defaultValue: for the getter function didn't work. factory: does.
      name: 'getter',
      labels: ['debug'],
      defaultValue: function(name) {
        var doc = this.instance_[name]
        if (doc && typeof Documentation != 'undefined' && Documentation // a source has to exist (otherwise we'll return undefined below)
            && (  !doc.model_ // but we don't know if the user set model_
                  || !doc.model_.getPrototype // model_ could be a string
                  || !Documentation.isInstance(doc) // check for correct type
               ) ) {
          // So in this case we have something in documentation, but it's not of the
          // "Documentation" model type, so FOAMalize it.
          if (doc.body) {
            this.instance_[name] = Documentation.create( doc );
          } else {
            this.instance_[name] = Documentation.create({ body: doc });
          }
        }
        // otherwise return the previously FOAMalized model or undefined if nothing specified.
        return this.instance_[name];
      }
    },
    {
      name: 'view',
      defaultValue: 'foam.ui.DetailView',
      labels: ['debug']
    },
    {
      name: 'help',
      defaultValue: 'Documentation for this entity.',
      labels: ['debug']
    },
    {
      name: 'documentation',
      factory: function() { return "The developer documentation for this $$DOC{ref:'.'}. Use a $$DOC{ref:'DocModelView'} to view documentation."; },
      labels: ['debug']
   }
  ]
});


CLASS({
  name: 'ImportedProperty',
  extends: 'Property',
  label: 'A pseudo-property that does not clone its value.',

  properties: [
    [ 'transient', true ],
    [ 'hidden',    true ],
  ],

  methods: [
    function deepCloneProperty(value, cloneArgs) {
      this.cloneProperty(value, cloneArgs);
    },
    function cloneProperty(value, cloneArgs) {
      cloneArgs[this.name] = value;
    },
  ]
});


CLASS({
  name: 'EnumProperty',
  extends: 'Property',
  properties: [
    {
      name: 'enum',
      swiftType: 'FoamEnum.Type',
    },
    {
      name: 'view',
      labels: ['javascript'],
      defaultValue: 'foam.ui.EnumFieldView',
    },
    {
      name: 'swiftType',
      defaultValueFn: function() { return this.enum.split('.').pop(); },
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue: 'aCoder.encode(`<%= this.name %>`.value, ' +
          'forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'swiftAdapt',
      defaultValue: function() {/*
        if let newValue = newValue as? <%= this.swiftType %> {
          return newValue
        }
        return <%= this.swiftType %>.enumForValue(newValue!) as! <%= this.swiftType %>
      */},
    },
    {
      name: 'javaAdapt',
      defaultValue: function() {/*
        if (newValue instanceof Number) {
          return <%= this.enum %>.values()[((Number)newValue).intValue()];
        }
        return (<%= this.enum %>)newValue;
      */},
    },
    {
      name: 'defaultValue',
      adapt: function(_, v) {
        if ( typeof v == "string" && X.lookup(this.enum) ) {
          var e = X.lookup(this.enum);
          return e[e[v]];
        }
        return v;
      }
    },
    {
      name: 'swiftDefaultValue',
      defaultValueFn: function() {
        if ( typeof this.defaultValue == 'string' )
          this.defaultValue = this.defaultValue;
        if ( this.defaultValue && this.defaultValue.name )
          return this.enum.split('.').pop() + '.' + this.defaultValue.name;
      },
    },
    {
      name: 'javaDefaultValue',
      defaultValueFn: function() {
        if ( typeof this.defaultValue == 'string' )
          this.defaultValue = this.defaultValue;
        if ( this.defaultValue && this.defaultValue.name )
          return this.enum + '.' + this.defaultValue.name;
      },
    },
    {
      name: 'javaType',
      defaultValueFn: function() { return this.enum; },
    },
    {
      name: 'toPropertyE',
      defaultValue: function(X) { return X.lookup('foam.u2.EnumView').create(null, X); }
    },
    {
      name: 'swiftView',
      defaultValue: 'FoamEnumUILabel',
    },
  ]
});


CLASS({
  name:  'FObjectProperty',
  extends: 'Property',

  help:  'Describes a properties of type FObject.',
  label: 'FObject',

  properties: [
    {
      name: 'javaType',
      defaultValueFn: function() {
        return this.subType || 'FObject';
      },
    },
    {
      name: 'swiftType',
      defaultValueFn: function() {
        if (this.subType) {
          return this.subType.split('.').pop();
        }
        return 'FObject';
      },
    },
    {
      name: 'swiftNSCoderEncode',
      defaultValue:
          'aCoder.encode(`<%= this.name %>`, forKey: "<%= this.name %>")',
    },
    {
      name: 'swiftNSCoderDecode',
      defaultValue: '_ = set("<%= this.name %>", ' +
          'value: aDecoder.decodeObject(forKey: "<%= this.name %>") as AnyObject?)',
    },
    {
      name: 'compareProperty',
      swiftDefaultValue: function() {/*
        FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
          let o1 = self.f(args[0])
          let o2 = self.f(args[1])
          if o1 === o2 { return 0 as AnyObject? }
          if let o1 = o1 as? FObject {
            if let o2 = o2 as? FObject {
              return o1.compareTo(o2) as AnyObject?
            } else {
              return 1 as AnyObject?
            }
          }
          return -1 as AnyObject?
        })
      */},
    },
  ],
});

/**
 * @license
 * Copyright 2012-2014 Google Inc. All Rights Reserved.
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
// Now remove BootstrapModel so nobody tries to use it
// TODO: do this once no views use it directly
// delete BootstrapModel;

CLASS({
  name: 'Template',

  tableProperties: [
    'name', 'description'
  ],

  documentation: function() {/*
    <p>A $$DOC{ref:'.'} is processed to create a method that generates content for a $$DOC{ref:'foam.ui.View'}.
    Sub-views can be created from inside the
    $$DOC{ref:'Template'} using special tags. The content is lazily processed, so the first time you ask for
    a $$DOC{ref:'Template'}
    the content is compiled, tags expanded and sub-views created. Generally a template is included in a
    $$DOC{ref:'foam.ui.View'}, since after compilation a method is created and attached to the $$DOC{ref:'foam.ui.View'}
    containing the template.
    </p>
    <p>For convenience, $$DOC{ref:'Template',usePlural:true} can be specified as a function with a block
    comment inside to avoid line wrapping problems:
    <code>templates: [ myTemplate: function() { \/\* my template content \*\/ }]</code>
    </p>
    <p>HTML $$DOC{ref:'Template',usePlural:true} can include the following JSP-style tags:
    </p>
    <ul>
       <li><code>&lt;% code %&gt;</code>: code inserted into template, but nothing implicitly output</li>
       <li><code>&lt;%= comma-separated-values %&gt;</code>: all values are appended to template output</li>
       <li><code>&lt;%# expression %&gt;</code>: dynamic (auto-updating) expression is output</li>
       <li><code>\\&lt;new-line&gt;</code>: ignored</li>
       <li><code>$$DOC{ref:'Template',text:'%%value'}(&lt;whitespace&gt;|{parameters})</code>: output a single value to the template output</li>
       <li><code>$$DOC{ref:'Template',text:'$$feature'}(&lt;whitespace&gt;|{parameters})</code>: output the View or Action for the current Value</li>
       <li><code>&lt;!-- comment --&gt;</code> comments are stripped from $$DOC{ref:'Template',usePlural:true}.</li>
    </ul>
  */},

  properties: [
    {
      name:  'name',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The template\'s unique name.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
      */}
    },
    {
      name:  'description',
      type:  'String',
      labels: ['javascript'],
      required: true,
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'The template\'s description.',
      documentation: "A human readable description of the $$DOC{ref:'.'}."
    },
    {
      type: 'Array',
      name: 'args',
      type: 'Array[Arg]',
      subType: 'Arg',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      help: 'Method arguments.',
      documentation: function() { /*
          The $$DOC{ref:'Arg',text:'Arguments'} for the $$DOC{ref:'Template'}.
        */}
    },
    {
      name: 'template',
      type: 'String',
      displayWidth: 180,
      displayHeight: 30,
      defaultValue: '',
      view: 'foam.ui.TextAreaView',
      // Doesn't work because of bootstrapping issues.
      // preSet: function(_, t) { return typeof t === 'function' ? multiline(t) : t ; },
      help: 'Template text. <%= expr %> or <% out(...); %>',
      documentation: "The string content of the uncompiled $$DOC{ref:'Template'} body."
    },
    {
      name: 'path'
    },
    {
      name: 'futureTemplate',
      transient: true
    },
    {
      name: 'code',
      transient: true
    },
    /*
       {
       name: 'templates',
       type: 'Array[Template]',
       subType: 'Template',
       view: 'foam.ui.ArrayView',
       // defaultValue: [],
       help: 'Sub-templates of this template.'
       },*/
    {
      type: 'Documentation',
      name: 'documentation',
      labels: ['debug'],
    },
    {
      name: 'language',
      type: 'String',
      lazyFactory: function() {
        return this.name === 'CSS' ? 'css' : 'html';
      }
    },
    {
      name: 'labels'
    }
  ],
  methods: [
    function toE(X) { return X.data[this.name](); }
  ]
});


CLASS({
  name: 'Action',
  plural: 'Actions',

  tableProperties: [
    'name',
    'label'
  ],

  documentation: function() {  /*
    <p>An executable behavior that can be triggered by the user.
      $$DOC{ref:'Action',usePlural:true} are typically represented as buttons
      or menu items. Activating the $$DOC{ref:'Action'} causes the
      $$DOC{ref:'.action'} function $$DOC{ref:'Property'} to run. The user-facing
      control's state is handled by $$DOC{ref:'.isEnabled'} and $$DOC{ref:'.isAvailable'}.
    </p>
  */},

  properties: [
    {
      name:  'name',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The coding identifier for the action.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
         */}
    },
    {
      name: 'label',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return labelize(this.name); },
      help: 'The display label for the action.',
      documentation: function() { /* A human readable label for the $$DOC{ref:'.'}. May
        contain spaces or other odd characters.
         */}
    },
    {
      name: 'speechLabel',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return this.label; },
      help: 'The speech label for the action.',
      documentation: "A speakable label for the $$DOC{ref:'.'}. Used for accessibility."
    },
    {
      name: 'help',
      label: 'Help Text',
      type: 'String',
      displayWidth: 70,
      displayHeight: 6,
      defaultValue: '',
      help: 'Help text associated with the action.',
      documentation: function() { /*
          This $$DOC{ref:'.help'} text informs end users how to use the $$DOC{ref:'.'},
          through field labels or tooltips.
        */}
    },
    {
      type: 'Documentation',
      name: 'documentation',
      documentation: 'The developer documentation.',
      labels: ['documentation']
    },
    {
      name: 'default',
      type: 'Boolean',
      view: 'foam.ui.BooleanView',
      defaultValue: false,
      help: 'Indicates if this is the default action.',
      documentation: function() { /*
          Indicates if this is the default $$DOC{ref:'Action'}.
        */}
    },
    {
      type: 'Function',
      name: 'isAvailable',
      label: 'Available',
      displayWidth: 70,
      displayHeight: 3,
      defaultValue: function() { return true; },
      help: 'Function to determine if action is available.',
      documentation: function() { /*
            A function used to determine if the $$DOC{ref:'Action'} is available.
        */}
    },
    {
      type: 'Function',
      name: 'isEnabled',
      label: 'Enabled',
      displayWidth: 70,
      displayHeight: 3,
      defaultValue: function() { return true; },
      help: 'Function to determine if action is enabled.',
      documentation: function() { /*
            A function used to determine if the $$DOC{ref:'Action'} is enabled.
        */}
    },
    {
      type: 'Function',
      name: 'labelFn',
      label: 'Label Function',
      defaultValue: function(action) { return action.label; },
      help: "Function to determine label. Defaults to 'this.label'.",
      documentation: function() { /*
            A function used to determine the label. Defaults to $$DOC{ref:'.label'}.
        */}
    },
    {
      name: 'iconUrl',
      type: 'String',
      defaultValue: undefined,
      help: 'Provides a url for an icon to render for this action',
      documentation: function() { /*
            A url for the icon to render for this $$DOC{ref:'Action'}.
                */}
    },
    {
      type: 'Function',
      name: 'iconUrlFn',
      label: 'Label Function',
      defaultValue: function(action) { return action.iconUrl; },
      help: "Function to determine iconUrl. Defaults to 'this.iconUrl'.",
      documentation: function() { /*
            A function used to determine the label. Defaults to $$DOC{ref:'.label'}.
        */}
    },
    {
      name: 'ligature',
      type: 'String',
      defaultValue: undefined,
      help: 'Provides a ligature for font-based icons for this action',
      documentation: function() { /*
            A "ligature" (short text string) a font-based icon to render for
            this $$DOC{ref:'Action'}.
        */}
    },
    {
      name: 'showLabel',
      type: 'String',
      defaultValue: true,
      help: 'Property indicating whether the label should be rendered alongside the icon',
      documentation: function() { /*
            Indicates whether the $$DOC{ref:'.label'} should be rendered alongside the icon.
        */}
    },
    {
      name: 'children',
      type: 'Array',
      factory: function() { return []; },
      subType: 'Action',
      view: 'foam.ui.ArrayView',
      help: 'Child actions of this action.',
      documentation: function() { /*
            Child $$DOC{ref:'Action',usePlural:true} of this instance.
        */}
    },
    {
      name: 'parent',
      type: 'String',
      help: 'The parent action of this action',
      documentation: function() { /*
            The parent $$DOC{ref:'Action'} of this instance.
        */}
    },
    {
      type: 'Function',
      name: 'code',
      displayWidth: 80,
      displayHeight: 20,
      defaultValue: '',
      help: 'Function to implement action.',
      documentation: function() { /*
            This function supplies the execution of the $$DOC{ref:'Action'} when triggered.
        */}
    },
    {
      type: 'Function',
      name: 'action',
      displayWidth: 80,
      displayHeight: 20,
      defaultValue: '',
      getter: function() {
        console.log('deprecated use of Action.action');
        return this.code;
      },
      setter: function(code) {
        console.log('deprecated use of Action.action');
        return this.code = code;
      }
    },
    {
      type: 'StringArray',
      name: 'keyboardShortcuts',
      documentation: function() { /*
            Keyboard shortcuts for the $$DOC{ref:'Action'}.
        */}
    },
    {
      name: 'translationHint',
      label: 'Description for Translation',
      type: 'String',
      defaultValue: ''
    },
    {
      name: 'priority',
      type: 'Int',
      defaultValue: 5,
      help: 'Measure of importance of showing this action to the user when it is rendered in a list.',
      documentation: function() { /*
            A measure of importance of showing this $$DOC{ref:'Action'} instance
            in list $$DOC{ref:'foam.ui.View'} of
            $$DOC{ref:'Action',usePlural:true}; a lower number indicates a
            higher priority. Lists should determine which actions to make
            visible by $$DOC{ref:'.priority'}, then sort them by
            $$DOC{ref:'.order'}.
        */}
    },
    {
      name: 'order',
      type: 'Float',
      defaultValue: 5.0,
      help: 'Indication of where this action should appear in an ordered list of actions.',
      documentation: function() { /*
            Indication of where this $$DOC{ref:'Action'} instance should appear
            in an ordered list $$DOC{ref:'foam.ui.View'} of
            $$DOC{ref:'Action',usePlural:true}. Lists should determine which
            actions to make visible by $$DOC{ref:'.priority'}, then sort them by
            $$DOC{ref:'.order'}.
        */}
    },
    {
      type: 'String',
      name: 'swiftCode',
      labels: ['swift'],
    },
    {
      model_: 'TemplateProperty',
      name: 'swiftSource',
      labels: ['swift'],
      defaultValue: function() {/*
<%
var model = arguments[1];
var extendsModel = model && model.extends;
var self = this;
var filter = function(m) {
  if ( m.name === self.name) {
    return true;
  }
};

var override = '';
while (extendsModel) {
  extendsModel = model.X.lookup(extendsModel);
  var method = extendsModel.actions.filter(filter);
  method = method.length > 0 && method[0];
  override = override || method ? 'override' : '';
  extendsModel = extendsModel.extends
}
%>
<%=override%> public func `<%= this.name %>`() {
  <%= this.swiftCode %>
}
      */},
    },
  ],
  methods: [
    function toE(X) {
      console.assert(X, 'X required for Action.toE().');
      return X.lookup('foam.u2.ActionButton').create({data: X.data, action: this}, X);
    },
    function maybeCall(X, that) { /* Executes this action if $$DOC{ref:'.isEnabled'} is allows it. */
      if ( this.isAvailable.call(that, this) && this.isEnabled.call(that, this) ) {
        this.code.call(that, X, this);
        that.publish(['action', this.name], this);
        return true;
      }
      return false;
    }
  ]
});


/* Not used yet
   MODEL({
   name: 'Topic',

   tableProperties: [
   'name',
   'description'
   ],

   properties: [
   {
   name:  'name',
   type:  'String',
   required: true,
   displayWidth: 30,
   displayHeight: 1,
   defaultValue: '',
   // todo: test this
   preSet: function (newValue) {
   return newValue.toUpperCase();
   },
   help: 'The coding identifier for this topic.'
   },
   {
   name: 'description',
   type: 'String',
   displayWidth: 70,
   displayHeight: 1,
   defaultValue: '',
   help: 'A brief description of this topic.'
   }
   ]
   });
*/

CLASS({
  name: 'Arg',

  tableProperties: [
    'type',
    'name',
    'description'
  ],

  documentation: function() { /*
      <p>Represents one $$DOC{ref:'Method'} argument, including the type information.</p>
  */},

  properties: [
    {
      name:  'type',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: 'Object',
      labels: ['debug'],
      help: 'The type of this argument.',
      documentation: function() { /* <p>The type of the $$DOC{ref:'.'}, either a primitive type or a $$DOC{ref:'Model'}.</p>
      */}
    },
    {
      name: 'javaType',
      type: 'String',
      required: false,
      defaultValueFn: function() {
        var type = X.lookup(this.type + 'Property');
        if ( !type ) return;
        return type.create().javaType;
      },
      help: 'The java type that represents the type of this property.',
      labels: ['java', 'compiletime'],
      documentation: function() { /* When running FOAM in a Java environment, specifies the Java type
        or class to use. */}
    },
    {
      name: 'javaDefaultValue',
      type: 'String',
      required: false,
      labels: ['java', 'compiletime'],
    },
    {
      name: 'javascriptType',
      type: 'String',
      required: false,
      defaultValueFn: function() { return this.type; },
      help: 'The javascript type that represents the type of this property.',
      labels: ['debug'],
      documentation: function() { /* When running FOAM in a javascript environment, specifies the javascript
         type to use. */}
    },
    {
      name: 'swiftType',
      type: 'String',
      labels: ['swift', 'compiletime'],
      defaultValueFn: function() {
        var type = X.lookup(this.type + 'Property');
        if ( !type ) return;
        return type.create().swiftType;
      },
    },
    {
      type:  'String',
      name:  'swiftName',
      labels: ['swift', 'compiletime'],
      defaultValueFn: function() { return this.name; },
    },
    {
      name:  'name',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The coding identifier for the entity.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
         */}
    },
    {
      type: 'Boolean',
      name: 'required',
      defaultValue: true,
      labels: ['debug'],
      documentation: function() { /*
        Indicates that this arugment is required for calls to the containing $$DOC{ref:'Method'}.
      */}
    },
    {
      name: 'defaultValue',
      help: 'Default Value if not required and not provided.',
      labels: ['debug'],
      documentation: function() { /*
        The default value to use if this argument is not required and not provided to the $$DOC{ref:'Method'} call.
      */}
    },
    {
      name: 'description',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'A brief description of this argument.',
      labels: ['debug'],
      documentation: function() { /*
        A human-readable description of the argument.
      */}
    },
    {
      name: 'help',
      label: 'Help Text',
      type: 'String',
      displayWidth: 70,
      displayHeight: 6,
      defaultValue: '',
      help: 'Help text associated with the entity.',
      labels: ['debug'],
      documentation: function() { /*
          This $$DOC{ref:'.help'} text informs end users how to use the $$DOC{ref:'.'},
          through field labels or tooltips.
        */}
    },
    {
      type: 'Documentation',
      name: 'documentation',
      documentation: 'The developer documentation.',
      labels: ['debug']
    }
  ],

  methods: {
    decorateFunction: function(f, i) {
      if ( this.type === 'Object' ) return f;
      var type = this.type;

      return this.required ?
        function() {
          console.assert(arguments[i] !== undefined, 'Missing required argument# ' + i);
          console.assert(typeof arguments[i] === type,  'argument# ' + i + ' type expected to be ' + type + ', but was ' + (typeof arguments[i]) + ': ' + arguments[i]);
          return f.apply(this, arguments);
        } :
        function() {
          console.assert(arguments[i] === undefined || typeof arguments[i] === type,
              'argument# ' + i + ' type expected to be ' + type + ', but was ' + (typeof arguments[i]) + ': ' + arguments[i]);
          return f.apply(this, arguments);
        } ;
    }
  },

  templates:[
    {
      model_: 'Template',

      name: 'javaSource',
      description: 'Java Source',
      template: '<%= this.javaType %> <%= this.name %>',
      labels: ['debug'],
    },
    {
      model_: 'Template',

      name: 'closureSource',
      description: 'Closure JavaScript Source',
      template: '@param {<%= this.javascriptType %>} <%= this.name %> .',
      labels: ['debug']
    },
    {
      model_: 'Template',

      name: 'webIdl',
      description: 'Web IDL Source',
      template: '<%= this.type %> <%= this.name %>',
      labels: ['debug']
    }
  ]
});


CLASS({
  name: 'Constant',
  plural: 'constants',

  tableProperties: [
    'name',
    'value',
    'description'
  ],

  documentation: function() {/*
  */},

  properties: [
    {
      name:  'name',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The coding identifier for the entity.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
         */}
    },
    {
      type: 'String',
      name: 'units',
    },
    {
      type: 'String',
      labels: ['swift'],
      name: 'swiftType',
      defaultValueFn: function() {
        var type = X.lookup(this.type + 'Property');
        if ( !type ) return;
        return type.create().swiftType;
      },
    },
    {
      type: 'String',
      labels: ['swift'],
      name: 'swiftValue',
      defaultValueFn: function() {
        if (!this.type) return;
        var type = X.lookup(this.type + 'Property');
        if ( !type ) return;
        type = type.create();
        type.defaultValue = this.value;
        return type.swiftDefaultValue;
      },
    },
    {
      type: 'String',
      labels: ['java'],
      name: 'javaType',
      defaultValueFn: function() {
        var type = X.lookup(this.type + 'Property');
        if ( !type ) return;
        return type.create().javaType;
      },
    },
    {
      type: 'String',
      labels: ['java'],
      name: 'javaValue',
      defaultValueFn: function() {
        if (!this.type) return;
        var type = X.lookup(this.type + 'Property');
        if ( !type ) return;
        type = type.create();
        type.defaultValue = this.value;
        return type.javaDefaultValue;
      },
    },
    {
      name: 'description',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'A brief description of this method.',
      documentation: function() { /* A human readable description of the $$DOC{ref:'.'}.
         */}
    },
    {
      type: 'Documentation',
      name: 'documentation',
      documentation: 'The developer documentation.',
      labels: ['debug']
    },
    {
      name: 'value',
      help: 'The value of the constant.'
    },
    {
      name:  'type',
      defaultValue: '',
      help: 'Type of the constant.'
    },
    {
      name: 'translationHint',
      label: 'Description for Translation',
      type: 'String',
      defaultValue: ''
    }
  ]
});


CLASS({
  name: 'Method',
  plural: 'Methods',

  tableProperties: [
    'name',
    'description'
  ],

  documentation: function() {/*
    <p>A $$DOC{ref:'Method'} represents a callable piece of code with
    $$DOC{ref:'.args',text:'arguments'} and an optional return value.
    </p>
    <p>$$DOC{ref:'Method',usePlural:true} contain code that runs in the instance's scope, so code
    in your $$DOC{ref:'Method'} has access to the other $$DOC{ref:'Property',usePlural:true} and
    features of your $$DOC{ref:'Model'}.</p>
    <ul>
      <li><code>this.propertyName</code> gives the value of a $$DOC{ref:'Property'}</li>
      <li><code>this.propertyName$</code> is the binding point for the $$DOC{ref:'Property'}. Assignment
          will bind bi-directionally, or <code>Events.follow(src, dst)</code> will bind from
          src to dst.</li>
      <li><code>this.methodName</code> calls another $$DOC{ref:'Method'} of this
              $$DOC{ref:'Model'}</li>
      <li><p><code>this.SUPER()</code> calls the $$DOC{ref:'Method'} implementation from the
                base $$DOC{ref:'Model'} (specified in $$DOC{ref:'Model.extends'}).</p>
                <ul>
                  <li>
                      <p>Calling
                      <code>this.SUPER()</code> is extremely important in your <code>init()</code>
                      $$DOC{ref:'Method'}, if you provide one.</p>
                      <p>You can also specify <code>SUPER</code> as the
                      first argument of your Javascript function, and it will be populated with the
                      correct base function automatically:</p>
                      <p><code>function(other_arg) {<br/>
                                  &nbsp;&nbsp; this.SUPER(other_arg); // calls super, argument is optional depending on what your base method takes.<br/>
                                  &nbsp;&nbsp; ...<br/></code>
                      </p>
                    </li>
                  </ul>
                </li>
    </ul>
  */},

  properties: [
    {
      name:  'name',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The coding identifier for the entity.',
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
         */}
    },
    {
      name: 'description',
      type: 'String',
      labels: ['javascript'],
      displayWidth: 70,
      displayHeight: 1,
      defaultValue: '',
      help: 'A brief description of this method.',
      documentation: function() { /* A human readable description of the $$DOC{ref:'.'}.
         */}

    },
    {
      name: 'help',
      label: 'Help Text',
      type: 'String',
      displayWidth: 70,
      displayHeight: 6,
      defaultValue: '',
      labels: ['debug'],
      help: 'Help text associated with the entity.',
      documentation: function() { /*
          This $$DOC{ref:'.help'} text informs end users how to use the $$DOC{ref:'.'},
          through field labels or tooltips.
        */}
    },
    {
      type: 'Documentation',
      name: 'documentation',
      documentation: 'The developer documentation.',
      labels: ['debug']
    },
    {
      name: 'code',
      type: 'Function',
      displayWidth: 80,
      displayHeight: 30,
      view: 'foam.ui.FunctionView',
      help: 'Javascript code to implement this method.',
      postSet: function() {
        if ( ! _DOC_ ) return;
        // check for documentation in a multiline comment at the beginning of the code
        // accepts "/* comment */ function() {...." or "function() { /* comment */ ..."
        // TODO: technically unicode letters are valid in javascript identifiers, which we are not catching here for function arguments.
        var multilineComment = /^\s*function\s*\([\$\s\w\,]*?\)\s*{\s*\/\*([\s\S]*?)\*\/[\s\S]*$|^\s*\/\*([\s\S]*?)\*\/([\s\S]*)/.exec(this.code.toString());
        if ( multilineComment ) {
          var bodyFn = multilineComment[1];
          this.documentation = this.Y.Documentation.create({
            name: this.name,
            body: bodyFn
          })
        }
      },
      documentation: function() { /*
          <p>The code to execute for the $$DOC{ref:'Method'} call.</p>
          <p>In a special case for javascript documentation, an initial multiline comment, if present,
           will be pulled from your code and used as a documentation template:
            <code>function() { \/\* docs here \*\/ code... }</code></p>

        */}
    },
    {
      name:  'returnType',
      defaultValue: '',
      help: 'Return type.',
      documentation: function() { /*
          The return type of the $$DOC{ref:'Method'}.
        */},
      labels: ['debug']
    },
    {
      name:  'javaReturnType',
      labels: ['java'],
      defaultValueFn: function() {
        if (!this.returnType) return 'void';
        var type = X.lookup(this.returnType + 'Property');
        if ( !type ) return;
        return type.create().javaType;
      },
    },
    {
      name: 'swiftReturnType',
      labels: ['swift'],
      defaultValueFn: function() {
        if (!this.returnType) return 'Void';
        var type = X.lookup(this.returnType + 'Property');
        if ( !type ) return;
        return type.create().swiftType;
      },
    },
    {
      type: 'Boolean',
      name: 'returnTypeRequired',
      defaultValue: true,
      documentation: function() { /*
          Indicates whether the return type is checked.
        */},
      labels: ['debug']
    },
    {
      type: 'Array',
      name: 'args',
      type: 'Array[Arg]',
      subType: 'Arg',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      help: 'Method arguments.',
      documentation: function() { /*
          The $$DOC{ref:'Arg',text:'Arguments'} for the method.
        */},
      labels: ['debug'],
      adapt: function(_, n) {
        n.forEach(function(arg, i) {
          n[i] = Arg.create(arg);
        }.bind(this));
        return n;
      },
    },
    {
      name: 'whenIdle',
      help: 'Should this listener be deferred until the system is idle (ie. not running any animations).',
      documentation: function() { /*
          For a listener $$DOC{ref:'Method'}, indicates that the events should be delayed until animations are finished.
        */}
    },
    {
      name: 'isMerged',
      help: 'As a listener, should this be merged?',
      documentation: function() { /*
          For a listener $$DOC{ref:'Method'}, indicates that the events should be merged to avoid
          repeated activations.
        */}
    },
    {
      type: 'Boolean',
      name: 'isFramed',
      help: 'As a listener, should this be animated?',
      defaultValue: false,
      documentation: function() { /*
          For a listener $$DOC{ref:'Method'}, indicates that this listener is animated,
          and events should be merged to trigger only once per frame.
        */}
    },
    {
      type: 'Boolean',
      name: 'isStatic',
      labels: ['java', 'swift']
    },
    {
      name: 'labels'
    },
    {
      name: 'isObjC',
      type: 'Boolean',
      labels: ['swift'],
      defaultValue: false,
      help: 'Is @objc keyword required.',
    },
    {
      type: 'String',
      name: 'swiftCode',
      labels: ['swift'],
    },
    {
      type: 'String',
      name: 'javaCode',
      labels: ['java']
    },
    {
      model_: 'TemplateProperty',
      name: 'swiftSource',
      labels: ['swift'],
      defaultValue: function() {/*<%
var model = arguments[1];
var extendsModel = model && model.extends;
var self = this;
var filter = function(m) {
  if ( m.name === self.name) {
    return true;
  }
};
var name = this.name == 'init' ? '_foamInit_' : this.name;

var override = this.name == 'init' ? 'override' : '';
var args = this.args;
var swiftReturnType = this.swiftReturnType;
while (extendsModel) {
  extendsModel = model.X.lookup(extendsModel);
  var method = extendsModel.methods.filter(filter).concat(
      extendsModel.listeners.filter(filter));
  method = method.length > 0 && method[0];
  override = override || method ? 'override' : '';
  args = method && method.args || args;
  swiftReturnType = method && method.swiftReturnType || swiftReturnType;
  extendsModel = extendsModel.extends
}
var objc = this.isObjC && override === '' ? '@objc ' : '';
var static = this.isStatic ? 'static' : '';

%><% if ( this.isMerged || this.isFramed ) {
%>  var <%= name %>_fired_: Bool = false
  <%=override%> public func <%= name %>() {
    if <%= name %>_fired_ {
      return
    }
    <%= name %>_fired_ = true
    Timer.scheduledTimer(
      timeInterval: <%= ( this.isFramed ) ? 0.016 : ( this.isMerged / 1000 ) %>,
      target: self,
      selector: #selector(<%= model.swiftClassName %>._<%= name %>_wrapper_),
      userInfo: nil,
      repeats: false)
  }
  <%=objc%><%=override%> func _<%= name %>_wrapper_() {
    <%= name %>_fired_ = false
    <%= name %>_code()
  }
  <%=override%> func <%= name %>_code() {
<%= this.swiftCode %>
  }
<% } else if ( this.swiftCode ) { %>
  <%=objc%><%=override%> public <%= static %> func `<%= name %>`(<%
for ( var i = 0 ; i < args.length ; i++ ) {
  if ( !i && !args[i].hasOwnProperty('swiftName') ) { %>_ <% }
%><%= args[i].swiftName %>: <%= args[i].swiftType %><%
if ( i != args.length - 1 ) { %>, <% }
}
%>) -> <%= swiftReturnType %> {
<%= this.swiftCode %>
  }
<% } %>
<% if ( this.swiftCode && !override && args.length == 0 && !static ) { %>
    lazy var <%= name %>Listener_: PropertyChangeListener = {
      return PropertyChangeListener(callback: { [weak self] _, _, _, _ in
        <% if (swiftReturnType != 'Void') { %>_ = <% } %>self?.`<%= name %>`()
      })
    }()
<% } %>*/}
    },
    {
      model_: 'TemplateProperty',
      name: 'javaSource',
      labels: ['java'],
      defaultValue: function() {/*<%
if ( !this.javaCode ) return;

var model = arguments[1];
var extendsModel = model && model.extends;
var self = this;
var filter = function(m) {
  if ( m.name === self.name) {
    return true;
  }
};
var name = this.name;

var override = '';
var args = this.args;
var returnType = this.javaReturnType;
while (extendsModel) {
  extendsModel = model.X.lookup(extendsModel);
  var method = extendsModel.methods.filter(filter).concat(
      extendsModel.listeners.filter(filter));
  method = method.length > 0 && method[0];
  override = override || method ? '@Override' : '';
  args = method && method.args || args;
  returnType = method && method.javaReturnType || returnType;
  extendsModel = extendsModel.extends
}
var static = this.isStatic ? 'static' : '';
%>
  <%= override %>
  public <%= static %> <%= returnType %> <%= this.name %>(<%
 for ( var i = 0 ; args && i < args.length ; i++ ) { var arg = args[i];
%><%= arg.javaSource() %><% if ( i < args.length-1 ) out(", ");
%><% } %>) {
    <%= this.javaCode %>
  }

<%
var allPerms = function(a) {
  if (!a || !a.length) return [];
  var perms = [];
  for (var i = 0; i < Math.pow(2, a.length); i++) {
    var positions = i.toString(2).split('').map(function(n) { return parseInt(n); });
    while (positions.length < a.length) positions.unshift(0);
    var perm = [];
    positions.forEach(function(b, i) {
      if (b) { perm.push(a[i]); }
    });
    perms.push(perm);
  }
  return perms;
}
var argsWithDefault = override ? [] : args.filter(function(arg) {
  return !!arg.javaDefaultValue;
});
var defaultParamPermuations = allPerms(argsWithDefault);
%>
<% for ( var i = 0 ; i < defaultParamPermuations.length ; i++ ) { %>
  <%
    var overloadArgs = args.filter(function(arg) {
      return defaultParamPermuations[i].indexOf(arg) == -1;
    });
    if (overloadArgs.length == args.length) continue;
  %>
  public <%= static %> <%= returnType %> <%= this.name %>(
  <% for ( var j = 0 ; j < overloadArgs.length ; j++ ) { %>
      <%= overloadArgs[j].javaSource() %>
      <%= j < overloadArgs.length - 1 ? ',' : '' %>
  <% } %>) {
    <%= returnType != 'void' ? 'return ' : ''%><%= this.name %>(
  <% for ( var j = 0 ; j < args.length ; j++ ) { %>
      <%= overloadArgs.indexOf(args[j]) == -1 ? args[j].javaDefaultValue : args[j].name %>
      <%= j < args.length - 1 ? ',' : '' %>
  <% } %>);
  }
<% } %>
  \n*/}
    }
  ],

  methods: [
    function toE(X) { return X.data[this.name](); },
  ],

  templates:[
    {
      model_: 'Template',

      name: 'closureSource',
      description: 'Closure JavaScript Source',
      // TODO:  Change returnType to returnType.javascriptType
      template:
      '/**\n' +
        '<% for ( var i = 0; i < this.args.length ; i++ ) { var arg = this.args[i]; %>' +
        ' * <%= arg.closureSource() %>\n' +
        '<% } %>' +
        '<% if (this.returnType) { %>' +
        ' * @return {<%= this.returnType %>} .\n' +
        '<% } %>' +
        ' */\n' +
        '<%= arguments[1] %>.prototype.<%= this.name %> = goog.abstractMethod;'
    },
    {
      model_: 'Template',

      name: 'webIdl',
      description: 'Web IDL Source',
      template:
      '<%= this.returnType || \'void\' %> <%= this.name %>(' +
        '<% for ( var i = 0 ; i < this.args.length ; i++ ) { var arg = this.args[i]; %>' +
        '<%= arg.webIdl() %><% if ( i < this.args.length-1 ) out(", "); %>' +
        '<% } %>' +
        ')'
    }
  ]
});

// initialize to empty object for the two methods added below
Method.getPrototype().decorateFunction = function(f) {
  for ( var i = 0 ; i < this.args.length ; i++ ) {
    var arg = this.args[i];

    f = arg.decorateFunction(f, i);
  }

  var returnType = this.returnType;

  return returnType ?
    function() {
      var ret = f.apply(this, arguments);
      console.assert(typeof ret === returnType, 'return type expected to be ' + returnType + ', but was ' + (typeof ret) + ': ' + ret);
      return ret;
    } : f ;
};

Method.getPrototype().generateFunction = function() {
  var f = this.code;

  return DEBUG ? this.decorateFunction(f) : f;
};

Method.methods = {
  decorateFunction: Method.getPrototype().decorateFunction,
  generateFunction: Method.getPrototype().generateFunction
};


CLASS({
  name: 'Documentation',

  tableProperties: [
    'name'
  ],

  documentation: function() {/*
      <p>The $$DOC{ref:'Documentation'} model is used to store documentation text to
      describe the use of other models. Set the $$DOC{ref:'Model.documentation'} property
      of your model and specify the body text:</p>
      <ul>
        <li><p>Fully define the Documentation model:</p><p>documentation:
        { model_: 'Documentation', body: function() { \/\* your doc text \*\/} }</p>
        </li>
        <li><p>Define as a function:</p><p>documentation:
            function() { \/\* your doc text \*\/} </p>
        </li>
        <li><p>Define as a one-line string:</p><p>documentation:
            "your doc text" </p>
        </li>
      </ul>
    */},

  properties: [
    {
      name: 'name',
      type: 'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: 'documentation',
      help: 'The Document\'s unique name.',
      documentation: "An optional name for the document. Documentation is normally referenced by the name of the containing Model."
    },
    {
      name:  'label',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      help: 'The Document\'s title or descriptive label.',
      documentation: "A human readable title to display. Used for books of documentation and chapters."
    },
    {
      name: 'body',
      type: 'Template',
      defaultValue: '',
      help: 'The main content of the document.',
      documentation: "The main body text of the document. Any valid template can be used, including the $$DOC{ref:'foam.documentation.DocView'} specific $$DOC{ref:'foam.documentation.DocView',text:'$$DOC{\"ref\"}'} tag.",
      preSet: function(_, template) {
        return TemplateUtil.expandTemplate(this, template);
      }
    },
    {
      type: 'Array',
      name: 'chapters',
      type: 'Array[Document]',
      subtype: 'Documentation',
      view: 'foam.ui.ArrayView',
      factory: function() { return []; },
      help: 'Sub-documents comprising the full body of this document.',
      documentation: "Optional sub-documents to be included in this document. A viewer may choose to provide an index or a table of contents.",
      labels: ['debug'],
      preSet: function(old, nu) {
        if ( ! _DOC_ ) return []; // returning undefined causes problems
        var self = this;
        var foamalized = [];
        // create models if necessary
        nu.forEach(function(chapter) {
          if (chapter && typeof self.Y.Documentation != "undefined" && self.Y.Documentation // a source has to exist (otherwise we'll return undefined below)
              && (  !chapter.model_ // but we don't know if the user set model_
                 || !chapter.model_.getPrototype // model_ could be a string
                 || !self.Y.Documentation.isInstance(chapter) // check for correct type
              ) ) {
            // So in this case we have something in documentation, but it's not of the
            // "Documentation" model type, so FOAMalize it.
            if (chapter.body) {
              foamalized.push(self.Y.Documentation.create( chapter ));
            } else {
              foamalized.push(self.Y.Documentation.create({ body: chapter }));
            }
          } else {
            foamalized.push(chapter);
          }
        });
        return foamalized;
      },
      //postSet: function() { console.log("post ",this.chapters); }
    }
  ]
});

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
  name: 'Relationship',
  tableProperties: [
    'name', 'label', 'relatedModel', 'relatedProperty'
  ],

  documentation: function() { /*
      $$DOC{ref:'Relationship',usePlural:true} indicate a parent-child relation
      between instances of
      a $$DOC{ref:'Model'} and some child $$DOC{ref:'Model',usePlural:true},
      through the indicated
      $$DOC{ref:'Property',usePlural:true}. If your $$DOC{ref:'Model',usePlural:true}
      build a tree
      structure of instances, they could likely benefit from a declared
      $$DOC{ref:'Relationship'}.
    */},

  properties: [
    {
      name:  'name',
      type:  'String',
      displayWidth: 30,
      displayHeight: 1,
      defaultValueFn: function() { return GLOBAL[this.relatedModel] ? GLOBAL[this.relatedModel].plural : ''; },
      documentation: function() { /* The identifier used in code to represent this $$DOC{ref:'.'}.
        $$DOC{ref:'.name'} should generally only contain identifier-safe characters.
        $$DOC{ref:'.'} names should use camelCase staring with a lower case letter.
         */},
      help: 'The coding identifier for the relationship.'
    },
    {
      name: 'label',
      type: 'String',
      displayWidth: 70,
      displayHeight: 1,
      defaultValueFn: function() { return this.name.labelize(); },
      documentation: function() { /* A human readable label for the $$DOC{ref:'.'}. May
        contain spaces or other odd characters.
         */},
      help: 'The display label for the relationship.'
    },
    {
      name: 'help',
      label: 'Help Text',
      type: 'String',
      displayWidth: 70,
      displayHeight: 6,
      defaultValue: '',
      documentation: function() { /*
          This $$DOC{ref:'.help'} text informs end users how to use the $$DOC{ref:'.'},
          through field labels or tooltips.
      */},
      help: 'Help text associated with the relationship.'
    },
    {
      type: 'Documentation',
      name: 'documentation',
      documentation: function() { /*
          The developer documentation.
      */}
    },
    {
      name:  'relatedModel',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      documentation: function() { /* The $$DOC{ref:'Model.name'} of the related $$DOC{ref:'Model'}.*/},
      help: 'The name of the related Model.'
    },
    {
      name: 'destinationModel',
      type: 'String',
      required: false,
      displayWidth: 30,
      displayHeight: 1
    },
    {
      name: 'destinationProperty',
      type: 'String',
      required: false,
      displayWidth: 30,
      displayHeight: 1
    },
    {
      name:  'relatedProperty',
      type:  'String',
      required: true,
      displayWidth: 30,
      displayHeight: 1,
      defaultValue: '',
      documentation: function() { /*
        The join $$DOC{ref:'Property'} of the related $$DOC{ref:'Model'}.
        This is the property that links back to this $$DOC{ref:'Model'} from the other
        $$DOC{ref:'Model',usePlural:true}.
      */},
      help: 'The join property of the related Model.'
    },
    {
      name: 'toRelationshipE',
      labels: ['javascript'],
      defaultValue: function toRelationshipE(X) {
        return X.lookup('foam.u2.DAOController').create(null, X);
      },
      adapt: function(_, nu) {
        return typeof nu === 'string' ?
            function(X) { return X.lookup(nu).create(null, X); } : nu;
      }
    }
  ],

  methods: [
    function toE(X) {
      return X.lookup('foam.u2.RelationshipView').create({
        relationship: this,
        view: this.toRelationshipE(X)
      }, X);
    },
  ]
  /*,
  methods: {
    dao: function() {
      var m = this.X[this.relatedModel];
      return this.X[m.name + 'DAO'];
    },
    JOIN: function(sink, opt_where) {
      var m = this.X[this.relatedModel];
      var dao = this.X[m.name + 'DAO'] || this.X[m.plural];
      return MAP(JOIN(
        dao.where(opt_where || TRUE),
        m.getProperty(this.relatedProperty),
        []), sink);
    }
  }*/
});


(function() {
  for ( var i = 0 ; i < Model.templates.length ; i++ )
    Model.templates[i] = JSONUtil.mapToObj(X, Model.templates[i]);

  Model.properties = Model.properties;
  delete Model.instance_.prototype_;
  Model = Model.create(Model);
})();

// Go back over each model so far, assigning the new Model to remove any reference
// to the bootstrap Model, then FOAMalize any features that were missed due to
// the model for that feature type ("Method", "Documentation", etc.) being
// missing previously. This time the preSet for each should be fully operational.
function recopyModelFeatures(m) {
  GLOBAL[m.name] = X[m.name] = m;

  m.model_ = Model;

  // the preSet for each of these does the work
  m.methods       = m.methods;
//  m.templates     = m.templates;
  m.relationships = m.relationships;
  m.properties    = m.properties;
//  m.actions       = m.actions;
//  m.listeners     = m.listeners;
  m.models        = m.models;
  if ( DEBUG ) {
    m.tests       = m.tests;
    m.issues      = m.issues;
  }

  // check for old bootstrap Property instances
  if ( m.properties && m.properties[0] &&
       m.properties[0].__proto__.model_.name_ !== 'Model' ) {
    m.properties.forEach(function(p) {
      if ( p.__proto__.model_.name === 'Property' ) p.__proto__ = Property.getPrototype();
    });
  }

  // keep copies of the updated lists
  if ( DEBUG ) BootstrapModel.saveDefinition(m);
}

/*
// Update Model in everything we've created so far
for ( var id in USED_MODELS ) {
  recopyModelFeatures(GLOBAL.lookup(id));
}
*/
recopyModelFeatures(Property);
recopyModelFeatures(Model);
recopyModelFeatures(Method);
recopyModelFeatures(Action);
recopyModelFeatures(Template);

if ( DEBUG ) {
  for ( var id in UNUSED_MODELS ) {
    if ( USED_MODELS[id] ) recopyModelFeatures(GLOBAL.lookup(id));
  }
}

USED_MODELS['Model'] = true;

/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

// TODO: standardize on either get()/set() or .value
CLASS({
  name: 'SimpleValue',
  properties: [ { name: 'value' } ],

  constants: {
    __isValue__: true
  },

  methods: [
    function init(value) { this.value = value || ''; },
    function get() { return this.value; },
    function set(val) { this.value = val; },
    function toString() { return 'SimpleValue(' + this.value + ')'; },
    function follow(srcValue) { Events.follow(srcValue, this); }
  ]
});


CLASS({
  name: 'FunctionValue',
  extends: 'SimpleValue',

  properties: [
    { name: 'values', factory: function() { return []; } },
    { name: 'valueFactory' }
  ],

  methods: [
    function init() {
      this.SUPER();

      // Call once before capture to pre-latch lazy values
      this.valueFactory();

      var f = this.valueFactory;
      this.startRecordingDependencies();
        this.value = f();
      this.endRecordingDependencies();

      for ( var i = 0 ; i < this.values.length ; i++ )
        this.values[i].addListener(this.onSubValueChange);
    },
    function destroy() {
      for ( var i = 0 ; i < this.values.length ; i++ )
        this.values[i].removeListener(this.onSubValueChange);
    },
    function startRecordingDependencies() {
      var values = this.values;
      var onSubValueChange = this.onSubValueChange;
      Events.onGet.push(function(obj, name, value) {
        var l = obj.propertyValue(name);
        if ( values.indexOf(l) == -1 ) {
          values.push(l);
          l.addListener(onSubValueChange);
        }
      });
    },
    function endRecordingDependencies() {
      Events.onGet.pop();
    },
    function get() { return this.value; },
    function set(val) { },
    function toString() { return 'FunctionValue(' + this.value + ')'; }
  ],

  listeners: [
    function onSubValueChange_() { this.value = this.valueFactory(); },
    {
      name: 'onSubValueChange',
      isFramed: true,
      code: function() { this.onSubValueChange_(); }
    }
  ]
});


CLASS({
  name: 'OrValue',
  extends: 'SimpleValue',

  properties: [
    { name: 'values' },
    { name: 'valueFactory', defaultValue: function() { return arguments; } }
  ],

  methods: [
    function init() {
      this.SUPER();
      for ( var i = 0 ; i < this.values.length ; i++ )
        this.values[i].addListener(this.onSubValueChange);
      this.onSubValueChange_();
    },
    function destroy() {
      for ( var i = 0 ; i < this.values.length ; i++ )
        this.values[i].removeListener(this.onSubValueChange);
    },
    function get() { return this.value; },
    function set(val) { },
    function toString() { return 'OrValue(' + this.value + ')'; }
  ],

  listeners: [
    function onSubValueChange_() {
      var args = new Array(this.values.length);
      for ( var i = 0 ; i < this.values.length ; i++ )
        args[i] = this.values[i].get();
      this.value = this.valueFactory.apply(this, args);
    },
    {
      name: 'onSubValueChange',
      isFramed: true,
      code: function() { this.onSubValueChange_(); }
    }
  ]
});

function or$(values, factory, opt_X) {
  return OrValue.create({
    values: values,
    valueFactory: factory,
  }, opt_X);
}


CLASS({
  name: 'SimpleReadOnlyValue',
  extends: 'SimpleValue',

  documentation: 'A simple value that can only be set during initialization.',

  properties: [
    {
      name: 'value',
      preSet: function(old, nu) {
        return ( typeof this.instance_.value == 'undefined' ) ? nu : old ;
      }
    }
  ],

  methods: {
    set: function(val) {
      /* Only allow set once. The first initialized value is the only one. */
      if ( typeof this.instance_.value == 'undefined' ) {
        this.SUPER(val);
      }
    },
    toString: function() { return 'SimpleReadOnlyValue(' + this.value + ')'; }
  }
});

/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

var DOM = {
  /** Instantiate FOAM Objects in a document. **/
  init: function(X) {
    if ( ! X.document.FOAM_OBJECTS ) X.document.FOAM_OBJECTS = {};

    var fs = X.document.querySelectorAll('foam');
    var models = [];
    for ( var i = 0 ; i < fs.length ; i++ ) {
      var e = fs[i];
      X.lookup(e.getAttribute('view'));
      X.lookup(e.getAttribute('model'));
      if ( e.getAttribute('view') ) models.push(X.arequire(e.getAttribute('view')));
      if ( e.getAttribute('model') ) models.push(X.arequire(e.getAttribute('model')));
    }
    for ( var key in USED_MODELS ) {
      models.push(X.arequire(key));
    }

    atime('DOMInit', aseq(apar.apply(null, models), function(ret) {
      for ( var i = 0 ; i < fs.length ; i++ ) {
        var e = fs[i];
        // Check that the node is still in the DOM
        // (It won't be if it was the child of another FOAM tag.)
        var node = e;
        var body = X.document.body;
        while ( node && node !== body ) node = node.parentNode;
        if ( node ) {
          this.initElement(e, X, X.document);
          e.innerHTML = '';
        }
        ret();
      }
    }.bind(this)))();
  },

  initElementChildren: function(e, X) {
    var a = [];

    for ( var i = 0 ; i < e.children.length ; i++ ) {
      var c = e.children[i];

      if ( c.tagName === 'FOAM' ) {
        a.push(DOM.initElement(c, X));
      }
    }

    return a;
  },

  /**
   * opt_document -- if supplied the object's view will be added to the document.
   **/
  initElement: function(e, X, opt_document) {
    X.arequire('foam.ui.FoamTagView')(function(t) {
      foam.ui.FoamTagView.create({ element: e }, X);
    });
  },

  setClass: function(e, className, opt_enabled) {
    var oldClassName = e.className || '';
    var enabled = opt_enabled === undefined ? true : opt_enabled;
    e.className = oldClassName.replace(' ' + className, '').replace(className, '');
    if ( enabled ) e.className = e.className + ' ' + className;
  }
};


window &&
  window.addEventListener &&
  window.addEventListener('load', function() { DOM.init(X); }, false);


// TODO: document and make non-global
/** Convert a style size to an Int.  Ex. '10px' to 10. **/
function toNum(p) { return p.replace ? parseInt(p.replace('px','')) : p; };


// TODO(kgr): replace all instances of DomValue with new modelled DOMValue.
var DomValue = {
  DEFAULT_EVENT:    'change',
  DEFAULT_PROPERTY: 'value',

  __isValue__: true,

  create: function(element, opt_event, opt_property) {
    if ( ! element ) {
      throw "Missing Element in DomValue";
    }

    return {
      __proto__: this,
      element:   element,
      event:     opt_event    || this.DEFAULT_EVENT,
      property:  opt_property || this.DEFAULT_PROPERTY };
  },

  setElement: function ( element ) { this.element = element; },

  get: function() { return this.element[this.property]; },

  set: function(value) {
    if ( this.element[this.property] !== value )
      this.element[this.property] = value;
  },

  addListener: function(listener) {
    if ( ! this.event ) return;
    try {
      this.element.addEventListener(this.event, listener, false);
    } catch (x) {
    }
  },

  removeListener: function(listener) {
    if ( ! this.event ) return;
    try {
      this.element.removeEventListener(this.event, listener, false);
    } catch (x) {
      // could be that the element has been removed
    }
  },

  toString: function() {
    return "DomValue(" + this.event + ", " + this.property + ")";
  }
};


CLASS({
  name: 'DOMValue',

  constants: {
    __isValue__: true
  },

  properties: [
    {
      name: 'element',
      required: true
    },
    {
      name: 'property',
      defaultValue: 'value'
    },
    {
      name: 'event',
      defaultValue: 'change'
    },
    {
      name: 'value',
      postSet: function(_, value) { this.element[this.property] = value; }
    },
    {
      name: 'firstListener_',
      defaultValue: true
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      this.value = this.element[this.property];
    },

    get: function() { return this.value; },

    set: function(value) { this.value = value; },

    addListener: function(listener) {
      if ( this.firstListener_ ) {
        if ( this.event ) {
          this.element.addEventListener(
            this.event,
            function() { debugger; /* TODO */ },
            false);
        }

        this.firstListener_ = false;
      }
      this.value$.addListener(listener);
    },

    removeListener: function(listener) {
      this.value$.removeListener(listener);
    },

    toString: function() {
      return 'DOMValue(' + this.event + ', ' + this.property + ')';
    }
  }
});


// U2 Support

var __element_map__ = {
  INPUT:    'foam.u2.tag.Input',
  TEXTAREA: 'foam.u2.tag.TextArea',
  SELECT:   'foam.u2.tag.Select'
};

X.__element_map__ = __element_map__;

function elementForName(nodeName) {
  nodeName = nodeName ? nodeName : 'div' ;
  var modelName = this.__element_map__[nodeName.toUpperCase()];
  if ( modelName ) {
    var model = this.lookup(modelName);
    console.assert(model, 'Missing Model, Add "' + modelName + '" to your requires: block.');
    return model.create(null, this);
  }

  var i = nodeName.indexOf(':');
  if ( i != -1 ) {
    return this.elementForFeature(nodeName.substring(0, i), nodeName.substring(i+1));
  }

  return null;
}
X.elementForName = elementForName;

function elementForFeature(objName, featureName) {
  var data = this[objName || 'data'];
  var X    = objName ? this.sub({data: this[objName]}) : this;
  return data.model_.getFeature(featureName).toE(X);
}
X.elementForFeature = elementForFeature;

function registerE(name, model) {
  var m = { __proto__: this.__element_map__ };
  m[name.toUpperCase()] = model;
  this.set('__element_map__', m);
  return this;
}
X.registerE = registerE;

// Utility function for creating U2 elements in a short format. Expects to be
// run on a conteXt object.
function E(opt_nodeName) {
  if (this === X || this === window) {
    console.log('Deprecated global E() call', new Error());
  }
  var e = this.elementForName && this.elementForName(opt_nodeName);

  if ( ! e ) {
    e = this.lookup('foam.u2.Element').create(null, this);
    if ( opt_nodeName ) e.nodeName = opt_nodeName;
  }

  return e;
}
X.E = E;

function start(opt_nodeName) {
  return this.E(opt_nodeName);
}
X.start = start;

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
  package: 'foam.ui',
  name: 'AbstractDAOView',
  extends: 'foam.ui.SimpleView',

  documentation: function() { /*
     <p>For $$DOC{ref:'foam.ui.View',usePlural:true} that take data items from a $$DOC{ref:'DAO'}
     and display them all, $$DOC{ref:'.'} provides the basic interface. Set or bind
     either $$DOC{ref:'.data'} or $$DOC{ref:'.dao'} to your source $$DOC{ref:'DAO'}.</p>
     <p>Call $$DOC{ref:'.onDAOUpdate'} to indicate a data change that should be
      re-rendered.</p>
  */},

  exports: [ 'dao as daoViewCurrentDAO' ],

  properties: [
    {
      name: 'data',
      postSet: function(oldDAO, dao) {
        if ( this.dao !== dao ) {
          this.dao = dao;
        }
      },
      documentation: function() { /*
          Sets the $$DOC{ref:'DAO'} to render items from. Use $$DOC{ref:'.data'}
          or $$DOC{ref:'.dao'} interchangeably.
      */}
    },
    {
      model_: 'foam.core.types.DAOProperty',
      name: 'dao',
      label: 'DAO',
      help: 'An alias for the data property.',
      onDAOUpdate: 'onDAOUpdate',
      postSet: function(oldDAO, dao) {
        if (!dao) {
          this.data = '';
        } else if ( this.data !== dao ) {
          this.data = dao;
        }
      },
      documentation: function() { /*
          Sets the $$DOC{ref:'DAO'} to render items from. Use $$DOC{ref:'.data'}
          or $$DOC{ref:'.dao'} interchangeably.
      */}
    }
  ],

  methods: {
    onDAOUpdate: function() { /* Implement this $$DOC{ref:'Method'} in
          sub-models to respond to changes in $$DOC{ref:'.dao'}. */ }
  }
});

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

// TODO(kgr): remove use of SimpleValue, just use data$ binding instead.
CLASS({
  package: 'foam.ui',
  name: 'DAOListView',
  extends: 'foam.ui.SimpleView',

  requires: ['SimpleValue'],

  traits: ['foam.ui.DAODataViewTrait'],

  constants: {
    ROW_CLICK: ['row-click']
  },

  properties: [
    {
      type: 'Boolean',
      name: 'isHidden',
      defaultValue: false,
      postSet: function(_, isHidden) {
        if ( this.dao && ! isHidden ) this.onDAOUpdate();
      }
    },
    {
      type: 'ViewFactory',
      name: 'rowView',
      defaultValue: 'foam.ui.DetailView'
    },
    {
      name: 'mode',
      defaultValue: 'read-write',
      view: { factory_: 'foam.ui.ChoiceView', choices: ['read-only', 'read-write', 'final'] }
    },
    {
      name: 'useSelection',
      help: 'Backward compatibility for selection mode. Create a X.selection$ value in your context instead.',
      postSet: function(old, nu) {
        if ( this.useSelection && !this.X.selection$ ) this.X.selection$ = this.SimpleValue.create();
        this.selection$ = this.X.selection$;
      }
    },
    {
      name: 'selection',
      help: 'Backward compatibility for selection mode. Create a X.selection$ value in your context instead.',
      factory: function() {
        return this.SimpleValue.create();
      }
    },
    {
      name: 'scrollContainer',
      help: 'Containing element that is responsible for scrolling.'
    },
    {
      name: 'chunkSize',
      defaultValue: 0,
      help: 'Number of entries to load in each infinite scroll chunk.'
    },
    {
      name: 'chunksLoaded',
      isHidden: true,
      defaultValue: 1,
      help: 'The number of chunks currently loaded.'
    },
    {
      type: 'Boolean',
      name: 'painting',
      defaultValue: false,
      transient: true
    },
    {
      type: 'Boolean',
      name: 'repaintRequired',
      defaultValue: false,
      transient: true
    },
    {
      type: 'Array',
      name: 'propertyListeners_',
      lazyFactory: function() { return []; }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      var self = this;
      this.subscribe(this.ON_HIDE, function() {
        self.isHidden = true;
      });

      this.subscribe(this.ON_SHOW, function() {
        self.isHidden = false;
      });

      // bind to selection, if present
      if (this.X.selection$) {
        this.selection$ = this.X.selection$;
      }
    },

    initHTML: function() {
      this.SUPER();

      // If we're doing infinite scrolling, we need to find the container.
      // Either an overflow: scroll element or the window.
      // We keep following the parentElement chain until we get null.
      if ( this.chunkSize > 0 ) {
        var e = this.$;
        while ( e ) {
          if ( window.getComputedStyle(e).overflow === 'scroll' ) break;
          e = e.parentElement;
        }
        this.scrollContainer = e || window;
        this.scrollContainer.addEventListener('scroll', this.onScroll, false);
      }

      if ( ! this.isHidden ) this.updateHTML();
    },

    construct: function() {
      if ( ! this.dao || ! this.$ ) return;
      if ( this.painting ) {
        this.repaintRequired = true;
        return;
      }
      this.painting = true;
      var out = [];
      this.children = [];
      this.initializers_ = [];

      var doneFirstItem = false;
      var d = this.dao;
      if ( this.chunkSize ) {
        d = d.limit(this.chunkSize * this.chunksLoaded);
      }
      d.select({put: function(o) {
        if ( this.mode === 'read-write' ) o = o.model_.create(o, this.Y); //.clone();
        var view = this.rowView({data: o, model: o.model_}, this.Y);
        // TODO: Something isn't working with the Context, fix
        view.DAO = this.dao;
        if ( this.mode === 'read-write' ) {
          this.addRowPropertyListener(o, view);
        }
        this.addChild(view);

        if ( ! doneFirstItem ) {
          doneFirstItem = true;
        } else {
          this.separatorToHTML(out); // optional separator
        }

        if ( this.X.selection$ ) {
          var itemId = this.on('click', (function() {
            this.selection = o;
            this.publish(this.ROW_CLICK);
          }).bind(this))
          this.setClass('dao-selected', function() { return equals(this.selection, o); }.bind(this), itemId);
          this.setClass(this.className + '-row', function() { return true; }, itemId);
          out.push('<div id="' + itemId + '">');
        }
        out.push(view.toHTML());
        if ( this.X.selection$ ) {
          out.push('</div>');
        }
      }.bind(this)})(function() {
        if (this.repaintRequired) {
          this.repaintRequired = false;
          this.painting = false;
          this.realDAOUpdate();
          return;
        }

        var e = this.$;

        if ( ! e ) return;

        e.innerHTML = out.join('');
        this.initInnerHTML();
        this.painting = false;
      }.bind(this));
    },

    destroy: function(isParentDestroyed) {
      var listeners = this.propertyListeners_;
      for ( var i = 0; i < listeners.length; ++i ) {
        listeners[i].data.removePropertyListener(null, listeners[i].listener);
      }
      this.propertyListeners_ = [];
      return this.SUPER(isParentDestroyed);
    },

    /** Allow rowView to be optional when defined using HTML. **/
    fromElement: function(e) {
      var children = e.children;
      if ( children.length == 1 && children[0].nodeName === 'rowView' ) {
        this.SUPER(e);
      } else {
        this.rowView = e.innerHTML;
      }
    },

    // Template method
    separatorToHTML: function(out) {
      /* Template method. Override to provide a separator if required. This
      method is called <em>before</em> each list item, except the first. Use
      out.push("<myhtml>...") for efficiency. */
    },

    addRowPropertyListener: function(data, view) {
      var listener = function(o, topic) {
        var prop = o.model_.getProperty(topic[1]);
        // TODO(kgr): remove the deepClone when the DAO does this itself.
        if ( ! prop.transient ) {
          // TODO: if o.id changed, remove the old one?
          view.DAO.put(o.deepClone());
        }
      };
      data.addPropertyListener(null, listener);
      this.propertyListeners_.push({ data: data, listener: listener });
    }
  },

  listeners: [
    {
      name: 'onDAOUpdate',
      code: function() {
        this.realDAOUpdate();
      }
    },
    {
      name: 'realDAOUpdate',
      isFramed: true,
      code: function() {
        if ( ! this.isHidden ) this.updateHTML();
      }
    },
    {
      name: 'onScroll',
      code: function() {
        var e = this.scrollContainer;
        if ( this.chunkSize > 0 && e.scrollTop + e.offsetHeight >= e.scrollHeight ) {
          this.chunksLoaded++;
          this.updateHTML();
        }
      }
    }
  ]
});

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
  package: 'foam.ui',
  name: 'DetailView',

  extends: 'foam.ui.View',

  requires: [
    'Property',
    'foam.ui.TextFieldView',
    'foam.ui.IntFieldView',
    'foam.ui.FloatFieldView',
    'foam.ui.DAOController'
  ],
  exports: [ 'propertyViewProperty' ],

  documentation: function() {/*
    When a default view based on $$DOC{ref:'Property'} values is desired, $$DOC{ref:'foam.ui.DetailView'}
    is the place to start. Either using $$DOC{ref:'foam.ui.DetailView'} directly, implementing
    a .toDetailHTML() $$DOC{ref:'Method'} in your model, or extending
    $$DOC{ref:'foam.ui.DetailView'} to add custom formatting.
    </p>
    <p>Set the $$DOC{ref:'.data'} $$DOC{ref:'Property'} to the $$DOC{ref:'Model'} instance
    you want to display. $$DOC{ref:'foam.ui.DetailView'} will extract the $$DOC{ref:'Model'}
    definition, create editors for the $$DOC{ref:'Property',usePlural:true}, and
    display the current values of your instance. Set $$DOC{ref:'.mode',usePlural:true}
    to indicate read-only if desired.
    </p>
    <p>$$DOC{ref:'Model',usePlural:true} may specify a .toDetailHTML() $$DOC{ref:'Method'} or
    $$DOC{ref:'Template'} to render their contents instead of
    $$DOC{ref:'foam.ui.DetailView.defaultToHTML'}.
    </p>
    <p>For each $$DOC{ref:'Property'} in the $$DOC{ref:'.data'} instance specified,
    a $$DOC{ref:'PropertyView'} is created that selects the appropriate $$DOC{ref:'foam.ui.View'}
    to construct.
  */},

  properties: [
    {
      name: 'className',
      defaultValue: 'detailView',
      documentation: function() {/*
          The CSS class names to use for HTML $$DOC{ref:'foam.ui.View',usePlural:true}.
          Separate class names with spaces. Each instance of a $$DOC{ref:'foam.ui.DetailView'}
          may have different classes specified.
      */}
    },
    {
      name: 'data',
      preSet: function(old,nu) {
        if ( nu.model_ ) {
          this.model = nu.model_;
        }
        return nu;
      }
    },
    {
      name: 'model',
      // TODO: Add declarative runtime type checking
      postSet: function(_, model) {
        console.assert(Model.isInstance(model), 'Invalid model specified for ' + this.name_);
      }
    },
    {
      name: 'title',
      defaultValueFn: function() {
        return /*(this.data && this.data.id ? 'Edit ' : 'New ') +*/ this.model.label;
      },
      documentation: function() {/*
        <p>The display title for the $$DOC{ref:'foam.ui.View'}.
        </p>
      */}
    },
    {
      type: 'String',
      name: 'mode',
      defaultValue: 'read-write',
      documentation: function() {/*
        The editing mode. To disable editing set to 'read-only'.
      */}
    },
    {
      type: 'Boolean',
      name: 'showRelationships',
      defaultValue: false,
      documentation: function() {/*
        Set true to create sub-views to display $$DOC{ref:'Relationship',usePlural:true}
        for the $$DOC{ref:'.model'}.
      */}
    },
    {
      name: 'propertyViewProperty',
      type: 'Property',
      defaultValueFn: function() { return this.Property.DETAIL_VIEW; }
    }
  ],

  methods: {
    // Template Method

    shouldDestroy: function(old,nu) {
      if ( ! old || ! old.model_ || ! nu || ! nu.model_ ) return true;
      return old.model_ !== nu.model_;
    },

    generateContent: function() { /* rebuilds the children of the view */
      if ( ! this.$ ) return;
      this.$.outerHTML = this.toHTML();
      this.initHTML();
    },

    titleHTML: function() {
      /* Title text HTML formatter */
      var title = this.title;

      return title ?
        '<tr><td colspan="2" class="heading">' + title + '</td></tr>' :
        '';
    },

    startForm: function() { /* HTML formatter */ return '<table>'; },
    endForm: function() { /* HTML formatter */ return '</table>'; },

    startColumns: function() { /* HTML formatter */ return '<tr><td colspan=2><table valign=top><tr><td valign=top><table>'; },
    nextColumn:   function() { /* HTML formatter */ return '</table></td><td valign=top><table valign=top>'; },
    endColumns:   function() { /* HTML formatter */ return '</table></td></tr></table></td></tr>'; },

    rowToHTML: function(prop, view) {
      /* HTML formatter for each $$DOC{ref:'Property'} row. */
      var str = '';

      if ( prop.detailViewPreRow ) str += prop.detailViewPreRow(this);

      str += '<tr class="detail-' + prop.name + '">';
      if ( this.DAOController.isInstance(view) ) {
        str += "<td colspan=2><div class=detailArrayLabel>" + prop.label + "</div>";
        str += view.toHTML();
        str += '</td>';
      } else {
        str += "<td class='label'>" + prop.label + "</td>";
        str += '<td>';
        str += view.toHTML();
        str += '</td>';
      }
      str += '</tr>';

      if ( prop.detailViewPostRow ) str += prop.detailViewPostRow(this);

      return str;
    },

    // If the Model supplies a toDetailHTML method, then use it instead.
    toHTML: function() {
      /* Overridden to create the complete HTML content for the $$DOC{ref:'foam.ui.View'}.</p>
         <p>$$DOC{ref:'Model',usePlural:true} may specify a .toDetailHTML() $$DOC{ref:'Method'} or
         $$DOC{ref:'Template'} to render their contents instead of the
          $$DOC{ref:'foam.ui.DetailView.defaultToHTML'} we supply here.
      */

      if ( ! this.data ) return '<span id="' + this.id + '"></span>';

      if ( ! this.model ) throw "DetailView: either 'data' or 'model' must be specified.";

      return (this.model.getPrototype().toDetailHTML || this.defaultToHTML).call(this);
    },

    getDefaultProperties: function() {
      return this.model.getRuntimeProperties();
    },

    defaultToHTML: function() {
      /* For $$DOC{ref:'Model',usePlural:true} that don't supply a .toDetailHTML()
        $$DOC{ref:'Method'} or $$DOC{ref:'Template'}, a default listing of
        $$DOC{ref:'Property'} editors is implemented here.
        */
      this.children = [];
      var model = this.model;
      var str  = "";

      str += '<div id="' + this.id + '" ' + this.cssClassAttr() + '" name="form">';
      str += this.startForm();
      str += this.titleHTML();

      var properties = this.getDefaultProperties();
      for ( var i = 0 ; i < properties.length ; i++ ) {
        var prop = properties[i];

        if ( prop.hidden ) continue;

        var view = this.createView(prop);
        //view.data$ = this.data$;
        this.addDataChild(view);
        str += this.rowToHTML(prop, view);
      }

      str += this.endForm();

      if ( this.showRelationships ) {
        var view = this.X.lookup('foam.ui.RelationshipsView').create({
          data: this.data
        });
        //view.data$ = this.data$;
        this.addDataChild(view);
        str += view.toHTML();
      }

      str += '</div>';

      return str;
    }
  },

  templates: [
    {
      name: 'CSS',
      template: function CSS() {/*
          .detailView {
            border: solid 2px #dddddd;
            background: #fafafa;
            display: table;
          }

          .detailView .heading {
            color: black;
            float: left;
            font-size: 16px;
            margin-bottom: 8px;
            padding: 2px;
          }

          .detailView .propertyLabel {
            font-size: 14px;
            display: block;
            font-weight: bold;
            text-align: right;
            float: left;
          }

          .detailView input {
            font-size: 12px;
            padding: 4px 2px;
            border: solid 1px #aacfe4;
            margin: 2px 0 0px 10px;
          }

          .detailView textarea {
            float: left;
            font-size: 12px;
            padding: 4px 2px;
            border: solid 1px #aacfe4;
            margin: 2px 0 0px 10px;
            width: 98%;
            overflow: auto;
          }

          .detailView select {
            font-size: 12px;
            padding: 4px 2px;
            border: solid 1px #aacfe4;
            margin: 2px 0 0px 10px;
          }

          .detailView .label {
            color: #444;
            font-size: smaller;
            padding-left: 6px;
            padding-top: 8px;
            vertical-align: top;
          }

          .detailArrayLabel {
            font-size: medium;
          }

          .detailArrayLabel .foamTable {
            margin: 1px;
          }
      */}
    }
  ]
});

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

CLASS({
  package: 'foam.grammars',
  name: 'CSSDecl',

  imports: [ 'assert' ],

  documentation: function() {/* A <b>very permissive</b> ASCII CSS parser that
    rewrites a handful of declarations (decls) to add browser compatability
    prefixed versions. Non-whitespace characters are assumed to be plain-old
    ASCII characters.
  */},

  constants: {
    PREFIXES: [
      '-webkit-'
    ],
    PREFIXED_KEYS: {
      'align-content': true,
      'align-items': true,
      'align-self': true,
      'animation': true,
      'box-shadow': true,
      'column-count': true,
      'column-gap': true,
      'column-rule': true,
      'display': 'flex',
      'filter': true,
      'flex': true,
      'flex-basis': true,
      'flex-direction': true,
      'flex-flow': true,
      'flex-grow': true,
      'flex-shrink': true,
      'flex-wrap': true,
      'font-feature-settings': true,
      'hyphens': true,
      'justify-content': true,
      'keyframes': true,
      'order': true,
      'transform': true,
      'transform-origin': true,
      'user-select': true
    },
  },

  properties: [
    {
      name: 'parser',
      lazyFactory: function() {
        return SkipGrammar.create(this.parser_, seq('/*', repeat(not('*/', anyChar)), '*/'));
      },
    },
    {
      name: 'parser_',
      lazyFactory: function() {
        var css = this;
        return {
          __proto__: grammar,

          START: sym('stylesheet'),

          ws: alt(' ', '\t', '\n', '\r', '\f'),
          wsc: alt(sym('ws'), ','),
          ws_: repeat0(sym('ws')),
          wsp_: plus0(sym('ws')),

          alphaNum: alt(
              '-',
              range('a', 'z'),
              range('A', 'Z'),
              range('0', '9')),
          // Excludes: ":", ";", "{", "}", "(", ")", ",".
          punct: alt(
              range('!', "'"),
              range('*', '+'),
              range('-', '/'),
              range('<', '@'),
              range('[', '`'),
              '|',
              '~'),
          // Alpha-num-punct (excludes: ":", ";", "{", "}", "(", ")", ",").
          anp: alt(sym('alphaNum'), sym('punct')),

          stylesheet: str(seq(
              sym('ws_'),
              str(repeat(alt(
                  sym('stmtRule'),
                  sym('blockRule')),
                sym('ws_'))))),

          rulePrefix: plus(
              // Alpha-num-punct, but not ";" "{", or "}".
              str(plus(alt(sym('anp'), ',', '(', ')', ':'))),
              sym('wsp_')),
          stmtRule: str(seq(sym('rulePrefix'), ';')),
          blockRule: str(seq(sym('rulePrefix'), sym('block'))),
          blockList: str(plus(sym('blockRule'), sym('ws_'))),

          fnArgs: seq('(',
                      sym('ws_'),
                      str(repeat(sym('fnArg'))),
                      ')'),
          // Cannot use repeat(content, separator) because we need to retain
          // separator value.
          fnArg: seq(str(plus(alt(sym('fnArgs'),
                                  sym('fnArgIdent')))),
                     repeat(sym('wsc'))),
          fnArgIdent: str(plus(alt(sym('anp'), '{', '}', ';', ':'))),

          // Alpha-num-punct, but not "{", "}" or ":".
          declLHS: str(plus(alt(sym('anp'), ',', '(', ')', ';'))),
          declRHS: plus(str(plus(alt(sym('fnArgs'),
                                     sym('declRHSIdent')))),
                        sym('wsp_')),
          // Alpha-num-punct, but not "{", "}", "(", ")", or ";".
          declRHSIdent: str(plus(alt(sym('anp'), ',', ':'))),
          decl: seq(
              sym('declLHS'),
              sym('ws_'),
              ':',
              sym('ws_'),
              sym('declRHS')),
          declList: plus(sym('decl'), seq(';', sym('ws_'))),

          block: seq(
              '{',
              sym('ws_'),
              optional(alt(
                  sym('blockList'),
                  sym('declList'))),
              '}'),
        }.addActions({
          rulePrefix: function(parts) {
            // Look for ^ signs, and turn them into the model name.
            parts = parts.map(function(p) {
              return p.indexOf('^') >= 0 ? p.replace(/\^/g, css.modelName_ + '-') : p;
            });
            return parts.join(' ');
          },
          block: function(parts) {
            return '{' + (parts[2] ? parts[2] : '') + '}';
          },
          declList: function(parts) {
            return parts.join(';');
          },
          declRHS: function(parts) {
            return parts.join(' ');
          },
          decl: function(parts) {
            var key = parts[0];
            var value = parts[4];
            var data = css.PREFIXED_KEYS[key];
            if ( ! data || css.PREFIXES.length === 0 ) return key + ':' + value;

            var rtn = '';
            if ( data === true || data === value ) {
              for ( var i = 0; i < css.PREFIXES.length; ++i ) {
                var prefix = css.PREFIXES[i];
                if ( data === true ) rtn += prefix + key + ':' + value + ';';
                else                 rtn += key + ':' + prefix + value + ';';
              }
            }
            rtn += key + ':' + value;
            return rtn;
          },
          fnArg: function(parts) {
            return parts[0] + (parts[1].indexOf(',') >= 0 ? ', ' : ' ');
          },
          fnArgs: function(parts) {
            return '(' + parts[2].trim() + ')';
          },
        });
      },
    },
    {
      name: 'model',
      documentation: 'Optional model which contains this CSS template. Used ' +
          'to expand ^ signs in CSS selectors to the model name.',
      postSet: function(old, nu) {
        if (nu) {
          // Need to buildPrototype to make sure things like constants get
          // properly populated. Otherwise the CSS_CLASS constant is not
          // honoured.
          nu.buildPrototype();
          this.modelName_ = nu.CSS_CLASS || cssClassize(nu.id);
        }
      },
    },
    {
      name: 'modelName_',
      documentation: 'The converted model name itself.',
      adapt: function(old, nu) {
        // Turns 'foo-bar quux' into '.foo-bar.quux'
        return '.' + nu.split(/ +/).join('.');
      }
    },
  ],
});

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

/**
 * A sub-set of the DOM Element interface that we use for FOAM tag parsing.
 * This lets us transparently build FOAM objects and views from either real DOM
 * or from the output of FOAM's HTML parser.
 **/
CLASS({
  package: 'foam.html',
  name: 'Element',

  constants: {
    OPTIONAL_CLOSE_TAGS: {
      HTML: true,
      HEAD: true,
      BODY: true,
      P: true,
      DT: true,
      DD: true,
      LI: true,
      OPTION: true,
      THEAD: true,
      TH: true,
      TBODY: true,
      TR: true,
      TD: true,
      TFOOT: true,
      COLGROUP: true,
    },
    ILLEGAL_CLOSE_TAGS: {
      IMG: true,
      INPUT: true,
      BR: true,
      HR: true,
      FRAME: true,
      AREA: true,
      BASE: true,
      BASEFONT: true,
      COL: true,
      ISINDEX: true,
      LINK: true,
      META: true,
      PARAM: true
    }
  },

  properties: [
    {
      name: 'id'
    },
    {
      name: 'nodeName'/*,
      preSet: function(_, v) {
        return v.toLowerCase();
      }*/
    },
    {
      name: 'attributeMap_',
      transient: true,
      factory: function() { return {}; }
    },
    {
      name: 'attributes',
      factory: function() { return []; },
      postSet: function(_, attrs) {
        for ( var i = 0 ; i < attrs.length ; i++ )
          this.attributeMap_[attrs[i].name] = attrs[i];
      }
    },
    {
      name: 'childNodes',
      factory: function() { return []; }
    },
    {
      name: 'children',
      transient: true,
      getter: function() {
        return this.childNodes.filter(function(c) { return typeof c !== 'string'; });
      }
    },
    {
      name: 'outerHTML',
      transient: true,
      getter: function() {
        var out = '<' + this.nodeName;
        if ( this.id ) out += ' id="' + this.id + '"';
        for ( key in this.attributeMap_ ) {
          var value = this.attributeMap_[key].value;

          out += value == undefined ?
            ' ' + key :
            ' ' + key + '="' + this.attributeMap_[key].value + '"';
        }
        if ( ! this.ILLEGAL_CLOSE_TAGS[this.nodeName] &&
             ( ! this.OPTIONAL_CLOSE_TAGS[this.nodeName] || this.childNodes.length ) ) {
          out += '>';
          out += this.innerHTML;
          out += '</' + this.nodeName;
        }
        out += '>';
        return out;
      }
    },
    {
      name: 'innerHTML',
      transient: true,
      getter: function() {
        var out = '';
        for ( var i = 0 ; i < this.childNodes.length ; i++ )
          out += this.childNodes[i].toString();
        return out;
      }
    }
  ],

  methods: {
    setAttribute: function(name, value) {
      var attr = this.getAttributeNode(name);

      if ( attr ) {
        attr.value = value;
      } else {
        attr = {name: name, value: value};
        this.attributes.push(attr);
        this.attributeMap_[name] = attr;
      }
    },
    getAttributeNode: function(name) { return this.attributeMap_[name]; },
    getAttribute: function(name) {
      var attr = this.getAttributeNode(name);
      return attr && attr.value;
    },
    appendChild: function(c) { this.childNodes.push(c); },
    removeChild: function(c) {
      for ( var i = 0; i < this.childNodes.length; ++i ) {
        if ( this.childNodes[i] === c ) {
          this.childNodes.splice(i, 1);
          break;
        }
      }
    },
    toString: function() { return this.outerHTML; }
  }
});


var HTMLParser = {
  __proto__: grammar,

  create: function() {
    return {
      __proto__: this,
      stack: [ X.foam.html.Element.create({nodeName: 'html'}) ]
    }
  },

  peek: function() { return this.stack[this.stack.length-1]; },

  START: sym('html'),

  // Use simpleAlt() because endTag() doesn't always look ahead and will
  // break the regular alt().
  html: repeat0(sym('htmlPart')),

  htmlPart: simpleAlt(
    sym('cdata'),
    sym('comment'),
    sym('text'),
    sym('endTag'),
    sym('startTag')),

  tag: seq(
    sym('startTag'),
    repeat(seq1(1, sym('matchingHTML'), sym('htmlPart')))),

  matchingHTML: function(ps) {
    return this.stack.length > 1 ? ps : null;
  },

  startTag: seq(
    '<',
    sym('tagName'),
    sym('whitespace'),
    sym('attributes'),
    sym('whitespace'),
    optional('/'),
    '>'),

  endTag: (function() {
    var endTag_ = sym('endTag_');
    return function(ps) {
      return this.stack.length > 1 ? this.parse(endTag_, ps) : undefined;
    };
  })(),

  endTag_: seq1(1, '</', sym('tagName'), '>'),

  cdata: seq1(1, '<![CDATA[', str(repeat(not(']]>', anyChar))), ']]>'),

  comment: seq('<!--', repeat0(not('-->', anyChar)), '-->'),

  attributes: repeat(sym('attribute'), sym('whitespace')),

  label: str(plus(notChars(' %=/\t\r\n<>\'"'))),

  tagName: sym('label'),

  text: str(plus(alt('<%', notChar('<')))),

  attribute: seq(sym('label'), optional(seq1(1, '=', sym('value')))),

  value: str(alt(
    plus(alt(range('a','z'), range('A', 'Z'), range('0', '9'))),
    seq1(1, '"', repeat(notChar('"')), '"')
  )),

  whitespace: repeat0(alt(' ', '\t', '\r', '\n'))
}.addActions({
  START: function(xs) {
    // TODO(kgr): I think that this might be a bug if we get a failed compile then
    // we might not reset state properly.
    var ret = this.stack[0];
    this.stack = [ X.foam.html.Element.create({nodeName: 'html'}) ];
    return ret;
  },
  tag: function(xs) {
    var ret = this.stack[0];
    this.stack = [ X.foam.html.Element.create({nodeName: 'html'}) ];
    return ret.childNodes[0];
  },
  attribute: function(xs) { return { name: xs[0], value: xs[1] }; },
  cdata: function(xs) { this.peek() && this.peek().appendChild(xs); },
  text: function(xs) { this.peek() && this.peek().appendChild(xs); },
  startTag: function(xs) {
    var tag = xs[1];
    // < tagName ws attributes ws / >
    // 0 1       2  3          4  5 6
    var obj = X.foam.html.Element.create({nodeName: tag, attributes: xs[3]});
    this.peek() && this.peek().appendChild(obj);
    if ( xs[5] != '/' ) this.stack.push(obj);
    return obj;
  },
  endTag: function(tag) {
    var stack = this.stack;

    while ( stack.length > 1 ) {
      if ( this.peek().nodeName === tag ) {
        stack.pop();
        return;
      }
      var top = stack.pop();
      this.peek().childNodes = this.peek().childNodes.concat(top.childNodes);
      top.childNodes = [];
    }
  }
});

/*
// TODO: move tests to UnitTests
function test(html) {
  console.log('\n\nparsing: ', html);
  var p = HTMLParser.create();
  var res = p.parseString(html);
  if ( res ) {
    console.log('Result: ', res.toString());
  } else {
    console.log('error');
  }
}

test('<ba>foo</ba>');
test('<p>');
test('foo');
test('foo bar');
test('foo</end>');
test('<b>foo</b></foam>');
test('<pA a="1">foo</pA>');
test('<pA a="1" b="2">foo<b>bold</b></pA>');
*/

(function() {
  var registry = { };

  X.registerElement = function(name, model) {
//    console.log('registerElement: ', name);
    registry[name] = model;

    TemplateParser.foamTag_ = (function() {
      var start = seq(
        '<',
        simpleAlt.apply(null,
          Object.keys(registry).
            sort(function(o1, o2) { return o2.compareTo(o1); }).
            map(function(k) { return literal_ic(k); })),
        alt('/', ' ', '>'));

      var html = HTMLParser.create().export('tag');

      return function(ps) {
        var res = this.parse(start, ps) && this.parse(html, ps);
        if ( ! res ) return null;
        var elem  = res.value;
        var model = registry[elem.nodeName];
        if ( model ) elem.setAttribute('model', model);
        return res.setValue(elem);
      };
    })();
    invalidateParsers();
  };

  X.elementModel = function(name) {
    return registry[name];
  };
})();

X.registerElement('foam', null);

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
var Visitor = {
  create: function() {
    return { __proto__: this, stack: [] };
  },

  push: function(o) { this.stack.push(o); },

  pop: function() { return this.stack.pop(); },

  top: function() {
    return this.stack.length && this.stack[this.stack.length-1];
  },

  visit: function(o) {
    return Array.isArray(o)           ? this.visitArray(o)    :
           ( typeof o === 'string' )  ? this.visitString(o)   :
           ( typeof o === 'number' )  ? this.visitNumber(o)   :
           ( o instanceof Function )  ? this.visitFunction(o) :
           ( o instanceof Date )      ? this.visitDate(o)     :
           ( o === true )             ? this.visitTrue()      :
           ( o === false )            ? this.visitFalse()     :
           ( o === null )             ? this.visitNull()      :
           ( o instanceof Object )    ? ( o.model_            ?
             this.visitObject(o)      :
             this.visitMap(o)
           )                          : this.visitUndefined() ;
  },

  visitArray: function(o) {
    var len = o.length;
    for ( var i = 0 ; i < len ; i++ ) this.visitArrayElement(o, i);
    return o;
  },
  visitArrayElement: function (arr, i) { this.visit(arr[i]); },

  visitString: function(o) { return o; },

  visitFunction: function(o) { return o; },

  visitNumber: function(o) { return o; },

  visitDate: function(o) { return o; },

  visitObject: function(o) {
    var properties = o.model_.getRuntimeProperties();
    for ( var key in properties ) {
      var prop = properties[key];

      if ( prop.name in o.instance_ ) {
        this.visitProperty(o, prop);
      }
    }
    return o;
  },
  visitProperty: function(o, prop) { this.visit(o[prop.name]); },

  visitMap: function(o) {
    for ( var key in o ) { this.visitMapElement(key, o[key]); };
    return o;
  },
  visitMapElement: function(key, value) { },

  visitTrue: function() { return true; },

  visitFalse: function() { return false; },

  visitNull: function() { return null; },

  visitUndefined: function() { return undefined; }

};

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

var ObjectToJSON = {
  __proto__: Visitor.create(),

  visitFunction: function(o) {
    return o.toString();
  },

  visitObject: function(o) {
    this.push({
      model_: (o.model_.package ? o.model_.package + '.' : '') + o.model_.name
    });
    this.__proto__.visitObject.call(this, o);
    return this.pop();
  },
  visitProperty: function(o, prop) {
    prop.propertyToJSON(this, this.top(), o);
  },

  visitMap: function(o) {
    this.push({});
    Visitor.visitMap.call(this, o);
    return this.pop();
  },
  visitMapElement: function(key, value) { this.top()[key] = this.visit(value); },

  visitArray: function(o) {
    this.push([]);
    this.__proto__.visitArray.call(this, o);
    return this.pop();
  },
  visitArrayElement: function (arr, i) { this.top().push(this.visit(arr[i])); }
};


var JSONToObject = {
  __proto__: ObjectToJSON.create(),

  visitObject: function(o) {
    var model   = X.lookup(o.model_);
    if ( ! model ) throw new Error('Unknown Model: ' + o.model_);
    var obj     = model.create();

    //    o.forEach((function(value, key) {
    // Workaround for crbug.com/258522
    Object_forEach(o, (function(value, key) {
      if ( key !== 'model_' ) obj[key] = this.visit(value);
    }).bind(this));

    return obj;
  },

  // Substitute in-place
  visitArray: Visitor.visitArray,
  visitArrayElement: function (arr, i) { arr[i] = this.visit(arr[i]); }
};


CLASS({
  name: 'FilteredDAO_',
  extends: 'foam.dao.ProxyDAO',

  documentation: '<p>Internal use only.</p>',

  properties: [
    {
      name: 'query',
      swiftType: 'ExprProtocol?',
      swiftDefaultValue: 'nil',
      javaType: 'foam.core2.ExprInterface',
      required: true
    }
  ],
  methods: [
    {
      name: 'select',
      code: function(sink, options, opt_X) {
        return this.delegate.select(sink, options ? {
          __proto__: options,
          query: options.query ?
            AND(this.query, options.query) :
            this.query
        } : {query: this.query}, opt_X);
      },
      swiftCode: function() {/*
        if options.query != nil { options.query = AND(query, options.query) }
        else { options.query = query }
        return delegate.select(sink, options: options)
      */},
      javaCode: function() {/*
        if (options != null && options.getQuery() != null) {
          options.setQuery(MLang.AND(getQuery(), options.getQuery()));
        } else {
          options.setQuery(getQuery());
        }
        return getDelegate().select(sink, options);
      */},
    },
    {
      name: 'removeAll',
      code: function(sink, options, opt_X) {
        return this.delegate.removeAll(sink, options ? {
          __proto__: options,
          query: options.query ?
            AND(this.query, options.query) :
            this.query
        } : {query: this.query}, opt_X);
      },
      swiftCode: function() {/*
        let options2 = options.deepClone() as! DAOQueryOptions
        options2.query = options2.query != nil ?
          AND(self.query, options2.query) :
          self.query
        return self.delegate.removeAll(sink, options: options2)
      */},
      javaCode: function() {/*
        DAOQueryOptions options2 = (DAOQueryOptions)(options.deepClone());
        options2.setQuery(options2 != null && options2.getQuery() != null ?
          MLang.AND(getQuery(), options2.getQuery()) :
          getQuery());
        return getDelegate().removeAll(sink, options2);
      */},
    },
    {
      name: 'listen',
      code: function(sink, options) {
        return this.SUPER(sink, options ? {
          __proto__: options,
          query: options.query ?
            AND(this.query, options.query) :
            this.query
        } : {query: this.query});
      },
      swiftCode: function() {/*
        let options2 = options.deepClone() as! DAOQueryOptions
        options2.query = options2.query != nil ?
          AND(self.query, options2.query) :
          self.query
        super.listen(sink, options: options2)
      */},
      javaCode: function() {/*
        DAOQueryOptions options2 = (DAOQueryOptions)(options.deepClone());
        options2.setQuery(options2 != null && options2.getQuery() != null ?
          MLang.AND(getQuery(), options2.getQuery()) :
          getQuery());
        super.listen(sink, options2);
      */},
    },
    function toString() {
      return this.delegate + '.where(' + this.query + ')';
    }
  ]
});


CLASS({
  name: 'OrderedDAO_',
  extends: 'foam.dao.ProxyDAO',

  documentation: function() {/*
        <p>Internal use only.</p>
      */},

  properties: [
    {
      name: 'comparator',
      required: true
    }
  ],
  methods: {
    select: function(sink, options, opt_X) {
      if ( options ) {
        if ( ! options.order )
          options = { __proto__: options, order: this.comparator };
      } else {
        options = {order: this.comparator};
      }

      return this.delegate.select(sink, options, opt_X);
    },
    toString: function() {
      return this.delegate + '.orderBy(' + this.comparator + ')';
    }
  }

});


CLASS({
  name: 'LimitedDAO_',
  extends: 'foam.dao.ProxyDAO',

  documentation: function() {/*
        <p>Internal use only.</p>
      */},

  properties: [
    {
      name: 'count',
      required: true
    }
  ],
  methods: {
    select: function(sink, options, opt_X) {
      if ( options ) {
        if ( 'limit' in options ) {
          options = {
            __proto__: options,
            limit: Math.min(this.count, options.limit)
          };
        } else {
          options = { __proto__: options, limit: this.count };
        }
      }
      else {
        options = { limit: this.count };
      }

      return this.delegate.select(sink, options, opt_X);
    },
    toString: function() {
      return this.delegate + '.limit(' + this.count + ')';
    }
  }
});


CLASS({
  name: 'SkipDAO_',
  extends: 'foam.dao.ProxyDAO',

  documentation: function() {/*
        <p>Internal use only.</p>
      */},

  properties: [
    {
      name: 'skip',
      required: true,
      postSet: function() {
        if ( this.skip !== Math.floor(this.skip) )
          console.warn('skip() called with non-integer value: ' + this.skip);
      }
    }
  ],
  methods: {
    select: function(sink, options, opt_X) {
      options = options ? { __proto__: options, skip: this.skip } : { skip: this.skip };

      return this.delegate.select(sink, options, opt_X);
    },
    toString: function() {
      return this.delegate + '.skip(' + this.skip + ')';
    }
  }
});


CLASS({
  name: 'RelationshipDAO',
  extends: 'FilteredDAO_',
  documentation: 'Adapts a DAO based on a Relationship.',

  properties: [
    {
      name: 'relatedProperty',
      required: true
    },
    {
      name: 'relativeID',
      required: true
    },
    {
      name: 'query',
      lazyFactory: function() {
        return AND(NEQ(this.relatedProperty, ''),
            EQ(this.relatedProperty, this.relativeID));
      }
    }
  ],

  methods: [
    function put(obj, sink) {
      obj[this.relatedProperty.name] = this.relativeID;
      this.SUPER(obj, sink);
    }
  ]
});

function atxn(afunc) {
  return function(ret) {
    if ( GLOBAL.__TXN__ ) {
      afunc.apply(this, arguments);
    } else {
      GLOBAL.__TXN__ = {};
      var a = argsToArray(arguments);
      a[0] = function() {
        GLOBAL.__TXN__ = undefined;
        ret();
      };
      afunc.apply(this, a);
    }
  };
}


CLASS({
  name: 'AbstractDAO',
  javaClassImports: [
    'foam.dao.nativesupport.ClosureSink',
    'foam.dao.nativesupport.DAOQueryOptions',
    'foam.dao.nativesupport.PredicatedSink',
    'foam.dao.nativesupport.Sink',
    'java.util.concurrent.CompletableFuture',
  ],

  documentation: function() {/*
    The base for most DAO implementations, $$DOC{ref:'.'} provides basic facilities for
    $$DOC{ref:'.where'}, $$DOC{ref:'.limit'}, $$DOC{ref:'.skip'}, and $$DOC{ref:'.orderBy'}
    operations, and provides for notifications of updates through $$DOC{ref:'.listen'}.
  */},

  properties: [
    {
      name: 'daoListeners_',
      transient: true,
      hidden: true,
      factory: function() { return []; },
      swiftType: 'NSMutableArray',
      swiftFactory: 'return NSMutableArray()',
      javaType: 'java.util.List<foam.dao.nativesupport.Sink>',
      javaFactory: 'return new java.util.ArrayList<foam.dao.nativesupport.Sink>();',
      compareProperty: function() { return 0; },
    }
  ],

  methods: [
    function update(expr) { /* Applies a change to the DAO contents. */
      return this.select(UPDATE(expr, this));
    },

    {
      name: 'select',
      code: function(sink, options) {
        /* Template method. Override to copy the contents of this DAO (filtered or ordered as
        necessary) to sink. */
      },
      args: [
        {
          name: 'sink',
          swiftType: 'Sink = ArraySink()',
          javaType: 'foam.dao.nativesupport.Sink',
        },
        {
          name: 'options',
          swiftType: 'DAOQueryOptions = DAOQueryOptions()',
          javaType: 'foam.dao.nativesupport.DAOQueryOptions',
          javaDefaultValue: 'new foam.dao.nativesupport.DAOQueryOptions()',
        },
      ],
      swiftReturnType: 'Future',
      swiftCode: 'return Future().set(sink)',
      javaReturnType: 'CompletableFuture<foam.dao.nativesupport.Sink>',
      javaCode: 'return null;',
    },
    {
      name: 'put',
      args: [
        {
          name: 'obj',
          swiftType: 'FObject',
          javaType: 'FObject',
        },
        {
          name: 'sink',
          swiftType: 'Sink = ArraySink()',
          javaType: 'foam.dao.nativesupport.Sink',
          javaDefaultValue: 'new foam.dao.nativesupport.ArraySink()',
        },
      ],
      swiftCode: '// Override',
      javaCode: '// Override',
    },
    {
      name: 'remove',
      code: function(query, sink) {
        /* Template method. Override to remove matching items and put them into sink if supplied. */
      },
      args: [
        {
          name: 'obj',
          swiftType: 'FObject',
          javaType: 'FObject',
        },
        {
          name: 'sink',
          swiftType: 'Sink = ArraySink()',
          javaType: 'foam.dao.nativesupport.Sink',
          javaDefaultValue: 'new foam.dao.nativesupport.ArraySink()',
        },
      ],
      swiftCode: '// Override',
      javaCode: '// Override',
    },
    {
      name: 'find',
      code: function(id, sink) {
        /* Template method. Override to return an object from the dao with the given id. */
      },
      args: [
        {
          name: 'id',
          type: 'String',
        },
        {
          name: 'sink',
          swiftType: 'Sink',
          javaType: 'foam.dao.nativesupport.Sink',
        },
      ],
      swiftCode: '// Override',
      javaCode: '// Override',
    },

    {
      name: 'pipe',
      code: function(sink, options) { /* A $$DOC{ref:'.select'} followed by $$DOC{ref:'.listen'}.
             Dump our contents to sink, then send future changes there as well. */
        sink = this.decorateSink_(sink, options, true);

        var fc   = this.createFlowControl_();
        var self = this;

        this.select({
          put: function() {
            sink.put && sink.put.apply(sink, arguments);
          },
          remove: function() {
            sink.remove && sink.remove.apply(sink, arguments);
          },
          error: function() {
            sink.error && sink.error.apply(sink, arguments);
          },
          eof: function() {
            if ( fc.stopped ) {
              sink.eof && sink.eof();
            } else {
              self.listen(sink, options);
            }
          }
        }, options, fc);
      },
      args: [
        {
          name: 'sink',
          swiftType: 'Sink',
          javaType: 'foam.dao.nativesupport.Sink',
        },
        {
          name: 'options',
          swiftType: 'DAOQueryOptions = DAOQueryOptions()',
          javaType: 'foam.dao.nativesupport.DAOQueryOptions',
          javaDefaultValue: 'new foam.dao.nativesupport.DAOQueryOptions()',
        },
      ],
      swiftCode: function() {/*
        self.select(sink, options: options).get { _ in
          self.listen(sink, options: options)
        }
      */},
      javaCode: function() {/*
        this.select(sink, options).thenAccept(result -> {
          this.listen(sink, options);
        });
      */},
    },

    {
      name: 'decorateSink_',
      code: function (sink, options, isListener, disableLimit) {
        if ( options ) {
          if ( ! disableLimit ) {
            if ( options.limit ) sink = limitedSink(options.limit, sink);
            if ( options.skip )  sink = skipSink(options.skip, sink);
          }

          if ( options.order && ! isListener ) {
            sink = orderedSink(options.order, sink);
          }

          if ( options.query ) {
            sink = predicatedSink(
              options.query.partialEval ?
                options.query.partialEval() :
                options.query,
              sink) ;
          }
        }

        return sink;
      },
      args: [
        {
          name: 'sink',
          swiftType: 'Sink',
          javaType: 'foam.dao.nativesupport.Sink',
        },
        {
          name: 'options',
          swiftType: 'DAOQueryOptions',
          javaType: 'foam.dao.nativesupport.DAOQueryOptions',
        },
      ],
      swiftReturnType: 'Sink',
      javaReturnType: 'foam.dao.nativesupport.Sink',
      swiftCode: function() {/*
        var decoratedSink = sink
        if options.query != nil {
          decoratedSink = PredicatedSink(args: [
            "delegate": decoratedSink,
            "expr": options.query!
          ])
          decoratedSink.UID = sink.UID
        }
        return decoratedSink
      */},
      javaCode: function() {/*
        Sink decoratedSink = sink;
        if (options.getQuery() != null) {
          PredicatedSink pSink = new PredicatedSink();
          pSink.setDelegate(decoratedSink);
          pSink.setExpr(options.getQuery());
          decoratedSink.setUID(sink.getUID());
          decoratedSink = pSink;
        }
        return decoratedSink;
      */},
    },

    function createFlowControl_() {
      return {
        stop: function() { this.stopped = true; },
        error: function(e) { this.errorEvt = e; }
      };
    },

    {
      name: 'where',
      code: function(query) { /* Return a DAO that contains a filtered subset of this one. */
        // only use X if we are an invalid instance without a this.Y
        return (this.Y || X).lookup('FilteredDAO_').create({query: query, delegate: this});
      },
      args: [
        {
          name: 'query',
          swiftType: 'ExprProtocol',
          javaType: 'foam.core2.ExprInterface',
        },
      ],
      swiftReturnType: 'AbstractDAO',
      javaReturnType: 'AbstractDAO',
      swiftCode: function() {/*
        let filteredDAO = FilteredDAO_()
        filteredDAO.delegate = self
        filteredDAO.query = query
        return filteredDAO
      */},
      javaCode: function() {/*
        FilteredDAO_ filteredDAO = new FilteredDAO_();
        filteredDAO.setDelegate(this);
        filteredDAO.setQuery(query);
        return filteredDAO;
      */},
    },

    function limit(count) { /* Return a DAO that contains a count limited subset of this one. */
      return (this.Y || X).lookup('LimitedDAO_').create({count:count, delegate:this});
    },

    function skip(skip) { /* Return a DAO that contains a subset of this one, skipping initial items. */
      return (this.Y || X).lookup('SkipDAO_').create({skip:skip, delegate:this});
    },

    function orderBy() { /* Return a DAO that contains a subset of this one, ordered as specified. */
      return (this.Y || X).lookup('OrderedDAO_').create({ comparator: arguments.length == 1 ? arguments[0] : argsToArray(arguments), delegate: this });
    },

    {
      name: 'listen',
      code: function(sink, options) { /* Send future changes to sink. */
        this.daoListeners_.push(this.decorateSink_(sink, options, true));
      },
      args: [
        {
          name: 'sink',
          swiftType: 'Sink',
          javaType: 'foam.dao.nativesupport.Sink',
        },
        {
          name: 'options',
          swiftType: 'DAOQueryOptions = DAOQueryOptions()',
          javaType: 'foam.dao.nativesupport.DAOQueryOptions',
          javaDefaultValue: 'new foam.dao.nativesupport.DAOQueryOptions()',
        }
      ],
      swiftCode: 'self.daoListeners_.add(self.decorateSink_(sink, options: options))',
      javaCode: 'getDaoListeners_().add(decorateSink_(sink, options));',
    },

    {
      name: 'unlisten',
      code: function unlisten(sink) { /* Stop sending updates to the given sink. */
        var ls = this.daoListeners_;
  //      if ( ! ls.length ) console.warn('Phantom DAO unlisten: ', this, sink);
        for ( var i = 0; i < ls.length ; i++ ) {
          if ( ls[i].$UID === sink.$UID ) {
            ls.splice(i, 1);
            return true;
          }
        }
        if ( DEBUG ) console.warn('Phantom DAO unlisten: ', this, sink);
      },
      args: [
        {
          name: 'sink',
          swiftType: 'Sink',
          javaType: 'foam.dao.nativesupport.Sink',
        },
      ],
      returnType: 'Boolean',
      swiftCode: function() {/*
        for (i,listener) in daoListeners_.enumerated() {
          guard let listener = listener as? Sink else { continue }
          if listener.UID == sink.UID {
            daoListeners_.removeObject(at: i)
            return true
          }
        }

        return false
      */},
      javaCode: function() {/*
        for (Sink listener : getDaoListeners_()) {
          if (listener.getUID() == sink.getUID()) {
            getDaoListeners_().remove(listener);
            return true;
          }
        }

        return false;
      */},
    },

    {
      name: 'removeAll',
      // Default removeAll: calls select() with the same options and
      // calls remove() for all returned values.
      code: function(sink, options) { /* Default $$DOC{ref:'.removeAll'}: calls
              $$DOC{ref:'.select'} with the same options and calls $$DOC{ref:'.remove'}
               for all returned values. */
        var self = this;
        var future = afuture();
        this.select({
          put: function(obj) {
            self.remove(obj, { remove: sink && sink.remove });
          }
        })(function() {
          sink && sink.eof();
          future.set();
        });
        return future.get;
      },
      args: [
        {
          name: 'sink',
          swiftType: 'Sink = ArraySink()',
          javaType: 'foam.dao.nativesupport.Sink',
          javaDefaultValue: 'new foam.dao.nativesupport.ArraySink()',
        },
        {
          name: 'options',
          swiftType: 'DAOQueryOptions = DAOQueryOptions()',
          javaType: 'foam.dao.nativesupport.DAOQueryOptions',
          javaDefaultValue: 'new foam.dao.nativesupport.DAOQueryOptions()',
        },
      ],
      swiftReturnType: 'Future',
      javaReturnType: 'java.util.concurrent.CompletableFuture',
      swiftCode: function() {/*
        let future = Future()
        let removeSink = ClosureSink(args: [
          "putFn": FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
            let obj = args[0] as! FObject
            self.remove(obj, sink: ClosureSink(args: [
              "removeFn": FoamFunction(fn: { (args: AnyObject?...) -> AnyObject? in
                let obj = args[0] as! FObject
                sink.remove(obj)
                return nil
              }),
            ]));
            return nil
          }),
        ])
        self.select(removeSink, options: options).get { _ in
          sink.eof()
          _ = future.set(sink)
        }
        return future;
      */},
      javaCode: function() {/*
        AbstractDAO self = this;
        CompletableFuture<Sink> future = new CompletableFuture<>();
        ClosureSink removeSink = new ClosureSink();
        removeSink.setPutFn(new FoamFunction() {
          @Override public Object call(Object... args) {
            FObject obj = (FObject)args[0];
            ClosureSink removeSink2 = new ClosureSink();
            removeSink2.setRemoveFn(new FoamFunction() {
              @Override public Object call(Object... args) {
                FObject obj = (FObject)args[0];
                sink.remove(obj);
                return null;
              }
            });
            self.remove(obj, removeSink2);
            return null;
          }
        });
        this.select(removeSink, options).thenAccept(result -> {
          sink.eof();
          future.complete(sink);
        });
        return future;
      */},
    },

    {
      /**
       * Notify all listeners of update to DAO.
       * @param fName the name of the method in the listeners to call.
       *        possible values: 'put', 'remove'
       **/
      name: 'notify_',
      code: function(fName, args) {
        // console.log(this.name_, ' ***** notify ', fName, ' args: ', args, ' listeners: ', this.daoListeners_);
        for( var i = 0 ; i < this.daoListeners_.length ; i++ ) {
          var l = this.daoListeners_[i];
          var fn = l[fName];
          if ( fn ) {
            // Create flow-control object
            args[2] = {
              stop: (function(fn, l) {
                return function() { fn(l); };
              })(this.unlisten.bind(this), l),
              error: function(e) { /* Don't care. */ }
            };
            try {
              fn.apply(l, args);
            } catch(err) {
              if ( err !== this.UNSUBSCRIBE_EXCEPTION ) {
                console.error('Error delivering event (removing listener): ', fName, err);
                if ( DEBUG ) console.error(err.stack); // TODO: make a NO_DEBUGGER flag for mobile debugger mode?
              }
              this.unlisten(l);
            }
          }
        }
      },
      args: [
        {
          name: 'fName',
          type: 'String',
        },
        {
          name: 'fObj',
          swiftType: 'FObject? = nil',
          javaType: 'FObject',
          javaDefaultValue: 'null',
        },
      ],
      swiftCode: function() { /*
        switch fName {
          case "put":
            for l in self.daoListeners_ {
              let l = l as! Sink
              l.put(fObj!)
            }
            break
          case "remove":
            for l in self.daoListeners_ {
              let l = l as! Sink
              l.remove(fObj!)
            }
            break
          case "reset":
            for l in self.daoListeners_ {
              let l = l as! Sink
              l.reset()
            }
            break
          default:
            fatalError("DAO notify with unexpected function \(fName)")
        }
      */},
      javaCode: function() { /*
        switch (fName) {
          case "put":
            for (Sink l : getDaoListeners_()) {
              l.put(fObj);
            }
            break;
          case "remove":
            for (Sink l : getDaoListeners_()) {
              l.remove(fObj);
            }
            break;
          case "reset":
            for (Sink l : getDaoListeners_()) {
              l.reset();
            }
            break;
          default:
            // TODO output error.
        }
      */},
    },

  ]
});


// Experimental, convert all functions into sinks
Function.prototype.put    = function() { this.apply(this, arguments); };
Function.prototype.remove = function() { this.apply(this, arguments); };
Function.prototype.reset = function() { this.call(this); };
//Function.prototype.error  = function() { this.apply(this, arguments); };
//Function.prototype.eof    = function() { this.apply(this, arguments); };

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

(function() {
  // Copy X.AbstractDAO methods in Array prototype

  var pmap = {};
  for ( var key in AbstractDAO.methods ) {
    pmap[AbstractDAO.methods[key].name] = AbstractDAO.methods[key].code;
  }

  for ( var key in pmap ) {
    Object.defineProperty(Array.prototype, key, {
      value: pmap[key],
      configurable: true,
      writable: true
    });
  }
})();

defineLazyProperty(Array.prototype, 'daoListeners_', function() {
  return {
    value: [],
    configurable: true
  };
});


var ArraySink = {
  __proto__: Array.prototype,
  put: function(obj, sink) {
    this.push(obj);
    this.notify_('put', arguments);
    sink && sink.put && sink.put(obj);
  },
  clone: function() {
    return this.slice().sink;
  },
  deepClone: function() {
    var r = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      r[i] = this[i].deepClone();
    }
    return r.sink;
  },
  exprClone: function() {
    return this.deepClone();
  }
};


MODEL0({
  extendsProto: 'Array',

  properties: [
    {
      name: 'dao',
      getter: function() { this.__proto__ = Array.prototype; return this; }
    },
    {
      name: 'sink',
      getter: function() { this.__proto__ = ArraySink; return this; }
    }
  ],
  methods: {
    listen:   AbstractDAO.getPrototype().listen,
    unlisten: AbstractDAO.getPrototype().unlisten,
    notify_:  AbstractDAO.getPrototype().notify_,

    put: function(obj, sink) {
      // TODO: remove() checks obj.id for falsy, and uses obj instead of obj.id. Inconsistent!
      for ( var idx = 0; idx < this.length; idx++ ) {
        if ( this[idx].id === obj.id ) {
          this[idx] = obj;
          sink && sink.put && sink.put(obj);
          this.notify_('put', arguments);
          //        sink && sink.error && sink.error('put', obj, duplicate);
          return;
        }
      }

      this.push(obj);
      this.notify_('put', arguments);
      sink && sink.put && sink.put(obj);
    },
    find: function(query, sink) {
      if ( query.f ) {
        for ( var idx = 0 ; idx < this.length; idx++ ) {
          if ( query.f(this[idx]) ) {
            sink && sink.put && sink.put(this[idx]);
            return;
          }
        }
      } else {
        for ( var idx = 0 ; idx < this.length; idx++ ) {
          if ( this[idx].id === query ) {
            sink && sink.put && sink.put(this[idx]);
            return;
          }
        }
      }
      sink && sink.error && sink.error('find', query);
    },
    // TODO: make this faster, should stop after finding first item.
    remove: function(obj, sink) {
      if ( ! obj ) {
        sink && sink.error && sink.error('missing key');
        return;
      }
      var objId = obj.id;
      var id = (objId !== undefined && objId !== '') ? objId : obj;
      for ( var idx = 0 ; idx < this.length; idx++ ) {
        if ( this[idx].id === id ) {
          var rem = this.splice(idx,1)[0];
          this.notify_('remove', [rem]);
          sink && sink.remove && sink.remove(rem);
          return;
        }
      }
      sink && sink.error && sink.error('remove', obj);
    },
    removeAll: function(sink, options) {
      if ( ! options ) options = {};
      if ( !options.query ) options.query = { f: function() { return true; } };

      for (var i = 0; i < this.length; i++) {
        var obj = this[i];
        if ( options.query.f(obj) ) {
          var rem = this.splice(i,1)[0];
          this.notify_('remove', [rem]);
          sink && sink.remove && sink.remove(rem);
          i--;
        }
      }
      sink && sink.eof && sink.eof();
      return anop();
    },
    select: function(sink, options) {
      sink = sink || [].sink;
      var hasQuery = options && ( options.query || options.order );
      var originalsink = sink;
      sink = this.decorateSink_(sink, options, false, ! hasQuery);

      // Short-circuit COUNT.
      if ( ! hasQuery && GLOBAL.CountExpr && CountExpr.isInstance(sink) ) {
        sink.count = this.length;
        return aconstant(originalsink);
      }

      var fc = this.createFlowControl_();
      var start = Math.max(0, hasQuery ? 0 : ( options && options.skip ) || 0);
      var end = hasQuery ?
        this.length :
        Math.min(this.length, start + ( ( options && options.limit ) || this.length));
      for ( var i = start ; i < end ; i++ ) {
        sink.put(this[i], null, fc);
        if ( fc.stopped ) break;
        if ( fc.errorEvt ) {
          sink.error && sink.error(fc.errorEvt);
          return aconstant(originalsink, fc.errorEvt);
        }
      }

      sink.eof && sink.eof();

      return aconstant(originalsink);
    }
  }
});

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
  package: 'foam.ui',

  name: 'Window',

  exports: [
    'performance',
    '$$',
    '$',
    'addStyle',
    'animate',
    'cancelAnimationFrame',
    'clearInterval',
    'clearTimeout',
    'console',
    'document',
    'framed',
    'dynamic',
    'dynamicFn',
    'dynamic2',
    'dynamic3',
    'error',
    'info',
    'installedModels',
    'log',
    'requestAnimationFrame',
    'setInterval',
    'setTimeout',
    'warn',
    'window',
    'writeView',
    'as FOAMWindow'
  ],

  properties: [
    {
      name: 'registeredModels',
      factory: function() { return {}; }
    },
    {
      type: 'String',
      name: 'name',
      defaultValue: 'window'
    },
    {
      name: 'window',
      postSet: function(_, w) {
        // TODO: This would be better if ChromeApp.js added this behaviour
        // in a SubModel of Window, ie. ChromeAppWindow
        if ( this.X.subDocument ) this.X.subDocument(w.document);

        w.X = this.Y;
        this.document = w.document;
        this.performance = w.performance;
      }
    },
    {
      name: 'document'
      // postSet to reset installedModels?
    },
    {
      name: 'performance'
    },
    {
      name: 'installedModels',
      documentation: "Each new Window context introduces a new document and resets installedModels so models will install again in the new document.",
      factory: function() { return {}; }
    },
    {
      name: 'installedStyles',
      factory: function() { return {}; }
    },
    {
      type: 'Boolean',
      name: 'isBackground',
      defaultValue: false
    },
    {
      name: 'console',
      lazyFactory: function() { return this.window.console; }
    },
  ],

  methods: {
    addStyle: function(obj) {
      var id = obj.model_.id;
      if ( this.installedStyles[id] ) return;
      this.installedStyles[id] = true;

      var css = obj.CSS() + '\n\n/*# sourceURL=' + id.replace(/\./g, '/') + '.CSS */\n';

      if ( ! this.document || ! this.document.createElement ) return;
      var s = this.document.createElement('style');
      s.innerHTML = css;
      this.document.head.insertBefore(
        s,
        this.document.head.firstElementChild);
    },
    log:   function() { this.console.log.apply(this.console, arguments); },
    warn:  function() { this.console.warn.apply(this.console, arguments); },
    info:  function() { this.console.info.apply(this.console, arguments); },
    error: function() { this.console.error.apply(this.console, arguments); },
    $: function(id) {
      return ( this.document.FOAM_OBJECTS && this.document.FOAM_OBJECTS[id] ) ?
        this.document.FOAM_OBJECTS[id] :
        this.document.getElementById(id);
    },
    $$: function(cls) {
      return this.document.getElementsByClassName(cls);
    },
    framed: function(listener) {
      return EventService.framed(listener, this);
    },
    dynamic: function(fn /*, Values[] */) {
      return arguments.length == 1 ?
        FunctionValue.create({
          valueFactory: fn
        }, this) :
        OrValue.create({
          valueFactory: fn,
          values: Array.prototype.splice.call(arguments, 1)
        }, this) ;
    },
    dynamicFn: function(fn, opt_fn) {
      return Events.dynamicFn(fn, opt_fn, this.Y);
    },
    // TODO(kgr): experimental, remove if never used
    // avoids capturing nested accessess
    dynamic2: function(fn) {
      var listener = this.framed(fn);
      var propertyValues = [];
      fn(); // Call once before capture to pre-latch lazy values
      Events.onGet.push(function(obj, name, value) {
        if ( arguments.callee.caller.caller !== fn ) {
          console.log('false alarm ', fn.toString());
          return;
        }
        var value = obj.propertyValue(name);
        value.addListener(listener);
        propertyValues.push(value);
      });
      var ret = fn();
      Events.onGet.pop();
      var f = function() {
        propertyValues.forEach(function(p) {
          p.removeListener(listener);
        });
      };
      f.destroy = f;
      return f;
    },
    // TODO(kgr): experimental, remove if never used,
    // TODO(kgr): Move to a 'global' context above Window
    // checks fn for its named dependencies
    dynamic3: function(obj, fn, opt_ret) {
      var values = fn.dependencies.map(function(name) { return obj.propertyValue(name); });

      var listener = this.framed(function() {
        var ret = fn.call(obj);
        opt_ret && opt_ret(ret);
      });

      for ( var i = 0 ; i < values.length ; i++ )
        values[i].addListener(listener);

      var f = function() {
        for ( var i = 0 ; i < values.length ; i++ )
          values[i].removeListener(listener);
      };
      f.destroy = f;
      return f;
    },
    animate: function(duration, fn, opt_interp, opt_onEnd) {
      return Movement.animate(duration, fn, opt_interp, opt_onEnd, this.Y);
    },
    setTimeout: function(f, t) {
      return this.window.setTimeout.apply(this.window, arguments);
    },
    clearTimeout: function(id) { this.window.clearTimeout(id); },
    setInterval: function(f, t) {
      return this.window.setInterval.apply(this.window, arguments);
    },
    clearInterval: function(id) { this.window.clearInterval(id); },
    requestAnimationFrame: function(f) {
      if ( this.isBackground ) return this.setTimeout(f, 16);

      console.assert(
        this.window.requestAnimationFrame,
        'requestAnimationFrame not defined');
      return this.window.requestAnimationFrame(f);
    },
    cancelAnimationFrame: function(id) {
      if ( this.isBackground ) {
        this.clearTimeout(id);
        return;
      }

      this.window.cancelAnimationFrame && this.window.cancelAnimationFrame(id);
    },
    writeView: function(view, opt_X) {
      var document = (opt_X || this).document;
      var html = view.toHTML();
      document.body.insertAdjacentHTML('beforeend', html);
      view.initHTML();
    }
  }
});


// Using the existence of 'process' to determine that we're running in Node.
(function() {
  var w = foam.ui.Window.create(
    {
      window: window,
      name: 'DEFAULT WINDOW',
      isBackground: typeof process === 'object'
    }, X
  );
  FObject.X = X = w.Y;
})();

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

CLASS({
  name: 'IdGenerator',
  package: 'foam.i18n',

  methods: [
    {
      name: 'getMessageId',
      code: function(model, msg) {
        return model.name + '_Message_' + msg.name;
      }
    },
    {
      name: 'getActionTextLabelId',
      code: function(model, action) {
        return model.name + '_ActionLabel_' + action.name;

      }
    },
    {
      name: 'getActionSpeechLabelId',
      code: function(model, action) {
        return model.name + '_ActionSpeechLabel_' + action.name;
      }
    }
  ]
});

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
  name: 'Visitor',
  package: 'foam.i18n',
  todos: [
    'When i18n integration is stable: Turn ActionLabel into ActionTextLabel ',
    'When i18n integration is stable: Include package in model.name prefix'
  ],

  requires: [ 'foam.i18n.IdGenerator' ],
  imports: [
    'warn'
  ],

  properties: [
    {
      type: 'Boolean',
      name: 'revisitModels',
      defaultValue: false
    },
    {
      name: 'visitedModels',
      lazyFactory: function() { return {}; }
    },
    {
      name: 'idGenerator',
      factory: function() {
        return this.IdGenerator.create();
      }
    }
  ],

  methods: [
    {
      name: 'avisitModel',
      code: function(model) {
        if ( ! this.revisitModels && this.visitedModels[model.id] ) {
          return aconstant(model);
        }
        var self = this;
        var modelPrefix = model.translationHint ?
            model.translationHint + ' ' : '';
        var i, key, msg, action;
        if ( model.messages ) {
          for ( i = 0; i < model.messages.length; ++i ) {
            msg = model.messages[i];
            this.visitMessage(model, msg, i);
          }
        }
        if ( model.actions ) {
          for ( i = 0; i < model.actions.length; ++i ) {
            action = model.actions[i];
            if ( action.translationHint &&
                (action.label || action.speechLabel) ) {
              this.visitAction(model, action, i);
            }
          }
        }
        this.visitedModels[model.id] = true;
        return aconstant(model);
      }
    },
    {
      name: 'visitMessage',
      code: function(model) {
        this.warn(
            'Visitor without visitMessage implementation: ' +
                this.name_);
        return this;
      }
    },
    {
      name: 'visitAction',
      code: function(model) {
        this.warn(
            'Visitor without visitAction implementation: ' +
                this.name_);
        return this;
      }
    }
  ]
});

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
  name: 'MessagesExtractor',
  package: 'foam.i18n',
  extends: 'foam.i18n.Visitor',

  requires: [
    'foam.i18n.Message',
    'foam.i18n.MessageGenerator',
    'foam.i18n.MessageBundle',
    'foam.i18n.Placeholder'
  ],
  imports: [ 'console' ],

  properties: [
    {
      model_: 'foam.core.types.DAOProperty',
      name: 'dao',
      lazyFactory: function() { return []; }
    },
    {
      name: 'messageGenerator',
      lazyFactory: function() {
        return this.MessageGenerator.create({
          idGenerator: this.idGenerator
        });
      }
    },
    {
      name: 'messageBundleFactory',
      lazyFactory: function() {
        return this.MessageBundle.create.bind(this.MessageBundle);
      }
    }
  ],

  methods: [
    {
      name: 'visitMessage',
      code: function(model, msg) {
        var i18nMsg = this.messageGenerator.generateMessage(model, msg);
        this.dao.put(i18nMsg);
        return i18nMsg;
      }
    },
    {
      name: 'visitAction',
      code: function(model, action) {
        var msgs = this.messageGenerator.generateActionMessages(model, action);
        var keys = Object.keys(msgs);
        for ( var i = 0; i < keys.length; ++i ) {
          this.dao.put(msgs[keys[i]]);
        }
        return msgs;
      }
    },
    {
      name: 'achromeMessages',
      code: function(ret) {
        var msgs = {};
        this.dao.select({
          put: function(msg) { msgs[msg.id] = msg.toChromeMessage(); },
          eof: function() { ret(msgs); }
        });
      }
    },
    {
      name: 'amessages',
      code: function(ret) {
        this.abuildMessages_(ret);
      }
    },
    {
      name: 'amessagesFile',
      code: function(dataId, ret) {
        this.abuildMessages_(function(msgs) {
          msgs.id = dataId;
          ret('__DATA(' +
              JSONUtil.compact.where(NOT_TRANSIENT).stringify(msgs) + ');');
        });
      }
    },
    {
      name: 'abuildMessages_',
      code: function(ret) {
        var msgs = this.messageBundleFactory();
        var arr = msgs.messages;
        this.dao.select({
          put: function(msg) { arr.push(msg); }.bind(this),
          eof: function() { ret(msgs); }
        });
      }
    },
    {
      name: 'ai18n',
      code: function(format, ret) {
        throw 'ERROR: i18n output format "' + format + '" not recognized';
      }
    }
  ]
});

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
  name: 'ChromeMessagesInjector',
  package: 'foam.i18n',
  extends: 'foam.i18n.Visitor',

  imports: [ 'warn' ],

  methods: [
    {
      name: 'visitMessage',
      code: function(model, msg, msgIdx) {
        this.maybeSetMessage(
            model.messages[msgIdx],
            'value',
            this.idGenerator.getMessageId(model, msg));
      }
    },
    {
      name: 'visitAction',
      code: function(model, action, actionIdx) {
        if ( action.translationHint ) {
          if ( action.label ) {
            this.maybeSetMessage(
                model.actions[actionIdx],
                'label',
                this.idGenerator.getActionTextLabelId(model, action));
          }
          if ( action.speechLabel ) {
            this.maybeSetMessage(
                model.actions[actionIdx],
                'speechLabel',
                this.idGenerator.getActionSpeechLabelId(model, action));
          }
        }
      }
    },
    {
      name: 'maybeSetMessage',
      code: function(obj, objKey, msgKey) {
        var i18nMessage =
            GLOBAL.chrome &&
            GLOBAL.chrome.i18n &&
            GLOBAL.chrome.i18n.getMessage &&
            GLOBAL.chrome.i18n.getMessage(msgKey);
        if ( i18nMessage ) {
          obj[objKey] = i18nMessage;
        } else {
          this.warn('ChromeMessagesInjector: "' + msgKey +
              '": No such message');
        }
      }
    }
  ]
});

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
  package: 'foam.i18n',
  name: 'GlobalController',

  requires: [
    'foam.i18n.IdGenerator',
    'foam.i18n.MessagesExtractor',
    'foam.i18n.MessagesInjector',
    'foam.i18n.ChromeMessagesInjector'
  ],

  properties: [
    {
      name: 'idGenerator',
      factory: function() {
        return this.IdGenerator.create();
      }
    },
    {
      name: 'extractor',
      lazyFactory: function() {
        return this.MessagesExtractor.create({
          idGenerator$: this.idGenerator$
        });
      }
    },
    {
      name: 'injector',
      lazyFactory: function() {
        if ( GLOBAL.chrome && GLOBAL.chrome.runtime &&
            GLOBAL.chrome.runtime.id ) {
          return this.ChromeMessagesInjector.create({
            idGenerator$: this.idGenerator$
          });
        } else {
          return this.MessagesInjector.create({
            idGenerator$: this.idGenerator$
          });
        }
      }
    }
  ],

  methods: [
    {
      name: 'avisitAllCurrentModels',
      code: function(ret, visitors) {
        var par = [], modelNames = Object.keys(USED_MODELS);
        for ( var i = 0; i < modelNames.length; ++i ) {
          par.push(this.avisitModel(visitors, lookup(modelNames[i])));
        }
        return apar.apply(null, par);
      }
    },
    {
      name: 'avisitAllKnownModels',
      code: function(visitors) {
        var par = [];
        var modelNames, i;

        modelNames = Object.keys(USED_MODELS);
        for ( i = 0; i < modelNames.length; ++i ) {
          par.push(this.avisitModel(visitors, lookup(modelNames[i])));
        }
        modelNames = Object.keys(UNUSED_MODELS);
        for ( i = 0; i < modelNames.length; ++i ) {
          par.push(this.avisitModel(visitors, lookup(modelNames[i])));
        }

        return apar.apply(null, par);
      }
    },
    {
      name: 'avisitModel',
      code: function(visitors, model) {
        var par = [];
        for ( var i = 0; i < visitors.length; ++i ) {
          par.push(visitors[i].avisitModel(model));
        }
        return apar.apply(null, par);
      }
    }
  ]
});

X.arequire('foam.i18n.GlobalController')(function(GlobalController) {
  var i18nGC = GlobalController.create();
  GLOBAL.X.i18nModel = function(ret, model, X) {
    i18nGC.avisitModel([
      // i18nGC.extractor,
      i18nGC.injector
    ], model)(ret);
  };
});
CLASS({package: "foam.apps.calc",name: "Calc",requires: ["foam.apps.calc.CalcView","foam.apps.calc.History","foam.apps.calc.NumberFormatter","foam.graphics.ActionButtonCView","foam.graphics.CViewView","foam.input.touch.GestureManager","foam.input.touch.TouchManager","foam.ui.animated.Label","foam.ui.md.Flare","foam.ui.DAOListView","AbstractDAO"],exports: ["gestureManager","touchManager"],properties: [{name: "numberFormatter",factory: function() { return this.NumberFormatter.create(); }},{name: "degreesMode"},{name: "memory",defaultValue: 0},{name: "a1",defaultValue: 0},{name: "a2",defaultValue: ""},{name: "editable",defaultValue: true},{name: "statusRipples",defaultValue: true},{name: "op",factory: function() { return this.DEFAULT_OP }},{model_:"ArrayProperty",name: "history",type: "Array",view: "foam.ui.DAOListView",factory: function() { return [].sink; }},{model_:"StringProperty",name: "row1",type: "String",view: "foam.ui.animated.Label"},{name: "touchManager",factory: function() {
        // TODO(braden): HACK This should be just exporting the property, but
        // the context is not properly passed into views created using <foam>
        // tags right now. Clean up this and gestureManager below.
        var tm = this.TouchManager.create();
        window.X.touchManager = tm;
        return tm;
      }},{name: "gestureManager",factory: function() {
        var gm = this.GestureManager.create();
        window.X.gestureManager = gm;
        return gm;
      }}],actions: [{model_:"foam.apps.calc.Num",n: 1},{model_:"foam.apps.calc.Num",n: 2},{model_:"foam.apps.calc.Num",n: 3},{model_:"foam.apps.calc.Num",n: 4},{model_:"foam.apps.calc.Num",n: 5},{model_:"foam.apps.calc.Num",n: 6},{model_:"foam.apps.calc.Num",n: 7},{model_:"foam.apps.calc.Num",n: 8},{model_:"foam.apps.calc.Num",n: 9},{model_:"foam.apps.calc.Num",n: 0},{model_:"foam.apps.calc.Binary",name: "div",speechLabel: "divide",keyboardShortcuts: ["/"],f: function (a1, a2) { return a1 / a2; },label: "÷"},{model_:"foam.apps.calc.Binary",name: "mult",speechLabel: "multiply",keyboardShortcuts: ["*","x"],f: function (a1, a2) { return a1 * a2; },label: "×"},{model_:"foam.apps.calc.Binary",name: "plus",speechLabel: "plus",keyboardShortcuts: ["+"],f: function (a1, a2) { return a1 + a2; },label: "+"},{model_:"foam.apps.calc.Binary",name: "minus",speechLabel: "minus",keyboardShortcuts: ["-"],f: function (a1, a2) { return a1 - a2; },label: "–"},{name: "ac",label: "AC",speechLabel: "all clear",code: function() {
        this.row1     = '';
        this.a1       = '0';
        this.a2       = '';
        this.editable = true;
        this.op       = this.DEFAULT_OP;
        this.history = [].sink;
        // TODO(kgr): Move to CalcView
        if ( this.X.$$('calc-display')[0] && this.statusRipples ) {
          var now = Date.now();
          if ( this.lastFlare_ && now-this.lastFlare_ < 1000 ) return;
          this.lastFlare_ = now;
          if (this.statusRipples) {
            this.Flare.create({
              element: this.X.$$('calc-display')[0],
              color: '#2196F3' /* blue */
            }).fire();
          }
          this.X.window.getSelection().removeAllRanges();
        }
      },keyboardShortcuts: ["a","c"],translationHint: "all clear (calculator button label)"},{name: "sign",label: "+/-",speechLabel: "negate",code: function() { this.a2 = - this.a2; },keyboardShortcuts: ["n"],translationHint: "switch positive/negative sign of number"},{name: "point",speechLabel: "point",labelFn: function() { return this.numberFormatter.useComma ? ',' : '.'; },code: function() {
        if ( ! this.editable ) {
          this.push('0.');
          this.editable = true;
        } else if ( this.a2.toString().indexOf('.') == -1 ) {
          this.a2 = (this.a2 ? this.a2 : '0') + '.';
          this.editable = true;
        }
      },keyboardShortcuts: [".",","],translationHint: "decimal point"},{name: "equals",label: "=",speechLabel: "equals",code: function() {
        if ( typeof(this.a2) === 'string' && this.a2 == '' ) return; // do nothing if the user hits '=' prematurely
        if ( this.op == this.DEFAULT_OP ) {
          var last = this.history[this.history.length-1];
          if ( ! last || last.op === this.DEFAULT_OP ) return;
          if ( last.op.binary ) {
            this.push(this.a2);
            this.a2 = last.a2;
          } else {
            this.a1 = this.a2;
          }
          this.op = last.op;
        }
        this.push(this.op(parseFloat(this.a1), parseFloat(this.a2)));
        this.editable = false;
      },keyboardShortcuts: ["=",13],translationHint: "compute operation and display result"},{name: "backspace",label: "⌫",speechLabel: "backspace",code: function() {
        // This block will make backspace act like all-clear if the user has done a ctrl-A
        // to select all of the text.
        var selection = this.X.window.getSelection().toString();
        if ( selection && selection.split('\n').length == this.history.length + 1 ) {
          this.ac();
          return;
        }

        if ( ! this.editable ) return;

        if ( this.a2.toString().length ) {
          this.a2 = this.a2.toString().substring(0, this.a2.length-1);
        } else {
          this.op = this.DEFAULT_OP;
        }
      },keyboardShortcuts: [8],translationHint: "delete one input character"},{name: "pi",label: "π",code: function() { this.a2 = Math.PI; },keyboardShortcuts: ["p"],translationHint: "mathematical constant, pi"},{name: "e",label: "e",code: function() { this.a2 = Math.E; },keyboardShortcuts: ["e"],translationHint: "mathematical constant, e"},{name: "percent",label: "%",speechLabel: "percent",code: function() { this.a2 /= 100.0; },keyboardShortcuts: ["%"],translationHint: "convert number to percentage"},{model_:"foam.apps.calc.Unary",name: "inv",speechLabel: "inverse",keyboardShortcuts: ["i"],f: function (a) { return 1.0/a; },label: "1/x"},{model_:"foam.apps.calc.Unary",name: "sqroot",speechLabel: "square root",f: function(a) { return Math.sqrt(a); },label: "√"},{model_:"foam.apps.calc.Unary",name: "square",speechLabel: "x squared",keyboardShortcuts: ["@"],f: function (a) { return a*a; },label: "x²"},{model_:"foam.apps.calc.Unary",name: "ln",speechLabel: "natural logarithm",f: function(a) { return Math.log(a); }},{model_:"foam.apps.calc.Unary",name: "exp",speechLabel: "e to the power of n",f: function(a) { return Math.exp(a); },label: "eⁿ"},{model_:"foam.apps.calc.Unary",name: "log",speechLabel: "log base 10",f: function(a) { return Math.log(a) / Math.LN10; }},{model_:"foam.apps.calc.Binary",name: "root",speechLabel: "the enth root of y",f: function(a1, a2) { return Math.pow(a2, 1/a1); },label: "ⁿ √Y"},{model_:"foam.apps.calc.Binary",name: "pow",speechLabel: "y to the power of n",keyboardShortcuts: ["^"],f: function(a1, a2) { return Math.pow(a1, a2); },label: "yⁿ"},{name: "deg",speechLabel: "switch to degrees",code: function() {
        this.degreesMode = true;
        // update aria label to match the text inside
        document
          .getElementById('deg-label')
          .setAttribute('aria-label', this.model_.DEG.label);
      },translationHint: "short form for \"degrees\" calculator mode"},{name: "rad",speechLabel: "switch to radians",code: function() {
        this.degreesMode = false;
        // update aria label to match the text inside
        document
          .getElementById('deg-label')
          .setAttribute('aria-label', this.model_.RAD.label);
      },translationHint: "short form for \"radians\" calculator mode"},{model_:"foam.apps.calc.Unary",name: "sin",speechLabel: "sine",f: function(a) { return Math.sin(this.degreesMode ? a * Math.PI / 180 : a) }},{model_:"foam.apps.calc.Unary",name: "cos",speechLabel: "cosine",f: function(a) { return Math.cos(this.degreesMode ? a * Math.PI / 180 : a) }},{model_:"foam.apps.calc.Unary",name: "tan",speechLabel: "tangent",f: function(a) { return Math.tan(this.degreesMode ? a * Math.PI / 180 : a) }},{model_:"foam.apps.calc.Unary",name: "asin",speechLabel: "arcsine",f: function(a) { return Math.asin(a) * ( this.degreesMode ? 180 / Math.PI : 1); }},{model_:"foam.apps.calc.Unary",name: "acos",speechLabel: "arccosine",f: function(a) { return Math.acos(a) * ( this.degreesMode ? 180 / Math.PI : 1); }},{model_:"foam.apps.calc.Unary",name: "atan",speechLabel: "arctangent",f: function(a) { return Math.atan(a) * ( this.degreesMode ? 180 / Math.PI : 1); }},{model_:"foam.apps.calc.Unary",name: "fact",speechLabel: "factorial",keyboardShortcuts: ["!"],f: function (n) { return this.factorial(n); },label: "x!"},{model_:"foam.apps.calc.Binary",name: "mod",speechLabel: "modulo",f: function (a1, a2) { return a1 % a2; }},{model_:"foam.apps.calc.Binary",name: "p",speechLabel: "permutation",f: function (n,r) { return this.permutation(n,r); },label: "nPr"},{model_:"foam.apps.calc.Binary",name: "c",speechLabel: "combination",f: function (n,r) { return this.combination(n,r); },label: "nCr"},{model_:"foam.apps.calc.Unary",name: "round",speechLabel: "round",f: function(a) { return Math.round(a); },label: "rnd"},{name: "rand",speechLabel: "random",code: function() { this.a2 = Math.random(); },translationHint: "generate random number"},{model_:"foam.apps.calc.Unary",name: "store",speechLabel: "store in memory",f: function (n) { this.memory = n; return n; },label: "a="},{name: "fetch",label: "a",speechLabel: "fetch from memory",code: function() { this.a2 = this.memory; },translationHint: "load memorized number"},{name: "toggleStatusRipples",code: function() {
        this.statusRipples = !this.statusRipples;
      },keyboardShortcuts: ["f"]}],constants: [{name: "MAX_HISTORY",value: 30},{name: "DEFAULT_OP",value: function(a1, a2) { return a2; }}],messages: [{model_:"Message",name: "CalcName",value: "Calculator",translationHint: "name of application for performing simple calculations"},{model_:"Message",name: "CalcHistory",value: "Calculator History",translationHint: "name of the section of the calculator which contains a history of recent computations"},{model_:"Message",name: "CalcDisplay",value: "Calculator Display",translationHint: "name of the section of the calculator which shows the current number being built"},{model_:"Message",name: "CalcKeypad",value: "Keypad",translationHint: "name of the section of the calculator which contains the action buttons"}],methods: [function init() {
      this.SUPER();

      this.DEFAULT_OP.label = '';

      if ( ! 'log10' in Math ) Math.log10 = function(a) { return Math.log(a) / Math.LN10; };

      Events.dynamicFn(function() { this.op; this.a2; }.bind(this), EventService.framed(function() {
        if ( Number.isNaN(this.a2) ) this.error();
        var a2 = this.numberFormatter.formatNumber(this.a2);
        this.row1 = this.op.label + ( ( this.op.label && a2 ) ? '&nbsp;' : '' ) + a2;
      }.bind(this)));
    },function gamma(z) {
      return Math.sqrt(2 * Math.PI / z) * Math.pow((1 / Math.E) * (z + 1 / (12 * z - 1 / (10 * z))), z);
    },function factorial(n) {
      if ( n > 170 ) {
        this.error();
        return 1/0;
      }
      n = parseFloat(n);
      if ( ! Number.isInteger(n) ) return this.gamma(n+1);
      var r = 1;
      while ( n > 0 ) r *= n--;
      return r;
    },function permutation(n, r) { return this.factorial(n) / this.factorial(n-r); },function combination(n, r) { return this.permutation(n, r) / this.factorial(r); },function error() {
      // TODO(kgr): Move to CalcView
      if ( this.X.$$('calc-display')[0] ) setTimeout(this.Flare.create({
        element: this.X.$$('calc-display')[0],
        color: '#f44336' /* red */
      }).fire, 100);
      this.history.put(this.History.create({
        op: this.op,
        a2: this.a2,
        sayEquals: this.shouldSayEqual(),
        numberFormatter: this.numberFormatter
      }));
      this.a1   = 0;
      this.a2   = '';
      this.op   = this.DEFAULT_OP;
      this.row1 = '';
      this.editable = true;
    },function shouldSayEqual() {
      // First ever entry should never have equals.
      if (this.history.length === 0) {
        return false;
      }
      // Any line with a operator (+,- etc.) should never.
      if (this.op.label) {
        return false;
      }
      // If the previous line announced equal this one should not.
      if (this.history[this.history.length -1].sayEquals) {
        return false;
      }
      return true;
    },function push(a2, opt_op) {
      if ( a2 != this.a2 ||
           ( opt_op || this.DEFAULT_OP ) != this.op )
        this.row1 = '';
      this.history.put(this.History.create({
        op: this.op,
        a2: this.a2,
        sayEquals: this.shouldSayEqual(),
        numberFormatter: this.numberFormatter
      }));
      while ( this.history.length > this.MAX_HISTORY ) this.history.shift();
      this.a1 = this.a2;
      this.op = opt_op || this.DEFAULT_OP;
      this.a2 = a2;
    },function replace(op) { this.op = op || this.DEFAULT_OP; }],translationHint: "Calculator"})
CLASS({package: "foam.apps.calc",name: "CalcView",extends: "foam.ui.View",requires: ["foam.apps.calc.CalcButton","foam.apps.calc.CalcSpeechView","foam.apps.calc.Fonts","foam.apps.calc.HistoryCitationView","foam.apps.calc.MainButtonsView","foam.apps.calc.NumberFormatter","foam.apps.calc.SecondaryButtonsView","foam.apps.calc.TertiaryButtonsView","foam.ui.SlidePanel","foam.ui.animated.Label"],imports: ["document"],exports: ["data"],properties: [{model_:"StringProperty",name: "row1Formatted",type: "String",preSet: function(_, n) {
        return this.numberFormatter.i18nNumber(n);
      },view: "foam.ui.animated.Label"},{name: "data",postSet: function() {
        this.numberFormatter = this.data.numberFormatter;
        Events.follow(this.data.row1$, this.row1Formatted$);
      }},{name: "installFonts_",visibility: "hidden",hidden: true,factory: function() {
        return this.document.head.querySelector('link[rel=stylesheet][href*=Roboto]') ?
            '' : this.Fonts.create();
      }},{model_:"IntProperty",name: "animating_",type: "Int",postSet: function(old, nu) {
        if ( nu || old === nu || ! this.$ ) return;
        // After animations: Set "top" property of inner calc display to prevent
        // over-scrolling.
        var outerHeight = this.$outer.clientHeight;
        var innerHeight = this.$inner.clientHeight;
        this.$inner.style.top = innerHeight < outerHeight ?
            'calc(100% - ' + innerHeight + 'px)' :
            '0px';
      },defaultValue: false},{name: "$inner",getter: function() { return this.$.querySelector('.inner-calc-display'); }},{name: "$outer",getter: function() { return this.$.querySelector('.calc-display'); }}],methods: [function initHTML() {
      this.SUPER();

      this.document.addEventListener('paste', this.onPaste);
      this.document.addEventListener('copy',  this.onCopy);
      this.document.addEventListener('keyup',  this.onKeyUp);

      // This block causes the calc-display to scroll when updated.
      // To remove this feature replace the .inner-calc-display 'transition:' and
      // 'top:' styles with 'bottom: 0'.
      var move = EventService.framed(EventService.framed(function() {
        if ( ! this.$ ) return;
        var value = DOMValue.create({element: this.$outer, property: 'scrollTop' });
        Movement.compile([
            function() { ++this.animating_; }.bind(this),
            [200, function() { value.value = this.$inner.clientHeight; }.bind(this)],
          function() { --this.animating_; }.bind(this)
        ])();
      }.bind(this)));

      Events.dynamicFn(function() { this.data.op; this.data.history; this.data.a1; this.data.a2; }.bind(this), move);

      this.X.window.addEventListener('resize', move);

      this.$.querySelector('.keypad').addEventListener('mousedown', function(e) { e.preventDefault(); return false; });
      this.document.body.setAttribute('aria-label', this.data.model_.CALC_NAME.value);
    },function addArrowData(e, data) {
      e.setAttribute('data-arrow-up', data[0])
      e.setAttribute('data-arrow-down', data[1])
      e.setAttribute('data-arrow-left', data[2])
      e.setAttribute('data-arrow-right', data[3])
    }],listeners: [{name: "onPaste",code: function(evt) {
        var CMD = { '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '+': 'plus', '-': 'minus', '*': 'mult', '/': 'div', '%': 'percent', '=': 'equals' };

        CMD[this.data.numberFormatter.useComma ? ',' : '.'] = 'point';

        var data = evt.clipboardData.getData('text/plain');
        for ( var i = 0 ; i < data.length ; i++ ) {
          var c = data.charAt(i);
          // If history is empty and the first character is '-' then insert a 0 to subtract from
          if ( c === '-' && ! i && ! this.data.history.length && ! this.data.row1 ) this.data['0']();
          var cmd = CMD[c];
          if ( cmd ) this.data[cmd]();
        }
      },whenIdle: true},{name: "onCopy",code: function(evt) {
        // Unless the user has done a ctrl-A to "select all", change the selection
        // to just row1.
        if ( evt.target.className !== 'history' )
	        document.getSelection().selectAllChildren(this.row1FormattedView.$);
      }},{name: "onKeyUp",code: function(evt) {
        const curr = this.document.activeElement;
        const f1 = document.querySelector('.f1')

        // [up, down, left, right]
        this.addArrowData(document.body, [null,'.f1',null,null])
        this.addArrowData(f1, ['body','[aria-label="7"]',null,null])

        // Since history is dynamic regenerate that part of it
        // also fix the aria label of the first
        const historyNodeList = document.querySelectorAll('.history');
        const history = Array(historyNodeList.length).fill(0).map((_,i) => historyNodeList[i])

        let prev = {elem: document.body, selector: 'body'};

        history.map((e,i) => {
          const selector = '.inner-calc-display>span>.history:nth-of-type('+(i+1)+')'
          prev.elem.setAttribute('data-arrow-down', selector);
          this.addArrowData(e, [prev.selector,'.f1',null,null]);
          f1.setAttribute('data-arrow-up', selector);
          prev = {elem: e, selector}
        })

        if (evt.code === 'ArrowUp' && curr.dataset.arrowUp !== 'null')
          document.querySelector(curr.dataset.arrowUp).focus()
        if (evt.code === 'ArrowDown' && curr.dataset.arrowDown !== 'null')
          document.querySelector(curr.dataset.arrowDown).focus()
        if (evt.code === 'ArrowLeft' && curr.dataset.arrowLeft !== 'null')
          document.querySelector(curr.dataset.arrowLeft).focus()
        if (evt.code === 'ArrowRight' && curr.dataset.arrowRight !== 'null')
          document.querySelector(curr.dataset.arrowRight).focus()
      }}],templates: [{name: "CSS",code: ConstantTemplate(".CalcView *{box-sizing:border-box;outline:none}.CalcView{-webkit-user-select:none;-webkit-font-smoothing:antialiased;font-family:Roboto, 'Helvetica Neue', Helvetica, Arial;font-size:30px;font-weight:300;height:100%;position:fixed;margin:0;padding:0;width:100%}.CalcView ::-webkit-scrollbar{display:none}.CalcView ::-webkit-scrollbar-thumb{display:none}.calc{background-color:#eee;border:0;display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;height:100%;margin:0;padding:0px}.deg, .rad{background-color:#eee;color:#111;font-size:22px;font-weight:400;opacity:0;margin-left:8px;margin-right:10px;transition:opacity 0.8s}.active{opacity:1;z-index:2}.calc-display, .calc-display:focus{border:none;letter-spacing:1px;line-height:36px;margin:0;min-width:140px;padding:0 25pt 2pt 25pt;text-align:right;-webkit-user-select:text;overflow-y:scroll;overflow-x:hidden}.edge{background:linear-gradient(to bottom, rgba(240, 240, 240, 1) 0%, rgba(240, 240, 240, 0) 100%);height:20px;position:absolute;top:0;width:100%;z-index:1}.calc .buttons{-webkit-flex:1 1 100%;flex:1 1 100%;width:100%;height:252px}.button-row{display:-webkit-flex;display:flex;-webkit-flex-direction:row;flex-direction:row;-webkit-flex-wrap:nowrap;flex-wrap:nowrap;-webkit-flex:1 1 100%;flex:1 1 100%;-webkit-justify-content:space-between;justify-content:space-between}.button{-webkit-flex-grow:1;flex-grow:1;-webkit-justify-content:center;justify-content:center;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;background-color:#333}.rhs-ops{border-left-width:1px;border-left-style:solid;border-left-color:rgb(68, 68, 68);background:#4a4a4a}.rhs-ops .button{background-color:#4a4a4a}.history{padding:2px;padding-right:7pt;width:calc(100% - 7pt - 2px)}.history:focus-within{padding:0px;padding-right:calc(7pt - 2px);border:2px solid rgba(52, 153, 128, 0.65);border-radius:10px}.button-column{display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-flex-wrap:nowrap;flex-wrap:nowrap}.inner-calc-display{position:absolute;right:15pt;top:100%;width:calc(100% - 17pt);margin:1pt 0pt;padding:11px 2px}.inner-calc-display:focus{border:2px solid rgba(52, 153, 128, 0.65);border-radius:10px;padding:9px 0px}.calc-display{-webkit-flex-grow:5;flex-grow:5;position:relative}.secondaryButtons{padding-left:30px;background:#00796b}.secondaryButtons .button{background:#00796b}.tertiaryButtons{padding-left:35px;background:#1de9b6}.tertiaryButtons .button{background:#1de9b6}.keypad{-webkit-flex-grow:0;flex-grow:0;-webkit-flex-shrink:0;flex-shrink:0;margin-bottom:-4px;z-index:5;padding-top:4px}.keypad:focus{border-top:4px solid rgba(52, 153, 128, 0.45);padding-top:0px}.calculator-display{width:calc(100% - 4px);height:2.5rem}.calculator-display:focus{border-radius:10px;border:2px solid rgba(52, 153, 128, 0.65)}.alabel{font-size:30px}.alabel:focus-within{background:#999}.calc hr{border-style:outset;opacity:0.5}.calc hr:focus{border-style:outset;opacity:1}.f1{margin-left:calc(-13pt - 2px)}.f1:focus{margin-left:calc(-13pt - 4px)}.inner-calc-display:focus .f1{margin-left:calc(-13pt - 4px)}#deg-label{position:absolute;z-index:1}"),language: "css"},{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n        ',
 this.CalcSpeechView.create({calc: this.data}) ,
'\n        \n        ');
 X.registerModel(this.CalcButton, 'foam.ui.ActionButton'); ;out('\n        <div id="',
 self.id,
'" class="CalcView">\n        <div style="position: relative; z-index: 1;" tabindex="-1" aria-hidden="true">\n          <div\n            id="deg-label"\n          >\n            <span\n              style="top: 15px;left: 0;position: absolute; z-index: 1;"\n              id="',

                  this.setClass('active', function() {
                    return ! this.data.degreesMode;
                  })
                ,
'"\n              class="rad">\n              ',
this.data.model_.RAD.label,
'\n            </span>\n            <span\n              style="top: 15px;position: absolute; z-index: 1;"\n              id="',

                this.setClass('active', function() {
                  return   this.data.degreesMode;
                }) ,
'"\n              class="deg">\n                ',
this.data.model_.DEG.label,
'\n            </span>\n          </div>\n        </div>\n\n        <div class="edge"></div>\n        <div class="calc">\n          <div class="calc-display">\n            <div class="inner-calc-display" role="list" aria-label="',
escapeHTML(this.data.model_.CALC_HISTORY.value),
'" tabindex="1">\n              ', self.createTemplateView('history', { rowView: 'foam.apps.calc.HistoryCitationView' }),
'\n              <div class="calculator-display" aria-label="',
escapeHTML(this.data.model_.CALC_DISPLAY.value),
'" tabindex="3">\n                ', self.createTemplateView('row1Formatted', {mode: 'read-only', escapeHTML: false}),
'\n              </div>\n            </div>\n          </div>\n          <div class="keypad" aria-label="',
escapeHTML(this.data.model_.CALC_KEYPAD.value),
'" tabindex="3">\n          <div class="edge2"></div>\n          ',
 this.SlidePanel.create({
            data: this.data,
            side: 'right',
            minWidth: 310,
            minPanelWidth: 320,
            panelRatio: 0.55,
            mainView: 'foam.apps.calc.MainButtonsView',
            stripWidth: 30,
            panelView: {
              factory_: 'foam.ui.SlidePanel',
              side: 'right',
              stripWidth: 30,
              minWidth: 320,
              minPanelWidth: 220,
              panelRatio: 3/7,
              mainView: 'foam.apps.calc.SecondaryButtonsView',
              panelView: 'foam.apps.calc.TertiaryButtonsView'
            }
           }) ,
'\n          </div>\n        </div>\n        </div>\n      ');return out.toString();},language: "html"}]})
CLASS({package: "foam.apps.calc",name: "CalcButton",extends: "foam.graphics.ActionButtonCView",properties: [{name: "color",defaultValue: "white"},{name: "background",defaultValue: "#4b4b4b"},{name: "width",defaultValue: 60},{name: "height",defaultValue: 60},{name: "font",defaultValue: "300 28px Roboto"},{name: "role",defaultValue: "button"}],methods: [function init() {
      this.SUPER();
      setTimeout(function() { this.view.paint(); }.bind(this), 1000);
    },function toView_() {
      var v = this.SUPER();
      return v.decorate('toHTML', function(SUPER) { return '<div class="button">' + SUPER.call(this) + '</div>';}, v.toHTML);
    }]})
CLASS({package: "foam.graphics",name: "ActionButtonCView",extends: "foam.graphics.CView",requires: ["foam.ui.md.Halo","foam.input.touch.GestureTarget"],imports: ["gestureManager"],properties: [{name: "action",postSet: function(oldValue, action) {
        //  oldValue && oldValue.removeListener(this.render)
        // action.addListener(this.render);
        this.bindIsAvailableAndEnabled();
      }},{model_:"StringProperty",name: "font",type: "String",defaultValue: ""},{name: "data",postSet: function() {
        this.bindIsAvailableAndEnabled();
      }},{name: "label",defaultValue: ""},{name: "showLabel",defaultValueFn: function() { return this.action.showLabel; }},{name: "iconUrl",defaultValueFn: function() { return this.action.iconUrl; },postSet: function(_, v) { this.image_ && (this.image_.src = v); }},{name: "haloColor",defaultValue: "rgb(241, 250, 65)"},{name: "halo",factory: function() {
        return this.Halo.create({
          alpha: 0,
          r: 10,
          color$: this.haloColor$,
          isEnabled: function() {
            return this.action.isEnabled.call(this.data, this.action);
          }.bind(this)
          /* This gives a ring halo:
          , style: 'ring'
           */
        });
      },postSet: function(old, nu) {
        if ( old ) this.removeChild(old);
        if ( nu ) this.addChild(nu);
      }},{name: "iconWidth",defaultValue: 0},{name: "iconHeight",defaultValue: 0},{name: "radius",defaultValue: 0,postSet: function(_, r) {
        if ( r ) this.width = this.height = 2 * r;
      }},{name: "tapGesture",visibility: "hidden",hidden: true,transient: true,lazyFactory: function() {
        return this.GestureTarget.create({
          containerID: this.view.id,
          handler: this,
          gesture: 'tap'
        });
      }},{name: "className",defaultValueFn: function() {
        return 'actionButtonCView actionButtonCView-' + this.action.name;
      },help: "CSS class name(s), space separated."},{name: "tooltip",defaultValueFn: function() { return this.action.help; }},{name: "speechLabel",defaultValueFn: function() { return this.action.speechLabel; }},{name: "tabIndex"},{name: "arrowNav"},{name: "role"},{name: "ariaPressed",defaultValue: ""},{name: "state_",defaultValue: "default"}],methods: [function init() {
      this.SUPER();

      this.X.dynamicFn(function() {
          this.iconUrl; this.iconWidth; this.iconHeight;
        }.bind(this),
        function() {
         if ( this.iconUrl ) {
           this.image_ = new Image();

           this.image_.onload = function() {
             if ( ! this.iconWidth  ) this.iconWidth  = this.image_.width;
             if ( ! this.iconHeight ) this.iconHeight = this.image_.height;
             this.view.$ && this.view.paint();
           }.bind(this);

           this.image_.src = this.iconUrl;
         }
       }.bind(this));
    },function bindIsAvailableAndEnabled() {
      if ( ! this.action || ! this.data ) return;

      var self = this;
      this.X.dynamicFn(
          function() {
            self.action.isAvailable.call(self.data, self.action);
            self.action.isEnabled.call(self.data, self.action);
          },
          function() {
            // TODO(KGR): When the Action isn't available we hide it by
            // setting the size to zero, which isn't ideal.  Better would be
            // to add a hidden or visibility property to CViews.  When this is done,
            // also simplify CViewView.
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
            if ( self.action.isEnabled.call(self.data, self.action) ) {
              self.alpha = 1.0;
            } else {
              self.alpha = 0.5;
            }
            self.view && self.view.paint();
          });
    },function initCView() {

      if ( this.gestureManager )
        this.gestureManager.install(this.tapGesture);

      // Pressing space when has focus causes a synthetic press
      this.$.addEventListener('keypress', function(e) {
        if ( ( e.charCode == 32) && ! ( e.altKey || e.ctrlKey || e.shiftKey ) ) {
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
        if ( ( ! e.x && ! e.y ) || ! this.gestureManager ) this.tapClick();
      }.bind(this));
    },function destroy( isParentDestroyed ) {
      this.SUPER(isParentDestroyed);
      if ( this.gestureManager ) {
        this.gestureManager.uninstall(this.tapGesture);
      }
    },function erase(c) {
      c.clearRect(0, 0, this.width, this.height);

      // TODO(jacksonic): Why is drawing a circle the default behaviour?
      var r = Math.min(this.width, this.height)/2;
      c.fillStyle = this.background;
      c.beginPath();
      c.arc(this.width/2, this.height/2, r, 0, Math.PI*2, true);
      c.closePath();
      c.fill();
    },function paintSelf(c) {

      if ( this.font ) c.font = this.font;

      c.globalAlpha  = this.alpha;
      c.textAlign    = 'center';
      c.textBaseline = 'middle';
      c.fillStyle    = this.color;

      if ( this.image_ && this.image_.complete ) {
        c.drawImage(
          this.image_,
          this.x + (this.width  - this.iconWidth)/2,
          this.y + (this.height - this.iconHeight)/2,
          this.iconWidth,
          this.iconHeight);
      } else {
        c.fillText(
          this.label || this.action.labelFn.call(this.data, this.action),
          this.x+this.width/2,
          this.y+this.height/2);
      }
    }],listeners: [{name: "tapClick",code: function() { this.action.maybeCall(this.X, this.data); }}]})
CLASS({package: "foam.ui.md",name: "Halo",extends: "foam.graphics.Circle",properties: [{name: "style",defaultValue: "solid",postSet: function(_, style) {
        if ( style !== this.RING_INNER_COLOR ) this.setColorAndBorder();
      }},{name: "state_",defaultValue: "default"},{name: "nextColor_",defaultValueFn: function() { return this.color; }},{name: "color",preSet: function(old, nu) {
        if ( this.state_ !== 'default' ) {
          // store it for next animation
          this.nextColor_ = nu;
          return old;
        }
        return nu;
      }},{name: "easeInTime",defaultValue: 200},{name: "focusType",defaultValue: null},{name: "easeOutTime",defaultValue: 150},{name: "startAlpha",defaultValue: 0.8},{name: "pressedAlpha",defaultValue: 0.4},{name: "finishAlpha",defaultValue: 0},{name: "alpha",defaultValue: 0},{name: "recentering",defaultValue: true},{name: "animateGrowth",defaultValue: true},{model_:"FunctionProperty",name: "isEnabled",type: "Function",defaultValue: function() { return true; }}],constants: [{name: "RING_INNER_COLOR",value: "rgba(0, 0, 0, 0)"}],methods: [function setColorAndBorder() {
        if ( this.style === 'ring' ) {
          var color = this.color;
          this.border = color;
          this.borderWidth = 12;
          this.color = this.RING_INNER_COLOR;
        }
      },function initCView() {
        this.$.addEventListener('mousedown',   this.onMouseDown);
        this.$.addEventListener('mouseup',     this.onMouseUp);
        this.$.addEventListener('mouseleave',  this.onMouseUp);
        this.$.addEventListener('focus',       this.focus);
        this.$.addEventListener('blur',        this.blur);
        this.$.addEventListener('touchstart',  this.onMouseDown);
        this.$.addEventListener('touchend',    this.onMouseUp);
        this.$.addEventListener('touchleave',  this.onMouseUp);
        this.$.addEventListener('touchcancel', this.onMouseUp);
      },function isTouchInRect(t, rect) {
        return t.clientX >= rect.left && t.clientX <= rect.right &&
          t.clientY >= rect.top && t.clientY <= rect.bottom;
      },function paintHalo(evt, focus) {
        if ( this.state_ !== 'default' || ! this.isEnabled() ) return;

        this.state_ = 'pressing';

        if ( evt.type === 'touchstart' ) {
          var rect = this.$.getBoundingClientRect(), touchFound = false, t;
          for ( var i = 0; i < evt.touches.length; ++i ) {
            t = evt.touches[i];
            if ( this.isTouchInRect(t, rect) ) { touchFound = true; break; }
          }
          if ( touchFound ) {
            this.x = (t.clientX - rect.left);
            this.y = (t.clientY - rect.top);
          } else {
            // Default to center of element.
            console.warn('No touches', evt.touches, 'in element rect', rect);
            this.x = rect.width / 2;
            this.y = rect.height / 2;
          }
        } else {
          this.x = evt.offsetX;
          this.y = evt.offsetY;
        }
        if ( this.animateGrowth ) {
          this.r = 2;
        } else if ( this.recentering ) {
          this.x = this.parent.width/2;
          this.y = this.parent.height/2;
          this.r = Math.min(28, Math.min(this.$.clientWidth, this.parent.height)/2);
        } else {
          this.r = Math.max(28, Math.max(this.$.clientWidth, this.parent.height));
        }
        this.alpha = this.startAlpha;
        const recentering = this.recentering;
        this.X.animate(this.easeInTime, function() {
          this.alpha = this.pressedAlpha;
          if ( !this.animateGrowth ) return;
          if ( recentering ) {
            this.x = this.parent.width/2;
            this.y = this.parent.height/2;
            this.r = Math.min(28, Math.min(this.$.clientWidth, this.parent.height)/2);
          } else {
            this.r = Math.max(28, Math.max(this.$.clientWidth, this.parent.height));
          }
        }.bind(this), undefined, function() {
          if ( this.state_ === 'cancelled' ) {
            this.state_ = 'pressed';
            this.onMouseUp();
          } else {
            this.state_ = 'pressed';
          }
        }.bind(this))();
      },function clearHalo() {
        // This line shouldn't be necessary but we're getting stray
        // onMouseUp events when the cursor moves over the button.
        if ( this.state_ === 'default' ) return;

        if ( this.state_ === 'pressing' ) { this.state_ = 'cancelled'; return; }
        if ( this.state_ === 'cancelled' ) return;
        this.state_ = 'released';

        this.X.animate(
          this.easeOutTime,
          function() { this.alpha = this.finishAlpha; }.bind(this),
          Movement.easeIn(.5),
          function() {
            if ( this.state_ === 'released' ) {
              this.state_ = 'default';
              this.color = this.nextColor_;
            }
          }.bind(this))();

        return;
      }],listeners: [{name: "onMouseDown",code: function(evt) {
        this.focusType = 'mouse';
        this.paintHalo(evt, false);
        this.$.focus();
      }},{name: "focus",code: function(evt) {
        if (this.focusType === 'mouse') return;

        this.focusType = 'keyboard';
        // Save all of the halo properties.
        const save = {
          animateGrowth: this.animateGrowth,
          startAlpha: this.startAlpha,
          easeInTime: this.easeInTime,
          easeOutTime: this.easeOutTime,
        };

        // Update properties to produce a more pleasent focus effect for
        // keyboard focus UI.
        this.animateGrowth = false;
        this.startAlpha = 0.2;
        this.easeInTime = 100;
        this.easeOutTime = 100;
        this.paintHalo(evt, true);

        // Restore.
        this.animateGrowth = save.animateGrowth;
        this.startAlpha = save.startAlpha;
        this.easeInTime = save.easeInTime;
        this.easeOutTime = save.easeOutTime;
      }},{name: "onMouseUp",code: function() {
        // ignore mouse up events if we are focused atm
        if (this.focusType === 'keyboard') return;
        this.clearHalo();
        this.focusType = null;
      }},{name: "blur",code: function() {
        this.clearHalo()
        this.focusType = null;
      }}]})
CLASS({package: "foam.graphics",name: "Circle",extends: "foam.graphics.CView",properties: [{model_:"StringProperty",name: "border",label: "Border Color",type: "String",defaultValue: ""},{name: "borderWidth",defaultValue: 1},{model_:"FloatProperty",name: "r",label: "Radius",type: "Float",defaultValue: 20},{name: "startAngle",defaultValue: 0},{name: "endAngle",defaultValue: 6.283185307179586},{name: "width",defaultValueFn: function() { return 2*(this.r + (this.border ? this.borderWidth : 0)); }},{name: "height",defaultValueFn: function() { return 2*(this.r + (this.border ? this.borderWidth : 0)); }}],methods: [function paintSelf(c) {
      if ( ! c ) return;

      if ( ! this.r ) return;

      if ( this.color ) {
        c.beginPath();
        c.moveTo(0,0);
        c.arc(0, 0, this.r, -this.endAngle, -this.startAngle, false);
        c.closePath();

        c.fillStyle = this.color;
        c.fill();
      }

      this.paintBorder(c);
    },function paintBorder(c) {
      if ( this.border ) {
        c.lineWidth = this.borderWidth;

        c.beginPath();
        c.arc(0, 0, this.r + this.borderWidth/2 - 1, this.startAngle, this.endAngle);
        c.closePath();

        c.strokeStyle = this.border;
        c.stroke();
      }
    },function intersects(c) {
      var r = this.r + c.r;
      if ( this.border ) r += this.borderWidth-2;
      if ( c.border    ) r += c.borderWidth-2;
      return Movement.distance(this.x-c.x, this.y-c.y) <= r;
    }]})
CLASS({package: "foam.graphics",name: "CView",label: "CView",traits: ["foam.patterns.ChildTreeTrait"],requires: ["foam.graphics.PositionedCViewView","foam.graphics.CViewView"],properties: [{name: "view",visibility: "hidden",hidden: true,transient: true,postSet: function(_, view) {
        for ( var key in this.children ) {
          var child = this.children[key];
          child.view = view;
          if ( view ) child.addListener(view.paint);
        }
      }},{name: "children",visibility: "hidden",hidden: true},{name: "$",visibility: "hidden",hidden: true,transient: true,defaultValueFn: function() { return this.view && this.view.$; }},{name: "state",defaultValue: "initial"},{model_:"BooleanProperty",name: "suspended",type: "Boolean",defaultValue: false},{name: "className",defaultValue: "",postSet: function() {
        if ( ! this.$ ) return;
        this.$.className = this.className;
      },help: "CSS class name(s), space separated. Used if adapted with a CViewView."},{model_:"FloatProperty",name: "x",type: "Float",defaultValue: 0},{model_:"FloatProperty",name: "y",type: "Float",defaultValue: 0},{model_:"FloatProperty",name: "a",label: "Rotation",type: "Float",defaultValue: 0},{model_:"FloatProperty",name: "scaleX",type: "Float",defaultValue: 1},{model_:"FloatProperty",name: "scaleY",type: "Float",defaultValue: 1},{name: "canvasX",visibility: "hidden",hidden: true,getter: function() { return this.x + ( this.parent ? this.parent.canvasX : 0 ); }},{name: "canvasY",visibility: "hidden",hidden: true,getter: function() { return this.y + ( this.parent ? this.parent.canvasY : 0 ); }},{model_:"IntProperty",name: "width",type: "Int",defaultValue: 10},{model_:"IntProperty",name: "height",type: "Int",defaultValue: 10},{model_:"FloatProperty",name: "alpha",type: "Float",defaultValue: 1},{model_:"StringProperty",name: "color",label: "Foreground Color",type: "String",defaultValue: "black"},{model_:"StringProperty",name: "background",label: "Background Color",type: "String",defaultValue: "white"},{name: "font"},{model_:"BooleanProperty",name: "clipped",type: "Boolean",defaultValue: false}],methods: [function toView_() { /* Internal. Creates a CViewView wrapper. */
      if ( ! this.view ) {
        var params = {cview: this};
        if ( this.className )   params.className   = this.className;
        if ( this.tooltip )     params.tooltip     = this.tooltip;
        if ( this.speechLabel ) params.speechLabel = this.speechLabel;
        if ( this.tabIndex )    params.tabIndex    = this.tabIndex;
        if ( this.arrowNav )    params.arrowNav    = this.arrowNav;
        if ( this.role )        params.role        = this.role;
        if ( this.ariaPressed ) params.ariaPressed = this.ariaPressed;
        if ( this.data$ )       params.data$       = this.data$;
        this.view = this.CViewView.create(params);
      }
      return this.view;
    },function toGLView_() { /* internal, creates a CViewGLView wrapper for 3d canvases */
      var model = this.X.lookup('foam.graphics.webgl.CViewGLView')
      if ( model ) return model.create({ sourceView: this }, this.Y);
      return '';
    },function toPositionedView_() { /* Internal. Creates a PositionedCViewView wrapper. */
      if ( ! this.view ) {
        var params = {cview: this};
        if ( this.className ) params.className = this.className;
        this.view = this.PositionedCViewView.create(params);
      }
      return this.view;
    },function initCView() { /* Override in submodels for initialization. Callled
          once on first $$DOC{ref:'.paint'} when transitioning from 'initial'
          to 'active' '$$DOC{ref:'.state'}. */ },function write(opt_X) { /* Inserts this $$DOC{ref:'foam.graphics.CView'} into the DOM
                                   with an $$DOC{ref:'foam.graphics.AbstractCViewView'} wrapper. */
      var X = opt_X || this.X;
      X.writeView(this.toView_(), X);
    },function addChild(child) { /* Adds a child $$DOC{ref:'foam.graphics.CView'} to the scene
                                   under this. */
      this.SUPER(child);

      if ( child === this ) debugger;

      if ( this.view ) {
        child.view = this.view;
        child.addListener(this.view.paint);
        try { this.view.paint(); } catch (x) { }
      }
      return this;
    },function removeChild(child) { /* Removes a child from the scene. */
      this.SUPER(child);
      child.view = undefined;
      if ( this.view ) {
        child.removeListener(this.view.paint);
        this.view.paint();
      }
      return this;
    },function removeAllChildren(child) { /* Removes all children from the scene. */
      for ( var i = this.children.length-1 ; i >= 0 ; i-- )
        this.removeChild(this.children[i]);
      return this;
    },function findChildAt(x, y) {
      var c2 = { x: x, y: y, r: 1 };

      var cs = this.children;
      // Start from the end to find the child in the foreground
      for ( var i = cs.length-1 ; i >= 0 ; i-- ) {
        var c1 = cs[i];
        if ( c1.intersects && c1.intersects(c2) ) return c1;
      }
    },function erase(canvas) { /* Wipes the canvas area of this $$DOC{ref:'.'}. Primarily used
                          by the root node to clear the entire canvas, but an opaque child
                          may choose to erase its own area, if required. */
// Why do we do a clearRect()?  It causes problems when opacity isn't 1.
//      canvas.clearRect(0, 0, this.width, this.height);
      canvas.fillStyle = this.background;
      canvas.fillRect(0, 0, this.width, this.height);
    },function paintChildren(c) { /* Paints each child. */
      for ( var i = 0 ; i < this.children.length ; i++ ) {
        var child = this.children[i];
        c.save();
        c.beginPath(); // reset any existing path (canvas.restore() does not affect path)
        child.paint(c);
        c.restore();
      }
    },function paintSelf(canvas) { /* Implement this in sub-models to do your painting. */ },function paint(canvas) { /* Translates the canvas to our ($$DOC{ref:'.x'}, $$DOC{ref:'.y'}),
                          does a $$DOC{ref:'.paintSelf'} then paints all the children. */
      if ( ! this.width || ! this.height ) return;
      if ( this.state === 'initial' ) {
        this.state = 'active';
        this.initCView();
      }
      if ( this.suspended ) return; // we allowed initialization, but if suspended don't paint

      var c = canvas || this.view.canvas;
      c.save();
      c.globalAlpha *= this.alpha;
      this.transform(c);
      if ( this.clipped ) {
        c.rect(0,0,this.width,this.height);
        c.clip();
      }
      this.paintSelf(c);
      this.paintChildren(c);
      c.restore();
    },function transform(canvas) {
      canvas.translate(this.x, this.y);
      canvas.scale(this.scaleX, this.scaleY);
      if ( this.a ) canvas.rotate(this.a);
    },function scale(s) {
      this.scaleX = this.scaleY = s;
    },function mapToParent(point) { /* Maps a coordinate from this to our parents'. */
      point.x += this.x;
      point.y += this.y;
      return point;
    },function mapToCanvas(point) { /* Maps a coordinate from this to the canvas.
                    Useful for sharing a point between sibling or cousin items. */
      this.mapToParent(point);
      if ( this.parent && this.parent.mapToCanvas )
        this.parent.mapToCanvas(point);
      return point;
    },function destroy() {}]})
CLASS({package: "foam.graphics",name: "PositionedCViewView",extends: "foam.graphics.AbstractCViewView",traits: ["foam.ui.layout.PositionedDOMViewTrait"],properties: [{name: "tagName",factory: function() { return 'canvas'; }}],methods: [function init() {
      this.SUPER();
      this.X.dynamicFn(function() {
        this.cview; this.width; this.height;
      }.bind(this), function() {
        if ( ! this.cview ) return;
        this.cview.width  = this.width;
        this.cview.height = this.height;
      }.bind(this));
    },function toHTML() {
      var className = this.className ? ' class="' + this.className + '"' : '';
      return '<canvas id="' + this.id + '"' + className + ' width="' + this.canvasWidth() + '" height="' + this.canvasHeight() + '" ' + this.layoutStyle() + '></canvas>';
    }],listeners: [{name: "resize",code: function() {
        if ( ! this.$ ) return;
        this.$.width        = this.canvasWidth();
        this.$.style.width  = this.styleWidth();
        this.$.height       = this.canvasHeight();
        this.$.style.height = this.styleHeight();
        this.cview.width    = this.width;
        this.cview.height   = this.height;
        this.paint();
      },isFramed: true}]})
CLASS({package: "foam.ui.layout",name: "PositionedDOMViewTrait",traits: ["foam.ui.layout.PositionedViewTrait"],properties: [{name: "tagName",defaultValue: "div"}],methods: [function toHTML() {
       return '<' + this.tagName + ' id="' + this.id + '"' + this.layoutStyle() + this.cssClassAttr() + '>' +
         this.toInnerHTML() +
         '</div>';
     },function layoutStyle() {
       return ' style="' +
         '-webkit-transform:' + this.transform() +
         ';width:' + this.styleWidth() +
         ';height:' + this.styleHeight() +
         ';position:absolute;"';
     },function initHTML() {
       this.SUPER();
       var self = this;
       this.X.dynamicFn(
         function() { self.x; self.y; self.z; },
         this.position);
       this.X.dynamicFn(
         function() { self.width; self.height; },
         this.resize);
       this.$.style.position = 'absolute';
       this.position();
       this.resize();
     },function transform() {
       return 'translate3d(' +
         this.x + 'px,' +
         this.y + 'px,' +
         this.z + 'px)';
     },function styleWidth() { return this.width + 'px'; },function styleHeight() { return this.height + 'px'; }],listeners: [{name: "position",code: function () {
         if ( ! this.$ ) return;
         this.$.style.webkitTransform = this.transform();
       }},{name: "resize",code: function () {
         if ( ! this.$ ) return;
         this.$.style.width  = this.styleWidth();
         this.$.style.height = this.styleHeight();
       }}]})
CLASS({package: "foam.ui.layout",name: "PositionedViewTrait",properties: [{model_:"FloatProperty",name: "x",type: "Float",units: "px",defaultValue: 0},{model_:"FloatProperty",name: "y",type: "Float",units: "px",defaultValue: 0},{model_:"FloatProperty",name: "z",type: "Float",units: "px",defaultValue: 0},{model_:"IntProperty",name: "width",type: "Int",units: "px",defaultValue: 100},{model_:"IntProperty",name: "height",type: "Int",units: "px",defaultValue: 100},{model_:"IntProperty",name: "preferredWidth",type: "Int",units: "px",defaultValue: 100},{model_:"IntProperty",name: "preferredHeight",type: "Int",units: "px",defaultValue: 100}]})
CLASS({package: "foam.graphics",name: "AbstractCViewView",extends: "foam.ui.View",properties: [{name: "cview",postSet: function(_, cview) {
        cview.view  = this;
        this.width  = cview.x + cview.width;
        this.height = cview.y + cview.height;
      }},{name: "className",defaultValue: "",help: "CSS class name(s), space separated."},{model_:"FloatProperty",name: "scalingRatio",type: "Float",preSet: function(_, v) { return v <= 0 ? 1 : v ; },defaultValue: 1},{name: "speechLabel"},{name: "role"},{name: "tabIndex"},{name: "arrowNav"},{name: "ariaPressed",defaultValue: ""},{model_:"IntProperty",name: "width",type: "Int",defaultValue: 100},{model_:"IntProperty",name: "height",type: "Int",defaultValue: 100},{name: "canvas",getter: function() {
        return this.instance_.canvas ?
          this.instance_.canvas :
          this.instance_.canvas = this.$ && this.$.getContext('2d');
      }},{name: "gl",getter: function() {
        return null;
      }}],methods: [function init() { /* Connects resize listeners. */
      this.SUPER();
      this.X.dynamicFn(
        function() { this.scalingRatio; this.width; this.height; }.bind(this),
        this.resize);
    },function styleWidth() { /* The CSS width string */ return (this.width) + 'px'; },function canvasWidth() { /* The scaled width */ return this.width * this.scalingRatio; },function styleHeight() { /* The CSS height string */ return (this.height) + 'px'; },function canvasHeight() { /* The scaled height */ return this.height * this.scalingRatio; },function toString() { /* The description of this. */ return 'CViewView(' + this.cview + ')'; },function toHTML() { /* Creates the canvas element. */
      var className = this.className ? ' class="' + this.className + '"' : '';
      var title     = this.speechLabel ? ' aria-role="button" aria-label="' + this.speechLabel + '"' : '';
      // TabIndex can be '0' which evaluates to false so we directly check
      // if it's undefined.
      const tabIndex  = this.tabIndex !== undefined ? ' tabindex="' + this.tabIndex + '"' : '';
      var arrowNav  = '';

      // Normally to target a button in the calculator display you would need
      // a selector such as
      // [aria-label=translated_btn_label][aria-role='button']
      // This is cumbersome so as a shortcut we allow users to specify a arrow
      // nav selector as [btn_id] and translate that to a actual selector with
      // the logic below.
      function toSelector(s) {
        // If the selector starts with [ then it's a button id, otherwise
        // it's just a standard selector so do nothing.
        if (s && s[0] === '[') {
          let msg = null;
          const btnId = s.substr(1,s.length-2);
          // Look up the button id in the messages file to extract out it's
          // matching aria label.
          if (window.chrome && window.chrome.i18n) {
            msg = window.chrome.i18n.getMessage('Calc_ActionSpeechLabel_'+btnId);
          } else {
            // Silently fail since there is no way to recover from this.
            console.warn('Could not access i18n tools, arrow nav disabled');
            return;
          }
          // If we are targeting a number it has no translated label.
          if (/\[\d\]/.exec(s)) {
            msg = btnId;
          }

          return `[aria-label='${msg}'][aria-role='button']`;

        } else {
          return s;
        }
      }

      if(this.arrowNav) {
        arrowNav += ' data-arrow-up="' + toSelector(this.arrowNav[0]) + '"';
        arrowNav += ' data-arrow-down="' + toSelector(this.arrowNav[1]) + '"';
        arrowNav += ' data-arrow-left="' + toSelector(this.arrowNav[2]) + '"';
        arrowNav += ' data-arrow-right="' + toSelector(this.arrowNav[3]) + '"';
      }
      var role      = this.role ? ' role="' + this.role + '"' : '';
      return '<canvas id="' + this.id + '"' + className + title + tabIndex + role + arrowNav + ' width="' + this.canvasWidth() + '" height="' + this.canvasHeight() + '" style="width:' + this.styleWidth() + ';height:' + this.styleHeight() + ';min-width:' + this.styleWidth() + ';min-height:' + this.styleHeight() + '"></canvas>';
    },function initHTML() { /* Computes the scaling ratio from the window.devicePixelRatio
                              and canvas.backingStoreRatio. */
      if ( ! this.$ ) return;

      this.maybeInitTooltip();

      this.canvas = this.$.getContext('2d');

      var devicePixelRatio = this.X.window.devicePixelRatio || 1;
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
    },function destroy( isParentDestroyed ) { /* Call to clean up this and child views. */
      this.SUPER(isParentDestroyed);
      //if ( this.cview ) this.cview.destroy(isParentDestroyed); // child cviews are in a different tree than we are (the parent BaseView tree)
    }],listeners: [{name: "resize",code: function() {
        if ( ! this.$ ) return;
        this.$.width           = this.canvasWidth();
        this.$.style.width     = this.styleWidth();
        this.$.style.minWidth  = this.styleWidth();
        this.$.height          = this.canvasHeight();
        this.$.style.height    = this.styleHeight();
        this.$.style.minHeight = this.styleHeight();

        this.paint();
      },isFramed: true},{name: "paint",code: function() {
        if ( ! this.$ ) throw EventService.UNSUBSCRIBE_EXCEPTION;
        if (this.ariaPressed !== undefined && this.ariaPressed !== '')
          this.$.setAttribute('aria-pressed', this.ariaPressed);
        this.canvas.save();

        this.canvas.clearRect(0, 0, this.canvasWidth(), this.canvasHeight());
        this.canvas.fillStyle = this.cview.background;
        this.canvas.fillRect(0, 0, this.canvasWidth(), this.canvasHeight());

        this.canvas.scale(this.scalingRatio, this.scalingRatio);
        this.cview.paint(this.canvas);

        this.canvas.restore();
      },isFramed: true}]})
CLASS({package: "foam.ui",name: "View",extends: "foam.ui.DestructiveDataView",traits: ["foam.ui.HTMLViewTrait","foam.ui.U2ViewTrait"],requires: ["Property"],exports: ["propertyViewProperty"],properties: [{name: "propertyViewProperty",type: "Property",defaultValueFn: function() { return this.Property.DETAIL_VIEW; }}]})
CLASS({package: "foam.ui",name: "HTMLViewTrait",label: "HTMLView",requires: ["foam.input.touch.GestureTarget","foam.ui.ActionBorder","foam.ui.PropertyView","foam.ui.AsyncLoadingView"],properties: [{model_:"StringProperty",name: "id",label: "Element ID",type: "String",factory: function() { return this.instance_.id || this.nextID(); }},{model_:"foam.core.types.DocumentInstallProperty",name: "installCSS",documentInstallFn: function(X) {
        for ( var i = 0 ; i < this.model_.templates.length ; i++ ) {
          var t = this.model_.templates[i];
          if ( t.name === 'CSS' ) {
            t.futureTemplate(function() {
              X.addStyle(this);
            }.bind(this));
            return;
          }
        }
      }},{name: "shortcuts",factory: function() { return []; }},{name: "$",labels: ["javascript"],mode: "read-only",visibility: "hidden",hidden: true,getter: function() { return this.X.document.getElementById(this.id); },setter: function() { debugger; },help: "DOM Element."},{name: "tagName",defaultValue: "span"},{name: "className",defaultValue: "",help: "CSS class name(s), space separated."},{name: "tooltip"},{name: "tabIndex"},{name: "speechLabel"},{name: "extraClassName",defaultValue: ""},{name: "propertyViewProperty",defaultValueFn: function() { return this.X.Property.VIEW; }},{name: "initializers_",factory: function() { return []; }},{name: "destructors_",factory: function() { return []; }},{model_:"BooleanProperty",name: "showActions",type: "Boolean",postSet: function(oldValue, showActions) {
        // TODO: No way to remove the decorator.
        if ( ! oldValue && showActions ) {
          this.addDecorator(this.ActionBorder.create());
        }
      },defaultValue: false},{name: "minWidth",defaultValue: 300},{name: "minHeight",defaultValue: 0},{name: "preferredWidth",defaultValue: 400},{name: "preferredHeight",defaultValue: 40},{name: "maxWidth",defaultValue: 10000},{name: "maxHeight",defaultValue: 10000},{name: "$parent",labels: ["javascript"],getter: function() {
        return this.$ ? this.$.parentElement : null;
      }}],constants: [{name: "KEYPRESS_CODES",value: {"8": true,"33": true,"34": true,"37": true,"38": true,"39": true,"40": true}},{name: "NAMED_CODES",value: {"37": "left","38": "up","39": "right","40": "down"}},{name: "ON_HIDE",value: ["onHide"]},{name: "ON_SHOW",value: ["onShow"]}],methods: [function strToHTML(str) {
      /*
        Escape the string to make it HTML safe.
        */
      return XMLUtil.escape(str.toString())
    },function cssClassAttr() {
      /*
        Returns the full CSS class to use for the $$DOC{ref:'foam.ui.View'} DOM element.
       */
      if ( ! this.className && ! this.extraClassName ) return '';

      var s = ' class="';
      if ( this.className ) {
        s += this.className
        if ( this.extraClassName ) s += ' ';
      }
      if ( this.extraClassName ) s += this.extraClassName;

      return s + '"';
    },function bindSubView(view, prop) {
      /*
        Bind a sub-$$DOC{ref:'foam.ui.View'} to a $$DOC{ref:'Property'} of this.
       */
      view.setValue(this.propertyValue(prop.name));
    },function focus() {
      /* Cause the view to take focus. */
      if ( this.$ && this.$.focus ) this.$.focus();
    },function addChild(child) {
      /*
        Maintains the tree structure of $$DOC{ref:'foam.ui.View',usePlural:true}. When
        a sub-$$DOC{ref:'foam.ui.View'} is created, add it to the tree with this method.
      */
      // Checked needed for legacy CViews, remove once they're gone.
      if ( child.toView_ ) child = child.toView_();
      // Check prevents duplicate addChild() calls,
      // which can happen when you use creatView() to create a sub-view (and it calls addChild)
      // and then you write the View using TemplateOutput (which also calls addChild).
      // That should all be cleaned up and all outputHTML() methods should use TemplateOutput.
      if ( this.children.indexOf(child) != -1 ) return;

      return this.SUPER(child);
    },function addShortcut(key, callback, context) {
      /* Add a keyboard shortcut. */
      this.shortcuts.push([key, callback, context]);
    },function nextID() {
      /* Convenience method to return unique DOM element ids. */
      return "view" + (arguments.callee._nextId = (arguments.callee._nextId || 0) + 1);
    },function addInitializer(f) {
      /* Adds a DOM initializer */
      this.initializers_.push(f);
    },function addDestructor(f) {
      /* Adds a DOM destructor. */
      this.destructors_.push(f);
    },function tapClick() {
    },function resize() {
      /* Call when you've changed your size to allow for the possibility of relayout. */
      var e = this.X.document.createEvent('Event');
      e.initEvent('resize', true, true);
      if ( this.$ ) this.X.window.getComputedStyle(this.$);
      this.X.window.dispatchEvent(e);
    },function on(event, listener, opt_id) {
      /*
        <p>To create DOM event handlers, use this method to set up your listener:</p>
        <p><code>this.on('click', this.myListener);</code></p>
      */
      opt_id = opt_id || this.nextID();
      listener = listener.bind(this);

      if ( event === 'click' && this.X.gestureManager ) {
        var self = this;
        var manager = this.X.gestureManager;
        var target = this.GestureTarget.create({
          containerID: opt_id,
          enforceContainment: true,
          handler: {
            tapClick: function(pointMap) {
              // Create a fake event.
              return listener({
                preventDefault: function() { },
                stopPropagation: function() { },
                pointMap: pointMap,
                target: self.X.$(opt_id)
              });
            }
          },
          gesture: 'tap'
        });

        manager.install(target);
        this.addDestructor(function() {
          manager.uninstall(target);
        });
        return opt_id;
      }

      this.addInitializer(function() {
        var e = this.X.$(opt_id);
        // if ( ! e ) console.log('Error Missing element for id: ' + opt_id + ' on event ' + event);
        if ( e ) e.addEventListener(event, listener, false);
      }.bind(this));

      return opt_id;
    },function setAttribute(attributeName, valueFn, opt_id) {
      /* Set a dynamic attribute on the DOM element. */
      var self = this;
      opt_id = opt_id || this.nextID();
      valueFn = valueFn.bind(this);
      this.addInitializer(function() {
        self.X.dynamicFn(valueFn, function() {
          var e = self.X.$(opt_id);
          if ( ! e ) throw EventService.UNSUBSCRIBE_EXCEPTION;
          var newValue = valueFn(e.getAttribute(attributeName));
          if ( newValue == undefined )
            e.removeAttribute(attributeName);
          else
            e.setAttribute(attributeName, newValue);
        })
      });
    },function setStyle(styleName, valueFn, opt_id) {
      /* Set a dynamic attribute on the DOM element. */
      var self = this;
      opt_id = opt_id || this.nextID();
      valueFn = valueFn.bind(this);
      this.addInitializer(function() {
        self.X.dynamicFn(valueFn, function(value) {
          var e = self.X.$(opt_id);
          if ( ! e ) throw EventService.UNSUBSCRIBE_EXCEPTION;
          e.style[styleName] = value;
        })
      });

      return opt_id;
    },function setClass(className, predicate, opt_id) {
      var self = this;
      /* Set a dynamic CSS class on the DOM element. */
      opt_id = opt_id || this.nextID();
      predicate = predicate.bind(this);

      this.addInitializer(function() {
        self.addDestructor(
          self.X.dynamicFn(
            predicate,
            function() {
              var e = self.X.$(opt_id);
              if ( ! e ) throw EventService.UNSUBSCRIBE_EXCEPTION;
              DOM.setClass(e, className, predicate());
            }
          ).destroy
        );
      });

      return opt_id;
    },function setClasses(map, opt_id) {
      /* Set a map of dynamic CSS classes on the DOM element. Mapped as
         className: predicate.*/
      opt_id = opt_id || this.nextID();
      var keys = Objects.keys(map);
      for ( var i = 0 ; i < keys.length ; i++ ) {
        this.setClass(keys[i], map[keys[i]], opt_id);
      }

      return opt_id;
    },function insertInElement(name) {
      /* Insert this View's toHTML into the Element of the supplied name. */
      var e = this.X.$(name);
      e.innerHTML = this.toHTML();
      this.initHTML();
    },function write(opt_X) {
      /*  Write the View's HTML to the provided document and then initialize. */
      var X = opt_X || this.X;
      X.writeView(this, X);
    },function updateHTML() {
      /* Cause the HTML content to be recreated using a call to
        $$DOC{ref:'.toInnerHTML'}. */
      if ( ! this.$ ) return;

      this.destroy();
      this.construct();
    },function construct() { /* rebuilds the children of the view */
      this.SUPER();
      this.generateContent();
    },function generateContent() {
      /* by default, uses toInnerHTML() to generate content. Override to do something else. */
      if ( ! this.$ ) return;
      this.$.innerHTML = this.toInnerHTML();
      this.initInnerHTML();
    },function toInnerHTML() {
      /* <p>In most cases you can override this method to provide all of your HTML
        content. Calling $$DOC{ref:'.updateHTML'} will cause this method to
        be called again, regenerating your content. $$DOC{ref:'Template',usePlural:true}
        are usually called from here, or you may create a
        $$DOC{ref:'.toInnerHTML'} $$DOC{ref:'Template'}.</p>
        <p>If you are generating your content here, you may also need to override
        $$DOC{ref:'.initInnerHTML'} to create event handlers such as
        <code>this.on('click')</code>. */
      return '';
    },function toHTML() {
      /* Generates the complete HTML content of this view, including outermost
        element. This element is managed by $$DOC{ref:'foam.ui.View'}, so in most cases
        you should use $$DOC{ref:'.toInnerHTML'} to generate your content. */
      this.invokeDestructors();
      return '<' + this.tagName + ' id="' + this.id + '"' + this.cssClassAttr() + '>' +
        this.toInnerHTML() +
        '</' + this.tagName + '>';
    },function initHTML() {
      /* This must be called once after your HTML content has been inserted into
        the DOM. Calling $$DOC{ref:'.updateHTML'} will automatically call
        $$DOC{ref:'.initHTML'}. */
      this.initInnerHTML();
      this.initKeyboardShortcuts();
      this.maybeInitTooltip();
    },function maybeInitTooltip() {
      if ( ! this.tooltip || ! this.$ ) return;
      this.$.addEventListener('mouseenter', this.openTooltip);
      this.$.addEventListener('mouseleave', this.closeTooltip);
    },function initInnerHTML() {
      /* Initialize this View and all of it's children. Usually just call
         $$DOC{ref:'.initHTML'} instead. When implementing a new $$DOC{ref:'foam.ui.View'}
         and adding listeners (including <code>this.on('click')</code>) that
         will be destroyed each time $$DOC{ref:'.toInnerHTML'} is called, you
         will have to override this $$DOC{ref:'Method'} and add them here.
       */
      // This mostly involves attaching listeners.
      // Must be called activate a view after it has been added to the DOM.

      this.invokeInitializers();
      this.initChildren();
    },function initChildren() {
      /* Initialize all of the children. Usually just call
          $$DOC{ref:'.initHTML'} instead. */
      if ( this.children ) {
        // init children
        for ( var i = 0 ; i < this.children.length ; i++ ) {
          // console.log(i, 'init child: ' + this.children[i]);
          try {
            this.children[i].initHTML && this.children[i].initHTML();
          } catch (x) {
            console.log('Error on View.child.initHTML', x, x.stack);
          }
        }
      }
    },function invokeInitializers() {
      /* Calls all the DOM $$DOC{ref:'.initializers_'}. */
      for ( var i = 0 ; i < this.initializers_.length ; i++ ) this.initializers_[i]();
      this.initializers_ = [];
    },function invokeDestructors() {
      /* Calls all the DOM $$DOC{ref:'.destructors_'}. */
      for ( var i = 0; i < this.destructors_.length; i++ ) this.destructors_[i]();
      this.destructors_ = [];
    },function evtToCharCode(evt) {
      /* Maps an event keycode to a string */
      var s = '';
      if ( evt.altKey   ) s += 'alt-';
      if ( evt.ctrlKey  ) s += 'ctrl-';
      if ( evt.shiftKey && evt.type === 'keydown' ) s += 'shift-';
      if ( evt.metaKey  ) s += 'meta-';
      s += evt.type === 'keydown' ?
          this.NAMED_CODES[evt.which] || String.fromCharCode(evt.which) :
          String.fromCharCode(evt.charCode);
      return s;
    },function initKeyboardShortcuts() {
      /* Initializes keyboard shortcuts. */
      var keyMap = {};
      var found  = false;
      var self   = this;

      function init(actions, opt_value) {
        actions.forEach(function(action) {
          for ( var j = 0 ; j < action.keyboardShortcuts.length ; j++ ) {
            var key = action.keyboardShortcuts[j];
            // First, lookup named codes, then convert numbers to char codes,
            // otherwise, assume we have a single character string treated as
            // a character to be recognized.
            if ( self.NAMED_CODES[key] )
              key = self.NAMED_CODES[key];
            else if ( typeof key === 'number' )
              key = String.fromCharCode(key);

            keyMap[key] = opt_value ?
              function() { action.maybeCall(self.X, opt_value.get()); } :
              action.maybeCall.bind(action, self.X, self) ;
            found = true;
          }
        });
      }

      init(this.model_.getRuntimeActions());

      if ( this.data && this.data.model_ && this.data.model_.getRuntimeActions().length )
        init(this.data.model_.getRuntimeActions(), this.data$);

      if ( found ) {
        console.assert(this.$, 'View must define outer id when using keyboard shortcuts: ' + this.name_);
        this.keyMap_ = keyMap;
        var target = this.$parent;

        // Ensure that target is focusable, and therefore will capture keydown
        // and keypress events.
        target.setAttribute('tabindex', target.tabIndex + '');

        target.addEventListener('keydown',  this.onKeyboardShortcut);
        target.addEventListener('keypress', this.onKeyboardShortcut);
      }
    },function destroy( isParentDestroyed ) {
      /* Cleans up the DOM when regenerating content. You should call this before
         creating new HTML in your $$DOC{ref:'.toInnerHTML'} or $$DOC{ref:'.toHTML'}. */
      // TODO: remove listeners
      this.invokeDestructors();

      this.SUPER(isParentDestroyed);

      delete this.instance_.$;
    },function close() {
      /* Call when permanently closing the $$DOC{ref:'foam.ui.View'}. */
      this.$ && this.$.remove();
      this.destroy();
      this.publish('closed');
    },function rectOnPage() {
      /* Computes the XY coordinates of the given node
         relative to the containing elements.</p>
         <p>TODO: Check browser compatibility. */
      var node = this.$;
      var x = 0;
      var y = 0;
      var parent;
      var rect = this.$.getBoundingClientRect();

      while ( node ) {
        parent = node;
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      return {  top: y,
                left: x,
                right: x+rect.width,
                bottom: y+rect.height,
                width: rect.width,
                height: rect.height };
    },function rectOnViewport() {
      /* Computes the XY coordinates of this view relative to the browser viewport. */
      return this.$.getBoundingClientRect();
    },function viewportOnPage() {
      var bodyRect = this.X.document.documentElement.getBoundingClientRect();
      var vpSize = this.viewportSize();
      return { left: -bodyRect.left, top: -bodyRect.top,
               width: vpSize.width, height: vpSize.height,
               right: -bodyRect.left + vpSize.width,
               bottom: -bodyRect.top + vpSize.height };
    },function viewportSize() {
      /* returns the rect of the current viewport, relative to the page. */
      return { height: (window.innerHeight || this.X.document.documentElement.clientHeight),
               width:  (window.innerWidth  || this.X.document.documentElement.clientWidth) };
    },function createView(prop, opt_args) {
      /* Creates a sub-$$DOC{ref:'foam.ui.View'} from $$DOC{ref:'Property'} info. */
      var X = ( opt_args && opt_args.X ) || this.Y;
      var v = this.PropertyView.create({id: (this.nextID ? this.nextID() : this.id) +'PROP', prop: prop, copyFrom: opt_args}, X);
      this[prop.name + 'View'] = v.view;
      return v;
    },function removeChild(child) {
      if ( this.PropertyView.isInstance(child) && child.prop ) {
        delete this[child.prop.name + 'View'];
      }
      this.SUPER(child);
    },function createRelationshipView(r, opt_args) {
      if ( opt_args.model_ ) {
        // if a model is specified, switch to normal PropertyView path
        return this.createView(r, opt_args);
      }
      var X = ( opt_args && opt_args.X ) || this.Y;

      var v = this.AsyncLoadingView.create({
        id: this.nextID(),
        name: r.name,
        model: 'foam.ui.RelationshipView',
        args: { relationship: r },
        copyFrom: opt_args
      }, X);

      if ( v.view ) v = v.view;

      this[r.name + 'View'] = v;
      return v;
    },function createActionView(action, opt_args) {
      /* Creates a sub-$$DOC{ref:'foam.ui.View'} from $$DOC{ref:'Property'} info
        specifically for $$DOC{ref:'Action',usePlural:true}. */
      var X = ( opt_args && opt_args.X ) || this.Y;
      var modelName = opt_args && opt_args.model_ ?
        opt_args.model_ :
        'foam.ui.ActionButton'  ;

      var v = this.AsyncLoadingView.create({
        id: this.nextID(),
        name: action.name,
        model: modelName,
        args: { action: action },
        copyFrom: opt_args
      }, X);

      // TODO: Fix this race condition
      if ( v.view ) v = v.view;

      this[action.name + 'View'] = v.cview || v;;

      return v;
    },function createTemplateView(name, opt_args) {
      /*
        Used by the $$DOC{ref:'Template',text:'$$propName'} sub-$$DOC{ref:'foam.ui.View'}
        creation tag in $$DOC{ref:'Template',usePlural:true}.
      */
      var args = opt_args || {};
      var X = this.Y;
      // Look for the property on our data first
      var myData = this.data$;
      if ( myData && myData.value && myData.value.model_ ) {
        var o = myData.value.model_.getFeature(name);
        if ( o ) {
          var v;
          if ( Action.isInstance(o) )
            v = this.createActionView(o, args);
          else if ( Relationship.isInstance(o) )
            v = this.createRelationshipView(o, args);
          else
            v = this.createView(o, args);
          // link data and add child view
          this.addDataChild(v);
          return v;
        }
      }
      // fallback to check our own properties
      var o = this.model_.getFeature(name);
      if ( ! o )
        throw 'Unknown View Name: ' + name;
      var v;
      if ( Action.isInstance(o) )
        v = this.createActionView(o, args);
      else if ( Relationship.isInstance(o) )
        v = this.createRelationshipView(o, args);
      else
        v = this.createView(o, args);
      // set this-as-data and add child view
      this.addSelfDataChild(v);
      return v;
    },function dynamicTag(tagName, f) {
      /*
        Creates a dynamic HTML tag whose content will be automatically updated.
       */
      var id  = this.nextID();
      var self = this;
      this.addInitializer(function() {
        self.X.dynamicFn(function() {
          var html = f();
          var e = self.X.$(id);
          if ( e ) e.innerHTML = html;
        });
      });

      return '<' + tagName + ' id="' + id + '"></' + tagName + '>';
    }],listeners: [{name: "openTooltip",code: function(e) {
        // console.assert(! this.tooltip_, 'Tooltip already defined');
        // this.X.arequire('foam.ui.Tooltip')(function(Tooltip) {
        //   if (!Tooltip) return;
        //   this.tooltip_ = Tooltip.create({
        //     text:   this.tooltip,
        //     target: this.$
        //   }, this.Y);
        // }.bind(this));
      }},{name: "closeTooltip",code: function(e) {
        if ( this.tooltip_ ) {
          this.tooltip_.close();
          this.tooltip_ = null;
        }
      }},{name: "onKeyboardShortcut",code: function(evt) {
        // Why was this here?  It was breaking Calculator.
        // if ( evt.srcElement !== this.$parent ) return;
        if ( evt.type === 'keydown' && ! this.KEYPRESS_CODES[evt.which] ) return;
        var action = this.keyMap_[this.evtToCharCode(evt)];
        if ( action ) {
          action();
          evt.preventDefault();
          evt.stopPropagation();
        }
      }}]})
CLASS({package: "foam.input.touch",name: "GestureTarget",properties: [{name: "id"},{name: "gesture",help: "The name of the gesture to be tracked."},{name: "containerID",help: "The containing DOM node's ID. Used for checking what inputs are within which gesture targets."},{model_:"BooleanProperty",name: "enforceContainment",type: "Boolean",help: "Require that the start and end of a matching gesture be inside the container.",defaultValue: false},{name: "getElement",defaultValue: function() { return this.X.$(this.containerID); },help: "Function to retrieve the element this gesture is attached to. Defaults to $(containerID)."},{name: "handler",help: "The target for the gesture's events, after it has been recognized."}],help: "Created by each view that wants to receive gestures."})
CLASS({package: "foam.ui",name: "ActionBorder",methods: [function toHTML(border, delegate, args) {
      var str = "";
      str += delegate.apply(this, args);
      str += '<div class="actionToolbar">';

      // Actions on the View, are bound to the view
      var actions = this.model_.getRuntimeActions();
      for ( var i = 0 ; i < actions.length; i++ ) {
        var v = this.createActionView(actions[i]);
        //v.data = this;
        this.addSelfDataChild(v);
        str += ' ' + v.toView_().toHTML() + ' ';
      }

      // This is poor design, we should defer to the view and polymorphism
      // to make the distinction.
      if ( this.X.lookup('foam.ui.DetailView').isInstance(this) ) {

        // Actions on the data are bound to the data
        actions = this.model.actions;
        for ( var i = 0 ; i < actions.length; i++ ) {
          var v = this.createActionView(actions[i]);
          //v.data$ = this.data$;
          this.addDataChild(v);
          str += ' ' + v.toView_().toHTML() + ' ';
        }
      }

      str += '</div>';
      return str;
    }]})
CLASS({package: "foam.ui",name: "PropertyView",extends: "foam.ui.AsyncLoadingView",properties: [{name: "prop",postSet: function(old, nu) {
        if ( old && this.bound_ ) this.unbindData(this.data);
        if ( nu && ! this.bound_ ) this.bindData(this.data);
        this.args = nu;
        this.model = this.innerView || nu.view;
      }},{name: "data",postSet: function(old, nu) {
        if ( old && this.bound_ ) this.unbindData(old);
        if ( nu ) this.bindData(nu);
      }},{name: "childData"},{name: "innerView",postSet: function(old,nu) {
        this.model = nu;
      },help: "Override for prop.view"},{name: "view",adapt: function(_, v) { return v && v.toView_ ? v.toView_() : v; }},{model_:"BooleanProperty",name: "bound_",type: "Boolean",defaultValue: false},{name: "parent",postSet: function(_, p) {
        if ( ! p ) return; // TODO(jacksonic): We shouldn't pretend we aren't part of the tree
        p[this.prop.name + 'View'] = this.view.cview || this.view;
        if ( this.view ) this.view.parent = p;
      }}],methods: [function unbindData(oldData) {
      if ( ! this.bound_ || ! oldData || ! this.prop ) return;
      var pValue = oldData.propertyValue(this.prop.name);
      Events.unlink(pValue, this.childData$);
      this.bound_ = false;
    },function bindData(data) {
      var self = this;
      if ( this.bound_ || ! data || ! this.prop) return;
      var pValue = data.propertyValue(this.prop.name);
      Events.link(pValue, this.childData$);
      if ( this.prop.validate ) {
        this.X.dynamic3(data, this.prop.validate, function(error) {
          // console.log('************************** error, ', self.prop.name, error, self.view.$);
          if ( ! self.view ) return;
          self.view.$.style.border = error ? '2px solid red' : '';
        });
      }
      this.bound_ = true;
    },function toString() { /* Name info. */ return 'PropertyView(' + this.prop.name + ', ' + this.view + ')'; },function destroy( isParentDestroyed ) { /* Passthrough to $$DOC{ref:'.view'} */
      // always unbind, since if our parent was the top level destroy we need
      // to unhook if we were created as an addSelfDataChild
      this.unbindData(this.data);
      this.SUPER( isParentDestroyed );
    },function construct() {
      // if not bound yet and we do have data set, bind it
      this.bindData(this.data);
      this.SUPER();
    },function finishRender(view) {
      view.prop = this.prop;
      this.SUPER(view);
    },function addDataChild(child) {
      Events.link(this.childData$, child.data$);
      this.addChild(child);
    }]})
CLASS({package: "foam.ui",name: "AsyncLoadingView",extends: "foam.ui.BaseView",properties: [{model_:"StringProperty",name: "id",label: "Element ID",type: "String"},{name: "name",label: "The parent view's name for this"},{name: "model",label: "View model name, model definition, or JSON with a factory_ specified."},{name: "args",label: "View construction arguments",defaultValueFn: function() { return {}; }},{name: "copyFrom",label: "Additional arguments to this.copyFrom(...) when ready.",lazyFactory: function() { return {}; }},{name: "view"}],methods: [function init() {
       this.SUPER();

       /* Picks the model to create, then passes off to $$DOC{ref:'.finishRender'}. */
       // Decorators to allow us to skip over keys without copying them
       // as create() args
       var skipKeysArgDecorator = Object.create(this.args);
       skipKeysArgDecorator.hasOwnProperty = this.skipKeysFn_hasOwnProperty;
       skipKeysArgDecorator.inner = this.args;

       // HACK to ensure model-for-model works. It requires that 'model', if specified,
       // be present in the create({ args }). Since we set Actions and Properties as
       // the create arg object sometimes, we must temporarily transfer the model
       // value from copyFrom to args, but since we are wrapping it anyways we can
       // piggyback our model value on the wrapper.
       if ( this.copyFrom && this.copyFrom.model ) {
         skipKeysArgDecorator.model = this.copyFrom.model;
       }

       if ( this.copyFrom && this.copyFrom.model_ ) {
         if ( typeof this.copyFrom.model_ === 'string' ) { // string model_ in copyFrom
           return this.requireModelName(this.copyFrom.model_, skipKeysArgDecorator);
         } else if ( Model.isInstance(this.copyFrom.model_) ) { // or model instance
           return this.finishRender(this.copyFrom.model_.create(skipKeysArgDecorator, this.Y));
         }
       }
       if ( typeof this.model === 'string' ) { // string model name
         return this.requireModelName(this.model, skipKeysArgDecorator);
       }
       if ( this.model.model_ && typeof this.model.model_ === 'string' ) { // JSON instance def'n
         // FOAMalize the definition
         return this.requireViewInstance(FOAM(this.model));
       }
       if ( this.model.model_ ) {
         if ( Model.isInstance(this.model) ) { // is a model instance
           return this.finishRender(this.model.create(skipKeysArgDecorator, this.Y));
         } else {
           // JSON with Model instance specified in model_
           this.mergeWithCopyFrom(this.model);
           return this.finishRender(this.model.model_.create(skipKeysArgDecorator, this.Y));
         }
       }
       if ( this.model.factory_ ) { // JSON with string factory_ name
         // TODO: previously 'view' was removed from copyFrom to support CViews not getting their view stomped. Put back...
         this.mergeWithCopyFrom(this.model);
         return this.requireModelName(this.model.factory_, skipKeysArgDecorator);
       }
       if ( typeof this.model === 'function' ) { // factory function
         return this.finishRender(this.model(skipKeysArgDecorator, this.Y));
       }
       console.warn("AsyncLoadingView: View load with invalid model. ", this.model, this.args, this.copyFrom);
     },function mergeWithCopyFrom(other) {
       /* Override/Append to args, typically
          used to merge in $$DOC{ref:'.model'} if it is a JSON object. */
       for (var key in other) {
         if ( key == 'factory_' ) continue;
         this.copyFrom[key] = other[key];
       }
     },function skipKeysFn_hasOwnProperty(name) {
       return name != 'factory_' && name != 'model_' && name != 'view' && this.inner.hasOwnProperty(name);
     },function requireViewInstance(view) {
       view.arequire()(function(m) {
         this.finishRender(view);
       }.bind(this));
     },function requireModelName(name, args) {
       this.X.arequire(name)(function(m) {
         this.finishRender(m.create(args, this.Y));
       }.bind(this));
     },function finishRender(view) {
       if ( this.copyFrom ) {
         // don't copy a few special cases
         var skipKeysCopyFromDecorator = Object.create(this.copyFrom);
         skipKeysCopyFromDecorator.hasOwnProperty = this.skipKeysFn_hasOwnProperty;
         skipKeysCopyFromDecorator.inner = this.copyFrom;

         view.copyFrom(skipKeysCopyFromDecorator);
       }
       this.view = view.toView_();
       this.addDataChild(this.view);

       var el = this.X.$(this.id);
       if ( el ) {
         el.outerHTML = this.toHTML();
         this.initHTML();
       }
     },function toHTML() {
       /* If the view is ready, pass through to it. Otherwise create a place
          holder tag with our id, which we replace later. */
       return this.view ? this.view.toHTML() : ('<div id="'+this.id+'"></div>');
     },function initHTML() {
       this.view && this.view.initHTML();
     },function toString() { /* Name info. */ return 'AsyncLoadingView(' + this.model + ', ' + this.view + ')'; },function fromElement(e) { /* passthru */
       this.view.fromElement(e);
       return this;
     }]})
CLASS({package: "foam.ui",name: "BaseView",extends: "foam.patterns.ChildTreeTrait",properties: [{name: "data"}],methods: [function addDataChild(child) {
      /* For children that link to data$. Override to track the
        connections, if required. */
      Events.link(this.data$, child.data$);
      this.addChild(child);
    },function addSelfDataChild(child) {
      /* For views created from properties of this view (not our data),
         this method sets the child's data to 'this'. */
      child.data = this;
      this.addChild(child);
    },function toView_() {
      /* if you are a BaseView that can be converted into an html View,
         convert here */
      return this;
    }]})
CLASS({package: "foam.patterns",name: "ChildTreeTrait",properties: [{name: "parent",visibility: "hidden",hidden: true},{name: "children",factory: function() { return []; }}],methods: [function onAncestryChange_() {
      /* Called when our parent or an ancestor's parent changes. Override to
        react to ancestry changes. Remember to call <code>this.SUPER()</code>. */

      Array.prototype.forEach.call(this.children, function(c) { c.onAncestryChange_ && c.onAncestryChange_() } );
    },function addChild(child) {
      /*
        Maintains the tree structure of $$DOC{ref:'foam.ui.View',usePlural:true}. When
        a sub-$$DOC{ref:'foam.ui.View'} is created, add it to the tree with this method.
      */
      //if (arguments.callee.caller.super_) this.SUPER(child);

      // Check prevents duplicate addChild() calls,
      // which can happen when you use creatView() to create a sub-view (and it calls addChild)
      // and then you write the View using TemplateOutput (which also calls addChild).
      // That should all be cleaned up and all outputHTML() methods should use TemplateOutput.
      if ( child.parent === this ) return;

      child.parent = this;
      child.onAncestryChange_ && child.onAncestryChange_();

      var children = this.children;
      children.push(child);
      this.children = children;

      return this;
    },function removeChild(child) {
      /*
        Maintains the tree structure of $$DOC{ref:'foam.ui.View',usePlural:true}. When
        a sub-$$DOC{ref:'foam.ui.View'} is destroyed, remove it from the tree with this method.
        The isParentDestroyed argument is passed to the child's destroy().
      */
      child.destroy && child.destroy(true);
      this.children.deleteI(child);
      child.parent = undefined;
      //child.onAncestryChange_();

      return this;
    },function removeAllChildren(isParentDestroyed) {
      // unhook the children list, then destroy them all
      var list = this.children;
      this.children = [];
      Array.prototype.forEach.call(list, function(child) {
        this.removeChild(child);
      }.bind(this));
    },function addChildren() {
      /* Adds multiple children at once. Specify each child to add as an argument. */
      for ( var i = 0; i < arguments.length; ++i ) {
        this.addChild(arguments[i]);
      }
      return this;
    },function destroy( isParentDestroyed ) {
      /* Destroys children and removes them from this. Override to include your own
       cleanup code, but always call this.SUPER(isParentDestroyed)
       after you are done. When isParentDestroyed is true, your parent has already
       been destroyed. You may choose to omit unecessary cleanup. */

      if ( isParentDestroyed ) {
//        console.log(this.name_, " FAST destroying ", this.children.length," children");
        Array.prototype.forEach.call(this.children, function(child) {
          child.destroy && child.destroy(true);
        });
        this.children = [];
      } else {
//        console.log(this.name_, " SLOW removing ", this.children.length," children--------------------------------------");
        this.removeAllChildren();
      }

      return this;
    },function construct() {
      /* After a destroy(), construct() is called to fill in the object again. If
         any special children need to be re-created, do it here. */

      return this;
    },function deepPublish(topic) {
      /*
       Publish an event and cause all children to publish as well.
       */
      var count = this.publish.apply(this, arguments);

      if ( this.children ) {
        for ( var i = 0 ; i < this.children.length ; i++ ) {
          var child = this.children[i];
          count += child.deepPublish.apply(child, arguments);
        }
      }

      return count;
    }]})
CLASS({package: "foam.core.types",name: "DocumentInstallProperty",extends: "Property",properties: [{model_:"FunctionProperty",name: "documentInstallFn",type: "Function"},{name: "hidden",defaultValue: true}],methods: [function initPropertyAgents(proto, fastInit) {
        this.SUPER(proto, fastInit);

        var thisProp = this;
        var DocumentInstallProperty = thisProp.model_;

        // add the agent for this model
        proto.addInitAgent(12, ': install in document ', function(o, X, Y) {
          // o is a a newly created instance of a model that has a DocumentInstallProperty
          var model = o.model_;
          // if not a model instance, no document, or we are already installed
          //   in document, we're done.
          if ( ! model || ! X.installedModels || X.installedModels[model.id] ) return;
          // call this document installer function on the current proto
          thisProp.documentInstallFn.call(proto, X);
        });

        // Also run our base models' DocumentInstallProperty inits, in case no
        // instances of our base models have been created.
        if ( proto.__proto__.model_ ) {
          var recurse = function(baseProto) {
            // if the base model also has/inherits this property, init on base too
            var baseProp = baseProto.model_.getProperty(thisProp.name);
            if ( baseProp ) {
              // add a special init agent that has the proto hardcoded.
              proto.addInitAgent(12, ': inherited install in document ', function(o, X, Y) {
                var model = baseProto.model_;
                if ( ! model || ! X.installedModels || X.installedModels[model.id] ) return;
                baseProp.documentInstallFn.call(baseProto, X);
              });
              // many of these may be added, but won't hurt
              proto.addInitAgent(13, ': completed inherited install in document ', function(o, X, Y) {
                X.installedModels[baseProto.model_.id] = true;
              });
              // continue recursing
              if ( baseProto.__proto__.model_ ) {
                recurse(baseProto.__proto__);
              }
            } // else this property is not declared or inherited at this level, so we are done.
          }
          recurse(proto.__proto__);
        }

        // run after all the install in document agents to mark completion
        proto.addInitAgent(13, ': completed install in document ', function(o, X, Y) {
          X.installedModels[o.model_.id] = true;
        });
      }],help: "Describes a function property that runs once per document"})
CLASS({package: "foam.ui",name: "U2ViewTrait",methods: [function toE() { return this; },function load() { return this.initHTML && this.initHTML(); },function unload() { return this.destroy && this.destroy(); },function toString() { return this.toHTML ? this.toHTML() : ''; }]})
CLASS({package: "foam.ui",name: "DestructiveDataView",extends: "foam.ui.BaseView",requires: ["SimpleValue"],properties: [{name: "data",preSet: function(old,nu) {
        if ( this.shouldDestroy(old,nu) ) {
          // destroy children
          this.destroy();
        }
        return nu;
      },postSet: function(old,nu) {
        if ( this.shouldDestroy(old,nu) ) {
          // rebuild children with new data (propagation will happen implicitly)
          this.construct();
        }
      }},{name: "dataLinkedChildren",factory: function() { return []; }}],methods: [function shouldDestroy(old,nu) {
      /* Override to provide the destruct condition. When data changes,
         this method is called. Return true to destroy(), cut loose children
         and construct(). Return false to retain children and just propagate
         the data change. */
      return true;
    },function destroy( isParentDestroyed ) {
      if ( ! isParentDestroyed ) {
        // unlink children
        this.dataLinkedChildren.forEach(function(child) {
          Events.unfollow(this.data$, child.data$);
        }.bind(this));
        this.dataLinkedChildren = [];
      }// else {
//        var parentName = this.parent.name_;
//         this.data$.addListener(function() {
//           console.warn("Data changed after fast-destroy! ", this.name_, parentName);
//         }.bind(this));
//      }
      this.SUPER(isParentDestroyed);
    },function addDataChild(child) {
      /* For children that link to data$, this method tracks them
        for disconnection when we destroy. */
      Events.follow(this.data$, child.data$);
      this.dataLinkedChildren.push(child);
      this.addChild(child);
    }]})
CLASS({package: "foam.graphics",name: "CViewView",extends: "foam.graphics.AbstractCViewView",properties: [{name: "cview",postSet: function(_, cview) {
        cview.view = this;
        this.X.dynamicFn(function() {
          // ActionButtonCView's hide buttons by sizing to 0, so we honour that,
          // but otherwise, we only increase the size of the canvas as needed, not shrink.
          var w = cview.x + cview.width;
          var h = cview.y + cview.height;
          this.width  = w ? Math.max(this.width, w) : 0;
          this.height = h ? Math.max(this.height, h): 0;
        }.bind(this));
      }}],methods: [function shouldDestroy() { return false; },function destroy() {
      this.SUPER();
      this.cview && this.cview.destroy();
    }],help: "DOM wrapper for a CView, auto adjusts it size to fit the given cview."})
CLASS({package: "foam.apps.calc",name: "CalcSpeechView",extends: "foam.ui.View",properties: [{name: "calc"},{name: "lastSaid"}],actions: [{name: "repeat",code: function() { this.say(this.lastSaid); },keyboardShortcuts: ["r"]},{name: "sayState",code: function() {
        var last  = this.calc.history[this.calc.history.length-1];
        if ( ! last ) {
          this.say(this.calc.a2);
        } else {
          var unary = last && last.op.unary;
          if ( this.calc.op !== this.calc.DEFAULT_OP ) {
            this.say(
              unary ?
                this.calc.a2 + ' ' + last.op.speechLabel :
                last.a2 + ' ' + this.calc.op.speechLabel + ' ' + this.calc.a2 );
          } else {
            this.say(
              unary ?
                last.a2 + ' ' + last.op.speechLabel + ' ' + this.calc.model_.EQUALS.speechLabel + ' ' + this.calc.a2 :
                last.op !== this.calc.DEFAULT_OP ?
                  this.calc.history[this.calc.history.length-2].a2 + ' ' + last.op.speechLabel  + ' ' + last.a2 + ' ' + this.calc.model_.EQUALS.speechLabel + ' ' + this.calc.a2 :
                  this.calc.a2);
          }
        }
      },keyboardShortcuts: ["s"]},{name: "sayModeState",code: function() { this.say(this.calc.degreesMode ? 'degrees' : 'radians'); },keyboardShortcuts: ["t"]}],methods: [function say(msg) {
      // console.log('say: ', msg);
      this.lastSaid = msg;
      var e = document.createTextNode(' ' + msg + ' ');
      e.id = this.nextID();
      this.$.innerHTML = '';
      this.$.appendChild(e);
    },function toHTML() {
      return '<div id="' + this.id + '" style="position:absolute;left:-1000000;" aria-live="polite"></div>'
    },function initHTML() {
      this.SUPER();
      this.calc.subscribe(['action'], this.onAction);
    }],listeners: [{name: "onAction",code: function(calc, topic, action) {
        var last  = this.calc.history[this.calc.history.length-1];
        var unary = last && last.op.unary;
        this.say(
          action.name === 'equals' ?
            action.speechLabel + ' ' + this.calc.a2 :
          unary ?
            action.speechLabel + ' ' + this.calc.model_.EQUALS.speechLabel + ' ' + this.calc.a2 :
            action.speechLabel);
      },whenIdle: true}]})
CLASS({package: "foam.apps.calc",name: "Fonts",traits: ["foam.ui.CSSLoaderTrait"],constants: [{name: "CSS_",value: "\u000a@font-face {\u000a  font-family: 'Roboto';\u000a  font-style: 'normal';\u000a  font-weight: 300;\u000a  src: url('data:font/ttf;base64,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AAAAANDbTo76IP3VCRoIcwAAAAkAAgAAAAAAAAOMAGQAAAAAAAAAAAHyAAAB8gAAAc4AmQJMAI8EpwBVBG8AcwXpAG0E7ABsAVwAdwKNAIwCmwAhA2UAHQSEAEsBiAA8AkoAMQHpAJEDLQAeBG8AeARvALIEbwBpBG8AYgRvAEMEbwCoBG8AggRvAE0EbwBqBG8AZQGuAH8BjwA8BBcATQRtAJUEJQB8A6IAVAdOAHEE/wAeBOcAuAUyAIMFPQC4BI0AuASAALgFeACRBakAuAIhANMEZwBHBQwAuAQ3ALgG7AC4Ba4AuAVqAH0E7QC4BWoAeQUUALUEvQBYBMcANAVCAKIE7wAfBywAPQTlADcEygAYBMkAWgHrAKMDJwAwAesAAANUAE0DdAABAkkAZwRJAGQEbwCbBB8AXgRyAGwEIgBaAqYAPwRwAGwEZACcAcsAlQHT/5gD6wCcAcsAqgcXAJYEZQCcBHsAWgRvAJsEdgBsArEAnAQNAGUCkgAXBGUAmAPZACYGCAA/A+QAMAPNACAD5ABXAqQARAHEALICpAAJBXoAkQHEAIwEWwB3BJIAXQXJAG0ExwAsAbwAnwTXAGYDcQCPBmUAawOKAJ0DpQB7BF0AfAZqAGYDagBqAwYAjwQ9AFQC5ABMAuQARwJAAHwEdACiA80AUwH3AKMB8gBiAuQAfgOaAIcDoABzBcwAcwYMAGQGNgB2A6wAWAdJABEEMABdBWoAfQS+ALcEsACXBsQAVQSnAJUEjABIBHQAWQR+AJ8ByACoB3kAbAdkAF4DcACgAnsAdQN7AGoFNgCfBiwAfQFsAGIBbAA+AWEAKQJkAGMCaQBEAlEAKQKWAJICYQBsAmEAYQOWAD4C5AA7BG8AUwSQAKUETAAwBFsAPwLjAH4C4wBMAuMARwLjADsB8gAAAkoAMQVbACEE/wAeBP8AHgT/AB4E/wAeBP8AHgT/AB4FMgCDBI0AuASNALgEjQC4BI0AuAIhAA0CIQDKAiH//gIh/+0FrgC4BWoAfQVqAH0FagB9BWoAfQVqAH0FQgCiBUIAogVCAKIFQgCiBMoAGARJAGQESQBkBEkAZARJAGQESQBkBEkAZAQfAF4EIgBaBCIAWgQiAFoEIgBaAcj/4gHIAJ8ByP/TAcj/wgRlAJwEewBaBHsAWgR7AFoEewBaBHsAWgRlAJgEZQCY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') format('truetype');\u000a}\u000a"}],templates: [{name: "CSS",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('',
 this.CSS_ ,
'');return X.foam.grammars.CSSDecl.create({model:this.model_}).parser.parseString(out.toString());},language: "css"}]})
CLASS({package: "foam.ui",name: "CSSLoaderTrait",properties: [{model_:"foam.core.types.DocumentInstallProperty",name: "installCSS",documentInstallFn: function(X) {
        for ( var i = 0 ; i < this.model_.templates.length ; i++ ) {
          var t = this.model_.templates[i];
          if ( t.name === 'CSS' ) {
            t.futureTemplate(function() {
              X.addStyle(this);
            }.bind(this));
            return;
          }
        }
      }}]})
CLASS({package: "foam.apps.calc",name: "HistoryCitationView",extends: "foam.ui.View",templates: [{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n      <div class="history" role="listitem" tabindex="2" aria-label="',
escapeHTML((this.data.sayEquals) ? (window.chrome.i18n ? window.chrome.i18n.getMessage('Calc_ActionSpeechLabel_equals') + ' ' : 'equals ') : ''),
'',
escapeHTML(this.data.op.speechLabel),
' ',
escapeHTML(this.data.a2),
'">\n        <span aria-hidden="true">',
this.data.op.label,
'&nbsp;',
escapeHTML(this.data.a2),
'<span>\n      </div>\n      ');
 if ( this.data.op.label ) { ;out('<hr aria-hidden="true">');
 } ;out('\n    ');return out.toString();},language: "html"}]})
CLASS({package: "foam.apps.calc",name: "MainButtonsView",extends: "foam.ui.View",requires: ["foam.apps.calc.CalcButton"],templates: [{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n      <div id="',
 self.id,
'" class="buttons button-row" style="background:#121212;">\n        <div class="button-column" style="flex-grow: 3;-webkit-flex-grow: 3;">\n          <div class="button-row">\n            ', self.createTemplateView('7', {
              tabIndex: '100',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['.f1', '[4]',   null, '[8]']
            }),
'\n            ', self.createTemplateView('8', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['.f1', '[5]',  '[7]', '[9]']
            }),
'\n            ', self.createTemplateView('9', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['.f1', '[6]',  '[8]', '[ac]']
            }),
'\n          </div>\n          <div class="button-row">\n            ', self.createTemplateView('4', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[7]', '[1]',   null, '[5]']
            }),
'\n            ', self.createTemplateView('5', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[8]', '[2]',  '[4]', '[6]']
            }),
'\n            ', self.createTemplateView('6', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[9]', '[3]',  '[5]', '[div]']
            }),
'\n         </div>\n          <div class="button-row">\n            ', self.createTemplateView('1', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[4]', '[point]',  null,  '[2]']
            }),
'\n            ', self.createTemplateView('2', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[5]', '[0]',      '[1]',  '[3]']
            }),
'\n            ', self.createTemplateView('3', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[6]', '[equals]', '[2]', '[minus]']
            }),
'\n          </div>\n          <div class="button-row">\n            ', self.createTemplateView('point', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[1]', null,  null,     '[0]']
            }),
'\n            ', self.createTemplateView('0', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[2]', null, '[point]', '[equals]']
            }),
'\n            ', self.createTemplateView('equals', {
              tabIndex: '-1',
              haloColor: 'rgba(255, 255, 255, 0.3)',
              arrowNav: ['[3]', null, '[0]', '[plus]']
            }),
'\n          </div>\n        </div>\n        ');

        this.X.registerModel(this.CalcButton.xbind({
          background: '#4a4a4a',
          width:  70,
          height: 45,
          font:   '300 26px Roboto'
        }), 'foam.ui.ActionButton');
        ;out('\n        <div class="button-column rhs-ops" style="flex-grow: 1;-webkit-flex-grow: 1;padding-top: 7px; padding-bottom: 10px;">\n          ', self.createTemplateView('ac', {tabIndex: '101',    haloColor: 'rgba(255, 255, 255, 0.4)', arrowNav: ['.f1',         '[div]',    '[9]',      '[backspace]'], font: '300 24px Roboto'}),
'\n          ', self.createTemplateView('div', {tabIndex: '-1', haloColor: 'rgba(255, 255, 255, 0.4)', arrowNav: ['[ac]',        '[mult]',   '[6]',      '[e]']}),
'\n          ', self.createTemplateView('mult', {tabIndex: '-1', haloColor: 'rgba(255, 255, 255, 0.4)', arrowNav: ['[div]',       '[minus]',  '[3]',      '[inv]']}),
'\n          ', self.createTemplateView('minus', {tabIndex: '-1', haloColor: 'rgba(255, 255, 255, 0.4)', arrowNav: ['[mult]',      '[plus]',   '[3]',      '[inv]']}),
'\n          ', self.createTemplateView('plus', {tabIndex: '-1', haloColor: 'rgba(255, 255, 255, 0.4)', arrowNav: ['[minus]',      null,      '[equals]', '[sign]']}),
'\n        </div>\n      </div>\n    ');return out.toString();},language: "html"}]})
CLASS({package: "foam.apps.calc",name: "NumberFormatter",properties: [{model_:"BooleanProperty",name: "useComma",type: "Boolean"}],messages: [{model_:"Message",name: "nan",value: "Not a number",translationHint: "description of a value that isn't a number"}],methods: [function init() {
        if  ( window.chrome && chrome.i18n ) {
          chrome.i18n.getAcceptLanguages(function(m){ this.useComma = (0.5).toLocaleString(m[0]).substring(1,2) == ','; }.bind(this))
        } else {
          var lang = window.navigator.languages ? window.navigator.languages[0] : window.navigator.language;
          this.useComma = (0.5).toLocaleString(lang).substring(1,2) == ',';
        }
      },function formatNumber(n) {
        // the regex below removes extra zeros from the end,
        // or middle of exponentials
        return typeof n === 'string' ? n :
            Number.isNaN(n)       ? this.nan :
            ! Number.isFinite(n)  ? '∞' :
            parseFloat(n).toPrecision(12)
            .replace( /(?:(\d+\.\d*[1-9])|(\d+)(?:\.))(?:(?:0+)$|(?:0*)(e.*)$|$)/ ,"$1$2$3");
      },function i18nNumber(n) {
        return this.useComma ? n.replace(/\./g, ',') : n;
      }]})
CLASS({package: "foam.apps.calc",name: "SecondaryButtonsView",extends: "foam.ui.View",requires: ["foam.apps.calc.CalcButton"],templates: [{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n          ');

          this.X.registerModel(this.CalcButton.xbind({
            background: '#00796b',
            width:  61,
            height: 61,
            font:   '300 20px Roboto'
          }), 'foam.ui.ActionButton');
          ;out('\n          <div id="',
 self.id,
'" class="buttons button-row secondaryButtons">\n            <div class="button-column" style="flex-grow: 1;-webkit-flex-grow: 1;">\n              <div class="button-row">\n                ', self.createTemplateView('backspace', {
                  tabIndex: '300',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['.f1', '[e]',    '[ac]',         '[round]'], label: '⌫'
                }),
'\n                ', self.createTemplateView('round', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['.f1', '[ln]',   '[backspace]',  '[fetch]']
                }),
'\n                ', self.createTemplateView('fetch', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['.f1', '[log]',  '[round]',      '[store]']
                }),
'\n                ', self.createTemplateView('store', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['.f1', '[exp]',  '[fetch]',      '[deg]']
                }),
'\n              </div>\n              <div class="button-row">\n                ', self.createTemplateView('e', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[backspace]', '[inv]',     '[div]',   '[ln]']
                }),
'\n                ', self.createTemplateView('ln', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[round]',     '[pow]',     '[e]',      '[log]']
                }),
'\n                ', self.createTemplateView('log', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[fetch]',     '[sqroot]',  '[ln]',     '[exp]']
                }),
'\n                ', self.createTemplateView('exp', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[store]',     '[root]',    '[log]',    '[sin]']
                }),
'\n              </div>\n              <div class="button-row">\n                ', self.createTemplateView('inv', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[e]',    '[sign]',     '[minus]',     '[pow]']
                }),
'\n                ', self.createTemplateView('pow', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[ln]',   '[percent]',  '[inv]',     '[sqroot]']
                }),
'\n                ', self.createTemplateView('sqroot', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[log]',  '[square]',   '[pow]',     '[root]']
                }),
'\n                ', self.createTemplateView('root', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[exp]',  '[pi]',       '[sqroot]',  '[cos]']
                }),
'\n              </div>\n              <div class="button-row">\n                ', self.createTemplateView('sign', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[inv]',   null, '[plus]',    '[percent]']
                }),
'\n                ', self.createTemplateView('percent', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[pow]',   null, '[sign]',    '[square]']
                }),
'\n                ', self.createTemplateView('square', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[sqroot]', null, '[percent]', '[pi]']
                }),
'\n                ', self.createTemplateView('pi', {
                  tabIndex: '-1',
                  haloColor: 'rgba(255, 255, 255, 0.4)',
                  arrowNav: ['[root]',  null, '[square]',  '[tan]']
                }),
'\n              </div>\n            </div>\n          </div>\n    ');return out.toString();},language: "html"}]})
CLASS({package: "foam.apps.calc",name: "TertiaryButtonsView",extends: "foam.ui.View",requires: ["foam.apps.calc.CalcButton"],templates: [{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n          ');

          this.X.registerModel(this.CalcButton.xbind({
            width:      61,
            height:     61,
            color:      '#444',
            background: '#1DE9B6',
            font:       '300 18px Roboto'
          }), 'foam.ui.ActionButton');
          ;out('\n          <div id="',
 self.id,
'" class="buttons button-row tertiaryButtons">\n            <div class="button-column" style="flex-grow: 1;-webkit-flex-grow: 1;">\n              <div class="button-row">\n                ', self.createTemplateView('deg', {
                  tabIndex: 400,
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['.f1', '[sin]',  '[store]', '[rad]']
                }),
'\n                ', self.createTemplateView('rad', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['.f1', '[asin]', '[deg]',   '[fact]']
                }),
'\n                ', self.createTemplateView('fact', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['.f1', '[mod]',  '[rad]',    null]
                }),
'\n              </div>\n              <div class="button-row">\n                ', self.createTemplateView('sin', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[deg]',  '[cos]',   '[exp]',  '[asin]']
                }),
'\n                ', self.createTemplateView('asin', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[rad]',  '[acos]',  '[sin]',  '[mod]']
                }),
'\n                ', self.createTemplateView('mod', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[fact]', '[p]',     '[asin]',  null]
                }),
'\n              </div>\n              <div class="button-row">\n                ', self.createTemplateView('cos', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[sin]',    '[tan]',   '[root]',      '[acos]']
                }),
'\n                ', self.createTemplateView('acos', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[asin]',   '[atan]',  '[cos]',       '[p]']
                }),
'\n                ', self.createTemplateView('p', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[mod]',    '[c]',     '[acos]',  null]
                }),
'\n              </div>\n              <div class="button-row">\n                ', self.createTemplateView('tan', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[cos]',  null, '[pi]',     '[atan]']
                }),
'\n                ', self.createTemplateView('atan', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[acos]', null, '[tan]',    '[c]']
                }),
'\n                ', self.createTemplateView('c', {
                  tabIndex: '-1',
                  haloColor: 'rgba(0, 0, 0, 0.2)',
                  arrowNav: ['[p]',    null, '[atan]',   null]
                }),
'\n              </div>\n            </div>\n          </div>\n          ');

            var l = function(_, __, ___, degrees) {
              this.degView.font = degrees ? '600 18px Roboto' : '300 18px Roboto';
              this.radView.font = degrees ? '300 18px Roboto' : '600 18px Roboto';

              this.degView.view.ariaPressed = degrees;
              this.radView.view.ariaPressed = !degrees;

              if ( this.degView.view ) {
                this.degView.view.paint();
                this.radView.view.paint();
              }
            }.bind(this);
            this.data.degreesMode$.addListener(l);
            l(null, null, null, false);
          ;out('\n    ');return out.toString();},language: "html"}]})
CLASS({package: "foam.ui",name: "SlidePanel",extends: "foam.ui.View",requires: ["foam.input.touch.GestureTarget"],imports: ["clearTimeout","document","gestureManager","setTimeout"],properties: [{name: "side",lazyFactory: function() { return this.LEFT; },adapt: function(_, side) {
        return side === 'left' ? this.LEFT : side === 'right' ? this.RIGHT : side ;
      }},{name: "state",postSet: function(oldState, newState) {
        var layout = this.state.layout.call(this);
        if ( oldState === newState && ! this.af_ ) {
          this.currentLayout = layout;
        } else {
          this.desiredLayout = layout;
        }
      }},{name: "currentLayout",postSet: function(_, layout) {
        this.panelWidth = Math.max(layout[1], this.minPanelWidth);
        this.panelX     = Math.min(this.parentWidth-this.stripWidth, this.parentWidth-layout[2]);
        this.mainWidth  = Math.max(layout[0], this.panelX);
      }},{name: "desiredLayout",postSet: function(_, layout) {
        if ( ! this.currentLayout ) {
          this.currentLayout = layout;
          return;
        }
        var startLayout = this.currentLayout;
        var start = Date.now();
        var end   = start + this.ANIMATION_DELAY;
        var animate = function() {
          var now = Date.now();
          var p = (now-start) / (end-start);
          if ( p < 1 ) {
            var mainWidth = this.currentLayout = [
              startLayout[0] * ( 1 - p ) + layout[0] * p,
              startLayout[1] * ( 1 - p ) + layout[1] * p,
              startLayout[2] * ( 1 - p ) + layout[2] * p
            ];
            if ( this.af_ ) this.X.cancelAnimationFrame(this.af_);
            this.af_ = this.X.requestAnimationFrame(animate);
          } else {
            this.currentLayout = layout;
            this.af_ = null;
          }
        }.bind(this);
        animate();
      }},{model_:"ViewFactoryProperty",name: "mainView",type: "ViewFactory"},{model_:"ViewFactoryProperty",name: "panelView",type: "ViewFactory"},{model_:"IntProperty",name: "minWidth",type: "Int",defaultValueFn: function() {
        var e = this.main$();
        return e ? toNum(this.X.window.getComputedStyle(e).width) : 300;
      }},{model_:"IntProperty",name: "mainWidth",type: "Int",visibility: "hidden",hidden: true,postSet: function(_, x) {
        this.main$().style.width = x + 'px';
        var x = this.side.mainX.call(this);
        this.main$().style.webkitTransform = 'translate3d(' + x + 'px, 0,0)';
        this.main$().style.MozTransform = 'translate3d(' + x + 'px, 0,0)';
      },help: "Set internally by the resize handler"},{model_:"IntProperty",name: "panelWidth",type: "Int",visibility: "hidden",hidden: true,postSet: function(_, x) {
        this.panel$().style.width = (x+2) + 'px';
        // if the panel has an onResize() method (maybe it's another SlidePanel), then call it.
        this.panelView_ && this.panelView_.onResize && this.panelView_.onResize();
      },help: "Set internally by the resize handler"},{model_:"IntProperty",name: "minPanelWidth",type: "Int",defaultValueFn: function() {
        if ( this.panelView && this.panelView.minWidth )
          return this.panelView.minWidth + (this.panelView.stripWidth || 0);

        var e = this.panel$();
        return e ? toNum(this.X.window.getComputedStyle(e).width) : 250;
      }},{model_:"IntProperty",name: "parentWidth",type: "Int",lazyFactory: function() {
        return toNum(this.X.window.getComputedStyle(this.$.parentNode).width);
      },help: "A pseudoproperty that returns the current width (CSS pixels) of the containing element"},{model_:"IntProperty",name: "stripWidth",type: "Int",help: "The width in (CSS) pixels of the minimal visible strip of panel",defaultValue: 30},{model_:"FloatProperty",name: "panelRatio",type: "Float",help: "The ratio (0-1) of the total width occupied by the panel, when the containing element is wide enough for expanded view.",defaultValue: 0.5},{model_:"IntProperty",name: "panelX",type: "Int",postSet: function(oldX, x) {
        if ( this.currentLayout ) this.currentLayout[2] = this.parentWidth-x;
        if ( oldX !== x ) this.dir_ = oldX.compareTo(x);
        x = this.side.panelX.call(this, x);
        this.panel$().style.webkitTransform = 'translate3d(' + x + 'px, 0,0)';
        this.panel$().style.MozTransform = 'translate3d(' + x + 'px, 0,0)';
      }},{name: "dragGesture",visibility: "hidden",hidden: true,transient: true,lazyFactory: function() {
        return this.GestureTarget.create({
          containerID: this.id + '-panel',
          handler: this,
          gesture: 'drag'
        });
      }},{name: "tapGesture",visibility: "hidden",hidden: true,transient: true,lazyFactory: function() {
        return this.GestureTarget.create({
          containerID: this.id + '-panel',
          handler: this,
          gesture: 'tap'
        });
      }}],constants: [{name: "ANIMATION_DELAY",value: 150},{name: "LEFT",value: {panelX: function(x) {
        return this.parentWidth - x - this.panelWidth;
      },invPanelX: function(x) {
        return x - this.parentWidth + this.panelWidth;
      },mainX: function() {
        return this.parentWidth - this.mainWidth;
      },dragDir: -1}},{name: "RIGHT",value: {panelX: function(x) {
        return x;
      },invPanelX: function(x) {
        return x;
      },mainX: function() {
        return 0;
      },dragDir: 1}},{name: "CLOSED",value: {name: "CLOSED",layout: function() {
        return [ this.parentWidth - this.stripWidth, this.minPanelWidth, this.stripWidth ];
      },onResize: function() {
        if ( this.parentWidth > this.minWidth + this.minPanelWidth )
          this.state = this.EXPANDED;
      },toggle: function() { this.open(); },open: function() { this.state = this.OPEN; },over: true}},{name: "EXPANDED",value: {name: "EXPANDED",layout: function() {
        var extraWidth = this.parentWidth - this.minWidth - this.minPanelWidth;
        var panelWidth = this.minPanelWidth + extraWidth * this.panelRatio;
        return [ this.parentWidth - panelWidth, panelWidth, panelWidth ];
      },onResize: function() {
        if ( this.parentWidth < this.minWidth + this.minPanelWidth )
          this.state = this.CLOSED;
      }}},{name: "OPEN",value: {name: "OPEN",layout: function() {
        return [ this.parentWidth - this.stripWidth, this.minPanelWidth, this.minPanelWidth ];
      },onResize: function() {
        if ( this.parentWidth > this.minWidth + this.minPanelWidth )
          this.state = this.OPEN_EXPANDED;
      },close: function() { this.state = this.CLOSED; },toggle: function() { this.close(); },over: true}},{name: "OPEN_EXPANDED",value: {name: "OPEN_EXPANDED",layout: function() { return this.EXPANDED.layout.call(this); },onResize: function() {
        if ( this.parentWidth < this.minWidth + this.minPanelWidth )
          this.state = this.OPEN;
      }}}],methods: [function initHTML() {
      // Check if panel should be initially expanded
      this.CLOSED.onResize.call(this);
      if ( ! this.state ) this.state = this.CLOSED;

      if (this.gestureManager) {
        this.gestureManager.install(this.dragGesture);
        this.gestureManager.install(this.tapGesture);
      }

      // Resize first, then init the outer view, and finally the panel view.
      this.X.window.addEventListener('resize', this.onResize);

      this.main$().addEventListener('click',       this.onMainFocus);
      this.main$().addEventListener('DOMFocusIn',  this.onMainFocus);
      this.panel$().addEventListener('DOMFocusIn', this.onPanelFocus);
      this.initChildren(); // We didn't call SUPER(), so we have to do this here.
    },function interpolate(state1, state2) {
      var layout1 = state1.layout.call(this);
      var layout2 = state2.layout.call(this);
      return [
        layout1[0] * this.progress + layout2[0] * ( 1 - this.progress ),
        layout1[1] * this.progress + layout2[1] * ( 1 - this.progress ),
        layout1[2] * this.progress + layout2[2] * ( 1 - this.progress ),
      ];
    },function main$() { return this.X.$(this.id + '-main'); },function panel$() { return this.X.$(this.id + '-panel'); },function shadow$() { return this.X.$(this.id + '-shadow'); },function open() { this.state.open && this.state.open.call(this); },function close() { this.state.close && this.state.close.call(this); },function toggle() { this.state.toggle && this.state.toggle.call(this); }],listeners: [{name: "onPanelFocus",code: function(e) { this.open(); },isMerged: 1},{name: "onMainFocus",code: function(e) { this.close(); },isMerged: 1},{name: "onResize",code: function(e) {
        this.clearProperty('parentWidth');
        if ( ! this.$ ) return;
        this.state.onResize.call(this);
        this.shadow$().style.display = this.state.over ? 'inline' : 'none';
        this.state = this.state;
      },isFramed: true},{name: "tapClick",code: function() { this.toggle(); }},{name: "dragStart",code: function(point) {
        if ( this.state === this.EXPANDED || this.state === this.OPEN_EXPANDED ) return;
        // Otherwise, bind panelX to the absolute X.
        var self = this;
        var originalX = this.panelX;
        Events.map(point.x$, this.panelX$, function(x) {
          x = this.side.invPanelX.call(this, originalX + this.side.dragDir * point.totalX);

          // Bound it between its left and right limits: full open and just the
          // strip.
          if ( x <= this.parentWidth - this.panelWidth )
            return this.parentWidth - this.panelWidth;

          if ( x >= this.parentWidth - this.stripWidth )
            return this.parentWidth - this.stripWidth;

          return x;
        }.bind(this));
      }},{name: "dragEnd",code: function(point) {
        var currentLayout = this.currentLayout;
        if ( this.af_ ) this.X.cancelAnimationFrame(this.af_);
        this.af_ = null;
        if ( this.dir_ < 0 ) this.close(); else this.open();
        var layout = this.state.layout.call(this);
        this.currentLayout = currentLayout;
        this.desiredLayout = layout;
      }}],templates: [{name: "CSS",code: ConstantTemplate(".SlidePanel .left-shadow{background:linear-gradient(to left, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 100%);height:100%;left:-8px;position:absolute;width:8px}.SlidePanel .right-shadow{background:linear-gradient(to right, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 100%);height:100%;right:-8px;position:absolute;width:8px;top:0}"),language: "css"},{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n      <div id="',
 self.id,
'" style="display: inline-block;position: relative;" class="SlidePanel">\n        <div id="',
 self.id,
'-main" class="main">\n          <div style="width:0;position:absolute;"></div>\n          ',
 this.mainView({ data$: this.data$ }) ,
'\n        </div>\n        <div id="',
 self.id,
'-panel" class="panel" style="position: absolute; top: 0; left: -1;">\n          ');
 if ( this.side === this.RIGHT ) { ;out(' <div id="',
 self.id,
'-shadow" class="left-shadow"></div> ');
 } ;out('\n          ',
 (this.panelView_ = this.panelView({ data$: this.data$ })) ,
'\n          ');
 if ( this.side === this.LEFT ) { ;out(' <div id="',
 self.id,
'-shadow" class="right-shadow"></div> ');
 } ;out('\n        </div>\n      </div>\n    ');return out.toString();},language: "html"}],help: "A controller that shows a main view with a small strip of the secondary view visible at the right edge. This \"panel\" can be dragged by a finger or mouse pointer to any position from its small strip to fully exposed. If the containing view is wide enough, both panels will always be visible."})
CLASS({package: "foam.ui.animated",name: "Label",extends: "foam.ui.SimpleView",imports: ["window"],properties: [{name: "data"},{name: "className",defaultValue: "alabel"},{name: "left",postSet: function(_, l) {
        this.$.querySelector('.f1').style.left = l;
      }}],methods: [function toInnerHTML() {
      var tabIndex  = this.tabIndex ? ' tabindex="' + this.tabIndex + '"' : '';
      var speechLabel  = this.speechLabel ? ' aria-label="' + this.speechLabel + '"' : '';
      return '<div' + tabIndex + speechLabel +' class="f1"></div><div class="f2"></div>';
    },function initHTML() {
      this.data$.addListener(this.onDataChange);
      this.window.addEventListener('resize', this.onResize);
    }],listeners: [{name: "onDataChange",code: function(_, __, oldValue, newValue) {
        if ( ! this.$ ) return;
        var f1$ = this.$.querySelector('.f1');
        var f2$ = this.$.querySelector('.f2');

        var data = this.data || '&nbsp;';
        f1$.innerHTML = `<span aria-hidden="true">${data}</span>`;
        f2$.innerHTML = data;

        f1$.style.left = f2$.offsetLeft + 'px';
        // Don't animate to the empty string, or prefix changes
        var animate = this.data.length && ( oldValue.startsWith(newValue) || newValue.startsWith(oldValue) );
        DOM.setClass(this.$.querySelector('.f1'), 'animated', animate);

        // update speech label
        this.$.querySelector('.f1').setAttribute('tabindex', 3);
        // The value will sometimes have markup, remove it.
        if (newValue !== undefined) {
          newValue = newValue.replace(/\<[^\<\>]+\>/g, '');
          newValue = newValue.replace(/\&nbsp\;/g, '');
        }
        
        this.$.querySelector('.f1').setAttribute(
            'aria-label',
            newValue !== undefined ? newValue :
                                     'Blank');
      },isFramed: true},{name: "onResize",code: function() {
        if (!this.$) return;
        DOM.setClass(this.$.querySelector('.f1'), 'animated', false);
        this.onDataChange();
      },isFramed: true}],templates: [{name: "CSS",code: ConstantTemplate(".f1{position:absolute;white-space:nowrap}.f1.animated{transition:left .2s}.f1:focus{border:2px solid rgba(52, 153, 128, 0.65);border-radius:10px;margin-top:-2px;margin-right:2px}.f2{display:inline;float:right;visibility:hidden;white-space:nowrap}"),language: "css"}]})
CLASS({package: "foam.ui",name: "SimpleView",extends: "foam.ui.BaseView",traits: ["foam.ui.HTMLViewTrait","foam.ui.U2ViewTrait"],requires: ["Property"],exports: ["propertyViewProperty"],properties: [{name: "propertyViewProperty",defaultValueFn: function() { return this.Property.DETAIL_VIEW; }}]})
CLASS({package: "foam.apps.calc",name: "History",requires: ["foam.apps.calc.NumberFormatter"],properties: [{name: "numberFormatter"},{name: "op"},{name: "a2",preSet: function(_, n) { return this.formatNumber(n); }},{name: "sayEquals"}],methods: [function formatNumber(n) {
      var nu = this.numberFormatter.formatNumber(n) || '0';
      // strip off trailing "."
      nu = nu.replace(/(.+?)(?:\.$|$)/, "$1");
      return this.numberFormatter.i18nNumber(nu);
    }]})
CLASS({package: "foam.input.touch",name: "GestureManager",requires: ["foam.input.touch.DragGesture","foam.input.touch.Gesture","foam.input.touch.GestureTarget","foam.input.touch.PinchTwistGesture","foam.input.touch.ScrollGesture","foam.input.touch.TapGesture","foam.input.touch.InputPoint"],imports: ["document","touchManager"],properties: [{name: "gestures",factory: function() {
        return {
          verticalScroll: this.ScrollGesture.create(),
          verticalScrollMomentum: this.ScrollGesture.create({ momentumEnabled: true }),
          verticalScrollNative: this.ScrollGesture.create({ nativeScrolling: true }),
          horizontalScroll: this.ScrollGesture.create({ direction: 'horizontal' }),
          horizontalScrollMomentum: this.ScrollGesture.create({ direction: 'horizontal', momentumEnabled: true }),
          horizontalScrollNative: this.ScrollGesture.create({ direction: 'horizontal', nativeScrolling: true }),
          tap: this.TapGesture.create(),
          drag: this.DragGesture.create(),
          pinchTwist: this.PinchTwistGesture.create()
        };
      }},{name: "targets",factory: function() { return {}; }},{name: "active",factory: function() { return {}; },help: "Gestures that are active right now and should be checked for recognition. This is the gestures active on the FIRST touch. Rectangles are not checked for subsequent touches."},{name: "recognized",help: "Set to the recognized gesture. Cleared when all points are lifted."},{name: "points",factory: function() { return {}; }},{name: "wheelTimer"},{name: "scrollWheelTimeout",defaultValue: 300},{name: "scrollViewTargets",defaultValue: 0}],methods: [function init() {
      this.SUPER();
      // TODO: Mousewheel and mouse down/up events.
      this.touchManager.subscribe(this.touchManager.TOUCH_START, this.onTouchStart);
      this.touchManager.subscribe(this.touchManager.TOUCH_MOVE,  this.onTouchMove);
      this.touchManager.subscribe(this.touchManager.TOUCH_END,   this.onTouchEnd);
      this.document.addEventListener('mousedown', this.onMouseDown);
      this.document.addEventListener('mousemove', this.onMouseMove);
      this.document.addEventListener('mouseup', this.onMouseUp);
      this.document.addEventListener('wheel', this.onWheel);
      this.document.addEventListener('contextmenu', this.onContextMenu);
    },function install(target) {
      if ( target.containerID ) {
        if ( ! this.targets[target.containerID] )
          this.targets[target.containerID] = [];
        this.targets[target.containerID].push(target);
      } else console.warn('no container ID on touch target');
    },function uninstall(target) {
      var arr = this.targets[target.containerID];
      if ( ! arr ) return;
      for ( var i = 0 ; i < arr.length ; i++ ) {
        if ( arr[i] === target ) {
          arr.splice(i, 1);
          break;
        }
      }
      if ( arr.length === 0 )
        delete this.targets[target.containerID];
    },function purge() {
      // Run through the targets DAO looking for any that don't exist on the DOM.
      var keys = Object.keys(this.targets);
      var count = 0;
      for ( var i = 0 ; i < keys.length ; i++ ) {
        if ( ! this.document.getElementById(keys[i]) ) {
          delete this.targets[keys[i]];
          count++;
        }
      }
      console.log('Purged ' + count + ' targets');
      return count;
    },function activateContainingGestures(x, y, opt_predicate) {
      // Start at the innermost element and work our way up,
      // checking against targets. We go all the way up
      // to the document, since we want every relevant handler.
      var e = this.X.document.elementFromPoint(x, y);
      while ( e ) {
        if ( e.id ) {
          var matches = this.targets[e.id];
          if ( matches && matches.length ) {
            for ( var i = 0 ; i < matches.length ; i++ ) {
              var t = matches[i];
              var g = this.gestures[t.gesture];
              if ( g && ( ! opt_predicate || opt_predicate(g) ) ) {
                if ( ! this.active[g.name] ) this.active[g.name] = [];
                this.active[g.name].push(t);
              }
            }
          }
        }
        e = e.parentNode;
      }
    },function checkRecognition() {
      if ( this.recognized ) return;
      var self = this;
      var matches = [];
      // TODO: Handle multiple matching gestures.
      Object.keys(this.active).forEach(function(name) {
        var answer = self.gestures[name].recognize(self.points);
        if ( answer >= self.Gesture.WAIT ) {
          matches.push([name, answer]);
        } else {
          delete self.active[name];
        }
      });

      if ( matches.length === 0 ) return;

      // There are four possibilities here:
      // - If one or more gestures returned YES, the last one wins. The "last"
      //   part is arbitrary, but that's how this code worked previously.
      // - If a single gesture returned MAYBE, it becomes the only match.
      // - If a one or more  gesture returned WAIT, and none returned YES or
      //   MAYBE then there's no recognition yet, and we do nothing until one
      //   recognizes.
      // - If more than one gesture returned MAYBE, and none returned YES, then
      //   there's no recognition yet, and we do nothing until one recognizes.
      var i, lastYes = -1;
      for ( i = 0 ; i < matches.length ; i++ ) {
        if ( matches[i][1] === this.Gesture.YES ) lastYes = i;
      }
      var lastMaybe = -1;
      for ( i = 0 ; i < matches.length ; i++ ) {
        if ( matches[i][1] === this.Gesture.MAYBE ) lastMaybe = i;
      }

      // If there were no YES answers, then all the matches are MAYBEs.
      // If there is a WAIT or more than one WAIT/MAYBE, return. Otherwise, we
      // have our winner.
      var match;
      if ( lastYes < 0 ) {
        // If we have more than one WAIT/MAYBE, or
        // we have no MAYBEs, then there is no winner yet.
        if ( matches.length > 1 || lastMaybe < 0 ) return;

        match = matches[lastMaybe][0];
      } else {
        match = matches[lastYes][0];
      }

      // Filter out handlers that demand gesture points be inside the container.
      var matched = this.active[match].filter(function(m) {
        if ( ! m.enforceContainment ) return true;
        var r = m.getElement().getBoundingClientRect();
        var keys = Object.keys(self.points);
        for ( var i = 0; i < keys.length; ++i ) {
          var p = self.points[keys[i]];
          if ( p.x < r.left || p.x > r.right ||
              p.y < r.top || p.y > r.bottom ) return false;
        }
        return true;
      });

      // Filter all the handlers to make sure none is a child of any already existing.
      // This prevents eg. two tap handlers firing when the tap is on an inner one.
      var legal = [];
      for ( i = 0 ; i < matched.length ; i++ ) {
        var m = matched[i].getElement();
        var contained = 0;
        for ( var j = 0 ; j < matched.length ; j++ ) {
          var n = matched[j].getElement();
          if ( m !== n && m.contains(n) ) {
            contained++;
          }
        }

        if ( contained === 0 ) legal.push(matched[i].handler);
      }

      // legal.length may be 0 if all targets enforce containment and current x
      // or y is no longer inside targets. In this case, do not bother attaching
      // the empty list of handlers.
      if ( legal.length > 0 ) this.gestures[match].attach(this.points, legal);
      this.recognized = this.gestures[match];
    },function resetState() {
      this.active = {};
      this.recognized = null;
      this.points = {};
    }],listeners: [{name: "onTouchStart",code: function(_, __, touch) {
        // If we've already recognized, it's up to that code to handle the new point.
        if ( this.recognized ) {
          this.recognized.addPoint && this.recognized.addPoint(touch);
          return;
        }

        // Check if there are any active points already.
        var pointCount = Object.keys(this.points).length;
        if ( ! pointCount ) {
          this.activateContainingGestures(touch.x, touch.y);
        }

        // Either way, add this to the map and check for recognition.
        this.points[touch.id] = touch;
        this.checkRecognition();
      }},{name: "onMouseDown",code: function(event) {
        // Build the InputPoint for it.
        var point = this.InputPoint.create({
          id: 'mouse',
          type: 'mouse',
          x: event.clientX,
          y: event.clientY
        });

        // TODO: De-dupe me with the code above in onTouchStart.
        if ( this.recognized ) {
          this.recognized.addPoint && this.recognized.addPoint(point);
          return;
        }

        var pointCount = Object.keys(this.points).length;
        if ( ! pointCount ) {
          this.activateContainingGestures(point.x, point.y);
        }

        this.points[point.id] = point;
        this.checkRecognition();
      }},{name: "onTouchMove",code: function(_, __, touch) {
        if ( this.recognized ) return;
        this.checkRecognition();
      }},{name: "onMouseMove",code: function(event) {
        // No reaction unless we have an active mouse point.
        if ( ! this.points.mouse ) return;
        // If one does exist, update its coordinates.
        this.points.mouse.x = event.clientX;
        this.points.mouse.y = event.clientY;
        this.checkRecognition();
      }},{name: "onTouchEnd",code: function(_, __, touch) {
        if ( ! this.recognized ) {
          this.checkRecognition();
        }

        delete this.points[touch.id];
        this.active = {};
        this.recognized = undefined;
      }},{name: "onMouseUp",code: function(event) {
        // TODO: De-dupe me too.
        if ( ! this.points.mouse ) return;
        this.points.mouse.x = event.clientX;
        this.points.mouse.y = event.clientY;
        this.points.mouse.done = true;
        if ( ! this.recognized ) {
          this.checkRecognition();
        }

        delete this.points.mouse;
        this.active = {};
        this.recognized = undefined;
      }},{name: "onWheel",code: function(event) {
        if ( this.wheelTimer ) {
          // Wheel is already active. Just update.
          this.points.wheel.x -= event.deltaX;
          this.points.wheel.y -= event.deltaY;
          this.X.window.clearTimeout(this.wheelTimer);
          this.wheelTimer = this.X.window.setTimeout(this.onWheelDone, this.scrollWheelTimeout);
        } else {
          // Do nothing if we're currently recognizing something else.
          if ( this.recognized || Object.keys(this.points).length > 0) return;

          // New wheel event. Create an input point for it.
          var wheel = this.InputPoint.create({
            id: 'wheel',
            type: 'wheel',
            x: event.clientX,
            y: event.clientY
          });

          // Now immediately feed this to the appropriate ScrollGesture.
          // We hit all three of vanilla, momentum, and native.
          var dir = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? 'horizontal' : 'vertical';
          var gestures = [dir + 'Scroll', dir + 'ScrollMomentum', dir + 'ScrollNative'];
          // Find all targets for that gesture and check their rectangles.
          this.activateContainingGestures(wheel.x, wheel.y,
              function(g) { return gestures.indexOf(g.name) >= 0; });

          // And since wheel events are already moving, include the deltas immediately.
          // We have to do this after checking containment above, or a downward (negative)
          // scroll too close to the top of the rectangle will fail.
          wheel.x -= event.deltaX;
          wheel.y -= event.deltaY;

          for ( var i = 0 ; i < gestures.length ; i++ ) {
            var gesture = gestures[i];
            if ( this.active[gesture] && this.active[gesture].length ) {
              if ( ! this.points.wheel ) this.points.wheel = wheel;
              this.gestures[gesture].attach(this.points, this.active[gesture].map(function(gt) {
                return gt.handler;
              }));
              this.recognized = this.gestures[gesture];
              this.wheelTimer = this.X.window.setTimeout(this.onWheelDone,
                  this.scrollWheelTimeout);
              break;
            }
          }
        }
      }},{name: "onWheelDone",code: function() {
        this.wheelTimer = undefined;
        this.points.wheel.done = true;
        delete this.points.wheel;
        this.recognized = undefined;
      }},{name: "onContextMenu",code: function() {
        // Fired when the user right-clicks to open a context menu.
        // When this happens, we clear state, since sometimes after the context menu,
        // we get a broken event sequence.
        this.resetState();
      }}]})
CLASS({package: "foam.input.touch",name: "DragGesture",extends: "foam.input.touch.Gesture",properties: [{name: "name",defaultValue: "drag"}],constants: [{name: "DRAG_TOLERANCE",value: 20}],methods: [function recognize(map) {
      // I recognize:
      // - a single point that
      // - is not done and
      // - has begun to move
      // I conflict with: vertical and horizontal scrolling, when using touch.
      var keys = Object.keys(map);
      if ( keys.length > 1 ) return this.NO;
      var point = map[keys[0]];
      if ( point.done ) return this.NO;
      var delta = Math.max(Math.abs(point.totalX), Math.abs(point.totalY));
      var r = delta >= this.DRAG_TOLERANCE ? this.YES : this.MAYBE;
      // Need to preventDefault on touchmoves or Chrome can swipe for
      // back/forward.
      if ( r != this.NO ) point.shouldPreventDefault = true;
      return r;
    },function attach(map, handlers) {
      // My callbacks take the form: function(point) {}
      // And I call dragStart and dragEnd on the handler.
      // There is no dragMove; bind to the point to follow its changes.
      var point = map[Object.keys(map)[0]];
      this.handlers = handlers || [];

      point.done$.addListener(this.onDone);

      // Now send the start event to all the handlers.
      this.pingHandlers('dragStart', point);
    },function pingHandlers(method, point) {
      for ( var i = 0 ; i < this.handlers.length ; i++ ) {
        var h = this.handlers[i];
        h && h[method] && h[method](point);
      }
    }],listeners: [{name: "onDone",code: function(obj, prop, old, nu) {
        obj.done$.removeListener(this.onDone);
        this.pingHandlers('dragEnd', obj);
      }}],help: "Gesture that understands a hold and drag with mouse or one touch point."})
CLASS({package: "foam.input.touch",name: "Gesture",properties: [{name: "name",required: true}],constants: [{name: "YES",value: 3},{name: "MAYBE",value: 2},{name: "WAIT",value: 1},{name: "NO",value: 0}],methods: [function recognize(map) {
      return this.NO;
    },function attach(handlers) {
      // Called on recognition, with the array of handlers listening to this gesture.
      // Usually there's just one, but it could be multiple.
      // Each gesture defines its own callbacks for these handlers.
    },function newPoint(point) {
      // A new point to stick into the map. Most gestures can ignore this.
      // Only called after recognition of this gesture.
    }],help: "Installed in the GestureManager to watch for a particular kind of gesture"})
CLASS({package: "foam.input.touch",name: "PinchTwistGesture",extends: "foam.input.touch.Gesture",properties: [{name: "name",defaultValue: "pinchTwist"},{name: "handlers"},{name: "points"}],methods: [function getPoints(map) {
      var keys = Object.keys(map);
      return [map[keys[0]], map[keys[1]]];
    },function recognize(map) {
      // I recognize:
      // - two points that
      // - are both not done and
      // - have begun to move.
      if ( Object.keys(map).length !== 2 ) return this.NO;

      var points = this.getPoints(map);
      if ( points[0].done || points[1].done ) return this.NO;
      var moved = ( points[0].dx !== 0 || points[0].dy !== 0 ) &&
          ( points[1].dx !== 0 || points[1].dy !== 0 );
      return moved ? this.YES : this.MAYBE;
    },function attach(map, handlers) {
      // I have three callbacks:
      // function pinchStart();
      // function pinchMove(scale, rotation);
      // function pinchEnd();
      // Scale is a unitless scaling factor, relative to the **start of the gesture**.
      // Rotation is degrees clockwise relative to the **start of the gesture**.
      // That is, these values are net totals since the gesture began,
      // they are not incremental between pinchMove calls, or absolute to the page.
      // A user of this gesture should save the original values on pinchStart,
      // and adjust them by the values from each pinchMove to update the UI.
      // See demos/pinchgesture.html.
      Object_forEach(map, function(p) { p.shouldPreventDefault = true; });
      this.points = this.getPoints(map);
      this.handlers = handlers || [];

      this.points.forEach(function(p) {
        p.x$.addListener(this.onMove);
        p.y$.addListener(this.onMove);
        p.done$.addListener(this.onDone);
      }.bind(this));

      // Now send the start event to all the handlers.
      this.pingHandlers('pinchStart');
      this.onMove();
    },function pingHandlers(method, scale, rotation) {
      for ( var i = 0 ; i < this.handlers.length ; i++ ) {
        var h = this.handlers[i];
        h && h[method] && h[method](scale, rotation);
      }
    },function distance(x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return Math.sqrt(dx*dx + dy*dy);
    }],listeners: [{name: "onMove",code: function() {
        var oldDist = this.distance(this.points[0].x0, this.points[0].y0,
                                    this.points[1].x0, this.points[1].y0);
        var newDist = this.distance(this.points[0].x, this.points[0].y,
                                    this.points[1].x, this.points[1].y);
        var scale = newDist / oldDist;

        // These are values from -pi to +pi.
        var oldAngle = Math.atan2(this.points[1].y0 - this.points[0].y0, this.points[1].x0 - this.points[0].x0);
        var newAngle = Math.atan2(this.points[1].y - this.points[0].y, this.points[1].x - this.points[0].x);
        var rotation = newAngle - oldAngle;
        while ( rotation < - Math.PI ) rotation += 2 * Math.PI;
        while ( rotation > Math.PI ) rotation -= 2 * Math.PI;
        // That's in radians, so I'll convert to degrees.
        rotation *= 360;
        rotation /= 2 * Math.PI;

        this.pingHandlers('pinchMove', scale, rotation);
      }},{name: "onDone",code: function(obj, prop, old, nu) {
        this.points.forEach(function(p) {
          p.x$.removeListener(this.onMove);
          p.y$.removeListener(this.onMove);
          p.done$.removeListener(this.onDone);
        });
        this.pingHandlers('pinchEnd');
      }}],help: "Gesture that understands a two-finger pinch/stretch and rotation"})
CLASS({package: "foam.input.touch",name: "ScrollGesture",extends: "foam.input.touch.Gesture",properties: [{name: "name",factory: function() {
        return this.direction + 'Scroll' + ( this.momentumEnabled ? 'Momentum' : this.nativeScrolling ? 'Native' : '' );
      }},{name: "direction",defaultValue: "vertical"},{name: "isVertical",factory: function() { return this.direction === 'vertical'; }},{name: "momentumEnabled",defaultValue: false,help: "Set me to true (usually by attaching the \"verticalScrollMomentum\" gesture) to enable momentum"},{name: "nativeScrolling",defaultValue: false,help: "Set me to true (usually by attaching the \"verticalScrollNative\" gesture) to enable native browser scrolling"},{name: "dragCoefficient",defaultValue: 0.94,help: "Each frame, the momentum will be multiplied by this coefficient. Higher means LESS drag."},{name: "dragClamp",defaultValue: 0.05,help: "The speed threshold (pixels/millisecond) below which the momentum drops to 0."},{name: "momentum",defaultValue: 0,help: "The current speed, in pixels/millisecond, at which the scroller is sliding."},{name: "lastTime",visibility: "hidden",hidden: true,defaultValue: 0,help: "The performance.now() value for the last time we computed the momentum slide."},{name: "tickRunning",visibility: "hidden",hidden: true,defaultValue: false,help: "True when the physics tick should run."},{name: "handlers"}],constants: [{name: "DRAG_TOLERANCE",value: 10}],methods: [function recognize(map) {
      // I recognize:
      // - a single point that
      // - is touch, not mouse and
      // - is not done and
      // - has moved at least 10px in the primary direction
      // OR
      // - is a single point that
      // - is touch, not mouse, and
      // - is not done and
      // - we are moving with momentum

      if ( Object.keys(map).length !== 1 ) return this.NO;
      var point = map[Object.keys(map)[0]];

      if ( point.type === 'mouse' || point.done ) return this.NO;
      if ( Math.abs(this.momentum) > 0 ) return this.YES;
      var delta = Math.abs(this.isVertical ? point.totalY : point.totalX);
      return delta > this.DRAG_TOLERANCE ? this.YES : this.MAYBE;
    },function attach(map, handlers) {
      var point = map[Object.keys(map)[0]];
      this.handlers = handlers || [];

      if ( this.nativeScrolling ) return;

      Object_forEach(map, function(p) { p.shouldPreventDefault = true; });

      (this.isVertical ? point.y$ : point.x$).addListener(this.onDelta);
      point.done$.addListener(this.onDone);

      // If we're already scrolling with momentum, we let the user adjust that momentum with their touches.
      if ( this.momentum === 0 ) {
        // Now send the start and subsequent events to all the handlers.
        // This is essentially replaying the history for all the handlers,
        // now that we've been recognized.
        // In this particular case, all three handlers are called with dy, totalY, and y.
        // The handlers are {vertical,horizontal}Scroll{Start,Move,End}.
        //
        // TODO(braden): Maybe change this to make the last parameter the current?
        // That will prevent a first-frame jump with a large delta.
        this.pingHandlers(this.direction + 'ScrollStart', 0, 0, this.isVertical ? point.y0 : point.x0);
      } else {
        this.tickRunning = false;
      }
    },function pingHandlers(method, d, t, c) {
      for ( var i = 0 ; i < this.handlers.length ; i++ ) {
        var h = this.handlers[i];
        h && h[method] && h[method](d, t, c, this.stopMomentum);
      }
    },function sendEndEvent(point) {
      var delta = this.isVertical ? point.dy : point.dx;
      var total = this.isVertical ? point.totalY : point.totalX;
      var current = this.isVertical ? point.y : point.x;
      this.pingHandlers(this.direction + 'ScrollEnd', delta, total, current);
    },function calculateInstantaneousVelocity(point) {
      // Compute and return the instantaneous velocity, which is
      // the primary axis delta divided by the time it took.
      // Our unit for velocity is pixels/millisecond.
      var now = this.X.performance.now();
      var lastTime = this.tickRunning ? this.lastTime : point.lastTime;
      var velocity = (this.isVertical ? point.dy : point.dx) / (now - point.lastTime);
      if ( this.tickRunning ) this.lastTime = now;

      return velocity;
    }],listeners: [{name: "onDelta",code: function(obj, prop, old, nu) {
        if ( this.momentumEnabled ) {
          // If we're already moving with momentum, we simply add the delta between
          // the currently momentum velocity and the instantaneous finger velocity.
          var velocity = this.calculateInstantaneousVelocity(obj);
          var delta = velocity - this.momentum;
          this.momentum += delta;
        }
        var delta = this.isVertical ? obj.dy : obj.dx;
        var total = this.isVertical ? obj.totalY : obj.totalX;
        var current = this.isVertical ? obj.y : obj.x;
        this.pingHandlers(this.direction + 'ScrollMove', delta, total, current);
      }},{name: "onDone",code: function(obj, prop, old, nu) {
        (this.isVertical ? obj.y$ : obj.x$).removeListener(this.onDelta);
        obj.done$.removeListener(this.onDone);

        if ( this.momentumEnabled ) {
          if ( Math.abs(this.momentum) < this.dragClamp ) {
            this.momentum = 0;
            this.sendEndEvent(obj);
          } else {
            this.tickRunning = true;
            this.lastTime = this.X.performance.now();
            this.tick(obj);
          }
        } else {
          this.sendEndEvent(obj);
        }
      }},{name: "tick",code: function(touch) {
        // First, check if momentum is 0. If so, abort.
        if ( ! this.tickRunning ) return;

        var xy = this.isVertical ? 'y' : 'x';

        var now = this.X.performance.now();
        var elapsed = now - this.lastTime;
        this.lastTime = now;

        // The distance covered in this amount of time.
        var distance = this.momentum * elapsed; // Fractional pixels.
        touch[xy] += distance;
        // Emit a touchMove for this.
        var delta, total, current;
        if ( this.isVertical ) { delta = touch.dy; total = touch.totalY; current = touch.y; }
        else { delta = touch.dx; total = touch.totalX; current = touch.x; }

        if ( delta != 0 )
          this.pingHandlers(this.direction + 'ScrollMove', delta, total, current);

        // Now we reduce the momentum to its new value.
        this.momentum *= this.dragCoefficient;

        // If this is less than the threshold, we reduce it to 0.
        if ( Math.abs(this.momentum) < this.dragClamp ) {
          this.momentum = 0;
          this.tickRunning = false;
          this.sendEndEvent(touch);
        } else {
          this.tick(touch);
        }
      },isFramed: true},{name: "stopMomentum",code: function() {
        this.momentum = 0;
        // Let tickRunning continue to be true, since tick() will send the end event properly,
        // now that the momentum has run out.
      }}],help: "Gesture that understands vertical or horizontal scrolling."})
CLASS({package: "foam.input.touch",name: "TapGesture",extends: "foam.input.touch.Gesture",properties: [{name: "name",defaultValue: "tap"},{name: "handlers"}],constants: [{name: "DRAG_TOLERANCE",value: 40}],methods: [function recognize(map) {
      // I recognize:
      // - multiple points that
      // - are all done and
      // - none of which has moved more than DRAG_TOLERANCE in some direction.
      var response;
      var doneCount = 0;
      var self = this;
      var keys = Object.keys(map);
      for ( var i = 0 ; i < keys.length ; i++ ) {
        var key = keys[i];
        var p = map[key];
        if ( Math.abs(p.totalX) >= this.DRAG_TOLERANCE ||
            Math.abs(p.totalY) >= this.DRAG_TOLERANCE ) {
          return this.NO;
        }
        if ( p.done ) doneCount++;
      }
      if ( response === this.NO ) return response;
      return doneCount === keys.length ? this.YES : this.WAIT;
    },function attach(map, handlers) {
      // Nothing to listen for; the tap has already fired when this recognizes.
      // Just sent the tapClick(pointMap) message to the handlers.
      if  ( ! handlers || ! handlers.length ) return;
      var points = 0;
      Object_forEach(map, function(point) {
        points++;
        point.shouldPreventDefault = true;
      });
      handlers.forEach(function(h) {
        h && h.tapClick && h.tapClick(map);
      });
    }],help: "Gesture that understands a quick, possible multi-point tap. Calls into the handler: tapClick(numberOfPoints)."})
CLASS({package: "foam.input.touch",name: "InputPoint",properties: [{name: "id"},{name: "type"},{model_:"BooleanProperty",name: "done",type: "Boolean"},{name: "x",postSet: function(old, nu) {
        this.lastX = old;
      }},{name: "y",postSet: function(old, nu) {
        this.lastY = old;
      }},{name: "x0",factory: function() { return this.x; }},{name: "y0",factory: function() { return this.y; }},{name: "lastX",factory: function() { return this.x; }},{name: "lastY",factory: function() { return this.y; }},{name: "dx",getter: function() { return this.x - this.lastX; }},{name: "dy",getter: function() { return this.y - this.lastY; }},{name: "totalX",getter: function() { return this.x - this.x0; }},{name: "totalY",getter: function() { return this.y - this.y0; }},{name: "lastTime"},{name: "shouldPreventDefault",defaultValue: false}]})
CLASS({package: "foam.input.touch",name: "TouchManager",requires: ["foam.input.touch.InputPoint"],properties: [{name: "touches",factory: function() { return {}; }}],constants: [{name: "TOUCH_START",value: ["touch-start"]},{name: "TOUCH_END",value: ["touch-end"]},{name: "TOUCH_MOVE",value: ["touch-move"]}],methods: [function init() {
      this.SUPER();
      if ( this.X.document ) this.install(this.X.document);
    },function install(d) {
      d.addEventListener('touchstart', this.onTouchStart);
    },function attach(e) {
      e.addEventListener('touchmove', this.onTouchMove);
      e.addEventListener('touchend', this.onTouchEnd);
      e.addEventListener('touchcancel', this.onTouchCancel);
      e.addEventListener('touchleave', this.onTouchEnd);
    },function detach(e) {
      e.removeEventListener('touchmove', this.onTouchMove);
      e.removeEventListener('touchend', this.onTouchEnd);
      e.removeEventListener('touchcancel', this.onTouchCancel);
      e.removeEventListener('touchleave', this.onTouchEnd);
    },function touchStart(i, t, e) {
      this.touches[i] = this.InputPoint.create({
        id: i,
        type: 'touch',
        x: t.pageX,
        y: t.pageY
      });
      this.publish(this.TOUCH_START, this.touches[i]);
    },function touchMove(i, t, e) {
      var touch = this.touches[i];
      touch.x = t.pageX;
      touch.y = t.pageY;

      // On touchMoves only, set the lastTime.
      // This is used by momentum scrolling to find the speed at release.
      touch.lastTime = this.X.performance.now();

      if ( touch.shouldPreventDefault ) e.preventDefault();

      this.publish(this.TOUCH_MOVE, this.touch);
    },function touchEnd(i, t, e) {
      var touch = this.touches[i];
      touch.x = t.pageX;
      touch.y = t.pageY;
      touch.done = true;
      this.publish(this.TOUCH_END, touch);
      if ( touch.shouldPreventDefault && e.cancelable ) e.preventDefault();
      delete this.touches[i];
    },function touchCancel(i, t, e) {
      this.touches[i].done = true;
      this.publish(this.TOUCH_END, this.touches[i]);
    },function touchLeave(i, t, e) {
      this.touches[i].done = true;
      this.publish(this.TOUCH_END, this.touches[i]);
    }],listeners: [{name: "onTouchStart",code: function(e) {
        if (!e._touchcount)
          e._touchcount = 0;
        e._touchcount++;
        // Attach an element-specific touch handlers, in case it gets removed
        // from the DOM. We only need to do this once, so do it when the first
        // touch starts on the object.
        if (e._touchcount == 1)
          this.attach(e.target);

        for ( var i = 0; i < e.changedTouches.length; i++ ) {
          var t = e.changedTouches[i];
          this.touchStart(t.identifier, t, e);
        }
      }},{name: "onTouchMove",code: function(e) {
        for ( var i = 0; i < e.changedTouches.length; i++ ) {
          var t = e.changedTouches[i];
          var id = t.identifier;
          if ( ! this.touches[id] ) {
            console.warn('Touch move for unknown touch.');
            continue;
          }
          this.touchMove(id, t, e);
        }
      }},{name: "onTouchEnd",code: function(e) {
        e._touchcount--;
        // Don't detach handlers until all touches on the object have ended.
        if (e._touchcount == 0)
          this.detach(e.target);

        for ( var i = 0; i < e.changedTouches.length; i++ ) {
          var t = e.changedTouches[i];
          var id = t.identifier;
          if ( ! this.touches[id] ) {
            console.warn('Touch end for unknown touch ' + id, Object.keys(this.touches));
            continue;
          }
          this.touchEnd(id, t, e);
        }
      }},{name: "onTouchCancel",code: function(e) {
        this.detach(e.target);

        for ( var i = 0; i < e.changedTouches.length; i++ ) {
          var t = e.changedTouches[i];
          var id = t.identifier;
          if ( ! this.touches[id] ) {
            console.warn('Touch cancel for unknown touch.');
            continue;
          }
          this.touchCancel(id, t, e);
        }
      }},{name: "onTouchLeave",code: function(e) {
        this.detach(e.target);

        for ( var i = 0; i < e.changedTouches.length; i++ ) {
          var t = e.changedTouches[i];
          var id = t.identifier;
          if ( ! this.touches[id] ) {
            console.warn('Touch cancel for unknown touch.');
            continue;
          }
          this.touchLeave(id, t, e);
        }
      }}]})
CLASS({package: "foam.ui.md",name: "Flare",requires: ["foam.graphics.Circle"],properties: [{name: "element"},{name: "color",defaultValue: "#aaaaaa"},{name: "startAlpha",defaultValue: 1},{name: "startX",defaultValue: 1},{name: "startY",defaultValue: 1},{name: "startLocation",defaultValue: "percent"},{name: "cssPosition",defaultValue: "fixed"},{name: "flareState",defaultValue: "detached"},{model_:"IntProperty",name: "growTime",type: "Int",defaultValue: 400},{model_:"IntProperty",name: "fadeTime",type: "Int",defaultValue: 200}],listeners: [{name: "fire",code: function() {
        var w = this.element.offsetWidth, h = this.element.offsetHeight,
            x = this.startLocation !== 'percent' ? this.startX :
                this.startX * w,
            y = this.startLocation !== 'percent' ? this.startY :
                this.startY * h;

        var c = this.Circle.create({
          r: 0,
          width: w,
          height: h,
          x: x,
          y: y,
          color: this.color,
          alpha: this.startAlpha
        });

        // Only draw one quarter of the Circle if we're starting in a corder.
        if ( this.startX == 0 && this.startY == 0 ) {
          c.startAngle = Math.PI * 1.5;
          c.endAngle   = Math.PI * 2;
        } else if ( this.startX == 0 && this.startY == 1 ) {
          c.startAngle = 0;
          c.endAngle   = Math.PI / 2;
        } else if ( this.startX == 1 && this.startY == 0 ) {
          c.startAngle = Math.PI;
          c.endAngle   = Math.PI * 1.5;
        } else if ( this.startX == 1 && this.startY == 1 ) {
          c.startAngle = Math.PI / 2;
          c.endAngle   = Math.PI;
        }

        var view = c.toView_();
        var div = document.createElement('div');
        var dStyle = div.style;
        dStyle.position = this.cssPosition;
        dStyle.left = 0;
        dStyle.top = 0;
        dStyle.zIndex = 4;
        // dStyle.zIndex = 101;

        var id = this.X.lookup('foam.ui.View').getPrototype().nextID();
        div.id = id;
        div.innerHTML = view.toHTML();

        this.flareState = 'growing';

        this.element.appendChild(div);
        view.initHTML();

        Movement.compile([
          [this.growTime, function() { c.r = 1.25 * Math.sqrt(w*w + h*h); }],
          function() { this.flareState = 'fading'; }.bind(this),
          [this.fadeTime, function() { c.alpha = 0; }],
          function() { div.remove(); this.flareState = 'detached'; }.bind(this)
        ])();

        c.r$.addListener(EventService.framed(view.paint.bind(view)));
        c.alpha$.addListener(EventService.framed(view.paint.bind(view)));
      }}]})
CLASS({package: "foam.ui",name: "DAOListView",extends: "foam.ui.SimpleView",traits: ["foam.ui.DAODataViewTrait"],requires: ["SimpleValue"],properties: [{model_:"BooleanProperty",name: "isHidden",type: "Boolean",postSet: function(_, isHidden) {
        if ( this.dao && ! isHidden ) this.onDAOUpdate();
      },defaultValue: false},{model_:"ViewFactoryProperty",name: "rowView",type: "ViewFactory",defaultValue: "foam.ui.DetailView"},{name: "mode",view: {factory_: "foam.ui.ChoiceView",choices: ["read-only","read-write","final"]},defaultValue: "read-write"},{name: "useSelection",postSet: function(old, nu) {
        if ( this.useSelection && !this.X.selection$ ) this.X.selection$ = this.SimpleValue.create();
        this.selection$ = this.X.selection$;
      },help: "Backward compatibility for selection mode. Create a X.selection$ value in your context instead."},{name: "selection",factory: function() {
        return this.SimpleValue.create();
      },help: "Backward compatibility for selection mode. Create a X.selection$ value in your context instead."},{name: "scrollContainer",help: "Containing element that is responsible for scrolling."},{name: "chunkSize",defaultValue: 0,help: "Number of entries to load in each infinite scroll chunk."},{name: "chunksLoaded",defaultValue: 1,help: "The number of chunks currently loaded."},{model_:"BooleanProperty",name: "painting",type: "Boolean",transient: true,defaultValue: false},{model_:"BooleanProperty",name: "repaintRequired",type: "Boolean",transient: true,defaultValue: false},{model_:"ArrayProperty",name: "propertyListeners_",type: "Array",lazyFactory: function() { return []; }}],constants: [{name: "ROW_CLICK",value: ["row-click"]}],methods: [function init() {
      this.SUPER();

      var self = this;
      this.subscribe(this.ON_HIDE, function() {
        self.isHidden = true;
      });

      this.subscribe(this.ON_SHOW, function() {
        self.isHidden = false;
      });

      // bind to selection, if present
      if (this.X.selection$) {
        this.selection$ = this.X.selection$;
      }
    },function initHTML() {
      this.SUPER();

      // If we're doing infinite scrolling, we need to find the container.
      // Either an overflow: scroll element or the window.
      // We keep following the parentElement chain until we get null.
      if ( this.chunkSize > 0 ) {
        var e = this.$;
        while ( e ) {
          if ( window.getComputedStyle(e).overflow === 'scroll' ) break;
          e = e.parentElement;
        }
        this.scrollContainer = e || window;
        this.scrollContainer.addEventListener('scroll', this.onScroll, false);
      }

      if ( ! this.isHidden ) this.updateHTML();
    },function construct() {
      if ( ! this.dao || ! this.$ ) return;
      if ( this.painting ) {
        this.repaintRequired = true;
        return;
      }
      this.painting = true;
      var out = [];
      this.children = [];
      this.initializers_ = [];

      var doneFirstItem = false;
      var d = this.dao;
      if ( this.chunkSize ) {
        d = d.limit(this.chunkSize * this.chunksLoaded);
      }
      d.select({put: function(o) {
        if ( this.mode === 'read-write' ) o = o.model_.create(o, this.Y); //.clone();
        var view = this.rowView({data: o, model: o.model_}, this.Y);
        // TODO: Something isn't working with the Context, fix
        view.DAO = this.dao;
        if ( this.mode === 'read-write' ) {
          this.addRowPropertyListener(o, view);
        }
        this.addChild(view);

        if ( ! doneFirstItem ) {
          doneFirstItem = true;
        } else {
          this.separatorToHTML(out); // optional separator
        }

        if ( this.X.selection$ ) {
          var itemId = this.on('click', (function() {
            this.selection = o;
            this.publish(this.ROW_CLICK);
          }).bind(this))
          this.setClass('dao-selected', function() { return equals(this.selection, o); }.bind(this), itemId);
          this.setClass(this.className + '-row', function() { return true; }, itemId);
          out.push('<div id="' + itemId + '">');
        }
        out.push(view.toHTML());
        if ( this.X.selection$ ) {
          out.push('</div>');
        }
      }.bind(this)})(function() {
        if (this.repaintRequired) {
          this.repaintRequired = false;
          this.painting = false;
          this.realDAOUpdate();
          return;
        }

        var e = this.$;

        if ( ! e ) return;

        e.innerHTML = out.join('');
        this.initInnerHTML();
        this.painting = false;
      }.bind(this));
    },function destroy(isParentDestroyed) {
      var listeners = this.propertyListeners_;
      for ( var i = 0; i < listeners.length; ++i ) {
        listeners[i].data.removePropertyListener(null, listeners[i].listener);
      }
      this.propertyListeners_ = [];
      return this.SUPER(isParentDestroyed);
    },function fromElement(e) {
      var children = e.children;
      if ( children.length == 1 && children[0].nodeName === 'rowView' ) {
        this.SUPER(e);
      } else {
        this.rowView = e.innerHTML;
      }
    },function separatorToHTML(out) {
      /* Template method. Override to provide a separator if required. This
      method is called <em>before</em> each list item, except the first. Use
      out.push("<myhtml>...") for efficiency. */
    },function addRowPropertyListener(data, view) {
      var listener = function(o, topic) {
        var prop = o.model_.getProperty(topic[1]);
        // TODO(kgr): remove the deepClone when the DAO does this itself.
        if ( ! prop.transient ) {
          // TODO: if o.id changed, remove the old one?
          view.DAO.put(o.deepClone());
        }
      };
      data.addPropertyListener(null, listener);
      this.propertyListeners_.push({ data: data, listener: listener });
    }],listeners: [{name: "onDAOUpdate",code: function() {
        this.realDAOUpdate();
      }},{name: "realDAOUpdate",code: function() {
        if ( ! this.isHidden ) this.updateHTML();
      },isFramed: true},{name: "onScroll",code: function() {
        var e = this.scrollContainer;
        if ( this.chunkSize > 0 && e.scrollTop + e.offsetHeight >= e.scrollHeight ) {
          this.chunksLoaded++;
          this.updateHTML();
        }
      }}]})
CLASS({package: "foam.ui",name: "DAODataViewTrait",exports: ["dao as daoViewCurrentDAO"],properties: [{name: "data",preSet: function(old, nu) {
        if ( this.dao !== nu ) {
          this.dao = nu;
        }
        return nu;
      }},{model_:"foam.core.types.DAOProperty",name: "dao",label: "DAO",postSet: function(oldDAO, dao) {
        if ( ! dao ) {
          this.data = '';
        } else if ( ! equals(this.data, dao) ) {
          this.data = dao;
        }
      },help: "An alias for the data property.",onDAOUpdate: "onDAOUpdate"}],methods: [function onDAOUpdate() { /* Implement this $$DOC{ref:'Method'} in
      sub-models to respond to changes in $$DOC{ref:'.dao'}. */
    }]})
CLASS({package: "foam.core.types",name: "DAOProperty",extends: "Property",requires: ["foam.dao.FutureDAO","foam.dao.ProxyDAO"],imports: ["console"],properties: [{name: "type",defaultValue: "DAO",help: "The FOAM type of this property."},{model_:"ModelProperty",name: "model",type: "Model",help: "The model for objects stored in the DAO."},{name: "view",defaultValue: "foam.ui.DAOListView"},{name: "onDAOUpdate"},{name: "install",defaultValue: function(prop) {
        defineLazyProperty(this, prop.name + '$Proxy', function() {
          if ( ! this[prop.name] ) {
            var future = afuture();
            var delegate = prop.FutureDAO.create({
              future: future.get
            });
          } else
            delegate = this[prop.name];

          var proxy = prop.ProxyDAO.create({delegate: delegate});

          this.addPropertyListener(prop.name, function(_, __, ___, dao) {
            if ( future ) {
              future.set(dao);
              future = null;
              return;
            }
            proxy.delegate = dao;
          });

          return {
            get: function() { return proxy; },
            configurable: true
          };
        });
      }},{name: "fromElement_",defaultValue: function(e, p, model) {
          var children = e.children;
          for ( var i = 0 ; i < children.length ; i++ ) {
            this[p.name].put(model.create(null, this.Y).fromElement(
                children[i], p));
          }
      }},{name: "fromElement",defaultValue: function(e, p) {
        var model = e.getAttribute('model') ||
            (this[p.name] && this[p.name].model) || p.model || '';
        if ( ! model ) {
          this.console.warn('Attempt to load DAO from element without model');
          return;
        }
        if ( typeof model === 'string' ) {
          this.X.arequire(model)(function(model) {
            p.fromElement_.call(this, e, p, model);
          }.bind(this));
        } else {
          p.fromElement_.call(this, e, p, model);
        }
      }}],help: "Describes a DAO property."})
CLASS({package: "foam.dao",name: "FutureDAO",extends: "foam.dao.ProxyDAO",properties: [{name: "delegate",factory: function() { return null; }},{name: "future",required: true},{name: "model",defaultValueFn: function() { return this.delegate ? this.delegate.model : ''; }}],methods: [function init() { /* Sets up the future to provide us with the delegate when it becomes available. */
        this.SUPER();

        this.future(function(delegate) {
          var listeners = this.daoListeners_;
          this.daoListeners_ = [];
          this.delegate = delegate;
          this.daoListeners_ = listeners;
          if ( this.daoListeners_.length ) {
            this.delegate.listen(this.relay);
          }
        }.bind(this));
      },function put(value, sink) { /* Passthrough to delegate or the future, if delegate not set yet. */
        if ( this.delegate ) {
          this.delegate.put(value, sink);
        } else {
          this.future(this.put.bind(this, value, sink));
        }
      },function remove(query, sink) { /* Passthrough to delegate or the future, if delegate not set yet. */
      if ( this.delegate ) {
        this.delegate.remove(query, sink);
      } else {
        this.future(this.remove.bind(this, query, sink));
      }
    },function removeAll() { /* Passthrough to delegate or the future, if delegate not set yet. */
      if ( this.delegate ) {
        return this.delegate.removeAll.apply(this.delegate, arguments);
      }

      var a = arguments;
      var f = afuture();
      this.future(function(delegate) {
        this.removeAll.apply(this, a)(f.set);
      }.bind(this));

      return f.get;
    },function find(key, sink) {/* Passthrough to delegate or the future, if delegate not set yet. */
        if ( this.delegate ) {
          this.delegate.find(key, sink);
        } else {
          this.future(this.find.bind(this, key, sink));
        }
      },function select(sink, options) {/* Passthrough to delegate or the future, if delegate not set yet. */
        if ( this.delegate ) {
          return this.delegate.select(sink, options);
        }

        var a = arguments;
        var f = afuture();
        this.future(function() {
          this.select.apply(this, a)(f.set);
        }.bind(this));

        return f.get;
      }]})
CLASS({package: "foam.dao",name: "ProxyDAO",extends: "AbstractDAO",requires: ["foam.dao.NullDAO"],properties: [{name: "relay",factory: function() { /* Sets up relay for listening to delegate changes. */
        var self = this;
        return {
          put:    function() { self.notify_('put', arguments);    },
          remove: function() { self.notify_('remove', arguments); },
          reset: function() { self.notify_('reset', arguments); },
          toString: function() { return 'RELAY(' + this.$UID + ', ' + self.model_.name + ', ' + self.delegate + ')'; }
        };
      }},{name: "delegate",mode: "read-only",required: true,visibility: "hidden",hidden: true,transient: true,factory: function() { return this.NullDAO.create(); },postSet: function(oldDAO, newDAO) {
        if ( this.daoListeners_.length ) {
          if ( oldDAO ) oldDAO.unlisten(this.relay);
          newDAO.listen(this.relay);
          // FutureDAOs will put via the future. In that case, don't put here.
          this.notify_('reset', []);
        }
      }},{model_:"ModelProperty",name: "model",type: "Model",required: false,defaultValueFn: function() { return this.delegate.model; }}],methods: [function put(value, sink) { /* Passthrough to delegate. */
        this.delegate.put(value, sink);
      },function remove(query, sink) { /* Passthrough to delegate. */
        this.delegate.remove(query, sink);
      },function removeAll() {
        return this.delegate.removeAll.apply(this.delegate, arguments);
      },function find(key, sink) { /* Passthrough to delegate. */
        this.delegate.find(key, sink);
      },function select(sink, options) { /* Passthrough to delegate. */
        return this.delegate.select(sink, options);
      },function listen(sink, options) { /* Passthrough to delegate, using $$DOC{ref:'.relay'}. */
        // Adding first listener, so listen to delegate
        if ( ! this.daoListeners_.length && this.delegate ) {
          this.delegate.listen(this.relay);
        }

        this.SUPER(sink, options);
      },function unlisten(sink) {
        this.SUPER(sink);

        // Remove last listener, so unlisten to delegate
        if ( this.daoListeners_.length === 0 && this.delegate ) {
          this.delegate.unlisten(this.relay);
        }
      },function toString() { /* String representation. */
      return this.name_ + '(' + this.delegate + ')';
    }]})
CLASS({package: "foam.dao",name: "NullDAO",methods: [function put(obj, sink) { sink && sink.put && sink.put(obj); },function remove(obj, sink) { sink && sink.remove && sink.remove(obj); },function select(sink) {
      sink && sink.eof && sink.eof();
      return aconstant(sink || [].sink);
    },function find(q, sink) { sink && sink.error && sink.error('find', q); },function listen() {},function removeAll() {},function unlisten() {},function pipe() {},function where() { return this; },function limit() { return this; },function skip() { return this; },function orderBy() { return this; }],help: "A DAO that stores nothing and does nothing."})
CLASS({package: "foam.apps.calc",name: "Num",extends: "Action",properties: [{name: "n"},{name: "name",defaultValueFn: function() { return this.n.toString(); }},{name: "keyboardShortcuts",defaultValueFn: function() { return [ this.n + '' ]; },factory: null},{name: "code",defaultValue: function(_, action) {
      var n = action.n;
      if ( ! this.editable ) {
        this.push(n);
        this.editable = true;
      } else {
        if ( this.a2 == '0' && ! n ) return;
        // 17 characters is the longest number we can handle without overflow.
        if ( this.a2.length >= 17 ) return;
        this.a2 = this.a2 == '0' ? n : this.a2.toString() + n;
      }
    }}]})
CLASS({package: "foam.apps.calc",name: "Binary",extends: "foam.apps.calc.Unary",properties: [{name: "code",defaultValue: function(_, action) {
      if ( this.a2 == '' ) {
        // the previous operation should be replaced, since we can't
        // finish this one without a second arg. The user probably hit one
        // binay op, followed by another.
        this.replace(action.f);
      } else {
        if ( this.op != this.model_.DEFAULT_OP ) this.equals();
        this.push('', action.f);
        this.editable = true;
      }
    }},{name: "label",defaultValueFn: function() { return this.name; }}],methods: [function init() {
      this.SUPER();
      this.f.unary = false;
      this.f.binary = true;
    }]})
CLASS({package: "foam.apps.calc",name: "Unary",extends: "Action",properties: [{name: "f"},{name: "longName",defaultValueFn: function() { return this.name; }},{name: "translationHint",defaultValueFn: function() { return this.longName ? 'short form for mathematical function: "' + this.longName + '"' : '' ;}},{name: "code",defaultValue: function(_, action) {
      this.op = action.f;
      this.push(action.f.call(this, this.a2));
      this.editable = false;
    }},{name: "label",defaultValueFn: function() { return this.name; }}],methods: [function init() {
      this.SUPER();
      this.f.label = '<span aria-label="' + this.speechLabel + '">' + this.label + '</span>';
      this.f.speechLabel = this.speechLabel;
      this.f.unary = true;
    }]})
CLASS({package: "foam.ui",name: "FoamTagView",extends: "foam.ui.View",requires: ["foam.html.Element","foam.ui.View","foam.ui.DetailView"],imports: ["document"],properties: [{name: "element"},{name: "className",defaultValue: "foam-tag"}],methods: [function init() {
      this.SUPER();

      if ( ! this.Element.isInstance(this.element) ) this.install();
    },function install() {
      var e = this.element;
      var models = [];
      var style     = e.getAttribute('style');
      var modelName = e.getAttribute('model');
      var viewName  = e.getAttribute('view');
      var onInit    = e.getAttribute('oninit');

      if ( modelName ) models.push(this.X.arequire(modelName));
      if ( viewName  ) models.push(this.X.arequire(viewName));

      aseq(apar.apply(null, models), function(ret) {
        if ( ! this.holder() ) return;

        var model = this.X.lookup(modelName);

        if ( ! model ) {
          this.error('Unknown Model: ', modelName);
          return;
        }

        model.getPrototype();

        var obj = model.create(null, this.X);
        obj.fromElement(e);

        if ( obj.model_.DATA && this.hasOwnProperty('data') )
          obj.data = this.data;

        var view;

        if ( viewName ) {
          var viewModel = this.X.lookup(viewName);
          view = viewModel.create({ model: model, data: obj }, obj.Y);
        } else if ( obj.toHTML ) {
          view = obj;
        } else if ( obj.toView_ ) {
          view = obj.toView_();
        } else if ( obj.toE ) {
          view = obj.toE(obj.Y);
        } else {
          var a = this.element.getAttribute('showActions');
          var showActions = ! a || (
            a.equalsIC('y')     ||
            a.equalsIC('yes')   ||
            a.equalsIC('true')  ||
            a.equalsIC('t') );

          view = this.X.lookup('foam.ui.DetailView').create({
            model: model,
            data: obj,
            showActions: showActions
          }, obj.Y);
        }

        if ( e.id ) this.document.FOAM_OBJECTS[e.id] = obj;
        obj.view_ = view;
        this.holder().outerHTML = view.toHTML();
        if ( style ) {
          view.$.setAttribute('style', style);
        }
        view.initHTML();

        if ( onInit )
          aeval('function() { ' + onInit + ' }')(function(f) { f.call(obj); });

      }.bind(this))();
    },function holder() {
      // TODO(kgr): Add an outerHTML setter to foam.html.Element instead
      return this.Element.isInstance(this.element) ? this.$ : this.element;
    },function error(msg) {
      console.error(msg);
      this.holder.innerHTML = msg;
    },function initHTML() {
      this.install();
    }]})
CLASS({package: "foam.html",name: "Element",properties: [{name: "id"},{name: "nodeName"},{name: "attributeMap_",transient: true,factory: function() { return {}; }},{name: "attributes",factory: function() { return []; },postSet: function(_, attrs) {
        for ( var i = 0 ; i < attrs.length ; i++ )
          this.attributeMap_[attrs[i].name] = attrs[i];
      }},{name: "childNodes",factory: function() { return []; }},{name: "children",transient: true,getter: function() {
        return this.childNodes.filter(function(c) { return typeof c !== 'string'; });
      }},{name: "outerHTML",transient: true,getter: function() {
        var out = '<' + this.nodeName;
        if ( this.id ) out += ' id="' + this.id + '"';
        for ( key in this.attributeMap_ ) {
          var value = this.attributeMap_[key].value;

          out += value == undefined ?
            ' ' + key :
            ' ' + key + '="' + this.attributeMap_[key].value + '"';
        }
        if ( ! this.ILLEGAL_CLOSE_TAGS[this.nodeName] &&
             ( ! this.OPTIONAL_CLOSE_TAGS[this.nodeName] || this.childNodes.length ) ) {
          out += '>';
          out += this.innerHTML;
          out += '</' + this.nodeName;
        }
        out += '>';
        return out;
      }},{name: "innerHTML",transient: true,getter: function() {
        var out = '';
        for ( var i = 0 ; i < this.childNodes.length ; i++ )
          out += this.childNodes[i].toString();
        return out;
      }}],constants: [{name: "OPTIONAL_CLOSE_TAGS",value: {HTML: true,HEAD: true,BODY: true,P: true,DT: true,DD: true,LI: true,OPTION: true,THEAD: true,TH: true,TBODY: true,TR: true,TD: true,TFOOT: true,COLGROUP: true}},{name: "ILLEGAL_CLOSE_TAGS",value: {IMG: true,INPUT: true,BR: true,HR: true,FRAME: true,AREA: true,BASE: true,BASEFONT: true,COL: true,ISINDEX: true,LINK: true,META: true,PARAM: true}}],methods: [function setAttribute(name, value) {
      var attr = this.getAttributeNode(name);

      if ( attr ) {
        attr.value = value;
      } else {
        attr = {name: name, value: value};
        this.attributes.push(attr);
        this.attributeMap_[name] = attr;
      }
    },function getAttributeNode(name) { return this.attributeMap_[name]; },function getAttribute(name) {
      var attr = this.getAttributeNode(name);
      return attr && attr.value;
    },function appendChild(c) { this.childNodes.push(c); },function removeChild(c) {
      for ( var i = 0; i < this.childNodes.length; ++i ) {
        if ( this.childNodes[i] === c ) {
          this.childNodes.splice(i, 1);
          break;
        }
      }
    },function toString() { return this.outerHTML; }]})
CLASS({package: "foam.ui",name: "DetailView",extends: "foam.ui.View",requires: ["Property","foam.ui.TextFieldView","foam.ui.IntFieldView","foam.ui.FloatFieldView","foam.ui.DAOController"],exports: ["propertyViewProperty"],properties: [{name: "className",defaultValue: "detailView"},{name: "data",preSet: function(old,nu) {
        if ( nu.model_ ) {
          this.model = nu.model_;
        }
        return nu;
      }},{name: "model",postSet: function(_, model) {
        console.assert(Model.isInstance(model), 'Invalid model specified for ' + this.name_);
      }},{name: "title",defaultValueFn: function() {
        return /*(this.data && this.data.id ? 'Edit ' : 'New ') +*/ this.model.label;
      }},{model_:"StringProperty",name: "mode",type: "String",defaultValue: "read-write"},{model_:"BooleanProperty",name: "showRelationships",type: "Boolean",defaultValue: false},{name: "propertyViewProperty",type: "Property",defaultValueFn: function() { return this.Property.DETAIL_VIEW; }}],methods: [function shouldDestroy(old,nu) {
      if ( ! old || ! old.model_ || ! nu || ! nu.model_ ) return true;
      return old.model_ !== nu.model_;
    },function generateContent() { /* rebuilds the children of the view */
      if ( ! this.$ ) return;
      this.$.outerHTML = this.toHTML();
      this.initHTML();
    },function titleHTML() {
      /* Title text HTML formatter */
      var title = this.title;

      return title ?
        '<tr><td colspan="2" class="heading">' + title + '</td></tr>' :
        '';
    },function startForm() { /* HTML formatter */ return '<table>'; },function endForm() { /* HTML formatter */ return '</table>'; },function startColumns() { /* HTML formatter */ return '<tr><td colspan=2><table valign=top><tr><td valign=top><table>'; },function nextColumn() { /* HTML formatter */ return '</table></td><td valign=top><table valign=top>'; },function endColumns() { /* HTML formatter */ return '</table></td></tr></table></td></tr>'; },function rowToHTML(prop, view) {
      /* HTML formatter for each $$DOC{ref:'Property'} row. */
      var str = '';

      if ( prop.detailViewPreRow ) str += prop.detailViewPreRow(this);

      str += '<tr class="detail-' + prop.name + '">';
      if ( this.DAOController.isInstance(view) ) {
        str += "<td colspan=2><div class=detailArrayLabel>" + prop.label + "</div>";
        str += view.toHTML();
        str += '</td>';
      } else {
        str += "<td class='label'>" + prop.label + "</td>";
        str += '<td>';
        str += view.toHTML();
        str += '</td>';
      }
      str += '</tr>';

      if ( prop.detailViewPostRow ) str += prop.detailViewPostRow(this);

      return str;
    },function toHTML() {
      /* Overridden to create the complete HTML content for the $$DOC{ref:'foam.ui.View'}.</p>
         <p>$$DOC{ref:'Model',usePlural:true} may specify a .toDetailHTML() $$DOC{ref:'Method'} or
         $$DOC{ref:'Template'} to render their contents instead of the
          $$DOC{ref:'foam.ui.DetailView.defaultToHTML'} we supply here.
      */

      if ( ! this.data ) return '<span id="' + this.id + '"></span>';

      if ( ! this.model ) throw "DetailView: either 'data' or 'model' must be specified.";

      return (this.model.getPrototype().toDetailHTML || this.defaultToHTML).call(this);
    },function getDefaultProperties() {
      return this.model.getRuntimeProperties();
    },function defaultToHTML() {
      /* For $$DOC{ref:'Model',usePlural:true} that don't supply a .toDetailHTML()
        $$DOC{ref:'Method'} or $$DOC{ref:'Template'}, a default listing of
        $$DOC{ref:'Property'} editors is implemented here.
        */
      this.children = [];
      var model = this.model;
      var str  = "";

      str += '<div id="' + this.id + '" ' + this.cssClassAttr() + '" name="form">';
      str += this.startForm();
      str += this.titleHTML();

      var properties = this.getDefaultProperties();
      for ( var i = 0 ; i < properties.length ; i++ ) {
        var prop = properties[i];

        if ( prop.hidden ) continue;

        var view = this.createView(prop);
        //view.data$ = this.data$;
        this.addDataChild(view);
        str += this.rowToHTML(prop, view);
      }

      str += this.endForm();

      if ( this.showRelationships ) {
        var view = this.X.lookup('foam.ui.RelationshipsView').create({
          data: this.data
        });
        //view.data$ = this.data$;
        this.addDataChild(view);
        str += view.toHTML();
      }

      str += '</div>';

      return str;
    }],templates: [{name: "CSS",code: ConstantTemplate(".detailView{border:solid 2px #dddddd;background:#fafafa;display:table}.detailView .heading{color:black;float:left;font-size:16px;margin-bottom:8px;padding:2px}.detailView .propertyLabel{font-size:14px;display:block;font-weight:bold;text-align:right;float:left}.detailView input{font-size:12px;padding:4px 2px;border:solid 1px #aacfe4;margin:2px 0 0px 10px}.detailView textarea{float:left;font-size:12px;padding:4px 2px;border:solid 1px #aacfe4;margin:2px 0 0px 10px;width:98%;overflow:auto}.detailView select{font-size:12px;padding:4px 2px;border:solid 1px #aacfe4;margin:2px 0 0px 10px}.detailView .label{color:#444;font-size:smaller;padding-left:6px;padding-top:8px;vertical-align:top}.detailArrayLabel{font-size:medium}.detailArrayLabel .foamTable{margin:1px}"),language: "css"}]})
CLASS({package: "foam.ui",name: "TextFieldView",label: "Text Field",extends: "foam.ui.SimpleView",requires: ["foam.ui.AutocompleteView"],properties: [{model_:"StringProperty",name: "name",type: "String",defaultValue: "field"},{model_:"IntProperty",name: "displayWidth",type: "Int",defaultValue: 30},{model_:"IntProperty",name: "displayHeight",type: "Int",defaultValue: 1},{model_:"StringProperty",name: "type",type: "String",defaultValue: "text"},{model_:"StringProperty",name: "placeholder",type: "String",defaultValue: ""},{model_:"BooleanProperty",name: "onKeyMode",type: "Boolean",getter: function() {
        return this.updateMode === this.EACH_KEYSTROKE;
      },setter: function(nu) {
        this.updateMode = nu ? this.EACH_KEYSTROKE : this.DONE_EDITING;
      },help: "If true, value is updated on each keystroke."},{model_:"foam.core.types.StringEnumProperty",name: "updateMode",defaultValue: "DONE_EDITING",help: "Controls when the real .data is updated: on every keystroke, when the user presses enter or blurs the box, or on enter only.",choices: [["DONE_EDITING","Done editing"],["EACH_KEYSTROKE","Every keystroke"],["ENTER_ONLY","Enter only"]]},{model_:"BooleanProperty",name: "escapeHTML",type: "Boolean",help: "If true, HTML content is escaped in display mode.",defaultValue: true},{model_:"StringProperty",name: "mode",type: "String",defaultValue: "read-write",view: {factory_: "foam.ui.ChoiceView",choices: ["read-only","read-write","final"]}},{model_:"BooleanProperty",name: "required",type: "Boolean"},{model_:"StringProperty",name: "pattern",type: "String"},{name: "domValue",visibility: "hidden",hidden: true},{name: "data"},{model_:"StringProperty",name: "readWriteTagName",type: "String",visibility: "hidden",hidden: true,defaultValueFn: function() {
        return this.displayHeight === 1 ? 'input' : 'textarea';
      }},{model_:"BooleanProperty",name: "autocomplete",type: "Boolean",defaultValue: true},{name: "autocompleter"},{name: "autocompleteView"}],constants: [{name: "ESCAPE",value: ["escape"]},{name: "DONE_EDITING",value: "DONE_EDITING"},{name: "EACH_KEYSTROKE",value: "EACH_KEYSTROKE"},{name: "ENTER_ONLY",value: "ENTER_ONLY"}],methods: [function toHTML() {
      /* Selects read-only versus read-write DOM output */
      return this.mode === 'read-write' ?
        this.toReadWriteHTML() :
        this.toReadOnlyHTML()  ;
    },function toReadWriteHTML() {
      /* Supplies the correct element for read-write mode */
      var str = '<' + this.readWriteTagName + ' id="' + this.id + '"';
      str += ' type="' + this.type + '" ' + this.cssClassAttr();

      this.on('click', this.onClick, this.id);

      str += this.readWriteTagName === 'input' ?
        ' size="' + this.displayWidth + '"' :
        ' rows="' + this.displayHeight + '" cols="' + this.displayWidth + '"';

      if ( this.required ) str += ' required';
      if ( this.pattern  ) str += ' pattern="' + this.pattern + '"';

      str += this.extraAttributes();

      str += ' name="' + this.name + '">';
      str += '</' + this.readWriteTagName + '>';
      return str;
    },function extraAttributes() { return ''; },function toReadOnlyHTML() {
      /* Supplies the correct element for read-only mode */
      var self = this;
      this.setClass('placeholder', function() { return self.data === ''; }, this.id);

      // Changing to a textarea doesn't work well because you can't override displayHeight
      // in templates
      return /* this.displayHeight === 1 ? */ '<' + this.tagName + ' id="' + this.id + '"' + this.cssClassAttr() + ' name="' + this.name + '"></' + this.tagName + '>' /*:
        '<textarea readonly id="' + this.id + '"' + this.cssClassAttr() + ' name="' + this.name + '" rows="' + this.displayHeight + '" cols="' + this.displayWidth + '"></textarea>'*/ ;
    },function setupAutocomplete() {
      /* Initializes autocomplete, if $$DOC{ref:'.autocomplete'} and
        $$DOC{ref:'.autocompleter'} are set. */
      if ( ! this.autocomplete || ! this.autocompleter ) return;

      var view = this.autocompleteView = this.AutocompleteView.create({
        autocompleter: this.autocompleter,
        target: this
      });

      this.bindAutocompleteEvents(view);
    },function onAutocomplete(data) {
      this.data = data;
    },function bindAutocompleteEvents(view) {
      this.$.addEventListener('blur', function() {
        // Notify the autocomplete view of a blur, it can decide what to do from there.
        view.publish('blur');
      });
      this.$.addEventListener('input', (function() {
        view.autocomplete(this.textToValue(this.$.value));
      }).bind(this));
      this.$.addEventListener('focus', (function() {
        view.autocomplete(this.textToValue(this.$.value));
      }).bind(this));
    },function initHTML() {
      if ( ! this.$ ) return;

      this.SUPER();

      if ( this.mode === 'read-write' ) {
        if ( this.placeholder ) this.$.placeholder = this.placeholder;

        if ( this.updateMode === this.EACH_KEYSTROKE ) {
          this.domValue = DomValue.create(this.$, 'input');
        } else if ( this.updateMode === this.DONE_EDITING ) {
          this.domValue = DomValue.create(this.$, 'change');
        } else {
          this.domValue = this.OnEnterValue.create({ element: this.$ });
        }

        // In KeyMode we disable feedback to avoid updating the field
        // while the user is still typing.  Then we update the view
        // once they leave(blur) the field.
        Events.relate(
          this.data$,
          this.domValue,
          this.valueToText.bind(this),
          this.textToValue.bind(this),
          this.updateMode === this.EACH_KEYSTROKE);

        if ( this.updateMode === this.EACH_KEYSTROKE )
          this.$.addEventListener('blur', this.onBlur);

        this.$.addEventListener('keydown', this.onKeyDown);
        this.$.addEventListener('keypress', this.onKeyPress);

        this.setupAutocomplete();
      } else {
        this.domValue = DomValue.create(
          this.$,
          'undefined',
          this.escapeHTML ? 'textContent' : 'innerHTML');

        Events.map(
          this.data$,
          this.domValue,
          this.valueToText.bind(this))
      }
    },function textToValue(text) { /* Passthrough */ return text; },function valueToText(value) { /* Filters for read-only mode */
      if ( this.mode === 'read-only' )
        return (value === '') ? this.placeholder : value;
      return value;
    },function destroy( isParentDestroyed ) { /* Unlinks key handler. */
      this.SUPER(isParentDestroyed);
      Events.unlink(this.domValue, this.data$);
    }],listeners: [{name: "onKeyDown",code: function(e) {
        if ( e.keyCode == 27 /* ESCAPE KEY */ ) {
          this.domValue.set(this.data);
          this.publish(this.ESCAPE);
        } else {
          this.publish(['keydown'], e);
        }
      }},{name: "onKeyPress",code: function(e) { e.stopPropagation(); }},{name: "onBlur",code: function(e) {
        if ( this.domValue.get() !== this.data )
          this.domValue.set(this.data);
      }},{name: "onClick",code: function(e) { this.$ && this.$.focus(); }}],models: [{package: "foam.ui.TextFieldView",name: "OnEnterValue",properties: [{name: "element"},{name: "listeners",factory: function() {
            return [];
          }}],methods: [function get() { return this.element.value; },function set(value) {
          if ( this.get() !== value ) this.element.value = value;
        },function addListener(listener) {
          if ( ! listener ) return;
          if ( this.listeners.length === 0 )
            this.element.addEventListener('keydown', this.onKeyDown);
          this.listeners.push(listener);
        },function removeListener(listener) {
          var index = this.listeners.indexOf(listener);
          if ( index >= 0 ) this.listeners.splice(i, 1);
        },function fireListeners(e) {
          for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](e);
          }
        }],listeners: [{name: "onKeyDown",code: function(e) {
            if ( e.keyCode === 13 ) {
              this.fireListeners(e);
            }
          }}]}]})
CLASS({package: "foam.ui",name: "AutocompleteView",extends: "foam.ui.PopupView",requires: ["foam.ui.ChoiceListView"],properties: [{name: "closeTimeout"},{name: "autocompleter"},{name: "completer"},{name: "current"},{model_:"IntProperty",name: "closeTime",type: "Int",units: "ms",help: "Time to delay the actual close on a .close call.",defaultValue: 200},{name: "view",postSet: function(prev, v) {
        if ( prev ) {
          prev.data$.removeListener(this.complete);
          prev.choices$.removeListener(this.choicesUpdate);
        }

        v.data$.addListener(this.complete);
        v.choices$.addListener(this.choicesUpdate);
      }},{name: "target",postSet: function(prev, v) {
        prev && prev.unsubscribe(['keydown'], this.onKeyDown);
        v.subscribe(['keydown'], this.onKeyDown);
      }},{name: "maxHeight",defaultValue: 400},{name: "className",defaultValue: "autocompletePopup"}],methods: [function autocomplete(partial) {
      if ( ! this.completer ) {
        var proto = this.X.lookup(this.autocompleter);
        this.completer = proto.create(null, this.Y);
      }
      if ( ! this.view ) {
        this.view = this.makeView();
      }

      this.current = partial;
      this.open(this.target);
      this.completer.autocomplete(partial);
    },function makeView() {
      return this.ChoiceListView.create({
        dao: this.completer.autocompleteDao$Proxy,
        extraClassName: 'autocomplete',
        orientation: 'vertical',
        mode: 'final',
        objToChoice: this.completer.f,
        useSelection: true
      }, this.Y);
    },function init(args) {
      this.SUPER(args);
      this.subscribe('blur', (function() {
        this.close();
      }).bind(this));
    },function open(e, opt_delay) {
      if ( this.closeTimeout ) {
        this.X.clearTimeout(this.closeTimeout);
        this.closeTimeout = 0;
      }

      if ( this.$ ) { this.position(this.$.firstElementChild, e.$ || e); return; }

      var parentNode = e.$ || e;
      var document = parentNode.ownerDocument;

      console.assert( this.X.document === document, 'X.document is not global document');

      var div    = document.createElement('div');
      var window = document.defaultView;

      console.assert( this.X.window === window, 'X.window is not global window');

      parentNode.insertAdjacentHTML('afterend', this.toHTML().trim());

      this.position(this.$.firstElementChild, parentNode);
      this.initHTML();
    },function close(opt_now) {
      if ( opt_now ) {
        if ( this.closeTimeout ) {
          this.X.clearTimeout(this.closeTimeout);
          this.closeTimeout = 0;
        }
        this.SUPER();
        return;
      }

      if ( this.closeTimeout ) return;

      var realClose = this.SUPER;
      var self = this;
      this.closeTimeout = this.X.setTimeout(function() {
        self.closeTimeout = 0;
        realClose.call(self);
      }, this.closeTime);
    },function position(div, parentNode) {
      var document = parentNode.ownerDocument;

      var pos = findPageXY(parentNode);
      var pageWH = [document.firstElementChild.offsetWidth, document.firstElementChild.offsetHeight];

      if ( pageWH[1] - (pos[1] + parentNode.offsetHeight) < (this.height || this.maxHeight || 400) ) {
        div.style.bottom = parentNode.offsetHeight;
        document.defaultView.innerHeight - pos[1];
      }

      if ( pos[2].offsetWidth - pos[0] < 600 )
        div.style.left = 600 - pos[2].offsetWidth;
      else
        div.style.left = -parentNode.offsetWidth;

      if ( this.width ) div.style.width = this.width + 'px';
      if ( this.height ) div.style.height = this.height + 'px';
      if ( this.maxWidth ) {
        div.style.maxWidth = this.maxWidth + 'px';
        div.style.overflowX = 'auto';
      }
      if ( this.maxHeight ) {
        div.style.maxHeight = this.maxHeight + 'px';
        div.style.overflowY = 'auto';
      }
    }],listeners: [{name: "onKeyDown",code: function(_, __, e) {
        if ( ! this.view ) return;

        if ( e.keyCode === 38 /* arrow up */ ) {
          this.view.index--;
          this.view.scrollToSelection(this.$);
          e.preventDefault();
        } else if ( e.keyCode  === 40 /* arrow down */ ) {
          this.view.index++;
          this.view.scrollToSelection(this.$);
          e.preventDefault();
        } else if ( e.keyCode  === 13 /* enter */ ) {
          this.view.commit();
          e.preventDefault();
        }
      }},{name: "complete",code: function() {
        this.target.onAutocomplete(this.view.data);
        this.view = this.makeView();
        this.close(true);
      }},{name: "choicesUpdate",code: function() {
        if ( this.view &&
             ( this.view.choices.length === 0 ||
               ( this.view.choices.length === 1 &&
                 this.view.choices[0][1] === this.current ) ) ) {
          this.close(true);
        }
      }}],templates: [{name: "toHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out('\n  <span id="',
 this.id ,
'" style="position:relative"><div ',
 this.cssClassAttr() ,
' style="position:absolute">',
 this.view ,
'</div></span>\n    ');return out.toString();},language: "html"}],help: "Default autocomplete popup."})
CLASS({package: "foam.ui",name: "ChoiceListView",extends: "foam.ui.AbstractChoiceView",properties: [{name: "orientation",view: {factory_: "foam.ui.ChoiceView",choices: [["horizontal","Horizontal"],["vertical","Vertical"]]},defaultValue: "horizontal",postSet: function(old, nu) {
        if ( this.$ ) {
          DOM.setClass(this.$, old, false);
          DOM.setClass(this.$, nu);
        }
      }},{name: "className",defaultValueFn: function() { return 'foamChoiceListView ' + this.orientation; }},{name: "tagName",defaultValue: "ul"},{name: "innerTagName",defaultValue: "li"}],methods: [function init() {
      this.SUPER();
      // Doing this at the low level rather than with this.setClass listeners
      // to avoid creating loads of listeners when autocompleting or otherwise
      // rapidly changing this.choices.
      this.index$.addListener(this.updateSelected);
      this.choices$.addListener(this.updateSelected);
    },function choiceToHTML(id, choice) {
      return '<' + this.innerTagName + ' id="' + id + '" class="choice">' +
          choice[1] + '</' + this.innerTagName + '>';
    },function toInnerHTML() {
      var out = [];
      for ( var i = 0 ; i < this.choices.length ; i++ ) {
        var choice = this.choices[i];
        var id     = this.nextID();

        this.on(
          'click',
          function(index) {
            this.choice = this.choices[index];
          }.bind(this, i),
          id);

        out.push(this.choiceToHTML(id, choice));
      }
      return out.join('');
    },function initInnerHTML() {
      this.SUPER();
      this.updateSelected();
    },function scrollToSelection() {
      // Three cases: in view, need to scroll up, need to scroll down.
      // First we determine the parent's scrolling bounds.
      var e = this.$ && this.$.children[this.index];
      if ( ! e ) return;
      var parent = e.parentElement;
      while ( parent ) {
        var overflow = this.X.window.getComputedStyle(parent).overflowY;
        if ( overflow === 'scroll' || overflow === 'auto' ) {
          break;
        }
        parent = parent.parentElement;
      }
      parent = parent || this.X.window;

      // Can't use scrollIntoView; it scrolls more containers than it should.
      if ( e.offsetTop < parent.scrollTop ) { // Scroll up
        parent.scrollTop = e.offsetTop;
      } else if ( e.offsetTop + e.offsetHeight >=
          parent.scrollTop + parent.offsetHeight ) { // Down
        parent.scrollTop = e.offsetTop + e.offsetHeight - parent.offsetHeight;
      }
    }],listeners: [{name: "updateSelected",code: function() {
        if ( ! this.$ || ! this.$.children ) return;
        for ( var i = 0 ; i < this.$.children.length ; i++ ) {
          var c = this.$.children[i];
          DOM.setClass(c, 'selected', i === this.index);
        }
      }}],templates: [{name: "CSS",code: ConstantTemplate(".foamChoiceListView{list-style-type:none}.foamChoiceListView .selected{font-weight:bold}.foamChoiceListView.vertical{padding:0}.foamChoiceListView.vertical .choice{margin:4px}.foamChoiceListView.horizontal{padding:0}.foamChoiceListView.horizontal .choice{display:inline;margin:12px}"),language: "css"}]})
CLASS({package: "foam.ui",name: "AbstractChoiceView",extends: "foam.ui.View",properties: [{model_:"BooleanProperty",name: "autoSetData",type: "Boolean",help: "If true, this.data is set when choices update and the current data is not one of the choices.",defaultValue: true},{name: "prop",visibility: "hidden",hidden: true},{name: "label",help: "The user-visible label for the ChoiceView. Not to be confused with $$DOC{ref:\".text\"}, the name of the currently selected choice."},{name: "text",postSet: function(_, d) {
        for ( var i = 0 ; i < this.choices.length ; i++ ) {
          if ( this.choices[i][1] === d ) {
            if ( this.index !== i ) this.index = i;
            return;
          }
        }
      },help: "The user-visible text of the current choice (ie. [value, text] -> text)."},{name: "choice",getter: function() {
        var value = this.data;
        for ( var i = 0 ; i < this.choices.length ; i++ ) {
          var choice = this.choices[i];
          if ( value === choice[0] ) return choice;
        }
        return undefined;
      },setter: function(choice) {
        var oldValue = this.choice;
        this.data = choice[0];
        this.text = choice[1];
        this.propertyChange('choice', oldValue, this.choice);
      },help: "The current choice (ie. [value, text])."},{name: "choices",factory: function() { return []; },preSet: function(_, a) {
        // If a is a map, instead of an array, we make [key, value] pairs.
        if ( typeof a === 'object' && ! Array.isArray(a) ) {
          var out = [];
          for ( var key in a ) {
            if ( a.hasOwnProperty(key) )
              out.push([key, a[key]]);
          }
          return out;
        }

        a = a.clone();
        // Upgrade single values to [value, value]
        for ( var i = 0 ; i < a.length ; i++ )
          if ( ! Array.isArray(a[i]) )
            a[i] = [a[i], a[i]];
        return a;
      },postSet: function(oldValue, newValue) {
        var value = this.data;

        // Update current choice when choices update.
        for ( var i = 0 ; i < newValue.length ; i++ ) {
          var choice = newValue[i];

          if ( value === choice[0] ) {
            if ( this.useSelection )
              this.index = i;
            else
              this.choice = choice;
            break;
          }
        }

        if ( this.autoSetData && i === newValue.length ) {
          if ( this.useSelection )
            this.index = 0;
          else
            this.data = newValue.length ? newValue[0][0] : undefined;
        }

        // check if the display labels changed
        var labelsChanged = true;
        if ( (oldValue && oldValue.length) == (newValue && newValue.length) ) {
          labelsChanged = false;
          for (var i = 0; i < oldValue.length; ++i) {
            if ( ! equals(oldValue[i][1], newValue[i][1]) ) {
              labelsChanged = true;
              break;
            }
          }
        }
        if ( labelsChanged ) {
          this.updateHTML();
        }
      }},{model_:"IntProperty",name: "index",type: "Int",transient: true,preSet: function(_, i) {
        if ( i < 0 || this.choices.length == 0 ) return 0;
        if ( i >= this.choices.length ) return this.choices.length - 1;
        return i;
      },postSet: function(_, i) {
        // If useSelection is enabled, don't update data or choice.
        if ( this.useSelection ) return;
        if ( this.choices.length && this.data !== this.choices[i][0] ) this.data = this.choices[i][0];
      },help: "The index of the current choice.",defaultValue: -1},{model_:"FunctionProperty",name: "objToChoice",type: "Function",help: "A Function which adapts an object from the DAO to a [key, value, ...] choice."},{model_:"BooleanProperty",name: "useSelection",type: "Boolean",help: "When set, data and choice do not update until an entry is firmly selected"},{model_:"foam.core.types.DAOProperty",name: "dao",onDAOUpdate: "onDAOUpdate"},{name: "data",postSet: function(old, nu) {
        for ( var i = 0 ; i < this.choices.length ; i++ ) {
          if ( this.choices[i][0] === nu ) {
            if ( this.index !== i ) {
              this.text = this.choices[i][1];
              this.index = i;
            }
            return;
          }
        }
        if ( nu && this.choices.length )
          console.warn('ChoiceView data set to invalid choice: ', nu);
      }}],methods: [function initHTML() {
      this.SUPER();

      this.dao = this.dao;
    },function findChoiceIC(name) {
      name = name.toLowerCase();
      for ( var i = 0 ; i < this.choices.length ; i++ ) {
        if ( this.choices[i][1].toLowerCase() == name )
          return this.choices[i];
      }
    },function commit() {
      if ( this.useSelection && this.choices[this.index] )
        this.choice = this.choices[this.index];
    }],listeners: [{name: "onDAOUpdate",code: function() {
        this.dao.select(MAP(this.objToChoice))(function(map) {
          // console.log('***** Update Choices ', map.arg2, this.choices);
          this.choices = map.arg2;
        }.bind(this));
      },isFramed: true}]})
CLASS({package: "foam.ui",name: "PopupView",extends: "foam.ui.SimpleView",properties: [{name: "view"},{name: "x"},{name: "y"},{name: "width",defaultValue: ""},{name: "maxWidth",defaultValue: ""},{name: "maxHeight",defaultValue: ""},{name: "height",defaultValue: ""}],constants: [{name: "CLOSED_TOPIC",value: ["closed"]}],methods: [function open() {
      if ( this.$ ) return;
      var document = this.X.document;
      var div      = document.createElement('div');
      div.style.left = this.x + 'px';
      div.style.top  = this.y + 'px';
      if ( this.width )     div.style.width     = this.width     + 'px';
      if ( this.height )    div.style.height    = this.height    + 'px';
      if ( this.maxWidth )  div.style.maxWidth  = this.maxWidth  + 'px';
      if ( this.maxHeight ) div.style.maxHeight = this.maxHeight + 'px';
      div.style.position = 'absolute';
      div.id = this.id;
      div.innerHTML = this.view.toHTML();

      document.body.appendChild(div);
      this.view.initHTML();
    },function openOn(parent) {
      if ( this.$ ) return;
      var self     = this;
      var document = this.X.document;
      var bg       = document.createElement('div');
      var div      = document.createElement('div');

      bg.style.width = bg.style.height = '10000px';
      bg.style.opacity = 0;
      bg.style.position = 'fixed';
      bg.style.top = '0';
      bg.style.zIndex = 998;
      div.style.zIndex = 999;

      if ( ! this.y ) this.y = (parent.clientHeight - this.height)/2;
      if ( ! this.x ) this.x = (parent.clientWidth - this.width)/2;
      div.className = 'popup';
      div.style.left = this.x + 'px';
      div.style.top  = this.y + 'px';

      if ( this.width )     div.style.width     = this.width     + 'px';
      if ( this.height )    div.style.height    = this.height    + 'px';
      if ( this.maxWidth )  div.style.maxWidth  = this.maxWidth  + 'px';
      if ( this.maxHeight ) div.style.maxHeight = this.maxHeight + 'px';

      parent.style.position = 'relative';
      div.id = this.id;
      div.innerHTML = this.view.toHTML();

      document.body.appendChild(bg);
      bg.addEventListener('click', function() {
        div.remove();
        bg.remove();
        self.destroy();
        self.publish(self.CLOSED_TOPIC);
      });

      parent.appendChild(div);
      this.view.initHTML();
    },function close() {
      this.$ && this.$.remove();
    },function destroy( isParentDestroyed ) {
      this.SUPER(isParentDestroyed);
      this.close();
      this.view.destroy();
    }],templates: [{name: "CSS",code: ConstantTemplate(".popup{background:#999;-webkit-box-shadow:3px 3px 6px 0 gray;box-shadow:3px 3px 6px 0 gray;color:white;font-size:18px;opacity:0.9;padding:20px;position:absolute;box-sizing:border-box}"),language: "css"}]})
CLASS({package: "foam.core.types",name: "StringEnumProperty",extends: "StringProperty",traits: ["foam.core.types.EnumPropertyTrait"]})
CLASS({package: "foam.core.types",name: "EnumPropertyTrait",properties: [{model_:"ArrayProperty",name: "choices",type: "Array",required: true,preSet: function(_, a) { return a.map(function(c) { return Array.isArray(c) ? c : [c, c]; }); },help: "Array of [value, label] choices."},{name: "view",defaultValue: "foam.ui.ChoiceView"},{name: "toPropertyE",defaultValue: function(X) {
        // TODO(braden): Use a FutureElement for this in the future.
        return X.lookup('foam.u2.tag.Select').create({
          prop: this,
          choices: this.choices,
        }, X);
      }}],methods: [function choiceLabel(value) {
      var vl = this.choices.filter(function(vl) { return vl[0] === value; })[0];

      return vl ? vl[1] : '';
    },function choiceValue(label) {
      var vl = this.choices.filter(function(vl) { return vl[1] === label; })[0];
      return vl ? vl[0] : '';
    }]})
CLASS({package: "foam.ui",name: "IntFieldView",extends: "foam.ui.AbstractNumberFieldView",methods: [function textToValue(text) { return parseInt(text) || '0'; },function valueToText(value) { return value ? value : '0'; }]})
CLASS({package: "foam.ui",name: "AbstractNumberFieldView",extends: "foam.ui.TextFieldView",properties: [{name: "type",defaultValue: "number"},{name: "step"}],methods: [function extraAttributes() {
      return this.step ? ' step="' + this.step + '"' : '';
    }]})
CLASS({package: "foam.ui",name: "FloatFieldView",extends: "foam.ui.AbstractNumberFieldView",properties: [{name: "precision",defaultValue: ""}],methods: [function formatNumber(val) {
      if ( ! val ) return '0';
      val = val.toFixed(this.precision);
      var i = val.length-1;
      for ( ; i > 0 && val.charAt(i) === '0' ; i-- );
      return val.substring(0, val.charAt(i) === '.' ? i : i+1);
    },function valueToText(val) {
      return this.hasOwnProperty('precision') ?
        this.formatNumber(val) :
        '' + val ;
    },function textToValue(text) { return parseFloat(text) || 0; }]})
CLASS({package: "foam.ui",name: "DAOController",label: "DAO Controller",extends: "foam.ui.View",properties: [{model_:"ModelProperty",name: "model",type: "Model"},{name: "subType",setter: function(v) {
        this.model = v;
      }},{name: "dao",view: "foam.ui.TableView"},{name: "data",getter: function() {
        return this.dao;
      },setter: function(v) {
        this.dao = v;
      }},{name: "selection"},{model_:"BooleanProperty",name: "useSearchView",type: "Boolean",defaultValue: false}],actions: [{name: "new",help: "Create a new record.",code: function() {
        var createView = this.X.DAOCreateController.create({
          model: this.model,
          dao:   this.dao,
          showActions: true
        });

        createView.parentController = this;

        this.X.stack.pushView(createView, 'New');
      }},{name: "edit",help: "Edit the current record.",default: true,code: function() {
        // Todo: fix, should already be connected
        this.selection = this.daoView.selection;

        var obj = this.selection;
        var actions = this.X.DAOUpdateController.actions.slice(0);

        for ( var i = 0 ; i < this.model.actions.length ; i++ ) {
          var action = this.model.actions[i];

          var newAction = this.X.Action.create(action);
          newAction.action = function (oldAction) {
            return function() {
              oldAction.call(obj);
            };
          }(action.action);

          actions.push(newAction);
        }

        console.log(["selection: ", this.selection]);
        var updateView = this.X.DAOUpdateController.create({
          data:  this.selection/*.deepClone()*/,
          model: this.model,
          dao:   this.dao,
          showActions: true
        });

        this.X.stack.pushView(updateView, 'Edit');
      }},{name: "delete",help: "Delete the current record.",code: function()      {
        // Todo: fix, should already be connected
        this.selection = this.daoView.selection;
        var self = this;
        this.dao.remove(this.selection);
      }}],methods: [function init() {
      this.SUPER();
      this.showActions = true;
    },function initHTML() {
      this.SUPER();
      this.daoView.subscribe(this.daoView.DOUBLE_CLICK, this.onDoubleClick);
      this.daoView.selection$.addListener(this.onSelection);
    }],listeners: [{name: "onDoubleClick",code: function(evt) {
        for ( var i = 0 ; i < this.model_.getRuntimeActions().length ; i++ ) {
          var action = this.model_.getRuntimeActions()[i];

          if ( action.default ) {
            action.action.call(this);
            break;
          }
        }
      }},{name: "onSelection",code: function(evt) {
        var obj = this.daoView.selection;
        if ( ! obj ) return;

        this.X.stack.setPreview(
          this.X.SummaryView.create({
            model: this.model,
            data: this.daoView.selection
          }));
      }}],templates: [{name: "toInnerHTML",code: function(opt_out){var self = this, X = this.X, Y = this.Y;var out = opt_out ? opt_out : TOC(this);out(' ', self.createTemplateView('dao', { model: this.model }),
' ');return out.toString();},language: "html"}]})
