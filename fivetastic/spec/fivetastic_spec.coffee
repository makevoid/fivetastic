$.get = (url) ->
  msg = "get: #{url}"
  switch url
    when "routes.json"
      [ { url : '/', file : 'index' }, { url : '/:page', file : ':page' }, { url : '/*', file : 'index' } ]
    else
      "undefined route"


describe "Fivetastic", ->
  beforeEach ->
    @five = new Fivetastic()

  describe "config", ->
    it "has defaults routes path", ->
      expect(@five.config.routes).toEqual "routes.json"
  
  it "defaults to prod mode", ->
    expect(@five.mode).toEqual "prod"
    
  it "loads default routes", ->
    expect(@five.router.routes).toEqual @five.router.default_routes
    
  describe "on start", ->
  
    it "loads a routes file", ->
      @five.start =>
        expect(@five.router.routes).toEqual []    
      
    it "shows a loaded message", ->
      @five.start ->
        expect($("body").html()).toEqual "loaded"
      
  describe "Router", ->
    beforeEach ->
      @router = new Fivetastic.Router()
  
    it "set routes", ->
      @router.set_routes { "/": "index" }
      expect(@router.routes).toEqual [{url: "/", file: "index"}]
          
    matches = (router, url) ->
      params = router.matches route, url
      expect(params).toEqual {}
          
    it "matches /", ->
      route = { url: "/", file: "index" }
      match = @router.matches route, route.url
      expect(match).toEqual {}
      
    describe "with params", -> 
    
      it "matches /*", ->
        route = { url: "/*", file: "page" }
        match = @router.matches route, "/antani"
        expect(match).toEqual { 0: "antani" }
    
      it "matches a subdir", ->
        route = { url: "/deh/*", file: "deh/antani" }
        match = @router.matches route, "/deh/pagina"
        expect(match).toEqual { 0: "pagina" }
        
      it "matches /:page", ->
        route = { url: "/:page", file: "antani" }
        match = @router.matches route, route.url
        expect(match).toEqual { "page": "antani" }
    
      it "matches a subdir", ->
        route = { url: "/sub/:page", file: "sub/antani" }
        match = @router.matches route, "/sub/pagina"
        expect(match).toEqual { "page": "pagina" } 
        
    
    describe "route", ->
      
      it "starts with the location.pathname route", ->
        expect(@router.current).toMatch /fivetastic\/fivetastic/
      
      it "routes /", ->
        @router.route "/"
        expect(@router.current.file).toEqual "index"
        expect(@router.current.found).toEqual true
          
      it "routes /page", ->
        @router.route "/page"
        # expect(@router.current.file).toEqual "page"
        expect(@router.current.found).toEqual true
          
      it "routes /asdasdas", ->
        @router.route "/asdasd"
        expect(@router.current.file).toEqual "index"
        # expect(@router.current.found).toEqual false
          
      it "triggers route_changed event", ->
        changed = false
        $(document).bind "route_changed", =>
          changed = true
        @router.route "/an_url"
        _.defer ->
          expect(changed).toEqual true
      
      it "pushes state", ->
        
      
    describe "prev", ->
    
    describe "next", ->
    