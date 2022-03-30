Here resides the NodeJS code of the sever that: 

 - connects to a mySQL database
 - receives HTTP requests from the APP to submit new ocurrences in the database
 - receives the uploaded photos corresponding to the occurrences sent by the APP
 - stores these photos, to be shown on the app or on the website

 The entry point of the server is `main.js`.
 
 The server is receiving requests at https://servidor.nomeubairro.app/