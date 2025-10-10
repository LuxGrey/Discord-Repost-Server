# Discord Repost Server

This is a Node.js server application that helps with sharing media from other websites on Discord.
It is intended to be used together with a compatible client, namely:

* [Discord Repost Browser Extension](https://github.com/LuxGrey/Discord-Repost-Browser-Extension)

This server application exists so that client applications may use the provided functionalities without requiring knowledge of some sensitive secrets
(Discord webhook URL, Discord bot token, etc.).

As of now this application is only able to share reddit posts in Discord server channels and is only able to do so using a webhook URL.
Further features and changes to how this application is used may follow.

## Requirements

* Node.js
* npm or equivalent
* host must have an open HTTP port to receive share commands

## Usage

Create a `.env` file in the app's root directory, based on `.env.sample`, and make the following adjustments:

* `DISCORD_WEBHOOK_URL` = the URL of the [Discord webhook](https://discord.com/developers/docs/resources/webhook) for the channel that media should be posted to

Start the app with `npm start`.
Once it is running, you can prompt the server to send Discord messages by sending requests to the REST-API, ideally using a compatible client.

### REST-API

#### Share a reddit post

`POST /api/share/reddit`

JSON-Body:

```json
{
    "postUrl":"<postUrl>",
    "embedUrls": [
        "<embedUrl1>",
        "<embedUrl2>"
    ]
}
```

* `<postUrl>` may be the URL of a subreddit post (i.e. `www.reddit.com/r/<subreddit>/comments/<postId>/<postTitle>/`)
or a user profile post (i.e. `www.reddit.com/user/<user>/comments/<postId>/<postTitle>/`)
* `embedUrls` is an optional key; if provided, it must be a non-empty array
  * `<embedUrlN>` may be any URL that should be posted alongside the reddit post URL in order to provide an alternative embed

## Security

The server application itself only supports HTTP and not HTTPS.
There are also no authorization checks in place to limit who can prompt the bot; if not otherwise prevented, anyone with knowledge of the IP address of the server can prompt it to send Discord messages to the configured channel.

To address the above points, it is recommended to place the server application behind a reverse proxy to allow/force clients to make requests using HTTPS and to limit which clients can make use of the application's functionalities through appropriate authorization checks.
