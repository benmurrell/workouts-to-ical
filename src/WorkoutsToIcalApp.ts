////////////////////////////////////////////////////////////////////////////////
// WorkoutsToIcalApp.ts
//
// Copyright (c) 2024 Ben Murrell
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
////////////////////////////////////////////////////////////////////////////////

import fs from "fs";
import http from "http";
import express from "express";
import bodyParser from "body-parser";

import { ICalCalendar } from 'ical-generator';

import DataFile from './DataFile';
import CalendarWorkoutEvent from "./CalendarWorkoutEvent";

////////////////////////////////////////////////////////////////////////////////
// IWorkoutsToIcalAppConfig
////////////////////////////////////////////////////////////////////////////////
export interface IWorkoutsToIcalAppConfig {
    // Header that is checked before accepting POSTed workout data
    headerSecretKey: string,
    headerSecretVal: string,

    // Querystring param that is checked before serving calendar
    querystringSecretKey: string,
    querystringSecretVal: string,

    // Port for this app server
    port: number,

    // Host to bind for this app server
    host: string,

    // External URL (this should be the full URL of the reverse proxy mount point including port if non-standard)
    externalUrl: URL
}

////////////////////////////////////////////////////////////////////////////////
// WorkoutsToIcalApp
////////////////////////////////////////////////////////////////////////////////
export default class WorkoutsToIcalApp {
    private dataFile: DataFile;
    private calendar: ICalCalendar;
    private config: IWorkoutsToIcalAppConfig;
    private instance?: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;

    ////////////////////////////////////////////////////////////////////////////
    // Constructor 
    ////////////////////////////////////////////////////////////////////////////
    constructor( aDataFile: DataFile, aCalendar: ICalCalendar, aConfig: IWorkoutsToIcalAppConfig ) {
        this.dataFile = aDataFile;
        this.calendar = aCalendar;
        this.config = aConfig;
        this.instance = undefined;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Start the app
    ////////////////////////////////////////////////////////////////////////////
    async start() {
        console.log( new Date() + " - Creating calendar events... " );
        let calendarWorkoutEvents = await this.dataFile.getCalendarWorkoutEvents();
        calendarWorkoutEvents.forEach( aEvent => aEvent.addToCalendar( this.calendar ) );
        console.log( "Created " + calendarWorkoutEvents.length + " calendar events from DB" );
        console.log( "" );

        let app = express();
        app.use( bodyParser.json({ limit: '200mb' }) );
        app.set( 'port', this.config.port );
        app.set( 'trust proxy', 'loopback' );

        ////////////////////////////////////////////////////////////////////////
        // Routes
        ////////////////////////////////////////////////////////////////////////
        // Set up route for Health Auto Export app to POST to
        app.post( "/workoutData", function( aReq, aRes ) {
            console.log( new Date() + " - " + aReq.ip + " - POST /workoutData" );
            this.onPostWorkoutData( aReq, aRes, this.dataFile, this.calendar );
        });

        // Set up route for calendar requests
        app.get( "/workoutCalendar", function( aReq, aRes ) {
            console.log( new Date() + " - " + aReq.ip + " - GET /workoutCalendar, " + aReq.get( "user-agent" ) );
            this.onGetWorkoutCalendar( aReq, aRes, this.calendar );
        });
        ////////////////////////////////////////////////////////////////////////
        // /Routes
        ////////////////////////////////////////////////////////////////////////

        // Error handler - log unhandled exceptions
        app.use( function( aError, aReq: express.Request, aRes, aNext ){
            console.error( new Date() + " - " + aError );
            console.log( new Date() + " - request body follows (" + aReq.headers["content-length"] + " bytes): " );
            console.log( aReq.body );
            console.log( "" );
            aNext( aError );
        });

        // Start the server
        this.instance = http.createServer( app ).listen( app.get( 'port' ), this.config.host, () => {
            console.log( new Date() + ' - Listening on port ' + app.get( 'port' ) );
            console.log( new Date() + ' - internal calendar at ' + 'http://' + this.config.host + ':' + app.get( 'port' ) + '/workoutCalendar?' + this.config.querystringSecretKey + '=' + this.config.querystringSecretVal );
            console.log( new Date() + ' - external calendar at ' + new URL( 'workoutCalendar?' + this.config.querystringSecretKey + '=' + this.config.querystringSecretVal, this.config.externalUrl.href ) );
        });
    }

    ////////////////////////////////////////////////////////////////////////////
    // Stop the app
    ////////////////////////////////////////////////////////////////////////////
    async stop() { 
        await this.instance?.close();
    }

    ////////////////////////////////////////////////////////////////////////////
    // Handle GET for /workoutCalendar by serving the iCal calendar
    ////////////////////////////////////////////////////////////////////////////
    onGetWorkoutCalendar( aReq: express.Request, aRes: express.Response, aCalendar: ICalCalendar ) {
        // Validate secret in querystring to prevent unwanted access
        if( aReq.query[this.config.querystringSecretKey] === undefined || aReq.query[this.config.querystringSecretKey] !== this.config.querystringSecretVal ) {
            console.log( "onGetWorkoutCalendar() - querystring not valid" );
            return aRes.status( 403 ).end();
        }

        return aCalendar.serve( aRes );
    }

    ////////////////////////////////////////////////////////////////////////////
    // Handle POST to /workoutData from the Health Auto Export iOS app
    ////////////////////////////////////////////////////////////////////////////
    async onPostWorkoutData( aReq: express.Request, aRes: express.Response, aDataFile: DataFile, aCalendar: ICalCalendar ) {
        if( !this.validatePostedWorkoutDataHeaders( aReq ) ) {
            console.log( "onPostWorkoutData() - posted headers not valid" );
            return aRes.status( 403 ).end();
        }
        fs.writeFileSync( 'latest-posted-body.json', JSON.stringify( aReq.body, null, 4 ) );

        if( !this.validatePostedWorkoutDataBody( aReq.body ) ) {
            console.log( "onPostWorkoutData() - posted data not valid" );
            return aRes.status( 400 ).end();
        }
        console.log( new Date() + " - Got " + aReq.body.data.workouts.length + " workouts in POST" );
        
        // merge received workouts into existing db of workouts
        await aDataFile.mergeData( aReq.body.data, aWorkout => {
            // add events to calendar for newly seen workouts
            this.onNewWorkout( aWorkout, aCalendar );
        });

        console.log(  new Date() + " - Finished handling request" );
        console.log( "" );
        return aRes.status( 200 ).end();
    }

    ////////////////////////////////////////////////////////////////////////////
    // Check that the posted headers are valid to prevent unwanted posts
    ////////////////////////////////////////////////////////////////////////////
    validatePostedWorkoutDataHeaders( aReq: express.Request ) {
        if( aReq.headers[this.config.headerSecretKey] === undefined || aReq.headers[this.config.headerSecretKey] !== this.config.headerSecretVal ) {
            return false;
        }

        return true;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Check that the posted fitness data has the expected structure, return false
    // if it does not.
    //
    // design decision: individual workout data is not validated against the 
    // WorkoutData interface because we trust the Auto Export app to export 
    // correct data. If validation fails at the individual workout level, we want 
    // the data in the db so we can update the schema to handle the previously 
    // considered "invalid" data.
    ////////////////////////////////////////////////////////////////////////////
    validatePostedWorkoutDataBody( aBody: any ) {
        if( !aBody || !aBody.data || aBody.data.workouts === undefined || !Array.isArray( aBody.data.workouts ) ) {
            console.log( "validatePostedWorkoutDataBody() - invalid posted body:" );
            console.log( JSON.stringify( aBody, null, 4 ) );
            return false;
        }

        return true;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Handle a newly seen workout
    ////////////////////////////////////////////////////////////////////////////
    onNewWorkout( aWorkout: any, aCalendar: ICalCalendar ) {
        console.log( "Got a new workout!" );

        let calendarWorkoutEvent = CalendarWorkoutEvent.createFromWorkoutData( aWorkout );
        if( calendarWorkoutEvent ) {
            console.log( "Created CalendarWorkoutEvent: " + calendarWorkoutEvent.getName() );
            console.log( calendarWorkoutEvent.getBody() );

            // Add the new event to the calendar
            calendarWorkoutEvent.addToCalendar( aCalendar );
        } else {
            console.log( "WARNING - Could not create matching CalendarWorkoutEvent, will not push to calendar" );
            console.log( JSON.stringify( aWorkout, null, 4 ) );
        }

        console.log( "" );
    }
}
