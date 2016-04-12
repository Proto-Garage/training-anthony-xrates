'use strict';

let KOA = require('koa')
    ,ROUTER = require('koa-router')()
    ,BODY = require('koa-body')()
    ,CONFIG = require('./config')
    ,CONVERSION = require('./schema/Conversion')
    ,JSON = require('koa-json')()
    ,RT = require('koa-response-time')()
    ,VALIDATOR = require('koa-validate')()
    ,COMPRESSION = require('koa-compress')()
    ,CORS = require('kcors')()
    ,Q = require('q')
    ,APP = KOA();

require('./lib/customValidator');

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
        let me = this
            ,query = me.query
            ,date = me.date
            ,rates
            ,result
            ,findAll = true
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
        
        let conversion = yield CONVERSION.getConversionRate(filter, findAll).exec();
        
        if (conversion.length > 0) {
            let key;
            
            for(key in conversion) {
                result.rates[ conversion[key]['to'] ] = conversion[key]['rate'];
            }
        }
        
        me.body = result;
    })
    .put('/', BODY, function *(next){
        let me = this
            ,params = me.request.body
            ,base = params.base
            ,rates = params.rates;
        
        me.checkBody("base").notEmpty(CONFIG.messages.error.null_base).isAlpha(CONFIG.messages.error.invalid_base);
        me.checkBody("rates").notEmpty(CONFIG.messages.error.null_rate).validRateObject(CONFIG.messages.error.invalid_rate);
        if (me.errors) {
            me.body = me.errors;
            me.status = 400;
            
            return;
        }
        
        base = base.toUpperCase();
        
        let doUpdate = function(rates){
            let currency, data = []
                ,currencyUpper;
            
            //loop to each conversion rate
            for(currency in rates)
            {
                currencyUpper = currency.toUpperCase();
                
                data.push(
                    CONVERSION.update(
                        {from: base, to: currencyUpper, date: me.date},
                        {from: base, to: currencyUpper, rate: rates[currency], date: me.date},
                        {upsert: true, setDefaultsOnInsert: true}//set option to insert if record does not exist
                    ).exec()
                )
            }
            
            return data;
        };
        
        yield Q.all(doUpdate(rates));
        
        me.body = "OK";
        me.status = 201;
    })
    .post('/convert', BODY, function *(next){
        let me = this
            ,params = me.request.body
            ,valuesToConvert = params.values
            ,conversion_rate
            ,findAll = false;
        
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

        let filter = {
            from: params.base,
            to: params.currency,
            date: me.date
        }
        
        let rates = yield CONVERSION.getConversionRate(filter, findAll).exec();
        
        //util function for conversion
        let doConversion = function(data, values){
            let rate = 0
                ,key
                ,converted_values = []
                ,convert = function(rate, value){
                    return rate * value;
                }
            
            //has exchange rate, then use that for conversion
            if (data) rate = data.rate;
            
            //convert values passed
            for(key in values)
            {
                converted_values.push( convert(rate, values[key]) );
            }
            
            return converted_values;
        };
        
        let convertedValues = doConversion(rates, valuesToConvert);
        
        me.body = {
            base: params.base,
            currency: params.currency,
            values: convertedValues
        }
    });

APP
    .use(COMPRESSION)
    .use(RT)
    .use(CORS)
    .use(CONFIG.generateConnection())
    .use(JSON)
    .use(VALIDATOR)
    .use(ROUTER.routes())
    .use(ROUTER.allowedMethods());

APP.listen(3000);