function f() {
    console.log("hello");
}

// f()


function g(s : string) : number {
    return s.length;
}

g("hello");
// g(5);

function h(s : string, callback : (result : string) => any) : any {
    callback(s + "hello");
}

h("hello", g);

// any type can be undefined or null
var x : number = undefined;
var y : string = undefined;
var z : number = null;

// short anonymous functions
var plus = (x, y) => x + y
// and they can have type annotations
var add = (x : number, y : number) : number => x + y
// you can type functions, too
var sum : (a : number, b : number) => number = add

interface coord {
    x : number;
    y : number;
}

// I need an explicit return because {x : 0.0} looks like the block
// {
//    x : 0.0
// }

var makePoint : () => coord = () => {return {x : 0.0, y : 0.0};};

var makePoint2 : () => coord = makePoint;

interface person {
    name : string;
    // age is optional
    age? : number;
}

// anonymous functions can go to a block with an explicit return
var summary : (p : person) => string = (p) => {
    var s = p.name + " is " + p.age + "years old";
    // this won't compile because x is not in the interface
    // var x = p.foo;
    return s;
}
summary({name: "Steve", age: 5});
// This still passes because age is optional. However, this is still
// bad, so try to avoid making fields options.
summary({name: "Steve"});
// extra stuff is fine
summary({name: "Steve", age: 5, foo: "bar"});

(function() {
    // since functions are object, obj.x and obj("a", "b") are valid.

    // However, due to limitations in typescript, I can't figure out
    // a way to actually declare it, but hey, who cares.

    // Finally, I need semicolons between fields of anonymous interfaces.
    var obj : { x: number; (s : string, t : string) : number;};

})();


class Foo {
    public x : number;
    public y : number;
    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }
}

class Bar {
    // shorthand way: think scala
    constructor(public x : number, public y : number) {
    }
}

var multiply = (x : number, y : number) => x * y;
// this is not legal because typescript figures out multiply's return
// type to be number.
// var multiply2 : (x : number, y : number) => string = multiply;

class Ack extends Bar {
    private z : number;
    constructor(x : number, y : number, z : number) {
        super(x, y);
        this.z = z;
    }
}

module Moddy {
    var x : number = 5;
    // export is like public
    export var getX : () => number = () => x;
}

// this interface is the same as Moddy. If you want to make an interfacey
// thing for a module, declare all the variables at the top or something.
interface ModdyInterface {
    getX : () => number;
}

// functions that return nothing return void, not any
function j() : void {
}
