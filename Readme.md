# FiveTastic
### CoffeeScript, Sass and HAML at your disposal 
### the content it's static - you can deploy everywhere!

### Intro:

To start your own site/app with FiveTastic:

- fork/download fivetastic (forking is good so you can update to the latest version fairly easily)
   

type this in the fivetastic folder:

    rackup



note: if you don't have rack

    gem install bundler
    bundle install

in the app's folder

### Deploy:

host it on your usual web server (apache, nginx etc) by putting this in your .htaccess or virtualhost

apache:

    TODO: apache vhost

nginx:

    TODO: apache vhost


### Guide:

What to edit:

all the files outside fivetastic folder are your app!

so to edit the template/layout you want to go to:

    haml/layout.haml

for the default page:

    haml/index.haml


### Routes

TODO: Routing system to be defined.... 

need support:
- routes
- history push/popState
- seo requests (ruby-rack/php fallback)


### Features:

- Coffeescript
- Haml
- Sass

### Features (to be implemented):

- service to host sites/apps easily


### Easy hosting!

It's static! host it everywhere!

You can apache, nginx etc..

### dev mode:

To spawn the server in development mode:

    rackup

you may need first to:

    gem install rack 


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
haml: https://github.com/uglyog/clientside-haml-js/tree/master/lib
jquery: https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js


### TODO:

- update vendored files


## Contributing:

- fork the project, make changes
- run tests in your browser (fivetastic/spec/all.html) 
- send me a pull request


### things to know

if you make changes to javascript files, run:

    rake compile_js

to update vendor/all.js that contains all vendored libs and init.js, all in one file
(for coffee files is not needed because they're compiled clientside)
  
  
### run specs:

the specs are made with Jasmine and Coffeescript, and are contained in the following file:

    /fivetastic/spec/fivetastic_spec.coffee


go to this url to run them:

    http://localhost:3000/fivetastic/spec/all.html