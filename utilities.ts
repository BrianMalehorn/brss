export var y : number = 6;

export var throwIt = function(err : any) : void {
  if (err)
    throw err;
};

export var sify = function(obj : any) : string {
  return JSON.stringify(obj, null, "\t");
};

/* Pretty-print this object */
export var pp = function(obj, name ?: string) {
  if (name)
    console.log(name + " = " + sify(obj));
  else
    console.log(sify(obj));
};

export var assert = function(cond : bool, msg ?: string) : void {
  if (!msg) {
    msg = "assertion error";
  }
  if (!cond) {
    throw msg;
  }
};
