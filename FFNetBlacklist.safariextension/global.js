var blacklist;

function globalSetup()
{
    blacklist = localStorage.getItem("blacklist");
    if (blacklist)
    {
        blacklist = JSON.parse(blacklist);
        if (!blacklist["ao3_stories"])
        {
            blacklist["ao3_stories"] = {};
        }
        if (!blacklist["ao3_authors"])
        {
            blacklist["ao3_authors"] = {};
        }
    }
    else
    {
        blacklist = {"stories":{}, "authors":{}, "ao3_stories":{}, "ao3_authors":{}};
        //localStorage.blacklist = JSON.stringify(blacklist);
    }

    safari.application.addEventListener("message",processClientRequest,false);
    safari.application.addEventListener("contextmenu", handleContextMenu, false);
    safari.application.addEventListener("command", performCommand, false); 
    safari.extension.settings.addEventListener("change", settingChange, false);


}

function settingChange(event) 
{
    if (event.key === "reveal") 
    {
        notifyAllClients(event.newValue, "blacklist-reveal-updated");
    }
    else if (event.key === "raw") 
    {
        var data = {};
        if (event.newValue)
        {
            data = {"blacklist_raw":localStorage.getItem("blacklist"), "show":true, "blacklist_content_blocker":JSON.stringify(blacklistToSafariBlocklist(blacklist))};
        }
        else
        {
            data = {"show":false};
        }
        notifyAllClients(data, "display-raw-blacklist");
    }
}
 

function notifyClient(data, msgID, msgEvent)
{
    msgEvent.target.page.dispatchMessage(msgID, data);
}

function notifyAllClients(data, msgID)
{
    for (var i = 0; i < safari.application.browserWindows.length; i++)
    {
        var browserWindow = safari.application.browserWindows[i];
        for (var j = 0; j < browserWindow.tabs.length; j++)
        {
            var tab = browserWindow.tabs[j];
            if (tab && tab.page)
            {
                tab.page.dispatchMessage(msgID, data);
            }
        }
    }

}

function processClientRequest(msgEvent) {
    var uri;
    var response;
    if(msgEvent.name === "get-blacklist") {
        notifyClient(blacklist, "blacklist-updated", msgEvent);
    }
    else if (msgEvent.name === "get-blacklist-reveal")
    {
        notifyClient(safari.extension.settings.reveal, "blacklist-reveal-updated", msgEvent);
    }
    // else if (msgEvent.name === "add_to_blacklist")
    // {
    //     uri = msgEvent.message;
    // }
    // else if (msgEvent.name === "remove_from_blacklist")
    // {
    //     uri = msgEvent.message;
    // }
}

function handleContextMenu(event) 
{
    if (!event.userInfo)
    {
        // not an actual click on somewhere we've detected
        return;
    }
    var mode = event.userInfo["mode"];
    var site = event.userInfo["baseURI"]
    if (mode == "menu-add")
    {
        if (site.includes("fanfiction.net"))
        {
            handleFFNetContextMenu(event)
        }
        else if (site.includes("archiveofourown.org"))
        {
            handleAO3ContextMenu(event)
        }
        
    }

}

function handleFFNetContextMenu(event)
{

    var pathname = event.userInfo["pathname"];
    var targetID = extractIDFromPathname(pathname);
    if (pathname.indexOf("/s/") === 0)
    {
        if (targetID in blacklist["stories"])
        {
            event.contextMenu.appendContextMenuItem("unblacklist-story", "FFNet: Unblacklist story");
        }
        else
        {
            event.contextMenu.appendContextMenuItem("blacklist-story", "FFNet: Blacklist story");
        }

    }
    else if (pathname.indexOf("/u/") === 0)
    {
        if (targetID in blacklist["authors"])
        {
            event.contextMenu.appendContextMenuItem("unblacklist-author", "FFNet: Unblacklist author");
        }
        else
        {
            event.contextMenu.appendContextMenuItem("blacklist-author", "FFNet: Blacklist author");
        }

    }
}

function handleAO3ContextMenu(event)
{
    var mode = event.userInfo["mode"];
    var pathname = event.userInfo["pathname"];
    var targetID = extractAO3WorkIDFromPathname(pathname);
    console.log("p1", pathname);
    console.log(event.userInfo);
    if (pathname.indexOf("/works/") === 0)
    {
        if (targetID in blacklist["ao3_stories"])
        {
            event.contextMenu.appendContextMenuItem("unblacklist-story", "AO3: Unblacklist story");
        }
        else
        {
            event.contextMenu.appendContextMenuItem("blacklist-story", "AO3: Blacklist story");
        }

    }
    else if (pathname.indexOf("/users/") === 0)
    {
        if (targetID in blacklist["ao3_authors"])
        {
            event.contextMenu.appendContextMenuItem("unblacklist-author", "AO3: Unblacklist author");
        }
        else
        {
            event.contextMenu.appendContextMenuItem("blacklist-author", "AO3: Blacklist author");
        }

    }
}

function extractIDFromPathname(pathname)
{
    var path_id = pathname.substring(3);
    path_id = path_id.substring(0, path_id.indexOf("/"));
    return path_id;

}

function blacklistFFNetStory(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/s/") === 0)
    {
        target_id = extractIDFromPathname(pathname);
        if (target_id)
        {
            blacklist["stories"][target_id] = 1;
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }
        else
        {
            console.log("Failed to blacklist due to nonexistent target_id");
        }
    }
}

function blacklistFFNetAuthor(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/u/") === 0)
    {
        target_id = extractIDFromPathname(pathname);
        if (target_id)
        {
            blacklist["authors"][target_id] = 1;
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }

    }
}

function unblacklistFFNetStory(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/s/") === 0)
    {
        target_id = extractIDFromPathname(pathname);
        if (target_id && (target_id in blacklist["stories"]))
        {
            delete blacklist["stories"][target_id];
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }
        else
        {
            console.log("Failed to unblacklist due to nonexistent target_id");
        }
    }
}

function unblacklistFFNetAuthor(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/u/") === 0)
    {
        target_id = extractIDFromPathname(pathname);
        if (target_id && (target_id in blacklist["authors"]))
        {
            delete blacklist["authors"][target_id];
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }

    }
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


function blacklistAO3Author(event)
{
    var pathname;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/users/") === 0)
    {
        var target_id = extractAO3WorkIDFromPathname(pathname);
        if (target_id)
        {
            blacklist["ao3_authors"][pathname] = 1;
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }

    }
}

function blacklistAO3Story(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/works/") === 0)
    {
        target_id = extractAO3WorkIDFromPathname(pathname);
        console.log(pathname, target_id);
        if (target_id)
        {
            blacklist["ao3_stories"][target_id] = 1;
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }
        else
        {
            console.log("Failed to blacklist due to nonexistent target_id");
        }
    }
}


function unblacklistAO3Story(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/works/") === 0)
    {
        target_id = extractAO3WorkIDFromPathname(pathname);
        if (target_id && (target_id in blacklist["ao3_stories"]))
        {
            delete blacklist["ao3_stories"][target_id];
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }
        else
        {
            console.log("Failed to unblacklist due to nonexistent target_id");
        }
    }
}

function unblacklistAO3Author(event)
{
    var pathname;
    var target_id;
    pathname = event.userInfo["pathname"];
    if (pathname.indexOf("/users/") === 0)
    {
        target_id = extractAO3WorkIDFromPathname(pathname);
        if (target_id && (target_id in blacklist["ao3_authors"]))
        {
            delete blacklist["ao3_authors"][target_id];
            localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
            notifyAllClients(blacklist, "blacklist-updated");
        }

    }
}

function dispatchBlacklistCommand(event, baseURI)
{
    var dispatch_table = {
        "www.fanfiction.net":{
            "blacklist-story":blacklistFFNetStory,
            "blacklist-author":blacklistFFNetAuthor,
            "unblacklist-story":unblacklistFFNetStory,
            "unblacklist-author":unblacklistFFNetAuthor
        },
        "archiveofourown.org":{
            "blacklist-story":blacklistAO3Story,
            "blacklist-author":blacklistAO3Author,
            "unblacklist-story":unblacklistAO3Story,
            "unblacklist-author":unblacklistAO3Author
        }
    };
    var host = new URL(baseURI);
    if (host && host.hostname && host.hostname in dispatch_table && event.command in dispatch_table[host.hostname])
    {

        return dispatch_table[host.hostname][event.command](event);
    }
}

function performCommand(event) {

    var baseURI = event.userInfo["baseURI"];
    return dispatchBlacklistCommand(event, baseURI);
}

function blacklistToSafariBlocklist(blacklist)
{
    var story_ids = Object.keys(blacklist['ao3_stories']);
    var story_selectors = story_ids.map(
        function(id) {
            return "li#work_"+id;
        }
    );
    var block_rule = {
        "trigger": {
            "url-filter": ".*",
            "if-domain":["*archiveofourown.org"]
        },
        "action": {
            "type": "css-display-none",
            "selector": story_selectors.join(", ")
        }
    };
    return [block_rule];
}