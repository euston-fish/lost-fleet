# js13kgames.com Game Server

Game server for the [js13kGames Competition](http://js13kgames.com/).

## Install

[Download](https://github.com/js13kgames/js13kserver/archive/master.zip) the skeleton.
Extract the files and install the third party libraries with `npm`. 

    npm install

## Runinng

You can run the server locally with the following command:

    npm start

You can reach the test server at [http://localhost:3000](http://localhost:3000)

## Code structure

All your code must be in the `public` folder. Put your server side code into 
the `server.js` file. The `shared.js` file is loaded at the begining of the
`server.js` file. You can also use this code on the client side.

## Deploy to Heroku

1. Push your files to your GitHub repository
2. Create new WebApp on heroku
3. Connect your WebApp with the GitHub repository
4. Deploy your code 

## Submit your entry

1. Zip all files in the `public` folder.
2. Submit your entry on the [js13kgames.com](http://js13kgames.com) site.
3. Add [contact@js13kgames.com](mailto:contact@js13kgames.com) games as collaborator to your Heroku WebApp.