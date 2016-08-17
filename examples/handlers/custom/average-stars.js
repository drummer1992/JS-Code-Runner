/* global Backendless */

'use strict';

// This is an example of custom event handler which accepts a string 'movie' parameter,
// and, using the Backendless SDK, retrieves the 'Review' table data,
// calculates the average star rating for the passed movie and returns it to the caller

Backendless.enablePromises();
Backendless.ServerCode.customEvent('movieRating', request => {
  const movie = request.args.movie;
  const query = {
    condition: `movie = '${movie}'`
  };

  return Backendless.Persistence.of('Review').find(query).then(
    reviews => {
      const totalReviews = reviews.data.length;
      const totalStars = reviews.data.reduce((memo, review) => memo + review.stars, 0);

      //use console.log to debug your server code
      console.log(`${totalReviews} reviews found with ${totalStars} stars in total`);

      if (totalReviews === 0) {
        throw new Error(`No reviews found for [${movie}] movie` );
      }

      return totalStars / totalReviews;
    },

    //You can omit this part if you don't want to wrap a lookup error into a specific error message
    //Also it is redundant to print the error using console.log for debug because the Code Runner will do this anyway
    err => {
      console.error(err);

      throw new Error('Movie lookup failed');
    }
  );
});