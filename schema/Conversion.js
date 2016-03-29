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
modelSchema.statics.getConversionRate = function(from, to, date, cb){
    return this.model('Conversion').findOne({ $or: [{from: from, to: to}, {from: to, to: from}], date: date}, cb);
}

var model = mongoose.model('Conversion', modelSchema);

//modelSchema.pre('save', function(next){
//    var me = this;
//    
//    //check if conversion rate already exist
//    //model.find(
//    //    {
//    //        $or: [{
//    //            from: this.from,
//    //            to: this.to
//    //        },
//    //        {
//    //            from: this.to,
//    //            to: this.from
//    //        }
//    //        ],
//    //        date: this.date
//    //    },
//    //    function(err, data){
//    //        if (!data.length) {
//    //            next();
//    //        }
//    //        else
//    //            next(new Error("data already exist"));
//    //});
//    
//    var cb = function(err, data){
//        if (data) {
//            if (!data.length) 
//                next();
//            else
//                next(new Error("data already exist"));
//        }
//        else
//        {
//            console.log("no data found");
//        }
//    }
//    
//    me.getConversion(this.from, this.to, this.date, next);
//});

module.exports = model;