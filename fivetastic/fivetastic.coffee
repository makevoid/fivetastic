class FiveTastic
  constructor: ->
    @hamls = []
    # @layout = null
    # @page = null
    @body = $("body")
    
  start: (body) ->  
    @body = body if body
    this.load_page "layout"
    this.load_page "index"
    this.theme_buttons()
    # console.log "fivetastic started"
    
  # rendering
  
  render_js: (page) ->
    # console.log "page: ", page
    html = this.haml page
    # console.log "html: ", html
    $("#content").html html
    
  
  render: ->
    page = this.haml @page
    # console.log "page: ", @page
    html = this.haml(@layout, {yield: page})
    $("head").append $(html).find("#head").html()
    html = $(html).find("#body").html()
    @body.children().remove()
    @body.append html
    $("#loading").remove()
    $("body").delegate "a", "click", (evt) ->
      evt.preventDefault()
    this.load_routes()
    this.sass()
    @body.trigger("page_loaded")
    
  sass: (theme) ->  
    id = if theme then "#theme" else ""
    $("link[type='text/sass']#{id}").each( (idx, script) ->
      path = if theme then "/sass/theme_#{theme}.sass" else $(script).attr("href")
      $.get(path, (data)  -> 
        sass = exports.render(data)
        id = " id='#{theme}'" if theme
        $("head").append("<style class='sass'#{id}>#{sass}</style>")
      )
    )
    
  haml: (html, vars={}) ->
    haml.compileStringToJs(html)(vars)
  
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
      host = "http://localhost:3000/"
      link = this["href"].replace host, ''
      # console.log "link: ", link
      link = "index" if link == ""
      # 
      try 
        self.load_page_js link
      catch error
        console.log error
    
      self.push_state link
      evt.preventDefault()
  
  # events
  
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
      this.render_js data
    
  load_page: (page) ->
    this.load_haml page
    
  load_haml: (name) ->
    @hamls.push { name: name, loaded: false }
    $.get "/haml/#{name}.haml", (data) =>
      this.got_haml name, data
      
  # routes
  
  load_routes: ->
    this.attach_clicks()
      
    $.get "/routes.json", (data) ->
      # val = eval("(#{data})")
      val = JSON.parse data
      
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
