# FiveTastic
### CoffeeScript, Sass and HAML at your disposal 
### the content it's static - you can deploy everywhere!


### Features:

- Coffeescript
- Haml
- Sass

### Features (to be implemented):

- service to host sites/apps easily


### Easy hosting!

It's static! host it everywhere!

I like to use this in dev:

    python -m SimpleHTTPServer 3000

on apache, nginx etc..

### dev mode (to be implemented):

    ruby config.ru


### default folders and files:

    / 
    /assets/
      app.css
      app.js
      imgs
    /coffee/
      app.coffee
    /haml/
      index.haml
      layout.haml
    /sass/
      app.sass
      mixins.sass


### vendored files:

coffeescript: http://jashkenas.github.com/coffee-script/extras/coffee-script.js
haml: https://raw.github.com/creationix/haml-js/master/lib/haml.js
jquery: https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js


### TODO:

- sass support (with reloading)
- update vendored files
  