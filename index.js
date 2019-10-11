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
          // Display App Home
          appHome.displayHome(user);
        }
      }
  
      break;
    }
    default: { res.sendStatus(404); }
  }
});




/* Open a modal */

const openModal = async(trigger_id) => {
  
  const modal = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Create a stickie note'
    },
    submit: {
      type: 'plain_text',
      text: 'Create'
    },
    blocks: [
      // Text input
      {
        "type": "input",
        "block_id": "note01",
        "label": {
          "type": "plain_text",
          "text": "Notes"
        },
        "element": {
          "action_id": "content",
          "type": "plain_text_input",
          "placeholder": {
            "type": "plain_text",
            "text": "Take a note..."
          },
          "multiline": true
        }
      },
      
      // Drop-down menu      
      {
        "type": "input",
        "block_id": "note02",
        "label": {
          "type": "plain_text",
          "text": "Color",
        },
        "element": {
          "type": "static_select",
          "action_id": "color",
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "yellow"
              },
              "value": "yellow"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "blue"
              },
              "value": "blue"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "green"
              },
              "value": "green"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "pink"
              },
              "value": "pink"
            }
          ]
        }
      
      }
    ]
  };
  
  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    trigger_id: trigger_id,
    view: JSON.stringify(modal)
  };
  
  const result = await axios.post(`${apiUrl}/views.open`, qs.stringify(args));
  
  if (!result.ok) {
    console.error('views.open API call failed!', result.data);
  }
  
};


/* Botton action from App Home UI "Add Note" */

app.post('/slack/actions', async(req, res) => {
  console.log(JSON.parse(req.body.payload));
  
  const { token, trigger_id, user, actions, type } = JSON.parse(req.body.payload);
 
  if(actions && actions[0].action_id.match(/add_/)) {
    // Open a modal dialog
    openModal(trigger_id);
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