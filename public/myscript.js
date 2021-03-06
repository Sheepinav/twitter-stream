$(function () {
    var socket = io();

    document.getElementById("start-stream").addEventListener("click", () => {
        // disable start button before sending topic to backend
        document.getElementById("start-stream").disabled = true
        newTopic = document.getElementById("topic").value
        socket.emit("topic", newTopic)
        socket.connect()
    })

    document.getElementById("stop-stream").addEventListener("click", () => {
        // reenable start button before stopping stream
        document.getElementById("start-stream").disabled = false
        socket.disconnect()
    })

    const addMedia = (mediaObj) => {
        let mediaLinks = ''
        mediaObj.map(item => {
            (item.type === "photo") ? 
                mediaLinks += `<a href="${item.media_url}">
                        <img src="${item.media_url}" class="body__image">
                    </a>`:'';
            // shortened video url does not work in <video />, can workaround by using url to tweet and adding /video/1 to the end
            // (item.type === "video") ? 
            //     mediaLinks += `<a href="${item.media_url}">
            //             <video src="${item.media_url}" controls />
            //         </a>`:'';
        })
        return mediaLinks
    }

    const replaceText = (textToReplace, regex) => {
        let replacedText = textToReplace
        // replace text, works with links for now, can abstract later if needed
        Object.keys(regex).forEach(key => {
            let matches = textToReplace.match(regex[key].regex)
            console.log(matches)
            if(matches !== null){
                matches.map(item => {
                    replacedText = replacedText.replace(regex[key].text[0] + item + '', regex[key].text[1] + item + regex[key].text[2] + item + regex[key].text[3])
                    console.log(replacedText)
                })
            }
        })
        return replacedText
    }

    const addLinks = textToLink => {
        // regexObj contains details for all links, twitter @'s, external links, and hashtags
        regexObj = {
            userRefRegex: {
                regex: new RegExp('(?<=@)\\w+','g'), 
                text: ['@', '<a href="https://twitter.com/','">@','</a>']
            },
            httpRegex: {
                regex: new RegExp('https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)','g'),
                text:['', '<a href="', '">', '</a>']
            },
            hashtagRegex: {
                regex: new RegExp('(?<=#)\\w+','g'),
                text: ['#', '<a href="https://twitter.com/hashtag/', '">#', '</a>']
            }
        }
        return textToLink = replaceText(textToLink, regexObj)
    }

    const handleBaseTweet = (baseTweet, tweetData) => {
        // User profile image
        baseTweet.userImg = `<img src=${tweetData.user.profile_image_url_https} class="head__image"/>`
        // Split tweet into head and body and add links / images
        baseTweet.body = (tweetData.extended_tweet == null) ? addLinks(tweetData.text): addLinks(tweetData.extended_tweet.full_text)
        baseTweet.head = addLinks(`@${tweetData.user.screen_name}`)
        if (tweetData.extended_tweet && tweetData.extended_tweet.extended_entities && tweetData.extended_tweet.extended_entities.media) {
            baseTweet.imgs = addMedia(tweetData.extended_tweet.extended_entities.media)
        } else if(tweetData.extended_entities && tweetData.extended_entities.media) {
            baseTweet.imgs = addMedia(tweetData.extended_entities.media)
        }
        return baseTweet
    }

    const handleRetweet = (retweet, retweetData) => {
        // console.log(retweetData)
        // Retweeted user profile image
        retweet.userImg = `<img src=${retweetData.user.profile_image_url_https} class="head__image"/>`
        retweet.body = (retweetData.extended_tweet == null ) ? addLinks(retweetData.text): addLinks(retweetData.extended_tweet.full_text)
        retweet.head = addLinks(`@${retweetData.user.screen_name}`)
        // multiple pathways for media, TODO: see if this can be shortened
        if(retweetData.extended_tweet && retweetData.extended_tweet.extended_entities && retweetData.extended_tweet.extended_entities.media){
            retweet.imgs = addMedia(retweetData.extended_tweet.extended_entities.media)
        } else if(retweetData.extended_tweet && retweetData.extended_tweet.entities && retweetData.extended_tweet.entities.media){
            retweet.imgs = addMedia(retweetData.extended_tweet.entities.media)
        } else if(retweetData.extended_entities && retweetData.extended_entities.media){
            retweet.imgs = addMedia(retweetData.extended_entities.media)
        }
        return retweet
    }

    const handleQuoteTweet = (quoteTweet, quoteTweetData) => {
        quoteTweet.userImg = `<img src=${quoteTweetData.user.profile_image_url_https} class="head__image"/>`
        quoteTweet.body = (quoteTweetData.extended_tweet == null ) ? addLinks(quoteTweetData.text): addLinks(quoteTweetData.extended_tweet.full_text)
        quoteTweet.head = addLinks(`@${quoteTweetData.user.screen_name}`)
        // paths for media
        if (quoteTweetData.extended_tweet && quoteTweetData.extended_tweet.extended_entities && quoteTweetData.extended_tweet.extended_entities.media) {
            quoteTweet.imgs = addMedia(quoteTweetData.extended_tweet.extended_entities.media)
        } else if(quoteTweetData.extended_entities && quoteTweetData.extended_entities.media) {
            quoteTweet.imgs = addMedia(quoteTweetData.extended_entities.media)
        }
        return quoteTweet
    }

    const addTweet = async (tweetData) => {
        let Tweet = {
            // images are stored as image html after they are found
            baseTweet: {head:'', body:'', userImg: '', imgs:''},
            retweet: {head: '', body: '', userImg: '', imgs:''},
            quoteTweet: {head: '', body: '', userImg: '', imgs:''}
        }

        // Handle Base tweet links and images
        // Can only have one retweet or quote tweet - not both
        Tweet.baseTweet = await handleBaseTweet(Tweet.baseTweet, tweetData)
        if (tweetData.retweeted_status){
            Tweet.retweet = await handleRetweet(Tweet.retweet, tweetData.retweeted_status)
            Tweet.baseTweet.body = ''
            Tweet.baseTweet.imgs = ''
        } else if (tweetData.quoted_status){
            Tweet.quoteTweet = await handleQuoteTweet(Tweet.quoteTweet, tweetData.quoted_status)
        }

        let tweetContent = `
            <div class="tweet__container fadeInDown">
                <div class="tweet__header">
                    ${Tweet.baseTweet.userImg}
                    <p>${Tweet.baseTweet.head}</p>
                </div>
                <p>${Tweet.baseTweet.body}</p>
                ${Tweet.baseTweet.imgs}
                
                ${ ((Tweet.retweet.head !== '') ? `<p>Retweet:</p>
                    <div class="retweet__container sub__container">
                        <div class="tweet__header">
                            ${Tweet.retweet.userImg}
                            <p>${Tweet.retweet.head}</p>
                        </div>
                        <p>${Tweet.retweet.body}</p>
                        ${Tweet.retweet.imgs}
                    </div>`: '')}
                
                ${ ((Tweet.quoteTweet.head !== '') ? `
                    <div class="quote__tweet__container sub__container">
                        <div class="tweet__header">
                            ${Tweet.quoteTweet.userImg}
                            <p>${Tweet.quoteTweet.head}</p>
                        </div>
                        <p>${Tweet.quoteTweet.body}</p>
                        ${Tweet.quoteTweet.imgs}
                    </div>`: '')}
            </div>`

        if(typeof(tweetContent) === 'string'){
            $('#messages').prepend(tweetContent);
        }
    }

    socket.on('tweets', function(tweet){
        let image = new Image()
        image.onload = setTimeout(() => {
            addTweet(tweet)
        }, 10, tweet)
        image.src = tweet.user.profile_image_url_https
    });
})