var blacklist_reveal = false;

function injectedSetup()
{
    document.addEventListener("contextmenu", handleContextMenu, false);
    safari.self.addEventListener("message", handleExtensionMessage, false);
    document.addEventListener('visibilitychange', handleVisibilityChange, false);
    runBlacklist = runOnce(runBlacklist);
    if (!document.hidden)
    {
        runBlacklist();
    }
    
}

function handleVisibilityChange()
{
    if (!document.hidden)
    {
        runBlacklist();
    }
}

function runOnce(fn) {
    var called = false;
    return function() {
        if (!called) {
            called = true;
            return fn();
        }
        return;
    }
}

function runBlacklist()
{
    console.log("retrieving blacklist");
    safari.self.tab.dispatchMessage("get-blacklist","");
    safari.self.tab.dispatchMessage("get-blacklist-reveal","");
}

function createDownloadLink(id, title, data, filename)
{

    var downloadLink = document.createElement("a");
    var dataStr = "data:text/json;charset=utf-8," + data;
    downloadLink.setAttribute("href",     dataStr     );
    downloadLink.setAttribute("download", filename);
    downloadLink.id = id;
    downloadLink.innerHTML = title;
    return downloadLink;
}


//
// function blacklistToSafariBlocklist(blacklist)
// {
//     var story_ids = Object.keys(blacklist['ao3_stories']);
//     var story_selectors = story_ids.map(
//         function(id) {
//             return "li#work_"+id;
//         }
//     );
//     var block_rule = {
//         "trigger": {
//             "url-filter": ".*",
//             "if-domain":["*archiveofourown.org"]
//         },
//         "action": {
//             "type": "css-display-none",
//             "selector": story_selectors.join(", ")
//         }
//     };
//     return JSON.stringify([block_rule]);
// }

function handleExtensionMessage(msg_event)
{

    if (window.top === window)
    {
        if (msg_event.name === "blacklist-updated") 
        {
            var blacklist = msg_event.message;
            checkForBlacklistedStories(blacklist);
        }
        else if (msg_event.name === "blacklist-reveal-updated")
        {
            blacklist_reveal = msg_event.message;
            changeBlacklistMode();
        }
        else if (msg_event.name === "display-raw-blacklist")
        {
            if(msg_event.message["show"])
            {
                var popup = document.createElement('div');
                popup.id = 'ffmessage';
                popup.innerHTML = "'" + msg_event.message["blacklist_raw"] + "'";
                var actions = document.createElement('div');
                actions.id = "ffactions";
                popup.appendChild(actions);
                var downloadLink = createDownloadLink("ffdownload", "Download Backup", encodeURIComponent(msg_event.message["blacklist_raw"]), "blacklist.json")
                actions.appendChild(downloadLink);
                var exportLink = createDownloadLink("ffexportsafari", "Export Safari", encodeURIComponent(msg_event.message['blacklist_content_blocker']), "blockerList.json")
                actions.appendChild(exportLink);

                var body = document.getElementsByTagName('body')[0];
                if (body)
                {
                    body.insertBefore(popup, body.children[0]);
                    // actions.insertBefore(downloadLink, actions.children[0]);
                }
                
            }
            else
            {
                var target = document.getElementById("ffmessage");
                if (target)
                    target.parentNode.removeChild(target);
            }
            
        }      
    }

}

function blacklistClass(reveal)
{
    if (reveal === null)
    {
        reveal = blacklist_reveal;
    }
    var hideClass = "ffblacklist-hide";
    if (reveal)
    {
        hideClass = "ffblacklist-grayout";
    }
    return hideClass;
}

function checkForBlacklistedStories(blacklist)
{
    if (window.document.baseURI.includes("www.fanfiction.net"))
    {
        return checkForBlacklistedStoriesFFNet(blacklist);
    }
    else if(window.document.baseURI.includes("archiveofourown.org"))
    {
        return checkForBlacklistedStoriesAO3(blacklist)
    }
}

function checkForBlacklistedStoriesAO3(blacklist)
{
    if (!blacklist || (!blacklist["ao3_authors"] && !blacklist["ao3_stories"]))
    {
        console.log("Blacklist empty");
        console.log(blacklist);
        return;
    }
    var contentNode = document.getElementById("main");
    if (!contentNode)
    {
        return;
    }
    var storyNodesResult = document.evaluate("./ol/li[contains(@class, 'work') or contains(@class, 'bookmark')]", contentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    for (var i=0; i<storyNodesResult.snapshotLength; i++)
    {
        var storyNode = storyNodesResult.snapshotItem(i);
        var storyLinkNode = document.evaluate("./div/h4[contains(@class, 'heading')]/a[contains(@href,'/works/')]", storyNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        var authorLinkNode = document.evaluate("./div/h4[contains(@class, 'heading')]/a[contains(@rel,'author')]", storyNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        var storyID = "";
        var authorID = "";

        if (storyLinkNode)
        {
            storyID = extractAO3WorkIDFromPathname(storyLinkNode.pathname);
            if (storyID)
            {
                if (storyID in blacklist["ao3_stories"])
                {
                    blacklistStory(storyNode);
                    continue; // don't bother checking author if it's already blocked by story ID
                }
                else if (storyNode.getAttribute("class").indexOf(blacklistClass(blacklist_reveal)) !== 0)
                {
                    storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(blacklist_reveal), ""));
                }
            }

        }
        if (authorLinkNode)
        {
            authorID = extractAO3WorkIDFromPathname(authorLinkNode.pathname);
            if (authorID)
            {
                if (authorID in blacklist["ao3_authors"])
                {
                    blacklistStory(storyNode);
                }
                else if (storyNode.getAttribute("class").indexOf(blacklistClass(blacklist_reveal)) !== 0)
                {
                    storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(blacklist_reveal), ""));
                }
            }
        }
    }
}

function checkForBlacklistedStoriesFFNet(blacklist)
{

    if (!blacklist || (!blacklist["authors"] && !blacklist["stories"]))
    {
        console.log("Blacklist empty");
        console.log(blacklist);
        return;
    }
    var contentNode = document.getElementById("content_wrapper_inner");
    if (!contentNode)
    {
        return;
    }
    var storyNodesResult = document.evaluate("./div[a[starts-with(@href,'/s/')]]", contentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    for (var i=0; i<storyNodesResult.snapshotLength; i++)
    {
        var storyNode = storyNodesResult.snapshotItem(i);
        var storyLinkNode = document.evaluate("./a[starts-with(@href,'/s/')]", storyNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        var authorLinkNode = document.evaluate("./a[starts-with(@href,'/u/')]", storyNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        var storyID = "";
        var authorID = "";

        if (storyLinkNode)
        {
            storyID = extractIDFromPathname(storyLinkNode.pathname);
            if (storyID)
            {
                if (storyID in blacklist["stories"])
                {
                    blacklistStory(storyNode);
                    continue; // don't bother checking author if it's already blocked by story ID
                }
                else if (storyNode.getAttribute("class").indexOf(blacklistClass(blacklist_reveal)) !== 0)
                {
                    storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(blacklist_reveal), ""));
                }
            }

        }
        if (authorLinkNode)
        {
            authorID = extractIDFromPathname(authorLinkNode.pathname);
            if (authorID)
            {
                if (authorID in blacklist["authors"])
                {
                    blacklistStory(storyNode);
                }
                else if (storyNode.getAttribute("class").indexOf(blacklistClass(blacklist_reveal)) !== 0)
                {
                    storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(blacklist_reveal), ""));
                }
            }
        }
    }
}

function changeBlacklistMode()
{
    if (window.document.baseURI.includes("www.fanfiction.net"))
    {
        return changeBlacklistModeFFNet();
    }
    else if(window.document.baseURI.includes("archiveofourown.org"))
    {
        return changeBlacklistModeAO3()
    }
}

function changeBlacklistModeAO3()
{
    var contentNode = document.getElementById("main");
    if (!contentNode)
    {
        console.log("Fail");
        return;
    }
    var storyNodesResult = document.evaluate("./ol/li[contains(@class, '" + blacklistClass(!blacklist_reveal) + "')]", contentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    var storyNode;
    for (var i=0; i<storyNodesResult.snapshotLength; i++)
    {
        storyNode = storyNodesResult.snapshotItem(i);
        storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(!blacklist_reveal), blacklistClass(blacklist_reveal)));
    }
}

function changeBlacklistModeFFNet()
{
    var contentNode = document.getElementById("content_wrapper_inner");
    if (!contentNode)
    {
        console.log("Fail");
        return;
    }
    var storyNodesResult = document.evaluate("./div[contains(@class, '" + blacklistClass(!blacklist_reveal) + "')]", contentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    var storyNode;
    for (var i=0; i<storyNodesResult.snapshotLength; i++)
    {
        storyNode = storyNodesResult.snapshotItem(i);
        storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(!blacklist_reveal), blacklistClass(blacklist_reveal)));
    }
}

function extractIDFromPathname(pathname)
{
    var path_id = pathname.substring(3);
    path_id = path_id.substring(0, path_id.indexOf("/"));
    return path_id;

}

function extractAO3WorkIDFromPathname(pathname)
{
    if (pathname.includes("works"))
    {
        var work_id = /works\/(\d+)/.exec(pathname);
        if (work_id)
        {
            return work_id[1];
        }
        else
        {
            return null;
        }
    }
    else if (pathname.includes("users"))
    {
        return pathname;
    }
    return null;
}


function blacklistStory(storyNode)
{
    if (storyNode.getAttribute("class").indexOf(blacklistClass(blacklist_reveal)) !== 0)
    { 
        storyNode.setAttribute("class", storyNode.getAttribute("class")+" "+blacklistClass(blacklist_reveal)); 
    }
}

function extractTargetStoryOrAuthorPath(target)
{
    var pathname = "";
    if (!target)
    {
        return "";
    }
    if (target.nodeName === "A")
    {
        pathname = target.pathname;
    }    
    else if (target.nodeName === "DIV" || target.nodeName === "SPAN")
    {
        var storyLinkNode = document.evaluate("../a[starts-with(@href,'/s/')]", target, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        if (!storyLinkNode)
        {
            storyLinkNode = document.evaluate("../../a[starts-with(@href,'/s/')]", target, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
            if (!storyLinkNode)
            {
                storyLinkNode = document.evaluate("../../../a[starts-with(@href,'/s/')]", target, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
            }
        }
        if (storyLinkNode)
        {
            pathname = storyLinkNode.pathname;
        }
        
    }

    return pathname;
}

function extractAO3TargetStoryOrAuthorPath(target)
{
    var pathname = "";
    if (!target)
    {
        return "";
    }
    if (target.nodeName === "A")
    {
        var storyNode = document.evaluate("./ancestor::li[(contains(@class, 'work') or contains(@class, 'bookmark')) and @role='article']", target, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        if (storyNode && (target.pathname.includes("/works/") || target.pathname.includes("/users/")))
            pathname = target.pathname;
    }
    else if (target.nodeName === "P" || target.nodeName === "BLOCKQUOTE")
    {
        var storyLinkNode = document.evaluate("./ancestor::li[(contains(@class, 'work') or contains(@class, 'bookmark')) and @role='article']//h4/a[contains(@href, '/works/')]", target, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        if (storyLinkNode)
        {
            pathname = storyLinkNode.pathname;
        }

    }

    return pathname;
}

function handleContextMenu(event)
{

    if (event.target.baseURI.includes("www.fanfiction.net"))
    {
        showFFNetContextMenu(event);
    }
    else if(event.target.baseURI.includes("archiveofourown.org"))
    {
        showAO3ContextMenu(event)
    }
}

function showFFNetContextMenu(event)
{
    var pathname = extractTargetStoryOrAuthorPath(event.target);
    if (pathname)
    {
        safari.self.tab.setContextMenuEventUserInfo(event, {"mode":"menu-add", "pathname":pathname, "baseURI":event.target.baseURI});
    }
    else
    {
        console.log("Context Fail");
        console.log(event.target);
    }
}

function showAO3ContextMenu(event)
{
    var pathname = extractAO3TargetStoryOrAuthorPath(event.target);
    if (pathname)
    {
        var data = {"mode":"menu-add", "pathname":pathname, "baseURI":event.target.baseURI};
        safari.self.tab.setContextMenuEventUserInfo(event, data);
    }
    else
    {
        console.log("Context Fail");
        console.log(event.target);
    }
}


if (window.top === window)
{

    //console.log("Injecting code...")
    injectedSetup();
}
