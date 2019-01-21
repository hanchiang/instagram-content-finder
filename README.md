## Usage
1. Put usernames in `server/input/input.txt`, one username per line. Create `input.txt` if it doesn't exist.
2. Make sure [nodejs](https://nodejs.org/en/download/) is installed
3. Install project dependencies: `npm install`
4. Run `node server/index.js`
5. See the output in `server/output`. Each username has its own folder, with file name is the following format: `{numFollowers}-{averageLikes}-{averageComments}-(YYYYMMDD-HHmmss)`

## TODO
* Tidy up the spaghetti code someday(WIP)?
* Viral posts by likes
* Viral posts by comments
* Get followers list
  * display list of followers with more following than followers
  * display list of followers who are inactive
  * provide an option to unfollow
* Tests
* CI


## Notes
rhx_gis seems to be the same for every user