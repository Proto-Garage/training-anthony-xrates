var test = require('unit.js');

var host = "http://localhost:3000"
    ,contentType = "application/json; charset=utf-8",
    request = test.httpAgent(host);

describe('xrates API', function(){    
    describe('GET', function(){
        it('no date param sent', function(done){
            request
                .get('/rates')
                .expect(404)
                .end(done);
        });
        
        it('check invalid date. sending letters instead of a date', function(done){
            request
                .get('/rates/abcd')
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
                
            function checkResBody(res) {
                var expectedBody = [{date: 'Invalid format'}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it('check invalid date. sending out-of-bounds date', function(done){
            request
                .get('/rates/2016-03-32')
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{date: 'Invalid format'}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it('return 200 regardless if date requested has data or not', function(done){
            request
                .get('/rates/2010-01-01')
                .expect('Content-Type', contentType)
                .expect(200)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {                
                test.object(res.body)
                    .isEnumerable('base')
                    .isEnumerable('rates');
            }
        });
        
        it('no base query passed, result should return USD as based currency', function(done){
            request
                .get('/rates/2016-01-01')
                .expect('Content-Type', contentType)
                .expect(200)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {                
                test.object(res.body)
                    .isEnumerable('base')
                    .isEnumerable('rates')
                    .hasKey('base', 'USD');
            }
        });        
        
        it('if base query is passed, check validity. should only allow letters. sending number', function(done){
            request
                .get('/rates/2016-01-01?base=12123')
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{base: 'Base currency invalid.'}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it('if base query passed, regardless if found or not, should return 200', function(done){
            var base = 'abcd';
            
            request
                .get('/rates/2016-01-01?base='+base)
                .expect('Content-Type', contentType)
                .expect(200)
                .expect(checkResBody)
                .end(done);
                
            function checkResBody(res) {
                test.object(res.body)
                    .isEnumerable('base')
                    .isEnumerable('rates')
                    .hasKey('base', base.toUpperCase());
            }
        });
        
        it('currencies query passed is not alpha. should return 200', function(done){
            request
                .get('/rates/2016-01-01?currencies=1234')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"currencies": "currencies is bad format."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
    });
    
    describe('POST', function(){
        it("no conversion rate for date", function(done){
            var base = 'usd'
                ,currency = 'php';
            
            request
                .post('/rates/2016-01-01/convert')
                .send({base: base, currency: currency, values: [1,2,3]})
                .expect('Content-Type', contentType)
                .expect(200)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {                
                test.object(res.body)
                    .isEnumerable('base')
                    .isEnumerable('currency')
                    .isEnumerable('values')
                    .hasKey('base', base.toUpperCase())
                    .hasKey('currency', currency.toUpperCase())
            }
        });
        
        it("no base", function(done){
            var currency = 'php';
            
            request
                .post('/rates/2016-01-01/convert')
                .send({currency: currency, values: [1,2,3]})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"base": "Base currency can't be null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("base is not alpha", function(done){
            request
                .post('/rates/2016-01-01/convert')
                .send({base: '1123', currency: 'php', values: [1,2,3]})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"base": "Base currency invalid."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("no currency", function(done){
            request
                .post('/rates/2016-01-01/convert')
                .send({base: 'usd', values: [1,2,3]})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"currency": "Currency can't be null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("currency is not alpha", function(done){
            request
                .post('/rates/2016-01-01/convert')
                .send({base: 'usd', currency: '1234', values: [1,2,3]})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"currency": "Currency invalid."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("no values to convert", function(done){
            request
                .post('/rates/2016-01-01/convert')
                .send({base: 'usd', currency: 'php'})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"values": "Values to convert can't be null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        
        it("values to convert is empty array", function(done){
            request
                .post('/rates/2016-01-01/convert')
                .send({base: 'usd', currency: 'php', values: []})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"values": "Values to convert can't be null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("values to convert contains alpha", function(done){
            request
                .post('/rates/2016-01-01/convert')
                .send({base: 'usd', currency: 'php', values: ["abc"]})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"values": "Invalid values to convert."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
    });
    
    describe('PUT', function(){
        it("base currency is null", function(done){
            request
                .put('/rates/2016-01-01')
                .send({rates: {'php': 1.2}})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"base": "Base currency can't be null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("base currency is not alpha", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: '1234', rates: {'php': 1.2}})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
                
            function checkResBody(res) {
                var expectedBody = [{"base": "Base currency invalid."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("exchange rate is null", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'php'})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"rates": "Conversion rate is null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("exchange rate is not an object", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'php', rates: ""})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
                
            function checkResBody(res) {
                var expectedBody = [{"rates": "Conversion rate is null."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("exchange is an empty object", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'usd', rates: {}})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"rates": "Invalid conversion rate."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("exchange rate is an invalid object. currency key is not alpha", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'usd', rates: {"123": ""}})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
            
            function checkResBody(res) {
                var expectedBody = [{"rates": "Invalid conversion rate."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
        
        it("exchange rate is an invalid object. currency value is not numeric", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'usd', rates: {"abcd": "aa"}})
                .expect('Content-Type', contentType)
                .expect(400)
                .expect(checkResBody)
                .end(done);
                
            function checkResBody(res) {
                var expectedBody = [{"rates": "Invalid conversion rate."}];
                
                test.array(res.body).is(expectedBody);
            }
        });
    });
});