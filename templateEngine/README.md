#template-engine

Small engine to parse out and replace variable and function expressions and simple list expansions (using foreach) with a provided environment.

technologies:
 - node.js
 - peg.js

example template:
```Python
# this is my config file
# I use whatever native text-based syntax it wants as long as I avoid double open 
# squiggly bracket double closed squiggly bracket I am ok. If those are needed
# they can be achieved by adding two brackets to the desired output. E.g, '{{{'
# will => '{' and '{{{{' will => '{{', etc.

mysettingheader:
    some_static_setting=boring
    some_exciting_setting={{variable1}}
    even_more_exciting={{ obj.fun("literal") }}

headerwithvariableentries:
#list1 has to be a javascript array in the given environment
{% foreach item in list1 %}
    setting {{item.name}} {{item.host}}:{{item.port}} #whitespace is preserved
{% end foreach %}
```

example environment for above template:
```JavaScript
var env = new Environment();
env.set("variable1", "foo");
env.set("list1", [
  {'name':'foo', 'host':'127.0.0.1', 'port':'80'}, 
  {'name':'bar', 'host':'127.0.0.1', 'port':'443'}
]);
env.set("obj", {"fun":function(a){return a + a;}});
```

expected output:
```Python
# this is my config file
# I use whatever native text-based syntax it wants as long as I avoid double open 
# squiggly bracket double closed squiggly bracket I am ok. If those are needed
# they can be achieved by adding two brackets to the desired output. E.g, '{{{'
# will => '{' and '{{{{' will => '{{', etc.

mysettingheader:
    some_static_setting=boring
    some_exciting_setting=foo
    even_more_exciting=literalliteral

headerwithvariableentries:
#list1 has to be a javascript array in the given environment
    setting foo 127.0.0.1:80 #whitespace is preserved
    setting bar 127.0.0.1:443 #whitespace is preserved
```
