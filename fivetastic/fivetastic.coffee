class Fivetastic
  constructor: ->
    @modes = ["dev", "prod"]
    @mode  = "prod"
  
  start: ->
    $("body").html("loaded").css(color: "#000000", fontSize: "3em")
    
  render: (page) ->
    
  apply: (theme) ->
  
  class @Config
    routes: "routes.json"
  
  class @Router
    constructor: ->
  
    load: (routes_file) ->
      # $.get Config.routes 
      #   ...
    
    route: (path) ->
  
  
  class @Page
    constructor: (name) ->
    
    render: (format) ->
    
        
  class @Renderer
    constructor: ->
  

  class @Editor
  
  
  class @Theme
  
  
  class @Storage
  
  
  
g = window 
g.Fivetastic = Fivetastic