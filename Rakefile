path = File.expand_path "../", __FILE__

task :default => [:compile_js]

desc "Compiles js for faster page load"
task :compile_js do
  all = "#{path}/fivetastic/vendor/all.js"
  `rm -f #{all}`
  file = File.open all, "w"
  vendor = []
  Dir.glob("#{path}/fivetastic/vendor/*/*.js").each do |f|
    vendor << f
  end
  vendor += Dir.glob("#{path}/fivetastic/vendor/*.js")
  # comment this to exclude files
  vendor = vendor - ["#{path}/fivetastic/vendor/codemirror.js"]
  vendor = vendor - ["#{path}/fivetastic/vendor/all.js"]
  vendor = vendor - ["#{path}/fivetastic/vendor/jquery.js"]
  # vendor = vendor - ["#{path}/fivetastic/vendor/zepto.js"]

  # debugging
  # file.puts "var date = new Date();"
  vendor.each do |f|
    puts f
    # file.puts "console.log('loading #{f[51..-1]} ' + new Date() - date);"
    file.puts File.read(f)
  end
  file.puts File.read("#{path}/fivetastic/init.js")
  file.close
end

task :spec do
  cmd = "cd fivetastic; time rspec spec"
  puts "Running: #{cmd}"
  puts `#{cmd}`
end

task :spec_js do
  cmd = "cd fivetastic; time jasmine-headless-webkit -j spec/jasmine.yml -c"
  puts "Running: #{cmd}"
  puts `#{cmd}`
end