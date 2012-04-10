path = File.expand_path "../", __FILE__

task :default => [:compile_js]

desc "Compiles js for faster page load"
task :compile_js do
  all = "#{path}/fivetastic/vendor/all.js"
  `rm -f #{all}`
  file = File.open all, "w"
  Dir.glob("#{path}/fivetastic/vendor/*/*.js").each do |f|
    file.puts File.read(f)
  end
  vendor = Dir.glob("#{path}/fivetastic/vendor/*.js")
  # comment this to exclude codemirror
  vendor = vendor - ["#{path}/fivetastic/vendor/codemirror.js"]
  # vendor = vendor - ["#{path}/fivetastic/vendor/jquery.js"]
  vendor = vendor - ["#{path}/fivetastic/vendor/zepto.js"]

  vendor.each do |f|
    file.puts File.read(f)
  end
  file.puts File.read("#{path}/fivetastic/init.js")
  file.close
end

task :spec do
  puts `cd fivetastic; time rspec spec`
end

task :spec_jasmine do
  puts "Hey! Run this command for executing the test suite:"
  puts "jasmine-headless-webkit -j fivetastic/spec/jasmine.yml"
end