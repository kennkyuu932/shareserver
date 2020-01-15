# Slack App Demo 
Leveraging the App Home feature

- The sample code with no Bolt (Node w/ Express): this repo
- The sample code with Slack **Bolt**: https://glitch.com/edit/#!/apphome-bolt-demo-note

_Updated: January, 2020_<br>
_Published October, 2019_

---

## Slack App Config

Go to https://api.slack.com/apps to create a new app. 

- App Home
  - Enable Home Tab
  - Enable Message (if your app takes DM from users)
  
- Enable Bot user

- Add appropriate bot scope(s)
  - `chat.write`

- Enable Events
  - Request URL should be https://*your-project*.glitch.me/slack/events
  - Subscribe to workspace events
  - Add `app_home_opened`
  - Save
  
- Go to **Interactivity & Actions** and enable
  - Reuest URL should be: https://*your-project*.glitch.me/slack/actions
  - Save
  
  
On Slack client:
  - Click the app name to go to the home tab
  - CLick the "Add a stickie" button and see what happens!
  