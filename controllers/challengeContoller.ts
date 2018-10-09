var express = require("express");

const challengeController = express.Router();

/**
 * 1. Get Challenge with id. 
 * 2. Post a new Challenge. 
 * 3. Edit a new Challenge. 
 * 4. Delete a Challenge.
 */

 challengeController.get('/:id', (req, res) => {
     // Get challenge with id. 
     res.type('json');
     res.send({
         "Data": "This endpoint gives a challenge for a particular challenge_id"
     })
 });

 challengeController.post('/', (req, res) => {
     // Post a challenge for that user. 
     res.type('json');
     res.send({
         "Data": "This endpoint is used to post a challenge for the user"
     })
 });

 challengeController.patch('/:id', (req, res) => {
     // Edit challenge with id. 
     res.type('json');
     res.send({
         "Data": "This endpoint is used to update a challenge."
     })
 });

 challengeController.delete('/:id', (req, res) => {
     // Delete challenge with id. 
     res.type('json');
     res.send({
         "Data": "This endpoint is used to delete a challenge with the given challenge_id"
     })
 });

module.exports =  challengeController;