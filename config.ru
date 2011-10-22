
require 'bundler/setup'
Bundler.require :default


class MyApp
  def call(env)
    path = File.expand_path "../", __FILE__
    body = File.read "#{path}/index.html"
    [200, { "Content-Type" => "text/html"}, [body]]
  end
end


run MyApp.new

# Rack::Handler::WEBrick.run(
#   MyApp.new, 
#   Port: 3000
# )