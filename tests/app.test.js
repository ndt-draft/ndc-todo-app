const expect = require('expect')
const request = require('supertest')
const {ObjectID} = require('mongodb')

const {app} = require('../app')
const {Todo} = require('../models/todo')
const {User} = require('../models/user')

const {todos, populateTodos, users, populateUsers} = require('./seed/seed')

beforeEach(populateUsers)
beforeEach(populateTodos)

describe('POST /todos', () => {
  it('should create a new todo', done => {
    var text = 'Test todo text'
    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text)
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1)
          expect(todos[0].text).toBe(text)
          done()
        }).catch(e => done(e))
      })
  })

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        Todo.find().then(todos => {
          expect(todos.length).toBe(2)
          done()
        }).catch(e => {
          done(e)
        })
      })
  })
})

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2)
      })
      .end(done)
  })
})

describe('GET /todos/:id', () => {
  it('should return a todo', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text)
      })
      .end(done)
  })

  it('should return 404 if todo not found', (done) => {
    var id = new ObjectID().toHexString()
    request(app)
      .get(`/todos/${id}`)
      .expect(404)
      .end(done)
  })

  it('should return 404 if invalid object id', (done) => {
    request(app)
      .get('/todos/123abc')
      .expect(404)
      .end(done)
  })
})

describe('PATCH /todos/:id', () => {
  it('should update todo', (done) => {
    var id = todos[0]._id.toHexString()
    var editData = {
      text: 'Edited text',
      completed: true
    }

    request(app)
      .patch(`/todos/${id}`)
      .send(editData)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(id)
        expect(res.body.todo.text).toBe(editData.text)
        expect(res.body.todo.completed).toBe(editData.completed)
        expect(typeof res.body.todo.completedAt).toBe('number')
      })
      .end(done)
  })

  it('should clear completedAt when todo is not completed', done => {
    var id = todos[0]._id.toHexString()
    var text = 'This should be a new text'
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text,
        completed: false
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text)
        expect(res.body.todo.completed).toBe(false)
        expect(res.body.todo.completedAt).toBeNull()
      })
      .end(done)
  })
})

describe('DELETE /todos/:id', () => {
  it('should delete the todo', done => {
    var id = todos[0]._id.toHexString()

    request(app)
      .delete(`/todos/${id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(id)
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        Todo.findById(id).then(todo => {
          expect(todo).toBeNull()
          done()
        }).catch(e => done(e))
      })
  })

  it('should return 404 if todo not found', done => {
    var id = new ObjectID().toHexString()

    request(app)
      .delete(`/todos/${id}`)
      .expect(404)
      .end(done)
  })

  it('should return 404 if object id is invalid', done => {
    request(app)
      .delete('/todos/123abc')
      .expect(404)
      .end(done)
  })
})

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toBe(users[0]._id.toHexString())
        expect(res.body.email).toBe(users[0].email)
      })
      .end(done)
  })

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({})
      })
      .end(done)
  })
})

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = "thanh@example.com"
    var password = "123mnb!"

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeTruthy()
        expect(res.body._id).toBeTruthy()
        expect(res.body.email).toBe(email)
      })
      .end(err => {
        if (err) {
          done(err)
        }

        User.findOne({email}).then(user => {
          expect(user).toBeTruthy()
          expect(user.password).not.toBe(password)
          done()
        })
      })
  })

  it('should return validation errors if request invalid', (done) => {
    request(app)
      .post('/users')
      .send({
        email: 'notemail',
        password: '1'
      })
      .expect(400)
      .end(done)
  })

  it('should not create user if email in use', (done) => {
    request(app)
      .post('/users')
      .send({
        email: users[0].email,
        password: '123abc!'
      })
      .expect(400)
      .end(done)
  })
})

describe('POST /users/login', () => {
  it('should login successfully', (done) => {
    const {email, password} = users[0]
    request(app)
      .post('/users/login')
      .send({email, password})
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeTruthy()
        expect(res.body._id).toBe(users[0]._id.toHexString())
        expect(res.body.email).toBe(users[0].email)
      })
      .end((err, res) => {
        if (err) {
          done(err)
        }

        User.findOne({email}).then(user => {
          expect(user.tokens[1]).toMatchObject({
            access: 'auth',
            token: res.headers['x-auth']
          })
          done()
        }).catch(e => done(e))
      })
  })

  it('should login failed with wrong password', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[0].email,
        password: 'wrongpassword'
      })
      .expect(400)
      .end(err => {
        if (err) {
          done(err)
        }

        User.findById(users[0]._id).then(user => {
          expect(user.tokens.length).toBe(1)
          done()
        }).catch(e => done(e))
      })
  })

  it('should login failed with wrong email', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: 'non-exist@example.com',
        password: '123abc'
      })
      .expect(400)
      .end(done)
  })
})

describe('DELETE /users/me/token', () => {
  it('should delete token successfully', (done) => {
    const {email} = users[0]

    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end(err => {
        if (err) {
          done(err)
        }

        User.findOne({email}).then(user => {
          expect(user.tokens.length).toBe(0)
          done()
        }).catch(e => done(e))
      })
  })

  it('should return 401 if token is wrong', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', '123abc')
      .expect(401)
      .end(done)
  })
})
