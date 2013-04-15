/* Lodash definition, written by Brian as I use them */

/* USAGE

   /// <reference path="lodash.d.ts"/>
   var _ : Lodash = require('lodash.js');

 */


interface Lodash {

  after (times : number, f : () => void) : () => void;
  all : Function;
  any : Function;
  assign : Function;
  at (a : any, indices : number[]) : any[];
  bindAll : Function;
  bind : Function;
  bindKey : Function;
  cloneDeep (x : any, callback ?: Function, thisArg ?: any) : any;
  clone (x : any, deep ?: bool, callback ?: Function, thisArg ?: any) : any;
  collect : Function;
  compact (a : any[]) : any[];
  compose (f : (any) => any, g : (any) => any) : (any) => any;
  contains : Function;
  countBy : Function;
  createCallback : Function;
  debounce : Function;
  defaults : Function;
  defer (f : Function, ...args : any[]) : void;
  delay (f : Function, delay : number, ...args : any[]) : void;
  detect : Function;
  difference (a : any[], b : any[]) : any[];
  drop : Function;
  each : Function;
  escape (s : string) : string;
  every : Function;
  extend : Function;
  filter : Function;
  // filter id
  find : Function;
  findIndex : Function;
  findKey : Function;
  first : Function;
  flatten : Function;
  foldl : Function;
  foldr : Function;
  forEach : Function;
  forIn : Function;
  forOwn : Function;
  functions : Function;
  groupBy : Function;
  has : Function;
  head (a : any[]) : any;
  identity (x : any) : any;
  include : Function;
  indexOf : Function;
  initial : Function;
  inject : Function;
  intersection : Function;
  invert : Function;
  invoke : Function;
  isArguments (x : any) : bool;
  isArray (x : any) : bool;
  isBoolean (x : any) : bool;
  isDate (x : any) : bool;
  isElement (x : any) : bool;
  isEmpty (x : any) : bool;
  isEqual (x : any) : bool;
  isFinite (x : any) : bool;
  isFunction (x : any) : bool;
  isNaN (x : any) : bool;
  isNull (x : any) : bool;
  isNumber (x : any) : bool;
  isObject (x : any) : bool;
  isPlainObject (x : any) : bool;
  isRegExp (x : any) : bool;
  isString (x : any) : bool;
  isUndefined (x : any) : bool;
  keys (obj : Object) : any[];
  last : Function;
  lastIndexOf : Function;
  // length of array or object
  map (a : any[], f : (x : any) => any) : any[];
  max : Function;
  memoize (f : Function, resolver ?: Function) : Function;
  merge : Function;
  methods : Function;
  min : Function;
  mixin : Function;
  // namespaces
  noConflict : Function;
  object : Function;
  omit : Function;
  once : Function;
  pairs (obj : Object) : any[][];
  parseInt (s : string) : number;
  partial : Function;
  partialRight : Function;
  pick : Function;
  pluck (collection : any, property : string) : any[];
  // random integer between minimum and maximum
  random (min ?: number, max ?: number) : number;
  range (n : number) : number[];
  reduce (a : any[], f : (x : any, y : any) => any) : any;
  reduceRight : Function;
  reject : Function;
  rest : Function;
  result : Function;
  runInContext : Function;
  select : Function;
  shuffle (a : any[]) : any[];
  size (collection : any) : number;
  some : Function;
  sortBy : Function;
  sortedIndex : Function;
  tail (a : any[]) : any[];
  take : Function;
  tap : Function;
  template : Function;
  // this actually works because types and values have separate
  throttle : Function;
  times : Function;
  toArray : Function;
  unescape (n : number) : string;
  union : Function;
  uniq : Function;
  unique : Function;
  uniqueId (s ?: string) : string;
  values (obj : Object) : any[];
  where : Function;
  without : Function;
  wrap : Function;
  zip : Function;
  zipObject : Function;

}
