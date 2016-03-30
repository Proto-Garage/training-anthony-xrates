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
    },
    messages: {
        error: {
            invalid_base: "Base currency invalid.",
            null_base: "Base currency can't be null.",
            invalid_currency: "Currency invalid.",
            null_currency: "Currency can't be null.",
            null_values: "Values to convert can't be null.",
            invalid_values: "Invalid values to convert."
        }
    }
}


module.exports = config;