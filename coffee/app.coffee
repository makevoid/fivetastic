fb_init = ->
  FB.init
    appId: "204625772947506"
    status: true
    cookie: true
    xfbml: true

class FbComments
  constructor: (@urls) ->
    @comments = []
    @callback = null


  fetch: ->
    for url in @urls
      $.getJSON this.graph_url(url), (comments) =>
        comments_data = _(comments).values()[0].data
        for comment in comments_data
          # console.log comment
          comment_html = "
            <div class='fbc_comment'>
              <fb:profile-pic uid='#{comment.from.id}' linked='true'></fb:profile-pic>
              <div class='fbc_from'>#{comment.from.name}</div>
              <div class='fbc_message'>#{comment.message}</div>
            </div>
          "
          this.fetched comment_html
  
  latest: (callback) ->
    this.fetch()
    @callback = callback if callback
    
  fetched: (comment) ->
    @comments.push comment
    this.render() if @comments.size == @urls.size
    
  render: ->
    $(".fb_comments").html @comments.join("\n")
    @callback() if @callback
  
  graph_url: (url) ->
    "https://graph.facebook.com/comments/?ids=#{url}"


$ ->

  $("body").bind "page_loaded", ->

    window.fbAsyncInit = ->
      fb_init()
      
      FB.getLoginStatus (response) ->  
        console.log "lol?"
        console.log response.status
        if response.status == "connected"
          $(".nav_right").append "Logged in as user: #{response.session.uid}"
        else
          $(".fb-login-button").fadeIn()
      
    ((d) ->
      js = undefined
      id = "facebook-jssdk"
      return  if d.getElementById(id)
      js = d.createElement("script")
      js.id = id
      js.async = true
      js.src = "//connect.facebook.net/en_US/all.js"
      d.getElementsByTagName("head")[0].appendChild js
    ) document
  
  $("body").bind "page_js_loaded", ->
    
  
    fb_init()
  
  
    
  # 
  
  home_page = ->
    urls = ["http://d.makevoid.com:3000/page1", "http://d.makevoid.com:3000/page2"]
    fb_comments = new FbComments urls
    comments = fb_comments.latest ->
      fb_init()
    
    
  
  $("body").bind "page_loaded", ->
    home_page()
    
  $("body").bind "page_js_loaded", ->
    home_page()
