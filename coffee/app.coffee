g = window
$("body").bind "page_loaded", ->
  g.fivetastic.dev_mode() # comment this in production

console.log "app coffee loaded"