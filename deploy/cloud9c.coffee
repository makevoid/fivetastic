http = require "http"
fs = require 'fs'

log = console.log

module.exports = http.createServer (req, res) ->
  res.writeHead 200, 'Content-Type': 'text/html'
  path = req.url
  log "get: ", path
  path = "index.html" if path == "/" 
  file = path.replace /^\//, ''
  file = fs.readFile file, (err, data) ->
    res.end data

console.log "Server running at http://0.0.0.0:#{process.env.C9_PORT}/"
