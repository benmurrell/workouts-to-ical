////////////////////////////////////////////////////////////////////////////////
// WorkoutsToIcalApp.test.ts
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

import { mock, test } from "node:test";
import assert from "node:assert";
import * as fs from "fs";

import express from "express";
import ical, { ICalCalendar } from 'ical-generator';

import Config from "../Config";
import DataFile from "./DataFile";
import WorkoutsToIcalApp from "./WorkoutsToIcalApp";

////////////////////////////////////////////////////////////////////////////////
// Tests for WorkoutsToIcalApp
////////////////////////////////////////////////////////////////////////////////
test( "WorkoutsToIcalApp tests", async ( t ) => {
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

    // Setup
    // Check for db, delete if exist
    let newDbName = "workoutstoicalapp-new-test-db.db";
    if( fs.existsSync( newDbName ) ) {
        console.warn( "Removing " + newDbName + " for test, should not be present." );
        fs.unlinkSync( newDbName );
    }

    let dataFile: DataFile = await DataFile.open( newDbName );

    let calendar = ical({
        name: "test ical"
    });

    let config = new Config();
    let app = new WorkoutsToIcalApp( dataFile, calendar, config );

    ////////////////////////////////////////////////////////////////////////////
    // Unit tests
    ////////////////////////////////////////////////////////////////////////////
    await t.test( "unit tests", async ( t ) => {
        ////////////////////////////////////////////////////////////////////////
        // onGetWorkoutCalendar() tests
        ////////////////////////////////////////////////////////////////////////
        await t.test( "onGetWorkoutCalendar() tests", async ( t ) => {
            ////////////////////////////////////////////////////////////////////
            // Rainy day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should set response status to 403 if querystring secret is missing", ( t ) => {
                const mockRequest = {
                    query: {}
                } as express.Request;
    
                const statusMock = mock.fn( () => { return { end: function() {} }});
                const mockResponse = {
                    status: statusMock
                } as any as express.Response;
    
                const serveMock = mock.fn( () => {} );
                const mockCalendar = {
                    serve: serveMock
                } as any as ICalCalendar;

                app.onGetWorkoutCalendar( mockRequest, mockResponse, mockCalendar );
                assert.strictEqual( statusMock.mock.calls.length, 1 );
                assert.deepStrictEqual( statusMock.mock.calls[0].arguments, [403] );
            });

            await t.test( "should set response status to 403 if querystring secret value is incorrect", ( t ) => {
                const mockRequest = {
                    query: {}
                } as express.Request;
                mockRequest.query[config.querystringSecretKey] = "not the correct value";
    
                const statusMock = mock.fn( () => { return { end: function() {} }});
                const mockResponse = {
                    status: statusMock
                } as any as express.Response;
    
                const serveMock = mock.fn( () => {} );
                const mockCalendar = {
                    serve: serveMock
                } as any as ICalCalendar;

                app.onGetWorkoutCalendar( mockRequest, mockResponse, mockCalendar );
                assert.strictEqual( statusMock.mock.calls.length, 1 );
                assert.deepStrictEqual( statusMock.mock.calls[0].arguments, [403] );
            });

            ////////////////////////////////////////////////////////////////////
            // Sunny day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should call aCalendar.serve if querystring secret value is correct", ( t ) => {
                const mockRequest = {
                    query: {}
                } as express.Request;
                mockRequest.query[config.querystringSecretKey] = config.querystringSecretVal;
    
                const statusMock = mock.fn( () => { return { end: function() {} }});
                const mockResponse = {
                    status: statusMock
                } as any as express.Response;
    
                const serveMock = mock.fn( () => {} );
                const mockCalendar = {
                    serve: serveMock
                } as any as ICalCalendar;

                app.onGetWorkoutCalendar( mockRequest, mockResponse, mockCalendar );
                assert.strictEqual( serveMock.mock.calls.length, 1 );
            });
        });

        ////////////////////////////////////////////////////////////////////////
        // onPostWorkoutData() tests
        ////////////////////////////////////////////////////////////////////////
        await t.test( "onPostWorkoutData() tests", async ( t ) => {
            ////////////////////////////////////////////////////////////////////
            // Rainy day
            ////////////////////////////////////////////////////////////////////
            await t.test( "request with invalid headers should set response status to 403", ( t ) => {
                const mockRequest = {
                    headers: {},
                    body: { data: { workouts: [ JSON.parse( sampleData ) ] } }
                } as express.Request;
    
                const statusMock = mock.fn( () => { return { end: function() {} }});
                const mockResponse = {
                    status: statusMock
                } as any as express.Response;

                app.onPostWorkoutData( mockRequest, mockResponse, dataFile, calendar );
                assert.strictEqual( statusMock.mock.calls.length, 1 );
                assert.deepStrictEqual( statusMock.mock.calls[0].arguments, [403] );
            });

            await t.test( "request with invalid body should set response status to 400", ( t ) => {
                const mockRequest = {
                    headers: {},
                    body: { data: { workouts: JSON.parse( sampleData ) } }
                } as express.Request;
                mockRequest.headers[config.headerSecretKey] = config.headerSecretVal;
    
                const statusMock = mock.fn( () => { return { end: function() {} }});
                const mockResponse = {
                    status: statusMock
                } as any as express.Response;

                app.onPostWorkoutData( mockRequest, mockResponse, dataFile, calendar );
                assert.strictEqual( statusMock.mock.calls.length, 1 );
                assert.deepStrictEqual( statusMock.mock.calls[0].arguments, [400] );
            });
            
            ////////////////////////////////////////////////////////////////////
            // Sunny day
            ////////////////////////////////////////////////////////////////////
            await t.test( "request with valid headers and data", async ( t ) => {
                const mockRequest = {
                    headers: {},
                    body: { data: { workouts: [ JSON.parse( sampleData ) ] } }
                } as express.Request;
                mockRequest.headers[config.headerSecretKey] = config.headerSecretVal;
                mockRequest.body.data.workouts[0].start = "2022-10-26 20:00:00 -0500"
    
                const statusMock = mock.fn( () => { return { end: function() {} }});
                const mockResponse = {
                    status: statusMock
                } as any as express.Response;

                let calendarEventsBefore = calendar.length();
                await app.onPostWorkoutData( mockRequest, mockResponse, dataFile, calendar );
                let calendarEventsAfter = calendar.length();

                await t.test( "should set response status to 200", ( t ) => { 
                    assert.strictEqual( statusMock.mock.calls.length, 1 );
                    assert.deepStrictEqual( statusMock.mock.calls[0].arguments, [200] );
                });

                await t.test( "should add new workout to calendar", ( t ) => { 
                    assert.strictEqual( calendarEventsAfter, calendarEventsBefore + 1 );
                });
            });
        });

        ////////////////////////////////////////////////////////////////////////
        // validatePostedWorkoutDataHeaders() tests
        ////////////////////////////////////////////////////////////////////////
        await t.test( "validatePostedWorkoutDataHeaders() tests", async ( t ) => {
            ////////////////////////////////////////////////////////////////////
            // Rainy day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should return false when header secret is missing", ( t ) => {
                const mockRequest = {
                    headers: {}
                } as express.Request;

                let result = app.validatePostedWorkoutDataHeaders( mockRequest );
                assert.strictEqual( false, result );
            });

            await t.test( "should return false when header secret value is incorrect", ( t ) => {
                const mockRequest = {
                    headers: {}
                } as express.Request;
                mockRequest.headers[config.headerSecretKey] = "not the correct value";

                let result = app.validatePostedWorkoutDataHeaders( mockRequest );
                assert.strictEqual( false, result );
            });

            ////////////////////////////////////////////////////////////////////
            // Sunny day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should return true when header secret value is correct", ( t ) => {
                const mockRequest = {
                    headers: {}
                } as express.Request;
                mockRequest.headers[config.headerSecretKey] = config.headerSecretVal;

                let result = app.validatePostedWorkoutDataHeaders( mockRequest );
                assert.strictEqual( true, result );
            });
        });

        ////////////////////////////////////////////////////////////////////////
        // validatePostedWorkoutDataBody() tests
        ////////////////////////////////////////////////////////////////////////
        await t.test( "validatePostedWorkoutDataBody() tests", async ( t ) => {
            ////////////////////////////////////////////////////////////////////
            // Rainy day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should return false when body is undefined", ( t ) => {
                const body = undefined
                let result = app.validatePostedWorkoutDataBody( body );
                assert.strictEqual( false, result );
            });

            await t.test( "should return false when body is empty", ( t ) => {
                const body = "";

                let result = app.validatePostedWorkoutDataBody( body );
                assert.strictEqual( false, result );
            });

            await t.test( "should return false when body.data is undefined", ( t ) => {
                const body = {};

                let result = app.validatePostedWorkoutDataBody( body );
                assert.strictEqual( false, result );
            });

            await t.test( "should return false when body.data.workouts is undefined", ( t ) => {
                const body = {
                    data: {}
                };

                let result = app.validatePostedWorkoutDataBody( body );
                assert.strictEqual( false, result );
            });

            await t.test( "should return false when body.data.workouts is not an array", ( t ) => {
                const body = {
                    data: {
                        workouts: {}
                    }
                };

                let result = app.validatePostedWorkoutDataBody( body );
                assert.strictEqual( false, result );
            });

            ////////////////////////////////////////////////////////////////////
            // Sunny day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should return true when body.data.workouts is an array", ( t ) => {
                const body = {
                    data: {
                        workouts: []
                    }
                };

                let result = app.validatePostedWorkoutDataBody( body );
                assert.strictEqual( true, result );
            });
        });

        ////////////////////////////////////////////////////////////////////////
        // onNewWorkout() tests
        ////////////////////////////////////////////////////////////////////////
        await t.test( "onNewWorkout() tests", async ( t ) => {
            ////////////////////////////////////////////////////////////////////
            // Rainy day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should not add a new event to the calendar when the given data is invalid", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                workoutData.name = "Flying";
                
                let beforeCount = calendar.length();
                app.onNewWorkout( workoutData, calendar );
                let afterCount = calendar.length();
                assert.strictEqual( beforeCount, afterCount );
            });
            
            ////////////////////////////////////////////////////////////////////
            // Sunny day
            ////////////////////////////////////////////////////////////////////
            await t.test( "should add a new event to the calendar when the given data is valid", ( t ) => {
                let workoutData = JSON.parse( sampleData );
                
                let beforeCount = calendar.length();
                app.onNewWorkout( workoutData, calendar );
                let afterCount = calendar.length();
                assert.strictEqual( beforeCount + 1, afterCount );
            });
        });
    });

    ////////////////////////////////////////////////////////////////////////////
    // End to end tests
    ////////////////////////////////////////////////////////////////////////////
    await t.test( "e2e tests not implemented", async ( t ) => {
        // TODO: e2e tests by making requests to running app
        // app.start();
        // app.stop();
    });
    
    // Cleanup
    await dataFile.close();
    fs.unlinkSync( newDbName );
});
