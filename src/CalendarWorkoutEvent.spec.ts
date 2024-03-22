////////////////////////////////////////////////////////////////////////////////
// CalendarWorkoutEvent.test.ts
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

import test from "node:test";
import assert from "node:assert";

import CalendarWorkoutEvent from './CalendarWorkoutEvent';

import ical from 'ical-generator';

function assertNonNull<T>(x: T | null | undefined): T {
    if (x === null || x === undefined) {
        throw new Error('non-null assertion failed');
    } else {
        return x;
    }  
}

////////////////////////////////////////////////////////////////////////////////
// Tests for CalendarWorkoutEvent
////////////////////////////////////////////////////////////////////////////////
test( "CalendarWorkoutEvent tests", async ( t ) => {
    let sampleData = JSON.stringify({
        name: "Walking",
        start: "2021-09-26 20:00:00 -0500",
        end: "2021-09-26 20:15:00 -0500",
        activeEnergy: {
            qty: 100
        },
        stepCadence: {
            qty: 30
        },
        distance: {
            qty: 1
        },
        speed: {
            qty: 4
        },
        avgHeartRate: {
            qty: 120
        },
        maxHeartRate: {
            qty: 140
        }
    });

    ////////////////////////////////////////////////////////////////////////////
    // createFromWorkoutData() tests
    ////////////////////////////////////////////////////////////////////////////
    await t.test( "createFromWorkoutData() tests", async ( t ) => {
        ////////////////////////////////////////////////////////////////////////
        // Sunny day
        ////////////////////////////////////////////////////////////////////////
        await t.test( "CalendarWorkoutEvent from valid data should not be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.notStrictEqual( cwe, null );
        });

        ////////////////////////////////////////////////////////////////////////
        // Rainy days
        ////////////////////////////////////////////////////////////////////////
        await t.test( "CalendarWorkoutEvent from data with invalid name should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            workoutData.name = "Flying";
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        // tests with data missing required fields, should return null
        await t.test( "CalendarWorkoutEvent from data with no name should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.name;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no start should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.start;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with invalid start format should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            workoutData.start = "animals";
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no end should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.end;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with invalid end format should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            workoutData.start = "19 Madeup Month";
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with invalid isIndoor should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            workoutData.isIndoor = 5;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no activeEnergy should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.activeEnergy;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no activeEnergy.qty should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.activeEnergy.qty;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no stepCadence should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.stepCadence;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no stepCadence.qty should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.stepCadence.qty;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no distance should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.distance;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no distance.qty should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.distance.qty;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no speed should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.speed;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no speed.qty should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.speed.qty;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no avgHeartRate should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.avgHeartRate;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no avgHeartRate.qty should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.avgHeartRate.qty;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no maxHeartRate should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.maxHeartRate;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });

        await t.test( "CalendarWorkoutEvent from data with no maxHeartRate.qty should be null", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            delete workoutData.maxHeartRate.qty;
    
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
            assert.strictEqual( cwe, null );
        });
    });

    ////////////////////////////////////////////////////////////////////////////
    // Tests for getName() and getBody() and underlying private functions
    ////////////////////////////////////////////////////////////////////////////
    await t.test( "getName() and getBody()", async ( t ) => {
        
        ////////////////////////////////////////////////////////////////////////////
        // Legacy data tests - cover data that may be in the database from previous 
        // versions of Auto Health Export or iOS
        ////////////////////////////////////////////////////////////////////////////
        await t.test( "Legacy data tests", async ( t ) => {
            await t.test( "Walking with isIndoor=true should be named \"Cardio - treadmill\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Walking";
                workoutData.isIndoor = true;
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - treadmill" );
            });
    
            await t.test( "Walking with isIndoor=false should be named \"Cardio - walk\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Walking";
                workoutData.isIndoor = false;
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - walk" );
            });
    
            await t.test( "Running with isIndoor=true should be named \"Cardio - treadmill\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Running";
                workoutData.isIndoor = true;
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - treadmill" );
            });
    
            await t.test( "Running with isIndoor=false should be named \"Cardio - run\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Running";
                workoutData.isIndoor = false;
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - run" );
            });
        });

        ////////////////////////////////////////////////////////////////////////////
        // Contemporary data tests
        ////////////////////////////////////////////////////////////////////////////
        await t.test( "Contemporary data tests", async ( t ) => {
            await t.test( "Indoor Walk should be named \"Cardio - treadmill\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Indoor Walk";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - treadmill" );
            });
    
            await t.test( "Outdoor Walk should be named \"Cardio - walk\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Outdoor Walk";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - walk" );
            });
    
            await t.test( "Indoor Run should be named \"Cardio - treadmill\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Indoor Run";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - treadmill" );
            });
    
            await t.test( "Outdoor Run should be named \"Cardio - run\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Outdoor Run";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - run" );
            });
    
            await t.test( "Elliptical should be named \"Cardio - elliptical\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Elliptical";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Cardio - elliptical" );
            });
    
            await t.test( "Elliptical body should contain \"Cadence\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Elliptical";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.match( assertNonNull( cwe ).getBody(), /Cadence/ );
            });
    
            await t.test( "Non-Ellptical body should contain \"Pace\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Outdoor Run";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.match( assertNonNull( cwe ).getBody(), /Pace/ );
            });
    
            await t.test( "Non-Ellptical body should contain \"miles\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Outdoor Run";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.match( assertNonNull( cwe ).getBody(), /miles/ );
            });
    
            await t.test( "Hiking should be named \"Hiking\"", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Hiking";
        
                let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );
                assert.strictEqual( assertNonNull( cwe ).getName(), "Hiking" );
            });
        });
    });    

    ////////////////////////////////////////////////////////////////////////////
    // addToCalendar() tests
    ////////////////////////////////////////////////////////////////////////////
    t.test( "addToCalendar()", ( t ) => {
        t.test( "CalendarWorkoutEvent should add one event to the given ical", ( t ) => {
            let workoutData = JSON.parse( sampleData );
            let cwe = CalendarWorkoutEvent.createFromWorkoutData( workoutData );

            let calendar = ical();
            assertNonNull( cwe ).addToCalendar( calendar );
            assert.strictEqual( calendar.length(), 1 );
        });
    });
});
