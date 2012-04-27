class Fivetastic
  
  constructor: ->
    @modes  = ["dev", "prod"]
    @mode   = "prod"
    
    @router = new Fivetastic.Router()
  
  start: ->  
    @router.load Fivetastic.Config.routes
    #$("body").html("loaded").css(color: "#000000", fontSize: "3em")
    
  render: (page) ->
    
  apply: (theme) ->
    
  
  class @Router
    constructor: ->
      @routes = []

    load: (routes_file) ->
      $.get routes_file, (data) ->
        console.log data
        set data
        
    set: (routes) ->
      for url, file of routes
        @routes.push { url: url, file: file }
      
    route: (path) ->
  
  class @Config
    routes: "routes.json"
  
  
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