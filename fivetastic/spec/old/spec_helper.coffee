beforeEach ->
  @addMatchers toBePlaying: (expectedSong) ->
    player = @actual
    player.currentlyPlayingSong is expectedSong and player.isPlaying