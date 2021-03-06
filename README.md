### Update

With the impending release of Safari 12 / MacOS 10.14 Mojave, developer-signed `.safariextz` extensions are no longer supported.  All Safari browser extensions must be converted to "App Extensions", which I assume must be submitted to the App Store for review and release.

For personal reasons, I am not able to release to the Mac App Store.  Therefore, this extension is no longer supported.  For the two of you (besides myself) who downloaded / used this extension, sorry.  Apple is actively hostile to Safari extension development, for some reason.

This repository will remain available for historical curiosity.


--

### README
Safari extension to allow blacklisting of stories and authors that you don't want to appear in a fandom search page.  Ever get annoyed that the pairing filters just don't quite filter out all the people you don't like?  If you use the Safari browser, install this extension, right-click on the link to the title of the story or the link to the author, and hit "blacklist story" or "blacklist author".  If you change your mind, go to Safari's extensions preferences and tick on "Temporarily reveal blacklisted stories" to allow you to unblacklist stories.

Double-click on the .safariextz file to install.

DISCLAIMER: This is experimental software (can't promise this won't break your browser).  No warranties and no guarantees at all that anything will work properly.

NOTICE: This extension stores settings in local storage.  If you delete local storage by resetting Safari, chances are all blacklist settings in this extension will be wiped as well. Back up your `~/Library/Safari/LocalStorage/` directory if this is a concern.

That said, currently tested on Safari 5.1, 7.0.1, under OS X 10.7, OS X 10.9. Works on current ff.net version as of Feb 17, 2014.  If ff.net updates its page look-and-feel, this plugin would have to be updated as well.

