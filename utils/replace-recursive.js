var Q = require('q');

function replaceRecursive(value, test, replace) {
    var promises = [];

    //If tests positive, replace
    return Q.fcall(function(){ return test(value); })
        .then(function(testedPositive){
        if (testedPositive){
            return replace(value);
        }else{
            //Walk through array or object, replacing any positive matches
            if (value instanceof Array || value instanceof Object) {
                for (var index in value) {
                    if (value.hasOwnProperty(index)
                        && (!(value instanceof Array) || (/^0$|^[1-9]\d*$/.test(index) && index <= 4294967294))) {
                        (function iterate(index) {
                            promises.push(Q.fcall(function(){
                                return replaceRecursive(value[index], test, replace).then(function (data) {
                                    value[index] = data;
                                })})
                            );
                        })(index);
                    }
                }
            }

            return Q.allSettled(promises).then(function () {
                return Q.fcall(function () {
                    return value;
                });
            });
        }
    });
}

function replaceRecursiveSync(value, test, replace) {
    //If tests positive, replace with processed template
    if ( test(value) ) {
        return replace(value);
    }

    //Walk through array or object, replacing any positive matches
    if (value instanceof Array || value instanceof Object) {
        for (var index in value) {
            if (value.hasOwnProperty(index)
                && (!(value instanceof Array) || (/^0$|^[1-9]\d*$/.test(index) && index <= 4294967294))) {
                value[index] = replaceRecursiveSync(value[index], test, replace);
            }
        }
    }
    return value;
}

module.exports = {
    'replaceRecursive':replaceRecursive,
    'replaceRecursiveSync':replaceRecursiveSync
};
