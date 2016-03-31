var test = require('unit.js');

var host = "http://localhost:3000"
    ,contentType = "application/json; charset=utf-8";

describe('xrates API', function(){
    describe('GET', function(){
        it('no date param sent', function(done){
            test
                .httpAgent(host)
                .get('/rates')
                .expect(404)
                .end(done);
        });
        
        it('check invalid date. sending letters instead of a date', function(done){
            test
                .httpAgent(host)
                .get('/rates/abcd')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
                
                //to be done - check if the returned object returns an object with date property.
        });
        
        it('check invalid date. sending out-of-bounds date', function(done){
            test
                .httpAgent(host)
                .get('/rates/2016-03-32')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
                
                //to be done - check if the returned object returns an object with date property.
        });
        
        it('return 200 regardless if date requested has data or not', function(done){
            test
                .httpAgent(host)
                .get('/rates/2016-01-01')
                .expect('Content-Type', contentType)
                .expect(200)
                .end(done);
                
                //to be done - check if the returned object returns an object with base property.
        });
        
        it('no base query passed, result should return USD as based currency', function(done){
            test
                .httpAgent(host)
                .get('/rates/2016-01-01')
                .expect('Content-Type', contentType)
                .expect(200)
                .end(done);
                
                //to be done - check if the returned object returns an object with base property = usd.
        });        
        
        it('if base query is passed, check validity. should only allow letters. sending number', function(done){
            test
                .httpAgent(host)
                .get('/rates/2016-01-01?base=12123')
                .expect('Content-Type', contentType)
                .expect(400)
                .end(done);
                
                //to be done - check if the returned object returns an object with base property.
        });
        
        it('if base query passed, regardless if found or not, should return 200', function(done){
            test
                .httpAgent(host)
                .get('/rates/2016-01-01?base=abcd')
                .expect('Content-Type', contentType)
                .expect(200)
                .end(done);
        });
    });
    
    describe('POST', function(){
    });
    
    describe('PUT', function(){
    });
});