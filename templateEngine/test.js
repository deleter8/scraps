var Engine = require('./templateEngine.js').Engine;
var Environment = require('./templateEngine.js').Environment;

//-----------------------------------------------------------------------------
//Some test code:

var engine = new Engine();

configData =
    "mysettingheader:\n" +
        "    some_static_setting={{{{boring}}}}\n" +
        "    some_exciting_setting={{variable1}}\n" +
        "\n" +
        "headerwithvariableentries:\n" +
        "#list1 has to be a javascript array in the given environment\n" /*+
        "{% foreach item in list1 %}\n" +
        "    setting {{item.name}} {{item.host}}:{{item.port}} #whitespace is preserved\n" +
        "{% end foreach %}\n"*/;

env = new Environment({
    "variable1": "foo",
    "list1": [
        {'name':'foo', 'host':'127.0.0.1', 'port':'80'},
        {'name':'bar', 'host':'127.0.0.1', 'port':'443'}
    ]
});

console.log(engine.processTemplate(configData, env));

//-----------------------------------------------------------------------------
//test with nested foreach

var configData =
    "a bunch of \ntext\t{{var1}}\n" +
        "{% foreach sublist in list %}\n"+
        "{% foreach item in sublist %}\n"+
        "    text({{item}},{{var2}})\n" +
        "{% end foreach %}\n" +
        "{% end foreach %}\n" +
        "\n" +
        "o:{{obj.b.d}}\n" +
        "end";

var env = new Environment();
env.set("var1", "foo");
env.set("var2", "2");
env.set("obj", {'a':'OBJ_A_VALUE', 'b': {'c':'OBJ_B_C_VALUE', 'd':'OBJ_B_D_VALUE'}});
env.set("list", [['a','b','c'],['a2','b2','c2'],['a3','b3','c3']]);

console.log(engine.processTemplate(configData, env));