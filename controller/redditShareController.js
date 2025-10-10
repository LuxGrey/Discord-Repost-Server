import { sendMessage } from '../discord.js';

const MAX_EMBEDS_PER_DISCORD_MESSAGE = 5;

export async function shareRedditPost(req, res) {
    // validate request body data
    if (!isRedditShareValid(req.body)) {
        res.status(400).send('Bad Request');
        return;
    }

    // build Discord message contents
    const messageContents = buildRedditMessageContents(req.body);

    // send the Discord messages
    for (const messageContent of messageContents) {
        await sendMessage(messageContent);
    }

    res.status(200).send('OK');
}

/**
 * Validates that the request body is in line with the expectations for a reddit share request
 * 
 * @param {Object} requestBody
 * @returns {boolean} true if the request body is valid, otherwise false
 */
function isRedditShareValid(requestBody) {
    // assert that requestBody has postUrl member
    if (!requestBody.postUrl) {
        console.error('Request body is missing postUrl');
        return false;
    }

    // assert that postUrl is a valid URL
    let url;
    try {
        url = new URL(requestBody.postUrl);
    } catch (err) {
        console.error('postUrl is not a valid URL:', requestBody.postUrl);
        return false;
    }

    // assert that postUrl is a reddit URL
    const redditDomainRegex = /^(www\.)?reddit\.com$/;
    if (!url.host.match(redditDomainRegex)) {
        console.error('postUrl is not a reddit URL:', requestBody.postUrl);
        return false;
    }

    // assert that postUrl is a reddit post URL
    const redditPostPathRegex = /^\/(r\/[A-Za-z0-9_]+|user\/[A-Za-z0-9_-]+)\/comments\/[a-z0-9]{6,8}(\/[^\/\s]*)?\/$/;
    if (!url.pathname.match(redditPostPathRegex)) {
        console.error('postUrl is not a reddit post URL:', requestBody.postUrl);
        return false;
    }

    // embedUrls is optional, but if it is present, it must be an array of one or more URLs
    const embedUrls = requestBody.embedUrls;
    if (embedUrls) {
        // assert that embedUrls is an array
        if (!Array.isArray(embedUrls)) {
            console.error('embedUrls must be an array');
            return false;
        }

        // assert that embedUrls contains 1 - 20 elements (reddit galleries only allow up to 20 images)
        if (embedUrls.length === 0 || embedUrls.length > 20) {
            console.error('embedUrls must contain 1 - 20 elements');
            return false;
        }

        // assert that all elements of the embedUrls array are valid URLs
        embedUrls.forEach((value) => {
            try {
                url = new URL(value);
            } catch (err) {
                console.error('Element in embedUrls is not a valid URL:', value);
                return false;
            }
        });
    }

    return true;
}

/**
 * Builds Discord message contents from the request body so that the reddit post contents will be properly displayed in Discord.
 * May build contents for multiple Discord messages if one does not suffice for displaying all post contents (relevant for reddit gallery posts).
 * 
 * @param {Object} requestBody
 * @returns {string[]} an array of strings that represent the intended contents for one or more Discord messages
 */
function buildRedditMessageContents(requestBody) {
    const postUrl = requestBody.postUrl;
    const embedUrls = requestBody.embedUrls;

    if (embedUrls) {
        // build the message to include the provided embed URLs alongside the reddit URL
        return buildCustomEmbedsMessageContents(postUrl, embedUrls);
    }

    // simple post without additional embed URLs, use rxddit URL for better embed
    return [buildRxdditUrl(postUrl)];
}

/**
 * Turns a reddit URL into a rxddit URL, which produces better embeds for reddit posts
 * 
 * @param {string} redditPostUrl
 * @returns {string} the converted URL
 */
function buildRxdditUrl(redditPostUrl) {
    const url = new URL(redditPostUrl);
    url.host = url.host.replace('e', 'x');
    return url.toString();
}

/**
 * Builds contents for one or more Discord messages based on the provided reddit post URL and embed URLs.
 * The content will start with the reddit post URL, enclosed in '<>' to prevent embed rendering in Discord, followed by
 * the provided embed URLs.
 * The embed URls will have custom link texts that enumerate the media.
 * Since a single Discord message can seemingly only render up to 5 URL-based embeds, embed URLs will be distributed onto multiple message strings as needed.
 * 
 * @param {string} redditPostUrl
 * @param {string[]} embedUrls
 * @returns {string[]} strings with contents intended for one Discord message each
 */
function buildCustomEmbedsMessageContents(redditPostUrl, embedUrls) {
    // initialize message contents with empty strings
    const amountMessages = Math.ceil(embedUrls.length / MAX_EMBEDS_PER_DISCORD_MESSAGE);
    const messageContents = new Array(amountMessages).fill('');

    // start first message with reddit link enclosed in '<>' to prevent an embed from being rendered for it in Discord
    messageContents[0] += `<${redditPostUrl}>\n`;

    let messageParts = [];
    let messageIndex = 0;
    for (let i = 0; i < embedUrls.length; i++) {
        // build Markdown-style link with custom link text
        messageParts.push(`[${i + 1}](${embedUrls[i]})`);
        if (messageParts.length === MAX_EMBEDS_PER_DISCORD_MESSAGE) {
            // assemble message parts into content for a single message and prepare to build the next message string

            // concatenate message parts with a single space between
            messageContents[messageIndex] += messageParts.join(' ');
            // reset messageParts array
            messageParts = [];
            // move messageIndex for next message
            messageIndex++;
        }
    }

    if (messageParts.length > 0) {
        // assemble left-over message parts
        messageContents[messageIndex] += messageParts.join(' ');
    }

    return messageContents;
}