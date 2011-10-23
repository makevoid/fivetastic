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
    
    
  # 
  
  render: ->
    yield = "lool"
    html = @layout
    html.find("#content").html @page
    html = html.get(1)
    @body.html html
    @body.trigger("page_loaded")
  
  assign: (name, html) ->
    html = $(html)  
    if name == "layout"
      @layout = html
    else
      @page = html
  
  # events
  
  haml_loaded: (name, html) ->
    haml = _.detect(@hamls, (h) -> h.name == name )
    haml.loaded = true
    all_loaded = _.all(@hamls, (h) -> h.loaded == true)
    this.assign name, html
    this.render() if all_loaded
    html
      
  # haml
    
  load_layout: ->
    this.load_haml "layout"
    
  load_index: ->
    this.load_haml "index"
    
  load_haml: (name) ->
    @hamls.push { name: name, loaded: false }
    $.get "/haml/#{name}.haml", (data) =>
      html = haml.compileStringToJs(data)({yield: "lol"})
      this.haml_loaded name, html
      
      
g = window
g.fivetastic = new FiveTastic

unless g.jasmine
  g.fivetastic.start()
  