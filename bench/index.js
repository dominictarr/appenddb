var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var split = require('pull-split')
var fs = require('fs')
var paramap = require('pull-paramap')

function random (array) {
  return array[~~(Math.random()*array.length)]
}

var _human = new (require('custom-human-time'))({
  digits: 3,
  names: {
    'millisecond': 'ms',
    'second': 's',
    'minute': 'm',
    'hour': 'h`',
  }
})

function human (ms) {
  if(process.stdout.isTTY)
    return _human.print(ms).replace(/\s/g, '')
  else return ms
}


module.exports = function (db, opts) {

  opts = opts || {}

  //load a database.

  var loadStart = Date.now()

  return db.write(function (err) {

    console.error('db loaded', human(Date.now() - loadStart))

    var scanStart = Date.now()
    //read the keys into an array.

    pull(
      db.read({keys: true, values: false}),
      pull.collect(function (err, keys) {
        console.error('keys loaded', human(Date.now() - scanStart))

        var start = Date.now()
        pull(
          pull.count(opts.count || 1000000),
          //serial and parallel reads
          paramap(function (_, cb) {
            db.get(random(keys), cb)
          }, opts.concurrency || 32),
          pull.drain(null, function (err) {
            console.log(human(Date.now() - start))
          })
        )
      })
    )
  })
}

if(!module.parent) {
  var opts = require('minimist')(process.argv.slice(2))
  var length = 0, records = 0

  var dep = opts.level ? 'level-logdb' : '../'

  pull(
    toPull.source(fs.createReadStream(opts._[0])),
    pull.through(function (e) {
      length += e.length
    }, function (err) {
      console.error('data', length/(1024*1024))
    }),
    split('\n\n', JSON.parse),
    pull.through(function (e) {
      records ++
    }, function (err) {
      console.error('records', records)
    }),
    module.exports(require(dep)(
      opts.file || '/tmp/bench-logdb-'+Date.now()+'.logdb'),
      opts
    )
  )
}






