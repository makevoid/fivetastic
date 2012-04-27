class Fivetastic
  
  config:
    routes: "routes.json"
    
  constructor: ->
    @modes  = ["dev", "prod"]
    @mode   = "prod"
    @default_format = "haml"
    @formats = ["haml", "html", "mustache", "php"] # markdown
    
    @router = new Fivetastic.Router(@events)
  
  start: (cb) ->  
    @router.load @config.routes, =>
      cb() if cb
      @loaded_message()
    
  loaded_message: ->
    $("body").html("loaded").css(color: "#000000", fontSize: "3em")
    
  render: (page) ->
    
  apply: (theme) ->
    
  
  class @Router
    default_routes: [{ url: "/", file: "index" }, { url: "/pages/*", file: "page"  }, { url: "/*", file: "not_found"  }]
    current: undefined
    
    constructor: (events, routes) ->
      @routes = routes || @default_routes
      @events = events
      @current = @current_url_route()
      
    load: (routes_file, cb) ->
      $.get routes_file, (data) =>
        @set_routes data
        @current = @current_url_route()
        cb() if cb
        
    set_routes: (routes) ->
      @routes = []
      for url, file of routes
        @routes.push { url: url, file: file }
      
    matches: (route, path) ->      
      if route.url.match /\*/
        @matches_star route, path
      else if route.url.match /:/
        @matches_semicolon route, path
      else
        {} if route.url == path 
      
    route: (path) ->
      _(@routes).find (route) =>
        if match = @matches(route, path)
          @current = _.clone(route) 
          @current.params = match
      $(document).triggerHandler "route_changed"
      
    # private  
    
    matches_star: (route, path) ->
      route_exp = route.url.replace(/\*/g, '(.+)').replace(/\//g, '\\/')
      matches = path.match new RegExp(route_exp)
      if matches
        matches[1..-1]

    matches_semicolon: (route, path) ->
      throw "NotImplementedError: router.matches_semicolon"
    
    current_url_route: ->
      location.pathname
  
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