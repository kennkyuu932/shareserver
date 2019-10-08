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






/* Calling the chat.postMessage method to send a message */

const send = async(blocks, channel) => { 

  const args = {
    token: process.env.SLACK_ACCESS_TOKEN,
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