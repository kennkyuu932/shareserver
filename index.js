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
  
  //console.log(`${team_id}`);
  //var debug;
  //debug= `${apiUrl}/users.list`.ok;
  //console.log();
  var real_name;
  await axios.get(`${apiUrl}/users.info`, {
    params: {
      token: process.env.SLACK_BOT_TOKEN,
      user: id
    }
  }).then(res =>{
    console.log(res.data);
    real_name = res.data.user.real_name;
  });
  
  const data = {
    id: id,
    eid: eid,
    real_name: toCodepoint(real_name)
  }
  
  appHome.displayHome(id, team_id, data);
})


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