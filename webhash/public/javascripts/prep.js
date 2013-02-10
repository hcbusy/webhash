var WebHashModel = function(inurl) {
	 var self=this;
	 if(typeof(inurl)=='undefined' || inurl=='undefined')inurl='';
    self.url = ko.observable(inurl);
    self.lastCrawlTime = ko.observable();
    self.nextCrawlTime = ko.observable();
    self.records= ko.observableArray();
    self.status = ko.observable(); 
    self.log = function(x){self.status((new Date())+":"+x);}
	 self.refresh = function() {
		self.log("refreshing data."); 
		$.getJSON('/api/nextTime?u='+escape(self.url()), function(data){ self.nextCrawlTime("Next crawl is:"+data)});
		$.getJSON('/api/list?u='+escape(self.url()), function(data){
		var last={};
		self.log("computing delta.");
		for(var id in data){
			var recs=data[id].hashes;
			for(var hid in recs){
				var arec=recs[hid];
				if(!(arec.name in last))
					arec.delta='Unknown';
				else if(arec.value==last[arec.name])
					arec.delta='Same';
				else
					arec.delta='Changed';
				last[arec.name]=arec.value;
			}
		}
		//sort so latest is on top
		data.sort(function(a,b){if (a.timeCrawled==b.timeCrawled)return 0; return (a.timeCrawled>b.timeCrawled)?-1:1});
		self.log("rendering data.");
		self.records(data);
		self.log("done");
	});
	}
	 self.check   = function() { 
		self.log("Checking "+self.url());
		$.getJSON('/api/nextTime?u='+escape(self.url()), function(data){ self.nextCrawlTime("Next crawl is:"+data)});
		$.getJSON('/api/check?u='+escape(self.url()), function(data){ 
		self.log("done");self.refresh()})
	}
}
