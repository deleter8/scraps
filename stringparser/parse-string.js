var peg = require("pegjs");

function Engine(){
    this.parser = peg.buildParser(
            "start = string_literal " +
            "string_literal = '\"' values:(escape_dbl)* '\"' {return values.join('');}  / " +
            "                 '\\'' values:(escape_single)* '\\'' {return values.join('');} " +
            "escape_dbl = escape_sequence " +
            " / char_dbl_quote " +
            "escape_single = escape_sequence " +
            " / char_single_quote " +
            "escape_sequence = values:('\\\\' second:[\\\\nrtbf\"\\']) {return values.join('');} " +
            "char_dbl_quote = [^\"\\\\] " +
            "char_single_quote = [^\\'\\\\] "
    );

}

Engine.prototype.validateString = function(template, environment){

    try {
        var stringValue = this.parser.parse(template);
        console.log("string recognized, value = " + stringValue);
        return true;
    }catch(err){
        console.log("Not recognized as a string, error: " + err);
        return false;
    }

};

module.exports = Engine;
