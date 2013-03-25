///<reference path="B.ts"/>

module A {
    export var a : number = 5 + B.b;
}
console.log("A.a = " + A.a);
