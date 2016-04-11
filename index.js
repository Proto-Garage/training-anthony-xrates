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
        var me = this
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
        
        var formatResult = function(data){
            var result = {};
            
            if (data.length > 0) {
                for(var key in data)
                {
                    result[data[key]["to"]] = data[key]["rate"];
                };
            }
            
            return result;
        }
        
        var returnResponse = function(data){
            result.rates = data;
            me.body = result;
        };
        
        var getConversion = CONVERSION.getConversionRate(filter, findAll).exec();
        
        yield getConversion.then(formatResult).then(returnResponse);
    })
    .put('/', BODY, function *(next){
        var me = this
            ,params = me.request.body
            ,base = params.base
            ,rates = params.rates
            ,error_msg = []
            ,data;
        
        me.checkBody("base").notEmpty(CONFIG.messages.error.null_base).isAlpha(CONFIG.messages.error.invalid_base);
        me.checkBody("rates").notEmpty(CONFIG.messages.error.null_rate).validRateObject(CONFIG.messages.error.invalid_rate);
        if (me.errors) {
            me.body = me.errors;
            me.status = 400;
            
            return;
        }
        
        base = base.toUpperCase();
        
        //var doUpdate = function(rates){
        //    //first thing to do is update/insert records and wait for it to finish
        //    //second is to return after all db update operation is done
        //    var deferred = Q.defer()
        //        ,updateQ = Q.nbind(CONVERSION.update, CONVERSION)
        //        ,currencyUpper
        //        ,ratesCount = 0
        //        ,updateCount = 0;
        //    
        //    //function to check whether all records are insert/updated
        //    //var doneUpdate = function(){
        //    //    if (ratesCount == updateCount)
        //    //        deferred.resolve('done upserting all records');
        //    //}
        //    
        //    //loop to each conversion rate
        //    for(var currency in rates)
        //    {
        //        ratesCount++;
        //        currencyUpper = currency.toUpperCase();            
        //        
        //        //run update for records asynchronously
        //        //updateQ(
        //        //    {from: base, to: currencyUpper, date: me.date},
        //        //    {from: base, to: currencyUpper, rate: rates[currency], date: me.date},
        //        //    {upsert: true, setDefaultsOnInsert: true}//set option to insert if record does not exist
        //        //).done(function(){
        //        //    updateCount++;
        //        //    
        //        //    doneUpdate();
        //        //});
        //    }
        //    
        //    return deferred.promise;
        //};
        
        var doUpdate = function(rates){
            //first thing to do is update/insert records and wait for it to finish
            //second is to return after all db update operation is done
            var deferred = Q.defer()
                ,currencyUpper
                ,ratesCount = 0
                ,updateCount = 0;
            
            //function to check whether all records are insert/updated
            var doneUpdate = function(){
                updateCount++;
                
                if (updateCount >= ratesCount)
                    deferred.resolve('done upserting all records');
            }
            
            //loop to each conversion rate
            for(var currency in rates)
            {
                ratesCount++;
                currencyUpper = currency.toUpperCase();            
                
                CONVERSION.update(
                    {from: base, to: currencyUpper, date: me.date},
                    {from: base, to: currencyUpper, rate: rates[currency], date: me.date},
                    {upsert: true, setDefaultsOnInsert: true}//set option to insert if record does not exist
                ).exec().then(doneUpdate);
            }
            
            return deferred.promise;
        };
        
        var returnResponse = function(data){
            me.body = "OK";
            me.status = 201;
        }
        
        yield doUpdate(rates).then(returnResponse);
    })
    .post('/convert', BODY, function *(next){
        var me = this
            ,params = me.request.body
            ,values = params.values
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

        var filter = {
            from: params.base,
            to: params.currency,
            date: me.date
        }
        
        var doConversion = function(data){
            var rate = 0
                ,converted_values = []
                ,convert = function(rate, value){
                    return rate * value;
                }
            
            //has exchange rate, then use that for conversion
            if (data) rate = data.rate;
            
            //convert values passed
            for(var key in values)
            {
                converted_values.push(convert(rate, values[key]));
            }
            
            return converted_values;
        };
        
        var getConversionRate = CONVERSION.getConversionRate(filter, findAll).exec();
        var returnResponse = function(data){
            me.body = {
                base: params.base,
                currency: params.currency,
                values: data
            }
        }
        
        yield getConversionRate.then(doConversion).then(returnResponse);
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