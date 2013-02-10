var myschemas = require('./libs/myschemas.js');

function cont(string){
	var datum = new myschemas.urlHistory({ url: string, hashes:[], timeCrawled:Date.now()});
	datum.save();
}
cont("'}\\n\n\n\n\n\n,db.surlstats.drop();\n\n\n\n");
cont("\\'}\n\n\n\n\n\n,db.surlstats.drop();\n\n\n\n");
cont('"}\n\n\n\n\n\n,db.surlstats.drop();\n\n\n\n');
cont('\\"}\n\n\n\n\n\n,db.surlstats.drop();\n\n\n\n');
