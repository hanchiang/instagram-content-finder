## Usage
1. Clone the repository: `git clone https://github.com/hanchiang/instagram-content-finder.git`. Install [git](https://git-scm.com/downloads) if it is not already installed
1. Put the instagram usernames in `input/input.txt`, one username per line. Create `input.txt` if it doesn't exist.
1. Make sure [nodejs](https://nodejs.org/en/download/) is installed
1. Install project dependencies: `npm install`
1. Run `node index.js`
1. See the output in `output`. Each username has its own folder, with file name is the following format: `{numFollowers}-{averageLikes}-{averageComments}-(YYYYMMDD-HHmmss)`

## Features
* If page is private, skip
* If page has fewer than a certain number of posts, skip.
* Use number of likes as the metric for extracting viral posts. Optionally, comments can be used also.

**Configurable**  
* `NUM_TO_SCRAPE`: Number of posts to scrape
* `NUM_TO_CALC_AVERAGE_ENGAGEMENT`: Number to posts to use for calculating the median engagement rate of a user
* `VIRAL_THRESHOLD`: The fraction of engagement that must be greater than the median engagement in order for a post to be considered as viral. e.g. `0.5 = (1 + 0.5) * median_engagement`
* `MIN_FOLLOWER`: *TBD*
* `MIN_POSTS`: *TBD*


## TODO
* Viral posts by likes and comments separately?
* Get followers list
  * display list of followers with more following than followers
  * display list of followers who are inactive
  * provide an option to unfollow
* Tests
* Refactor spaghetti code