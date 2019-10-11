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
const JsonDB = require('node-json-db');

const signature = require('./verifySignature');
const message = require('./message');

const app = express();
const db = new JsonDB('notes', true, false);

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
 * Home View - Use Block Kit Builder to compose: https://api.slack.com/tools/block-kit-builder
 */

const updateHomeView = () => {
  
  // Intro message - 
  
  let blocks = [ 
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Welcome! \nThis is a home for Stickers app. You can add small notes here by clicking the button, or DM-ing me."
      },
      accessory: {
        type: "button",
        action_id: "add_note", 
        text: {
          type: "plain_text",
          text: "Add a Stickie",
          emoji: true
        }
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ":wave: Hey, my source code is on <https://glitch.com/edit/#!/apphome-demo-keep|glitch>!"
        }
      ]
    },
    {
      type: "divider"
    }
  ];
  
  
  // Append new data blocks after the intro - 
  
  const rawData = db.getData('/storage/data');
  
  let data = rawData.reverse(); // Display the newest note first
  
  
  if(data) {
    let noteBlocks = [];
    
    for (const o of data) {
      
      noteBlocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: o.note
          },
          accessory: {
            type: "image",
            image_url: `https://cdn.glitch.com/0d5619da-dfb3-451b-9255-5560cd0da50b%2Fstickie_${color}.png`,
            alt_text: "stickie note"
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": o.timestamp
            }
          ]
        },
        {
          type: "divider"
        }
      ];
      blocks = blocks.concat(noteBlocks);
    }
    
  }

  // The final view -
  
  let view = {
    type: 'home',
    title: {
      type: 'plain_text',
      text: 'Keep notes!'
    },
    blocks: blocks
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
          // Display App Home
          displayHome(user);
        }
      }
  
      break;
    }
    default: { res.sendStatus(404); }
  }
});

/* Display App Home */

const displayHome = async(user, data) => {
  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    user_id: user,
    view: updateHomeView(data)
  };

  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));

  if (!result.ok) {
    console.error('Views.publish API call failed!', result.data);
  }
};


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
        "element": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a color",
          }
        },
        "label": {
          "type": "plain_text",
          "text": "Label",
          "emoji": true
        }
      }
      // {
      //   "type": "input",
      //   "block_id": "note02",
      //   "elements": [
      //     {
      //       "type": "static_select",
      //       "action_id": "color",
      //       "placeholder": {
      //         "type": "plain_text",
      //         "text": "Select a color"
      //       },
      //       "options": [
      //         {
      //           "text": {
      //             "type": "plain_text",
      //             "text": "yellow"
      //           },
      //           "value": "yellow"
      //         },
      //         {
      //           "text": {
      //             "type": "plain_text",
      //             "text": "blue"
      //           },
      //           "value": "blue"
      //         },
      //         {
      //           "text": {
      //             "type": "plain_text",
      //             "text": "green"
      //           },
      //           "value": "green"
      //         },
      //         {
      //           "text": {
      //             "type": "plain_text",
      //             "text": "pink"
      //           },
      //           "value": "pink"
      //         }
      //       ],
      //       "initial_options": [
      //         {
      //           "text": {
      //             "type": "plain_text",
      //             "text": "yellow"
      //           },
      //           "value": "yellow"
      //         }
      //       ]
      //     }
      //   ]
      // }
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
      color: view.state.values.note02.color.value
    }
    
    // Store in a local DB
    db.push('/storage/data[]', data);
    
    await displayHome(user.id, data);
  }
});





/* Running Express server */
const server = app.listen(5000, () => {
  console.log('Express web server is running on port %d in %s mode', server.address().port, app.settings.env);
});