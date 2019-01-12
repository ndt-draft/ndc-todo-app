const expect = require('expect')
const request = require('supertest')
const {ObjectID} = require('mongodb')

const {app} = require('../app')
const {Todo} = require('../models/todo')

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

beforeEach((done) => {
  Todo.deleteMany({}).then(() => {
    return Todo.insertMany(todos)
  }).then(() => done())
})

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