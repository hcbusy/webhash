
/*
 * GET home page.
 */

var ageApi=require('../libs/AgeApi');
exports.index = function(req, res){
  res.render('index', {url:ageApi.parseUrl(req)});
};
exports.about= function(req, res){
  res.render('intro');
};
exports.compare= function(req, res){
  res.render('compare');
};
