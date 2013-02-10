(function(){
var ageApi=require('../libs/AgeApi');
var myschemas = require('../libs/myschemas.js');


exports.nextTime= function(req, res){
  var iu = ageApi.parseUrl(req);
  if(iu){
	myschemas.urlStats.findOne({url:iu},function(e,p){
		if(e || p==null){
			res.send("",404);
		}else{
				res.json(p.nextCrawl.when);
		}
	});
  }else res.send("",404);
}

exports.list= function(req, res){
  var iu = ageApi.parseUrl(req);
  if(iu)
	ageApi.getRecent(iu,function(r){res.json(r);});
  else
	res.send("not found",404);
	
};
exports.check=function(req,res){
  var iu = ageApi.parseUrl(req);
  ageApi.hashUrl(iu ,function(e,d){if(e){res.end('error',404);}else res.json(d);});
}
}())
