/* 
 * Slack API Demo 
 * This example shows how to ustilize the App Home feature
 * October 11, 2019
 *
 * This example is written in Vanilla-ish JS with Express (No Slack SDK or Framework)
 * To see how this can be written in Bolt, https://glitch.com/edit/#!/apphome-bolt-demo-note
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); 
const qs = require('qs');

const signature = require('./verifySignature');
const appHome = require('./appHome');
const message = require('./message');

require('dotenv').config();

const app = express();

const apiUrl = 'https://slack.com/api';

//notification.jsonに書き込むための準備(2021/10/21追加)
const JsonDB = require('node-json-db');
const notice = new JsonDB('notification', true, true);
//


/*
 * Parse application/x-www-form-urlencoded && application/json
 * Use body-parser's `verify` callback to export a parsed raw body
 * that you need to use to verify the signature
 *
 * Forget this if you're using Bolt framework or either SDK, otherwise you need to implement this by yourself to verify signature!
 */

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));


/*
 * Endpoint to receive events from Events API.
 */

app.post('/slack/events', async(req, res) => {
  switch (req.body.type) {
      
    case 'url_verification': {
      console.log("VERIFICATION");
      // verify Events API endpoint by returning challenge if present
      res.send({ challenge: req.body.challenge });
      break;
    }
      
    case 'event_callback': {
      console.log("CALLBACK");
      // Verify the signing secret
      if (!signature.isVerified(req)) {
        res.sendStatus(404);
        return;
      } 
      
      // Request is verified --
      else {
        
        const {type, user, channel, tab, text, subtype} = req.body.event;
        const team_id = req.body.team_id;

        // Triggered when the App Home is opened by a user
        if(type === 'app_home_opened') {
          // Display App Home
          appHome.displayHome(user, team_id);
        }
      }
      break;
    }
    default: { res.sendStatus(404); }
  }
});



/*
 * Endpoint to receive an button action from App Home UI
 */

app.post('/slack/actions', async(req, res) => {});


/*
 * Endpoint to receive an action from Android app "DTNFileShare"
 */

app.post('/android', async(req, res) => {
  console.log("form android");
  res.send("android");

  const ts = new Date();
  const id = req.body.id;
  const eid = req.body.eid;
  const team_id = req.body.team_id;
  
  var real_name;
  await axios.get(`${apiUrl}/users.info`, {
     params: {
	 // token: process.env.SLACK_BOT_TOKEN,
       user: id
     },
     headers: {
       Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
     }
  }).then(res =>{
    real_name = res.data.user.real_name;
  });
  
  const data = {
    id: id,
    eid: eid,
    real_name: toCodepoint(real_name)
  }
  
  appHome.displayHome(id, team_id, data);
})


//Slack通知の外部出力(2021/10/21追加)
app.post('/notice', async(req, res) => {
  console.log("web api");
  res.send("android");

  const tim = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
  //console.log(tim);
  const ts = (tim.getFullYear() + `/` 
          + (tim.getMonth() +1) + `/` 
          + tim.getDate() + ` ` 
          + tim.getHours() + `:` 
          + tim.getMinutes() + `:` 
          + tim.getSeconds() + `.` 
          + tim.getMilliseconds());
  const noticeflag = req.body.noticeflag;
  const send = req.body.send;
  const receive = req.body.receive;
  
  /*
  const time = (ts.getFullYear() + `/` 
                + (ts.getMonth() +1) + `/` 
                + ts.getDate() + `/` 
                + ts.getHours() + `/` 
                + ts.getMinutes() + `/` 
                + ts.getSeconds() + `/` 
                + ts.getMilliseconds());
  console.log(time);
  */
  
  //送信通知
  if(noticeflag==3){
    const message = req.body.message;
    console.log("送信通知");
  
    const data = {
      time: ts,
      send: send,
      receive: receive,
      message: message
    }
    
    console.log(ts);
    console.log(send);
    console.log(receive);
    console.log(message);
  }
  //受信通知
  if(noticeflag==4){
    const bundleid=req.body.bunid;
    console.log("受信通知");
    const data = {
      time: ts,
      send: send,
      receive: receive,
      bundleid :bundleid
    }
    console.log(ts);
    console.log(send);
    console.log(receive);
    console.log(bundleid)
  }

  

  
})
//


/* Running Express server */
const server = app.listen(5000, () => {
  console.log('Express web server is running on port %d in %s mode', server.address().port, app.settings.env);
});


app.get('/', async(req, res) => {
  res.send('Hello, There is no web UI for this code sample. To view the source code, click "View Source"');
});


/* unidode encoder */
const toCodepoint = (str) => {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result = result + "\\u" + str.codePointAt(i)
  }
  return result;
}