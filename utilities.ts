export var throwIt = function(err : any) : void {
  if (err)
    throw err;
};

// copied from
//http://www.codeovertones.com/2011/08/how-to-print-stack-trace-anywhere-in.html
export var logIt = function(err : any) : void {
  if (err) {
    // make e an actual err, in case err is just a string
    var e;
    if (typeof(err) === "string") {
      e = new Error(err);
    } else {
      e = err;
    }
    var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
      .replace(/^\s+at\s+/gm, '')
      .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
      .split('\n');
    console.log();
    console.log(stack);
    console.log();
  }
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

export var pass = function(...args : any[]) : any {
};

export var httpize = function(url : string) : string {
  url = url.toLowerCase();
  url = url.replace(/ */g, "");
  if (url.indexOf(".") === -1) {
    url = url + ".com"
  }
  if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
    url = "http://" + url;
  }
  // replace "//" with "/"
  url = url.replace(/\/\//g, "/");
  url = url.replace("http:/", "http://");
  url = url.replace("https:/", "https://");
  return url;
};
