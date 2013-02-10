(function(){
	var http = require('http');
	var url = require('url');
	var crypto = require('crypto');
	var usm = require('underscore');
	var htmlparser = require("htmlparser");
	var excluded_urls=['','#','javascript:void(0)'];
	var async = require('async');
	var myschemas = require('./myschemas.js');

	function Age(){}
	//Age.prototype.cleanup(){ }
	function HtmlHash(){
		var self=this;
		self.ts = new Date();
		var halgo = 'sha256';
		var hash= crypto.createHash('sha256');
		var thash= crypto.createHash('sha256');
		var lhash= crypto.createHash('sha256');
		var fhash= crypto.createHash('sha256');
		var shash= crypto.createHash('sha256');

		var handler = new htmlparser.DefaultHandler(function (error, dom) { if (error); else; });
		var parser = new htmlparser.Parser(handler);

		self.update=function(block){
			parser.parseChunk(block);
			hash.update(block);
		}

		self.complete=function (){
			parser.done();
			var queue=[];
			for(entry in handler.dom){var e=handler.dom[entry];e.parents=[];queue.push(e);}
			linkarr=[];
			linkSeen={};
			while(queue.length>0){
				//console.log("queue has "+queue.length+" elem is "+JSON.stringify(elem,null,3));
				var elem=queue.shift();
				var parents=elem.parents.slice();
				parents.push(elem.type+':'+elem.name);
				try{
					if('children' in elem)for(x in elem.children){
						var xc = elem.children[x];
						xc.parents=parents.slice();
						queue.push(xc);
					}
				}catch(e){console.log("error:"+e);}
				try{
					if(elem.type=='text' || elem.type=='plain'){
						//console.log("hashing :"+JSON.stringify(elem,null,4));
						if(usm.contains(elem.parents,'tag:script')) shash.update(elem.data);
						if(usm.contains(elem.parents,'tag:a')) lhash.update(elem.data);
						if(usm.contains(elem.parents,'tag:form')) fhash.update(elem.data);
						if(!usm.contains(elem.parents,'tag:script') && !usm.contains(elem.parents,'tag:a')  && !usm.contains(elem.parents,'tag:form')) thash.update(elem.data);
						continue;
					}else if(elem.type=='script'){
						if('attribs' in elem && 'src' in elem.attribs && !(elem.attribs.src in linkSeen) && !usm.contains(excluded_urls,elem.attribs.src)){
							//console.log("script:"+elem.attribs.src);
							linkarr.push("script:"+elem.attribs.src);
							linkSeen[elem.attribs.src]=1;
						}
						continue;
					}else if(elem.type!='tag')continue;
					if(elem.name=='a' && 'attribs' in elem && 'href' in elem.attribs && !(elem.attribs.href in linkSeen) && !usm.contains(excluded_urls,elem.attribs.href)){
						//console.log("href:"+elem.attribs.href);
						linkarr.push("href:"+elem.attribs.href);
						linkSeen[elem.attribs.href]=1;
					}else if(elem.name=='link' && (elem.attribs.type=='text/css'||elem.attribs.rel=='stylesheet')&& !(elem.attribs.href in linkSeen) && !usm.contains(excluded_urls,elem.attribs.href)){
						//console.log("css:"+elem.attribs.href);
						linkarr.push("css:"+elem.attribs.href);
						linkSeen[elem.attribs.href]=1;
					}
				}catch(e){console.log("error:"+e);}
			}
		}

		self.getAge=function (){
			var topDigest=hash.digest('hex');
			var textDigest=thash.digest('hex');
			var linkDigest=lhash.digest('hex');
			var formDigest=fhash.digest('hex');
			var scriptDigest=shash.digest('hex');
			return {
				ts:self.ts,
				mime:'application/html',
				hashes:[{hashType:'sha256',name:'topDigest',value:topDigest},
					 {hashType:'sha256',name:'textDigest',value:textDigest},
					 {hashType:'sha256',name:'linkDigest',value:linkDigest},
					 {hashType:'sha256',name:'formDigest',value:formDigest},
					 {hashType:'sha256',name:'scriptDigest', value:scriptDigest}]
			};
		}
	}
	//HtmlHash.prototype=new Age();

	exports.hashUrl=function(u, cont){
		//TODO: use different parsers for xml/rss/atom entries based on headers[content-type] text/xml; charset=UTF-8
		//TODO: hash onl large blocks. store snippet to identify the block.
		//TODO: remove white space, punctuation, and html entities
		console.log("running http.get on "+u);
		if(typeof(u)=='undefined' || u==null)return;
		myschemas.urlStats.update({url:u},{state:'working'});
	
		var uurl = url.parse(u);
		var optDict={'hostname':uurl.hostname,'path':uurl.path};
		if('port' in uurl)optDict[port]=uurl.port;
		optDict['headers']={ 'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13' }
		var ager=new HtmlHash();
		http.get(optDict,function(res){
			res.on('data',function(d){
				ager.update(d);
			}) .on('end',function(){
				var headers=res.headers;
				var theirTs=headers['date'];
				var expiry=headers['expires'];
				var lastMod=headers['last-modified'];
				var Etag=headers['ETag'];
				ager.complete();
				var age = ager.getAge();
				myschemas.saveLink(u,age,age.ts);
				myschemas.urlStats.update({url:u},{state:'ready'});
				cont(false,age);
			});
		}).on("error",function(e){console.log("Got error: "+e.message);cont(e,null);});
	}

	exports.getRecent=function(url,callback){
		var recent=[];
		try{
			myschemas.urlHistory.find({url:url}).sort({timeCrawled:1}).limit(10).exec(function(e,p){
				if(e){
					console.log("There was an error while retrieving history:"+e);
				}else{
					for(var x=0;x<p.length;++x){
						var h=p[x]['hashes'];
						var h2=[];
						for(var y=0;y<h.length;++y)h2.push({hashType:h[y].hashType,name:h[y].name,value:h[y].value});
						recent.push({url:url,timeCrawled:p[x].timeCrawled,hashes:h2});
					}
					callback(recent);
				}
			});
		}catch(e){console.log("error getting recent logs of same ur.");}
	}
	exports.parseUrl=function (req){
			  return req.param('u');
   }
	exports.updateNext=function(){
		myschemas.urlStats.findOneAndUpdate({state:'ready'},{state:'working'},{sort:{nextCrawl:1}},function(err,doc){
		if(err || doc==null || typeof(doc)=='undefined'){
				myschemas.urlStats.update({url:url},{$set:{state:'ready'}});
		}else{
			if(doc.nextCrawl.when>new Date()){
			   console.log("waiting to update "+doc);	
				myschemas.urlStats.update({url:url},{$set:{state:'ready'}});
			}else{
				console.log("auto updating "+doc);
				exports.hashUrl(doc.url,function(result){
					exports.updateNext();//if successful continue trying
				});
			}
		}
	});}
}());
