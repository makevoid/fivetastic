class FiveTastic
  constructor: ->
    @hamls = []
    @sasses = []
    # @layout = null
    # @page = null
    @body = $("body")
    @routes = null
    @views_path = "views" # "/haml"
    @loaded_sass = {}
    
  start: (body) ->  
    @body = body if body
    
    @hamls.push { name: "layout", loaded: false }
    @hamls.push { name: "index", loaded: false }
    
    this.load_page "layout"
    
    if this.index_path()
      this.load_page "index"
    else
      this.routes_get (routes) =>
        path = window.location.pathname
        page = this.page_from_path routes, path
        this.load_page page
    
      
    this.theme_buttons()
    
  # rendering
  
  render_js: (name, page) ->
    html = this.haml page
    $("#content").html html
    @body.trigger("page_js_loaded", [name])
    
  
  render: ->
    console.log @layout
    page = this.haml @page
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
    @body.trigger "page_loaded"
  
  render_all_sass: ->
    sasses = _(@sasses).sortBy (sass) -> sass.idx
    for sass in sasses
      this.append_style sass.css, sass.elem_id  
    @body.trigger "sass_loadeds"
  
  append_style: (css, elem_id) ->
    $("head").append("<style class='sass'#{elem_id || ''}>#{css}</style>")
  
  sass: (theme, async) ->  
    id = if theme then "#theme" else ""
    self = this
    $("link[type='text/sass']#{id}").each (idx, script) =>
      href = $(script).attr("href")
      if !@loaded_sass[href] || async
        @loaded_sass[href] = true
        path = if theme then "/sass/theme_#{theme}.sass" else $(script).attr("href")
        
        idx = self.sasses.length + 1 if async
      
        tag_id = if theme 
          " id='#{theme}'" 
        else
          ""
        
        self.sasses.push { idx: idx, loaded: false, tag_id: tag_id, path: path }
        $.get path, (data)  -> 
          sass = self.render_sass data
          self.got_sass idx, sass
      
    
  render_sass: (sass) ->
    exports.render sass
    
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
            page = self.page_from_path routes, path
            self.load_page_js page
            self.push_state path
        catch error
          console.log error
    
        evt.preventDefault()
  
  # events
  
  got_sass: (idx, css) ->
    sass = _.detect(@sasses, (h) -> h.idx == idx )
    sass.css = css
    sass.loaded = true
    all_loaded = _.all(@sasses, (h) -> h.loaded == true)
    this.render_all_sass() if all_loaded
  
  got_haml: (name, haml_string) ->
    haml = _.detect(@hamls, (h) -> h.name == name )
    haml.loaded = true
    all_loaded = _.all(@hamls, (h) -> h.loaded == true)
    this.assign name, haml_string
    this.render() if all_loaded
    haml_string
  
  # settings
  
  settings: {
    load_from_storage: true
  }
  
  # haml
    
  load_page_js: (page) ->
    $.get "/#{@views_path}/#{page}.haml", (data) =>
      this.render_js page, data
    
  load_page: (page, callback) ->
    # TODO: implement other markups like markdown and mustache/handlebars
    this.load_haml page, callback
    
  load_haml: (name, callback) ->
    path = "#{@views_path}/#{name}.haml"
    stored = localStorage["#{name}.haml_content"]
    if this.settings.load_from_storage && stored
      haml = this.got_haml name, stored
      callback(haml) if callback
      haml      
    else
      $.get path, (data) =>
        haml = this.got_haml name, data
        callback(haml) if callback
        haml
  
  rerender_haml: ->
    this.render()
    this.dev_mode()
  
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
      self.sass theme, true # async
    )
  
  # dev mode
  
  load_vendor_css: (name) ->
    $("head").append "<link rel='stylesheet' href='/fivetastic/vendor/css/#{name}.css'>"
    
  
  editor_template: ->
    "
    <nav id='dev_controls'> 
      Edit:
      <a data-file='views/layout.haml'>Layout</a>
      <a data-file='views/index.haml'>Page</a>
      <a data-file='sass/app.sass'>Style</a>
      <a data-file='coffee/app.coffee'>Coffee</a>
    </nav>
    <div id='editor'>
      <nav>        
        <div class='screen_hsplit'>hsplit</div>
        <!-- <div class='screen_vsplit'>vsplit</div> -->
        <div class='screen_full'>full</div>
        <div class='spacer'></div>
        <div class='load'>load</div>
      </nav>
      <div class='close'>x</div>
      <textarea id='code'></textarea>
    </div>
    "
    
  dev_mode: ->
    @in_dev_mode = true
    console.log "fivetastic is running in dev mode"
    
    $("head").append "<script src='/fivetastic/vendor/codemirror.js'></script>"
    
    this.load_vendor_css "codemirror"
    this.load_vendor_css "codemirror_themes/default"
  
    $("body").append this.editor_template()
    
    # @body.bind "sass_loadeds", =>
    $.get "/fivetastic/vendor/sass/codemirror.sass", (sass) =>
      css = this.render_sass sass
      this.append_style css
      
      # $("#editor div").off ".btns"
      this.handle_buttons()
      this.handle_shortcuts()
          
    $("#dev_controls a").on "click", (evt) =>
      path = $(evt.target).data("file")
      this.editor.show path
  
  handle_buttons: ->
    $("#editor .close").on          "click.btns", =>
      this.editor.close()
      
    $("#editor .load").on           "click.btns", =>
      this.editor.load()
      
    $("#editor .screen_hsplit").on  "click.btns", =>
      this.editor.hsplit()
      
    $("#editor .screen_full").on    "click.btns", =>
      this.editor.hsplit_undo()
  
  handle_shortcuts: ->
    $(window).off "keydown"
    $(window).on "keydown", (evt) =>
      S = 83
      Y = 89
      Z = 90
      ESC = 27

      if evt.keyCode == ESC
        this.editor.close()
        
      meta_key = evt.ctrlKey
      if navigator.userAgent.match /Macintosh/
        meta_key = evt.metaKey
    
      if meta_key && evt.keyCode == S
        this.editor.save()
        evt.preventDefault() 
        
      if meta_key && evt.keyCode == Z
        this.editor.codemirror.undo()
        
      cmd_shift_z = meta_key && evt.shiftKey && evt.keyCode == Z
      cmd_y = meta_key && evt.keyCode == Y
      if cmd_shift_z || cmd_y
        this.editor.codemirror.redo()
        evt.preventDefault() if cmd_y
  
  editor: 
    
    hsplit: ->
      preview_margin = 10
      
      height = $(window).height() / 2
      $(".CodeMirror-scroll").height height
      $("#editor").height height
      width = $(window).width() - preview_margin*2 - 15
      # TODO: set width
      $("#container").addClass("hsplit").height height
    
    hsplit_undo: ->  
      height = $(window).height()
      $(".CodeMirror-scroll").height height
      $("#editor").height height
      $("#container").removeClass("hsplit").height height
      
    
    load: ->  
      @code = localStorage["#{@name}_content"]
      @updated = localStorage["#{@name}_updated"]
      this.close()
      
      this.render()
    
    save: ->  
      @code = @codemirror.getValue()
      localStorage["#{@name}_content"] = @code
      localStorage["#{@name}_updated"] = new Date().valueOf()
      fivetastic.rerender_haml()
  
    close: ->
      this.hsplit_undo() 
      $("#editor").hide()
      
      
    show: (path) ->  
      @path = path
      @name = _(@path.split("/")).last()
      content = localStorage["#{@name}_content"]
      if content
        @code = content
        fivetastic.layout = @code
        fivetastic.render()
      else
        $.get "/#{path}", (file) =>
          @code = file
          fivetastic.layout = @code
          fivetastic.render()
          # TODO: continue here
          fivetastic.show_dev_mode()
        
    render: ->
      $(".CodeMirror").remove()
      $("#code").html @code
      code_div = document.getElementById "code"
      options = { mode: this.content_type(), tabMode: 'indent', lineNumbers: true, lineWrapping: true }
      @codemirror = CodeMirror.fromTextArea code_div, options

      $(".CodeMirror-scroll").height $(window).height()
      $("#editor").show()
      
      theme = "default"
      this.load_theme theme
      
      @codemirror.refresh()
      $("#code").focus()
    
    load_theme: (theme) ->
      fivetastic.load_vendor_css "codemirror_themes/#{theme}"
      @codemirror.setOption "theme", theme
  
    content_type: ->
      type = _(@path.split(".")).last()
      switch type 
        when "coffee" then "text/x-coffeescript"
        when "haml" then "text/x-coffeescript"
        # when "haml" then "text/haml" # TODO: haml mode for codemirror
        when "sass" then "text/css"
        else console.log "ERROR: type '#{type}' not detected"
          
        

       
g = window
g.fivetastic = new FiveTastic

unless g.jasmine
  g.fivetastic.start()
  
  # g.fivetastic.dev_mode()
  # debug
  setTimeout -> 
    $("#dev_controls a:first").trigger "click"
    
    setTimeout ->
       $("#editor .screen_hsplit").trigger "click"
    , 100
       
  , 300