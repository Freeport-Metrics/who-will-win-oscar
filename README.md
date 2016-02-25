Predict best movie winners
==========================

Real time analytics trying to predict best movie 2016 winners based on tweets. 
* Twitter Stream API
* RethinkDB
* Node.js
* Express

## Running

###1. Prerequisites

* Node.js (we deploy to node 4.2.1)
* RethinkDB (we used 2.2.4)

Assuming you use Homebrew:   

    brew install node  
    brew install rethinkdb

###2. Install dependencies

    npm install
  
###3. Set up Twitter API keys amd RethinkDB credentials
* copy .env.sample to .env fill environmental variables with correct values

###4. Run
    
    rethinkdb    
    npm start
    or
    npm run start-without-gulp (to skip static resources compilation phase)
  
###5. Open in browser
* the app: [http://localhost:3000/](http://localhost:3000/)
* stats/debug screen: [http://localhost:3000/stats](http://localhost:3000/stats)
* rethinkdb panel: [http://localhost:8080](http://localhost:8080/)

## Deploying to Amazon and Engine Yard

We used Amazon RethinkDB and EY Node.js to deploy the app.

* [Instructions for deploying RethinkDB from Amazon Marketplace](https://www.rethinkdb.com/docs/paas/). Remember to set
authentication key. Otherwise the database is available publicly e.g.


    r.db('rethinkdb').table('cluster_config').get('auth').update({auth_key: 'mysecrestpassword123'})

* We used Engine Yard for our Node.js server. The application was originally developed for Node.js 5 but we adjusted it 
to the version 4 which was the latest available on EY. Node version for EY is addd in packages.json
 

    "engines": {"node": "4.2.1-r1"} 
    
## Debugging hints
    
You can connect to websokekets from chrome console:
    
    
    socket = io.connect(window.location.href, {multiplex: false}); socket.on("initialize_tweet_aggregated", function (data) {console.log(data)})
    
    
## License

The source code is available under [MIT License](License).

Images by: http://www.clker.com/clipart-laurel-wreath.html


