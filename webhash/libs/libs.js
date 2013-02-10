(function(){
	exports.logErrors=function (err, req, res, next) {
	  console.error(err.stack);
	  next(err);
	}
	exports.clientErrorHandler=function (err, req, res, next) {
	  if (req.xhr) {
	    res.send(500, { error: 'Something blew up!' });
	  } else {
	    next(err);
	  }
	}
	exports.errorHandler=function (err, req, res, next) {
	  res.status(500);
	  res.render('error', { error: err });
	}

	exports.check_api=function (a,req, res, next){
	   if(req.host!='api.localhost')return routes.index(req,res);
	   else next(req,res);
	}
	exports.vhost=function(hostname,dflt){
	   var idx=dflt;
	   return function(req, res, next){
	       var pass=false;
		try{
		   if(typeof(hostname)=='string' && req.host==hostname)
			pass=true;
		   else if(typeof(hostname)=='object' && 'exec' in hostname && hostname.exec(req.host)!=null)
			pass=true;
		}catch(e){;}
	        if(pass) next();
		else dflt(req,res);
	   }
	}
}());
