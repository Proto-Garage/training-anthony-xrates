'use strict';

var KOA = require('koa')
    ,ROUTER = require('koa-router')()
    ,BODY = require('koa-body')()
    ,CONFIG = require('./config')
    ,CONVERSION = require('./schema/Conversion')
    ,JSON = require('koa-json')()
    ,RT = require('koa-response-time')()
    ,COMPRESSION = require('koa-compress')()
    ,APP = KOA();

ROUTER
    .prefix('/rates/:date')
    .param('date', function *(date, next){
        this.date = date;
        
        yield next;
    })
    .get('/', function *(next){
        var me = this;
        var query = this.query;
        var date = this.date;
        var result;
        
        var filter = {
            date: this.date,
            from: query.base || CONFIG.base
        };
        filter.from = filter.from.toUpperCase();
        
        if (query.currencies) {
            filter.to = { $in: query.currencies.split(",") }
        }
        console.log(filter);
        
        yield CONVERSION.find(filter, function(err, data){
            if (err) return console.log(err);
            
            result = data;
        });
        
        this.body = result;
    })
    .put('/', BODY, function *(next){
        var params = this.request.body;
        var base = params.base;
        var rates = params.rates;
        var data;
        
        if (rates.length > 0) {
            for(var x in rates)
            {
                data = new CONVERSION({
                    from: base.toUpperCase(),
                    to: x.toUpperCase(),
                    rate: rates[x],
                    date: this.date
                });
                
                yield data.saveQ(function(err, data){
                    console.log('error', err);
                    console.log('data', data);
                });
            }
        }
    })
    .post('/convert', BODY, function *(next){
        var st = new Date();
        console.log('start', st);
        
        var params = this.request.body
            ,values = params.values
            ,converted_values = []
            ,conversion_rate,
            cb;
        
        cb = function(err, data){
            var rate = 0;
            var base = params.base.toUpperCase();
            var currency = params.base.toUpperCase();
            var formula = function(rate, value){
                /**
                * since the db structure is using 'from' and 'to' as conversion for currency
                * if the conversion is straight forward which means that the conversion will be the
                * same with what is stored in 'from' and to'.
                * example:
                *  params: base = USD, currency = PHP
                *  data: from = USD, to = PHP
                */
                return rate * value;
            }
            
            if (data) {
                rate = data.rate;
                
                /**
                * the conversion is backwards
                * example:
                *  params: base = PHP, currency = USD
                *  data: from = USD, to = PHP
                * 
                */
                if (data.from != base) {
                    formula = function(rate, value){
                        return ((1 / rate) * value);
                    }
                }                
            }
            
            //convert values passed
            values.forEach(function(value){
                converted_values.push(formula(rate, value));
            });
        };
        
        yield conversion_rate = CONVERSION.getConversionRate(params.base, params.currency, this.date, cb);
        
        this.body = {
            base: params.base,
            currency: params.currency,
            values: converted_values
        }
        
        console.log('end', new Date().getMilliseconds()-st.getMilliseconds());
    });

var routes = ROUTER.routes();
var allowedMethods = ROUTER.allowedMethods();

APP
    .use(RT)
    .use(COMPRESSION)
    .use(CONFIG.generateConnection())
    .use(JSON)
    .use(routes)
    .use(allowedMethods);

APP.listen(3000);