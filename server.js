var express    = require('express');       
var app        = express();                
var bodyParser = require('body-parser');
var pgConnectionString = "postgres://postgres:postgres@localhost:5432/postgres";
var pg = require('pg');
var router = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        
              

// (accessed at GET http://127.0.0.1:8080/api)
router.get('/', function(req, res) {
    res.json('From api!');   
});

// To Fetch all records from database table

router.get('/emp', function(req, res, next) {
  pg.connect(pgConnectionString, function(err, client, done) {
    if (err) {
      return console.error('error fetching client from pool', err);
    }
    console.log("connected to database");
    client.query('SELECT * FROM emp', function(err, result) {
      done();
      if (err) {
        return console.error('error running query', err);
      }
      res.json(result.rows);
    });
  });
});


// Fetch Salary of employee according to input parameter

router.get('/emp/:id', function(req, res, next) {
  pg.connect(pgConnectionString, function(err, client, done) {
      done();
    if (err) {
      return console.error('error fetching client from pool', err);
    }
    console.log("@connected to database");
    var id = req.params.id;
id = id.substr(1,id.length);
console.log('id is---<>',id);
var query1 = 'select sal from emp where id ='+id;

var query = client.query(query1);

query.on("row",function(row,result){
    result.addRow(row);
  });
  query.on("end",function(result){
      res.json(result.rows);
    });
  });
});

// update Emp table
router.put('/emp/:id', function(req, res, next) {
  pg.connect(pgConnectionString, function(err, client, done) {
    if (err) {
      return console.error('error fetching client from pool', err);
    }
    console.log("connected to database");
    var id = req.params.id;
    id = id.substr(1,id.length);
    client.query('UPDATE emp SET ename = $1,sal = $2 where id = $3', [req.body.ename,req.body.sal,id], function(err, result) {
      done();
      if (err) {
        return console.error('error running query', err);
        }
      res.send(result);
    });
  });
});


app.use('/api', router);
app.listen(port);
console.log('Connected to Port:'+port);
