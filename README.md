# Slack App Demo 
Leveraging the App Home feature

_Last updated: October, 2019_

---

## Slack App Config

Go to https://api.slack.com/apps to create a new app. 

- App Home
  - Join beta (This will enable both features below!)
  - Enable Home Tab
  - Enable Message (if your app takes DM from users)
  
- Enable Bot user

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
  