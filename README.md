# logdb

a minimal append only database, using an append only file, for comparison with leveldb.

## example

``` js
var Log = require ('logdb')

var db = Log(file)

//write sourceData to the db.
pull(
  sourceData,
  db.write(function (err) {

    //read all keys in the db.
    pull(
      db.read({keys: true, values: false}),
      pull.collect(function (err, keys) {
        //read one of the keys randomly.
        db.get(keys[~~(Math.random()*keys.length], function (err, value) {
          if(err) throw err
          console.log(value)
        })
      })
    )

  })
)

```

# api

## LogDb(file)

create a log db instance.

### write(cb) => sink

returns a pull stream that appends to the store.
stream should be js objects (which will be JSON.stringified).
Keys are not supported. logdb will create a key for each record.

returns a pull-stream sink.

### read({gt,gte,lt,gte,keys,values}) => source

supports (most of) the level read stream api.
returns a pull-stream source.

### get(key, cb(err, value))

read one value from the database.


### clean (cb)

remove all data from the database.

## License

MIT

