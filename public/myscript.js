//TODO: Get Quote Header, Get/Display profile images on retweet/quotetweet
//TODO: Refactor code to make it pretty

$(function () {
    var socket = io();

    document.getElementById("start-stream").addEventListener("click", () => {
        newTopic = document.getElementById("topic").value
        socket.emit("topic", newTopic)
        socket.connect()
    })
    document.getElementById("stop-stream").addEventListener("click", () => {
        socket.disconnect()
    })

    //takes in tweet and body/head, returns linked version
    const addLinks = async (textToLink, section) => {
        textToLink = await addHttpsLinks(textToLink)
        textToLink = await addHashtagLinks(textToLink)
        let textAfterLinking = (section === 'body') ? 
            textToLink:
            `@${textToLink}`
        //console.log(textAfterLinking)
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

    //separate helper function for http based links in tweets due to differences in link destination
    //Might refactor later
    const addHttpsLinks = (textToLink) => {
        let textAfterLinking = textToLink
        let regex = new RegExp('https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)','g')
        let matches = textAfterLinking.match(regex)
        if( matches == null ){
            return textAfterLinking
        }else{
            matches.map((item, index) => {
                textAfterLinking = textAfterLinking.replace(`${item}`, `<a href="${item}">${item}</a>`)
            })
            return textAfterLinking
        }
    }

    const addHashtagLinks = (textToLink) => {
        let textAfterLinking = textToLink
        let regex = new RegExp('(?<=#)\\w+','g')
        let matches = textAfterLinking.match(regex)
        if( matches == null ){
            return textAfterLinking
        }else{
            matches.map((item, index) => {
                textAfterLinking = textAfterLinking.replace(`#${item}`, `<a href="https://twitter.com/hashtag/${item}">#${item}</a>`)
            })
            return textAfterLinking
        }
    }

    const addImages = (mediaObj) => {
        console.log(typeof(mediaObj))
        let imagesArray = []
        mediaObj.map((item, index) => {
            (item.type === "photo") ? 
                imagesArray.push(item.media_url):
                console.log('no image')
        })
        return imagesArray
    }

    const addQuoteTweet = async (tweet, tweetBody, tweetHead) => {
        quotedStatus = (tweet.quoted_status.extended_tweet == null) ?
            await addLinks(tweet.quoted_status.text, 'body'):
            await addLinks(tweet.quoted_status.extended_tweet.full_text, 'body')

        //TODO: handle images in tweet body and ReTweets
        userImage = `<img src=${tweet.user.profile_image_url_https} class="head__image"/>`

        let tweetMediaObj = ''
        let tweetImages = ''
        //regular tweet images
        if (tweet.extended_tweet && tweet.extended_tweet.extended_entities && tweet.extended_tweet.extended_entities.media) {
            tweetMediaObj = tweet.extended_tweet.extended_entities.media
        } else if(tweet.extended_entities && tweet.extended_entities.media) {
            tweetMediaObj = tweet.extended_entities.media
        }
        
        if(tweetMediaObj != ''){
            imagesArray = addImages(tweetMediaObj)
            imagesArray.map((item) => {
                tweetImages += 
                    `<a href="${item}">
                        <img src="${item}" class="body__image">
                    </a>`
            })
        }
        //quoted tweet's images
        let quotetweetMediaObj = ''
        let quotetweetImages = ''
        //images can be under extended_tweet.extended_entities, extended_tweet.entities, etc...
        //only extended_entities offers a media type so we will ignore the other paths for now
        if (tweet.quoted_status.extended_tweet && tweet.quoted_status.extended_tweet.extended_entities && tweet.quoted_status.extended_tweet.extended_entities.media) {
            quotetweetMediaObj = tweet.quoted_status.extended_tweet.extended_entities.media
        } else if(tweet.quoted_status.extended_entities && tweet.quoted_status.extended_entities.media) {
            quotetweetMediaObj = tweet.quoted_status.extended_entities.media
        }
        if(quotetweetMediaObj != ''){
            quoteImagesArray = addImages(quotetweetMediaObj)
            quoteImagesArray.map((item) => {
                quotetweetImages += 
                    `<a href="${item}">
                        <img src="${item}" class="body__image">
                    </a>`
            })
        }


        baseTweet = `
            <div class="tweet__container fadeInDown">
                <div class="tweet__header">
                    ${userImage}
                    <p>${tweetHead}</p> 
                </div>
                <p>${tweetBody}</p>
                ${tweetImages}
                    <div class="quote__tweet__container sub__container">
                        <div class="tweet__header">
                            <p>TODO: QUOTE HEADER</p>
                        </div>
                        <p>${quotedStatus}</p>
                        ${quotetweetImages}
                    </div>
            </div>`

        if(typeof(baseTweet) === 'string'){
            $('#messages').prepend(baseTweet);
        }
    }

    const addRetweet = async (tweet, tweetHead) => {
        let retweet = tweet.retweeted_status
        let retweetBody = (retweet.extended_tweet == null ) ?
            await addLinks(retweet.text, 'body'):
            await addLinks(retweet.extended_tweet.full_text, 'body')
        let retweetHead = await addLinks(retweet.user.screen_name, 'head')
        
        userImage = `<img src=${tweet.user.profile_image_url_https} class="head__image"/>`

        let tweetImages = ''
        let mediaObj = ''

        //TODO: mediaObj = [] see if array == null in addimage function
        if(tweet.retweeted_status.extended_tweet && tweet.retweeted_status.extended_tweet.extended_entities && tweet.retweeted_status.extended_tweet.extended_entities.media){
            mediaObj = tweet.retweeted_status.extended_tweet.extended_entities.media
        } else if(tweet.retweeted_status.extended_tweet && tweet.retweeted_status.extended_tweet.entities && tweet.retweeted_status.extended_tweet.entities.media){
            mediaObj = tweet.retweeted_status.extended_tweet.entities.media
        } else if(tweet.retweeted_status.extended_entities && tweet.retweeted_status.extended_entities.media){
            mediaObj = tweet.retweeted_status.extended_entities.media
        }
        if(mediaObj != ''){
            imagesArray = addImages(mediaObj)
            imagesArray.map((item) => {
                tweetImages += 
                    `<a href="${item}">
                        <img src="${item}" class="body__image">
                    </a>`
            })
        }

        baseTweet = `
            <div class="tweet__container fadeInDown">
                <div class="tweet__header">
                    ${userImage}
                    <p>${tweetHead}</p>
                </div>
                <p>Retweet:</p>
                    <div class="retweet__container sub__container">
                        <div class="tweet__header">
                            <p>${retweetHead}</p>
                        </div>
                        <p>${retweetBody}</p>
                        ${tweetImages}
                    </div>
            </div>`

        if(typeof(baseTweet) === 'string'){
            $('#messages').prepend(baseTweet);
        }
    }
    
    const addTweet = async (tweet, tweetBody, tweetHead) => {
        
        userImage = `<img src=${tweet.user.profile_image_url_https} class="head__image"/>`
        let tweetImages = ''
        let mediaObj = ''
        if (tweet.extended_tweet && tweet.extended_tweet.extended_entities && tweet.extended_tweet.extended_entities.media) {
            mediaObj = tweet.extended_tweet.extended_entities.media
        } else if(tweet.extended_entities && tweet.extended_entities.media) {
            mediaObj = tweet.extended_entities.media
        }
        
        if(mediaObj != ''){
            imagesArray = addImages(mediaObj)
            imagesArray.map((item) => {
                tweetImages += 
                    `<a href="${item}">
                        <img src="${item}" class="body__image">
                    </a>`
            })
        }
        
        baseTweet = `
            <div class="tweet__container fadeInDown">
                <div class="tweet__header">
                    ${userImage}
                    <p>${tweetHead}</p>
                </div>
                <p>${tweetBody}</p>
                ${tweetImages}
            </div>`

        if(typeof(baseTweet) === 'string'){
            $('#messages').prepend(baseTweet);
        }
    }

    //sort tweets by type
    const sortTweet = async (tweet) => {
        // basic prep of main text
        let tweetBody = (tweet.extended_tweet == null) ? 
            tweet.text: 
            tweet.extended_tweet.full_text
        let tweetHead = tweet.user.screen_name
        bodyLinked = await addLinks(tweetBody, 'body')
        headLinked = await addLinks(tweetHead, 'head')
        // tweets can be normal, retweets or quote tweets. Cannot have both a retweet and a quote tweet in one object
        if (tweet.retweeted_status){
            addRetweet(tweet, headLinked)
            
        } else if (tweet.quoted_status){
            addQuoteTweet(tweet, bodyLinked, headLinked)
        } else {
            addTweet(tweet, bodyLinked, headLinked)
        }
        console.log(tweet)
    }

    socket.on('tweets', function(tweet){
        let image = new Image()
        image.onload = setTimeout(() => {
            sortTweet(tweet)
        }, 10, tweet)
        image.src = tweet.user.profile_image_url_https
    });
})