#templateEngine

Small engine to parse out and replace variable references and simple list expansions (using foreach) with a provided environment.

technologies:
 - node.js
 - peg.js

example template:
```Python
#this is my config file
#I use whatever native text-based syntax it wants as long as I avoid double open 
#squiggly bracket double closed squiggly bracket I am ok. If those are needed at 
#some point it can be implemented without much ado.

mysettingheader:
    some_static_setting=boring
    some_exciting_setting={{variable1}}

headerwithvariableentries:
#list1 has to be a javascript array in the given environment
{% foreach item in list1 %}
    setting {{item.name}} {{item.host}}:{{item.port}} #whitespace is preserved
{% end foreach %}
```

example environment for above template:
```JavaScript
var env = new Stack();
env.set("variable1", "foo");
env.set("list1", [
  {'name':'foo', 'host':'127.0.0.1', 'port':'80'}, 
  {'name':'bar', 'host':'127.0.0.1', 'port':'443'}
]);
```

expected output:
```Python
#this is my config file
#I use whatever native text-based syntax it wants as long as I avoid double open 
#squiggly bracket double closed squiggly bracket I am ok. If those are needed at 
#some point it can be implemented without much ado.

mysettingheader:
    some_static_setting=boring
    some_exciting_setting=foo

headerwithvariableentries:
#list1 has to be a javascript array in the given environment
    setting foo 127.0.0.1:80 #whitespace is preserved
    setting bar 127.0.0.1:443 #whitespace is preserved
```
