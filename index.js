/* 
 * Slack API Demo
 * This example shows how to ustilize the App Home feature
 * October 8, 2019
 */

const express = require('express');
const bodyParser = require('body-parser');
const signature = require('./verifySignature');
const axios = require('axios'); 
const qs = require('qs');

const apiUrl = 'https://dev.slack.com/api';

const app = express();

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
 * Home View
 */

const getHomeView = () => {
  let view = {
    type: 'home',
    title: {
      type: 'plain_text',
      text: 'Keep notes!'
    },
    blocks: [ // Use Block Kit Builder to compose: https://api.slack.com/tools/block-kit-builder
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Hi, my source code is on <https://glitch.com/edit/#!/apphome-demo-keep|glitch>!"
        }
      }
    ]
  }
  
  return JSON.stringify(view);
};


/*
 * Endpoint to receive events from Slack's Events API.
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
        const {type, user, channel, tab} = req.body.event;

        // Trigger when the App Home is opened by a user
        if(type === 'app_home_opened') {

          const args = {
            token: process.env.SLACK_BOT_TOKEN,
            user_id: user,
            view: getHomeView()
          };

          const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));

          if (!result.ok) {
            console.error('Views.publish API call failed!', result.data);
          }
        }
      }
  
      break;
    }
    default: { res.sendStatus(404); }
  }
});



/* Calling the chat.postMessage method to send a message */

const send = async(blocks, channel) => { 

  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    blocks: blocks
  };
  
  const result = await axios.post('https://slack.com/api/chat.postMessage', qs.stringify(args));
  
  try {
    console.log(result.data);
    const ts = result.data.ts;
  } catch(e) {
    console.log(e);
  }
};




/* Running Express server */
const server = app.listen(5000, () => {
  console.log('Express web server is running on port %d in %s mode', server.address().port, app.settings.env);
});