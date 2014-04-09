##utils

Arbitrary utilities I find myself needing

technologies:
 - node.js
 - q.js

###replace-recursive

Matches values stored in arrays/objects and replaces them as specified

q-based asynchonous replace
```Javascript
replaceRecursive(value, testFunction, replaceFunction)
```

synchronous replace
```Javascript
replaceRecursiveSync(value, testFunction, replaceFunction)
```

example usage:
```JavaScript
var value = {
    "key1":"value1",
    "key2":"value2",
    "key3":["value2", "value3"],
    "uhoh":[[{"athing":["value2"]}]]
}

test = function(value){return value === "value2";};

replace = function(value){return "replaced";};

var replaced = replaceRecursiveSync(value, test, replace);
```

'replaced' will now equal:

```JavaScript
{
    "key1":"value1",
    "key2":"replaced"
    "key3":["replaced", "value3"],
    "uhoh":[[{"athing":["replaced"]}]]
}
```
