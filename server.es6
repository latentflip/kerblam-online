/* jshint esnext:true */

require('6to5/register');
var Hapi = require('hapi');
var gamePlugin = require('./server/game-socket.es6');
var bss = require('building-static-server');

var server = new Hapi.Server();
server.connection({ port: 8000, labels: 'app' });
server.connection({ port: 8080, labels: 'game' });

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'public'
        }
    }
});

server.register({
    register: bss
}, function (err) { if (err) throw err; });

server.register({
    register: gamePlugin
}, function(err) { if (err) throw err; });

server.start(function () {
    console.log('Server running at:', server.info.uri);
});
