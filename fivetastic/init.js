function load_coffee(file) {
  $.get(file, function(data){
    eval(CoffeeScript.compile(data))
  })
}


load_coffee('/fivetastic/fivetastic.coffee')
load_coffee('/coffee/app.coffee')

// console.log(window.asd)

