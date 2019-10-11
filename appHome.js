const axios = require('axios'); 
const qs = require('qs');
const apiUrl = 'https://dev.slack.com/api';

/*
 * Home View - Use Block Kit Builder to compose: https://api.slack.com/tools/block-kit-builder
 */

const updateView = () => {
  
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
      const color = (o.color) ? (o.color) : 'yellow';
            
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



/* Display App Home */

const displayHome = async(user, data) => {
  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    user_id: user,
    view: updateView(data)
  };

  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));

  if (!result.ok) {
    console.error('Views.publish API call failed!', result.data);
  }
};



module.exports = { displayHome };