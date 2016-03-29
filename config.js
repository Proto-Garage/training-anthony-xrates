var MONGO = require('koa-mongoose');

var config = {
    base: 'USD',
    generateConnection: function(){
        return MONGO(this.connectionParams);
    },
    connectionParams: {
        user: '',
        pass: '',
        host: '127.0.0.1',
        port: 27017,
        database: 'xrates',
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5
        }
    }
}


module.exports = config;