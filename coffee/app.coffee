fivetastic = new Fivetastic
fivetastic.start()

$("body").bind "sass_loadeds", ->
  g.fivetastic.dev_mode() # comment this in production
  $("body").unbind "page_loaded"
  
# require_api = (api) ->
#   $.get "/fivetastic/api/lastfm.coffee", (coffee) ->
#     eval CoffeeScript.compile(coffee)
#     
# # APIS: fb, lastfm, delicious, twitter
# require_api "lastfm"