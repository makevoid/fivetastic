

$(function(){ // FIXME: remove domload scope (see next)

  // var coffees_loaded = 0
  // var events = $("#events") // FIXME: why do I have to rely on DOM to bind/trigger events?

  function load_coffees(files) {
    _.each(files, function(file){
      load_coffee(file+".coffee", files)
    })
  }

  function load_coffee(file, files) {
    $.get(file, function(data){
      eval(CoffeeScript.compile(data))
      // coffees_loaded++ 
      //  
      // if (coffees_loaded == files.length) // all loaded
      //   events.trigger("coffee_loaded") 
    })
  }

  load_coffees([
    "/fivetastic/fivetastic",
    "/coffee/app"
  ])
  // console.log($("body").html())
  
  
  
})




// load_coffee('/fivetastic/fivetastic.coffee')
// load_coffee('/coffee/app.coffee')



