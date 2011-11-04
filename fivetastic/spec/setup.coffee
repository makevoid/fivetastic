
$("body").append "<div id='events'></div>"
events = $("#events")
g = window
g.fivetastic.start(events)


g.hide_fivetastic = ->
  $("#container").hide()
  $(".banner").hide()
  $("body").css({fontFamily: "Inconsolata, Monaco, Arial, Verdana", fontSize: "15px"})  
  $("a, span").css({color: "#333"})
  $(".jasmine_reporter").css({margin: "15px"})
  $(".run_spec").css({margin: "5px"})
  $(".resultMessage.fail, .runner.failed a").css({color: "#C00", margin: "5px"})
  $(".stackTrace").css({fontSize: "12px"})
