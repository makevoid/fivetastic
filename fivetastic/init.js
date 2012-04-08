function load_coffees(files) {
  _.each(files, function(file){
    load_coffee(file+".coffee", files)
  })
}

function load_coffee(file, files) {
  $.get(file, function(data){
    eval(CoffeeScript.compile(data))
  })
}

load_coffees([
  "/fivetastic/fivetastic",
  "/coffee/app"
])