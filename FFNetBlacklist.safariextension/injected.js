function injectedSetup()
{
    document.addEventListener("contextmenu", handleContextMenu, false);
    safari.self.addEventListener("message", handleExtensionMessage, false);
    safari.self.tab.dispatchMessage("get-blacklist","");
}

function handleExtensionMessage(msg_event) {

    if (msg_event.name === "blacklist-updated") 
    {
        var blacklist = msg_event.message;
        checkForBlacklistedStories(blacklist);
    }
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
        var storyNode = storyNodes.snapshotItem(i);

    }
}

function blacklistStory(storyNode)
{

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

injectedSetup();