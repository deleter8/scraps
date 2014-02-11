var peg = require("pegjs");

function Environment(init){
    if(!init) init = {};
    this.scopes = [init];
}

Environment.prototype.push = function(){
    this.scopes.push({});
};

Environment.prototype.pop = function(){
    this.scopes.pop();
};

Environment.prototype.set = function(name, val){
    this.scopes[this.scopes.length-1][name] = val;
};

Environment.prototype.get = function(name){
    for(var i = this.scopes.length - 1; i >= 0; i--){
        if(this.scopes[i].hasOwnProperty(name)){
            return this.scopes[i][name];
        }
    }
    return undefined;
};

function evaluateTree(tree, environment){
    //console.log('-- evaluating: ' + JSON.stringify(tree));
    if(tree instanceof Array){
        return tree
            .map(function eval(subtree){
                return evaluateTree(subtree, environment);
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
                    var deref = environment.get(elements[0]);
                    for(var i = 1; i < elements.length; i++){
                        if(deref.hasOwnProperty(elements[i])){
                            deref = deref[elements[i]];
                        }else{
                            throw "not a valid variable expression: '" + elements[i] + "' does not exist in expr '" + varName + "'";
                        }
                    }
                    return deref;
                }
                return environment.get(tree['data']);
            }
            case 'foreach':
            {
                var list = environment.get(tree['list']);
                var value = '';
                environment.push();
                for (var i = 0; i < list.length; i++){
                    environment.set(tree['var'], list[i]);
                    value = value + evaluateTree(tree['body'], environment);
                }
                environment.pop();
                return value;
            }
        }
    }

    throw "error evaluating tree node: " + JSON.stringify(tree);
}

function Engine(){
    this.parser = peg.buildParser(
        "start = blob " +
            "blob = body:(variable_ref)+ " +
            "variable_ref = '{{' ws? variable:variable ws? '}}' " +
                "{return {'token':'var','data':variable};} / foreach " +
            "variable = variable:(symbol (variable_property)*) " +
                "{if(variable[1].length>0){return variable[0] + '.' + variable[1].join('.');}else{return variable[0];} } " +
            "variable_property = '.' symbol:symbol " +
                "{return symbol;} " +
            "foreach = '{%' ws 'foreach' ws iter:symbol ws 'in' ws list:symbol ws '%}' ([ \t]* ('\\n'))? " +
                "body:blob  " +
                "'{%' ws 'end' ws 'foreach' ws '%}' ('\\n')? " +
                "{return {'token':'foreach', 'var':iter, 'list':list, 'body':body}; } / text " +
            "text = text_value:( ('%'[^\\}])? [^\\{\\}%]+ ) " +
                "{ " +
                    "var retVal=''; " +
                    "if(!!text_value[0]){retVal+=text_value[0].join('')} " +
                    "if(!!text_value[1]){retVal+=text_value[1].join('')} " +
                    "return {'token':'text', 'data':retVal};} " +
                " / left_curly_brace "+
            "left_curly_brace = '{{' squiggles:('{')+  " +
                "{return {'token':'text', 'data': squiggles.join('')}; } " +
                " / right_curly_brace " +
            "right_curly_brace = percent:('%'?) '}}' squiggles:('}')+  " +
                "{var s = ''; if(!!percent){s='%';} return {'token':'text', 'data': s+squiggles.join('')}; } " +
            "symbol = symbol:([A-Za-z][A-Za-z0-9]*) " +
                "{if(symbol.length>1){return symbol[0] + symbol[1].join('');}else{ return symbol.join('')};} " +
            "ws = ([ \\t\\n\\r])+ "
    );

}

Engine.prototype.processTemplate = function(template, environment){
    var tree = this.parser.parse(template);
    return evaluateTree(tree, environment);
};

module.exports = {
    'Engine':Engine,
    'Environment':Environment
};

