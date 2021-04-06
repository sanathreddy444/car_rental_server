const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

// create express app
const app = express();
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse requests of content-type - application/json
app.use(bodyParser.json())

//local mysql db connection
const dbConn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Reddy@1510',
  database : 'car_rental'
});
dbConn.connect(function(err) {
  if (err) throw err;
  console.log("Database Connected!");
});


app.all('/*', function(req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,enctype,authorization');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});


var Customer = function(customer){
  this.first_name     = customer.first_name;
  this.last_name      = customer.last_name;
  this.email          = customer.email;
  this.phone_number   = customer.phone_number;
  this.is_active      = 1;
  this.password       = customer.password;
  this.dob            = customer.dob;
  this.role           = "customer";
  this.driving_license = customer.driving_license;
  this.address = customer.address;
  this.created_date   = new Date();
};

var Inventory = function(inventory){
  this.model     = inventory.model;
  this.brand      = inventory.brand;
  this.year          = inventory.year;
  this.vehicle_type   = inventory.vehicle_type;
  this.is_active      = 1;
  this.price       = inventory.price;
  this.booked_by            = null;
  this.created_date   = new Date();
};

// define a root route
// app.get('/', (req, res) => {
//   res.send("Hello World");
// });

// ALTER TABLE car_rental.vehicle ADD booked_by varchar(200);
// ALTER TABLE car_rental.customer MODIFY COLUMN dob varchar(100)

app.post('/register', (req, res) => {
  // console.log("Request", req.body)
  const new_customer = new Customer(req.body);

  dbConn.query("INSERT INTO customer set ?", new_customer, function (err, result) {
    if(err) {
      res.send({status:500, message: "Customer registration failed"});
    }
    else{
      res.send({status:200, message: "Customer registered successfully"});
    }
  });
});


app.post('/login', (req, res) => {
  dbConn.query("SELECT * FROM customer WHERE email = ? and password = ?", [req.body.username, req.body.password], function (err, result) {
    if(err) {

      res.send({status:500, message: "Invalid Credentials"});

    }
    else if(result.length){
      res.send({status:200, data: result});
    } else {
      res.send({status:500, message: "Invalid Credentials"});

    }
  });
});

app.get('/fetchAllCustomers', (req,res) => {
  dbConn.query("SELECT * FROM customer", function(err, result) {
    if(err) {
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status:200,data:result})
    }
  })
})

app.post('/addInventory', (req, res) => {
  const new_inventory = new Inventory(req.body);

  dbConn.query("INSERT INTO vehicle set ?", new_inventory, function (err, result) {
    if(err) {
      console.log
      res.send({status:500, message: "Please try again"});
    }
    else{
      res.send({status:200, message: "Vehicle added successfully"});
    }
  });
});

app.post('/fecthAvailableinventory', (req, res) => {
  let query = "SELECT * FROM vehicle WHERE is_active = ?";
  let values = [1]
  if(req.body.vehicle_type!="All") {
    query+=" and vehicle_type = ?";
    values.push(req.body.vehicle_type);
  }
  if(req.body.year!="All") {
    query+=" and year = ?";
    values.push(req.body.year);
  }
  if(req.body.brand!="All") {
    query+=" and brand = ?";
    values.push(req.body.brand);
  }
  dbConn.query(query,values,function(err, result) {
    if(err) {
      res.send({status:500, message: "Please try again"});
    }
    else{
      res.send({status:200, data: result});
    }
  })
})

app.get('/deleteInventory/:id', (req, res) => {
  dbConn.query("DELETE FROM vehicle WHERE id = ?",[req.params.id], function(err, result) {
    if(err) {
      console.log("err",err);
      res.send({status:500, message: "Please try again"});
    }
    else{
      res.send({status:200, message: "Car Deleted Successfully"});
    }
  })
})

app.get('/customerProfile/:username', (req, res) => {
  dbConn.query("SELECT * FROM customer WHERE email = ?",[req.params.username], function(err, result) {
    if(err) {
      res.send({status:500, message: "Please try again"});
    } else if(result.length) {
      res.send({status: 200, data:result[0]});
    } else {
      res.send({status:500, message: "User Not Found"});
    }
  })
});

app.post('/updateProfile', (req, res) => {
  dbConn.query("UPDATE customer SET first_name = ?,last_name = ?,dob = ?,address = ?,phone_number = ?,driving_license = ?",[req.body.first_name,req.body.last_name,req.body.dob,req.body.address,req.body.phone_number,req.body.driving_license], function(err, result) {
    if(err) {
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status: 200, message: "Profile Updated Successfully"});
    }
  })
})

app.get('/confirmBooking/:id/:username', (req, res) => {
  dbConn.query("UPDATE vehicle SET is_active = ?,booked_by = ? WHERE id = ?",[2,req.params.username,req.params.id], function(err, result) {
    if(err) {
      console.log("err",err);
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status: 200, message: "Vehicle Booked Successfully"});
    }
  })
})

app.post('/fetchBookedCars', (req, res) => {
  dbConn.query("SELECT * FROM vehicle WHERE booked_by = ?",[req.body.username], function(err, result) {
    if(err) {
      console.log("err",err);
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status: 200, data: result});
    }
  })
})

app.get('/returnCar/:id', (req, res) => {
  dbConn.query("UPDATE vehicle SET is_active =?,booked_by = ? WHERE id = ?",[3,null,req.params.id], function(err, result) {
    if(err) {
      console.log("err",err);
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status: 200, message: "Vehicle Returned Successfully"});
    }
  })
})

app.get('/fetchReturnedCars', (req, res) => {
  dbConn.query("SELECT * FROM vehicle WHERE is_active = ?",[3], function(err, result) {
    if(err) {
      console.log("err",err);
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status: 200, data: result});
    }
  })
})

app.get('/confirmReturn/:id', (req, res) => {
  dbConn.query("UPDATE vehicle SET is_active =? WHERE id = ?",[1,req.params.id], function(err, result) {
    if(err) {
      console.log("err",err);
      res.send({status:500, message: "Please try again"});
    } else {
      res.send({status: 200, message: "Vehicle Returned Successfully"});
    }
  })
})

// listen for requests
app.listen(3000, () => {
  console.log(`Server is listening on port 3000`);
});