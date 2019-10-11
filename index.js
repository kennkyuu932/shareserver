/* 
 * Slack API Demo 
 * This example shows how to ustilize the App Home feature
 * October 8, 2019
 *
 * This example is written in Vanilla-ish JS (No SDK or Framework)
 * To see how this can be written in Bolt, see http://...........
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); 
const qs = require('qs');

const signature = require('./verifySignature');
const appHome = require('./appHome');
const message = require('./message');

const app = express();

const apiUrl = 'https://dev.slack.com/api';

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
      // verify Events API endpoint by returning challenge if present
      res.send({ challenge: req.body.challenge });
      break;
    }
      
    case 'event_callback': {
      // Verify the signing secret
      if (!signature.isVerified(req)) {
        res.sendStatus(404);
        return;
      } 
      
      // Request is verified
      else {
        
        const {type, user, channel, tab, text} = req.body.event;

        // Triggered when the App Home is opened by a user
        if(type === 'app_home_opened') {
          // Display App Home
          appHome.displayHome(user);
        }
        
        // Triggered when the bot gets a DM
        else if(type === 'message') {
          console.log(req.body.event);
          
          // DM back to the user 
          message.send(channel);
          
          // ...then create a note from the text with a default color
          const timestamp = new Date();
          const data = {
            timestamp: timestamp,
            note: text,
            color: 'yellow'
          }
          //appHome.displayHome(user, data);
        }
      }
  
      break;
    }
    default: { res.sendStatus(404); }
  }
});



/*
 * Endpoint to receive an button action from App Home UI "Add a Stickie"
 */

app.post('/slack/actions', async(req, res) => {
  console.log(JSON.parse(req.body.payload));
  
  const { token, trigger_id, user, actions, type } = JSON.parse(req.body.payload);
 
  if(actions && actions[0].action_id.match(/add_/)) {
 
    appHome.openModal(trigger_id);
  } 
  
  else if(type === 'view_submission') {
    res.send('');
    
    const timestamp = new Date();
    const { user, view } = JSON.parse(req.body.payload);

    const data = {
      timestamp: timestamp,
      note: view.state.values.note01.content.value,
      color: view.state.values.note02.color.selected_option.value
    }
    
    appHome.displayHome(user.id, data);
  }
});



/* Running Express server */
const server = app.listen(5000, () => {
  console.log('Express web server is running on port %d in %s mode', server.address().port, app.settings.env);
});