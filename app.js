//. app.js

var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    line_login = require( 'line-login' ),
    session = require( 'express-session' ),
    app = express();

var settings = require( './settings' );

//. setup session
app.use( session({
  secret: settings.line_login_channel_secret,
  resave: false,
  saveUninitialized: false
}));

//. line login
var login = new line_login({
  channel_id: settings.line_login_channel_id,
  channel_secret: settings.line_login_channel_secret,
  callback_url: settings.line_login_callback_url
});

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


//. login
app.get( '/lineapi/login', login.auth() );

//. callback
app.get( '/lineapi/callback', login.callback( function( req, res, next, token_response ){
  //. success
  console.log( JSON.stringify( token_response, null, 2 ) );
  /*
  token_response = {
    access_token: "eyJ***",
    token_type: "Bearer",
    refresh_token: "*****",
    expires_in: 2592000,
    scope: "profile openid",
    id_token: {
      iss: "https://access.line.me",
      sub: "U045aaa***",
      aud: "16539***",
      exp: 16220**,
      iat: 16220**,
      nonce: "*****",
      amr: [ "linesso" ],
      name: "K.Kimura",
      picture: "https://profile.line-scdn.net/****"
    }
  }
   */
  req.session.lineapi = JSON.parse( JSON.stringify( token_response ) );
  //res.json( token_response );
  res.redirect( '/' );
}, function( req, res, next, error ){
  //. failed
  res.status( 400 ).json( error );
}));

//. logout
app.post( '/lineapi/logout', function( req, res ){
  req.session.lineapi = null;
  res.redirect( '/' );
});

app.all( '/*', function( req, res, next ){
  if( !req.session || !req.session.lineapi ){
    res.redirect( '/lineapi/login' );
  }else{
    next();
  }
});

app.get( '/', async function( req, res ){
  var profile = req.session.lineapi;
  res.render( 'index', { profile: profile } );
});

//. get user info
app.get( '/lineapi/info', async function( req, res ){
  if( !req.session || !req.session.lineapi ){
    res.json( { status: false } );
  }else{
    res.json( { status: true, info: req.session.lineapi } );
  }
});


function timestamp2datetime( ts ){
  if( ts ){
    var dt = new Date( ts );
    var yyyy = dt.getFullYear();
    var mm = dt.getMonth() + 1;
    var dd = dt.getDate();
    var hh = dt.getHours();
    var nn = dt.getMinutes();
    var ss = dt.getSeconds();
    var datetime = yyyy + '-' + ( mm < 10 ? '0' : '' ) + mm + '-' + ( dd < 10 ? '0' : '' ) + dd
      + ' ' + ( hh < 10 ? '0' : '' ) + hh + ':' + ( nn < 10 ? '0' : '' ) + nn + ':' + ( ss < 10 ? '0' : '' ) + ss;
    return datetime;
  }else{
    return "";
  }
}


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

