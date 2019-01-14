const {ObjectID} = require('mongodb')
const {Todo} = require('../../models/todo')
const {User} = require('../../models/user')
const jwt = require('jsonwebtoken')

const userOneId = new ObjectID()
const userTwoId = new ObjectID()
const users = [
  {
    _id: userOneId,
    email: 'john@example.com',
    password: 'userOnePass',
    tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userOneId, access: 'auth'}, '123abc').toString()
    }]
  },
  {
    _id: userTwoId,
    email: 'jane@example.com',
    password: 'userTwoPass'
  }
]

const todos = [
  {
    _id: new ObjectID(),
    text: 'Quit Niteco'
  },
  {
    _id: new ObjectID(),
    text: 'Join startup team',
  }
]

const populateTodos = (done) => {
  Todo.deleteMany({}).then(() => {
    return Todo.insertMany(todos)
  }).then(() => done())
}

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne  = new User(users[0]).save()
    var userTwo  = new User(users[1]).save()

    return Promise.all([userOne, userTwo])
  }).then(() => done())
}

module.exports = {todos, populateTodos, users, populateUsers}
