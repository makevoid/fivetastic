class FiveTastic
  constructor: ->
    @hamls = []
    @sasses = []
    # @layout = null
    # @page = null
    @body = $("body")
    @routes = null
    
  start: (body) ->  
    @body = body if body
    
    this.load_page "layout"
    
    window.location.pathname
    
    if this.index_path()
      this.load_page "index"
    else
      this.routes_get (routes) =>
        path = window.location.pathname
        page = this.page_from_path routes, path
        this.load_page page
    
      
    this.theme_buttons()
    # console.log "fivetastic started"
    
  # rendering
  
  render_js: (name, page) ->
    # console.log "page: ", page
    html = this.haml page
    # console.log "html: ", html
    $("#content").html html
    @body.trigger("page_js_loaded", [name])
    
  
  render: ->
    page = this.haml @page
    # console.log "page: ", @page
    html = this.haml(@layout, {yield: page})
    $("head").append $(html).find("#head").html()
    $("title").html $(html).find("#head #title").text()
    
    html = $(html).find("#body").html()
    @body.children().remove()
    @body.append html
    $("#loading").remove()
    $("body").delegate "a", "click", (evt) ->
      host = "http://#{window.location.host}/"
      if this["href"].match host
        evt.preventDefault()
    this.attach_clicks()
    this.sass()
    @body.trigger("page_loaded")
  
  render_sass: ->
    sasses = _(@sasses).sortBy (sass) -> sass.idx
    for sass in sasses
      $("head").append("<style class='sass'#{sass.id}>#{sass.css}</style>")  
  
  sass: (theme) ->  
    id = if theme then "#theme" else ""
    self = this
    $("link[type='text/sass']#{id}").each( (idx, script) ->
      path = if theme then "/sass/theme_#{theme}.sass" else $(script).attr("href")
      
      self.sasses.push { path: path, loaded: false }
      $.get(path, (data)  -> 
        sass = exports.render(data)
        id = " id='#{theme}'" if theme
        self.got_sass(path, idx, sass, id)
      )
    )
    
  haml: (html, vars={}) ->
    # TODO: throw an exception to be catched
    #
    # try
    # console.log "compiling haml..."
    haml.compileStringToJs(html)(vars)
    # console.log "finished"
    # catch error
    #       console.log error
  
  assign: (name, html) ->
    if name == "layout"
      @layout = html
    else
      @page = html
  
  # handlers
  
  attach_clicks: ->
    self = this
    $("body").delegate "a", "click", (evt) ->
    # $("a").live "click", (evt) ->
      host = "http://#{window.location.host}"
      if this["href"].match host
        path = this["href"].replace host, ''
        
        try 
          self.routes_get (routes) ->
            # console.log "path: ", path
            page = self.page_from_path routes, path
            self.load_page_js page
            self.push_state path
        catch error
          console.log error
    
        evt.preventDefault()
  
  # events
  
  got_sass: (path, idx, css, elem_id) ->
    sass = _.detect(@sasses, (h) -> h.path == path )
    sass.css = css
    sass.loaded = true
    sass.elem_id = elem_id
    all_loaded = _.all(@sasses, (h) -> h.loaded == true)
    this.render_sass() if all_loaded
  
  got_haml: (name, haml_string) ->
    haml = _.detect(@hamls, (h) -> h.name == name )
    haml.loaded = true
    all_loaded = _.all(@hamls, (h) -> h.loaded == true)
    this.assign name, haml_string
    # console.log "all_loaded: ", all_loaded
    this.render() if all_loaded
    haml_string
      
  # haml
    
  load_page_js: (page) ->
    $.get "/haml/#{page}.haml", (data) =>
      this.render_js page, data
    
  load_page: (page) ->
    # TODO: implement other markups like markdown and mustache/handlebars
    this.load_haml page
    
  load_haml: (name) ->
    @hamls.push { name: name, loaded: false }
    $.get "/haml/#{name}.haml", (data) =>
      this.got_haml name, data
      
  # routes
  
  page_from_path: (routes, path) ->
    route = _.detect(_(routes).keys(), (route) -> route == path )
    routes[route]
  
  index_path: ->
    path = window.location.pathname 
    path == "/" || path == "/index.html"
  
  routes_get: (got) ->
    if @routes
      got @routes
    else
      $.getJSON "/routes.json", (data) =>
        @routes = data
        got @routes  
  

  # here follows an implementation for libraries without getJSON
  #
  # $.get "/routes.json", (data) ->
  #   # val = eval("(#{data})")
  #   try
  #     val = JSON.parse data
  #   catch error
  #     console.log "error parsing json: ", error

      
  # state
  
  push_state: (url) ->
    # TODO: fix state object
    page = url  
    state = {url: url, page: page}
    url = "/" if url == "index"
    if history.pushState
      history.pushState(state, page, url)
  
  manage_state: ->
    window.onpopstate ->
      state = event.state
      if state && state.url
        console.log "pop state: ", state
        # get page
        # -- load_page_js
        
  # themes
  
  theme_buttons: ->
    self = this
    $("body").delegate(".themes button", "click", ->
      theme = $(this).attr("class")
      $(".sass #theme").remove()   
      self.sass theme
    )
  
        
g = window
g.fivetastic = new FiveTastic

unless g.jasmine
  g.fivetastic.start()