var Engine = require('./template-engine').Engine;
var Environment = require('./template-engine').Environment;

//-----------------------------------------------------------------------------
//Some test code:

var engine = new Engine();

configData =
    "mysettingheader:\n" +
        "    some_static_setting={{{%boring}}}\n" +
        "    some_exciting_setting={{variable1}}\n" +
        "    some_func_based_setting={{ fun.fooFunc(variable1)(variable1).valueGetter() }}\n" +
        "    some_literal_based_setting={{ fun.fooFunc('as\\'df')(\"que\\\"rty\").valueGetter() }}\n" +
        "    some_object_based_setting={{ testObject.publicGetter() }}\n" +
        "\n" +
        "headerwithvariableentries:\n" +
        "#list1 has to be a javascript array in the given environment\n" +
        "{% foreach item in list1 %}\n" +
        "    setting {{item.name}} {{item.host}}:{{item.port}} #whitespace is preserved\n" +
        "{% end foreach %}\n" +
        "{% foreach num in list_container.inner_list %}\n" +
        "num:{{num}}\n" +
        "{% end foreach %}\n" +
        "{% foreach role in test_role1 %}\n" +
        "{% end foreach %}" +
    "";

function TestClass(){
    this.privateVariable = "private_value";
}

TestClass.prototype.publicGetter = function(){
    return this.privateVariable;
};

env = new Environment({
    "variable1": "foo",
    "list1": [
        {'name':'foo', 'host':'127.0.0.1', 'port':'80'},
        {'name':'bar', 'host':'127.0.0.1', 'port':'443'}
    ],
    "list_container":{'inner_list':[1,2,3]},
    "test_role1":{"test_data":"data", "instances":[{"name":"name", "hostAddress":"address"}]},
    "fun":{"fooFunc":function(val1){return function(val2){return {'valueGetter':function(){return val1+val2;}};};}},
    "testObject": new TestClass()
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


//-----------------------------------------------------------------------------
//test with nested operations (i.e. generating a template with a template
// or, a meta-template)


configData =
    "mysettingheader:\n" +
        "    recursive dereference ={{{{ {{variable2}} }}}}\n" +
        "    some_exciting_setting={{variable1}}\n" +
        "    recursive op = {{{% foreach item in {{listref}} %}}}" +
        "        {{{{item.name}}}} {{{{item.host}}}}:{{{{item.port}}}}" +
        "    {{{% end foreach %}}}\n" +
        "\n" +
        "headerwithvariableentries:\n" +
        "#list1 has to be a javascript array in the given environment\n" +
        "{% foreach item in list1 %}\n" +
        "    setting {{item.name}} {{item.host}}:{{item.port}} #whitespace is preserved\n" +
        "{% end foreach %}\n";

env = new Environment({
    "variable1": "foo",
    "variable2": "variable1",
    "listref":"list1",
    "list1": [
        {'name':'foo', 'host':'127.0.0.1', 'port':'80'},
        {'name':'bar', 'host':'127.0.0.1', 'port':'443'}
    ]
});

console.log("\nTemplate generated by meta-template:\n-------------------------------------\n");
console.log(engine.processTemplate(configData, env));

console.log("\nFinal config generated by generated template:\n---------------------------------------------\n");
console.log(engine.processTemplate(engine.processTemplate(configData, env), env));
