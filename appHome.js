const axios = require('axios'); 
const qs = require('qs');

const JsonDB = require('node-json-db');
const db = new JsonDB('notes', true, true);

const rison = require('rison');

const apiUrl = 'https://slack.com/api';

const updateView = async(user, team_id) => {
  
  let rawData;
  try {
    rawData = db.getData(`/`);
  } catch(error) {
    console.error(error); 
  };
  
  const i = rawData.dtn.findIndex(d => d.team_id === team_id);
  const teamData = rawData.dtn[i];

  let isRegistered;
  if (rawData.dtn[i].users.findIndex(d => d.id === user) === -1) {
    isRegistered = false;
  } else {
    isRegistered = true;
  }
  
  const query = rison.encode_object(teamData)
  let uri = `dtn://sync.eid?${query}`

  const registeQuery = rison.encode_object({id:user, team_id:team_id});
  const regiserUrl = `dtn://register.eid?${registeQuery}`
  
  let blocks = [];

  let z = (isRegistered) ? " (登録済み)" : "";
  let x = (isRegistered) ? "EID更新" : "登録";
  let nextBlock = [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*EIDの登録${z}*`
      },
      accessory: {
        type: "button",
        action_id: "add_note", 
        url: regiserUrl,
        text: {
          type: "plain_text",
          text: x,
          emoji: true
        }
      }
    },
    {
      type: "divider"
    }
  ]
  blocks = blocks.concat(nextBlock);

  if (isRegistered) {
    let nextBlocks = [
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*EIDリストの同期*"
        },
        accessory: {
          type: "button",
          action_id: "add_note", 
          url: uri,
          text: {
            type: "plain_text",
            text: "同期",
            emoji: true
          }
        }
      },
      {
        type: "divider"
      }
    ];
    blocks = blocks.concat(nextBlocks);

    const newData = teamData.users;
    if(newData) {
      let textBlocks = [
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*登録済みユーザリスト*"
          }
        }
      ];
      blocks = blocks.concat(textBlocks);

      let noteBlocks = [];
      for (const o of newData) {
        
        //const id = o.id;
        //const eid = o.eid;
        const real_name = fromCodepoint(o.real_name);
              
        noteBlocks = [
          // {
          //   type: "section",
          //   text: {
          //     type: "mrkdwn",
          //     text: "id: " + id
          //   }
          // },
          // {
          //   type: "section",
          //   text: {
          //     type: "mrkdwn",
          //     text: "eid: " + eid
          //   }
          // },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "- " + real_name//"real_name: " + real_name
            }
          }
        ];
        blocks = blocks.concat(noteBlocks);
      }
      blocks = blocks.concat({type: "divider"});
    }
  }

  // The final view -
  
  let view = {
    type: 'home',
    title: {
      type: 'plain_text',
      text: 'text!'
    },
    blocks: blocks
  }
  
  return JSON.stringify(view);
};



/* Display App Home */

const displayHome = async(user, team_id, data) => {
  
  let rawData;

  try {
    if (db.getData(`/`).dtn === undefined) {
      db.push(`/`, {dtn: []});
      db.save();
      db.reload();
    }
  } catch(error) {
    console.error(error);
  };

  try {
    if (db.getData(`/`).dtn.findIndex(d => d.team_id === team_id) === -1) {
      db.push(`/dtn[]/`, {team_id: team_id, users: []});
      db.save();
      db.reload();
    }
  } catch(error) {
    console.error(error);
  };

  try {
    rawData = db.getData(`/`);
  } catch(error) {
    console.error(error);
  };
  const i = rawData.dtn.findIndex(d => d.team_id === team_id);
  
  if(data) {
    const i = rawData.dtn.findIndex(d => d.team_id === team_id);
    const j = rawData.dtn[i].users.findIndex(d => d.id === data.id);

    if (!(j === -1)) {
      db.delete(`/dtn[${i}]/users[${j}]`);
    }
    db.push(`/dtn[${i}]/users[]/`, data, true);
    db.save();
    db.reload();
  }

  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    user_id: user,
    view: await updateView(user, team_id)
  };

  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));

  try {
    if(result.data.error) {
      console.log(result.data.error);
    }
  } catch(e) {
    console.log(e);
  }
};

/* unidode decoder */
const fromCodepoint = (str) => {
  var result = "";
  var split = str.split("\\u");
  for (var i = 1; i < split.length; i++) {
    result = result + String.fromCodePoint(Number(split[i]));
  }
  return result;
}

module.exports = { displayHome };