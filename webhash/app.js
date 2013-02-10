
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , api = require('./routes/api')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , mylibs=require("./libs/libs.js")
  , ageApi=require("./libs/AgeApi.js");


passport.use(new LocalStrategy( { usernameField: 'email', passwordField: 'passwd' },
  function(username, password, done) {
	if(username=="huan" && password=="password")return done(null,{username:"huan",password:"password"});
	return done(null, false, { message: 'Did not authenticate'});
  }));
passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user,null,1));
});

passport.deserializeUser(function(id, done) {
    done(err, id);
});

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.compress());
  app.use(express.cookieParser());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({ secret: 'keyboard cat', key: 'sid', cookie: { secure: true }}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(passport.initialize());
  app.use(passport.session());

  //app.use(myLibs.logErrors);
  //app.use(myLibs.clientErrorHandler);
  //app.use(myLibs.errorHandler);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//app.all('*', requireAuthentication, loadUser);
	
//app.get('/api/list', mylibs.vhost(/^api\./,routes.index), api.list);
//app.get('/api/check', mylibs.vhost(/^api\./,routes.index), api.check);
app.get('/api/list',  api.list);
app.get('/api/check', api.check);
app.get('/api/nextTime', api.nextTime);
//app.get('/api/check', mylibs.check_api, api.check);
//app.get('/api', mylibs.check_api, api.list);
//app.get('/api', passport.authenticate('local', { session: true}),api.list)
app.post('/login', passport.authenticate('local', { successRedirect: '/',
                                                    failureRedirect: '/login' }));
app.get('/about', routes.about);
app.get('/compare', routes.compare);
app.get('/', routes.index);
setInterval(ageApi.updateNext,1000);
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
