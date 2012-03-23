localStorage = {} unless localStorage

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
    
    @hamls.push { name: "layout.haml", loaded: false }
    
    if this.index_path()
      @hamls.push { name: "index.haml", loaded: false }
      this.load_page { value: "layout.haml" }
      this.load_page { value: "index.haml"  }
    else
      this.routes_get (routes) =>
        path = window.location.pathname
        page = this.page_from_path routes, path
        page = this.detect_format page
        @hamls.push { name: page.full_name, loaded: false }
        this.load_page { value: "layout.haml" }
        this.load_page page

    this.manage_state()
    this.theme_buttons()
    
  # rendering
  
  render_js: (page, data) ->
    html = if page.format == "haml" 
      this.haml data
    else
      data

    $("#content").html html
    @body.trigger("page_js_loaded", [name])
    
  
  times: 0
  
  render: ->
    # debug 
    # $("body").css "color", "#000"
    
    # console.log @page
    page = if @page.format == "haml"
      this.haml @page.html
    else
      @page.html
    # TODO: insert other rendering format here (like markdown)
    html = this.haml @layout.html, {yield: page}
    
    major_ver = parseInt($.browser.version, 10)
    $("head").append $(html).find("#head").html()
    if !($.browser.msie && major_ver <= 8)
      # console.log "not ie < 8"
      $("title").html $(html).find("#head #title").text()
    
    @body = $("#rendered") if this.times > 0
    
    html = $(html).find("#body").html()
    @body.children().remove()
    @body.append "<div id='rendered'>#{html}</div>"
    
    # this.editor.full_render() if this.times > 0
    this.times += 1  
    
    $("#loading").remove()
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
    try
    # haml.compileStringToJs(html)(vars)
    # haml.compileHaml({ source: html, generator: "coffeescript" })(vars)
      haml.compileHaml({ source: html })(vars)
    # haml.compileCoffeeHamlFromString(html)(vars)
    catch error
      console.log "[Haml] Error:", error, error.message, { source: html, object: vars }
      console.log "Advice: There should be at least one haml element, try to put only something like '%p test' in your view."
      
  assign: (page, html) ->
    page.html = html
    if page.name == "layout"
      @layout = page
    else
      @page = page
  
  # handlers
  
  nullify_clicks: ->
    $("body").delegate "a", "click", (evt) ->
      host = "http://#{window.location.host}/"
      if this["href"].match host
        evt.preventDefault()
  
  attach_clicks: ->
    this.nullify_clicks()
    self = this
    $("body").undelegate "a", "click"
    $("body").delegate "a", "click", (evt) ->
      host = "http://#{window.location.host}"
      if this["href"].match host
        path = this["href"].replace host, ''
        
        try 
          self.routes_get (routes) ->
            self.execute_click routes, path
        catch error
          console.log error
    
        evt.preventDefault()
  
  execute_click: (routes, path) ->
    page = this.page_from_path routes, path
    page = this.detect_format page
    page.path = path
    this.load_page_js page
    this.push_state page
  
  
  # events
  
  got_sass: (idx, css) ->
    sass = _.detect(@sasses, (h) -> h.idx == idx )
    sass.css = css
    sass.loaded = true
    all_loaded = _.all(@sasses, (h) -> h.loaded == true)
    this.render_all_sass() if all_loaded
  
  got_haml: (page, haml_string) ->
    haml = _.detect(@hamls, (h) -> h.name == page.full_name )
    haml.loaded = true
    all_loaded = _.all(@hamls, (h) -> h.loaded == true)
    this.assign page, haml_string
    this.render() if all_loaded
    haml_string
  
  # settings
  
  settings: {
    load_from_storage: true
  }
  
  # haml
    
  load_page_js: (page) ->
    $.get "/#{@views_path}/#{page.full_name}", (data) =>
      @current_page = page
      this.render_js page, data
    
  load_page: (page, callback) ->
    # TODO: implement other markups like markdown and mustache/handlebars
    page = this.detect_format page
    @current_page = page
    this.load_view page, callback
    
  
  default_format: "haml"  
  
  detect_format: (page) ->
    return page if page.full_name
    value = page
    value = page.value if page.value
    if value.match /\./
      split = value.split(/\./)
      { name: split[0], format: split[1], full_name: value, args: page.args }
    else
      format = this.default_format
      { name: value, format: format, full_name: "#{value}.#{format}", args: page.args }
    
  load_view: (page, callback) ->
    path = "/#{@views_path}/#{page.full_name}"
    stored = localStorage["#{page.full_name}_content"]
    if this.settings.load_from_storage && stored
      haml = this.got_haml page, stored
      callback(haml) if callback
      haml      
    else
      $.get path, (data) =>
        haml = this.got_haml page, data
        callback(haml) if callback
        haml
  
  # routes
  
  page_from_path: (routes, path) ->
    this.route_matches routes, path
    
  route_matches: (routes, path) ->
    route = null
    for route, value of routes
      if route.match /\*/
        route_exp = route.replace(/\*/g, '(.+)').replace(/\//g, '\\/')
        matches = path.match new RegExp(route_exp)
        if matches
          name = matches[0]
          args = matches[1..-1]
          route = { name: name, args: args, value: value }
          break
      else
        if path == route
          route = { name: path, args: [], value: value }
          break
        
    route
    
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
  
  push_state: (page) ->
    # TODO: fix state object
    # page = url[1..-1]  
    # page = "index" if page == ""
    # page = this.detect_format page
    state = { page: page }
    if history.pushState
      title = page # TODO: set proper title, maybe just capitalize
      # console.log "push state: ", state
      history.pushState(state, title, page.path)
  
  manage_state: ->
    window.onpopstate = (event) =>
      state = event.state
      if state# && state.url
        # console.log "pop state: ", state
        this.load_page_js state.page
        
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
    
  
    
  dev_mode: ->
    @in_dev_mode = true
    # console.log "fivetastic is running in dev mode"
    
    $("head").append "<script src='/fivetastic/vendor/codemirror.js'></script>"
    
    this.load_vendor_css "codemirror"
    this.load_vendor_css "codemirror_themes/default"
  
    this.editor.full_render()

  
  editor:   
    
    is_hsplit: false
    
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
          <div class='discard'>discard</div>
          <div class='load'>load</div>
        </nav>
        <div class='close'>x</div>
        <textarea id='code'></textarea>
      </div>
      "
    
    render_editor: ->
      $("body").append this.editor_template()
    
    codemirror_sass_loaded: false
    
    full_render: ->
      this.render_editor()
      
      unless this.codemirror_sass_loaded
        $.get "/fivetastic/vendor/sass/codemirror.sass", (sass) =>
          css = fivetastic.render_sass sass
          fivetastic.append_style css

          # $("#editor div").off ".btns"
          this.handle_buttons()
          this.handle_shortcuts()
          this.codemirror_sass_loaded = true
      else
        this.handle_buttons()
        this.handle_shortcuts()
      
      this.handle_nav()
    
    
    handle_buttons: ->
      $("#editor .close").on          "click.btns", =>
        this.close()

      $("#editor .load").on           "click.btns", =>
        this.load()
        
      $("#editor .discard").on        "click.btns", =>
        this.discard()

      $("#editor .screen_hsplit").on  "click.btns", =>
        this.hsplit()

      $("#editor .screen_full").on    "click.btns", =>
        this.hsplit_undo()

    handle_shortcuts: ->
      $(window).off "keydown"
      $(window).on "keydown", (evt) =>
        S = 83
        Y = 89
        Z = 90
        ESC = 27

        if evt.keyCode == ESC
          this.close()

        meta_key = evt.ctrlKey
        if navigator.userAgent.match /Macintosh/
          meta_key = evt.metaKey

        if meta_key && evt.keyCode == S
          this.save()
          evt.preventDefault() 

        if meta_key && evt.keyCode == Z
          this.codemirror.undo()

        cmd_shift_z = meta_key && evt.shiftKey && evt.keyCode == Z
        cmd_y = meta_key && evt.keyCode == Y
        if cmd_shift_z || cmd_y
          this.codemirror.redo()
          evt.preventDefault() if cmd_y
    
    handle_nav: ->
      $("#dev_controls a").on "click", (evt) =>
        path = $(evt.target).data("file")
        this.show path
    
    hsplit: ->
      preview_margin = 10
      
      height = $(window).height() / 2
      $(".CodeMirror-scroll").height height
      $("#editor").height height
      width = $(window).width() - preview_margin*2 - 15
      # TODO: set width
      $("#container").addClass("hsplit").height height
      this.is_hsplit = true
    
    hsplit_undo: ->  
      height = $(window).height()
      $(".CodeMirror-scroll").height height
      $("#editor").height height
      $("#container").removeClass("hsplit").height height
      this.is_hsplit = false
    
    load: ->  
      @code = localStorage["#{@name}_content"]
      @updated = localStorage["#{@name}_updated"]
      this.close()
      this.render()
    
    discard: ->
      localStorage.removeItem "#{@name}_content"
      localStorage.removeItem "#{@name}_updated"
      
    save: ->  
      @code = @codemirror.getValue()
      localStorage["#{@name}_content"] = @code
      localStorage["#{@name}_updated"] = new Date().valueOf()
      this.handle_type()
      fivetastic.render()

      if this.is_hsplit
        setTimeout =>
          this.hsplit() 
        100
  
    close: ->
      this.hsplit_undo() 
      $("#editor").hide()
      
      
    handle_type: ->
      type = this.path_type()
      if @name == "layout.haml"
        fivetastic.layout = @code
      else if type == "haml"
        fivetastic.page = @code
      else if type == "sass" 
        console.log "TODO: implement me!"
      else if type == "coffee"
        console.log "TODO: implement me!"        
      
    render_all: ->
      this.handle_type()
      fivetastic.render()
      this.render()  
    
    show: (path) ->  
      @path = path
      @name = _(@path.split("/")).last()

      content = localStorage["#{@name}_content"]
      if content
        @code = content
        this.render_all()
      else
        $.get "/#{path}", (file) =>
          @code = file
          this.render_all()
          
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
  
    path_type: ->
      _(@path.split(".")).last()
  
    content_type: ->
      switch this.path_type() 
        when "coffee" then "text/x-coffeescript"
        when "haml" then "text/x-coffeescript"
        # when "haml" then "text/haml" # TODO: haml mode for codemirror
        when "sass" then "text/css"
        else console.log "ERROR: type '#{this.path_type()}' not detected"
          
        

       
g = window
g.fivetastic = new FiveTastic

unless g.jasmine
  g.fivetastic.start()
  
  # g.fivetastic.dev_mode()
  # debug
  # setTimeout -> 
  #   $("#dev_controls a:first").trigger "click"
  #   
  #   setTimeout ->
  #      $("#editor .screen_hsplit").trigger "click"
  #   , 100
  #      
  # , 300