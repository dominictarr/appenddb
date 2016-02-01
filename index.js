var fs = require('fs')
var pull = require('pull-stream')
var stringify = require('pull-stringify')
var toPull = require('stream-to-pull-stream')
var utf8 = require('pull-utf8-decoder')
var split = require('pull-split')

function parse (key) {
  if('string' !== typeof key)
    throw new Error('must be string:'+key)
  var parts = key.split('_')
  return {start: +parts[0], length: +parts[1]}
}

module.exports = function (file) {
  //open the file for appending and reading.
  var fd = fs.openSync(file, 'a+', 0666)

  return {

    read: function (opts) {
      var start = 0, end, key
      opts = opts || {}
      if(opts.gt) {
        key = parse(opts.gt)
        start = key.start + key.length + 2
      }
      else if(opts.gte) {
        key = parse(opts.gt)
        start = key.start
      }
      if(opts.lt) {
        key = parse(opts.lt)
        end = key.start - 1
      }
      else if(opts.lte) {
        key = parse(opts.lt)
        end = key.start + key.length - 1
      }
      var readOpts = {start: start, end: end, flags: 'r'}

      var position = start
      return pull(
        toPull.source(fs.createReadStream(file, readOpts)),
        utf8(),
        split('\n\n'),
        pull.filter(Boolean),
        pull.map(function (data) {
          var length = Buffer.byteLength(data)
          var r = position+'_'+length
          position += 2 + length

          if(opts.keys && !opts.values) return r
          else if(opts.keys !== false && opts.values !== false)
            return {key: r, value: JSON.parse(data)}
          else if(!opts.keys) return JSON.parse(data)
        })
      )
    },

    clean: function (cb) {
      fs.truncate(file, 0, cb)
    },

    write: function (cb) {
      return pull(
        stringify('', '\n', '\n\n', 2),
        toPull.sink(fs.createWriteStream(file, {flags: 'a'}), cb)
      )
    },

    get: function (key, cb) {
      var key = parse(key)
      var b = new Buffer(key.length)

      fs.read(fd, b, 0, key.length, key.start, function (err, data) {
        if(data !==  key.length) throw new Error('incorrect read length')
        cb(err, JSON.parse(b.toString()))
      })
    }
  }
}





