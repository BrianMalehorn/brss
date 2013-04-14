export var y : number = 6;

export var throwIt = function(err : any) : void {
  if (err)
    throw err;
};

export var sify = function(obj : any) : string {
  return JSON.stringify(obj, null, "\t");
};

export var assert = function(cond : bool, msg ?: string) : void {
  if (!msg) {
    msg = "assertion error";
  }
  if (!cond) {
    throw msg;
  }
};
