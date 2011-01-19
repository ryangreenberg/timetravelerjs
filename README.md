## Timetraveler.js ##

Timetraveler.js is a lightweight library for testing time-dependent JavaScript code. It is meant to integrate with your existing JavaScript testing framework.

You don't need Timetraveler if you're just testing code that accepts a date or time argument; you can simply test by providing various arguments. But if you code runs differently based on the current date or time, maybe Timetraveler can help. These are some examples of time-dependent code:

- A widget that refreshes every 5 minutes
- A message that disappears after 10 seconds
- Anything that relies on setTimeout or setInterval

## Usage ##

    new Timetraveler(function(time) {
        time.set(0);
        console.log(new Date()); // => Thu, 01 Jan 1970 00:00:00 GMT
        
        time.advance(2, 'days');
        console.log(new Date()); // => Sat, 03 Jan 1970 00:00:00 GMT
        
        // Add an interval timer to increment every 500ms
        var counter = 0;
        setInterval(function() {
            counter++;
        }, 500);
        
        time.advance(30, 'seconds');
        console.log(counter)
        // => 60, because interval time was called
        // 60 times while advancing 30 seconds
    });
