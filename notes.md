### GAME FEATURES TO WORK ON

- [x] figure out the tech / parenting system
- [x] get some workers to carry some blocks to the pyramid & start stacking them!
 - [x] we can reverse engineer our pyramid draw algorithm to instead get the block placement required
- [x] add the other technology objects
- [x] Merge the pyramid geometry after layer finish. Need this to maintain 60fps as game progresses
- [x] work on interface to actually control the units, buy more, upgrade, etc
- [ ] win state (see below)
- [ ] remaining ENHANCEMENTS

### ENHANCEMENTS

- [x] orbit controls instead of automatic spinning would be nice
- [ ] fix the sand texture, maybe add some sand particles / dust stormy-ness, clouds could be cool
- [x] More detailed human model
- [ ] automatic save / loading with local storage

### QUESTIONS
- ~~What is the win state?~~
- ~~how do you aquire units?~~
- Leaderboard? What is the score to track, time spent?
 - Probably wont have time for this!


----

#### Win state
- All the units circle around the pyramid with torches
- Time goes to night (look at first commit & reuse some of that code)

#### Unit aquisition
- Click the something to get gold coins
- Either buy automated clickers OR buy a new unit
 - Units get increasingly more expensive
 - Same goes for clickers
- We'll theme the automated clickers around whatever we click



This is the WebGL Error which crashes the game?
GL_INVALID_OPERATION : glGenSyncTokenCHROMIUM: fence sync must be flushed before generating sync token
localhost/:1 WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost

I went for lunch, came back & it was dead :/

And again
WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost
This time tho i had two tabs open, and this says that could freak it out https://www.khronos.org/webgl/wiki/HandlingContextLost
