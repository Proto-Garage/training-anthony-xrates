'use strict';

var KOA = require('koa')
    ,ROUTER = require('koa-router')()
    ,BODY = require('koa-body')()
    ,CONFIG = require('./config')
    ,CONVERSION = require('./schema/Conversion')
    ,JSON = require('koa-json')()
    ,RT = require('koa-response-time')()
    ,VALIDATOR = require('koa-validate')()
    ,COMPRESSION = require('koa-compress')()
    ,APP = KOA();

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
    var v = require('./node_modules/koa-validate/node_modules/validator');
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
/** end--custom validators **/

ROUTER
    .prefix('/rates/:date')
    .param('date', function *(date, next){        
        //check if date is valid
        this.checkParams('date').isDate('Invalid format');
        if (this.errors) {
            this.body =  this.errors;
            this.status = 400;
            
            return;
        }
        
        this.date = date;
        
        yield next;
    })
    .get('/', function *(next){
        var me = this
            ,query = me.query
            ,date = me.date
            ,result, rates
            ,filter = {
                date: me.date,
                from: query.base || CONFIG.base
            };
        
        filter.from = filter.from.toUpperCase();        
        
        me.checkQuery('base').empty().isAlpha(CONFIG.messages.error.invalid_base);//validate base currency
        me.checkQuery('currencies').empty().match(/[a-zA-z,]/ig, CONFIG.messages.error.invalid_currencies);//validate currencies
        
        if (me.errors) {
            me.body = this.errors;
            me.status = 400;
            
            return;
        }
        
        if (query.currencies) {
            query.currencies = query.currencies.toUpperCase();
            
            filter.to = { $in: query.currencies.split(",") }
        }
        
        result = {
            base: filter.from,
            rates: {}
        }
        
        yield CONVERSION.getConversionRate(filter, true, function(err, data){
            if (err) return err;
            
            rates = data;
        });
        
        if (rates.length > 0) {
            for(var key in rates)
            {
                result.rates[value["to"]] = rates[key]["rate"];
            };
        }
        
        me.body = result;
    })
    .put('/', BODY, function *(next){
        var me = this
            ,params = me.request.body
            ,base = params.base
            ,rates = params.rates
            ,data
            ,error_msg = [];        
    
        for(var currency in rates)
        {
            data = new CONVERSION({
                from: base.toUpperCase(),
                to: currency.toUpperCase(),
                rate: rates[currency],
                date: me.date
            });
            
            data.save(function(err, data){
                if (err) error_msg.push(err.message);
            });
        }
        
        this.body = {errors: error_msg, msg: error_msg.length > 0 ? "OK but with errors" : "OK"};
        this.status = 201;
    })
    .post('/convert', BODY, function *(next){
        var me = this
            ,params = me.request.body
            ,values = params.values
            ,converted_values = []
            ,conversion_rate,
            cb;
            
        me.checkBody('base').notEmpty(CONFIG.messages.error.null_base).isAlpha(CONFIG.messages.error.invalid_base);
        me.checkBody('currency').notEmpty(CONFIG.messages.error.null_currency).isAlpha(CONFIG.messages.error.invalid_currency);
        me.checkBody('values').notEmpty(CONFIG.messages.error.null_values).arrayNotEmpty(CONFIG.messages.error.null_values).arrayOfNumbers(CONFIG.messages.error.invalid_values);
        
        if (me.errors) {
            me.body = me.errors;
            me.status = 400;
            
            return;
        }
        
        params.base = params.base.toUpperCase();
        params.currency = params.currency.toUpperCase();
        
        cb = function(err, data){
            var rate = 0
                ,convert = function(rate, value){
                    return rate * value;
                }
            
            if (data) rate = data.rate;
            
            //convert values passed
            for(var key in values)
            {
                converted_values.push(convert(rate, values[key]));
            }
        };

        var filter = {
            //$or: [
            //    {from: params.base, to: params.currency},
            //    {from: params.currency, to: params.base}
            //],
            from: params.base,
            to: params.currency,
            date: this.date
        }
        
        yield conversion_rate = CONVERSION.getConversionRate(filter, false, cb);
        
        this.body = {
            base: params.base,
            currency: params.currency,
            values: converted_values
        }
    });

APP
    .use(COMPRESSION)
    .use(RT)    
    .use(CONFIG.generateConnection())
    .use(JSON)
    .use(VALIDATOR)
    .use(ROUTER.routes())
    .use(ROUTER.allowedMethods());

APP.listen(3000);