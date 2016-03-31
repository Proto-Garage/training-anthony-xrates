/**
 *custom validators
 */
var customValidator= require('koa-validate').Validator;

//validate if array not empty
customValidator.prototype.arrayNotEmpty = function(tip){
    if (this.goOn && this.value.length == 0) {
        this.addError(tip || this.key + " is null.");
    }
    
    return this;
}

//validate if array contains only numbers. note: dependent to koa-validate library
customValidator.prototype.arrayOfNumbers = function(tip){
    var v = require('koa-validate/node_modules/validator');
    var me = this;
    
    for(var key in me.value)
    {
        if (me.goOn && !v.isFloat(me.value[key])) {
            me.goOn = false;
            me.addError(tip || me.key + " only numbers accepted.");
        }
    };
    
    return me;
}

//validate exchange rate object. should be {currency: rate}
customValidator.prototype.validRateObject = function(tip){
    var v = require('koa-validate/node_modules/validator');
    var me = this;
    
    for(var key in me.value)
    {
        //check currency
        if(me.goOn && !v.isAlpha(key)){
            me.goOn = false;
            me.addError(tip || me.key + " Invalid currency.");
        }
        
        //check currency rate
        if (me.goOn && !v.isFloat(me.value[key])) {
            me.goOn = false;
            me.addError(tip || me.key + " Invalid currency rate.");
        }
    };
    
    if (me.goOn && !me.value.hasOwnProperty(key)) {
        me.goOn = false;
        me.addError(tip || me.key + " Invalid conversion rate.");
    }
    
    return me;
}
/** end--custom validators **/