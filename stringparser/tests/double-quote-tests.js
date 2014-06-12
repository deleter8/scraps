var should = require('should');
var Parser = require('../parse-string.js');

describe('Double Quote String Parse Tests', function () {

    var parser = null;
    var escape = '\\';
    var escapedSlash = '\\\\';

    before(function() {
        parser = new Parser();
    });

    it('can validate basic double quote string', function() {
        var test = '"a"';
        parser.validateString(test).should.be.true;// equal(true);
    });

    it('identifies missing closing double quote', function() {
        var test = '"a';
        parser.validateString(test).should.be.false;
    });

    it('identifies missing opening double quote', function() {
        var test = 'a"';
        parser.validateString(test).should.be.false;
    });

    it('identifies single quote string with escaped slash', function() {
        var test = '"a' + escapedSlash + '"'; // "a\\"
        parser.validateString(test).should.be.true;
    });

    it('identifies single quote string with escaped quote', function() {
        var test = '"a' + escape + '""'; // "a\\""
        parser.validateString(test).should.be.true;
    });

    it('identifies missing closing quote with escaped single quote', function() {
        var test = '"a' + escape + '"'; // "a\"
        parser.validateString(test).should.be.false;
    });

    it('identifies missing closing quote with escaped single quote and escaped slash', function() {
        var test = '"a' + escapedSlash + escape + '"'; // "a\\\"
        parser.validateString(test).should.be.false;
    });


});
