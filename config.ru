path = File.expand_path "../", __FILE__

require "#{path}/fivetastic"

# require 'rack/contrib'  
# use Rack::StaticCache, :urls => [ '*' ], :root => 'public'

# use Rack::Cache,
#   :verbose     => true,
#   :metastore   => 'file:tmp/cache/rack/meta',
#   :entitystore => 'file:tmp/cache/rack/body'

run Fivetastic

# Rack::Handler::WEBrick.run(
#   MyApp.new, 
#   Port: 3000
# )