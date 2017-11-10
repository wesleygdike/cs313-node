var express = require('express');
var url = require('url');
var app = express();

//Set up the costs in a double array
var costs = [
    [0,.49,.70,.91,1.12], //0, Letter(Stamped)
    [0,.46,.67,.88,1.09], //1, Letter(Metered)
    [0,.98,1.19,1.40,1.61,1.82,2.03,2.24,2.66,2.87,3.08,3.29,3.50], //2, Large Envelopes(Flats)
    [0,3,3,3,3.16,3.32,3.48,3.64,3.80,3.96,4.19,4.36,4.53] //3, Parcels
];

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/getRate', function(request, response) {
    var options = url.parse(request.url, true).query;
    response.render('pages/display_rate', {cost: costs[options.type][options.weight]});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
