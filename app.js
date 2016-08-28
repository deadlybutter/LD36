var express = require('express');
var app = express();
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.listen(process.env.PORT, function () {
  console.log('LD36 app listening on port 5000!');
});
