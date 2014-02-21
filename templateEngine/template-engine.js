var peg = require("pegjs");
var Q = require("q");

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

Environment.prototype.tryGet = function(name){
    for(var i = this.scopes.length - 1; i >= 0; i--){
        if(this.scopes[i].hasOwnProperty(name)){
            return {'exists':true, 'value':this.scopes[i][name]};
        }
    }
    return {'exists':false};
};

function evaluateInvokeAsync(varExpr, parent, environment){
    var valuePromise = undefined;
    var subInvokeParent = null;

    switch(varExpr.token){
        case 'method':
            var argValPromises = varExpr.args.map(function(expr){return evaluateTreeAsync(expr, environment);});
            valuePromise = Q.allSettled(argValPromises)
                //strip off promise metadata
                .then(function(promiseResults){
                    return promiseResults.map(function(promise){return promise.value})
                })
                //apply method invocation
                .then(function(argVals){
                    return parent.apply(parent.parent, argVals)
                });

            subInvokeParent = null;
            break;

        case 'property':
            if(!(varExpr.data in parent)){throw Error("object '" + varExpr.data + "' does not exist in parent");}
            valuePromise = Q.fcall(function(){return parent[varExpr.data];});
            subInvokeParent = parent;
            break;
    }

    if(!!varExpr.invoke){
        return valuePromise.then(function(value){
            value.parent = subInvokeParent;
            return evaluateInvokeAsync(varExpr.invoke, value, environment);
        });
    }

    return valuePromise.then(function(val){return val;});
}

function evaluateVariableAsync(varExpr, environment){

    var lookup = environment.tryGet(varExpr.data);
    if(!lookup.exists){
        throw Error("variable '" + varExpr.data + "' does not exist in environment");
    }

    if(!!varExpr.invoke){
        //this should be an object(/function) or we're going to run into an error invoking on it anyway
        lookup.value.parent = null;
        return evaluateInvokeAsync(varExpr.invoke, lookup.value, environment);
    }

    return Q.fcall(function(){return lookup.value});
}

function evaluateTreeAsync(tree, environment){
    //console.log('-- evaluating: ' + JSON.stringify(tree));
    if(tree instanceof Array){
        var evalPromises = tree.map(function(subtree){
            return evaluateTreeAsync(subtree, environment);
        });

        return Q.allSettled(evalPromises)
            .then(function(promiseResults){
                return promiseResults
                    .map(function(result){
                        return result.value;
                    })
                    .reduce(function(soFar,nextItem){
                        return soFar + nextItem;
                    })
            });


    }else if(tree.hasOwnProperty('token')){
        switch(tree['token']){
            case 'text': return Q.fcall(function(){return tree['data'];});
            case 'literal': return Q.fcall(function(){return tree['data'];});
            case 'var':
            {
                return evaluateVariableAsync(tree, environment);
            }
            case 'foreach':
            {
                var listExpr = tree['list'];
                var getList = evaluateVariableAsync(listExpr, environment);

                return getList.then(function(list){
                    var value = Q.fcall(function(){
                        environment.push();
                        return '';
                    });

                    for (var j = 0; j < list.length; j++){
                        var iter = function(j){
                            value = value
                                .then(function(soFar){
                                    environment.set(tree['var'], list[j]);
                                    return soFar;
                                })
                                .then(function(soFar){
                                    return evaluateTreeAsync(tree['body'], environment)
                                        .then(function(value){
                                            return soFar + value;
                                        })
                                });
                        };
                        iter(j);
                    }

                    return value.then(function(iterationResult){
                        environment.pop();
                        return iterationResult;
                    });
                });
            }
        }
    }

    throw Error("error evaluating tree node: " + JSON.stringify(tree));
}


function evaluateInvoke(varExpr, parent, environment){
    var value = undefined;
    var subInvokeParent = null;

    switch(varExpr.token){
        case 'method':
            var argVals = varExpr.args.map(function(expr){return evaluateTree(expr, environment);});
            value = parent.apply(parent.parent, argVals);
            subInvokeParent = null;
            break;

        case 'property':
            if(!(varExpr.data in parent)){throw Error("object '" + varExpr.data + "' does not exist in parent");}
            value = parent[varExpr.data];
            subInvokeParent = parent;
            break;
    }

    if(!!varExpr.invoke){
        value.parent = subInvokeParent;
        return evaluateInvoke(varExpr.invoke, value, environment);
    }

    return value;
}

function evaluateVariable(varExpr, environment){

    var lookup = environment.tryGet(varExpr.data);
    if(!lookup.exists){
        throw Error("variable '" + varExpr.data + "' does not exist in environment");
    }

    if(!!varExpr.invoke){
        //this should be an object(/function) or we're going to run into an error invoking on it anyway
        lookup.value.parent = null;
        return evaluateInvoke(varExpr.invoke, lookup.value, environment);
    }

    return lookup.value;
}

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
            case 'literal': return tree['data'];
            case 'var':
            {
                return evaluateVariable(tree, environment);
            }
            case 'foreach':
            {
                var listExpr = tree['list'];
                var list = evaluateVariable(listExpr, environment);
                var value = '';
                environment.push();
                for (var j = 0; j < list.length; j++){
                    environment.set(tree['var'], list[j]);
                    value = value + evaluateTree(tree['body'], environment);
                }
                environment.pop();
                return value;
            }
        }
    }

    throw Error("error evaluating tree node: " + JSON.stringify(tree));
}

function Engine(){
    this.parser = peg.buildParser(
        "start = blob " +
            "blob = body:(variable_ref)+ " +
            "variable_ref = '{{' ws? variable:variable ws? '}}' " +
                "{return variable;} / foreach " +
            "variable = symbol:symbol invoke:(method_invoke)? " +
                "{var token = {'token':'var', 'data':symbol}; if(!!invoke){token.invoke = invoke;} return token;} " +
            "/ literal " +
            "method_invoke = '(' args:method_arguments ')' invoke:(method_invoke)? " +
                "{var token = {'token':'method', 'args':args}; if(!!invoke){token.invoke = invoke;} return token;} " +
            "/ property_invoke " +
            "property_invoke = '.' symbol:symbol invoke:(method_invoke)? " +
                "{var token = {'token':'property', 'data':symbol}; if(!!invoke){token.invoke = invoke;} return token; } " +
            "method_arguments = args:( ws? variable ws? (',' ws? variable ws?)* )? " +
                "{" +
                    "var argslist = []; " +
                    "if( !!args && args.length > 1 ){ argslist.push(args[1]); }" +
                    "if( !!args && args[1].length > 3){" +
                        "for(var i = 0; i < args[3].length; i++){" +
                            "argslist.push(args[3][i]); " +
                        "}" +
                    "}" +
                    "return argslist;" +
                "} " +
            "foreach = '{%' ws 'foreach' ws iter:symbol ws 'in' ws list:variable ws '%}' ([ \t]* ('\\n'))? " +
            "body:blob?  " +
            "'{%' ws 'end' ws 'foreach' ws '%}' ('\\n')? " +
                "{return {'token':'foreach', 'var':iter, 'list':list, 'body':body}; } / text " +
            "text = text_value:$( ('%'[^\\}])? [^\\{\\}%]+ ) " +
                "{return {'token':'text', 'data':text_value};} " +
            " / left_curly_brace "+
            "left_curly_brace = '{{' squiggles:$('{')+  " +
                "{return {'token':'text', 'data': squiggles}; } " +
            " / right_curly_brace " +
            "right_curly_brace = percent:('%'?) '}}' squiggles:$('}')+  " +
                "{var s = ''; if(!!percent){s='%';} return {'token':'text', 'data': s+squiggles}; } " +
            "symbol = $([A-Za-z_][A-Za-z0-9_]*) " +
            "literal = literal:(number_literal / string_literal) " +
                "{return {'token':'literal', data:literal};} " +
            "number_literal = $([0-9]+ ('.' [0-9]+)?) " +
            "string_literal = '\"' values:(escaped_dbl_quote)* '\"' {return values.join('');}  / " +
            "                 '\\'' values:(escaped_single_quote)* '\\'' {return values.join('');} " +
            "escaped_dbl_quote =  ('\\\\' '\"') {return '\\\"';} / char_dbl_quote " +
            "char_dbl_quote = [^\"]" +
            "escaped_single_quote =  ('\\\\' '\\'') {return '\\'';} / char_single_quote " +
            "char_single_quote = [^\\']" +
            "ws = ([ \\t\\n\\r])+ "
    );

}

Engine.prototype.processTemplate = function(template, environment){
    var tree = this.parser.parse(template);
    return evaluateTree(tree, environment);
};

Engine.prototype.processTemplateAsync = function(template, environment){
    var tree = this.parser.parse(template);
    try{
        return evaluateTreeAsync(tree, environment);
    }catch(err){
        return Q.fcall(function(){return err;})
    }
};

module.exports = {
    'Engine':Engine,
    'Environment':Environment
};

