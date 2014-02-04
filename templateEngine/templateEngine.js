var peg = require("pegjs");

var parser = peg.buildParser(
    "start = blob " +
        "blob = body:(variable_ref)+ " +
        "variable_ref = '{{' variable:variable '}}' {return {'token':'var','data':variable};} / text " +
        "variable = variable:(symbol (variable_property)*) {if(variable[1].length>0){return variable[0] + '.' + variable[1].join('.');}else{return variable[0];} } " +
        "variable_property = '.' symbol:symbol {return symbol;} " +
        "text = text_value:([^\\{]+) {return {'token':'text', 'data':text_value.join('')};} / foreach "+
        "foreach = '{%' ws 'foreach' ws iter:symbol ws 'in' ws list:symbol ws '%}' newline:([ \t]* ('\\n'))? body:blob  '{%' ws 'end' ws 'foreach' ws '%}' endnewline:('\\n')? {return {'token':'foreach', 'var':iter, 'list':list, 'newline':!!newline, 'body':body}; } " +
        "symbol = symbol:([A-Za-z][A-Za-z0-9]*) {if(symbol.length>1){return symbol[0] + symbol[1].join('');}else{ return symbol.join('')};} " +
        "ws = ([ \\t\\n\\r])+ "+
        ""
);

function Stack(){
    this.scopes = [{}];
}

Stack.prototype.push = function(){
    this.scopes.push({});
};

Stack.prototype.pop = function(){
    this.scopes.pop();
};

Stack.prototype.set = function(name, val){
    this.scopes[this.scopes.length-1][name] = val;
};

Stack.prototype.get = function(name){
    console.log('--looking for variable:' + name);
    for(var i = this.scopes.length - 1; i >= 0; i--){
        if(this.scopes[i].hasOwnProperty(name)){
            return this.scopes[i][name];
        }
    }
    return undefined;
};

function evalTree(tree, stack){
    if(tree instanceof Array){
        return tree
            .map(function eval(subtree){
                return evalTree(subtree, stack);
            })
            .reduce(function combine(accum, subtree){
                return accum + subtree;
            });
    }else if(tree.hasOwnProperty('token')){
        switch(tree['token']){
            case 'text': return tree['data'];
            case 'var':
            {
                var varName = tree['data'];

                if(~varName.indexOf('.')){
                    var elements = varName.split('.');
                    var deref = stack.get(elements[0]);
                    for(var i = 1; i < elements.length; i++){
                        if(deref.hasOwnProperty(elements[i])){
                            deref = deref[elements[i]];
                        }else{
                            throw "not a valid variable expression: '" + elements[i] + "' does not exist in expr '" + varName + "'";
                        }
                    }
                    return deref;
                }
                return stack.get(tree['data']);
            }
            case 'foreach':
            {
                var list = stack.get(tree['list']);
                var value = '';
                // dont think i need this - if(tree['newline']) value = '\n';
                stack.push();
                for (var i = 0; i < list.length; i++){
                    stack.set(tree['var'], list[i]);
                    value = value + evalTree(tree['body'], stack);
                }
                stack.pop();
                return value;
            }
        }
    }else{
        throw "error evaluating tree node: " + JSON.stringify(tree);
    }
}

//-----------------------------------------------------------------------------
//Some test code:

var tree = parser.parse(
    "abuncho \t\nftext{{var1}} alskdjf {{var2}}\nnowforeach\n" +
        "{% foreach sublist in list %}\n"+
        "{% foreach item in sublist %}\n"+
        "    text({{item}}),\n" +
        "{% end foreach %}\n" +
        "{% end foreach %}\n" +
        "\n" +
        "o:{{obj.b.d}}\n" +
        "end"

);

console.log(JSON.stringify(tree));

var stack = new Stack();
stack.set("var1", "foo");
stack.set("var2", "2");
stack.set("obj", {'a':'OBJ_A_VALUE', 'b': {'c':'OBJ_B_C_VALUE', 'd':'OBJ_B_D_VALUE'}});
stack.set("list", [['a','b','c'],['a2','b2','c2'],['a3','b3','c3']]);

console.log(evalTree(tree, stack));
//-----------------------------------------------------------------------------
