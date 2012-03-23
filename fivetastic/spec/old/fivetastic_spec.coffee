
describe( "Jasmine", ->
  
  it "should setup the specs", ->
    window.hide_fivetastic()
  
  it "should launch fivetastic", ->
    events_text = $("#events").html()
    expect(events_text).toMatch /FiveTastic/

  it "should load index page", ->
    events_text = $("#events").html()
    expect(events_text).toMatch /Hello World/
      
  # it "should load a haml page", ->
  #   fivetastic.load_page "index", ->
  #     events_text = $("#events").text()
  #     expect(events_text).toMatch /Hello World/
  #     
  # it "should load a static page", ->
  #   fivetastic.load_page "index", ->
  #     events_text = $("#events").text()
  #     expect(events_text).toMatch /Hello World/
    
  
    
)