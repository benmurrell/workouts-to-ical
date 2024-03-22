# workouts-to-ical
This project collects workout data posted by the [Health Auto Export](https://apps.apple.com/us/app/health-auto-export-json-csv/id1115567069?platform=iphone) app, then serves up a subscribable calendar with the workouts. This allows the user to see their workouts on calendar clients like the iOS Calendar app or Google Calendar, which is a great way to visualize big picture progress on workouts.

## Benefit and Motivation
Instead of seeing workouts in a list, we can see them in a calendar format:

![ScreenShot](/img/benefit-screenshot.png)

This style of visualization helps me understand at a glance how I've been sticking to a workout program. Seeing consistent effort helps build and reinforce good habits!

## Install and Run
### Install:
    git clone https://github.com/benmurrell/workouts-to-ical
    cd workouts-to-ical
    npm install

### Configure:
* Make changes in Config.ts, parameters explained there. 
    * **Be sure to change the secret values!** If you use the defaults, your data could be exposed.

### Run:
    npm run start

### Set up as a service:
* upstart - Create /etc/init/workouts-to-ical.conf
    * See config-templates/workouts-to-ical.conf for sample upstart configuration

### Interact with service:
    service workouts-to-ical start
    service workouts-to-ical status
    service workouts-to-ical stop

### Set up nginx reverse proxy:
* Edit relevant nginx site config file (/etc/nginx/sites-available/)
    * See config-templates/nginx-sites-available.conf for sample changes to proxy requests to this app

## Use
### Set up automatic exports
Create a REST API automation in the Health Auto Export app. Set the URL to {externalUrl}/workoutData. Add a header key/value pair that matches the {headerSecretKey} and {headerSecretVal} from src/main.ts.
* The URL should look like `https://example.com/workouts-to-ical/workoutData`

### Subscribe to the calendar
Use your calendar client of choice to subscribe to the ical calendar hosted at {externalUrl}/workoutCalendar?{querystringSecretKey}={querystringSecretVal}.
* The URL should look like `https://example.com/workouts-to-ical/workoutCalendar?secret=some-secret-value`


### Notes on calendar client caching
Different calendar clients follow different caching policies - the Google Calendar client only pulls from the subscribed calendar about once per 24 hours. The iOS calendar client pulls more frequently. This means that there will be some delay between when your device uploads workout data to the service and when it is shown on the calendar.

### Health Auto Export version
This was built and tested against version 8.1.2 of [Health Auto Export](https://apps.apple.com/us/app/health-auto-export-json-csv/id1115567069?platform=iphone).
