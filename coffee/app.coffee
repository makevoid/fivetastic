g = window
$("body").bind "sass_loadeds", ->
  console.log "boound"
  g.fivetastic.dev_mode() # comment this in production
  $("body").unbind "page_loaded"
  

console.log "app coffee loaded"