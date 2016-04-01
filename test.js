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
                .end(done);
        });
        
        it('check invalid date. sending out-of-bounds date', function(done){
            request
                .get('/rates/2016-03-32')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it('return 200 regardless if date requested has data or not', function(done){
            request
                .get('/rates/2016-01-01')
                .expect('Content-Type', contentType)
                .expect(200)
                .end(done);
        });
        
        it('no base query passed, result should return USD as based currency', function(done){
            request
                .get('/rates/2016-01-01')
                .expect('Content-Type', contentType)
                .expect(200)
                .end(done);
        });        
        
        it('if base query is passed, check validity. should only allow letters. sending number', function(done){
            request
                .get('/rates/2016-01-01?base=12123')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it('if base query passed, regardless if found or not, should return 200', function(done){
            request
                .get('/rates/2016-01-01?base=abcd')
                .expect('Content-Type', contentType)
                .expect(200)
                .end(done);
        });
        
        it('currencies query passed is not alpha. should return 200', function(done){
            request
                .get('/rates/2016-01-01?currencies=1234')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
    });
    
    describe('POST', function(){
        it("no conversion rate for date", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: 'usd', currency: 'php', values: [1,2,3]})
            .expect('Content-Type', contentType)
            .expect(200)
            .end(done);
        });
        
        it("no base", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({currency: 'php', values: [1,2,3]})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
        
        it("base is not alpha", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: '1123', currency: 'php', values: [1,2,3]})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
        
        it("no currency", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: 'usd', values: [1,2,3]})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
        
        it("currency is not alpha", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: 'usd', currency: '1234', values: [1,2,3]})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
        
        it("no values to convert", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: 'usd', currency: 'php'})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
        
        
        it("values to convert is empty array", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: 'usd', currency: 'php', values: []})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
        
        it("values to convert contains alpha", function(done){
           request
            .post('/rates/2016-01-01/convert')
            .send({base: 'usd', currency: 'php', values: ["abc"]})
            .expect('Content-Type', contentType)
            .expect(400)
            .end(done);
        });
    });
    
    describe('PUT', function(){
        it("base currency is null", function(done){
            request
                .put('/rates/2016-01-01')
                .send({rates: {'php': 1.2}})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it("base currency is not alpha", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: '1234', rates: {'php': 1.2}})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it("exchange rate is null", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'php'})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it("exchange is not an object", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'php', rates: ""})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it("exchange is an empty object", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'usd', rates: {}})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it("exchange rate is an invalid object. currency key is not alpha", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'usd', rates: {"123": ""}})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
        
        it("exchange rate is an invalid object. currency value is not numeric", function(done){
            request
                .put('/rates/2016-01-01')
                .send({base: 'usd', rates: {"abcd": "aa"}})
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
        });
    });
});