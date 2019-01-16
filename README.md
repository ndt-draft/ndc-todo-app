# Node todo app
Add `config/config.json` with the content like below:
```
{
  "test": {
    "PORT": "3003",
    "MONGODB_URI": "mongodb://localhost:27017/TodoAppTest",
    "JWT_SECRET": "sdfksdlfjsu834osfu988sdf"
  },
  "development": {
    "PORT": "3000",
    "MONGODB_URI": "mongodb://localhost:27017/TodoApp",
    "JWT_SECRET": "sdf989sd8f80sd0f9890ds8f"
  }
}
```

## Installation
```
npm install
```

## Start app
```
npm start
```

or

```
nodemon app.js
```

## Testing
```
npm test
```

or watching with

```
npm run test-watch
```

# Heroku deployment
Go to the app root, create heroku app
```
heroku create
```

Set environment variable
```
heroku config:set MONGODB_URI=<your-mongodb-uri>
heroku config:set JWT_SECRET=<your-jwt-secret>
```

Getting current enviroment variables
```
heroku config
```

Push to deploy
```
git push heroku master
```
