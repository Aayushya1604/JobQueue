var express = require("express");
var bodyParser = require("body-parser");
var amqblib = require("amqplib");
var amqp = require("amqplib/callback_api");
var app = express();
let currentTime = 10;

var listOfJobs = [];

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.set("view engine", "ejs");
app.use("/assets", express.static("assets"));

app.get("/", function (req, res) {
  //res.sendFile(__dirname + '/index.html');
  res.render("index");
});

app.post("/", urlencodedParser, function (req, res) {
  //res.sendFile(__dirname + '/index.html');
  amqp.connect("amqp://localhost", function (error, connection) {
    if (error) {
      throw error;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }

      let queue = "jobsQ";
      //let msg = 'Test message';
      //let msg = req.body;
      let msg = JSON.stringify(req.body);
      //listOfJobs.push(msg.content.toString());

      channel.assertQueue(queue, {
        durable: true,
      });
      channel.sendToQueue(queue, Buffer.from(msg), {
        persistent: true,
      });
      console.log("Sent '%s'", msg);
      //listOfJobs.push(msg.content.toString());
    });
  });
  listOfJobs.push(req.body);
  console.log(req.body);
  res.render("index");
});

app.get("/viewJobs", function (req, res) {
  res.render("viewJobs", { jobs: listOfJobs });
});

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = "jobsQ";
    channel.assertQueue(queue, {
      durable: true,
    });
    channel.prefetch(1);

    console.log("Waiting for messages in %s", queue);
    channel.consume(queue, function (msg) {
      console.log("Received '%s'", msg.content.toString());
      const job = JSON.parse(msg.content.toString());
      console.log(job.jobTime);
      var ms = job.jobTime.split(":");
      var seconds = parseInt(+ms[0]) * 60 + parseInt(+ms[1]);
      console.log("SLEEPING FOR");
      console.log(seconds);
      setTimeout(function () {
        channel.ack(msg);
        listOfJobs.shift();
      }, parseInt(seconds) * 1000);
    });
  });
});

app.listen(3000);
