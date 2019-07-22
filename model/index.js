
class UserViral {
  constructor() {
    // viral info
    this.currScrapeCount = 0;
    this.posts = [];
    this.viralPosts = [];
    // user info
    this.userId = '';
    this.username = '';
    this.numPosts = '';
    this.numFollowers = 0;
    this.numFollowing = 0;
    this.averageLikes = 0;
    this.averageComments = 0;
    this.medianLikes = 0;
    this.medianComments = 0;
    this.totalLikes = 0;
    this.totalComments = 0;
    // from window._sharedData object in user profile page
    this.userSharedData = {};
    // User-specific data from userSharedData
    this.userWebData = {};
  }

  init() {
    this.currScrapeCount = 0;
    this.posts = [];
    this.viralPosts = [];
    this.userId = '';
    this.username = '';
    this.numPosts = 0;
    this.numFollowers = 0;
    this.numFollowing = 0;
    this.averageLikes = 0;
    this.averageComments = 0;
    this.medianLikes = 0;
    this.medianComments = 0;
    this.totalLikes = 0;
    this.totalComments = 0;
    this.rhxGis = '';
    this.userSharedData = {};
    this.userWebData = {};
  }
}

module.exports = UserViral;
