// https://raw.github.com/douglascrockford/JSON-js/master/json2.js

/*
    http://www.JSON.org/json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
// Underscore.js 1.2.1
// (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){function u(a,c,d){if(a===c)return a!==0||1/a==1/c;if(a==null||c==null)return a===c;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(b.isFunction(a.isEqual))return a.isEqual(c);if(b.isFunction(c.isEqual))return c.isEqual(a);var e=typeof a;if(e!=typeof c)return false;if(!a!=!c)return false;if(b.isNaN(a))return b.isNaN(c);var g=b.isString(a),f=b.isString(c);if(g||f)return g&&f&&String(a)==String(c);g=b.isNumber(a);f=b.isNumber(c);if(g||f)return g&&f&&+a==+c;g=b.isBoolean(a);f=b.isBoolean(c);
if(g||f)return g&&f&&+a==+c;g=b.isDate(a);f=b.isDate(c);if(g||f)return g&&f&&a.getTime()==c.getTime();g=b.isRegExp(a);f=b.isRegExp(c);if(g||f)return g&&f&&a.source==c.source&&a.global==c.global&&a.multiline==c.multiline&&a.ignoreCase==c.ignoreCase;if(e!="object")return false;if(a.length!==c.length)return false;if(a.constructor!==c.constructor)return false;for(e=d.length;e--;)if(d[e]==a)return true;d.push(a);var e=0,g=true,h;for(h in a)if(m.call(a,h)&&(e++,!(g=m.call(c,h)&&u(a[h],c[h],d))))break;if(g){for(h in c)if(m.call(c,
h)&&!e--)break;g=!e}d.pop();return g}var r=this,F=r._,o={},k=Array.prototype,p=Object.prototype,i=k.slice,G=k.unshift,l=p.toString,m=p.hasOwnProperty,v=k.forEach,w=k.map,x=k.reduce,y=k.reduceRight,z=k.filter,A=k.every,B=k.some,q=k.indexOf,C=k.lastIndexOf,p=Array.isArray,H=Object.keys,s=Function.prototype.bind,b=function(a){return new n(a)};if(typeof exports!=="undefined"){if(typeof module!=="undefined"&&module.exports)exports=module.exports=b;exports._=b}else typeof define==="function"&&define.amd?
define("underscore",function(){return b}):r._=b;b.VERSION="1.2.1";var j=b.each=b.forEach=function(a,c,b){if(a!=null)if(v&&a.forEach===v)a.forEach(c,b);else if(a.length===+a.length)for(var e=0,g=a.length;e<g;e++){if(e in a&&c.call(b,a[e],e,a)===o)break}else for(e in a)if(m.call(a,e)&&c.call(b,a[e],e,a)===o)break};b.map=function(a,c,b){var e=[];if(a==null)return e;if(w&&a.map===w)return a.map(c,b);j(a,function(a,f,h){e[e.length]=c.call(b,a,f,h)});return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var g=
d!==void 0;a==null&&(a=[]);if(x&&a.reduce===x)return e&&(c=b.bind(c,e)),g?a.reduce(c,d):a.reduce(c);j(a,function(a,b,i){g?d=c.call(e,d,a,b,i):(d=a,g=true)});if(!g)throw new TypeError("Reduce of empty array with no initial value");return d};b.reduceRight=b.foldr=function(a,c,d,e){a==null&&(a=[]);if(y&&a.reduceRight===y)return e&&(c=b.bind(c,e)),d!==void 0?a.reduceRight(c,d):a.reduceRight(c);a=(b.isArray(a)?a.slice():b.toArray(a)).reverse();return b.reduce(a,c,d,e)};b.find=b.detect=function(a,c,b){var e;
D(a,function(a,f,h){if(c.call(b,a,f,h))return e=a,true});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(z&&a.filter===z)return a.filter(c,b);j(a,function(a,f,h){c.call(b,a,f,h)&&(e[e.length]=a)});return e};b.reject=function(a,c,b){var e=[];if(a==null)return e;j(a,function(a,f,h){c.call(b,a,f,h)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=true;if(a==null)return e;if(A&&a.every===A)return a.every(c,b);j(a,function(a,f,h){if(!(e=e&&c.call(b,a,f,h)))return o});
return e};var D=b.some=b.any=function(a,c,d){var c=c||b.identity,e=false;if(a==null)return e;if(B&&a.some===B)return a.some(c,d);j(a,function(a,b,h){if(e|=c.call(d,a,b,h))return o});return!!e};b.include=b.contains=function(a,c){var b=false;if(a==null)return b;return q&&a.indexOf===q?a.indexOf(c)!=-1:b=D(a,function(a){if(a===c)return true})};b.invoke=function(a,c){var d=i.call(arguments,2);return b.map(a,function(a){return(c.call?c||a:a[c]).apply(a,d)})};b.pluck=function(a,c){return b.map(a,function(a){return a[c]})};
b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);if(!c&&b.isEmpty(a))return-Infinity;var e={computed:-Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);if(!c&&b.isEmpty(a))return Infinity;var e={computed:Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b<e.computed&&(e={value:a,computed:b})});return e.value};b.shuffle=function(a){var b=[],d;
j(a,function(a,g){g==0?b[0]=a:(d=Math.floor(Math.random()*(g+1)),b[g]=b[d],b[d]=a)});return b};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,f){return{value:a,criteria:c.call(d,a,b,f)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.groupBy=function(a,c){var d={},e=b.isFunction(c)?c:function(a){return a[c]};j(a,function(a,b){var c=e(a,b);(d[c]||(d[c]=[])).push(a)});return d};b.sortedIndex=function(a,c,d){d||(d=b.identity);for(var e=0,g=a.length;e<
g;){var f=e+g>>1;d(a[f])<d(c)?e=f+1:g=f}return e};b.toArray=function(a){return!a?[]:a.toArray?a.toArray():b.isArray(a)?i.call(a):b.isArguments(a)?i.call(a):b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?i.call(a,0,b):a[0]};b.initial=function(a,b,d){return i.call(a,0,a.length-(b==null||d?1:b))};b.last=function(a,b,d){return b!=null&&!d?i.call(a,a.length-b):a[a.length-1]};b.rest=b.tail=function(a,b,d){return i.call(a,b==null||d?1:b)};b.compact=
function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a,c){return b.reduce(a,function(a,e){if(b.isArray(e))return a.concat(c?e:b.flatten(e));a[a.length]=e;return a},[])};b.without=function(a){return b.difference(a,i.call(arguments,1))};b.uniq=b.unique=function(a,c,d){var d=d?b.map(a,d):a,e=[];b.reduce(d,function(d,f,h){if(0==h||(c===true?b.last(d)!=f:!b.include(d,f)))d[d.length]=f,e[e.length]=a[h];return d},[]);return e};b.union=function(){return b.uniq(b.flatten(arguments,true))};
b.intersection=b.intersect=function(a){var c=i.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.difference=function(a,c){return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=i.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(q&&a.indexOf===q)return a.indexOf(c);
for(d=0,e=a.length;d<e;d++)if(a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(C&&a.lastIndexOf===C)return a.lastIndexOf(b);for(var d=a.length;d--;)if(a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);for(var d=arguments[2]||1,e=Math.max(Math.ceil((b-a)/d),0),g=0,f=Array(e);g<e;)f[g++]=a,a+=d;return f};var E=function(){};b.bind=function(a,c){var d,e;if(a.bind===s&&s)return s.apply(a,i.call(arguments,1));if(!b.isFunction(a))throw new TypeError;
e=i.call(arguments,2);return d=function(){if(!(this instanceof d))return a.apply(c,e.concat(i.call(arguments)));E.prototype=a.prototype;var b=new E,f=a.apply(b,e.concat(i.call(arguments)));return Object(f)===f?f:b}};b.bindAll=function(a){var c=i.call(arguments,1);c.length==0&&(c=b.functions(a));j(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,c){var d={};c||(c=b.identity);return function(){var b=c.apply(this,arguments);return m.call(d,b)?d[b]:d[b]=a.apply(this,arguments)}};b.delay=
function(a,b){var d=i.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(i.call(arguments,1)))};b.throttle=function(a,c){var d,e,g,f,h;h=b.debounce(function(){f=false},c);return function(){e=this;g=arguments;var b;d||(d=setTimeout(function(){d=null;a.apply(e,g);h()},c));f||a.apply(e,g);h&&h();f=true}};b.debounce=function(a,b){var d;return function(){var e=this,g=arguments;clearTimeout(d);d=setTimeout(function(){d=null;a.apply(e,
g)},b)}};b.once=function(a){var b=false,d;return function(){if(b)return d;b=true;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=[a].concat(i.call(arguments));return b.apply(this,d)}};b.compose=function(){var a=i.call(arguments);return function(){for(var b=i.call(arguments),d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=function(a,b){return function(){if(--a<1)return b.apply(this,arguments)}};b.keys=H||function(a){if(a!==Object(a))throw new TypeError("Invalid object");
var b=[],d;for(d in a)m.call(a,d)&&(b[b.length]=d);return b};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){j(i.call(arguments,1),function(b){for(var d in b)b[d]!==void 0&&(a[d]=b[d])});return a};b.defaults=function(a){j(i.call(arguments,1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return!b.isObject(a)?a:b.isArray(a)?a.slice():b.extend({},
a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,b){return u(a,b,[])};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(m.call(a,c))return false;return true};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=p||function(a){return l.call(a)=="[object Array]"};b.isObject=function(a){return a===Object(a)};b.isArguments=l.call(arguments)=="[object Arguments]"?function(a){return l.call(a)=="[object Arguments]"}:function(a){return!(!a||!m.call(a,
"callee"))};b.isFunction=function(a){return l.call(a)=="[object Function]"};b.isString=function(a){return l.call(a)=="[object String]"};b.isNumber=function(a){return l.call(a)=="[object Number]"};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===true||a===false||l.call(a)=="[object Boolean]"};b.isDate=function(a){return l.call(a)=="[object Date]"};b.isRegExp=function(a){return l.call(a)=="[object RegExp]"};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===
void 0};b.noConflict=function(){r._=F;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.escape=function(a){return(""+a).replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")};b.mixin=function(a){j(b.functions(a),function(c){I(c,b[c]=a[c])})};var J=0;b.uniqueId=function(a){var b=J++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,
interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};b.template=function(a,c){var d=b.templateSettings,d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.escape,function(a,b){return"',_.escape("+b.replace(/\\'/g,"'")+"),'"}).replace(d.interpolate,function(a,b){return"',"+b.replace(/\\'/g,"'")+",'"}).replace(d.evaluate||null,function(a,b){return"');"+b.replace(/\\'/g,"'").replace(/[\r\n\t]/g," ")+"__p.push('"}).replace(/\r/g,
"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",d=new Function("obj",d);return c?d(c):d};var n=function(a){this._wrapped=a};b.prototype=n.prototype;var t=function(a,c){return c?b(a).chain():a},I=function(a,c){n.prototype[a]=function(){var a=i.call(arguments);G.call(a,this._wrapped);return t(c.apply(b,a),this._chain)}};b.mixin(b);j("pop,push,reverse,shift,sort,splice,unshift".split(","),function(a){var b=k[a];n.prototype[a]=function(){b.apply(this._wrapped,arguments);return t(this._wrapped,
this._chain)}});j(["concat","join","slice"],function(a){var b=k[a];n.prototype[a]=function(){return t(b.apply(this._wrapped,arguments),this._chain)}});n.prototype.chain=function(){this._chain=true;return this};n.prototype.value=function(){return this._wrapped}})();
// Underscore.string
// (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
// Underscore.strings is freely distributable under the terms of the MIT license.
// Documentation: https://github.com/edtsech/underscore.string
// Some code is borrowed from MooTools and Alexandru Marasteanu.

// Version 1.1.4

(function(){
    // ------------------------- Baseline setup ---------------------------------

    // Establish the root object, "window" in the browser, or "global" on the server.
    var root = this;

    var nativeTrim = String.prototype.trim;

    var parseNumber = function(source) { return source * 1 || 0; };

    function str_repeat(i, m) {
        for (var o = []; m > 0; o[--m] = i);
        return o.join('');
    }

    function defaultToWhiteSpace(characters){
        if (characters) {
            return _s.escapeRegExp(characters);
        }
        return '\\s';
    }

    var _s = {

        isBlank: function(str){
            return !!str.match(/^\s*$/);
        },

        capitalize : function(str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        },

        chop: function(str, step){
            step = step || str.length;
            var arr = [];
            for (var i = 0; i < str.length;) {
                arr.push(str.slice(i,i + step));
                i = i + step;
            }
            return arr;
        },

        clean: function(str){
            return _s.strip(str.replace(/\s+/g, ' '));
        },

        count: function(str, substr){
            var count = 0, index;
            for (var i=0; i < str.length;) {
                index = str.indexOf(substr, i);
                index >= 0 && count++;
                i = i + (index >= 0 ? index : 0) + substr.length;
            }
            return count;
        },

        chars: function(str) {
            return str.split('');
        },

        escapeHTML: function(str) {
            return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                                  .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
        },

        unescapeHTML: function(str) {
            return String(str||'').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        },

        escapeRegExp: function(str){
            // From MooTools core 1.2.4
            return String(str||'').replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
        },

        insert: function(str, i, substr){
            var arr = str.split('');
            arr.splice(i, 0, substr);
            return arr.join('');
        },

        includes: function(str, needle){
            return str.indexOf(needle) !== -1;
        },

        join: function(sep) {
            // TODO: Could this be faster by converting
            // arguments to Array and using array.join(sep)?
            sep = String(sep);
            var str = "";
            for (var i=1; i < arguments.length; i += 1) {
                str += String(arguments[i]);
                if ( i !== arguments.length-1 ) {
                    str += sep;
                }
            }
            return str;
        },

        lines: function(str) {
            return str.split("\n");
        },

//        reverse: function(str){
//            return Array.prototype.reverse.apply(str.split('')).join('');
//        },

        splice: function(str, i, howmany, substr){
            var arr = str.split('');
            arr.splice(i, howmany, substr);
            return arr.join('');
        },

        startsWith: function(str, starts){
            return str.length >= starts.length && str.substring(0, starts.length) === starts;
        },

        endsWith: function(str, ends){
            return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
        },

        succ: function(str){
            var arr = str.split('');
            arr.splice(str.length-1, 1, String.fromCharCode(str.charCodeAt(str.length-1) + 1));
            return arr.join('');
        },

        titleize: function(str){
            var arr = str.split(' '),
                word;
            for (var i=0; i < arr.length; i++) {
                word = arr[i].split('');
                if(typeof word[0] !== 'undefined') word[0] = word[0].toUpperCase();
                i+1 === arr.length ? arr[i] = word.join('') : arr[i] = word.join('') + ' ';
            }
            return arr.join('');
        },

        camelize: function(str){
          return _s.trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
            return chr ? chr.toUpperCase() : '';
          });
        },

        underscored: function(str){
          return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-|\s+/g, '_').toLowerCase();
        },

        dasherize: function(str){
          return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1-$2').replace(/^([A-Z]+)/, '-$1').replace(/\_|\s+/g, '-').toLowerCase();
        },

        trim: function(str, characters){
            if (!characters && nativeTrim) {
                return nativeTrim.call(str);
            }
            characters = defaultToWhiteSpace(characters);
            return str.replace(new RegExp('\^[' + characters + ']+|[' + characters + ']+$', 'g'), '');
        },

        ltrim: function(str, characters){
            characters = defaultToWhiteSpace(characters);
            return str.replace(new RegExp('\^[' + characters + ']+', 'g'), '');
        },

        rtrim: function(str, characters){
            characters = defaultToWhiteSpace(characters);
            return str.replace(new RegExp('[' + characters + ']+$', 'g'), '');
        },

        truncate: function(str, length, truncateStr){
            truncateStr = truncateStr || '...';
            return str.slice(0,length) + truncateStr;
        },

        words: function(str, delimiter) {
            delimiter = delimiter || " ";
            return str.split(delimiter);
        },


        pad: function(str, length, padStr, type) {

            var padding = '';
            var padlen  = 0;

            if (!padStr) { padStr = ' '; }
            else if (padStr.length > 1) { padStr = padStr[0]; }
            switch(type) {
                case "right":
                    padlen = (length - str.length);
                    padding = str_repeat(padStr, padlen);
                    str = str+padding;
                    break;
                case "both":
                    padlen = (length - str.length);
                    padding = {
                        'left' : str_repeat(padStr, Math.ceil(padlen/2)),
                        'right': str_repeat(padStr, Math.floor(padlen/2))
                    };
                    str = padding.left+str+padding.right;
                    break;
                default: // "left"
                    padlen = (length - str.length);
                    padding = str_repeat(padStr, padlen);;
                    str = padding+str;
            }
            return str;
        },

        lpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr);
        },

        rpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr, 'right');
        },

        lrpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr, 'both');
        },


        /**
         * Credits for this function goes to
         * http://www.diveintojavascript.com/projects/sprintf-for-javascript
         *
         * Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
         * All rights reserved.
         * */
        sprintf: function(){

            var i = 0, a, f = arguments[i++], o = [], m, p, c, x, s = '';
            while (f) {
                if (m = /^[^\x25]+/.exec(f)) {
                    o.push(m[0]);
                }
                else if (m = /^\x25{2}/.exec(f)) {
                    o.push('%');
                }
                else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
                    if (((a = arguments[m[1] || i++]) == null) || (a == undefined)) {
                        throw('Too few arguments.');
                    }
                    if (/[^s]/.test(m[7]) && (typeof(a) != 'number')) {
                        throw('Expecting number but found ' + typeof(a));
                    }
                    switch (m[7]) {
                        case 'b': a = a.toString(2); break;
                        case 'c': a = String.fromCharCode(a); break;
                        case 'd': a = parseInt(a); break;
                        case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
                        case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
                        case 'o': a = a.toString(8); break;
                        case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
                        case 'u': a = Math.abs(a); break;
                        case 'x': a = a.toString(16); break;
                        case 'X': a = a.toString(16).toUpperCase(); break;
                    }
                    a = (/[def]/.test(m[7]) && m[2] && a >= 0 ? '+'+ a : a);
                    c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
                    x = m[5] - String(a).length - s.length;
                    p = m[5] ? str_repeat(c, x) : '';
                    o.push(s + (m[4] ? a + p : p + a));
                }
                else {
                    throw('Huh ?!');
                }
                f = f.substring(m[0].length);
            }
            return o.join('');
        },

        toNumber: function(str, decimals) {
           return parseNumber(parseNumber(str).toFixed(parseNumber(decimals)));
         },

         strRight: function(sourceStr, sep){
           var pos =  (!sep) ? -1 : sourceStr.indexOf(sep);
           return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
         },

         strRightBack: function(sourceStr, sep){
           var pos =  (!sep) ? -1 : sourceStr.lastIndexOf(sep);
           return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
         },

         strLeft: function(sourceStr, sep){
           var pos = (!sep) ? -1 : sourceStr.indexOf(sep);
           return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
         },

         strLeftBack: function(sourceStr, sep){
           var pos = sourceStr.lastIndexOf(sep);
           return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
         }

    };

    // Aliases

    _s.strip  = _s.trim;
    _s.lstrip = _s.ltrim;
    _s.rstrip = _s.rtrim;
    _s.center = _s.lrpad;
    _s.ljust  = _s.lpad;
    _s.rjust  = _s.rpad;

    // CommonJS module is defined
    if (typeof window === 'undefined' && typeof module !== 'undefined') {
        // Export module
        module.exports = _s;

    // Integrate with Underscore.js
    } else if (typeof root._ !== 'undefined') {
        root._.mixin(_s);

    // Or define it
    } else {
        root._ = _s;
    }

}());
// https://raw.github.com/douglascrockford/JSON-js/master/json2.js

/*
    http://www.JSON.org/json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
// Underscore.js 1.2.1
// (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){function u(a,c,d){if(a===c)return a!==0||1/a==1/c;if(a==null||c==null)return a===c;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(b.isFunction(a.isEqual))return a.isEqual(c);if(b.isFunction(c.isEqual))return c.isEqual(a);var e=typeof a;if(e!=typeof c)return false;if(!a!=!c)return false;if(b.isNaN(a))return b.isNaN(c);var g=b.isString(a),f=b.isString(c);if(g||f)return g&&f&&String(a)==String(c);g=b.isNumber(a);f=b.isNumber(c);if(g||f)return g&&f&&+a==+c;g=b.isBoolean(a);f=b.isBoolean(c);
if(g||f)return g&&f&&+a==+c;g=b.isDate(a);f=b.isDate(c);if(g||f)return g&&f&&a.getTime()==c.getTime();g=b.isRegExp(a);f=b.isRegExp(c);if(g||f)return g&&f&&a.source==c.source&&a.global==c.global&&a.multiline==c.multiline&&a.ignoreCase==c.ignoreCase;if(e!="object")return false;if(a.length!==c.length)return false;if(a.constructor!==c.constructor)return false;for(e=d.length;e--;)if(d[e]==a)return true;d.push(a);var e=0,g=true,h;for(h in a)if(m.call(a,h)&&(e++,!(g=m.call(c,h)&&u(a[h],c[h],d))))break;if(g){for(h in c)if(m.call(c,
h)&&!e--)break;g=!e}d.pop();return g}var r=this,F=r._,o={},k=Array.prototype,p=Object.prototype,i=k.slice,G=k.unshift,l=p.toString,m=p.hasOwnProperty,v=k.forEach,w=k.map,x=k.reduce,y=k.reduceRight,z=k.filter,A=k.every,B=k.some,q=k.indexOf,C=k.lastIndexOf,p=Array.isArray,H=Object.keys,s=Function.prototype.bind,b=function(a){return new n(a)};if(typeof exports!=="undefined"){if(typeof module!=="undefined"&&module.exports)exports=module.exports=b;exports._=b}else typeof define==="function"&&define.amd?
define("underscore",function(){return b}):r._=b;b.VERSION="1.2.1";var j=b.each=b.forEach=function(a,c,b){if(a!=null)if(v&&a.forEach===v)a.forEach(c,b);else if(a.length===+a.length)for(var e=0,g=a.length;e<g;e++){if(e in a&&c.call(b,a[e],e,a)===o)break}else for(e in a)if(m.call(a,e)&&c.call(b,a[e],e,a)===o)break};b.map=function(a,c,b){var e=[];if(a==null)return e;if(w&&a.map===w)return a.map(c,b);j(a,function(a,f,h){e[e.length]=c.call(b,a,f,h)});return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var g=
d!==void 0;a==null&&(a=[]);if(x&&a.reduce===x)return e&&(c=b.bind(c,e)),g?a.reduce(c,d):a.reduce(c);j(a,function(a,b,i){g?d=c.call(e,d,a,b,i):(d=a,g=true)});if(!g)throw new TypeError("Reduce of empty array with no initial value");return d};b.reduceRight=b.foldr=function(a,c,d,e){a==null&&(a=[]);if(y&&a.reduceRight===y)return e&&(c=b.bind(c,e)),d!==void 0?a.reduceRight(c,d):a.reduceRight(c);a=(b.isArray(a)?a.slice():b.toArray(a)).reverse();return b.reduce(a,c,d,e)};b.find=b.detect=function(a,c,b){var e;
D(a,function(a,f,h){if(c.call(b,a,f,h))return e=a,true});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(z&&a.filter===z)return a.filter(c,b);j(a,function(a,f,h){c.call(b,a,f,h)&&(e[e.length]=a)});return e};b.reject=function(a,c,b){var e=[];if(a==null)return e;j(a,function(a,f,h){c.call(b,a,f,h)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=true;if(a==null)return e;if(A&&a.every===A)return a.every(c,b);j(a,function(a,f,h){if(!(e=e&&c.call(b,a,f,h)))return o});
return e};var D=b.some=b.any=function(a,c,d){var c=c||b.identity,e=false;if(a==null)return e;if(B&&a.some===B)return a.some(c,d);j(a,function(a,b,h){if(e|=c.call(d,a,b,h))return o});return!!e};b.include=b.contains=function(a,c){var b=false;if(a==null)return b;return q&&a.indexOf===q?a.indexOf(c)!=-1:b=D(a,function(a){if(a===c)return true})};b.invoke=function(a,c){var d=i.call(arguments,2);return b.map(a,function(a){return(c.call?c||a:a[c]).apply(a,d)})};b.pluck=function(a,c){return b.map(a,function(a){return a[c]})};
b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);if(!c&&b.isEmpty(a))return-Infinity;var e={computed:-Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);if(!c&&b.isEmpty(a))return Infinity;var e={computed:Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b<e.computed&&(e={value:a,computed:b})});return e.value};b.shuffle=function(a){var b=[],d;
j(a,function(a,g){g==0?b[0]=a:(d=Math.floor(Math.random()*(g+1)),b[g]=b[d],b[d]=a)});return b};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,f){return{value:a,criteria:c.call(d,a,b,f)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.groupBy=function(a,c){var d={},e=b.isFunction(c)?c:function(a){return a[c]};j(a,function(a,b){var c=e(a,b);(d[c]||(d[c]=[])).push(a)});return d};b.sortedIndex=function(a,c,d){d||(d=b.identity);for(var e=0,g=a.length;e<
g;){var f=e+g>>1;d(a[f])<d(c)?e=f+1:g=f}return e};b.toArray=function(a){return!a?[]:a.toArray?a.toArray():b.isArray(a)?i.call(a):b.isArguments(a)?i.call(a):b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?i.call(a,0,b):a[0]};b.initial=function(a,b,d){return i.call(a,0,a.length-(b==null||d?1:b))};b.last=function(a,b,d){return b!=null&&!d?i.call(a,a.length-b):a[a.length-1]};b.rest=b.tail=function(a,b,d){return i.call(a,b==null||d?1:b)};b.compact=
function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a,c){return b.reduce(a,function(a,e){if(b.isArray(e))return a.concat(c?e:b.flatten(e));a[a.length]=e;return a},[])};b.without=function(a){return b.difference(a,i.call(arguments,1))};b.uniq=b.unique=function(a,c,d){var d=d?b.map(a,d):a,e=[];b.reduce(d,function(d,f,h){if(0==h||(c===true?b.last(d)!=f:!b.include(d,f)))d[d.length]=f,e[e.length]=a[h];return d},[]);return e};b.union=function(){return b.uniq(b.flatten(arguments,true))};
b.intersection=b.intersect=function(a){var c=i.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.difference=function(a,c){return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=i.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(q&&a.indexOf===q)return a.indexOf(c);
for(d=0,e=a.length;d<e;d++)if(a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(C&&a.lastIndexOf===C)return a.lastIndexOf(b);for(var d=a.length;d--;)if(a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);for(var d=arguments[2]||1,e=Math.max(Math.ceil((b-a)/d),0),g=0,f=Array(e);g<e;)f[g++]=a,a+=d;return f};var E=function(){};b.bind=function(a,c){var d,e;if(a.bind===s&&s)return s.apply(a,i.call(arguments,1));if(!b.isFunction(a))throw new TypeError;
e=i.call(arguments,2);return d=function(){if(!(this instanceof d))return a.apply(c,e.concat(i.call(arguments)));E.prototype=a.prototype;var b=new E,f=a.apply(b,e.concat(i.call(arguments)));return Object(f)===f?f:b}};b.bindAll=function(a){var c=i.call(arguments,1);c.length==0&&(c=b.functions(a));j(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,c){var d={};c||(c=b.identity);return function(){var b=c.apply(this,arguments);return m.call(d,b)?d[b]:d[b]=a.apply(this,arguments)}};b.delay=
function(a,b){var d=i.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(i.call(arguments,1)))};b.throttle=function(a,c){var d,e,g,f,h;h=b.debounce(function(){f=false},c);return function(){e=this;g=arguments;var b;d||(d=setTimeout(function(){d=null;a.apply(e,g);h()},c));f||a.apply(e,g);h&&h();f=true}};b.debounce=function(a,b){var d;return function(){var e=this,g=arguments;clearTimeout(d);d=setTimeout(function(){d=null;a.apply(e,
g)},b)}};b.once=function(a){var b=false,d;return function(){if(b)return d;b=true;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=[a].concat(i.call(arguments));return b.apply(this,d)}};b.compose=function(){var a=i.call(arguments);return function(){for(var b=i.call(arguments),d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=function(a,b){return function(){if(--a<1)return b.apply(this,arguments)}};b.keys=H||function(a){if(a!==Object(a))throw new TypeError("Invalid object");
var b=[],d;for(d in a)m.call(a,d)&&(b[b.length]=d);return b};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){j(i.call(arguments,1),function(b){for(var d in b)b[d]!==void 0&&(a[d]=b[d])});return a};b.defaults=function(a){j(i.call(arguments,1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return!b.isObject(a)?a:b.isArray(a)?a.slice():b.extend({},
a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,b){return u(a,b,[])};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(m.call(a,c))return false;return true};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=p||function(a){return l.call(a)=="[object Array]"};b.isObject=function(a){return a===Object(a)};b.isArguments=l.call(arguments)=="[object Arguments]"?function(a){return l.call(a)=="[object Arguments]"}:function(a){return!(!a||!m.call(a,
"callee"))};b.isFunction=function(a){return l.call(a)=="[object Function]"};b.isString=function(a){return l.call(a)=="[object String]"};b.isNumber=function(a){return l.call(a)=="[object Number]"};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===true||a===false||l.call(a)=="[object Boolean]"};b.isDate=function(a){return l.call(a)=="[object Date]"};b.isRegExp=function(a){return l.call(a)=="[object RegExp]"};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===
void 0};b.noConflict=function(){r._=F;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.escape=function(a){return(""+a).replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")};b.mixin=function(a){j(b.functions(a),function(c){I(c,b[c]=a[c])})};var J=0;b.uniqueId=function(a){var b=J++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,
interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};b.template=function(a,c){var d=b.templateSettings,d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.escape,function(a,b){return"',_.escape("+b.replace(/\\'/g,"'")+"),'"}).replace(d.interpolate,function(a,b){return"',"+b.replace(/\\'/g,"'")+",'"}).replace(d.evaluate||null,function(a,b){return"');"+b.replace(/\\'/g,"'").replace(/[\r\n\t]/g," ")+"__p.push('"}).replace(/\r/g,
"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",d=new Function("obj",d);return c?d(c):d};var n=function(a){this._wrapped=a};b.prototype=n.prototype;var t=function(a,c){return c?b(a).chain():a},I=function(a,c){n.prototype[a]=function(){var a=i.call(arguments);G.call(a,this._wrapped);return t(c.apply(b,a),this._chain)}};b.mixin(b);j("pop,push,reverse,shift,sort,splice,unshift".split(","),function(a){var b=k[a];n.prototype[a]=function(){b.apply(this._wrapped,arguments);return t(this._wrapped,
this._chain)}});j(["concat","join","slice"],function(a){var b=k[a];n.prototype[a]=function(){return t(b.apply(this._wrapped,arguments),this._chain)}});n.prototype.chain=function(){this._chain=true;return this};n.prototype.value=function(){return this._wrapped}})();
// Underscore.string
// (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
// Underscore.strings is freely distributable under the terms of the MIT license.
// Documentation: https://github.com/edtsech/underscore.string
// Some code is borrowed from MooTools and Alexandru Marasteanu.

// Version 1.1.4

(function(){
    // ------------------------- Baseline setup ---------------------------------

    // Establish the root object, "window" in the browser, or "global" on the server.
    var root = this;

    var nativeTrim = String.prototype.trim;

    var parseNumber = function(source) { return source * 1 || 0; };

    function str_repeat(i, m) {
        for (var o = []; m > 0; o[--m] = i);
        return o.join('');
    }

    function defaultToWhiteSpace(characters){
        if (characters) {
            return _s.escapeRegExp(characters);
        }
        return '\\s';
    }

    var _s = {

        isBlank: function(str){
            return !!str.match(/^\s*$/);
        },

        capitalize : function(str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        },

        chop: function(str, step){
            step = step || str.length;
            var arr = [];
            for (var i = 0; i < str.length;) {
                arr.push(str.slice(i,i + step));
                i = i + step;
            }
            return arr;
        },

        clean: function(str){
            return _s.strip(str.replace(/\s+/g, ' '));
        },

        count: function(str, substr){
            var count = 0, index;
            for (var i=0; i < str.length;) {
                index = str.indexOf(substr, i);
                index >= 0 && count++;
                i = i + (index >= 0 ? index : 0) + substr.length;
            }
            return count;
        },

        chars: function(str) {
            return str.split('');
        },

        escapeHTML: function(str) {
            return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                                  .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
        },

        unescapeHTML: function(str) {
            return String(str||'').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        },

        escapeRegExp: function(str){
            // From MooTools core 1.2.4
            return String(str||'').replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
        },

        insert: function(str, i, substr){
            var arr = str.split('');
            arr.splice(i, 0, substr);
            return arr.join('');
        },

        includes: function(str, needle){
            return str.indexOf(needle) !== -1;
        },

        join: function(sep) {
            // TODO: Could this be faster by converting
            // arguments to Array and using array.join(sep)?
            sep = String(sep);
            var str = "";
            for (var i=1; i < arguments.length; i += 1) {
                str += String(arguments[i]);
                if ( i !== arguments.length-1 ) {
                    str += sep;
                }
            }
            return str;
        },

        lines: function(str) {
            return str.split("\n");
        },

//        reverse: function(str){
//            return Array.prototype.reverse.apply(str.split('')).join('');
//        },

        splice: function(str, i, howmany, substr){
            var arr = str.split('');
            arr.splice(i, howmany, substr);
            return arr.join('');
        },

        startsWith: function(str, starts){
            return str.length >= starts.length && str.substring(0, starts.length) === starts;
        },

        endsWith: function(str, ends){
            return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
        },

        succ: function(str){
            var arr = str.split('');
            arr.splice(str.length-1, 1, String.fromCharCode(str.charCodeAt(str.length-1) + 1));
            return arr.join('');
        },

        titleize: function(str){
            var arr = str.split(' '),
                word;
            for (var i=0; i < arr.length; i++) {
                word = arr[i].split('');
                if(typeof word[0] !== 'undefined') word[0] = word[0].toUpperCase();
                i+1 === arr.length ? arr[i] = word.join('') : arr[i] = word.join('') + ' ';
            }
            return arr.join('');
        },

        camelize: function(str){
          return _s.trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
            return chr ? chr.toUpperCase() : '';
          });
        },

        underscored: function(str){
          return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-|\s+/g, '_').toLowerCase();
        },

        dasherize: function(str){
          return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1-$2').replace(/^([A-Z]+)/, '-$1').replace(/\_|\s+/g, '-').toLowerCase();
        },

        trim: function(str, characters){
            if (!characters && nativeTrim) {
                return nativeTrim.call(str);
            }
            characters = defaultToWhiteSpace(characters);
            return str.replace(new RegExp('\^[' + characters + ']+|[' + characters + ']+$', 'g'), '');
        },

        ltrim: function(str, characters){
            characters = defaultToWhiteSpace(characters);
            return str.replace(new RegExp('\^[' + characters + ']+', 'g'), '');
        },

        rtrim: function(str, characters){
            characters = defaultToWhiteSpace(characters);
            return str.replace(new RegExp('[' + characters + ']+$', 'g'), '');
        },

        truncate: function(str, length, truncateStr){
            truncateStr = truncateStr || '...';
            return str.slice(0,length) + truncateStr;
        },

        words: function(str, delimiter) {
            delimiter = delimiter || " ";
            return str.split(delimiter);
        },


        pad: function(str, length, padStr, type) {

            var padding = '';
            var padlen  = 0;

            if (!padStr) { padStr = ' '; }
            else if (padStr.length > 1) { padStr = padStr[0]; }
            switch(type) {
                case "right":
                    padlen = (length - str.length);
                    padding = str_repeat(padStr, padlen);
                    str = str+padding;
                    break;
                case "both":
                    padlen = (length - str.length);
                    padding = {
                        'left' : str_repeat(padStr, Math.ceil(padlen/2)),
                        'right': str_repeat(padStr, Math.floor(padlen/2))
                    };
                    str = padding.left+str+padding.right;
                    break;
                default: // "left"
                    padlen = (length - str.length);
                    padding = str_repeat(padStr, padlen);;
                    str = padding+str;
            }
            return str;
        },

        lpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr);
        },

        rpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr, 'right');
        },

        lrpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr, 'both');
        },


        /**
         * Credits for this function goes to
         * http://www.diveintojavascript.com/projects/sprintf-for-javascript
         *
         * Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
         * All rights reserved.
         * */
        sprintf: function(){

            var i = 0, a, f = arguments[i++], o = [], m, p, c, x, s = '';
            while (f) {
                if (m = /^[^\x25]+/.exec(f)) {
                    o.push(m[0]);
                }
                else if (m = /^\x25{2}/.exec(f)) {
                    o.push('%');
                }
                else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
                    if (((a = arguments[m[1] || i++]) == null) || (a == undefined)) {
                        throw('Too few arguments.');
                    }
                    if (/[^s]/.test(m[7]) && (typeof(a) != 'number')) {
                        throw('Expecting number but found ' + typeof(a));
                    }
                    switch (m[7]) {
                        case 'b': a = a.toString(2); break;
                        case 'c': a = String.fromCharCode(a); break;
                        case 'd': a = parseInt(a); break;
                        case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
                        case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
                        case 'o': a = a.toString(8); break;
                        case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
                        case 'u': a = Math.abs(a); break;
                        case 'x': a = a.toString(16); break;
                        case 'X': a = a.toString(16).toUpperCase(); break;
                    }
                    a = (/[def]/.test(m[7]) && m[2] && a >= 0 ? '+'+ a : a);
                    c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
                    x = m[5] - String(a).length - s.length;
                    p = m[5] ? str_repeat(c, x) : '';
                    o.push(s + (m[4] ? a + p : p + a));
                }
                else {
                    throw('Huh ?!');
                }
                f = f.substring(m[0].length);
            }
            return o.join('');
        },

        toNumber: function(str, decimals) {
           return parseNumber(parseNumber(str).toFixed(parseNumber(decimals)));
         },

         strRight: function(sourceStr, sep){
           var pos =  (!sep) ? -1 : sourceStr.indexOf(sep);
           return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
         },

         strRightBack: function(sourceStr, sep){
           var pos =  (!sep) ? -1 : sourceStr.lastIndexOf(sep);
           return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
         },

         strLeft: function(sourceStr, sep){
           var pos = (!sep) ? -1 : sourceStr.indexOf(sep);
           return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
         },

         strLeftBack: function(sourceStr, sep){
           var pos = sourceStr.lastIndexOf(sep);
           return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
         }

    };

    // Aliases

    _s.strip  = _s.trim;
    _s.lstrip = _s.ltrim;
    _s.rstrip = _s.rtrim;
    _s.center = _s.lrpad;
    _s.ljust  = _s.lpad;
    _s.rjust  = _s.rpad;

    // CommonJS module is defined
    if (typeof window === 'undefined' && typeof module !== 'undefined') {
        // Export module
        module.exports = _s;

    // Integrate with Underscore.js
    } else if (typeof root._ !== 'undefined') {
        root._.mixin(_s);

    // Or define it
    } else {
        root._ = _s;
    }

}());
var CodeMirror=function(){function a(c,d){function bJ(a){return a>=0&&a<bj.size}function bL(a){return s(bj,a)}function bM(a,b){by=!0;var c=b-a.height;for(var d=a;d;d=d.parent)d.height+=c}function bN(a){var b={line:0,ch:0};b$(b,{line:bj.size-1,ch:bL(bj.size-1).text.length},X(a),b,b),bs=!0}function bO(a){var b=[];return bj.iter(0,bj.size,function(a){b.push(a.text)}),b.join("\n")}function bP(a){function j(a){var b=dn(a,!0);if(b&&!P(b,g)){bl||bY(),g=b,cy(d,b),bs=!1;var c=cs();if(b.line>=c.to||b.line<c.from)h=setTimeout(dB(function(){j(a)}),150)}}for(var c=C(a);c!=A;c=c.parentNode)if(c.parentNode==U&&c!=Z)return;for(var c=C(a);c!=A;c=c.parentNode)if(c.parentNode==_)return e.onGutterClick&&e.onGutterClick(bK,W(_.childNodes,c)+bA,a),z(a);var d=dn(a);switch(D(a)){case 3:H&&!b&&dp(a);return;case 2:d&&cB(d.line,d.ch,!0);return}if(!d){C(a)==M&&z(a);return}bl||bY();var f=+(new Date);if(bp&&bp.time>f-400&&P(bp.pos,d))return z(a),setTimeout(co,20),cK(d.line);if(bo&&bo.time>f-400&&P(bo.pos,d))return bp={time:f,pos:d},z(a),cJ(d);bo={time:f,pos:d};var g=d,h;if(G&&!P(bm.from,bm.to)&&!Q(d,bm.from)&&!Q(bm.to,d)){J&&(ba.draggable=!0);var i=E(x,"mouseup",dB(function(b){J&&(ba.draggable=!1),bq=!1,i(),Math.abs(a.clientX-b.clientX)+Math.abs(a.clientY-b.clientY)<10&&(z(b),cB(d.line,d.ch,!0),co())}),!0);bq=!0;return}z(a),cB(d.line,d.ch,!0);var k=E(x,"mousemove",dB(function(a){clearTimeout(h),z(a),j(a)}),!0),i=E(x,"mouseup",dB(function(a){clearTimeout(h);var b=dn(a);b&&cy(d,b),z(a),co(),bs=!0,k(),i()}),!0)}function bQ(a){for(var b=C(a);b!=A;b=b.parentNode)if(b.parentNode==_)return z(a);var c=dn(a);if(!c)return;bp={time:+(new Date),pos:c},z(a),cJ(c)}function bR(a){a.preventDefault();var b=dn(a,!0),c=a.dataTransfer.files;if(!b||e.readOnly)return;if(c&&c.length&&window.FileReader&&window.File){function d(a,c){var d=new FileReader;d.onload=function(){g[c]=d.result,++h==f&&(b=cD(b),dB(function(){var a=cd(g.join(""),b,b);cy(b,a)})())},d.readAsText(a)}var f=c.length,g=Array(f),h=0;for(var i=0;i<f;++i)d(c[i],i)}else try{var g=a.dataTransfer.getData("Text");if(g){var j=cd(g,b,b),k=bm.from,l=bm.to;cy(b,j),bq&&cd("",k,l),co()}}catch(a){}}function bS(a){var b=ch();T(b),a.dataTransfer.setDragImage(S,0,0),a.dataTransfer.setData("Text",b)}function bT(a){if(a.altGraphKey)return!1;var b=i(a,e.extraKeys,e.keyMap),c=h[e.keyMap].auto;c&&(e.keyMap=c);if(!b)return!1;if(typeof b!="string")b(bK);else if(g.propertyIsEnumerable(b))g[b](bK);else if(!c)return!1;return z(a),!0}function bV(a){bl||bY();var c=a.keyCode;I&&c==27&&(a.returnValue=!1),c==16||a.shiftKey?bn=bn||(bm.inverted?bm.to:bm.from):bn=null;if(e.onKeyEvent&&e.onKeyEvent(bK,y(a)))return;var d=bT(a);window.opera&&(bU=d?a.keyCode:null,!d&&(b?a.metaKey:a.ctrlKey)&&a.keyCode==88&&ce(""))}function bW(a){if(window.opera&&a.keyCode==bU){bU=null,z(a);return}if(e.onKeyEvent&&e.onKeyEvent(bK,y(a)))return;if(window.opera&&!a.which&&bT(a))return;if(e.electricChars&&bi.electricChars){var b=String.fromCharCode(a.charCode==null?a.keyCode:a.charCode);bi.electricChars.indexOf(b)>-1&&setTimeout(dB(function(){cM(bm.to.line,"smart")}),50)}ck()}function bX(a){if(e.onKeyEvent&&e.onKeyEvent(bK,y(a)))return;a.keyCode==16&&(bn=null)}function bY(){if(e.readOnly)return;bl||(e.onFocus&&e.onFocus(bK),bl=!0,A.className.search(/\bCodeMirror-focused\b/)==-1&&(A.className+=" CodeMirror-focused"),bx||cn(!0)),cj(),dq()}function bZ(){bl&&(e.onBlur&&e.onBlur(bK),bl=!1,A.className=A.className.replace(" CodeMirror-focused","")),clearInterval(bh),setTimeout(function(){bl||(bn=null)},150)}function b$(a,b,c,d,f){if(bH){var g=[];bj.iter(a.line,b.line+1,function(a){g.push(a.text)}),bH.addChange(a.line,c.length,g);while(bH.done.length>e.undoDepth)bH.done.shift()}cc(a,b,c,d,f)}function b_(a,b){var c=a.pop();if(c){var d=[],e=c.start+c.added;bj.iter(c.start,e,function(a){d.push(a.text)}),b.push({start:c.start,added:c.old.length,old:d});var f=cD({line:c.start+c.old.length-1,ch:V(d[d.length-1],c.old[c.old.length-1])});cc({line:c.start,ch:0},{line:e-1,ch:bL(e-1).text.length},c.old,f,f),bs=!0}}function ca(){b_(bH.done,bH.undone)}function cb(){b_(bH.undone,bH.done)}function cc(a,b,c,d,f){function v(a){return a<=Math.min(b.line,b.line+r)?a:a+r}var g=!1,h=bE.length;e.lineWrapping||bj.iter(a.line,b.line,function(a){if(a.text.length==h)return g=!0,!0});var i=b.line-a.line,j=bL(a.line),k=bL(b.line);if(j==k)if(c.length==1)j.replace(a.ch,b.ch,c[0]);else{k=j.split(b.ch,c[c.length-1]),j.replace(a.ch,null,c[0]),j.fixMarkEnds(k);var l=[];for(var m=1,n=c.length-1;m<n;++m)l.push(o.inheritMarks(c[m],j));l.push(k),bj.insert(a.line+1,l)}else if(c.length==1)j.replace(a.ch,null,c[0]),k.replace(null,b.ch,""),j.append(k),bj.remove(a.line+1,i);else{var l=[];j.replace(a.ch,null,c[0]),k.replace(null,b.ch,c[c.length-1]),j.fixMarkEnds(k);for(var m=1,n=c.length-1;m<n;++m)l.push(o.inheritMarks(c[m],j));i>1&&bj.remove(a.line+1,i-1),bj.insert(a.line+1,l)}if(e.lineWrapping){var p=M.clientWidth/dk()-3;bj.iter(a.line,a.line+c.length,function(a){if(a.hidden)return;var b=Math.ceil(a.text.length/p)||1;b!=a.height&&bM(a,b)})}else bj.iter(a.line,m+c.length,function(a){var b=a.text;b.length>h&&(bE=b,h=b.length,bF=null,g=!1)}),g&&(h=0,bE="",bF=null,bj.iter(0,bj.size,function(a){var b=a.text;b.length>h&&(h=b.length,bE=b)}));var q=[],r=c.length-i-1;for(var m=0,s=bk.length;m<s;++m){var t=bk[m];t<a.line?q.push(t):t>b.line&&q.push(t+r)}var u=a.line+Math.min(c.length,500);dv(a.line,u),q.push(u),bk=q,dx(100),bu.push({from:a.line,to:b.line+1,diff:r}),bv={from:a,to:b,text:c},cz(d,f,v(bm.from.line),v(bm.to.line)),U.style.height=bj.height*di()+2*dl()+"px"}function cd(a,b,c){function d(d){if(Q(d,b))return d;if(!Q(c,d))return e;var f=d.line+a.length-(c.line-b.line)-1,g=d.ch;return d.line==c.line&&(g+=a[a.length-1].length-(c.ch-(c.line==b.line?b.ch:0))),{line:f,ch:g}}b=cD(b),c?c=cD(c):c=b,a=X(a);var e;return cf(a,b,c,function(a){return e=a,{from:d(bm.from),to:d(bm.to)}}),e}function ce(a,b){cf(X(a),bm.from,bm.to,function(a){return b=="end"?{from:a,to:a}:b=="start"?{from:bm.from,to:bm.from}:{from:bm.from,to:a}})}function cf(a,b,c,d){var e=a.length==1?a[0].length+b.ch:a[a.length-1].length,f=d({line:b.line+a.length-1,ch:e});b$(b,c,a,f.from,f.to)}function cg(a,b){var c=a.line,d=b.line;if(c==d)return bL(c).text.slice(a.ch,b.ch);var e=[bL(c).text.slice(a.ch)];return bj.iter(c+1,d,function(a){e.push(a.text)}),e.push(bL(d).text.slice(0,b.ch)),e.join("\n")}function ch(){return cg(bm.from,bm.to)}function cj(){if(ci)return;bf.set(e.pollInterval,function(){dy(),cm(),bl&&cj(),dz()})}function ck(){function b(){dy();var c=cm();!c&&!a?(a=!0,bf.set(60,b)):(ci=!1,cj()),dz()}var a=!1;ci=!0,bf.set(20,b)}function cm(){if(bx||!bl||Y(L))return!1;var a=L.value;if(a==cl)return!1;bn=null;var b=0,c=Math.min(cl.length,a.length);while(b<c&&cl[b]==a[b])++b;return b<cl.length?bm.from={line:bm.from.line,ch:bm.from.ch-(cl.length-b)}:br&&P(bm.from,bm.to)&&(bm.to={line:bm.to.line,ch:Math.min(bL(bm.to.line).text.length,bm.to.ch+(a.length-b))}),ce(a.slice(b),"end"),cl=a,!0}function cn(a){P(bm.from,bm.to)?a&&(cl=L.value=""):(cl="",L.value=ch(),L.select())}function co(){e.readOnly||L.focus()}function cp(){if(!bc.getBoundingClientRect)return;var a=bc.getBoundingClientRect(),b=window.innerHeight||Math.max(document.body.offsetHeight,document.documentElement.offsetHeight);(a.top<0||a.bottom>b)&&bc.scrollIntoView()}function cq(){var a=dd(bm.inverted?bm.from:bm.to),b=e.lineWrapping?Math.min(a.x,ba.offsetWidth):a.x;return cr(b,a.y,b,a.yBot)}function cr(a,b,c,d){var f=dm(),g=dl(),h=di();b+=g,d+=g,a+=f,c+=f;var i=M.clientHeight,j=M.scrollTop,k=!1,l=!0;b<j?(M.scrollTop=Math.max(0,b-2*h),k=!0):d>j+i&&(M.scrollTop=d+h-i,k=!0);var m=M.clientWidth,n=M.scrollLeft,o=e.fixedGutter?$.clientWidth:0;return a<n+o?(a<50&&(a=0),M.scrollLeft=Math.max(0,a-10-o),k=!0):c>m+n-3&&(M.scrollLeft=c+10-m,k=!0,c>U.clientWidth&&(l=!1)),k&&e.onScroll&&e.onScroll(bK),l}function cs(){var a=di(),b=M.scrollTop-dl(),c=Math.max(0,Math.floor(b/a)),d=Math.ceil((b+M.clientHeight)/a);return{from:u(bj,c),to:u(bj,d)}}function ct(a){if(!M.clientWidth){bA=bB=bz=0;return}var b=cs();if(a!==!0&&a.length==0&&b.from>=bA&&b.to<=bB)return;var c=Math.max(b.from-100,0),d=Math.min(bj.size,b.to+100);bA<c&&c-bA<20&&(c=bA),bB>d&&bB-d<20&&(d=Math.min(bj.size,bB));var f=a===!0?[]:cu([{from:bA,to:bB,domStart:0}],a),g=0;for(var h=0;h<f.length;++h){var i=f[h];i.from<c&&(i.domStart+=c-i.from,i.from=c),i.to>d&&(i.to=d),i.from>=i.to?f.splice(h--,1):g+=i.to-i.from}if(g==d-c)return;f.sort(function(a,b){return a.domStart-b.domStart});var j=di(),k=$.style.display;bd.style.display=$.style.display="none",cv(c,d,f),bd.style.display="";var l=c!=bA||d!=bB||bC!=M.clientHeight;l&&(bC=M.clientHeight),bA=c,bB=d,bz=v(bj,c),Z.style.top=bz*j+"px",U.style.height=bj.height*j+2*dl()+"px";if(bd.childNodes.length!=bB-bA)throw new Error("BAD PATCH! "+JSON.stringify(f)+" size="+(bB-bA)+" nodes="+bd.childNodes.length);if(e.lineWrapping){bF=M.clientWidth;var m=bd.firstChild;bj.iter(bA,bB,function(a){if(!a.hidden){var b=Math.round(m.offsetHeight/j)||1;a.height!=b&&(bM(a,b),by=!0)}m=m.nextSibling})}else bF==null&&(bF=c_(bE)),bF>M.clientWidth?(ba.style.width=bF+"px",U.style.width="",U.style.width=M.scrollWidth+"px"):ba.style.width=U.style.width="";$.style.display=k,(l||by)&&cw(),cx()}function cu(a,b){for(var c=0,d=b.length||0;c<d;++c){var e=b[c],f=[],g=e.diff||0;for(var h=0,i=a.length;h<i;++h){var j=a[h];e.to<=j.from&&e.diff?f.push({from:j.from+g,to:j.to+g,domStart:j.domStart}):e.to<=j.from||e.from>=j.to?f.push(j):(e.from>j.from&&f.push({from:j.from,to:e.from,domStart:j.domStart}),e.to<j.to&&f.push({from:e.to+g,to:j.to+g,domStart:j.domStart+(e.to-j.from)}))}a=f}return a}function cv(a,b,c){if(!c.length)bd.innerHTML="";else{function d(a){var b=a.nextSibling;return a.parentNode.removeChild(a),b}var e=0,f=bd.firstChild,g;for(var h=0;h<c.length;++h){var i=c[h];while(i.domStart>e)f=d(f),e++;for(var j=0,k=i.to-i.from;j<k;++j)f=f.nextSibling,e++}while(f)f=d(f)}var l=c.shift(),f=bd.firstChild,j=a,m=bm.from.line,n=bm.to.line,o=m<a&&n>=a,p=x.createElement("div"),q;bj.iter(a,b,function(a){var b=null,d=null;o?(b=0,n==j&&(o=!1,d=bm.to.ch)):m==j&&(n==j?(b=bm.from.ch,d=bm.to.ch):(o=!0,b=bm.from.ch)),l&&l.to==j&&(l=c.shift()),!l||l.from>j?(a.hidden?p.innerHTML="<pre></pre>":p.innerHTML=a.getHTML(b,d,!0,bG),bd.insertBefore(p.firstChild,f)):f=f.nextSibling,++j})}function cw(){if(!e.gutter&&!e.lineNumbers)return;var a=Z.offsetHeight,b=M.clientHeight;$.style.height=(a-b<2?b:a)+"px";var c=[],d=bA;bj.iter(bA,Math.max(bB,bA+1),function(a){if(a.hidden)c.push("<pre></pre>");else{var b=a.gutterMarker,f=e.lineNumbers?d+e.firstLineNumber:null;b&&b.text?f=b.text.replace("%N%",f!=null?f:""):f==null&&(f="\u00a0"),c.push(b&&b.style?'<pre class="'+b.style+'">':"<pre>",f);for(var g=1;g<a.height;++g)c.push("<br>&nbsp;");c.push("</pre>")}++d}),$.style.display="none",_.innerHTML=c.join("");var f=String(bj.size).length,g=_.firstChild,h=O(g),i="";while(h.length+i.length<f)i+="\u00a0";i&&g.insertBefore(x.createTextNode(i),g.firstChild),$.style.display="",ba.style.marginLeft=$.offsetWidth+"px",by=!1}function cx(){var a=bm.inverted?bm.from:bm.to,b=di(),c=dd(a,!0),d=c.y+bz*di();K.style.top=Math.max(Math.min(d,M.offsetHeight),0)+"px",K.style.left=c.x+"px",P(bm.from,bm.to)?(bc.style.top=c.y+"px",bc.style.left=(e.lineWrapping?Math.min(c.x,ba.offsetWidth):c.x)+"px",bc.style.display=""):bc.style.display="none"}function cy(a,b){var c=bn&&cD(bn);c&&(Q(c,a)?a=c:Q(b,c)&&(b=c)),cz(a,b),bt=!0}function cz(a,b,c,d){cH=null,c==null&&(c=bm.from.line,d=bm.to.line);if(P(bm.from,a)&&P(bm.to,b))return;if(Q(b,a)){var e=b;b=a,a=e}a.line!=c&&(a=cA(a,c,bm.from.ch)),b.line!=d&&(b=cA(b,d,bm.to.ch)),P(a,b)?bm.inverted=!1:P(a,bm.to)?bm.inverted=!1:P(b,bm.from)&&(bm.inverted=!0),P(a,b)?P(bm.from,bm.to)||bu.push({from:c,to:d+1}):P(bm.from,bm.to)?bu.push({from:a.line,to:b.line+1}):(P(a,bm.from)||(a.line<c?bu.push({from:a.line,to:Math.min(b.line,c)+1}):bu.push({from:c,to:Math.min(d,a.line)+1})),P(b,bm.to)||(b.line<d?bu.push({from:Math.max(c,a.line),to:d+1}):bu.push({from:Math.max(a.line,d),to:b.line+1}))),bm.from=a,bm.to=b,bw=!0}function cA(a,b,c){function d(b){var d=a.line+b,e=b==1?bj.size:-1;while(d!=e){var f=bL(d);if(!f.hidden){var g=a.ch;if(g>c||g>f.text.length)g=f.text.length;return{line:d,ch:g}}d+=b}}var e=bL(a.line);return e.hidden?a.line>=b?d(1)||d(-1):d(-1)||d(1):a}function cB(a,b,c){var d=cD({line:a,ch:b||0});(c?cy:cz)(d,d)}function cC(a){return Math.max(0,Math.min(a,bj.size-1))}function cD(a){if(a.line<0)return{line:0,ch:0};if(a.line>=bj.size)return{line:bj.size-1,ch:bL(bj.size-1).text.length};var b=a.ch,c=bL(a.line).text.length;return b==null||b>c?{line:a.line,ch:c}:b<0?{line:a.line,ch:0}:a}function cE(a,b){function g(){for(var b=d+a,c=a<0?-1:bj.size;b!=c;b+=a){var e=bL(b);if(!e.hidden)return d=b,f=e,!0}}function h(){if(e==(a<0?0:f.text.length))if(g())e=a<0?f.text.length:0;else return!1;else e+=a;return!0}var c=bm.inverted?bm.from:bm.to,d=c.line,e=c.ch,f=bL(d);if(b=="char")h();else if(b=="word"){var i=!1;for(;;){if(a<0&&!h())break;if(/\w/.test(f.text.charAt(e)))i=!0;else if(i){a<0&&(a=1,h());break}if(a>0&&!h())break}}return{line:d,ch:e}}function cF(a,b){var c=a<0?bm.from:bm.to;if(bn||P(bm.from,bm.to))c=cE(a,b);cB(c.line,c.ch,!0)}function cG(a,b){P(bm.from,bm.to)?a<0?cd("",cE(a,b),bm.to):cd("",bm.from,cE(a,b)):cd("",bm.from,bm.to),bt=!0}function cI(a,b){var c=0,d=dd(bm.inverted?bm.from:bm.to,!0);cH!=null&&(d.x=cH),b=="page"?c=M.clientHeight:b=="line"&&(c=di());var e=de(d.x,d.y+c*a+2);cB(e.line,e.ch,!0),cH=d.x}function cJ(a){var b=bL(a.line).text,c=a.ch,d=a.ch;while(c>0&&/\w/.test(b.charAt(c-1)))--c;while(d<b.length&&/\w/.test(b.charAt(d)))++d;cy({line:a.line,ch:c},{line:a.line,ch:d})}function cK(a){cy({line:a,ch:0},{line:a,ch:bL(a).text.length})}function cL(a){if(P(bm.from,bm.to))return cM(bm.from.line,a);var b=bm.to.line-(bm.to.ch?0:1);for(var c=bm.from.line;c<=b;++c)cM(c,a)}function cM(a,b){b||(b="add");if(b=="smart")if(!bi.indent)b="prev";else var c=du(a);var d=bL(a),f=d.indentation(e.tabSize),g=d.text.match(/^\s*/)[0],h;b=="prev"?a?h=bL(a-1).indentation(e.tabSize):h=0:b=="smart"?h=bi.indent(c,d.text.slice(g.length)):b=="add"?h=f+e.indentUnit:b=="subtract"&&(h=f-e.indentUnit),h=Math.max(0,h);var i=h-f;if(!i){if(bm.from.line!=a&&bm.to.line!=a)return;var j=g}else{var j="",k=0;if(e.indentWithTabs)for(var l=Math.floor(h/e.tabSize);l;--l)k+=e.tabSize,j+="\t";while(k<h)++k,j+=" "}cd(j,{line:a,ch:0},{line:a,ch:g.length})}function cN(){bi=a.getMode(e,e.mode),bj.iter(0,bj.size,function(a){a.stateAfter=null}),bk=[0],dx()}function cO(){var a=e.gutter||e.lineNumbers;$.style.display=a?"":"none",a?by=!0:bd.parentNode.style.marginLeft=0}function cP(a,b){if(e.lineWrapping){A.className+=" CodeMirror-wrap";var c=M.clientWidth/dk()-3;bj.iter(0,bj.size,function(a){if(a.hidden)return;var b=Math.ceil(a.text.length/c)||1;b!=1&&bM(a,b)}),ba.style.width=U.style.width=""}else A.className=A.className.replace(" CodeMirror-wrap",""),bF=null,bE="",bj.iter(0,bj.size,function(a){a.height!=1&&!a.hidden&&bM(a,1),a.text.length>bE.length&&(bE=a.text)});bu.push({from:0,to:bj.size})}function cQ(){for(var a='<span class="cm-tab">',b=0;b<e.tabSize;++b)a+=" ";return a+"</span>"}function cR(){bG=cQ(),ct(!0)}function cS(){this.set=[]}function cT(a,b,c){function e(a,b,c,e){bL(a).addMark(new m(b,c,e,d.set))}a=cD(a),b=cD(b);var d=new cS;if(a.line==b.line)e(a.line,a.ch,b.ch,c);else{e(a.line,a.ch,null,c);for(var f=a.line+1,g=b.line;f<g;++f)e(f,null,null,c);e(b.line,null,b.ch,c)}return bu.push({from:a.line,to:b.line+1}),d}function cU(a){a=cD(a);var b=new n(a.ch);return bL(a.line).addMark(b),b}function cV(a,b,c){return typeof a=="number"&&(a=bL(cC(a))),a.gutterMarker={text:b,style:c},by=!0,a}function cW(a){typeof a=="number"&&(a=bL(cC(a))),a.gutterMarker=null,by=!0}function cX(a,b){var c=a,d=a;return typeof a=="number"?d=bL(cC(a)):c=t(a),c==null?null:(b(d,c)&&bu.push({from:c,to:c+1}),d)}function cY(a,b){return cX(a,function(a){if(a.className!=b)return a.className=b,!0})}function cZ(a,b){return cX(a,function(a,c){if(a.hidden!=b)return a.hidden=b,bM(a,b?0:1),b&&(bm.from.line==c||bm.to.line==c)&&cz(cA(bm.from,bm.from.line,bm.from.ch),cA(bm.to,bm.to.line,bm.to.ch)),by=!0})}function c$(a){if(typeof a=="number"){if(!bJ(a))return null;var b=a;a=bL(a);if(!a)return null}else{var b=t(a);if(b==null)return null}var c=a.gutterMarker;return{line:b,handle:a,text:a.text,markerText:c&&c.text,markerClass:c&&c.style,lineClass:a.className}}function c_(a){return bb.innerHTML="<pre><span>x</span></pre>",bb.firstChild.firstChild.firstChild.nodeValue=a,bb.firstChild.firstChild.offsetWidth||10}function da(a,b){function e(a){return bb.innerHTML="<pre><span>"+c.getHTML(null,null,!1,bG,a)+"</span></pre>",bb.firstChild.firstChild.offsetWidth}if(b<=0)return 0;var c=bL(a),d=c.text,f=0,g=0,h=d.length,i,j=Math.min(h,Math.ceil(b/dk()));for(;;){var k=e(j);if(k<=b&&j<h)j=Math.min(h,Math.ceil(j*1.2));else{i=k,h=j;break}}if(b>i)return h;j=Math.floor(h*.8),k=e(j),k<b&&(f=j,g=k);for(;;){if(h-f<=1)return i-b>b-g?f:h;var l=Math.ceil((f+h)/2),m=e(l);m>b?(h=l,i=m):(f=l,g=m)}}function dc(a,b){var c="";if(e.lineWrapping){var d=a.text.indexOf(" ",b+2);c=a.text.slice(b+1,d<0?a.text.length:d+(I?5:0))}bb.innerHTML="<pre>"+a.getHTML(null,null,!1,bG,b)+'<span id="CodeMirror-temp-'+db+'">'+(a.text.charAt(b)||" ")+"</span>"+c+"</pre>";var f=document.getElementById("CodeMirror-temp-"+db),g=f.offsetTop,h=f.offsetLeft;if(I&&b&&g==0&&h==0){var i=document.createElement("span");i.innerHTML="x",f.parentNode.insertBefore(i,f.nextSibling),g=i.offsetTop}return{top:g,left:h}}function dd(a,b){var c,d=di(),f=d*(v(bj,a.line)-(b?bz:0));if(a.ch==0)c=0;else{var g=dc(bL(a.line),a.ch);c=g.left,e.lineWrapping&&(f+=Math.max(0,g.top))}return{x:c,y:f,yBot:f+d}}function de(a,b){function l(a){var b=dc(h,a);if(j){var d=Math.round(b.top/c);return Math.max(0,b.left+(d-k)*M.clientWidth)}return b.left}b<0&&(b=0);var c=di(),d=dk(),f=bz+Math.floor(b/c),g=u(bj,f);if(g>=bj.size)return{line:bj.size-1,ch:0};var h=bL(g),i=h.text,j=e.lineWrapping,k=j?f-v(bj,g):0;if(a<=0&&k==0)return{line:g,ch:0};var m=0,n=0,o=i.length,p,q=Math.min(o,Math.ceil((a+k*M.clientWidth*.9)/d));for(;;){var r=l(q);if(r<=a&&q<o)q=Math.min(o,Math.ceil(q*1.2));else{p=r,o=q;break}}if(a>p)return{line:g,ch:o};q=Math.floor(o*.8),r=l(q),r<a&&(m=q,n=r);for(;;){if(o-m<=1)return{line:g,ch:p-a>a-n?m:o};var s=Math.ceil((m+o)/2),t=l(s);t>a?(o=s,p=t):(m=s,n=t)}}function df(a){var b=dd(a,!0),c=N(ba);return{x:c.left+b.x,y:c.top+b.y,yBot:c.top+b.yBot}}function di(){var a=bd.offsetHeight;return a==dh?dg:(dh=a,bb.innerHTML="<pre>x<br>x<br>x<br>x<br>x<br>x<br>x<br>x<br>x<br>x</pre>",dg=bb.firstChild.offsetHeight/10||1)}function dk(){return M.clientWidth==dh?dj:(dh=M.clientWidth,dj=c_("x"))}function dl(){return ba.offsetTop}function dm(){return ba.offsetLeft}function dn(a,b){var c=N(M,!0),d,e;try{d=a.clientX,e=a.clientY}catch(a){return null}if(!b&&(d-c.left>M.clientWidth||e-c.top>M.clientHeight))return null;var f=N(ba,!0);return de(d-f.left,e-f.top)}function dp(a){function e(){var a=X(L.value).join("\n");a!=d&&dB(ce)(a,"end"),K.style.position="relative",L.style.cssText=c,bx=!1,cn(!0),cj()}var b=dn(a);if(!b||window.opera)return;(P(bm.from,bm.to)||Q(b,bm.from)||!Q(b,bm.to))&&dB(cB)(b.line,b.ch);var c=L.style.cssText;K.style.position="absolute",L.style.cssText="position: fixed; width: 30px; height: 30px; top: "+(a.clientY-5)+"px; left: "+(a.clientX-5)+"px; z-index: 1000; background: white; "+"border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);",bx=!0;var d=L.value=ch();co(),L.select();if(H){B(a);var f=E(window,"mouseup",function(){f(),setTimeout(e,20)},!0)}else setTimeout(e,50)}function dq(){clearInterval(bh);var a=!0;bc.style.visibility="",bh=setInterval(function(){bc.style.visibility=(a=!a)?"":"hidden"},650)}function ds(a){function p(a,b,c){if(!a.text)return;var d=a.styles,e=g?0:a.text.length-1,f;for(var i=g?0:d.length-2,j=g?d.length:-2;i!=j;i+=2*h){var k=d[i];if(d[i+1]!=null&&d[i+1]!=m){e+=h*k.length;continue}for(var l=g?0:k.length-1,p=g?k.length:-1;l!=p;l+=h,e+=h)if(e>=b&&e<c&&o.test(f=k.charAt(l))){var q=dr[f];if(q.charAt(1)==">"==g)n.push(f);else{if(n.pop()!=q.charAt(0))return{pos:e,match:!1};if(!n.length)return{pos:e,match:!0}}}}}var b=bm.inverted?bm.from:bm.to,c=bL(b.line),d=b.ch-1,e=d>=0&&dr[c.text.charAt(d)]||dr[c.text.charAt(++d)];if(!e)return;var f=e.charAt(0),g=e.charAt(1)==">",h=g?1:-1,i=c.styles;for(var j=d+1,k=0,l=i.length;k<l;k+=2)if((j-=i[k].length)<=0){var m=i[k+1];break}var n=[c.text.charAt(d)],o=/[(){}[\]]/;for(var k=b.line,l=g?Math.min(k+100,bj.size):Math.max(-1,k-100);k!=l;k+=h){var c=bL(k),q=k==b.line,r=p(c,q&&g?d+1:0,q&&!g?d:c.text.length);if(r)break}r||(r={pos:null,match:!1});var m=r.match?"CodeMirror-matchingbracket":"CodeMirror-nonmatchingbracket",s=cT({line:b.line,ch:d},{line:b.line,ch:d+1},m),t=r.pos!=null&&cT({line:k,ch:r.pos},{line:k,ch:r.pos+1},m),u=dB(function(){s.clear(),t&&t.clear()});a?setTimeout(u,800):bD=u}function dt(a){var b,c;for(var d=a,f=a-40;d>f;--d){if(d==0)return 0;var g=bL(d-1);if(g.stateAfter)return d;var h=g.indentation(e.tabSize);if(c==null||b>h)c=d-1,b=h}return c}function du(a){var b=dt(a),c=b&&bL(b-1).stateAfter;return c?c=j(bi,c):c=k(bi),bj.iter(b,a,function(a){a.highlight(bi,c,e.tabSize),a.stateAfter=j(bi,c)}),b<a&&bu.push({from:b,to:a}),a<bj.size&&!bL(a).stateAfter&&bk.push(a),c}function dv(a,b){var c=du(a);bj.iter(a,b,function(a){a.highlight(bi,c,e.tabSize),a.stateAfter=j(bi,c)})}function dw(){var a=+(new Date)+e.workTime,b=bk.length;while(bk.length){if(!bL(bA).stateAfter)var c=bA;else var c=bk.pop();if(c>=bj.size)continue;var d=dt(c),f=d&&bL(d-1).stateAfter;f?f=j(bi,f):f=k(bi);var g=0,h=bi.compareStates,i=!1,l=d,m=!1;bj.iter(l,bj.size,function(b){var d=b.stateAfter;if(+(new Date)>a)return bk.push(l),dx(e.workDelay),i&&bu.push({from:c,to:l+1}),m=!0;var k=b.highlight(bi,f,e.tabSize);k&&(i=!0),b.stateAfter=j(bi,f);if(h){if(d&&h(d,f))return!0}else if(k!==!1||!d)g=0;else if(++g>3)return!0;++l});if(m)return;i&&bu.push({from:c,to:l+1})}b&&e.onHighlightComplete&&e.onHighlightComplete(bK)}function dx(a){if(!bk.length)return;bg.set(a,dB(dw))}function dy(){bs=bt=null,bu=[],bv=bw=!1}function dz(){var a=!1;bw&&(a=!cq()),bu.length?ct(bu):(bw&&cx(),by&&cw()),a&&cq(),bw&&(cp(),dq()),bl&&!bx&&(bs===!0||bs!==!1&&bw)&&cn(bt),bw&&e.matchBrackets&&setTimeout(dB(function(){bD&&(bD(),bD=null),P(bm.from,bm.to)&&ds(!1)}),20);var b=bv;bw&&e.onCursorActivity&&e.onCursorActivity(bK),b&&e.onChange&&bK&&e.onChange(bK,b)}function dB(a){return function(){dA++||dy();try{var b=a.apply(this,arguments)}finally{--dA||dz()}return b}}var e={},l=a.defaults;for(var p in l)l.hasOwnProperty(p)&&(e[p]=(d&&d.hasOwnProperty(p)?d:l)[p]);var x=e.document,A=x.createElement("div");A.className="CodeMirror"+(e.lineWrapping?" CodeMirror-wrap":""),A.innerHTML='<div style="overflow: hidden; position: relative; width: 1px; height: 0px;"><textarea style="position: absolute; width: 1;" wrap="off" autocorrect="off" autocapitalize="off"></textarea></div><div class="CodeMirror-scroll cm-s-'+e.theme+'">'+'<div style="position: relative">'+'<div style="position: relative">'+'<div class="CodeMirror-gutter"><div class="CodeMirror-gutter-text"></div></div>'+'<div class="CodeMirror-lines"><div style="position: relative">'+'<div style="position: absolute; width: 100%; height: 0; overflow: hidden; visibility: hidden"></div>'+'<pre class="CodeMirror-cursor">&#160;</pre>'+"<div></div>"+"</div></div></div></div></div>",c.appendChild?c.appendChild(A):c(A);var K=A.firstChild,L=K.firstChild,M=A.lastChild,U=M.firstChild,Z=U.firstChild,$=Z.firstChild,_=$.firstChild,ba=$.nextSibling.firstChild,bb=ba.firstChild,bc=bb.nextSibling,bd=bc.nextSibling;J||(ba.draggable=!0),e.tabindex!=null&&(L.tabindex=e.tabindex),!e.gutter&&!e.lineNumbers&&($.style.display="none");try{c_("x")}catch(be){throw be.message.match(/unknown runtime/i)&&(be=new Error("A CodeMirror inside a P-style element does not work in Internet Explorer. (innerHTML bug)")),be}var bf=new F,bg=new F,bh,bi,bj=new r([new q([new o("")])]),bk,bl;cN();var bm={from:{line:0,ch:0},to:{line:0,ch:0},inverted:!1},bn,bo,bp,bq,br=!1,bs,bt,bu,bv,bw,bx,by,bz=0,bA=0,bB=0,bC=0,bD,bE="",bF,bG=cQ();dB(function(){bN(e.value||""),bs=!1})();var bH=new w;E(M,"mousedown",dB(bP)),E(M,"dblclick",dB(bQ)),E(ba,"dragstart",bS),E(ba,"selectstart",z),H||E(M,"contextmenu",dp),E(M,"scroll",function(){ct([]),e.fixedGutter&&($.style.left=M.scrollLeft+"px"),e.onScroll&&e.onScroll(bK)}),E(window,"resize",function(){ct(!0)}),E(L,"keyup",dB(bX)),E(L,"input",ck),E(L,"keydown",dB(bV)),E(L,"keypress",dB(bW)),E(L,"focus",bY),E(L,"blur",bZ),E(M,"dragenter",B),E(M,"dragover",B),E(M,"drop",dB(bR)),E(M,"paste",function(){co(),ck()}),E(L,"paste",ck),E(L,"cut",dB(function(){ce("")}));var bI;try{bI=x.activeElement==L}catch(be){}bI?setTimeout(bY,20):bZ();var bK=A.CodeMirror={getValue:bO,setValue:dB(bN),getSelection:ch,replaceSelection:dB(ce),focus:function(){co(),bY(),ck()},setOption:function(a,b){var c=e[a];e[a]=b,(a=="lineNumbers"||a=="gutter"||a=="firstLineNumber"||a=="theme")&&dB(cO)(),a=="mode"||a=="indentUnit"?cN():a=="readOnly"&&b?(bZ(),L.blur()):a=="theme"?M.className=M.className.replace(/cm-s-\w+/,"cm-s-"+b):a=="lineWrapping"&&c!=b?dB(cP)():a=="tabSize"&&dB(cR)()},getOption:function(a){return e[a]},undo:dB(ca),redo:dB(cb),indentLine:dB(function(a,b){bJ(a)&&cM(a,b==null?"smart":b?"add":"subtract")}),indentSelection:dB(cL),historySize:function(){return{undo:bH.done.length,redo:bH.undone.length}},clearHistory:function(){bH=new w},matchBrackets:dB(function(){ds(!0)}),getTokenAt:dB(function(a){return a=cD(a),bL(a.line).getTokenAt(bi,du(a.line),a.ch)}),getStateAfter:function(a){return a=cC(a==null?bj.size-1:a),du(a+1)},cursorCoords:function(a){return a==null&&(a=bm.inverted),df(a?bm.from:bm.to)},charCoords:function(a){return df(cD(a))},coordsChar:function(a){var b=N(ba);return de(a.x-b.left,a.y-b.top)},markText:dB(cT),setBookmark:cU,setMarker:dB(cV),clearMarker:dB(cW),setLineClass:dB(cY),hideLine:dB(function(a){return cZ(a,!0)}),showLine:dB(function(a){return cZ(a,!1)}),lineInfo:c$,addWidget:function(a,b,c,d,e){a=dd(cD(a));var f=a.yBot,g=a.x;b.style.position="absolute",U.appendChild(b);if(d=="over")f=a.y;else if(d=="near"){var h=Math.max(M.offsetHeight,bj.height*di()),i=Math.max(U.clientWidth,ba.clientWidth)-dm();a.yBot+b.offsetHeight>h&&a.y>b.offsetHeight&&(f=a.y-b.offsetHeight),g+b.offsetWidth>i&&(g=i-b.offsetWidth)}b.style.top=f+dl()+"px",b.style.left=b.style.right="",e=="right"?(g=U.clientWidth-b.offsetWidth,b.style.right="0px"):(e=="left"?g=0:e=="middle"&&(g=(U.clientWidth-b.offsetWidth)/2),b.style.left=g+dm()+"px"),c&&cr(g,f,g+b.offsetWidth,f+b.offsetHeight)},lineCount:function(){return bj.size},clipPos:cD,getCursor:function(a){return a==null&&(a=bm.inverted),R(a?bm.from:bm.to)},somethingSelected:function(){return!P(bm.from,bm.to)},setCursor:dB(function(a,b,c){b==null&&typeof a.line=="number"?cB(a.line,a.ch,c):cB(a,b,c)}),setSelection:dB(function(a,b,c){(c?cy:cz)(cD(a),cD(b||a))}),getLine:function(a){if(bJ(a))return bL(a).text},setLine:dB(function(a,b){bJ(a)&&cd(b,{line:a,ch:0},{line:a,ch:bL(a).text.length})}),removeLine:dB(function(a){bJ(a)&&cd("",{line:a,ch:0},cD({line:a+1,ch:0}))}),replaceRange:dB(cd),getRange:function(a,b){return cg(cD(a),cD(b))},execCommand:function(a){return g[a](bK)},moveH:dB(cF),deleteH:dB(cG),moveV:dB(cI),toggleOverwrite:function(){br=!br},coordsFromIndex:function(a){var b=0,c;return bj.iter(0,bj.size,function(d){var e=d.text.length+1;if(e>a)return c=a,!0;a-=e,++b}),cD({line:b,ch:c})},operation:function(a){return dB(a)()},refresh:function(){ct(!0)},getInputField:function(){return L},getWrapperElement:function(){return A},getScrollerElement:function(){return M},getGutterElement:function(){return $}},bU=null,ci=!1,cl="",cH=null;cS.prototype.clear=dB(function(){var a=Infinity,b=-Infinity;for(var c=0,d=this.set.length;c<d;++c){var e=this.set[c],f=e.marked;if(!f||!e.parent)continue;var g=t(e);a=Math.min(a,g),b=Math.max(b,g);for(var h=0;h<f.length;++h)f[h].set==this.set&&f.splice(h--,1)}a!=Infinity&&bu.push({from:a,to:b+1})}),cS.prototype.find=function(){var a,b;for(var c=0,d=this.set.length;c<d;++c){var e=this.set[c],f=e.marked;for(var g=0;g<f.length;++g){var h=f[g];if(h.set==this.set)if(h.from!=null||h.to!=null){var i=t(e);i!=null&&(h.from!=null&&(a={line:i,ch:h.from}),h.to!=null&&(b={line:i,ch:h.to}))}}}return{from:a,to:b}};var db=Math.floor(Math.random()*16777215).toString(16),dg,dh,dj,dh=0,dr={"(":")>",")":"(<","[":"]>","]":"[<","{":"}>","}":"{<"},dA=0;for(var dC in f)f.propertyIsEnumerable(dC)&&!bK.propertyIsEnumerable(dC)&&(bK[dC]=f[dC]);return bK}function i(a,b,c){function e(a,b,c){var d=b[a];if(d!=null)return d;c==null&&(c=b.fallthrough);if(c==null)return b.catchall;if(typeof c=="string")return e(a,h[c]);for(var f=0,g=c.length;f<g;++f){d=e(a,h[c[f]]);if(d!=null)return d}return null}function f(a){return b?e(a,b,c):e(a,h[c])}var d=Z[a.keyCode];if(d==null)return null;a.altKey&&(d="Alt-"+d),a.ctrlKey&&(d="Ctrl-"+d),a.metaKey&&(d="Cmd-"+d);if(a.shiftKey){var g=f("Shift-"+d);if(g!=null)return g}return f(d)}function j(a,b){if(b===!0)return b;if(a.copyState)return a.copyState(b);var c={};for(var d in b){var e=b[d];e instanceof Array&&(e=e.concat([])),c[d]=e}return c}function k(a,b,c){return a.startState?a.startState(b,c):!0}function l(a,b){this.pos=this.start=0,this.string=a,this.tabSize=b||8}function m(a,b,c,d){this.from=a,this.to=b,this.style=c,this.set=d}function n(a){this.from=a,this.to=a,this.line=null}function o(a,b){this.styles=b||[a,null],this.text=a,this.height=1,this.marked=this.gutterMarker=this.className=null,this.stateAfter=this.parent=this.hidden=null}function p(a,b,c,d){for(var e=0,f=0,g=0;f<b;e+=2){var h=c[e],i=f+h.length;g==0?(i>a&&d.push(h.slice(a-f,Math.min(h.length,b-f)),c[e+1]),i>=a&&(g=1)):g==1&&(i>b?d.push(h.slice(0,b-f),c[e+1]):d.push(h,c[e+1])),f=i}}function q(a){this.lines=a,this.parent=null;for(var b=0,c=a.length,d=0;b<c;++b)a[b].parent=this,d+=a[b].height;this.height=d}function r(a){this.children=a;var b=0,c=0;for(var d=0,e=a.length;d<e;++d){var f=a[d];b+=f.chunkSize(),c+=f.height,f.parent=this}this.size=b,this.height=c,this.parent=null}function s(a,b){for(;;){for(var c=0,d=a.children.length;c<d;++c){var e=a.children[c],f=e.chunkSize();if(b<f){a=e;break}b-=f}if(a.lines)return a.lines[b]}}function t(a){if(a.parent==null)return null;var b=a.parent,c=W(b.lines,a);for(var d=b.parent;d;b=d,d=d.parent)for(var e=0,f=d.children.length;;++e){if(d.children[e]==b)break;c+=d.children[e].chunkSize()}return c}function u(a,b){var c=0;d:do{for(var e=0,f=a.children.length;e<f;++e){var g=a.children[e],h=g.height;if(b<h){a=g;continue d}b-=h,c+=g.chunkSize()}return c}while(!a.lines);for(var e=0,f=a.lines.length;e<f;++e){var i=a.lines[e],j=i.height;if(b<j)break;b-=j}return c+e}function v(a,b){var c=0;d:do{for(var e=0,f=a.children.length;e<f;++e){var g=a.children[e],h=g.chunkSize();if(b<h){a=g;continue d}b-=h,c+=g.height}return c}while(!a.lines);for(var e=0;e<b;++e)c+=a.lines[e].height;return c}function w(){this.time=0,this.done=[],this.undone=[]}function x(){B(this)}function y(a){return a.stop||(a.stop=x),a}function z(a){a.preventDefault?a.preventDefault():a.returnValue=!1}function A(a){a.stopPropagation?a.stopPropagation():a.cancelBubble=!0}function B(a){z(a),A(a)}function C(a){return a.target||a.srcElement}function D(a){if(a.which)return a.which;if(a.button&1)return 1;if(a.button&2)return 3;if(a.button&4)return 2}function E(a,b,c,d){if(typeof a.addEventListener=="function"){a.addEventListener(b,c,!1);if(d)return function(){a.removeEventListener(b,c,!1)}}else{var e=function(a){c(a||window.event)};a.attachEvent("on"+b,e);if(d)return function(){a.detachEvent("on"+b,e)}}}function F(){this.id=null}function L(a,b,c){b==null&&(b=a.search(/[^\s\u00a0]/),b==-1&&(b=a.length));for(var d=0,e=0;d<b;++d)a.charAt(d)=="\t"?e+=c-e%c:++e;return e}function M(a){return a.currentStyle?a.currentStyle:window.getComputedStyle(a,null)}function N(a,b){var c=a.ownerDocument.body,d=0,e=0,f=!1;for(var g=a;g;g=g.offsetParent){var h=g.offsetLeft,i=g.offsetTop;g==c?(d+=Math.abs(h),e+=Math.abs(i)):(d+=h,e+=i),b&&M(g).position=="fixed"&&(f=!0)}var j=b&&!f?null:c;for(var g=a.parentNode;g!=j;g=g.parentNode)g.scrollLeft!=null&&(d-=g.scrollLeft,e-=g.scrollTop);return{left:d,top:e}}function O(a){return a.textContent||a.innerText||a.nodeValue||""}function P(a,b){return a.line==b.line&&a.ch==b.ch}function Q(a,b){return a.line<b.line||a.line==b.line&&a.ch<b.ch}function R(a){return{line:a.line,ch:a.ch}}function T(a){return U?(S.innerHTML="",S.appendChild(document.createTextNode(a))):S.textContent=a,S.innerHTML}function V(a,b){if(!b)return a?a.length:0;if(!a)return b.length;for(var c=a.length,d=b.length;c>=0&&d>=0;--c,--d)if(a.charAt(c)!=b.charAt(d))break;return d+1}function W(a,b){if(a.indexOf)return a.indexOf(b);for(var c=0,d=a.length;c<d;++c)if(a[c]==b)return c;return-1}a.defaults={value:"",mode:null,theme:"default",indentUnit:2,indentWithTabs:!1,tabSize:4,keyMap:"default",extraKeys:null,electricChars:!0,onKeyEvent:null,lineWrapping:!1,lineNumbers:!1,gutter:!1,fixedGutter:!1,firstLineNumber:1,readOnly:!1,onChange:null,onCursorActivity:null,onGutterClick:null,onHighlightComplete:null,onFocus:null,onBlur:null,onScroll:null,matchBrackets:!1,workTime:100,workDelay:200,pollInterval:100,undoDepth:40,tabindex:null,document:window.document};var b=/Mac/.test(navigator.platform),c=/Win/.test(navigator.platform),d={},e={};a.defineMode=function(b,c){!a.defaults.mode&&b!="null"&&(a.defaults.mode=b),d[b]=c},a.defineMIME=function(a,b){e[a]=b},a.getMode=function(b,c){typeof c=="string"&&e.hasOwnProperty(c)&&(c=e[c]);if(typeof c=="string")var f=c,g={};else if(c!=null)var f=c.name,g=c;var h=d[f];return h?h(b,g||{}):(window.console&&console.warn("No mode "+f+" found, falling back to plain text."),a.getMode(b,"text/plain"))},a.listModes=function(){var a=[];for(var b in d)d.propertyIsEnumerable(b)&&a.push(b);return a},a.listMIMEs=function(){var a=[];for(var b in e)e.propertyIsEnumerable(b)&&a.push({mime:b,mode:e[b]});return a};var f=a.extensions={};a.defineExtension=function(a,b){f[a]=b};var g=a.commands={selectAll:function(a){a.setSelection({line:0,ch:0},{line:a.lineCount()-1})},killLine:function(a){var b=a.getCursor(!0),c=a.getCursor(!1),d=!P(b,c);!d&&a.getLine(b.line).length==b.ch?a.replaceRange("",b,{line:b.line+1,ch:0}):a.replaceRange("",b,d?c:{line:b.line})},deleteLine:function(a){var b=a.getCursor().line;a.replaceRange("",{line:b,ch:0},{line:b})},undo:function(a){a.undo()},redo:function(a){a.redo()},goDocStart:function(a){a.setCursor(0,0,!0)},goDocEnd:function(a){a.setSelection({line:a.lineCount()-1},null,!0)},goLineStart:function(a){a.setCursor(a.getCursor().line,0,!0)},goLineStartSmart:function(a){var b=a.getCursor(),c=a.getLine(b.line),d=Math.max(0,c.search(/\S/));a.setCursor(b.line,b.ch<=d&&b.ch?0:d,!0)},goLineEnd:function(a){a.setSelection({line:a.getCursor().line},null,!0)},goLineUp:function(a){a.moveV(-1,"line")},goLineDown:function(a){a.moveV(1,"line")},goPageUp:function(a){a.moveV(-1,"page")},goPageDown:function(a){a.moveV(1,"page")},goCharLeft:function(a){a.moveH(-1,"char")},goCharRight:function(a){a.moveH(1,"char")},goWordLeft:function(a){a.moveH(-1,"word")},goWordRight:function(a){a.moveH(1,"word")},delCharLeft:function(a){a.deleteH(-1,"char")},delCharRight:function(a){a.deleteH(1,"char")},delWordLeft:function(a){a.deleteH(-1,"word")},delWordRight:function(a){a.deleteH(1,"word")},indentAuto:function(a){a.indentSelection("smart")},indentMore:function(a){a.indentSelection("add")},indentLess:function(a){a.indentSelection("subtract")},insertTab:function(a){a.replaceSelection("\t","end")},transposeChars:function(a){var b=a.getCursor(),c=a.getLine(b.line);b.ch>0&&b.ch<c.length-1&&a.replaceRange(c.charAt(b.ch)+c.charAt(b.ch-1),{line:b.line,ch:b.ch-1},{line:b.line,ch:b.ch+1})},newlineAndIndent:function(a){a.replaceSelection("\n","end"),a.indentLine(a.getCursor().line)},toggleOverwrite:function(a){a.toggleOverwrite()}},h=a.keyMap={};h.basic={Left:"goCharLeft",Right:"goCharRight",Up:"goLineUp",Down:"goLineDown",End:"goLineEnd",Home:"goLineStartSmart",PageUp:"goPageUp",PageDown:"goPageDown",Delete:"delCharRight",Backspace:"delCharLeft",Tab:"indentMore","Shift-Tab":"indentLess",Enter:"newlineAndIndent",Insert:"toggleOverwrite"},h.pcDefault={"Ctrl-A":"selectAll","Ctrl-D":"deleteLine","Ctrl-Z":"undo","Shift-Ctrl-Z":"redo","Ctrl-Y":"redo","Ctrl-Home":"goDocStart","Alt-Up":"goDocStart","Ctrl-End":"goDocEnd","Ctrl-Down":"goDocEnd","Ctrl-Left":"goWordLeft","Ctrl-Right":"goWordRight","Alt-Left":"goLineStart","Alt-Right":"goLineEnd","Ctrl-Backspace":"delWordLeft","Ctrl-Delete":"delWordRight","Ctrl-S":"save","Ctrl-F":"find","Ctrl-G":"findNext","Shift-Ctrl-G":"findPrev","Ctrl-R":"replace","Shift-Ctrl-R":"replaceAll",fallthrough:"basic"},h.macDefault={"Cmd-A":"selectAll","Cmd-D":"deleteLine","Cmd-Z":"undo","Cmd-Z":"redo","Cmd-Up":"goDocStart","Cmd-End":"goDocEnd","Cmd-Down":"goDocEnd","Alt-Left":"goWordLeft","Alt-Right":"goWordRight","Cmd-Left":"goLineStart","Cmd-Right":"goLineEnd","Alt-Backspace":"delWordRight","Ctrl-Alt-Backspace":"delWordRight","Alt-Delete":"delWordRight","Cmd-S":"save","Cmd-F":"find","Cmd-G":"findNext","Shift-Cmd-G":"findPrev","Cmd-Alt-F":"replace","Shift-Cmd-Alt-F":"replaceAll",fallthrough:["basic","emacsy"]},h["default"]=b?h.macDefault:h.pcDefault,h.emacsy={"Ctrl-F":"goCharRight","Ctrl-B":"goCharLeft","Ctrl-P":"goLineUp","Ctrl-N":"goLineDown","Alt-F":"goWordRight","Alt-B":"goWordLeft","Ctrl-A":"goLineStart","Ctrl-E":"goLineEnd","Ctrl-V":"goPageUp","Shift-Ctrl-V":"goPageDown","Ctrl-D":"delCharRight","Ctrl-H":"delCharLeft","Alt-D":"delWordRight","Alt-Backspace":"delWordLeft","Ctrl-K":"killLine","Ctrl-T":"transposeChars"},a.fromTextArea=function(b,c){function d(){b.value=h.getValue()}c||(c={}),c.value=b.value,!c.tabindex&&b.tabindex&&(c.tabindex=b.tabindex);if(b.form){var e=E(b.form,"submit",d,!0);if(typeof b.form.submit=="function"){var f=b.form.submit;function g(){d(),b.form.submit=f,b.form.submit(),b.form.submit=g}b.form.submit=g}}b.style.display="none";var h=a(function(a){b.parentNode.insertBefore(a,b.nextSibling)},c);return h.save=d,h.toTextArea=function(){d(),b.parentNode.removeChild(h.getWrapperElement()),b.style.display="",b.form&&(e(),typeof b.form.submit=="function"&&(b.form.submit=f))},h},a.copyState=j,a.startState=k,l.prototype={eol:function(){return this.pos>=this.string.length},sol:function(){return this.pos==0},peek:function(){return this.string.charAt(this.pos)},next:function(){if(this.pos<this.string.length)return this.string.charAt(this.pos++)},eat:function(a){var b=this.string.charAt(this.pos);if(typeof a=="string")var c=b==a;else var c=b&&(a.test?a.test(b):a(b));if(c)return++this.pos,b},eatWhile:function(a){var b=this.pos;while(this.eat(a));return this.pos>b},eatSpace:function(){var a=this.pos;while(/[\s\u00a0]/.test(this.string.charAt(this.pos)))++this.pos;return this.pos>a},skipToEnd:function(){this.pos=this.string.length},skipTo:function(a){var b=this.string.indexOf(a,this.pos);if(b>-1)return this.pos=b,!0},backUp:function(a){this.pos-=a},column:function(){return L(this.string,this.start,this.tabSize)},indentation:function(){return L(this.string,null,this.tabSize)},match:function(a,b,c){if(typeof a!="string"){var e=this.string.slice(this.pos).match(a);return e&&b!==!1&&(this.pos+=e[0].length),e}function d(a){return c?a.toLowerCase():a}if(d(this.string).indexOf(d(a),this.pos)==this.pos)return b!==!1&&(this.pos+=a.length),!0},current:function(){return this.string.slice(this.start,this.pos)}},a.StringStream=l,m.prototype={attach:function(a){this.set.push(a)},detach:function(a){var b=W(this.set,a);b>-1&&this.set.splice(b,1)},split:function(a,b){if(this.to<=a&&this.to!=null)return null;var c=this.from<a||this.from==null?null:this.from-a+b,d=this.to==null?null:this.to-a+b;return new m(c,d,this.style,this.set)},dup:function(){return new m(null,null,this.style,this.set)},clipTo:function(a,b,c,d,e){this.from!=null&&this.from>=b&&(this.from=Math.max(d,this.from)+e),this.to!=null&&this.to>b&&(this.to=d<this.to?this.to+e:b),a&&d>this.from&&(d<this.to||this.to==null)&&(this.from=null),c&&(b<this.to||this.to==null)&&(b>this.from||this.from==null)&&(this.to=null)},isDead:function(){return this.from!=null&&this.to!=null&&this.from>=this.to},sameSet:function(a){return this.set==a.set}},n.prototype={attach:function(a){this.line=a},detach:function(a){this.line==a&&(this.line=null)},split:function(a,b){if(a<this.from)return this.from=this.to=this.from-a+b,this},isDead:function(){return this.from>this.to},clipTo:function(a,b,c,d,e){(a||b<this.from)&&(c||d>this.to)?(this.from=0,this.to=-1):this.from>b&&(this.from=this.to=Math.max(d,this.from)+e)},sameSet:function(a){return!1},find:function(){return!this.line||!this.line.parent?null:{line:t(this.line),ch:this.from}},clear:function(){if(this.line){var a=W(this.line.marked,this);a!=-1&&this.line.marked.splice(a,1),this.line=null}}},o.inheritMarks=function(a,b){var c=new o(a),d=b.marked;if(d)for(var e=0;e<d.length;++e)if(d[e].to==null&&d[e].style){var f=c.marked||(c.marked=[]),g=d[e],h=g.dup();f.push(h),h.attach(c)}return c},o.prototype={replace:function(a,b,c){!a&&(b==null||b==this.text.length)&&(this.className=this.gutterMarker=null);var d=[],e=this.marked,f=b==null?this.text.length:b;p(0,a,this.styles,d),c&&d.push(c,null),p(f,this.text.length,this.styles,d),this.styles=d,this.text=this.text.slice(0,a)+c+this.text.slice(f),this.stateAfter=null;if(e){var g=c.length-(f-a);for(var h=0,i=e[h];h<e.length;++h)i.clipTo(a==null,a||0,b==null,f,g),i.isDead()&&(i.detach(this),e.splice(h--,1))}},split:function(a,b){var c=[b,null],d=this.marked;p(a,this.text.length,this.styles,c);var e=new o(b+this.text.slice(a),c);if(d)for(var f=0;f<d.length;++f){var g=d[f],h=g.split(a,b.length);h&&(e.marked||(e.marked=[]),e.marked.push(h),h.attach(e))}return e},append:function(a){var b=this.text.length,c=a.marked,d=this.marked;this.text+=a.text,p(0,a.text.length,a.styles,this.styles);if(d)for(var e=0;e<d.length;++e)d[e].to==null&&(d[e].to=b);if(c&&c.length){d||(this.marked=d=[]);f:for(var e=0;e<c.length;++e){var g=c[e];if(!g.from)for(var h=0;h<d.length;++h){var i=d[h];if(i.to==b&&i.sameSet(g)){i.to=g.to==null?null:g.to+b,i.isDead()&&(i.detach(this),c.splice(e--,1));continue f}}d.push(g),g.attach(this),g.from+=b,g.to!=null&&(g.to+=b)}}},fixMarkEnds:function(a){var b=this.marked,c=a.marked;if(!b)return;for(var d=0;d<b.length;++d){var e=b[d],f=e.to==null;if(f&&c)for(var g=0;g<c.length;++g)if(c[g].sameSet(e)){f=!1;break}f&&(e.to=this.text.length)}},addMark:function(a){a.attach(this),this.marked==null&&(this.marked=[]),this.marked.push(a),this.marked.sort(function(a,b){return(a.from||0)-(b.from||0)})},highlight:function(a,b,c){var d=new l(this.text,c),e=this.styles,f=0,g=!1,h=e[0],i;this.text==""&&a.blankLine&&a.blankLine(b);while(!d.eol()){var j=a.token(d,b),k=this.text.slice(d.start,d.pos);d.start=d.pos,f&&e[f-1]==j?e[f-2]+=k:k&&(!g&&(e[f+1]!=j||f&&e[f-2]!=i)&&(g=!0),e[f++]=k,e[f++]=j,i=h,h=e[f]);if(d.pos>5e3){e[f++]=this.text.slice(d.pos),e[f++]=null;break}}return e.length!=f&&(e.length=f,g=!0),f&&e[f-2]!=i&&(g=!0),g||(e.length<5&&this.text.length<10?null:!1)},getTokenAt:function(a,b,c){var d=this.text,e=new l(d);while(e.pos<c&&!e.eol()){e.start=e.pos;var f=a.token(e,b)}return{start:e.start,end:e.pos,string:e.current(),className:f||null,state:b}},indentation:function(a){return L(this.text,null,a)},getHTML:function(a,b,c,d,e){function h(a,b){if(!a)return;g&&I&&a.charAt(0)==" "&&(a="\u00a0"+a.slice(1)),g=!1,b?f.push('<span class="',b,'">',T(a).replace(/\t/g,d),"</span>"):f.push(T(a).replace(/\t/g,d))}var f=[],g=!0;c&&f.push(this.className?'<pre class="'+this.className+'">':"<pre>");var i=this.styles,j=this.text,k=this.marked;a==b&&(a=null);var l=j.length;e!=null&&(l=Math.min(e,l));if(!j&&e==null)h(" ",a!=null&&b==null?"CodeMirror-selected":null);else if(!k&&a==null)for(var m=0,n=0;n<l;m+=2){var o=i[m],p=i[m+1],q=o.length;n+q>l&&(o=o.slice(0,l-n)),n+=q,h(o,p&&"cm-"+p)}else{var r=0,m=0,s="",p,t=0,u=-1,v=null;function w(){k&&(u+=1,v=u<k.length?k[u]:null)}w();while(r<l){var x=l,y="";if(a!=null)if(a>r)x=a;else if(b==null||b>r)y=" CodeMirror-selected",b!=null&&(x=Math.min(x,b));while(v&&v.to!=null&&v.to<=r)w();v&&(v.from>r?x=Math.min(x,v.from):(y+=" "+v.style,v.to!=null&&(x=Math.min(x,v.to))));for(;;){var z=r+s.length,A=p;y&&(A=p?p+y:y),h(z>x?s.slice(0,x-r):s,A);if(z>=x){s=s.slice(x-r),r=x;break}r=z,s=i[m++],p="cm-"+i[m++]}}a!=null&&b==null&&h(" ","CodeMirror-selected")}return c&&f.push("</pre>"),f.join("")},cleanUp:function(){this.parent=null;if(this.marked)for(var a=0,b=this.marked.length;a<b;++a)this.marked[a].detach(this)}},q.prototype={chunkSize:function(){return this.lines.length},remove:function(a,b){for(var c=a,d=a+b;c<d;++c){var e=this.lines[c];e.cleanUp(),this.height-=e.height}this.lines.splice(a,b)},collapse:function(a){a.splice.apply(a,[a.length,0].concat(this.lines))},insertHeight:function(a,b,c){this.height+=c,this.lines.splice.apply(this.lines,[a,0].concat(b));for(var d=0,e=b.length;d<e;++d)b[d].parent=this},iterN:function(a,b,c){for(var d=a+b;a<d;++a)if(c(this.lines[a]))return!0}},r.prototype={chunkSize:function(){return this.size},remove:function(a,b){this.size-=b;for(var c=0;c<this.children.length;++c){var d=this.children[c],e=d.chunkSize();if(a<e){var f=Math.min(b,e-a),g=d.height;d.remove(a,f),this.height-=g-d.height,e==f&&(this.children.splice(c--,1),d.parent=null);if((b-=f)==0)break;a=0}else a-=e}if(this.size-b<25){var h=[];this.collapse(h),this.children=[new q(h)]}},collapse:function(a){for(var b=0,c=this.children.length;b<c;++b)this.children[b].collapse(a)},insert:function(a,b){var c=0;for(var d=0,e=b.length;d<e;++d)c+=b[d].height;this.insertHeight(a,b,c)},insertHeight:function(a,b,c){this.size+=b.length,this.height+=c;for(var d=0,e=this.children.length;d<e;++d){var f=this.children[d],g=f.chunkSize();if(a<=g){f.insertHeight(a,b,c);if(f.lines&&f.lines.length>50){while(f.lines.length>50){var h=f.lines.splice(f.lines.length-25,25),i=new q(h);f.height-=i.height,this.children.splice(d+1,0,i),i.parent=this}this.maybeSpill()}break}a-=g}},maybeSpill:function(){if(this.children.length<=10)return;var a=this;do{var b=a.children.splice(a.children.length-5,5),c=new r(b);if(!a.parent){var d=new r(a.children);d.parent=a,a.children=[d,c],a=d}else{a.size-=c.size,a.height-=c.height;var e=W(a.parent.children,a);a.parent.children.splice(e+1,0,c)}c.parent=a.parent}while(a.children.length>10);a.parent.maybeSpill()},iter:function(a,b,c){this.iterN(a,b-a,c)},iterN:function(a,b,c){for(var d=0,e=this.children.length;d<e;++d){var f=this.children[d],g=f.chunkSize();if(a<g){var h=Math.min(b,g-a);if(f.iterN(a,h,c))return!0;if((b-=h)==0)break;a=0}else a-=g}}},w.prototype={addChange:function(a,b,c){this.undone.length=0;var d=+(new Date),e=this.done[this.done.length-1];if(d-this.time>400||!e||e.start>a+b||e.start+e.added<a-e.added+e.old.length)this.done.push({start:a,added:b,old:c});else{var f=0;if(a<e.start){for(var g=e.start-a-1;g>=0;--g)e.old.unshift(c[g]);e.added+=e.start-a,e.start=a}else e.start<a&&(f=a-e.start,b+=f);for(var g=e.added-f,h=c.length;g<h;++g)e.old.push(c[g]);e.added<b&&(e.added=b)}this.time=d}},a.e_stop=B,a.e_preventDefault=z,a.e_stopPropagation=A,a.connect=E,F.prototype={set:function(a,b){clearTimeout(this.id),this.id=setTimeout(b,a)}};var G=function(){if(/MSIE [1-8]\b/.test(navigator.userAgent))return!1;var a=document.createElement("div");return"draggable"in a}(),H=/gecko\/\d{7}/i.test(navigator.userAgent),I=/MSIE \d/.test(navigator.userAgent),J=/WebKit\//.test(navigator.userAgent),K="\n";(function(){var a=document.createElement("textarea");a.value="foo\nbar",a.value.indexOf("\r")>-1&&(K="\r\n")})(),document.documentElement.getBoundingClientRect!=null&&(N=function(a,b){try{var c=a.getBoundingClientRect();c={top:c.top,left:c.left}}catch(d){c={top:0,left:0}}if(!b)if(window.pageYOffset==null){var e=document.documentElement||document.body.parentNode;e.scrollTop==null&&(e=document.body),c.top+=e.scrollTop,c.left+=e.scrollLeft}else c.top+=window.pageYOffset,c.left+=window.pageXOffset;return c});var S=document.createElement("pre"),U=T("\t")!="\t";a.htmlEscape=T;var X="\n\nb".split(/\n/).length!=3?function(a){var b=0,c,d=[];while((c=a.indexOf("\n",b))>-1)d.push(a.slice(b,a.charAt(c-1)=="\r"?c-1:c)),b=c+1;return d.push(a.slice(b)),d}:function(a){return a.split(/\r?\n/)};a.splitLines=X;var Y=window.getSelection?function(a){try{return a.selectionStart!=a.selectionEnd}catch(b){return!1}}:function(a){try{var b=a.ownerDocument.selection.createRange()}catch(c){}return!b||b.parentElement()!=a?!1:b.compareEndPoints("StartToEnd",b)!=0};a.defineMode("null",function(){return{token:function(a){a.skipToEnd()}}}),a.defineMIME("text/plain","null");var Z={3:"Enter",8:"Backspace",9:"Tab",13:"Enter",16:"Shift",17:"Ctrl",18:"Alt",19:"Pause",20:"CapsLock",27:"Esc",32:"Space",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"Left",38:"Up",39:"Right",40:"Down",44:"PrintScrn",45:"Insert",46:"Delete",59:";",91:"Win",92:"Win",93:"Select",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'",63276:"PageUp",63277:"PageDown",63275:"End",63273:"Home",63234:"Left",63232:"Up",63235:"Right",63233:"Down",63302:"Insert",63272:"Delete"};return a.keyNames=Z,function(){for(var a=0;a<10;a++)Z[a+48]=String(a);for(var a=65;a<=90;a++)Z[a]=String.fromCharCode(a);for(var a=1;a<=12;a++)Z[a+111]=Z[a+63235]="F"+a}(),a}();CodeMirror.overlayParser=function(a,b,c){return{startState:function(){return{base:CodeMirror.startState(a),overlay:CodeMirror.startState(b),basePos:0,baseCur:null,overlayPos:0,overlayCur:null}},copyState:function(c){return{base:CodeMirror.copyState(a,c.base),overlay:CodeMirror.copyState(b,c.overlay),basePos:c.basePos,baseCur:null,overlayPos:c.overlayPos,overlayCur:null}},token:function(d,e){return d.start==e.basePos&&(e.baseCur=a.token(d,e.base),e.basePos=d.pos),d.start==e.overlayPos&&(d.pos=d.start,e.overlayCur=b.token(d,e.overlay),e.overlayPos=d.pos),d.pos=Math.min(e.basePos,e.overlayPos),d.eol()&&(e.basePos=e.overlayPos=0),e.overlayCur==null?e.baseCur:e.baseCur!=null&&c?e.baseCur+" "+e.overlayCur:e.overlayCur},indent:function(b,c){return a.indent(b.base,c)},electricChars:a.electricChars}},CodeMirror.runMode=function(a,b,c){var d=CodeMirror.getMode({indentUnit:2},b),e=c.nodeType==1;if(e){var f=c,g=[];c=function(a,b){a=="\n"?g.push("<br>"):b?g.push('<span class="cm-'+CodeMirror.htmlEscape(b)+'">'+CodeMirror.htmlEscape(a)+"</span>"):g.push(CodeMirror.htmlEscape(a))}}var h=CodeMirror.splitLines(a),i=CodeMirror.startState(d);for(var j=0,k=h.length;j<k;++j){j&&c("\n");var l=new CodeMirror.StringStream(h[j]);while(!l.eol()){var m=d.token(l,i);c(l.current(),m,j,l.start),l.start=l.pos}}e&&(f.innerHTML=g.join(""))},function(){CodeMirror.simpleHint=function(a,b){function e(b){a.replaceRange(b,c.from,c.to)}function l(){if(k)return;k=!0,f.parentNode.removeChild(f)}function m(){e(d[g.selectedIndex]),l(),setTimeout(function(){a.focus()},50)}if(a.somethingSelected())return;var c=b(a);if(!c||!c.list.length)return;var d=c.list;if(d.length==1)return e(d[0]),!0;var f=document.createElement("div");f.className="CodeMirror-completions";var g=f.appendChild(document.createElement("select"));window.opera||(g.multiple=!0);for(var h=0;h<d.length;++h){var i=g.appendChild(document.createElement("option"));i.appendChild(document.createTextNode(d[h]))}g.firstChild.selected=!0,g.size=Math.min(10,d.length);var j=a.cursorCoords();f.style.left=j.x+"px",f.style.top=j.yBot+"px",document.body.appendChild(f),d.length<=10&&(f.style.width=g.clientWidth-1+"px");var k=!1;return CodeMirror.connect(g,"blur",l),CodeMirror.connect(g,"keydown",function(c){var d=c.keyCode;d==13?(CodeMirror.e_stop(c),m()):d==27?(CodeMirror.e_stop(c),l(),a.focus()):d!=38&&d!=40&&(l(),a.focus(),setTimeout(function(){CodeMirror.simpleHint(a,b)},50))}),CodeMirror.connect(g,"dblclick",m),g.focus(),window.opera&&setTimeout(function(){k||g.focus()},100),!0}}(),function(){function a(a,b){for(var c=0,d=a.length;c<d;++c)b(a[c])}function b(a,b){if(!Array.prototype.indexOf){var c=a.length;while(c--)if(a[c]===b)return!0;return!1}return a.indexOf(b)!=-1}function g(g,h){function k(a){a.indexOf(j)==0&&!b(i,a)&&i.push(a)}function l(b){typeof b=="string"?a(c,k):b instanceof Array?a(d,k):b instanceof Function&&a(e,k);for(var f in b)k(f)}var i=[],j=g.string;if(h){var m=h.pop(),n;m.className=="variable"?n=window[m.string]:m.className=="string"?n="":m.className=="atom"&&(n=1);while(n!=null&&h.length)n=n[h.pop().string];n!=null&&l(n)}else{for(var o=g.state.localVars;o;o=o.next)k(o.name);l(window),a(f,k)}return i}CodeMirror.javascriptHint=function(a){var b=a.getCursor(),c=a.getTokenAt(b),d=c;/^[\w$_]*$/.test(c.string)||(c=d={start:b.ch,end:b.ch,string:"",state:c.state,className:c.string=="."?"property":null});while(d.className=="property"){d=a.getTokenAt({line:b.line,ch:d.start});if(d.string!=".")return;d=a.getTokenAt({line:b.line,ch:d.start});if(!e)var e=[];e.push(d)}return{list:g(c,e),from:{line:b.line,ch:c.start},to:{line:b.line,ch:c.end}}};var c="charAt charCodeAt indexOf lastIndexOf substring substr slice trim trimLeft trimRight toUpperCase toLowerCase split concat match replace search".split(" "),d="length concat join splice push pop shift unshift slice reverse sort indexOf lastIndexOf every some filter forEach map reduce reduceRight ".split(" "),e="prototype apply call bind".split(" "),f="break case catch continue debugger default delete do else false finally for function if in instanceof new null return switch throw true try typeof var void while with".split(" ")}(),CodeMirror.defineMode("clike",function(a,b){function k(a,b){var c=a.next();if(g[c]){var h=g[c](a,b);if(h!==!1)return h}if(c=='"'||c=="'")return b.tokenize=l(c),b.tokenize(a,b);if(/[\[\]{}\(\),;\:\.]/.test(c))return j=c,null;if(/\d/.test(c))return a.eatWhile(/[\w\.]/),"number";if(c=="/"){if(a.eat("*"))return b.tokenize=m,m(a,b);if(a.eat("/"))return a.skipToEnd(),"comment"}if(i.test(c))return a.eatWhile(i),"operator";a.eatWhile(/[\w\$_]/);var k=a.current();return d.propertyIsEnumerable(k)?(e.propertyIsEnumerable(k)&&(j="newstatement"),"keyword"):f.propertyIsEnumerable(k)?"atom":"word"}function l(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d&&!h)c.tokenize=k;return"string"}}function m(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=k;break}c=d=="*"}return"comment"}function n(a,b,c,d,e){this.indented=a,this.column=b,this.type=c,this.align=d,this.prev=e}function o(a,b,c){return a.context=new n(a.indented,b,c,null,a.context)}function p(a){var b=a.context.type;if(b==")"||b=="]"||b=="}")a.indented=a.context.indented;return a.context=a.context.prev}var c=a.indentUnit,d=b.keywords||{},e=b.blockKeywords||{},f=b.atoms||{},g=b.hooks||{},h=b.multiLineStrings,i=/[+\-*&%=<>!?|\/]/,j;return{startState:function(a){return{tokenize:null,context:new n((a||0)-c,0,"top",!1),indented:0,startOfLine:!0}},token:function(a,b){var c=b.context;a.sol()&&(c.align==null&&(c.align=!1),b.indented=a.indentation(),b.startOfLine=!0);if(a.eatSpace())return null;j=null;var d=(b.tokenize||k)(a,b);if(d=="comment"||d=="meta")return d;c.align==null&&(c.align=!0);if(j!=";"&&j!=":"||c.type!="statement")if(j=="{")o(b,a.column(),"}");else if(j=="[")o(b,a.column(),"]");else if(j=="(")o(b,a.column(),")");else if(j=="}"){while(c.type=="statement")c=p(b);c.type=="}"&&(c=p(b));while(c.type=="statement")c=p(b)}else j==c.type?p(b):(c.type=="}"||c.type=="top"||c.type=="statement"&&j=="newstatement")&&o(b,a.column(),"statement");else p(b);return b.startOfLine=!1,d},indent:function(a,b){if(a.tokenize!=k&&a.tokenize!=null)return 0;var d=b&&b.charAt(0),e=a.context,f=d==e.type;return e.type=="statement"?e.indented+(d=="{"?0:c):e.align?e.column+(f?0:1):e.indented+(f?0:c)},electricChars:"{}"}}),function(){function a(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function c(a,b){return b.startOfLine?(a.skipToEnd(),"meta"):!1}function d(a,b){var c;while((c=a.next())!=null)if(c=='"'&&!a.eat('"')){b.tokenize=null;break}return"string"}var b="auto if break int case long char register continue return default short do sizeof double static else struct entry switch extern typedef float union for unsigned goto while enum void const signed volatile";CodeMirror.defineMIME("text/x-csrc",{name:"clike",keywords:a(b),blockKeywords:a("case do else for if switch while struct"),atoms:a("null"),hooks:{"#":c}}),CodeMirror.defineMIME("text/x-c++src",{name:"clike",keywords:a(b+" asm dynamic_cast namespace reinterpret_cast try bool explicit new "+"static_cast typeid catch operator template typename class friend private "+"this using const_cast inline public throw virtual delete mutable protected "+"wchar_t"),blockKeywords:a("catch class do else finally for if struct switch try while"),atoms:a("true false null"),hooks:{"#":c}}),CodeMirror.defineMIME("text/x-java",{name:"clike",keywords:a("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while"),blockKeywords:a("catch class do else finally for if switch try while"),atoms:a("true false null"),hooks:{"@":function(a,b){return a.eatWhile(/[\w\$_]/),"meta"}}}),CodeMirror.defineMIME("text/x-csharp",{name:"clike",keywords:a("abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unsafe ushort using virtual void volatile while add alias ascending descending dynamic from get global group into join let orderby partial remove select set value var yield"),blockKeywords:a("catch class do else finally for foreach if struct switch try while"),atoms:a("true false null"),hooks:{"@":function(a,b){return a.eat('"')?(b.tokenize=d,d(a,b)):(a.eatWhile(/[\w\$_]/),"meta")}}}),CodeMirror.defineMIME("text/x-groovy",{name:"clike",keywords:a("abstract as assert boolean break byte case catch char class const continue def default do double else enum extends final finally float for goto if implements import in instanceof int interface long native new package property private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while"),atoms:a("true false null"),hooks:{"@":function(a,b){return a.eatWhile(/[\w\$_]/),"meta"}}})}(),CodeMirror.defineMode("clojure",function(a,b){function m(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function r(a,b,c){this.indent=a,this.type=b,this.prev=c}function s(a,b,c){a.indentStack=new r(b,c,a.indentStack)}function t(a){a.indentStack=a.indentStack.prev}function u(a,b){if(a==="0"&&"x"==b.peek().toLowerCase())return b.eat("x"),b.eatWhile(q.hex),!0;if(a=="+"||a=="-")b.eat(q.sign),a=b.next();return q.digit.test(a)?(b.eat(a),b.eatWhile(q.digit),"."==b.peek()&&(b.eat("."),b.eatWhile(q.digit)),"e"==b.peek().toLowerCase()&&(b.eat(q.exponent),b.eat(q.sign),b.eatWhile(q.digit)),!0):!1}var c="builtin",d="comment",e="string",f="tag",g="atom",h="number",i="bracket",j="keyword",k=2,l=1,n=m("true false nil"),o=m("defn defn- def def- defonce defmulti defmethod defmacro defstruct deftype defprotocol defrecord deftest slice defalias defhinted defmacro- defn-memo defnk defnk defonce- defunbound defunbound- defvar defvar- let letfn do case cond condp for loop recur when when-not when-let when-first if if-let if-not . .. -> ->> doto and or dosync doseq dotimes dorun doall load import unimport ns in-ns refer try catch finally throw with-open with-local-vars binding gen-class gen-and-load-class gen-and-save-class handler-case handle* *1 *2 *3 *agent* *allow-unresolved-vars* *assert *clojure-version* *command-line-args* *compile-files* *compile-path* *e *err* *file* *flush-on-newline* *in* *macro-meta* *math-context* *ns* *out* *print-dup* *print-length* *print-level* *print-meta* *print-readably* *read-eval* *source-path* *use-context-classloader* *warn-on-reflection* + - / < <= = == > >= accessor aclone agent agent-errors aget alength alias all-ns alter alter-meta! alter-var-root amap ancestors and apply areduce array-map aset aset-boolean aset-byte aset-char aset-double aset-float aset-int aset-long aset-short assert assoc assoc! assoc-in associative? atom await await-for await1 bases bean bigdec bigint binding bit-and bit-and-not bit-clear bit-flip bit-not bit-or bit-set bit-shift-left bit-shift-right bit-test bit-xor boolean boolean-array booleans bound-fn bound-fn* butlast byte byte-array bytes case cast char char-array char-escape-string char-name-string char? chars chunk chunk-append chunk-buffer chunk-cons chunk-first chunk-next chunk-rest chunked-seq? class class? clear-agent-errors clojure-version coll? comment commute comp comparator compare compare-and-set! compile complement concat cond condp conj conj! cons constantly construct-proxy contains? count counted? create-ns create-struct cycle dec decimal? declare definline defmacro defmethod defmulti defn defn- defonce defstruct delay delay? deliver deref derive descendants destructure disj disj! dissoc dissoc! distinct distinct? doall doc dorun doseq dosync dotimes doto double double-array doubles drop drop-last drop-while empty empty? ensure enumeration-seq eval even? every? extend extend-protocol extend-type extends? extenders false? ffirst file-seq filter find find-doc find-ns find-var first float float-array float? floats flush fn fn? fnext for force format future future-call future-cancel future-cancelled? future-done? future? gen-class gen-interface gensym get get-in get-method get-proxy-class get-thread-bindings get-validator hash hash-map hash-set identical? identity if-let if-not ifn? import in-ns inc init-proxy instance? int int-array integer? interleave intern interpose into into-array ints io! isa? iterate iterator-seq juxt key keys keyword keyword? last lazy-cat lazy-seq let letfn line-seq list list* list? load load-file load-reader load-string loaded-libs locking long long-array longs loop macroexpand macroexpand-1 make-array make-hierarchy map map? mapcat max max-key memfn memoize merge merge-with meta method-sig methods min min-key mod name namespace neg? newline next nfirst nil? nnext not not-any? not-empty not-every? not= ns ns-aliases ns-imports ns-interns ns-map ns-name ns-publics ns-refers ns-resolve ns-unalias ns-unmap nth nthnext num number? odd? or parents partial partition pcalls peek persistent! pmap pop pop! pop-thread-bindings pos? pr pr-str prefer-method prefers primitives-classnames print print-ctor print-doc print-dup print-method print-namespace-doc print-simple print-special-doc print-str printf println println-str prn prn-str promise proxy proxy-call-with-super proxy-mappings proxy-name proxy-super push-thread-bindings pvalues quot rand rand-int range ratio? rational? rationalize re-find re-groups re-matcher re-matches re-pattern re-seq read read-line read-string reify reduce ref ref-history-count ref-max-history ref-min-history ref-set refer refer-clojure release-pending-sends rem remove remove-method remove-ns repeat repeatedly replace replicate require reset! reset-meta! resolve rest resultset-seq reverse reversible? rseq rsubseq satisfies? second select-keys send send-off seq seq? seque sequence sequential? set set-validator! set? short short-array shorts shutdown-agents slurp some sort sort-by sorted-map sorted-map-by sorted-set sorted-set-by sorted? special-form-anchor special-symbol? split-at split-with str stream? string? struct struct-map subs subseq subvec supers swap! symbol symbol? sync syntax-symbol-anchor take take-last take-nth take-while test the-ns time to-array to-array-2d trampoline transient tree-seq true? type unchecked-add unchecked-dec unchecked-divide unchecked-inc unchecked-multiply unchecked-negate unchecked-remainder unchecked-subtract underive unquote unquote-splicing update-in update-proxy use val vals var-get var-set var? vary-meta vec vector vector? when when-first when-let when-not while with-bindings with-bindings* with-in-str with-loading-context with-local-vars with-meta with-open with-out-str with-precision xml-seq"),p=m("ns fn def defn defmethod bound-fn if if-not case condp when while when-not when-first do future comment doto locking proxy with-open with-precision reify deftype defrecord defprotocol extend extend-protocol extend-type try catchlet letfn binding loop for doseq dotimes when-let if-letdefstruct struct-map assoctesting deftesthandler-case handle dotrace deftrace"),q={digit:/\d/,digit_or_colon:/[\d:]/,hex:/[0-9a-fA-F]/,sign:/[+-]/,exponent:/[eE]/,keyword_char:/[^\s\(\[\;\)\]]/,basic:/[\w\$_\-]/,lang_keyword:/[\w*+!\-_?:\/]/};return{startState:function(){return{indentStack:null,indentation:0,mode:!1}},token:function(a,b){b.indentStack==null&&a.sol()&&(b.indentation=a.indentation());if(a.eatSpace())return null;var j=null;switch(b.mode){case"string":var l,m=!1;while((l=a.next())!=null){if(l=='"'&&!m){b.mode=!1;break}m=!m&&l=="\\"}j=e;break;default:var r=a.next();if(r=='"')b.mode="string",j=e;else if(r=="'"&&!q.digit_or_colon.test(a.peek()))j=g;else if(r==";")a.skipToEnd(),j=d;else if(u(r,a))j=h;else if(r=="("||r=="["){var v="",w=a.column();while((letter=a.eat(q.keyword_char))!=null)v+=letter;v.length>0&&p.propertyIsEnumerable(v)?s(b,w+k,r):(a.eatSpace(),a.eol()||a.peek()==";"?s(b,w+1,r):s(b,w+a.current().length,r)),a.backUp(a.current().length-1),j=i}else if(r==")"||r=="]")j=i,b.indentStack!=null&&b.indentStack.type==(r==")"?"(":"[")&&t(b);else{if(r==":")return a.eatWhile(q.lang_keyword),f;a.eatWhile(q.basic),o&&o.propertyIsEnumerable(a.current())?j=c:n&&n.propertyIsEnumerable(a.current())?j=g:j=null}}return j},indent:function(a,b){return a.indentStack==null?a.indentation:a.indentStack.indent}}}),CodeMirror.defineMIME("text/x-clojure","clojure"),CodeMirror.defineMode("coffeescript",function(a){function c(a){return new RegExp("^(("+a.join(")|(")+"))\\b")}function r(a,c){if(a.sol()){var k=c.scopes[0].offset;if(a.eatSpace()){var l=a.indentation();return l>k?"indent":l<k?"dedent":null}k>0&&u(a,c)}if(a.eatSpace())return null;var p=a.peek();if(p==="#")return a.skipToEnd(),"comment";if(a.match(/^-?[0-9\.]/,!1)){var r=!1;a.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)&&(r=!0),a.match(/^-?\d+\.\d*/)&&(r=!0),a.match(/^-?\.\d+/)&&(r=!0);if(r)return"number";var t=!1;a.match(/^-?0x[0-9a-f]+/i)&&(t=!0),a.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)&&(t=!0),a.match(/^-?0(?![\dx])/i)&&(t=!0);if(t)return"number"}if(a.match(n))return c.tokenize=s(a.current(),"string"),c.tokenize(a,c);if(a.match(o)){if(a.current()!="/"||a.match(/^.*\//,!1))return c.tokenize=s(a.current(),"string-2"),c.tokenize(a,c);a.backUp(1)}return a.match(h)||a.match(g)?"punctuation":a.match(f)||a.match(d)||a.match(j)?"operator":a.match(e)?"punctuation":a.match(q)?"atom":a.match(m)?"keyword":a.match(i)?"variable":(a.next(),b)}function s(c,d){var e=new RegExp(c),f=c.length==1;return function g(c,g){while(!c.eol()){c.eatWhile(/[^'"\/\\]/);if(c.eat("\\")){c.next();if(f&&c.eol())return d}else{if(c.match(e))return g.tokenize=r,d;c.eat(/['"\/]/)}}return f&&(a.mode.singleLineStringErrors?d=b:g.tokenize=r),d}}function t(b,c,d){d=d||"coffee";var e=0;if(d==="coffee"){for(var f=0;f<c.scopes.length;f++)if(c.scopes[f].type==="coffee"){e=c.scopes[f].offset+a.indentUnit;break}}else e=b.column()+b.current().length;c.scopes.unshift({offset:e,type:d})}function u(a,b){if(b.scopes.length==1)return;if(b.scopes[0].type==="coffee"){var c=a.indentation(),d=-1;for(var e=0;e<b.scopes.length;++e)if(c===b.scopes[e].offset){d=e;break}if(d===-1)return!0;while(b.scopes[0].offset!==c)b.scopes.shift();return!1}return b.scopes.shift(),!1}function v(a,c){var d=c.tokenize(a,c),e=a.current();if(e===".")return d=c.tokenize(a,c),e=a.current(),d==="variable"?"variable":b;if(e==="@")return d=c.tokenize(a,c),e=a.current(),d==="variable"?"variable-2":b;e==="return"&&(c.dedent+=1),((e==="->"||e==="=>")&&!c.lambda&&c.scopes[0].type=="coffee"&&a.peek()===""||d==="indent")&&t(a,c);var f="[({".indexOf(e);return f!==-1&&t(a,c,"])}".slice(f,f+1)),k.exec(e)&&t(a,c),e=="then"&&u(a,c),d==="dedent"&&u(a,c)?b:(f="])}".indexOf(e),f!==-1&&u(a,c)?b:(c.dedent>0&&a.eol()&&c.scopes[0].type=="coffee"&&(c.scopes.length>1&&c.scopes.shift(),c.dedent-=1),d))}var b="error",d=new RegExp("^[\\+\\-\\*/%&|\\^~<>!?]"),e=new RegExp("^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]"),f=new RegExp("^((->)|(=>)|(\\+\\+)|(\\+\\=)|(\\-\\-)|(\\-\\=)|(\\*\\*)|(\\*\\=)|(\\/\\/)|(\\/\\=)|(==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//))"),g=new RegExp("^((\\.\\.)|(\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))"),h=new RegExp("^((\\.\\.\\.)|(//=)|(>>=)|(<<=)|(\\*\\*=))"),i=new RegExp("^[_A-Za-z][_A-Za-z0-9]*"),j=c(["and","or","not","is","isnt","in","instanceof","typeof"]),k=["for","while","loop","if","unless","else","switch","try","catch","finally","class"],l=["break","by","continue","debugger","delete","do","in","of","new","return","then","this","throw","when","until"],m=c(k.concat(l));k=c(k);var n=new RegExp("^('{3}|\"{3}|['\"])"),o=new RegExp("^(/{3}|/)"),p=["Infinity","NaN","undefined","null","true","false","on","off","yes","no"],q=c(p),w={startState:function(a){return{tokenize:r,scopes:[{offset:a||0,type:"coffee"}],lastToken:null,lambda:!1,dedent:0}},token:function(a,b){var c=v(a,b);return b.lastToken={style:c,content:a.current()},a.eol()&&a.lambda&&(b.lambda=!1),c},indent:function(a,b){return a.tokenize!=r?0:a.scopes[0].offset}};return w}),CodeMirror.defineMIME("text/x-coffeescript","coffeescript"),CodeMirror.defineMode("css",function(a){function d(a,b){return c=b,a}function e(a,b){var c=a.next();if(c=="@")return a.eatWhile(/[\w\\\-]/),d("meta",a.current());if(c=="/"&&a.eat("*"))return b.tokenize=f,f(a,b);if(c=="<"&&a.eat("!"))return b.tokenize=g,g(a,b);if(c=="=")d(null,"compare");else return c!="~"&&c!="|"||!a.eat("=")?c=='"'||c=="'"?(b.tokenize=h(c),b.tokenize(a,b)):c=="#"?(a.eatWhile(/[\w\\\-]/),d("atom","hash")):c=="!"?(a.match(/^\s*\w*/),d("keyword","important")):/\d/.test(c)?(a.eatWhile(/[\w.%]/),d("number","unit")):/[,.+>*\/]/.test(c)?d(null,"select-op"):/[;{}:\[\]]/.test(c)?d(null,c):(a.eatWhile(/[\w\\\-]/),d("variable","variable")):d(null,"compare")}function f(a,b){var c=!1,f;while((f=a.next())!=null){if(c&&f=="/"){b.tokenize=e;break}c=f=="*"}return d("comment","comment")}function g(a,b){var c=0,f;while((f=a.next())!=null){if(c>=2&&f==">"){b.tokenize=e;break}c=f=="-"?c+1:0}return d("comment","comment")}function h(a){return function(b,c){var f=!1,g;while((g=b.next())!=null){if(g==a&&!f)break;f=!f&&g=="\\"}return f||(c.tokenize=e),d("string","string")}}var b=a.indentUnit,c;return{startState:function(a){return{tokenize:e,baseIndent:a||0,stack:[]}},token:function(a,b){if(a.eatSpace())return null;var d=b.tokenize(a,b),e=b.stack[b.stack.length-1];if(c=="hash"&&e=="rule")d="atom";else if(d=="variable")if(e=="rule")d="number";else if(!e||e=="@media{")d="tag";return e=="rule"&&/^[\{\};]$/.test(c)&&b.stack.pop(),c=="{"?e=="@media"?b.stack[b.stack.length-1]="@media{":b.stack.push("{"):c=="}"?b.stack.pop():c=="@media"?b.stack.push("@media"):e=="{"&&c!="comment"&&b.stack.push("rule"),d},indent:function(a,c){var d=a.stack.length;return/^\}/.test(c)&&(d-=a.stack[a.stack.length-1]=="rule"?2:1),a.baseIndent+d*b},electricChars:"}"}}),CodeMirror.defineMIME("text/css","css"),CodeMirror.defineMode("diff",function(){return{token:function(a){var b=a.next();a.skipToEnd();if(b=="+")return"plus";if(b=="-")return"minus";if(b=="@")return"rangeinfo"}}}),CodeMirror.defineMIME("text/x-diff","diff"),CodeMirror.defineMode("gfm",function(a,b){function f(a,b){return a.sol()&&a.match(/^```([\w+#]*)/)?(b.localMode=e(RegExp.$1),b.localMode&&(b.localState=b.localMode.startState()),b.token=g,"code"):c.token(a,b.mdState)}function g(a,b){return a.sol()&&a.match(/^```/)?(b.localMode=b.localState=null,b.token=f,"code"):b.localMode?b.localMode.token(a,b.localState):(a.skipToEnd(),"code")}function h(a,b){var d;if(a.match(/^\w+:\/\/\S+/))return"linkhref";if(a.match(/^[^\[*\\<>` _][^\[*\\<>` ]*[^\[*\\<>` _]/))return c.getType(b);if(d=a.match(/^[^\[*\\<>` ]+/)){var e=d[0];return e[0]==="_"&&e[e.length-1]==="_"?(a.backUp(e.length),undefined):c.getType(b)}if(a.eatSpace())return null}var c=CodeMirror.getMode(a,"markdown"),d={html:"htmlmixed",js:"javascript",json:"application/json",c:"text/x-csrc","c++":"text/x-c++src",java:"text/x-java",csharp:"text/x-csharp","c#":"text/x-csharp"},e=function(){var b,c={},e={},f,g=CodeMirror.listModes();for(b=0;b<g.length;b++)c[g[b]]=g[b];var h=CodeMirror.listMIMEs();for(b=0;b<h.length;b++)f=h[b].mime,e[f]=h[b].mime;for(var i in d)if(d[i]in c||d[i]in e)c[i]=d[i];return function(b){return c[b]?CodeMirror.getMode(a,c[b]):null}}();return{startState:function(){var a=c.startState();return a.text=h,{token:f,mode:"markdown",mdState:a,localMode:null,localState:null}},copyState:function(a){return{token:a.token,mode:a.mode,mdState:CodeMirror.copyState(c,a.mdState),localMode:a.localMode,localState:a.localMode?CodeMirror.copyState(a.localMode,a.localState):null}},token:function(a,b){return b.token(a,b)}}}),CodeMirror.defineMode("groovy",function(a,b){function c(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function h(a,b){var c=a.next();if(c=='"'||c=="'")return i(c,a,b);if(/[\[\]{}\(\),;\:\.]/.test(c))return g=c,null;if(/\d/.test(c))return a.eatWhile(/[\w\.]/),a.eat(/eE/)&&(a.eat(/\+\-/),a.eatWhile(/\d/)),"number";if(c=="/"){if(a.eat("*"))return b.tokenize.push(k),k(a,b);if(a.eat("/"))return a.skipToEnd(),"comment";if(l(b.lastToken))return i(c,a,b)}if(c=="-"&&a.eat(">"))return g="->",null;if(/[+\-*&%=<>!?|\/~]/.test(c))return a.eatWhile(/[+\-*&%=<>|~]/),"operator";a.eatWhile(/[\w\$_]/);if(c=="@")return"meta";if(b.lastToken==".")return"property";if(a.eat(":"))return g="proplabel","property";var h=a.current();return f.propertyIsEnumerable(h)?"atom":d.propertyIsEnumerable(h)?(e.propertyIsEnumerable(h)&&(g="newstatement"),"keyword"):"word"}function i(a,b,c){function e(b,c){var e=!1,f,g=!d;while((f=b.next())!=null){if(f==a&&!e){if(!d)break;if(b.match(a+a)){g=!0;break}}if(a=='"'&&f=="$"&&!e&&b.eat("{"))return c.tokenize.push(j()),"string";e=!e&&f=="\\"}return g&&c.tokenize.pop(),"string"}var d=!1;if(a!="/"&&b.eat(a))if(b.eat(a))d=!0;else return"string";return c.tokenize.push(e),e(b,c)}function j(){function b(b,c){if(b.peek()=="}"){a--;if(a==0)return c.tokenize.pop(),c.tokenize[c.tokenize.length-1](b,c)}else b.peek()=="{"&&a++;return h(b,c)}var a=1;return b.isBase=!0,b}function k(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize.pop();break}c=d=="*"}return"comment"}function l(a){return!a||a=="operator"||a=="->"||/[\.\[\{\(,;:]/.test(a)||a=="newstatement"||a=="keyword"||a=="proplabel"}function m(a,b,c,d,e){this.indented=a,this.column=b,this.type=c,this.align=d,this.prev=e}function n(a,b,c){return a.context=new m(a.indented,b,c,null,a.context)}function o(a){var b=a.context.type;if(b==")"||b=="]"||b=="}")a.indented=a.context.indented;return a.context=a.context.prev}var d=c("abstract as assert boolean break byte case catch char class const continue def default do double else enum extends final finally float for goto if implements import in instanceof int interface long native new package private protected public return short static strictfp super switch synchronized threadsafe throw throws transient try void volatile while"),e=c("catch class do else finally for if switch try while enum interface def"),f=c("null true false this"),g;return h.isBase=!0,{startState:function(b){return{tokenize:[h],context:new m((b||0)-a.indentUnit,0,"top",!1),indented:0,startOfLine:!0,lastToken:null}},token:function(a,b){var c=b.context;a.sol()&&(c.align==null&&(c.align=!1),b.indented=a.indentation(),b.startOfLine=!0,c.type=="statement"&&!l(b.lastToken)&&(o(b),c=b.context));if(a.eatSpace())return null;g=null;var d=b.tokenize[b.tokenize.length-1](a,b);if(d=="comment")return d;c.align==null&&(c.align=!0);if(g!=";"&&g!=":"||c.type!="statement")if(g=="->"&&c.type=="statement"&&c.prev.type=="}")o(b),b.context.align=!1;else if(g=="{")n(b,a.column(),"}");else if(g=="[")n(b,a.column(),"]");else if(g=="(")n(b,a.column(),")");else if(g=="}"){while(c.type=="statement")c=o(b);c.type=="}"&&(c=o(b));while(c.type=="statement")c=o(b)}else g==c.type?o(b):(c.type=="}"||c.type=="top"||c.type=="statement"&&g=="newstatement")&&n(b,a.column(),"statement");else o(b);return b.startOfLine=!1,b.lastToken=g||d,d},indent:function(b,c){if(!b.tokenize[b.tokenize.length-1].isBase)return 0;var d=c&&c.charAt(0),e=b.context;e.type=="statement"&&!l(b.lastToken)&&(e=e.prev);var f=d==e.type;return e.type=="statement"?e.indented+(d=="{"?0:a.indentUnit):e.align?e.column+(f?0:1):e.indented+(f?0:a.indentUnit)},electricChars:"{}"}}),CodeMirror.defineMIME("text/x-groovy","groovy"),CodeMirror.defineMode("haskell",function(a,b){function c(a,b,c){return b(c),c(a,b)}function m(a,b){if(a.eatWhile(l))return null;var m=a.next();if(k.test(m)){if(m=="{"&&a.eat("-")){var p="comment";return a.eat("#")&&(p="meta"),c(a,b,n(p,1))}return null}if(m=="'")return a.eat("\\")?a.next():a.next(),a.eat("'")?"string":"error";if(m=='"')return c(a,b,o);if(e.test(m))return a.eatWhile(i),a.eat(".")?"qualifier":"variable-2";if(d.test(m))return a.eatWhile(i),"variable";if(f.test(m)){if(m=="0"){if(a.eat(/[xX]/))return a.eatWhile(g),"integer";if(a.eat(/[oO]/))return a.eatWhile(h),"number"}a.eatWhile(f);var p="number";return a.eat(".")&&(p="number",a.eatWhile(f)),a.eat(/[eE]/)&&(p="number",a.eat(/[-+]/),a.eatWhile(f)),p}if(j.test(m)){if(m=="-"&&a.eat(/-/)){a.eatWhile(/-/);if(!a.eat(j))return a.skipToEnd(),"comment"}var p="variable";return m==":"&&(p="variable-2"),a.eatWhile(j),p}return"error"}function n(a,b){return b==0?m:function(c,d){var e=b;while(!c.eol()){var f=c.next();if(f=="{"&&c.eat("-"))++e;else if(f=="-"&&c.eat("}")){--e;if(e==0)return d(m),a}}return d(n(a,e)),a}}function o(a,b){while(!a.eol()){var c=a.next();if(c=='"')return b(m),"string";if(c=="\\"){if(a.eol()||a.eat(l))return b(p),"string";a.eat("&")||a.next()}}return b(m),"error"}function p(a,b){return a.eat("\\")?c(a,b,o):(a.next(),b(m),"error")}var d=/[a-z_]/,e=/[A-Z]/,f=/[0-9]/,g=/[0-9A-Fa-f]/,h=/[0-7]/,i=/[a-z_A-Z0-9']/,j=/[-!#$%&*+.\/<=>?@\\^|~:]/,k=/[(),;[\]`{}]/,l=/[ \t\v\f]/,q=function(){function b(b){return function(){for(var c=0;c<arguments.length;c++)a[arguments[c]]=b}}var a={};return b("keyword")("case","class","data","default","deriving","do","else","foreign","if","import","in","infix","infixl","infixr","instance","let","module","newtype","of","then","type","where","_"),b("keyword")("..",":","::","=","\\",'"',"<-","->","@","~","=>"),b("builtin")("!!","$!","$","&&","+","++","-",".","/","/=","<","<=","=<<","==",">",">=",">>",">>=","^","^^","||","*","**"),b("builtin")("Bool","Bounded","Char","Double","EQ","Either","Enum","Eq","False","FilePath","Float","Floating","Fractional","Functor","GT","IO","IOError","Int","Integer","Integral","Just","LT","Left","Maybe","Monad","Nothing","Num","Ord","Ordering","Rational","Read","ReadS","Real","RealFloat","RealFrac","Right","Show","ShowS","String","True"),b("builtin")("abs","acos","acosh","all","and","any","appendFile","asTypeOf","asin","asinh","atan","atan2","atanh","break","catch","ceiling","compare","concat","concatMap","const","cos","cosh","curry","cycle","decodeFloat","div","divMod","drop","dropWhile","either","elem","encodeFloat","enumFrom","enumFromThen","enumFromThenTo","enumFromTo","error","even","exp","exponent","fail","filter","flip","floatDigits","floatRadix","floatRange","floor","fmap","foldl","foldl1","foldr","foldr1","fromEnum","fromInteger","fromIntegral","fromRational","fst","gcd","getChar","getContents","getLine","head","id","init","interact","ioError","isDenormalized","isIEEE","isInfinite","isNaN","isNegativeZero","iterate","last","lcm","length","lex","lines","log","logBase","lookup","map","mapM","mapM_","max","maxBound","maximum","maybe","min","minBound","minimum","mod","negate","not","notElem","null","odd","or","otherwise","pi","pred","print","product","properFraction","putChar","putStr","putStrLn","quot","quotRem","read","readFile","readIO","readList","readLn","readParen","reads","readsPrec","realToFrac","recip","rem","repeat","replicate","return","reverse","round","scaleFloat","scanl","scanl1","scanr","scanr1","seq","sequence","sequence_","show","showChar","showList","showParen","showString","shows","showsPrec","significand","signum","sin","sinh","snd","span","splitAt","sqrt","subtract","succ","sum","tail","take","takeWhile","tan","tanh","toEnum","toInteger","toRational","truncate","uncurry","undefined","unlines","until","unwords","unzip","unzip3","userError","words","writeFile","zip","zip3","zipWith","zipWith3"),a}();return{startState:function(){return{f:m}},copyState:function(a){return{f:a.f}},token:function(a,b){var c=b.f(a,function(a){b.f=a}),d=a.current();return d in q?q[d]:c}}}),CodeMirror.defineMIME("text/x-haskell","haskell"),CodeMirror.defineMode("htmlmixed",function(a,b){function f(a,b){var f=c.token(a,b.htmlState);return f=="tag"&&a.current()==">"&&b.htmlState.context&&(/^script$/i.test(b.htmlState.context.tagName)?(b.token=h,b.localState=d.startState(c.indent(b.htmlState,"")),b.mode="javascript"):/^style$/i.test(b.htmlState.context.tagName)&&(b.token=i,b.localState=e.startState(c.indent(b.htmlState,"")),b.mode="css")),f}function g(a,b,c){var d=a.current(),e=d.search(b);return e>-1&&a.backUp(d.length-e),c}function h(a,b){return a.match(/^<\/\s*script\s*>/i,!1)?(b.token=f,b.curState=null,b.mode="html",f(a,b)):g(a,/<\/\s*script\s*>/,d.token(a,b.localState))}function i(a,b){return a.match(/^<\/\s*style\s*>/i,!1)?(b.token=f,b.localState=null,b.mode="html",f(a,b)):g(a,/<\/\s*style\s*>/,e.token(a,b.localState))}var c=CodeMirror.getMode(a,{name:"xml",htmlMode:!0}),d=CodeMirror.getMode(a,"javascript"),e=CodeMirror.getMode(a,"css");return{startState:function(){var a=c.startState();return{token:f,localState:null,mode:"html",htmlState:a}},copyState:function(a){if(a.localState)var b=CodeMirror.copyState(a.token==i?e:d,a.localState);return{token:a.token,localState:b,mode:a.mode,htmlState:CodeMirror.copyState(c,a.htmlState)}},token:function(a,b){return b.token(a,b)},indent:function(a,b){return a.token==f||/^\s*<\//.test(b)?c.indent(a.htmlState,b):a.token==h?d.indent(a.localState,b):e.indent(a.localState,b)},compareStates:function(a,b){return c.compareStates(a.htmlState,b.htmlState)},electricChars:"/{}:"}}),CodeMirror.defineMIME("text/html","htmlmixed"),CodeMirror.defineMode("javascript",function(a,b){function g(a,b,c){return b.tokenize=c,c(a,b)}function h(a,b){var c=!1,d;while((d=a.next())!=null){if(d==b&&!c)return!1;c=!c&&d=="\\"}return c}function k(a,b,c){return i=a,j=c,b}function l(a,b){var c=a.next();if(c=='"'||c=="'")return g(a,b,m(c));if(/[\[\]{}\(\),;\:\.]/.test(c))return k(c);if(c=="0"&&a.eat(/x/i))return a.eatWhile(/[\da-f]/i),k("number","number");if(/\d/.test(c))return a.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/),k("number","number");if(c=="/")return a.eat("*")?g(a,b,n):a.eat("/")?(a.skipToEnd(),k("comment","comment")):b.reAllowed?(h(a,"/"),a.eatWhile(/[gimy]/),k("regexp","string")):(a.eatWhile(f),k("operator",null,a.current()));if(c=="#")return a.skipToEnd(),k("error","error");if(f.test(c))return a.eatWhile(f),k("operator",null,a.current());a.eatWhile(/[\w\$_]/);var d=a.current(),i=e.propertyIsEnumerable(d)&&e[d];return i?k(i.type,i.style,d):k("variable","variable",d)}function m(a){return function(b,c){return h(b,a)||(c.tokenize=l),k("string","string")}}function n(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=l;break}c=d=="*"}return k("comment","comment")}function p(a,b,c,d,e,f){this.indented=a,this.column=b,this.type=c,this.prev=e,this.info=f,d!=null&&(this.align=d)}function q(a,b){for(var c=a.localVars;c;c=c.next)if(c.name==b)return!0}function r(a,b,c,e,f){var g=a.cc;s.state=a,s.stream=f,s.marked=null,s.cc=g,a.lexical.hasOwnProperty("align")||(a.lexical.align=!0);for(;;){var h=g.length?g.pop():d?D:C;if(h(c,e)){while(g.length&&g[g.length-1].lex)g.pop()();return s.marked?s.marked:c=="variable"&&q(a,e)?"variable-2":b}}}function t(){for(var a=arguments.length-1;a>=0;a--)s.cc.push(arguments[a])}function u(){return t.apply(null,arguments),!0}function v(a){var b=s.state;if(b.context){s.marked="def";for(var c=b.localVars;c;c=c.next)if(c.name==a)return;b.localVars={name:a,next:b.localVars}}}function x(){s.state.context||(s.state.localVars=w),s.state.context={prev:s.state.context,vars:s.state.localVars}}function y(){s.state.localVars=s.state.context.vars,s.state.context=s.state.context.prev}function z(a,b){var c=function(){var c=s.state;c.lexical=new p(c.indented,s.stream.column(),a,null,c.lexical,b)};return c.lex=!0,c}function A(){var a=s.state;a.lexical.prev&&(a.lexical.type==")"&&(a.indented=a.lexical.indented),a.lexical=a.lexical.prev)}function B(a){return function b(b){return b==a?u():a==";"?t():u(arguments.callee)}}function C(a){return a=="var"?u(z("vardef"),L,B(";"),A):a=="keyword a"?u(z("form"),D,C,A):a=="keyword b"?u(z("form"),C,A):a=="{"?u(z("}"),K,A):a==";"?u():a=="function"?u(R):a=="for"?u(z("form"),B("("),z(")"),N,B(")"),A,C,A):a=="variable"?u(z("stat"),G):a=="switch"?u(z("form"),D,z("}","switch"),B("{"),K,A,A):a=="case"?u(D,B(":")):a=="default"?u(B(":")):a=="catch"?u(z("form"),x,B("("),S,B(")"),C,A,y):t(z("stat"),D,B(";"),A)}function D(a){return o.hasOwnProperty(a)?u(F):a=="function"?u(R):a=="keyword c"?u(E):a=="("?u(z(")"),D,B(")"),A,F):a=="operator"?u(D):a=="["?u(z("]"),J(D,"]"),A,F):a=="{"?u(z("}"),J(I,"}"),A,F):u()}function E(a){return a.match(/[;\}\)\],]/)?t():t(D)}function F(a,b){if(a=="operator"&&/\+\+|--/.test(b))return u(F);if(a=="operator")return u(D);if(a==";")return;if(a=="(")return u(z(")"),J(D,")"),A,F);if(a==".")return u(H,F);if(a=="[")return u(z("]"),D,B("]"),A,F)}function G(a){return a==":"?u(A,C):t(F,B(";"),A)}function H(a){if(a=="variable")return s.marked="property",u()}function I(a){a=="variable"&&(s.marked="property");if(o.hasOwnProperty(a))return u(B(":"),D)}function J(a,b){function c(d){return d==","?u(a,c):d==b?u():u(B(b))}return function d(d){return d==b?u():t(a,c)}}function K(a){return a=="}"?u():t(C,K)}function L(a,b){return a=="variable"?(v(b),u(M)):u()}function M(a,b){if(b=="=")return u(D,M);if(a==",")return u(L)}function N(a){return a=="var"?u(L,P):a==";"?t(P):a=="variable"?u(O):t(P)}function O(a,b){return b=="in"?u(D):u(F,P)}function P(a,b){return a==";"?u(Q):b=="in"?u(D):u(D,B(";"),Q)}function Q(a){a!=")"&&u(D)}function R(a,b){if(a=="variable")return v(b),u(R);if(a=="(")return u(z(")"),x,J(S,")"),A,C,y)}function S(a,b){if(a=="variable")return v(b),u()}var c=a.indentUnit,d=b.json,e=function(){function a(a){return{type:a,style:"keyword"}}var b=a("keyword a"),c=a("keyword b"),d=a("keyword c"),e=a("operator"),f={type:"atom",style:"atom"};return{"if":b,"while":b,"with":b,"else":c,"do":c,"try":c,"finally":c,"return":d,"break":d,"continue":d,"new":d,"delete":d,"throw":d,"var":a("var"),"const":a("var"),let:a("var"),"function":a("function"),"catch":a("catch"),"for":a("for"),"switch":a("switch"),"case":a("case"),"default":a("default"),"in":e,"typeof":e,"instanceof":e,"true":f,"false":f,"null":f,"undefined":f,NaN:f,Infinity:f}}(),f=/[+\-*&%=<>!?|]/,i,j,o={atom:!0,number:!0,variable:!0,string:!0,regexp:!0},s={state:null,column:null,marked:null,cc:null},w={name:"this",next:{name:"arguments"}};return A.lex=!0,{startState:function(a){return{tokenize:l,reAllowed:!0,cc:[],lexical:new p((a||0)-c,0,"block",!1),localVars:null,context:null,indented:0}},token:function(a,b){a.sol()&&(b.lexical.hasOwnProperty("align")||(b.lexical.align=!1),b.indented=a.indentation());if(a.eatSpace())return null;var c=b.tokenize(a,b);return i=="comment"?c:(b.reAllowed=i=="operator"||i=="keyword c"||i.match(/^[\[{}\(,;:]$/),r(b,c,i,j,a))},indent:function(a,b){if(a.tokenize!=l)return 0;var d=b&&b.charAt(0),e=a.lexical,f=e.type,g=d==f;return f=="vardef"?e.indented+4:f=="form"&&d=="{"?e.indented:f=="stat"||f=="form"?e.indented+c:e.info=="switch"&&!g?e.indented+(/^(?:case|default)\b/.test(b)?c:2*c):e.align?e.column+(g?0:1):e.indented+(g?0:c)},electricChars:":{}"}}),CodeMirror.defineMIME("text/javascript","javascript"),CodeMirror.defineMIME("application/json",{name:"javascript",json:!0}),CodeMirror.defineMode("jinja2",function(a,b){function d(a,b){var c=a.next();if(c=="{")if(c=a.eat(/\{|%|#/))return a.eat("-"),b.tokenize=e(c),"tag"}function e(a){return a=="{"&&(a="}"),function(b,e){var f=b.next();return(f==a||f=="-"&&b.eat(a))&&b.eat("}")?(e.tokenize=d,"tag"):b.match(c)?"keyword":a=="#"?"comment":"string"}}var c=["block","endblock","for","endfor","in","true","false","loop","none","self","super","if","as","not","and","else","import","with","without","context"];return c=new RegExp("^(("+c.join(")|(")+"))\\b"),{startState:function(){return{tokenize:d}},token:function(a,b){return b.tokenize(a,b)}}}),CodeMirror.defineMode("lua",function(a,b){function d(a){return new RegExp("^(?:"+a.join("|")+")","i")}function e(a){return new RegExp("^(?:"+a.join("|")+")$","i")}function l(a){var b=0;while(a.eat("="))++b;return a.eat("["),b}function m(a,b){var c=a.next();return c=="-"&&a.eat("-")?a.eat("[")?(b.cur=n(l(a),"comment"))(a,b):(a.skipToEnd(),"comment"):c=='"'||c=="'"?(b.cur=o(c))(a,b):c=="["&&/[\[=]/.test(a.peek())?(b.cur=n(l(a),"string"))(a,b):/\d/.test(c)?(a.eatWhile(/[\w.%]/),"number"):/[\w_]/.test(c)?(a.eatWhile(/[\w\\\-_.]/),"variable"):null}function n(a,b){return function(c,d){var e=null,f;while((f=c.next())!=null)if(e==null)f=="]"&&(e=0);else if(f=="=")++e;else{if(f=="]"&&e==a){d.cur=m;break}e=null}return b}}function o(a){return function(b,c){var d=!1,e;while((e=b.next())!=null){if(e==a&&!d)break;d=!d&&e=="\\"}return d||(c.cur=m),"string"}}var c=a.indentUnit,f=e(b.specials||[]),g=e(["_G","_VERSION","assert","collectgarbage","dofile","error","getfenv","getmetatable","ipairs","load","loadfile","loadstring","module","next","pairs","pcall","print","rawequal","rawget","rawset","require","select","setfenv","setmetatable","tonumber","tostring","type","unpack","xpcall","coroutine.create","coroutine.resume","coroutine.running","coroutine.status","coroutine.wrap","coroutine.yield","debug.debug","debug.getfenv","debug.gethook","debug.getinfo","debug.getlocal","debug.getmetatable","debug.getregistry","debug.getupvalue","debug.setfenv","debug.sethook","debug.setlocal","debug.setmetatable","debug.setupvalue","debug.traceback","close","flush","lines","read","seek","setvbuf","write","io.close","io.flush","io.input","io.lines","io.open","io.output","io.popen","io.read","io.stderr","io.stdin","io.stdout","io.tmpfile","io.type","io.write","math.abs","math.acos","math.asin","math.atan","math.atan2","math.ceil","math.cos","math.cosh","math.deg","math.exp","math.floor","math.fmod","math.frexp","math.huge","math.ldexp","math.log","math.log10","math.max","math.min","math.modf","math.pi","math.pow","math.rad","math.random","math.randomseed","math.sin","math.sinh","math.sqrt","math.tan","math.tanh","os.clock","os.date","os.difftime","os.execute","os.exit","os.getenv","os.remove","os.rename","os.setlocale","os.time","os.tmpname","package.cpath","package.loaded","package.loaders","package.loadlib","package.path","package.preload","package.seeall","string.byte","string.char","string.dump","string.find","string.format","string.gmatch","string.gsub","string.len","string.lower","string.match","string.rep","string.reverse","string.sub","string.upper","table.concat","table.insert","table.maxn","table.remove","table.sort"]),h=e(["and","break","elseif","false","nil","not","or","return","true","function","end","if","then","else","do","while","repeat","until","for","in","local"]),i=e(["function","if","repeat","do","\\(","{"]),j=e(["end","until","\\)","}"]),k=d(["end","until","\\)","}","else","elseif"]);return{startState:function(a){return{basecol:a||0,indentDepth:0,cur:m}},token:function(a,b){if(a.eatSpace())return null;var c=b.cur(a,b),d=a.current();return c=="variable"&&(h.test(d)?c="keyword":g.test(d)?c="builtin":f.test(d)&&(c="variable-2")),c!="comment"&&c!="string"&&(i.test(d)?++b.indentDepth:j.test(d)&&--b.indentDepth),c},indent:function(a,b){var d=k.test(b);return a.basecol+c*(a.indentDepth-(d?1:0))}}}),CodeMirror.defineMIME("text/x-lua","lua"),CodeMirror.defineMode("markdown",function(a,b){function t(a,b,c){return b.f=b.inline=c,c(a,b)}function u(a,b,c){return b.f=b.block=c,c(a,b)}function v(a,b){if(a.match(r))return a.skipToEnd(),e;if(a.eatSpace())return null;if(a.peek()==="#"||a.match(q))return a.skipToEnd(),d;if(a.eat(">"))return b.indentation++,f;if(a.peek()==="[")return t(a,b,C);if(n.test(a.peek())){var c=new RegExp("(?:s*["+a.peek()+"]){3,}$");if(a.match(c,!0))return h}var i;return(i=a.match(o,!0)||a.match(p,!0))?(b.indentation+=i[0].length,g):t(a,b,b.inline)}function w(a,b){var d=c.token(a,b.htmlState);return d==="tag"&&b.htmlState.type!=="openTag"&&!b.htmlState.context&&(b.f=z,b.block=v),d}function x(a){return a.strong?a.em?m:l:a.em?k:null}function y(a,b){return a.match(s,!0)?x(b):undefined}function z(a,b){var c=b.text(a,b);if(typeof c!="undefined")return c;var d=a.next();if(d==="\\")return a.next(),x(b);if(d==="`")return t(a,b,F(e,"`"));if(d==="[")return t(a,b,A);if(d==="<"&&a.match(/^\w/,!1))return a.backUp(1),u(a,b,w);var f=x(b);return d==="*"||d==="_"?a.eat(d)?(b.strong=!b.strong)?x(b):f:(b.em=!b.em)?x(b):f:x(b)}function A(a,b){while(!a.eol()){var c=a.next();c==="\\"&&a.next();if(c==="]")return b.inline=b.f=B,i}return i}function B(a,b){a.eatSpace();var c=a.next();return c==="("||c==="["?t(a,b,F(j,c==="("?")":"]")):"error"}function C(a,b){return a.match(/^[^\]]*\]:/,!0)?(b.f=D,i):t(a,b,z)}function D(a,b){return a.eatSpace(),a.match(/^[^\s]+/,!0),b.f=b.inline=z,j}function E(a){return E[a]||(E[a]=new RegExp("^(?:[^\\\\\\"+a+"]|\\\\.)*(?:\\"+a+"|$)")),E[a]}function F(a,b,c){return c=c||z,function(d,e){return d.match(E(b)),e.inline=e.f=c,a}}var c=CodeMirror.getMode(a,{name:"xml",htmlMode:!0}),d="header",e="code",f="quote",g="list",h="hr",i="linktext",j="linkhref",k="em",l="strong",m="emstrong",n=/^[*-=_]/,o=/^[*-+]\s+/,p=/^[0-9]\.\s+/,q=/^(?:\={3,}|-{3,})$/,r=/^(k:\t|\s{4,})/,s=/^[^\[*_\\<>`]+/;return{startState:function(){return{f:v,block:v,htmlState:c.startState(),indentation:0,inline:z,text:y,em:!1,strong:!1}},copyState:function(a){return{f:a.f,block:a.block,htmlState:CodeMirror.copyState(c,a.htmlState),indentation:a.indentation,inline:a.inline,text:a.text,em:a.em,strong:a.strong}},token:function(a,b){if(a.sol()){b.f=b.block;var c=b.indentation,d=0;while(c>0)if(a.eat(" "))c--,d++;else if(c>=4&&a.eat("\t"))c-=4,d+=4;else break;b.indentation=d;if(d>0)return null}return b.f(a,b)},getType:x}}),CodeMirror.defineMIME("text/x-markdown","markdown"),CodeMirror.defineMode("ntriples",function(){function a(a,b){var c=a.location,d;c==Location.PRE_SUBJECT&&b=="<"?d=Location.WRITING_SUB_URI:c==Location.PRE_SUBJECT&&b=="_"?d=Location.WRITING_BNODE_URI:c==Location.PRE_PRED&&b=="<"?d=Location.WRITING_PRED_URI:c==Location.PRE_OBJ&&b=="<"?d=Location.WRITING_OBJ_URI:c==Location.PRE_OBJ&&b=="_"?d=Location.WRITING_OBJ_BNODE:c==Location.PRE_OBJ&&b=='"'?d=Location.WRITING_OBJ_LITERAL:c==Location.WRITING_SUB_URI&&b==">"?d=Location.PRE_PRED:c==Location.WRITING_BNODE_URI&&b==" "?d=Location.PRE_PRED:c==Location.WRITING_PRED_URI&&b==">"?d=Location.PRE_OBJ:c==Location.WRITING_OBJ_URI&&b==">"?d=Location.POST_OBJ:c==Location.WRITING_OBJ_BNODE&&b==" "?d=Location.POST_OBJ:c==Location.WRITING_OBJ_LITERAL&&b=='"'?d=Location.POST_OBJ:c==Location.WRITING_LIT_LANG&&b==" "?d=Location.POST_OBJ:c==Location.WRITING_LIT_TYPE&&b==">"?d=Location.POST_OBJ:c==Location.WRITING_OBJ_LITERAL&&b=="@"?d=Location.WRITING_LIT_LANG:c==Location.WRITING_OBJ_LITERAL&&b=="^"?d=Location.WRITING_LIT_TYPE:b!=" "||c!=Location.PRE_SUBJECT&&c!=Location.PRE_PRED&&c!=Location.PRE_OBJ&&c!=Location.POST_OBJ?c==Location.POST_OBJ&&b=="."?d=Location.PRE_SUBJECT:d=Location.ERROR:d=c,a.location=d}return Location={PRE_SUBJECT:0,WRITING_SUB_URI:1,WRITING_BNODE_URI:2,PRE_PRED:3,WRITING_PRED_URI:4,PRE_OBJ:5,WRITING_OBJ_URI:6,WRITING_OBJ_BNODE:7,WRITING_OBJ_LITERAL:8,WRITING_LIT_LANG:9,WRITING_LIT_TYPE:10,POST_OBJ:11,ERROR:12},untilSpace=function(a){return a!=" "},untilEndURI=function(a){return a!=">"},{startState:function(){return{location:Location.PRE_SUBJECT,uris:[],anchors:[],bnodes:[],langs:[],types:[]}},token:function(b,c){var d=b.next();if(d=="<"){a(c,d);var e="";return b.eatWhile(function(a){return a!="#"&&a!=">"?(e+=a,!0):!1}),c.uris.push(e),b.match("#",!1)?"variable":(b.next(),a(c,">"),"variable")}if(d=="#"){var f="";return b.eatWhile(function(a){return a!=">"&&a!=" "?(f+=a,!0):!1}),c.anchors.push(f),"variable-2"}if(d==">")return a(c,">"),"variable";if(d=="_"){a(c,d);var g="";return b.eatWhile(function(a){return a!=" "?(g+=a,!0):!1}),c.bnodes.push(g),b.next(),a(c," "),"builtin"}if(d=='"')return a(c,d),b.eatWhile(function(a){return a!='"'}),b.next(),b.peek()!="@"&&b.peek()!="^"&&a(c,'"'),"string";if(d=="@"){a(c,"@");var h="";return b.eatWhile(function(a){return a!=" "?(h+=a,!0):!1}),c.langs.push(h),b.next(),a(c," "),"string-2"}if(d=="^"){b.next(),a(c,"^");var i="";return b.eatWhile(function(a){return a!=">"?(i+=a,!0):!1}),c.types.push(i),b.next(),a(c,">"),"variable"}d==" "&&a(c,d),d=="."&&a(c,d)}}}),CodeMirror.defineMIME("text/n-triples","ntriples"),CodeMirror.defineMode("pascal",function(a){function b(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function h(a,b){var h=a.next();if(h=="#"&&b.startOfLine)return a.skipToEnd(),"meta";if(h=='"'||h=="'")return b.tokenize=i(h),b.tokenize(a,b);if(h=="("&&a.eat("*"))return b.tokenize=j,j(a,b);if(/[\[\]{}\(\),;\:\.]/.test(h))return g=h,null;if(/\d/.test(h))return a.eatWhile(/[\w\.]/),"number";if(h=="/"&&a.eat("/"))return a.skipToEnd(),"comment";if(f.test(h))return a.eatWhile(f),"operator";a.eatWhile(/[\w\$_]/);var k=a.current();return c.propertyIsEnumerable(k)?(d.propertyIsEnumerable(k)&&(g="newstatement"),"keyword"):e.propertyIsEnumerable(k)?"atom":"word"}function i(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d)c.tokenize=null;return"string"}}function j(a,b){var c=!1,d;while(d=a.next()){if(d==")"&&c){b.tokenize=null;break}c=d=="*"}return"comment"}function k(a,b,c,d,e){this.indented=a,this.column=b,this.type=c,this.align=d,this.prev=e}function l(a,b,c){return a.context=new k(a.indented,b,c,null,a.context)}function m(a){var b=a.context.type;if(b==")"||b=="]")a.indented=a.context.indented;return a.context=a.context.prev}var c=b("and array begin case const div do downto else end file for forward integer boolean char function goto if in label mod nil not of or packed procedure program record repeat set string then to type until var while with"),d=b("case do else for if switch while struct then of"),e={"null":!0},f=/[+\-*&%=<>!?|\/]/,g;return{startState:function(b){return{tokenize:null,context:new k((b||0)-a.indentUnit,0,"top",!1),indented:0,startOfLine:!0}},token:function(a,b){var c=b.context;a.sol()&&(c.align==null&&(c.align=!1),b.indented=a.indentation(),b.startOfLine=!0);if(a.eatSpace())return null;g=null;var d=(b.tokenize||h)(a,b);return d=="comment"||d=="meta"?d:(c.align==null&&(c.align=!0),g!=";"&&g!=":"||c.type!="statement"?g=="["?l(b,a.column(),"]"):g=="("?l(b,a.column(),")"):g==c.type?m(b):(c.type=="top"||c.type=="statement"&&g=="newstatement")&&l(b,a.column(),"statement"):m(b),b.startOfLine=!1,d)},electricChars:"{}"}}),CodeMirror.defineMIME("text/x-pascal","pascal"),CodeMirror.defineMode("perl",function(a,b){function f(a,b,c,d,e){return b.chain=null,b.style=null,b.tail=null,b.tokenize=function(a,b){var f=!1,g,i=0;while(g=a.next()){if(g===c[i]&&!f)return c[++i]!==undefined?(b.chain=c[i],b.style=d,b.tail=e):e&&a.eatWhile(e),b.tokenize=h,d;f=!f&&g=="\\"}return d},b.tokenize(a,b)}function g(a,b,c){return b.tokenize=function(a,b){return a.string==c&&(b.tokenize=h),a.skipToEnd(),"string"},b.tokenize(a,b)}function h(a,b){if(a.eatSpace())return null;if(b.chain)return f(a,b,b.chain,b.style,b.tail);if(a.match(/^\-?[\d\.]/,!1)&&a.match(/^(\-?(\d*\.\d+(e[+-]?\d+)?|\d+\.\d*)|0x[\da-fA-F]+|0b[01]+|\d+(e[+-]?\d+)?)/))return"number";if(a.match(/^<<(?=\w)/))return a.eatWhile(/\w/),g(a,b,a.current().substr(2));if(a.sol()&&a.match(/^\=item(?!\w)/))return g(a,b,"=cut");var h=a.next();if(h=='"'||h=="'"){if(a.prefix(3)=="<<"+h){var i=a.pos;a.eatWhile(/\w/);var j=a.current().substr(1);if(j&&a.eat(h))return g(a,b,j);a.pos=i}return f(a,b,[h],"string")}if(h=="q"){var k=a.look(-2);if(!k||!/\w/.test(k)){k=a.look(0);if(k=="x"){k=a.look(1);if(k=="(")return a.eatSuffix(2),f(a,b,[")"],d,e);if(k=="[")return a.eatSuffix(2),f(a,b,["]"],d,e);if(k=="{")return a.eatSuffix(2),f(a,b,["}"],d,e);if(k=="<")return a.eatSuffix(2),f(a,b,[">"],d,e);if(/[\^'"!~\/]/.test(k))return a.eatSuffix(1),f(a,b,[a.eat(k)],d,e)}else if(k=="q"){k=a.look(1);if(k=="(")return a.eatSuffix(2),f(a,b,[")"],"string");if(k=="[")return a.eatSuffix(2),f(a,b,["]"],"string");if(k=="{")return a.eatSuffix(2),f(a,b,["}"],"string");if(k=="<")return a.eatSuffix(2),f(a,b,[">"],"string");if(/[\^'"!~\/]/.test(k))return a.eatSuffix(1),f(a,b,[a.eat(k)],"string")}else if(k=="w"){k=a.look(1);if(k=="(")return a.eatSuffix(2),f(a,b,[")"],"bracket");if(k=="[")return a.eatSuffix(2),f(a,b,["]"],"bracket");if(k=="{")return a.eatSuffix(2),f(a,b,["}"],"bracket");if(k=="<")return a.eatSuffix(2),f(a,b,[">"],"bracket");if(/[\^'"!~\/]/.test(k))return a.eatSuffix(1),f(a,b,[a.eat(k)],"bracket")}else if(k=="r"){k=a.look(1);if(k=="(")return a.eatSuffix(2),f(a,b,[")"],d,e);if(k=="[")return a.eatSuffix(2),f(a,b,["]"],d,e);if(k=="{")return a.eatSuffix(2),f(a,b,["}"],d,e);if(k=="<")return a.eatSuffix(2),f(a,b,[">"],d,e);if(/[\^'"!~\/]/.test(k))return a.eatSuffix(1),f(a,b,[a.eat(k)],d,e)}else if(/[\^'"!~\/(\[{<]/.test(k)){if(k=="(")return a.eatSuffix(1),f(a,b,[")"],"string");if(k=="[")return a.eatSuffix(1),f(a,b,["]"],"string");if(k=="{")return a.eatSuffix(1),f(a,b,["}"],"string");if(k=="<")return a.eatSuffix(1),f(a,b,[">"],"string");if(/[\^'"!~\/]/.test(k))return f(a,b,[a.eat(k)],"string")}}}if(h=="m"){var k=a.look(-2);if(!k||!/\w/.test(k)){k=a.eat(/[(\[{<\^'"!~\/]/);if(k){if(/[\^'"!~\/]/.test(k))return f(a,b,[k],d,e);if(k=="(")return f(a,b,[")"],d,e);if(k=="[")return f(a,b,["]"],d,e);if(k=="{")return f(a,b,["}"],d,e);if(k=="<")return f(a,b,[">"],d,e)}}}if(h=="s"){var k=/[\/>\]})\w]/.test(a.look(-2));if(!k){k=a.eat(/[(\[{<\^'"!~\/]/);if(k)return k=="["?f(a,b,["]","]"],d,e):k=="{"?f(a,b,["}","}"],d,e):k=="<"?f(a,b,[">",">"],d,e):k=="("?f(a,b,[")",")"],d,e):f(a,b,[k,k],d,e)}}if(h=="y"){var k=/[\/>\]})\w]/.test(a.look(-2));if(!k){k=a.eat(/[(\[{<\^'"!~\/]/);if(k)return k=="["?f(a,b,["]","]"],d,e):k=="{"?f(a,b,["}","}"],d,e):k=="<"?f(a,b,[">",">"],d,e):k=="("?f(a,b,[")",")"],d,e):f(a,b,[k,k],d,e)}}if(h=="t"){var k=/[\/>\]})\w]/.test(a.look(-2));if(!k){k=a.eat("r");if(k){k=a.eat(/[(\[{<\^'"!~\/]/);if(k)return k=="["?f(a,b,["]","]"],d,e):k=="{"?f(a,b,["}","}"],d,e):k=="<"?f(a,b,[">",">"],d,e):k=="("?f(a,b,[")",")"],d,e):f(a,b,[k,k],d,e)}}}if(h=="`")return f(a,b,[h],"variable-2");if(h=="/")return/~\s*$/.test(a.prefix())?f(a,b,[h],d,e):"operator";if(h=="$"){var i=a.pos;if(a.eatWhile(/\d/)||a.eat("{")&&a.eatWhile(/\d/)&&a.eat("}"))return"variable-2";a.pos=i}if(/[$@%]/.test(h)){var i=a.pos;if(a.eat("^")&&a.eat(/[A-Z]/)||!/[@$%&]/.test(a.look(-2))&&a.eat(/[=|\\\-#?@;:&`~\^!\[\]*'"$+.,\/<>()]/)){var k=a.current();if(c[k])return"variable-2"}a.pos=i}if(/[$@%&]/.test(h))if(a.eatWhile(/[\w$\[\]]/)||a.eat("{")&&a.eatWhile(/[\w$\[\]]/)&&a.eat("}")){var k=a.current();return c[k]?"variable-2":"variable"}if(h=="#"&&a.look(-2)!="$")return a.skipToEnd(),"comment";if(/[:+\-\^*$&%@=<>!?|\/~\.]/.test(h)){var i=a.pos;a.eatWhile(/[:+\-\^*$&%@=<>!?|\/~\.]/);if(c[a.current()])return"operator";a.pos=i}if(h=="_"&&a.pos==1){if(a.suffix(6)=="_END__")return f(a,b,[" "],"comment");if(a.suffix(7)=="_DATA__")return f(a,b,[" "],"variable-2");if(a.suffix(7)=="_C__")return f(a,b,[" "],"string")}if(/\w/.test(h)){var i=a.pos;if(a.look(-2)=="{"&&(a.look(0)=="}"||a.eatWhile(/\w/)&&a.look(0)=="}"))return"string";a.pos=i}if(/[A-Z]/.test(h)){var l=a.look(-2),i=a.pos;a.eatWhile(/[A-Z_]/);if(/[\da-z]/.test(a.look(0)))a.pos=i;else{var k=c[a.current()];return k?(k[1]&&(k=k[0]),l!=":"?k==1?"keyword":k==2?"def":k==3?"atom":k==4?"operator":k==5?"variable-2":"meta":"meta"):"meta"}}if(/[a-zA-Z_]/.test(h)){var l=a.look(-2);a.eatWhile(/\w/);var k=c[a.current()];return k?(k[1]&&(k=k[0]),l!=":"?k==1?"keyword":k==2?"def":k==3?"atom":k==4?"operator":k==5?"variable-2":"meta":"meta"):"meta"}return null}var c={"->":4,"++":4,"--":4,"**":4,"=~":4,"!~":4,"*":4,"/":4,"%":4,x:4,"+":4,"-":4,".":4,"<<":4,">>":4,"<":4,">":4,"<=":4,">=":4,lt:4,gt:4,le:4,ge:4,"==":4,"!=":4,"<=>":4,eq:4,ne:4,cmp:4,"~~":4,"&":4,"|":4,"^":4,"&&":4,"||":4,"//":4,"..":4,"...":4,"?":4,":":4,"=":4,"+=":4,"-=":4,"*=":4,",":4,"=>":4,"::":4,not:4,and:4,or:4,xor:4,BEGIN:[5,1],END:[5,1],PRINT:[5,1],PRINTF:[5,1],GETC:[5,1],READ:[5,1],READLINE:[5,1],DESTROY:[5,1],TIE:[5,1],TIEHANDLE:[5,1],UNTIE:[5,1],STDIN:5,STDIN_TOP:5,STDOUT:5,STDOUT_TOP:5,STDERR:5,STDERR_TOP:5,$ARG:5,$_:5,"@ARG":5,"@_":5,$LIST_SEPARATOR:5,'$"':5,$PROCESS_ID:5,$PID:5,$$:5,$REAL_GROUP_ID:5,$GID:5,"$(":5,$EFFECTIVE_GROUP_ID:5,$EGID:5,"$)":5,$PROGRAM_NAME:5,$0:5,$SUBSCRIPT_SEPARATOR:5,$SUBSEP:5,"$;":5,$REAL_USER_ID:5,$UID:5,"$<":5,$EFFECTIVE_USER_ID:5,$EUID:5,"$>":5,$a:5,$b:5,$COMPILING:5,"$^C":5,$DEBUGGING:5,"$^D":5,"${^ENCODING}":5,$ENV:5,"%ENV":5,$SYSTEM_FD_MAX:5,"$^F":5,"@F":5,"${^GLOBAL_PHASE}":5,"$^H":5,"%^H":5,"@INC":5,"%INC":5,$INPLACE_EDIT:5,"$^I":5,"$^M":5,$OSNAME:5,"$^O":5,"${^OPEN}":5,$PERLDB:5,"$^P":5,$SIG:5,"%SIG":5,$BASETIME:5,"$^T":5,"${^TAINT}":5,"${^UNICODE}":5,"${^UTF8CACHE}":5,"${^UTF8LOCALE}":5,$PERL_VERSION:5,"$^V":5,"${^WIN32_SLOPPY_STAT}":5,$EXECUTABLE_NAME:5,"$^X":5,$1:5,$MATCH:5,"$&":5,"${^MATCH}":5,$PREMATCH:5,"$`":5,"${^PREMATCH}":5,$POSTMATCH:5,"$'":5,"${^POSTMATCH}":5,$LAST_PAREN_MATCH:5,"$+":5,$LAST_SUBMATCH_RESULT:5,"$^N":5,"@LAST_MATCH_END":5,"@+":5,"%LAST_PAREN_MATCH":5,"%+":5,"@LAST_MATCH_START":5,"@-":5,"%LAST_MATCH_START":5,"%-":5,$LAST_REGEXP_CODE_RESULT:5,"$^R":5,"${^RE_DEBUG_FLAGS}":5,"${^RE_TRIE_MAXBUF}":5,$ARGV:5,"@ARGV":5,ARGV:5,ARGVOUT:5,$OUTPUT_FIELD_SEPARATOR:5,$OFS:5,"$,":5,$INPUT_LINE_NUMBER:5,$NR:5,"$.":5,$INPUT_RECORD_SEPARATOR:5,$RS:5,"$/":5,$OUTPUT_RECORD_SEPARATOR:5,$ORS:5,"$\\":5,$OUTPUT_AUTOFLUSH:5,"$|":5,$ACCUMULATOR:5,"$^A":5,$FORMAT_FORMFEED:5,"$^L":5,$FORMAT_PAGE_NUMBER:5,"$%":5,$FORMAT_LINES_LEFT:5,"$-":5,$FORMAT_LINE_BREAK_CHARACTERS:5,"$:":5,$FORMAT_LINES_PER_PAGE:5,"$=":5,$FORMAT_TOP_NAME:5,"$^":5,$FORMAT_NAME:5,"$~":5,"${^CHILD_ERROR_NATIVE}":5,$EXTENDED_OS_ERROR:5,"$^E":5,$EXCEPTIONS_BEING_CAUGHT:5,"$^S":5,$WARNING:5,"$^W":5,"${^WARNING_BITS}":5,$OS_ERROR:5,$ERRNO:5,"$!":5,"%OS_ERROR":5,"%ERRNO":5,"%!":5,$CHILD_ERROR:5,"$?":5,$EVAL_ERROR:5,"$@":5,$OFMT:5,"$#":5,"$*":5,$ARRAY_BASE:5,"$[":5,$OLD_PERL_VERSION:5,"$]":5,"if":[1,1],elsif:[1,1],"else":[1,1],"while":[1,1],unless:[1,1],"for":[1,1],foreach:[1,1],abs:1,accept:1,alarm:1,atan2:1,bind:1,binmode:1,bless:1,bootstrap:1,"break":1,caller:1,chdir:1,chmod:1,chomp:1,chop:1,chown:1,chr:1,chroot:1,close:1,closedir:1,connect:1,"continue":[1,1],cos:1,crypt:1,dbmclose:1,dbmopen:1,"default":1,defined:1,"delete":1,die:1,"do":1,dump:1,each:1,endgrent:1,endhostent:1,endnetent:1,endprotoent:1,endpwent:1,endservent:1,eof:1,eval:1,exec:1,exists:1,exit:1,exp:1,fcntl:1,fileno:1,flock:1,fork:1,format:1,formline:1,getc:1,getgrent:1,getgrgid:1,getgrnam:1,gethostbyaddr:1,gethostbyname:1,gethostent:1,getlogin:1,getnetbyaddr:1,getnetbyname:1,getnetent:1,getpeername:1,getpgrp:1,getppid:1,getpriority:1,getprotobyname:1,getprotobynumber:1,getprotoent:1,getpwent:1,getpwnam:1,getpwuid:1,getservbyname:1,getservbyport:1,getservent:1,getsockname:1,getsockopt:1,given:1,glob:1,gmtime:1,"goto":1,grep:1,hex:1,"import":1,index:1,"int":1,ioctl:1,join:1,keys:1,kill:1,last:1,lc:1,lcfirst:1,length:1,link:1,listen:1,local:2,localtime:1,lock:1,log:1,lstat:1,m:null,map:1,mkdir:1,msgctl:1,msgget:1,msgrcv:1,msgsnd:1,my:2,"new":1,next:1,no:1,oct:1,open:1,opendir:1,ord:1,our:2,pack:1,"package":1,pipe:1,pop:1,pos:1,print:1,printf:1,prototype:1,push:1,q:null,qq:null,qr:null,quotemeta:null,qw:null,qx:null,rand:1,read:1,readdir:1,readline:1,readlink:1,readpipe:1,recv:1,redo:1,ref:1,rename:1,require:1,reset:1,"return":1,reverse:1,rewinddir:1,rindex:1,rmdir:1,s:null,say:1,scalar:1,seek:1,seekdir:1,select:1,semctl:1,semget:1,semop:1,send:1,setgrent:1,sethostent:1,setnetent:1,setpgrp:1,setpriority:1,setprotoent:1,setpwent:1,setservent:1,setsockopt:1,shift:1,shmctl:1,shmget:1,shmread:1,shmwrite:1,shutdown:1,sin:1,sleep:1,socket:1,socketpair:1,sort:1,splice:1,split:1,sprintf:1,sqrt:1,srand:1,stat:1,state:1,study:1,sub:1,substr:1,symlink:1,syscall:1,sysopen:1,sysread:1,sysseek:1,system:1,syswrite:1,tell:1,telldir:1,tie:1,tied:1,time:1,times:1,tr:null,truncate:1,uc:1,ucfirst:1,umask:1,undef:1,unlink:1,unpack:1,unshift:1,untie:1,use:1,utime:1,values:1,vec:1,wait:1,waitpid:1,wantarray:1,warn:1,when:1,write:1,y:null},d="string-2",e=/[goseximacplud]/;return{startState:function(){return{tokenize:h,chain:null,style:null,tail:null}},token:function(a,b){return(b.tokenize||h)(a,b)},electricChars:"{}"}}),CodeMirror.defineMIME("text/x-perl","perl"),CodeMirror.StringStream.prototype.look=function(a){return this.string.charAt(this.pos+(a||0))},CodeMirror.StringStream.prototype.prefix=function(a){if(a){var b=this.pos-a;return this.string.substr(b>=0?b:0,a)}return this.string.substr(0,this.pos-1)},CodeMirror.StringStream.prototype.suffix=function(a){var b=this.string.length,c=b-this.pos+1;return this.string.substr(this.pos,a&&a<b?a:c)},CodeMirror.StringStream.prototype.nsuffix=function(a){var b=this.pos,c=a||this.string.length-this.pos+1;return this.pos+=c,this.string.substr(b,c)},CodeMirror.StringStream.prototype.eatSuffix=function(a){var b=this.pos+a,c;b<=0?this.pos=0:b>=(c=this.string.length-1)?this.pos=c:this.pos=b},function(){function a(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function b(a){return function(b,c){return b.match(a)?c.tokenize=null:b.skipToEnd(),"string"}}var c={name:"clike",keywords:a("abstract and array as break case catch cfunction class clone const continue declare default do else elseif enddeclare endfor endforeach endif endswitch endwhile extends final for foreach function global goto if implements interface instanceof namespace new or private protected public static switch throw try use var while xor returndie echo empty exit eval include include_once isset list require require_once print unset"),blockKeywords:a("catch do else elseif for foreach if switch try while"),atoms:a("true false null TRUE FALSE NULL"),multiLineStrings:!0,hooks:{$:function(a,b){return a.eatWhile(/[\w\$_]/),"variable-2"},"<":function(a,c){return a.match(/<</)?(a.eatWhile(/[\w\.]/),c.tokenize=b(a.current().slice(3)),c.tokenize(a,c)):!1},"#":function(a,b){return a.skipToEnd(),"comment"}}};CodeMirror.defineMode("php",function(a,b){function h(a,b){if(b.curMode==d){var c=d.token(a,b.curState);return c=="meta"&&/^<\?/.test(a.current())?(b.curMode=g,b.curState=b.php,b.curClose=/^\?>/,b.mode="php"):c=="tag"&&a.current()==">"&&b.curState.context&&(/^script$/i.test(b.curState.context.tagName)?(b.curMode=e,b.curState=e.startState(d.indent(b.curState,"")),b.curClose=/^<\/\s*script\s*>/i,b.mode="javascript"):/^style$/i.test(b.curState.context.tagName)&&(b.curMode=f,b.curState=f.startState(d.indent(b.curState,"")),b.curClose=/^<\/\s*style\s*>/i,b.mode="css")),c}return a.match(b.curClose,!1)?(b.curMode=d,b.curState=b.html,b.curClose=null,b.mode="html",h(a,b)):b.curMode.token(a,b.curState)}var d=CodeMirror.getMode(a,"text/html"),e=CodeMirror.getMode(a,"text/javascript"),f=CodeMirror.getMode(a,"text/css"),g=CodeMirror.getMode(a,c);return{startState:function(){var a=d.startState();return{html:a,php:g.startState(),curMode:b.startOpen?g:d,curState:b.startOpen?g.startState():a,curClose:b.startOpen?/^\?>/:null,mode:b.startOpen?"php":"html"}},copyState:function(a){var b=a.html,c=CodeMirror.copyState(d,b),e=a.php,f=CodeMirror.copyState(g,e),h;return a.curState==b?h=c:a.curState==e?h=f:h=CodeMirror.copyState(a.curMode,a.curState),{html:c,php:f,curMode:a.curMode,curState:h,curClose:a.curClose}},token:h,indent:function(a,b){return a.curMode!=g&&/^\s*<\//.test(b)||a.curMode==g&&/^\?>/.test(b)?d.indent(a.html,b):a.curMode.indent(a.curState,b)},electricChars:"/{}:"}}),CodeMirror.defineMIME("application/x-httpd-php","php"),CodeMirror.defineMIME("application/x-httpd-php-open",{name:"php",startOpen:!0}),CodeMirror.defineMIME("text/x-php",c)}(),CodeMirror.defineMode("plsql",function(a,b){function j(a,b,c){return b.tokenize=c,c(a,b)}function l(a,b){return k=a,b}function m(a,b){var c=a.next();return c=='"'||c=="'"?j(a,b,n(c)):/[\[\]{}\(\),;\.]/.test(c)?l(c):/\d/.test(c)?(a.eatWhile(/[\w\.]/),l("number","number")):c=="/"?a.eat("*")?j(a,b,o):(a.eatWhile(i),l("operator","operator")):c=="-"?a.eat("-")?(a.skipToEnd(),l("comment","comment")):(a.eatWhile(i),l("operator","operator")):c=="@"||c=="$"?(a.eatWhile(/[\w\d\$_]/),l("word","variable")):i.test(c)?(a.eatWhile(i),l("operator","operator")):(a.eatWhile(/[\w\$_]/),d&&d.propertyIsEnumerable(a.current().toLowerCase())?l("keyword","keyword"):e&&e.propertyIsEnumerable(a.current().toLowerCase())?l("keyword","builtin"):f&&f.propertyIsEnumerable(a.current().toLowerCase())?l("keyword","variable-2"):g&&g.propertyIsEnumerable(a.current().toLowerCase())?l("keyword","variable-3"):l("word","plsql-word"))}function n(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d&&!h)c.tokenize=m;return l("string","plsql-string")}}function o(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=m;break}c=d=="*"}return l("comment","plsql-comment")}var c=a.indentUnit,d=b.keywords,e=b.functions,f=b.types,g=b.sqlplus,h=b.multiLineStrings,i=/[+\-*&%=<>!?:\/|]/,k;return{startState:function(a){return{tokenize:m,startOfLine:!0}},token:function(a,b){if(a.eatSpace())return null;var c=b.tokenize(a,b);return c}}}),function(){function a(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}var b="abort accept access add all alter and any array arraylen as asc assert assign at attributes audit authorization avg base_table begin between binary_integer body boolean by case cast char char_base check close cluster clusters colauth column comment commit compress connect connected constant constraint crash create current currval cursor data_base database date dba deallocate debugoff debugon decimal declare default definition delay delete desc digits dispose distinct do drop else elsif enable end entry escape exception exception_init exchange exclusive exists exit external fast fetch file for force form from function generic goto grant group having identified if immediate in increment index indexes indicator initial initrans insert interface intersect into is key level library like limited local lock log logging long loop master maxextents maxtrans member minextents minus mislabel mode modify multiset new next no noaudit nocompress nologging noparallel not nowait number_base object of off offline on online only open option or order out package parallel partition pctfree pctincrease pctused pls_integer positive positiven pragma primary prior private privileges procedure public raise range raw read rebuild record ref references refresh release rename replace resource restrict return returning reverse revoke rollback row rowid rowlabel rownum rows run savepoint schema segment select separate session set share snapshot some space split sql start statement storage subtype successful synonym tabauth table tables tablespace task terminate then to trigger truncate type union unique unlimited unrecoverable unusable update use using validate value values variable view views when whenever where while with work",c="abs acos add_months ascii asin atan atan2 average bfilename ceil chartorowid chr concat convert cos cosh count decode deref dual dump dup_val_on_index empty error exp false floor found glb greatest hextoraw initcap instr instrb isopen last_day least lenght lenghtb ln lower lpad ltrim lub make_ref max min mod months_between new_time next_day nextval nls_charset_decl_len nls_charset_id nls_charset_name nls_initcap nls_lower nls_sort nls_upper nlssort no_data_found notfound null nvl others power rawtohex reftohex round rowcount rowidtochar rpad rtrim sign sin sinh soundex sqlcode sqlerrm sqrt stddev substr substrb sum sysdate tan tanh to_char to_date to_label to_multi_byte to_number to_single_byte translate true trunc uid upper user userenv variance vsize",d="bfile blob character clob dec float int integer mlslabel natural naturaln nchar nclob number numeric nvarchar2 real rowtype signtype smallint string varchar varchar2",e="appinfo arraysize autocommit autoprint autorecovery autotrace blockterminator break btitle cmdsep colsep compatibility compute concat copycommit copytypecheck define describe echo editfile embedded escape exec execute feedback flagger flush heading headsep instance linesize lno loboffset logsource long longchunksize markup native newpage numformat numwidth pagesize pause pno recsep recsepchar release repfooter repheader serveroutput shiftinout show showmode size spool sqlblanklines sqlcase sqlcode sqlcontinue sqlnumber sqlpluscompatibility sqlprefix sqlprompt sqlterminator suffix tab term termout time timing trimout trimspool ttitle underline verify version wrap";CodeMirror.defineMIME("text/x-plsql",{name:"plsql",keywords:a(b),functions:a(c),types:a(d),sqlplus:a(e)})}(),CodeMirror.defineMode("python",function(a,b){function d(a){return new RegExp("^(("+a.join(")|(")+"))\\b")}function t(a,b){if(a.sol()){var d=b.scopes[0].offset;if(a.eatSpace()){var l=a.indentation();return l>d?s="indent":l<d&&(s="dedent"),null}d>0&&w(a,b)}if(a.eatSpace())return null;var m=a.peek();if(m==="#")return a.skipToEnd(),"comment";if(a.match(/^[0-9\.]/,!1)){var n=!1;a.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)&&(n=!0),a.match(/^\d+\.\d*/)&&(n=!0),a.match(/^\.\d+/)&&(n=!0);if(n)return a.eat(/J/i),"number";var o=!1;a.match(/^0x[0-9a-f]+/i)&&(o=!0),a.match(/^0b[01]+/i)&&(o=!0),a.match(/^0o[0-7]+/i)&&(o=!0),a.match(/^[1-9]\d*(e[\+\-]?\d+)?/)&&(a.eat(/J/i),o=!0),a.match(/^0(?![\dx])/i)&&(o=!0);if(o)return a.eat(/L/i),"number"}return a.match(p)?(b.tokenize=u(a.current()),b.tokenize(a,b)):a.match(i)||a.match(h)?null:a.match(g)||a.match(e)||a.match(k)?"operator":a.match(f)?null:a.match(r)?"builtin":a.match(q)?"keyword":a.match(j)?"variable":(a.next(),c)}function u(a){while("rub".indexOf(a.charAt(0).toLowerCase())>=0)a=a.substr(1);var d=a.length==1,e="string";return function f(f,g){while(!f.eol()){f.eatWhile(/[^'"\\]/);if(f.eat("\\")){f.next();if(d&&f.eol())return e}else{if(f.match(a))return g.tokenize=t,e;f.eat(/['"]/)}}if(d){if(b.singleLineStringErrors)return c;g.tokenize=t}return e}}function v(b,c,d){d=d||"py";var e=0;if(d==="py"){for(var f=0;f<c.scopes.length;++f)if(c.scopes[f].type==="py"){e=c.scopes[f].offset+a.indentUnit;break}}else e=b.column()+b.current().length;c.scopes.unshift({offset:e,type:d})}function w(a,b){if(b.scopes.length==1)return;if(b.scopes[0].type==="py"){var c=a.indentation(),d=-1;for(var e=0;e<b.scopes.length;++e)if(c===b.scopes[e].offset){d=e;break}if(d===-1)return!0;while(b.scopes[0].offset!==c)b.scopes.shift();return!1}return b.scopes.shift(),!1}function x(a,b){s=null;var d=b.tokenize(a,b),e=a.current();if(e===".")return d=b.tokenize(a,b),e=a.current(),d==="variable"?"variable":c;if(e==="@")return d=b.tokenize(a,b),e=a.current(),d==="variable"||e==="@staticmethod"||e==="@classmethod"?"meta":c;if(e==="pass"||e==="return")b.dedent+=1;(e===":"&&!b.lambda&&b.scopes[0].type=="py"||s==="indent")&&v(a,b);var f="[({".indexOf(e);return f!==-1&&v(a,b,"])}".slice(f,f+1)),s==="dedent"&&w(a,b)?c:(f="])}".indexOf(e),f!==-1&&w(a,b)?c:(b.dedent>0&&a.eol()&&b.scopes[0].type=="py"&&(b.scopes.length>1&&b.scopes.shift(),b.dedent-=1),d))}var c="error",e=new RegExp("^[\\+\\-\\*/%&|\\^~<>!]"),f=new RegExp("^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]"),g=new RegExp("^((==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//)|(\\*\\*))"),h=new RegExp("^((\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))"),i=new RegExp("^((//=)|(>>=)|(<<=)|(\\*\\*=))"),j=new RegExp("^[_A-Za-z][_A-Za-z0-9]*"),k=d(["and","or","not","is","in"]),l=["as","assert","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","lambda","pass","raise","return","try","while","with","yield"],m=["bool","classmethod","complex","dict","enumerate","float","frozenset","int","list","object","property","reversed","set","slice","staticmethod","str","super","tuple","type"],n={types:["basestring","buffer","file","long","unicode","xrange"],keywords:["exec","print"]},o={types:["bytearray","bytes","filter","map","memoryview","open","range","zip"],keywords:["nonlocal"]};if(!b.version||parseInt(b.version,10)!==3){l=l.concat(n.keywords),m=m.concat(n.types);var p=new RegExp("^(([rub]|(ur)|(br))?('{3}|\"{3}|['\"]))","i")}else{l=l.concat(o.keywords),m=m.concat(o.types);var p=new RegExp("^(([rb]|(br))?('{3}|\"{3}|['\"]))","i")}var q=d(l),r=d(m),s=null,y={startState:function(a){return{tokenize:t,scopes:[{offset:a||0,type:"py"}],lastToken:null,lambda:!1,dedent:0}},token:function(a,b){var c=x(a,b);return b.lastToken={style:c,content:a.current()},a.eol()&&a.lambda&&(b.lambda=!1),c},indent:function(a,b){return a.tokenize!=t?0:a.scopes[0].offset}};return y}),CodeMirror.defineMIME("text/x-python","python"),CodeMirror.defineMode("r",function(a){function b(a){var b=a.split(" "),c={};for(var d=0;d<b.length;++d)c[b[d]]=!0;return c}function i(a,b){h=null;var i=a.next();if(i=="#")return a.skipToEnd(),"comment";if(i=="0"&&a.eat("x"))return a.eatWhile(/[\da-f]/i),"number";if(i=="."&&a.eat(/\d/))return a.match(/\d*(?:e[+\-]?\d+)?/),"number";if(/\d/.test(i))return a.match(/\d*(?:\.\d+)?(?:e[+\-]\d+)?L?/),"number";if(i=="'"||i=='"')return b.tokenize=j(i),"string";if(i=="."&&a.match(/.[.\d]+/))return"keyword";if(/[\w\.]/.test(i)&&i!="_"){a.eatWhile(/[\w\.]/);var k=a.current();return c.propertyIsEnumerable(k)?"atom":e.propertyIsEnumerable(k)?(f.propertyIsEnumerable(k)&&(h="block"),"keyword"):d.propertyIsEnumerable(k)?"builtin":"variable"}return i=="%"?(a.skipTo("%")&&a.next(),"variable-2"):i=="<"&&a.eat("-")?"arrow":i=="="&&b.ctx.argList?"arg-is":g.test(i)?i=="$"?"dollar":(a.eatWhile(g),"operator"):/[\(\){}\[\];]/.test(i)?(h=i,i==";"?"semi":null):null}function j(a){return function(b,c){if(b.eat("\\")){var d=b.next();return d=="x"?b.match(/^[a-f0-9]{2}/i):(d=="u"||d=="U")&&b.eat("{")&&b.skipTo("}")?b.next():d=="u"?b.match(/^[a-f0-9]{4}/i):d=="U"?b.match(/^[a-f0-9]{8}/i):/[0-7]/.test(d)&&b.match(/^[0-7]{1,2}/),"string-2"}var e;while((e=b.next())!=null){if(e==a){c.tokenize=i;break}if(e=="\\"){b.backUp(1);break}}return"string"}}function k(a,b,c){a.ctx={type:b,indent:a.indent,align:null,column:c.column(),prev:a.ctx}}function l(a){a.indent=a.ctx.indent,a.ctx=a.ctx.prev}var c=b("NULL NA Inf NaN NA_integer_ NA_real_ NA_complex_ NA_character_"),d=b("list quote bquote eval return call parse deparse"),e=b("if else repeat while function for in next break"),f=b("if else repeat while function for"),g=/[+\-*\/^<>=!&|~$:]/,h;return{startState:function(b){return{tokenize:i,ctx:{type:"top",indent:-a.indentUnit,align:!1},indent:0,afterIdent:!1}},token:function(a,b){a.sol()&&(b.ctx.align==null&&(b.ctx.align=!1),b.indent=a.indentation());if(a.eatSpace())return null;var c=b.tokenize(a,b);c!="comment"&&b.ctx.align==null&&(b.ctx.align=!0);var d=b.ctx.type;return(h==";"||h=="{"||h=="}")&&d=="block"&&l(b),h=="{"?k(b,"}",a):h=="("?(k(b,")",a),b.afterIdent&&(b.ctx.argList=!0)):h=="["?k(b,"]",a):h=="block"?k(b,"block",a):h==d&&l(b),b.afterIdent=c=="variable"||c=="keyword",c},indent:function(b,c){if(b.tokenize!=i)return 0;var d=c&&c.charAt(0),e=b.ctx,f=d==e.type;return e.type=="block"?e.indent+(d=="{"?0:a.indentUnit):e.align?e.column+(f?0:1):e.indent+(f?0:a.indentUnit)}}}),CodeMirror.defineMIME("text/x-rsrc","r"),CodeMirror.defineMode("changes",function(a,b){var c=/^-+$/,d=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)  ?\d{1,2} \d{2}:\d{2}(:\d{2})? [A-Z]{3,4} \d{4} - /,e=/^[\w+.-]+@[\w.-]+/;return{token:function(a){if(a.sol()){if(a.match(c))return"tag";if(a.match(d))return"tag"}return a.match(e)?"string":(a.next(),null)}}}),CodeMirror.defineMIME("text/x-rpm-changes","changes"),CodeMirror.defineMode("spec",function(a,b){var c=/^(i386|i586|i686|x86_64|ppc64|ppc|ia64|s390x|s390|sparc64|sparcv9|sparc|noarch|alphaev6|alpha|hppa|mipsel)/,d=/^(Name|Version|Release|License|Summary|Url|Group|Source|BuildArch|BuildRequires|BuildRoot|AutoReqProv|Provides|Requires(\(\w+\))?|Obsoletes|Conflicts|Recommends|Source\d*|Patch\d*|ExclusiveArch|NoSource|Supplements):/,e=/^%(debug_package|package|description|prep|build|install|files|clean|changelog|preun|postun|pre|post|triggerin|triggerun|pretrans|posttrans|verifyscript|check|triggerpostun|triggerprein|trigger)/,f=/^%(ifnarch|ifarch|if)/,g=/^%(else|endif)/,h=/^(\!|\?|\<\=|\<|\>\=|\>|\=\=|\&\&|\|\|)/;return{startState:function(){return{controlFlow:!1,macroParameters:!1,section:!1}},token:function(a,b){var i=a.peek();if(i=="#")return a.skipToEnd(),"comment";if(a.sol()){if(a.match(d))return"preamble";if(a.match(e))return"section"}if(a.match(/^\$\w+/))return"def";if(a.match(/^\$\{\w+\}/))return"def";if(a.match(g))return"keyword";if(a.match(f))return b.controlFlow=!0,"keyword";if(b.controlFlow){if(a.match(h))return"operator";if(a.match(/^(\d+)/))return"number";a.eol()&&(b.controlFlow=!1)}if(a.match(c))return"number";if(a.match(/^%[\w]+/))return a.match(/^\(/)&&(b.macroParameters=!0),"macro";if(b.macroParameters){if(a.match(/^\d+/))return"number";if(a.match(/^\)/))return b.macroParameters=!1,"macro"}return a.match(/^%\{\??[\w \-]+\}/)?"macro":(a.next(),null)}}}),CodeMirror.defineMIME("text/x-rpm-spec","spec"),CodeMirror.defineMode("rst",function(a,b){function c(a,b,c){a.fn=b,d(a,c)}function d(a,b){a.ctx=b||{}}function e(a,b){if(b&&typeof b!="string"){var d=b.current();b=d[d.length-1]}c(a,x,{back:b})}function f(a){if(a){var b=CodeMirror.listModes();for(var c in b)if(b[c]==a)return!0}return!1}function g(b){return f(b)?CodeMirror.getMode(a,b):null}function x(a,b){function l(a){return f||!b.ctx.back||a.test(b.ctx.back)}function m(b){return a.eol()||a.match(b,!1)}function n(b){return a.match(b)&&l(/\W/)&&m(/\W/)}var d,f,g;if(a.eat(/\\/))return d=a.next(),e(b,d),null;f=a.sol();if(f&&(d=a.eat(j))){for(g=0;a.eat(d);g++);if(g>=3&&a.match(/^\s*$/))return e(b,null),"section";a.backUp(g+1)}if(f&&a.match(q))return a.eol()||c(b,z),"directive-marker";if(a.match(r)){if(!h)c(b,C);else{var k=h;c(b,C,{mode:k,local:k.startState()})}return"verbatim-marker"}if(f&&a.match(w,!1)){if(!i)return c(b,C),"verbatim-marker";var k=i;return c(b,C,{mode:k,local:k.startState()}),null}if(f&&(a.match(u)||a.match(v)))return e(b,a),"list";if(n(o))return e(b,a),"footnote";if(n(p))return e(b,a),"citation";d=a.next();if(l(s)){if(!(d!==":"&&d!=="|"||!a.eat(/\S/))){var t;return d===":"?t="role":t="replacement",c(b,y,{ch:d,wide:!1,prev:null,token:t}),t}if(d==="*"||d==="`"){var x=d,A=!1;d=a.next(),d==x&&(A=!0,d=a.next());if(d&&!/\s/.test(d)){var t;return x==="*"?t=A?"strong":"emphasis":t=A?"inline":"interpreted",c(b,y,{ch:x,wide:A,prev:null,token:t}),t}}}return e(b,d),null}function y(a,b){function g(a){return b.ctx.prev=a,f}var d=a.next(),f=b.ctx.token;if(d!=b.ctx.ch)return g(d);if(/\s/.test(b.ctx.prev))return g(d);if(b.ctx.wide){d=a.next();if(d!=b.ctx.ch)return g(d)}return!a.eol()&&!t.test(a.peek())?(b.ctx.wide&&a.backUp(1),g(d)):(c(b,x),e(b,d),f)}function z(a,b){var d=null;if(a.match(k))d="directive";else if(a.match(l))d="hyperlink";else if(a.match(m))d="footnote";else if(a.match(n))d="citation";else return a.eatSpace(),a.eol()?(e(b,a),null):(a.skipToEnd(),c(b,B),"comment");return c(b,A,{start:!0}),d}function A(a,b){var c="body";return!b.ctx.start||a.sol()?D(a,b,c):(a.skipToEnd(),d(b),c)}function B(a,b){return D(a,b,"comment")}function C(a,b){return h?a.sol()?(a.eatSpace()||e(b,a),null):h.token(a,b.ctx.local):D(a,b,"verbatim")}function D(a,b,c){return a.eol()||a.eatSpace()?(a.skipToEnd(),c):(e(b,a),null)}var h=g(b.verbatim),i=g("python"),j=/^[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/,k=/^\s*\w([-:.\w]*\w)?::(\s|$)/,l=/^\s*_[\w-]+:(\s|$)/,m=/^\s*\[(\d+|#)\](\s|$)/,n=/^\s*\[[A-Za-z][\w-]*\](\s|$)/,o=/^\[(\d+|#)\]_/,p=/^\[[A-Za-z][\w-]*\]_/,q=/^\.\.(\s|$)/,r=/^::\s*$/,s=/^[-\s"([{</:]/,t=/^[-\s`'")\]}>/:.,;!?\\_]/,u=/^\s*((\d+|[A-Za-z#])[.)]|\((\d+|[A-Z-a-z#])\))\s/,v=/^\s*[-\+\*]\s/,w=/^\s+(>>>|In \[\d+\]:)\s/;return{startState:function(){return{fn:x,ctx:{}}},copyState:function(a){return{fn:a.fn,ctx:a.ctx}},token:function(a,b){var c=b.fn(a,b);return c}}}),CodeMirror.defineMIME("text/x-rst","rst"),CodeMirror.defineMode("ruby",function(a,b){function c(a){var b={};for(var c=0,d=a.length;c<d;++c)b[a[c]]=!0;return b}function i(a,b,c){return c.tokenize.push(a),a(b,c)}function j(a,b){h=null;if(a.sol()&&a.match("=begin")&&a.eol())return b.tokenize.push(n),"comment";if(a.eatSpace())return null;var c=a.next();if(c=="`"||c=="'"||c=='"'||c=="/")return i(l(c,"string",c=='"'),a,b);if(c=="%"){var d,e=!1;a.eat("s")?d="atom":a.eat(/[WQ]/)?(d="string",e=!0):a.eat(/[wxqr]/)&&(d="string");var f=a.eat(/[^\w\s]/);return f?(g.propertyIsEnumerable(f)&&(f=g[f]),i(l(f,d,e,!0),a,b)):"operator"}if(c=="#")return a.skipToEnd(),"comment";if(c=="<"&&a.eat("<")){a.eat("-"),a.eat(/[\'\"\`]/);var j=a.match(/^\w+/);return a.eat(/[\'\"\`]/),j?i(m(j[0]),a,b):null}if(c=="0")return a.eat("x")?a.eatWhile(/[\da-fA-F]/):a.eat("b")?a.eatWhile(/[01]/):a.eatWhile(/[0-7]/),"number";if(/\d/.test(c))return a.match(/^[\d_]*(?:\.[\d_]+)?(?:[eE][+\-]?[\d_]+)?/),"number";if(c=="?"){while(a.match(/^\\[CM]-/));return a.eat("\\")?a.eatWhile(/\w/):a.next(),"string"}return c==":"?a.eat("'")?i(l("'","atom",!1),a,b):a.eat('"')?i(l('"',"atom",!0),a,b):(a.eatWhile(/[\w\?]/),"atom"):c=="@"?(a.eat("@"),a.eatWhile(/[\w\?]/),"variable-2"):c=="$"?(a.next(),a.eatWhile(/[\w\?]/),"variable-3"):/\w/.test(c)?(a.eatWhile(/[\w\?]/),a.eat(":")?"atom":"ident"):c!="|"||!b.varList&&b.lastTok!="{"&&b.lastTok!="do"?/[\(\)\[\]{}\\;]/.test(c)?(h=c,null):c=="-"&&a.eat(">")?"arrow":/[=+\-\/*:\.^%<>~|]/.test(c)?(a.eatWhile(/[=+\-\/*:\.^%<>~|]/),"operator"):null:(h="|",null)}function k(){var a=1;return function(b,c){if(b.peek()=="}"){a--;if(a==0)return c.tokenize.pop(),c.tokenize[c.tokenize.length-1](b,c)}else b.peek()=="{"&&a++;return j(b,c)}}function l(a,b,c,d){return function(e,f){var g=!1,h;while((h=e.next())!=null){if(h==a&&(d||!g)){f.tokenize.pop();break}if(c&&h=="#"&&!g&&e.eat("{")){f.tokenize.push(k(arguments.callee));break}g=!g&&h=="\\"}return b}}function m(a){return function(b,c){return b.match(a)?c.tokenize.pop():b.skipToEnd(),"string"}}function n(a,b){return a.sol()&&a.match("=end")&&a.eol()&&b.tokenize.pop(),a.skipToEnd(),"comment"}var d=c(["alias","and","BEGIN","begin","break","case","class","def","defined?","do","else","elsif","END","end","ensure","false","for","if","in","module","next","not","or","redo","rescue","retry","return","self","super","then","true","undef","unless","until","when","while","yield","nil","raise","throw","catch","fail","loop","callcc","caller","lambda","proc","public","protected","private","require","load","require_relative","extend","autoload"]),e=c(["def","class","case","for","while","do","module","then","unless","catch","loop","proc"]),f=c(["end","until"]),g={"[":"]","{":"}","(":")"},h;return{startState:function(){return{tokenize:[j],indented:0,context:{type:"top",indented:-a.indentUnit},continuedLine:!1,lastTok:null,varList:!1}},token:function(a,b){a.sol()&&(b.indented=a.indentation());var c=b.tokenize[b.tokenize.length-1](a,b),g;if(c=="ident"){var i=a.current();c=d.propertyIsEnumerable(a.current())?"keyword":/^[A-Z]/.test(i)?"tag":b.lastTok=="def"||b.lastTok=="class"||b.varList?"def":"variable",e.propertyIsEnumerable(i)?g="indent":f.propertyIsEnumerable(i)?g="dedent":i=="if"&&a.column()==a.indentation()&&(g="indent")}if(h||c&&c!="comment")b.lastTok=i||h||c;return h=="|"&&(b.varList=!b.varList),g=="indent"||/[\(\[\{]/.test(h)?b.context={prev:b.context,type:h||c,indented:b.indented}:(g=="dedent"||/[\)\]\}]/.test(h))&&b.context.prev&&(b.context=b.context.prev),a.eol()&&(b.continuedLine=h=="\\"||c=="operator"),c},indent:function(b,c){if(b.tokenize[b.tokenize.length-1]!=j)return 0;var d=c&&c.charAt(0),e=b.context,f=e.type==g[d]||e.type=="keyword"&&/^(?:end|until|else|elsif|when)\b/.test(c);return e.indented+(f?0:a.indentUnit)+(b.continuedLine?a.indentUnit:0)}}}),CodeMirror.defineMIME("text/x-ruby","ruby"),CodeMirror.defineMode("rust",function(){function h(a,b){return f=a,b}function i(a,b){var c=a.next();if(c=='"')return b.tokenize=j,b.tokenize(a,b);if(c=="'")return f="atom",a.eat("\\")?a.skipTo("'")?(a.next(),"string"):"error":(a.next(),a.eat("'")?"string":"error");if(c=="/"){if(a.eat("/"))return a.skipToEnd(),"comment";if(a.eat("*"))return b.tokenize=k(1),b.tokenize(a,b)}if(c=="#")return a.eat("[")?(f="open-attr",null):(a.eatWhile(/\w/),h("macro","meta"));if(c==":"&&a.match(":<"))return h("op",null);if(c.match(/\d/)||c=="."&&a.eat(/\d/)){var d=!1;return!a.match(/^x[\da-f]+/i)&&!a.match(/^b[01]+/)&&(a.eatWhile(/\d/),a.eat(".")&&(d=!0,a.eatWhile(/\d/)),a.match(/^e[+\-]?\d+/i)&&(d=!0)),d?a.match(/^f(?:32|64)/):a.match(/^[ui](?:8|16|32|64)/),h("atom","number")}return c.match(/[()\[\]{}:;,]/)?h(c,null):c=="-"&&a.eat(">")?h("->",null):c.match(e)?(a.eatWhile(e),h("op",null)):(a.eatWhile(/\w/),g=a.current(),a.match(/^::\w/)?(a.backUp(1),h("prefix","variable-2")):b.keywords.propertyIsEnumerable(g)?h(b.keywords[g],g.match(/true|false/)?"atom":"keyword"):h("name","variable"))}function j(a,b){var c,d=!1;while(c=a.next()){if(c=='"'&&!d)return b.tokenize=i,h("atom","string");d=!d&&c=="\\"}return h("op","string")}function k(a){return function(b,c){var d=null,e;while(e=b.next()){if(e=="/"&&d=="*"){if(a==1){c.tokenize=i;break}return c.tokenize=k(a-1),c.tokenize(b,c)}if(e=="*"&&d=="/")return c.tokenize=k(a+1),c.tokenize(b,c);d=e}return"comment"}}function m(){for(var a=arguments.length-1;a>=0;a--)l.cc.push(arguments[a])}function n(){return m.apply(null,arguments),!0}function o(a,b){var c=function(){var c=l.state;c.lexical={indented:c.indented,column:l.stream.column(),type:a,prev:c.lexical,info:b}};return c.lex=!0,c}function p(){var a=l.state;a.lexical.prev&&(a.lexical.type==")"&&(a.indented=a.lexical.indented),a.lexical=a.lexical.prev)}function q(){l.state.keywords=d}function r(){l.state.keywords=c}function s(a,b){function c(d){return d==","?n(a,c):d==b?n():n(c)}return function(d){return d==b?n():m(a,c)}}function t(a){return a=="}"?n():a=="let"?n(o("stat","let"),B,p,t):a=="fn"?n(o("stat"),F,p,t):a=="type"?n(o("stat"),G,u,p,t):a=="tag"?n(o("stat"),H,p,t):a=="mod"?n(o("stat"),J,p,t):a=="open-attr"?n(o("]"),s(v,"]"),p):a=="ignore"||a.match(/[\]\);,]/)?n(t):m(o("stat"),v,p,u,t)}function u(a){return a==";"?n():m()}function v(a){return a=="atom"||a=="name"?n(w):a=="{"?n(o("}"),y,p):a.match(/[\[\(]/)?V(a,v):a.match(/[\]\)\};,]/)?m():a=="if-style"?n(v,v):a=="else-style"||a=="op"?n(v):a=="for"?n(P,D,E,v,v):a=="alt"?n(v,R):a=="fn"?n(F):a=="macro"?n(U):n()}function w(a){return g=="."?n(x):g=="::<"?n(K,w):a=="op"||g==":"?n(v):a=="("||a=="["?V(a,v):m()}function x(a){return g.match(/^\w+$/)?(l.marked="variable",n(w)):m(v)}function y(a){if(a=="op"){if(g=="|")return n(A,p,o("}","block"),t);if(g=="||")return n(p,o("}","block"),t)}return g=="mutable"||g.match(/^\w+$/)&&l.stream.peek()==":"&&!l.stream.match("::",!1)?m(z(v)):m(t)}function z(a){function b(c){return g=="mutable"||g=="with"?(l.marked="keyword",n(b)):g.match(/^\w*$/)?(l.marked="variable",n(b)):c==":"?n(a,b):c=="}"?n():n(b)}return b}function A(a){return a=="name"?(l.marked="def",n(A)):a=="op"&&g=="|"?n():n(A)}function B(a){return a.match(/[\]\)\};]/)?n():g=="="?n(v,C):a==","?n(B):m(P,D,B)}function C(a){return a.match(/[\]\)\};,]/)?m(B):m(v,C)}function D(a){return a==":"?n(q,M,r):m()}function E(a){return a=="name"&&g=="in"?(l.marked="keyword",n()):m()}function F(a){return a=="name"?(l.marked="def",n(F)):g=="<"?n(K,F):a=="{"?m(v):a=="("?n(o(")"),s(L,")"),p,F):a=="->"?n(q,M,r,F):n(F)}function G(a){return a=="name"?(l.marked="def",n(G)):g=="<"?n(K,G):g=="="?n(q,M,r):n(G)}function H(a){return a=="name"?(l.marked="def",n(H)):g=="<"?n(K,H):g=="="?n(q,M,r,u):a=="{"?n(o("}"),q,I,r,p):n(H)}function I(a){return a=="}"?n():a=="("?n(o(")"),s(M,")"),p,I):(g.match(/^\w+$/)&&(l.marked="def"),n(I))}function J(a){return a=="name"?(l.marked="def",n(J)):a=="{"?n(o("}"),t,p):m()}function K(a){return g==">"?n():g==","?n(K):m(M,K)}function L(a){return a=="name"?(l.marked="def",n(L)):a==":"?n(q,M,r):m()}function M(a){return a=="name"?(l.marked="variable-3",n(N)):g=="mutable"?(l.marked="keyword",n(M)):a=="atom"?n(N):a=="op"||a=="obj"?n(M):a=="fn"?n(O):a=="{"?n(o("{"),z(M),p):V(a,M)}function N(a){return g=="<"?n(K):m()}function O(a){return a=="("?n(o("("),s(M,")"),p,O):a=="->"?n(M):m()}function P(a){return a=="name"?(l.marked="def",n(Q)):a=="atom"?n(Q):a=="op"?n(P):a.match(/[\]\)\};,]/)?m():V(a,P)}function Q(a){return a=="op"&&g=="."?n():g=="to"?(l.marked="keyword",n(P)):m()}function R(a){return a=="{"?n(o("}","alt"),S,p):m()}function S(a){return a=="}"?n():a=="|"?n(S):g=="when"?(l.marked="keyword",n(v,T)):a.match(/[\]\);,]/)?n(S):m(P,T)}function T(a){return a=="{"?n(o("}","alt"),t,p,S):m(S)}function U(a){return a.match(/[\[\(\{]/)?V(a,v):m()}function V(a,b){return a=="["?n(o("]"),s(b,"]"),p):a=="("?n(o(")"),s(b,")"),p):a=="{"?n(o("}"),s(b,"}"),p):n()}function W(a,b,c){var d=a.cc;l.state=a,l.stream=b,l.marked=null,l.cc=d;for(;;){var e=d.length?d.pop():t;if(e(f)){while(d.length&&d[d.length-1].lex)d.pop()();return l.marked||c}}}var a=4,b=2,c={"if":"if-style","while":"if-style","else":"else-style","do":"else-style",ret:"else-style",fail:"else-style","break":"atom",cont:"atom","const":"let",resource:"fn",let:"let",fn:"fn","for":"for",alt:"alt",obj:"fn",lambda:"fn",type:"type",tag:"tag",mod:"mod",as:"op","true":"atom","false":"atom",assert:"op",check:"op",claim:"op","native":"ignore",unsafe:"ignore","import":"else-style","export":"else-style",copy:"op",log:"op",log_err:"op",use:"op",bind:"op"},d=function(){var a={fn:"fn",block:"fn",obj:"obj"},b="bool uint int i8 i16 i32 i64 u8 u16 u32 u64 float f32 f64 str char".split(" ");for(var c=0,d=b.length;c<d;++c)a[b[c]]="atom";return a}(),e=/[+\-*&%=<>!?|\.@]/,f,g,l={state:null,stream:null,marked:null,cc:null};return p.lex=q.lex=r.lex=!0,{startState:function(){return{tokenize:i,cc:[],lexical:{indented:-a,column:0,type:"top",align:!1},keywords:c,indented:0}},token:function(a,b){a.sol()&&(b.lexical.hasOwnProperty("align")||(b.lexical.align=!1),b.indented=a.indentation());if(a.eatSpace())return null;f=g=null;var c=b.tokenize(a,b);return c=="comment"?c:(b.lexical.hasOwnProperty("align")||(b.lexical.align=!0),f=="prefix"?c:(g||(g=a.current()),W(b,a,c)))},indent:function(c,d){if(c.tokenize!=i)return 0;var e=d&&d.charAt(0),f=c.lexical,g=f.type,h=e==g;return g=="stat"?f.indented+a:f.align?f.column+(h?0:1):f.indented+(h?0:f.info=="alt"?b:a)},electricChars:"{}"}}),CodeMirror.defineMIME("text/x-rustsrc","rust"),CodeMirror.defineMode("scheme",function(a,b){function l(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function o(a,b,c){this.indent=a,this.type=b,this.prev=c}function p(a,b,c){a.indentStack=new o(b,c,a.indentStack)}function q(a){a.indentStack=a.indentStack.prev}function r(a,b){if(/[0-9]/.exec(a)!=null){b.eatWhile(/[0-9]/),b.eat(/\//),b.eatWhile(/[0-9]/);if(b.eol()||!/[a-zA-Z\-\_\/]/.exec(b.peek()))return!0;b.backUp(b.current().length-1)}return!1}var c="builtin",d="comment",e="string",f="atom",g="number",h="bracket",i="keyword",j=2,k=1,m=l("\u03bb case-lambda call/cc class define-class exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt #f floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? #t tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?"),n=l("define let letrec let* lambda");return{startState:function(){return{indentStack:null,indentation:0,mode:!1,sExprComment:!1}},token:function(a,b){b.indentStack==null&&a.sol()&&(b.indentation=a.indentation());if(a.eatSpace())return null;var i=null;switch(b.mode){case"string":var k,l=!1;while((k=a.next())!=null){if(k=='"'&&!l){b.mode=!1;break}l=!l&&k=="\\"}i=e;break;case"comment":var k,o=!1;while((k=a.next())!=null){if(k=="#"&&o){b.mode=!1;break}o=k=="|"}i=d;break;case"s-expr-comment":b.mode=!1;if(a.peek()=="("||a.peek()=="[")b.sExprComment=0;else{a.eatWhile(/[^/s]/),i=d;break};default:var s=a.next();if(s=='"')b.mode="string",i=e;else if(s=="'")i=f;else if(s=="#")a.eat("|")?(b.mode="comment",i=d):a.eat(/[tf]/)?i=f:a.eat(";")&&(b.mode="s-expr-comment",i=d);else if(s==";")a.skipToEnd(),i=d;else if(s=="-")isNaN(parseInt(a.peek()))?i=null:(a.eatWhile(/[\/0-9]/),i=g);else if(r(s,a))i=g;else if(s=="("||s=="["){var t="",u=a.column();while((letter=a.eat(/[^\s\(\[\;\)\]]/))!=null)t+=letter;t.length>0&&n.propertyIsEnumerable(t)?p(b,u+j,s):(a.eatSpace(),a.eol()||a.peek()==";"?p(b,u+1,s):p(b,u+a.current().length,s)),a.backUp(a.current().length-1),typeof b.sExprComment=="number"&&b.sExprComment++,i=h}else s==")"||s=="]"?(i=h,b.indentStack!=null&&b.indentStack.type==(s==")"?"(":"[")&&(q(b),typeof b.sExprComment=="number"&&--b.sExprComment==0&&(i=d,b.sExprComment=!1))):(a.eatWhile(/[\w\$_\-]/),m&&m.propertyIsEnumerable(a.current())?i=c:i=null)}return typeof b.sExprComment=="number"?d:i},indent:function(a,b){return a.indentStack==null?a.indentation:a.indentStack.indent}}}),CodeMirror.defineMIME("text/x-scheme","scheme"),CodeMirror.defineMode("smalltalk",function(a,b){function e(a,b,c){return b.tokenize=c,c(a,b)}function g(a,b){return f=a,b}function h(a,b){var d=a.next();return d=='"'?e(a,b,j(d)):d=="'"?e(a,b,i(d)):d=="#"?(a.eatWhile(/[\w\$_]/),g("string","string")):d=="$"?(a.next()=="<"&&(a.eatWhile(/\d/),a.eat(/\>/)),g("string","string")):d=="^"||d==":"&&a.eat("=")?g("operator","operator"):/\d/.test(d)?(a.eatWhile(/[\w\.]/),g("number","number")):/[\[\]()]/.test(d)?g(d,null):(a.eatWhile(/[\w\$_]/),c&&c.propertyIsEnumerable(a.current())?g("keyword","keyword"):g("word","variable"))}function i(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d)c.tokenize=h;return g("string","string")}}function j(a){return function(b,c){var d,e=!1;while((d=b.next())!=null)if(d==a){e=!0;break}return e&&(c.tokenize=h),g("comment","comment")}}function k(a,b,c,d,e){this.indented=a,this.column=b,this.type=c,this.align=d,this.prev=e}function l(a,b,c){return a.context=new k(a.indented,b,c,null,a.context)}function m(a){return a.context=a.context.prev}var c={"true":1,"false":1,nil:1,self:1,"super":1,thisContext:1},d=a.indentUnit,f;return{startState:function(a){return{tokenize:h,context:new k((a||0)-d,0,"top",!1),indented:0,startOfLine:!0}},token:function(a,b){var c=b.context;a.sol()&&(c.align==null&&(c.align=!1),b.indented=a.indentation(),b.startOfLine=!0);if(a.eatSpace())return null;var d=b.tokenize(a,b);return f=="comment"?d:(c.align==null&&(c.align=!0),f=="["?l(b,a.column(),"]"):f=="("?l(b,a.column(),")"):f==c.type&&m(b),b.startOfLine=!1,d)},indent:function(a,b){if(a.tokenize!=h)return 0;var c=b&&b.charAt(0),e=a.context,f=c==e.type;return e.align?e.column+(f?0:1):e.indented+(f?0:d)},electricChars:"]"}}),CodeMirror.defineMIME("text/x-stsrc",{name:"smalltalk"}),CodeMirror.defineMode("sparql",function(a){function d(a){return new RegExp("^(?:"+a.join("|")+")$","i")}function h(a,b){var d=a.next();c=null;if(d=="$"||d=="?")return a.match(/^[\w\d]*/),"variable-2";if(d=="<"&&!a.match(/^[\s\u00a0=]/,!1))return a.match(/^[^\s\u00a0>]*>?/),"atom";if(d=='"'||d=="'")return b.tokenize=i(d),b.tokenize(a,b);if(/[{}\(\),\.;\[\]]/.test(d))return c=d,null;if(d=="#")return a.skipToEnd(),"comment";if(g.test(d))return a.eatWhile(g),null;if(d==":")return a.eatWhile(/[\w\d\._\-]/),"atom";a.eatWhile(/[_\w\d]/);if(a.eat(":"))return a.eatWhile(/[\w\d_\-]/),"atom";var h=a.current(),j;return e.test(h)?null:f.test(h)?"keyword":"variable"}function i(a){return function(b,c){var d=!1,e;while((e=b.next())!=null){if(e==a&&!d){c.tokenize=h;break}d=!d&&e=="\\"}return"string"}}function j(a,b,c){a.context={prev:a.context,indent:a.indent,col:c,type:b}}function k(a){a.indent=a.context.indent,a.context=a.context.prev}var b=a.indentUnit,c,e=d(["str","lang","langmatches","datatype","bound","sameterm","isiri","isuri","isblank","isliteral","union","a"]),f=d(["base","prefix","select","distinct","reduced","construct","describe","ask","from","named","where","order","limit","offset","filter","optional","graph","by","asc","desc"]),g=/[*+\-<>=&|]/;return{startState:function(a){return{tokenize:h,context:null,indent:0,col:0}},token:function(a,b){a.sol()&&(b.context&&b.context.align==null&&(b.context.align=!1),b.indent=a.indentation());if(a.eatSpace())return null;var d=b.tokenize(a,b);d!="comment"&&b.context&&b.context.align==null&&b.context.type!="pattern"&&(b.context.align=!0);if(c=="(")j(b,")",a.column());else if(c=="[")j(b,"]",a.column());else if(c=="{")j(b,"}",a.column());else if(/[\]\}\)]/.test(c)){while(b.context&&b.context.type=="pattern")k(b);b.context&&c==b.context.type&&k(b)}else c=="."&&b.context&&b.context.type=="pattern"?k(b):/atom|string|variable/.test(d)&&b.context&&(/[\}\]]/.test(b.context.type)?j(b,"pattern",a.column()):b.context.type=="pattern"&&!b.context.align&&(b.context.align=!0,b.context.col=a.column()));return d},indent:function(a,c){var d=c&&c.charAt(0),e=a.context;if(/[\]\}]/.test(d))while(e&&e.type=="pattern")e=e.prev;var f=e&&d==e.type;return e?e.type=="pattern"?e.col:e.align?e.col+(f?0:1):e.indent+(f?0:b):0}}}),CodeMirror.defineMIME("application/x-sparql-query","sparql"),CodeMirror.defineMode("stex",function(a,b){function c(a,b){a.cmdState.push(b)}function d(a){return a.cmdState.length>0?a.cmdState[a.cmdState.length-1]:null}function e(a){if(a.cmdState.length>0){var b=a.cmdState.pop();b.closeBracket()}}function f(a){var b=a.cmdState;for(var c=b.length-1;c>=0;c--){var d=b[c];if(d.name=="DEFAULT")continue;return d.styleIdentifier()}return null}function g(a,b,c,d){return function(){this.name=a,this.bracketNo=0,this.style=b,this.styles=d,this.brackets=c,this.styleIdentifier=function(a){return this.bracketNo<=this.styles.length?this.styles[this.bracketNo-1]:null},this.openBracket=function(a){return this.bracketNo++,"bracket"},this.closeBracket=function(a){}}}function i(a,b){a.f=b}function j(a,b){if(a.match(/^\\[a-z]+/)){var e=a.current();e=e.substr(1,e.length-1);var g=h[e];return typeof g=="undefined"&&(g=h.DEFAULT),g=new g,c(b,g),i(b,l),g.style}var j=a.next();if(j=="%")return i(b,k),"comment";if(j=="}"||j=="]"){g=d(b);if(g)g.closeBracket(j),i(b,l);else return"error";return"bracket"}return j=="{"||j=="["?(g=h.DEFAULT,g=new g,c(b,g),"bracket"):/\d/.test(j)?(a.eatWhile(/[\w.%]/),"atom"):(a.eatWhile(/[\w-_]/),f(b))}function k(a,b){return a.skipToEnd(),i(b,j),"comment"}function l(a,b){var c=a.peek();if(c=="{"||c=="["){var f=d(b),g=f.openBracket(c);return a.eat(c),i(b,j),"bracket"}return/[ \t\r]/.test(c)?(a.eat(c),null):(i(b,j),f=d(b),f&&e(b),j(a,b))}var h=new Array;return h.importmodule=g("importmodule","tag","{[",["string","builtin"]),h.documentclass=g("documentclass","tag","{[",["","atom"]),h.usepackage=g("documentclass","tag","[",["atom"]),h.begin=g("documentclass","tag","[",["atom"]),h.end=g("documentclass","tag","[",["atom"]),h.DEFAULT=function(){this.name="DEFAULT",this.style="tag",this.styleIdentifier=function(a){},this.openBracket=function(a){},this.closeBracket=function(a){}},{startState:function(){return{f:j,cmdState:[]}},copyState:function(a){return{f:a.f,cmdState:a.cmdState.slice(0,a.cmdState.length)}},token:function(a,b){var c=b.f(a,b),d=a.current();return c}}}),CodeMirror.defineMIME("text/x-stex","stex"),CodeMirror.defineMode("tiddlywiki",function(a,b){function s(a,b,c){return b.tokenize=c,c(a,b)}function t(a,b){var c=!1,d;while((d=a.next())!=null){if(d==b&&!c)return!1;c=!c&&d=="\\"}return c}function w(a,b,c){return u=a,v=c,b}function x(a,b){var c=a.sol(),e,p;b.block=!1,e=a.peek();if(c&&/[<\/\*{}\-]/.test(e)){if(a.match(o))return b.block=!0,s(a,b,B);if(a.match(j))return w("quote","quote");if(a.match(h)||a.match(i))return w("code","code");if(a.match(k)||a.match(l)||a.match(m)||a.match(n))return w("code","code");if(a.match(g))return w("hr","hr")}var e=a.next();if(c&&/[\/\*!#;:>|]/.test(e)){if(e=="!")return a.skipToEnd(),w("header","header");if(e=="*")return a.eatWhile("*"),w("list","list");if(e=="#")return a.eatWhile("#"),w("list","list");if(e==";")return a.eatWhile(";"),w("list","list");if(e==":")return a.eatWhile(":"),w("list","list");if(e==">")return a.eatWhile(">"),w("quote","quote");if(e=="|")return w("table","table")}if(e=="{"&&a.match(/\{\{/))return s(a,b,B);if(/[hf]/i.test(e)&&/[ti]/i.test(a.peek())&&a.match(/\b(ttps?|tp|ile):\/\/[\-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i))return w("link-external","link-external");if(e=='"')return w("string","string");if(/[\[\]]/.test(e)&&a.peek()==e)return a.next(),w("brace","brace");if(e=="@")return a.eatWhile(f),w("link-external","link-external");if(/\d/.test(e))return a.eatWhile(/\d/),w("number","number");if(e=="/"){if(a.eat("%"))return s(a,b,z);if(a.eat("/"))return s(a,b,C)}if(e=="_"&&a.eat("_"))return s(a,b,D);if(e=="-"&&a.eat("-"))return s(a,b,E);if(e=="'"&&a.eat("'"))return s(a,b,A);if(e!="<")return w(e);if(a.eat("<"))return s(a,b,F);a.eatWhile(/[\w\$_]/);var q=a.current(),r=d.propertyIsEnumerable(q)&&d[q];return r?w(r.type,r.style,q):w("text",null,q)}function y(a){return function(b,c){return t(b,a)||(c.tokenize=x),w("string","string")}}function z(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=x;break}c=d=="%"}return w("comment","comment")}function A(a,b){var c=!1,d;while(d=a.next()){if(d=="'"&&c){b.tokenize=x;break}c=d=="'"}return w("text","strong")}function B(a,b){var c,d=b.block;return d&&a.current()?w("code","code"):!d&&a.match(r)?(b.tokenize=x,w("code","code-inline")):d&&a.sol()&&a.match(p)?(b.tokenize=x,w("code","code")):(c=a.next(),d?w("code","code"):w("code","code-inline"))}function C(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=x;break}c=d=="/"}return w("text","em")}function D(a,b){var c=!1,d;while(d=a.next()){if(d=="_"&&c){b.tokenize=x;break}c=d=="_"}return w("text","underlined")}function E(a,b){var c=!1,d,e;while(d=a.next()){if(d=="-"&&c){b.tokenize=x;break}c=d=="-"}return w("text","line-through")}function F(a,b){var c,d,f,g;return a.current()=="<<"?w("brace","macro"):(c=a.next(),c?c==">"&&a.peek()==">"?(a.next(),b.tokenize=x,w("brace","macro")):(a.eatWhile(/[\w\$_]/),f=a.current(),g=e.propertyIsEnumerable(f)&&e[f],g?w(g.type,g.style,f):w("macro",null,f)):(b.tokenize=x,w(c)))}var c=a.indentUnit,d=function(){function a(a){return{type:a,style:"text"}}return{}}(),e=function(){function a(a){return{type:a,style:"macro"}}return{allTags:a("allTags"),closeAll:a("closeAll"),list:a("list"),newJournal:a("newJournal"),newTiddler:a("newTiddler"),permaview:a("permaview"),saveChanges:a("saveChanges"),search:a("search"),slider:a("slider"),tabs:a("tabs"),tag:a("tag"),tagging:a("tagging"),tags:a("tags"),tiddler:a("tiddler"),timeline:a("timeline"),today:a("today"),version:a("version"),option:a("option"),"with":a("with"),filter:a("filter")}}(),f=/[\w_\-]/i,g=/^\-\-\-\-+$/,h=/^\/\*\*\*$/,i=/^\*\*\*\/$/,j=/^<<<$/,k=/^\/\/\{\{\{$/,l=/^\/\/\}\}\}$/,m=/^<!--\{\{\{-->$/,n=/^<!--\}\}\}-->$/,o=/^\{\{\{$/,p=/^\}\}\}$/,q=/\{\{\{/,r=/.*?\}\}\}/,u,v;return{startState:function(a){return{tokenize:x,indented:0,level:0}},token:function(a,b){if(a.eatSpace())return null;var c=b.tokenize(a,b);return c},electricChars:""}}),CodeMirror.defineMIME("text/x-tiddlywiki","tiddlywiki"),CodeMirror.defineMode("velocity",function(a){function b(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}function i(a,b,c){return b.tokenize=c,c(a,b)}function j(a,b){var c=b.beforeParams;b.beforeParams=!1;var h=a.next();if(h!='"'&&h!="'"||!b.inParams){if(/[\[\]{}\(\),;\.]/.test(h))return h=="("&&c?b.inParams=!0:h==")"&&(b.inParams=!1),null;if(/\d/.test(h))return a.eatWhile(/[\w\.]/),"number";if(h=="#"&&a.eat("*"))return i(a,b,l);if(h=="#"&&a.match(/ *\[ *\[/))return i(a,b,m);if(h=="#"&&a.eat("#"))return a.skipToEnd(),"comment";if(h=="$")return a.eatWhile(/[\w\d\$_\.{}]/),f&&f.propertyIsEnumerable(a.current().toLowerCase())?"keyword":(b.beforeParams=!0,"builtin");if(g.test(h))return a.eatWhile(g),"operator";a.eatWhile(/[\w\$_{}]/);var j=a.current().toLowerCase();return d&&d.propertyIsEnumerable(j)?"keyword":e&&e.propertyIsEnumerable(j)||a.current().match(/^#[a-z0-9_]+ *$/i)&&a.peek()=="("?(b.beforeParams=!0,"keyword"):null}return i(a,b,k(h))}function k(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}return f&&(c.tokenize=j),"string"}}function l(a,b){var c=!1,d;while(d=a.next()){if(d=="#"&&c){b.tokenize=j;break}c=d=="*"}return"comment"}function m(a,b){var c=0,d;while(d=a.next()){if(d=="#"&&c==2){b.tokenize=j;break}d=="]"?c++:d!=" "&&(c=0)}return"meta"}var c=a.indentUnit,d=b("#end #else #break #stop #[[ #]] #{end} #{else} #{break} #{stop}"),e=b("#if #elseif #foreach #set #include #parse #macro #define #evaluate #{if} #{elseif} #{foreach} #{set} #{include} #{parse} #{macro} #{define} #{evaluate}"),f=b("$foreach.count $foreach.hasNext $foreach.first $foreach.last $foreach.topmost $foreach.parent $velocityCount"),g=/[+\-*&%=<>!?:\/|]/,h=!0;return{startState:function(a){return{tokenize:j,beforeParams:!1,inParams:!1}},token:function(a,b){return a.eatSpace()?null:b.tokenize(a,b)}}}),CodeMirror.defineMIME("text/velocity","velocity"),CodeMirror.defineMode("xml",function(a,b){function h(a,b){function c(c){return b.tokenize=c,c(a,b)}var d=a.next();if(d=="<"){if(a.eat("!"))return a.eat("[")?a.match("CDATA[")?c(k("atom","]]>")):null:a.match("--")?c(k("comment","-->")):a.match("DOCTYPE",!0,!0)?(a.eatWhile(/[\w\._\-]/),c(k("meta",">"))):null;if(a.eat("?"))return a.eatWhile(/[\w\._\-]/),b.tokenize=k("meta","?>"),"meta";g=a.eat("/")?"closeTag":"openTag",a.eatSpace(),f="";var e;while(e=a.eat(/[^\s\u00a0=<>\"\'\/?]/))f+=e;return b.tokenize=i,"tag"}return d=="&"?(a.eatWhile(/[^;]/),a.eat(";"),"atom"):(a.eatWhile(/[^&<]/),null)}function i(a,b){var c=a.next();return c==">"||c=="/"&&a.eat(">")?(b.tokenize=h,g=c==">"?"endTag":"selfcloseTag","tag"):c=="="?(g="equals",null):/[\'\"]/.test(c)?(b.tokenize=j(c),b.tokenize(a,b)):(a.eatWhile(/[^\s\u00a0=<>\"\'\/?]/),"word")}function j(a){return function(b,c){while(!b.eol())if(b.next()==a){c.tokenize=i;break}return"string"}}function k(a,b){return function(c,d){while(!c.eol()){if(c.match(b)){d.tokenize=h;break}c.next()}return a}}function n(){for(var a=arguments.length-1;a>=0;a--)l.cc.push(arguments[a])}function o(){return n.apply(null,arguments),!0}function p(a,b){var c=d.doNotIndent.hasOwnProperty(a)||l.context&&l.context.noIndent;l.context={prev:l.context,tagName:a,indent:l.indented,startOfLine:b,noIndent:c}}function q(){l.context&&(l.context=l.context.prev)}function r(a){if(a=="openTag")return l.tagName=f,o(u,s(l.startOfLine));if(a=="closeTag"){var b=!1;return l.context?b=l.context.tagName!=f:b=!0,b&&(m="error"),o(t(b))}return a=="string"?((!l.context||l.context.name!="!cdata")&&p("!cdata"),l.tokenize==h&&q(),o()):o()}function s(a){return function(b){return b=="selfcloseTag"||b=="endTag"&&d.autoSelfClosers.hasOwnProperty(l.tagName.toLowerCase())?o():b=="endTag"?(p(l.tagName,a),o()):o()}}function t(a){return function(b){return a&&(m="error"),b=="endTag"?(q(),o()):(m="error",o(arguments.callee))}}function u(a){return a=="word"?(m="attribute",o(u)):a=="equals"?o(v,u):a=="string"?(m="error",o(u)):n()}function v(a){return a=="word"&&d.allowUnquoted?(m="string",o()):a=="string"?o(w):n()}function w(a){return a=="string"?o(w):n()}var c=a.indentUnit,d=b.htmlMode?{autoSelfClosers:{br:!0,img:!0,hr:!0,link:!0,input:!0,meta:!0,col:!0,frame:!0,base:!0,area:!0},doNotIndent:{pre:!0,"!cdata":!0},allowUnquoted:!0}:{autoSelfClosers:{},doNotIndent:{"!cdata":!0},allowUnquoted:!1},e=b.alignCDATA,f,g,l,m;return{startState:function(){return{tokenize:h,cc:[],indented:0,startOfLine:!0,tagName:null,context:null}},token:function(a,b){a.sol()&&(b.startOfLine=!0,b.indented=a.indentation());if(a.eatSpace())return null;m=g=f=null;var c=b.tokenize(a,b);b.type=g;if((c||g)&&c!="comment"){l=b;for(;;){var d=b.cc.pop()||r;if(d(g||c))break}}return b.startOfLine=!1,m||c},indent:function(a,b){var d=a.context;if(d&&d.noIndent)return 0;if(e&&/<!\[CDATA\[/.test(b))return 0;d&&/^<\//.test(b)&&(d=d.prev);while(d&&!d.startOfLine)d=d.prev;return d?d.indent+c:0},compareStates:function(a,b){if(a.indented!=b.indented||a.tokenize!=b.tokenize)return!1;for(var c=a.context,d=b.context;;c=c.prev,d=d.prev){if(!c||!d)return c==d;if(c.tagName!=d.tagName)return!1}},electricChars:"/"}}),CodeMirror.defineMIME("application/xml","xml"),CodeMirror.defineMIME("text/html",{name:"xml",htmlMode:!0}),CodeMirror.defineMode("yaml",function(){var a=["true","false","on","off","yes","no"],b=new RegExp("\\b(("+a.join(")|(")+"))$","i");return{token:function(a,c){var d=a.peek(),e=c.escaped;c.escaped=!1;if(d=="#")return a.skipToEnd(),"comment";if(c.literal&&a.indentation()>c.keyCol)return a.skipToEnd(),"string";c.literal&&(c.literal=!1);if(a.sol()){c.keyCol=0,c.pair=!1,c.pairStart=!1;if(a.match(/---/))return"def";if(a.match(/\.\.\./))return"def";if(a.match(/\s*-\s+/))return"meta"}if(!c.pair&&a.match(/^\s*([a-z0-9\._-])+(?=\s*:)/i))return c.pair=!0,c.keyCol=a.indentation(),"atom";if(c.pair&&a.match(/^:\s*/))return c.pairStart=!0,"meta";if(a.match(/^(\{|\}|\[|\])/))return d=="{"?c.inlinePairs++:d=="}"?c.inlinePairs--:d=="["?c.inlineList++:c.inlineList--,"meta";if(c.inlineList>0&&!e&&d==",")return a.next(),"meta";if(c.inlinePairs>0&&!e&&d==",")return c.keyCol=0,c.pair=!1,c.pairStart=!1,a.next(),"meta";if(c.pairStart){if(a.match(/^\s*(\||\>)\s*/))return c.literal=!0,"meta";if(a.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i))return"variable-2";if(c.inlinePairs==0&&a.match(/^\s*-?[0-9\.\,]+\s?$/))return"number";if(c.inlinePairs>0&&a.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/))return"number";if(a.match(b))return"keyword"}return c.pairStart=!1,c.escaped=d=="\\",a.next(),null},startState:function(){return{pair:!1,pairStart:!1,keyCol:0,inlinePairs:0,inlineList:0,literal:!1,escaped:!1}}}}),CodeMirror.defineMIME("text/x-yaml","yaml")
/**
 * CoffeeScript Compiler v1.1.2
 * http://coffeescript.org
 *
 * Copyright 2011, Jeremy Ashkenas
 * Released under the MIT License
 */
this.CoffeeScript=function(){function require(a){return require[a]}require["./helpers"]=new function(){var a=this;(function(){var b,c;a.starts=function(a,b,c){return b===a.substr(c,b.length)},a.ends=function(a,b,c){var d;d=b.length;return b===a.substr(a.length-d-(c||0),d)},a.compact=function(a){var b,c,d,e;e=[];for(c=0,d=a.length;c<d;c++)b=a[c],b&&e.push(b);return e},a.count=function(a,b){var c,d;c=d=0;if(!b.length)return 1/0;while(d=1+a.indexOf(b,d))c++;return c},a.merge=function(a,c){return b(b({},a),c)},b=a.extend=function(a,b){var c,d;for(c in b)d=b[c],a[c]=d;return a},a.flatten=c=function(a){var b,d,e,f;d=[];for(e=0,f=a.length;e<f;e++)b=a[e],b instanceof Array?d=d.concat(c(b)):d.push(b);return d},a.del=function(a,b){var c;c=a[b],delete a[b];return c},a.last=function(a,b){return a[a.length-(b||0)-1]}}).call(this)},require["./rewriter"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1},u=Array.prototype.slice;a.Rewriter=function(){function a(){}a.prototype.rewrite=function(a){this.tokens=a,this.removeLeadingNewlines(),this.removeMidExpressionNewlines(),this.closeOpenCalls(),this.closeOpenIndexes(),this.addImplicitIndentation(),this.tagPostfixConditionals(),this.addImplicitBraces(),this.addImplicitParentheses(),this.ensureBalance(b),this.rewriteClosingParens();return this.tokens},a.prototype.scanTokens=function(a){var b,c,d;d=this.tokens,b=0;while(c=d[b])b+=a.call(this,c,b,d);return!0},a.prototype.detectEnd=function(a,b,c){var f,g,h,i,j;h=this.tokens,f=0;while(g=h[a]){if(f===0&&b.call(this,g,a))return c.call(this,g,a);if(!g||f<0)return c.call(this,g,a-1);if(i=g[0],t.call(e,i)>=0)f+=1;else if(j=g[0],t.call(d,j)>=0)f-=1;a+=1}return a-1},a.prototype.removeLeadingNewlines=function(){var a,b,c,d;d=this.tokens;for(a=0,c=d.length;a<c;a++){b=d[a][0];if(b!=="TERMINATOR")break}if(a)return this.tokens.splice(0,a)},a.prototype.removeMidExpressionNewlines=function(){return this.scanTokens(function(a,b,d){var e;if(!(a[0]==="TERMINATOR"&&(e=this.tag(b+1),t.call(c,e)>=0)))return 1;d.splice(b,1);return 0})},a.prototype.closeOpenCalls=function(){var a,b;b=function(a,b){var c;return(c=a[0])===")"||c==="CALL_END"||a[0]==="OUTDENT"&&this.tag(b-1)===")"},a=function(a,b){return this.tokens[a[0]==="OUTDENT"?b-1:b][0]="CALL_END"};return this.scanTokens(function(c,d){c[0]==="CALL_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.closeOpenIndexes=function(){var a,b;b=function(a,b){var c;return(c=a[0])==="]"||c==="INDEX_END"},a=function(a,b){return a[0]="INDEX_END"};return this.scanTokens(function(c,d){c[0]==="INDEX_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.addImplicitBraces=function(){var a,b,c,f,g;c=[],f=null,g=0,b=function(a,b){var c,d,e,f,g,h;g=this.tokens.slice(b+1,b+3+1||9e9),c=g[0],f=g[1],e=g[2];if("HERECOMMENT"===(c!=null?c[0]:void 0))return!1;d=a[0];return(d==="TERMINATOR"||d==="OUTDENT")&&(f!=null?f[0]:void 0)!==":"&&((c!=null?c[0]:void 0)!=="@"||(e!=null?e[0]:void 0)!==":")||d===","&&c&&(h=c[0])!=="IDENTIFIER"&&h!=="NUMBER"&&h!=="STRING"&&h!=="@"&&h!=="TERMINATOR"&&h!=="OUTDENT"},a=function(a,b){var c;c=["}","}",a[2]],c.generated=!0;return this.tokens.splice(b,0,c)};return this.scanTokens(function(g,h,i){var j,k,l,m,n,o,p;if(o=l=g[0],t.call(e,o)>=0){c.push([l==="INDENT"&&this.tag(h-1)==="{"?"{":l,h]);return 1}if(t.call(d,l)>=0){f=c.pop();return 1}if(l!==":"||(j=this.tag(h-2))!==":"&&((p=c[c.length-1])!=null?p[0]:void 0)==="{")return 1;c.push(["{"]),k=j==="@"?h-2:h-1;while(this.tag(k-2)==="HERECOMMENT")k-=2;n=new String("{"),n.generated=!0,m=["{",n,g[2]],m.generated=!0,i.splice(k,0,m),this.detectEnd(h+2,b,a);return 2})},a.prototype.addImplicitParentheses=function(){var a,b;b=!1,a=function(a,b){var c;c=a[0]==="OUTDENT"?b+1:b;return this.tokens.splice(c,0,["CALL_END",")",a[2]])};return this.scanTokens(function(c,d,e){var k,m,n,o,p,q,r,s,u,v;r=c[0];if(r==="CLASS"||r==="IF")b=!0;s=e.slice(d-1,d+1+1||9e9),o=s[0],m=s[1],n=s[2],k=!b&&r==="INDENT"&&n&&n.generated&&n[0]==="{"&&o&&(u=o[0],t.call(i,u)>=0),q=!1,p=!1,t.call(l,r)>=0&&(b=!1),o&&!o.spaced&&r==="?"&&(c.call=!0);if(c.fromThen)return 1;if(!(k||(o!=null?o.spaced:void 0)&&(o.call||(v=o[0],t.call(i,v)>=0))&&(t.call(g,r)>=0||!c.spaced&&!c.newLine&&t.call(j,r)>=0)))return 1;e.splice(d,0,["CALL_START","(",c[2]]),this.detectEnd(d+1,function(a,b){var c,d;r=a[0];if(!q&&a.fromThen)return!0;if(r==="IF"||r==="ELSE"||r==="CATCH"||r==="->"||r==="=>")q=!0;if(r==="IF"||r==="ELSE"||r==="SWITCH"||r==="TRY")p=!0;if((r==="."||r==="?."||r==="::")&&this.tag(b-1)==="OUTDENT")return!0;return!a.generated&&this.tag(b-1)!==","&&(t.call(h,r)>=0||r==="INDENT"&&!p)&&(r!=="INDENT"||this.tag(b-2)!=="CLASS"&&(d=this.tag(b-1),t.call(f,d)<0)&&(!(c=this.tokens[b+1])||!c.generated||c[0]!=="{"))},a),o[0]==="?"&&(o[0]="FUNC_EXIST");return 2})},a.prototype.addImplicitIndentation=function(){return this.scanTokens(function(a,b,c){var d,e,f,g,h,i,j,k;i=a[0];if(i==="TERMINATOR"&&this.tag(b+1)==="THEN"){c.splice(b,1);return 0}if(i==="ELSE"&&this.tag(b-1)!=="OUTDENT"){c.splice.apply(c,[b,0].concat(u.call(this.indentation(a))));return 2}if(i==="CATCH"&&((j=this.tag(b+2))==="OUTDENT"||j==="TERMINATOR"||j==="FINALLY")){c.splice.apply(c,[b+2,0].concat(u.call(this.indentation(a))));return 4}if(t.call(n,i)>=0&&this.tag(b+1)!=="INDENT"&&(i!=="ELSE"||this.tag(b+1)!=="IF")){h=i,k=this.indentation(a),f=k[0],g=k[1],h==="THEN"&&(f.fromThen=!0),f.generated=g.generated=!0,c.splice(b+1,0,f),e=function(a,b){var c;return a[1]!==";"&&(c=a[0],t.call(m,c)>=0)&&(a[0]!=="ELSE"||h==="IF"||h==="THEN")},d=function(a,b){return this.tokens.splice(this.tag(b-1)===","?b-1:b,0,g)},this.detectEnd(b+2,e,d),i==="THEN"&&c.splice(b,1);return 1}return 1})},a.prototype.tagPostfixConditionals=function(){var a;a=function(a,b){var c;return(c=a[0])==="TERMINATOR"||c==="INDENT"};return this.scanTokens(function(b,c){var d;if(b[0]!=="IF")return 1;d=b,this.detectEnd(c+1,a,function(a,b){if(a[0]!=="INDENT")return d[0]="POST_"+d[0]});return 1})},a.prototype.ensureBalance=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;d={},f={},m=this.tokens;for(i=0,k=m.length;i<k;i++){h=m[i],g=h[0];for(j=0,l=a.length;j<l;j++){n=a[j],e=n[0],b=n[1],d[e]|=0;if(g===e)d[e]++===0&&(f[e]=h[2]);else if(g===b&&--d[e]<0)throw Error("too many "+h[1]+" on line "+(h[2]+1))}}for(e in d){c=d[e];if(c>0)throw Error("unclosed "+e+" on line "+(f[e]+1))}return this},a.prototype.rewriteClosingParens=function(){var a,b,c;c=[],a={};for(b in k)a[b]=0;return this.scanTokens(function(b,f,g){var h,i,j,l,m,n,o;if(o=m=b[0],t.call(e,o)>=0){c.push(b);return 1}if(t.call(d,m)<0)return 1;if(a[h=k[m]]>0){a[h]-=1,g.splice(f,1);return 0}i=c.pop(),j=i[0],l=k[j];if(m===l)return 1;a[j]+=1,n=[l,j==="INDENT"?i[1]:l],this.tag(f+2)===j?(g.splice(f+3,0,n),c.push(i)):g.splice(f,0,n);return 1})},a.prototype.indentation=function(a){return[["INDENT",2,a[2]],["OUTDENT",2,a[2]]]},a.prototype.tag=function(a){var b;return(b=this.tokens[a])!=null?b[0]:void 0};return a}(),b=[["(",")"],["[","]"],["{","}"],["INDENT","OUTDENT"],["CALL_START","CALL_END"],["PARAM_START","PARAM_END"],["INDEX_START","INDEX_END"]],k={},e=[],d=[];for(q=0,r=b.length;q<r;q++)s=b[q],o=s[0],p=s[1],e.push(k[p]=o),d.push(k[o]=p);c=["CATCH","WHEN","ELSE","FINALLY"].concat(d),i=["IDENTIFIER","SUPER",")","CALL_END","]","INDEX_END","@","THIS"],g=["IDENTIFIER","NUMBER","STRING","JS","REGEX","NEW","PARAM_START","CLASS","IF","TRY","SWITCH","THIS","BOOL","UNARY","SUPER","@","->","=>","[","(","{","--","++"],j=["+","-"],f=["->","=>","{","[",","],h=["POST_IF","FOR","WHILE","UNTIL","WHEN","BY","LOOP","TERMINATOR"],n=["ELSE","->","=>","TRY","FINALLY","THEN"],m=["TERMINATOR","CATCH","FINALLY","ELSE","OUTDENT","LEADING_WHEN"],l=["TERMINATOR","INDENT","OUTDENT"]}).call(this)},require["./lexer"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1};K=require("./rewriter").Rewriter,V=require("./helpers"),R=V.count,U=V.starts,Q=V.compact,T=V.last,a.Lexer=y=function(){function a(){}a.prototype.tokenize=function(a,b){var c;b==null&&(b={}),P.test(a)&&(a="\n"+a),a=a.replace(/\r/g,"").replace(N,""),this.code=a,this.line=b.line||0,this.indent=0,this.indebt=0,this.outdebt=0,this.indents=[],this.tokens=[],c=0;while(this.chunk=a.slice(c))c+=this.identifierToken()||this.commentToken()||this.whitespaceToken()||this.lineToken()||this.heredocToken()||this.stringToken()||this.numberToken()||this.regexToken()||this.jsToken()||this.literalToken();this.closeIndentation();if(b.rewrite===!1)return this.tokens;return(new K).rewrite(this.tokens)},a.prototype.identifierToken=function(){var a,b,c,d,e,i,j,k,l;if(!(e=q.exec(this.chunk)))return 0;d=e[0],c=e[1],a=e[2];if(c==="own"&&this.tag()==="FOR"){this.token("OWN",c);return c.length}b=a||(i=T(this.tokens))&&((k=i[0])==="."||k==="?."||k==="::"||!i.spaced&&i[0]==="@"),j="IDENTIFIER",!b&&(W.call(u,c)>=0||W.call(h,c)>=0)&&(j=c.toUpperCase(),j==="WHEN"&&(l=this.tag(),W.call(v,l)>=0)?j="LEADING_WHEN":j==="FOR"?this.seenFor=!0:j==="UNLESS"?j="IF":W.call(O,j)>=0?j="UNARY":W.call(I,j)>=0&&(j!=="INSTANCEOF"&&this.seenFor?(j="FOR"+j,this.seenFor=!1):(j="RELATION",this.value()==="!"&&(this.tokens.pop(),c="!"+c)))),W.call(t,c)>=0&&(b?(j="IDENTIFIER",c=new String(c),c.reserved=!0):W.call(J,c)>=0&&this.identifierError(c)),b||(W.call(f,c)>=0&&(c=g[c]),j=function(){switch(c){case"!":return"UNARY";case"==":case"!=":return"COMPARE";case"&&":case"||":return"LOGIC";case"true":case"false":case"null":case"undefined":return"BOOL";case"break":case"continue":case"debugger":return"STATEMENT";default:return j}}()),this.token(j,c),a&&this.token(":",":");return d.length},a.prototype.numberToken=function(){var a,b;if(!(a=F.exec(this.chunk)))return 0;b=a[0],this.token("NUMBER",b);return b.length},a.prototype.stringToken=function(){var a,b;switch(this.chunk.charAt(0)){case"'":if(!(a=M.exec(this.chunk)))return 0;this.token("STRING",(b=a[0]).replace(A,"\\\n"));break;case'"':if(!(b=this.balancedString(this.chunk,'"')))return 0;0<b.indexOf("#{",1)?this.interpolateString(b.slice(1,-1)):this.token("STRING",this.escapeLines(b));break;default:return 0}this.line+=R(b,"\n");return b.length},a.prototype.heredocToken=function(){var a,b,c,d;if(!(c=l.exec(this.chunk)))return 0;b=c[0],d=b.charAt(0),a=this.sanitizeHeredoc(c[2],{quote:d,indent:null}),d==='"'&&0<=a.indexOf("#{")?this.interpolateString(a,{heredoc:!0}):this.token("STRING",this.makeString(a,d,!0)),this.line+=R(b,"\n");return b.length},a.prototype.commentToken=function(){var a,b,c;if(!(c=this.chunk.match(i)))return 0;a=c[0],b=c[1],b&&(this.token("HERECOMMENT",this.sanitizeHeredoc(b,{herecomment:!0,indent:Array(this.indent+1).join(" ")})),this.token("TERMINATOR","\n")),this.line+=R(a,"\n");return a.length},a.prototype.jsToken=function(){var a,b;if(this.chunk.charAt(0)!=="`"||!(a=s.exec(this.chunk)))return 0;this.token("JS",(b=a[0]).slice(1,-1));return b.length},a.prototype.regexToken=function(){var a,b,c,d,e;if(this.chunk.charAt(0)!=="/")return 0;if(b=o.exec(this.chunk)){a=this.heregexToken(b),this.line+=R(b[0],"\n");return a}c=T(this.tokens);if(c&&(e=c[0],W.call(c.spaced?C:D,e)>=0))return 0;if(!(b=H.exec(this.chunk)))return 0;d=b[0],this.token("REGEX",d==="//"?"/(?:)/":d);return d.length},a.prototype.heregexToken=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;d=a[0],b=a[1],c=a[2];if(0>b.indexOf("#{")){e=b.replace(p,"").replace(/\//g,"\\/"),this.token("REGEX","/"+(e||"(?:)")+"/"+c);return d.length}this.token("IDENTIFIER","RegExp"),this.tokens.push(["CALL_START","("]),g=[],k=this.interpolateString(b,{regex:!0});for(i=0,j=k.length;i<j;i++){l=k[i],f=l[0],h=l[1];if(f==="TOKENS")g.push.apply(g,h);else{if(!(h=h.replace(p,"")))continue;h=h.replace(/\\/g,"\\\\"),g.push(["STRING",this.makeString(h,'"',!0)])}g.push(["+","+"])}g.pop(),((m=g[0])!=null?m[0]:void 0)!=="STRING"&&this.tokens.push(["STRING",'""'],["+","+"]),(n=this.tokens).push.apply(n,g),c&&this.tokens.push([",",","],["STRING",'"'+c+'"']),this.token(")",")");return d.length},a.prototype.lineToken=function(){var a,b,c,d,e,f;if(!(c=B.exec(this.chunk)))return 0;b=c[0],this.line+=R(b,"\n"),e=T(this.tokens,1),f=b.length-1-b.lastIndexOf("\n"),d=this.unfinished();if(f-this.indebt===this.indent){d?this.suppressNewlines():this.newlineToken();return b.length}if(f>this.indent){if(d){this.indebt=f-this.indent,this.suppressNewlines();return b.length}a=f-this.indent+this.outdebt,this.token("INDENT",a),this.indents.push(a),this.outdebt=this.indebt=0}else this.indebt=0,this.outdentToken(this.indent-f,d);this.indent=f;return b.length},a.prototype.outdentToken=function(a,b,c){var d,e;while(a>0)e=this.indents.length-1,this.indents[e]===void 0?a=0:this.indents[e]===this.outdebt?(a-=this.outdebt,this.outdebt=0):this.indents[e]<this.outdebt?(this.outdebt-=this.indents[e],a-=this.indents[e]):(d=this.indents.pop()-this.outdebt,a-=d,this.outdebt=0,this.token("OUTDENT",d));d&&(this.outdebt-=a),this.tag()!=="TERMINATOR"&&!b&&this.token("TERMINATOR","\n");return this},a.prototype.whitespaceToken=function(){var a,b,c;if(!(a=P.exec(this.chunk))&&!(b=this.chunk.charAt(0)==="\n"))return 0;c=T(this.tokens),c&&(c[a?"spaced":"newLine"]=!0);return a?a[0].length:0},a.prototype.newlineToken=function(){this.tag()!=="TERMINATOR"&&this.token("TERMINATOR","\n");return this},a.prototype.suppressNewlines=function(){this.value()==="\\"&&this.tokens.pop();return this},a.prototype.literalToken=function(){var a,b,c,f,g,h,i,l;(a=G.exec(this.chunk))?(f=a[0],e.test(f)&&this.tagParameters()):f=this.chunk.charAt(0),c=f,b=T(this.tokens);if(f==="="&&b){!b[1].reserved&&(g=b[1],W.call(t,g)>=0)&&this.assignmentError();if((h=b[1])==="||"||h==="&&"){b[0]="COMPOUND_ASSIGN",b[1]+="=";return f.length}}if(f===";")c="TERMINATOR";else if(W.call(z,f)>=0)c="MATH";else if(W.call(j,f)>=0)c="COMPARE";else if(W.call(k,f)>=0)c="COMPOUND_ASSIGN";else if(W.call(O,f)>=0)c="UNARY";else if(W.call(L,f)>=0)c="SHIFT";else if(W.call(x,f)>=0||f==="?"&&(b!=null?b.spaced:void 0))c="LOGIC";else if(b&&!b.spaced)if(f==="("&&(i=b[0],W.call(d,i)>=0))b[0]==="?"&&(b[0]="FUNC_EXIST"),c="CALL_START";else if(f==="["&&(l=b[0],W.call(r,l)>=0)){c="INDEX_START";switch(b[0]){case"?":b[0]="INDEX_SOAK";break;case"::":b[0]="INDEX_PROTO"}}this.token(c,f);return f.length},a.prototype.sanitizeHeredoc=function(a,b){var c,d,e,f,g;e=b.indent,d=b.herecomment;if(d){if(m.test(a))throw new Error('block comment cannot contain "*/", starting on line '+(this.line+1));if(a.indexOf("\n")<=0)return a}else while(f=n.exec(a)){c=f[1];if(e===null||0<(g=c.length)&&g<e.length)e=c}e&&(a=a.replace(RegExp("\\n"+e,"g"),"\n")),d||(a=a.replace(/^\n/,""));return a},a.prototype.tagParameters=function(){var a,b,c,d;if(this.tag()!==")")return this;b=[],d=this.tokens,a=d.length,d[--a][0]="PARAM_END";while(c=d[--a])switch(c[0]){case")":b.push(c);break;case"(":case"CALL_START":if(b.length)b.pop();else{if(c[0]==="("){c[0]="PARAM_START";return this}return this}}return this},a.prototype.closeIndentation=function(){return this.outdentToken(this.indent)},a.prototype.identifierError=function(a){throw SyntaxError('Reserved word "'+a+'" on line '+(this.line+1))},a.prototype.assignmentError=function(){throw SyntaxError('Reserved word "'+this.value()+'" on line '+(this.line+1)+" can't be assigned")},a.prototype.balancedString=function(a,b){var c,d,e,f,g,h;g=[b];for(c=1,h=a.length;1<=h?c<h:c>h;1<=h?c++:c--){switch(d=a.charAt(c)){case"\\":c++;continue;case b:g.pop();if(!g.length)return a.slice(0,c+1);b=g[g.length-1];continue}b!=="}"||d!=='"'&&d!=="'"?b==="}"&&d==="/"&&(e=o.exec(a.slice(c))||H.exec(a.slice(c)))?c+=e[0].length-1:b==="}"&&d==="{"?g.push(b="}"):b==='"'&&f==="#"&&d==="{"&&g.push(b="}"):g.push(b=d),f=d}throw new Error("missing "+g.pop()+", starting on line "+(this.line+1))},a.prototype.interpolateString=function(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;c==null&&(c={}),e=c.heredoc,m=c.regex,o=[],l=0,f=-1;while(j=b.charAt(f+=1)){if(j==="\\"){f+=1;continue}if(j!=="#"||b.charAt(f+1)!=="{"||!(d=this.balancedString(b.slice(f+1),"}")))continue;l<f&&o.push(["NEOSTRING",b.slice(l,f)]),g=d.slice(1,-1);if(g.length){k=(new a).tokenize(g,{line:this.line,rewrite:!1}),k.pop(),((r=k[0])!=null?r[0]:void 0)==="TERMINATOR"&&k.shift();if(i=k.length)i>1&&(k.unshift(["(","("]),k.push([")",")"])),o.push(["TOKENS",k])}f+=d.length,l=f+1}f>l&&l<b.length&&o.push(["NEOSTRING",b.slice(l)]);if(m)return o;if(!o.length)return this.token("STRING",'""');o[0][0]!=="NEOSTRING"&&o.unshift(["",""]),(h=o.length>1)&&this.token("(","(");for(f=0,q=o.length;f<q;f++)s=o[f],n=s[0],p=s[1],f&&this.token("+","+"),n==="TOKENS"?(t=this.tokens).push.apply(t,p):this.token("STRING",this.makeString(p,'"',e));h&&this.token(")",")");return o},a.prototype.token=function(a,b){return this.tokens.push([a,b,this.line])},a.prototype.tag=function(a,b){var c;return(c=T(this.tokens,a))&&(b?c[0]=b:c[0])},a.prototype.value=function(a,b){var c;return(c=T(this.tokens,a))&&(b?c[1]=b:c[1])},a.prototype.unfinished=function(){var a,c;return w.test(this.chunk)||(a=T(this.tokens,1))&&a[0]!=="."&&(c=this.value())&&!c.reserved&&E.test(c)&&!e.test(c)&&!b.test(this.chunk)},a.prototype.escapeLines=function(a,b){return a.replace(A,b?"\\n":"")},a.prototype.makeString=function(a,b,c){if(!a)return b+b;a=a.replace(/\\([\s\S])/g,function(a,c){return c==="\n"||c===b?c:a}),a=a.replace(RegExp(""+b,"g"),"\\$&");return b+this.escapeLines(a,c)+b};return a}(),u=["true","false","null","this","new","delete","typeof","in","instanceof","return","throw","break","continue","debugger","if","else","switch","for","while","do","try","catch","finally","class","extends","super"],h=["undefined","then","unless","until","loop","of","by","when"],g={and:"&&",or:"||",is:"==",isnt:"!=",not:"!",yes:"true",no:"false",on:"true",off:"false"},f=function(){var a;a=[];for(S in g)a.push(S);return a}(),h=h.concat(f),J=["case","default","function","var","void","with","const","let","enum","export","import","native","__hasProp","__extends","__slice","__bind","__indexOf"],t=u.concat(J),a.RESERVED=J.concat(u).concat(h),q=/^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/,F=/^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i,l=/^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/,G=/^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/,P=/^[^\n\S]+/,i=/^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/,e=/^[-=]>/,B=/^(?:\n[^\n\S]*)+/,M=/^'[^\\']*(?:\\.[^\\']*)*'/,s=/^`[^\\`]*(?:\\.[^\\`]*)*`/,H=/^\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/,o=/^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/,p=/\s+(?:#.*)?/g,A=/\n/g,n=/\n+([^\n\S]*)/g,m=/\*\//,b=/^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/,w=/^\s*(?:,|\??\.(?![.\d])|::)/,N=/\s+$/,E=/^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/,k=["-=","+=","/=","*=","%=","||=","&&=","?=","<<=",">>=",">>>=","&=","^=","|="],O=["!","~","NEW","TYPEOF","DELETE","DO"],x=["&&","||","&","|","^"],L=["<<",">>",">>>"],j=["==","!=","<",">","<=",">="],z=["*","/","%"],I=["IN","OF","INSTANCEOF"],c=["TRUE","FALSE","NULL","UNDEFINED"],C=["NUMBER","REGEX","BOOL","++","--","]"],D=C.concat(")","}","THIS","IDENTIFIER","STRING"),d=["IDENTIFIER","STRING","REGEX",")","]","}","?","::","@","THIS","SUPER"],r=d.concat("NUMBER","BOOL"),v=["INDENT","OUTDENT","TERMINATOR"]}).call(this)},require["./parser"]=new function(){var a=this,b=function(){var a={trace:function(){},yy:{},symbols_:{error:2,Root:3,Body:4,Block:5,TERMINATOR:6,Line:7,Expression:8,Statement:9,Return:10,Throw:11,Comment:12,STATEMENT:13,Value:14,Invocation:15,Code:16,Operation:17,Assign:18,If:19,Try:20,While:21,For:22,Switch:23,Class:24,INDENT:25,OUTDENT:26,Identifier:27,IDENTIFIER:28,AlphaNumeric:29,NUMBER:30,STRING:31,Literal:32,JS:33,REGEX:34,BOOL:35,Assignable:36,"=":37,AssignObj:38,ObjAssignable:39,":":40,ThisProperty:41,RETURN:42,HERECOMMENT:43,PARAM_START:44,ParamList:45,PARAM_END:46,FuncGlyph:47,"->":48,"=>":49,OptComma:50,",":51,Param:52,ParamVar:53,"...":54,Array:55,Object:56,Splat:57,SimpleAssignable:58,Accessor:59,Parenthetical:60,Range:61,This:62,".":63,"?.":64,"::":65,Index:66,INDEX_START:67,IndexValue:68,INDEX_END:69,INDEX_SOAK:70,INDEX_PROTO:71,Slice:72,"{":73,AssignList:74,"}":75,CLASS:76,EXTENDS:77,OptFuncExist:78,Arguments:79,SUPER:80,FUNC_EXIST:81,CALL_START:82,CALL_END:83,ArgList:84,THIS:85,"@":86,"[":87,"]":88,RangeDots:89,"..":90,Arg:91,SimpleArgs:92,TRY:93,Catch:94,FINALLY:95,CATCH:96,THROW:97,"(":98,")":99,WhileSource:100,WHILE:101,WHEN:102,UNTIL:103,Loop:104,LOOP:105,ForBody:106,FOR:107,ForStart:108,ForSource:109,ForVariables:110,OWN:111,ForValue:112,FORIN:113,FOROF:114,BY:115,SWITCH:116,Whens:117,ELSE:118,When:119,LEADING_WHEN:120,IfBlock:121,IF:122,POST_IF:123,UNARY:124,"-":125,"+":126,"--":127,"++":128,"?":129,MATH:130,SHIFT:131,COMPARE:132,LOGIC:133,RELATION:134,COMPOUND_ASSIGN:135,$accept:0,$end:1},terminals_:{2:"error",6:"TERMINATOR",13:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"BOOL",37:"=",40:":",42:"RETURN",43:"HERECOMMENT",44:"PARAM_START",46:"PARAM_END",48:"->",49:"=>",51:",",54:"...",63:".",64:"?.",65:"::",67:"INDEX_START",69:"INDEX_END",70:"INDEX_SOAK",71:"INDEX_PROTO",73:"{",75:"}",76:"CLASS",77:"EXTENDS",80:"SUPER",81:"FUNC_EXIST",82:"CALL_START",83:"CALL_END",85:"THIS",86:"@",87:"[",88:"]",90:"..",93:"TRY",95:"FINALLY",96:"CATCH",97:"THROW",98:"(",99:")",101:"WHILE",102:"WHEN",103:"UNTIL",105:"LOOP",107:"FOR",111:"OWN",113:"FORIN",114:"FOROF",115:"BY",116:"SWITCH",118:"ELSE",120:"LEADING_WHEN",122:"IF",123:"POST_IF",124:"UNARY",125:"-",126:"+",127:"--",128:"++",129:"?",130:"MATH",131:"SHIFT",132:"COMPARE",133:"LOGIC",134:"RELATION",135:"COMPOUND_ASSIGN"},productions_:[0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[18,3],[18,5],[38,1],[38,3],[38,5],[38,1],[39,1],[39,1],[39,1],[10,2],[10,1],[12,1],[16,5],[16,2],[47,1],[47,1],[50,0],[50,1],[45,0],[45,1],[45,3],[52,1],[52,2],[52,3],[53,1],[53,1],[53,1],[53,1],[57,2],[58,1],[58,2],[58,2],[58,1],[36,1],[36,1],[36,1],[14,1],[14,1],[14,1],[14,1],[14,1],[59,2],[59,2],[59,2],[59,1],[59,1],[66,3],[66,2],[66,2],[68,1],[68,1],[56,4],[74,0],[74,1],[74,3],[74,4],[74,6],[24,1],[24,2],[24,3],[24,4],[24,2],[24,3],[24,4],[24,5],[15,3],[15,3],[15,1],[15,2],[78,0],[78,1],[79,2],[79,4],[62,1],[62,1],[41,2],[55,2],[55,4],[89,1],[89,1],[61,5],[72,3],[72,2],[72,2],[84,1],[84,3],[84,4],[84,4],[84,6],[91,1],[91,1],[92,1],[92,3],[20,2],[20,3],[20,4],[20,5],[94,3],[11,2],[60,3],[60,5],[100,2],[100,4],[100,2],[100,4],[21,2],[21,2],[21,2],[21,1],[104,2],[104,2],[22,2],[22,2],[22,2],[106,2],[106,2],[108,2],[108,3],[112,1],[112,1],[112,1],[110,1],[110,3],[109,2],[109,2],[109,4],[109,4],[109,4],[109,6],[109,6],[23,5],[23,7],[23,4],[23,6],[117,1],[117,2],[119,3],[119,4],[121,3],[121,5],[19,1],[19,3],[19,3],[19,3],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,5],[17,3]],performAction:function(a,b,c,d,e,f,g){var h=f.length-1;switch(e){case 1:return this.$=new d.Block;case 2:return this.$=f[h];case 3:return this.$=f[h-1];case 4:this.$=d.Block.wrap([f[h]]);break;case 5:this.$=f[h-2].push(f[h]);break;case 6:this.$=f[h-1];break;case 7:this.$=f[h];break;case 8:this.$=f[h];break;case 9:this.$=f[h];break;case 10:this.$=f[h];break;case 11:this.$=f[h];break;case 12:this.$=new d.Literal(f[h]);break;case 13:this.$=f[h];break;case 14:this.$=f[h];break;case 15:this.$=f[h];break;case 16:this.$=f[h];break;case 17:this.$=f[h];break;case 18:this.$=f[h];break;case 19:this.$=f[h];break;case 20:this.$=f[h];break;case 21:this.$=f[h];break;case 22:this.$=f[h];break;case 23:this.$=f[h];break;case 24:this.$=new d.Block;break;case 25:this.$=f[h-1];break;case 26:this.$=new d.Literal(f[h]);break;case 27:this.$=new d.Literal(f[h]);break;case 28:this.$=new d.Literal(f[h]);break;case 29:this.$=f[h];break;case 30:this.$=new d.Literal(f[h]);break;case 31:this.$=new d.Literal(f[h]);break;case 32:this.$=function(){var a;a=new d.Literal(f[h]),f[h]==="undefined"&&(a.isUndefined=!0);return a}();break;case 33:this.$=new d.Assign(f[h-2],f[h]);break;case 34:this.$=new d.Assign(f[h-4],f[h-1]);break;case 35:this.$=new d.Value(f[h]);break;case 36:this.$=new d.Assign(new d.Value(f[h-2]),f[h],"object");break;case 37:this.$=new d.Assign(new d.Value(f[h-4]),f[h-1],"object");break;case 38:this.$=f[h];break;case 39:this.$=f[h];break;case 40:this.$=f[h];break;case 41:this.$=f[h];break;case 42:this.$=new d.Return(f[h]);break;case 43:this.$=new d.Return;break;case 44:this.$=new d.Comment(f[h]);break;case 45:this.$=new d.Code(f[h-3],f[h],f[h-1]);break;case 46:this.$=new d.Code([],f[h],f[h-1]);break;case 47:this.$="func";break;case 48:this.$="boundfunc";break;case 49:this.$=f[h];break;case 50:this.$=f[h];break;case 51:this.$=[];break;case 52:this.$=[f[h]];break;case 53:this.$=f[h-2].concat(f[h]);break;case 54:this.$=new d.Param(f[h]);break;case 55:this.$=new d.Param(f[h-1],null,!0);break;case 56:this.$=new d.Param(f[h-2],f[h]);break;case 57:this.$=f[h];break;case 58:this.$=f[h];break;case 59:this.$=f[h];break;case 60:this.$=f[h];break;case 61:this.$=new d.Splat(f[h-1]);break;case 62:this.$=new d.Value(f[h]);break;case 63:this.$=f[h-1].push(f[h]);break;case 64:this.$=new d.Value(f[h-1],[f[h]]);break;case 65:this.$=f[h];break;case 66:this.$=f[h];break;case 67:this.$=new d.Value(f[h]);break;case 68:this.$=new d.Value(f[h]);break;case 69:this.$=f[h];break;case 70:this.$=new d.Value(f[h]);break;case 71:this.$=new d.Value(f[h]);break;case 72:this.$=new d.Value(f[h]);break;case 73:this.$=f[h];break;case 74:this.$=new d.Access(f[h]);break;case 75:this.$=new d.Access(f[h],"soak");break;case 76:this.$=new d.Access(f[h],"proto");break;case 77:this.$=new d.Access(new d.Literal("prototype"));break;case 78:this.$=f[h];break;case 79:this.$=f[h-1];break;case 80:this.$=d.extend(f[h],{soak:!0});break;case 81:this.$=d.extend(f[h],{proto:!0});break;case 82:this.$=new d.Index(f[h]);break;case 83:this.$=new d.Slice(f[h]);break;case 84:this.$=new d.Obj(f[h-2],f[h-3].generated);break;case 85:this.$=[];break;case 86:this.$=[f[h]];break;case 87:this.$=f[h-2].concat(f[h]);break;case 88:this.$=f[h-3].concat(f[h]);break;case 89:this.$=f[h-5].concat(f[h-2]);break;case 90:this.$=new d.Class;break;case 91:this.$=new d.Class(null,null,f[h]);break;case 92:this.$=new d.Class(null,f[h]);break;case 93:this.$=new d.Class(null,f[h-1],f[h]);break;case 94:this.$=new d.Class(f[h]);break;case 95:this.$=new d.Class(f[h-1],null,f[h]);break;case 96:this.$=new d.Class(f[h-2],f[h]);break;case 97:this.$=new d.Class(f[h-3],f[h-1],f[h]);break;case 98:this.$=new d.Call(f[h-2],f[h],f[h-1]);break;case 99:this.$=new d.Call(f[h-2],f[h],f[h-1]);break;case 100:this.$=new d.Call("super",[new d.Splat(new d.Literal("arguments"))]);break;case 101:this.$=new d.Call("super",f[h]);break;case 102:this.$=!1;break;case 103:this.$=!0;break;case 104:this.$=[];break;case 105:this.$=f[h-2];break;case 106:this.$=new d.Value(new d.Literal("this"));break;case 107:this.$=new d.Value(new d.Literal("this"));break;case 108:this.$=new d.Value(new d.Literal("this"),[new d.Access(f[h])],"this");break;case 109:this.$=new d.Arr([]);break;case 110:this.$=new d.Arr(f[h-2]);break;case 111:this.$="inclusive";break;case 112:this.$="exclusive";break;case 113:this.$=new d.Range(f[h-3],f[h-1],f[h-2]);break;case 114:this.$=new d.Range(f[h-2],f[h],f[h-1]);break;case 115:this.$=new d.Range(f[h-1],null,f[h]);break;case 116:this.$=new d.Range(null,f[h],f[h-1]);break;case 117:this.$=[f[h]];break;case 118:this.$=f[h-2].concat(f[h]);break;case 119:this.$=f[h-3].concat(f[h]);break;case 120:this.$=f[h-2];break;case 121:this.$=f[h-5].concat(f[h-2]);break;case 122:this.$=f[h];break;case 123:this.$=f[h];break;case 124:this.$=f[h];break;case 125:this.$=[].concat(f[h-2],f[h]);break;case 126:this.$=new d.Try(f[h]);break;case 127:this.$=new d.Try(f[h-1],f[h][0],f[h][1]);break;case 128:this.$=new d.Try(f[h-2],null,null,f[h]);break;case 129:this.$=new d.Try(f[h-3],f[h-2][0],f[h-2][1],f[h]);break;case 130:this.$=[f[h-1],f[h]];break;case 131:this.$=new d.Throw(f[h]);break;case 132:this.$=new d.Parens(f[h-1]);break;case 133:this.$=new d.Parens(f[h-2]);break;case 134:this.$=new d.While(f[h]);break;case 135:this.$=new d.While(f[h-2],{guard:f[h]});break;case 136:this.$=new d.While(f[h],{invert:!0});break;case 137:this.$=new d.While(f[h-2],{invert:!0,guard:f[h]});break;case 138:this.$=f[h-1].addBody(f[h]);break;case 139:this.$=f[h].addBody(d.Block.wrap([f[h-1]]));break;case 140:this.$=f[h].addBody(d.Block.wrap([f[h-1]]));break;case 141:this.$=f[h];break;case 142:this.$=(new d.While(new d.Literal("true"))).addBody(f[h]);break;case 143:this.$=(new d.While(new d.Literal("true"))).addBody(d.Block.wrap([f[h]]));break;case 144:this.$=new d.For(f[h-1],f[h]);break;case 145:this.$=new d.For(f[h-1],f[h]);break;case 146:this.$=new d.For(f[h],f[h-1]);break;case 147:this.$={source:new d.Value(f[h])};break;case 148:this.$=function(){f[h].own=f[h-1].own,f[h].name=f[h-1][0],f[h].index=f[h-1][1];return f[h]}();break;case 149:this.$=f[h];break;case 150:this.$=function(){f[h].own=!0;return f[h]}();break;case 151:this.$=f[h];break;case 152:this.$=new d.Value(f[h]);break;case 153:this.$=new d.Value(f[h]);break;case 154:this.$=[f[h]];break;case 155:this.$=[f[h-2],f[h]];break;case 156:this.$={source:f[h]};break;case 157:this.$={source:f[h],object:!0};break;case 158:this.$={source:f[h-2],guard:f[h]};break;case 159:this.$={source:f[h-2],guard:f[h],object:!0};break;case 160:this.$={source:f[h-2],step:f[h]};break;case 161:this.$={source:f[h-4],guard:f[h-2],step:f[h]};break;case 162:this.$={source:f[h-4],step:f[h-2],guard:f[h]};break;case 163:this.$=new d.Switch(f[h-3],f[h-1]);break;case 164:this.$=new d.Switch(f[h-5],f[h-3],f[h-1]);break;case 165:this.$=new d.Switch(null,f[h-1]);break;case 166:this.$=new d.Switch(null,f[h-3],f[h-1]);break;case 167:this.$=f[h];break;case 168:this.$=f[h-1].concat(f[h]);break;case 169:this.$=[[f[h-1],f[h]]];break;case 170:this.$=[[f[h-2],f[h-1]]];break;case 171:this.$=new d.If(f[h-1],f[h],{type:f[h-2]});break;case 172:this.$=f[h-4].addElse(new d.If(f[h-1],f[h],{type:f[h-2]}));break;case 173:this.$=f[h];break;case 174:this.$=f[h-2].addElse(f[h]);break;case 175:this.$=new d.If(f[h],d.Block.wrap([f[h-2]]),{type:f[h-1],statement:!0});break;case 176:this.$=new d.If(f[h],d.Block.wrap([f[h-2]]),{type:f[h-1],statement:!0});break;case 177:this.$=new d.Op(f[h-1],f[h]);break;case 178:this.$=new d.Op("-",f[h]);break;case 179:this.$=new d.Op("+",f[h]);break;case 180:this.$=new d.Op("--",f[h]);break;case 181:this.$=new d.Op("++",f[h]);break;case 182:this.$=new d.Op("--",f[h-1],null,!0);break;case 183:this.$=new d.Op("++",f[h-1],null,!0);break;case 184:this.$=new d.Existence(f[h-1]);break;case 185:this.$=new d.Op("+",f[h-2],f[h]);break;case 186:this.$=new d.Op("-",f[h-2],f[h]);break;case 187:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 188:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 189:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 190:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 191:this.$=function(){return f[h-1].charAt(0)==="!"?(new d.Op(f[h-1].slice(1),f[h-2],f[h])).invert():new d.Op(f[h-1],f[h-2],f[h])}();break;case 192:this.$=new d.Assign(f[h-2],f[h],f[h-1]);break;case 193:this.$=new d.Assign(f[h-4],f[h-1],f[h-3]);break;case 194:this.$=new d.Extends(f[h-2],f[h])}},table:[{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[3]},{1:[2,2],6:[1,71]},{6:[1,72]},{1:[2,4],6:[2,4],26:[2,4],99:[2,4]},{4:74,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[1,73],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,7],6:[2,7],26:[2,7],99:[2,7],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,8],6:[2,8],26:[2,8],99:[2,8],100:87,101:[1,62],103:[1,63],106:88,107:[1,65],108:66,123:[1,86]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],46:[2,13],51:[2,13],54:[2,13],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,13],70:[1,97],71:[1,98],75:[2,13],78:89,81:[1,91],82:[2,102],83:[2,13],88:[2,13],90:[2,13],99:[2,13],101:[2,13],102:[2,13],103:[2,13],107:[2,13],115:[2,13],123:[2,13],125:[2,13],126:[2,13],129:[2,13],130:[2,13],131:[2,13],132:[2,13],133:[2,13],134:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],46:[2,14],51:[2,14],54:[2,14],59:100,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,14],70:[1,97],71:[1,98],75:[2,14],78:99,81:[1,91],82:[2,102],83:[2,14],88:[2,14],90:[2,14],99:[2,14],101:[2,14],102:[2,14],103:[2,14],107:[2,14],115:[2,14],123:[2,14],125:[2,14],126:[2,14],129:[2,14],130:[2,14],131:[2,14],132:[2,14],133:[2,14],134:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],46:[2,15],51:[2,15],54:[2,15],69:[2,15],75:[2,15],83:[2,15],88:[2,15],90:[2,15],99:[2,15],101:[2,15],102:[2,15],103:[2,15],107:[2,15],115:[2,15],123:[2,15],125:[2,15],126:[2,15],129:[2,15],130:[2,15],131:[2,15],132:[2,15],133:[2,15],134:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],46:[2,16],51:[2,16],54:[2,16],69:[2,16],75:[2,16],83:[2,16],88:[2,16],90:[2,16],99:[2,16],101:[2,16],102:[2,16],103:[2,16],107:[2,16],115:[2,16],123:[2,16],125:[2,16],126:[2,16],129:[2,16],130:[2,16],131:[2,16],132:[2,16],133:[2,16],134:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],46:[2,17],51:[2,17],54:[2,17],69:[2,17],75:[2,17],83:[2,17],88:[2,17],90:[2,17],99:[2,17],101:[2,17],102:[2,17],103:[2,17],107:[2,17],115:[2,17],123:[2,17],125:[2,17],126:[2,17],129:[2,17],130:[2,17],131:[2,17],132:[2,17],133:[2,17],134:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],46:[2,18],51:[2,18],54:[2,18],69:[2,18],75:[2,18],83:[2,18],88:[2,18],90:[2,18],99:[2,18],101:[2,18],102:[2,18],103:[2,18],107:[2,18],115:[2,18],123:[2,18],125:[2,18],126:[2,18],129:[2,18],130:[2,18],131:[2,18],132:[2,18],133:[2,18],134:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],46:[2,19],51:[2,19],54:[2,19],69:[2,19],75:[2,19],83:[2,19],88:[2,19],90:[2,19],99:[2,19],101:[2,19],102:[2,19],103:[2,19],107:[2,19],115:[2,19],123:[2,19],125:[2,19],126:[2,19],129:[2,19],130:[2,19],131:[2,19],132:[2,19],133:[2,19],134:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],46:[2,20],51:[2,20],54:[2,20],69:[2,20],75:[2,20],83:[2,20],88:[2,20],90:[2,20],99:[2,20],101:[2,20],102:[2,20],103:[2,20],107:[2,20],115:[2,20],123:[2,20],125:[2,20],126:[2,20],129:[2,20],130:[2,20],131:[2,20],132:[2,20],133:[2,20],134:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],46:[2,21],51:[2,21],54:[2,21],69:[2,21],75:[2,21],83:[2,21],88:[2,21],90:[2,21],99:[2,21],101:[2,21],102:[2,21],103:[2,21],107:[2,21],115:[2,21],123:[2,21],125:[2,21],126:[2,21],129:[2,21],130:[2,21],131:[2,21],132:[2,21],133:[2,21],134:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],46:[2,22],51:[2,22],54:[2,22],69:[2,22],75:[2,22],83:[2,22],88:[2,22],90:[2,22],99:[2,22],101:[2,22],102:[2,22],103:[2,22],107:[2,22],115:[2,22],123:[2,22],125:[2,22],126:[2,22],129:[2,22],130:[2,22],131:[2,22],132:[2,22],133:[2,22],134:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],46:[2,23],51:[2,23],54:[2,23],69:[2,23],75:[2,23],83:[2,23],88:[2,23],90:[2,23],99:[2,23],101:[2,23],102:[2,23],103:[2,23],107:[2,23],115:[2,23],123:[2,23],125:[2,23],126:[2,23],129:[2,23],130:[2,23],131:[2,23],132:[2,23],133:[2,23],134:[2,23]},{1:[2,9],6:[2,9],26:[2,9],99:[2,9],101:[2,9],103:[2,9],107:[2,9],123:[2,9]},{1:[2,10],6:[2,10],26:[2,10],99:[2,10],101:[2,10],103:[2,10],107:[2,10],123:[2,10]},{1:[2,11],6:[2,11],26:[2,11],99:[2,11],101:[2,11],103:[2,11],107:[2,11],123:[2,11]},{1:[2,12],6:[2,12],26:[2,12],99:[2,12],101:[2,12],103:[2,12],107:[2,12],123:[2,12]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],37:[1,101],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],67:[2,69],69:[2,69],70:[2,69],71:[2,69],75:[2,69],81:[2,69],82:[2,69],83:[2,69],88:[2,69],90:[2,69],99:[2,69],101:[2,69],102:[2,69],103:[2,69],107:[2,69],115:[2,69],123:[2,69],125:[2,69],126:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],46:[2,70],51:[2,70],54:[2,70],63:[2,70],64:[2,70],65:[2,70],67:[2,70],69:[2,70],70:[2,70],71:[2,70],75:[2,70],81:[2,70],82:[2,70],83:[2,70],88:[2,70],90:[2,70],99:[2,70],101:[2,70],102:[2,70],103:[2,70],107:[2,70],115:[2,70],123:[2,70],125:[2,70],126:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70],134:[2,70]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],46:[2,71],51:[2,71],54:[2,71],63:[2,71],64:[2,71],65:[2,71],67:[2,71],69:[2,71],70:[2,71],71:[2,71],75:[2,71],81:[2,71],82:[2,71],83:[2,71],88:[2,71],90:[2,71],99:[2,71],101:[2,71],102:[2,71],103:[2,71],107:[2,71],115:[2,71],123:[2,71],125:[2,71],126:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71],134:[2,71]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],46:[2,72],51:[2,72],54:[2,72],63:[2,72],64:[2,72],65:[2,72],67:[2,72],69:[2,72],70:[2,72],71:[2,72],75:[2,72],81:[2,72],82:[2,72],83:[2,72],88:[2,72],90:[2,72],99:[2,72],101:[2,72],102:[2,72],103:[2,72],107:[2,72],115:[2,72],123:[2,72],125:[2,72],126:[2,72],129:[2,72],130:[2,72],131:[2,72],132:[2,72],133:[2,72],134:[2,72]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],46:[2,73],51:[2,73],54:[2,73],63:[2,73],64:[2,73],65:[2,73],67:[2,73],69:[2,73],70:[2,73],71:[2,73],75:[2,73],81:[2,73],82:[2,73],83:[2,73],88:[2,73],90:[2,73],99:[2,73],101:[2,73],102:[2,73],103:[2,73],107:[2,73],115:[2,73],123:[2,73],125:[2,73],126:[2,73],129:[2,73],130:[2,73],131:[2,73],132:[2,73],133:[2,73],134:[2,73]},{1:[2,100],6:[2,100],25:[2,100],26:[2,100],46:[2,100],51:[2,100],54:[2,100],63:[2,100],64:[2,100],65:[2,100],67:[2,100],69:[2,100],70:[2,100],71:[2,100],75:[2,100],79:102,81:[2,100],82:[1,103],83:[2,100],88:[2,100],90:[2,100],99:[2,100],101:[2,100],102:[2,100],103:[2,100],107:[2,100],115:[2,100],123:[2,100],125:[2,100],126:[2,100],129:[2,100],130:[2,100],131:[2,100],132:[2,100],133:[2,100],134:[2,100]},{27:107,28:[1,70],41:108,45:104,46:[2,51],51:[2,51],52:105,53:106,55:109,56:110,73:[1,67],86:[1,111],87:[1,112]},{5:113,25:[1,5]},{8:114,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:116,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:117,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{14:119,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:118,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{14:119,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:122,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],37:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,66],70:[2,66],71:[2,66],75:[2,66],77:[1,126],81:[2,66],82:[2,66],83:[2,66],88:[2,66],90:[2,66],99:[2,66],101:[2,66],102:[2,66],103:[2,66],107:[2,66],115:[2,66],123:[2,66],125:[2,66],126:[2,66],127:[1,123],128:[1,124],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[2,66],135:[1,125]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],46:[2,173],51:[2,173],54:[2,173],69:[2,173],75:[2,173],83:[2,173],88:[2,173],90:[2,173],99:[2,173],101:[2,173],102:[2,173],103:[2,173],107:[2,173],115:[2,173],118:[1,127],123:[2,173],125:[2,173],126:[2,173],129:[2,173],130:[2,173],131:[2,173],132:[2,173],133:[2,173],134:[2,173]},{5:128,25:[1,5]},{5:129,25:[1,5]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],46:[2,141],51:[2,141],54:[2,141],69:[2,141],75:[2,141],83:[2,141],88:[2,141],90:[2,141],99:[2,141],101:[2,141],102:[2,141],103:[2,141],107:[2,141],115:[2,141],123:[2,141],125:[2,141],126:[2,141],129:[2,141],130:[2,141],131:[2,141],132:[2,141],133:[2,141],134:[2,141]},{5:130,25:[1,5]},{8:131,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,132],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,90],5:133,6:[2,90],14:119,15:120,25:[1,5],26:[2,90],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,46:[2,90],51:[2,90],54:[2,90],55:47,56:48,58:135,60:25,61:26,62:27,69:[2,90],73:[1,67],75:[2,90],77:[1,134],80:[1,28],83:[2,90],85:[1,55],86:[1,56],87:[1,54],88:[2,90],90:[2,90],98:[1,53],99:[2,90],101:[2,90],102:[2,90],103:[2,90],107:[2,90],115:[2,90],123:[2,90],125:[2,90],126:[2,90],129:[2,90],130:[2,90],131:[2,90],132:[2,90],133:[2,90],134:[2,90]},{1:[2,43],6:[2,43],8:136,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,43],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],99:[2,43],100:39,101:[2,43],103:[2,43],104:40,105:[1,64],106:41,107:[2,43],108:66,116:[1,42],121:37,122:[1,61],123:[2,43],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:137,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,44],6:[2,44],25:[2,44],26:[2,44],51:[2,44],75:[2,44],99:[2,44],101:[2,44],103:[2,44],107:[2,44],123:[2,44]},{1:[2,67],6:[2,67],25:[2,67],26:[2,67],37:[2,67],46:[2,67],51:[2,67],54:[2,67],63:[2,67],64:[2,67],65:[2,67],67:[2,67],69:[2,67],70:[2,67],71:[2,67],75:[2,67],81:[2,67],82:[2,67],83:[2,67],88:[2,67],90:[2,67],99:[2,67],101:[2,67],102:[2,67],103:[2,67],107:[2,67],115:[2,67],123:[2,67],125:[2,67],126:[2,67],129:[2,67],130:[2,67],131:[2,67],132:[2,67],133:[2,67],134:[2,67]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],37:[2,68],46:[2,68],51:[2,68],54:[2,68],63:[2,68],64:[2,68],65:[2,68],67:[2,68],69:[2,68],70:[2,68],71:[2,68],75:[2,68],81:[2,68],82:[2,68],83:[2,68],88:[2,68],90:[2,68],99:[2,68],101:[2,68],102:[2,68],103:[2,68],107:[2,68],115:[2,68],123:[2,68],125:[2,68],126:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68],134:[2,68]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],46:[2,29],51:[2,29],54:[2,29],63:[2,29],64:[2,29],65:[2,29],67:[2,29],69:[2,29],70:[2,29],71:[2,29],75:[2,29],81:[2,29],82:[2,29],83:[2,29],88:[2,29],90:[2,29],99:[2,29],101:[2,29],102:[2,29],103:[2,29],107:[2,29],115:[2,29],123:[2,29],125:[2,29],126:[2,29],129:[2,29],130:[2,29],131:[2,29],132:[2,29],133:[2,29],134:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],46:[2,30],51:[2,30],54:[2,30],63:[2,30],64:[2,30],65:[2,30],67:[2,30],69:[2,30],70:[2,30],71:[2,30],75:[2,30],81:[2,30],82:[2,30],83:[2,30],88:[2,30],90:[2,30],99:[2,30],101:[2,30],102:[2,30],103:[2,30],107:[2,30],115:[2,30],123:[2,30],125:[2,30],126:[2,30],129:[2,30],130:[2,30],131:[2,30],132:[2,30],133:[2,30],134:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],46:[2,31],51:[2,31],54:[2,31],63:[2,31],64:[2,31],65:[2,31],67:[2,31],69:[2,31],70:[2,31],71:[2,31],75:[2,31],81:[2,31],82:[2,31],83:[2,31],88:[2,31],90:[2,31],99:[2,31],101:[2,31],102:[2,31],103:[2,31],107:[2,31],115:[2,31],123:[2,31],125:[2,31],126:[2,31],129:[2,31],130:[2,31],131:[2,31],132:[2,31],133:[2,31],134:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],46:[2,32],51:[2,32],54:[2,32],63:[2,32],64:[2,32],65:[2,32],67:[2,32],69:[2,32],70:[2,32],71:[2,32],75:[2,32],81:[2,32],82:[2,32],83:[2,32],88:[2,32],90:[2,32],99:[2,32],101:[2,32],102:[2,32],103:[2,32],107:[2,32],115:[2,32],123:[2,32],125:[2,32],126:[2,32],129:[2,32],130:[2,32],131:[2,32],132:[2,32],133:[2,32],134:[2,32]},{4:138,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,139],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:140,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:142,85:[1,55],86:[1,56],87:[1,54],88:[1,141],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],46:[2,106],51:[2,106],54:[2,106],63:[2,106],64:[2,106],65:[2,106],67:[2,106],69:[2,106],70:[2,106],71:[2,106],75:[2,106],81:[2,106],82:[2,106],83:[2,106],88:[2,106],90:[2,106],99:[2,106],101:[2,106],102:[2,106],103:[2,106],107:[2,106],115:[2,106],123:[2,106],125:[2,106],126:[2,106],129:[2,106],130:[2,106],131:[2,106],132:[2,106],133:[2,106],134:[2,106]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],27:146,28:[1,70],46:[2,107],51:[2,107],54:[2,107],63:[2,107],64:[2,107],65:[2,107],67:[2,107],69:[2,107],70:[2,107],71:[2,107],75:[2,107],81:[2,107],82:[2,107],83:[2,107],88:[2,107],90:[2,107],99:[2,107],101:[2,107],102:[2,107],103:[2,107],107:[2,107],115:[2,107],123:[2,107],125:[2,107],126:[2,107],129:[2,107],130:[2,107],131:[2,107],132:[2,107],133:[2,107],134:[2,107]},{25:[2,47]},{25:[2,48]},{1:[2,62],6:[2,62],25:[2,62],26:[2,62],37:[2,62],46:[2,62],51:[2,62],54:[2,62],63:[2,62],64:[2,62],65:[2,62],67:[2,62],69:[2,62],70:[2,62],71:[2,62],75:[2,62],77:[2,62],81:[2,62],82:[2,62],83:[2,62],88:[2,62],90:[2,62],99:[2,62],101:[2,62],102:[2,62],103:[2,62],107:[2,62],115:[2,62],123:[2,62],125:[2,62],126:[2,62],127:[2,62],128:[2,62],129:[2,62],130:[2,62],131:[2,62],132:[2,62],133:[2,62],134:[2,62],135:[2,62]},{1:[2,65],6:[2,65],25:[2,65],26:[2,65],37:[2,65],46:[2,65],51:[2,65],54:[2,65],63:[2,65],64:[2,65],65:[2,65],67:[2,65],69:[2,65],70:[2,65],71:[2,65],75:[2,65],77:[2,65],81:[2,65],82:[2,65],83:[2,65],88:[2,65],90:[2,65],99:[2,65],101:[2,65],102:[2,65],103:[2,65],107:[2,65],115:[2,65],123:[2,65],125:[2,65],126:[2,65],127:[2,65],128:[2,65],129:[2,65],130:[2,65],131:[2,65],132:[2,65],133:[2,65],134:[2,65],135:[2,65]},{8:147,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:148,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:149,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{5:150,8:151,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{27:156,28:[1,70],55:157,56:158,61:152,73:[1,67],87:[1,54],110:153,111:[1,154],112:155},{109:159,113:[1,160],114:[1,161]},{6:[2,85],12:165,25:[2,85],27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:163,39:164,41:168,43:[1,46],51:[2,85],74:162,75:[2,85],86:[1,111]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],40:[2,27],46:[2,27],51:[2,27],54:[2,27],63:[2,27],64:[2,27],65:[2,27],67:[2,27],69:[2,27],70:[2,27],71:[2,27],75:[2,27],81:[2,27],82:[2,27],83:[2,27],88:[2,27],90:[2,27],99:[2,27],101:[2,27],102:[2,27],103:[2,27],107:[2,27],115:[2,27],123:[2,27],125:[2,27],126:[2,27],129:[2,27],130:[2,27],131:[2,27],132:[2,27],133:[2,27],134:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],40:[2,28],46:[2,28],51:[2,28],54:[2,28],63:[2,28],64:[2,28],65:[2,28],67:[2,28],69:[2,28],70:[2,28],71:[2,28],75:[2,28],81:[2,28],82:[2,28],83:[2,28],88:[2,28],90:[2,28],99:[2,28],101:[2,28],102:[2,28],103:[2,28],107:[2,28],115:[2,28],123:[2,28],125:[2,28],126:[2,28],129:[2,28],130:[2,28],131:[2,28],132:[2,28],133:[2,28],134:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],37:[2,26],40:[2,26],46:[2,26],51:[2,26],54:[2,26],63:[2,26],64:[2,26],65:[2,26],67:[2,26],69:[2,26],70:[2,26],71:[2,26],75:[2,26],77:[2,26],81:[2,26],82:[2,26],83:[2,26],88:[2,26],90:[2,26],99:[2,26],101:[2,26],102:[2,26],103:[2,26],107:[2,26],113:[2,26],114:[2,26],115:[2,26],123:[2,26],125:[2,26],126:[2,26],127:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26],135:[2,26]},{1:[2,6],6:[2,6],7:169,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,6],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],99:[2,6],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],46:[2,24],51:[2,24],54:[2,24],69:[2,24],75:[2,24],83:[2,24],88:[2,24],90:[2,24],95:[2,24],96:[2,24],99:[2,24],101:[2,24],102:[2,24],103:[2,24],107:[2,24],115:[2,24],118:[2,24],120:[2,24],123:[2,24],125:[2,24],126:[2,24],129:[2,24],130:[2,24],131:[2,24],132:[2,24],133:[2,24],134:[2,24]},{6:[1,71],26:[1,170]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],46:[2,184],51:[2,184],54:[2,184],69:[2,184],75:[2,184],83:[2,184],88:[2,184],90:[2,184],99:[2,184],101:[2,184],102:[2,184],103:[2,184],107:[2,184],115:[2,184],123:[2,184],125:[2,184],126:[2,184],129:[2,184],130:[2,184],131:[2,184],132:[2,184],133:[2,184],134:[2,184]},{8:171,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:172,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:173,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:174,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:175,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:176,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:177,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:178,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],46:[2,140],51:[2,140],54:[2,140],69:[2,140],75:[2,140],83:[2,140],88:[2,140],90:[2,140],99:[2,140],101:[2,140],102:[2,140],103:[2,140],107:[2,140],115:[2,140],123:[2,140],125:[2,140],126:[2,140],129:[2,140],130:[2,140],131:[2,140],132:[2,140],133:[2,140],134:[2,140]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],46:[2,145],51:[2,145],54:[2,145],69:[2,145],75:[2,145],83:[2,145],88:[2,145],90:[2,145],99:[2,145],101:[2,145],102:[2,145],103:[2,145],107:[2,145],115:[2,145],123:[2,145],125:[2,145],126:[2,145],129:[2,145],130:[2,145],131:[2,145],132:[2,145],133:[2,145],134:[2,145]},{8:179,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],46:[2,139],51:[2,139],54:[2,139],69:[2,139],75:[2,139],83:[2,139],88:[2,139],90:[2,139],99:[2,139],101:[2,139],102:[2,139],103:[2,139],107:[2,139],115:[2,139],123:[2,139],125:[2,139],126:[2,139],129:[2,139],130:[2,139],131:[2,139],132:[2,139],133:[2,139],134:[2,139]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],46:[2,144],51:[2,144],54:[2,144],69:[2,144],75:[2,144],83:[2,144],88:[2,144],90:[2,144],99:[2,144],101:[2,144],102:[2,144],103:[2,144],107:[2,144],115:[2,144],123:[2,144],125:[2,144],126:[2,144],129:[2,144],130:[2,144],131:[2,144],132:[2,144],133:[2,144],134:[2,144]},{79:180,82:[1,103]},{1:[2,63],6:[2,63],25:[2,63],26:[2,63],37:[2,63],46:[2,63],51:[2,63],54:[2,63],63:[2,63],64:[2,63],65:[2,63],67:[2,63],69:[2,63],70:[2,63],71:[2,63],75:[2,63],77:[2,63],81:[2,63],82:[2,63],83:[2,63],88:[2,63],90:[2,63],99:[2,63],101:[2,63],102:[2,63],103:[2,63],107:[2,63],115:[2,63],123:[2,63],125:[2,63],126:[2,63],127:[2,63],128:[2,63],129:[2,63],130:[2,63],131:[2,63],132:[2,63],133:[2,63],134:[2,63],135:[2,63]},{82:[2,103]},{27:181,28:[1,70]},{27:182,28:[1,70]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],27:183,28:[1,70],37:[2,77],46:[2,77],51:[2,77],54:[2,77],63:[2,77],64:[2,77],65:[2,77],67:[2,77],69:[2,77],70:[2,77],71:[2,77],75:[2,77],77:[2,77],81:[2,77],82:[2,77],83:[2,77],88:[2,77],90:[2,77],99:[2,77],101:[2,77],102:[2,77],103:[2,77],107:[2,77],115:[2,77],123:[2,77],125:[2,77],126:[2,77],127:[2,77],128:[2,77],129:[2,77],130:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77],135:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],37:[2,78],46:[2,78],51:[2,78],54:[2,78],63:[2,78],64:[2,78],65:[2,78],67:[2,78],69:[2,78],70:[2,78],71:[2,78],75:[2,78],77:[2,78],81:[2,78],82:[2,78],83:[2,78],88:[2,78],90:[2,78],99:[2,78],101:[2,78],102:[2,78],103:[2,78],107:[2,78],115:[2,78],123:[2,78],125:[2,78],126:[2,78],127:[2,78],128:[2,78],129:[2,78],130:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78],135:[2,78]},{8:185,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],54:[1,189],55:47,56:48,58:36,60:25,61:26,62:27,68:184,72:186,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],89:187,90:[1,188],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{66:190,67:[1,96],70:[1,97],71:[1,98]},{66:191,67:[1,96],70:[1,97],71:[1,98]},{79:192,82:[1,103]},{1:[2,64],6:[2,64],25:[2,64],26:[2,64],37:[2,64],46:[2,64],51:[2,64],54:[2,64],63:[2,64],64:[2,64],65:[2,64],67:[2,64],69:[2,64],70:[2,64],71:[2,64],75:[2,64],77:[2,64],81:[2,64],82:[2,64],83:[2,64],88:[2,64],90:[2,64],99:[2,64],101:[2,64],102:[2,64],103:[2,64],107:[2,64],115:[2,64],123:[2,64],125:[2,64],126:[2,64],127:[2,64],128:[2,64],129:[2,64],130:[2,64],131:[2,64],132:[2,64],133:[2,64],134:[2,64],135:[2,64]},{8:193,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,194],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,101],6:[2,101],25:[2,101],26:[2,101],46:[2,101],51:[2,101],54:[2,101],63:[2,101],64:[2,101],65:[2,101],67:[2,101],69:[2,101],70:[2,101],71:[2,101],75:[2,101],81:[2,101],82:[2,101],83:[2,101],88:[2,101],90:[2,101],99:[2,101],101:[2,101],102:[2,101],103:[2,101],107:[2,101],115:[2,101],123:[2,101],125:[2,101],126:[2,101],129:[2,101],130:[2,101],131:[2,101],132:[2,101],133:[2,101],134:[2,101]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],83:[1,195],84:196,85:[1,55],86:[1,56],87:[1,54],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{46:[1,198],51:[1,199]},{46:[2,52],51:[2,52]},{37:[1,201],46:[2,54],51:[2,54],54:[1,200]},{37:[2,57],46:[2,57],51:[2,57],54:[2,57]},{37:[2,58],46:[2,58],51:[2,58],54:[2,58]},{37:[2,59],46:[2,59],51:[2,59],54:[2,59]},{37:[2,60],46:[2,60],51:[2,60],54:[2,60]},{27:146,28:[1,70]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:142,85:[1,55],86:[1,56],87:[1,54],88:[1,141],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,46],6:[2,46],25:[2,46],26:[2,46],46:[2,46],51:[2,46],54:[2,46],69:[2,46],75:[2,46],83:[2,46],88:[2,46],90:[2,46],99:[2,46],101:[2,46],102:[2,46],103:[2,46],107:[2,46],115:[2,46],123:[2,46],125:[2,46],126:[2,46],129:[2,46],130:[2,46],131:[2,46],132:[2,46],133:[2,46],134:[2,46]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],46:[2,177],51:[2,177],54:[2,177],69:[2,177],75:[2,177],83:[2,177],88:[2,177],90:[2,177],99:[2,177],100:84,101:[2,177],102:[2,177],103:[2,177],106:85,107:[2,177],108:66,115:[2,177],123:[2,177],125:[2,177],126:[2,177],129:[1,75],130:[2,177],131:[2,177],132:[2,177],133:[2,177],134:[2,177]},{100:87,101:[1,62],103:[1,63],106:88,107:[1,65],108:66,123:[1,86]},{1:[2,178],6:[2,178],25:[2,178],26:[2,178],46:[2,178],51:[2,178],54:[2,178],69:[2,178],75:[2,178],83:[2,178],88:[2,178],90:[2,178],99:[2,178],100:84,101:[2,178],102:[2,178],103:[2,178],106:85,107:[2,178],108:66,115:[2,178],123:[2,178],125:[2,178],126:[2,178],129:[1,75],130:[2,178],131:[2,178],132:[2,178],133:[2,178],134:[2,178]},{1:[2,179],6:[2,179],25:[2,179],26:[2,179],46:[2,179],51:[2,179],54:[2,179],69:[2,179],75:[2,179],83:[2,179],88:[2,179],90:[2,179],99:[2,179],100:84,101:[2,179],102:[2,179],103:[2,179],106:85,107:[2,179],108:66,115:[2,179],123:[2,179],125:[2,179],126:[2,179],129:[1,75],130:[2,179],131:[2,179],132:[2,179],133:[2,179],134:[2,179]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],46:[2,180],51:[2,180],54:[2,180],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,180],70:[2,66],71:[2,66],75:[2,180],81:[2,66],82:[2,66],83:[2,180],88:[2,180],90:[2,180],99:[2,180],101:[2,180],102:[2,180],103:[2,180],107:[2,180],115:[2,180],123:[2,180],125:[2,180],126:[2,180],129:[2,180],130:[2,180],131:[2,180],132:[2,180],133:[2,180],134:[2,180]},{59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],70:[1,97],71:[1,98],78:89,81:[1,91],82:[2,102]},{59:100,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],70:[1,97],71:[1,98],78:99,81:[1,91],82:[2,102]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],67:[2,69],69:[2,69],70:[2,69],71:[2,69],75:[2,69],81:[2,69],82:[2,69],83:[2,69],88:[2,69],90:[2,69],99:[2,69],101:[2,69],102:[2,69],103:[2,69],107:[2,69],115:[2,69],123:[2,69],125:[2,69],126:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],46:[2,181],51:[2,181],54:[2,181],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,181],70:[2,66],71:[2,66],75:[2,181],81:[2,66],82:[2,66],83:[2,181],88:[2,181],90:[2,181],99:[2,181],101:[2,181],102:[2,181],103:[2,181],107:[2,181],115:[2,181],123:[2,181],125:[2,181],126:[2,181],129:[2,181],130:[2,181],131:[2,181],132:[2,181],133:[2,181],134:[2,181]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],46:[2,182],51:[2,182],54:[2,182],69:[2,182],75:[2,182],83:[2,182],88:[2,182],90:[2,182],99:[2,182],101:[2,182],102:[2,182],103:[2,182],107:[2,182],115:[2,182],123:[2,182],125:[2,182],126:[2,182],129:[2,182],130:[2,182],131:[2,182],132:[2,182],133:[2,182],134:[2,182]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],46:[2,183],51:[2,183],54:[2,183],69:[2,183],75:[2,183],83:[2,183],88:[2,183],90:[2,183],99:[2,183],101:[2,183],102:[2,183],103:[2,183],107:[2,183],115:[2,183],123:[2,183],125:[2,183],126:[2,183],129:[2,183],130:[2,183],131:[2,183],132:[2,183],133:[2,183],134:[2,183]},{8:202,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,203],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:204,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{5:205,25:[1,5],122:[1,206]},{1:[2,126],6:[2,126],25:[2,126],26:[2,126],46:[2,126],51:[2,126],54:[2,126],69:[2,126],75:[2,126],83:[2,126],88:[2,126],90:[2,126],94:207,95:[1,208],96:[1,209],99:[2,126],101:[2,126],102:[2,126],103:[2,126],107:[2,126],115:[2,126],123:[2,126],125:[2,126],126:[2,126],129:[2,126],130:[2,126],131:[2,126],132:[2,126],133:[2,126],134:[2,126]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],46:[2,138],51:[2,138],54:[2,138],69:[2,138],75:[2,138],83:[2,138],88:[2,138],90:[2,138],99:[2,138],101:[2,138],102:[2,138],103:[2,138],107:[2,138],115:[2,138],123:[2,138],125:[2,138],126:[2,138],129:[2,138],130:[2,138],131:[2,138],132:[2,138],133:[2,138],134:[2,138]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],46:[2,146],51:[2,146],54:[2,146],69:[2,146],75:[2,146],83:[2,146],88:[2,146],90:[2,146],99:[2,146],101:[2,146],102:[2,146],103:[2,146],107:[2,146],115:[2,146],123:[2,146],125:[2,146],126:[2,146],129:[2,146],130:[2,146],131:[2,146],132:[2,146],133:[2,146],134:[2,146]},{25:[1,210],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{117:211,119:212,120:[1,213]},{1:[2,91],6:[2,91],25:[2,91],26:[2,91],46:[2,91],51:[2,91],54:[2,91],69:[2,91],75:[2,91],83:[2,91],88:[2,91],90:[2,91],99:[2,91],101:[2,91],102:[2,91],103:[2,91],107:[2,91],115:[2,91],123:[2,91],125:[2,91],126:[2,91],129:[2,91],130:[2,91],131:[2,91],132:[2,91],133:[2,91],134:[2,91]},{14:214,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:215,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{1:[2,94],5:216,6:[2,94],25:[1,5],26:[2,94],46:[2,94],51:[2,94],54:[2,94],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,94],70:[2,66],71:[2,66],75:[2,94],77:[1,217],81:[2,66],82:[2,66],83:[2,94],88:[2,94],90:[2,94],99:[2,94],101:[2,94],102:[2,94],103:[2,94],107:[2,94],115:[2,94],123:[2,94],125:[2,94],126:[2,94],129:[2,94],130:[2,94],131:[2,94],132:[2,94],133:[2,94],134:[2,94]},{1:[2,42],6:[2,42],26:[2,42],99:[2,42],100:84,101:[2,42],103:[2,42],106:85,107:[2,42],108:66,123:[2,42],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,131],6:[2,131],26:[2,131],99:[2,131],100:84,101:[2,131],103:[2,131],106:85,107:[2,131],108:66,123:[2,131],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,71],99:[1,218]},{4:219,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,122],25:[2,122],51:[2,122],54:[1,221],88:[2,122],89:220,90:[1,188],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,109],6:[2,109],25:[2,109],26:[2,109],37:[2,109],46:[2,109],51:[2,109],54:[2,109],63:[2,109],64:[2,109],65:[2,109],67:[2,109],69:[2,109],70:[2,109],71:[2,109],75:[2,109],81:[2,109],82:[2,109],83:[2,109],88:[2,109],90:[2,109],99:[2,109],101:[2,109],102:[2,109],103:[2,109],107:[2,109],113:[2,109],114:[2,109],115:[2,109],123:[2,109],125:[2,109],126:[2,109],129:[2,109],130:[2,109],131:[2,109],132:[2,109],133:[2,109],134:[2,109]},{6:[2,49],25:[2,49],50:222,51:[1,223],88:[2,49]},{6:[2,117],25:[2,117],26:[2,117],51:[2,117],83:[2,117],88:[2,117]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:224,85:[1,55],86:[1,56],87:[1,54],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,123],25:[2,123],26:[2,123],51:[2,123],83:[2,123],88:[2,123]},{1:[2,108],6:[2,108],25:[2,108],26:[2,108],37:[2,108],40:[2,108],46:[2,108],51:[2,108],54:[2,108],63:[2,108],64:[2,108],65:[2,108],67:[2,108],69:[2,108],70:[2,108],71:[2,108],75:[2,108],77:[2,108],81:[2,108],82:[2,108],83:[2,108],88:[2,108],90:[2,108],99:[2,108],101:[2,108],102:[2,108],103:[2,108],107:[2,108],115:[2,108],123:[2,108],125:[2,108],126:[2,108],127:[2,108],128:[2,108],129:[2,108],130:[2,108],131:[2,108],132:[2,108],133:[2,108],134:[2,108],135:[2,108]},{5:225,25:[1,5],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],46:[2,134],51:[2,134],54:[2,134],69:[2,134],75:[2,134],83:[2,134],88:[2,134],90:[2,134],99:[2,134],100:84,101:[1,62],102:[1,226],103:[1,63],106:85,107:[1,65],108:66,115:[2,134],123:[2,134],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],46:[2,136],51:[2,136],54:[2,136],69:[2,136],75:[2,136],83:[2,136],88:[2,136],90:[2,136],99:[2,136],100:84,101:[1,62],102:[1,227],103:[1,63],106:85,107:[1,65],108:66,115:[2,136],123:[2,136],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],46:[2,142],51:[2,142],54:[2,142],69:[2,142],75:[2,142],83:[2,142],88:[2,142],90:[2,142],99:[2,142],101:[2,142],102:[2,142],103:[2,142],107:[2,142],115:[2,142],123:[2,142],125:[2,142],126:[2,142],129:[2,142],130:[2,142],131:[2,142],132:[2,142],133:[2,142],134:[2,142]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],46:[2,143],51:[2,143],54:[2,143],69:[2,143],75:[2,143],83:[2,143],88:[2,143],90:[2,143],99:[2,143],100:84,101:[1,62],102:[2,143],103:[1,63],106:85,107:[1,65],108:66,115:[2,143],123:[2,143],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],46:[2,147],51:[2,147],54:[2,147],69:[2,147],75:[2,147],83:[2,147],88:[2,147],90:[2,147],99:[2,147],101:[2,147],102:[2,147],103:[2,147],107:[2,147],115:[2,147],123:[2,147],125:[2,147],126:[2,147],129:[2,147],130:[2,147],131:[2,147],132:[2,147],133:[2,147],134:[2,147]},{113:[2,149],114:[2,149]},{27:156,28:[1,70],55:157,56:158,73:[1,67],87:[1,112],110:228,112:155},{51:[1,229],113:[2,154],114:[2,154]},{51:[2,151],113:[2,151],114:[2,151]},{51:[2,152],113:[2,152],114:[2,152]},{51:[2,153],113:[2,153],114:[2,153]},{1:[2,148],6:[2,148],25:[2,148],26:[2,148],46:[2,148],51:[2,148],54:[2,148],69:[2,148],75:[2,148],83:[2,148],88:[2,148],90:[2,148],99:[2,148],101:[2,148],102:[2,148],103:[2,148],107:[2,148],115:[2,148],123:[2,148],125:[2,148],126:[2,148],129:[2,148],130:[2,148],131:[2,148],132:[2,148],133:[2,148],134:[2,148]},{8:230,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:231,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,49],25:[2,49],50:232,51:[1,233],75:[2,49]},{6:[2,86],25:[2,86],26:[2,86],51:[2,86],75:[2,86]},{6:[2,35],25:[2,35],26:[2,35],40:[1,234],51:[2,35],75:[2,35]},{6:[2,38],25:[2,38],26:[2,38],51:[2,38],75:[2,38]},{6:[2,39],25:[2,39],26:[2,39],40:[2,39],51:[2,39],75:[2,39]},{6:[2,40],25:[2,40],26:[2,40],40:[2,40],51:[2,40],75:[2,40]},{6:[2,41],25:[2,41],26:[2,41],40:[2,41],51:[2,41],75:[2,41]},{1:[2,5],6:[2,5],26:[2,5],99:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],46:[2,25],51:[2,25],54:[2,25],69:[2,25],75:[2,25],83:[2,25],88:[2,25],90:[2,25],95:[2,25],96:[2,25],99:[2,25],101:[2,25],102:[2,25],103:[2,25],107:[2,25],115:[2,25],118:[2,25],120:[2,25],123:[2,25],125:[2,25],126:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25],134:[2,25]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],46:[2,185],51:[2,185],54:[2,185],69:[2,185],75:[2,185],83:[2,185],88:[2,185],90:[2,185],99:[2,185],100:84,101:[2,185],102:[2,185],103:[2,185],106:85,107:[2,185],108:66,115:[2,185],123:[2,185],125:[2,185],126:[2,185],129:[1,75],130:[1,78],131:[2,185],132:[2,185],133:[2,185],134:[2,185]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],46:[2,186],51:[2,186],54:[2,186],69:[2,186],75:[2,186],83:[2,186],88:[2,186],90:[2,186],99:[2,186],100:84,101:[2,186],102:[2,186],103:[2,186],106:85,107:[2,186],108:66,115:[2,186],123:[2,186],125:[2,186],126:[2,186],129:[1,75],130:[1,78],131:[2,186],132:[2,186],133:[2,186],134:[2,186]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],46:[2,187],51:[2,187],54:[2,187],69:[2,187],75:[2,187],83:[2,187],88:[2,187],90:[2,187],99:[2,187],100:84,101:[2,187],102:[2,187],103:[2,187],106:85,107:[2,187],108:66,115:[2,187],123:[2,187],125:[2,187],126:[2,187],129:[1,75],130:[2,187],131:[2,187],132:[2,187],133:[2,187],134:[2,187]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],46:[2,188],51:[2,188],54:[2,188],69:[2,188],75:[2,188],83:[2,188],88:[2,188],90:[2,188],99:[2,188],100:84,101:[2,188],102:[2,188],103:[2,188],106:85,107:[2,188],108:66,115:[2,188],123:[2,188],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[2,188],132:[2,188],133:[2,188],134:[2,188]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],46:[2,189],51:[2,189],54:[2,189],69:[2,189],75:[2,189],83:[2,189],88:[2,189],90:[2,189],99:[2,189],100:84,101:[2,189],102:[2,189],103:[2,189],106:85,107:[2,189],108:66,115:[2,189],123:[2,189],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[2,189],133:[2,189],134:[1,82]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],46:[2,190],51:[2,190],54:[2,190],69:[2,190],75:[2,190],83:[2,190],88:[2,190],90:[2,190],99:[2,190],100:84,101:[2,190],102:[2,190],103:[2,190],106:85,107:[2,190],108:66,115:[2,190],123:[2,190],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[2,190],134:[1,82]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],46:[2,191],51:[2,191],54:[2,191],69:[2,191],75:[2,191],83:[2,191],88:[2,191],90:[2,191],99:[2,191],100:84,101:[2,191],102:[2,191],103:[2,191],106:85,107:[2,191],108:66,115:[2,191],123:[2,191],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[2,191],133:[2,191],134:[2,191]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],46:[2,176],51:[2,176],54:[2,176],69:[2,176],75:[2,176],83:[2,176],88:[2,176],90:[2,176],99:[2,176],100:84,101:[1,62],102:[2,176],103:[1,63],106:85,107:[1,65],108:66,115:[2,176],123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],46:[2,175],51:[2,175],54:[2,175],69:[2,175],75:[2,175],83:[2,175],88:[2,175],90:[2,175],99:[2,175],100:84,101:[1,62],102:[2,175],103:[1,63],106:85,107:[1,65],108:66,115:[2,175],123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,98],6:[2,98],25:[2,98],26:[2,98],46:[2,98],51:[2,98],54:[2,98],63:[2,98],64:[2,98],65:[2,98],67:[2,98],69:[2,98],70:[2,98],71:[2,98],75:[2,98],81:[2,98],82:[2,98],83:[2,98],88:[2,98],90:[2,98],99:[2,98],101:[2,98],102:[2,98],103:[2,98],107:[2,98],115:[2,98],123:[2,98],125:[2,98],126:[2,98],129:[2,98],130:[2,98],131:[2,98],132:[2,98],133:[2,98],134:[2,98]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],37:[2,74],46:[2,74],51:[2,74],54:[2,74],63:[2,74],64:[2,74],65:[2,74],67:[2,74],69:[2,74],70:[2,74],71:[2,74],75:[2,74],77:[2,74],81:[2,74],82:[2,74],83:[2,74],88:[2,74],90:[2,74],99:[2,74],101:[2,74],102:[2,74],103:[2,74],107:[2,74],115:[2,74],123:[2,74],125:[2,74],126:[2,74],127:[2,74],128:[2,74],129:[2,74],130:[2,74],131:[2,74],132:[2,74],133:[2,74],134:[2,74],135:[2,74]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],37:[2,75],46:[2,75],51:[2,75],54:[2,75],63:[2,75],64:[2,75],65:[2,75],67:[2,75],69:[2,75],70:[2,75],71:[2,75],75:[2,75],77:[2,75],81:[2,75],82:[2,75],83:[2,75],88:[2,75],90:[2,75],99:[2,75],101:[2,75],102:[2,75],103:[2,75],107:[2,75],115:[2,75],123:[2,75],125:[2,75],126:[2,75],127:[2,75],128:[2,75],129:[2,75],130:[2,75],131:[2,75],132:[2,75],133:[2,75],134:[2,75],135:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],37:[2,76],46:[2,76],51:[2,76],54:[2,76],63:[2,76],64:[2,76],65:[2,76],67:[2,76],69:[2,76],70:[2,76],71:[2,76],75:[2,76],77:[2,76],81:[2,76],82:[2,76],83:[2,76],88:[2,76],90:[2,76],99:[2,76],101:[2,76],102:[2,76],103:[2,76],107:[2,76],115:[2,76],123:[2,76],125:[2,76],126:[2,76],127:[2,76],128:[2,76],129:[2,76],130:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76],135:[2,76]},{69:[1,235]},{54:[1,189],69:[2,82],89:236,90:[1,188],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{69:[2,83]},{8:237,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{13:[2,111],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],69:[2,111],73:[2,111],76:[2,111],80:[2,111],85:[2,111],86:[2,111],87:[2,111],93:[2,111],97:[2,111],98:[2,111],101:[2,111],103:[2,111],105:[2,111],107:[2,111],116:[2,111],122:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111],128:[2,111]},{13:[2,112],28:[2,112],30:[2,112],31:[2,112],33:[2,112],34:[2,112],35:[2,112],42:[2,112],43:[2,112],44:[2,112],48:[2,112],49:[2,112],69:[2,112],73:[2,112],76:[2,112],80:[2,112],85:[2,112],86:[2,112],87:[2,112],93:[2,112],97:[2,112],98:[2,112],101:[2,112],103:[2,112],105:[2,112],107:[2,112],116:[2,112],122:[2,112],124:[2,112],125:[2,112],126:[2,112],127:[2,112],128:[2,112]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],37:[2,80],46:[2,80],51:[2,80],54:[2,80],63:[2,80],64:[2,80],65:[2,80],67:[2,80],69:[2,80],70:[2,80],71:[2,80],75:[2,80],77:[2,80],81:[2,80],82:[2,80],83:[2,80],88:[2,80],90:[2,80],99:[2,80],101:[2,80],102:[2,80],103:[2,80],107:[2,80],115:[2,80],123:[2,80],125:[2,80],126:[2,80],127:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],37:[2,81],46:[2,81],51:[2,81],54:[2,81],63:[2,81],64:[2,81],65:[2,81],67:[2,81],69:[2,81],70:[2,81],71:[2,81],75:[2,81],77:[2,81],81:[2,81],82:[2,81],83:[2,81],88:[2,81],90:[2,81],99:[2,81],101:[2,81],102:[2,81],103:[2,81],107:[2,81],115:[2,81],123:[2,81],125:[2,81],126:[2,81],127:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],46:[2,99],51:[2,99],54:[2,99],63:[2,99],64:[2,99],65:[2,99],67:[2,99],69:[2,99],70:[2,99],71:[2,99],75:[2,99],81:[2,99],82:[2,99],83:[2,99],88:[2,99],90:[2,99],99:[2,99],101:[2,99],102:[2,99],103:[2,99],107:[2,99],115:[2,99],123:[2,99],125:[2,99],126:[2,99],129:[2,99],130:[2,99],131:[2,99],132:[2,99],133:[2,99],134:[2,99]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],46:[2,33],51:[2,33],54:[2,33],69:[2,33],75:[2,33],83:[2,33],88:[2,33],90:[2,33],99:[2,33],100:84,101:[2,33],102:[2,33],103:[2,33],106:85,107:[2,33],108:66,115:[2,33],123:[2,33],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{8:238,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],46:[2,104],51:[2,104],54:[2,104],63:[2,104],64:[2,104],65:[2,104],67:[2,104],69:[2,104],70:[2,104],71:[2,104],75:[2,104],81:[2,104],82:[2,104],83:[2,104],88:[2,104],90:[2,104],99:[2,104],101:[2,104],102:[2,104],103:[2,104],107:[2,104],115:[2,104],123:[2,104],125:[2,104],126:[2,104],129:[2,104],130:[2,104],131:[2,104],132:[2,104],133:[2,104],134:[2,104]},{6:[2,49],25:[2,49],50:239,51:[1,223],83:[2,49]},{6:[2,122],25:[2,122],26:[2,122],51:[2,122],54:[1,240],83:[2,122],88:[2,122],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{47:241,48:[1,57],49:[1,58]},{27:107,28:[1,70],41:108,52:242,53:106,55:109,56:110,73:[1,67],86:[1,111],87:[1,112]},{46:[2,55],51:[2,55]},{8:243,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],46:[2,192],51:[2,192],54:[2,192],69:[2,192],75:[2,192],83:[2,192],88:[2,192],90:[2,192],99:[2,192],100:84,101:[2,192],102:[2,192],103:[2,192],106:85,107:[2,192],108:66,115:[2,192],123:[2,192],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{8:244,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,194],6:[2,194],25:[2,194],26:[2,194],46:[2,194],51:[2,194],54:[2,194],69:[2,194],75:[2,194],83:[2,194],88:[2,194],90:[2,194],99:[2,194],100:84,101:[2,194],102:[2,194],103:[2,194],106:85,107:[2,194],108:66,115:[2,194],123:[2,194],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],46:[2,174],51:[2,174],54:[2,174],69:[2,174],75:[2,174],83:[2,174],88:[2,174],90:[2,174],99:[2,174],101:[2,174],102:[2,174],103:[2,174],107:[2,174],115:[2,174],123:[2,174],125:[2,174],126:[2,174],129:[2,174],130:[2,174],131:[2,174],132:[2,174],133:[2,174],134:[2,174]},{8:245,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,127],6:[2,127],25:[2,127],26:[2,127],46:[2,127],51:[2,127],54:[2,127],69:[2,127],75:[2,127],83:[2,127],88:[2,127],90:[2,127],95:[1,246],99:[2,127],101:[2,127],102:[2,127],103:[2,127],107:[2,127],115:[2,127],123:[2,127],125:[2,127],126:[2,127],129:[2,127],130:[2,127],131:[2,127],132:[2,127],133:[2,127],134:[2,127]},{5:247,25:[1,5]},{27:248,28:[1,70]},{117:249,119:212,120:[1,213]},{26:[1,250],118:[1,251],119:252,120:[1,213]},{26:[2,167],118:[2,167],120:[2,167]},{8:254,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],92:253,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,92],5:255,6:[2,92],25:[1,5],26:[2,92],46:[2,92],51:[2,92],54:[2,92],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,92],70:[1,97],71:[1,98],75:[2,92],78:89,81:[1,91],82:[2,102],83:[2,92],88:[2,92],90:[2,92],99:[2,92],101:[2,92],102:[2,92],103:[2,92],107:[2,92],115:[2,92],123:[2,92],125:[2,92],126:[2,92],129:[2,92],130:[2,92],131:[2,92],132:[2,92],133:[2,92],134:[2,92]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,66],70:[2,66],71:[2,66],75:[2,66],81:[2,66],82:[2,66],83:[2,66],88:[2,66],90:[2,66],99:[2,66],101:[2,66],102:[2,66],103:[2,66],107:[2,66],115:[2,66],123:[2,66],125:[2,66],126:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[2,66]},{1:[2,95],6:[2,95],25:[2,95],26:[2,95],46:[2,95],51:[2,95],54:[2,95],69:[2,95],75:[2,95],83:[2,95],88:[2,95],90:[2,95],99:[2,95],101:[2,95],102:[2,95],103:[2,95],107:[2,95],115:[2,95],123:[2,95],125:[2,95],126:[2,95],129:[2,95],130:[2,95],131:[2,95],132:[2,95],133:[2,95],134:[2,95]},{14:256,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:215,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{1:[2,132],6:[2,132],25:[2,132],26:[2,132],46:[2,132],51:[2,132],54:[2,132],63:[2,132],64:[2,132],65:[2,132],67:[2,132],69:[2,132],70:[2,132],71:[2,132],75:[2,132],81:[2,132],82:[2,132],83:[2,132],88:[2,132],90:[2,132],99:[2,132],101:[2,132],102:[2,132],103:[2,132],107:[2,132],115:[2,132],123:[2,132],125:[2,132],126:[2,132],129:[2,132],130:[2,132],131:[2,132],132:[2,132],133:[2,132],134:[2,132]},{6:[1,71],26:[1,257]},{8:258,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,61],13:[2,112],25:[2,61],28:[2,112],30:[2,112],31:[2,112],33:[2,112],34:[2,112],35:[2,112],42:[2,112],43:[2,112],44:[2,112],48:[2,112],49:[2,112],51:[2,61],73:[2,112],76:[2,112],80:[2,112],85:[2,112],86:[2,112],87:[2,112],88:[2,61],93:[2,112],97:[2,112],98:[2,112],101:[2,112],103:[2,112],105:[2,112],107:[2,112],116:[2,112],122:[2,112],124:[2,112],125:[2,112],126:[2,112],127:[2,112],128:[2,112]},{6:[1,260],25:[1,261],88:[1,259]},{6:[2,50],8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[2,50],26:[2,50],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],83:[2,50],85:[1,55],86:[1,56],87:[1,54],88:[2,50],91:262,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,49],25:[2,49],26:[2,49],50:263,51:[1,223]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],46:[2,171],51:[2,171],54:[2,171],69:[2,171],75:[2,171],83:[2,171],88:[2,171],90:[2,171],99:[2,171],101:[2,171],102:[2,171],103:[2,171],107:[2,171],115:[2,171],118:[2,171],123:[2,171],125:[2,171],126:[2,171],129:[2,171],130:[2,171],131:[2,171],132:[2,171],133:[2,171],134:[2,171]},{8:264,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:265,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{113:[2,150],114:[2,150]},{27:156,28:[1,70],55:157,56:158,73:[1,67],87:[1,112],112:266},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],46:[2,156],51:[2,156],54:[2,156],69:[2,156],75:[2,156],83:[2,156],88:[2,156],90:[2,156],99:[2,156],100:84,101:[2,156],102:[1,267],103:[2,156],106:85,107:[2,156],108:66,115:[1,268],123:[2,156],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],46:[2,157],51:[2,157],54:[2,157],69:[2,157],75:[2,157],83:[2,157],88:[2,157],90:[2,157],99:[2,157],100:84,101:[2,157],102:[1,269],103:[2,157],106:85,107:[2,157],108:66,115:[2,157],123:[2,157],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,271],25:[1,272],75:[1,270]},{6:[2,50],12:165,25:[2,50],26:[2,50],27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:273,39:164,41:168,43:[1,46],75:[2,50],86:[1,111]},{8:274,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,275],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],37:[2,79],46:[2,79],51:[2,79],54:[2,79],63:[2,79],64:[2,79],65:[2,79],67:[2,79],69:[2,79],70:[2,79],71:[2,79],75:[2,79],77:[2,79],81:[2,79],82:[2,79],83:[2,79],88:[2,79],90:[2,79],99:[2,79],101:[2,79],102:[2,79],103:[2,79],107:[2,79],115:[2,79],123:[2,79],125:[2,79],126:[2,79],127:[2,79],128:[2,79],129:[2,79],130:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79],135:[2,79]},{8:276,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,69:[2,115],73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{69:[2,116],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{26:[1,277],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,260],25:[1,261],83:[1,278]},{6:[2,61],25:[2,61],26:[2,61],51:[2,61],83:[2,61],88:[2,61]},{5:279,25:[1,5]},{46:[2,53],51:[2,53]},{46:[2,56],51:[2,56],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{26:[1,280],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{5:281,25:[1,5],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{5:282,25:[1,5]},{1:[2,128],6:[2,128],25:[2,128],26:[2,128],46:[2,128],51:[2,128],54:[2,128],69:[2,128],75:[2,128],83:[2,128],88:[2,128],90:[2,128],99:[2,128],101:[2,128],102:[2,128],103:[2,128],107:[2,128],115:[2,128],123:[2,128],125:[2,128],126:[2,128],129:[2,128],130:[2,128],131:[2,128],132:[2,128],133:[2,128],134:[2,128]},{5:283,25:[1,5]},{26:[1,284],118:[1,285],119:252,120:[1,213]},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],46:[2,165],51:[2,165],54:[2,165],69:[2,165],75:[2,165],83:[2,165],88:[2,165],90:[2,165],99:[2,165],101:[2,165],102:[2,165],103:[2,165],107:[2,165],115:[2,165],123:[2,165],125:[2,165],126:[2,165],129:[2,165],130:[2,165],131:[2,165],132:[2,165],133:[2,165],134:[2,165]},{5:286,25:[1,5]},{26:[2,168],118:[2,168],120:[2,168]},{5:287,25:[1,5],51:[1,288]},{25:[2,124],51:[2,124],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,93],6:[2,93],25:[2,93],26:[2,93],46:[2,93],51:[2,93],54:[2,93],69:[2,93],75:[2,93],83:[2,93],88:[2,93],90:[2,93],99:[2,93],101:[2,93],102:[2,93],103:[2,93],107:[2,93],115:[2,93],123:[2,93],125:[2,93],126:[2,93],129:[2,93],130:[2,93],131:[2,93],132:[2,93],133:[2,93],134:[2,93]},{1:[2,96],5:289,6:[2,96],25:[1,5],26:[2,96],46:[2,96],51:[2,96],54:[2,96],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,96],70:[1,97],71:[1,98],75:[2,96],78:89,81:[1,91],82:[2,102],83:[2,96],88:[2,96],90:[2,96],99:[2,96],101:[2,96],102:[2,96],103:[2,96],107:[2,96],115:[2,96],123:[2,96],125:[2,96],126:[2,96],129:[2,96],130:[2,96],131:[2,96],132:[2,96],133:[2,96],134:[2,96]},{99:[1,290]},{88:[1,291],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,110],6:[2,110],25:[2,110],26:[2,110],37:[2,110],46:[2,110],51:[2,110],54:[2,110],63:[2,110],64:[2,110],65:[2,110],67:[2,110],69:[2,110],70:[2,110],71:[2,110],75:[2,110],81:[2,110],82:[2,110],83:[2,110],88:[2,110],90:[2,110],99:[2,110],101:[2,110],102:[2,110],103:[2,110],107:[2,110],113:[2,110],114:[2,110],115:[2,110],123:[2,110],125:[2,110],126:[2,110],129:[2,110],130:[2,110],131:[2,110],132:[2,110],133:[2,110],134:[2,110]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],91:292,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:293,85:[1,55],86:[1,56],87:[1,54],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,118],25:[2,118],26:[2,118],51:[2,118],83:[2,118],88:[2,118]},{6:[1,260],25:[1,261],26:[1,294]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],46:[2,135],51:[2,135],54:[2,135],69:[2,135],75:[2,135],83:[2,135],88:[2,135],90:[2,135],99:[2,135],100:84,101:[1,62],102:[2,135],103:[1,63],106:85,107:[1,65],108:66,115:[2,135],123:[2,135],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],46:[2,137],51:[2,137],54:[2,137],69:[2,137],75:[2,137],83:[2,137],88:[2,137],90:[2,137],99:[2,137],100:84,101:[1,62],102:[2,137],103:[1,63],106:85,107:[1,65],108:66,115:[2,137],123:[2,137],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{113:[2,155],114:[2,155]},{8:295,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:296,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:297,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,84],6:[2,84],25:[2,84],26:[2,84],37:[2,84],46:[2,84],51:[2,84],54:[2,84],63:[2,84],64:[2,84],65:[2,84],67:[2,84],69:[2,84],70:[2,84],71:[2,84],75:[2,84],81:[2,84],82:[2,84],83:[2,84],88:[2,84],90:[2,84],99:[2,84],101:[2,84],102:[2,84],103:[2,84],107:[2,84],113:[2,84],114:[2,84],115:[2,84],123:[2,84],125:[2,84],126:[2,84],129:[2,84],130:[2,84],131:[2,84],132:[2,84],133:[2,84],134:[2,84]},{12:165,27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:298,39:164,41:168,43:[1,46],86:[1,111]},{6:[2,85],12:165,25:[2,85],26:[2,85],27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:163,39:164,41:168,43:[1,46],51:[2,85],74:299,86:[1,111]},{6:[2,87],25:[2,87],26:[2,87],51:[2,87],75:[2,87]},{6:[2,36],25:[2,36],26:[2,36],51:[2,36],75:[2,36],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{8:300,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{69:[2,114],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],46:[2,34],51:[2,34],54:[2,34],69:[2,34],75:[2,34],83:[2,34],88:[2,34],90:[2,34],99:[2,34],101:[2,34],102:[2,34],103:[2,34],107:[2,34],115:[2,34],123:[2,34],125:[2,34],126:[2,34],129:[2,34],130:[2,34],131:[2,34],132:[2,34],133:[2,34],134:[2,34]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],46:[2,105],51:[2,105],54:[2,105],63:[2,105],64:[2,105],65:[2,105],67:[2,105],69:[2,105],70:[2,105],71:[2,105],75:[2,105],81:[2,105],82:[2,105],83:[2,105],88:[2,105],90:[2,105],99:[2,105],101:[2,105],102:[2,105],103:[2,105],107:[2,105],115:[2,105],123:[2,105],125:[2,105],126:[2,105],129:[2,105],130:[2,105],131:[2,105],132:[2,105],133:[2,105],134:[2,105]},{1:[2,45],6:[2,45],25:[2,45],26:[2,45],46:[2,45],51:[2,45],54:[2,45],69:[2,45],75:[2,45],83:[2,45],88:[2,45],90:[2,45],99:[2,45],101:[2,45],102:[2,45],103:[2,45],107:[2,45],115:[2,45],123:[2,45],125:[2,45],126:[2,45],129:[2,45],130:[2,45],131:[2,45],132:[2,45],133:[2,45],134:[2,45]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],46:[2,193],51:[2,193],54:[2,193],69:[2,193],75:[2,193],83:[2,193],88:[2,193],90:[2,193],99:[2,193],101:[2,193],102:[2,193],103:[2,193],107:[2,193],115:[2,193],123:[2,193],125:[2,193],126:[2,193],129:[2,193],130:[2,193],131:[2,193],132:[2,193],133:[2,193],134:[2,193]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],46:[2,172],51:[2,172],54:[2,172],69:[2,172],75:[2,172],83:[2,172],88:[2,172],90:[2,172],99:[2,172],101:[2,172],102:[2,172],103:[2,172],107:[2,172],115:[2,172],118:[2,172],123:[2,172],125:[2,172],126:[2,172],129:[2,172],130:[2,172],131:[2,172],132:[2,172],133:[2,172],134:[2,172]},{1:[2,129],6:[2,129],25:[2,129],26:[2,129],46:[2,129],51:[2,129],54:[2,129],69:[2,129],75:[2,129],83:[2,129],88:[2,129],90:[2,129],99:[2,129],101:[2,129],102:[2,129],103:[2,129],107:[2,129],115:[2,129],123:[2,129],125:[2,129],126:[2,129],129:[2,129],130:[2,129],131:[2,129],132:[2,129],133:[2,129],134:[2,129]},{1:[2,130],6:[2,130],25:[2,130],26:[2,130],46:[2,130],51:[2,130],54:[2,130],69:[2,130],75:[2,130],83:[2,130],88:[2,130],90:[2,130],95:[2,130],99:[2,130],101:[2,130],102:[2,130],103:[2,130],107:[2,130],115:[2,130],123:[2,130],125:[2,130],126:[2,130],129:[2,130],130:[2,130],131:[2,130],132:[2,130],133:[2,130],134:[2,130]},{1:[2,163],6:[2,163],25:[2,163],26:[2,163],46:[2,163],51:[2,163],54:[2,163],69:[2,163],75:[2,163],83:[2,163],88:[2,163],90:[2,163],99:[2,163],101:[2,163],102:[2,163],103:[2,163],107:[2,163],115:[2,163],123:[2,163],125:[2,163],126:[2,163],129:[2,163],130:[2,163],131:[2,163],132:[2,163],133:[2,163],134:[2,163]},{5:301,25:[1,5]},{26:[1,302]},{6:[1,303],26:[2,169],118:[2,169],120:[2,169]},{8:304,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],46:[2,97],51:[2,97],54:[2,97],69:[2,97],75:[2,97],83:[2,97],88:[2,97],90:[2,97],99:[2,97],101:[2,97],102:[2,97],103:[2,97],107:[2,97],115:[2,97],123:[2,97],125:[2,97],126:[2,97],129:[2,97],130:[2,97],131:[2,97],132:[2,97],133:[2,97],134:[2,97]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],46:[2,133],51:[2,133],54:[2,133],63:[2,133],64:[2,133],65:[2,133],67:[2,133],69:[2,133],70:[2,133],71:[2,133],75:[2,133],81:[2,133],82:[2,133],83:[2,133],88:[2,133],90:[2,133],99:[2,133],101:[2,133],102:[2,133],103:[2,133],107:[2,133],115:[2,133],123:[2,133],125:[2,133],126:[2,133],129:[2,133],130:[2,133],131:[2,133],132:[2,133],133:[2,133],134:[2,133]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],46:[2,113],51:[2,113],54:[2,113],63:[2,113],64:[2,113],65:[2,113],67:[2,113],69:[2,113],70:[2,113],71:[2,113],75:[2,113],81:[2,113],82:[2,113],83:[2,113],88:[2,113],90:[2,113],99:[2,113],101:[2,113],102:[2,113],103:[2,113],107:[2,113],115:[2,113],123:[2,113],125:[2,113],126:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113],134:[2,113]},{6:[2,119],25:[2,119],26:[2,119],51:[2,119],83:[2,119],88:[2,119]},{6:[2,49],25:[2,49],26:[2,49],50:305,51:[1,223]},{6:[2,120],25:[2,120],26:[2,120],51:[2,120],83:[2,120],88:[2,120]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],46:[2,158],51:[2,158],54:[2,158],69:[2,158],75:[2,158],83:[2,158],88:[2,158],90:[2,158],99:[2,158],100:84,101:[2,158],102:[2,158],103:[2,158],106:85,107:[2,158],108:66,115:[1,306],123:[2,158],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,160],6:[2,160],25:[2,160],26:[2,160],46:[2,160],51:[2,160],54:[2,160],69:[2,160],75:[2,160],83:[2,160],88:[2,160],90:[2,160],99:[2,160],100:84,101:[2,160],102:[1,307],103:[2,160],106:85,107:[2,160],108:66,115:[2,160],123:[2,160],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,159],6:[2,159],25:[2,159],26:[2,159],46:[2,159],51:[2,159],54:[2,159],69:[2,159],75:[2,159],83:[2,159],88:[2,159],90:[2,159],99:[2,159],100:84,101:[2,159],102:[2,159],103:[2,159],106:85,107:[2,159],108:66,115:[2,159],123:[2,159],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[2,88],25:[2,88],26:[2,88],51:[2,88],75:[2,88]},{6:[2,49],25:[2,49],26:[2,49],50:308,51:[1,233]},{26:[1,309],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{26:[1,310]},{1:[2,166],6:[2,166],25:[2,166],26:[2,166],46:[2,166],51:[2,166],54:[2,166],69:[2,166],75:[2,166],83:[2,166],88:[2,166],90:[2,166],99:[2,166],101:[2,166],102:[2,166],103:[2,166],107:[2,166],115:[2,166],123:[2,166],125:[2,166],126:[2,166],129:[2,166],130:[2,166],131:[2,166],132:[2,166],133:[2,166],134:[2,166]},{26:[2,170],118:[2,170],120:[2,170]},{25:[2,125],51:[2,125],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,260],25:[1,261],26:[1,311]},{8:312,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:313,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[1,271],25:[1,272],26:[1,314]},{6:[2,37],25:[2,37],26:[2,37],51:[2,37],75:[2,37]},{1:[2,164],6:[2,164],25:[2,164],26:[2,164],46:[2,164],51:[2,164],54:[2,164],69:[2,164],75:[2,164],83:[2,164],88:[2,164],90:[2,164],99:[2,164],101:[2,164],102:[2,164],103:[2,164],107:[2,164],115:[2,164],123:[2,164],125:[2,164],126:[2,164],129:[2,164],130:[2,164],131:[2,164],132:[2,164],133:[2,164],134:[2,164]},{6:[2,121],25:[2,121],26:[2,121],51:[2,121],83:[2,121],88:[2,121]},{1:[2,161],6:[2,161],25:[2,161],26:[2,161],46:[2,161],51:[2,161],54:[2,161],69:[2,161],75:[2,161],83:[2,161],88:[2,161],90:[2,161],99:[2,161],100:84,101:[2,161],102:[2,161],103:[2,161],106:85,107:[2,161],108:66,115:[2,161],123:[2,161],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,162],6:[2,162],25:[2,162],26:[2,162],46:[2,162],51:[2,162],54:[2,162],69:[2,162],75:[2,162],83:[2,162],88:[2,162],90:[2,162],99:[2,162],100:84,101:[2,162],102:[2,162],103:[2,162],106:85,107:[2,162],108:66,115:[2,162],123:[2,162],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[2,89],25:[2,89],26:[2,89],51:[2,89],75:[2,89]}],defaultActions:{57:[2,47],58:[2,48],72:[2,3],91:[2,103],186:[2,83]},parseError:function(a,b){throw new Error(a)},parse:function(a){function o(){var a;a=b.lexer.lex()||1,typeof a!="number"&&(a=b.symbols_[a]||a);return a}function n(a){c.length=c.length-2*a,d.length=d.length-a,e.length=e.length-a}var b=this,c=[0],d=[null],e=[],f=this.table,g="",h=0,i=0,j=0,k=2,l=1;this.lexer.setInput(a),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,typeof this.lexer.yylloc=="undefined"&&(this.lexer.yylloc={});var m=this.lexer.yylloc;e.push(m),typeof this.yy.parseError=="function"&&(this.parseError=this.yy.parseError);var p,q,r,s,t,u,v={},w,x,y,z;for(;;){r=c[c.length-1],this.defaultActions[r]?s=this.defaultActions[r]:(p==null&&(p=o()),s=f[r]&&f[r][p]);if(typeof s=="undefined"||!s.length||!s[0]){if(!j){z=[];for(w in f[r])this.terminals_[w]&&w>2&&z.push("'"+this.terminals_[w]+"'");var A="";this.lexer.showPosition?A="Parse error on line "+(h+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+z.join(", "):A="Parse error on line "+(h+1)+": Unexpected "+(p==1?"end of input":"'"+(this.terminals_[p]||p)+"'"),this.parseError(A,{text:this.lexer.match,token:this.terminals_[p]||p,line:this.lexer.yylineno,loc:m,expected:z})}if(j==3){if(p==l)throw new Error(A||"Parsing halted.");i=this.lexer.yyleng,g=this.lexer.yytext,h=this.lexer.yylineno,m=this.lexer.yylloc,p=o()}for(;;){if(k.toString()in f[r])break;if(r==0)throw new Error(A||"Parsing halted.");n(1),r=c[c.length-1]}q=p,p=k,r=c[c.length-1],s=f[r]&&f[r][k],j=3}if(s[0]instanceof Array&&s.length>1)throw new Error("Parse Error: multiple actions possible at state: "+r+", token: "+p);switch(s[0]){case 1:c.push(p),d.push(this.lexer.yytext),e.push(this.lexer.yylloc),c.push(s[1]),p=null,q?(p=q,q=null):(i=this.lexer.yyleng,g=this.lexer.yytext,h=this.lexer.yylineno,m=this.lexer.yylloc,j>0&&j--);break;case 2:x=this.productions_[s[1]][1],v.$=d[d.length-x],v._$={first_line:e[e.length-(x||1)].first_line,last_line:e[e.length-1].last_line,first_column:e[e.length-(x||1)].first_column,last_column:e[e.length-1].last_column},u=this.performAction.call(v,g,i,h,this.yy,s[1],d,e);if(typeof u!="undefined")return u;x&&(c=c.slice(0,-1*x*2),d=d.slice(0,-1*x),e=e.slice(0,-1*x)),c.push(this.productions_[s[1]][0]),d.push(v.$),e.push(v._$),y=f[c[c.length-2]][c[c.length-1]],c.push(y);break;case 3:return!0}}return!0}};return a}();typeof require!="undefined"&&typeof a!="undefined"&&(a.parser=b,a.parse=function(){return b.parse.apply(b,arguments)},a.main=function(b){if(!b[1])throw new Error("Usage: "+b[0]+" FILE");if(typeof process!="undefined")var c=require("fs").readFileSync(require("path").join(process.cwd(),b[1]),"utf8");else var d=require("file").path(require("file").cwd()),c=d.join(b[1]).read({charset:"utf-8"});return a.parser.parse(c)},typeof module!="undefined"&&require.main===module&&a.main(typeof process!="undefined"?process.argv.slice(1):require("system").args))},require["./scope"]=new function(){var a=this;(function(){var b,c,d,e;e=require("./helpers"),c=e.extend,d=e.last,a.Scope=b=function(){function a(b,c,d){this.parent=b,this.expressions=c,this.method=d,this.variables=[{name:"arguments",type:"arguments"}],this.positions={},this.parent||(a.root=this)}a.root=null,a.prototype.add=function(a,b,c){var d;if(this.shared&&!c)return this.parent.add(a,b,c);return typeof (d=this.positions[a])=="number"?this.variables[d].type=b:this.positions[a]=this.variables.push({name:a,type:b})-1},a.prototype.find=function(a,b){if(this.check(a,b))return!0;this.add(a,"var");return!1},a.prototype.parameter=function(a){if(!this.shared||!this.parent.check(a,!0))return this.add(a,"param")},a.prototype.check=function(a,b){var c,d;c=!!this.type(a);if(c||b)return c;return(d=this.parent)!=null?!!d.check(a):!!void 0},a.prototype.temporary=function(a,b){return a.length>1?"_"+a+(b>1?b:""):"_"+(b+parseInt(a,36)).toString(36).replace(/\d/g,"a")},a.prototype.type=function(a){var b,c,d,e;e=this.variables;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.name===a)return b.type}return null},a.prototype.freeVariable=function(a){var b,c;b=0;while(this.check(c=this.temporary(a,b)))b++;this.add(c,"var",!0);return c},a.prototype.assign=function(a,b){this.add(a,{value:b,assigned:!0});return this.hasAssignments=!0},a.prototype.hasDeclarations=function(){return!!this.declaredVariables().length},a.prototype.declaredVariables=function(){var a,b,c,d,e,f;a=[],b=[],f=this.variables;for(d=0,e=f.length;d<e;d++)c=f[d],c.type==="var"&&(c.name.charAt(0)==="_"?b:a).push(c.name);return a.sort().concat(b.sort())},a.prototype.assignedVariables=function(){var a,b,c,d,e;d=this.variables,e=[];for(b=0,c=d.length;b<c;b++)a=d[b],a.type.assigned&&e.push(""+a.name+" = "+a.type.value);return e};return a}()}).call(this)},require["./nodes"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,$,_,ba,bb,bc,bd,be,bf,bg,bh,bi=Object.prototype.hasOwnProperty,bj=function(a,b){function d(){this.constructor=a}for(var c in b)bi.call(b,c)&&(a[c]=b[c]);d.prototype=b.prototype,a.prototype=new d,a.__super__=b.prototype;return a},bk=function(a,b){return function(){return a.apply(b,arguments)}},bl=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1};M=require("./scope").Scope,bh=require("./helpers"),Y=bh.compact,ba=bh.flatten,_=bh.extend,bc=bh.merge,Z=bh.del,be=bh.starts,$=bh.ends,bb=bh.last,a.extend=_,X=function(){return!0},D=function(){return!1},R=function(){return this},C=function(){this.negated=!this.negated;return this},a.Base=e=function(){function a(){}a.prototype.compile=function(a,b){var c;a=_({},a),b&&(a.level=b),c=this.unfoldSoak(a)||this,c.tab=a.indent;return a.level===z||!c.isStatement(a)?c.compileNode(a):c.compileClosure(a)},a.prototype.compileClosure=function(a){if(this.jumps()||this instanceof S)throw SyntaxError("cannot use a pure statement in an expression.");a.sharedScope=!0;return i.wrap(this).compileNode(a)},a.prototype.cache=function(a,b,c){var e,f;if(!this.isComplex()){e=b?this.compile(a,b):this;return[e,e]}e=new A(c||a.scope.freeVariable("ref")),f=new d(e,this);return b?[f.compile(a,b),e.value]:[f,e]},a.prototype.compileLoopReference=function(a,b){var c,d;c=d=this.compile(a,w),-Infinity<+c&&+c<Infinity||o.test(c)&&a.scope.check(c,!0)||(c=""+(d=a.scope.freeVariable(b))+" = "+c);return[c,d]},a.prototype.makeReturn=function(){return new K(this)},a.prototype.contains=function(a){var b;b=!1,this.traverseChildren(!1,function(c){if(a(c)){b=!0;return!1}});return b},a.prototype.containsType=function(a){return this instanceof a||this.contains(function(b){return b instanceof a})},a.prototype.lastNonComment=function(a){var b;b=a.length;while(b--)if(!(a[b]instanceof k))return a[b];return null},a.prototype.toString=function(a,b){var c;a==null&&(a=""),b==null&&(b=this.constructor.name),c="\n"+a+b,this.soak&&(c+="?"),this.eachChild(function(b){return c+=b.toString(a+Q)});return c},a.prototype.eachChild=function(a){var b,c,d,e,f,g,h,i;if(!this.children)return this;h=this.children;for(d=0,f=h.length;d<f;d++){b=h[d];if(this[b]){i=ba([this[b]]);for(e=0,g=i.length;e<g;e++){c=i[e];if(a(c)===!1)return this}}}return this},a.prototype.traverseChildren=function(a,b){return this.eachChild(function(c){if(b(c)===!1)return!1;return c.traverseChildren(a,b)})},a.prototype.invert=function(){return new F("!",this)},a.prototype.unwrapAll=function(){var a;a=this;while(a!==(a=a.unwrap()))continue;return a},a.prototype.children=[],a.prototype.isStatement=D,a.prototype.jumps=D,a.prototype.isComplex=X,a.prototype.isChainable=D,a.prototype.isAssignable=D,a.prototype.unwrap=R,a.prototype.unfoldSoak=D,a.prototype.assigns=D;return a}(),a.Block=f=function(){function a(a){this.expressions=Y(ba(a||[]))}bj(a,e),a.prototype.children=["expressions"],a.prototype.push=function(a){this.expressions.push(a);return this},a.prototype.pop=function(){return this.expressions.pop()},a.prototype.unshift=function(a){this.expressions.unshift(a);return this},a.prototype.unwrap=function(){return this.expressions.length===1?this.expressions[0]:this},a.prototype.isEmpty=function(){return!this.expressions.length},a.prototype.isStatement=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.isStatement(a))return!0}return!1},a.prototype.jumps=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.jumps(a))return b}},a.prototype.makeReturn=function(){var a,b;b=this.expressions.length;while(b--){a=this.expressions[b];if(!(a instanceof k)){this.expressions[b]=a.makeReturn(),a instanceof K&&!a.expression&&this.expressions.splice(b,1);break}}return this},a.prototype.compile=function(b,c){b==null&&(b={});return b.scope?a.__super__.compile.call(this,b,c):this.compileRoot(b)},a.prototype.compileNode=function(b){var c,d,e,f,g,h,i;this.tab=b.indent,f=b.level===z,d=[],i=this.expressions;for(g=0,h=i.length;g<h;g++)e=i[g],e=e.unwrapAll(),e=e.unfoldSoak(b)||e,e instanceof a?d.push(e.compileNode(b)):f?(e.front=!0,c=e.compile(b),d.push(e.isStatement(b)?c:this.tab+c+";")):d.push(e.compile(b,w));if(f)return d.join("\n");c=d.join(", ")||"void 0";return d.length>1&&b.level>=w?"("+c+")":c},a.prototype.compileRoot=function(a){var b;a.indent=this.tab=a.bare?"":Q,a.scope=new M(null,this,null),a.level=z,b=this.compileWithDeclarations(a);return a.bare?b:"(function() {\n"+b+"\n}).call(this);\n"},a.prototype.compileWithDeclarations=function(a){var b,c,d,e,f,g,h,i,j,l;c=g="",l=this.expressions;for(f=0,j=l.length;f<j;f++){e=l[f],e=e.unwrap();if(!(e instanceof k||e instanceof A))break}a=bc(a,{level:z}),f&&(h=this.expressions.splice(f,this.expressions.length),c=this.compileNode(a),this.expressions=h),g=this.compileNode(a),i=a.scope,i.expressions===this&&(d=a.scope.hasDeclarations(),b=i.hasAssignments,(d||b)&&f&&(c+="\n"),d&&(c+=""+this.tab+"var "+i.declaredVariables().join(", ")+";\n"),b&&(c+=""+this.tab+"var "+bd(i.assignedVariables().join(", "),this.tab)+";\n"));return c+g},a.wrap=function(b){if(b.length===1&&b[0]instanceof a)return b[0];return new a(b)};return a}(),a.Literal=A=function(){function a(a){this.value=a}bj(a,e),a.prototype.makeReturn=function(){return this.isStatement()?this:new K(this)},a.prototype.isAssignable=function(){return o.test(this.value)},a.prototype.isStatement=function(){var a;return(a=this.value)==="break"||a==="continue"||a==="debugger"},a.prototype.isComplex=D,a.prototype.assigns=function(a){return a===this.value},a.prototype.jumps=function(a){if(!this.isStatement())return!1;return!a||!(a.loop||a.block&&this.value!=="continue")?this:!1},a.prototype.compileNode=function(a){var b;b=this.isUndefined?a.level>=u?"(void 0)":"void 0":this.value.reserved?'"'+this.value+'"':this.value;return this.isStatement()?""+this.tab+b+";":b},a.prototype.toString=function(){return' "'+this.value+'"'};return a}(),a.Return=K=function(){function a(a){a&&!a.unwrap().isUndefined&&(this.expression=a)}bj(a,e),a.prototype.children=["expression"],a.prototype.isStatement=X,a.prototype.makeReturn=R,a.prototype.jumps=R,a.prototype.compile=function(b,c){var d,e;d=(e=this.expression)!=null?e.makeReturn():void 0;return!d||d instanceof a?a.__super__.compile.call(this,b,c):d.compile(b,c)},a.prototype.compileNode=function(a){return this.tab+("return"+(this.expression?" "+this.expression.compile(a,y):"")+";")};return a}(),a.Value=V=function(){function a(b,c,d){if(!c&&b instanceof a)return b;this.base=b,this.properties=c||[],d&&(this[d]=!0);return this}bj(a,e),a.prototype.children=["base","properties"],a.prototype.push=function(a){this.properties.push(a);return this},a.prototype.hasProperties=function(){return!!this.properties.length},a.prototype.isArray=function(){return!this.properties.length&&this.base instanceof c},a.prototype.isComplex=function(){return this.hasProperties()||this.base.isComplex()},a.prototype.isAssignable=function(){return this.hasProperties()||this.base.isAssignable()},a.prototype.isSimpleNumber=function(){return this.base instanceof A&&L.test(this.base.value)},a.prototype.isAtomic=function(){var a,b,c,d;d=this.properties.concat(this.base);for(b=0,c=d.length;b<c;b++){a=d[b];if(a.soak||a instanceof g)return!1}return!0},a.prototype.isStatement=function(a){return!this.properties.length&&this.base.isStatement(a)},a.prototype.assigns=function(a){return!this.properties.length&&this.base.assigns(a)},a.prototype.jumps=function(a){return!this.properties.length&&this.base.jumps(a)},a.prototype.isObject=function(a){if(this.properties.length)return!1;return this.base instanceof E&&(!a||this.base.generated)},a.prototype.isSplice=function(){return bb(this.properties)instanceof N},a.prototype.makeReturn=function(){return this.properties.length?a.__super__.makeReturn.call(this):this.base.makeReturn()},a.prototype.unwrap=function(){return this.properties.length?this:this.base},a.prototype.cacheReference=function(b){var c,e,f,g;f=bb(this.properties);if(this.properties.length<2&&!this.base.isComplex()&&(f!=null?!f.isComplex():!void 0))return[this,this];c=new a(this.base,this.properties.slice(0,-1)),c.isComplex()&&(e=new A(b.scope.freeVariable("base")),c=new a(new H(new d(e,c))));if(!f)return[c,e];f.isComplex()&&(g=new A(b.scope.freeVariable("name")),f=new t(new d(g,f.index)),g=new t(g));return[c.push(f),new a(e||c.base,[g||f])]},a.prototype.compileNode=function(a){var b,c,d,e,f;this.base.front=this.front,d=this.properties,b=this.base.compile(a,d.length?u:null),(this.base instanceof H||d.length)&&L.test(b)&&(b=""+b+".");for(e=0,f=d.length;e<f;e++)c=d[e],b+=c.compile(a);return b},a.prototype.unfoldSoak=function(b){var c;if(this.unfoldedSoak!=null)return this.unfoldedSoak;c=bk(function(){var c,e,f,g,h,i,j,k;if(f=this.base.unfoldSoak(b)){Array.prototype.push.apply(f.body.properties,this.properties);return f}k=this.properties;for(e=0,j=k.length;e<j;e++){g=k[e];if(g.soak){g.soak=!1,c=new a(this.base,this.properties.slice(0,e)),i=new a(this.base,this.properties.slice(e)),c.isComplex()&&(h=new A(b.scope.freeVariable("ref")),c=new H(new d(h,c)),i.base=h);return new r(new l(c),i,{soak:!0})}}return null},this)();return this.unfoldedSoak=c||!1};return a}(),a.Comment=k=function(){function a(a){this.comment=a}bj(a,e),a.prototype.isStatement=X,a.prototype.makeReturn=R,a.prototype.compileNode=function(a,b){var c;c="/*"+bd(this.comment,this.tab)+"*/",(b||a.level)===z&&(c=a.indent+c);return c};return a}(),a.Call=g=function(){function a(a,b,c){this.args=b!=null?b:[],this.soak=c,this.isNew=!1,this.isSuper=a==="super",this.variable=this.isSuper?null:a}bj(a,e),a.prototype.children=["variable","args"],a.prototype.newInstance=function(){var b;b=this.variable.base||this.variable,b instanceof a&&!b.isNew?b.newInstance():this.isNew=!0;return this},a.prototype.superReference=function(a){var c,d;c=a.scope.method;if(!c)throw SyntaxError("cannot call super outside of a function.");d=c.name;if(d==null)throw SyntaxError("cannot call super on an anonymous function.");return c.klass?(new V(new A(c.klass),[new b(new A("__super__")),new b(new A(d))])).compile(a):""+d+".__super__.constructor"},a.prototype.unfoldSoak=function(b){var c,d,e,f,g,h,i,j,k;if(this.soak){if(this.variable){if(d=bf(b,this,"variable"))return d;j=(new V(this.variable)).cacheReference(b),e=j[0],g=j[1]}else e=new A(this.superReference(b)),g=new V(e);g=new a(g,this.args),g.isNew=this.isNew,e=new A("typeof "+e.compile(b)+' === "function"');return new r(e,new V(g),{soak:!0})}c=this,f=[];for(;;){if(c.variable instanceof a){f.push(c),c=c.variable;continue}if(!(c.variable instanceof V))break;f.push(c);if(!((c=c.variable.base)instanceof a))break}k=f.reverse();for(h=0,i=k.length;h<i;h++)c=k[h],d&&(c.variable instanceof a?c.variable=d:c.variable.base=d),d=bf(b,c,"variable");return d},a.prototype.filterImplicitObjects=function(a){var b,c,e,f,g,h,i,j,l,m;c=[];for(h=0,j=a.length;h<j;h++){b=a[h];if(!((typeof b.isObject=="function"?b.isObject():void 0)&&b.base.generated)){c.push(b);continue}e=null,m=b.base.properties;for(i=0,l=m.length;i<l;i++)f=m[i],f instanceof d||f instanceof k?(e||c.push(e=new E(g=[],!0)),g.push(f)):(c.push(f),e=null)}return c},a.prototype.compileNode=function(a){var b,c,d,e;(e=this.variable)!=null&&(e.front=this.front);if(d=O.compileSplattedArray(a,this.args,!0))return this.compileSplat(a,d);c=this.filterImplicitObjects(this.args),c=function(){var d,e,f;f=[];for(d=0,e=c.length;d<e;d++)b=c[d],f.push(b.compile(a,w));return f}().join(", ");return this.isSuper?this.superReference(a)+(".call(this"+(c&&", "+c)+")"):(this.isNew?"new ":"")+this.variable.compile(a,u)+("("+c+")")},a.prototype.compileSuper=function(a,b){return""+this.superReference(b)+".call(this"+(a.length?", ":"")+a+")"},a.prototype.compileSplat=function(a,b){var c,d,e,f,g;if(this.isSuper)return""+this.superReference(a)+".apply(this, "+b+")";if(this.isNew){e=this.tab+Q;return"(function(func, args, ctor) {\n"+e+"ctor.prototype = func.prototype;\n"+e+"var child = new ctor, result = func.apply(child, args);\n"+e+'return typeof result === "object" ? result : child;\n'+this.tab+"})("+this.variable.compile(a,w)+", "+b+", function() {})"}c=new V(this.variable),(f=c.properties.pop())&&c.isComplex()?(g=a.scope.freeVariable("ref"),d="("+g+" = "+c.compile(a,w)+")"+f.compile(a)):(d=c.compile(a,u),L.test(d)&&(d="("+d+")"),f?(g=d,d+=f.compile(a)):g="null");return""+d+".apply("+g+", "+b+")"};return a}(),a.Extends=m=function(){function a(a,b){this.child=a,this.parent=b}bj(a,e),a.prototype.children=["child","parent"],a.prototype.compile=function(a){bg("hasProp");return(new g(new V(new A(bg("extends"))),[this.child,this.parent])).compile(a)};return a}(),a.Access=b=function(){function a(a,b){this.name=a,this.name.asKey=!0,this.proto=b==="proto"?".prototype":"",this.soak=b==="soak"}bj(a,e),a.prototype.children=["name"],a.prototype.compile=function(a){var b;b=this.name.compile(a);return this.proto+(o.test(b)?"."+b:"["+b+"]")},a.prototype.isComplex=D;return a}(),a.Index=t=function(){function a(a){this.index=a}bj(a,e),a.prototype.children=["index"],a.prototype.compile=function(a){return(this.proto?".prototype":"")+("["+this.index.compile(a,y)+"]")},a.prototype.isComplex=function(){return this.index.isComplex()};return a}(),a.Range=J=function(){function a(a,b,c){this.from=a,this.to=b,this.exclusive=c==="exclusive",this.equals=this.exclusive?"":"="}bj(a,e),a.prototype.children=["from","to"],a.prototype.compileVariables=function(a){var b,c,d,e,f;a=bc(a,{top:!0}),c=this.from.cache(a,w),this.fromC=c[0],this.fromVar=c[1],d=this.to.cache(a,w),this.toC=d[0],this.toVar=d[1];if(b=Z(a,"step"))e=b.cache(a,w),this.step=e[0],this.stepVar=e[1];f=[this.fromVar.match(L),this.toVar.match(L)],this.fromNum=f[0],this.toNum=f[1];if(this.stepVar)return this.stepNum=this.stepVar.match(L)},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i,j,k,l,m;this.fromVar||this.compileVariables(a);if(!a.index)return this.compileArray(a);g=this.fromNum&&this.toNum,f=Z(a,"index"),k=""+f+" = "+this.fromC,this.toC!==this.toVar&&(k+=", "+this.toC),this.step!==this.stepVar&&(k+=", "+this.step),l=[""+f+" <"+this.equals,""+f+" >"+this.equals],h=l[0],e=l[1],c=this.stepNum?c=+this.stepNum>0?""+h+" "+this.toVar:""+e+" "+this.toVar:g?(m=[+this.fromNum,+this.toNum],d=m[0],j=m[1],m,c=d<=j?""+h+" "+j:""+e+" "+j):(b=""+this.fromVar+" <= "+this.toVar,c=""+b+" ? "+h+" "+this.toVar+" : "+e+" "+this.toVar),i=this.stepVar?""+f+" += "+this.stepVar:g?d<=j?""+f+"++":""+f+"--":""+b+" ? "+f+"++ : "+f+"--";return""+k+"; "+c+"; "+i},a.prototype.compileArray=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p;if(this.fromNum&&this.toNum&&Math.abs(this.fromNum-this.toNum)<=20){j=function(){p=[];for(var a=n=+this.fromNum,b=+this.toNum;n<=b?a<=b:a>=b;n<=b?a++:a--)p.push(a);return p}.apply(this),this.exclusive&&j.pop();return"["+j.join(", ")+"]"}g=this.tab+Q,f=a.scope.freeVariable("i"),k=a.scope.freeVariable("results"),i="\n"+g+k+" = [];",this.fromNum&&this.toNum?(a.index=f,c=this.compileNode(a)):(l=""+f+" = "+this.fromC+(this.toC!==this.toVar?", "+this.toC:""),d=""+this.fromVar+" <= "+this.toVar,c="var "+l+"; "+d+" ? "+f+" <"+this.equals+" "+this.toVar+" : "+f+" >"+this.equals+" "+this.toVar+"; "+d+" ? "+f+"++ : "+f+"--"),h="{ "+k+".push("+f+"); }\n"+g+"return "+k+";\n"+a.indent,e=function(a){return a!=null?a.contains(function(a){return a instanceof A&&a.value==="arguments"&&!a.asKey}):void 0};if(e(this.from)||e(this.to))b=", arguments";return"(function() {"+i+"\n"+g+"for ("+c+")"+h+"}).apply(this"+(b!=null?b:"")+")"};return a}(),a.Slice=N=function(){function a(b){this.range=b,a.__super__.constructor.call(this)}bj(a,e),a.prototype.children=["range"],a.prototype.compileNode=function(a){var b,c,d,e,f,g;g=this.range,e=g.to,c=g.from,d=c&&c.compile(a,y)||"0",b=e&&e.compile(a,y),e&&(!!this.range.exclusive||+b!==-1)&&(f=", "+(this.range.exclusive?b:L.test(b)?(+b+1).toString():"("+b+" + 1) || 9e9"));return".slice("+d+(f||"")+")"};return a}(),a.Obj=E=function(){function a(a,b){this.generated=b!=null?b:!1,this.objects=this.properties=a||[]}bj(a,e),a.prototype.children=["properties"],a.prototype.compileNode=function(a){var b,c,e,f,g,h,i,j,l,m,n;l=this.properties;if(!l.length)return this.front?"({})":"{}";if(this.generated)for(m=0,n=l.length;m<n;m++){h=l[m];if(h instanceof V)throw new Error("cannot have an implicit value in an implicit object")}c=a.indent+=Q,g=this.lastNonComment(this.properties),l=function(){var h,i;i=[];for(b=0,h=l.length;b<h;b++)j=l[b],f=b===l.length-1?"":j===g||j instanceof k?"\n":",\n",e=j instanceof k?"":c,j instanceof V&&j["this"]&&(j=new d(j.properties[0].name,j,"object")),j instanceof k||(j instanceof d||(j=new d(j,j,"object")),(j.variable.base||j.variable).asKey=!0),i.push(e+j.compile(a,z)+f);return i}(),l=l.join(""),i="{"+(l&&"\n"+l+"\n"+this.tab)+"}";return this.front?"("+i+")":i},a.prototype.assigns=function(a){var b,c,d,e;e=this.properties;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Arr=c=function(){function a(a){this.objects=a||[]}bj(a,e),a.prototype.children=["objects"],a.prototype.filterImplicitObjects=g.prototype.filterImplicitObjects,a.prototype.compileNode=function(a){var b,c,d;if(!this.objects.length)return"[]";a.indent+=Q,d=this.filterImplicitObjects(this.objects);if(b=O.compileSplattedArray(a,d))return b;b=function(){var b,e,f;f=[];for(b=0,e=d.length;b<e;b++)c=d[b],f.push(c.compile(a,w));return f}().join(", ");return b.indexOf("\n")>=0?"[\n"+a.indent+b+"\n"+this.tab+"]":"["+b+"]"},a.prototype.assigns=function(a){var b,c,d,e;e=this.objects;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Class=h=function(){function a(a,b,c){this.variable=a,this.parent=b,this.body=c!=null?c:new f,this.boundFuncs=[],this.body.classBody=!0}bj(a,e),a.prototype.children=["variable","parent","body"],a.prototype.determineName=function(){var a,c;if(!this.variable)return null;a=(c=bb(this.variable.properties))?c instanceof b&&c.name.value:this.variable.base.value;return a&&(a=o.test(a)&&a)},a.prototype.setContext=function(a){return this.body.traverseChildren(!1,function(b){if(b.classBody)return!1;if(b instanceof A&&b.value==="this")return b.value=a;if(b instanceof j){b.klass=a;if(b.bound)return b.context=a}})},a.prototype.addBoundFunctions=function(a){var c,d,e,f,g,h;if(this.boundFuncs.length){g=this.boundFuncs,h=[];for(e=0,f=g.length;e<f;e++)c=g[e],d=(new V(new A("this"),[new b(c)])).compile(a),h.push(this.ctor.body.unshift(new A(""+d+" = "+bg("bind")+"("+d+", this)")));return h}},a.prototype.addProperties=function(a,c,e){var f,g,h,i,k;k=a.base.properties.slice(0),h=function(){var a;a=[];while(f=k.shift()){if(f instanceof d){g=f.variable.base,delete f.context,i=f.value;if(g.value==="constructor"){if(this.ctor)throw new Error("cannot define more than one constructor in a class");if(i.bound)throw new Error("cannot define a constructor as a bound function");i instanceof j?f=this.ctor=i:(this.externalCtor=e.scope.freeVariable("class"),f=new d(new A(this.externalCtor),i))}else f.variable["this"]||(f.variable=new V(new A(c),[new b(g,"proto")])),i instanceof j&&i.bound&&(this.boundFuncs.push(g),i.bound=!1)}a.push(f)}return a}.call(this);return Y(h)},a.prototype.walkBody=function(b,c){return this.traverseChildren(!1,bk(function(d){var e,g,h,i,j;if(d instanceof a)return!1;if(d instanceof f){j=e=d.expressions;for(g=0,i=j.length;g<i;g++)h=j[g],h instanceof V&&h.isObject(!0)&&(e[g]=this.addProperties(h,b,c));return d.expressions=e=ba(e)}},this))},a.prototype.ensureConstructor=function(a){this.ctor||(this.ctor=new j,this.parent&&this.ctor.body.push(new A(""+a+".__super__.constructor.apply(this, arguments)")),this.externalCtor&&this.ctor.body.push(new A(""+this.externalCtor+".apply(this, arguments)")),this.body.expressions.unshift(this.ctor)),this.ctor.ctor=this.ctor.name=a,this.ctor.klass=null;return this.ctor.noReturn=!0},a.prototype.compileNode=function(a){var b,c,e,f;b=this.determineName(),f=b||this.name||"_Class",e=new A(f),this.setContext(f),this.walkBody(f,a),this.ensureConstructor(f),this.parent&&this.body.expressions.unshift(new m(e,this.parent)),this.ctor instanceof j||this.body.expressions.unshift(this.ctor),this.body.expressions.push(e),this.addBoundFunctions(a),c=new H(i.wrap(this.body),!0),this.variable&&(c=new d(this.variable,c));return c.compile(a)};return a}(),a.Assign=d=function(){function a(a,b,c,d){this.variable=a,this.value=b,this.context=c,this.param=d&&d.param}bj(a,e),a.prototype.children=["variable","value"],a.prototype.isStatement=function(a){return(a!=null?a.level:void 0)===z&&this.context!=null&&bl.call(this.context,"?")>=0},a.prototype.assigns=function(a){return this[this.context==="object"?"value":"variable"].assigns(a)},a.prototype.unfoldSoak=function(a){return bf(a,this,"variable")},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i;if(b=this.variable instanceof V){if(this.variable.isArray()||this.variable.isObject())return this.compilePatternMatch(a);if(this.variable.isSplice())return this.compileSplice(a);if((f=this.context)==="||="||f==="&&="||f==="?=")return this.compileConditional(a)}d=this.variable.compile(a,w);if(!this.context&&!this.variable.isAssignable())throw SyntaxError('"'+this.variable.compile(a)+'" cannot be assigned.');this.context||b&&(this.variable.namespaced||this.variable.hasProperties())||(this.param?a.scope.add(d,"var"):a.scope.find(d)),this.value instanceof j&&(c=B.exec(d))&&(c[1]&&(this.value.klass=c[1]),this.value.name=(g=(h=(i=c[2])!=null?i:c[3])!=null?h:c[4])!=null?g:c[5]),e=this.value.compile(a,w);if(this.context==="object")return""+d+": "+e;e=d+(" "+(this.context||"=")+" ")+e;return a.level<=w?e:"("+e+")"},a.prototype.compilePatternMatch=function(c){var d,e,f,g,h,i,j,k,l,m,n,p,q,r,s,u,v,y,B,C,D,E;r=c.level===z,u=this.value,l=this.variable.base.objects;if(!(m=l.length)){f=u.compile(c);return c.level>=x?"("+f+")":f}i=this.variable.isObject();if(r&&m===1&&!((k=l[0])instanceof O)){k instanceof a?(B=k,h=B.variable.base,k=B.value):k.base instanceof H?(C=(new V(k.unwrapAll())).cacheReference(c),k=C[0],h=C[1]):h=i?k["this"]?k.properties[0].name:k:new A(0),d=o.test(h.unwrap().value||0),u=new V(u),u.properties.push(new(d?b:t)(h));return(new a(k,u,null,{param:this.param})).compile(c,z)}v=u.compile(c,w),e=[],q=!1;if(!o.test(v)||this.variable.assigns(v))e.push(""+(n=c.scope.freeVariable("ref"))+" = "+v),v=n;for(g=0,y=l.length;g<y;g++){k=l[g],h=g,i&&(k instanceof a?(D=k,h=D.variable.base,k=D.value):k.base instanceof H?(E=(new V(k.unwrapAll())).cacheReference(c),k=E[0],h=E[1]):h=k["this"]?k.properties[0].name:k);if(!q&&k instanceof O)s=""+m+" <= "+v+".length ? "+bg("slice")+".call("+v+", "+g,(p=m-g-1)?(j=c.scope.freeVariable("i"),s+=", "+j+" = "+v+".length - "+p+") : ("+j+" = "+g+", [])"):s+=") : []",s=new A(s),q=""+j+"++";else{if(k instanceof O){k=k.name.compile(c);throw SyntaxError("multiple splats are disallowed in an assignment: "+k+" ...")}typeof h=="number"?(h=new A(q||h),d=!1):d=i&&o.test(h.unwrap().value||0),s=new V(new A(v),[new(d?b:t)(h)])}e.push((new a(k,s,null,{param:this.param})).compile(c,z))}r||e.push(v),f=e.join(", ");return c.level<w?f:"("+f+")"},a.prototype.compileConditional=function(b){var c,d,e;e=this.variable.cacheReference(b),c=e[0],d=e[1],bl.call(this.context,"?")>=0&&(b.isExistentialEquals=!0);return(new F(this.context.slice(0,-1),c,new a(d,this.value,"="))).compile(b)},a.prototype.compileSplice=function(a){var b,c,d,e,f,g,h,i,j,k,l,m;k=this.variable.properties.pop().range,d=k.from,h=k.to,c=k.exclusive,g=this.variable.compile(a),l=(d!=null?d.cache(a,x):void 0)||["0","0"],e=l[0],f=l[1],h?(d!=null?d.isSimpleNumber():void 0)&&h.isSimpleNumber()?(h=+h.compile(a)- +f,c||(h+=1)):(h=h.compile(a)+" - "+f,c||(h+=" + 1")):h="9e9",m=this.value.cache(a,w),i=m[0],j=m[1],b="[].splice.apply("+g+", ["+e+", "+h+"].concat("+i+")), "+j;return a.level>z?"("+b+")":b};return a}(),a.Code=j=function(){function a(a,b,c){this.params=a||[],this.body=b||new f,this.bound=c==="boundfunc",this.bound&&(this.context="this")}bj(a,e),a.prototype.children=["params","body"],a.prototype.isStatement=function(){return!!this.ctor},a.prototype.jumps=D,a.prototype.compileNode=function(a){var b,e,f,g,h,i,j,k,l,m,n,o,p,q,s,t,v,w,x,y,z,B,C,D;a.scope=new M(a.scope,this.body,this),a.scope.shared=Z(a,"sharedScope"),a.indent+=Q,delete a.bare,o=[],e=[],z=this.params;for(q=0,v=z.length;q<v;q++){j=z[q];if(j.splat){B=this.params;for(s=0,w=B.length;s<w;s++)i=B[s],i.name.value&&a.scope.add(i.name.value,"var",!0);l=new d(new V(new c(function(){var b,c,d,e;d=this.params,e=[];for(b=0,c=d.length;b<c;b++)i=d[b],e.push(i.asReference(a));return e}.call(this))),new V(new A("arguments")));break}}C=this.params;for(t=0,x=C.length;t<x;t++)j=C[t],j.isComplex()?(n=k=j.asReference(a),j.value&&(n=new F("?",k,j.value)),e.push(new d(new V(j.name),n,"=",{param:!0}))):(k=j,j.value&&(h=new A(k.name.value+" == null"),n=new d(new V(j.name),j.value,"="),e.push(new r(h,n)))),l||o.push(k);p=this.body.isEmpty(),l&&e.unshift(l),e.length&&(D=this.body.expressions).unshift.apply(D,e);if(!l)for(f=0,y=o.length;f<y;f++)m=o[f],a.scope.parameter(o[f]=m.compile(a));!p&&!this.noReturn&&this.body.makeReturn(),g=a.indent,b="function",this.ctor&&(b+=" "+this.name),b+="("+o.join(", ")+") {",this.body.isEmpty()||(b+="\n"+this.body.compileWithDeclarations(a)+"\n"+this.tab),b+="}";if(this.ctor)return this.tab+b;if(this.bound)return bg("bind")+("("+b+", "+this.context+")");return this.front||a.level>=u?"("+b+")":b},a.prototype.traverseChildren=function(b,c){if(b)return a.__super__.traverseChildren.call(this,b,c)};return a}(),a.Param=G=function(){function a(a,b,c){this.name=a,this.value=b,this.splat=c}bj(a,e),a.prototype.children=["name","value"],a.prototype.compile=function(a){return this.name.compile(a,w)},a.prototype.asReference=function(a){var b;if(this.reference)return this.reference;b=this.name,b["this"]?(b=b.properties[0].name,b.value.reserved&&(b=new A("_"+b.value))):b.isComplex()&&(b=new A(a.scope.freeVariable("arg"))),b=new V(b),this.splat&&(b=new O(b));return this.reference=b},a.prototype.isComplex=function(){return this.name.isComplex()};return a}(),a.Splat=O=function(){function a(a){this.name=a.compile?a:new A(a)}bj(a,e),a.prototype.children=["name"],a.prototype.isAssignable=X,a.prototype.assigns=function(a){return this.name.assigns(a)},a.prototype.compile=function(a){return this.index!=null?this.compileParam(a):this.name.compile(a)},a.compileSplattedArray=function(b,c,d){var e,f,g,h,i,j,k;i=-1;while((j=c[++i])&&!(j instanceof a))continue;if(i>=c.length)return"";if(c.length===1){g=c[0].compile(b,w);if(d)return g;return""+bg("slice")+".call("+g+")"}e=c.slice(i);for(h=0,k=e.length;h<k;h++)j=e[h],g=j.compile(b,w),e[h]=j instanceof a?""+bg("slice")+".call("+g+")":"["+g+"]";if(i===0)return e[0]+(".concat("+e.slice(1).join(", ")+")");f=function(){var a,d,e,f;e=c.slice(0,i),f=[];for(a=0,d=e.length;a<d;a++)j=e[a],f.push(j.compile(b,w));return f}();return"["+f.join(", ")+"].concat("+e.join(", ")+")"};return a}(),a.While=W=function(){function a(a,b){this.condition=(b!=null?b.invert:void 0)?a.invert():a,this.guard=b!=null?b.guard:void 0}bj(a,e),a.prototype.children=["condition","guard","body"],a.prototype.isStatement=X,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.addBody=function(a){this.body=a;return this},a.prototype.jumps=function(){var a,b,c,d;a=this.body.expressions;if(!a.length)return!1;for(c=0,d=a.length;c<d;c++){b=a[c];if(b.jumps({loop:!0}))return b}return!1},a.prototype.compileNode=function(a){var b,c,d,e;a.indent+=Q,e="",b=this.body;if(b.isEmpty())b="";else{if(a.level>z||this.returns)d=a.scope.freeVariable("results"),e=""+this.tab+d+" = [];\n",b&&(b=I.wrap(d,b));this.guard&&(b=f.wrap([new r(this.guard,b)])),b="\n"+b.compile(a,z)+"\n"+this.tab}c=e+this.tab+("while ("+this.condition.compile(a,y)+") {"+b+"}"),this.returns&&(c+="\n"+this.tab+"return "+d+";");return c};return a}(),a.Op=F=function(){function c(b,c,d,e){var f;if(b==="in")return new s(c,d);if(b==="do"){f=new g(c,c.params||[]),f["do"]=!0;return f}if(b==="new"){if(c instanceof g&&!c["do"]&&!c.isNew)return c.newInstance();if(c instanceof j&&c.bound||c["do"])c=new H(c)}this.operator=a[b]||b,this.first=c,this.second=d,this.flip=!!e;return this}var a,b;bj(c,e),a={"==":"===","!=":"!==",of:"in"},b={"!==":"===","===":"!=="},c.prototype.children=["first","second"],c.prototype.isSimpleNumber=D,c.prototype.isUnary=function(){return!this.second},c.prototype.isComplex=function(){var a;return!this.isUnary()||(a=this.operator)!=="+"&&a!=="-"||this.first.isComplex()},c.prototype.isChainable=function(){var a;return(a=this.operator)==="<"||a===">"||a===">="||a==="<="||a==="==="||a==="!=="},c.prototype.invert=function(){var a,d,e,f,g;if(this.isChainable()&&this.first.isChainable()){a=!0,d=this;while(d&&d.operator)a&&(a=d.operator in b),d=d.first;if(!a)return(new H(this)).invert();d=this;while(d&&d.operator)d.invert=!d.invert,d.operator=b[d.operator],d=d.first;return this}if(f=b[this.operator]){this.operator=f,this.first.unwrap()instanceof c&&this.first.invert();return this}return this.second?(new H(this)).invert():this.operator==="!"&&(e=this.first.unwrap())instanceof c&&((g=e.operator)==="!"||g==="in"||g==="instanceof")?e:new c("!",this)},c.prototype.unfoldSoak=function(a){var b;return((b=this.operator)==="++"||b==="--"||b==="delete")&&bf(a,this,"first")},c.prototype.compileNode=function(a){var b;if(this.isUnary())return this.compileUnary(a);if(this.isChainable()&&this.first.isChainable())return this.compileChain(a);if(this.operator==="?")return this.compileExistence(a);this.first.front=this.front,b=this.first.compile(a,x)+" "+this.operator+" "+this.second.compile(a,x);return a.level<=x?b:"("+b+")"},c.prototype.compileChain=function(a){var b,c,d,e;e=this.first.second.cache(a),this.first.second=e[0],d=e[1],c=this.first.compile(a,x),b=""+c+" "+(this.invert?"&&":"||")+" "+d.compile(a)+" "+this.operator+" "+this.second.compile(a,x);return"("+b+")"},c.prototype.compileExistence=function(a){var b,c;this.first.isComplex()?(c=new A(a.scope.freeVariable("ref")),b=new H(new d(c,this.first))):(b=this.first,c=b);return(new r(new l(b),c,{type:"if"})).addElse(this.second).compile(a)},c.prototype.compileUnary=function(a){var b,d;d=[b=this.operator],(b==="new"||b==="typeof"||b==="delete"||(b==="+"||b==="-")&&this.first instanceof c&&this.first.operator===b)&&d.push(" "),b==="new"&&this.first.isStatement(a)&&(this.first=new H(this.first)),d.push(this.first.compile(a,x)),this.flip&&d.reverse();return d.join("")},c.prototype.toString=function(a){return c.__super__.toString.call(this,a,this.constructor.name+" "+this.operator)};return c}(),a.In=s=function(){function a(a,b){this.object=a,this.array=b}bj(a,e),a.prototype.children=["object","array"],a.prototype.invert=C,a.prototype.compileNode=function(a){var b,c,d,e,f;if(this.array instanceof V&&this.array.isArray()){f=this.array.base.objects;for(d=0,e=f.length;d<e;d++){c=f[d];if(c instanceof O){b=!0;break}}if(!b)return this.compileOrTest(a)}return this.compileLoopTest(a)},a.prototype.compileOrTest=function(a){var b,c,d,e,f,g,h,i,j;i=this.object.cache(a,x),g=i[0],f=i[1],j=this.negated?[" !== "," && "]:[" === "," || "],b=j[0],c=j[1],h=function(){var c,h,i;h=this.array.base.objects,i=[];for(d=0,c=h.length;d<c;d++)e=h[d],i.push((d?f:g)+b+e.compile(a,x));return i}.call(this);if(h.length===0)return"false";h=h.join(c);return a.level<x?h:"("+h+")"},a.prototype.compileLoopTest=function(a){var b,c,d,e;e=this.object.cache(a,w),d=e[0],c=e[1],b=bg("indexOf")+(".call("+this.array.compile(a,w)+", "+c+") ")+(this.negated?"< 0":">= 0");if(d===c)return b;b=d+", "+b;return a.level<w?b:"("+b+")"},a.prototype.toString=function(b){return a.__super__.toString.call(this,b,this.constructor.name+(this.negated?"!":""))};return a}(),a.Try=T=function(){function a(a,b,c,d){this.attempt=a,this.error=b,this.recovery=c,this.ensure=d}bj(a,e),a.prototype.children=["attempt","recovery","ensure"],a.prototype.isStatement=X,a.prototype.jumps=function(a){var b;return this.attempt.jumps(a)||((b=this.recovery)!=null?b.jumps(a):void 0)},a.prototype.makeReturn=function(){this.attempt&&(this.attempt=this.attempt.makeReturn()),this.recovery&&(this.recovery=this.recovery.makeReturn());return this},a.prototype.compileNode=function(a){var b,c;a.indent+=Q,c=this.error?" ("+this.error.compile(a)+") ":" ",b=this.recovery?(a.scope.add(this.error.value,"param")," catch"+c+"{\n"+this.recovery.compile(a,z)+"\n"+this.tab+"}"):!this.ensure&&!this.recovery?" catch (_e) {}":void 0;return""+this.tab+"try {\n"+this.attempt.compile(a,z)+"\n"+this.tab+"}"+(b||"")+(this.ensure?" finally {\n"+this.ensure.compile(a,z)+"\n"+this.tab+"}":"")};return a}(),a.Throw=S=function(){function a(a){this.expression=a}bj(a,e),a.prototype.children=["expression"],a.prototype.isStatement=X,a.prototype.jumps=D,a.prototype.makeReturn=R,a.prototype.compileNode=function(a){return this.tab+("throw "+this.expression.compile(a)+";")};return a}(),a.Existence=l=function(){function a(a){this.expression=a}bj(a,e),a.prototype.children=["expression"],a.prototype.invert=C,a.prototype.compileNode=function(a){var b,c,d,e;d=this.expression.compile(a,x),d=o.test(d)&&!a.scope.check(d)?(e=this.negated?["===","||"]:["!==","&&"],b=e[0],c=e[1],e,"typeof "+d+" "+b+' "undefined" '+c+" "+d+" "+b+" null"):""+d+" "+(this.negated?"==":"!=")+" null";return a.level<=v?d:"("+d+")"};return a}(),a.Parens=H=function(){function a(a){this.body=a}bj(a,e),a.prototype.children=["body"],a.prototype.unwrap=function(){return this.body},a.prototype.isComplex=function(){return this.body.isComplex()},a.prototype.makeReturn=function(){return this.body.makeReturn()},a.prototype.compileNode=function(a){var b,c,d;d=this.body.unwrap();if(d instanceof V&&d.isAtomic()){d.front=this.front;return d.compile(a)}c=d.compile(a,y),b=a.level<x&&(d instanceof F||d instanceof g||d instanceof n&&d.returns);return b?c:"("+c+")"};return a}(),a.For=n=function(){function a(a,b){var c;this.source=b.source,this.guard=b.guard,this.step=b.step,this.name=b.name,this.index=b.index,this.body=f.wrap([a]),this.own=!!b.own,this.object=!!b.object,this.object&&(c=[this.index,this.name],this.name=c[0],this.index=c[1]);if(this.index instanceof V)throw SyntaxError("index cannot be a pattern matching expression");this.range=this.source instanceof V&&this.source.base instanceof J&&!this.source.properties.length,this.pattern=this.name instanceof V;if(this.range&&this.index)throw SyntaxError("indexes do not apply to range loops");if(this.range&&this.pattern)throw SyntaxError("cannot pattern match over range loops");this.returns=!1}bj(a,e),a.prototype.children=["body","source","guard","step"],a.prototype.isStatement=X,a.prototype.jumps=W.prototype.jumps,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.compileNode=function(a){var b,c,e,g,h,i,j,k,l,m,n,p,q,s,t,u,v,y,B,C,D,E,F;b=f.wrap([this.body]),l=(F=bb(b.expressions))!=null?F.jumps():void 0,l&&l instanceof K&&(this.returns=!1),y=this.range?this.source.base:this.source,v=a.scope,n=this.name&&this.name.compile(a,w),j=this.index&&this.index.compile(a,w),n&&!this.pattern&&v.find(n,{immediate:!0}),j&&v.find(j,{immediate:!0}),this.returns&&(u=v.freeVariable("results")),k=(this.range?n:j)||v.freeVariable("i"),this.step&&!this.range&&(C=v.freeVariable("step")),this.pattern&&(n=k),E="",h="",c="",i=this.tab+Q,this.range?e=y.compile(bc(a,{index:k,step:this.step})):(D=this.source.compile(a,w),(n||this.own)&&!o.test(D)&&(c=""+this.tab+(q=v.freeVariable("ref"))+" = "+D+";\n",D=q),n&&!this.pattern&&(p=""+n+" = "+D+"["+k+"]"),this.object||(m=v.freeVariable("len"),g=""+k+" = 0, "+m+" = "+D+".length"+(this.step?", "+C+" = "+this.step.compile(a,x):""),B=this.step?""+k+" += "+C:""+k+"++",e=""+g+"; "+k+" < "+m+"; "+B)),this.returns&&(s=""+this.tab+u+" = [];\n",t="\n"+this.tab+"return "+u+";",b=I.wrap(u,b)),this.guard&&(b=f.wrap([new r(this.guard,b)])),this.pattern&&b.expressions.unshift(new d(this.name,new A(""+D+"["+k+"]"))),c+=this.pluckDirectCall(a,b),p&&(E="\n"+i+p+";"),this.object&&(e=""+k+" in "+D,this.own&&(h="\n"+i+"if (!"+bg("hasProp")+".call("+D+", "+k+")) continue;")),b=b.compile(bc(a,{indent:i}),z),b&&(b="\n"+b+"\n");return""+c+(s||"")+this.tab+"for ("+e+") {"+h+E+b+this.tab+"}"+(t||"")},a.prototype.pluckDirectCall=function(a,b){var c,e,f,h,i,k,l,m,n,o,p,q,r,s;e="",n=b.expressions;for(i=0,m=n.length;i<m;i++){f=n[i],f=f.unwrapAll();if(!(f instanceof g))continue;l=f.variable.unwrapAll();if(!(l instanceof j||l instanceof V&&((o=l.base)!=null?o.unwrapAll():void 0)instanceof j&&l.properties.length===1&&((p=(q=l.properties[0].name)!=null?q.value:void 0)==="call"||p==="apply")))continue;h=((r=l.base)!=null?r.unwrapAll():void 0)||l,k=new A(a.scope.freeVariable("fn")),c=new V(k),l.base&&(s=[c,l],l.base=s[0],c=s[1]),b.expressions[i]=new g(c,f.args),e+=this.tab+(new d(k,h)).compile(a,z)+";\n"}return e};return a}(),a.Switch=P=function(){function a(a,b,c){this.subject=a,this.cases=b,this.otherwise=c}bj(a,e),a.prototype.children=["subject","cases","otherwise"],a.prototype.isStatement=X,a.prototype.jumps=function(a){var b,c,d,e,f,g,h;a==null&&(a={block:!0}),f=this.cases;for(d=0,e=f.length;d<e;d++){g=f[d],c=g[0],b=g[1];if(b.jumps(a))return b}return(h=this.otherwise)!=null?h.jumps(a):void 0},a.prototype.makeReturn=function(){var a,b,c,d,e;d=this.cases;for(b=0,c=d.length;b<c;b++)a=d[b],a[1].makeReturn();(e=this.otherwise)!=null&&e.makeReturn();return this},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q;i=a.indent+Q,j=a.indent=i+Q,d=this.tab+("switch ("+(((n=this.subject)!=null?n.compile(a,y):void 0)||!1)+") {\n"),o=this.cases;for(h=0,l=o.length;h<l;h++){p=o[h],f=p[0],b=p[1],q=ba([f]);for(k=0,m=q.length;k<m;k++)e=q[k],this.subject||(e=e.invert()),d+=i+("case "+e.compile(a,y)+":\n");if(c=b.compile(a,z))d+=c+"\n";if(h===this.cases.length-1&&!this.otherwise)break;g=this.lastNonComment(b.expressions);if(g instanceof K||g instanceof A&&g.jumps()&&g.value!=="debugger")continue;d+=j+"break;\n"}this.otherwise&&this.otherwise.expressions.length&&(d+=i+("default:\n"+this.otherwise.compile(a,z)+"\n"));return d+this.tab+"}"};return a}(),a.If=r=function(){function a(a,b,c){this.body=b,c==null&&(c={}),this.condition=c.type==="unless"?a.invert():a,this.elseBody=null,this.isChain=!1,this.soak=c.soak}bj(a,e),a.prototype.children=["condition","body","elseBody"],a.prototype.bodyNode=function(){var a;return(a=this.body)!=null?a.unwrap():void 0},a.prototype.elseBodyNode=function(){var a;return(a=this.elseBody)!=null?a.unwrap():void 0},a.prototype.addElse=function(b){this.isChain?this.elseBodyNode().addElse(b):(this.isChain=b instanceof a,this.elseBody=this.ensureBlock(b));return this},a.prototype.isStatement=function(a){var b;return(a!=null?a.level:void 0)===z||this.bodyNode().isStatement(a)||((b=this.elseBodyNode())!=null?b.isStatement(a):void 0)},a.prototype.jumps=function(a){var b;return this.body.jumps(a)||((b=this.elseBody)!=null?b.jumps(a):void 0)},a.prototype.compileNode=function(a){return this.isStatement(a)?this.compileStatement(a):this.compileExpression(a)},a.prototype.makeReturn=function(){this.body&&(this.body=new f([this.body.makeReturn()])),this.elseBody&&(this.elseBody=new f([this.elseBody.makeReturn()]));return this},a.prototype.ensureBlock=function(a){return a instanceof f?a:new f([a])},a.prototype.compileStatement=function(b){var c,d,e,f,g;d=Z(b,"chainChild"),f=Z(b,"isExistentialEquals");if(f)return(new a(this.condition.invert(),this.elseBodyNode(),{type:"if"})).compile(b);e=this.condition.compile(b,y),b.indent+=Q,c=this.ensureBlock(this.body).compile(b),c&&(c="\n"+c+"\n"+this.tab),g="if ("+e+") {"+c+"}",d||(g=this.tab+g);if(!this.elseBody)return g;return g+" else "+(this.isChain?(b.indent=this.tab,b.chainChild=!0,this.elseBody.unwrap().compile(b,z)):"{\n"+this.elseBody.compile(b,z)+"\n"+this.tab+"}")},a.prototype.compileExpression=function(a){var b,c,d,e;e=this.condition.compile(a,v),c=this.bodyNode().compile(a,w),b=this.elseBodyNode()?this.elseBodyNode().compile(a,w):"void 0",d=""+e+" ? "+c+" : "+b;return a.level>=v?"("+d+")":d},a.prototype.unfoldSoak=function(){return this.soak&&this};return a}(),I={wrap:function(a,c){if(c.isEmpty()||bb(c.expressions).jumps())return c;return c.push(new g(new V(new A(a),[new b(new A("push"))]),[c.pop()]))}},i={wrap:function(a,c,d){var e,h,i,k,l;if(a.jumps())return a;i=new j([],f.wrap([a])),e=[];if((k=a.contains(this.literalArgs))||a.contains(this.literalThis))l=new A(k?"apply":"call"),e=[new A("this")],k&&e.push(new A("arguments")),i=new V(i,[new b(l)]);i.noReturn=d,h=new g(i,e);return c?f.wrap([h]):h},literalArgs:function(a){return a instanceof A&&a.value==="arguments"&&!a.asKey},literalThis:function(a){return a instanceof A&&a.value==="this"&&!a.asKey||a instanceof j&&a.bound}},bf=function(a,b,c){var d;if(!!(d=b[c].unfoldSoak(a))){b[c]=d.body,d.body=new V(b);return d}},U={"extends":"function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}",bind:"function(fn, me){ return function(){ return fn.apply(me, arguments); }; }",indexOf:"Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}",hasProp:"Object.prototype.hasOwnProperty",slice:"Array.prototype.slice"},z=1,y=2,w=3,v=4,x=5,u=6,Q="  ",p="[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*",o=RegExp("^"+p+"$"),L=/^[+-]?\d+$/,B=RegExp("^(?:("+p+")\\.prototype(?:\\.("+p+")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\]))|("+p+")$"),q=/^['"]/,bg=function(a){var b;b="__"+a,M.root.assign(b,U[a]);return b},bd=function(a,b){return a.replace(/\n/g,"$&"+b)}}).call(this)},require["./coffee-script"]=new function(){var exports=this;(function(){var Lexer,RESERVED,compile,fs,lexer,parser,path,_ref,__hasProp=Object.prototype.hasOwnProperty;fs=require("fs"),path=require("path"),_ref=require("./lexer"),Lexer=_ref.Lexer,RESERVED=_ref.RESERVED,parser=require("./parser").parser,require.extensions?require.extensions[".coffee"]=function(a,b){var c;c=compile(fs.readFileSync(b,"utf8"),{filename:b});return a._compile(c,b)}:require.registerExtension&&require.registerExtension(".coffee",function(a){return compile(a)}),exports.VERSION="1.1.2",exports.RESERVED=RESERVED,exports.helpers=require("./helpers"),exports.compile=compile=function(a,b){b==null&&(b={});try{return parser.parse(lexer.tokenize(a)).compile(b)}catch(c){b.filename&&(c.message="In "+b.filename+", "+c.message);throw c}},exports.tokens=function(a,b){return lexer.tokenize(a,b)},exports.nodes=function(a,b){return typeof a=="string"?parser.parse(lexer.tokenize(a,b)):parser.parse(a)},exports.run=function(a,b){var c,d;d=require.main,d.filename=process.argv[1]=b.filename?fs.realpathSync(b.filename):".",d.moduleCache&&(d.moduleCache={}),process.binding("natives").module&&(c=require("module").Module,d.paths=c._nodeModulePaths(path.dirname(b.filename)));return path.extname(d.filename)!==".coffee"||require.extensions?d._compile(compile(a,b),d.filename):d._compile(a,d.filename)},exports.eval=function(code,options){var Module,Script,js,k,o,r,sandbox,v,_i,_len,_module,_ref2,_ref3,_ref4,_require;options==null&&(options={});if(!!(code=code.trim())){if(_ref2=require("vm"),Script=_ref2.Script,_ref2){sandbox=Script.createContext(),sandbox.global=sandbox.root=sandbox.GLOBAL=sandbox;if(options.sandbox!=null)if(options.sandbox instanceof sandbox.constructor)sandbox=options.sandbox;else{_ref3=options.sandbox;for(k in _ref3){if(!__hasProp.call(_ref3,k))continue;v=_ref3[k],sandbox[k]=v}}sandbox.__filename=options.filename||"eval",sandbox.__dirname=path.dirname(sandbox.__filename);if(!sandbox.module&&!sandbox.require){Module=require("module"),sandbox.module=_module=new Module(options.modulename||"eval"),sandbox.require=_require=function(a){return Module._load(a,_module)},_module.filename=sandbox.__filename,_ref4=Object.getOwnPropertyNames(require);for(_i=0,_len=_ref4.length;_i<_len;_i++)r=_ref4[_i],_require[r]=require[r];_require.paths=_module.paths=Module._nodeModulePaths(process.cwd()),_require.resolve=function(a){return Module._resolveFilename(a,_module)}}}o={};for(k in options){if(!__hasProp.call(options,k))continue;v=options[k],o[k]=v}o.bare=!0,js=compile(code,o);return Script?Script.runInContext(js,sandbox):eval(js)}},lexer=new Lexer,parser.lexer={lex:function(){var a,b;b=this.tokens[this.pos++]||[""],a=b[0],this.yytext=b[1],this.yylineno=b[2];return a},setInput:function(a){this.tokens=a;return this.pos=0},upcomingInput:function(){return""}},parser.yy=require("./nodes")}).call(this)},require["./browser"]=new function(){var exports=this;(function(){var CoffeeScript,runScripts;CoffeeScript=require("./coffee-script"),CoffeeScript.require=require,CoffeeScript.eval=function(code,options){return eval(CoffeeScript.compile(code,options))},CoffeeScript.run=function(a,b){b==null&&(b={}),b.bare=!0;return Function(CoffeeScript.compile(a,b))()};typeof window!="undefined"&&window!==null&&(CoffeeScript.load=function(a,b){var c;c=new(window.ActiveXObject||XMLHttpRequest)("Microsoft.XMLHTTP"),c.open("GET",a,!0),"overrideMimeType"in c&&c.overrideMimeType("text/plain"),c.onreadystatechange=function(){var d;if(c.readyState===4){if((d=c.status)===0||d===200)CoffeeScript.run(c.responseText);else throw new Error("Could not load "+a);if(b)return b()}};return c.send(null)},runScripts=function(){var a,b,c,d,e,f;f=document.getElementsByTagName("script"),a=function(){var a,b,c;c=[];for(a=0,b=f.length;a<b;a++)e=f[a],e.type==="text/coffeescript"&&c.push(e);return c}(),c=0,d=a.length,(b=function(){var d;d=a[c++];if((d!=null?d.type:void 0)==="text/coffeescript"){if(d.src)return CoffeeScript.load(d.src,b);CoffeeScript.run(d.innerHTML);return b()}})();return null},window.addEventListener?addEventListener("DOMContentLoaded",runScripts,!1):attachEvent("onload",runScripts))}).call(this)};return require["./coffee-script"]}()
/*jslint plusplus: false, evil: true, regexp: false */

var root = this;

root.haml = {

  compileHaml: function (templateId) {
    if (haml.cache && haml.cache[templateId]) {
      return haml.cache[templateId];
    }

    var result = this.compileHamlToJs(new haml.Tokeniser({templateId: templateId}));
    var fn = null;

    try {
      fn = new Function('context', result);
    } catch (e) {
      throw "Incorrect embedded JS code has resulted in an invalid Haml function - " + e + "\nGenerated Function:\n" +
        result;
    }

    if (!haml.cache) {
      haml.cache = {};
    }
    haml.cache[templateId] = fn;

    return fn;
  },
  
  compileStringToJs: function (string) {
    var result = this.compileHamlToJs(new haml.Tokeniser({template: string}));
    var fn = null;

    try {
      fn = new Function('context', result);
    } catch (e) {
      throw "Incorrect embedded JS code has resulted in an invalid Haml function - " + e + "\nGenerated Function:\n" +
        result;
    }
    return fn
  },

  compileHamlToJs: function (tokeniser)
  {
    var outputBuffer = new haml.Buffer();
    var elementStack = [];

    var result = '  var html = [];\n';
    result += '  var hashFunction = null, hashObject = null, objRef = null, objRefFn = null;\n  with (context) {\n';

    // HAML -> WS* (
    //          TEMPLATELINE
    //          | IGNOREDLINE
    //          | EMBEDDEDJS
    //          | JSCODE
    //          | COMMENTLINE
    //         )* EOF
    tokeniser.getNextToken();
    while (!tokeniser.token.eof)
    {
      if (!tokeniser.token.eol)
      {
        var indent = haml.whitespace(tokeniser);
        if (tokeniser.token.exclamation)
        {
          haml.ignoredLine(tokeniser, indent, elementStack, outputBuffer);
        } else if (tokeniser.token.equal || tokeniser.token.escapeHtml || tokeniser.token.unescapeHtml ||
          tokeniser.token.tilde) {
          haml.embeddedJs(tokeniser, indent, elementStack, outputBuffer, {innerWhitespace: true});
        } else if (tokeniser.token.minus) {
          haml.jsLine(tokeniser, indent, elementStack, outputBuffer);
        } else if (tokeniser.token.comment || tokeniser.token.slash) {
          haml.commentLine(tokeniser, indent, elementStack, outputBuffer);
        } else if (tokeniser.token.amp) {
          haml.escapedLine(tokeniser, indent, elementStack, outputBuffer);
        } else {
          haml.templateLine(tokeniser, elementStack, outputBuffer, indent);
        }
      } else {
        tokeniser.getNextToken();
      }
    }

    haml.closeElements(0, elementStack, outputBuffer, tokeniser);
    outputBuffer.flush();
    result += outputBuffer.output();

    result += '  }\n  return html.join("");\n';
    return result;
  },

  commentLine: function (tokeniser, indent, elementStack, outputBuffer) {
    if (tokeniser.token.comment) {
      tokeniser.skipToEOLorEOF();
    } else if (tokeniser.token.slash) {
      haml.closeElements(indent, elementStack, outputBuffer, tokeniser);
      outputBuffer.append(haml.indentText(indent));
      outputBuffer.append("<!--");
      var contents = tokeniser.skipToEOLorEOF();
      if (contents && contents.length > 0) {
        outputBuffer.append(contents);
      }

      if (contents && _(contents).startsWith('[') && contents.match(/\]\s*$/)) {
        elementStack[indent] = { htmlConditionalComment: true };
        outputBuffer.append(">");
      } else {
        elementStack[indent] = { htmlComment: true };
      }

      if (haml.tagHasContents(indent, tokeniser)) {
        outputBuffer.append("\\n");
      }
    }
  },

  escapedLine: function (tokeniser, indent, elementStack, outputBuffer) {
    if (tokeniser.token.amp) {
      haml.closeElements(indent, elementStack, outputBuffer, tokeniser);
      outputBuffer.append(haml.indentText(indent));
      var contents = tokeniser.skipToEOLorEOF();
      if (contents && contents.length > 0) {
        outputBuffer.append(_(contents).escapeHTML());
      }
      outputBuffer.append("\\n");
    }
  },


  ignoredLine: function (tokeniser, indent, elementStack, outputBuffer) {
    if (tokeniser.token.exclamation) {
      tokeniser.getNextToken();
      if (tokeniser.token.ws) {
        indent += haml.whitespace(tokeniser);
      }
      tokeniser.pushBackToken();
      haml.closeElements(indent, elementStack, outputBuffer, tokeniser);
      var contents = tokeniser.skipToEOLorEOF();
      outputBuffer.append(haml.indentText(indent) + contents + '\\n');
    }
  },

  embeddedJs: function (tokeniser, indent, elementStack, outputBuffer, tagOptions) {
    if (elementStack) {
      haml.closeElements(indent, elementStack, outputBuffer, tokeniser);
    }
    if (tokeniser.token.equal || tokeniser.token.escapeHtml || tokeniser.token.unescapeHtml || tokeniser.token.tilde) {
      var escapeHtml = tokeniser.token.escapeHtml || tokeniser.token.equal;
      var perserveWhitespace = tokeniser.token.tilde;
      var currentParsePoint = tokeniser.currentParsePoint();
      var expression = tokeniser.skipToEOLorEOF();
      var indentText = haml.indentText(indent);
      if (!tagOptions || tagOptions.innerWhitespace) {
        outputBuffer.append(indentText);
      }
      outputBuffer.flush();

      outputBuffer.appendToOutputBuffer(indentText + 'try {\n');
      outputBuffer.appendToOutputBuffer(indentText + '    var value = eval("' +
        expression.replace(/"/g, '\\"').replace(/\\n/g, '\\\\n') + '");\n');
      outputBuffer.appendToOutputBuffer(indentText + '    value = value === null ? "" : value;');
      if (escapeHtml) {
        outputBuffer.appendToOutputBuffer(indentText + '    html.push(_(String(value)).escapeHTML());\n');
      } else if (perserveWhitespace) {
        outputBuffer.appendToOutputBuffer(indentText + '    html.push(haml.perserveWhitespace(String(value)));\n');
      } else {
        outputBuffer.appendToOutputBuffer(indentText + '    html.push(String(value));\n');
      }
      outputBuffer.appendToOutputBuffer(indentText + '} catch (e) {\n');
      outputBuffer.appendToOutputBuffer(indentText + '  throw new Error(haml.templateError(' +
              currentParsePoint.lineNumber + ', ' + currentParsePoint.characterNumber + ', "' +
              haml.escapeJs(currentParsePoint.currentLine) + '",\n');
      outputBuffer.appendToOutputBuffer(indentText + '    "Error evaluating expression - " + e));\n');
      outputBuffer.appendToOutputBuffer(indentText + '}\n');

      if (!tagOptions || tagOptions.innerWhitespace) {
        outputBuffer.append("\\n");
      }
    }
  },

  jsLine: function (tokeniser, indent, elementStack, outputBuffer) {
    if (tokeniser.token.minus) {
      haml.closeElements(indent, elementStack, outputBuffer, tokeniser);
      outputBuffer.flush();
      outputBuffer.appendToOutputBuffer(haml.indentText(indent));
      var line = tokeniser.skipToEOLorEOF();
      outputBuffer.appendToOutputBuffer(line);
      outputBuffer.appendToOutputBuffer('\n');

      if (line.match(/function\s\((,?\s*\w+)*\)\s*\{\s*$/)) {
        elementStack[indent] = { fnBlock: true };
      } else if (line.match(/\{\s*$/)) {
        elementStack[indent] = { block: true };
      }
    }
  },

  // TEMPLATELINE -> ([ELEMENT][IDSELECTOR][CLASSSELECTORS][ATTRIBUTES] [SLASH|CONTENTS])|(!CONTENTS) (EOL|EOF)
  templateLine: function (tokeniser, elementStack, outputBuffer, indent) {
    if (!tokeniser.token.eol) {
      haml.closeElements(indent, elementStack, outputBuffer, tokeniser);
    }

    var ident = haml.element(tokeniser);
    var id = haml.idSelector(tokeniser);
    var classes = haml.classSelector(tokeniser);
    var objectRef = haml.objectReference(tokeniser);
    var attrList = haml.attributeList(tokeniser);

    var currentParsePoint = tokeniser.currentParsePoint();
    var attributesHash = haml.attributeHash(tokeniser);

    var tagOptions = {
      selfClosingTag: false,
      innerWhitespace: true,
      outerWhitespace: true
    };
    if (tokeniser.token.slash) {
      tagOptions.selfClosingTag = true;
      tokeniser.getNextToken();
    }
    if (tokeniser.token.gt && haml.lineHasElement(ident, id, classes)) {
      tagOptions.outerWhitespace = false;
      tokeniser.getNextToken();
    }
    if (tokeniser.token.lt && haml.lineHasElement(ident, id, classes)) {
      tagOptions.innerWhitespace = false;
      tokeniser.getNextToken();
    }

    if (haml.lineHasElement(ident, id, classes)) {
      if (!tagOptions.selfClosingTag) {
        tagOptions.selfClosingTag = haml.isSelfClosingTag(ident) && !haml.tagHasContents(indent, tokeniser);
      }
      haml.openElement(currentParsePoint, indent, ident, id, classes, objectRef, attrList, attributesHash, elementStack,
        outputBuffer, tagOptions);
    } else if (!haml.isEolOrEof(tokeniser) && !tokeniser.token.ws) {
      tokeniser.pushBackToken();
    }

    var contents = haml.elementContents(tokeniser, indent + 1, outputBuffer, tagOptions);
    haml.eolOrEof(tokeniser);

    if (tagOptions.selfClosingTag && contents.length > 0) {
      throw haml.templateError(currentParsePoint.lineNumber, currentParsePoint.characterNumber,
              currentParsePoint.currentLine, "A self-closing tag can not have any contents");
    }
    else if (contents.length > 0) {
      if (contents.match(/^\\%/)) {
        contents = contents.substring(1);
      }
      if (tagOptions.innerWhitespace && haml.lineHasElement(ident, id, classes) ||
        (!haml.lineHasElement(ident, id, classes) && haml.parentInnerWhitespace(elementStack, indent))) {
        var i = indent;
        if (ident.length > 0) {
          i += 1;
        }
        outputBuffer.append(haml.indentText(i) + contents + '\\n');
      } else {
        outputBuffer.append(_(contents).trim() + '\\n');
      }
    } else if (!haml.lineHasElement(ident, id, classes) && tagOptions.innerWhitespace) {
      outputBuffer.append(haml.indentText(indent) + '\\n');
    }
  },

  elementContents: function (tokeniser, indent, outputBuffer, tagOptions) {
    var contents = '';

    if (!tokeniser.token.eof) {
      if (tokeniser.token.ws) {
        tokeniser.getNextToken();
      }

      if (tokeniser.token.exclamation) {
        contents = tokeniser.skipToEOLorEOF();
      } else if (tokeniser.token.equal || tokeniser.token.escapeHtml || tokeniser.token.unescapeHtml) {
        haml.embeddedJs(tokeniser, indent, null, outputBuffer, tagOptions);
      } else if (!tokeniser.token.eol) {
        tokeniser.pushBackToken();
        contents = tokeniser.skipToEOLorEOF();
      }
    }

    return contents;
  },

  attributeHash: function (tokeniser) {
    var attr = '';
    if (tokeniser.token.attributeHash) {
      attr = tokeniser.token.tokenString;
      tokeniser.getNextToken();
    }
    return attr;
  },

  objectReference: function (tokeniser) {
    var attr = '';
    if (tokeniser.token.objectReference) {
      attr = tokeniser.token.tokenString;
      tokeniser.getNextToken();
    }
    return attr;
  },

  // ATTRIBUTES -> ( ATTRIBUTE* )
  attributeList: function (tokeniser) {
    var attrList = {};
    if (tokeniser.token.openBracket) {
      tokeniser.getNextToken();
      while (!tokeniser.token.closeBracket) {
        var attr = haml.attribute(tokeniser);
        if (attr) {
          attrList[attr.name] = attr.value;
        } else {
          tokeniser.getNextToken();
        }
        if (tokeniser.token.ws || tokeniser.token.eol) {
          tokeniser.getNextToken();
        } else if (!tokeniser.token.closeBracket && !tokeniser.token.identifier) {
          throw tokeniser.parseError("Expecting either an attribute name to continue the attibutes or a closing " +
            "bracket to end");
        }
      }
      tokeniser.getNextToken();
    }
    return attrList;
  },

  // ATTRIBUTE -> IDENTIFIER WS* = WS* STRING
  attribute: function (tokeniser) {
    var attr = null;

    if (tokeniser.token.identifier) {
      var name = tokeniser.token.tokenString;
      tokeniser.getNextToken();
      haml.whitespace(tokeniser);
      if (!tokeniser.token.equal) {
        throw tokeniser.parseError("Expected '=' after attribute name");
      }
      tokeniser.getNextToken();
      haml.whitespace(tokeniser);
      if (!tokeniser.token.string && !tokeniser.token.identifier) {
        throw tokeniser.parseError("Expected a quoted string or an identifier for the attribute value");
      }
      attr = {name: name, value: tokeniser.token.tokenString};
      tokeniser.getNextToken();
    }

    return attr;
  },

  closeElement: function (indent, elementStack, outputBuffer, tokeniser) {
    if (elementStack[indent]) {
      if (elementStack[indent].htmlComment) {
        outputBuffer.append(haml.indentText(indent) + '-->\\n');
      } else if (elementStack[indent].htmlConditionalComment) {
        outputBuffer.append(haml.indentText(indent) + '<![endif]-->\\n');
      } else if (elementStack[indent].block) {
        if (!tokeniser.token.minus || !tokeniser.matchToken(/\s*\}/g)) {
          outputBuffer.flush();
          outputBuffer.appendToOutputBuffer(haml.indentText(indent) + '}\n');
        }
      } else if (elementStack[indent].fnBlock) {
        if (!tokeniser.token.minus || !tokeniser.matchToken(/\s*\}/g)) {
          outputBuffer.flush();
          outputBuffer.appendToOutputBuffer(haml.indentText(indent) + '});\n');
        }
      } else {
        var innerWhitespace = !elementStack[indent].tagOptions || elementStack[indent].tagOptions.innerWhitespace;
        if (innerWhitespace) {
          outputBuffer.append(haml.indentText(indent));
        } else {
          outputBuffer.trimWhitespace();
        }
        outputBuffer.append('</' + elementStack[indent].tag + '>');
        var outerWhitespace = !elementStack[indent].tagOptions || elementStack[indent].tagOptions.outerWhitespace;
        if (haml.parentInnerWhitespace(elementStack, indent) && outerWhitespace) {
          outputBuffer.append('\\n');
        }
      }
      elementStack[indent] = null;
    }
  },

  closeElements: function (indent, elementStack, outputBuffer, tokeniser) {
    for (var i = elementStack.length - 1; i >= indent; (i--)) {
      haml.closeElement(i, elementStack, outputBuffer, tokeniser);
    }
  },

  openElement: function (currentParsePoint,
                         indent,
                         ident,
                         id,
                         classes,
                         objectRef,
                         attributeList,
                         attributeHash,
                         elementStack,
                         outputBuffer,
                         tagOptions) {
    var element = ident;
    if (element.length === 0) {
      element = 'div';
    }

    var parentInnerWhitespace = haml.parentInnerWhitespace(elementStack, indent);
    var tagOuterWhitespace = !tagOptions || tagOptions.outerWhitespace;
    if (!tagOuterWhitespace) {
      outputBuffer.trimWhitespace();
    }
    if (indent > 0 && parentInnerWhitespace && tagOuterWhitespace) {
      outputBuffer.append(haml.indentText(indent));
    }
    outputBuffer.append('<' + element);
    if (attributeHash.length > 0 || objectRef.length > 0) {
      outputBuffer.flush();
      if (attributeHash.length > 0) {
        attributeHash = this.replaceReservedWordsInHash(attributeHash);
        outputBuffer.appendToOutputBuffer('    hashFunction = function () { return eval("hashObject = ' +
          attributeHash.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"); };\n');
      }
      if (objectRef.length > 0) {
        outputBuffer.appendToOutputBuffer('    objRefFn = function () { return eval("objRef = ' +
          objectRef.replace(/"/g, '\\"') + '"); };\n');
      }

      outputBuffer.appendToOutputBuffer('    html.push(haml.generateElementAttributes(context, "' +
              id + '", ["' +
              classes.join('","') + '"], objRefFn, ' +
              JSON.stringify(attributeList) + ', hashFunction, ' +
              currentParsePoint.lineNumber + ', ' + currentParsePoint.characterNumber + ', "' +
              haml.escapeJs(currentParsePoint.currentLine) + '"));\n');
    } else {
      outputBuffer.append(haml.generateElementAttributes(null, id, classes, null, attributeList, null,
              currentParsePoint.lineNumber, currentParsePoint.characterNumber, currentParsePoint.currentLine));
    }
    if (tagOptions.selfClosingTag) {
      outputBuffer.append("/>");
      if (tagOptions.outerWhitespace) {
        outputBuffer.append("\\n");
      }
    } else {
      outputBuffer.append(">");
      elementStack[indent] = { tag: element, tagOptions: tagOptions };
      if (tagOptions.innerWhitespace) {
        outputBuffer.append("\\n");
      }
    }
  },

  replaceReservedWordsInHash: function (hash) {
    var resultHash;

    resultHash = hash;
    _(['class', 'for']).each(function (reservedWord) {
      resultHash = resultHash.replace(reservedWord + ':', '"' + reservedWord + '":');
    });

    return resultHash;
  },

  escapeJs: function (jsStr) {
    return jsStr.replace(/"/g, '\\"');
  },

  combineAttributes: function (attributes, attrName, attrValue) {
    if (haml.hasValue(attrValue)) {
      if (attrName === 'id' && attrValue.toString().length > 0) {
        if (attributes && attributes.id instanceof Array) {
          attributes.id.unshift(attrValue);
        } else if (attributes && attributes.id) {
          attributes.id = [attributes.id, attrValue];
        } else if (attributes) {
          attributes.id = attrValue;
        } else {
          attributes = {id: attrValue};
        }
      }
      else if (attrName === 'for' && attrValue.toString().length > 0) {
        if (attributes && attributes['for'] instanceof Array) {
          attributes['for'].unshift(attrValue);
        } else if (attributes && attributes['for']) {
          attributes['for'] = [attributes['for'], attrValue];
        } else if (attributes) {
          attributes['for'] = attrValue;
        } else {
          attributes = {'for': attrValue};
        }
      } else if (attrName === 'class') {
        var classes = [];
        if (attrValue instanceof Array) {
          classes = classes.concat(attrValue);
        } else {
          classes.push(attrValue);
        }
        if (attributes && attributes['class']) {
          attributes['class'] = attributes['class'].concat(classes);
        } else if (attributes) {
          attributes['class'] = classes;
        } else {
          attributes = {'class': classes};
        }
      } else if (attrName !== 'id') {
        if (!attributes) {
          attributes = {};
        }
        attributes[attrName] = attrValue;
      }
    }
    return attributes;
  },

  isSelfClosingTag: function (tag) {
    return _(['meta', 'img', 'link', 'script', 'br', 'hr']).contains(tag);
  },

  tagHasContents: function (indent, tokeniser) {
    if (!haml.isEolOrEof(tokeniser)) {
      return true;
    } else {
      var nextToken = tokeniser.lookAhead(1);
      return nextToken.ws && nextToken.tokenString.length / 2 > indent;
    }
  },

  parentInnerWhitespace: function (elementStack, indent)
  {
    return indent === 0 || (!elementStack[indent - 1] || !elementStack[indent - 1].tagOptions ||
      elementStack[indent - 1].tagOptions.innerWhitespace);
  },

  lineHasElement: function (ident, id, classes)
  {
    return ident.length > 0 || id.length > 0 || classes.length > 0;
  },

  generateElementAttributes: function (context,
                                       id,
                                       classes,
                                       objRefFn,
                                       attrList,
                                       attrFunction,
                                       lineNumber,
                                       characterNumber,
                                       currentLine) {
    var attributes = {};

    attributes = haml.combineAttributes(attributes, 'id', id);
    if (classes.length > 0 && classes[0].length > 0) {
      attributes = haml.combineAttributes(attributes, 'class', classes);
    }

    var attr;
    if (attrList) {
      for (attr in attrList) {
        if (attrList.hasOwnProperty(attr)) {
          attributes = haml.combineAttributes(attributes, attr, attrList[attr]);
        }
      }
    }

    if (objRefFn) {
      try {
        var object = objRefFn.call(this, context);
        if (object) {
          var objectId = null;
          if (object.id) {
            objectId = object.id;
          } else if (object.get) {
            objectId = object.get('id');
          }
          attributes = haml.combineAttributes(attributes, 'id', objectId);
          var className = null;
          if (object['class']) {
            className = object['class'];
          } else if (object.get) {
            className = object.get('class');
          }
          attributes = haml.combineAttributes(attributes, 'class', className);
        }
      } catch (e) {
        throw haml.templateError(lineNumber, characterNumber, currentLine, "Error evaluating object reference - " + e);
      }
    }

    if (attrFunction) {
      try {
        var hash = attrFunction.call(this, context);
        if (hash) {
          for (attr in hash) {
            if (hash.hasOwnProperty(attr)) {
              if (attr === 'data') {
                var dataAttributes = hash[attr];
                for (var dataAttr in dataAttributes) {
                  if (dataAttributes.hasOwnProperty(dataAttr)) {
                    attributes = haml.combineAttributes(attributes, 'data-' + dataAttr, dataAttributes[dataAttr]);
                  }
                }
              } else {
                attributes = haml.combineAttributes(attributes, attr, hash[attr]);
              }
            }
          }
        }
      } catch (ex) {
        throw haml.templateError(lineNumber, characterNumber, currentLine, "Error evaluating attribute hash - " + ex);
      }
    }

    var html = '';
    if (attributes) {
      for (attr in attributes) {
        if (attributes.hasOwnProperty(attr) && haml.hasValue(attributes[attr])) {
          if ((attr === 'id' || attr === 'for') && attributes[attr] instanceof Array) {
            html += ' ' + attr + '="' + _(attributes[attr]).flatten().join('-') + '"';
          } else if (attr === 'class' && attributes[attr] instanceof Array) {
            html += ' ' + attr + '="' + _(attributes[attr]).flatten().join(' ') + '"';
          } else {
            html += ' ' + attr + '="' + haml.attrValue(attr, attributes[attr]) + '"';
          }
        }
      }
    }
    return html;
  },

  hasValue: function (value) {
    return value !== undefined && value !== null && value !== false;
  },

  attrValue: function (attr, value) {
    if (_(['selected', 'checked', 'disabled']).contains(attr)) {
      return attr;
    } else {
      return value;
    }
  },

  indentText: function (indent) {
    var text = '';
    for (var i = 0; i < indent; i++) {
      text += '  ';
    }
    return text;
  },

  whitespace: function (tokeniser) {
    var indent = 0;
    if (tokeniser.token.ws) {
      indent = tokeniser.token.tokenString.length / 2;
      tokeniser.getNextToken();
    }
    return indent;
  },

  element: function (tokeniser) {
    var ident = '';
    if (tokeniser.token.element) {
      ident = tokeniser.token.tokenString;
      tokeniser.getNextToken();
    }
    return ident;
  },

  eolOrEof: function (tokeniser) {
    if (tokeniser.token.eol) {
      tokeniser.getNextToken();
    } else if (!tokeniser.token.eof) {
      throw tokeniser.parseError("Expected EOL or EOF");
    }
  },

  // IDSELECTOR = # ID
  idSelector: function (tokeniser) {
    var id = '';
    if (tokeniser.token.idSelector) {
      id = tokeniser.token.tokenString;
      tokeniser.getNextToken();
    }
    return id;
  },

  // CLASSSELECTOR = (.CLASS)+
  classSelector: function (tokeniser) {
    var classes = [];

    while (tokeniser.token.classSelector) {
      classes.push(tokeniser.token.tokenString);
      tokeniser.getNextToken();
    }

    return classes;
  },

  templateError: function (lineNumber, characterNumber, currentLine, error) {
    var message = error + " at line " + lineNumber + " and character " + characterNumber +
            ":\n" + currentLine + '\n';
    for (var i = 0; i < characterNumber - 1; i++) {
      message += '-';
    }
    message += '^';
    return message;
  },

  isEolOrEof: function (tokeniser) {
    return tokeniser.token.eol || tokeniser.token.eof;
  },

  perserveWhitespace: function (str) {
    var re = /<[a-zA-Z]+>[^<]*<\/[a-zA-Z]+>/g;
    var out = '';
    var i = 0;
    var result = re.exec(str);
    if (result) {
      while (result) {
        out += str.substring(i, result.index);
        out += result[0].replace(/\n/g, '&#x000A;');
        i = result.index + result[0].length;
        result = re.exec(str);
      }
      out += str.substring(i);
    } else {
      out = str;
    }
    return out;
  },

  Tokeniser: function (options) {
    this.buffer = null;
    this.bufferIndex = null;
    this.prevToken = null;
    this.token = null;

    if (options.templateId) {
      var template = document.getElementById(options.templateId);
      if (template) {
        this.buffer = template.innerHTML;
        this.bufferIndex = 0;
      } else {
        throw "Did not find a template with ID '" + options.templateId + "'";
      }
    } else if (options.template) {
      this.buffer = options.template;
      this.bufferIndex = 0;
    }

    this.tokenMatchers = {
      whitespace:       /[ \t]+/g,
      element:          /%[a-zA-Z][a-zA-Z0-9]*/g,
      idSelector:       /#[a-zA-Z_\-][a-zA-Z0-9_\-]*/g,
      classSelector:    /\.[a-zA-Z0-9_\-]+/g,
      identifier:       /[a-zA-Z][a-zA-Z0-9\-]*/g,
      quotedString:     /[\'][^\'\n]*[\']/g,
      quotedString2:    /[\"][^\"\n]*[\"]/g,
      comment:          /\-#/g,
      escapeHtml:       /\&=/g,
      unescapeHtml:     /\!=/g,
      objectReference:  /\[[a-zA-Z_][a-zA-Z0-9_]*\]/g
    };

    this.matchToken = function (matcher) {
      matcher.lastIndex = this.bufferIndex;
      var result = matcher.exec(this.buffer);
      if (result && result.index === this.bufferIndex) {
        return result[0];
      }
      return null;
    };

    this.getNextToken = function () {

      if (isNaN(this.bufferIndex)) {
        throw haml.templateError(this.lineNumber, this.characterNumber, this.currentLine,
                "An internal parser error has occurred in the HAML parser");
      }

      this.prevToken = this.token;
      this.token = null;

      if (this.buffer === null || this.buffer.length === this.bufferIndex) {
        this.token = { eof: true, token: 'EOF' };
      } else {
        this.initLine();

        if (!this.token) {
          var ch = this.buffer.charCodeAt(this.bufferIndex);
          var ch1 = this.buffer.charCodeAt(this.bufferIndex + 1);
          if (ch === 10 || (ch === 13 && ch1 === 10)) {
            this.token = { eol: true, token: 'EOL' };
            if (ch === 13 && ch1 === 10) {
              this.advanceCharsInBuffer(2);
              this.token.matched = String.fromCharCode(ch) + String.fromCharCode(ch1);
            } else {
              this.advanceCharsInBuffer(1);
              this.token.matched = String.fromCharCode(ch);
            }
            this.characterNumber = 0;
            this.currentLine = this.getCurrentLine();
          }
        }

        if (!this.token) {
          var ws = this.matchToken(this.tokenMatchers.whitespace);
          if (ws) {
            this.token = { ws: true, token: 'WS', tokenString: ws, matched: ws };
            this.advanceCharsInBuffer(ws.length);
          }
        }

        if (!this.token) {
          var element = this.matchToken(this.tokenMatchers.element);
          if (element) {
            this.token = { element: true, token: 'ELEMENT', tokenString: element.substring(1),
              matched: element };
            this.advanceCharsInBuffer(element.length);
          }
        }

        if (!this.token) {
          var id = this.matchToken(this.tokenMatchers.idSelector);
          if (id) {
            this.token = { idSelector: true, token: 'ID', tokenString: id.substring(1), matched: id };
            this.advanceCharsInBuffer(id.length);
          }
        }

        if (!this.token) {
          var c = this.matchToken(this.tokenMatchers.classSelector);
          if (c) {
            this.token = { classSelector: true, token: 'CLASS', tokenString: c.substring(1), matched: c };
            this.advanceCharsInBuffer(c.length);
          }
        }

        if (!this.token) {
          var identifier = this.matchToken(this.tokenMatchers.identifier);
          if (identifier) {
            this.token = { identifier: true, token: 'IDENTIFIER', tokenString: identifier, matched: identifier };
            this.advanceCharsInBuffer(identifier.length);
          }
        }

        if (!this.token) {
          var str = this.matchToken(this.tokenMatchers.quotedString);
          if (!str) {
            str = this.matchToken(this.tokenMatchers.quotedString2);
          }
          if (str) {
            this.token = { string: true, token: 'STRING', tokenString: str.substring(1, str.length - 1),
              matched: str };
            this.advanceCharsInBuffer(str.length);
          }
        }

        if (!this.token) {
          var comment = this.matchToken(this.tokenMatchers.comment);
          if (comment) {
            this.token = { comment: true, token: 'COMMENT', tokenString: comment, matched: comment};
            this.advanceCharsInBuffer(comment.length);
          }
        }

        if (!this.token) {
          var escapeHtml = this.matchToken(this.tokenMatchers.escapeHtml);
          if (escapeHtml) {
            this.token = { escapeHtml: true, token: 'ESCAPEHTML', tokenString: escapeHtml, matched: escapeHtml};
            this.advanceCharsInBuffer(escapeHtml.length);
          }
        }

        if (!this.token) {
          var unescapeHtml = this.matchToken(this.tokenMatchers.unescapeHtml);
          if (unescapeHtml) {
            this.token = { unescapeHtml: true, token: 'UNESCAPEHTML', tokenString: unescapeHtml, matched: unescapeHtml};
            this.advanceCharsInBuffer(unescapeHtml.length);
          }
        }

        if (!this.token) {
          var objectReference = this.matchToken(this.tokenMatchers.objectReference);
          if (objectReference) {
            this.token = { objectReference: true, token: 'OBJECTREFERENCE', tokenString: objectReference.substring(1,
              objectReference.length - 1), matched: objectReference};
            this.advanceCharsInBuffer(objectReference.length);
          }
        }

        if (!this.token) {
          if (this.buffer && this.buffer.charAt(this.bufferIndex) === '{') {
            var i = this.bufferIndex + 1;
            var characterNumberStart = this.characterNumber;
            var lineNumberStart = this.lineNumber;
            var braceCount = 1;
            while (i < this.buffer.length && (braceCount > 1 || this.buffer.charAt(i) !== '}')) {
              if (this.buffer.charAt(i) === '{') {
                braceCount++;
              } else if (this.buffer.charAt(i) === '}') {
                braceCount--;
              }
              i++;
            }
            if (i === this.buffer.length) {
              this.characterNumber = characterNumberStart + 1;
              this.lineNumber = lineNumberStart;
              throw this.parseError('Error parsing attribute hash - Did not find a terminating "}"');
            } else {
              this.token = { attributeHash: true, token: 'ATTRHASH',
                tokenString: this.buffer.substring(this.bufferIndex, i + 1),
                matched: this.buffer.substring(this.bufferIndex, i + 1) };
              this.advanceCharsInBuffer(i - this.bufferIndex + 1);
            }
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '(') {
            this.token = { openBracket: true, token: 'OPENBRACKET', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === ')') {
            this.token = { closeBracket: true, token: 'CLOSEBRACKET', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '=') {
            this.token = { equal: true, token: 'EQUAL', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '/') {
            this.token = { slash: true, token: 'SLASH', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '!') {
            this.token = { exclamation: true, token: 'EXCLAMATION', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '-') {
            this.token = { minus: true, token: 'MINUS', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '&') {
            this.token = { amp: true, token: 'AMP', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '<') {
            this.token = { lt: true, token: 'LT', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '>') {
            this.token = { gt: true, token: 'GT', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (!this.token) {
          if (this.buffer.charAt(this.bufferIndex) === '~') {
            this.token = { tilde: true, token: 'TILDE', tokenString: this.buffer.charAt(this.bufferIndex),
              matched: this.buffer.charAt(this.bufferIndex) };
            this.advanceCharsInBuffer(1);
          }
        }

        if (this.token === null) {
          this.token = { unknown: true, token: 'UNKNOWN' };
        }
      }
      return this.token;
    };

    this.lookAhead = function (numberOfTokens) {
      var token = null;
      if (numberOfTokens > 0) {
        var currentToken = this.token;
        var prevToken = this.prevToken;
        var currentLine = this.currentLine;
        var lineNumber = this.lineNumber;
        var characterNumber = this.characterNumber;
        var bufferIndex = this.bufferIndex;

        for (var i = 0; i < numberOfTokens; i++) {
          token = this.getNextToken();
        }

        this.token = currentToken;
        this.prevToken = prevToken;
        this.currentLine = currentLine;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.bufferIndex = bufferIndex;
      }
      return token;
    };

    this.initLine = function () {
      if (!this.currentLine && this.currentLine !== "") {
        this.currentLine = this.getCurrentLine();
        this.lineNumber = 1;
        this.characterNumber = 0;
      }
    };

    this.currentLineMatcher = /[^\n]*/g;
    this.getCurrentLine = function (index) {
      var i = index || 0;
      this.currentLineMatcher.lastIndex = this.bufferIndex + i;
      var line = this.currentLineMatcher.exec(this.buffer);
      if (line) {
        return line[0];
      }
      else {
        return '';
      }
    };

    this.parseError = function (error) {
      return haml.templateError(this.lineNumber, this.characterNumber, this.currentLine, error);
    };

    this.skipToEOLorEOF = function () {
      var text = '';

      if (!this.token.eof && !this.token.eol) {
        this.currentLineMatcher.lastIndex = this.bufferIndex;
        var line = this.currentLineMatcher.exec(this.buffer);
        if (line && line.index === this.bufferIndex) {
          text = line[0];
          this.advanceCharsInBuffer(text.length);
          this.getNextToken();
        }
      }

      return text;
    };

    this.advanceCharsInBuffer = function (numChars) {
      for (var i = 0; i < numChars; i++) {
        var ch = this.buffer.charCodeAt(this.bufferIndex + i);
        var ch1 = this.buffer.charCodeAt(this.bufferIndex + i + 1);
        if (ch === 13 && ch1 === 10) {
          this.lineNumber++;
          this.characterNumber = 0;
          this.currentLine = this.getCurrentLine(i);
          i++;
        } else if (ch === 10) {
          this.lineNumber++;
          this.characterNumber = 0;
          this.currentLine = this.getCurrentLine(i);
        } else {
          this.characterNumber++;
        }
      }
      this.bufferIndex += numChars;
    };

    this.currentParsePoint = function () {
      return {
        lineNumber: this.lineNumber,
        characterNumber: this.characterNumber,
        currentLine: this.currentLine
      };
    };

    this.pushBackToken = function () {
      if (!this.token.unknown) {
        this.bufferIndex -= this.token.matched.length;
        this.token = this.prevToken;
      }
    };
  },

  Buffer: function () {
    this.buffer = '';
    this.outputBuffer = '';

    this.append = function (str) {
      if (str && str.length > 0) {
        this.buffer += str;
      }
    };

    this.appendToOutputBuffer = function (str) {
      if (str && str.length > 0) {
        this.flush();
        this.outputBuffer += str;
      }
    };

    this.flush = function () {
      if (this.buffer && this.buffer.length > 0) {
        this.outputBuffer += '    html.push("' + haml.escapeJs(this.buffer) + '");\n';
      }
      this.buffer = '';
    };

    this.output = function () {
      return this.outputBuffer;
    };

    this.trimWhitespace = function () {
      if (this.buffer.length > 0) {
        var i = this.buffer.length - 1;
        while (i > 0) {
          var ch = this.buffer.charAt(i);
          if (ch === ' ' || ch === '\t' || ch === '\n') {
            i--;
          }
          else if (i > 1 && (ch === 'n' || ch === 't') && (this.buffer.charAt(i - 1) === '\\')) {
            i -= 2;
          } else {
            break;
          }
        }
        if (i > 0 && i < this.buffer.length - 1) {
          this.buffer = this.buffer.substring(0, i + 1);
        } else if (i === 0) {
          this.buffer = '';
        }
      }
    };
  }
};
/*!
 * jQuery JavaScript Library v1.7.1
 * http://jquery.com/
 *
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2011, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Mon Nov 21 21:11:03 2011 -0500
 */
(function( window, undefined ) {

// Use the correct document accordingly with window argument (sandbox)
var document = window.document,
	navigator = window.navigator,
	location = window.location;
var jQuery = (function() {

// Define a local copy of jQuery
var jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// A central reference to the root jQuery(document)
	rootjQuery,

	// A simple way to check for HTML strings or ID strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,

	// Check if a string has a non-whitespace character in it
	rnotwhite = /\S/,

	// Used for trimming whitespace
	trimLeft = /^\s+/,
	trimRight = /\s+$/,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,

	// JSON RegExp
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,

	// Useragent RegExp
	rwebkit = /(webkit)[ \/]([\w.]+)/,
	ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
	rmsie = /(msie) ([\w.]+)/,
	rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,

	// Matches dashed string for camelizing
	rdashAlpha = /-([a-z]|[0-9])/ig,
	rmsPrefix = /^-ms-/,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return ( letter + "" ).toUpperCase();
	},

	// Keep a UserAgent string for use with jQuery.browser
	userAgent = navigator.userAgent,

	// For matching the engine and version of the browser
	browserMatch,

	// The deferred used on DOM ready
	readyList,

	// The ready event handler
	DOMContentLoaded,

	// Save a reference to some core methods
	toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty,
	push = Array.prototype.push,
	slice = Array.prototype.slice,
	trim = String.prototype.trim,
	indexOf = Array.prototype.indexOf,

	// [[Class]] -> type pairs
	class2type = {};

jQuery.fn = jQuery.prototype = {
	constructor: jQuery,
	init: function( selector, context, rootjQuery ) {
		var match, elem, ret, doc;

		// Handle $(""), $(null), or $(undefined)
		if ( !selector ) {
			return this;
		}

		// Handle $(DOMElement)
		if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		}

		// The body element only exists once, optimize finding it
		if ( selector === "body" && !context && document.body ) {
			this.context = document;
			this[0] = document.body;
			this.selector = selector;
			this.length = 1;
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			// Are we dealing with HTML string or an ID?
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = quickExpr.exec( selector );
			}

			// Verify a match, and that no context was specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;
					doc = ( context ? context.ownerDocument || context : document );

					// If a single string is passed in and it's a single tag
					// just do a createElement and skip the rest
					ret = rsingleTag.exec( selector );

					if ( ret ) {
						if ( jQuery.isPlainObject( context ) ) {
							selector = [ document.createElement( ret[1] ) ];
							jQuery.fn.attr.call( selector, context, true );

						} else {
							selector = [ doc.createElement( ret[1] ) ];
						}

					} else {
						ret = jQuery.buildFragment( [ match[1] ], [ doc ] );
						selector = ( ret.cacheable ? jQuery.clone(ret.fragment) : ret.fragment ).childNodes;
					}

					return jQuery.merge( this, selector );

				// HANDLE: $("#id")
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "1.7.1",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	toArray: function() {
		return slice.call( this, 0 );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems, name, selector ) {
		// Build a new jQuery matched element set
		var ret = this.constructor();

		if ( jQuery.isArray( elems ) ) {
			push.apply( ret, elems );

		} else {
			jQuery.merge( ret, elems );
		}

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		ret.context = this.context;

		if ( name === "find" ) {
			ret.selector = this.selector + ( this.selector ? " " : "" ) + selector;
		} else if ( name ) {
			ret.selector = this.selector + "." + name + "(" + selector + ")";
		}

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Attach the listeners
		jQuery.bindReady();

		// Add the callback
		readyList.add( fn );

		return this;
	},

	eq: function( i ) {
		i = +i;
		return i === -1 ?
			this.slice( i ) :
			this.slice( i, i + 1 );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ),
			"slice", slice.call(arguments).join(",") );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {
		// Either a released hold or an DOMready/load event and not yet ready
		if ( (wait === true && !--jQuery.readyWait) || (wait !== true && !jQuery.isReady) ) {
			// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
			if ( !document.body ) {
				return setTimeout( jQuery.ready, 1 );
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If a normal DOM Ready event fired, decrement, and wait if need be
			if ( wait !== true && --jQuery.readyWait > 0 ) {
				return;
			}

			// If there are functions bound, to execute
			readyList.fireWith( document, [ jQuery ] );

			// Trigger any bound ready events
			if ( jQuery.fn.trigger ) {
				jQuery( document ).trigger( "ready" ).off( "ready" );
			}
		}
	},

	bindReady: function() {
		if ( readyList ) {
			return;
		}

		readyList = jQuery.Callbacks( "once memory" );

		// Catch cases where $(document).ready() is called after the
		// browser event has already occurred.
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			return setTimeout( jQuery.ready, 1 );
		}

		// Mozilla, Opera and webkit nightlies currently support this event
		if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", jQuery.ready, false );

		// If IE event model is used
		} else if ( document.attachEvent ) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", DOMContentLoaded );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", jQuery.ready );

			// If IE and not a frame
			// continually check to see if the document is ready
			var toplevel = false;

			try {
				toplevel = window.frameElement == null;
			} catch(e) {}

			if ( document.documentElement.doScroll && toplevel ) {
				doScrollCheck();
			}
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	// A crude way of determining if an object is a window
	isWindow: function( obj ) {
		return obj && typeof obj === "object" && "setInterval" in obj;
	},

	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	type: function( obj ) {
		return obj == null ?
			String( obj ) :
			class2type[ toString.call(obj) ] || "object";
	},

	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!hasOwn.call(obj, "constructor") &&
				!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.

		var key;
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		for ( var name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw new Error( msg );
	},

	parseJSON: function( data ) {
		if ( typeof data !== "string" || !data ) {
			return null;
		}

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = jQuery.trim( data );

		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( rvalidchars.test( data.replace( rvalidescape, "@" )
			.replace( rvalidtokens, "]" )
			.replace( rvalidbraces, "")) ) {

			return ( new Function( "return " + data ) )();

		}
		jQuery.error( "Invalid JSON: " + data );
	},

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && rnotwhite.test( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
	},

	// args is for internal usage only
	each: function( object, callback, args ) {
		var name, i = 0,
			length = object.length,
			isObj = length === undefined || jQuery.isFunction( object );

		if ( args ) {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.apply( object[ name ], args ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.apply( object[ i++ ], args ) === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.call( object[ i ], i, object[ i++ ] ) === false ) {
						break;
					}
				}
			}
		}

		return object;
	},

	// Use native String.trim function wherever possible
	trim: trim ?
		function( text ) {
			return text == null ?
				"" :
				trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				text.toString().replace( trimLeft, "" ).replace( trimRight, "" );
		},

	// results is for internal usage only
	makeArray: function( array, results ) {
		var ret = results || [];

		if ( array != null ) {
			// The window, strings (and functions) also have 'length'
			// Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
			var type = jQuery.type( array );

			if ( array.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow( array ) ) {
				push.call( ret, array );
			} else {
				jQuery.merge( ret, array );
			}
		}

		return ret;
	},

	inArray: function( elem, array, i ) {
		var len;

		if ( array ) {
			if ( indexOf ) {
				return indexOf.call( array, elem, i );
			}

			len = array.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in array && array[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var i = first.length,
			j = 0;

		if ( typeof second.length === "number" ) {
			for ( var l = second.length; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}

		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var ret = [], retVal;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value, key, ret = [],
			i = 0,
			length = elems.length,
			// jquery objects are treated as arrays
			isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;

		// Go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
		} else {
			for ( key in elems ) {
				value = callback( elems[ key ], key, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		return ret.concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		if ( typeof context === "string" ) {
			var tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		var args = slice.call( arguments, 2 ),
			proxy = function() {
				return fn.apply( context, args.concat( slice.call( arguments ) ) );
			};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;

		return proxy;
	},

	// Mutifunctional method to get and set values to a collection
	// The value/s can optionally be executed if it's a function
	access: function( elems, key, value, exec, fn, pass ) {
		var length = elems.length;

		// Setting many attributes
		if ( typeof key === "object" ) {
			for ( var k in key ) {
				jQuery.access( elems, k, key[k], exec, fn, value );
			}
			return elems;
		}

		// Setting one attribute
		if ( value !== undefined ) {
			// Optionally, function values get executed if exec is true
			exec = !pass && exec && jQuery.isFunction(value);

			for ( var i = 0; i < length; i++ ) {
				fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
			}

			return elems;
		}

		// Getting an attribute
		return length ? fn( elems[0], key ) : undefined;
	},

	now: function() {
		return ( new Date() ).getTime();
	},

	// Use of jQuery.browser is frowned upon.
	// More details: http://docs.jquery.com/Utilities/jQuery.browser
	uaMatch: function( ua ) {
		ua = ua.toLowerCase();

		var match = rwebkit.exec( ua ) ||
			ropera.exec( ua ) ||
			rmsie.exec( ua ) ||
			ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
			[];

		return { browser: match[1] || "", version: match[2] || "0" };
	},

	sub: function() {
		function jQuerySub( selector, context ) {
			return new jQuerySub.fn.init( selector, context );
		}
		jQuery.extend( true, jQuerySub, this );
		jQuerySub.superclass = this;
		jQuerySub.fn = jQuerySub.prototype = this();
		jQuerySub.fn.constructor = jQuerySub;
		jQuerySub.sub = this.sub;
		jQuerySub.fn.init = function init( selector, context ) {
			if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
				context = jQuerySub( context );
			}

			return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
		};
		jQuerySub.fn.init.prototype = jQuerySub.fn;
		var rootjQuerySub = jQuerySub(document);
		return jQuerySub;
	},

	browser: {}
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

browserMatch = jQuery.uaMatch( userAgent );
if ( browserMatch.browser ) {
	jQuery.browser[ browserMatch.browser ] = true;
	jQuery.browser.version = browserMatch.version;
}

// Deprecated, use jQuery.browser.webkit instead
if ( jQuery.browser.webkit ) {
	jQuery.browser.safari = true;
}

// IE doesn't match non-breaking spaces with \s
if ( rnotwhite.test( "\xA0" ) ) {
	trimLeft = /^[\s\xA0]+/;
	trimRight = /[\s\xA0]+$/;
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);

// Cleanup functions for the document ready method
if ( document.addEventListener ) {
	DOMContentLoaded = function() {
		document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
		jQuery.ready();
	};

} else if ( document.attachEvent ) {
	DOMContentLoaded = function() {
		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( document.readyState === "complete" ) {
			document.detachEvent( "onreadystatechange", DOMContentLoaded );
			jQuery.ready();
		}
	};
}

// The DOM ready check for Internet Explorer
function doScrollCheck() {
	if ( jQuery.isReady ) {
		return;
	}

	try {
		// If IE is used, use the trick by Diego Perini
		// http://javascript.nwbox.com/IEContentLoaded/
		document.documentElement.doScroll("left");
	} catch(e) {
		setTimeout( doScrollCheck, 1 );
		return;
	}

	// and execute any waiting functions
	jQuery.ready();
}

return jQuery;

})();


// String to Object flags format cache
var flagsCache = {};

// Convert String-formatted flags into Object-formatted ones and store in cache
function createFlags( flags ) {
	var object = flagsCache[ flags ] = {},
		i, length;
	flags = flags.split( /\s+/ );
	for ( i = 0, length = flags.length; i < length; i++ ) {
		object[ flags[i] ] = true;
	}
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	flags:	an optional list of space-separated flags that will change how
 *			the callback list behaves
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible flags:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( flags ) {

	// Convert flags from String-formatted to Object-formatted
	// (we check in cache first)
	flags = flags ? ( flagsCache[ flags ] || createFlags( flags ) ) : {};

	var // Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = [],
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Add one or several callbacks to the list
		add = function( args ) {
			var i,
				length,
				elem,
				type,
				actual;
			for ( i = 0, length = args.length; i < length; i++ ) {
				elem = args[ i ];
				type = jQuery.type( elem );
				if ( type === "array" ) {
					// Inspect recursively
					add( elem );
				} else if ( type === "function" ) {
					// Add if not in unique mode and callback is not in
					if ( !flags.unique || !self.has( elem ) ) {
						list.push( elem );
					}
				}
			}
		},
		// Fire callbacks
		fire = function( context, args ) {
			args = args || [];
			memory = !flags.memory || [ context, args ];
			firing = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( context, args ) === false && flags.stopOnFalse ) {
					memory = true; // Mark as halted
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( !flags.once ) {
					if ( stack && stack.length ) {
						memory = stack.shift();
						self.fireWith( memory[ 0 ], memory[ 1 ] );
					}
				} else if ( memory === true ) {
					self.disable();
				} else {
					list = [];
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					var length = list.length;
					add( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away, unless previous
					// firing was halted (stopOnFalse)
					} else if ( memory && memory !== true ) {
						firingStart = length;
						fire( memory[ 0 ], memory[ 1 ] );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					var args = arguments,
						argIndex = 0,
						argLength = args.length;
					for ( ; argIndex < argLength ; argIndex++ ) {
						for ( var i = 0; i < list.length; i++ ) {
							if ( args[ argIndex ] === list[ i ] ) {
								// Handle firingIndex and firingLength
								if ( firing ) {
									if ( i <= firingLength ) {
										firingLength--;
										if ( i <= firingIndex ) {
											firingIndex--;
										}
									}
								}
								// Remove the element
								list.splice( i--, 1 );
								// If we have some unicity property then
								// we only need to do this once
								if ( flags.unique ) {
									break;
								}
							}
						}
					}
				}
				return this;
			},
			// Control if a given callback is in the list
			has: function( fn ) {
				if ( list ) {
					var i = 0,
						length = list.length;
					for ( ; i < length; i++ ) {
						if ( fn === list[ i ] ) {
							return true;
						}
					}
				}
				return false;
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory || memory === true ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( stack ) {
					if ( firing ) {
						if ( !flags.once ) {
							stack.push( [ context, args ] );
						}
					} else if ( !( flags.once && memory ) ) {
						fire( context, args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!memory;
			}
		};

	return self;
};




var // Static reference to slice
	sliceDeferred = [].slice;

jQuery.extend({

	Deferred: function( func ) {
		var doneList = jQuery.Callbacks( "once memory" ),
			failList = jQuery.Callbacks( "once memory" ),
			progressList = jQuery.Callbacks( "memory" ),
			state = "pending",
			lists = {
				resolve: doneList,
				reject: failList,
				notify: progressList
			},
			promise = {
				done: doneList.add,
				fail: failList.add,
				progress: progressList.add,

				state: function() {
					return state;
				},

				// Deprecated
				isResolved: doneList.fired,
				isRejected: failList.fired,

				then: function( doneCallbacks, failCallbacks, progressCallbacks ) {
					deferred.done( doneCallbacks ).fail( failCallbacks ).progress( progressCallbacks );
					return this;
				},
				always: function() {
					deferred.done.apply( deferred, arguments ).fail.apply( deferred, arguments );
					return this;
				},
				pipe: function( fnDone, fnFail, fnProgress ) {
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( {
							done: [ fnDone, "resolve" ],
							fail: [ fnFail, "reject" ],
							progress: [ fnProgress, "notify" ]
						}, function( handler, data ) {
							var fn = data[ 0 ],
								action = data[ 1 ],
								returned;
							if ( jQuery.isFunction( fn ) ) {
								deferred[ handler ](function() {
									returned = fn.apply( this, arguments );
									if ( returned && jQuery.isFunction( returned.promise ) ) {
										returned.promise().then( newDefer.resolve, newDefer.reject, newDefer.notify );
									} else {
										newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
									}
								});
							} else {
								deferred[ handler ]( newDefer[ action ] );
							}
						});
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					if ( obj == null ) {
						obj = promise;
					} else {
						for ( var key in promise ) {
							obj[ key ] = promise[ key ];
						}
					}
					return obj;
				}
			},
			deferred = promise.promise({}),
			key;

		for ( key in lists ) {
			deferred[ key ] = lists[ key ].fire;
			deferred[ key + "With" ] = lists[ key ].fireWith;
		}

		// Handle state
		deferred.done( function() {
			state = "resolved";
		}, failList.disable, progressList.lock ).fail( function() {
			state = "rejected";
		}, doneList.disable, progressList.lock );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( firstParam ) {
		var args = sliceDeferred.call( arguments, 0 ),
			i = 0,
			length = args.length,
			pValues = new Array( length ),
			count = length,
			pCount = length,
			deferred = length <= 1 && firstParam && jQuery.isFunction( firstParam.promise ) ?
				firstParam :
				jQuery.Deferred(),
			promise = deferred.promise();
		function resolveFunc( i ) {
			return function( value ) {
				args[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
				if ( !( --count ) ) {
					deferred.resolveWith( deferred, args );
				}
			};
		}
		function progressFunc( i ) {
			return function( value ) {
				pValues[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
				deferred.notifyWith( promise, pValues );
			};
		}
		if ( length > 1 ) {
			for ( ; i < length; i++ ) {
				if ( args[ i ] && args[ i ].promise && jQuery.isFunction( args[ i ].promise ) ) {
					args[ i ].promise().then( resolveFunc(i), deferred.reject, progressFunc(i) );
				} else {
					--count;
				}
			}
			if ( !count ) {
				deferred.resolveWith( deferred, args );
			}
		} else if ( deferred !== firstParam ) {
			deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
		}
		return promise;
	}
});




jQuery.support = (function() {

	var support,
		all,
		a,
		select,
		opt,
		input,
		marginDiv,
		fragment,
		tds,
		events,
		eventName,
		i,
		isSupported,
		div = document.createElement( "div" ),
		documentElement = document.documentElement;

	// Preliminary tests
	div.setAttribute("className", "t");
	div.innerHTML = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";

	all = div.getElementsByTagName( "*" );
	a = div.getElementsByTagName( "a" )[ 0 ];

	// Can't get basic test support
	if ( !all || !all.length || !a ) {
		return {};
	}

	// First batch of supports tests
	select = document.createElement( "select" );
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName( "input" )[ 0 ];

	support = {
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: ( div.firstChild.nodeType === 3 ),

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText instead)
		style: /top/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: ( a.getAttribute("href") === "/a" ),

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.55/.test( a.style.opacity ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Make sure that if no value is specified for a checkbox
		// that it defaults to "on".
		// (WebKit defaults to "" instead)
		checkOn: ( input.value === "on" ),

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: opt.selected,

		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
		getSetAttribute: div.className !== "t",

		// Tests for enctype support on a form(#6743)
		enctype: !!document.createElement("form").enctype,

		// Makes sure cloning an html5 element does not cause problems
		// Where outerHTML is undefined, this still works
		html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

		// Will be defined later
		submitBubbles: true,
		changeBubbles: true,
		focusinBubbles: false,
		deleteExpando: true,
		noCloneEvent: true,
		inlineBlockNeedsLayout: false,
		shrinkWrapBlocks: false,
		reliableMarginRight: true
	};

	// Make sure checked status is properly cloned
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Test to see if it's possible to delete an expando from an element
	// Fails in Internet Explorer
	try {
		delete div.test;
	} catch( e ) {
		support.deleteExpando = false;
	}

	if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
		div.attachEvent( "onclick", function() {
			// Cloning a node shouldn't copy over any
			// bound event handlers (IE does this)
			support.noCloneEvent = false;
		});
		div.cloneNode( true ).fireEvent( "onclick" );
	}

	// Check if a radio maintains its value
	// after being appended to the DOM
	input = document.createElement("input");
	input.value = "t";
	input.setAttribute("type", "radio");
	support.radioValue = input.value === "t";

	input.setAttribute("checked", "checked");
	div.appendChild( input );
	fragment = document.createDocumentFragment();
	fragment.appendChild( div.lastChild );

	// WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	support.appendChecked = input.checked;

	fragment.removeChild( input );
	fragment.appendChild( div );

	div.innerHTML = "";

	// Check if div with explicit width and no margin-right incorrectly
	// gets computed margin-right based on width of container. For more
	// info see bug #3333
	// Fails in WebKit before Feb 2011 nightlies
	// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
	if ( window.getComputedStyle ) {
		marginDiv = document.createElement( "div" );
		marginDiv.style.width = "0";
		marginDiv.style.marginRight = "0";
		div.style.width = "2px";
		div.appendChild( marginDiv );
		support.reliableMarginRight =
			( parseInt( ( window.getComputedStyle( marginDiv, null ) || { marginRight: 0 } ).marginRight, 10 ) || 0 ) === 0;
	}

	// Technique from Juriy Zaytsev
	// http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
	// We only care about the case where non-standard event systems
	// are used, namely in IE. Short-circuiting here helps us to
	// avoid an eval call (in setAttribute) which can cause CSP
	// to go haywire. See: https://developer.mozilla.org/en/Security/CSP
	if ( div.attachEvent ) {
		for( i in {
			submit: 1,
			change: 1,
			focusin: 1
		}) {
			eventName = "on" + i;
			isSupported = ( eventName in div );
			if ( !isSupported ) {
				div.setAttribute( eventName, "return;" );
				isSupported = ( typeof div[ eventName ] === "function" );
			}
			support[ i + "Bubbles" ] = isSupported;
		}
	}

	fragment.removeChild( div );

	// Null elements to avoid leaks in IE
	fragment = select = opt = marginDiv = div = input = null;

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, outer, inner, table, td, offsetSupport,
			conMarginTop, ptlm, vb, style, html,
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		conMarginTop = 1;
		ptlm = "position:absolute;top:0;left:0;width:1px;height:1px;margin:0;";
		vb = "visibility:hidden;border:0;";
		style = "style='" + ptlm + "border:5px solid #000;padding:0;'";
		html = "<div " + style + "><div></div></div>" +
			"<table " + style + " cellpadding='0' cellspacing='0'>" +
			"<tr><td></td></tr></table>";

		container = document.createElement("div");
		container.style.cssText = vb + "width:0;height:0;position:static;top:0;margin-top:" + conMarginTop + "px";
		body.insertBefore( container, body.firstChild );

		// Construct the test element
		div = document.createElement("div");
		container.appendChild( div );

		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		// (only IE 8 fails this test)
		div.innerHTML = "<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>";
		tds = div.getElementsByTagName( "td" );
		isSupported = ( tds[ 0 ].offsetHeight === 0 );

		tds[ 0 ].style.display = "";
		tds[ 1 ].style.display = "none";

		// Check if empty table cells still have offsetWidth/Height
		// (IE <= 8 fail this test)
		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

		// Figure out if the W3C box model works as expected
		div.innerHTML = "";
		div.style.width = div.style.paddingLeft = "1px";
		jQuery.boxModel = support.boxModel = div.offsetWidth === 2;

		if ( typeof div.style.zoom !== "undefined" ) {
			// Check if natively block-level elements act like inline-block
			// elements when setting their display to 'inline' and giving
			// them layout
			// (IE < 8 does this)
			div.style.display = "inline";
			div.style.zoom = 1;
			support.inlineBlockNeedsLayout = ( div.offsetWidth === 2 );

			// Check if elements with layout shrink-wrap their children
			// (IE 6 does this)
			div.style.display = "";
			div.innerHTML = "<div style='width:4px;'></div>";
			support.shrinkWrapBlocks = ( div.offsetWidth !== 2 );
		}

		div.style.cssText = ptlm + vb;
		div.innerHTML = html;

		outer = div.firstChild;
		inner = outer.firstChild;
		td = outer.nextSibling.firstChild.firstChild;

		offsetSupport = {
			doesNotAddBorder: ( inner.offsetTop !== 5 ),
			doesAddBorderForTableAndCells: ( td.offsetTop === 5 )
		};

		inner.style.position = "fixed";
		inner.style.top = "20px";

		// safari subtracts parent border width here which is 5px
		offsetSupport.fixedPosition = ( inner.offsetTop === 20 || inner.offsetTop === 15 );
		inner.style.position = inner.style.top = "";

		outer.style.overflow = "hidden";
		outer.style.position = "relative";

		offsetSupport.subtractsBorderForOverflowNotVisible = ( inner.offsetTop === -5 );
		offsetSupport.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== conMarginTop );

		body.removeChild( container );
		div  = container = null;

		jQuery.extend( support, offsetSupport );
	});

	return support;
})();




var rbrace = /^(?:\{.*\}|\[.*\])$/,
	rmultiDash = /([A-Z])/g;

jQuery.extend({
	cache: {},

	// Please use with caution
	uuid: 0,

	// Unique for each copy of jQuery on the page
	// Non-digits removed to match rinlinejQuery
	expando: "jQuery" + ( jQuery.fn.jquery + Math.random() ).replace( /\D/g, "" ),

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
		"applet": true
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data, pvt /* Internal Use Only */ ) {
		if ( !jQuery.acceptData( elem ) ) {
			return;
		}

		var privateCache, thisCache, ret,
			internalKey = jQuery.expando,
			getByName = typeof name === "string",

			// We have to handle DOM nodes and JS objects differently because IE6-7
			// can't GC object references properly across the DOM-JS boundary
			isNode = elem.nodeType,

			// Only DOM nodes need the global jQuery cache; JS object data is
			// attached directly to the object so GC can occur automatically
			cache = isNode ? jQuery.cache : elem,

			// Only defining an ID for JS objects if its cache already exists allows
			// the code to shortcut on the same path as a DOM node with no cache
			id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey,
			isEvents = name === "events";

		// Avoid doing any more work than we need to when trying to get data on an
		// object that has no data at all
		if ( (!id || !cache[id] || (!isEvents && !pvt && !cache[id].data)) && getByName && data === undefined ) {
			return;
		}

		if ( !id ) {
			// Only DOM nodes need a new unique ID for each element since their data
			// ends up in the global cache
			if ( isNode ) {
				elem[ internalKey ] = id = ++jQuery.uuid;
			} else {
				id = internalKey;
			}
		}

		if ( !cache[ id ] ) {
			cache[ id ] = {};

			// Avoids exposing jQuery metadata on plain JS objects when the object
			// is serialized using JSON.stringify
			if ( !isNode ) {
				cache[ id ].toJSON = jQuery.noop;
			}
		}

		// An object can be passed to jQuery.data instead of a key/value pair; this gets
		// shallow copied over onto the existing cache
		if ( typeof name === "object" || typeof name === "function" ) {
			if ( pvt ) {
				cache[ id ] = jQuery.extend( cache[ id ], name );
			} else {
				cache[ id ].data = jQuery.extend( cache[ id ].data, name );
			}
		}

		privateCache = thisCache = cache[ id ];

		// jQuery data() is stored in a separate object inside the object's internal data
		// cache in order to avoid key collisions between internal data and user-defined
		// data.
		if ( !pvt ) {
			if ( !thisCache.data ) {
				thisCache.data = {};
			}

			thisCache = thisCache.data;
		}

		if ( data !== undefined ) {
			thisCache[ jQuery.camelCase( name ) ] = data;
		}

		// Users should not attempt to inspect the internal events object using jQuery.data,
		// it is undocumented and subject to change. But does anyone listen? No.
		if ( isEvents && !thisCache[ name ] ) {
			return privateCache.events;
		}

		// Check for both converted-to-camel and non-converted data property names
		// If a data property was specified
		if ( getByName ) {

			// First Try to find as-is property data
			ret = thisCache[ name ];

			// Test for null|undefined property data
			if ( ret == null ) {

				// Try to find the camelCased property
				ret = thisCache[ jQuery.camelCase( name ) ];
			}
		} else {
			ret = thisCache;
		}

		return ret;
	},

	removeData: function( elem, name, pvt /* Internal Use Only */ ) {
		if ( !jQuery.acceptData( elem ) ) {
			return;
		}

		var thisCache, i, l,

			// Reference to internal data cache key
			internalKey = jQuery.expando,

			isNode = elem.nodeType,

			// See jQuery.data for more information
			cache = isNode ? jQuery.cache : elem,

			// See jQuery.data for more information
			id = isNode ? elem[ internalKey ] : internalKey;

		// If there is already no cache entry for this object, there is no
		// purpose in continuing
		if ( !cache[ id ] ) {
			return;
		}

		if ( name ) {

			thisCache = pvt ? cache[ id ] : cache[ id ].data;

			if ( thisCache ) {

				// Support array or space separated string names for data keys
				if ( !jQuery.isArray( name ) ) {

					// try the string as a key before any manipulation
					if ( name in thisCache ) {
						name = [ name ];
					} else {

						// split the camel cased version by spaces unless a key with the spaces exists
						name = jQuery.camelCase( name );
						if ( name in thisCache ) {
							name = [ name ];
						} else {
							name = name.split( " " );
						}
					}
				}

				for ( i = 0, l = name.length; i < l; i++ ) {
					delete thisCache[ name[i] ];
				}

				// If there is no data left in the cache, we want to continue
				// and let the cache object itself get destroyed
				if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
					return;
				}
			}
		}

		// See jQuery.data for more information
		if ( !pvt ) {
			delete cache[ id ].data;

			// Don't destroy the parent cache unless the internal data object
			// had been the only thing left in it
			if ( !isEmptyDataObject(cache[ id ]) ) {
				return;
			}
		}

		// Browsers that fail expando deletion also refuse to delete expandos on
		// the window, but it will allow it on all other JS objects; other browsers
		// don't care
		// Ensure that `cache` is not a window object #10080
		if ( jQuery.support.deleteExpando || !cache.setInterval ) {
			delete cache[ id ];
		} else {
			cache[ id ] = null;
		}

		// We destroyed the cache and need to eliminate the expando on the node to avoid
		// false lookups in the cache for entries that no longer exist
		if ( isNode ) {
			// IE does not allow us to delete expando properties from nodes,
			// nor does it have a removeAttribute function on Document nodes;
			// we must handle all of these cases
			if ( jQuery.support.deleteExpando ) {
				delete elem[ internalKey ];
			} else if ( elem.removeAttribute ) {
				elem.removeAttribute( internalKey );
			} else {
				elem[ internalKey ] = null;
			}
		}
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return jQuery.data( elem, name, data, true );
	},

	// A method for determining if a DOM node can handle the data expando
	acceptData: function( elem ) {
		if ( elem.nodeName ) {
			var match = jQuery.noData[ elem.nodeName.toLowerCase() ];

			if ( match ) {
				return !(match === true || elem.getAttribute("classid") !== match);
			}
		}

		return true;
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var parts, attr, name,
			data = null;

		if ( typeof key === "undefined" ) {
			if ( this.length ) {
				data = jQuery.data( this[0] );

				if ( this[0].nodeType === 1 && !jQuery._data( this[0], "parsedAttrs" ) ) {
					attr = this[0].attributes;
					for ( var i = 0, l = attr.length; i < l; i++ ) {
						name = attr[i].name;

						if ( name.indexOf( "data-" ) === 0 ) {
							name = jQuery.camelCase( name.substring(5) );

							dataAttr( this[0], name, data[ name ] );
						}
					}
					jQuery._data( this[0], "parsedAttrs", true );
				}
			}

			return data;

		} else if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		parts = key.split(".");
		parts[1] = parts[1] ? "." + parts[1] : "";

		if ( value === undefined ) {
			data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);

			// Try to fetch any internally stored data first
			if ( data === undefined && this.length ) {
				data = jQuery.data( this[0], key );
				data = dataAttr( this[0], key, data );
			}

			return data === undefined && parts[1] ?
				this.data( parts[0] ) :
				data;

		} else {
			return this.each(function() {
				var self = jQuery( this ),
					args = [ parts[0], value ];

				self.triggerHandler( "setData" + parts[1] + "!", args );
				jQuery.data( this, key, value );
				self.triggerHandler( "changeData" + parts[1] + "!", args );
			});
		}
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
				data === "false" ? false :
				data === "null" ? null :
				jQuery.isNumeric( data ) ? parseFloat( data ) :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	for ( var name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}




function handleQueueMarkDefer( elem, type, src ) {
	var deferDataKey = type + "defer",
		queueDataKey = type + "queue",
		markDataKey = type + "mark",
		defer = jQuery._data( elem, deferDataKey );
	if ( defer &&
		( src === "queue" || !jQuery._data(elem, queueDataKey) ) &&
		( src === "mark" || !jQuery._data(elem, markDataKey) ) ) {
		// Give room for hard-coded callbacks to fire first
		// and eventually mark/queue something else on the element
		setTimeout( function() {
			if ( !jQuery._data( elem, queueDataKey ) &&
				!jQuery._data( elem, markDataKey ) ) {
				jQuery.removeData( elem, deferDataKey, true );
				defer.fire();
			}
		}, 0 );
	}
}

jQuery.extend({

	_mark: function( elem, type ) {
		if ( elem ) {
			type = ( type || "fx" ) + "mark";
			jQuery._data( elem, type, (jQuery._data( elem, type ) || 0) + 1 );
		}
	},

	_unmark: function( force, elem, type ) {
		if ( force !== true ) {
			type = elem;
			elem = force;
			force = false;
		}
		if ( elem ) {
			type = type || "fx";
			var key = type + "mark",
				count = force ? 0 : ( (jQuery._data( elem, key ) || 1) - 1 );
			if ( count ) {
				jQuery._data( elem, key, count );
			} else {
				jQuery.removeData( elem, key, true );
				handleQueueMarkDefer( elem, type, "mark" );
			}
		}
	},

	queue: function( elem, type, data ) {
		var q;
		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			q = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !q || jQuery.isArray(data) ) {
					q = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					q.push( data );
				}
			}
			return q || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			fn = queue.shift(),
			hooks = {};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
		}

		if ( fn ) {
			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			jQuery._data( elem, type + ".run", hooks );
			fn.call( elem, function() {
				jQuery.dequeue( elem, type );
			}, hooks );
		}

		if ( !queue.length ) {
			jQuery.removeData( elem, type + "queue " + type + ".run", true );
			handleQueueMarkDefer( elem, type, "queue" );
		}
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
		}

		if ( data === undefined ) {
			return jQuery.queue( this[0], type );
		}
		return this.each(function() {
			var queue = jQuery.queue( this, type, data );

			if ( type === "fx" && queue[0] !== "inprogress" ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, object ) {
		if ( typeof type !== "string" ) {
			object = type;
			type = undefined;
		}
		type = type || "fx";
		var defer = jQuery.Deferred(),
			elements = this,
			i = elements.length,
			count = 1,
			deferDataKey = type + "defer",
			queueDataKey = type + "queue",
			markDataKey = type + "mark",
			tmp;
		function resolve() {
			if ( !( --count ) ) {
				defer.resolveWith( elements, [ elements ] );
			}
		}
		while( i-- ) {
			if (( tmp = jQuery.data( elements[ i ], deferDataKey, undefined, true ) ||
					( jQuery.data( elements[ i ], queueDataKey, undefined, true ) ||
						jQuery.data( elements[ i ], markDataKey, undefined, true ) ) &&
					jQuery.data( elements[ i ], deferDataKey, jQuery.Callbacks( "once memory" ), true ) )) {
				count++;
				tmp.add( resolve );
			}
		}
		resolve();
		return defer.promise();
	}
});




var rclass = /[\n\t\r]/g,
	rspace = /\s+/,
	rreturn = /\r/g,
	rtype = /^(?:button|input)$/i,
	rfocusable = /^(?:button|input|object|select|textarea)$/i,
	rclickable = /^a(?:rea)?$/i,
	rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
	getSetAttribute = jQuery.support.getSetAttribute,
	nodeHook, boolHook, fixSpecified;

jQuery.fn.extend({
	attr: function( name, value ) {
		return jQuery.access( this, name, value, true, jQuery.attr );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, name, value, true, jQuery.prop );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	},

	addClass: function( value ) {
		var classNames, i, l, elem,
			setClass, c, cl;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call(this, j, this.className) );
			});
		}

		if ( value && typeof value === "string" ) {
			classNames = value.split( rspace );

			for ( i = 0, l = this.length; i < l; i++ ) {
				elem = this[ i ];

				if ( elem.nodeType === 1 ) {
					if ( !elem.className && classNames.length === 1 ) {
						elem.className = value;

					} else {
						setClass = " " + elem.className + " ";

						for ( c = 0, cl = classNames.length; c < cl; c++ ) {
							if ( !~setClass.indexOf( " " + classNames[ c ] + " " ) ) {
								setClass += classNames[ c ] + " ";
							}
						}
						elem.className = jQuery.trim( setClass );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classNames, i, l, elem, className, c, cl;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call(this, j, this.className) );
			});
		}

		if ( (value && typeof value === "string") || value === undefined ) {
			classNames = ( value || "" ).split( rspace );

			for ( i = 0, l = this.length; i < l; i++ ) {
				elem = this[ i ];

				if ( elem.nodeType === 1 && elem.className ) {
					if ( value ) {
						className = (" " + elem.className + " ").replace( rclass, " " );
						for ( c = 0, cl = classNames.length; c < cl; c++ ) {
							className = className.replace(" " + classNames[ c ] + " ", " ");
						}
						elem.className = jQuery.trim( className );

					} else {
						elem.className = "";
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isBool = typeof stateVal === "boolean";

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					state = stateVal,
					classNames = value.split( rspace );

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space seperated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			} else if ( type === "undefined" || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// toggle whole className
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) > -1 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.nodeName.toLowerCase() ] || jQuery.valHooks[ elem.type ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var self = jQuery(this), val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, self.val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.nodeName.toLowerCase() ] || jQuery.valHooks[ this.type ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, i, max, option,
					index = elem.selectedIndex,
					values = [],
					options = elem.options,
					one = elem.type === "select-one";

				// Nothing was selected
				if ( index < 0 ) {
					return null;
				}

				// Loop through all the selected options
				i = one ? index : 0;
				max = one ? index + 1 : options.length;
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Don't return options that are disabled or in a disabled optgroup
					if ( option.selected && (jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
							(!option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" )) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				// Fixes Bug #2551 -- select.val() broken in IE after form.reset()
				if ( one && !values.length && options.length ) {
					return jQuery( options[ index ] ).val();
				}

				return values;
			},

			set: function( elem, value ) {
				var values = jQuery.makeArray( value );

				jQuery(elem).find("option").each(function() {
					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
				});

				if ( !values.length ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attrFn: {
		val: true,
		css: true,
		html: true,
		text: true,
		data: true,
		width: true,
		height: true,
		offset: true
	},

	attr: function( elem, name, value, pass ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( pass && name in jQuery.attrFn ) {
			return jQuery( elem )[ name ]( value );
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( notxml ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;

			} else if ( hooks && "set" in hooks && notxml && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, "" + value );
				return value;
			}

		} else if ( hooks && "get" in hooks && notxml && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {

			ret = elem.getAttribute( name );

			// Non-existent attributes return null, we normalize to undefined
			return ret === null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var propName, attrNames, name, l,
			i = 0;

		if ( value && elem.nodeType === 1 ) {
			attrNames = value.toLowerCase().split( rspace );
			l = attrNames.length;

			for ( ; i < l; i++ ) {
				name = attrNames[ i ];

				if ( name ) {
					propName = jQuery.propFix[ name ] || name;

					// See #9699 for explanation of this approach (setting first, then removal)
					jQuery.attr( elem, name, "" );
					elem.removeAttribute( getSetAttribute ? name : propName );

					// Set corresponding property to false for boolean attributes
					if ( rboolean.test( name ) && propName in elem ) {
						elem[ propName ] = false;
					}
				}
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				// We can't allow the type property to be changed (since it causes problems in IE)
				if ( rtype.test( elem.nodeName ) && elem.parentNode ) {
					jQuery.error( "type property can't be changed" );
				} else if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to it's default in case type is set after value
					// This is for element creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		},
		// Use the value property for back compat
		// Use the nodeHook for button elements in IE6/7 (#1954)
		value: {
			get: function( elem, name ) {
				if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
					return nodeHook.get( elem, name );
				}
				return name in elem ?
					elem.value :
					null;
			},
			set: function( elem, value, name ) {
				if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
					return nodeHook.set( elem, value, name );
				}
				// Does not return so that setAttribute is also used
				elem.value = value;
			}
		}
	},

	propFix: {
		tabindex: "tabIndex",
		readonly: "readOnly",
		"for": "htmlFor",
		"class": "className",
		maxlength: "maxLength",
		cellspacing: "cellSpacing",
		cellpadding: "cellPadding",
		rowspan: "rowSpan",
		colspan: "colSpan",
		usemap: "useMap",
		frameborder: "frameBorder",
		contenteditable: "contentEditable"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				return ( elem[ name ] = value );
			}

		} else {
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
				return ret;

			} else {
				return elem[ name ];
			}
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				var attributeNode = elem.getAttributeNode("tabindex");

				return attributeNode && attributeNode.specified ?
					parseInt( attributeNode.value, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						undefined;
			}
		}
	}
});

// Add the tabIndex propHook to attrHooks for back-compat (different case is intentional)
jQuery.attrHooks.tabindex = jQuery.propHooks.tabIndex;

// Hook for boolean attributes
boolHook = {
	get: function( elem, name ) {
		// Align boolean attributes with corresponding properties
		// Fall back to attribute presence where some booleans are not supported
		var attrNode,
			property = jQuery.prop( elem, name );
		return property === true || typeof property !== "boolean" && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
			name.toLowerCase() :
			undefined;
	},
	set: function( elem, value, name ) {
		var propName;
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			// value is true since we know at this point it's type boolean and not false
			// Set boolean attributes to the same name and set the DOM property
			propName = jQuery.propFix[ name ] || name;
			if ( propName in elem ) {
				// Only set the IDL specifically if it already exists on the element
				elem[ propName ] = true;
			}

			elem.setAttribute( name, name.toLowerCase() );
		}
		return name;
	}
};

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	fixSpecified = {
		name: true,
		id: true
	};

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret;
			ret = elem.getAttributeNode( name );
			return ret && ( fixSpecified[ name ] ? ret.nodeValue !== "" : ret.specified ) ?
				ret.nodeValue :
				undefined;
		},
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				ret = document.createAttribute( name );
				elem.setAttributeNode( ret );
			}
			return ( ret.nodeValue = value + "" );
		}
	};

	// Apply the nodeHook to tabindex
	jQuery.attrHooks.tabindex.set = nodeHook.set;

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		});
	});

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		get: nodeHook.get,
		set: function( elem, value, name ) {
			if ( value === "" ) {
				value = "false";
			}
			nodeHook.set( elem, value, name );
		}
	};
}


// Some attributes require a special call on IE
if ( !jQuery.support.hrefNormalized ) {
	jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			get: function( elem ) {
				var ret = elem.getAttribute( name, 2 );
				return ret === null ? undefined : ret;
			}
		});
	});
}

if ( !jQuery.support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Normalize to lowercase since IE uppercases css property names
			return elem.style.cssText.toLowerCase() || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = "" + value );
		}
	};
}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	});
}

// IE6/7 call enctype encoding
if ( !jQuery.support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}

// Radios and checkboxes getter/setter
if ( !jQuery.support.checkOn ) {
	jQuery.each([ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			get: function( elem ) {
				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
				return elem.getAttribute("value") === null ? "on" : elem.value;
			}
		};
	});
}
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	});
});




var rformElems = /^(?:textarea|input|select)$/i,
	rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/,
	rhoverHack = /\bhover(\.\S+)?\b/,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,
	quickParse = function( selector ) {
		var quick = rquickIs.exec( selector );
		if ( quick ) {
			//   0  1    2   3
			// [ _, tag, id, class ]
			quick[1] = ( quick[1] || "" ).toLowerCase();
			quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
		}
		return quick;
	},
	quickIs = function( elem, m ) {
		var attrs = elem.attributes || {};
		return (
			(!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
			(!m[2] || (attrs.id || {}).value === m[2]) &&
			(!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
		);
	},
	hoverHack = function( events ) {
		return jQuery.event.special.hover ? events : events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
	};

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	add: function( elem, types, handler, data, selector ) {

		var elemData, eventHandle, events,
			t, tns, type, namespaces, handleObj,
			handleObjIn, quick, handlers, special;

		// Don't attach events to noData or text/comment nodes (allow plain objects tho)
		if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		events = elemData.events;
		if ( !events ) {
			elemData.events = events = {};
		}
		eventHandle = elemData.handle;
		if ( !eventHandle ) {
			elemData.handle = eventHandle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = jQuery.trim( hoverHack(types) ).split( " " );
		for ( t = 0; t < types.length; t++ ) {

			tns = rtypenamespace.exec( types[t] ) || [];
			type = tns[1];
			namespaces = ( tns[2] || "" ).split( "." ).sort();

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: tns[1],
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				quick: quickParse( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			handlers = events[ type ];
			if ( !handlers ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	global: {},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var elemData = jQuery.hasData( elem ) && jQuery._data( elem ),
			t, tns, type, origType, namespaces, origCount,
			j, events, special, handle, eventType, handleObj;

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = jQuery.trim( hoverHack( types || "" ) ).split(" ");
		for ( t = 0; t < types.length; t++ ) {
			tns = rtypenamespace.exec( types[t] ) || [];
			type = origType = tns[1];
			namespaces = tns[2];

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector? special.delegateType : special.bindType ) || type;
			eventType = events[ type ] || [];
			origCount = eventType.length;
			namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;

			// Remove matching events
			for ( j = 0; j < eventType.length; j++ ) {
				handleObj = eventType[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					 ( !handler || handler.guid === handleObj.guid ) &&
					 ( !namespaces || namespaces.test( handleObj.namespace ) ) &&
					 ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					eventType.splice( j--, 1 );

					if ( handleObj.selector ) {
						eventType.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( eventType.length === 0 && origCount !== eventType.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			handle = elemData.handle;
			if ( handle ) {
				handle.elem = null;
			}

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery.removeData( elem, [ "events", "handle" ], true );
		}
	},

	// Events that are safe to short-circuit if no handlers are attached.
	// Native DOM events should not be added, they may have inline handlers.
	customEvent: {
		"getData": true,
		"setData": true,
		"changeData": true
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		// Don't do events on text and comment nodes
		if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
			return;
		}

		// Event object or event type
		var type = event.type || event,
			namespaces = [],
			cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType;

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "!" ) >= 0 ) {
			// Exclusive events trigger only for the exact event (no namespaces)
			type = type.slice(0, -1);
			exclusive = true;
		}

		if ( type.indexOf( "." ) >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}

		if ( (!elem || jQuery.event.customEvent[ type ]) && !jQuery.event.global[ type ] ) {
			// No jQuery handlers for this event type, and it can't have inline handlers
			return;
		}

		// Caller can pass in an Event, Object, or just an event type string
		event = typeof event === "object" ?
			// jQuery.Event object
			event[ jQuery.expando ] ? event :
			// Object literal
			new jQuery.Event( type, event ) :
			// Just the event type (string)
			new jQuery.Event( type );

		event.type = type;
		event.isTrigger = true;
		event.exclusive = exclusive;
		event.namespace = namespaces.join( "." );
		event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
		ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";

		// Handle a global trigger
		if ( !elem ) {

			// TODO: Stop taunting the data cache; remove global events and always attach to document
			cache = jQuery.cache;
			for ( i in cache ) {
				if ( cache[ i ].events && cache[ i ].events[ type ] ) {
					jQuery.event.trigger( event, data, cache[ i ].handle.elem, true );
				}
			}
			return;
		}

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data != null ? jQuery.makeArray( data ) : [];
		data.unshift( event );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		eventPath = [[ elem, special.bindType || type ]];
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
			old = null;
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push([ cur, bubbleType ]);
				old = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( old && old === elem.ownerDocument ) {
				eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
			}
		}

		// Fire handlers on the event path
		for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {

			cur = eventPath[i][0];
			event.type = eventPath[i][1];

			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}
			// Note that this is a bare JS function and not a jQuery handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
				!(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				// IE<9 dies on focus/blur to hidden element (#1486)
				if ( ontype && elem[ type ] && ((type !== "focus" && type !== "blur") || event.target.offsetWidth !== 0) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					old = elem[ ontype ];

					if ( old ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( old ) {
						elem[ ontype ] = old;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event || window.event );

		var handlers = ( (jQuery._data( this, "events" ) || {} )[ event.type ] || []),
			delegateCount = handlers.delegateCount,
			args = [].slice.call( arguments, 0 ),
			run_all = !event.exclusive && !event.namespace,
			handlerQueue = [],
			i, j, cur, jqcur, ret, selMatch, matched, matches, handleObj, sel, related;

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Determine handlers that should run if there are delegated events
		// Avoid disabled elements in IE (#6911) and non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && !event.target.disabled && !(event.button && event.type === "click") ) {

			// Pregenerate a single jQuery object for reuse with .is()
			jqcur = jQuery(this);
			jqcur.context = this.ownerDocument || this;

			for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {
				selMatch = {};
				matches = [];
				jqcur[0] = cur;
				for ( i = 0; i < delegateCount; i++ ) {
					handleObj = handlers[ i ];
					sel = handleObj.selector;

					if ( selMatch[ sel ] === undefined ) {
						selMatch[ sel ] = (
							handleObj.quick ? quickIs( cur, handleObj.quick ) : jqcur.is( sel )
						);
					}
					if ( selMatch[ sel ] ) {
						matches.push( handleObj );
					}
				}
				if ( matches.length ) {
					handlerQueue.push({ elem: cur, matches: matches });
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( handlers.length > delegateCount ) {
			handlerQueue.push({ elem: this, matches: handlers.slice( delegateCount ) });
		}

		// Run delegates first; they may want to stop propagation beneath us
		for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ) {
			matched = handlerQueue[ i ];
			event.currentTarget = matched.elem;

			for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++ ) {
				handleObj = matched.matches[ j ];

				// Triggered event must either 1) be non-exclusive and have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( run_all || (!event.namespace && !handleObj.namespace) || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {

					event.data = handleObj.data;
					event.handleObj = handleObj;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						event.result = ret;
						if ( ret === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		return event.result;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	// *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
	props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop,
			originalEvent = event,
			fixHook = jQuery.event.fixHooks[ event.type ] || {},
			copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = jQuery.Event( originalEvent );

		for ( i = copy.length; i; ) {
			prop = copy[ --i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Target should not be a text node (#504, Safari)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// For mouse/key events; add metaKey if it's not there (#3368, IE6/7/8)
		if ( event.metaKey === undefined ) {
			event.metaKey = event.ctrlKey;
		}

		return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		ready: {
			// Make sure the ready event is setup
			setup: jQuery.bindReady
		},

		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},

		focus: {
			delegateType: "focusin"
		},
		blur: {
			delegateType: "focusout"
		},

		beforeunload: {
			setup: function( data, namespaces, eventHandle ) {
				// We only want to do this special case on windows
				if ( jQuery.isWindow( this ) ) {
					this.onbeforeunload = eventHandle;
				}
			},

			teardown: function( namespaces, eventHandle ) {
				if ( this.onbeforeunload === eventHandle ) {
					this.onbeforeunload = null;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{ type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

// Some plugins are using, but it's undocumented/deprecated and will be removed.
// The 1.7 special event interface should provide all the hooks needed now.
jQuery.event.handle = jQuery.event.dispatch;

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		if ( elem.detachEvent ) {
			elem.detachEvent( "on" + type, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

function returnFalse() {
	return false;
}
function returnTrue() {
	return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}

		// if preventDefault exists run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// otherwise set the returnValue property of the original event to false (IE)
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}
		// if stopPropagation exists run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}
		// otherwise set the cancelBubble property of the original event to true (IE)
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj,
				selector = handleObj.selector,
				ret;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !form._submit_attached ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						// If form was submitted by the user, bubble the event up the tree
						if ( this.parentNode && !event.isTrigger ) {
							jQuery.event.simulate( "submit", this.parentNode, event, true );
						}
					});
					form._submit_attached = true;
				}
			});
			// return undefined since we don't need an event listener
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !jQuery.support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
							jQuery.event.simulate( "change", this, event, true );
						}
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !elem._change_attached ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					elem._change_attached = true;
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on.call( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			var handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace? handleObj.type + "." + handleObj.namespace : handleObj.type,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( var type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	live: function( types, data, fn ) {
		jQuery( this.context ).on( types, this.selector, data, fn );
		return this;
	},
	die: function( types, fn ) {
		jQuery( this.context ).off( types, this.selector || "**", fn );
		return this;
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length == 1? this.off( selector, "**" ) : this.off( types, selector, fn );
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		if ( this[0] ) {
			return jQuery.event.trigger( type, data, this[0], true );
		}
	},

	toggle: function( fn ) {
		// Save reference to arguments for access in closure
		var args = arguments,
			guid = fn.guid || jQuery.guid++,
			i = 0,
			toggler = function( event ) {
				// Figure out which function to execute
				var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
				jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );

				// Make sure that clicks stop
				event.preventDefault();

				// and execute the function
				return args[ lastToggle ].apply( this, arguments ) || false;
			};

		// link all the functions, so any of them can unbind this click handler
		toggler.guid = guid;
		while ( i < args.length ) {
			args[ i++ ].guid = guid;
		}

		return this.click( toggler );
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
});

jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		if ( fn == null ) {
			fn = data;
			data = null;
		}

		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};

	if ( jQuery.attrFn ) {
		jQuery.attrFn[ name ] = true;
	}

	if ( rkeyEvent.test( name ) ) {
		jQuery.event.fixHooks[ name ] = jQuery.event.keyHooks;
	}

	if ( rmouseEvent.test( name ) ) {
		jQuery.event.fixHooks[ name ] = jQuery.event.mouseHooks;
	}
});



/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	expando = "sizcache" + (Math.random() + '').replace('.', ''),
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true,
	rBackslash = /\\/g,
	rReturn = /\r\n/g,
	rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function( selector, context, results, seed ) {
	results = results || [];
	context = context || document;

	var origContext = context;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var m, set, checkSet, extra, ret, cur, pop, i,
		prune = true,
		contextXML = Sizzle.isXML( context ),
		parts = [],
		soFar = selector;
	
	// Reset the position of the chunker regexp (start from head)
	do {
		chunker.exec( "" );
		m = chunker.exec( soFar );

		if ( m ) {
			soFar = m[3];
		
			parts.push( m[1] );
		
			if ( m[2] ) {
				extra = m[3];
				break;
			}
		}
	} while ( m );

	if ( parts.length > 1 && origPOS.exec( selector ) ) {

		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context, seed );

		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}
				
				set = posProcess( selector, set, seed );
			}
		}

	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

			ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ?
				Sizzle.filter( ret.expr, ret.set )[0] :
				ret.set[0];
		}

		if ( context ) {
			ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

			set = ret.expr ?
				Sizzle.filter( ret.expr, ret.set ) :
				ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray( set );

			} else {
				prune = false;
			}

			while ( parts.length ) {
				cur = parts.pop();
				pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}

		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );

		} else if ( context && context.nodeType === 1 ) {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}

		} else {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}

	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function( results ) {
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[ i - 1 ] ) {
					results.splice( i--, 1 );
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function( expr, set ) {
	return Sizzle( expr, null, null, set );
};

Sizzle.matchesSelector = function( node, expr ) {
	return Sizzle( expr, null, null, [node] ).length > 0;
};

Sizzle.find = function( expr, context, isXML ) {
	var set, i, len, match, type, left;

	if ( !expr ) {
		return [];
	}

	for ( i = 0, len = Expr.order.length; i < len; i++ ) {
		type = Expr.order[i];
		
		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			left = match[1];
			match.splice( 1, 1 );

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace( rBackslash, "" );
				set = Expr.find[ type ]( match, context, isXML );

				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = typeof context.getElementsByTagName !== "undefined" ?
			context.getElementsByTagName( "*" ) :
			[];
	}

	return { set: set, expr: expr };
};

Sizzle.filter = function( expr, set, inplace, not ) {
	var match, anyFound,
		type, found, item, filter, left,
		i, pass,
		old = expr,
		result = [],
		curLoop = set,
		isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

	while ( expr && set.length ) {
		for ( type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				filter = Expr.filter[ type ];
				left = match[1];

				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;

					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							pass = not ^ found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;

								} else {
									curLoop[i] = false;
								}

							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );

			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Utility function for retreiving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
var getText = Sizzle.getText = function( elem ) {
    var i, node,
		nodeType = elem.nodeType,
		ret = "";

	if ( nodeType ) {
		if ( nodeType === 1 || nodeType === 9 ) {
			// Use textContent || innerText for elements
			if ( typeof elem.textContent === 'string' ) {
				return elem.textContent;
			} else if ( typeof elem.innerText === 'string' ) {
				// Replace IE's carriage returns
				return elem.innerText.replace( rReturn, '' );
			} else {
				// Traverse it's children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
	} else {

		// If no nodeType, this is expected to be an array
		for ( i = 0; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			if ( node.nodeType !== 8 ) {
				ret += getText( node );
			}
		}
	}
	return ret;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],

	match: {
		ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},

	leftMatch: {},

	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},

	attrHandle: {
		href: function( elem ) {
			return elem.getAttribute( "href" );
		},
		type: function( elem ) {
			return elem.getAttribute( "type" );
		}
	},

	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !rNonWord.test( part ),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},

		">": function( checkSet, part ) {
			var elem,
				isPartStr = typeof part === "string",
				i = 0,
				l = checkSet.length;

			if ( isPartStr && !rNonWord.test( part ) ) {
				part = part.toLowerCase();

				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}

			} else {
				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},

		"": function(checkSet, part, isXML){
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !rNonWord.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
		},

		"~": function( checkSet, part, isXML ) {
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !rNonWord.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
		}
	},

	find: {
		ID: function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		},

		NAME: function( match, context ) {
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [],
					results = context.getElementsByName( match[1] );

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},

		TAG: function( match, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( match[1] );
			}
		}
	},
	preFilter: {
		CLASS: function( match, curLoop, inplace, result, not, isXML ) {
			match = " " + match[1].replace( rBackslash, "" ) + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}

					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},

		ID: function( match ) {
			return match[1].replace( rBackslash, "" );
		},

		TAG: function( match, curLoop ) {
			return match[1].replace( rBackslash, "" ).toLowerCase();
		},

		CHILD: function( match ) {
			if ( match[1] === "nth" ) {
				if ( !match[2] ) {
					Sizzle.error( match[0] );
				}

				match[2] = match[2].replace(/^\+|\s*/g, '');

				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}
			else if ( match[2] ) {
				Sizzle.error( match[0] );
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},

		ATTR: function( match, curLoop, inplace, result, not, isXML ) {
			var name = match[1] = match[1].replace( rBackslash, "" );
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			// Handle if an un-quoted value was used
			match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},

		PSEUDO: function( match, curLoop, inplace, result, not ) {
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);

				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

					if ( !inplace ) {
						result.push.apply( result, ret );
					}

					return false;
				}

			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},

		POS: function( match ) {
			match.unshift( true );

			return match;
		}
	},
	
	filters: {
		enabled: function( elem ) {
			return elem.disabled === false && elem.type !== "hidden";
		},

		disabled: function( elem ) {
			return elem.disabled === true;
		},

		checked: function( elem ) {
			return elem.checked === true;
		},
		
		selected: function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}
			
			return elem.selected === true;
		},

		parent: function( elem ) {
			return !!elem.firstChild;
		},

		empty: function( elem ) {
			return !elem.firstChild;
		},

		has: function( elem, i, match ) {
			return !!Sizzle( match[3], elem ).length;
		},

		header: function( elem ) {
			return (/h\d/i).test( elem.nodeName );
		},

		text: function( elem ) {
			var attr = elem.getAttribute( "type" ), type = elem.type;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc) 
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
		},

		radio: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
		},

		checkbox: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
		},

		file: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
		},

		password: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
		},

		submit: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && "submit" === elem.type;
		},

		image: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
		},

		reset: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && "reset" === elem.type;
		},

		button: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && "button" === elem.type || name === "button";
		},

		input: function( elem ) {
			return (/input|select|textarea|button/i).test( elem.nodeName );
		},

		focus: function( elem ) {
			return elem === elem.ownerDocument.activeElement;
		}
	},
	setFilters: {
		first: function( elem, i ) {
			return i === 0;
		},

		last: function( elem, i, match, array ) {
			return i === array.length - 1;
		},

		even: function( elem, i ) {
			return i % 2 === 0;
		},

		odd: function( elem, i ) {
			return i % 2 === 1;
		},

		lt: function( elem, i, match ) {
			return i < match[3] - 0;
		},

		gt: function( elem, i, match ) {
			return i > match[3] - 0;
		},

		nth: function( elem, i, match ) {
			return match[3] - 0 === i;
		},

		eq: function( elem, i, match ) {
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function( elem, match, i, array ) {
			var name = match[1],
				filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );

			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

			} else if ( name === "not" ) {
				var not = match[3];

				for ( var j = 0, l = not.length; j < l; j++ ) {
					if ( not[j] === elem ) {
						return false;
					}
				}

				return true;

			} else {
				Sizzle.error( name );
			}
		},

		CHILD: function( elem, match ) {
			var first, last,
				doneName, parent, cache,
				count, diff,
				type = match[1],
				node = elem;

			switch ( type ) {
				case "only":
				case "first":
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}

					if ( type === "first" ) { 
						return true; 
					}

					node = elem;

				case "last":
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}

					return true;

				case "nth":
					first = match[2];
					last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}
					
					doneName = match[0];
					parent = elem.parentNode;
	
					if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
						count = 0;
						
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 

						parent[ expando ] = doneName;
					}
					
					diff = elem.nodeIndex - last;

					if ( first === 0 ) {
						return diff === 0;

					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},

		ID: function( elem, match ) {
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},

		TAG: function( elem, match ) {
			return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
		},
		
		CLASS: function( elem, match ) {
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},

		ATTR: function( elem, match ) {
			var name = match[1],
				result = Sizzle.attr ?
					Sizzle.attr( elem, name ) :
					Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				!type && Sizzle.attr ?
				result != null :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},

		POS: function( elem, match, i, array ) {
			var name = match[2],
				filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS,
	fescape = function(all, num){
		return "\\" + (num - 0 + 1);
	};

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}

var makeArray = function( array, results ) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch( e ) {
	makeArray = function( array, results ) {
		var i = 0,
			ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );

		} else {
			if ( typeof array.length === "number" ) {
				for ( var l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}

			} else {
				for ( ; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder, siblingCheck;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			return a.compareDocumentPosition ? -1 : 1;
		}

		return a.compareDocumentPosition(b) & 4 ? -1 : 1;
	};

} else {
	sortOrder = function( a, b ) {
		// The nodes are identical, we can exit early
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Fallback to using sourceIndex (in IE) if it's available on both nodes
		} else if ( a.sourceIndex && b.sourceIndex ) {
			return a.sourceIndex - b.sourceIndex;
		}

		var al, bl,
			ap = [],
			bp = [],
			aup = a.parentNode,
			bup = b.parentNode,
			cur = aup;

		// If the nodes are siblings (or identical) we can do a quick check
		if ( aup === bup ) {
			return siblingCheck( a, b );

		// If no parents were found then the nodes are disconnected
		} else if ( !aup ) {
			return -1;

		} else if ( !bup ) {
			return 1;
		}

		// Otherwise they're somewhere else in the tree so we need
		// to build up a full list of the parentNodes for comparison
		while ( cur ) {
			ap.unshift( cur );
			cur = cur.parentNode;
		}

		cur = bup;

		while ( cur ) {
			bp.unshift( cur );
			cur = cur.parentNode;
		}

		al = ap.length;
		bl = bp.length;

		// Start walking down the tree looking for a discrepancy
		for ( var i = 0; i < al && i < bl; i++ ) {
			if ( ap[i] !== bp[i] ) {
				return siblingCheck( ap[i], bp[i] );
			}
		}

		// We ended someplace up the tree so do a sibling check
		return i === al ?
			siblingCheck( a, bp[i], -1 ) :
			siblingCheck( ap[i], b, 1 );
	};

	siblingCheck = function( a, b, ret ) {
		if ( a === b ) {
			return ret;
		}

		var cur = a.nextSibling;

		while ( cur ) {
			if ( cur === b ) {
				return -1;
			}

			cur = cur.nextSibling;
		}

		return 1;
	};
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date()).getTime(),
		root = document.documentElement;

	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);

				return m ?
					m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
						[m] :
						undefined :
					[];
			}
		};

		Expr.filter.ID = function( elem, match ) {
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );

	// release memory in IE
	root = form = null;
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function( match, context ) {
			var results = context.getElementsByTagName( match[1] );

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";

	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {

		Expr.attrHandle.href = function( elem ) {
			return elem.getAttribute( "href", 2 );
		};
	}

	// release memory in IE
	div = null;
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle,
			div = document.createElement("div"),
			id = "__sizzle__";

		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}
	
		Sizzle = function( query, context, extra, seed ) {
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && !Sizzle.isXML(context) ) {
				// See if we find a selector to speed up
				var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );
				
				if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
					// Speed-up: Sizzle("TAG")
					if ( match[1] ) {
						return makeArray( context.getElementsByTagName( query ), extra );
					
					// Speed-up: Sizzle(".CLASS")
					} else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
						return makeArray( context.getElementsByClassName( match[2] ), extra );
					}
				}
				
				if ( context.nodeType === 9 ) {
					// Speed-up: Sizzle("body")
					// The body element only exists once, optimize finding it
					if ( query === "body" && context.body ) {
						return makeArray( [ context.body ], extra );
						
					// Speed-up: Sizzle("#ID")
					} else if ( match && match[3] ) {
						var elem = context.getElementById( match[3] );

						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						if ( elem && elem.parentNode ) {
							// Handle the case where IE and Opera return items
							// by name instead of ID
							if ( elem.id === match[3] ) {
								return makeArray( [ elem ], extra );
							}
							
						} else {
							return makeArray( [], extra );
						}
					}
					
					try {
						return makeArray( context.querySelectorAll(query), extra );
					} catch(qsaError) {}

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				} else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
					var oldContext = context,
						old = context.getAttribute( "id" ),
						nid = old || id,
						hasParent = context.parentNode,
						relativeHierarchySelector = /^\s*[+~]/.test( query );

					if ( !old ) {
						context.setAttribute( "id", nid );
					} else {
						nid = nid.replace( /'/g, "\\$&" );
					}
					if ( relativeHierarchySelector && hasParent ) {
						context = context.parentNode;
					}

					try {
						if ( !relativeHierarchySelector || hasParent ) {
							return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
						}

					} catch(pseudoError) {
					} finally {
						if ( !old ) {
							oldContext.removeAttribute( "id" );
						}
					}
				}
			}
		
			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		// release memory in IE
		div = null;
	})();
}

(function(){
	var html = document.documentElement,
		matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

	if ( matches ) {
		// Check to see if it's possible to do matchesSelector
		// on a disconnected node (IE 9 fails this)
		var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
			pseudoWorks = false;

		try {
			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( document.documentElement, "[test!='']:sizzle" );
	
		} catch( pseudoError ) {
			pseudoWorks = true;
		}

		Sizzle.matchesSelector = function( node, expr ) {
			// Make sure that attribute selectors are quoted
			expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

			if ( !Sizzle.isXML( node ) ) {
				try { 
					if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
						var ret = matches.call( node, expr );

						// IE 9's matchesSelector returns false on disconnected nodes
						if ( ret || !disconnectedMatch ||
								// As well, disconnected nodes are said to be in a document
								// fragment in IE 9, so check for that
								node.document && node.document.nodeType !== 11 ) {
							return ret;
						}
					}
				} catch(e) {}
			}

			return Sizzle(expr, null, null, [node]).length > 0;
		};
	}
})();

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}
	
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function( match, context, isXML ) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	// release memory in IE
	div = null;
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;

			elem = elem[dir];

			while ( elem ) {
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem[ expando ] = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;
			
			elem = elem[dir];

			while ( elem ) {
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem[ expando ] = doneName;
						elem.sizset = i;
					}

					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

if ( document.documentElement.contains ) {
	Sizzle.contains = function( a, b ) {
		return a !== b && (a.contains ? a.contains(b) : true);
	};

} else if ( document.documentElement.compareDocumentPosition ) {
	Sizzle.contains = function( a, b ) {
		return !!(a.compareDocumentPosition(b) & 16);
	};

} else {
	Sizzle.contains = function() {
		return false;
	};
}

Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833) 
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function( selector, context, seed ) {
	var match,
		tmpSet = [],
		later = "",
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet, seed );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE
// Override sizzle attribute retrieval
Sizzle.attr = jQuery.attr;
Sizzle.selectors.attrMap = {};
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.filters;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})();


var runtil = /Until$/,
	rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
	rmultiselector = /,/,
	isSimple = /^.[^:#\[\.,]*$/,
	slice = Array.prototype.slice,
	POS = jQuery.expr.match.POS,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var self = this,
			i, l;

		if ( typeof selector !== "string" ) {
			return jQuery( selector ).filter(function() {
				for ( i = 0, l = self.length; i < l; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			});
		}

		var ret = this.pushStack( "", "find", selector ),
			length, n, r;

		for ( i = 0, l = this.length; i < l; i++ ) {
			length = ret.length;
			jQuery.find( selector, this[i], ret );

			if ( i > 0 ) {
				// Make sure that the results are unique
				for ( n = length; n < ret.length; n++ ) {
					for ( r = 0; r < length; r++ ) {
						if ( ret[r] === ret[n] ) {
							ret.splice(n--, 1);
							break;
						}
					}
				}
			}
		}

		return ret;
	},

	has: function( target ) {
		var targets = jQuery( target );
		return this.filter(function() {
			for ( var i = 0, l = targets.length; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector, false), "not", selector);
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector, true), "filter", selector );
	},

	is: function( selector ) {
		return !!selector && ( 
			typeof selector === "string" ?
				// If this is a positional selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				POS.test( selector ) ? 
					jQuery( selector, this.context ).index( this[0] ) >= 0 :
					jQuery.filter( selector, this ).length > 0 :
				this.filter( selector ).length > 0 );
	},

	closest: function( selectors, context ) {
		var ret = [], i, l, cur = this[0];
		
		// Array (deprecated as of jQuery 1.7)
		if ( jQuery.isArray( selectors ) ) {
			var level = 1;

			while ( cur && cur.ownerDocument && cur !== context ) {
				for ( i = 0; i < selectors.length; i++ ) {

					if ( jQuery( cur ).is( selectors[ i ] ) ) {
						ret.push({ selector: selectors[ i ], elem: cur, level: level });
					}
				}

				cur = cur.parentNode;
				level++;
			}

			return ret;
		}

		// String
		var pos = POS.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( i = 0, l = this.length; i < l; i++ ) {
			cur = this[i];

			while ( cur ) {
				if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
					ret.push( cur );
					break;

				} else {
					cur = cur.parentNode;
					if ( !cur || !cur.ownerDocument || cur === context || cur.nodeType === 11 ) {
						break;
					}
				}
			}
		}

		ret = ret.length > 1 ? jQuery.unique( ret ) : ret;

		return this.pushStack( ret, "closest", selectors );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
			all :
			jQuery.unique( all ) );
	},

	andSelf: function() {
		return this.add( this.prevObject );
	}
});

// A painfully simple check to see if an element is disconnected
// from a document (should be improved, where feasible).
function isDisconnected( node ) {
	return !node || !node.parentNode || node.parentNode.nodeType === 11;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return jQuery.nth( elem, 2, "nextSibling" );
	},
	prev: function( elem ) {
		return jQuery.nth( elem, 2, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( elem.parentNode.firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.makeArray( elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( !runtil.test( name ) ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;

		if ( (this.length > 1 || rmultiselector.test( selector )) && rparentsprev.test( name ) ) {
			ret = ret.reverse();
		}

		return this.pushStack( ret, name, slice.call( arguments ).join(",") );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 ?
			jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
			jQuery.find.matches(expr, elems);
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	nth: function( cur, result, dir, elem ) {
		result = result || 1;
		var num = 0;

		for ( ; cur; cur = cur[dir] ) {
			if ( cur.nodeType === 1 && ++num === result ) {
				break;
			}
		}

		return cur;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, keep ) {

	// Can't pass null or undefined to indexOf in Firefox 4
	// Set to 0 to skip string check
	qualifier = qualifier || 0;

	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep(elements, function( elem, i ) {
			var retVal = !!qualifier.call( elem, i, elem );
			return retVal === keep;
		});

	} else if ( qualifier.nodeType ) {
		return jQuery.grep(elements, function( elem, i ) {
			return ( elem === qualifier ) === keep;
		});

	} else if ( typeof qualifier === "string" ) {
		var filtered = jQuery.grep(elements, function( elem ) {
			return elem.nodeType === 1;
		});

		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter(qualifier, filtered, !keep);
		} else {
			qualifier = jQuery.filter( qualifier, filtered );
		}
	}

	return jQuery.grep(elements, function( elem, i ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
	});
}




function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
	safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:\d+|null)"/g,
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style)/i,
	rnocache = /<(?:script|object|embed|option|style)/i,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")", "i"),
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /\/(java|ecma)script/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)/,
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		area: [ 1, "<map>", "</map>" ],
		_default: [ 0, "", "" ]
	},
	safeFragment = createSafeFragment( document );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// IE can't serialize <link> and <script> tags normally
if ( !jQuery.support.htmlSerialize ) {
	wrapMap._default = [ 1, "div<div>", "</div>" ];
}

jQuery.fn.extend({
	text: function( text ) {
		if ( jQuery.isFunction(text) ) {
			return this.each(function(i) {
				var self = jQuery( this );

				self.text( text.call(this, i, self.text()) );
			});
		}

		if ( typeof text !== "object" && text !== undefined ) {
			return this.empty().append( (this[0] && this[0].ownerDocument || document).createTextNode( text ) );
		}

		return jQuery.text( this );
	},

	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this );
			});
		} else if ( arguments.length ) {
			var set = jQuery.clean( arguments );
			set.push.apply( set, this.toArray() );
			return this.pushStack( set, "before", arguments );
		}
	},

	after: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			});
		} else if ( arguments.length ) {
			var set = this.pushStack( this, "after", arguments );
			set.push.apply( set, jQuery.clean(arguments) );
			return set;
		}
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
				if ( !keepData && elem.nodeType === 1 ) {
					jQuery.cleanData( elem.getElementsByTagName("*") );
					jQuery.cleanData( [ elem ] );
				}

				if ( elem.parentNode ) {
					elem.parentNode.removeChild( elem );
				}
			}
		}

		return this;
	},

	empty: function() {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( elem.getElementsByTagName("*") );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		if ( value === undefined ) {
			return this[0] && this[0].nodeType === 1 ?
				this[0].innerHTML.replace(rinlinejQuery, "") :
				null;

		// See if we can take a shortcut and just use innerHTML
		} else if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
			(jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value )) &&
			!wrapMap[ (rtagName.exec( value ) || ["", ""])[1].toLowerCase() ] ) {

			value = value.replace(rxhtmlTag, "<$1></$2>");

			try {
				for ( var i = 0, l = this.length; i < l; i++ ) {
					// Remove element nodes and prevent memory leaks
					if ( this[i].nodeType === 1 ) {
						jQuery.cleanData( this[i].getElementsByTagName("*") );
						this[i].innerHTML = value;
					}
				}

			// If using innerHTML throws an exception, use the fallback method
			} catch(e) {
				this.empty().append( value );
			}

		} else if ( jQuery.isFunction( value ) ) {
			this.each(function(i){
				var self = jQuery( this );

				self.html( value.call(this, i, self.html()) );
			});

		} else {
			this.empty().append( value );
		}

		return this;
	},

	replaceWith: function( value ) {
		if ( this[0] && this[0].parentNode ) {
			// Make sure that the elements are removed from the DOM before they are inserted
			// this can help fix replacing a parent with child elements
			if ( jQuery.isFunction( value ) ) {
				return this.each(function(i) {
					var self = jQuery(this), old = self.html();
					self.replaceWith( value.call( this, i, old ) );
				});
			}

			if ( typeof value !== "string" ) {
				value = jQuery( value ).detach();
			}

			return this.each(function() {
				var next = this.nextSibling,
					parent = this.parentNode;

				jQuery( this ).remove();

				if ( next ) {
					jQuery(next).before( value );
				} else {
					jQuery(parent).append( value );
				}
			});
		} else {
			return this.length ?
				this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value ) :
				this;
		}
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, table, callback ) {
		var results, first, fragment, parent,
			value = args[0],
			scripts = [];

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( !jQuery.support.checkClone && arguments.length === 3 && typeof value === "string" && rchecked.test( value ) ) {
			return this.each(function() {
				jQuery(this).domManip( args, table, callback, true );
			});
		}

		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				args[0] = value.call(this, i, table ? self.html() : undefined);
				self.domManip( args, table, callback );
			});
		}

		if ( this[0] ) {
			parent = value && value.parentNode;

			// If we're in a fragment, just use that instead of building a new one
			if ( jQuery.support.parentNode && parent && parent.nodeType === 11 && parent.childNodes.length === this.length ) {
				results = { fragment: parent };

			} else {
				results = jQuery.buildFragment( args, this, scripts );
			}

			fragment = results.fragment;

			if ( fragment.childNodes.length === 1 ) {
				first = fragment = fragment.firstChild;
			} else {
				first = fragment.firstChild;
			}

			if ( first ) {
				table = table && jQuery.nodeName( first, "tr" );

				for ( var i = 0, l = this.length, lastIndex = l - 1; i < l; i++ ) {
					callback.call(
						table ?
							root(this[i], first) :
							this[i],
						// Make sure that we do not leak memory by inadvertently discarding
						// the original fragment (which might have attached data) instead of
						// using it; in addition, use the original fragment object for the last
						// item instead of first because it can end up being emptied incorrectly
						// in certain situations (Bug #8070).
						// Fragments from the fragment cache must always be cloned and never used
						// in place.
						results.cacheable || ( l > 1 && i < lastIndex ) ?
							jQuery.clone( fragment, true, true ) :
							fragment
					);
				}
			}

			if ( scripts.length ) {
				jQuery.each( scripts, evalScript );
			}
		}

		return this;
	}
});

function root( elem, cur ) {
	return jQuery.nodeName(elem, "table") ?
		(elem.getElementsByTagName("tbody")[0] ||
		elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
		elem;
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type + ( events[ type ][ i ].namespace ? "." : "" ) + events[ type ][ i ].namespace, events[ type ][ i ], events[ type ][ i ].data );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function cloneFixAttributes( src, dest ) {
	var nodeName;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	// clearAttributes removes the attributes, which we don't want,
	// but also removes the attachEvent events, which we *do* want
	if ( dest.clearAttributes ) {
		dest.clearAttributes();
	}

	// mergeAttributes, in contrast, only merges back on the
	// original attributes, not the events
	if ( dest.mergeAttributes ) {
		dest.mergeAttributes( src );
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 fail to clone children inside object elements that use
	// the proprietary classid attribute value (rather than the type
	// attribute) to identify the type of content to display
	if ( nodeName === "object" ) {
		dest.outerHTML = src.outerHTML;

	} else if ( nodeName === "input" && (src.type === "checkbox" || src.type === "radio") ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set
		if ( src.checked ) {
			dest.defaultChecked = dest.checked = src.checked;
		}

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}

	// Event data gets referenced instead of copied if the expando
	// gets copied too
	dest.removeAttribute( jQuery.expando );
}

jQuery.buildFragment = function( args, nodes, scripts ) {
	var fragment, cacheable, cacheresults, doc,
	first = args[ 0 ];

	// nodes may contain either an explicit document object,
	// a jQuery collection or context object.
	// If nodes[0] contains a valid object to assign to doc
	if ( nodes && nodes[0] ) {
		doc = nodes[0].ownerDocument || nodes[0];
	}

	// Ensure that an attr object doesn't incorrectly stand in as a document object
	// Chrome and Firefox seem to allow this to occur and will throw exception
	// Fixes #8950
	if ( !doc.createDocumentFragment ) {
		doc = document;
	}

	// Only cache "small" (1/2 KB) HTML strings that are associated with the main document
	// Cloning options loses the selected state, so don't cache them
	// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
	// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
	// Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501
	if ( args.length === 1 && typeof first === "string" && first.length < 512 && doc === document &&
		first.charAt(0) === "<" && !rnocache.test( first ) &&
		(jQuery.support.checkClone || !rchecked.test( first )) &&
		(jQuery.support.html5Clone || !rnoshimcache.test( first )) ) {

		cacheable = true;

		cacheresults = jQuery.fragments[ first ];
		if ( cacheresults && cacheresults !== 1 ) {
			fragment = cacheresults;
		}
	}

	if ( !fragment ) {
		fragment = doc.createDocumentFragment();
		jQuery.clean( args, doc, fragment, scripts );
	}

	if ( cacheable ) {
		jQuery.fragments[ first ] = cacheresults ? fragment : 1;
	}

	return { fragment: fragment, cacheable: cacheable };
};

jQuery.fragments = {};

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var ret = [],
			insert = jQuery( selector ),
			parent = this.length === 1 && this[0].parentNode;

		if ( parent && parent.nodeType === 11 && parent.childNodes.length === 1 && insert.length === 1 ) {
			insert[ original ]( this[0] );
			return this;

		} else {
			for ( var i = 0, l = insert.length; i < l; i++ ) {
				var elems = ( i > 0 ? this.clone(true) : this ).get();
				jQuery( insert[i] )[ original ]( elems );
				ret = ret.concat( elems );
			}

			return this.pushStack( ret, name, insert.selector );
		}
	};
});

function getAll( elem ) {
	if ( typeof elem.getElementsByTagName !== "undefined" ) {
		return elem.getElementsByTagName( "*" );

	} else if ( typeof elem.querySelectorAll !== "undefined" ) {
		return elem.querySelectorAll( "*" );

	} else {
		return [];
	}
}

// Used in clean, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( elem.type === "checkbox" || elem.type === "radio" ) {
		elem.defaultChecked = elem.checked;
	}
}
// Finds all inputs and passes them to fixDefaultChecked
function findInputs( elem ) {
	var nodeName = ( elem.nodeName || "" ).toLowerCase();
	if ( nodeName === "input" ) {
		fixDefaultChecked( elem );
	// Skip scripts, get other children
	} else if ( nodeName !== "script" && typeof elem.getElementsByTagName !== "undefined" ) {
		jQuery.grep( elem.getElementsByTagName("input"), fixDefaultChecked );
	}
}

// Derived From: http://www.iecss.com/shimprove/javascript/shimprove.1-0-1.js
function shimCloneNode( elem ) {
	var div = document.createElement( "div" );
	safeFragment.appendChild( div );

	div.innerHTML = elem.outerHTML;
	return div.firstChild;
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var srcElements,
			destElements,
			i,
			// IE<=8 does not properly clone detached, unknown element nodes
			clone = jQuery.support.html5Clone || !rnoshimcache.test( "<" + elem.nodeName ) ?
				elem.cloneNode( true ) :
				shimCloneNode( elem );

		if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {
			// IE copies events bound via attachEvent when using cloneNode.
			// Calling detachEvent on the clone will also remove the events
			// from the original. In order to get around this, we use some
			// proprietary methods to clear the events. Thanks to MooTools
			// guys for this hotness.

			cloneFixAttributes( elem, clone );

			// Using Sizzle here is crazy slow, so we use getElementsByTagName instead
			srcElements = getAll( elem );
			destElements = getAll( clone );

			// Weird iteration because IE will replace the length property
			// with an element if you are cloning the body and one of the
			// elements on the page has a name or id of "length"
			for ( i = 0; srcElements[i]; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					cloneFixAttributes( srcElements[i], destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			cloneCopyEvent( elem, clone );

			if ( deepDataAndEvents ) {
				srcElements = getAll( elem );
				destElements = getAll( clone );

				for ( i = 0; srcElements[i]; ++i ) {
					cloneCopyEvent( srcElements[i], destElements[i] );
				}
			}
		}

		srcElements = destElements = null;

		// Return the cloned set
		return clone;
	},

	clean: function( elems, context, fragment, scripts ) {
		var checkScriptType;

		context = context || document;

		// !context.createElement fails in IE with an error but returns typeof 'object'
		if ( typeof context.createElement === "undefined" ) {
			context = context.ownerDocument || context[0] && context[0].ownerDocument || document;
		}

		var ret = [], j;

		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( typeof elem === "number" ) {
				elem += "";
			}

			if ( !elem ) {
				continue;
			}

			// Convert html string into DOM nodes
			if ( typeof elem === "string" ) {
				if ( !rhtml.test( elem ) ) {
					elem = context.createTextNode( elem );
				} else {
					// Fix "XHTML"-style tags in all browsers
					elem = elem.replace(rxhtmlTag, "<$1></$2>");

					// Trim whitespace, otherwise indexOf won't work as expected
					var tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase(),
						wrap = wrapMap[ tag ] || wrapMap._default,
						depth = wrap[0],
						div = context.createElement("div");

					// Append wrapper element to unknown element safe doc fragment
					if ( context === document ) {
						// Use the fragment we've already created for this document
						safeFragment.appendChild( div );
					} else {
						// Use a fragment created with the owner document
						createSafeFragment( context ).appendChild( div );
					}

					// Go to html and back, then peel off extra wrappers
					div.innerHTML = wrap[1] + elem + wrap[2];

					// Move to the right depth
					while ( depth-- ) {
						div = div.lastChild;
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !jQuery.support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						var hasBody = rtbody.test(elem),
							tbody = tag === "table" && !hasBody ?
								div.firstChild && div.firstChild.childNodes :

								// String was a bare <thead> or <tfoot>
								wrap[1] === "<table>" && !hasBody ?
									div.childNodes :
									[];

						for ( j = tbody.length - 1; j >= 0 ; --j ) {
							if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
								tbody[ j ].parentNode.removeChild( tbody[ j ] );
							}
						}
					}

					// IE completely kills leading whitespace when innerHTML is used
					if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
					}

					elem = div.childNodes;
				}
			}

			// Resets defaultChecked for any radios and checkboxes
			// about to be appended to the DOM in IE 6/7 (#8060)
			var len;
			if ( !jQuery.support.appendChecked ) {
				if ( elem[0] && typeof (len = elem.length) === "number" ) {
					for ( j = 0; j < len; j++ ) {
						findInputs( elem[j] );
					}
				} else {
					findInputs( elem );
				}
			}

			if ( elem.nodeType ) {
				ret.push( elem );
			} else {
				ret = jQuery.merge( ret, elem );
			}
		}

		if ( fragment ) {
			checkScriptType = function( elem ) {
				return !elem.type || rscriptType.test( elem.type );
			};
			for ( i = 0; ret[i]; i++ ) {
				if ( scripts && jQuery.nodeName( ret[i], "script" ) && (!ret[i].type || ret[i].type.toLowerCase() === "text/javascript") ) {
					scripts.push( ret[i].parentNode ? ret[i].parentNode.removeChild( ret[i] ) : ret[i] );

				} else {
					if ( ret[i].nodeType === 1 ) {
						var jsTags = jQuery.grep( ret[i].getElementsByTagName( "script" ), checkScriptType );

						ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
					}
					fragment.appendChild( ret[i] );
				}
			}
		}

		return ret;
	},

	cleanData: function( elems ) {
		var data, id,
			cache = jQuery.cache,
			special = jQuery.event.special,
			deleteExpando = jQuery.support.deleteExpando;

		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
				continue;
			}

			id = elem[ jQuery.expando ];

			if ( id ) {
				data = cache[ id ];

				if ( data && data.events ) {
					for ( var type in data.events ) {
						if ( special[ type ] ) {
							jQuery.event.remove( elem, type );

						// This is a shortcut to avoid jQuery.event.remove's overhead
						} else {
							jQuery.removeEvent( elem, type, data.handle );
						}
					}

					// Null the DOM reference to avoid IE6/7/8 leak (#7054)
					if ( data.handle ) {
						data.handle.elem = null;
					}
				}

				if ( deleteExpando ) {
					delete elem[ jQuery.expando ];

				} else if ( elem.removeAttribute ) {
					elem.removeAttribute( jQuery.expando );
				}

				delete cache[ id ];
			}
		}
	}
});

function evalScript( i, elem ) {
	if ( elem.src ) {
		jQuery.ajax({
			url: elem.src,
			async: false,
			dataType: "script"
		});
	} else {
		jQuery.globalEval( ( elem.text || elem.textContent || elem.innerHTML || "" ).replace( rcleanScript, "/*$0*/" ) );
	}

	if ( elem.parentNode ) {
		elem.parentNode.removeChild( elem );
	}
}




var ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity=([^)]*)/,
	// fixed for IE9, see #8346
	rupper = /([A-Z]|^ms)/g,
	rnumpx = /^-?\d+(?:px)?$/i,
	rnum = /^-?\d/,
	rrelNum = /^([\-+])=([\-+.\de]+)/,

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssWidth = [ "Left", "Right" ],
	cssHeight = [ "Top", "Bottom" ],
	curCSS,

	getComputedStyle,
	currentStyle;

jQuery.fn.css = function( name, value ) {
	// Setting 'undefined' is a no-op
	if ( arguments.length === 2 && value === undefined ) {
		return this;
	}

	return jQuery.access( this, name, value, true, function( elem, name, value ) {
		return value !== undefined ?
			jQuery.style( elem, name, value ) :
			jQuery.css( elem, name );
	});
};

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity", "opacity" );
					return ret === "" ? "1" : ret;

				} else {
					return elem.style.opacity;
				}
			}
		}
	},

	// Exclude the following css properties to add px
	cssNumber: {
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, origName = jQuery.camelCase( name ),
			style = elem.style, hooks = jQuery.cssHooks[ origName ];

		name = jQuery.cssProps[ origName ] || origName;

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( +( ret[1] + 1) * +ret[2] ) + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value )) !== undefined ) {
				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
				// Fixes bug #5509
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra ) {
		var ret, hooks;

		// Make sure that we're working with the right name
		name = jQuery.camelCase( name );
		hooks = jQuery.cssHooks[ name ];
		name = jQuery.cssProps[ name ] || name;

		// cssFloat needs a special treatment
		if ( name === "cssFloat" ) {
			name = "float";
		}

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks && (ret = hooks.get( elem, true, extra )) !== undefined ) {
			return ret;

		// Otherwise, if a way to get the computed value exists, use that
		} else if ( curCSS ) {
			return curCSS( elem, name );
		}
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback ) {
		var old = {};

		// Remember the old values, and insert the new ones
		for ( var name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		callback.call( elem );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}
	}
});

// DEPRECATED, Use jQuery.css() instead
jQuery.curCSS = jQuery.css;

jQuery.each(["height", "width"], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			var val;

			if ( computed ) {
				if ( elem.offsetWidth !== 0 ) {
					return getWH( elem, name, extra );
				} else {
					jQuery.swap( elem, cssShow, function() {
						val = getWH( elem, name, extra );
					});
				}

				return val;
			}
		},

		set: function( elem, value ) {
			if ( rnumpx.test( value ) ) {
				// ignore negative width and height values #1599
				value = parseFloat( value );

				if ( value >= 0 ) {
					return value + "px";
				}

			} else {
				return value;
			}
		}
	};
});

if ( !jQuery.support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( parseFloat( RegExp.$1 ) / 100 ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			if ( value >= 1 && jQuery.trim( filter.replace( ralpha, "" ) ) === "" ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there there is no filter style applied in a css rule, we are done
				if ( currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

jQuery(function() {
	// This hook cannot be added until DOM ready because the support test
	// for it is not run until after DOM ready
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// Work around by temporarily setting element display to inline-block
				var ret;
				jQuery.swap( elem, { "display": "inline-block" }, function() {
					if ( computed ) {
						ret = curCSS( elem, "margin-right", "marginRight" );
					} else {
						ret = elem.style.marginRight;
					}
				});
				return ret;
			}
		};
	}
});

if ( document.defaultView && document.defaultView.getComputedStyle ) {
	getComputedStyle = function( elem, name ) {
		var ret, defaultView, computedStyle;

		name = name.replace( rupper, "-$1" ).toLowerCase();

		if ( (defaultView = elem.ownerDocument.defaultView) &&
				(computedStyle = defaultView.getComputedStyle( elem, null )) ) {
			ret = computedStyle.getPropertyValue( name );
			if ( ret === "" && !jQuery.contains( elem.ownerDocument.documentElement, elem ) ) {
				ret = jQuery.style( elem, name );
			}
		}

		return ret;
	};
}

if ( document.documentElement.currentStyle ) {
	currentStyle = function( elem, name ) {
		var left, rsLeft, uncomputed,
			ret = elem.currentStyle && elem.currentStyle[ name ],
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret === null && style && (uncomputed = style[ name ]) ) {
			ret = uncomputed;
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		if ( !rnumpx.test( ret ) && rnum.test( ret ) ) {

			// Remember the original values
			left = style.left;
			rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				elem.runtimeStyle.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ( ret || 0 );
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				elem.runtimeStyle.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};
}

curCSS = getComputedStyle || currentStyle;

function getWH( elem, name, extra ) {

	// Start with offset property
	var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		which = name === "width" ? cssWidth : cssHeight,
		i = 0,
		len = which.length;

	if ( val > 0 ) {
		if ( extra !== "border" ) {
			for ( ; i < len; i++ ) {
				if ( !extra ) {
					val -= parseFloat( jQuery.css( elem, "padding" + which[ i ] ) ) || 0;
				}
				if ( extra === "margin" ) {
					val += parseFloat( jQuery.css( elem, extra + which[ i ] ) ) || 0;
				} else {
					val -= parseFloat( jQuery.css( elem, "border" + which[ i ] + "Width" ) ) || 0;
				}
			}
		}

		return val + "px";
	}

	// Fall back to computed then uncomputed css if necessary
	val = curCSS( elem, name, name );
	if ( val < 0 || val == null ) {
		val = elem.style[ name ] || 0;
	}
	// Normalize "", auto, and prepare for extra
	val = parseFloat( val ) || 0;

	// Add padding, border, margin
	if ( extra ) {
		for ( ; i < len; i++ ) {
			val += parseFloat( jQuery.css( elem, "padding" + which[ i ] ) ) || 0;
			if ( extra !== "padding" ) {
				val += parseFloat( jQuery.css( elem, "border" + which[ i ] + "Width" ) ) || 0;
			}
			if ( extra === "margin" ) {
				val += parseFloat( jQuery.css( elem, extra + which[ i ] ) ) || 0;
			}
		}
	}

	return val + "px";
}

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		var width = elem.offsetWidth,
			height = elem.offsetHeight;

		return ( width === 0 && height === 0 ) || (!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rhash = /#.*$/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rquery = /\?/,
	rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
	rselectTextarea = /^(?:select|textarea)/i,
	rspacesAjax = /\s+/,
	rts = /([?&])_=[^&]*/,
	rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Document location
	ajaxLocation,

	// Document location segments
	ajaxLocParts,

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = ["*/"] + ["*"];

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		if ( jQuery.isFunction( func ) ) {
			var dataTypes = dataTypeExpression.toLowerCase().split( rspacesAjax ),
				i = 0,
				length = dataTypes.length,
				dataType,
				list,
				placeBefore;

			// For each dataType in the dataTypeExpression
			for ( ; i < length; i++ ) {
				dataType = dataTypes[ i ];
				// We control if we're asked to add before
				// any existing element
				placeBefore = /^\+/.test( dataType );
				if ( placeBefore ) {
					dataType = dataType.substr( 1 ) || "*";
				}
				list = structure[ dataType ] = structure[ dataType ] || [];
				// then we add to the structure accordingly
				list[ placeBefore ? "unshift" : "push" ]( func );
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR,
		dataType /* internal */, inspected /* internal */ ) {

	dataType = dataType || options.dataTypes[ 0 ];
	inspected = inspected || {};

	inspected[ dataType ] = true;

	var list = structure[ dataType ],
		i = 0,
		length = list ? list.length : 0,
		executeOnly = ( structure === prefilters ),
		selection;

	for ( ; i < length && ( executeOnly || !selection ); i++ ) {
		selection = list[ i ]( options, originalOptions, jqXHR );
		// If we got redirected to another dataType
		// we try there if executing only and not done already
		if ( typeof selection === "string" ) {
			if ( !executeOnly || inspected[ selection ] ) {
				selection = undefined;
			} else {
				options.dataTypes.unshift( selection );
				selection = inspectPrefiltersOrTransports(
						structure, options, originalOptions, jqXHR, selection, inspected );
			}
		}
	}
	// If we're only executing or nothing was selected
	// we try the catchall dataType if not done already
	if ( ( executeOnly || !selection ) && !inspected[ "*" ] ) {
		selection = inspectPrefiltersOrTransports(
				structure, options, originalOptions, jqXHR, "*", inspected );
	}
	// unnecessary when only executing (prefilters)
	// but it'll be ignored by the caller in that case
	return selection;
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};
	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}
}

jQuery.fn.extend({
	load: function( url, params, callback ) {
		if ( typeof url !== "string" && _load ) {
			return _load.apply( this, arguments );

		// Don't do a request if no elements are being requested
		} else if ( !this.length ) {
			return this;
		}

		var off = url.indexOf( " " );
		if ( off >= 0 ) {
			var selector = url.slice( off, url.length );
			url = url.slice( 0, off );
		}

		// Default to a GET request
		var type = "GET";

		// If the second parameter was provided
		if ( params ) {
			// If it's a function
			if ( jQuery.isFunction( params ) ) {
				// We assume that it's the callback
				callback = params;
				params = undefined;

			// Otherwise, build a param string
			} else if ( typeof params === "object" ) {
				params = jQuery.param( params, jQuery.ajaxSettings.traditional );
				type = "POST";
			}
		}

		var self = this;

		// Request the remote document
		jQuery.ajax({
			url: url,
			type: type,
			dataType: "html",
			data: params,
			// Complete callback (responseText is used internally)
			complete: function( jqXHR, status, responseText ) {
				// Store the response as specified by the jqXHR object
				responseText = jqXHR.responseText;
				// If successful, inject the HTML into all the matched elements
				if ( jqXHR.isResolved() ) {
					// #4825: Get the actual response in case
					// a dataFilter is present in ajaxSettings
					jqXHR.done(function( r ) {
						responseText = r;
					});
					// See if a selector was specified
					self.html( selector ?
						// Create a dummy div to hold the results
						jQuery("<div>")
							// inject the contents of the document in, removing the scripts
							// to avoid any 'Permission Denied' errors in IE
							.append(responseText.replace(rscript, ""))

							// Locate the specified elements
							.find(selector) :

						// If not, just inject the full result
						responseText );
				}

				if ( callback ) {
					self.each( callback, [ responseText, status, jqXHR ] );
				}
			}
		});

		return this;
	},

	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},

	serializeArray: function() {
		return this.map(function(){
			return this.elements ? jQuery.makeArray( this.elements ) : this;
		})
		.filter(function(){
			return this.name && !this.disabled &&
				( this.checked || rselectTextarea.test( this.nodeName ) ||
					rinput.test( this.type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val, i ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split( " " ), function( i, o ){
	jQuery.fn[ o ] = function( f ){
		return this.on( o, f );
	};
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			type: method,
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	};
});

jQuery.extend({

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		if ( settings ) {
			// Building a settings object
			ajaxExtend( target, jQuery.ajaxSettings );
		} else {
			// Extending ajaxSettings
			settings = target;
			target = jQuery.ajaxSettings;
		}
		ajaxExtend( target, settings );
		return target;
	},

	ajaxSettings: {
		url: ajaxLocation,
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		type: "GET",
		contentType: "application/x-www-form-urlencoded",
		processData: true,
		async: true,
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		traditional: false,
		headers: {},
		*/

		accepts: {
			xml: "application/xml, text/xml",
			html: "text/html",
			text: "text/plain",
			json: "application/json, text/javascript",
			"*": allTypes
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText"
		},

		// List of data converters
		// 1) key format is "source_type destination_type" (a single space in-between)
		// 2) the catchall symbol "*" can be used for source_type
		converters: {

			// Convert anything to text
			"* text": window.String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			context: true,
			url: true
		}
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events
			// It's the callbackContext if one was provided in the options
			// and if it's a DOM node or a jQuery collection
			globalEventContext = callbackContext !== s &&
				( callbackContext.nodeType || callbackContext instanceof jQuery ) ?
						jQuery( callbackContext ) : jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// ifModified key
			ifModifiedKey,
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// Response headers
			responseHeadersString,
			responseHeaders,
			// transport
			transport,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// The jqXHR state
			state = 0,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Fake xhr
			jqXHR = {

				readyState: 0,

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( !state ) {
						var lname = name.toLowerCase();
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match === undefined ? null : match;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					statusText = statusText || "abort";
					if ( transport ) {
						transport.abort( statusText );
					}
					done( 0, statusText );
					return this;
				}
			};

		// Callback for when everything is done
		// It is defined here because jslint complains if it is declared
		// at the end of the function (which would be more logical and readable)
		function done( status, nativeStatusText, responses, headers ) {

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			var isSuccess,
				success,
				error,
				statusText = nativeStatusText,
				response = responses ? ajaxHandleResponses( s, jqXHR, responses ) : undefined,
				lastModified,
				etag;

			// If successful, handle type chaining
			if ( status >= 200 && status < 300 || status === 304 ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {

					if ( ( lastModified = jqXHR.getResponseHeader( "Last-Modified" ) ) ) {
						jQuery.lastModified[ ifModifiedKey ] = lastModified;
					}
					if ( ( etag = jqXHR.getResponseHeader( "Etag" ) ) ) {
						jQuery.etag[ ifModifiedKey ] = etag;
					}
				}

				// If not modified
				if ( status === 304 ) {

					statusText = "notmodified";
					isSuccess = true;

				// If we have data
				} else {

					try {
						success = ajaxConvert( s, response );
						statusText = "success";
						isSuccess = true;
					} catch(e) {
						// We have a parsererror
						statusText = "parsererror";
						error = e;
					}
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( !statusText || status ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = "" + ( nativeStatusText || statusText );

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajax" + ( isSuccess ? "Success" : "Error" ),
						[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		// Attach deferreds
		deferred.promise( jqXHR );
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;
		jqXHR.complete = completeDeferred.add;

		// Status-dependent callbacks
		jqXHR.statusCode = function( map ) {
			if ( map ) {
				var tmp;
				if ( state < 2 ) {
					for ( tmp in map ) {
						statusCode[ tmp ] = [ statusCode[tmp], map[tmp] ];
					}
				} else {
					tmp = map[ jqXHR.status ];
					jqXHR.then( tmp, tmp );
				}
			}
			return this;
		};

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// We also use the url parameter if available
		s.url = ( ( url || s.url ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().split( rspacesAjax );

		// Determine if a cross-domain request is in order
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] != ajaxLocParts[ 1 ] || parts[ 2 ] != ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefiler, stop there
		if ( state === 2 ) {
			return false;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.data;
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Get ifModifiedKey before adding the anti-cache parameter
			ifModifiedKey = s.url;

			// Add anti-cache in url if needed
			if ( s.cache === false ) {

				var ts = jQuery.now(),
					// try replacing _= if it is there
					ret = s.url.replace( rts, "$1_=" + ts );

				// if nothing was replaced, add timestamp to the end
				s.url = ret + ( ( ret === s.url ) ? ( rquery.test( s.url ) ? "&" : "?" ) + "_=" + ts : "" );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			ifModifiedKey = ifModifiedKey || s.url;
			if ( jQuery.lastModified[ ifModifiedKey ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ ifModifiedKey ] );
			}
			if ( jQuery.etag[ ifModifiedKey ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ ifModifiedKey ] );
			}
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
				// Abort if not done already
				jqXHR.abort();
				return false;

		}

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;
			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout( function(){
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch (e) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		return jqXHR;
	},

	// Serialize an array of form elements or a set of
	// key/values into a query string
	param: function( a, traditional ) {
		var s = [],
			add = function( key, value ) {
				// If value is a function, invoke it and return its value
				value = jQuery.isFunction( value ) ? value() : value;
				s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
			};

		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = jQuery.ajaxSettings.traditional;
		}

		// If an array was passed in, assume that it is an array of form elements.
		if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			});

		} else {
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( var prefix in a ) {
				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join( "&" ).replace( r20, "+" );
	}
});

function buildParams( prefix, obj, traditional, add ) {
	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// If array item is non-scalar (array or object), encode its
				// numeric index to resolve deserialization ambiguity issues.
				// Note that rack (as of 1.0.0) can't currently deserialize
				// nested arrays properly, and attempting to do so may cause
				// a server error. Possible fixes are to modify rack's
				// deserialization algorithm or to provide an option or flag
				// to force array serialization to be shallow.
				buildParams( prefix + "[" + ( typeof v === "object" || jQuery.isArray(v) ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && obj != null && typeof obj === "object" ) {
		// Serialize object item.
		for ( var name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// This is still on the jQuery object... for now
// Want to move this to jQuery.ajax some day
jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {}

});

/* Handles responses to an ajax request:
 * - sets all responseXXX fields accordingly
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var contents = s.contents,
		dataTypes = s.dataTypes,
		responseFields = s.responseFields,
		ct,
		type,
		finalDataType,
		firstDataType;

	// Fill responseXXX fields
	for ( type in responseFields ) {
		if ( type in responses ) {
			jqXHR[ responseFields[type] ] = responses[ type ];
		}
	}

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "content-type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

// Chain conversions given the request and the original response
function ajaxConvert( s, response ) {

	// Apply the dataFilter if provided
	if ( s.dataFilter ) {
		response = s.dataFilter( response, s.dataType );
	}

	var dataTypes = s.dataTypes,
		converters = {},
		i,
		key,
		length = dataTypes.length,
		tmp,
		// Current and previous dataTypes
		current = dataTypes[ 0 ],
		prev,
		// Conversion expression
		conversion,
		// Conversion function
		conv,
		// Conversion functions (transitive conversion)
		conv1,
		conv2;

	// For each dataType in the chain
	for ( i = 1; i < length; i++ ) {

		// Create converters map
		// with lowercased keys
		if ( i === 1 ) {
			for ( key in s.converters ) {
				if ( typeof key === "string" ) {
					converters[ key.toLowerCase() ] = s.converters[ key ];
				}
			}
		}

		// Get the dataTypes
		prev = current;
		current = dataTypes[ i ];

		// If current is auto dataType, update it to prev
		if ( current === "*" ) {
			current = prev;
		// If no auto and dataTypes are actually different
		} else if ( prev !== "*" && prev !== current ) {

			// Get the converter
			conversion = prev + " " + current;
			conv = converters[ conversion ] || converters[ "* " + current ];

			// If there is no direct converter, search transitively
			if ( !conv ) {
				conv2 = undefined;
				for ( conv1 in converters ) {
					tmp = conv1.split( " " );
					if ( tmp[ 0 ] === prev || tmp[ 0 ] === "*" ) {
						conv2 = converters[ tmp[1] + " " + current ];
						if ( conv2 ) {
							conv1 = converters[ conv1 ];
							if ( conv1 === true ) {
								conv = conv2;
							} else if ( conv2 === true ) {
								conv = conv1;
							}
							break;
						}
					}
				}
			}
			// If we found no converter, dispatch an error
			if ( !( conv || conv2 ) ) {
				jQuery.error( "No conversion from " + conversion.replace(" "," to ") );
			}
			// If found converter is not an equivalence
			if ( conv !== true ) {
				// Convert with 1 or 2 converters accordingly
				response = conv ? conv( response ) : conv2( conv1(response) );
			}
		}
	}
	return response;
}




var jsc = jQuery.now(),
	jsre = /(\=)\?(&|$)|\?\?/i;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		return jQuery.expando + "_" + ( jsc++ );
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var inspectData = s.contentType === "application/x-www-form-urlencoded" &&
		( typeof s.data === "string" );

	if ( s.dataTypes[ 0 ] === "jsonp" ||
		s.jsonp !== false && ( jsre.test( s.url ) ||
				inspectData && jsre.test( s.data ) ) ) {

		var responseContainer,
			jsonpCallback = s.jsonpCallback =
				jQuery.isFunction( s.jsonpCallback ) ? s.jsonpCallback() : s.jsonpCallback,
			previous = window[ jsonpCallback ],
			url = s.url,
			data = s.data,
			replace = "$1" + jsonpCallback + "$2";

		if ( s.jsonp !== false ) {
			url = url.replace( jsre, replace );
			if ( s.url === url ) {
				if ( inspectData ) {
					data = data.replace( jsre, replace );
				}
				if ( s.data === data ) {
					// Add callback manually
					url += (/\?/.test( url ) ? "&" : "?") + s.jsonp + "=" + jsonpCallback;
				}
			}
		}

		s.url = url;
		s.data = data;

		// Install callback
		window[ jsonpCallback ] = function( response ) {
			responseContainer = [ response ];
		};

		// Clean-up function
		jqXHR.always(function() {
			// Set callback back to previous value
			window[ jsonpCallback ] = previous;
			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( previous ) ) {
				window[ jsonpCallback ]( responseContainer[ 0 ] );
			}
		});

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( jsonpCallback + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Delegate to script
		return "script";
	}
});




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /javascript|ecmascript/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement( "script" );

				script.async = "async";

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( head && script.parentNode ) {
							head.removeChild( script );
						}

						// Dereference the script
						script = undefined;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};
				// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
				// This arises when a base node is used (#2709 and #4378).
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( 0, 1 );
				}
			}
		};
	}
});




var // #5280: Internet Explorer will keep connections alive if we don't abort on unload
	xhrOnUnloadAbort = window.ActiveXObject ? function() {
		// Abort all pending requests
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]( 0, 1 );
		}
	} : false,
	xhrId = 0,
	xhrCallbacks;

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
	} catch( e ) {}
}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject ?
	/* Microsoft failed to properly
	 * implement the XMLHttpRequest in IE7 (can't request local files),
	 * so we use the ActiveXObject when it is available
	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
	 * we need a fallback.
	 */
	function() {
		return !this.isLocal && createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

// Determine support properties
(function( xhr ) {
	jQuery.extend( jQuery.support, {
		ajax: !!xhr,
		cors: !!xhr && ( "withCredentials" in xhr )
	});
})( jQuery.ajaxSettings.xhr() );

// Create transport if the browser can provide an xhr
if ( jQuery.support.ajax ) {

	jQuery.ajaxTransport(function( s ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !s.crossDomain || jQuery.support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {

					// Get a new xhr
					var xhr = s.xhr(),
						handle,
						i;

					// Open the socket
					// Passing null username, generates a login popup on Opera (#2865)
					if ( s.username ) {
						xhr.open( s.type, s.url, s.async, s.username, s.password );
					} else {
						xhr.open( s.type, s.url, s.async );
					}

					// Apply custom fields if provided
					if ( s.xhrFields ) {
						for ( i in s.xhrFields ) {
							xhr[ i ] = s.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( s.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( s.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !s.crossDomain && !headers["X-Requested-With"] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Need an extra try/catch for cross domain requests in Firefox 3
					try {
						for ( i in headers ) {
							xhr.setRequestHeader( i, headers[ i ] );
						}
					} catch( _ ) {}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( s.hasContent && s.data ) || null );

					// Listener
					callback = function( _, isAbort ) {

						var status,
							statusText,
							responseHeaders,
							responses,
							xml;

						// Firefox throws exceptions when accessing properties
						// of an xhr when a network error occured
						// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
						try {

							// Was never called and is aborted or complete
							if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

								// Only called once
								callback = undefined;

								// Do not keep as active anymore
								if ( handle ) {
									xhr.onreadystatechange = jQuery.noop;
									if ( xhrOnUnloadAbort ) {
										delete xhrCallbacks[ handle ];
									}
								}

								// If it's an abort
								if ( isAbort ) {
									// Abort it manually if needed
									if ( xhr.readyState !== 4 ) {
										xhr.abort();
									}
								} else {
									status = xhr.status;
									responseHeaders = xhr.getAllResponseHeaders();
									responses = {};
									xml = xhr.responseXML;

									// Construct response list
									if ( xml && xml.documentElement /* #4958 */ ) {
										responses.xml = xml;
									}
									responses.text = xhr.responseText;

									// Firefox throws an exception when accessing
									// statusText for faulty cross-domain requests
									try {
										statusText = xhr.statusText;
									} catch( e ) {
										// We normalize with Webkit giving an empty statusText
										statusText = "";
									}

									// Filter status for non standard behaviors

									// If the request is local and we have data: assume a success
									// (success with no data won't get notified, that's the best we
									// can do given current implementations)
									if ( !status && s.isLocal && !s.crossDomain ) {
										status = responses.text ? 200 : 404;
									// IE - #1450: sometimes returns 1223 when it should be 204
									} else if ( status === 1223 ) {
										status = 204;
									}
								}
							}
						} catch( firefoxAccessException ) {
							if ( !isAbort ) {
								complete( -1, firefoxAccessException );
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, responseHeaders );
						}
					};

					// if we're in sync mode or it's in cache
					// and has been retrieved directly (IE6 & IE7)
					// we need to manually fire the callback
					if ( !s.async || xhr.readyState === 4 ) {
						callback();
					} else {
						handle = ++xhrId;
						if ( xhrOnUnloadAbort ) {
							// Create the active xhrs callbacks list if needed
							// and attach the unload handler
							if ( !xhrCallbacks ) {
								xhrCallbacks = {};
								jQuery( window ).unload( xhrOnUnloadAbort );
							}
							// Add to list of active xhrs callbacks
							xhrCallbacks[ handle ] = callback;
						}
						xhr.onreadystatechange = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback(0,1);
					}
				}
			};
		}
	});
}




var elemdisplay = {},
	iframe, iframeDoc,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,
	timerId,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	],
	fxNow;

jQuery.fn.extend({
	show: function( speed, easing, callback ) {
		var elem, display;

		if ( speed || speed === 0 ) {
			return this.animate( genFx("show", 3), speed, easing, callback );

		} else {
			for ( var i = 0, j = this.length; i < j; i++ ) {
				elem = this[ i ];

				if ( elem.style ) {
					display = elem.style.display;

					// Reset the inline display of this element to learn if it is
					// being hidden by cascaded rules or not
					if ( !jQuery._data(elem, "olddisplay") && display === "none" ) {
						display = elem.style.display = "";
					}

					// Set elements which have been overridden with display: none
					// in a stylesheet to whatever the default browser style is
					// for such an element
					if ( display === "" && jQuery.css(elem, "display") === "none" ) {
						jQuery._data( elem, "olddisplay", defaultDisplay(elem.nodeName) );
					}
				}
			}

			// Set the display of most of the elements in a second loop
			// to avoid the constant reflow
			for ( i = 0; i < j; i++ ) {
				elem = this[ i ];

				if ( elem.style ) {
					display = elem.style.display;

					if ( display === "" || display === "none" ) {
						elem.style.display = jQuery._data( elem, "olddisplay" ) || "";
					}
				}
			}

			return this;
		}
	},

	hide: function( speed, easing, callback ) {
		if ( speed || speed === 0 ) {
			return this.animate( genFx("hide", 3), speed, easing, callback);

		} else {
			var elem, display,
				i = 0,
				j = this.length;

			for ( ; i < j; i++ ) {
				elem = this[i];
				if ( elem.style ) {
					display = jQuery.css( elem, "display" );

					if ( display !== "none" && !jQuery._data( elem, "olddisplay" ) ) {
						jQuery._data( elem, "olddisplay", display );
					}
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( i = 0; i < j; i++ ) {
				if ( this[i].style ) {
					this[i].style.display = "none";
				}
			}

			return this;
		}
	},

	// Save the old toggle function
	_toggle: jQuery.fn.toggle,

	toggle: function( fn, fn2, callback ) {
		var bool = typeof fn === "boolean";

		if ( jQuery.isFunction(fn) && jQuery.isFunction(fn2) ) {
			this._toggle.apply( this, arguments );

		} else if ( fn == null || bool ) {
			this.each(function() {
				var state = bool ? fn : jQuery(this).is(":hidden");
				jQuery(this)[ state ? "show" : "hide" ]();
			});

		} else {
			this.animate(genFx("toggle", 3), fn, fn2, callback);
		}

		return this;
	},

	fadeTo: function( speed, to, easing, callback ) {
		return this.filter(":hidden").css("opacity", 0).show().end()
					.animate({opacity: to}, speed, easing, callback);
	},

	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed( speed, easing, callback );

		if ( jQuery.isEmptyObject( prop ) ) {
			return this.each( optall.complete, [ false ] );
		}

		// Do not change referenced properties as per-property easing will be lost
		prop = jQuery.extend( {}, prop );

		function doAnimation() {
			// XXX 'this' does not always have a nodeName when running the
			// test suite

			if ( optall.queue === false ) {
				jQuery._mark( this );
			}

			var opt = jQuery.extend( {}, optall ),
				isElement = this.nodeType === 1,
				hidden = isElement && jQuery(this).is(":hidden"),
				name, val, p, e,
				parts, start, end, unit,
				method;

			// will store per property easing and be used to determine when an animation is complete
			opt.animatedProperties = {};

			for ( p in prop ) {

				// property name normalization
				name = jQuery.camelCase( p );
				if ( p !== name ) {
					prop[ name ] = prop[ p ];
					delete prop[ p ];
				}

				val = prop[ name ];

				// easing resolution: per property > opt.specialEasing > opt.easing > 'swing' (default)
				if ( jQuery.isArray( val ) ) {
					opt.animatedProperties[ name ] = val[ 1 ];
					val = prop[ name ] = val[ 0 ];
				} else {
					opt.animatedProperties[ name ] = opt.specialEasing && opt.specialEasing[ name ] || opt.easing || 'swing';
				}

				if ( val === "hide" && hidden || val === "show" && !hidden ) {
					return opt.complete.call( this );
				}

				if ( isElement && ( name === "height" || name === "width" ) ) {
					// Make sure that nothing sneaks out
					// Record all 3 overflow attributes because IE does not
					// change the overflow attribute when overflowX and
					// overflowY are set to the same value
					opt.overflow = [ this.style.overflow, this.style.overflowX, this.style.overflowY ];

					// Set display property to inline-block for height/width
					// animations on inline elements that are having width/height animated
					if ( jQuery.css( this, "display" ) === "inline" &&
							jQuery.css( this, "float" ) === "none" ) {

						// inline-level elements accept inline-block;
						// block-level elements need to be inline with layout
						if ( !jQuery.support.inlineBlockNeedsLayout || defaultDisplay( this.nodeName ) === "inline" ) {
							this.style.display = "inline-block";

						} else {
							this.style.zoom = 1;
						}
					}
				}
			}

			if ( opt.overflow != null ) {
				this.style.overflow = "hidden";
			}

			for ( p in prop ) {
				e = new jQuery.fx( this, opt, p );
				val = prop[ p ];

				if ( rfxtypes.test( val ) ) {

					// Tracks whether to show or hide based on private
					// data attached to the element
					method = jQuery._data( this, "toggle" + p ) || ( val === "toggle" ? hidden ? "show" : "hide" : 0 );
					if ( method ) {
						jQuery._data( this, "toggle" + p, method === "show" ? "hide" : "show" );
						e[ method ]();
					} else {
						e[ val ]();
					}

				} else {
					parts = rfxnum.exec( val );
					start = e.cur();

					if ( parts ) {
						end = parseFloat( parts[2] );
						unit = parts[3] || ( jQuery.cssNumber[ p ] ? "" : "px" );

						// We need to compute starting value
						if ( unit !== "px" ) {
							jQuery.style( this, p, (end || 1) + unit);
							start = ( (end || 1) / e.cur() ) * start;
							jQuery.style( this, p, start + unit);
						}

						// If a +=/-= token was provided, we're doing a relative animation
						if ( parts[1] ) {
							end = ( (parts[ 1 ] === "-=" ? -1 : 1) * end ) + start;
						}

						e.custom( start, end, unit );

					} else {
						e.custom( start, val, "" );
					}
				}
			}

			// For JS strict compliance
			return true;
		}

		return optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},

	stop: function( type, clearQueue, gotoEnd ) {
		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var index,
				hadTimers = false,
				timers = jQuery.timers,
				data = jQuery._data( this );

			// clear marker counters if we know they won't be
			if ( !gotoEnd ) {
				jQuery._unmark( true, this );
			}

			function stopQueue( elem, data, index ) {
				var hooks = data[ index ];
				jQuery.removeData( elem, index, true );
				hooks.stop( gotoEnd );
			}

			if ( type == null ) {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && index.indexOf(".run") === index.length - 4 ) {
						stopQueue( this, data, index );
					}
				}
			} else if ( data[ index = type + ".run" ] && data[ index ].stop ){
				stopQueue( this, data, index );
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					if ( gotoEnd ) {

						// force the next step to be the last
						timers[ index ]( true );
					} else {
						timers[ index ].saveState();
					}
					hadTimers = true;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( !( gotoEnd && hadTimers ) ) {
				jQuery.dequeue( this, type );
			}
		});
	}

});

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout( clearFxNow, 0 );
	return ( fxNow = jQuery.now() );
}

function clearFxNow() {
	fxNow = undefined;
}

// Generate parameters to create a standard animation
function genFx( type, num ) {
	var obj = {};

	jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice( 0, num )), function() {
		obj[ this ] = type;
	});

	return obj;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx( "show", 1 ),
	slideUp: genFx( "hide", 1 ),
	slideToggle: genFx( "toggle", 1 ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.extend({
	speed: function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
		};

		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
			opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

		// normalize opt.queue - true/undefined/null -> "fx"
		if ( opt.queue == null || opt.queue === true ) {
			opt.queue = "fx";
		}

		// Queueing
		opt.old = opt.complete;

		opt.complete = function( noUnmark ) {
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}

			if ( opt.queue ) {
				jQuery.dequeue( this, opt.queue );
			} else if ( noUnmark !== false ) {
				jQuery._unmark( this );
			}
		};

		return opt;
	},

	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ( ( -Math.cos( p*Math.PI ) / 2 ) + 0.5 ) * diff + firstNum;
		}
	},

	timers: [],

	fx: function( elem, options, prop ) {
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		options.orig = options.orig || {};
	}

});

jQuery.fx.prototype = {
	// Simple function for setting a style value
	update: function() {
		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		( jQuery.fx.step[ this.prop ] || jQuery.fx.step._default )( this );
	},

	// Get the current size
	cur: function() {
		if ( this.elem[ this.prop ] != null && (!this.elem.style || this.elem.style[ this.prop ] == null) ) {
			return this.elem[ this.prop ];
		}

		var parsed,
			r = jQuery.css( this.elem, this.prop );
		// Empty strings, null, undefined and "auto" are converted to 0,
		// complex values such as "rotate(1rad)" are returned as is,
		// simple values such as "10px" are parsed to Float.
		return isNaN( parsed = parseFloat( r ) ) ? !r || r === "auto" ? 0 : r : parsed;
	},

	// Start an animation from one number to another
	custom: function( from, to, unit ) {
		var self = this,
			fx = jQuery.fx;

		this.startTime = fxNow || createFxNow();
		this.end = to;
		this.now = this.start = from;
		this.pos = this.state = 0;
		this.unit = unit || this.unit || ( jQuery.cssNumber[ this.prop ] ? "" : "px" );

		function t( gotoEnd ) {
			return self.step( gotoEnd );
		}

		t.queue = this.options.queue;
		t.elem = this.elem;
		t.saveState = function() {
			if ( self.options.hide && jQuery._data( self.elem, "fxshow" + self.prop ) === undefined ) {
				jQuery._data( self.elem, "fxshow" + self.prop, self.start );
			}
		};

		if ( t() && jQuery.timers.push(t) && !timerId ) {
			timerId = setInterval( fx.tick, fx.interval );
		}
	},

	// Simple 'show' function
	show: function() {
		var dataShow = jQuery._data( this.elem, "fxshow" + this.prop );

		// Remember where we started, so that we can go back to it later
		this.options.orig[ this.prop ] = dataShow || jQuery.style( this.elem, this.prop );
		this.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any flash of content
		if ( dataShow !== undefined ) {
			// This show is picking up where a previous hide or show left off
			this.custom( this.cur(), dataShow );
		} else {
			this.custom( this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur() );
		}

		// Start by showing the element
		jQuery( this.elem ).show();
	},

	// Simple 'hide' function
	hide: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[ this.prop ] = jQuery._data( this.elem, "fxshow" + this.prop ) || jQuery.style( this.elem, this.prop );
		this.options.hide = true;

		// Begin the animation
		this.custom( this.cur(), 0 );
	},

	// Each step of an animation
	step: function( gotoEnd ) {
		var p, n, complete,
			t = fxNow || createFxNow(),
			done = true,
			elem = this.elem,
			options = this.options;

		if ( gotoEnd || t >= options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			options.animatedProperties[ this.prop ] = true;

			for ( p in options.animatedProperties ) {
				if ( options.animatedProperties[ p ] !== true ) {
					done = false;
				}
			}

			if ( done ) {
				// Reset the overflow
				if ( options.overflow != null && !jQuery.support.shrinkWrapBlocks ) {

					jQuery.each( [ "", "X", "Y" ], function( index, value ) {
						elem.style[ "overflow" + value ] = options.overflow[ index ];
					});
				}

				// Hide the element if the "hide" operation was done
				if ( options.hide ) {
					jQuery( elem ).hide();
				}

				// Reset the properties, if the item has been hidden or shown
				if ( options.hide || options.show ) {
					for ( p in options.animatedProperties ) {
						jQuery.style( elem, p, options.orig[ p ] );
						jQuery.removeData( elem, "fxshow" + p, true );
						// Toggle data is no longer needed
						jQuery.removeData( elem, "toggle" + p, true );
					}
				}

				// Execute the complete function
				// in the event that the complete function throws an exception
				// we must ensure it won't be called twice. #5684

				complete = options.complete;
				if ( complete ) {

					options.complete = false;
					complete.call( elem );
				}
			}

			return false;

		} else {
			// classical easing cannot be used with an Infinity duration
			if ( options.duration == Infinity ) {
				this.now = t;
			} else {
				n = t - this.startTime;
				this.state = n / options.duration;

				// Perform the easing function, defaults to swing
				this.pos = jQuery.easing[ options.animatedProperties[this.prop] ]( this.state, n, 0, 1, options.duration );
				this.now = this.start + ( (this.end - this.start) * this.pos );
			}
			// Perform the next step of the animation
			this.update();
		}

		return true;
	}
};

jQuery.extend( jQuery.fx, {
	tick: function() {
		var timer,
			timers = jQuery.timers,
			i = 0;

		for ( ; i < timers.length; i++ ) {
			timer = timers[ i ];
			// Checks the timer has not already been removed
			if ( !timer() && timers[ i ] === timer ) {
				timers.splice( i--, 1 );
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
	},

	interval: 13,

	stop: function() {
		clearInterval( timerId );
		timerId = null;
	},

	speeds: {
		slow: 600,
		fast: 200,
		// Default speed
		_default: 400
	},

	step: {
		opacity: function( fx ) {
			jQuery.style( fx.elem, "opacity", fx.now );
		},

		_default: function( fx ) {
			if ( fx.elem.style && fx.elem.style[ fx.prop ] != null ) {
				fx.elem.style[ fx.prop ] = fx.now + fx.unit;
			} else {
				fx.elem[ fx.prop ] = fx.now;
			}
		}
	}
});

// Adds width/height step functions
// Do not set anything below 0
jQuery.each([ "width", "height" ], function( i, prop ) {
	jQuery.fx.step[ prop ] = function( fx ) {
		jQuery.style( fx.elem, prop, Math.max(0, fx.now) + fx.unit );
	};
});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}

// Try to restore the default display value of an element
function defaultDisplay( nodeName ) {

	if ( !elemdisplay[ nodeName ] ) {

		var body = document.body,
			elem = jQuery( "<" + nodeName + ">" ).appendTo( body ),
			display = elem.css( "display" );
		elem.remove();

		// If the simple way fails,
		// get element's real default display by attaching it to a temp iframe
		if ( display === "none" || display === "" ) {
			// No iframe to use yet, so create it
			if ( !iframe ) {
				iframe = document.createElement( "iframe" );
				iframe.frameBorder = iframe.width = iframe.height = 0;
			}

			body.appendChild( iframe );

			// Create a cacheable copy of the iframe document on first call.
			// IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
			// document to it; WebKit & Firefox won't allow reusing the iframe document.
			if ( !iframeDoc || !iframe.createElement ) {
				iframeDoc = ( iframe.contentWindow || iframe.contentDocument ).document;
				iframeDoc.write( ( document.compatMode === "CSS1Compat" ? "<!doctype html>" : "" ) + "<html><body>" );
				iframeDoc.close();
			}

			elem = iframeDoc.createElement( nodeName );

			iframeDoc.body.appendChild( elem );

			display = jQuery.css( elem, "display" );
			body.removeChild( iframe );
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return elemdisplay[ nodeName ];
}




var rtable = /^t(?:able|d|h)$/i,
	rroot = /^(?:body|html)$/i;

if ( "getBoundingClientRect" in document.documentElement ) {
	jQuery.fn.offset = function( options ) {
		var elem = this[0], box;

		if ( options ) {
			return this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
		}

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		try {
			box = elem.getBoundingClientRect();
		} catch(e) {}

		var doc = elem.ownerDocument,
			docElem = doc.documentElement;

		// Make sure we're not dealing with a disconnected DOM node
		if ( !box || !jQuery.contains( docElem, elem ) ) {
			return box ? { top: box.top, left: box.left } : { top: 0, left: 0 };
		}

		var body = doc.body,
			win = getWindow(doc),
			clientTop  = docElem.clientTop  || body.clientTop  || 0,
			clientLeft = docElem.clientLeft || body.clientLeft || 0,
			scrollTop  = win.pageYOffset || jQuery.support.boxModel && docElem.scrollTop  || body.scrollTop,
			scrollLeft = win.pageXOffset || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft,
			top  = box.top  + scrollTop  - clientTop,
			left = box.left + scrollLeft - clientLeft;

		return { top: top, left: left };
	};

} else {
	jQuery.fn.offset = function( options ) {
		var elem = this[0];

		if ( options ) {
			return this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
		}

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		var computedStyle,
			offsetParent = elem.offsetParent,
			prevOffsetParent = elem,
			doc = elem.ownerDocument,
			docElem = doc.documentElement,
			body = doc.body,
			defaultView = doc.defaultView,
			prevComputedStyle = defaultView ? defaultView.getComputedStyle( elem, null ) : elem.currentStyle,
			top = elem.offsetTop,
			left = elem.offsetLeft;

		while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
			if ( jQuery.support.fixedPosition && prevComputedStyle.position === "fixed" ) {
				break;
			}

			computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
			top  -= elem.scrollTop;
			left -= elem.scrollLeft;

			if ( elem === offsetParent ) {
				top  += elem.offsetTop;
				left += elem.offsetLeft;

				if ( jQuery.support.doesNotAddBorder && !(jQuery.support.doesAddBorderForTableAndCells && rtable.test(elem.nodeName)) ) {
					top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
					left += parseFloat( computedStyle.borderLeftWidth ) || 0;
				}

				prevOffsetParent = offsetParent;
				offsetParent = elem.offsetParent;
			}

			if ( jQuery.support.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
				top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
				left += parseFloat( computedStyle.borderLeftWidth ) || 0;
			}

			prevComputedStyle = computedStyle;
		}

		if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
			top  += body.offsetTop;
			left += body.offsetLeft;
		}

		if ( jQuery.support.fixedPosition && prevComputedStyle.position === "fixed" ) {
			top  += Math.max( docElem.scrollTop, body.scrollTop );
			left += Math.max( docElem.scrollLeft, body.scrollLeft );
		}

		return { top: top, left: left };
	};
}

jQuery.offset = {

	bodyOffset: function( body ) {
		var top = body.offsetTop,
			left = body.offsetLeft;

		if ( jQuery.support.doesNotIncludeMarginInBodyOffset ) {
			top  += parseFloat( jQuery.css(body, "marginTop") ) || 0;
			left += parseFloat( jQuery.css(body, "marginLeft") ) || 0;
		}

		return { top: top, left: left };
	},

	setOffset: function( elem, options, i ) {
		var position = jQuery.css( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		var curElem = jQuery( elem ),
			curOffset = curElem.offset(),
			curCSSTop = jQuery.css( elem, "top" ),
			curCSSLeft = jQuery.css( elem, "left" ),
			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[0] ) {
			return null;
		}

		var elem = this[0],

		// Get *real* offsetParent
		offsetParent = this.offsetParent(),

		// Get correct offsets
		offset       = this.offset(),
		parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

		// Subtract element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		offset.top  -= parseFloat( jQuery.css(elem, "marginTop") ) || 0;
		offset.left -= parseFloat( jQuery.css(elem, "marginLeft") ) || 0;

		// Add offsetParent borders
		parentOffset.top  += parseFloat( jQuery.css(offsetParent[0], "borderTopWidth") ) || 0;
		parentOffset.left += parseFloat( jQuery.css(offsetParent[0], "borderLeftWidth") ) || 0;

		// Subtract the two offsets
		return {
			top:  offset.top  - parentOffset.top,
			left: offset.left - parentOffset.left
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || document.body;
			while ( offsetParent && (!rroot.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( ["Left", "Top"], function( i, name ) {
	var method = "scroll" + name;

	jQuery.fn[ method ] = function( val ) {
		var elem, win;

		if ( val === undefined ) {
			elem = this[ 0 ];

			if ( !elem ) {
				return null;
			}

			win = getWindow( elem );

			// Return the scroll offset
			return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
				jQuery.support.boxModel && win.document.documentElement[ method ] ||
					win.document.body[ method ] :
				elem[ method ];
		}

		// Set the scroll offset
		return this.each(function() {
			win = getWindow( this );

			if ( win ) {
				win.scrollTo(
					!i ? val : jQuery( win ).scrollLeft(),
					 i ? val : jQuery( win ).scrollTop()
				);

			} else {
				this[ method ] = val;
			}
		});
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}




// Create width, height, innerHeight, innerWidth, outerHeight and outerWidth methods
jQuery.each([ "Height", "Width" ], function( i, name ) {

	var type = name.toLowerCase();

	// innerHeight and innerWidth
	jQuery.fn[ "inner" + name ] = function() {
		var elem = this[0];
		return elem ?
			elem.style ?
			parseFloat( jQuery.css( elem, type, "padding" ) ) :
			this[ type ]() :
			null;
	};

	// outerHeight and outerWidth
	jQuery.fn[ "outer" + name ] = function( margin ) {
		var elem = this[0];
		return elem ?
			elem.style ?
			parseFloat( jQuery.css( elem, type, margin ? "margin" : "border" ) ) :
			this[ type ]() :
			null;
	};

	jQuery.fn[ type ] = function( size ) {
		// Get window width or height
		var elem = this[0];
		if ( !elem ) {
			return size == null ? null : this;
		}

		if ( jQuery.isFunction( size ) ) {
			return this.each(function( i ) {
				var self = jQuery( this );
				self[ type ]( size.call( this, i, self[ type ]() ) );
			});
		}

		if ( jQuery.isWindow( elem ) ) {
			// Everyone else use document.documentElement or document.body depending on Quirks vs Standards mode
			// 3rd condition allows Nokia support, as it supports the docElem prop but not CSS1Compat
			var docElemProp = elem.document.documentElement[ "client" + name ],
				body = elem.document.body;
			return elem.document.compatMode === "CSS1Compat" && docElemProp ||
				body && body[ "client" + name ] || docElemProp;

		// Get document width or height
		} else if ( elem.nodeType === 9 ) {
			// Either scroll[Width/Height] or offset[Width/Height], whichever is greater
			return Math.max(
				elem.documentElement["client" + name],
				elem.body["scroll" + name], elem.documentElement["scroll" + name],
				elem.body["offset" + name], elem.documentElement["offset" + name]
			);

		// Get or set width or height on the element
		} else if ( size === undefined ) {
			var orig = jQuery.css( elem, type ),
				ret = parseFloat( orig );

			return jQuery.isNumeric( ret ) ? ret : orig;

		// Set the width or height on the element (default to pixels if value is unitless)
		} else {
			return this.css( type, typeof size === "string" ? size : size + "px" );
		}
	};

});




// Expose jQuery to the global object
window.jQuery = window.$ = jQuery;

// Expose jQuery as an AMD module, but only for AMD loaders that
// understand the issues with loading multiple versions of jQuery
// in a page that all might call define(). The loader will indicate
// they have special allowances for multiple jQuery versions by
// specifying define.amd.jQuery = true. Register as a named module,
// since jQuery can be concatenated with other files that may use define,
// but not use a proper concatenation script that understands anonymous
// AMD modules. A named AMD is safest and most robust way to register.
// Lowercase jquery is used because AMD module names are derived from
// file names, and jQuery is normally delivered in a lowercase file name.
// Do this after creating the global so that if an AMD module wants to call
// noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
	define( "jquery", [], function () { return jQuery; } );
}



})( window );
var exports = {}

// Sass - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

/**
 * Library version.
 */

exports.version = '0.5.0'

/**
 * Compiled sass cache.
 */
 
var cache = {}

/**
 * Sass grammar tokens.
 */

var tokens = [
  ['indent', /^\n +/],
  ['space', /^ +/],
  ['nl', /^\n/],
  ['js', /^{(.*?)}/],
  ['comment', /^\/\/(.*)/],
  ['string', /^(?:'(.*?)'|"(.*?)")/],
  ['variable', /^!([\w\-]+) *= *([^\n]+)/], 
  ['variable.alternate', /^:([\w\-]+): +([^\n]+)/], 
  ['property.expand', /^=([\w\-]+) *([^\n]+)/], 
  //['selector_pipe', /^(\w+)\|(\w+)/],
  ['property', /^([\w\-]+): ([^\n]+)/], 
  ['continuation', /^&(.+)/],
  ['mixin', /^\+([\w\-]+)(\((.+)\))?/],
  //['mixin', /^\+([\w\-]+)/],
  ['selector', /^(.+)/]
]

/**
 * Vendor-specific expansion prefixes.
 */

exports.expansions = ['-moz-', '-webkit-']

/**
 * Tokenize the given _str_.
 *
 * @param  {string} str
 * @return {array}
 * @api private
 */

function tokenize(str) {
  var token, captures, stack = []
  while (str.length) {
    for (var i = 0, len = tokens.length; i < len; ++i)
      if (captures = tokens[i][1].exec(str)) {
        token = [tokens[i][0], captures],
        str = str.replace(tokens[i][1], '')
        break
      }
    if (token)
      stack.push(token),
      token = null
    else 
      throw new Error("SyntaxError: near `" + str.slice(0, 25).replace('\n', '\\n') + "'")
  }
  
  return stack
}

/**
 * Parse the given _tokens_, returning
 * and hash containing the properties below:
 *
 *   selectors: array of top-level selectors
 *   variables: hash of variables defined
 *
 * @param  {array} tokens
 * @return {hash}
 * @api private
 */

function parse(tokens) {
  var token, selector,
      data = { variables: {}, mixins: {}, selectors: [] },
      line = 1,
      lastIndents = 0,
      indents = 0
  
  /**
   * Output error _msg_ in context to the current line.
   */
      
  function error(msg) {
    throw new Error('ParseError: on line ' + line + '; ' + msg)
  }
  
  /**
   * Reset parents until the indentation levels match.
   */
  
  function reset() {
    if (indents === 0) 
      return selector = null
    while (lastIndents-- > indents)
      selector = selector.parent
  }

  /**
   * Replaces variables and literal javascript in the input.
   */

  function performSubstitutions(input) {
    return input.replace(/!([\w\-]+)/g, function(orig, name){
      return data.variables[name] || orig
    })
    .replace(/\{(.*?)\}/g, function(_, js){
      with (data.variables){ return eval(js) }
    })
  }
  
  // Parse tokens
  
  while (token = tokens.shift())
    switch (token[0]) {
      // case 'selector_pipe':
      //   reset()
      //   console.log(token)
      //   selector = new Selector(token[1][1]+":"+token[1][2], selector)
      //   if (!selector.parent) 
      //     data.selectors.push(selector)
      //   break
      case 'mixin':
        //console.log(token[1][3])
        if (indents) {
          var mixin = data.mixins[token[1][1]]
          if (!mixin) error("mixin `" + token[1][1] + "' does not exist")
          selector.adopt(mixin.copy())
        }
        else
          data.mixins[token[1][1]] = selector = new Selector(token[1][1], null, 'mixin')
        break
      case 'continuation':
        reset()
        selector = new Selector(token[1][1], selector, 'continuation')
        break
      case 'selector':
        reset()
        selector = new Selector(token[1][1], selector)
        if (!selector.parent) 
          data.selectors.push(selector)
        break
      case 'property':
        reset()
        if (!selector) error('properties must be nested within a selector')
        var val = performSubstitutions(token[1][2])
        selector.properties.push(new Property(token[1][1], val))
        break
      case 'property.expand':
        exports.expansions.forEach(function(prefix){
          tokens.unshift(['property', [, prefix + token[1][1], token[1][2]]])
        })
        break
      case 'variable':
      case 'variable.alternate':
        var val = performSubstitutions(token[1][2])
        data.variables[token[1][1]] = val
        break
      case 'js':
        with (data.variables){ eval(token[1][1]) }
        break
      case 'nl':
        ++line, indents = 0
        break
      case 'comment':
        break
      case 'indent':
        ++line
        lastIndents = indents,
        indents = (token[1][0].length - 1) / 2
        if (indents > lastIndents &&
            indents - 1 > lastIndents)
              error('invalid indentation, to much nesting')
    }
  return data
}

/**
 * Compile _selectors_ to a string of css.
 *
 * @param  {array} selectors
 * @return {string}
 * @api private
 */

function sass_compile(selectors) {
  return selectors.join('\n')
}

/**
 * Collect data by parsing _sass_.
 * Returns a hash containing the following properties:
 *
 *   selectors: array of top-level selectors
 *   variables: hash of variables defined
 *
 * @param  {string} sass
 * @return {hash}
 * @api public
 */

exports.collect = function(sass) {
  return parse(tokenize(sass))
}

/**
 * Render a string of _sass_.
 *
 * Options:
 *   
 *   - filename  Optional filename to aid in error reporting
 *   - cache     Optional caching of compiled content. Requires "filename" option
 *
 * @param  {string} sass
 * @param  {object} options
 * @return {string}
 * @api public
 */

exports.render = function(sass, options) {
  var selectors = exports.collect(sass).selectors
  //var selectors = ["#container \n  background: #DDDDDD"]
  options = options || {}
  if (options.cache && !options.filename)
    throw new Error('filename option must be passed when cache is enabled')
  
  if (options.cache)
    return cache[options.filename]
      ? cache[options.filename]
      : cache[options.filename] = sass_compile(selectors)
  return sass_compile(selectors)
}

// --- Selector

/**
 * Initialize a selector with _string_ and
 * optional _parent_.
 *
 * @param  {string} string
 * @param  {Selector} parent
 * @param  {string} type
 * @api private
 */

function Selector(string, parent, type) {
  this.string = string
  if (parent) {
    parent.adopt(this)
  } else {
    parent = null
  }
  this.properties = []
  this.children = []
  this.type = type
  if (type) this[type] = true
}

/**
 * Return a copy of this selector.  Children and properties will be recursively
 * copied.
 *
 * @return {Selector}
 * @api private
 */

Selector.prototype.copy = function() {
  var copy = new Selector(this.string, this.parent, this.type)
  copy.properties = _(this.properties).map(function(property) {
    return property.copy()
  })
  _(this.children).map(function(child) {
    copy.adopt(child.copy())
  })
  return copy
}

/**
 * Sets this selector to have no parent.
 *
 * @api private
 */

Selector.prototype.orphan = function() {
  if (this.parent) {
    var index = this.parent.children.indexOf(this)
    if (index !== -1) {
      this.parent.children.splice(index, 1)
    }
  }
}

/**
 * Set another selector as one of this selector's children.
 *
 * @api private
 */

Selector.prototype.adopt = function(selector) {
  selector.orphan()
  selector.parent = this
  this.children.push(selector)
}

/**
 * Return selector string.
 *
 * @return {string}
 * @api private
 */

Selector.prototype.selector = function() {
  var selector = this.string
  if (this.parent)
    selector = this.continuation
      ? this.parent.selector() + selector
      : this.mixin
        ? this.parent.selector()
        : this.parent.selector() + ' ' + selector
  return selector
}

/**
 * Return selector and nested selectors as CSS.
 *
 * @return {string}
 * @api private
 */

Selector.prototype.toString = function() {
  return (this.properties.length
      ? this.selector() + ' {\n' + this.properties.join('\n') + '}\n'
      : '') + this.children.join('')
}

// --- Property

/**
 * Initialize property with _name_ and _val_.
 *
 * @param  {string} name
 * @param  {string} val
 * @api private
 */

function Property(name, val) {
  this.name = name
  this.val = val
}

/**
 * Return a copy of this property.
 *
 * @return {Property}
 * @api private
 */

Property.prototype.copy = function() {
  return new Property(this.name, this.val);
}

/**
 * Return CSS string representing a property.
 *
 * @return {string}
 * @api private
 */

Property.prototype.toString = function() {
  return '  ' + this.name + ': ' + this.val + ';'
}


$(function(){ // FIXME: remove domload scope (see next)

  // var coffees_loaded = 0
  // var events = $("#events") // FIXME: why do I have to rely on DOM to bind/trigger events?

  function load_coffees(files) {
    _.each(files, function(file){
      load_coffee(file+".coffee", files)
    })
  }

  function load_coffee(file, files) {
    $.get(file, function(data){
      eval(CoffeeScript.compile(data))
      // coffees_loaded++ 
      //  
      // if (coffees_loaded == files.length) // all loaded
      //   events.trigger("coffee_loaded") 
    })
  }

  load_coffees([
    "/fivetastic/fivetastic",
    "/coffee/app"
  ])
  // console.log($("body").html())
  
  
  
})




// load_coffee('/fivetastic/fivetastic.coffee')
// load_coffee('/coffee/app.coffee')



