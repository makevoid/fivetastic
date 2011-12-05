# this project has a guardfile, it uses livereload for automatic browser reloading 
#
# gem install guard
# gem install guard-livereload
# guard

guard 'livereload' do
  watch(%r{views/.+\.(haml)})
  watch(%r{sass/.+\.(sass)})
  watch(%r{coffee/.+\.(coffee)})
  watch(%r{routes\.json})
  watch(%r{index\.html})
  watch(%r{fivetastic/spec/all\.html})
end


# more infos on livereload here: https://github.com/mockko/livereload