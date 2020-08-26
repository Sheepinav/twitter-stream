$(function () {
    var socket = io();

    //takes in tweet and body/head, returns linked version
    const addLinks = (tweet, textToLink, section) => {
        let textAfterLinking = (section === 'body') ? 
            textToLink:
            `@${textToLink}`
        let regex = new RegExp('(?<=@)\\w+','g')
        let matches = textAfterLinking.match(regex)
        if( matches == null ){
            return textAfterLinking
        }else{
            matches.map((item, index) => {
                textAfterLinking = textAfterLinking.replace(`@${item}`, `<a href="https://twitter.com/${item}">@${item}</a>`)
            })
            return textAfterLinking
        }
    }

    const addImages = (tweet) => {
        // TODO: Fill in
    }

    const addQuoteTweet = async (tweet, tweetBody, tweetHead) => {
        quotedStatus = (tweet.quoted_status.extended_tweet == null) ?
            await addLinks(tweet.quoted_status, tweet.quoted_status.text, 'body'):
            await addLinks(tweet.quoted_status, tweet.quoted_status.extended_tweet.full_text, 'body')
        console.log(quotedStatus)

        //TODO: handle images in tweet body and ReTweets
        userImage = `<img src=${tweet.user.profile_image_url_https} />`

        baseTweet = `
            <div class="tweet__container">
                <div>
                    ${userImage}
                    <p>${tweetHead}</p>
                    <p>${tweetBody}</p>
                    <div class="quote_tweet_container">
                        <p>${quotedStatus}
                    </div>
                </div>
            </div>`

        if(typeof(baseTweet) === 'string'){
            $('#messages').prepend(baseTweet);
        }

    }
    const addRetweet = async (tweet, tweetHead) => {
        
        let retweet = tweet.retweeted_status
        // let retweetBody = (tweet.extended_tweet == null) ? 
        //     retweet.text:
        //     retweet.extended_tweet.full_text
        let retweetBody = (retweet.extended_tweet == null ) ?
            await addLinks(retweet, retweet.text, 'body'):
            await addLinks(retweet, retweet.extended_tweet.full_text, 'body')
        let retweetHead = await addLinks(retweet, retweet.user.screen_name, 'head')
        

        //TODO: handle images in tweet body and ReTweets
        userImage = `<img src=${tweet.user.profile_image_url_https} />`

        baseTweet = `
            <div class="tweet__container">
                <div>
                    ${userImage}
                    <p>${tweetHead}</p>
                    <p>Retweet:</p>
                    <div class="retweet_container">
                        <p>${retweetHead}</p>
                        <p>${retweetBody}</p>
                    </div>
                </div>
            </div>`

        if(typeof(baseTweet) === 'string'){
            $('#messages').prepend(baseTweet);
        }
    }
    
    const addTweet = async (tweet, tweetBody, tweetHead) => {
        //TODO: handle images in tweet body and ReTweets
        userImage = `<img src=${tweet.user.profile_image_url_https} />`

        baseTweet = `
            <div class="tweet__container">
                <div>
                    ${userImage}
                    <p>${tweetHead}</p>
                    <p>${tweetBody}</p>
                </div>
            </div>`

        if(typeof(baseTweet) === 'string'){
            $('#messages').prepend(baseTweet);
        }
        console.log(tweet)
    }

    const sortTweet = async (tweet) => {
        // basic prep of main text
        let tweetBody = (tweet.extended_tweet == null) ? 
            tweet.text: 
            tweet.extended_tweet.full_text
        let tweetHead = tweet.user.screen_name
        bodyLinked = await addLinks(tweet, tweetBody, 'body')
        headLinked = await addLinks(tweet, tweetHead, 'head')
        // tweets can be normal, retweets or quote tweets. Cannot have both a retweet and a quote tweet in one object
        if (tweet.retweeted_status != null){
            addRetweet(tweet, headLinked)
        } else if (tweet.quoted_status != null){
            addQuoteTweet(tweet, bodyLinked, headLinked)
        } else {
            addTweet(tweet, bodyLinked, headLinked)
        }
    }

    socket.on('tweets', function(tweet){
        let image = new Image()
        image.onload = setTimeout(() => {
            sortTweet(tweet)
        }, 10, tweet)
        image.src = tweet.user.profile_image_url_https
    });
})