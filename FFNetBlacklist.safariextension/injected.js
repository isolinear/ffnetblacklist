var blacklist_reveal = false;

function injectedSetup()
{
    document.addEventListener("contextmenu", handleContextMenu, false);
    safari.self.addEventListener("message", handleExtensionMessage, false);
    safari.self.tab.dispatchMessage("get-blacklist","");
    safari.self.tab.dispatchMessage("get-blacklist-reveal","");
}

function handleExtensionMessage(msg_event) {

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
    if (!blacklist || (!blacklist["users"] && !blacklist["stories"]))
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
    var storyNodesResult = document.evaluate("./div[a[starts-with(@href,'/s/')]]", contentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)
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
                }
            }
        }
        else if (authorLinkNode)
        {
            authorID = extractIDFromPathname(authorLinkNode.pathname);
            if (authorID)
            {
                if (authorID in blacklist["users"])
                {
                    blacklistStory(storyMode);
                }
            }
        }
    }
}

function changeBlacklistMode()
{
    console.log("Got here with");
    console.log(blacklist_reveal);
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
        console.log(storyNode);
        storyNode.setAttribute("class", storyNode.getAttribute("class").replace(blacklistClass(!blacklist_reveal), blacklistClass(blacklist_reveal)));
    }
}

function extractIDFromPathname(pathname)
{
    var path_id = pathname.substring(3);
    path_id = path_id.substring(0, path_id.indexOf("/"));
    return path_id;

}

function blacklistStory(storyNode)
{
    storyNode.setAttribute("class", storyNode.getAttribute("class")+" "+blacklistClass(blacklist_reveal));
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

function handleContextMenu(event) {
    var pathname = extractTargetStoryOrAuthorPath(event.target);
    if (pathname)
    {
        safari.self.tab.setContextMenuEventUserInfo(event, {"mode":"menu-add", "pathname":pathname});
        console.log(pathname);
    }
    else
    {
        console.log("Fail");
        console.log(event.target);
    }
}

if (window.top === window)
{
    injectedSetup();
}
