var mongoose = require('koa-mongoose').mongoose;
var schema = mongoose.Schema;

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

modelSchema.pre('save', function(next){
    var me = this;
    
    var cb = function(err, data){
        //has existing data
        if(data)
            next(new Error("Conversion from "+me.from+" to "+me.to+" already exist for this date"));
        else
            next();
    }
    
    var filter = {
        $or: [
            {from: me.from, to: me.to},
            {from: me.to, to: me.from}
        ],
        date: me.date
    }
    me.model('Conversion').getConversionRate(filter, false, cb);
});

module.exports = model;