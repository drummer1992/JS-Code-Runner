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

      //use console.log to debug your ServerCode
      console.log(`${reviews.data.length} reviews found`);

      if (reviews.data.length === 0) {
        throw new Error(`No reviews found for [${movie}] movie` );
      }

      let totalStars = 0;

      reviews.data.forEach( review => totalStars += review.stars);

      return totalStars / reviews.data.length;
    },

    //You can omit this part if you don't want to wrap a lookup error into a specific error message
    //Also it is redundant to print the error using console.log for debug because the Code Runner will do this anyway
    err => {
      throw new Error('Movie lookup failed');
    }
  );
});