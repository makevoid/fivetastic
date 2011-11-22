$.extend ajax: (ajax) ->
  switch ajax.url
    when "/fivetastic/fivetastic.coffee"
      ajax.success {}
    else
      console.log "Unexpected URL: " + ajax.url