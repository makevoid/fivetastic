# $("body").append "<div id='events'></div>"
# events = $("#events")
# g = window
# g.fivetastic.start(events)


describe "FiveTastic", ->
  
  it "should load", ->
    # console.log FiveTastic
    expect(true).toEqual true
    setFixtures(sandbox({class: 'my-class'}))
    # $('#sandbox').myTestedClassRemoverPlugin()
    expect($('#sandbox')).toHaveClass('my-class')