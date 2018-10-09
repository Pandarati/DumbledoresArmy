var express = require("express");

const challengeListController = express.Router()

/**
 * 1. Get all challenges.
 * 2. Get Challenges from (lat1, long1, lat2, long2)
 * 3. Get Challenges posted by a user. 
 * 4. Get Challenges answered by a user.
 */

 console.log("Inside Challenge list controller");

 challengeListController.get('/', (req, res) => {
     // Get all the challenges posted so far. 
     res.type('json');
     res.send({
         "Data": "This endpoint gives a all the challenges posted so far."
     })
 });

 challengeListController.get('/:lat1/:long1/:lat2/:long2', (req, res) => {
     // Get all the challenges from the given latitude and longitude.
     res.type('json');
     res.send({
         "Data": "This endpoint gives all the challenges posted in the given range of latitude and longitude"
     })
 });

 challengeListController.get('/posted', (req, res) => {
     // Get all the challenges posted by the user.
     res.type('json');
     res.send({
         "Data": "This endpoint all the challenges posted by the current user."
     })
 });

 challengeListController.get('/taken', (req, res) => {
     // Get all the challenges taken by the user. 
     res.type('json');
     res.send({
         "Data": "This endpoint gives all the challenges taken by the current user."
     })
 });

 module.exports = challengeListController;