(function(){
	var mongoose = require('mongoose');
	mongoose.connect('localhost', 'webhash');

   var root = this;

   //////////////////////////
   // urlHistory table    //
   //////////////////////////
	var myschemas={};
    if (typeof module !== 'undefined' && module.exports) {
	module.exports = myschemas;
    } else {
	root.myschemas = myschemas;
    }

	myschemas.urlHistorySpec={
		url:		      {type:String, trim:true},
		hashes:        [{hashType:String, name:String, value:String}],
		timeCrawled:	{ type: Date, default: Date.now }
	};
	myschemas.urlHistorySchema = mongoose.Schema(myschemas.urlHistorySpec);
	myschemas.urlHistorySchema.index({ url: 1, timeCrawled: 1 });
	myschemas.urlHistory       = mongoose.model('UrlHistory', myschemas.urlHistorySchema);

   //////////////////////////
   // urlStats table      //
   //////////////////////////
	myschemas.urlStatsSpec={
		url:		{type:String, trim:true, index:{unique:true}},
	   count:   Number,
	   errCnt:  Number,
		lastTimeCrawled:	{ type: Date, default:Date.now},
		state    :String,
		nextCrawl:	{
					when: {type: Date, default: Date.now},
					zran: {type: Number, default: Math.random},
		}
	}
	myschemas.urlStatsSchema = mongoose.Schema(myschemas.urlStatsSpec);
	myschemas.urlStatsSchema.index({nextCrawl:1});
	myschemas.urlStats 			= mongoose.model('UrlStats', myschemas.urlStatsSchema);

   myschemas.calculateNextTime = function(from){
		if(typeof(from)=='undefined')from=new Date();
		return new Date(from.getTime()+1000*60*60*4*(.3+.7*Math.random()))
	}

	myschemas.saveLink=function (url,phashes,time,nextTime){
		var hashes=phashes.hashes;
		var datum = new myschemas.urlHistory({ url: url, hashes:hashes, timeCrawled:time});
		if(typeof(nextTime)!='object'){nextTime=myschemas.calculateNextTime();}
		myschemas.urlStats.findOneAndUpdate({url:url},{$inc:{count:1},lastTimeCrawled:time,nextCrawl:{when:nextTime,zran:Math.random()},state:'ready'},{upsert:true},function(err){if(err)console.log('error updating url counter.'+err);});
		datum.save(function (err) { if (err) console.log('history writing error:'+err); });
	}
	return this;
}())
