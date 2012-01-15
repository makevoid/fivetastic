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
/**
 * CoffeeScript Compiler v1.1.2
 * http://coffeescript.org
 *
 * Copyright 2011, Jeremy Ashkenas
 * Released under the MIT License
 */
this.CoffeeScript=function(){function require(a){return require[a]}require["./helpers"]=new function(){var a=this;(function(){var b,c;a.starts=function(a,b,c){return b===a.substr(c,b.length)},a.ends=function(a,b,c){var d;d=b.length;return b===a.substr(a.length-d-(c||0),d)},a.compact=function(a){var b,c,d,e;e=[];for(c=0,d=a.length;c<d;c++)b=a[c],b&&e.push(b);return e},a.count=function(a,b){var c,d;c=d=0;if(!b.length)return 1/0;while(d=1+a.indexOf(b,d))c++;return c},a.merge=function(a,c){return b(b({},a),c)},b=a.extend=function(a,b){var c,d;for(c in b)d=b[c],a[c]=d;return a},a.flatten=c=function(a){var b,d,e,f;d=[];for(e=0,f=a.length;e<f;e++)b=a[e],b instanceof Array?d=d.concat(c(b)):d.push(b);return d},a.del=function(a,b){var c;c=a[b],delete a[b];return c},a.last=function(a,b){return a[a.length-(b||0)-1]}}).call(this)},require["./rewriter"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1},u=Array.prototype.slice;a.Rewriter=function(){function a(){}a.prototype.rewrite=function(a){this.tokens=a,this.removeLeadingNewlines(),this.removeMidExpressionNewlines(),this.closeOpenCalls(),this.closeOpenIndexes(),this.addImplicitIndentation(),this.tagPostfixConditionals(),this.addImplicitBraces(),this.addImplicitParentheses(),this.ensureBalance(b),this.rewriteClosingParens();return this.tokens},a.prototype.scanTokens=function(a){var b,c,d;d=this.tokens,b=0;while(c=d[b])b+=a.call(this,c,b,d);return!0},a.prototype.detectEnd=function(a,b,c){var f,g,h,i,j;h=this.tokens,f=0;while(g=h[a]){if(f===0&&b.call(this,g,a))return c.call(this,g,a);if(!g||f<0)return c.call(this,g,a-1);if(i=g[0],t.call(e,i)>=0)f+=1;else if(j=g[0],t.call(d,j)>=0)f-=1;a+=1}return a-1},a.prototype.removeLeadingNewlines=function(){var a,b,c,d;d=this.tokens;for(a=0,c=d.length;a<c;a++){b=d[a][0];if(b!=="TERMINATOR")break}if(a)return this.tokens.splice(0,a)},a.prototype.removeMidExpressionNewlines=function(){return this.scanTokens(function(a,b,d){var e;if(!(a[0]==="TERMINATOR"&&(e=this.tag(b+1),t.call(c,e)>=0)))return 1;d.splice(b,1);return 0})},a.prototype.closeOpenCalls=function(){var a,b;b=function(a,b){var c;return(c=a[0])===")"||c==="CALL_END"||a[0]==="OUTDENT"&&this.tag(b-1)===")"},a=function(a,b){return this.tokens[a[0]==="OUTDENT"?b-1:b][0]="CALL_END"};return this.scanTokens(function(c,d){c[0]==="CALL_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.closeOpenIndexes=function(){var a,b;b=function(a,b){var c;return(c=a[0])==="]"||c==="INDEX_END"},a=function(a,b){return a[0]="INDEX_END"};return this.scanTokens(function(c,d){c[0]==="INDEX_START"&&this.detectEnd(d+1,b,a);return 1})},a.prototype.addImplicitBraces=function(){var a,b,c,f,g;c=[],f=null,g=0,b=function(a,b){var c,d,e,f,g,h;g=this.tokens.slice(b+1,b+3+1||9e9),c=g[0],f=g[1],e=g[2];if("HERECOMMENT"===(c!=null?c[0]:void 0))return!1;d=a[0];return(d==="TERMINATOR"||d==="OUTDENT")&&(f!=null?f[0]:void 0)!==":"&&((c!=null?c[0]:void 0)!=="@"||(e!=null?e[0]:void 0)!==":")||d===","&&c&&(h=c[0])!=="IDENTIFIER"&&h!=="NUMBER"&&h!=="STRING"&&h!=="@"&&h!=="TERMINATOR"&&h!=="OUTDENT"},a=function(a,b){var c;c=["}","}",a[2]],c.generated=!0;return this.tokens.splice(b,0,c)};return this.scanTokens(function(g,h,i){var j,k,l,m,n,o,p;if(o=l=g[0],t.call(e,o)>=0){c.push([l==="INDENT"&&this.tag(h-1)==="{"?"{":l,h]);return 1}if(t.call(d,l)>=0){f=c.pop();return 1}if(l!==":"||(j=this.tag(h-2))!==":"&&((p=c[c.length-1])!=null?p[0]:void 0)==="{")return 1;c.push(["{"]),k=j==="@"?h-2:h-1;while(this.tag(k-2)==="HERECOMMENT")k-=2;n=new String("{"),n.generated=!0,m=["{",n,g[2]],m.generated=!0,i.splice(k,0,m),this.detectEnd(h+2,b,a);return 2})},a.prototype.addImplicitParentheses=function(){var a,b;b=!1,a=function(a,b){var c;c=a[0]==="OUTDENT"?b+1:b;return this.tokens.splice(c,0,["CALL_END",")",a[2]])};return this.scanTokens(function(c,d,e){var k,m,n,o,p,q,r,s,u,v;r=c[0];if(r==="CLASS"||r==="IF")b=!0;s=e.slice(d-1,d+1+1||9e9),o=s[0],m=s[1],n=s[2],k=!b&&r==="INDENT"&&n&&n.generated&&n[0]==="{"&&o&&(u=o[0],t.call(i,u)>=0),q=!1,p=!1,t.call(l,r)>=0&&(b=!1),o&&!o.spaced&&r==="?"&&(c.call=!0);if(c.fromThen)return 1;if(!(k||(o!=null?o.spaced:void 0)&&(o.call||(v=o[0],t.call(i,v)>=0))&&(t.call(g,r)>=0||!c.spaced&&!c.newLine&&t.call(j,r)>=0)))return 1;e.splice(d,0,["CALL_START","(",c[2]]),this.detectEnd(d+1,function(a,b){var c,d;r=a[0];if(!q&&a.fromThen)return!0;if(r==="IF"||r==="ELSE"||r==="CATCH"||r==="->"||r==="=>")q=!0;if(r==="IF"||r==="ELSE"||r==="SWITCH"||r==="TRY")p=!0;if((r==="."||r==="?."||r==="::")&&this.tag(b-1)==="OUTDENT")return!0;return!a.generated&&this.tag(b-1)!==","&&(t.call(h,r)>=0||r==="INDENT"&&!p)&&(r!=="INDENT"||this.tag(b-2)!=="CLASS"&&(d=this.tag(b-1),t.call(f,d)<0)&&(!(c=this.tokens[b+1])||!c.generated||c[0]!=="{"))},a),o[0]==="?"&&(o[0]="FUNC_EXIST");return 2})},a.prototype.addImplicitIndentation=function(){return this.scanTokens(function(a,b,c){var d,e,f,g,h,i,j,k;i=a[0];if(i==="TERMINATOR"&&this.tag(b+1)==="THEN"){c.splice(b,1);return 0}if(i==="ELSE"&&this.tag(b-1)!=="OUTDENT"){c.splice.apply(c,[b,0].concat(u.call(this.indentation(a))));return 2}if(i==="CATCH"&&((j=this.tag(b+2))==="OUTDENT"||j==="TERMINATOR"||j==="FINALLY")){c.splice.apply(c,[b+2,0].concat(u.call(this.indentation(a))));return 4}if(t.call(n,i)>=0&&this.tag(b+1)!=="INDENT"&&(i!=="ELSE"||this.tag(b+1)!=="IF")){h=i,k=this.indentation(a),f=k[0],g=k[1],h==="THEN"&&(f.fromThen=!0),f.generated=g.generated=!0,c.splice(b+1,0,f),e=function(a,b){var c;return a[1]!==";"&&(c=a[0],t.call(m,c)>=0)&&(a[0]!=="ELSE"||h==="IF"||h==="THEN")},d=function(a,b){return this.tokens.splice(this.tag(b-1)===","?b-1:b,0,g)},this.detectEnd(b+2,e,d),i==="THEN"&&c.splice(b,1);return 1}return 1})},a.prototype.tagPostfixConditionals=function(){var a;a=function(a,b){var c;return(c=a[0])==="TERMINATOR"||c==="INDENT"};return this.scanTokens(function(b,c){var d;if(b[0]!=="IF")return 1;d=b,this.detectEnd(c+1,a,function(a,b){if(a[0]!=="INDENT")return d[0]="POST_"+d[0]});return 1})},a.prototype.ensureBalance=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;d={},f={},m=this.tokens;for(i=0,k=m.length;i<k;i++){h=m[i],g=h[0];for(j=0,l=a.length;j<l;j++){n=a[j],e=n[0],b=n[1],d[e]|=0;if(g===e)d[e]++===0&&(f[e]=h[2]);else if(g===b&&--d[e]<0)throw Error("too many "+h[1]+" on line "+(h[2]+1))}}for(e in d){c=d[e];if(c>0)throw Error("unclosed "+e+" on line "+(f[e]+1))}return this},a.prototype.rewriteClosingParens=function(){var a,b,c;c=[],a={};for(b in k)a[b]=0;return this.scanTokens(function(b,f,g){var h,i,j,l,m,n,o;if(o=m=b[0],t.call(e,o)>=0){c.push(b);return 1}if(t.call(d,m)<0)return 1;if(a[h=k[m]]>0){a[h]-=1,g.splice(f,1);return 0}i=c.pop(),j=i[0],l=k[j];if(m===l)return 1;a[j]+=1,n=[l,j==="INDENT"?i[1]:l],this.tag(f+2)===j?(g.splice(f+3,0,n),c.push(i)):g.splice(f,0,n);return 1})},a.prototype.indentation=function(a){return[["INDENT",2,a[2]],["OUTDENT",2,a[2]]]},a.prototype.tag=function(a){var b;return(b=this.tokens[a])!=null?b[0]:void 0};return a}(),b=[["(",")"],["[","]"],["{","}"],["INDENT","OUTDENT"],["CALL_START","CALL_END"],["PARAM_START","PARAM_END"],["INDEX_START","INDEX_END"]],k={},e=[],d=[];for(q=0,r=b.length;q<r;q++)s=b[q],o=s[0],p=s[1],e.push(k[p]=o),d.push(k[o]=p);c=["CATCH","WHEN","ELSE","FINALLY"].concat(d),i=["IDENTIFIER","SUPER",")","CALL_END","]","INDEX_END","@","THIS"],g=["IDENTIFIER","NUMBER","STRING","JS","REGEX","NEW","PARAM_START","CLASS","IF","TRY","SWITCH","THIS","BOOL","UNARY","SUPER","@","->","=>","[","(","{","--","++"],j=["+","-"],f=["->","=>","{","[",","],h=["POST_IF","FOR","WHILE","UNTIL","WHEN","BY","LOOP","TERMINATOR"],n=["ELSE","->","=>","TRY","FINALLY","THEN"],m=["TERMINATOR","CATCH","FINALLY","ELSE","OUTDENT","LEADING_WHEN"],l=["TERMINATOR","INDENT","OUTDENT"]}).call(this)},require["./lexer"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1};K=require("./rewriter").Rewriter,V=require("./helpers"),R=V.count,U=V.starts,Q=V.compact,T=V.last,a.Lexer=y=function(){function a(){}a.prototype.tokenize=function(a,b){var c;b==null&&(b={}),P.test(a)&&(a="\n"+a),a=a.replace(/\r/g,"").replace(N,""),this.code=a,this.line=b.line||0,this.indent=0,this.indebt=0,this.outdebt=0,this.indents=[],this.tokens=[],c=0;while(this.chunk=a.slice(c))c+=this.identifierToken()||this.commentToken()||this.whitespaceToken()||this.lineToken()||this.heredocToken()||this.stringToken()||this.numberToken()||this.regexToken()||this.jsToken()||this.literalToken();this.closeIndentation();if(b.rewrite===!1)return this.tokens;return(new K).rewrite(this.tokens)},a.prototype.identifierToken=function(){var a,b,c,d,e,i,j,k,l;if(!(e=q.exec(this.chunk)))return 0;d=e[0],c=e[1],a=e[2];if(c==="own"&&this.tag()==="FOR"){this.token("OWN",c);return c.length}b=a||(i=T(this.tokens))&&((k=i[0])==="."||k==="?."||k==="::"||!i.spaced&&i[0]==="@"),j="IDENTIFIER",!b&&(W.call(u,c)>=0||W.call(h,c)>=0)&&(j=c.toUpperCase(),j==="WHEN"&&(l=this.tag(),W.call(v,l)>=0)?j="LEADING_WHEN":j==="FOR"?this.seenFor=!0:j==="UNLESS"?j="IF":W.call(O,j)>=0?j="UNARY":W.call(I,j)>=0&&(j!=="INSTANCEOF"&&this.seenFor?(j="FOR"+j,this.seenFor=!1):(j="RELATION",this.value()==="!"&&(this.tokens.pop(),c="!"+c)))),W.call(t,c)>=0&&(b?(j="IDENTIFIER",c=new String(c),c.reserved=!0):W.call(J,c)>=0&&this.identifierError(c)),b||(W.call(f,c)>=0&&(c=g[c]),j=function(){switch(c){case"!":return"UNARY";case"==":case"!=":return"COMPARE";case"&&":case"||":return"LOGIC";case"true":case"false":case"null":case"undefined":return"BOOL";case"break":case"continue":case"debugger":return"STATEMENT";default:return j}}()),this.token(j,c),a&&this.token(":",":");return d.length},a.prototype.numberToken=function(){var a,b;if(!(a=F.exec(this.chunk)))return 0;b=a[0],this.token("NUMBER",b);return b.length},a.prototype.stringToken=function(){var a,b;switch(this.chunk.charAt(0)){case"'":if(!(a=M.exec(this.chunk)))return 0;this.token("STRING",(b=a[0]).replace(A,"\\\n"));break;case'"':if(!(b=this.balancedString(this.chunk,'"')))return 0;0<b.indexOf("#{",1)?this.interpolateString(b.slice(1,-1)):this.token("STRING",this.escapeLines(b));break;default:return 0}this.line+=R(b,"\n");return b.length},a.prototype.heredocToken=function(){var a,b,c,d;if(!(c=l.exec(this.chunk)))return 0;b=c[0],d=b.charAt(0),a=this.sanitizeHeredoc(c[2],{quote:d,indent:null}),d==='"'&&0<=a.indexOf("#{")?this.interpolateString(a,{heredoc:!0}):this.token("STRING",this.makeString(a,d,!0)),this.line+=R(b,"\n");return b.length},a.prototype.commentToken=function(){var a,b,c;if(!(c=this.chunk.match(i)))return 0;a=c[0],b=c[1],b&&(this.token("HERECOMMENT",this.sanitizeHeredoc(b,{herecomment:!0,indent:Array(this.indent+1).join(" ")})),this.token("TERMINATOR","\n")),this.line+=R(a,"\n");return a.length},a.prototype.jsToken=function(){var a,b;if(this.chunk.charAt(0)!=="`"||!(a=s.exec(this.chunk)))return 0;this.token("JS",(b=a[0]).slice(1,-1));return b.length},a.prototype.regexToken=function(){var a,b,c,d,e;if(this.chunk.charAt(0)!=="/")return 0;if(b=o.exec(this.chunk)){a=this.heregexToken(b),this.line+=R(b[0],"\n");return a}c=T(this.tokens);if(c&&(e=c[0],W.call(c.spaced?C:D,e)>=0))return 0;if(!(b=H.exec(this.chunk)))return 0;d=b[0],this.token("REGEX",d==="//"?"/(?:)/":d);return d.length},a.prototype.heregexToken=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;d=a[0],b=a[1],c=a[2];if(0>b.indexOf("#{")){e=b.replace(p,"").replace(/\//g,"\\/"),this.token("REGEX","/"+(e||"(?:)")+"/"+c);return d.length}this.token("IDENTIFIER","RegExp"),this.tokens.push(["CALL_START","("]),g=[],k=this.interpolateString(b,{regex:!0});for(i=0,j=k.length;i<j;i++){l=k[i],f=l[0],h=l[1];if(f==="TOKENS")g.push.apply(g,h);else{if(!(h=h.replace(p,"")))continue;h=h.replace(/\\/g,"\\\\"),g.push(["STRING",this.makeString(h,'"',!0)])}g.push(["+","+"])}g.pop(),((m=g[0])!=null?m[0]:void 0)!=="STRING"&&this.tokens.push(["STRING",'""'],["+","+"]),(n=this.tokens).push.apply(n,g),c&&this.tokens.push([",",","],["STRING",'"'+c+'"']),this.token(")",")");return d.length},a.prototype.lineToken=function(){var a,b,c,d,e,f;if(!(c=B.exec(this.chunk)))return 0;b=c[0],this.line+=R(b,"\n"),e=T(this.tokens,1),f=b.length-1-b.lastIndexOf("\n"),d=this.unfinished();if(f-this.indebt===this.indent){d?this.suppressNewlines():this.newlineToken();return b.length}if(f>this.indent){if(d){this.indebt=f-this.indent,this.suppressNewlines();return b.length}a=f-this.indent+this.outdebt,this.token("INDENT",a),this.indents.push(a),this.outdebt=this.indebt=0}else this.indebt=0,this.outdentToken(this.indent-f,d);this.indent=f;return b.length},a.prototype.outdentToken=function(a,b,c){var d,e;while(a>0)e=this.indents.length-1,this.indents[e]===void 0?a=0:this.indents[e]===this.outdebt?(a-=this.outdebt,this.outdebt=0):this.indents[e]<this.outdebt?(this.outdebt-=this.indents[e],a-=this.indents[e]):(d=this.indents.pop()-this.outdebt,a-=d,this.outdebt=0,this.token("OUTDENT",d));d&&(this.outdebt-=a),this.tag()!=="TERMINATOR"&&!b&&this.token("TERMINATOR","\n");return this},a.prototype.whitespaceToken=function(){var a,b,c;if(!(a=P.exec(this.chunk))&&!(b=this.chunk.charAt(0)==="\n"))return 0;c=T(this.tokens),c&&(c[a?"spaced":"newLine"]=!0);return a?a[0].length:0},a.prototype.newlineToken=function(){this.tag()!=="TERMINATOR"&&this.token("TERMINATOR","\n");return this},a.prototype.suppressNewlines=function(){this.value()==="\\"&&this.tokens.pop();return this},a.prototype.literalToken=function(){var a,b,c,f,g,h,i,l;(a=G.exec(this.chunk))?(f=a[0],e.test(f)&&this.tagParameters()):f=this.chunk.charAt(0),c=f,b=T(this.tokens);if(f==="="&&b){!b[1].reserved&&(g=b[1],W.call(t,g)>=0)&&this.assignmentError();if((h=b[1])==="||"||h==="&&"){b[0]="COMPOUND_ASSIGN",b[1]+="=";return f.length}}if(f===";")c="TERMINATOR";else if(W.call(z,f)>=0)c="MATH";else if(W.call(j,f)>=0)c="COMPARE";else if(W.call(k,f)>=0)c="COMPOUND_ASSIGN";else if(W.call(O,f)>=0)c="UNARY";else if(W.call(L,f)>=0)c="SHIFT";else if(W.call(x,f)>=0||f==="?"&&(b!=null?b.spaced:void 0))c="LOGIC";else if(b&&!b.spaced)if(f==="("&&(i=b[0],W.call(d,i)>=0))b[0]==="?"&&(b[0]="FUNC_EXIST"),c="CALL_START";else if(f==="["&&(l=b[0],W.call(r,l)>=0)){c="INDEX_START";switch(b[0]){case"?":b[0]="INDEX_SOAK";break;case"::":b[0]="INDEX_PROTO"}}this.token(c,f);return f.length},a.prototype.sanitizeHeredoc=function(a,b){var c,d,e,f,g;e=b.indent,d=b.herecomment;if(d){if(m.test(a))throw new Error('block comment cannot contain "*/", starting on line '+(this.line+1));if(a.indexOf("\n")<=0)return a}else while(f=n.exec(a)){c=f[1];if(e===null||0<(g=c.length)&&g<e.length)e=c}e&&(a=a.replace(RegExp("\\n"+e,"g"),"\n")),d||(a=a.replace(/^\n/,""));return a},a.prototype.tagParameters=function(){var a,b,c,d;if(this.tag()!==")")return this;b=[],d=this.tokens,a=d.length,d[--a][0]="PARAM_END";while(c=d[--a])switch(c[0]){case")":b.push(c);break;case"(":case"CALL_START":if(b.length)b.pop();else{if(c[0]==="("){c[0]="PARAM_START";return this}return this}}return this},a.prototype.closeIndentation=function(){return this.outdentToken(this.indent)},a.prototype.identifierError=function(a){throw SyntaxError('Reserved word "'+a+'" on line '+(this.line+1))},a.prototype.assignmentError=function(){throw SyntaxError('Reserved word "'+this.value()+'" on line '+(this.line+1)+" can't be assigned")},a.prototype.balancedString=function(a,b){var c,d,e,f,g,h;g=[b];for(c=1,h=a.length;1<=h?c<h:c>h;1<=h?c++:c--){switch(d=a.charAt(c)){case"\\":c++;continue;case b:g.pop();if(!g.length)return a.slice(0,c+1);b=g[g.length-1];continue}b!=="}"||d!=='"'&&d!=="'"?b==="}"&&d==="/"&&(e=o.exec(a.slice(c))||H.exec(a.slice(c)))?c+=e[0].length-1:b==="}"&&d==="{"?g.push(b="}"):b==='"'&&f==="#"&&d==="{"&&g.push(b="}"):g.push(b=d),f=d}throw new Error("missing "+g.pop()+", starting on line "+(this.line+1))},a.prototype.interpolateString=function(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;c==null&&(c={}),e=c.heredoc,m=c.regex,o=[],l=0,f=-1;while(j=b.charAt(f+=1)){if(j==="\\"){f+=1;continue}if(j!=="#"||b.charAt(f+1)!=="{"||!(d=this.balancedString(b.slice(f+1),"}")))continue;l<f&&o.push(["NEOSTRING",b.slice(l,f)]),g=d.slice(1,-1);if(g.length){k=(new a).tokenize(g,{line:this.line,rewrite:!1}),k.pop(),((r=k[0])!=null?r[0]:void 0)==="TERMINATOR"&&k.shift();if(i=k.length)i>1&&(k.unshift(["(","("]),k.push([")",")"])),o.push(["TOKENS",k])}f+=d.length,l=f+1}f>l&&l<b.length&&o.push(["NEOSTRING",b.slice(l)]);if(m)return o;if(!o.length)return this.token("STRING",'""');o[0][0]!=="NEOSTRING"&&o.unshift(["",""]),(h=o.length>1)&&this.token("(","(");for(f=0,q=o.length;f<q;f++)s=o[f],n=s[0],p=s[1],f&&this.token("+","+"),n==="TOKENS"?(t=this.tokens).push.apply(t,p):this.token("STRING",this.makeString(p,'"',e));h&&this.token(")",")");return o},a.prototype.token=function(a,b){return this.tokens.push([a,b,this.line])},a.prototype.tag=function(a,b){var c;return(c=T(this.tokens,a))&&(b?c[0]=b:c[0])},a.prototype.value=function(a,b){var c;return(c=T(this.tokens,a))&&(b?c[1]=b:c[1])},a.prototype.unfinished=function(){var a,c;return w.test(this.chunk)||(a=T(this.tokens,1))&&a[0]!=="."&&(c=this.value())&&!c.reserved&&E.test(c)&&!e.test(c)&&!b.test(this.chunk)},a.prototype.escapeLines=function(a,b){return a.replace(A,b?"\\n":"")},a.prototype.makeString=function(a,b,c){if(!a)return b+b;a=a.replace(/\\([\s\S])/g,function(a,c){return c==="\n"||c===b?c:a}),a=a.replace(RegExp(""+b,"g"),"\\$&");return b+this.escapeLines(a,c)+b};return a}(),u=["true","false","null","this","new","delete","typeof","in","instanceof","return","throw","break","continue","debugger","if","else","switch","for","while","do","try","catch","finally","class","extends","super"],h=["undefined","then","unless","until","loop","of","by","when"],g={and:"&&",or:"||",is:"==",isnt:"!=",not:"!",yes:"true",no:"false",on:"true",off:"false"},f=function(){var a;a=[];for(S in g)a.push(S);return a}(),h=h.concat(f),J=["case","default","function","var","void","with","const","let","enum","export","import","native","__hasProp","__extends","__slice","__bind","__indexOf"],t=u.concat(J),a.RESERVED=J.concat(u).concat(h),q=/^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/,F=/^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i,l=/^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/,G=/^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/,P=/^[^\n\S]+/,i=/^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/,e=/^[-=]>/,B=/^(?:\n[^\n\S]*)+/,M=/^'[^\\']*(?:\\.[^\\']*)*'/,s=/^`[^\\`]*(?:\\.[^\\`]*)*`/,H=/^\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/,o=/^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/,p=/\s+(?:#.*)?/g,A=/\n/g,n=/\n+([^\n\S]*)/g,m=/\*\//,b=/^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/,w=/^\s*(?:,|\??\.(?![.\d])|::)/,N=/\s+$/,E=/^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/,k=["-=","+=","/=","*=","%=","||=","&&=","?=","<<=",">>=",">>>=","&=","^=","|="],O=["!","~","NEW","TYPEOF","DELETE","DO"],x=["&&","||","&","|","^"],L=["<<",">>",">>>"],j=["==","!=","<",">","<=",">="],z=["*","/","%"],I=["IN","OF","INSTANCEOF"],c=["TRUE","FALSE","NULL","UNDEFINED"],C=["NUMBER","REGEX","BOOL","++","--","]"],D=C.concat(")","}","THIS","IDENTIFIER","STRING"),d=["IDENTIFIER","STRING","REGEX",")","]","}","?","::","@","THIS","SUPER"],r=d.concat("NUMBER","BOOL"),v=["INDENT","OUTDENT","TERMINATOR"]}).call(this)},require["./parser"]=new function(){var a=this,b=function(){var a={trace:function(){},yy:{},symbols_:{error:2,Root:3,Body:4,Block:5,TERMINATOR:6,Line:7,Expression:8,Statement:9,Return:10,Throw:11,Comment:12,STATEMENT:13,Value:14,Invocation:15,Code:16,Operation:17,Assign:18,If:19,Try:20,While:21,For:22,Switch:23,Class:24,INDENT:25,OUTDENT:26,Identifier:27,IDENTIFIER:28,AlphaNumeric:29,NUMBER:30,STRING:31,Literal:32,JS:33,REGEX:34,BOOL:35,Assignable:36,"=":37,AssignObj:38,ObjAssignable:39,":":40,ThisProperty:41,RETURN:42,HERECOMMENT:43,PARAM_START:44,ParamList:45,PARAM_END:46,FuncGlyph:47,"->":48,"=>":49,OptComma:50,",":51,Param:52,ParamVar:53,"...":54,Array:55,Object:56,Splat:57,SimpleAssignable:58,Accessor:59,Parenthetical:60,Range:61,This:62,".":63,"?.":64,"::":65,Index:66,INDEX_START:67,IndexValue:68,INDEX_END:69,INDEX_SOAK:70,INDEX_PROTO:71,Slice:72,"{":73,AssignList:74,"}":75,CLASS:76,EXTENDS:77,OptFuncExist:78,Arguments:79,SUPER:80,FUNC_EXIST:81,CALL_START:82,CALL_END:83,ArgList:84,THIS:85,"@":86,"[":87,"]":88,RangeDots:89,"..":90,Arg:91,SimpleArgs:92,TRY:93,Catch:94,FINALLY:95,CATCH:96,THROW:97,"(":98,")":99,WhileSource:100,WHILE:101,WHEN:102,UNTIL:103,Loop:104,LOOP:105,ForBody:106,FOR:107,ForStart:108,ForSource:109,ForVariables:110,OWN:111,ForValue:112,FORIN:113,FOROF:114,BY:115,SWITCH:116,Whens:117,ELSE:118,When:119,LEADING_WHEN:120,IfBlock:121,IF:122,POST_IF:123,UNARY:124,"-":125,"+":126,"--":127,"++":128,"?":129,MATH:130,SHIFT:131,COMPARE:132,LOGIC:133,RELATION:134,COMPOUND_ASSIGN:135,$accept:0,$end:1},terminals_:{2:"error",6:"TERMINATOR",13:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"BOOL",37:"=",40:":",42:"RETURN",43:"HERECOMMENT",44:"PARAM_START",46:"PARAM_END",48:"->",49:"=>",51:",",54:"...",63:".",64:"?.",65:"::",67:"INDEX_START",69:"INDEX_END",70:"INDEX_SOAK",71:"INDEX_PROTO",73:"{",75:"}",76:"CLASS",77:"EXTENDS",80:"SUPER",81:"FUNC_EXIST",82:"CALL_START",83:"CALL_END",85:"THIS",86:"@",87:"[",88:"]",90:"..",93:"TRY",95:"FINALLY",96:"CATCH",97:"THROW",98:"(",99:")",101:"WHILE",102:"WHEN",103:"UNTIL",105:"LOOP",107:"FOR",111:"OWN",113:"FORIN",114:"FOROF",115:"BY",116:"SWITCH",118:"ELSE",120:"LEADING_WHEN",122:"IF",123:"POST_IF",124:"UNARY",125:"-",126:"+",127:"--",128:"++",129:"?",130:"MATH",131:"SHIFT",132:"COMPARE",133:"LOGIC",134:"RELATION",135:"COMPOUND_ASSIGN"},productions_:[0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[18,3],[18,5],[38,1],[38,3],[38,5],[38,1],[39,1],[39,1],[39,1],[10,2],[10,1],[12,1],[16,5],[16,2],[47,1],[47,1],[50,0],[50,1],[45,0],[45,1],[45,3],[52,1],[52,2],[52,3],[53,1],[53,1],[53,1],[53,1],[57,2],[58,1],[58,2],[58,2],[58,1],[36,1],[36,1],[36,1],[14,1],[14,1],[14,1],[14,1],[14,1],[59,2],[59,2],[59,2],[59,1],[59,1],[66,3],[66,2],[66,2],[68,1],[68,1],[56,4],[74,0],[74,1],[74,3],[74,4],[74,6],[24,1],[24,2],[24,3],[24,4],[24,2],[24,3],[24,4],[24,5],[15,3],[15,3],[15,1],[15,2],[78,0],[78,1],[79,2],[79,4],[62,1],[62,1],[41,2],[55,2],[55,4],[89,1],[89,1],[61,5],[72,3],[72,2],[72,2],[84,1],[84,3],[84,4],[84,4],[84,6],[91,1],[91,1],[92,1],[92,3],[20,2],[20,3],[20,4],[20,5],[94,3],[11,2],[60,3],[60,5],[100,2],[100,4],[100,2],[100,4],[21,2],[21,2],[21,2],[21,1],[104,2],[104,2],[22,2],[22,2],[22,2],[106,2],[106,2],[108,2],[108,3],[112,1],[112,1],[112,1],[110,1],[110,3],[109,2],[109,2],[109,4],[109,4],[109,4],[109,6],[109,6],[23,5],[23,7],[23,4],[23,6],[117,1],[117,2],[119,3],[119,4],[121,3],[121,5],[19,1],[19,3],[19,3],[19,3],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,5],[17,3]],performAction:function(a,b,c,d,e,f,g){var h=f.length-1;switch(e){case 1:return this.$=new d.Block;case 2:return this.$=f[h];case 3:return this.$=f[h-1];case 4:this.$=d.Block.wrap([f[h]]);break;case 5:this.$=f[h-2].push(f[h]);break;case 6:this.$=f[h-1];break;case 7:this.$=f[h];break;case 8:this.$=f[h];break;case 9:this.$=f[h];break;case 10:this.$=f[h];break;case 11:this.$=f[h];break;case 12:this.$=new d.Literal(f[h]);break;case 13:this.$=f[h];break;case 14:this.$=f[h];break;case 15:this.$=f[h];break;case 16:this.$=f[h];break;case 17:this.$=f[h];break;case 18:this.$=f[h];break;case 19:this.$=f[h];break;case 20:this.$=f[h];break;case 21:this.$=f[h];break;case 22:this.$=f[h];break;case 23:this.$=f[h];break;case 24:this.$=new d.Block;break;case 25:this.$=f[h-1];break;case 26:this.$=new d.Literal(f[h]);break;case 27:this.$=new d.Literal(f[h]);break;case 28:this.$=new d.Literal(f[h]);break;case 29:this.$=f[h];break;case 30:this.$=new d.Literal(f[h]);break;case 31:this.$=new d.Literal(f[h]);break;case 32:this.$=function(){var a;a=new d.Literal(f[h]),f[h]==="undefined"&&(a.isUndefined=!0);return a}();break;case 33:this.$=new d.Assign(f[h-2],f[h]);break;case 34:this.$=new d.Assign(f[h-4],f[h-1]);break;case 35:this.$=new d.Value(f[h]);break;case 36:this.$=new d.Assign(new d.Value(f[h-2]),f[h],"object");break;case 37:this.$=new d.Assign(new d.Value(f[h-4]),f[h-1],"object");break;case 38:this.$=f[h];break;case 39:this.$=f[h];break;case 40:this.$=f[h];break;case 41:this.$=f[h];break;case 42:this.$=new d.Return(f[h]);break;case 43:this.$=new d.Return;break;case 44:this.$=new d.Comment(f[h]);break;case 45:this.$=new d.Code(f[h-3],f[h],f[h-1]);break;case 46:this.$=new d.Code([],f[h],f[h-1]);break;case 47:this.$="func";break;case 48:this.$="boundfunc";break;case 49:this.$=f[h];break;case 50:this.$=f[h];break;case 51:this.$=[];break;case 52:this.$=[f[h]];break;case 53:this.$=f[h-2].concat(f[h]);break;case 54:this.$=new d.Param(f[h]);break;case 55:this.$=new d.Param(f[h-1],null,!0);break;case 56:this.$=new d.Param(f[h-2],f[h]);break;case 57:this.$=f[h];break;case 58:this.$=f[h];break;case 59:this.$=f[h];break;case 60:this.$=f[h];break;case 61:this.$=new d.Splat(f[h-1]);break;case 62:this.$=new d.Value(f[h]);break;case 63:this.$=f[h-1].push(f[h]);break;case 64:this.$=new d.Value(f[h-1],[f[h]]);break;case 65:this.$=f[h];break;case 66:this.$=f[h];break;case 67:this.$=new d.Value(f[h]);break;case 68:this.$=new d.Value(f[h]);break;case 69:this.$=f[h];break;case 70:this.$=new d.Value(f[h]);break;case 71:this.$=new d.Value(f[h]);break;case 72:this.$=new d.Value(f[h]);break;case 73:this.$=f[h];break;case 74:this.$=new d.Access(f[h]);break;case 75:this.$=new d.Access(f[h],"soak");break;case 76:this.$=new d.Access(f[h],"proto");break;case 77:this.$=new d.Access(new d.Literal("prototype"));break;case 78:this.$=f[h];break;case 79:this.$=f[h-1];break;case 80:this.$=d.extend(f[h],{soak:!0});break;case 81:this.$=d.extend(f[h],{proto:!0});break;case 82:this.$=new d.Index(f[h]);break;case 83:this.$=new d.Slice(f[h]);break;case 84:this.$=new d.Obj(f[h-2],f[h-3].generated);break;case 85:this.$=[];break;case 86:this.$=[f[h]];break;case 87:this.$=f[h-2].concat(f[h]);break;case 88:this.$=f[h-3].concat(f[h]);break;case 89:this.$=f[h-5].concat(f[h-2]);break;case 90:this.$=new d.Class;break;case 91:this.$=new d.Class(null,null,f[h]);break;case 92:this.$=new d.Class(null,f[h]);break;case 93:this.$=new d.Class(null,f[h-1],f[h]);break;case 94:this.$=new d.Class(f[h]);break;case 95:this.$=new d.Class(f[h-1],null,f[h]);break;case 96:this.$=new d.Class(f[h-2],f[h]);break;case 97:this.$=new d.Class(f[h-3],f[h-1],f[h]);break;case 98:this.$=new d.Call(f[h-2],f[h],f[h-1]);break;case 99:this.$=new d.Call(f[h-2],f[h],f[h-1]);break;case 100:this.$=new d.Call("super",[new d.Splat(new d.Literal("arguments"))]);break;case 101:this.$=new d.Call("super",f[h]);break;case 102:this.$=!1;break;case 103:this.$=!0;break;case 104:this.$=[];break;case 105:this.$=f[h-2];break;case 106:this.$=new d.Value(new d.Literal("this"));break;case 107:this.$=new d.Value(new d.Literal("this"));break;case 108:this.$=new d.Value(new d.Literal("this"),[new d.Access(f[h])],"this");break;case 109:this.$=new d.Arr([]);break;case 110:this.$=new d.Arr(f[h-2]);break;case 111:this.$="inclusive";break;case 112:this.$="exclusive";break;case 113:this.$=new d.Range(f[h-3],f[h-1],f[h-2]);break;case 114:this.$=new d.Range(f[h-2],f[h],f[h-1]);break;case 115:this.$=new d.Range(f[h-1],null,f[h]);break;case 116:this.$=new d.Range(null,f[h],f[h-1]);break;case 117:this.$=[f[h]];break;case 118:this.$=f[h-2].concat(f[h]);break;case 119:this.$=f[h-3].concat(f[h]);break;case 120:this.$=f[h-2];break;case 121:this.$=f[h-5].concat(f[h-2]);break;case 122:this.$=f[h];break;case 123:this.$=f[h];break;case 124:this.$=f[h];break;case 125:this.$=[].concat(f[h-2],f[h]);break;case 126:this.$=new d.Try(f[h]);break;case 127:this.$=new d.Try(f[h-1],f[h][0],f[h][1]);break;case 128:this.$=new d.Try(f[h-2],null,null,f[h]);break;case 129:this.$=new d.Try(f[h-3],f[h-2][0],f[h-2][1],f[h]);break;case 130:this.$=[f[h-1],f[h]];break;case 131:this.$=new d.Throw(f[h]);break;case 132:this.$=new d.Parens(f[h-1]);break;case 133:this.$=new d.Parens(f[h-2]);break;case 134:this.$=new d.While(f[h]);break;case 135:this.$=new d.While(f[h-2],{guard:f[h]});break;case 136:this.$=new d.While(f[h],{invert:!0});break;case 137:this.$=new d.While(f[h-2],{invert:!0,guard:f[h]});break;case 138:this.$=f[h-1].addBody(f[h]);break;case 139:this.$=f[h].addBody(d.Block.wrap([f[h-1]]));break;case 140:this.$=f[h].addBody(d.Block.wrap([f[h-1]]));break;case 141:this.$=f[h];break;case 142:this.$=(new d.While(new d.Literal("true"))).addBody(f[h]);break;case 143:this.$=(new d.While(new d.Literal("true"))).addBody(d.Block.wrap([f[h]]));break;case 144:this.$=new d.For(f[h-1],f[h]);break;case 145:this.$=new d.For(f[h-1],f[h]);break;case 146:this.$=new d.For(f[h],f[h-1]);break;case 147:this.$={source:new d.Value(f[h])};break;case 148:this.$=function(){f[h].own=f[h-1].own,f[h].name=f[h-1][0],f[h].index=f[h-1][1];return f[h]}();break;case 149:this.$=f[h];break;case 150:this.$=function(){f[h].own=!0;return f[h]}();break;case 151:this.$=f[h];break;case 152:this.$=new d.Value(f[h]);break;case 153:this.$=new d.Value(f[h]);break;case 154:this.$=[f[h]];break;case 155:this.$=[f[h-2],f[h]];break;case 156:this.$={source:f[h]};break;case 157:this.$={source:f[h],object:!0};break;case 158:this.$={source:f[h-2],guard:f[h]};break;case 159:this.$={source:f[h-2],guard:f[h],object:!0};break;case 160:this.$={source:f[h-2],step:f[h]};break;case 161:this.$={source:f[h-4],guard:f[h-2],step:f[h]};break;case 162:this.$={source:f[h-4],step:f[h-2],guard:f[h]};break;case 163:this.$=new d.Switch(f[h-3],f[h-1]);break;case 164:this.$=new d.Switch(f[h-5],f[h-3],f[h-1]);break;case 165:this.$=new d.Switch(null,f[h-1]);break;case 166:this.$=new d.Switch(null,f[h-3],f[h-1]);break;case 167:this.$=f[h];break;case 168:this.$=f[h-1].concat(f[h]);break;case 169:this.$=[[f[h-1],f[h]]];break;case 170:this.$=[[f[h-2],f[h-1]]];break;case 171:this.$=new d.If(f[h-1],f[h],{type:f[h-2]});break;case 172:this.$=f[h-4].addElse(new d.If(f[h-1],f[h],{type:f[h-2]}));break;case 173:this.$=f[h];break;case 174:this.$=f[h-2].addElse(f[h]);break;case 175:this.$=new d.If(f[h],d.Block.wrap([f[h-2]]),{type:f[h-1],statement:!0});break;case 176:this.$=new d.If(f[h],d.Block.wrap([f[h-2]]),{type:f[h-1],statement:!0});break;case 177:this.$=new d.Op(f[h-1],f[h]);break;case 178:this.$=new d.Op("-",f[h]);break;case 179:this.$=new d.Op("+",f[h]);break;case 180:this.$=new d.Op("--",f[h]);break;case 181:this.$=new d.Op("++",f[h]);break;case 182:this.$=new d.Op("--",f[h-1],null,!0);break;case 183:this.$=new d.Op("++",f[h-1],null,!0);break;case 184:this.$=new d.Existence(f[h-1]);break;case 185:this.$=new d.Op("+",f[h-2],f[h]);break;case 186:this.$=new d.Op("-",f[h-2],f[h]);break;case 187:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 188:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 189:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 190:this.$=new d.Op(f[h-1],f[h-2],f[h]);break;case 191:this.$=function(){return f[h-1].charAt(0)==="!"?(new d.Op(f[h-1].slice(1),f[h-2],f[h])).invert():new d.Op(f[h-1],f[h-2],f[h])}();break;case 192:this.$=new d.Assign(f[h-2],f[h],f[h-1]);break;case 193:this.$=new d.Assign(f[h-4],f[h-1],f[h-3]);break;case 194:this.$=new d.Extends(f[h-2],f[h])}},table:[{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[3]},{1:[2,2],6:[1,71]},{6:[1,72]},{1:[2,4],6:[2,4],26:[2,4],99:[2,4]},{4:74,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[1,73],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,7],6:[2,7],26:[2,7],99:[2,7],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,8],6:[2,8],26:[2,8],99:[2,8],100:87,101:[1,62],103:[1,63],106:88,107:[1,65],108:66,123:[1,86]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],46:[2,13],51:[2,13],54:[2,13],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,13],70:[1,97],71:[1,98],75:[2,13],78:89,81:[1,91],82:[2,102],83:[2,13],88:[2,13],90:[2,13],99:[2,13],101:[2,13],102:[2,13],103:[2,13],107:[2,13],115:[2,13],123:[2,13],125:[2,13],126:[2,13],129:[2,13],130:[2,13],131:[2,13],132:[2,13],133:[2,13],134:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],46:[2,14],51:[2,14],54:[2,14],59:100,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,14],70:[1,97],71:[1,98],75:[2,14],78:99,81:[1,91],82:[2,102],83:[2,14],88:[2,14],90:[2,14],99:[2,14],101:[2,14],102:[2,14],103:[2,14],107:[2,14],115:[2,14],123:[2,14],125:[2,14],126:[2,14],129:[2,14],130:[2,14],131:[2,14],132:[2,14],133:[2,14],134:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],46:[2,15],51:[2,15],54:[2,15],69:[2,15],75:[2,15],83:[2,15],88:[2,15],90:[2,15],99:[2,15],101:[2,15],102:[2,15],103:[2,15],107:[2,15],115:[2,15],123:[2,15],125:[2,15],126:[2,15],129:[2,15],130:[2,15],131:[2,15],132:[2,15],133:[2,15],134:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],46:[2,16],51:[2,16],54:[2,16],69:[2,16],75:[2,16],83:[2,16],88:[2,16],90:[2,16],99:[2,16],101:[2,16],102:[2,16],103:[2,16],107:[2,16],115:[2,16],123:[2,16],125:[2,16],126:[2,16],129:[2,16],130:[2,16],131:[2,16],132:[2,16],133:[2,16],134:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],46:[2,17],51:[2,17],54:[2,17],69:[2,17],75:[2,17],83:[2,17],88:[2,17],90:[2,17],99:[2,17],101:[2,17],102:[2,17],103:[2,17],107:[2,17],115:[2,17],123:[2,17],125:[2,17],126:[2,17],129:[2,17],130:[2,17],131:[2,17],132:[2,17],133:[2,17],134:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],46:[2,18],51:[2,18],54:[2,18],69:[2,18],75:[2,18],83:[2,18],88:[2,18],90:[2,18],99:[2,18],101:[2,18],102:[2,18],103:[2,18],107:[2,18],115:[2,18],123:[2,18],125:[2,18],126:[2,18],129:[2,18],130:[2,18],131:[2,18],132:[2,18],133:[2,18],134:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],46:[2,19],51:[2,19],54:[2,19],69:[2,19],75:[2,19],83:[2,19],88:[2,19],90:[2,19],99:[2,19],101:[2,19],102:[2,19],103:[2,19],107:[2,19],115:[2,19],123:[2,19],125:[2,19],126:[2,19],129:[2,19],130:[2,19],131:[2,19],132:[2,19],133:[2,19],134:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],46:[2,20],51:[2,20],54:[2,20],69:[2,20],75:[2,20],83:[2,20],88:[2,20],90:[2,20],99:[2,20],101:[2,20],102:[2,20],103:[2,20],107:[2,20],115:[2,20],123:[2,20],125:[2,20],126:[2,20],129:[2,20],130:[2,20],131:[2,20],132:[2,20],133:[2,20],134:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],46:[2,21],51:[2,21],54:[2,21],69:[2,21],75:[2,21],83:[2,21],88:[2,21],90:[2,21],99:[2,21],101:[2,21],102:[2,21],103:[2,21],107:[2,21],115:[2,21],123:[2,21],125:[2,21],126:[2,21],129:[2,21],130:[2,21],131:[2,21],132:[2,21],133:[2,21],134:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],46:[2,22],51:[2,22],54:[2,22],69:[2,22],75:[2,22],83:[2,22],88:[2,22],90:[2,22],99:[2,22],101:[2,22],102:[2,22],103:[2,22],107:[2,22],115:[2,22],123:[2,22],125:[2,22],126:[2,22],129:[2,22],130:[2,22],131:[2,22],132:[2,22],133:[2,22],134:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],46:[2,23],51:[2,23],54:[2,23],69:[2,23],75:[2,23],83:[2,23],88:[2,23],90:[2,23],99:[2,23],101:[2,23],102:[2,23],103:[2,23],107:[2,23],115:[2,23],123:[2,23],125:[2,23],126:[2,23],129:[2,23],130:[2,23],131:[2,23],132:[2,23],133:[2,23],134:[2,23]},{1:[2,9],6:[2,9],26:[2,9],99:[2,9],101:[2,9],103:[2,9],107:[2,9],123:[2,9]},{1:[2,10],6:[2,10],26:[2,10],99:[2,10],101:[2,10],103:[2,10],107:[2,10],123:[2,10]},{1:[2,11],6:[2,11],26:[2,11],99:[2,11],101:[2,11],103:[2,11],107:[2,11],123:[2,11]},{1:[2,12],6:[2,12],26:[2,12],99:[2,12],101:[2,12],103:[2,12],107:[2,12],123:[2,12]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],37:[1,101],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],67:[2,69],69:[2,69],70:[2,69],71:[2,69],75:[2,69],81:[2,69],82:[2,69],83:[2,69],88:[2,69],90:[2,69],99:[2,69],101:[2,69],102:[2,69],103:[2,69],107:[2,69],115:[2,69],123:[2,69],125:[2,69],126:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],46:[2,70],51:[2,70],54:[2,70],63:[2,70],64:[2,70],65:[2,70],67:[2,70],69:[2,70],70:[2,70],71:[2,70],75:[2,70],81:[2,70],82:[2,70],83:[2,70],88:[2,70],90:[2,70],99:[2,70],101:[2,70],102:[2,70],103:[2,70],107:[2,70],115:[2,70],123:[2,70],125:[2,70],126:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70],134:[2,70]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],46:[2,71],51:[2,71],54:[2,71],63:[2,71],64:[2,71],65:[2,71],67:[2,71],69:[2,71],70:[2,71],71:[2,71],75:[2,71],81:[2,71],82:[2,71],83:[2,71],88:[2,71],90:[2,71],99:[2,71],101:[2,71],102:[2,71],103:[2,71],107:[2,71],115:[2,71],123:[2,71],125:[2,71],126:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71],134:[2,71]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],46:[2,72],51:[2,72],54:[2,72],63:[2,72],64:[2,72],65:[2,72],67:[2,72],69:[2,72],70:[2,72],71:[2,72],75:[2,72],81:[2,72],82:[2,72],83:[2,72],88:[2,72],90:[2,72],99:[2,72],101:[2,72],102:[2,72],103:[2,72],107:[2,72],115:[2,72],123:[2,72],125:[2,72],126:[2,72],129:[2,72],130:[2,72],131:[2,72],132:[2,72],133:[2,72],134:[2,72]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],46:[2,73],51:[2,73],54:[2,73],63:[2,73],64:[2,73],65:[2,73],67:[2,73],69:[2,73],70:[2,73],71:[2,73],75:[2,73],81:[2,73],82:[2,73],83:[2,73],88:[2,73],90:[2,73],99:[2,73],101:[2,73],102:[2,73],103:[2,73],107:[2,73],115:[2,73],123:[2,73],125:[2,73],126:[2,73],129:[2,73],130:[2,73],131:[2,73],132:[2,73],133:[2,73],134:[2,73]},{1:[2,100],6:[2,100],25:[2,100],26:[2,100],46:[2,100],51:[2,100],54:[2,100],63:[2,100],64:[2,100],65:[2,100],67:[2,100],69:[2,100],70:[2,100],71:[2,100],75:[2,100],79:102,81:[2,100],82:[1,103],83:[2,100],88:[2,100],90:[2,100],99:[2,100],101:[2,100],102:[2,100],103:[2,100],107:[2,100],115:[2,100],123:[2,100],125:[2,100],126:[2,100],129:[2,100],130:[2,100],131:[2,100],132:[2,100],133:[2,100],134:[2,100]},{27:107,28:[1,70],41:108,45:104,46:[2,51],51:[2,51],52:105,53:106,55:109,56:110,73:[1,67],86:[1,111],87:[1,112]},{5:113,25:[1,5]},{8:114,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:116,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:117,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{14:119,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:118,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{14:119,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:122,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],37:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,66],70:[2,66],71:[2,66],75:[2,66],77:[1,126],81:[2,66],82:[2,66],83:[2,66],88:[2,66],90:[2,66],99:[2,66],101:[2,66],102:[2,66],103:[2,66],107:[2,66],115:[2,66],123:[2,66],125:[2,66],126:[2,66],127:[1,123],128:[1,124],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[2,66],135:[1,125]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],46:[2,173],51:[2,173],54:[2,173],69:[2,173],75:[2,173],83:[2,173],88:[2,173],90:[2,173],99:[2,173],101:[2,173],102:[2,173],103:[2,173],107:[2,173],115:[2,173],118:[1,127],123:[2,173],125:[2,173],126:[2,173],129:[2,173],130:[2,173],131:[2,173],132:[2,173],133:[2,173],134:[2,173]},{5:128,25:[1,5]},{5:129,25:[1,5]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],46:[2,141],51:[2,141],54:[2,141],69:[2,141],75:[2,141],83:[2,141],88:[2,141],90:[2,141],99:[2,141],101:[2,141],102:[2,141],103:[2,141],107:[2,141],115:[2,141],123:[2,141],125:[2,141],126:[2,141],129:[2,141],130:[2,141],131:[2,141],132:[2,141],133:[2,141],134:[2,141]},{5:130,25:[1,5]},{8:131,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,132],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,90],5:133,6:[2,90],14:119,15:120,25:[1,5],26:[2,90],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,46:[2,90],51:[2,90],54:[2,90],55:47,56:48,58:135,60:25,61:26,62:27,69:[2,90],73:[1,67],75:[2,90],77:[1,134],80:[1,28],83:[2,90],85:[1,55],86:[1,56],87:[1,54],88:[2,90],90:[2,90],98:[1,53],99:[2,90],101:[2,90],102:[2,90],103:[2,90],107:[2,90],115:[2,90],123:[2,90],125:[2,90],126:[2,90],129:[2,90],130:[2,90],131:[2,90],132:[2,90],133:[2,90],134:[2,90]},{1:[2,43],6:[2,43],8:136,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,43],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],99:[2,43],100:39,101:[2,43],103:[2,43],104:40,105:[1,64],106:41,107:[2,43],108:66,116:[1,42],121:37,122:[1,61],123:[2,43],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:137,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,44],6:[2,44],25:[2,44],26:[2,44],51:[2,44],75:[2,44],99:[2,44],101:[2,44],103:[2,44],107:[2,44],123:[2,44]},{1:[2,67],6:[2,67],25:[2,67],26:[2,67],37:[2,67],46:[2,67],51:[2,67],54:[2,67],63:[2,67],64:[2,67],65:[2,67],67:[2,67],69:[2,67],70:[2,67],71:[2,67],75:[2,67],81:[2,67],82:[2,67],83:[2,67],88:[2,67],90:[2,67],99:[2,67],101:[2,67],102:[2,67],103:[2,67],107:[2,67],115:[2,67],123:[2,67],125:[2,67],126:[2,67],129:[2,67],130:[2,67],131:[2,67],132:[2,67],133:[2,67],134:[2,67]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],37:[2,68],46:[2,68],51:[2,68],54:[2,68],63:[2,68],64:[2,68],65:[2,68],67:[2,68],69:[2,68],70:[2,68],71:[2,68],75:[2,68],81:[2,68],82:[2,68],83:[2,68],88:[2,68],90:[2,68],99:[2,68],101:[2,68],102:[2,68],103:[2,68],107:[2,68],115:[2,68],123:[2,68],125:[2,68],126:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68],134:[2,68]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],46:[2,29],51:[2,29],54:[2,29],63:[2,29],64:[2,29],65:[2,29],67:[2,29],69:[2,29],70:[2,29],71:[2,29],75:[2,29],81:[2,29],82:[2,29],83:[2,29],88:[2,29],90:[2,29],99:[2,29],101:[2,29],102:[2,29],103:[2,29],107:[2,29],115:[2,29],123:[2,29],125:[2,29],126:[2,29],129:[2,29],130:[2,29],131:[2,29],132:[2,29],133:[2,29],134:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],46:[2,30],51:[2,30],54:[2,30],63:[2,30],64:[2,30],65:[2,30],67:[2,30],69:[2,30],70:[2,30],71:[2,30],75:[2,30],81:[2,30],82:[2,30],83:[2,30],88:[2,30],90:[2,30],99:[2,30],101:[2,30],102:[2,30],103:[2,30],107:[2,30],115:[2,30],123:[2,30],125:[2,30],126:[2,30],129:[2,30],130:[2,30],131:[2,30],132:[2,30],133:[2,30],134:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],46:[2,31],51:[2,31],54:[2,31],63:[2,31],64:[2,31],65:[2,31],67:[2,31],69:[2,31],70:[2,31],71:[2,31],75:[2,31],81:[2,31],82:[2,31],83:[2,31],88:[2,31],90:[2,31],99:[2,31],101:[2,31],102:[2,31],103:[2,31],107:[2,31],115:[2,31],123:[2,31],125:[2,31],126:[2,31],129:[2,31],130:[2,31],131:[2,31],132:[2,31],133:[2,31],134:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],46:[2,32],51:[2,32],54:[2,32],63:[2,32],64:[2,32],65:[2,32],67:[2,32],69:[2,32],70:[2,32],71:[2,32],75:[2,32],81:[2,32],82:[2,32],83:[2,32],88:[2,32],90:[2,32],99:[2,32],101:[2,32],102:[2,32],103:[2,32],107:[2,32],115:[2,32],123:[2,32],125:[2,32],126:[2,32],129:[2,32],130:[2,32],131:[2,32],132:[2,32],133:[2,32],134:[2,32]},{4:138,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,139],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:140,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:142,85:[1,55],86:[1,56],87:[1,54],88:[1,141],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],46:[2,106],51:[2,106],54:[2,106],63:[2,106],64:[2,106],65:[2,106],67:[2,106],69:[2,106],70:[2,106],71:[2,106],75:[2,106],81:[2,106],82:[2,106],83:[2,106],88:[2,106],90:[2,106],99:[2,106],101:[2,106],102:[2,106],103:[2,106],107:[2,106],115:[2,106],123:[2,106],125:[2,106],126:[2,106],129:[2,106],130:[2,106],131:[2,106],132:[2,106],133:[2,106],134:[2,106]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],27:146,28:[1,70],46:[2,107],51:[2,107],54:[2,107],63:[2,107],64:[2,107],65:[2,107],67:[2,107],69:[2,107],70:[2,107],71:[2,107],75:[2,107],81:[2,107],82:[2,107],83:[2,107],88:[2,107],90:[2,107],99:[2,107],101:[2,107],102:[2,107],103:[2,107],107:[2,107],115:[2,107],123:[2,107],125:[2,107],126:[2,107],129:[2,107],130:[2,107],131:[2,107],132:[2,107],133:[2,107],134:[2,107]},{25:[2,47]},{25:[2,48]},{1:[2,62],6:[2,62],25:[2,62],26:[2,62],37:[2,62],46:[2,62],51:[2,62],54:[2,62],63:[2,62],64:[2,62],65:[2,62],67:[2,62],69:[2,62],70:[2,62],71:[2,62],75:[2,62],77:[2,62],81:[2,62],82:[2,62],83:[2,62],88:[2,62],90:[2,62],99:[2,62],101:[2,62],102:[2,62],103:[2,62],107:[2,62],115:[2,62],123:[2,62],125:[2,62],126:[2,62],127:[2,62],128:[2,62],129:[2,62],130:[2,62],131:[2,62],132:[2,62],133:[2,62],134:[2,62],135:[2,62]},{1:[2,65],6:[2,65],25:[2,65],26:[2,65],37:[2,65],46:[2,65],51:[2,65],54:[2,65],63:[2,65],64:[2,65],65:[2,65],67:[2,65],69:[2,65],70:[2,65],71:[2,65],75:[2,65],77:[2,65],81:[2,65],82:[2,65],83:[2,65],88:[2,65],90:[2,65],99:[2,65],101:[2,65],102:[2,65],103:[2,65],107:[2,65],115:[2,65],123:[2,65],125:[2,65],126:[2,65],127:[2,65],128:[2,65],129:[2,65],130:[2,65],131:[2,65],132:[2,65],133:[2,65],134:[2,65],135:[2,65]},{8:147,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:148,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:149,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{5:150,8:151,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{27:156,28:[1,70],55:157,56:158,61:152,73:[1,67],87:[1,54],110:153,111:[1,154],112:155},{109:159,113:[1,160],114:[1,161]},{6:[2,85],12:165,25:[2,85],27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:163,39:164,41:168,43:[1,46],51:[2,85],74:162,75:[2,85],86:[1,111]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],40:[2,27],46:[2,27],51:[2,27],54:[2,27],63:[2,27],64:[2,27],65:[2,27],67:[2,27],69:[2,27],70:[2,27],71:[2,27],75:[2,27],81:[2,27],82:[2,27],83:[2,27],88:[2,27],90:[2,27],99:[2,27],101:[2,27],102:[2,27],103:[2,27],107:[2,27],115:[2,27],123:[2,27],125:[2,27],126:[2,27],129:[2,27],130:[2,27],131:[2,27],132:[2,27],133:[2,27],134:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],40:[2,28],46:[2,28],51:[2,28],54:[2,28],63:[2,28],64:[2,28],65:[2,28],67:[2,28],69:[2,28],70:[2,28],71:[2,28],75:[2,28],81:[2,28],82:[2,28],83:[2,28],88:[2,28],90:[2,28],99:[2,28],101:[2,28],102:[2,28],103:[2,28],107:[2,28],115:[2,28],123:[2,28],125:[2,28],126:[2,28],129:[2,28],130:[2,28],131:[2,28],132:[2,28],133:[2,28],134:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],37:[2,26],40:[2,26],46:[2,26],51:[2,26],54:[2,26],63:[2,26],64:[2,26],65:[2,26],67:[2,26],69:[2,26],70:[2,26],71:[2,26],75:[2,26],77:[2,26],81:[2,26],82:[2,26],83:[2,26],88:[2,26],90:[2,26],99:[2,26],101:[2,26],102:[2,26],103:[2,26],107:[2,26],113:[2,26],114:[2,26],115:[2,26],123:[2,26],125:[2,26],126:[2,26],127:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26],135:[2,26]},{1:[2,6],6:[2,6],7:169,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,6],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],99:[2,6],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],46:[2,24],51:[2,24],54:[2,24],69:[2,24],75:[2,24],83:[2,24],88:[2,24],90:[2,24],95:[2,24],96:[2,24],99:[2,24],101:[2,24],102:[2,24],103:[2,24],107:[2,24],115:[2,24],118:[2,24],120:[2,24],123:[2,24],125:[2,24],126:[2,24],129:[2,24],130:[2,24],131:[2,24],132:[2,24],133:[2,24],134:[2,24]},{6:[1,71],26:[1,170]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],46:[2,184],51:[2,184],54:[2,184],69:[2,184],75:[2,184],83:[2,184],88:[2,184],90:[2,184],99:[2,184],101:[2,184],102:[2,184],103:[2,184],107:[2,184],115:[2,184],123:[2,184],125:[2,184],126:[2,184],129:[2,184],130:[2,184],131:[2,184],132:[2,184],133:[2,184],134:[2,184]},{8:171,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:172,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:173,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:174,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:175,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:176,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:177,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:178,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],46:[2,140],51:[2,140],54:[2,140],69:[2,140],75:[2,140],83:[2,140],88:[2,140],90:[2,140],99:[2,140],101:[2,140],102:[2,140],103:[2,140],107:[2,140],115:[2,140],123:[2,140],125:[2,140],126:[2,140],129:[2,140],130:[2,140],131:[2,140],132:[2,140],133:[2,140],134:[2,140]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],46:[2,145],51:[2,145],54:[2,145],69:[2,145],75:[2,145],83:[2,145],88:[2,145],90:[2,145],99:[2,145],101:[2,145],102:[2,145],103:[2,145],107:[2,145],115:[2,145],123:[2,145],125:[2,145],126:[2,145],129:[2,145],130:[2,145],131:[2,145],132:[2,145],133:[2,145],134:[2,145]},{8:179,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],46:[2,139],51:[2,139],54:[2,139],69:[2,139],75:[2,139],83:[2,139],88:[2,139],90:[2,139],99:[2,139],101:[2,139],102:[2,139],103:[2,139],107:[2,139],115:[2,139],123:[2,139],125:[2,139],126:[2,139],129:[2,139],130:[2,139],131:[2,139],132:[2,139],133:[2,139],134:[2,139]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],46:[2,144],51:[2,144],54:[2,144],69:[2,144],75:[2,144],83:[2,144],88:[2,144],90:[2,144],99:[2,144],101:[2,144],102:[2,144],103:[2,144],107:[2,144],115:[2,144],123:[2,144],125:[2,144],126:[2,144],129:[2,144],130:[2,144],131:[2,144],132:[2,144],133:[2,144],134:[2,144]},{79:180,82:[1,103]},{1:[2,63],6:[2,63],25:[2,63],26:[2,63],37:[2,63],46:[2,63],51:[2,63],54:[2,63],63:[2,63],64:[2,63],65:[2,63],67:[2,63],69:[2,63],70:[2,63],71:[2,63],75:[2,63],77:[2,63],81:[2,63],82:[2,63],83:[2,63],88:[2,63],90:[2,63],99:[2,63],101:[2,63],102:[2,63],103:[2,63],107:[2,63],115:[2,63],123:[2,63],125:[2,63],126:[2,63],127:[2,63],128:[2,63],129:[2,63],130:[2,63],131:[2,63],132:[2,63],133:[2,63],134:[2,63],135:[2,63]},{82:[2,103]},{27:181,28:[1,70]},{27:182,28:[1,70]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],27:183,28:[1,70],37:[2,77],46:[2,77],51:[2,77],54:[2,77],63:[2,77],64:[2,77],65:[2,77],67:[2,77],69:[2,77],70:[2,77],71:[2,77],75:[2,77],77:[2,77],81:[2,77],82:[2,77],83:[2,77],88:[2,77],90:[2,77],99:[2,77],101:[2,77],102:[2,77],103:[2,77],107:[2,77],115:[2,77],123:[2,77],125:[2,77],126:[2,77],127:[2,77],128:[2,77],129:[2,77],130:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77],135:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],37:[2,78],46:[2,78],51:[2,78],54:[2,78],63:[2,78],64:[2,78],65:[2,78],67:[2,78],69:[2,78],70:[2,78],71:[2,78],75:[2,78],77:[2,78],81:[2,78],82:[2,78],83:[2,78],88:[2,78],90:[2,78],99:[2,78],101:[2,78],102:[2,78],103:[2,78],107:[2,78],115:[2,78],123:[2,78],125:[2,78],126:[2,78],127:[2,78],128:[2,78],129:[2,78],130:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78],135:[2,78]},{8:185,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],54:[1,189],55:47,56:48,58:36,60:25,61:26,62:27,68:184,72:186,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],89:187,90:[1,188],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{66:190,67:[1,96],70:[1,97],71:[1,98]},{66:191,67:[1,96],70:[1,97],71:[1,98]},{79:192,82:[1,103]},{1:[2,64],6:[2,64],25:[2,64],26:[2,64],37:[2,64],46:[2,64],51:[2,64],54:[2,64],63:[2,64],64:[2,64],65:[2,64],67:[2,64],69:[2,64],70:[2,64],71:[2,64],75:[2,64],77:[2,64],81:[2,64],82:[2,64],83:[2,64],88:[2,64],90:[2,64],99:[2,64],101:[2,64],102:[2,64],103:[2,64],107:[2,64],115:[2,64],123:[2,64],125:[2,64],126:[2,64],127:[2,64],128:[2,64],129:[2,64],130:[2,64],131:[2,64],132:[2,64],133:[2,64],134:[2,64],135:[2,64]},{8:193,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,194],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,101],6:[2,101],25:[2,101],26:[2,101],46:[2,101],51:[2,101],54:[2,101],63:[2,101],64:[2,101],65:[2,101],67:[2,101],69:[2,101],70:[2,101],71:[2,101],75:[2,101],81:[2,101],82:[2,101],83:[2,101],88:[2,101],90:[2,101],99:[2,101],101:[2,101],102:[2,101],103:[2,101],107:[2,101],115:[2,101],123:[2,101],125:[2,101],126:[2,101],129:[2,101],130:[2,101],131:[2,101],132:[2,101],133:[2,101],134:[2,101]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],83:[1,195],84:196,85:[1,55],86:[1,56],87:[1,54],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{46:[1,198],51:[1,199]},{46:[2,52],51:[2,52]},{37:[1,201],46:[2,54],51:[2,54],54:[1,200]},{37:[2,57],46:[2,57],51:[2,57],54:[2,57]},{37:[2,58],46:[2,58],51:[2,58],54:[2,58]},{37:[2,59],46:[2,59],51:[2,59],54:[2,59]},{37:[2,60],46:[2,60],51:[2,60],54:[2,60]},{27:146,28:[1,70]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:142,85:[1,55],86:[1,56],87:[1,54],88:[1,141],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,46],6:[2,46],25:[2,46],26:[2,46],46:[2,46],51:[2,46],54:[2,46],69:[2,46],75:[2,46],83:[2,46],88:[2,46],90:[2,46],99:[2,46],101:[2,46],102:[2,46],103:[2,46],107:[2,46],115:[2,46],123:[2,46],125:[2,46],126:[2,46],129:[2,46],130:[2,46],131:[2,46],132:[2,46],133:[2,46],134:[2,46]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],46:[2,177],51:[2,177],54:[2,177],69:[2,177],75:[2,177],83:[2,177],88:[2,177],90:[2,177],99:[2,177],100:84,101:[2,177],102:[2,177],103:[2,177],106:85,107:[2,177],108:66,115:[2,177],123:[2,177],125:[2,177],126:[2,177],129:[1,75],130:[2,177],131:[2,177],132:[2,177],133:[2,177],134:[2,177]},{100:87,101:[1,62],103:[1,63],106:88,107:[1,65],108:66,123:[1,86]},{1:[2,178],6:[2,178],25:[2,178],26:[2,178],46:[2,178],51:[2,178],54:[2,178],69:[2,178],75:[2,178],83:[2,178],88:[2,178],90:[2,178],99:[2,178],100:84,101:[2,178],102:[2,178],103:[2,178],106:85,107:[2,178],108:66,115:[2,178],123:[2,178],125:[2,178],126:[2,178],129:[1,75],130:[2,178],131:[2,178],132:[2,178],133:[2,178],134:[2,178]},{1:[2,179],6:[2,179],25:[2,179],26:[2,179],46:[2,179],51:[2,179],54:[2,179],69:[2,179],75:[2,179],83:[2,179],88:[2,179],90:[2,179],99:[2,179],100:84,101:[2,179],102:[2,179],103:[2,179],106:85,107:[2,179],108:66,115:[2,179],123:[2,179],125:[2,179],126:[2,179],129:[1,75],130:[2,179],131:[2,179],132:[2,179],133:[2,179],134:[2,179]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],46:[2,180],51:[2,180],54:[2,180],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,180],70:[2,66],71:[2,66],75:[2,180],81:[2,66],82:[2,66],83:[2,180],88:[2,180],90:[2,180],99:[2,180],101:[2,180],102:[2,180],103:[2,180],107:[2,180],115:[2,180],123:[2,180],125:[2,180],126:[2,180],129:[2,180],130:[2,180],131:[2,180],132:[2,180],133:[2,180],134:[2,180]},{59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],70:[1,97],71:[1,98],78:89,81:[1,91],82:[2,102]},{59:100,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],70:[1,97],71:[1,98],78:99,81:[1,91],82:[2,102]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],67:[2,69],69:[2,69],70:[2,69],71:[2,69],75:[2,69],81:[2,69],82:[2,69],83:[2,69],88:[2,69],90:[2,69],99:[2,69],101:[2,69],102:[2,69],103:[2,69],107:[2,69],115:[2,69],123:[2,69],125:[2,69],126:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],46:[2,181],51:[2,181],54:[2,181],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,181],70:[2,66],71:[2,66],75:[2,181],81:[2,66],82:[2,66],83:[2,181],88:[2,181],90:[2,181],99:[2,181],101:[2,181],102:[2,181],103:[2,181],107:[2,181],115:[2,181],123:[2,181],125:[2,181],126:[2,181],129:[2,181],130:[2,181],131:[2,181],132:[2,181],133:[2,181],134:[2,181]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],46:[2,182],51:[2,182],54:[2,182],69:[2,182],75:[2,182],83:[2,182],88:[2,182],90:[2,182],99:[2,182],101:[2,182],102:[2,182],103:[2,182],107:[2,182],115:[2,182],123:[2,182],125:[2,182],126:[2,182],129:[2,182],130:[2,182],131:[2,182],132:[2,182],133:[2,182],134:[2,182]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],46:[2,183],51:[2,183],54:[2,183],69:[2,183],75:[2,183],83:[2,183],88:[2,183],90:[2,183],99:[2,183],101:[2,183],102:[2,183],103:[2,183],107:[2,183],115:[2,183],123:[2,183],125:[2,183],126:[2,183],129:[2,183],130:[2,183],131:[2,183],132:[2,183],133:[2,183],134:[2,183]},{8:202,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,203],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:204,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{5:205,25:[1,5],122:[1,206]},{1:[2,126],6:[2,126],25:[2,126],26:[2,126],46:[2,126],51:[2,126],54:[2,126],69:[2,126],75:[2,126],83:[2,126],88:[2,126],90:[2,126],94:207,95:[1,208],96:[1,209],99:[2,126],101:[2,126],102:[2,126],103:[2,126],107:[2,126],115:[2,126],123:[2,126],125:[2,126],126:[2,126],129:[2,126],130:[2,126],131:[2,126],132:[2,126],133:[2,126],134:[2,126]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],46:[2,138],51:[2,138],54:[2,138],69:[2,138],75:[2,138],83:[2,138],88:[2,138],90:[2,138],99:[2,138],101:[2,138],102:[2,138],103:[2,138],107:[2,138],115:[2,138],123:[2,138],125:[2,138],126:[2,138],129:[2,138],130:[2,138],131:[2,138],132:[2,138],133:[2,138],134:[2,138]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],46:[2,146],51:[2,146],54:[2,146],69:[2,146],75:[2,146],83:[2,146],88:[2,146],90:[2,146],99:[2,146],101:[2,146],102:[2,146],103:[2,146],107:[2,146],115:[2,146],123:[2,146],125:[2,146],126:[2,146],129:[2,146],130:[2,146],131:[2,146],132:[2,146],133:[2,146],134:[2,146]},{25:[1,210],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{117:211,119:212,120:[1,213]},{1:[2,91],6:[2,91],25:[2,91],26:[2,91],46:[2,91],51:[2,91],54:[2,91],69:[2,91],75:[2,91],83:[2,91],88:[2,91],90:[2,91],99:[2,91],101:[2,91],102:[2,91],103:[2,91],107:[2,91],115:[2,91],123:[2,91],125:[2,91],126:[2,91],129:[2,91],130:[2,91],131:[2,91],132:[2,91],133:[2,91],134:[2,91]},{14:214,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:215,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{1:[2,94],5:216,6:[2,94],25:[1,5],26:[2,94],46:[2,94],51:[2,94],54:[2,94],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,94],70:[2,66],71:[2,66],75:[2,94],77:[1,217],81:[2,66],82:[2,66],83:[2,94],88:[2,94],90:[2,94],99:[2,94],101:[2,94],102:[2,94],103:[2,94],107:[2,94],115:[2,94],123:[2,94],125:[2,94],126:[2,94],129:[2,94],130:[2,94],131:[2,94],132:[2,94],133:[2,94],134:[2,94]},{1:[2,42],6:[2,42],26:[2,42],99:[2,42],100:84,101:[2,42],103:[2,42],106:85,107:[2,42],108:66,123:[2,42],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,131],6:[2,131],26:[2,131],99:[2,131],100:84,101:[2,131],103:[2,131],106:85,107:[2,131],108:66,123:[2,131],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,71],99:[1,218]},{4:219,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,122],25:[2,122],51:[2,122],54:[1,221],88:[2,122],89:220,90:[1,188],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,109],6:[2,109],25:[2,109],26:[2,109],37:[2,109],46:[2,109],51:[2,109],54:[2,109],63:[2,109],64:[2,109],65:[2,109],67:[2,109],69:[2,109],70:[2,109],71:[2,109],75:[2,109],81:[2,109],82:[2,109],83:[2,109],88:[2,109],90:[2,109],99:[2,109],101:[2,109],102:[2,109],103:[2,109],107:[2,109],113:[2,109],114:[2,109],115:[2,109],123:[2,109],125:[2,109],126:[2,109],129:[2,109],130:[2,109],131:[2,109],132:[2,109],133:[2,109],134:[2,109]},{6:[2,49],25:[2,49],50:222,51:[1,223],88:[2,49]},{6:[2,117],25:[2,117],26:[2,117],51:[2,117],83:[2,117],88:[2,117]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:224,85:[1,55],86:[1,56],87:[1,54],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,123],25:[2,123],26:[2,123],51:[2,123],83:[2,123],88:[2,123]},{1:[2,108],6:[2,108],25:[2,108],26:[2,108],37:[2,108],40:[2,108],46:[2,108],51:[2,108],54:[2,108],63:[2,108],64:[2,108],65:[2,108],67:[2,108],69:[2,108],70:[2,108],71:[2,108],75:[2,108],77:[2,108],81:[2,108],82:[2,108],83:[2,108],88:[2,108],90:[2,108],99:[2,108],101:[2,108],102:[2,108],103:[2,108],107:[2,108],115:[2,108],123:[2,108],125:[2,108],126:[2,108],127:[2,108],128:[2,108],129:[2,108],130:[2,108],131:[2,108],132:[2,108],133:[2,108],134:[2,108],135:[2,108]},{5:225,25:[1,5],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],46:[2,134],51:[2,134],54:[2,134],69:[2,134],75:[2,134],83:[2,134],88:[2,134],90:[2,134],99:[2,134],100:84,101:[1,62],102:[1,226],103:[1,63],106:85,107:[1,65],108:66,115:[2,134],123:[2,134],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],46:[2,136],51:[2,136],54:[2,136],69:[2,136],75:[2,136],83:[2,136],88:[2,136],90:[2,136],99:[2,136],100:84,101:[1,62],102:[1,227],103:[1,63],106:85,107:[1,65],108:66,115:[2,136],123:[2,136],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],46:[2,142],51:[2,142],54:[2,142],69:[2,142],75:[2,142],83:[2,142],88:[2,142],90:[2,142],99:[2,142],101:[2,142],102:[2,142],103:[2,142],107:[2,142],115:[2,142],123:[2,142],125:[2,142],126:[2,142],129:[2,142],130:[2,142],131:[2,142],132:[2,142],133:[2,142],134:[2,142]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],46:[2,143],51:[2,143],54:[2,143],69:[2,143],75:[2,143],83:[2,143],88:[2,143],90:[2,143],99:[2,143],100:84,101:[1,62],102:[2,143],103:[1,63],106:85,107:[1,65],108:66,115:[2,143],123:[2,143],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],46:[2,147],51:[2,147],54:[2,147],69:[2,147],75:[2,147],83:[2,147],88:[2,147],90:[2,147],99:[2,147],101:[2,147],102:[2,147],103:[2,147],107:[2,147],115:[2,147],123:[2,147],125:[2,147],126:[2,147],129:[2,147],130:[2,147],131:[2,147],132:[2,147],133:[2,147],134:[2,147]},{113:[2,149],114:[2,149]},{27:156,28:[1,70],55:157,56:158,73:[1,67],87:[1,112],110:228,112:155},{51:[1,229],113:[2,154],114:[2,154]},{51:[2,151],113:[2,151],114:[2,151]},{51:[2,152],113:[2,152],114:[2,152]},{51:[2,153],113:[2,153],114:[2,153]},{1:[2,148],6:[2,148],25:[2,148],26:[2,148],46:[2,148],51:[2,148],54:[2,148],69:[2,148],75:[2,148],83:[2,148],88:[2,148],90:[2,148],99:[2,148],101:[2,148],102:[2,148],103:[2,148],107:[2,148],115:[2,148],123:[2,148],125:[2,148],126:[2,148],129:[2,148],130:[2,148],131:[2,148],132:[2,148],133:[2,148],134:[2,148]},{8:230,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:231,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,49],25:[2,49],50:232,51:[1,233],75:[2,49]},{6:[2,86],25:[2,86],26:[2,86],51:[2,86],75:[2,86]},{6:[2,35],25:[2,35],26:[2,35],40:[1,234],51:[2,35],75:[2,35]},{6:[2,38],25:[2,38],26:[2,38],51:[2,38],75:[2,38]},{6:[2,39],25:[2,39],26:[2,39],40:[2,39],51:[2,39],75:[2,39]},{6:[2,40],25:[2,40],26:[2,40],40:[2,40],51:[2,40],75:[2,40]},{6:[2,41],25:[2,41],26:[2,41],40:[2,41],51:[2,41],75:[2,41]},{1:[2,5],6:[2,5],26:[2,5],99:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],46:[2,25],51:[2,25],54:[2,25],69:[2,25],75:[2,25],83:[2,25],88:[2,25],90:[2,25],95:[2,25],96:[2,25],99:[2,25],101:[2,25],102:[2,25],103:[2,25],107:[2,25],115:[2,25],118:[2,25],120:[2,25],123:[2,25],125:[2,25],126:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25],134:[2,25]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],46:[2,185],51:[2,185],54:[2,185],69:[2,185],75:[2,185],83:[2,185],88:[2,185],90:[2,185],99:[2,185],100:84,101:[2,185],102:[2,185],103:[2,185],106:85,107:[2,185],108:66,115:[2,185],123:[2,185],125:[2,185],126:[2,185],129:[1,75],130:[1,78],131:[2,185],132:[2,185],133:[2,185],134:[2,185]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],46:[2,186],51:[2,186],54:[2,186],69:[2,186],75:[2,186],83:[2,186],88:[2,186],90:[2,186],99:[2,186],100:84,101:[2,186],102:[2,186],103:[2,186],106:85,107:[2,186],108:66,115:[2,186],123:[2,186],125:[2,186],126:[2,186],129:[1,75],130:[1,78],131:[2,186],132:[2,186],133:[2,186],134:[2,186]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],46:[2,187],51:[2,187],54:[2,187],69:[2,187],75:[2,187],83:[2,187],88:[2,187],90:[2,187],99:[2,187],100:84,101:[2,187],102:[2,187],103:[2,187],106:85,107:[2,187],108:66,115:[2,187],123:[2,187],125:[2,187],126:[2,187],129:[1,75],130:[2,187],131:[2,187],132:[2,187],133:[2,187],134:[2,187]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],46:[2,188],51:[2,188],54:[2,188],69:[2,188],75:[2,188],83:[2,188],88:[2,188],90:[2,188],99:[2,188],100:84,101:[2,188],102:[2,188],103:[2,188],106:85,107:[2,188],108:66,115:[2,188],123:[2,188],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[2,188],132:[2,188],133:[2,188],134:[2,188]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],46:[2,189],51:[2,189],54:[2,189],69:[2,189],75:[2,189],83:[2,189],88:[2,189],90:[2,189],99:[2,189],100:84,101:[2,189],102:[2,189],103:[2,189],106:85,107:[2,189],108:66,115:[2,189],123:[2,189],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[2,189],133:[2,189],134:[1,82]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],46:[2,190],51:[2,190],54:[2,190],69:[2,190],75:[2,190],83:[2,190],88:[2,190],90:[2,190],99:[2,190],100:84,101:[2,190],102:[2,190],103:[2,190],106:85,107:[2,190],108:66,115:[2,190],123:[2,190],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[2,190],134:[1,82]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],46:[2,191],51:[2,191],54:[2,191],69:[2,191],75:[2,191],83:[2,191],88:[2,191],90:[2,191],99:[2,191],100:84,101:[2,191],102:[2,191],103:[2,191],106:85,107:[2,191],108:66,115:[2,191],123:[2,191],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[2,191],133:[2,191],134:[2,191]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],46:[2,176],51:[2,176],54:[2,176],69:[2,176],75:[2,176],83:[2,176],88:[2,176],90:[2,176],99:[2,176],100:84,101:[1,62],102:[2,176],103:[1,63],106:85,107:[1,65],108:66,115:[2,176],123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],46:[2,175],51:[2,175],54:[2,175],69:[2,175],75:[2,175],83:[2,175],88:[2,175],90:[2,175],99:[2,175],100:84,101:[1,62],102:[2,175],103:[1,63],106:85,107:[1,65],108:66,115:[2,175],123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,98],6:[2,98],25:[2,98],26:[2,98],46:[2,98],51:[2,98],54:[2,98],63:[2,98],64:[2,98],65:[2,98],67:[2,98],69:[2,98],70:[2,98],71:[2,98],75:[2,98],81:[2,98],82:[2,98],83:[2,98],88:[2,98],90:[2,98],99:[2,98],101:[2,98],102:[2,98],103:[2,98],107:[2,98],115:[2,98],123:[2,98],125:[2,98],126:[2,98],129:[2,98],130:[2,98],131:[2,98],132:[2,98],133:[2,98],134:[2,98]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],37:[2,74],46:[2,74],51:[2,74],54:[2,74],63:[2,74],64:[2,74],65:[2,74],67:[2,74],69:[2,74],70:[2,74],71:[2,74],75:[2,74],77:[2,74],81:[2,74],82:[2,74],83:[2,74],88:[2,74],90:[2,74],99:[2,74],101:[2,74],102:[2,74],103:[2,74],107:[2,74],115:[2,74],123:[2,74],125:[2,74],126:[2,74],127:[2,74],128:[2,74],129:[2,74],130:[2,74],131:[2,74],132:[2,74],133:[2,74],134:[2,74],135:[2,74]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],37:[2,75],46:[2,75],51:[2,75],54:[2,75],63:[2,75],64:[2,75],65:[2,75],67:[2,75],69:[2,75],70:[2,75],71:[2,75],75:[2,75],77:[2,75],81:[2,75],82:[2,75],83:[2,75],88:[2,75],90:[2,75],99:[2,75],101:[2,75],102:[2,75],103:[2,75],107:[2,75],115:[2,75],123:[2,75],125:[2,75],126:[2,75],127:[2,75],128:[2,75],129:[2,75],130:[2,75],131:[2,75],132:[2,75],133:[2,75],134:[2,75],135:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],37:[2,76],46:[2,76],51:[2,76],54:[2,76],63:[2,76],64:[2,76],65:[2,76],67:[2,76],69:[2,76],70:[2,76],71:[2,76],75:[2,76],77:[2,76],81:[2,76],82:[2,76],83:[2,76],88:[2,76],90:[2,76],99:[2,76],101:[2,76],102:[2,76],103:[2,76],107:[2,76],115:[2,76],123:[2,76],125:[2,76],126:[2,76],127:[2,76],128:[2,76],129:[2,76],130:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76],135:[2,76]},{69:[1,235]},{54:[1,189],69:[2,82],89:236,90:[1,188],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{69:[2,83]},{8:237,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{13:[2,111],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],69:[2,111],73:[2,111],76:[2,111],80:[2,111],85:[2,111],86:[2,111],87:[2,111],93:[2,111],97:[2,111],98:[2,111],101:[2,111],103:[2,111],105:[2,111],107:[2,111],116:[2,111],122:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111],128:[2,111]},{13:[2,112],28:[2,112],30:[2,112],31:[2,112],33:[2,112],34:[2,112],35:[2,112],42:[2,112],43:[2,112],44:[2,112],48:[2,112],49:[2,112],69:[2,112],73:[2,112],76:[2,112],80:[2,112],85:[2,112],86:[2,112],87:[2,112],93:[2,112],97:[2,112],98:[2,112],101:[2,112],103:[2,112],105:[2,112],107:[2,112],116:[2,112],122:[2,112],124:[2,112],125:[2,112],126:[2,112],127:[2,112],128:[2,112]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],37:[2,80],46:[2,80],51:[2,80],54:[2,80],63:[2,80],64:[2,80],65:[2,80],67:[2,80],69:[2,80],70:[2,80],71:[2,80],75:[2,80],77:[2,80],81:[2,80],82:[2,80],83:[2,80],88:[2,80],90:[2,80],99:[2,80],101:[2,80],102:[2,80],103:[2,80],107:[2,80],115:[2,80],123:[2,80],125:[2,80],126:[2,80],127:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],37:[2,81],46:[2,81],51:[2,81],54:[2,81],63:[2,81],64:[2,81],65:[2,81],67:[2,81],69:[2,81],70:[2,81],71:[2,81],75:[2,81],77:[2,81],81:[2,81],82:[2,81],83:[2,81],88:[2,81],90:[2,81],99:[2,81],101:[2,81],102:[2,81],103:[2,81],107:[2,81],115:[2,81],123:[2,81],125:[2,81],126:[2,81],127:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],46:[2,99],51:[2,99],54:[2,99],63:[2,99],64:[2,99],65:[2,99],67:[2,99],69:[2,99],70:[2,99],71:[2,99],75:[2,99],81:[2,99],82:[2,99],83:[2,99],88:[2,99],90:[2,99],99:[2,99],101:[2,99],102:[2,99],103:[2,99],107:[2,99],115:[2,99],123:[2,99],125:[2,99],126:[2,99],129:[2,99],130:[2,99],131:[2,99],132:[2,99],133:[2,99],134:[2,99]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],46:[2,33],51:[2,33],54:[2,33],69:[2,33],75:[2,33],83:[2,33],88:[2,33],90:[2,33],99:[2,33],100:84,101:[2,33],102:[2,33],103:[2,33],106:85,107:[2,33],108:66,115:[2,33],123:[2,33],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{8:238,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],46:[2,104],51:[2,104],54:[2,104],63:[2,104],64:[2,104],65:[2,104],67:[2,104],69:[2,104],70:[2,104],71:[2,104],75:[2,104],81:[2,104],82:[2,104],83:[2,104],88:[2,104],90:[2,104],99:[2,104],101:[2,104],102:[2,104],103:[2,104],107:[2,104],115:[2,104],123:[2,104],125:[2,104],126:[2,104],129:[2,104],130:[2,104],131:[2,104],132:[2,104],133:[2,104],134:[2,104]},{6:[2,49],25:[2,49],50:239,51:[1,223],83:[2,49]},{6:[2,122],25:[2,122],26:[2,122],51:[2,122],54:[1,240],83:[2,122],88:[2,122],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{47:241,48:[1,57],49:[1,58]},{27:107,28:[1,70],41:108,52:242,53:106,55:109,56:110,73:[1,67],86:[1,111],87:[1,112]},{46:[2,55],51:[2,55]},{8:243,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],46:[2,192],51:[2,192],54:[2,192],69:[2,192],75:[2,192],83:[2,192],88:[2,192],90:[2,192],99:[2,192],100:84,101:[2,192],102:[2,192],103:[2,192],106:85,107:[2,192],108:66,115:[2,192],123:[2,192],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{8:244,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,194],6:[2,194],25:[2,194],26:[2,194],46:[2,194],51:[2,194],54:[2,194],69:[2,194],75:[2,194],83:[2,194],88:[2,194],90:[2,194],99:[2,194],100:84,101:[2,194],102:[2,194],103:[2,194],106:85,107:[2,194],108:66,115:[2,194],123:[2,194],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],46:[2,174],51:[2,174],54:[2,174],69:[2,174],75:[2,174],83:[2,174],88:[2,174],90:[2,174],99:[2,174],101:[2,174],102:[2,174],103:[2,174],107:[2,174],115:[2,174],123:[2,174],125:[2,174],126:[2,174],129:[2,174],130:[2,174],131:[2,174],132:[2,174],133:[2,174],134:[2,174]},{8:245,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,127],6:[2,127],25:[2,127],26:[2,127],46:[2,127],51:[2,127],54:[2,127],69:[2,127],75:[2,127],83:[2,127],88:[2,127],90:[2,127],95:[1,246],99:[2,127],101:[2,127],102:[2,127],103:[2,127],107:[2,127],115:[2,127],123:[2,127],125:[2,127],126:[2,127],129:[2,127],130:[2,127],131:[2,127],132:[2,127],133:[2,127],134:[2,127]},{5:247,25:[1,5]},{27:248,28:[1,70]},{117:249,119:212,120:[1,213]},{26:[1,250],118:[1,251],119:252,120:[1,213]},{26:[2,167],118:[2,167],120:[2,167]},{8:254,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],92:253,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,92],5:255,6:[2,92],25:[1,5],26:[2,92],46:[2,92],51:[2,92],54:[2,92],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,92],70:[1,97],71:[1,98],75:[2,92],78:89,81:[1,91],82:[2,102],83:[2,92],88:[2,92],90:[2,92],99:[2,92],101:[2,92],102:[2,92],103:[2,92],107:[2,92],115:[2,92],123:[2,92],125:[2,92],126:[2,92],129:[2,92],130:[2,92],131:[2,92],132:[2,92],133:[2,92],134:[2,92]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],67:[2,66],69:[2,66],70:[2,66],71:[2,66],75:[2,66],81:[2,66],82:[2,66],83:[2,66],88:[2,66],90:[2,66],99:[2,66],101:[2,66],102:[2,66],103:[2,66],107:[2,66],115:[2,66],123:[2,66],125:[2,66],126:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[2,66]},{1:[2,95],6:[2,95],25:[2,95],26:[2,95],46:[2,95],51:[2,95],54:[2,95],69:[2,95],75:[2,95],83:[2,95],88:[2,95],90:[2,95],99:[2,95],101:[2,95],102:[2,95],103:[2,95],107:[2,95],115:[2,95],123:[2,95],125:[2,95],126:[2,95],129:[2,95],130:[2,95],131:[2,95],132:[2,95],133:[2,95],134:[2,95]},{14:256,15:120,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:121,41:60,55:47,56:48,58:215,60:25,61:26,62:27,73:[1,67],80:[1,28],85:[1,55],86:[1,56],87:[1,54],98:[1,53]},{1:[2,132],6:[2,132],25:[2,132],26:[2,132],46:[2,132],51:[2,132],54:[2,132],63:[2,132],64:[2,132],65:[2,132],67:[2,132],69:[2,132],70:[2,132],71:[2,132],75:[2,132],81:[2,132],82:[2,132],83:[2,132],88:[2,132],90:[2,132],99:[2,132],101:[2,132],102:[2,132],103:[2,132],107:[2,132],115:[2,132],123:[2,132],125:[2,132],126:[2,132],129:[2,132],130:[2,132],131:[2,132],132:[2,132],133:[2,132],134:[2,132]},{6:[1,71],26:[1,257]},{8:258,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,61],13:[2,112],25:[2,61],28:[2,112],30:[2,112],31:[2,112],33:[2,112],34:[2,112],35:[2,112],42:[2,112],43:[2,112],44:[2,112],48:[2,112],49:[2,112],51:[2,61],73:[2,112],76:[2,112],80:[2,112],85:[2,112],86:[2,112],87:[2,112],88:[2,61],93:[2,112],97:[2,112],98:[2,112],101:[2,112],103:[2,112],105:[2,112],107:[2,112],116:[2,112],122:[2,112],124:[2,112],125:[2,112],126:[2,112],127:[2,112],128:[2,112]},{6:[1,260],25:[1,261],88:[1,259]},{6:[2,50],8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[2,50],26:[2,50],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],83:[2,50],85:[1,55],86:[1,56],87:[1,54],88:[2,50],91:262,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,49],25:[2,49],26:[2,49],50:263,51:[1,223]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],46:[2,171],51:[2,171],54:[2,171],69:[2,171],75:[2,171],83:[2,171],88:[2,171],90:[2,171],99:[2,171],101:[2,171],102:[2,171],103:[2,171],107:[2,171],115:[2,171],118:[2,171],123:[2,171],125:[2,171],126:[2,171],129:[2,171],130:[2,171],131:[2,171],132:[2,171],133:[2,171],134:[2,171]},{8:264,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:265,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{113:[2,150],114:[2,150]},{27:156,28:[1,70],55:157,56:158,73:[1,67],87:[1,112],112:266},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],46:[2,156],51:[2,156],54:[2,156],69:[2,156],75:[2,156],83:[2,156],88:[2,156],90:[2,156],99:[2,156],100:84,101:[2,156],102:[1,267],103:[2,156],106:85,107:[2,156],108:66,115:[1,268],123:[2,156],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],46:[2,157],51:[2,157],54:[2,157],69:[2,157],75:[2,157],83:[2,157],88:[2,157],90:[2,157],99:[2,157],100:84,101:[2,157],102:[1,269],103:[2,157],106:85,107:[2,157],108:66,115:[2,157],123:[2,157],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,271],25:[1,272],75:[1,270]},{6:[2,50],12:165,25:[2,50],26:[2,50],27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:273,39:164,41:168,43:[1,46],75:[2,50],86:[1,111]},{8:274,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,275],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],37:[2,79],46:[2,79],51:[2,79],54:[2,79],63:[2,79],64:[2,79],65:[2,79],67:[2,79],69:[2,79],70:[2,79],71:[2,79],75:[2,79],77:[2,79],81:[2,79],82:[2,79],83:[2,79],88:[2,79],90:[2,79],99:[2,79],101:[2,79],102:[2,79],103:[2,79],107:[2,79],115:[2,79],123:[2,79],125:[2,79],126:[2,79],127:[2,79],128:[2,79],129:[2,79],130:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79],135:[2,79]},{8:276,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,69:[2,115],73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{69:[2,116],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{26:[1,277],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,260],25:[1,261],83:[1,278]},{6:[2,61],25:[2,61],26:[2,61],51:[2,61],83:[2,61],88:[2,61]},{5:279,25:[1,5]},{46:[2,53],51:[2,53]},{46:[2,56],51:[2,56],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{26:[1,280],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{5:281,25:[1,5],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{5:282,25:[1,5]},{1:[2,128],6:[2,128],25:[2,128],26:[2,128],46:[2,128],51:[2,128],54:[2,128],69:[2,128],75:[2,128],83:[2,128],88:[2,128],90:[2,128],99:[2,128],101:[2,128],102:[2,128],103:[2,128],107:[2,128],115:[2,128],123:[2,128],125:[2,128],126:[2,128],129:[2,128],130:[2,128],131:[2,128],132:[2,128],133:[2,128],134:[2,128]},{5:283,25:[1,5]},{26:[1,284],118:[1,285],119:252,120:[1,213]},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],46:[2,165],51:[2,165],54:[2,165],69:[2,165],75:[2,165],83:[2,165],88:[2,165],90:[2,165],99:[2,165],101:[2,165],102:[2,165],103:[2,165],107:[2,165],115:[2,165],123:[2,165],125:[2,165],126:[2,165],129:[2,165],130:[2,165],131:[2,165],132:[2,165],133:[2,165],134:[2,165]},{5:286,25:[1,5]},{26:[2,168],118:[2,168],120:[2,168]},{5:287,25:[1,5],51:[1,288]},{25:[2,124],51:[2,124],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,93],6:[2,93],25:[2,93],26:[2,93],46:[2,93],51:[2,93],54:[2,93],69:[2,93],75:[2,93],83:[2,93],88:[2,93],90:[2,93],99:[2,93],101:[2,93],102:[2,93],103:[2,93],107:[2,93],115:[2,93],123:[2,93],125:[2,93],126:[2,93],129:[2,93],130:[2,93],131:[2,93],132:[2,93],133:[2,93],134:[2,93]},{1:[2,96],5:289,6:[2,96],25:[1,5],26:[2,96],46:[2,96],51:[2,96],54:[2,96],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:[1,96],69:[2,96],70:[1,97],71:[1,98],75:[2,96],78:89,81:[1,91],82:[2,102],83:[2,96],88:[2,96],90:[2,96],99:[2,96],101:[2,96],102:[2,96],103:[2,96],107:[2,96],115:[2,96],123:[2,96],125:[2,96],126:[2,96],129:[2,96],130:[2,96],131:[2,96],132:[2,96],133:[2,96],134:[2,96]},{99:[1,290]},{88:[1,291],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,110],6:[2,110],25:[2,110],26:[2,110],37:[2,110],46:[2,110],51:[2,110],54:[2,110],63:[2,110],64:[2,110],65:[2,110],67:[2,110],69:[2,110],70:[2,110],71:[2,110],75:[2,110],81:[2,110],82:[2,110],83:[2,110],88:[2,110],90:[2,110],99:[2,110],101:[2,110],102:[2,110],103:[2,110],107:[2,110],113:[2,110],114:[2,110],115:[2,110],123:[2,110],125:[2,110],126:[2,110],129:[2,110],130:[2,110],131:[2,110],132:[2,110],133:[2,110],134:[2,110]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],91:292,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:197,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,144],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:145,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],84:293,85:[1,55],86:[1,56],87:[1,54],91:143,93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[2,118],25:[2,118],26:[2,118],51:[2,118],83:[2,118],88:[2,118]},{6:[1,260],25:[1,261],26:[1,294]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],46:[2,135],51:[2,135],54:[2,135],69:[2,135],75:[2,135],83:[2,135],88:[2,135],90:[2,135],99:[2,135],100:84,101:[1,62],102:[2,135],103:[1,63],106:85,107:[1,65],108:66,115:[2,135],123:[2,135],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],46:[2,137],51:[2,137],54:[2,137],69:[2,137],75:[2,137],83:[2,137],88:[2,137],90:[2,137],99:[2,137],100:84,101:[1,62],102:[2,137],103:[1,63],106:85,107:[1,65],108:66,115:[2,137],123:[2,137],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{113:[2,155],114:[2,155]},{8:295,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:296,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:297,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,84],6:[2,84],25:[2,84],26:[2,84],37:[2,84],46:[2,84],51:[2,84],54:[2,84],63:[2,84],64:[2,84],65:[2,84],67:[2,84],69:[2,84],70:[2,84],71:[2,84],75:[2,84],81:[2,84],82:[2,84],83:[2,84],88:[2,84],90:[2,84],99:[2,84],101:[2,84],102:[2,84],103:[2,84],107:[2,84],113:[2,84],114:[2,84],115:[2,84],123:[2,84],125:[2,84],126:[2,84],129:[2,84],130:[2,84],131:[2,84],132:[2,84],133:[2,84],134:[2,84]},{12:165,27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:298,39:164,41:168,43:[1,46],86:[1,111]},{6:[2,85],12:165,25:[2,85],26:[2,85],27:166,28:[1,70],29:167,30:[1,68],31:[1,69],38:163,39:164,41:168,43:[1,46],51:[2,85],74:299,86:[1,111]},{6:[2,87],25:[2,87],26:[2,87],51:[2,87],75:[2,87]},{6:[2,36],25:[2,36],26:[2,36],51:[2,36],75:[2,36],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{8:300,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{69:[2,114],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],46:[2,34],51:[2,34],54:[2,34],69:[2,34],75:[2,34],83:[2,34],88:[2,34],90:[2,34],99:[2,34],101:[2,34],102:[2,34],103:[2,34],107:[2,34],115:[2,34],123:[2,34],125:[2,34],126:[2,34],129:[2,34],130:[2,34],131:[2,34],132:[2,34],133:[2,34],134:[2,34]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],46:[2,105],51:[2,105],54:[2,105],63:[2,105],64:[2,105],65:[2,105],67:[2,105],69:[2,105],70:[2,105],71:[2,105],75:[2,105],81:[2,105],82:[2,105],83:[2,105],88:[2,105],90:[2,105],99:[2,105],101:[2,105],102:[2,105],103:[2,105],107:[2,105],115:[2,105],123:[2,105],125:[2,105],126:[2,105],129:[2,105],130:[2,105],131:[2,105],132:[2,105],133:[2,105],134:[2,105]},{1:[2,45],6:[2,45],25:[2,45],26:[2,45],46:[2,45],51:[2,45],54:[2,45],69:[2,45],75:[2,45],83:[2,45],88:[2,45],90:[2,45],99:[2,45],101:[2,45],102:[2,45],103:[2,45],107:[2,45],115:[2,45],123:[2,45],125:[2,45],126:[2,45],129:[2,45],130:[2,45],131:[2,45],132:[2,45],133:[2,45],134:[2,45]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],46:[2,193],51:[2,193],54:[2,193],69:[2,193],75:[2,193],83:[2,193],88:[2,193],90:[2,193],99:[2,193],101:[2,193],102:[2,193],103:[2,193],107:[2,193],115:[2,193],123:[2,193],125:[2,193],126:[2,193],129:[2,193],130:[2,193],131:[2,193],132:[2,193],133:[2,193],134:[2,193]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],46:[2,172],51:[2,172],54:[2,172],69:[2,172],75:[2,172],83:[2,172],88:[2,172],90:[2,172],99:[2,172],101:[2,172],102:[2,172],103:[2,172],107:[2,172],115:[2,172],118:[2,172],123:[2,172],125:[2,172],126:[2,172],129:[2,172],130:[2,172],131:[2,172],132:[2,172],133:[2,172],134:[2,172]},{1:[2,129],6:[2,129],25:[2,129],26:[2,129],46:[2,129],51:[2,129],54:[2,129],69:[2,129],75:[2,129],83:[2,129],88:[2,129],90:[2,129],99:[2,129],101:[2,129],102:[2,129],103:[2,129],107:[2,129],115:[2,129],123:[2,129],125:[2,129],126:[2,129],129:[2,129],130:[2,129],131:[2,129],132:[2,129],133:[2,129],134:[2,129]},{1:[2,130],6:[2,130],25:[2,130],26:[2,130],46:[2,130],51:[2,130],54:[2,130],69:[2,130],75:[2,130],83:[2,130],88:[2,130],90:[2,130],95:[2,130],99:[2,130],101:[2,130],102:[2,130],103:[2,130],107:[2,130],115:[2,130],123:[2,130],125:[2,130],126:[2,130],129:[2,130],130:[2,130],131:[2,130],132:[2,130],133:[2,130],134:[2,130]},{1:[2,163],6:[2,163],25:[2,163],26:[2,163],46:[2,163],51:[2,163],54:[2,163],69:[2,163],75:[2,163],83:[2,163],88:[2,163],90:[2,163],99:[2,163],101:[2,163],102:[2,163],103:[2,163],107:[2,163],115:[2,163],123:[2,163],125:[2,163],126:[2,163],129:[2,163],130:[2,163],131:[2,163],132:[2,163],133:[2,163],134:[2,163]},{5:301,25:[1,5]},{26:[1,302]},{6:[1,303],26:[2,169],118:[2,169],120:[2,169]},{8:304,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],46:[2,97],51:[2,97],54:[2,97],69:[2,97],75:[2,97],83:[2,97],88:[2,97],90:[2,97],99:[2,97],101:[2,97],102:[2,97],103:[2,97],107:[2,97],115:[2,97],123:[2,97],125:[2,97],126:[2,97],129:[2,97],130:[2,97],131:[2,97],132:[2,97],133:[2,97],134:[2,97]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],46:[2,133],51:[2,133],54:[2,133],63:[2,133],64:[2,133],65:[2,133],67:[2,133],69:[2,133],70:[2,133],71:[2,133],75:[2,133],81:[2,133],82:[2,133],83:[2,133],88:[2,133],90:[2,133],99:[2,133],101:[2,133],102:[2,133],103:[2,133],107:[2,133],115:[2,133],123:[2,133],125:[2,133],126:[2,133],129:[2,133],130:[2,133],131:[2,133],132:[2,133],133:[2,133],134:[2,133]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],46:[2,113],51:[2,113],54:[2,113],63:[2,113],64:[2,113],65:[2,113],67:[2,113],69:[2,113],70:[2,113],71:[2,113],75:[2,113],81:[2,113],82:[2,113],83:[2,113],88:[2,113],90:[2,113],99:[2,113],101:[2,113],102:[2,113],103:[2,113],107:[2,113],115:[2,113],123:[2,113],125:[2,113],126:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113],134:[2,113]},{6:[2,119],25:[2,119],26:[2,119],51:[2,119],83:[2,119],88:[2,119]},{6:[2,49],25:[2,49],26:[2,49],50:305,51:[1,223]},{6:[2,120],25:[2,120],26:[2,120],51:[2,120],83:[2,120],88:[2,120]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],46:[2,158],51:[2,158],54:[2,158],69:[2,158],75:[2,158],83:[2,158],88:[2,158],90:[2,158],99:[2,158],100:84,101:[2,158],102:[2,158],103:[2,158],106:85,107:[2,158],108:66,115:[1,306],123:[2,158],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,160],6:[2,160],25:[2,160],26:[2,160],46:[2,160],51:[2,160],54:[2,160],69:[2,160],75:[2,160],83:[2,160],88:[2,160],90:[2,160],99:[2,160],100:84,101:[2,160],102:[1,307],103:[2,160],106:85,107:[2,160],108:66,115:[2,160],123:[2,160],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,159],6:[2,159],25:[2,159],26:[2,159],46:[2,159],51:[2,159],54:[2,159],69:[2,159],75:[2,159],83:[2,159],88:[2,159],90:[2,159],99:[2,159],100:84,101:[2,159],102:[2,159],103:[2,159],106:85,107:[2,159],108:66,115:[2,159],123:[2,159],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[2,88],25:[2,88],26:[2,88],51:[2,88],75:[2,88]},{6:[2,49],25:[2,49],26:[2,49],50:308,51:[1,233]},{26:[1,309],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{26:[1,310]},{1:[2,166],6:[2,166],25:[2,166],26:[2,166],46:[2,166],51:[2,166],54:[2,166],69:[2,166],75:[2,166],83:[2,166],88:[2,166],90:[2,166],99:[2,166],101:[2,166],102:[2,166],103:[2,166],107:[2,166],115:[2,166],123:[2,166],125:[2,166],126:[2,166],129:[2,166],130:[2,166],131:[2,166],132:[2,166],133:[2,166],134:[2,166]},{26:[2,170],118:[2,170],120:[2,170]},{25:[2,125],51:[2,125],100:84,101:[1,62],103:[1,63],106:85,107:[1,65],108:66,123:[1,83],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[1,260],25:[1,261],26:[1,311]},{8:312,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{8:313,9:115,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,73:[1,67],76:[1,43],80:[1,28],85:[1,55],86:[1,56],87:[1,54],93:[1,38],97:[1,45],98:[1,53],100:39,101:[1,62],103:[1,63],104:40,105:[1,64],106:41,107:[1,65],108:66,116:[1,42],121:37,122:[1,61],124:[1,31],125:[1,32],126:[1,33],127:[1,34],128:[1,35]},{6:[1,271],25:[1,272],26:[1,314]},{6:[2,37],25:[2,37],26:[2,37],51:[2,37],75:[2,37]},{1:[2,164],6:[2,164],25:[2,164],26:[2,164],46:[2,164],51:[2,164],54:[2,164],69:[2,164],75:[2,164],83:[2,164],88:[2,164],90:[2,164],99:[2,164],101:[2,164],102:[2,164],103:[2,164],107:[2,164],115:[2,164],123:[2,164],125:[2,164],126:[2,164],129:[2,164],130:[2,164],131:[2,164],132:[2,164],133:[2,164],134:[2,164]},{6:[2,121],25:[2,121],26:[2,121],51:[2,121],83:[2,121],88:[2,121]},{1:[2,161],6:[2,161],25:[2,161],26:[2,161],46:[2,161],51:[2,161],54:[2,161],69:[2,161],75:[2,161],83:[2,161],88:[2,161],90:[2,161],99:[2,161],100:84,101:[2,161],102:[2,161],103:[2,161],106:85,107:[2,161],108:66,115:[2,161],123:[2,161],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{1:[2,162],6:[2,162],25:[2,162],26:[2,162],46:[2,162],51:[2,162],54:[2,162],69:[2,162],75:[2,162],83:[2,162],88:[2,162],90:[2,162],99:[2,162],100:84,101:[2,162],102:[2,162],103:[2,162],106:85,107:[2,162],108:66,115:[2,162],123:[2,162],125:[1,77],126:[1,76],129:[1,75],130:[1,78],131:[1,79],132:[1,80],133:[1,81],134:[1,82]},{6:[2,89],25:[2,89],26:[2,89],51:[2,89],75:[2,89]}],defaultActions:{57:[2,47],58:[2,48],72:[2,3],91:[2,103],186:[2,83]},parseError:function(a,b){throw new Error(a)},parse:function(a){function o(){var a;a=b.lexer.lex()||1,typeof a!="number"&&(a=b.symbols_[a]||a);return a}function n(a){c.length=c.length-2*a,d.length=d.length-a,e.length=e.length-a}var b=this,c=[0],d=[null],e=[],f=this.table,g="",h=0,i=0,j=0,k=2,l=1;this.lexer.setInput(a),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,typeof this.lexer.yylloc=="undefined"&&(this.lexer.yylloc={});var m=this.lexer.yylloc;e.push(m),typeof this.yy.parseError=="function"&&(this.parseError=this.yy.parseError);var p,q,r,s,t,u,v={},w,x,y,z;for(;;){r=c[c.length-1],this.defaultActions[r]?s=this.defaultActions[r]:(p==null&&(p=o()),s=f[r]&&f[r][p]);if(typeof s=="undefined"||!s.length||!s[0]){if(!j){z=[];for(w in f[r])this.terminals_[w]&&w>2&&z.push("'"+this.terminals_[w]+"'");var A="";this.lexer.showPosition?A="Parse error on line "+(h+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+z.join(", "):A="Parse error on line "+(h+1)+": Unexpected "+(p==1?"end of input":"'"+(this.terminals_[p]||p)+"'"),this.parseError(A,{text:this.lexer.match,token:this.terminals_[p]||p,line:this.lexer.yylineno,loc:m,expected:z})}if(j==3){if(p==l)throw new Error(A||"Parsing halted.");i=this.lexer.yyleng,g=this.lexer.yytext,h=this.lexer.yylineno,m=this.lexer.yylloc,p=o()}for(;;){if(k.toString()in f[r])break;if(r==0)throw new Error(A||"Parsing halted.");n(1),r=c[c.length-1]}q=p,p=k,r=c[c.length-1],s=f[r]&&f[r][k],j=3}if(s[0]instanceof Array&&s.length>1)throw new Error("Parse Error: multiple actions possible at state: "+r+", token: "+p);switch(s[0]){case 1:c.push(p),d.push(this.lexer.yytext),e.push(this.lexer.yylloc),c.push(s[1]),p=null,q?(p=q,q=null):(i=this.lexer.yyleng,g=this.lexer.yytext,h=this.lexer.yylineno,m=this.lexer.yylloc,j>0&&j--);break;case 2:x=this.productions_[s[1]][1],v.$=d[d.length-x],v._$={first_line:e[e.length-(x||1)].first_line,last_line:e[e.length-1].last_line,first_column:e[e.length-(x||1)].first_column,last_column:e[e.length-1].last_column},u=this.performAction.call(v,g,i,h,this.yy,s[1],d,e);if(typeof u!="undefined")return u;x&&(c=c.slice(0,-1*x*2),d=d.slice(0,-1*x),e=e.slice(0,-1*x)),c.push(this.productions_[s[1]][0]),d.push(v.$),e.push(v._$),y=f[c[c.length-2]][c[c.length-1]],c.push(y);break;case 3:return!0}}return!0}};return a}();typeof require!="undefined"&&typeof a!="undefined"&&(a.parser=b,a.parse=function(){return b.parse.apply(b,arguments)},a.main=function(b){if(!b[1])throw new Error("Usage: "+b[0]+" FILE");if(typeof process!="undefined")var c=require("fs").readFileSync(require("path").join(process.cwd(),b[1]),"utf8");else var d=require("file").path(require("file").cwd()),c=d.join(b[1]).read({charset:"utf-8"});return a.parser.parse(c)},typeof module!="undefined"&&require.main===module&&a.main(typeof process!="undefined"?process.argv.slice(1):require("system").args))},require["./scope"]=new function(){var a=this;(function(){var b,c,d,e;e=require("./helpers"),c=e.extend,d=e.last,a.Scope=b=function(){function a(b,c,d){this.parent=b,this.expressions=c,this.method=d,this.variables=[{name:"arguments",type:"arguments"}],this.positions={},this.parent||(a.root=this)}a.root=null,a.prototype.add=function(a,b,c){var d;if(this.shared&&!c)return this.parent.add(a,b,c);return typeof (d=this.positions[a])=="number"?this.variables[d].type=b:this.positions[a]=this.variables.push({name:a,type:b})-1},a.prototype.find=function(a,b){if(this.check(a,b))return!0;this.add(a,"var");return!1},a.prototype.parameter=function(a){if(!this.shared||!this.parent.check(a,!0))return this.add(a,"param")},a.prototype.check=function(a,b){var c,d;c=!!this.type(a);if(c||b)return c;return(d=this.parent)!=null?!!d.check(a):!!void 0},a.prototype.temporary=function(a,b){return a.length>1?"_"+a+(b>1?b:""):"_"+(b+parseInt(a,36)).toString(36).replace(/\d/g,"a")},a.prototype.type=function(a){var b,c,d,e;e=this.variables;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.name===a)return b.type}return null},a.prototype.freeVariable=function(a){var b,c;b=0;while(this.check(c=this.temporary(a,b)))b++;this.add(c,"var",!0);return c},a.prototype.assign=function(a,b){this.add(a,{value:b,assigned:!0});return this.hasAssignments=!0},a.prototype.hasDeclarations=function(){return!!this.declaredVariables().length},a.prototype.declaredVariables=function(){var a,b,c,d,e,f;a=[],b=[],f=this.variables;for(d=0,e=f.length;d<e;d++)c=f[d],c.type==="var"&&(c.name.charAt(0)==="_"?b:a).push(c.name);return a.sort().concat(b.sort())},a.prototype.assignedVariables=function(){var a,b,c,d,e;d=this.variables,e=[];for(b=0,c=d.length;b<c;b++)a=d[b],a.type.assigned&&e.push(""+a.name+" = "+a.type.value);return e};return a}()}).call(this)},require["./nodes"]=new function(){var a=this;(function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,$,_,ba,bb,bc,bd,be,bf,bg,bh,bi=Object.prototype.hasOwnProperty,bj=function(a,b){function d(){this.constructor=a}for(var c in b)bi.call(b,c)&&(a[c]=b[c]);d.prototype=b.prototype,a.prototype=new d,a.__super__=b.prototype;return a},bk=function(a,b){return function(){return a.apply(b,arguments)}},bl=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1};M=require("./scope").Scope,bh=require("./helpers"),Y=bh.compact,ba=bh.flatten,_=bh.extend,bc=bh.merge,Z=bh.del,be=bh.starts,$=bh.ends,bb=bh.last,a.extend=_,X=function(){return!0},D=function(){return!1},R=function(){return this},C=function(){this.negated=!this.negated;return this},a.Base=e=function(){function a(){}a.prototype.compile=function(a,b){var c;a=_({},a),b&&(a.level=b),c=this.unfoldSoak(a)||this,c.tab=a.indent;return a.level===z||!c.isStatement(a)?c.compileNode(a):c.compileClosure(a)},a.prototype.compileClosure=function(a){if(this.jumps()||this instanceof S)throw SyntaxError("cannot use a pure statement in an expression.");a.sharedScope=!0;return i.wrap(this).compileNode(a)},a.prototype.cache=function(a,b,c){var e,f;if(!this.isComplex()){e=b?this.compile(a,b):this;return[e,e]}e=new A(c||a.scope.freeVariable("ref")),f=new d(e,this);return b?[f.compile(a,b),e.value]:[f,e]},a.prototype.compileLoopReference=function(a,b){var c,d;c=d=this.compile(a,w),-Infinity<+c&&+c<Infinity||o.test(c)&&a.scope.check(c,!0)||(c=""+(d=a.scope.freeVariable(b))+" = "+c);return[c,d]},a.prototype.makeReturn=function(){return new K(this)},a.prototype.contains=function(a){var b;b=!1,this.traverseChildren(!1,function(c){if(a(c)){b=!0;return!1}});return b},a.prototype.containsType=function(a){return this instanceof a||this.contains(function(b){return b instanceof a})},a.prototype.lastNonComment=function(a){var b;b=a.length;while(b--)if(!(a[b]instanceof k))return a[b];return null},a.prototype.toString=function(a,b){var c;a==null&&(a=""),b==null&&(b=this.constructor.name),c="\n"+a+b,this.soak&&(c+="?"),this.eachChild(function(b){return c+=b.toString(a+Q)});return c},a.prototype.eachChild=function(a){var b,c,d,e,f,g,h,i;if(!this.children)return this;h=this.children;for(d=0,f=h.length;d<f;d++){b=h[d];if(this[b]){i=ba([this[b]]);for(e=0,g=i.length;e<g;e++){c=i[e];if(a(c)===!1)return this}}}return this},a.prototype.traverseChildren=function(a,b){return this.eachChild(function(c){if(b(c)===!1)return!1;return c.traverseChildren(a,b)})},a.prototype.invert=function(){return new F("!",this)},a.prototype.unwrapAll=function(){var a;a=this;while(a!==(a=a.unwrap()))continue;return a},a.prototype.children=[],a.prototype.isStatement=D,a.prototype.jumps=D,a.prototype.isComplex=X,a.prototype.isChainable=D,a.prototype.isAssignable=D,a.prototype.unwrap=R,a.prototype.unfoldSoak=D,a.prototype.assigns=D;return a}(),a.Block=f=function(){function a(a){this.expressions=Y(ba(a||[]))}bj(a,e),a.prototype.children=["expressions"],a.prototype.push=function(a){this.expressions.push(a);return this},a.prototype.pop=function(){return this.expressions.pop()},a.prototype.unshift=function(a){this.expressions.unshift(a);return this},a.prototype.unwrap=function(){return this.expressions.length===1?this.expressions[0]:this},a.prototype.isEmpty=function(){return!this.expressions.length},a.prototype.isStatement=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.isStatement(a))return!0}return!1},a.prototype.jumps=function(a){var b,c,d,e;e=this.expressions;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.jumps(a))return b}},a.prototype.makeReturn=function(){var a,b;b=this.expressions.length;while(b--){a=this.expressions[b];if(!(a instanceof k)){this.expressions[b]=a.makeReturn(),a instanceof K&&!a.expression&&this.expressions.splice(b,1);break}}return this},a.prototype.compile=function(b,c){b==null&&(b={});return b.scope?a.__super__.compile.call(this,b,c):this.compileRoot(b)},a.prototype.compileNode=function(b){var c,d,e,f,g,h,i;this.tab=b.indent,f=b.level===z,d=[],i=this.expressions;for(g=0,h=i.length;g<h;g++)e=i[g],e=e.unwrapAll(),e=e.unfoldSoak(b)||e,e instanceof a?d.push(e.compileNode(b)):f?(e.front=!0,c=e.compile(b),d.push(e.isStatement(b)?c:this.tab+c+";")):d.push(e.compile(b,w));if(f)return d.join("\n");c=d.join(", ")||"void 0";return d.length>1&&b.level>=w?"("+c+")":c},a.prototype.compileRoot=function(a){var b;a.indent=this.tab=a.bare?"":Q,a.scope=new M(null,this,null),a.level=z,b=this.compileWithDeclarations(a);return a.bare?b:"(function() {\n"+b+"\n}).call(this);\n"},a.prototype.compileWithDeclarations=function(a){var b,c,d,e,f,g,h,i,j,l;c=g="",l=this.expressions;for(f=0,j=l.length;f<j;f++){e=l[f],e=e.unwrap();if(!(e instanceof k||e instanceof A))break}a=bc(a,{level:z}),f&&(h=this.expressions.splice(f,this.expressions.length),c=this.compileNode(a),this.expressions=h),g=this.compileNode(a),i=a.scope,i.expressions===this&&(d=a.scope.hasDeclarations(),b=i.hasAssignments,(d||b)&&f&&(c+="\n"),d&&(c+=""+this.tab+"var "+i.declaredVariables().join(", ")+";\n"),b&&(c+=""+this.tab+"var "+bd(i.assignedVariables().join(", "),this.tab)+";\n"));return c+g},a.wrap=function(b){if(b.length===1&&b[0]instanceof a)return b[0];return new a(b)};return a}(),a.Literal=A=function(){function a(a){this.value=a}bj(a,e),a.prototype.makeReturn=function(){return this.isStatement()?this:new K(this)},a.prototype.isAssignable=function(){return o.test(this.value)},a.prototype.isStatement=function(){var a;return(a=this.value)==="break"||a==="continue"||a==="debugger"},a.prototype.isComplex=D,a.prototype.assigns=function(a){return a===this.value},a.prototype.jumps=function(a){if(!this.isStatement())return!1;return!a||!(a.loop||a.block&&this.value!=="continue")?this:!1},a.prototype.compileNode=function(a){var b;b=this.isUndefined?a.level>=u?"(void 0)":"void 0":this.value.reserved?'"'+this.value+'"':this.value;return this.isStatement()?""+this.tab+b+";":b},a.prototype.toString=function(){return' "'+this.value+'"'};return a}(),a.Return=K=function(){function a(a){a&&!a.unwrap().isUndefined&&(this.expression=a)}bj(a,e),a.prototype.children=["expression"],a.prototype.isStatement=X,a.prototype.makeReturn=R,a.prototype.jumps=R,a.prototype.compile=function(b,c){var d,e;d=(e=this.expression)!=null?e.makeReturn():void 0;return!d||d instanceof a?a.__super__.compile.call(this,b,c):d.compile(b,c)},a.prototype.compileNode=function(a){return this.tab+("return"+(this.expression?" "+this.expression.compile(a,y):"")+";")};return a}(),a.Value=V=function(){function a(b,c,d){if(!c&&b instanceof a)return b;this.base=b,this.properties=c||[],d&&(this[d]=!0);return this}bj(a,e),a.prototype.children=["base","properties"],a.prototype.push=function(a){this.properties.push(a);return this},a.prototype.hasProperties=function(){return!!this.properties.length},a.prototype.isArray=function(){return!this.properties.length&&this.base instanceof c},a.prototype.isComplex=function(){return this.hasProperties()||this.base.isComplex()},a.prototype.isAssignable=function(){return this.hasProperties()||this.base.isAssignable()},a.prototype.isSimpleNumber=function(){return this.base instanceof A&&L.test(this.base.value)},a.prototype.isAtomic=function(){var a,b,c,d;d=this.properties.concat(this.base);for(b=0,c=d.length;b<c;b++){a=d[b];if(a.soak||a instanceof g)return!1}return!0},a.prototype.isStatement=function(a){return!this.properties.length&&this.base.isStatement(a)},a.prototype.assigns=function(a){return!this.properties.length&&this.base.assigns(a)},a.prototype.jumps=function(a){return!this.properties.length&&this.base.jumps(a)},a.prototype.isObject=function(a){if(this.properties.length)return!1;return this.base instanceof E&&(!a||this.base.generated)},a.prototype.isSplice=function(){return bb(this.properties)instanceof N},a.prototype.makeReturn=function(){return this.properties.length?a.__super__.makeReturn.call(this):this.base.makeReturn()},a.prototype.unwrap=function(){return this.properties.length?this:this.base},a.prototype.cacheReference=function(b){var c,e,f,g;f=bb(this.properties);if(this.properties.length<2&&!this.base.isComplex()&&(f!=null?!f.isComplex():!void 0))return[this,this];c=new a(this.base,this.properties.slice(0,-1)),c.isComplex()&&(e=new A(b.scope.freeVariable("base")),c=new a(new H(new d(e,c))));if(!f)return[c,e];f.isComplex()&&(g=new A(b.scope.freeVariable("name")),f=new t(new d(g,f.index)),g=new t(g));return[c.push(f),new a(e||c.base,[g||f])]},a.prototype.compileNode=function(a){var b,c,d,e,f;this.base.front=this.front,d=this.properties,b=this.base.compile(a,d.length?u:null),(this.base instanceof H||d.length)&&L.test(b)&&(b=""+b+".");for(e=0,f=d.length;e<f;e++)c=d[e],b+=c.compile(a);return b},a.prototype.unfoldSoak=function(b){var c;if(this.unfoldedSoak!=null)return this.unfoldedSoak;c=bk(function(){var c,e,f,g,h,i,j,k;if(f=this.base.unfoldSoak(b)){Array.prototype.push.apply(f.body.properties,this.properties);return f}k=this.properties;for(e=0,j=k.length;e<j;e++){g=k[e];if(g.soak){g.soak=!1,c=new a(this.base,this.properties.slice(0,e)),i=new a(this.base,this.properties.slice(e)),c.isComplex()&&(h=new A(b.scope.freeVariable("ref")),c=new H(new d(h,c)),i.base=h);return new r(new l(c),i,{soak:!0})}}return null},this)();return this.unfoldedSoak=c||!1};return a}(),a.Comment=k=function(){function a(a){this.comment=a}bj(a,e),a.prototype.isStatement=X,a.prototype.makeReturn=R,a.prototype.compileNode=function(a,b){var c;c="/*"+bd(this.comment,this.tab)+"*/",(b||a.level)===z&&(c=a.indent+c);return c};return a}(),a.Call=g=function(){function a(a,b,c){this.args=b!=null?b:[],this.soak=c,this.isNew=!1,this.isSuper=a==="super",this.variable=this.isSuper?null:a}bj(a,e),a.prototype.children=["variable","args"],a.prototype.newInstance=function(){var b;b=this.variable.base||this.variable,b instanceof a&&!b.isNew?b.newInstance():this.isNew=!0;return this},a.prototype.superReference=function(a){var c,d;c=a.scope.method;if(!c)throw SyntaxError("cannot call super outside of a function.");d=c.name;if(d==null)throw SyntaxError("cannot call super on an anonymous function.");return c.klass?(new V(new A(c.klass),[new b(new A("__super__")),new b(new A(d))])).compile(a):""+d+".__super__.constructor"},a.prototype.unfoldSoak=function(b){var c,d,e,f,g,h,i,j,k;if(this.soak){if(this.variable){if(d=bf(b,this,"variable"))return d;j=(new V(this.variable)).cacheReference(b),e=j[0],g=j[1]}else e=new A(this.superReference(b)),g=new V(e);g=new a(g,this.args),g.isNew=this.isNew,e=new A("typeof "+e.compile(b)+' === "function"');return new r(e,new V(g),{soak:!0})}c=this,f=[];for(;;){if(c.variable instanceof a){f.push(c),c=c.variable;continue}if(!(c.variable instanceof V))break;f.push(c);if(!((c=c.variable.base)instanceof a))break}k=f.reverse();for(h=0,i=k.length;h<i;h++)c=k[h],d&&(c.variable instanceof a?c.variable=d:c.variable.base=d),d=bf(b,c,"variable");return d},a.prototype.filterImplicitObjects=function(a){var b,c,e,f,g,h,i,j,l,m;c=[];for(h=0,j=a.length;h<j;h++){b=a[h];if(!((typeof b.isObject=="function"?b.isObject():void 0)&&b.base.generated)){c.push(b);continue}e=null,m=b.base.properties;for(i=0,l=m.length;i<l;i++)f=m[i],f instanceof d||f instanceof k?(e||c.push(e=new E(g=[],!0)),g.push(f)):(c.push(f),e=null)}return c},a.prototype.compileNode=function(a){var b,c,d,e;(e=this.variable)!=null&&(e.front=this.front);if(d=O.compileSplattedArray(a,this.args,!0))return this.compileSplat(a,d);c=this.filterImplicitObjects(this.args),c=function(){var d,e,f;f=[];for(d=0,e=c.length;d<e;d++)b=c[d],f.push(b.compile(a,w));return f}().join(", ");return this.isSuper?this.superReference(a)+(".call(this"+(c&&", "+c)+")"):(this.isNew?"new ":"")+this.variable.compile(a,u)+("("+c+")")},a.prototype.compileSuper=function(a,b){return""+this.superReference(b)+".call(this"+(a.length?", ":"")+a+")"},a.prototype.compileSplat=function(a,b){var c,d,e,f,g;if(this.isSuper)return""+this.superReference(a)+".apply(this, "+b+")";if(this.isNew){e=this.tab+Q;return"(function(func, args, ctor) {\n"+e+"ctor.prototype = func.prototype;\n"+e+"var child = new ctor, result = func.apply(child, args);\n"+e+'return typeof result === "object" ? result : child;\n'+this.tab+"})("+this.variable.compile(a,w)+", "+b+", function() {})"}c=new V(this.variable),(f=c.properties.pop())&&c.isComplex()?(g=a.scope.freeVariable("ref"),d="("+g+" = "+c.compile(a,w)+")"+f.compile(a)):(d=c.compile(a,u),L.test(d)&&(d="("+d+")"),f?(g=d,d+=f.compile(a)):g="null");return""+d+".apply("+g+", "+b+")"};return a}(),a.Extends=m=function(){function a(a,b){this.child=a,this.parent=b}bj(a,e),a.prototype.children=["child","parent"],a.prototype.compile=function(a){bg("hasProp");return(new g(new V(new A(bg("extends"))),[this.child,this.parent])).compile(a)};return a}(),a.Access=b=function(){function a(a,b){this.name=a,this.name.asKey=!0,this.proto=b==="proto"?".prototype":"",this.soak=b==="soak"}bj(a,e),a.prototype.children=["name"],a.prototype.compile=function(a){var b;b=this.name.compile(a);return this.proto+(o.test(b)?"."+b:"["+b+"]")},a.prototype.isComplex=D;return a}(),a.Index=t=function(){function a(a){this.index=a}bj(a,e),a.prototype.children=["index"],a.prototype.compile=function(a){return(this.proto?".prototype":"")+("["+this.index.compile(a,y)+"]")},a.prototype.isComplex=function(){return this.index.isComplex()};return a}(),a.Range=J=function(){function a(a,b,c){this.from=a,this.to=b,this.exclusive=c==="exclusive",this.equals=this.exclusive?"":"="}bj(a,e),a.prototype.children=["from","to"],a.prototype.compileVariables=function(a){var b,c,d,e,f;a=bc(a,{top:!0}),c=this.from.cache(a,w),this.fromC=c[0],this.fromVar=c[1],d=this.to.cache(a,w),this.toC=d[0],this.toVar=d[1];if(b=Z(a,"step"))e=b.cache(a,w),this.step=e[0],this.stepVar=e[1];f=[this.fromVar.match(L),this.toVar.match(L)],this.fromNum=f[0],this.toNum=f[1];if(this.stepVar)return this.stepNum=this.stepVar.match(L)},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i,j,k,l,m;this.fromVar||this.compileVariables(a);if(!a.index)return this.compileArray(a);g=this.fromNum&&this.toNum,f=Z(a,"index"),k=""+f+" = "+this.fromC,this.toC!==this.toVar&&(k+=", "+this.toC),this.step!==this.stepVar&&(k+=", "+this.step),l=[""+f+" <"+this.equals,""+f+" >"+this.equals],h=l[0],e=l[1],c=this.stepNum?c=+this.stepNum>0?""+h+" "+this.toVar:""+e+" "+this.toVar:g?(m=[+this.fromNum,+this.toNum],d=m[0],j=m[1],m,c=d<=j?""+h+" "+j:""+e+" "+j):(b=""+this.fromVar+" <= "+this.toVar,c=""+b+" ? "+h+" "+this.toVar+" : "+e+" "+this.toVar),i=this.stepVar?""+f+" += "+this.stepVar:g?d<=j?""+f+"++":""+f+"--":""+b+" ? "+f+"++ : "+f+"--";return""+k+"; "+c+"; "+i},a.prototype.compileArray=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p;if(this.fromNum&&this.toNum&&Math.abs(this.fromNum-this.toNum)<=20){j=function(){p=[];for(var a=n=+this.fromNum,b=+this.toNum;n<=b?a<=b:a>=b;n<=b?a++:a--)p.push(a);return p}.apply(this),this.exclusive&&j.pop();return"["+j.join(", ")+"]"}g=this.tab+Q,f=a.scope.freeVariable("i"),k=a.scope.freeVariable("results"),i="\n"+g+k+" = [];",this.fromNum&&this.toNum?(a.index=f,c=this.compileNode(a)):(l=""+f+" = "+this.fromC+(this.toC!==this.toVar?", "+this.toC:""),d=""+this.fromVar+" <= "+this.toVar,c="var "+l+"; "+d+" ? "+f+" <"+this.equals+" "+this.toVar+" : "+f+" >"+this.equals+" "+this.toVar+"; "+d+" ? "+f+"++ : "+f+"--"),h="{ "+k+".push("+f+"); }\n"+g+"return "+k+";\n"+a.indent,e=function(a){return a!=null?a.contains(function(a){return a instanceof A&&a.value==="arguments"&&!a.asKey}):void 0};if(e(this.from)||e(this.to))b=", arguments";return"(function() {"+i+"\n"+g+"for ("+c+")"+h+"}).apply(this"+(b!=null?b:"")+")"};return a}(),a.Slice=N=function(){function a(b){this.range=b,a.__super__.constructor.call(this)}bj(a,e),a.prototype.children=["range"],a.prototype.compileNode=function(a){var b,c,d,e,f,g;g=this.range,e=g.to,c=g.from,d=c&&c.compile(a,y)||"0",b=e&&e.compile(a,y),e&&(!!this.range.exclusive||+b!==-1)&&(f=", "+(this.range.exclusive?b:L.test(b)?(+b+1).toString():"("+b+" + 1) || 9e9"));return".slice("+d+(f||"")+")"};return a}(),a.Obj=E=function(){function a(a,b){this.generated=b!=null?b:!1,this.objects=this.properties=a||[]}bj(a,e),a.prototype.children=["properties"],a.prototype.compileNode=function(a){var b,c,e,f,g,h,i,j,l,m,n;l=this.properties;if(!l.length)return this.front?"({})":"{}";if(this.generated)for(m=0,n=l.length;m<n;m++){h=l[m];if(h instanceof V)throw new Error("cannot have an implicit value in an implicit object")}c=a.indent+=Q,g=this.lastNonComment(this.properties),l=function(){var h,i;i=[];for(b=0,h=l.length;b<h;b++)j=l[b],f=b===l.length-1?"":j===g||j instanceof k?"\n":",\n",e=j instanceof k?"":c,j instanceof V&&j["this"]&&(j=new d(j.properties[0].name,j,"object")),j instanceof k||(j instanceof d||(j=new d(j,j,"object")),(j.variable.base||j.variable).asKey=!0),i.push(e+j.compile(a,z)+f);return i}(),l=l.join(""),i="{"+(l&&"\n"+l+"\n"+this.tab)+"}";return this.front?"("+i+")":i},a.prototype.assigns=function(a){var b,c,d,e;e=this.properties;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Arr=c=function(){function a(a){this.objects=a||[]}bj(a,e),a.prototype.children=["objects"],a.prototype.filterImplicitObjects=g.prototype.filterImplicitObjects,a.prototype.compileNode=function(a){var b,c,d;if(!this.objects.length)return"[]";a.indent+=Q,d=this.filterImplicitObjects(this.objects);if(b=O.compileSplattedArray(a,d))return b;b=function(){var b,e,f;f=[];for(b=0,e=d.length;b<e;b++)c=d[b],f.push(c.compile(a,w));return f}().join(", ");return b.indexOf("\n")>=0?"[\n"+a.indent+b+"\n"+this.tab+"]":"["+b+"]"},a.prototype.assigns=function(a){var b,c,d,e;e=this.objects;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.assigns(a))return!0}return!1};return a}(),a.Class=h=function(){function a(a,b,c){this.variable=a,this.parent=b,this.body=c!=null?c:new f,this.boundFuncs=[],this.body.classBody=!0}bj(a,e),a.prototype.children=["variable","parent","body"],a.prototype.determineName=function(){var a,c;if(!this.variable)return null;a=(c=bb(this.variable.properties))?c instanceof b&&c.name.value:this.variable.base.value;return a&&(a=o.test(a)&&a)},a.prototype.setContext=function(a){return this.body.traverseChildren(!1,function(b){if(b.classBody)return!1;if(b instanceof A&&b.value==="this")return b.value=a;if(b instanceof j){b.klass=a;if(b.bound)return b.context=a}})},a.prototype.addBoundFunctions=function(a){var c,d,e,f,g,h;if(this.boundFuncs.length){g=this.boundFuncs,h=[];for(e=0,f=g.length;e<f;e++)c=g[e],d=(new V(new A("this"),[new b(c)])).compile(a),h.push(this.ctor.body.unshift(new A(""+d+" = "+bg("bind")+"("+d+", this)")));return h}},a.prototype.addProperties=function(a,c,e){var f,g,h,i,k;k=a.base.properties.slice(0),h=function(){var a;a=[];while(f=k.shift()){if(f instanceof d){g=f.variable.base,delete f.context,i=f.value;if(g.value==="constructor"){if(this.ctor)throw new Error("cannot define more than one constructor in a class");if(i.bound)throw new Error("cannot define a constructor as a bound function");i instanceof j?f=this.ctor=i:(this.externalCtor=e.scope.freeVariable("class"),f=new d(new A(this.externalCtor),i))}else f.variable["this"]||(f.variable=new V(new A(c),[new b(g,"proto")])),i instanceof j&&i.bound&&(this.boundFuncs.push(g),i.bound=!1)}a.push(f)}return a}.call(this);return Y(h)},a.prototype.walkBody=function(b,c){return this.traverseChildren(!1,bk(function(d){var e,g,h,i,j;if(d instanceof a)return!1;if(d instanceof f){j=e=d.expressions;for(g=0,i=j.length;g<i;g++)h=j[g],h instanceof V&&h.isObject(!0)&&(e[g]=this.addProperties(h,b,c));return d.expressions=e=ba(e)}},this))},a.prototype.ensureConstructor=function(a){this.ctor||(this.ctor=new j,this.parent&&this.ctor.body.push(new A(""+a+".__super__.constructor.apply(this, arguments)")),this.externalCtor&&this.ctor.body.push(new A(""+this.externalCtor+".apply(this, arguments)")),this.body.expressions.unshift(this.ctor)),this.ctor.ctor=this.ctor.name=a,this.ctor.klass=null;return this.ctor.noReturn=!0},a.prototype.compileNode=function(a){var b,c,e,f;b=this.determineName(),f=b||this.name||"_Class",e=new A(f),this.setContext(f),this.walkBody(f,a),this.ensureConstructor(f),this.parent&&this.body.expressions.unshift(new m(e,this.parent)),this.ctor instanceof j||this.body.expressions.unshift(this.ctor),this.body.expressions.push(e),this.addBoundFunctions(a),c=new H(i.wrap(this.body),!0),this.variable&&(c=new d(this.variable,c));return c.compile(a)};return a}(),a.Assign=d=function(){function a(a,b,c,d){this.variable=a,this.value=b,this.context=c,this.param=d&&d.param}bj(a,e),a.prototype.children=["variable","value"],a.prototype.isStatement=function(a){return(a!=null?a.level:void 0)===z&&this.context!=null&&bl.call(this.context,"?")>=0},a.prototype.assigns=function(a){return this[this.context==="object"?"value":"variable"].assigns(a)},a.prototype.unfoldSoak=function(a){return bf(a,this,"variable")},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i;if(b=this.variable instanceof V){if(this.variable.isArray()||this.variable.isObject())return this.compilePatternMatch(a);if(this.variable.isSplice())return this.compileSplice(a);if((f=this.context)==="||="||f==="&&="||f==="?=")return this.compileConditional(a)}d=this.variable.compile(a,w);if(!this.context&&!this.variable.isAssignable())throw SyntaxError('"'+this.variable.compile(a)+'" cannot be assigned.');this.context||b&&(this.variable.namespaced||this.variable.hasProperties())||(this.param?a.scope.add(d,"var"):a.scope.find(d)),this.value instanceof j&&(c=B.exec(d))&&(c[1]&&(this.value.klass=c[1]),this.value.name=(g=(h=(i=c[2])!=null?i:c[3])!=null?h:c[4])!=null?g:c[5]),e=this.value.compile(a,w);if(this.context==="object")return""+d+": "+e;e=d+(" "+(this.context||"=")+" ")+e;return a.level<=w?e:"("+e+")"},a.prototype.compilePatternMatch=function(c){var d,e,f,g,h,i,j,k,l,m,n,p,q,r,s,u,v,y,B,C,D,E;r=c.level===z,u=this.value,l=this.variable.base.objects;if(!(m=l.length)){f=u.compile(c);return c.level>=x?"("+f+")":f}i=this.variable.isObject();if(r&&m===1&&!((k=l[0])instanceof O)){k instanceof a?(B=k,h=B.variable.base,k=B.value):k.base instanceof H?(C=(new V(k.unwrapAll())).cacheReference(c),k=C[0],h=C[1]):h=i?k["this"]?k.properties[0].name:k:new A(0),d=o.test(h.unwrap().value||0),u=new V(u),u.properties.push(new(d?b:t)(h));return(new a(k,u,null,{param:this.param})).compile(c,z)}v=u.compile(c,w),e=[],q=!1;if(!o.test(v)||this.variable.assigns(v))e.push(""+(n=c.scope.freeVariable("ref"))+" = "+v),v=n;for(g=0,y=l.length;g<y;g++){k=l[g],h=g,i&&(k instanceof a?(D=k,h=D.variable.base,k=D.value):k.base instanceof H?(E=(new V(k.unwrapAll())).cacheReference(c),k=E[0],h=E[1]):h=k["this"]?k.properties[0].name:k);if(!q&&k instanceof O)s=""+m+" <= "+v+".length ? "+bg("slice")+".call("+v+", "+g,(p=m-g-1)?(j=c.scope.freeVariable("i"),s+=", "+j+" = "+v+".length - "+p+") : ("+j+" = "+g+", [])"):s+=") : []",s=new A(s),q=""+j+"++";else{if(k instanceof O){k=k.name.compile(c);throw SyntaxError("multiple splats are disallowed in an assignment: "+k+" ...")}typeof h=="number"?(h=new A(q||h),d=!1):d=i&&o.test(h.unwrap().value||0),s=new V(new A(v),[new(d?b:t)(h)])}e.push((new a(k,s,null,{param:this.param})).compile(c,z))}r||e.push(v),f=e.join(", ");return c.level<w?f:"("+f+")"},a.prototype.compileConditional=function(b){var c,d,e;e=this.variable.cacheReference(b),c=e[0],d=e[1],bl.call(this.context,"?")>=0&&(b.isExistentialEquals=!0);return(new F(this.context.slice(0,-1),c,new a(d,this.value,"="))).compile(b)},a.prototype.compileSplice=function(a){var b,c,d,e,f,g,h,i,j,k,l,m;k=this.variable.properties.pop().range,d=k.from,h=k.to,c=k.exclusive,g=this.variable.compile(a),l=(d!=null?d.cache(a,x):void 0)||["0","0"],e=l[0],f=l[1],h?(d!=null?d.isSimpleNumber():void 0)&&h.isSimpleNumber()?(h=+h.compile(a)- +f,c||(h+=1)):(h=h.compile(a)+" - "+f,c||(h+=" + 1")):h="9e9",m=this.value.cache(a,w),i=m[0],j=m[1],b="[].splice.apply("+g+", ["+e+", "+h+"].concat("+i+")), "+j;return a.level>z?"("+b+")":b};return a}(),a.Code=j=function(){function a(a,b,c){this.params=a||[],this.body=b||new f,this.bound=c==="boundfunc",this.bound&&(this.context="this")}bj(a,e),a.prototype.children=["params","body"],a.prototype.isStatement=function(){return!!this.ctor},a.prototype.jumps=D,a.prototype.compileNode=function(a){var b,e,f,g,h,i,j,k,l,m,n,o,p,q,s,t,v,w,x,y,z,B,C,D;a.scope=new M(a.scope,this.body,this),a.scope.shared=Z(a,"sharedScope"),a.indent+=Q,delete a.bare,o=[],e=[],z=this.params;for(q=0,v=z.length;q<v;q++){j=z[q];if(j.splat){B=this.params;for(s=0,w=B.length;s<w;s++)i=B[s],i.name.value&&a.scope.add(i.name.value,"var",!0);l=new d(new V(new c(function(){var b,c,d,e;d=this.params,e=[];for(b=0,c=d.length;b<c;b++)i=d[b],e.push(i.asReference(a));return e}.call(this))),new V(new A("arguments")));break}}C=this.params;for(t=0,x=C.length;t<x;t++)j=C[t],j.isComplex()?(n=k=j.asReference(a),j.value&&(n=new F("?",k,j.value)),e.push(new d(new V(j.name),n,"=",{param:!0}))):(k=j,j.value&&(h=new A(k.name.value+" == null"),n=new d(new V(j.name),j.value,"="),e.push(new r(h,n)))),l||o.push(k);p=this.body.isEmpty(),l&&e.unshift(l),e.length&&(D=this.body.expressions).unshift.apply(D,e);if(!l)for(f=0,y=o.length;f<y;f++)m=o[f],a.scope.parameter(o[f]=m.compile(a));!p&&!this.noReturn&&this.body.makeReturn(),g=a.indent,b="function",this.ctor&&(b+=" "+this.name),b+="("+o.join(", ")+") {",this.body.isEmpty()||(b+="\n"+this.body.compileWithDeclarations(a)+"\n"+this.tab),b+="}";if(this.ctor)return this.tab+b;if(this.bound)return bg("bind")+("("+b+", "+this.context+")");return this.front||a.level>=u?"("+b+")":b},a.prototype.traverseChildren=function(b,c){if(b)return a.__super__.traverseChildren.call(this,b,c)};return a}(),a.Param=G=function(){function a(a,b,c){this.name=a,this.value=b,this.splat=c}bj(a,e),a.prototype.children=["name","value"],a.prototype.compile=function(a){return this.name.compile(a,w)},a.prototype.asReference=function(a){var b;if(this.reference)return this.reference;b=this.name,b["this"]?(b=b.properties[0].name,b.value.reserved&&(b=new A("_"+b.value))):b.isComplex()&&(b=new A(a.scope.freeVariable("arg"))),b=new V(b),this.splat&&(b=new O(b));return this.reference=b},a.prototype.isComplex=function(){return this.name.isComplex()};return a}(),a.Splat=O=function(){function a(a){this.name=a.compile?a:new A(a)}bj(a,e),a.prototype.children=["name"],a.prototype.isAssignable=X,a.prototype.assigns=function(a){return this.name.assigns(a)},a.prototype.compile=function(a){return this.index!=null?this.compileParam(a):this.name.compile(a)},a.compileSplattedArray=function(b,c,d){var e,f,g,h,i,j,k;i=-1;while((j=c[++i])&&!(j instanceof a))continue;if(i>=c.length)return"";if(c.length===1){g=c[0].compile(b,w);if(d)return g;return""+bg("slice")+".call("+g+")"}e=c.slice(i);for(h=0,k=e.length;h<k;h++)j=e[h],g=j.compile(b,w),e[h]=j instanceof a?""+bg("slice")+".call("+g+")":"["+g+"]";if(i===0)return e[0]+(".concat("+e.slice(1).join(", ")+")");f=function(){var a,d,e,f;e=c.slice(0,i),f=[];for(a=0,d=e.length;a<d;a++)j=e[a],f.push(j.compile(b,w));return f}();return"["+f.join(", ")+"].concat("+e.join(", ")+")"};return a}(),a.While=W=function(){function a(a,b){this.condition=(b!=null?b.invert:void 0)?a.invert():a,this.guard=b!=null?b.guard:void 0}bj(a,e),a.prototype.children=["condition","guard","body"],a.prototype.isStatement=X,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.addBody=function(a){this.body=a;return this},a.prototype.jumps=function(){var a,b,c,d;a=this.body.expressions;if(!a.length)return!1;for(c=0,d=a.length;c<d;c++){b=a[c];if(b.jumps({loop:!0}))return b}return!1},a.prototype.compileNode=function(a){var b,c,d,e;a.indent+=Q,e="",b=this.body;if(b.isEmpty())b="";else{if(a.level>z||this.returns)d=a.scope.freeVariable("results"),e=""+this.tab+d+" = [];\n",b&&(b=I.wrap(d,b));this.guard&&(b=f.wrap([new r(this.guard,b)])),b="\n"+b.compile(a,z)+"\n"+this.tab}c=e+this.tab+("while ("+this.condition.compile(a,y)+") {"+b+"}"),this.returns&&(c+="\n"+this.tab+"return "+d+";");return c};return a}(),a.Op=F=function(){function c(b,c,d,e){var f;if(b==="in")return new s(c,d);if(b==="do"){f=new g(c,c.params||[]),f["do"]=!0;return f}if(b==="new"){if(c instanceof g&&!c["do"]&&!c.isNew)return c.newInstance();if(c instanceof j&&c.bound||c["do"])c=new H(c)}this.operator=a[b]||b,this.first=c,this.second=d,this.flip=!!e;return this}var a,b;bj(c,e),a={"==":"===","!=":"!==",of:"in"},b={"!==":"===","===":"!=="},c.prototype.children=["first","second"],c.prototype.isSimpleNumber=D,c.prototype.isUnary=function(){return!this.second},c.prototype.isComplex=function(){var a;return!this.isUnary()||(a=this.operator)!=="+"&&a!=="-"||this.first.isComplex()},c.prototype.isChainable=function(){var a;return(a=this.operator)==="<"||a===">"||a===">="||a==="<="||a==="==="||a==="!=="},c.prototype.invert=function(){var a,d,e,f,g;if(this.isChainable()&&this.first.isChainable()){a=!0,d=this;while(d&&d.operator)a&&(a=d.operator in b),d=d.first;if(!a)return(new H(this)).invert();d=this;while(d&&d.operator)d.invert=!d.invert,d.operator=b[d.operator],d=d.first;return this}if(f=b[this.operator]){this.operator=f,this.first.unwrap()instanceof c&&this.first.invert();return this}return this.second?(new H(this)).invert():this.operator==="!"&&(e=this.first.unwrap())instanceof c&&((g=e.operator)==="!"||g==="in"||g==="instanceof")?e:new c("!",this)},c.prototype.unfoldSoak=function(a){var b;return((b=this.operator)==="++"||b==="--"||b==="delete")&&bf(a,this,"first")},c.prototype.compileNode=function(a){var b;if(this.isUnary())return this.compileUnary(a);if(this.isChainable()&&this.first.isChainable())return this.compileChain(a);if(this.operator==="?")return this.compileExistence(a);this.first.front=this.front,b=this.first.compile(a,x)+" "+this.operator+" "+this.second.compile(a,x);return a.level<=x?b:"("+b+")"},c.prototype.compileChain=function(a){var b,c,d,e;e=this.first.second.cache(a),this.first.second=e[0],d=e[1],c=this.first.compile(a,x),b=""+c+" "+(this.invert?"&&":"||")+" "+d.compile(a)+" "+this.operator+" "+this.second.compile(a,x);return"("+b+")"},c.prototype.compileExistence=function(a){var b,c;this.first.isComplex()?(c=new A(a.scope.freeVariable("ref")),b=new H(new d(c,this.first))):(b=this.first,c=b);return(new r(new l(b),c,{type:"if"})).addElse(this.second).compile(a)},c.prototype.compileUnary=function(a){var b,d;d=[b=this.operator],(b==="new"||b==="typeof"||b==="delete"||(b==="+"||b==="-")&&this.first instanceof c&&this.first.operator===b)&&d.push(" "),b==="new"&&this.first.isStatement(a)&&(this.first=new H(this.first)),d.push(this.first.compile(a,x)),this.flip&&d.reverse();return d.join("")},c.prototype.toString=function(a){return c.__super__.toString.call(this,a,this.constructor.name+" "+this.operator)};return c}(),a.In=s=function(){function a(a,b){this.object=a,this.array=b}bj(a,e),a.prototype.children=["object","array"],a.prototype.invert=C,a.prototype.compileNode=function(a){var b,c,d,e,f;if(this.array instanceof V&&this.array.isArray()){f=this.array.base.objects;for(d=0,e=f.length;d<e;d++){c=f[d];if(c instanceof O){b=!0;break}}if(!b)return this.compileOrTest(a)}return this.compileLoopTest(a)},a.prototype.compileOrTest=function(a){var b,c,d,e,f,g,h,i,j;i=this.object.cache(a,x),g=i[0],f=i[1],j=this.negated?[" !== "," && "]:[" === "," || "],b=j[0],c=j[1],h=function(){var c,h,i;h=this.array.base.objects,i=[];for(d=0,c=h.length;d<c;d++)e=h[d],i.push((d?f:g)+b+e.compile(a,x));return i}.call(this);if(h.length===0)return"false";h=h.join(c);return a.level<x?h:"("+h+")"},a.prototype.compileLoopTest=function(a){var b,c,d,e;e=this.object.cache(a,w),d=e[0],c=e[1],b=bg("indexOf")+(".call("+this.array.compile(a,w)+", "+c+") ")+(this.negated?"< 0":">= 0");if(d===c)return b;b=d+", "+b;return a.level<w?b:"("+b+")"},a.prototype.toString=function(b){return a.__super__.toString.call(this,b,this.constructor.name+(this.negated?"!":""))};return a}(),a.Try=T=function(){function a(a,b,c,d){this.attempt=a,this.error=b,this.recovery=c,this.ensure=d}bj(a,e),a.prototype.children=["attempt","recovery","ensure"],a.prototype.isStatement=X,a.prototype.jumps=function(a){var b;return this.attempt.jumps(a)||((b=this.recovery)!=null?b.jumps(a):void 0)},a.prototype.makeReturn=function(){this.attempt&&(this.attempt=this.attempt.makeReturn()),this.recovery&&(this.recovery=this.recovery.makeReturn());return this},a.prototype.compileNode=function(a){var b,c;a.indent+=Q,c=this.error?" ("+this.error.compile(a)+") ":" ",b=this.recovery?(a.scope.add(this.error.value,"param")," catch"+c+"{\n"+this.recovery.compile(a,z)+"\n"+this.tab+"}"):!this.ensure&&!this.recovery?" catch (_e) {}":void 0;return""+this.tab+"try {\n"+this.attempt.compile(a,z)+"\n"+this.tab+"}"+(b||"")+(this.ensure?" finally {\n"+this.ensure.compile(a,z)+"\n"+this.tab+"}":"")};return a}(),a.Throw=S=function(){function a(a){this.expression=a}bj(a,e),a.prototype.children=["expression"],a.prototype.isStatement=X,a.prototype.jumps=D,a.prototype.makeReturn=R,a.prototype.compileNode=function(a){return this.tab+("throw "+this.expression.compile(a)+";")};return a}(),a.Existence=l=function(){function a(a){this.expression=a}bj(a,e),a.prototype.children=["expression"],a.prototype.invert=C,a.prototype.compileNode=function(a){var b,c,d,e;d=this.expression.compile(a,x),d=o.test(d)&&!a.scope.check(d)?(e=this.negated?["===","||"]:["!==","&&"],b=e[0],c=e[1],e,"typeof "+d+" "+b+' "undefined" '+c+" "+d+" "+b+" null"):""+d+" "+(this.negated?"==":"!=")+" null";return a.level<=v?d:"("+d+")"};return a}(),a.Parens=H=function(){function a(a){this.body=a}bj(a,e),a.prototype.children=["body"],a.prototype.unwrap=function(){return this.body},a.prototype.isComplex=function(){return this.body.isComplex()},a.prototype.makeReturn=function(){return this.body.makeReturn()},a.prototype.compileNode=function(a){var b,c,d;d=this.body.unwrap();if(d instanceof V&&d.isAtomic()){d.front=this.front;return d.compile(a)}c=d.compile(a,y),b=a.level<x&&(d instanceof F||d instanceof g||d instanceof n&&d.returns);return b?c:"("+c+")"};return a}(),a.For=n=function(){function a(a,b){var c;this.source=b.source,this.guard=b.guard,this.step=b.step,this.name=b.name,this.index=b.index,this.body=f.wrap([a]),this.own=!!b.own,this.object=!!b.object,this.object&&(c=[this.index,this.name],this.name=c[0],this.index=c[1]);if(this.index instanceof V)throw SyntaxError("index cannot be a pattern matching expression");this.range=this.source instanceof V&&this.source.base instanceof J&&!this.source.properties.length,this.pattern=this.name instanceof V;if(this.range&&this.index)throw SyntaxError("indexes do not apply to range loops");if(this.range&&this.pattern)throw SyntaxError("cannot pattern match over range loops");this.returns=!1}bj(a,e),a.prototype.children=["body","source","guard","step"],a.prototype.isStatement=X,a.prototype.jumps=W.prototype.jumps,a.prototype.makeReturn=function(){this.returns=!0;return this},a.prototype.compileNode=function(a){var b,c,e,g,h,i,j,k,l,m,n,p,q,s,t,u,v,y,B,C,D,E,F;b=f.wrap([this.body]),l=(F=bb(b.expressions))!=null?F.jumps():void 0,l&&l instanceof K&&(this.returns=!1),y=this.range?this.source.base:this.source,v=a.scope,n=this.name&&this.name.compile(a,w),j=this.index&&this.index.compile(a,w),n&&!this.pattern&&v.find(n,{immediate:!0}),j&&v.find(j,{immediate:!0}),this.returns&&(u=v.freeVariable("results")),k=(this.range?n:j)||v.freeVariable("i"),this.step&&!this.range&&(C=v.freeVariable("step")),this.pattern&&(n=k),E="",h="",c="",i=this.tab+Q,this.range?e=y.compile(bc(a,{index:k,step:this.step})):(D=this.source.compile(a,w),(n||this.own)&&!o.test(D)&&(c=""+this.tab+(q=v.freeVariable("ref"))+" = "+D+";\n",D=q),n&&!this.pattern&&(p=""+n+" = "+D+"["+k+"]"),this.object||(m=v.freeVariable("len"),g=""+k+" = 0, "+m+" = "+D+".length"+(this.step?", "+C+" = "+this.step.compile(a,x):""),B=this.step?""+k+" += "+C:""+k+"++",e=""+g+"; "+k+" < "+m+"; "+B)),this.returns&&(s=""+this.tab+u+" = [];\n",t="\n"+this.tab+"return "+u+";",b=I.wrap(u,b)),this.guard&&(b=f.wrap([new r(this.guard,b)])),this.pattern&&b.expressions.unshift(new d(this.name,new A(""+D+"["+k+"]"))),c+=this.pluckDirectCall(a,b),p&&(E="\n"+i+p+";"),this.object&&(e=""+k+" in "+D,this.own&&(h="\n"+i+"if (!"+bg("hasProp")+".call("+D+", "+k+")) continue;")),b=b.compile(bc(a,{indent:i}),z),b&&(b="\n"+b+"\n");return""+c+(s||"")+this.tab+"for ("+e+") {"+h+E+b+this.tab+"}"+(t||"")},a.prototype.pluckDirectCall=function(a,b){var c,e,f,h,i,k,l,m,n,o,p,q,r,s;e="",n=b.expressions;for(i=0,m=n.length;i<m;i++){f=n[i],f=f.unwrapAll();if(!(f instanceof g))continue;l=f.variable.unwrapAll();if(!(l instanceof j||l instanceof V&&((o=l.base)!=null?o.unwrapAll():void 0)instanceof j&&l.properties.length===1&&((p=(q=l.properties[0].name)!=null?q.value:void 0)==="call"||p==="apply")))continue;h=((r=l.base)!=null?r.unwrapAll():void 0)||l,k=new A(a.scope.freeVariable("fn")),c=new V(k),l.base&&(s=[c,l],l.base=s[0],c=s[1]),b.expressions[i]=new g(c,f.args),e+=this.tab+(new d(k,h)).compile(a,z)+";\n"}return e};return a}(),a.Switch=P=function(){function a(a,b,c){this.subject=a,this.cases=b,this.otherwise=c}bj(a,e),a.prototype.children=["subject","cases","otherwise"],a.prototype.isStatement=X,a.prototype.jumps=function(a){var b,c,d,e,f,g,h;a==null&&(a={block:!0}),f=this.cases;for(d=0,e=f.length;d<e;d++){g=f[d],c=g[0],b=g[1];if(b.jumps(a))return b}return(h=this.otherwise)!=null?h.jumps(a):void 0},a.prototype.makeReturn=function(){var a,b,c,d,e;d=this.cases;for(b=0,c=d.length;b<c;b++)a=d[b],a[1].makeReturn();(e=this.otherwise)!=null&&e.makeReturn();return this},a.prototype.compileNode=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q;i=a.indent+Q,j=a.indent=i+Q,d=this.tab+("switch ("+(((n=this.subject)!=null?n.compile(a,y):void 0)||!1)+") {\n"),o=this.cases;for(h=0,l=o.length;h<l;h++){p=o[h],f=p[0],b=p[1],q=ba([f]);for(k=0,m=q.length;k<m;k++)e=q[k],this.subject||(e=e.invert()),d+=i+("case "+e.compile(a,y)+":\n");if(c=b.compile(a,z))d+=c+"\n";if(h===this.cases.length-1&&!this.otherwise)break;g=this.lastNonComment(b.expressions);if(g instanceof K||g instanceof A&&g.jumps()&&g.value!=="debugger")continue;d+=j+"break;\n"}this.otherwise&&this.otherwise.expressions.length&&(d+=i+("default:\n"+this.otherwise.compile(a,z)+"\n"));return d+this.tab+"}"};return a}(),a.If=r=function(){function a(a,b,c){this.body=b,c==null&&(c={}),this.condition=c.type==="unless"?a.invert():a,this.elseBody=null,this.isChain=!1,this.soak=c.soak}bj(a,e),a.prototype.children=["condition","body","elseBody"],a.prototype.bodyNode=function(){var a;return(a=this.body)!=null?a.unwrap():void 0},a.prototype.elseBodyNode=function(){var a;return(a=this.elseBody)!=null?a.unwrap():void 0},a.prototype.addElse=function(b){this.isChain?this.elseBodyNode().addElse(b):(this.isChain=b instanceof a,this.elseBody=this.ensureBlock(b));return this},a.prototype.isStatement=function(a){var b;return(a!=null?a.level:void 0)===z||this.bodyNode().isStatement(a)||((b=this.elseBodyNode())!=null?b.isStatement(a):void 0)},a.prototype.jumps=function(a){var b;return this.body.jumps(a)||((b=this.elseBody)!=null?b.jumps(a):void 0)},a.prototype.compileNode=function(a){return this.isStatement(a)?this.compileStatement(a):this.compileExpression(a)},a.prototype.makeReturn=function(){this.body&&(this.body=new f([this.body.makeReturn()])),this.elseBody&&(this.elseBody=new f([this.elseBody.makeReturn()]));return this},a.prototype.ensureBlock=function(a){return a instanceof f?a:new f([a])},a.prototype.compileStatement=function(b){var c,d,e,f,g;d=Z(b,"chainChild"),f=Z(b,"isExistentialEquals");if(f)return(new a(this.condition.invert(),this.elseBodyNode(),{type:"if"})).compile(b);e=this.condition.compile(b,y),b.indent+=Q,c=this.ensureBlock(this.body).compile(b),c&&(c="\n"+c+"\n"+this.tab),g="if ("+e+") {"+c+"}",d||(g=this.tab+g);if(!this.elseBody)return g;return g+" else "+(this.isChain?(b.indent=this.tab,b.chainChild=!0,this.elseBody.unwrap().compile(b,z)):"{\n"+this.elseBody.compile(b,z)+"\n"+this.tab+"}")},a.prototype.compileExpression=function(a){var b,c,d,e;e=this.condition.compile(a,v),c=this.bodyNode().compile(a,w),b=this.elseBodyNode()?this.elseBodyNode().compile(a,w):"void 0",d=""+e+" ? "+c+" : "+b;return a.level>=v?"("+d+")":d},a.prototype.unfoldSoak=function(){return this.soak&&this};return a}(),I={wrap:function(a,c){if(c.isEmpty()||bb(c.expressions).jumps())return c;return c.push(new g(new V(new A(a),[new b(new A("push"))]),[c.pop()]))}},i={wrap:function(a,c,d){var e,h,i,k,l;if(a.jumps())return a;i=new j([],f.wrap([a])),e=[];if((k=a.contains(this.literalArgs))||a.contains(this.literalThis))l=new A(k?"apply":"call"),e=[new A("this")],k&&e.push(new A("arguments")),i=new V(i,[new b(l)]);i.noReturn=d,h=new g(i,e);return c?f.wrap([h]):h},literalArgs:function(a){return a instanceof A&&a.value==="arguments"&&!a.asKey},literalThis:function(a){return a instanceof A&&a.value==="this"&&!a.asKey||a instanceof j&&a.bound}},bf=function(a,b,c){var d;if(!!(d=b[c].unfoldSoak(a))){b[c]=d.body,d.body=new V(b);return d}},U={"extends":"function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}",bind:"function(fn, me){ return function(){ return fn.apply(me, arguments); }; }",indexOf:"Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}",hasProp:"Object.prototype.hasOwnProperty",slice:"Array.prototype.slice"},z=1,y=2,w=3,v=4,x=5,u=6,Q="  ",p="[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*",o=RegExp("^"+p+"$"),L=/^[+-]?\d+$/,B=RegExp("^(?:("+p+")\\.prototype(?:\\.("+p+")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\]))|("+p+")$"),q=/^['"]/,bg=function(a){var b;b="__"+a,M.root.assign(b,U[a]);return b},bd=function(a,b){return a.replace(/\n/g,"$&"+b)}}).call(this)},require["./coffee-script"]=new function(){var exports=this;(function(){var Lexer,RESERVED,compile,fs,lexer,parser,path,_ref,__hasProp=Object.prototype.hasOwnProperty;fs=require("fs"),path=require("path"),_ref=require("./lexer"),Lexer=_ref.Lexer,RESERVED=_ref.RESERVED,parser=require("./parser").parser,require.extensions?require.extensions[".coffee"]=function(a,b){var c;c=compile(fs.readFileSync(b,"utf8"),{filename:b});return a._compile(c,b)}:require.registerExtension&&require.registerExtension(".coffee",function(a){return compile(a)}),exports.VERSION="1.1.2",exports.RESERVED=RESERVED,exports.helpers=require("./helpers"),exports.compile=compile=function(a,b){b==null&&(b={});try{return parser.parse(lexer.tokenize(a)).compile(b)}catch(c){b.filename&&(c.message="In "+b.filename+", "+c.message);throw c}},exports.tokens=function(a,b){return lexer.tokenize(a,b)},exports.nodes=function(a,b){return typeof a=="string"?parser.parse(lexer.tokenize(a,b)):parser.parse(a)},exports.run=function(a,b){var c,d;d=require.main,d.filename=process.argv[1]=b.filename?fs.realpathSync(b.filename):".",d.moduleCache&&(d.moduleCache={}),process.binding("natives").module&&(c=require("module").Module,d.paths=c._nodeModulePaths(path.dirname(b.filename)));return path.extname(d.filename)!==".coffee"||require.extensions?d._compile(compile(a,b),d.filename):d._compile(a,d.filename)},exports.eval=function(code,options){var Module,Script,js,k,o,r,sandbox,v,_i,_len,_module,_ref2,_ref3,_ref4,_require;options==null&&(options={});if(!!(code=code.trim())){if(_ref2=require("vm"),Script=_ref2.Script,_ref2){sandbox=Script.createContext(),sandbox.global=sandbox.root=sandbox.GLOBAL=sandbox;if(options.sandbox!=null)if(options.sandbox instanceof sandbox.constructor)sandbox=options.sandbox;else{_ref3=options.sandbox;for(k in _ref3){if(!__hasProp.call(_ref3,k))continue;v=_ref3[k],sandbox[k]=v}}sandbox.__filename=options.filename||"eval",sandbox.__dirname=path.dirname(sandbox.__filename);if(!sandbox.module&&!sandbox.require){Module=require("module"),sandbox.module=_module=new Module(options.modulename||"eval"),sandbox.require=_require=function(a){return Module._load(a,_module)},_module.filename=sandbox.__filename,_ref4=Object.getOwnPropertyNames(require);for(_i=0,_len=_ref4.length;_i<_len;_i++)r=_ref4[_i],_require[r]=require[r];_require.paths=_module.paths=Module._nodeModulePaths(process.cwd()),_require.resolve=function(a){return Module._resolveFilename(a,_module)}}}o={};for(k in options){if(!__hasProp.call(options,k))continue;v=options[k],o[k]=v}o.bare=!0,js=compile(code,o);return Script?Script.runInContext(js,sandbox):eval(js)}},lexer=new Lexer,parser.lexer={lex:function(){var a,b;b=this.tokens[this.pos++]||[""],a=b[0],this.yytext=b[1],this.yylineno=b[2];return a},setInput:function(a){this.tokens=a;return this.pos=0},upcomingInput:function(){return""}},parser.yy=require("./nodes")}).call(this)},require["./browser"]=new function(){var exports=this;(function(){var CoffeeScript,runScripts;CoffeeScript=require("./coffee-script"),CoffeeScript.require=require,CoffeeScript.eval=function(code,options){return eval(CoffeeScript.compile(code,options))},CoffeeScript.run=function(a,b){b==null&&(b={}),b.bare=!0;return Function(CoffeeScript.compile(a,b))()};typeof window!="undefined"&&window!==null&&(CoffeeScript.load=function(a,b){var c;c=new(window.ActiveXObject||XMLHttpRequest)("Microsoft.XMLHTTP"),c.open("GET",a,!0),"overrideMimeType"in c&&c.overrideMimeType("text/plain"),c.onreadystatechange=function(){var d;if(c.readyState===4){if((d=c.status)===0||d===200)CoffeeScript.run(c.responseText);else throw new Error("Could not load "+a);if(b)return b()}};return c.send(null)},runScripts=function(){var a,b,c,d,e,f;f=document.getElementsByTagName("script"),a=function(){var a,b,c;c=[];for(a=0,b=f.length;a<b;a++)e=f[a],e.type==="text/coffeescript"&&c.push(e);return c}(),c=0,d=a.length,(b=function(){var d;d=a[c++];if((d!=null?d.type:void 0)==="text/coffeescript"){if(d.src)return CoffeeScript.load(d.src,b);CoffeeScript.run(d.innerHTML);return b()}})();return null},window.addEventListener?addEventListener("DOMContentLoaded",runScripts,!1):attachEvent("onload",runScripts))}).call(this)};return require["./coffee-script"]}();

/*
  clientside HAML compiler for Javascript and Coffeescript (Version 4)

  Copyright 2011-12, Ronald Holshausen (https://github.com/uglyog)
  Released under the MIT License (http://www.opensource.org/licenses/MIT)
*/

(function() {
  var Buffer, CodeGenerator, CoffeeCodeGenerator, HamlRuntime, JsCodeGenerator, Tokeniser, filters, root,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = this;

  /*
    Haml runtime functions. These are used both by the compiler and the generated template functions
  */

  HamlRuntime = {
    /*
        Taken from underscore.string.js escapeHTML, and replace the apos entity with character 39 so that it renders
        correctly in IE7
    */
    escapeHTML: function(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, "&#39;");
    },
    /*
        Provides the implementation to preserve the whitespace as per the HAML reference
    */
    perserveWhitespace: function(str) {
      var i, out, re, result;
      re = /<[a-zA-Z]+>[^<]*<\/[a-zA-Z]+>/g;
      out = '';
      i = 0;
      result = re.exec(str);
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
    /*
        Generates a error message including the current line in the source where the error occurred
    */
    templateError: function(lineNumber, characterNumber, currentLine, error) {
      var i, message;
      message = error + " at line " + lineNumber + " and character " + characterNumber + ":\n" + currentLine + '\n';
      i = 0;
      while (i < characterNumber - 1) {
        message += '-';
        i++;
      }
      message += '^';
      return message;
    },
    /*
        Generates the attributes for the element by combining all the various sources together
    */
    generateElementAttributes: function(context, id, classes, objRefFn, attrList, attrFunction, lineNumber, characterNumber, currentLine) {
      var attr, attributes, className, dataAttr, dataAttributes, hash, html, object, objectId;
      attributes = {};
      attributes = this.combineAttributes(attributes, 'id', id);
      if (classes.length > 0 && classes[0].length > 0) {
        attributes = this.combineAttributes(attributes, 'class', classes);
      }
      if (attrList) {
        for (attr in attrList) {
          if (!__hasProp.call(attrList, attr)) continue;
          attributes = this.combineAttributes(attributes, attr, attrList[attr]);
        }
      }
      if (objRefFn) {
        try {
          object = objRefFn.call(context, context);
          if (object) {
            objectId = null;
            if (object.id) {
              objectId = object.id;
            } else if (object.get) {
              objectId = object.get('id');
            }
            attributes = this.combineAttributes(attributes, 'id', objectId);
            className = null;
            if (object['class']) {
              className = object['class'];
            } else if (object.get) {
              className = object.get('class');
            }
            attributes = this.combineAttributes(attributes, 'class', className);
          }
        } catch (e) {
          throw haml.HamlRuntime.templateError(lineNumber, characterNumber, currentLine, "Error evaluating object reference - " + e);
        }
      }
      if (attrFunction) {
        try {
          hash = attrFunction.call(context, context);
          if (hash) {
            for (attr in hash) {
              if (!__hasProp.call(hash, attr)) continue;
              if (attr === 'data') {
                dataAttributes = hash[attr];
                for (dataAttr in dataAttributes) {
                  if (!__hasProp.call(dataAttributes, dataAttr)) continue;
                  attributes = this.combineAttributes(attributes, 'data-' + dataAttr, dataAttributes[dataAttr]);
                }
              } else {
                attributes = this.combineAttributes(attributes, attr, hash[attr]);
              }
            }
          }
        } catch (ex) {
          throw haml.HamlRuntime.templateError(lineNumber, characterNumber, currentLine, "Error evaluating attribute hash - " + ex);
        }
      }
      html = '';
      if (attributes) {
        for (attr in attributes) {
          if (!__hasProp.call(attributes, attr)) continue;
          if (haml.hasValue(attributes[attr])) {
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
    /*
        Returns a white space string with a length of indent * 2
    */
    indentText: function(indent) {
      var i, text;
      text = '';
      i = 0;
      while (i < indent) {
        text += '  ';
        i++;
      }
      return text;
    },
    /*
        Combines the attributes in the attributres hash with the given attribute and value
        ID, FOR and CLASS attributes will expand to arrays when multiple values are provided
    */
    combineAttributes: function(attributes, attrName, attrValue) {
      var classes;
      if (haml.hasValue(attrValue)) {
        if (attrName === 'id' && attrValue.toString().length > 0) {
          if (attributes && attributes.id instanceof Array) {
            attributes.id.unshift(attrValue);
          } else if (attributes && attributes.id) {
            attributes.id = [attributes.id, attrValue];
          } else if (attributes) {
            attributes.id = attrValue;
          } else {
            attributes = {
              id: attrValue
            };
          }
        } else if (attrName === 'for' && attrValue.toString().length > 0) {
          if (attributes && attributes['for'] instanceof Array) {
            attributes['for'].unshift(attrValue);
          } else if (attributes && attributes['for']) {
            attributes['for'] = [attributes['for'], attrValue];
          } else if (attributes) {
            attributes['for'] = attrValue;
          } else {
            attributes = {
              'for': attrValue
            };
          }
        } else if (attrName === 'class') {
          classes = [];
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
            attributes = {
              'class': classes
            };
          }
        } else if (attrName !== 'id') {
          attributes || (attributes = {});
          attributes[attrName] = attrValue;
        }
      }
      return attributes;
    }
  };

  /*
    HAML Tokiniser: This class is responsible for parsing the haml source into tokens
  */

  Tokeniser = (function() {

    Tokeniser.prototype.currentLineMatcher = /[^\n]*/g;

    Tokeniser.prototype.tokenMatchers = {
      whitespace: /[ \t]+/g,
      element: /%[a-zA-Z][a-zA-Z0-9]*/g,
      idSelector: /#[a-zA-Z_\-][a-zA-Z0-9_\-]*/g,
      classSelector: /\.[a-zA-Z0-9_\-]+/g,
      identifier: /[a-zA-Z][a-zA-Z0-9\-]*/g,
      quotedString: /[\'][^\'\n]*[\']/g,
      quotedString2: /[\"][^\"\n]*[\"]/g,
      comment: /\-#/g,
      escapeHtml: /\&=/g,
      unescapeHtml: /\!=/g,
      objectReference: /\[[a-zA-Z_@][a-zA-Z0-9_]*\]/g,
      doctype: /!!!/g,
      continueLine: /\|\s*\n/g,
      filter: /:\w+/g
    };

    function Tokeniser(options) {
      var errorFn, successFn, template,
        _this = this;
      this.buffer = null;
      this.bufferIndex = null;
      this.prevToken = null;
      this.token = null;
      if (options.templateId != null) {
        template = document.getElementById(options.templateId);
        if (template) {
          this.buffer = template.innerHTML;
          this.bufferIndex = 0;
        } else {
          throw "Did not find a template with ID '" + options.templateId + "'";
        }
      } else if (options.template != null) {
        this.buffer = options.template;
        this.bufferIndex = 0;
      } else if (options.templateUrl != null) {
        errorFn = function(jqXHR, textStatus, errorThrown) {
          throw "Failed to fetch haml template at URL " + options.templateUrl + ": " + textStatus + " " + errorThrown;
        };
        successFn = function(data) {
          _this.buffer = data;
          return _this.bufferIndex = 0;
        };
        jQuery.ajax({
          url: options.templateUrl,
          success: successFn,
          error: errorFn,
          dataType: 'text',
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
      }
    }

    /*
        Try to match a token with the given regexp
    */

    Tokeniser.prototype.matchToken = function(matcher) {
      var result;
      matcher.lastIndex = this.bufferIndex;
      result = matcher.exec(this.buffer);
      if ((result != null ? result.index : void 0) === this.bufferIndex) {
        return result[0];
      }
    };

    /*
        Match a multi-character token
    */

    Tokeniser.prototype.matchMultiCharToken = function(matcher, token, tokenStr) {
      var matched, _ref;
      if (!this.token) {
        matched = this.matchToken(matcher);
        if (matched) {
          this.token = token;
          this.token.tokenString = (_ref = typeof tokenStr === "function" ? tokenStr(matched) : void 0) != null ? _ref : matched;
          this.token.matched = matched;
          return this.advanceCharsInBuffer(matched.length);
        }
      }
    };

    /*
        Match a single character token
    */

    Tokeniser.prototype.matchSingleCharToken = function(ch, token) {
      if (!this.token && this.buffer.charAt(this.bufferIndex) === ch) {
        this.token = token;
        this.token.tokenString = ch;
        this.token.matched = ch;
        return this.advanceCharsInBuffer(1);
      }
    };

    /*
        Match and return the next token in the input buffer
    */

    Tokeniser.prototype.getNextToken = function() {
      var braceCount, ch, ch1, characterNumberStart, i, lineNumberStart, str;
      if (isNaN(this.bufferIndex)) {
        throw haml.HamlRuntime.templateError(this.lineNumber, this.characterNumber, this.currentLine, "An internal parser error has occurred in the HAML parser");
      }
      this.prevToken = this.token;
      this.token = null;
      if (this.buffer === null || this.buffer.length === this.bufferIndex) {
        this.token = {
          eof: true,
          token: 'EOF'
        };
      } else {
        this.initLine();
        if (!this.token) {
          ch = this.buffer.charCodeAt(this.bufferIndex);
          ch1 = this.buffer.charCodeAt(this.bufferIndex + 1);
          if (ch === 10 || (ch === 13 && ch1 === 10)) {
            this.token = {
              eol: true,
              token: 'EOL'
            };
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
        this.matchMultiCharToken(this.tokenMatchers.whitespace, {
          ws: true,
          token: 'WS'
        });
        this.matchMultiCharToken(this.tokenMatchers.continueLine, {
          continueLine: true,
          token: 'CONTINUELINE'
        });
        this.matchMultiCharToken(this.tokenMatchers.element, {
          element: true,
          token: 'ELEMENT'
        }, function(matched) {
          return matched.substring(1);
        });
        this.matchMultiCharToken(this.tokenMatchers.idSelector, {
          idSelector: true,
          token: 'ID'
        }, function(matched) {
          return matched.substring(1);
        });
        this.matchMultiCharToken(this.tokenMatchers.classSelector, {
          classSelector: true,
          token: 'CLASS'
        }, function(matched) {
          return matched.substring(1);
        });
        this.matchMultiCharToken(this.tokenMatchers.identifier, {
          identifier: true,
          token: 'IDENTIFIER'
        });
        this.matchMultiCharToken(this.tokenMatchers.doctype, {
          doctype: true,
          token: 'DOCTYPE'
        });
        this.matchMultiCharToken(this.tokenMatchers.filter, {
          filter: true,
          token: 'FILTER'
        }, function(matched) {
          return matched.substring(1);
        });
        if (!this.token) {
          str = this.matchToken(this.tokenMatchers.quotedString);
          if (!str) str = this.matchToken(this.tokenMatchers.quotedString2);
          if (str) {
            this.token = {
              string: true,
              token: 'STRING',
              tokenString: str.substring(1, str.length - 1),
              matched: str
            };
            this.advanceCharsInBuffer(str.length);
          }
        }
        this.matchMultiCharToken(this.tokenMatchers.comment, {
          comment: true,
          token: 'COMMENT'
        });
        this.matchMultiCharToken(this.tokenMatchers.escapeHtml, {
          escapeHtml: true,
          token: 'ESCAPEHTML'
        });
        this.matchMultiCharToken(this.tokenMatchers.unescapeHtml, {
          unescapeHtml: true,
          token: 'UNESCAPEHTML'
        });
        this.matchMultiCharToken(this.tokenMatchers.objectReference, {
          objectReference: true,
          token: 'OBJECTREFERENCE'
        }, function(matched) {
          return matched.substring(1, matched.length - 1);
        });
        if (!this.token) {
          if (this.buffer && this.buffer.charAt(this.bufferIndex) === '{') {
            i = this.bufferIndex + 1;
            characterNumberStart = this.characterNumber;
            lineNumberStart = this.lineNumber;
            braceCount = 1;
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
              this.token = {
                attributeHash: true,
                token: 'ATTRHASH',
                tokenString: this.buffer.substring(this.bufferIndex, i + 1),
                matched: this.buffer.substring(this.bufferIndex, i + 1)
              };
              this.advanceCharsInBuffer(i - this.bufferIndex + 1);
            }
          }
        }
        this.matchSingleCharToken('(', {
          openBracket: true,
          token: 'OPENBRACKET'
        });
        this.matchSingleCharToken(')', {
          closeBracket: true,
          token: 'CLOSEBRACKET'
        });
        this.matchSingleCharToken('=', {
          equal: true,
          token: 'EQUAL'
        });
        this.matchSingleCharToken('/', {
          slash: true,
          token: 'SLASH'
        });
        this.matchSingleCharToken('!', {
          exclamation: true,
          token: 'EXCLAMATION'
        });
        this.matchSingleCharToken('-', {
          minus: true,
          token: 'MINUS'
        });
        this.matchSingleCharToken('&', {
          amp: true,
          token: 'AMP'
        });
        this.matchSingleCharToken('<', {
          lt: true,
          token: 'LT'
        });
        this.matchSingleCharToken('>', {
          gt: true,
          token: 'GT'
        });
        this.matchSingleCharToken('~', {
          tilde: true,
          token: 'TILDE'
        });
        if (this.token === null) {
          this.token = {
            unknown: true,
            token: 'UNKNOWN'
          };
        }
      }
      return this.token;
    };

    /*
        Look ahead a number of tokens and return the token found
    */

    Tokeniser.prototype.lookAhead = function(numberOfTokens) {
      var bufferIndex, characterNumber, currentLine, currentToken, i, lineNumber, prevToken, token;
      token = null;
      if (numberOfTokens > 0) {
        currentToken = this.token;
        prevToken = this.prevToken;
        currentLine = this.currentLine;
        lineNumber = this.lineNumber;
        characterNumber = this.characterNumber;
        bufferIndex = this.bufferIndex;
        i = 0;
        while (i++ < numberOfTokens) {
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

    /*
        Initilise the line and character counters
    */

    Tokeniser.prototype.initLine = function() {
      if (!this.currentLine && this.currentLine !== "") {
        this.currentLine = this.getCurrentLine();
        this.lineNumber = 1;
        return this.characterNumber = 0;
      }
    };

    /*
        Returns the current line in the input buffer
    */

    Tokeniser.prototype.getCurrentLine = function(index) {
      var line;
      this.currentLineMatcher.lastIndex = this.bufferIndex + (index != null ? index : 0);
      line = this.currentLineMatcher.exec(this.buffer);
      if (line) {
        return line[0];
      } else {
        return '';
      }
    };

    /*
        Returns an error string filled out with the line and character counters
    */

    Tokeniser.prototype.parseError = function(error) {
      return haml.HamlRuntime.templateError(this.lineNumber, this.characterNumber, this.currentLine, error);
    };

    /*
        Skips to the end of the line and returns the string that was skipped
    */

    Tokeniser.prototype.skipToEOLorEOF = function() {
      var contents, line, text;
      text = '';
      if (!(this.token.eof || this.token.eol)) {
        this.currentLineMatcher.lastIndex = this.bufferIndex;
        line = this.currentLineMatcher.exec(this.buffer);
        if (line && line.index === this.bufferIndex) {
          contents = _(line[0]).rtrim();
          if (_(contents).endsWith('|')) {
            text += contents.substring(0, contents.length - 1);
            this.advanceCharsInBuffer(contents.length - 1);
            this.getNextToken();
            text += this.parseMultiLine();
          } else {
            text = line[0];
            this.advanceCharsInBuffer(text.length);
            this.getNextToken();
          }
        }
      }
      return text;
    };

    /*
        Parses a multiline code block and returns the parsed text
    */

    Tokeniser.prototype.parseMultiLine = function() {
      var contents, line, text;
      text = '';
      while (this.token.continueLine) {
        this.currentLineMatcher.lastIndex = this.bufferIndex;
        line = this.currentLineMatcher.exec(this.buffer);
        if (line && line.index === this.bufferIndex) {
          contents = _(line[0]).rtrim();
          if (_(contents).endsWith('|')) {
            text += contents.substring(0, contents.length - 1);
            this.advanceCharsInBuffer(contents.length - 1);
          }
          this.getNextToken();
        }
      }
      this.pushBackToken();
      return text;
    };

    /*
        Advances the input buffer pointer by a number of characters, updating the line and character counters
    */

    Tokeniser.prototype.advanceCharsInBuffer = function(numChars) {
      var ch, ch1, i;
      i = 0;
      while (i < numChars) {
        ch = this.buffer.charCodeAt(this.bufferIndex + i);
        ch1 = this.buffer.charCodeAt(this.bufferIndex + i + 1);
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
        i++;
      }
      return this.bufferIndex += numChars;
    };

    /*
        Returns the current line and character counters
    */

    Tokeniser.prototype.currentParsePoint = function() {
      return {
        lineNumber: this.lineNumber,
        characterNumber: this.characterNumber,
        currentLine: this.currentLine
      };
    };

    /*
        Pushes back the current token onto the front of the input buffer
    */

    Tokeniser.prototype.pushBackToken = function() {
      if (!this.token.unknown && !this.token.eof) {
        this.bufferIndex -= this.token.matched.length;
        return this.token = this.prevToken;
      }
    };

    /*
        Is the current token an end of line or end of input buffer
    */

    Tokeniser.prototype.isEolOrEof = function() {
      return this.token.eol || this.token.eof;
    };

    return Tokeniser;

  })();

  /*
    Provides buffering between the generated javascript and html contents
  */

  Buffer = (function() {

    function Buffer(generator) {
      this.generator = generator;
      this.buffer = '';
      this.outputBuffer = '';
    }

    Buffer.prototype.append = function(str) {
      if (this.buffer.length === 0) this.generator.mark();
      if (str && str.length > 0) return this.buffer += str;
    };

    Buffer.prototype.appendToOutputBuffer = function(str) {
      if (str && str.length > 0) {
        this.flush();
        return this.outputBuffer += str;
      }
    };

    Buffer.prototype.flush = function() {
      if (this.buffer && this.buffer.length > 0) {
        this.outputBuffer += this.generator.generateFlush(this.buffer);
      }
      return this.buffer = '';
    };

    Buffer.prototype.output = function() {
      return this.outputBuffer;
    };

    Buffer.prototype.trimWhitespace = function() {
      var ch, i;
      if (this.buffer.length > 0) {
        i = this.buffer.length - 1;
        while (i > 0) {
          ch = this.buffer.charAt(i);
          if (ch === ' ' || ch === '\t' || ch === '\n') {
            i--;
          } else if (i > 1 && (ch === 'n' || ch === 't') && (this.buffer.charAt(i - 1) === '\\')) {
            i -= 2;
          } else {
            break;
          }
        }
        if (i > 0 && i < this.buffer.length - 1) {
          return this.buffer = this.buffer.substring(0, i + 1);
        } else if (i === 0) {
          return this.buffer = '';
        }
      }
    };

    return Buffer;

  })();

  /*
    Common code shared across all code generators
  */

  CodeGenerator = (function() {

    function CodeGenerator() {}

    CodeGenerator.prototype.embeddedCodeBlockMatcher = /#{([^}]*)}/g;

    return CodeGenerator;

  })();

  /*
    Code generator that generates a Javascript function body
  */

  JsCodeGenerator = (function(_super) {

    __extends(JsCodeGenerator, _super);

    function JsCodeGenerator() {
      this.outputBuffer = new haml.Buffer(this);
    }

    /*
        Append a line with embedded javascript code
    */

    JsCodeGenerator.prototype.appendEmbeddedCode = function(indentText, expression, escapeContents, perserveWhitespace, currentParsePoint) {
      this.outputBuffer.flush();
      this.outputBuffer.appendToOutputBuffer(indentText + 'try {\n');
      this.outputBuffer.appendToOutputBuffer(indentText + '    var value = eval("' + expression.replace(/"/g, '\\"').replace(/\\n/g, '\\\\n') + '");\n');
      this.outputBuffer.appendToOutputBuffer(indentText + '    value = value === null ? "" : value;');
      if (escapeContents) {
        this.outputBuffer.appendToOutputBuffer(indentText + '    html.push(haml.HamlRuntime.escapeHTML(String(value)));\n');
      } else if (perserveWhitespace) {
        this.outputBuffer.appendToOutputBuffer(indentText + '    html.push(haml.HamlRuntime.perserveWhitespace(String(value)));\n');
      } else {
        this.outputBuffer.appendToOutputBuffer(indentText + '    html.push(String(value));\n');
      }
      this.outputBuffer.appendToOutputBuffer(indentText + '} catch (e) {\n');
      this.outputBuffer.appendToOutputBuffer(indentText + '  throw new Error(haml.HamlRuntime.templateError(' + currentParsePoint.lineNumber + ', ' + currentParsePoint.characterNumber + ', "' + this.escapeCode(currentParsePoint.currentLine) + '",\n');
      this.outputBuffer.appendToOutputBuffer(indentText + '    "Error evaluating expression - " + e));\n');
      return this.outputBuffer.appendToOutputBuffer(indentText + '}\n');
    };

    /*
        Initilising the output buffer with any variables or code
    */

    JsCodeGenerator.prototype.initOutput = function() {
      return this.outputBuffer.appendToOutputBuffer('  var html = [];\n' + '  var hashFunction = null, hashObject = null, objRef = null, objRefFn = null;\n  with (context || {}) {\n');
    };

    /*
        Flush and close the output buffer and return the contents
    */

    JsCodeGenerator.prototype.closeAndReturnOutput = function() {
      this.outputBuffer.flush();
      return this.outputBuffer.output() + '  }\n  return html.join("");\n';
    };

    /*
        Append a line of code to the output buffer
    */

    JsCodeGenerator.prototype.appendCodeLine = function(line) {
      this.outputBuffer.flush();
      this.outputBuffer.appendToOutputBuffer(HamlRuntime.indentText(this.indent));
      this.outputBuffer.appendToOutputBuffer(line);
      return this.outputBuffer.appendToOutputBuffer('\n');
    };

    /*
        Does the current line end with a function declaration?
    */

    JsCodeGenerator.prototype.lineMatchesStartFunctionBlock = function(line) {
      return line.match(/function\s\((,?\s*\w+)*\)\s*\{\s*$/);
    };

    /*
        Does the current line end with a starting code block
    */

    JsCodeGenerator.prototype.lineMatchesStartBlock = function(line) {
      return line.match(/\{\s*$/);
    };

    /*
        Generate the code to close off a code block
    */

    JsCodeGenerator.prototype.closeOffCodeBlock = function(tokeniser) {
      if (!(tokeniser.token.minus && tokeniser.matchToken(/\s*\}/g))) {
        this.outputBuffer.flush();
        return this.outputBuffer.appendToOutputBuffer(HamlRuntime.indentText(this.indent) + '}\n');
      }
    };

    /*
        Generate the code to close off a function parameter
    */

    JsCodeGenerator.prototype.closeOffFunctionBlock = function(tokeniser) {
      if (!(tokeniser.token.minus && tokeniser.matchToken(/\s*\}/g))) {
        this.outputBuffer.flush();
        return this.outputBuffer.appendToOutputBuffer(HamlRuntime.indentText(this.indent) + '});\n');
      }
    };

    /*
        Generate the code for dynamic attributes ({} form)
    */

    JsCodeGenerator.prototype.generateCodeForDynamicAttributes = function(id, classes, attributeList, attributeHash, objectRef, currentParsePoint) {
      this.outputBuffer.flush();
      if (attributeHash.length > 0) {
        attributeHash = this.replaceReservedWordsInHash(attributeHash);
        this.outputBuffer.appendToOutputBuffer('    hashFunction = function () { return eval("hashObject = ' + attributeHash.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"); };\n');
      }
      if (objectRef.length > 0) {
        this.outputBuffer.appendToOutputBuffer('    objRefFn = function () { return eval("objRef = ' + objectRef.replace(/"/g, '\\"') + '"); };\n');
      }
      return this.outputBuffer.appendToOutputBuffer('    html.push(haml.HamlRuntime.generateElementAttributes(context, "' + id + '", ["' + classes.join('","') + '"], objRefFn, ' + JSON.stringify(attributeList) + ', hashFunction, ' + currentParsePoint.lineNumber + ', ' + currentParsePoint.characterNumber + ', "' + this.escapeCode(currentParsePoint.currentLine) + '"));\n');
    };

    /*
        Clean any reserved words in the given hash
    */

    JsCodeGenerator.prototype.replaceReservedWordsInHash = function(hash) {
      var reservedWord, resultHash, _i, _len, _ref;
      resultHash = hash;
      _ref = ['class', 'for'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        reservedWord = _ref[_i];
        resultHash = resultHash.replace(reservedWord + ':', '"' + reservedWord + '":');
      }
      return resultHash;
    };

    /*
        Escape the line so it is safe to put into a javascript string
    */

    JsCodeGenerator.prototype.escapeCode = function(jsStr) {
      return jsStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    };

    /*
        Generate a function from the function body
    */

    JsCodeGenerator.prototype.generateJsFunction = function(functionBody) {
      try {
        return new Function('context', functionBody);
      } catch (e) {
        throw "Incorrect embedded code has resulted in an invalid Haml function - " + e + "\nGenerated Function:\n" + functionBody;
      }
    };

    /*
        Generate the code required to support a buffer flush
    */

    JsCodeGenerator.prototype.generateFlush = function(bufferStr) {
      return '    html.push("' + this.escapeCode(bufferStr) + '");\n';
    };

    /*
        Set the current indent level
    */

    JsCodeGenerator.prototype.setIndent = function(indent) {
      return this.indent = indent;
    };

    /*
        Save the current indent level if required
    */

    JsCodeGenerator.prototype.mark = function() {};

    /*
        Append the text contents to the buffer, expanding any embedded code
    */

    JsCodeGenerator.prototype.appendTextContents = function(text, shouldInterpolate, currentParsePoint, options) {
      if (options == null) options = {};
      if (shouldInterpolate && text.match(/#{[^}]*}/)) {
        return this.interpolateString(text, currentParsePoint, options);
      } else {
        return this.outputBuffer.append(this.processText(text, options));
      }
    };

    /*
        Interpolate any embedded code in the text
    */

    JsCodeGenerator.prototype.interpolateString = function(text, currentParsePoint, options) {
      var index, precheedingChar, precheedingChar2, result;
      index = 0;
      result = this.embeddedCodeBlockMatcher.exec(text);
      while (result) {
        if (result.index > 0) precheedingChar = text.charAt(result.index - 1);
        if (result.index > 1) precheedingChar2 = text.charAt(result.index - 2);
        if (precheedingChar === '\\' && precheedingChar2 !== '\\') {
          if (result.index !== 0) {
            this.outputBuffer.append(this.processText(text.substring(index, result.index - 1), options));
          }
          this.outputBuffer.append(this.processText(result[0]), options);
        } else {
          this.outputBuffer.append(this.processText(text.substring(index, result.index)), options);
          this.appendEmbeddedCode(HamlRuntime.indentText(this.indent + 1), result[1], options.escapeHTML, options.perserveWhitespace, currentParsePoint);
        }
        index = this.embeddedCodeBlockMatcher.lastIndex;
        result = this.embeddedCodeBlockMatcher.exec(text);
      }
      if (index < text.length) {
        return this.outputBuffer.append(this.processText(text.substring(index), options));
      }
    };

    /*
        process text based on escape and preserve flags
    */

    JsCodeGenerator.prototype.processText = function(text, options) {
      if (options != null ? options.escapeHTML : void 0) {
        return haml.HamlRuntime.escapeHTML(text);
      } else if (options != null ? options.perserveWhitespace : void 0) {
        return haml.HamlRuntime.perserveWhitespace(text);
      } else {
        return text;
      }
    };

    return JsCodeGenerator;

  })(CodeGenerator);

  /*
    Code generator that generates a coffeescript function body
  */

  CoffeeCodeGenerator = (function(_super) {

    __extends(CoffeeCodeGenerator, _super);

    function CoffeeCodeGenerator() {
      this.outputBuffer = new haml.Buffer(this);
    }

    CoffeeCodeGenerator.prototype.appendEmbeddedCode = function(indentText, expression, escapeContents, perserveWhitespace, currentParsePoint) {
      var indent;
      this.outputBuffer.flush();
      indent = this.calcCodeIndent();
      this.outputBuffer.appendToOutputBuffer(indent + "try\n");
      this.outputBuffer.appendToOutputBuffer(indent + "  exp = CoffeeScript.compile('" + expression.replace(/'/g, "\\'").replace(/\\n/g, '\\\\n') + "', bare: true)\n");
      this.outputBuffer.appendToOutputBuffer(indent + "  value = eval(exp)\n");
      this.outputBuffer.appendToOutputBuffer(indent + "  value ?= ''\n");
      if (escapeContents) {
        this.outputBuffer.appendToOutputBuffer(indent + "  html.push(haml.HamlRuntime.escapeHTML(String(value)))\n");
      } else if (perserveWhitespace) {
        this.outputBuffer.appendToOutputBuffer(indent + "  html.push(haml.HamlRuntime.perserveWhitespace(String(value)))\n");
      } else {
        this.outputBuffer.appendToOutputBuffer(indent + "  html.push(String(value))\n");
      }
      this.outputBuffer.appendToOutputBuffer(indent + "catch e \n");
      this.outputBuffer.appendToOutputBuffer(indent + "  throw new Error(haml.HamlRuntime.templateError(" + currentParsePoint.lineNumber + ", " + currentParsePoint.characterNumber + ", '" + this.escapeCode(currentParsePoint.currentLine) + "',\n");
      return this.outputBuffer.appendToOutputBuffer(indent + "    'Error evaluating expression - ' + e))\n");
    };

    CoffeeCodeGenerator.prototype.initOutput = function() {
      return this.outputBuffer.appendToOutputBuffer('html = []\n');
    };

    CoffeeCodeGenerator.prototype.closeAndReturnOutput = function() {
      this.outputBuffer.flush();
      return this.outputBuffer.output() + 'return html.join("")\n';
    };

    CoffeeCodeGenerator.prototype.appendCodeLine = function(line) {
      this.outputBuffer.flush();
      if ((this.prevCodeIndent != null) && this.prevCodeIndent < this.indent) {
        this.outputBuffer.appendToOutputBuffer(HamlRuntime.indentText(this.indent - this.prevCodeIndent));
      }
      this.outputBuffer.appendToOutputBuffer(_(line).trim());
      this.outputBuffer.appendToOutputBuffer('\n');
      return this.prevCodeIndent = this.indent;
    };

    CoffeeCodeGenerator.prototype.lineMatchesStartFunctionBlock = function(line) {
      return line.match(/\) [\-=]>\s*$/);
    };

    CoffeeCodeGenerator.prototype.lineMatchesStartBlock = function(line) {
      return true;
    };

    CoffeeCodeGenerator.prototype.closeOffCodeBlock = function(tokeniser) {
      return this.outputBuffer.flush();
    };

    CoffeeCodeGenerator.prototype.closeOffFunctionBlock = function(tokeniser) {
      return this.outputBuffer.flush();
    };

    CoffeeCodeGenerator.prototype.generateCodeForDynamicAttributes = function(id, classes, attributeList, attributeHash, objectRef, currentParsePoint) {
      this.outputBuffer.flush();
      if (attributeHash.length > 0) {
        attributeHash = this.replaceReservedWordsInHash(attributeHash);
        this.outputBuffer.appendToOutputBuffer("hashFunction = () -> s = CoffeeScript.compile('" + attributeHash.replace(/'/g, "\\'").replace(/\n/g, '\\n') + "', bare: true); eval 'hashObject = ' + s\n");
      }
      if (objectRef.length > 0) {
        this.outputBuffer.appendToOutputBuffer("objRefFn = () -> s = CoffeeScript.compile('" + objectRef.replace(/'/g, "\\'") + "', bare: true); eval 'objRef = ' + s\n");
      }
      return this.outputBuffer.appendToOutputBuffer("html.push(haml.HamlRuntime.generateElementAttributes(this, '" + id + "', ['" + classes.join("','") + "'], objRefFn ? null, " + JSON.stringify(attributeList) + ", hashFunction ? null, " + currentParsePoint.lineNumber + ", " + currentParsePoint.characterNumber + ", '" + this.escapeCode(currentParsePoint.currentLine) + "'))\n");
    };

    CoffeeCodeGenerator.prototype.replaceReservedWordsInHash = function(hash) {
      var reservedWord, resultHash, _i, _len, _ref;
      resultHash = hash;
      _ref = ['class', 'for'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        reservedWord = _ref[_i];
        resultHash = resultHash.replace(reservedWord + ':', "'" + reservedWord + "':");
      }
      return resultHash;
    };

    /*
        Escapes the string for insertion into the generated code. Embedded code blocks in strings must not be escaped
    */

    CoffeeCodeGenerator.prototype.escapeCode = function(str) {
      var index, outString, precheedingChar, precheedingChar2, result;
      outString = '';
      index = 0;
      result = this.embeddedCodeBlockMatcher.exec(str);
      while (result) {
        if (result.index > 0) precheedingChar = str.charAt(result.index - 1);
        if (result.index > 1) precheedingChar2 = str.charAt(result.index - 2);
        if (precheedingChar === '\\' && precheedingChar2 !== '\\') {
          if (result.index !== 0) {
            outString += this._escapeText(str.substring(index, result.index - 1));
          }
          outString += this._escapeText('\\' + result[0]);
        } else {
          outString += this._escapeText(str.substring(index, result.index));
          outString += result[0];
        }
        index = this.embeddedCodeBlockMatcher.lastIndex;
        result = this.embeddedCodeBlockMatcher.exec(str);
      }
      if (index < str.length) outString += this._escapeText(str.substring(index));
      return outString;
    };

    CoffeeCodeGenerator.prototype._escapeText = function(text) {
      return text.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/"/g, '\\\"').replace(/\n/g, '\\n').replace(/(^|[^\\]{2})\\\\#{/g, '$1\\#{');
    };

    /*
        Generates the javascript function by compiling the given code with coffeescript compiler
    */

    CoffeeCodeGenerator.prototype.generateJsFunction = function(functionBody) {
      var fn;
      try {
        fn = CoffeeScript.compile(functionBody, {
          bare: true
        });
        return new Function(fn);
      } catch (e) {
        throw "Incorrect embedded code has resulted in an invalid Haml function - " + e + "\nGenerated Function:\n" + fn;
      }
    };

    CoffeeCodeGenerator.prototype.generateFlush = function(bufferStr) {
      return this.calcCodeIndent() + "html.push('" + this.escapeCode(bufferStr) + "')\n";
    };

    CoffeeCodeGenerator.prototype.setIndent = function(indent) {
      return this.indent = indent;
    };

    CoffeeCodeGenerator.prototype.mark = function() {
      return this.prevIndent = this.indent;
    };

    CoffeeCodeGenerator.prototype.calcCodeIndent = function() {
      if ((this.prevCodeIndent != null) && this.prevIndent > this.prevCodeIndent) {
        return HamlRuntime.indentText(this.prevIndent - this.prevCodeIndent);
      } else {
        return '';
      }
    };

    /*
        Append the text contents to the buffer (interpolating embedded code not required for coffeescript)
    */

    CoffeeCodeGenerator.prototype.appendTextContents = function(text, shouldInterpolate, currentParsePoint, options) {
      var prefix, suffix;
      if (shouldInterpolate && text.match(/#{[^}]*}/)) {
        this.outputBuffer.flush();
        prefix = suffix = '';
        if (options != null ? options.escapeHTML : void 0) {
          prefix = 'haml.HamlRuntime.escapeHTML(';
          suffix = ')';
        } else if (options != null ? options.perserveWhitespace : void 0) {
          prefix = 'haml.HamlRuntime.perserveWhitespace(';
          suffix = ')';
        }
        return this.outputBuffer.appendToOutputBuffer(this.calcCodeIndent() + 'html.push(' + prefix + '"' + this.escapeCode(text) + '"' + suffix + ')\n');
      } else {
        if (options != null ? options.escapeHTML : void 0) {
          text = haml.HamlRuntime.escapeHTML(text);
        }
        if (options != null ? options.perserveWhitespace : void 0) {
          text = haml.HamlRuntime.perserveWhitespace(text);
        }
        return this.outputBuffer.append(text);
      }
    };

    return CoffeeCodeGenerator;

  })(CodeGenerator);

  /*
    HAML filters are functions that take 3 parameters
      contents: The contents block for the filter an array of lines of text
      generator: The current generator for the compiled function
      indentText: A whitespace string specifying the current indent level
      currentParsePoint: line and character counters for the current parse point in the input buffer
  */

  filters = {
    /*
        Plain filter, just renders the text in the block
    */
    plain: function(contents, generator, indentText, currentParsePoint) {
      var line, _i, _len;
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        line = contents[_i];
        generator.appendTextContents(indentText + line + '\n', true, currentParsePoint);
      }
      return true;
    },
    /*
        Wraps the filter block in a javascript tag
    */
    javascript: function(contents, generator, indentText, currentParsePoint) {
      var line, _i, _len;
      generator.outputBuffer.append(indentText + "<script type=\"text/javascript\">\n");
      generator.outputBuffer.append(indentText + "//<![CDATA[\n");
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        line = contents[_i];
        generator.appendTextContents(indentText + line + '\n', true, currentParsePoint);
      }
      generator.outputBuffer.append(indentText + "//]]>\n");
      return generator.outputBuffer.append(indentText + "</script>\n");
    },
    /*
        Wraps the filter block in a style tag
    */
    css: function(contents, generator, indentText, currentParsePoint) {
      var line, _i, _len;
      generator.outputBuffer.append(indentText + "<style type=\"text/css\">\n");
      generator.outputBuffer.append(indentText + "/*<![CDATA[*/\n");
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        line = contents[_i];
        generator.appendTextContents(indentText + line + '\n', true, currentParsePoint);
      }
      generator.outputBuffer.append(indentText + "/*]]>*/\n");
      return generator.outputBuffer.append(indentText + "</style>\n");
    },
    /*
        Wraps the filter block in a CDATA tag
    */
    cdata: function(contents, generator, indentText, currentParsePoint) {
      var line, _i, _len;
      generator.outputBuffer.append(indentText + "<![CDATA[\n");
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        line = contents[_i];
        generator.appendTextContents(indentText + line + '\n', true, currentParsePoint);
      }
      return generator.outputBuffer.append(indentText + "]]>\n");
    },
    /*
        Preserve filter, preserved blocks of text aren't indented, and newlines are replaced with the HTML escape code for newlines
    */
    preserve: function(contents, generator, indentText, currentParsePoint) {
      return generator.appendTextContents(contents.join('\n') + '\n', true, currentParsePoint, {
        perserveWhitespace: true
      });
    },
    /*
        Escape filter, renders the text in the block with html escaped
    */
    escape: function(contents, generator, indentText, currentParsePoint) {
      var line, _i, _len;
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        line = contents[_i];
        generator.appendTextContents(indentText + line + '\n', true, currentParsePoint, {
          escapeHTML: true
        });
      }
      return true;
    }
  };

  /*
    Main haml compiler implemtation
  */

  root.haml = {
    /*
        Compiles the haml provided in the parameters to a Javascipt function
    
        Parameter:
          String: Looks for a haml template in dom with this ID
          Option Hash: The following options determines how haml sources and compiles the template
            source - This contains the template in string form
            sourceId - This contains the element ID in the dom which contains the haml source
            sourceUrl - This contains the URL where the template can be fetched from
            outputFormat - This determines what is returned, and has the following values:
                             string - The javascript source code
                             function - A javascript function (default)
            generator - Which code generator to use
                             javascript (default)
                             coffeescript
    
        Returns a javascript function
    */
    compileHaml: function(options) {
      var codeGenerator, result, tokinser;
      if (typeof options === 'string') {
        return this._compileHamlTemplate(options, new haml.JsCodeGenerator());
      } else {
        if (options.generator !== 'coffeescript') {
          codeGenerator = new haml.JsCodeGenerator();
        } else {
          codeGenerator = new haml.CoffeeCodeGenerator();
        }
        if (options.source != null) {
          tokinser = new haml.Tokeniser({
            template: options.source
          });
        } else if (options.sourceId != null) {
          tokinser = new haml.Tokeniser({
            templateId: options.sourceId
          });
        } else if (options.sourceUrl != null) {
          tokinser = new haml.Tokeniser({
            templateUrl: options.sourceUrl
          });
        } else {
          throw "No template source specified for compileHaml. You need to provide a source, sourceId or sourceUrl option";
        }
        result = this._compileHamlToJs(tokinser, codeGenerator);
        if (options.outputFormat !== 'string') {
          return codeGenerator.generateJsFunction(result);
        } else {
          return "function (context) {\n" + result + "}\n";
        }
      }
    },
    /*
        Compiles the haml in the script block with ID templateId using the coffeescript generator
        Returns a javascript function
    */
    compileCoffeeHaml: function(templateId) {
      return this._compileHamlTemplate(templateId, new haml.CoffeeCodeGenerator());
    },
    /*
        Compiles the haml in the passed in string
        Returns a javascript function
    */
    compileStringToJs: function(string) {
      var codeGenerator, result;
      codeGenerator = new haml.JsCodeGenerator();
      result = this._compileHamlToJs(new haml.Tokeniser({
        template: string
      }), codeGenerator);
      return codeGenerator.generateJsFunction(result);
    },
    /*
        Compiles the haml in the passed in string
        Returns a javascript function
    */
    compileCoffeescriptStringToJs: function(string) {
      var codeGenerator, result;
      codeGenerator = new haml.CoffeeCodeGenerator();
      result = this._compileHamlToJs(new haml.Tokeniser({
        template: string
      }), codeGenerator);
      return codeGenerator.generateJsFunction(result);
    },
    /*
        Compiles the haml in the passed in string using the coffeescript generator
        Returns a javascript function
    */
    compileCoffeeHamlFromString: function(string) {
      var codeGenerator, result;
      codeGenerator = new haml.CoffeeCodeGenerator();
      result = this._compileHamlToJs(new haml.Tokeniser({
        template: string
      }), codeGenerator);
      return codeGenerator.generateJsFunction(result);
    },
    /*
        Compiles the haml in the passed in string
        Returns the javascript function source
    
        This is mainly used for precompiling the haml templates so they can be packaged.
    */
    compileHamlToJsString: function(string) {
      var result;
      result = 'function (context) {\n';
      result += this._compileHamlToJs(new haml.Tokeniser({
        template: string
      }), new haml.JsCodeGenerator());
      return result += '}\n';
    },
    _compileHamlTemplate: function(templateId, codeGenerator) {
      var fn, result;
      haml.cache || (haml.cache = {});
      if (haml.cache[templateId]) return haml.cache[templateId];
      result = this._compileHamlToJs(new haml.Tokeniser({
        templateId: templateId
      }), codeGenerator);
      fn = codeGenerator.generateJsFunction(result);
      haml.cache[templateId] = fn;
      return fn;
    },
    _compileHamlToJs: function(tokeniser, generator) {
      var elementStack, indent;
      elementStack = [];
      generator.initOutput();
      tokeniser.getNextToken();
      while (!tokeniser.token.eof) {
        if (!tokeniser.token.eol) {
          indent = haml._whitespace(tokeniser);
          generator.setIndent(indent);
          if (tokeniser.token.eol) {
            generator.outputBuffer.append(HamlRuntime.indentText(indent) + '\n');
          } else if (tokeniser.token.doctype) {
            haml._doctype(tokeniser, indent, generator);
          } else if (tokeniser.token.exclamation) {
            haml._ignoredLine(tokeniser, indent, elementStack, generator);
          } else if (tokeniser.token.equal || tokeniser.token.escapeHtml || tokeniser.token.unescapeHtml || tokeniser.token.tilde) {
            haml._embeddedJs(tokeniser, indent, elementStack, {
              innerWhitespace: true
            }, generator);
          } else if (tokeniser.token.minus) {
            haml._jsLine(tokeniser, indent, elementStack, generator);
          } else if (tokeniser.token.comment || tokeniser.token.slash) {
            haml._commentLine(tokeniser, indent, elementStack, generator);
          } else if (tokeniser.token.amp) {
            haml._escapedLine(tokeniser, indent, elementStack, generator);
          } else if (tokeniser.token.filter) {
            haml._filter(tokeniser, indent, generator);
          } else {
            haml._templateLine(tokeniser, elementStack, indent, generator);
          }
        } else {
          tokeniser.getNextToken();
        }
      }
      haml._closeElements(0, elementStack, tokeniser, generator);
      return generator.closeAndReturnOutput();
    },
    _doctype: function(tokeniser, indent, generator) {
      var contents, params;
      if (tokeniser.token.doctype) {
        generator.outputBuffer.append(HamlRuntime.indentText(indent));
        tokeniser.getNextToken();
        contents = tokeniser.skipToEOLorEOF();
        if (contents && contents.length > 0) {
          params = contents.split(/\s+/);
          switch (params[0]) {
            case 'XML':
              if (params.length > 1) {
                generator.outputBuffer.append("<?xml version='1.0' encoding='" + params[1] + "' ?>");
              } else {
                generator.outputBuffer.append("<?xml version='1.0' encoding='utf-8' ?>");
              }
              break;
            case 'Strict':
              generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
              break;
            case 'Frameset':
              generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">');
              break;
            case '5':
              generator.outputBuffer.append('<!DOCTYPE html>');
              break;
            case '1.1':
              generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">');
              break;
            case 'Basic':
              generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">');
              break;
            case 'Mobile':
              generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">');
              break;
            case 'RDFa':
              generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">');
          }
        } else {
          generator.outputBuffer.append('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
        }
        return generator.outputBuffer.append("\n");
      }
    },
    _filter: function(tokeniser, indent, generator) {
      var filter, filterBlock, i, line;
      if (tokeniser.token.filter) {
        filter = tokeniser.token.tokenString;
        if (!haml.filters[filter]) {
          throw tokeniser.parseError("Filter '" + filter + "' not registered. Filter functions need to be added to 'haml.filters'.");
        }
        tokeniser.skipToEOLorEOF();
        tokeniser.getNextToken();
        i = haml._whitespace(tokeniser);
        filterBlock = [];
        while (!tokeniser.token.eof && i > indent) {
          tokeniser.pushBackToken();
          line = tokeniser.skipToEOLorEOF();
          filterBlock.push(haml.HamlRuntime.indentText(i - indent - 1) + line);
          tokeniser.getNextToken();
          i = haml._whitespace(tokeniser);
        }
        haml.filters[filter](filterBlock, generator, haml.HamlRuntime.indentText(indent), tokeniser.currentParsePoint());
        return tokeniser.pushBackToken();
      }
    },
    _commentLine: function(tokeniser, indent, elementStack, generator) {
      var contents, i;
      if (tokeniser.token.comment) {
        tokeniser.skipToEOLorEOF();
        tokeniser.getNextToken();
        i = haml._whitespace(tokeniser);
        while (!tokeniser.token.eof && i > indent) {
          tokeniser.skipToEOLorEOF();
          tokeniser.getNextToken();
          i = haml._whitespace(tokeniser);
        }
        return tokeniser.pushBackToken();
      } else if (tokeniser.token.slash) {
        haml._closeElements(indent, elementStack, tokeniser, generator);
        generator.outputBuffer.append(HamlRuntime.indentText(indent));
        generator.outputBuffer.append("<!--");
        contents = tokeniser.skipToEOLorEOF();
        if (contents && contents.length > 0) {
          generator.outputBuffer.append(contents);
        }
        if (contents && _(contents).startsWith('[') && contents.match(/\]\s*$/)) {
          elementStack[indent] = {
            htmlConditionalComment: true
          };
          generator.outputBuffer.append(">");
        } else {
          elementStack[indent] = {
            htmlComment: true
          };
        }
        if (haml._tagHasContents(indent, tokeniser)) {
          return generator.outputBuffer.append("\n");
        }
      }
    },
    _escapedLine: function(tokeniser, indent, elementStack, generator) {
      var contents;
      if (tokeniser.token.amp) {
        haml._closeElements(indent, elementStack, tokeniser, generator);
        generator.outputBuffer.append(HamlRuntime.indentText(indent));
        contents = tokeniser.skipToEOLorEOF();
        if (contents && contents.length > 0) {
          generator.outputBuffer.append(haml.HamlRuntime.escapeHTML(contents));
        }
        return generator.outputBuffer.append("\n");
      }
    },
    _ignoredLine: function(tokeniser, indent, elementStack, generator) {
      var contents;
      if (tokeniser.token.exclamation) {
        tokeniser.getNextToken();
        if (tokeniser.token.ws) indent += haml._whitespace(tokeniser);
        tokeniser.pushBackToken();
        haml._closeElements(indent, elementStack, tokeniser, generator);
        contents = tokeniser.skipToEOLorEOF();
        return generator.outputBuffer.append(HamlRuntime.indentText(indent) + contents + '\n');
      }
    },
    _embeddedJs: function(tokeniser, indent, elementStack, tagOptions, generator) {
      var currentParsePoint, escapeHtml, expression, indentText, perserveWhitespace;
      if (elementStack) {
        haml._closeElements(indent, elementStack, tokeniser, generator);
      }
      if (tokeniser.token.equal || tokeniser.token.escapeHtml || tokeniser.token.unescapeHtml || tokeniser.token.tilde) {
        escapeHtml = tokeniser.token.escapeHtml || tokeniser.token.equal;
        perserveWhitespace = tokeniser.token.tilde;
        currentParsePoint = tokeniser.currentParsePoint();
        expression = tokeniser.skipToEOLorEOF();
        indentText = HamlRuntime.indentText(indent);
        if (!tagOptions || tagOptions.innerWhitespace) {
          generator.outputBuffer.append(indentText);
        }
        generator.appendEmbeddedCode(indentText, expression, escapeHtml, perserveWhitespace, currentParsePoint);
        if (!tagOptions || tagOptions.innerWhitespace) {
          return generator.outputBuffer.append("\n");
        }
      }
    },
    _jsLine: function(tokeniser, indent, elementStack, generator) {
      var line;
      if (tokeniser.token.minus) {
        haml._closeElements(indent, elementStack, tokeniser, generator);
        line = tokeniser.skipToEOLorEOF();
        generator.setIndent(indent);
        generator.appendCodeLine(line);
        if (generator.lineMatchesStartFunctionBlock(line)) {
          return elementStack[indent] = {
            fnBlock: true
          };
        } else if (generator.lineMatchesStartBlock(line)) {
          return elementStack[indent] = {
            block: true
          };
        }
      }
    },
    _templateLine: function(tokeniser, elementStack, indent, generator) {
      var attrList, attributesHash, classes, contents, currentParsePoint, hasContents, id, identifier, indentText, lineHasElement, objectRef, shouldInterpolate, tagOptions;
      if (!tokeniser.token.eol) {
        haml._closeElements(indent, elementStack, tokeniser, generator);
      }
      identifier = haml._element(tokeniser);
      id = haml._idSelector(tokeniser);
      classes = haml._classSelector(tokeniser);
      objectRef = haml._objectReference(tokeniser);
      attrList = haml._attributeList(tokeniser);
      currentParsePoint = tokeniser.currentParsePoint();
      attributesHash = haml._attributeHash(tokeniser);
      tagOptions = {
        selfClosingTag: false,
        innerWhitespace: true,
        outerWhitespace: true
      };
      lineHasElement = haml._lineHasElement(identifier, id, classes);
      if (tokeniser.token.slash) {
        tagOptions.selfClosingTag = true;
        tokeniser.getNextToken();
      }
      if (tokeniser.token.gt && lineHasElement) {
        tagOptions.outerWhitespace = false;
        tokeniser.getNextToken();
      }
      if (tokeniser.token.lt && lineHasElement) {
        tagOptions.innerWhitespace = false;
        tokeniser.getNextToken();
      }
      if (lineHasElement) {
        if (!tagOptions.selfClosingTag) {
          tagOptions.selfClosingTag = haml._isSelfClosingTag(identifier) && !haml._tagHasContents(indent, tokeniser);
        }
        haml._openElement(currentParsePoint, indent, identifier, id, classes, objectRef, attrList, attributesHash, elementStack, tagOptions, generator);
      } else if (!tokeniser.isEolOrEof() && !tokeniser.token.ws) {
        tokeniser.pushBackToken();
      }
      hasContents = false;
      if (tokeniser.token.ws) tokeniser.getNextToken();
      if (tokeniser.token.equal || tokeniser.token.escapeHtml || tokeniser.token.unescapeHtml) {
        haml._embeddedJs(tokeniser, indent + 1, null, tagOptions, generator);
        hasContents = true;
      } else {
        contents = '';
        shouldInterpolate = false;
        if (tokeniser.token.exclamation) {
          contents = tokeniser.skipToEOLorEOF();
        } else if (!tokeniser.token.eol) {
          tokeniser.pushBackToken();
          contents = tokeniser.skipToEOLorEOF();
          if (contents.match(/^\\%/)) contents = contents.substring(1);
          shouldInterpolate = true;
        }
        hasContents = contents.length > 0;
        if (hasContents) {
          if (tagOptions.innerWhitespace && lineHasElement || (!lineHasElement && haml._parentInnerWhitespace(elementStack, indent))) {
            indentText = HamlRuntime.indentText(identifier.length > 0 ? indent + 1 : indent);
          } else {
            indentText = '';
            contents = _(contents).trim();
          }
          generator.appendTextContents(indentText + contents + '\n', shouldInterpolate, currentParsePoint);
        }
      }
      haml._eolOrEof(tokeniser);
      if (tagOptions.selfClosingTag && hasContents) {
        throw haml.HamlRuntime.templateError(currentParsePoint.lineNumber, currentParsePoint.characterNumber, currentParsePoint.currentLine, "A self-closing tag can not have any contents");
      }
    },
    _attributeHash: function(tokeniser) {
      var attr;
      attr = '';
      if (tokeniser.token.attributeHash) {
        attr = tokeniser.token.tokenString;
        tokeniser.getNextToken();
      }
      return attr;
    },
    _objectReference: function(tokeniser) {
      var attr;
      attr = '';
      if (tokeniser.token.objectReference) {
        attr = tokeniser.token.tokenString;
        tokeniser.getNextToken();
      }
      return attr;
    },
    _attributeList: function(tokeniser) {
      var attr, attrList;
      attrList = {};
      if (tokeniser.token.openBracket) {
        tokeniser.getNextToken();
        while (!tokeniser.token.closeBracket) {
          attr = haml._attribute(tokeniser);
          if (attr) {
            attrList[attr.name] = attr.value;
          } else {
            tokeniser.getNextToken();
          }
          if (tokeniser.token.ws || tokeniser.token.eol) {
            tokeniser.getNextToken();
          } else if (!tokeniser.token.closeBracket && !tokeniser.token.identifier) {
            throw tokeniser.parseError("Expecting either an attribute name to continue the attibutes or a closing " + "bracket to end");
          }
        }
        tokeniser.getNextToken();
      }
      return attrList;
    },
    _attribute: function(tokeniser) {
      var attr, name;
      attr = null;
      if (tokeniser.token.identifier) {
        name = tokeniser.token.tokenString;
        tokeniser.getNextToken();
        haml._whitespace(tokeniser);
        if (!tokeniser.token.equal) {
          throw tokeniser.parseError("Expected '=' after attribute name");
        }
        tokeniser.getNextToken();
        haml._whitespace(tokeniser);
        if (!tokeniser.token.string && !tokeniser.token.identifier) {
          throw tokeniser.parseError("Expected a quoted string or an identifier for the attribute value");
        }
        attr = {
          name: name,
          value: tokeniser.token.tokenString
        };
        tokeniser.getNextToken();
      }
      return attr;
    },
    _closeElement: function(indent, elementStack, tokeniser, generator) {
      var innerWhitespace, outerWhitespace;
      if (elementStack[indent]) {
        generator.setIndent(indent);
        if (elementStack[indent].htmlComment) {
          generator.outputBuffer.append(HamlRuntime.indentText(indent) + '-->\n');
        } else if (elementStack[indent].htmlConditionalComment) {
          generator.outputBuffer.append(HamlRuntime.indentText(indent) + '<![endif]-->\n');
        } else if (elementStack[indent].block) {
          generator.closeOffCodeBlock(tokeniser);
        } else if (elementStack[indent].fnBlock) {
          generator.closeOffFunctionBlock(tokeniser);
        } else {
          innerWhitespace = !elementStack[indent].tagOptions || elementStack[indent].tagOptions.innerWhitespace;
          if (innerWhitespace) {
            generator.outputBuffer.append(HamlRuntime.indentText(indent));
          } else {
            generator.outputBuffer.trimWhitespace();
          }
          generator.outputBuffer.append('</' + elementStack[indent].tag + '>');
          outerWhitespace = !elementStack[indent].tagOptions || elementStack[indent].tagOptions.outerWhitespace;
          if (haml._parentInnerWhitespace(elementStack, indent) && outerWhitespace) {
            generator.outputBuffer.append('\n');
          }
        }
        elementStack[indent] = null;
        return generator.mark();
      }
    },
    _closeElements: function(indent, elementStack, tokeniser, generator) {
      var i, _results;
      i = elementStack.length - 1;
      _results = [];
      while (i >= indent) {
        _results.push(haml._closeElement(i--, elementStack, tokeniser, generator));
      }
      return _results;
    },
    _openElement: function(currentParsePoint, indent, identifier, id, classes, objectRef, attributeList, attributeHash, elementStack, tagOptions, generator) {
      var element, parentInnerWhitespace, tagOuterWhitespace;
      element = identifier.length === 0 ? "div" : identifier;
      parentInnerWhitespace = haml._parentInnerWhitespace(elementStack, indent);
      tagOuterWhitespace = !tagOptions || tagOptions.outerWhitespace;
      if (!tagOuterWhitespace) generator.outputBuffer.trimWhitespace();
      if (indent > 0 && parentInnerWhitespace && tagOuterWhitespace) {
        generator.outputBuffer.append(HamlRuntime.indentText(indent));
      }
      generator.outputBuffer.append('<' + element);
      if (attributeHash.length > 0 || objectRef.length > 0) {
        generator.generateCodeForDynamicAttributes(id, classes, attributeList, attributeHash, objectRef, currentParsePoint);
      } else {
        generator.outputBuffer.append(haml.HamlRuntime.generateElementAttributes(null, id, classes, null, attributeList, null, currentParsePoint.lineNumber, currentParsePoint.characterNumber, currentParsePoint.currentLine));
      }
      if (tagOptions.selfClosingTag) {
        generator.outputBuffer.append("/>");
        if (tagOptions.outerWhitespace) return generator.outputBuffer.append("\n");
      } else {
        generator.outputBuffer.append(">");
        elementStack[indent] = {
          tag: element,
          tagOptions: tagOptions
        };
        if (tagOptions.innerWhitespace) return generator.outputBuffer.append("\n");
      }
    },
    _isSelfClosingTag: function(tag) {
      return tag === 'meta' || tag === 'img' || tag === 'link' || tag === 'script' || tag === 'br' || tag === 'hr';
    },
    _tagHasContents: function(indent, tokeniser) {
      var nextToken;
      if (!tokeniser.isEolOrEof()) {
        return true;
      } else {
        nextToken = tokeniser.lookAhead(1);
        return nextToken.ws && nextToken.tokenString.length / 2 > indent;
      }
    },
    _parentInnerWhitespace: function(elementStack, indent) {
      return indent === 0 || (!elementStack[indent - 1] || !elementStack[indent - 1].tagOptions || elementStack[indent - 1].tagOptions.innerWhitespace);
    },
    _lineHasElement: function(identifier, id, classes) {
      return identifier.length > 0 || id.length > 0 || classes.length > 0;
    },
    hasValue: function(value) {
      return (value != null) && value !== false;
    },
    attrValue: function(attr, value) {
      if (attr === 'selected' || attr === 'checked' || attr === 'disabled') {
        return attr;
      } else {
        return value;
      }
    },
    _whitespace: function(tokeniser) {
      var indent;
      indent = 0;
      if (tokeniser.token.ws) {
        indent = tokeniser.token.tokenString.length / 2;
        tokeniser.getNextToken();
      }
      return indent;
    },
    _element: function(tokeniser) {
      var identifier;
      identifier = '';
      if (tokeniser.token.element) {
        identifier = tokeniser.token.tokenString;
        tokeniser.getNextToken();
      }
      return identifier;
    },
    _eolOrEof: function(tokeniser) {
      if (tokeniser.token.eol || tokeniser.token.continueLine) {
        return tokeniser.getNextToken();
      } else if (!tokeniser.token.eof) {
        throw tokeniser.parseError("Expected EOL or EOF");
      }
    },
    _idSelector: function(tokeniser) {
      var id;
      id = '';
      if (tokeniser.token.idSelector) {
        id = tokeniser.token.tokenString;
        tokeniser.getNextToken();
      }
      return id;
    },
    _classSelector: function(tokeniser) {
      var classes;
      classes = [];
      while (tokeniser.token.classSelector) {
        classes.push(tokeniser.token.tokenString);
        tokeniser.getNextToken();
      }
      return classes;
    }
  };

  root.haml.Tokeniser = Tokeniser;

  root.haml.Buffer = Buffer;

  root.haml.JsCodeGenerator = JsCodeGenerator;

  root.haml.CoffeeCodeGenerator = CoffeeCodeGenerator;

  root.haml.HamlRuntime = HamlRuntime;

  root.haml.filters = filters;

}).call(this);
/*! jQuery v1.7.1 jquery.com | jquery.org/license */
(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cv(a){if(!ck[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){cl||(cl=c.createElement("iframe"),cl.frameBorder=cl.width=cl.height=0),b.appendChild(cl);if(!cm||!cl.createElement)cm=(cl.contentWindow||cl.contentDocument).document,cm.write((c.compatMode==="CSS1Compat"?"<!doctype html>":"")+"<html><body>"),cm.close();d=cm.createElement(a),cm.body.appendChild(d),e=f.css(d,"display"),b.removeChild(cl)}ck[a]=e}return ck[a]}function cu(a,b){var c={};f.each(cq.concat.apply([],cq.slice(0,b)),function(){c[this]=a});return c}function ct(){cr=b}function cs(){setTimeout(ct,0);return cr=f.now()}function cj(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ci(){try{return new a.XMLHttpRequest}catch(b){}}function cc(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function cb(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function ca(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){c||bE.test(a)?d(a,e):ca(a+"["+(typeof e=="object"||f.isArray(e)?b:"")+"]",e,c,d)});else if(!c&&b!=null&&typeof b=="object")for(var e in b)ca(a+"["+e+"]",b[e],c,d);else d(a,b)}function b_(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);e&&f.extend(!0,a,e)}function b$(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bT,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=b$(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=b$(a,c,d,e,"*",g));return l}function bZ(a){return function(b,c){typeof b!="string"&&(c=b,b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bP),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bC(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?bx:by,g=0,h=e.length;if(d>0){if(c!=="border")for(;g<h;g++)c||(d-=parseFloat(f.css(a,"padding"+e[g]))||0),c==="margin"?d+=parseFloat(f.css(a,c+e[g]))||0:d-=parseFloat(f.css(a,"border"+e[g]+"Width"))||0;return d+"px"}d=bz(a,b,b);if(d<0||d==null)d=a.style[b]||0;d=parseFloat(d)||0;if(c)for(;g<h;g++)d+=parseFloat(f.css(a,"padding"+e[g]))||0,c!=="padding"&&(d+=parseFloat(f.css(a,"border"+e[g]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+e[g]))||0);return d+"px"}function bp(a,b){b.src?f.ajax({url:b.src,async:!1,dataType:"script"}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"/*$0*/")),b.parentNode&&b.parentNode.removeChild(b)}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm)}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bk(a,b){var c;if(b.nodeType===1){b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase();if(c==="object")b.outerHTML=a.outerHTML;else if(c!=="input"||a.type!=="checkbox"&&a.type!=="radio"){if(c==="option")b.selected=a.defaultSelected;else if(c==="input"||c==="textarea")b.defaultValue=a.defaultValue}else a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value);b.removeAttribute(f.expando)}}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c+(i[c][d].namespace?".":"")+i[c][d].namespace,i[c][d],i[c][d].data)}h.data&&(h.data=f.extend({},h.data))}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d)}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?parseFloat(d):j.test(d)?f.parseJSON(d):d}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/ig,w=/^-ms-/,x=function(a,b){return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a)}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return e.makeArray(a,this)},selector:"",jquery:"1.7.1",length:0,size:function(){return this.length},toArray:function(){return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","))},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){return a&&typeof a=="object"&&"setInterval"in a},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return(new Function("return "+b))();e.error("Invalid JSON: "+b)},parseXML:function(c){var d,f;try{a.DOMParser?(f=new DOMParser,d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a)}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a)}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;return g},access:function(a,c,d,f,g,h){var i=a.length;if(typeof c=="object"){for(var j in c)e.access(a,j,c[j],f,g,d);return a}if(d!==b){f=!h&&f&&e.isFunction(d);for(var k=0;k<i;k++)g(a[k],c,f?d.call(a[k],k,g(a[k],c)):d,h);return a}return i?g(a[0],c):b},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m=function(b){var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?m(g):h==="function"&&(!a.unique||!o.has(g))&&c.push(g)},n=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,l=j||0,j=0,k=c.length;for(;c&&l<k;l++)if(c[l].apply(b,f)===!1&&a.stopOnFalse){e=!0;break}i=!1,c&&(a.once?e===!0?o.disable():c=[]:d&&d.length&&(e=d.shift(),o.fireWith(e[0],e[1])))},o={add:function(){if(c){var a=c.length;m(arguments),i?k=c.length:e&&e!==!0&&(j=a,n(e[0],e[1]))}return this},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){i&&f<=k&&(k--,f<=l&&l--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&o.disable();return this},locked:function(){return!d},fireWith:function(b,c){d&&(i?a.once||d.push([b,c]):(!a.once||!e)&&n(b,c));return this},fire:function(){o.fireWith(this,arguments);return this},fired:function(){return!!e}};return o};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g])}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved"},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p,q=c.createElement("div"),r=c.documentElement;q.setAttribute("className","t"),q.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",d=q.getElementsByTagName("*"),e=q.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=q.getElementsByTagName("input")[0],b={leadingWhitespace:q.firstChild.nodeType===3,tbody:!q.getElementsByTagName("tbody").length,htmlSerialize:!!q.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:q.className!=="t",enctype:!!c.createElement("form").enctype,html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0},i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,b.optDisabled=!h.disabled;try{delete q.test}catch(s){b.deleteExpando=!1}!q.addEventListener&&q.attachEvent&&q.fireEvent&&(q.attachEvent("onclick",function(){b.noCloneEvent=!1}),q.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),b.radioValue=i.value==="t",i.setAttribute("checked","checked"),q.appendChild(i),k=c.createDocumentFragment(),k.appendChild(q.lastChild),b.checkClone=k.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=i.checked,k.removeChild(i),k.appendChild(q),q.innerHTML="",a.getComputedStyle&&(j=c.createElement("div"),j.style.width="0",j.style.marginRight="0",q.style.width="2px",q.appendChild(j),b.reliableMarginRight=(parseInt((a.getComputedStyle(j,null)||{marginRight:0}).marginRight,10)||0)===0);if(q.attachEvent)for(o in{submit:1,change:1,focusin:1})n="on"+o,p=n in q,p||(q.setAttribute(n,"return;"),p=typeof q[n]=="function"),b[o+"Bubbles"]=p;k.removeChild(q),k=g=h=j=q=i=null,f(function(){var a,d,e,g,h,i,j,k,m,n,o,r=c.getElementsByTagName("body")[0];!r||(j=1,k="position:absolute;top:0;left:0;width:1px;height:1px;margin:0;",m="visibility:hidden;border:0;",n="style='"+k+"border:5px solid #000;padding:0;'",o="<div "+n+"><div></div></div>"+"<table "+n+" cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",a=c.createElement("div"),a.style.cssText=m+"width:0;height:0;position:static;top:0;margin-top:"+j+"px",r.insertBefore(a,r.firstChild),q=c.createElement("div"),a.appendChild(q),q.innerHTML="<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>",l=q.getElementsByTagName("td"),p=l[0].offsetHeight===0,l[0].style.display="",l[1].style.display="none",b.reliableHiddenOffsets=p&&l[0].offsetHeight===0,q.innerHTML="",q.style.width=q.style.paddingLeft="1px",f.boxModel=b.boxModel=q.offsetWidth===2,typeof q.style.zoom!="undefined"&&(q.style.display="inline",q.style.zoom=1,b.inlineBlockNeedsLayout=q.offsetWidth===2,q.style.display="",q.innerHTML="<div style='width:4px;'></div>",b.shrinkWrapBlocks=q.offsetWidth!==2),q.style.cssText=k+m,q.innerHTML=o,d=q.firstChild,e=d.firstChild,h=d.nextSibling.firstChild.firstChild,i={doesNotAddBorder:e.offsetTop!==5,doesAddBorderForTableAndCells:h.offsetTop===5},e.style.position="fixed",e.style.top="20px",i.fixedPosition=e.offsetTop===20||e.offsetTop===15,e.style.position=e.style.top="",d.style.overflow="hidden",d.style.position="relative",i.subtractsBorderForOverflowNotVisible=e.offsetTop===-5,i.doesNotIncludeMarginInBodyOffset=r.offsetTop!==j,r.removeChild(a),q=a=null,f.extend(b,i))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null)}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h=null;if(typeof a=="undefined"){if(this.length){h=f.data(this[0]);if(this[0].nodeType===1&&!f._data(this[0],"parsedAttrs")){e=this[0].attributes;for(var i=0,j=e.length;i<j;i++)g=e[i].name,g.indexOf("data-")===0&&(g=f.camelCase(g.substring(5)),l(this[0],g,h[g]));f._data(this[0],"parsedAttrs",!0)}}return h}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split("."),d[1]=d[1]?"."+d[1]:"";if(c===b){h=this.triggerHandler("getData"+d[1]+"!",[d[0]]),h===b&&this.length&&(h=f.data(this[0],a),h=l(this[0],a,h));return h===b&&d[1]?this.data(d[0]):h}return this.each(function(){var b=f(this),e=[d[0],c];b.triggerHandler("setData"+d[1]+"!",e),f.data(this,a,c),b.triggerHandler("changeData"+d[1]+"!",e)})},removeData:function(a){return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){typeof a!="string"&&(c=a,a="fx");if(c===b)return f.queue(this[0],a);return this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a)})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e])}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,l.add(m);m();return d.promise()}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;f.fn.extend({attr:function(a,b){return f.access(this,a,b,!0,f.attr)},removeAttr:function(a){return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,a,b,!0,f.prop)},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g)}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){return a==null?"":a+""})),c=f.valHooks[this.nodeName.toLowerCase()]||f.valHooks[this.type];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h}})}if(g){c=f.valHooks[g.nodeName.toLowerCase()]||f.valHooks[g.type];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),g=d.length;for(;h<g;h++)e=d[h],e&&(c=f.propFix[e]||e,f.attr(a,e,""),a.removeAttribute(v?e:c),u.test(e)&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c]}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));return c}},v||(y={name:!0,id:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/\bhover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(a){var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value))},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};
f.event={add:function(a,c,d,e,g){var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,d=p.handler),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:G(g),namespace:n.join(".")},p),r=j[m];if(!r){r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i)}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0))}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s])}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=[],j,k,l,m,n,o,p,q,r,s,t;g[0]=c,c.delegateTarget=this;if(e&&!c.target.disabled&&(!c.button||c.type!=="click")){m=f(this),m.context=this.ownerDocument||this;for(l=c.target;l!=this;l=l.parentNode||this){o={},q=[],m[0]=l;for(j=0;j<e;j++)r=d[j],s=r.selector,o[s]===b&&(o[s]=r.quick?H(l,r.quick):m.is(s)),o[s]&&q.push(r);q.length&&i.push({elem:l,matches:q})}}d.length>e&&i.push({elem:this,matches:d.slice(e)});for(j=0;j<i.length&&!c.isPropagationStopped();j++){p=i[j],c.currentTarget=p.elem;for(k=0;k<p.matches.length&&!c.isImmediatePropagationStopped();k++){r=p.matches[k];if(h||!c.namespace&&!r.namespace||c.namespace_re&&c.namespace_re.test(r.namespace))c.data=r.data,c.handleObj=r,n=((f.event.special[r.origType]||{}).handle||r.handler).apply(p.elem,g),n!==b&&(c.result=n,n===!1&&(c.preventDefault(),c.stopPropagation()))}}return c.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation()},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0)}),d._submit_attached=!0)})},teardown:function(){if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0)})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0)};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0)}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=c,c=b);for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments)},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on.call(this,a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;f(a.delegateTarget).off(e.namespace?e.type+"."+e.namespace:e.type,e.selector,e.handler);return this}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c)},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b)},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks)}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f)}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9){if(typeof a.textContent=="string")return a.textContent;if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a)}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null)},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f)}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.POS,R={children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d))},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling")},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling")},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c)},siblings:function(a){return f.sibling(a.parentNode.firstChild,a)},children:function(a){return f.sibling(a.firstChild)},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes)}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","))}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b)},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){if(f.isFunction(a))return this.each(function(b){var c=f(this);c.text(a.call(this,b,c.text()))});if(typeof a!="object"&&a!==b)return this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a));return f.text(this)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b))});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b))});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=f.clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function()
{for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b)})},html:function(a){if(a===b)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(W,""):null;if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Y,"<$1></$2>");try{for(var c=0,d=this.length;c<d;c++)this[c].nodeType===1&&(f.cleanData(this[c].getElementsByTagName("*")),this[c].innerHTML=a)}catch(e){this.empty().append(a)}}else f.isFunction(a)?this.each(function(b){var c=f(this);c.html(a.call(this,b,c.html()))}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h)}k.length&&f.each(k,bp)}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector)}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||!bc.test("<"+a.nodeName)?a.cloneNode(!0):bo(a);if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g])}}d=e=null;return h},clean:function(a,b,d,e){var g;b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);var h=[],i;for(var j=0,k;(k=a[j])!=null;j++){typeof k=="number"&&(k+="");if(!k)continue;if(typeof k=="string")if(!_.test(k))k=b.createTextNode(k);else{k=k.replace(Y,"<$1></$2>");var l=(Z.exec(k)||["",""])[1].toLowerCase(),m=bg[l]||bg._default,n=m[0],o=b.createElement("div");b===c?bh.appendChild(o):U(b).appendChild(o),o.innerHTML=m[1]+k+m[2];while(n--)o=o.lastChild;if(!f.support.tbody){var p=$.test(k),q=l==="table"&&!p?o.firstChild&&o.firstChild.childNodes:m[1]==="<table>"&&!p?o.childNodes:[];for(i=q.length-1;i>=0;--i)f.nodeName(q[i],"tbody")&&!q[i].childNodes.length&&q[i].parentNode.removeChild(q[i])}!f.support.leadingWhitespace&&X.test(k)&&o.insertBefore(b.createTextNode(X.exec(k)[0]),o.firstChild),k=o.childNodes}var r;if(!f.support.appendChecked)if(k[0]&&typeof (r=k.length)=="number")for(i=0;i<r;i++)bn(k[i]);else bn(k);k.nodeType?h.push(k):h=f.merge(h,k)}if(d){g=function(a){return!a.type||be.test(a.type)};for(j=0;h[j];j++)if(e&&f.nodeName(h[j],"script")&&(!h[j].type||h[j].type.toLowerCase()==="text/javascript"))e.push(h[j].parentNode?h[j].parentNode.removeChild(h[j]):h[j]);else{if(h[j].nodeType===1){var s=f.grep(h[j].getElementsByTagName("script"),g);h.splice.apply(h,[j+1,0].concat(s))}d.appendChild(h[j])}}return h},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),delete d[c]}}}});var bq=/alpha\([^)]*\)/i,br=/opacity=([^)]*)/,bs=/([A-Z]|^ms)/g,bt=/^-?\d+(?:px)?$/i,bu=/^-?\d/,bv=/^([\-+])=([\-+.\de]+)/,bw={position:"absolute",visibility:"hidden",display:"block"},bx=["Left","Right"],by=["Top","Bottom"],bz,bA,bB;f.fn.css=function(a,c){if(arguments.length===2&&c===b)return this;return f.access(this,a,c,!0,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)})},f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=bz(a,"opacity","opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;return j[c]}h=typeof d,h==="string"&&(g=bv.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(bz)return bz(a,c)},swap:function(a,b,c){var d={};for(var e in b)d[e]=a.style[e],a.style[e]=b[e];c.call(a);for(e in b)a.style[e]=d[e]}}),f.curCSS=f.css,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){var e;if(c){if(a.offsetWidth!==0)return bC(a,b,d);f.swap(a,bw,function(){e=bC(a,b,d)});return e}},set:function(a,b){if(!bt.test(b))return b;b=parseFloat(b);if(b>=0)return b+"px"}}}),f.support.opacity||(f.cssHooks.opacity={get:function(a,b){return br.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&f.trim(g.replace(bq,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bq.test(g)?g.replace(bq,e):g+" "+e}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){var c;f.swap(a,{display:"inline-block"},function(){b?c=bz(a,"margin-right","marginRight"):c=a.style.marginRight});return c}})}),c.defaultView&&c.defaultView.getComputedStyle&&(bA=function(a,b){var c,d,e;b=b.replace(bs,"-$1").toLowerCase(),(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b)));return c}),c.documentElement.currentStyle&&(bB=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;f===null&&g&&(e=g[b])&&(f=e),!bt.test(f)&&bu.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),g.left=b==="fontSize"?"1em":f||0,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f}),bz=bA||bB,f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none"},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)});var bD=/%20/g,bE=/\[\]$/,bF=/\r?\n/g,bG=/#.*$/,bH=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bI=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bJ=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bK=/^(?:GET|HEAD)$/,bL=/^\/\//,bM=/\?/,bN=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bO=/^(?:select|textarea)/i,bP=/\s+/,bQ=/([?&])_=[^&]*/,bR=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bS=f.fn.load,bT={},bU={},bV,bW,bX=["*/"]+["*"];try{bV=e.href}catch(bY){bV=c.createElement("a"),bV.href="",bV=bV.href}bW=bR.exec(bV.toLowerCase())||[],f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bS)return bS.apply(this,arguments);if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?f("<div>").append(c.replace(bN,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bO.test(this.nodeName)||bI.test(this.type))}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{name:b.name,value:a.replace(bF,"\r\n")}}):{name:b.name,value:c.replace(bF,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json")},ajaxSetup:function(a,b){b?b_(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b_(a,b);return a},ajaxSettings:{url:bV,isLocal:bJ.test(bW[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":bX},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:bZ(bT),ajaxTransport:bZ(bU),ajax:function(a,c){function w(a,c,l,m){if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?cb(d,v,l):b,y,z;if(a>=200&&a<300||a===304){if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z}if(a===304)w="notmodified",o=!0;else try{r=cc(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){if(!o){o={};while(c=bH.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bG,"").replace(bL,bW[1]+"//"),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bP),d.crossDomain==null&&(r=bR.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bW[1]&&r[2]==bW[2]&&(r[3]||(r[1]==="http:"?80:443))==(bW[3]||(bW[1]==="http:"?80:443)))),d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),b$(bT,d,c,v);if(s===2)return!1;t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bK.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");if(!d.hasContent){d.data&&(d.url+=(bM.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){var x=f.now(),y=d.url.replace(bQ,"$1_="+x);d.url=y+(y===d.url?(bM.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bX+"; q=0.01":""):d.accepts["*"]);for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=b$(bU,d,c,v);if(!p)w(-1,"No Transport");else{v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout")},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){e(this.name,this.value)});else for(var g in a)ca(g,a[g],c,e);return d.join("&").replace(bD,"+")}}),f.extend({active:0,lastModified:{},etag:{}});var cd=f.now(),ce=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return f.expando+"_"+cd++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=b.contentType==="application/x-www-form-urlencoded"&&typeof b.data=="string";if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(ce.test(b.url)||e&&ce.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";b.jsonp!==!1&&(j=j.replace(ce,l),b.url===j&&(e&&(k=k.replace(ce,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var cf=a.ActiveXObject?function(){for(var a in ch)ch[a](0,1)}:!1,cg=0,ch;f.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&ci()||cj()}:ci,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j])}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){d=b,i&&(h.onreadystatechange=f.noop,cf&&delete ch[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n),m.text=h.responseText;try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204)}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cg,cf&&(ch||(ch={},f(a).unload(cf)),ch[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var ck={},cl,cm,cn=/^(?:toggle|show|hide)$/,co=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,cp,cq=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cr;f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(cu("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),e===""&&f.css(d,"display")==="none"&&f._data(d,"olddisplay",cv(d.nodeName)));for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||""}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(cu("hide",3),a,b,c);var d,e,g=0,h=this.length;for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(cu("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o;b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]),h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cv(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1))}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cn.test(h)?(o=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),o?(f._data(this,"toggle"+i,o==="show"?"hide":"show"),j[o]()):j[h]()):(k=co.exec(h),l=j.cur(),k?(m=parseFloat(k[2]),n=k[3]||(f.cssNumber[i]?"":"px"),n!=="px"&&(f.style(this,i,(m||1)+n),l=(m||1)/j.cur()*l,f.style(this,i,l+n)),k[1]&&(m=(k[1]==="-="?-1:1)*m+l),j.custom(l,m,n)):j.custom(l,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:cu("show",1),slideUp:cu("hide",1),slideToggle:cu("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a,b,c,d){return c+d*a},swing:function(a,b,c,d){return(-Math.cos(a*Math.PI)/2+.5)*d+c}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cr||cs(),this.end=c,this.now=this.start=a,this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,h.elem=this.elem,h.saveState=function(){e.options.hide&&f._data(e.elem,"fxshow"+e.prop)===b&&f._data(e.elem,"fxshow"+e.prop,e.start)},h()&&f.timers.push(h)&&!cp&&(cp=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cr||cs(),g=!0,h=this.elem,i=this.options;if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h))}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop()},interval:13,stop:function(){clearInterval(cp),cp=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now}}}),f.each(["width","height"],function(a,b){f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit)}}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){return a===b.elem}).length});var cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?f.fn.offset=function(a){var b=this[0],c;if(a)return this.each(function(b){f.offset.setOffset(this,a,b)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return f.offset.bodyOffset(b);try{c=b.getBoundingClientRect()}catch(d){}var e=b.ownerDocument,g=e.documentElement;if(!c||!f.contains(g,b))return c?{top:c.top,left:c.left}:{top:0,left:0};var h=e.body,i=cy(e),j=g.clientTop||h.clientTop||0,k=g.clientLeft||h.clientLeft||0,l=i.pageYOffset||f.support.boxModel&&g.scrollTop||h.scrollTop,m=i.pageXOffset||f.support.boxModel&&g.scrollLeft||h.scrollLeft,n=c.top+l-j,o=c.left+m-k;return{top:n,left:o}}:f.fn.offset=function(a){var b=this[0];if(a)return this.each(function(b){f.offset.setOffset(this,a,b)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return f.offset.bodyOffset(b);var c,d=b.offsetParent,e=b,g=b.ownerDocument,h=g.documentElement,i=g.body,j=g.defaultView,k=j?j.getComputedStyle(b,null):b.currentStyle,l=b.offsetTop,m=b.offsetLeft;while((b=b.parentNode)&&b!==i&&b!==h){if(f.support.fixedPosition&&k.position==="fixed")break;c=j?j.getComputedStyle(b,null):b.currentStyle,l-=b.scrollTop,m-=b.scrollLeft,b===d&&(l+=b.offsetTop,m+=b.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(b.nodeName))&&(l+=parseFloat(c.borderTopWidth)||0,m+=parseFloat(c.borderLeftWidth)||0),e=d,d=b.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&c.overflow!=="visible"&&(l+=parseFloat(c.borderTopWidth)||0,m+=parseFloat(c.borderLeftWidth)||0),k=c}if(k.position==="relative"||k.position==="static")l+=i.offsetTop,m+=i.offsetLeft;f.support.fixedPosition&&k.position==="fixed"&&(l+=Math.max(h.scrollTop,i.scrollTop),m+=Math.max(h.scrollLeft,i.scrollLeft));return{top:l,left:m}},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k)}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each(["Left","Top"],function(a,c){var d="scroll"+c;f.fn[d]=function(c){var e,g;if(c===b){e=this[0];if(!e)return null;g=cy(e);return g?"pageXOffset"in g?g[a?"pageYOffset":"pageXOffset"]:f.support.boxModel&&g.document.documentElement[d]||g.document.body[d]:e[d]}return this.each(function(){g=cy(this),g?g.scrollTo(a?f(g).scrollLeft():c,a?c:f(g).scrollTop()):this[d]=c})}}),f.each(["Height","Width"],function(a,c){var d=c.toLowerCase();f.fn["inner"+c]=function(){var a=this[0];return a?a.style?parseFloat(f.css(a,d,"padding")):this[d]():null},f.fn["outer"+c]=function(a){var b=this[0];return b?b.style?parseFloat(f.css(b,d,a?"margin":"border")):this[d]():null},f.fn[d]=function(a){var e=this[0];if(!e)return a==null?null:this;if(f.isFunction(a))return this.each(function(b){var c=f(this);c[d](a.call(this,b,c[d]()))});if(f.isWindow(e)){var g=e.document.documentElement["client"+c],h=e.document.body;return e.document.compatMode==="CSS1Compat"&&g||h&&h["client"+c]||g}if(e.nodeType===9)return Math.max(e.documentElement["client"+c],e.body["scroll"+c],e.documentElement["scroll"+c],e.body["offset"+c],e.documentElement["offset"+c]);if(a===b){var i=f.css(e,d),j=parseFloat(i);return f.isNumeric(j)?j:i}return this.css(d,typeof a=="string"?a:a+"px")}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return f})})(window);
var exports = {}

// Sass - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

// changed by makevoid to support IE8 trough underscore

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
  // changed by makevoid to support IE8 trough underscore
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



