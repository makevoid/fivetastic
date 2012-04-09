var coffees = []

function load_coffees(files) {
  _.each(files, function(file){
    load_coffee(file, files)
  })
}

function load_coffee(file, files) {
  coffees.push({ file: file, loaded: false, index: coffees.length })
  $.get(file+".coffee", function(data){
    var coffee = _(coffees).find(function(coffee){
      return coffee.file == file
    })
    coffee.loaded = true
    coffee.data = CoffeeScript.compile(data)
    coffee_loaded()
  })
}

function coffee_loaded() {
  var all_loaded = _(coffees).all(function(coffee){ return coffee.loaded })
  if (all_loaded) {
    _(coffees).sortBy(function(coffee){ return coffee.index })
    _(coffees).each(function(coffee){
      eval(coffee.data)
    })
  }
}

load_coffees([
  "/fivetastic/fivetastic",
  "/coffee/app"
])