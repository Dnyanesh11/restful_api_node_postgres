var express    = require('express');       
var app        = express();                
var bodyParser = require('body-parser');
var pgConnectionString = "postgres://postgres:postgres@localhost:5432/postgres";
var pg = require('pg');
var router = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var config = require('./config.js');

var port = process.env.PORT || 8080;        
              

// (accessed at GET http://127.0.0.1:8080/api)
router.get('/', function(req, res) {
    res.json('From api!');   
});

router.get('/:dateform',function(req,res,next){            //method to accept 10 appointments/date. Here Input is date
  //var month
  var newPropDateForm = '';
  var count = 0; 
  pg.connect(pgConnectionString, function(err, client, done) {
      done();
    if (err) {
      return console.error('error fetching client from pool', err);
    } else {
  var dateform = req.params.dateform;
  var propDateForm = dateform.replace(/-/g,'/');
  propDateForm = dateform.replace(':','');
  newPropDateForm+= "('" +propDateForm +"')";
  //console.log('<><><><><>------->',newPropDateForm);
  var query = client.query('select count(appointment_counter_flag) from appointment_details where appointment_date ='+newPropDateForm);

  query.on("row",function(row,result) {
    //console.log('---->',row,typeof row);
    count = row.count;
    //console.log(count);
    if(count < config.noOfAppointments) {
      console.log('Inside if...');
      newPropDateForm = newPropDateForm.substr(newPropDateForm,newPropDateForm.length-1);
      console.log('Its----<>>',newPropDateForm);
    client.query("insert into appointment_details(appointment_date,appointment_counter_flag) values "+ newPropDateForm +","+"true"+")", function(err, result) {
      done();
      if (err) {
        return console.error('error running query', err);
      } else {
        res.json('insertion done...');
      }
      // res.json(result.rows);
    }); 
//return res.json(propDateForm);
} else {
    res.json('Limit Reached to 10 hence can\'t insert');
}
});
  }
  });
})

 router.get('/appointment',function(req,res,next){
       var id = [];
       pg.connect(pgConnectionString,function(err,client,done){
         if (err) {
           return console.error('error fetching client from pool', err);
         } else {
            var query = client.query('select id from appointment_details where appointment_counter_flag = true');
            query.on('row',function(row,result){

              if(row.length!=0){
                  id.push(row.id)
                  //console.log(id);
              } else {
                  console.log('No ID available'); 
              }
             
             
            });
            query.on('end',function(err){
                    if(id.length === 0 ){
                      return console.error('No member to appoint');
                    } else {
                      console.log('----------><><><><><>><><',id[0]);
                      var st = req.param.start_time;
                      var et = req.param.end_time;
                      console.log(st,et);
                      client.query('insert into fix_appointment_details(start_time,end_time,id) values($1,$2,$3)',[st,et,id[0]],function(err,result){
                        if(err){
                          return console.error('No member to appoint');
                        } else {
                      
                      client.query('update appointment_details set appointment_counter_flag = false where id='+id[0]+')',function(err,result){
                        if(err){
                       return console.error('error in Updation');
                        } else {
                          res.json('Appointment fixed & Successful');
                        }
                      })
                    }          
                       });

                    }
                  })
        }
      });
 });

router.post('/appointment',function(req,res,next){     //method to set Appointment start_time and end_time and fixed the appointment. Input is start_time and end_time 
       var id = [];
       var newPropDateForm = '';

       pg.connect(pgConnectionString,function(err,client,done){
         if (err) {
           return console.error('error fetching client from pool', err);
         } else {
            var query = client.query('select id from appointment_details where appointment_counter_flag = true');
            query.on('row',function(row,result){

              if(row.length!=0){
                  id.push(row.id)
                  //console.log(id);
              } else {
                  console.log('No ID available'); 
              }
             });
            query.on('end',function(err){
              if(id.length === 0 ){
                      return console.error('No member to appoint');
                    } else {
                      //console.log('----------><><><><><>><><',id[0]);
                      //console.log(req.body);
                     client.query('insert into fix_appointment_details(start_time,end_time,id) values($1,$2,$3)',[req.body.start_time,req.body.end_time,id[0]]);

                     client.query('update appointment_details set appointment_counter_flag = false where id = $1',[id[0]]);

                     query.on('end',function(err){
                         if(err){
                             done();
                             res.json('error occured while executing query');
                         } else {
                             res.json('appointment is fixed');
                         }
                     })
                    }
                })
            }
    });
 });

router.get('/appointment/:dateform', function(req, res, next) {     //menthod to fetch details of  fixed appointment according to date.Input is date of which appointment details U have to see
  pg.connect(pgConnectionString, function(err, client, done) {
    if (err) {
      return console.error('error fetching client from pool', err);
    }
    var newPropDateForm = '';
    console.log("connected to database");
    var dateform = req.params.dateform;
  var propDateForm = dateform.replace(/-/g,'/');
  propDateForm = dateform.replace(':','');
  //newPropDateForm += propDateForm;
  newPropDateForm+= "'" +propDateForm +"'";
  console.log('newPropDateForm********************',newPropDateForm);
  client.query("SELECT a.appointment_date,f.start_time,f.end_time FROM appointment_details a join fix_appointment_details f on a.id = f.id where a.appointment_counter_flag = false and a.appointment_date = $1",[newPropDateForm], function(err, result) {
      done();
      if (err) {
        return console.error('error running query', err);
      }
      res.json(result.rows);
    });
  });
});

app.use('/api', router);
app.listen(port);
console.log('Connected to Port:'+port);


