var Timetraveler;

(function(){

  var log = function() {
    if (Timetraveler.config.debug === true && window.console) {
      console.log.apply(console, arguments);
    }
  };

  var bind = function(fn, obj) {
    return function() {
      fn.apply(obj, arguments);
    }
  };

  Timetraveler = function(fn) {
    // In ms. Canonical source of current time using standard JS epoch.
    this.time = new Date().getTime();

    // Why use an array instead of an object keyed by timeout id?
    // An array makes it easier to access timeouts in the order of execution
    // Both timeouts and intervals are stored in this.timeouts
    this.timeoutCounter = 0;
    this.timeouts = [];

    this.overrideTimeFunctions();

    try {
      fn(this);
    } catch(e) {
      var error = e;
    } finally {
      this.restoreTimeFunctions();
      if (error) {
        throw error;
      }
    }
  };


  Timetraveler.config = {
    debug: false
  };


  Timetraveler.prototype.Date = function(arg) {
    var d = new Timetraveler._Date(arg);
    return d;
  };


  Timetraveler.prototype.setTimeout = function(fn, ms) {
    log("Scheduling timeout function for execution at " + (this.time + ms));

    var timeout = {
      type: 'timeout',
      id: this.timeoutCounter++,
      runAt: this.time + ms,
      fn: fn
    };

    this.timeouts.push(timeout);
    this.sortTimeouts();

    return timeout.id;
  };


  Timetraveler.prototype.clearTimeout = function(id) {
    timeoutToRemove = this.timeouts.filter(function(timeout) {
      return timeout.id == id;
    });

    if (timeoutToRemove.length > 0) {
      timeoutToRemove = timeoutToRemove[0];
      log("Going to clear timeouts ", timeoutToRemove);
      this.timeouts.splice(timeouts.indexOf(timeoutToRemove), 1);
    }
  };


  Timetraveler.prototype.setInterval = function(fn, ms) {
    log("Scheduling interval function for execution at " + (this.time + ms));

    var timeout = {
      type: 'interval',
      id: this.timeoutCounter++,
      runAt: this.time + ms,
      interval: ms,
      fn: fn
    };

    this.timeouts.push(timeout);
    this.sortTimeouts();

    return timeout.id;
  };


  Timetraveler.prototype.clearInterval = Timetraveler.prototype.clearTimeout;


  Timetraveler.timeFns = ['Date', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'];


  Timetraveler.prototype.overrideTimeFunctions = function() {
    for (var i=0; i < Timetraveler.timeFns.length; i++) {
      var timeFn = Timetraveler.timeFns[i];

      // Make private copies of time-related functions
      // This ensures that Timetraveler._Date is the original implementation
      // even when Timetravelers are nested
      if (!Timetraveler["_" + timeFn]) {
        Timetraveler["_" + timeFn] = window[timeFn];
      }

      // Replace time-related functions
      // Special-case Date because it is a constructor
      // TODO This is a bit of a hack
      if (timeFn == 'Date') {
        var that = this;
        window[timeFn] = function() {
          var d = new that.Date(that.time);
          return d;
        };
      } else {
        window[timeFn] = bind(this[timeFn], this);
      }
    }
  };


  Timetraveler.prototype.restoreTimeFunctions = function() {
    for (var i=0; i < Timetraveler.timeFns.length; i++) {
      var timeFn = Timetraveler.timeFns[i];
      window[timeFn] = Timetraveler['_' + timeFn];
      delete Timetraveler['_' + timeFn];
    }
  }


  Timetraveler.prototype.set = function(newTime) {
    this.time = newTime;
  };


  Timetraveler.prototype.advance = function(val, units) {
    var destinationTime;
    units = units || 'ms';

    log("Advancing time", val, units);

    // TODO rewrite as destinationTime = this.timePlus(val, units)
    if (units == 'ms') {
      destinationTime = this.time + val;
    } else if (units == 'second' || units == 'seconds') {
      var seconds = val * 1000;
      destinationTime = this.time + seconds;
    } else if (units == 'minute' || units == 'minutes') {
      var minutes = val,
        d = new Timetraveler._Date(this.time);
      d.setMinutes(d.getMinutes() + minutes);
      destinationTime = d.getTime();
    } else if (units == 'hour' || units == 'hours') {
      var hours = val,
        d = new Timetraveler._Date(this.time);
      d.setHours(d.getHours() + hours);
      destinationTime = d.getTime();
    } else if (units == 'day' || units == 'days') {
      var days = val,
        d = new Timetraveler._Date(this.time);
      d.setDate(d.getDate() + days);
      destinationTime = d.getTime();
    } else {
      throw new Error(units + " not supported by .advance");
    }

    // find interval timeout
    // set time to time at which interval should be executed
    // execute interval
    // increment

    // TODO rewrite as this.executeTimeoutsUntil(destinationTime)
    while(this.timeoutsBefore(destinationTime) > 0) {
      // this.timeouts are sorted by runAt
      var timeout = this.timeouts.shift();
      this.time = timeout.runAt;
      timeout.fn.call();

      // discard once-run timeouts; requeue interval timeouts
      if (timeout.type == 'interval') {
        timeout.runAt = this.time + timeout.interval;
        this.timeouts.push(timeout);
        this.sortTimeouts();
      }
    }

    this.time = destinationTime;
  };


  /************************** PRIVATE FUNCTIONS *************************/

  // TODO sortTimeouts should be called from a single place, e.g. this.timeouts.queue()
  Timetraveler.prototype.sortTimeouts = function() {
    this.timeouts.sort(function(a, b) { return a.runAt - b.runAt; });
  }


  Timetraveler.prototype.timeoutsBefore = function(endTime) {
    var timeouts = this.timeouts.filter(function(timeout) {
      return timeout.runAt <= endTime;
    });
    return timeouts.length;
  };

})();
