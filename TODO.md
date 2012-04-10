
### TODO:

- handle 404s
- seo 

easiest solution, reimplement it in ruby, host it with fiveapi.com to maximize results (this way should be fucking easy)!!!

- update codemirror
- support pushstate in IE8 trough https://github.com/balupton/history.js

- specs
- rewrite using better modularity

- editing preview
- full router support
- markdown support
- rake task to generate RapidWeaver Template
- update vendored files



### textmate integration (and sublimetext)

normal dev url

txmt:// ..

- textmate2 rmate integration ? 

txmt://open/?url=file://root@new.makevoid.com/.bash_profile&line=11&column=2



	commandline fiveapi edit that calls?
	ssh root@new.makevoid.com rmate /www/antani



### Public API 

- todo: define it and document it

example:

    resource = "articles"

    load(resource)

    load(resource)
      spinner("on")
      request ->
        spinner("off")

    with: extension

    load(resource, { transition: "fade" })



options:
  
    transition: transition

    transitions: ["in", "out"], ["fade", ["slide", "direction"], "explode?", "text blur"]
