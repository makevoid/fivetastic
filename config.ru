path = File.expand_path "../", __FILE__

require "#{path}/fivetastic"

run Fivetastic

# Rack::Handler::WEBrick.run(
#   MyApp.new, 
#   Port: 3000
# )