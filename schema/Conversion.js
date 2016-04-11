var mongoose = require('koa-mongoose').mongoose;
var schema = mongoose.Schema;

mongoose.Promise = require('q').Promise;
mongoose.set('debug', true);

var modelSchema = new schema({
    from: String,
    to: String,
    rate: Number,
    date: Date
});

//retrieve conversion rate
modelSchema.statics.getConversionRate = function(filter, findAll, cb){
    findAll = findAll || false;
    
    if (findAll)
        return this.model('Conversion').find(filter, cb);
    
    return this.model('Conversion').findOne(filter, cb);
}

var model = mongoose.model('Conversion', modelSchema);

module.exports = model;