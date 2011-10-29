class FiveTastic
  constructor: ->
    @hamls = []
    # @layout = null
    # @page = null
    @body = $("body")
    
  start: (body) ->  
    @body = body if body
    this.load_layout()
    this.load_index()
    # console.log "fivetastic started"
    
  # rendering
  
  render: ->
    page = this.haml(@page)
    console.log @page
    html = this.haml(@layout, {yield: page})
    $("head").append $(html).find("#head").html()
    html = $(html).find("#body").html()
    @body.append html
    $("#loading").remove()
    this.sass()
    @body.trigger("page_loaded")
    
  sass: ->  
    $("link[type='text/sass']").each( (idx, script) ->
    
      path = $(script).attr("href")
      $.get(path, (data)  -> 
        sass = exports.render(data)
        $("head").append("<style id='sass'>#{sass}</style>")
      )
    )
    
  haml: (html, vars={}) ->
    haml.compileStringToJs(html)(vars)
  
  assign: (name, html) ->
    if name == "layout"
      @layout = html
    else
      @page = html
  
  # events
  
  got_haml: (name, haml_string) ->
    haml = _.detect(@hamls, (h) -> h.name == name )
    haml.loaded = true
    all_loaded = _.all(@hamls, (h) -> h.loaded == true)
    this.assign name, haml_string
    this.render() if all_loaded
    haml_string
      
  # haml
    
  load_layout: ->
    this.load_haml "layout"
    
  load_index: ->
    this.load_haml "index"
    
  load_haml: (name) ->
    @hamls.push { name: name, loaded: false }
    $.get "/haml/#{name}.haml", (data) =>
      this.got_haml name, data
      
      
g = window
g.fivetastic = new FiveTastic

unless g.jasmine
  g.fivetastic.start()
