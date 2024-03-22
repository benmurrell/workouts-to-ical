////////////////////////////////////////////////////////////////////////////////
// CalendarWorkoutEvent.ts
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

import dayjs from 'dayjs';
import dayjsduration from 'dayjs/plugin/duration';
import dayjsutc from 'dayjs/plugin/utc';
dayjs.extend( dayjsduration );
dayjs.extend( dayjsutc );

import { ICalCalendar } from 'ical-generator';

import WorkoutData, { isWorkoutData } from './WorkoutData';

////////////////////////////////////////////////////////////////////////////////
// CalendarWorkoutEvent - represents a workout to be shown on a calendar
////////////////////////////////////////////////////////////////////////////////
export default class CalendarWorkoutEvent {

    // Underlying workout data
    private start: string;
    private name: string;
    private body: string;

    // Workout names that we want to push to a calendar
    private static allowedWorkoutNames = {
        "Walking": true,
        "Running": true,
        "Elliptical": true,
        "Hiking": true,
        "Indoor Walk": true,
        "Outdoor Walk": true,
        "Outdoor Run": true,
        "Indoor Run": true
    }

    ////////////////////////////////////////////////////////////////////////////
    // constructor - use CalendarWorkoutEvent.createFromWorkoutData
    ////////////////////////////////////////////////////////////////////////////
    private constructor(
        aWorkout: any
    ) {
        this.name = CalendarWorkoutEvent.calcName( aWorkout );
        this.body = CalendarWorkoutEvent.calcBody( aWorkout );
        this.start = aWorkout.start;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Create a CalendarWorkoutEvent from the given aData. Returns null if
    // we cannot create a CalendarWorkoutEvent from the given aData.
    ////////////////////////////////////////////////////////////////////////////
    public static createFromWorkoutData( aData: any ): CalendarWorkoutEvent | null  {
        
        // Check that the given data matches the WorkoutData interface & has a valid name
        if( isWorkoutData( aData ) ) {
            if( !( aData.name in this.allowedWorkoutNames ) ) {
                console.log( "CalendarWorkoutEvent::createFromWorkoutData() - invalid name for calendar bound event: \"" + aData.name + "\"" );
                return null;
            }
        } else {
            console.warn( "CalendarWorkoutEvent::createFromWorkoutData() - schema validation failed:" );
            console.warn( isWorkoutData.errors );
            return null;
        }

        return new CalendarWorkoutEvent( aData );
    }

    ////////////////////////////////////////////////////////////////////////////
    // Get the calendar event name for this CalendarWorkoutEvent
    ////////////////////////////////////////////////////////////////////////////
    public getName(): string {
        return this.name;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Get the calendar event body for this CalendarWorkoutEvent
    ////////////////////////////////////////////////////////////////////////////
    public getBody(): string {
        return this.body;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Add this CalendarWorkoutEvent to the given aCalendar
    ////////////////////////////////////////////////////////////////////////////
    public addToCalendar( aCalendar: ICalCalendar ) {
        let event = aCalendar.createEvent({
            start: dayjs( this.start ).startOf( 'day' ), // Calendar is UTC, this keeps events at the end of the day on the intended day
            //end: dayjs( this.workout.end ).startOf( 'day' ),   // Don't include end for allDay events
            allDay: true,
            summary: this.getName(),
            description: this.getBody()
        });
    }

    ////////////////////////////////////////////////////////////////////////////
    // Calculate the calendar event name for this CalendarWorkoutEvent
    ////////////////////////////////////////////////////////////////////////////
    private static calcName( aWorkout: WorkoutData ): string {
        let ret = "";

        let isIndoor = aWorkout.isIndoor;

        switch( aWorkout.name ) {
            // For legacy data collected from earlier version of Auto Export or iOS
            case 'Walking':
                if( isIndoor ) {
                    ret = "Cardio - treadmill";
                } else {
                    ret = "Cardio - walk";
                }
                break;

            // For legacy data collected from earlier version of Auto Export or iOS
            case 'Running':
                if( isIndoor ) {
                    ret = "Cardio - treadmill";
                } else {
                    ret = "Cardio - run";
                }
                break;

            case 'Outdoor Walk':
                ret = "Cardio - walk";
                break;

            case 'Indoor Walk':
                ret = "Cardio - treadmill";
                break;
                
            case 'Outdoor Run':
                ret = "Cardio - run";
                break;
            
            case 'Indoor Run':
                ret = "Cardio - treadmill";
                break;

            case 'Elliptical':
                ret = "Cardio - elliptical";
                break;

            case 'Hiking':
                ret = "Hiking";
                break;

            default:
                console.log( "CalendarWorkoutEvent::getName() - '" + aWorkout.name + "' is unknown workout type" );
                ret = "DEFAULT";
                break;
        }

        return ret;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Calculate the calendar event body for this CalendarWorkoutEvent
    ////////////////////////////////////////////////////////////////////////////
    private static calcBody( aWorkout: WorkoutData ): string {
        let ret = "";

        // Duration as [hh:]mm:ss
        ret += getDurationString( dayjs.duration( dayjs( aWorkout.end ).diff( aWorkout.start ) ) ) + "\n";
        ret += aWorkout.activeEnergy.qty.toFixed(0) + " calories" + "\n";

        if( aWorkout.name === "Elliptical" ) {
            // For elliptical, show cadence instead
            ret += "\n";
            ret += "Cadence: " + aWorkout.stepCadence.qty.toFixed(0) + " spm" + "\n"
        } else {
            // For others, show distance + pace
            ret += aWorkout.distance.qty.toFixed(2) + " miles" + "\n";
            ret += "\n";

            // Pace as [hh:]mm:ss
            ret += "Pace: " + getDurationString( dayjs.duration ( 1 / aWorkout.speed.qty * 60 * 60 * 1000 ) ) + "\n";

            // ret += "Speed: " + aWorkout.speed.qty.toFixed(2) + " mph" + "\n";
            // ret += "Cadence: " + ( aWorkout.stepCadence.qty * 60 ).toFixed(0) + " spm" + "\n"
        }

        // Show heart rate for all
        ret += "HR: " + aWorkout.avgHeartRate.qty.toFixed(0) + " - " + aWorkout.maxHeartRate.qty.toFixed(0) + " bpm" + "\n";

        // TODO: link back to a page hosted by this app that has full workout data available
        // ret += "<a href='https://hostname/workouts/ID'>Full workout data</a>

        return ret;
    }
}

////////////////////////////////////////////////////////////////////////////
// Get the string representation of aDuration as [hh:]mm:ss
////////////////////////////////////////////////////////////////////////////
function getDurationString( aDuration: dayjsduration.Duration ): string {
    let durationStr = "";
    if( aDuration.hours() >= 1 ) {
        durationStr = aDuration.format( "HH:mm:ss" );
    } else {
        durationStr = aDuration.format( "mm:ss" );
    }
    return durationStr;
}
