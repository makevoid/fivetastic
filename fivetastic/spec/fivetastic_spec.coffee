describe "Fivetastic", ->
  beforeEach ->
    @five = new Fivetastic()
  
  it "defaults to prod mode", ->
    expect(@five.mode).toEqual "prod"
  
  describe "start", ->
    it "loads routes", ->
      expect(@five.router.routes).toEqual "prod"
        
  describe "Config", ->
    it "has defaults routes path", ->
      conf = new Fivetastic.Config()
      expect(conf.routes).toEqual "routes.json"

  describe "Router", ->
    it "set routes", ->
      router = new Fivetastic.Router()
      router.set { "/": "index" }
      expect(router.routes).toEqual [{url: "/", file: "index"}]
          
    # it "load routes", ->
    #   router = new Fivetastic.Router()
    #   router.load()
    #   expect(router.routes).toEqual ["loaded"]