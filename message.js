const axios = require('axios'); 
const qs = require('qs');

const apiUrl = 'https://slack.com/api';

/*
 *  Handling DM messages
 */


/* Calling the chat.postMessage method to send a message */

const send = async(text, channel) => { 

  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    text: `Hey, I am creating a note ${text}`
  };
  
  const result = await axios.post(`{$apiUrl}chat.postMessage`, qs.stringify(args));
  
  try {
    console.log(result.data);
    const ts = result.data.ts;
  } catch(e) {
    console.log(e);
  }
};


module.exports = { send };
