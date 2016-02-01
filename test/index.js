var tape = require('tape')
var pull = require('pull-stream')
var paramap = require('pull-paramap')

var data = [
  {foo: true},
  {bar: false},
  {baz: [1,2,3]}
]

module.exports = function (db) {

  tape('write data', function (t) {

    pull(
      pull.values(data),
      db.write(function (err) {
        if(err) throw err
        setTimeout(function () {
          t.end()
        }, 100)
      })
    )

  })

  tape('read data', function (t) {

    pull(
      db.read({keys: false, values: true}),
      pull.collect(function (err, actual) {
        if(err) throw err
        t.deepEqual(actual, data)
        t.end()
      })
    )
  })

  tape('get data', function (t) {
    pull(
      db.read({keys: true, values: false}),
      pull.through(function (key) {
        t.equals(typeof key, 'string') 
      }),
      paramap(function (key, cb) {
        db.get(key, cb)
      }),
      pull.collect(function (err, actual) {
        if(err) throw err
        t.deepEqual(actual, data)
        t.end()
      })
    )
  })

  tape('get data as {key, value}', function (t) {
    pull(
      db.read({keys: true, values: true}),
      paramap(function (data, cb) {
        console.log('data', data)
        db.get(data.key, function (err, value) {
          t.deepEqual(value, data.value)
          cb()
        })
      }),
      pull.drain(null, function (err) {
        if(err) throw err
        t.end()
      })
    )
  })

  tape('clean', function (t) {
    db.clean(function (err) {
      if(err) throw err
      pull(
        db.read(),
        pull.collect(function (err, ary) {
          if(err) throw err
          t.notOk(ary.length)
          t.end()
        })
      )
    })

  })

}


if(!module.parent) {
  //var Log = require('../')
  var Log = require('level-logdb')
  var db = Log('/tmp/test-logdb-' + Date.now()+'.logdb')
  module.exports(db)
}



