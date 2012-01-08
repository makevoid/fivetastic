path = File.expand_path "../../../", __FILE__

require 'bundler/setup'
Bundler.require :default, :test
require 'capybara/rspec'
Capybara.javascript_driver = :webkit
# Capybara.default_wait_time = 2
# Capybara.app_host = 'http://www.google.com'
# Capybara.run_server = false

require "#{path}/fivetastic"
Capybara.app = Fivetastic
