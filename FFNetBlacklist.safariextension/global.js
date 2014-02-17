var blacklist;

function globalSetup()
{
    blacklist = localStorage.getItem("blacklist");
    if (blacklist)
    {
        blacklist = JSON.parse(blacklist);
    }
    else
    {
        blacklist = {"stories":{}, "authors":{}};
        //localStorage.blacklist = JSON.stringify(blacklist);
    }
    safari.application.addEventListener("message",processClientRequest,false);
    safari.application.addEventListener("contextmenu", handleContextMenu, false);
    safari.application.addEventListener("command", performCommand, false); // this responds 
    safari.extension.settings.addEventListener("change", settingChange, false);


}

function settingChange(event) 
{
    if (event.key === "reveal") 
    {
        notifyAllClients(event.newValue, "blacklist-reveal-updated");
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
            tab.page.dispatchMessage(msgID, data);
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
    var mode = event.userInfo["mode"];
    var pathname = event.userInfo["pathname"];
    if (mode == "menu-add")
    {
        if (pathname.indexOf("/s/") === 0)
        {
            event.contextMenu.appendContextMenuItem("blacklist-story", "FFNet: Blacklist story");
        }
        else if (pathname.indexOf("/u/") === 0)
        {
            event.contextMenu.appendContextMenuItem("blacklist-author", "FFNet: Blacklist author");
        }
        
    }

}

function extractIDFromPathname(pathname)
{
    var path_id = pathname.substring(3);
    path_id = path_id.substring(0, path_id.indexOf("/"));
    return path_id;

}

function performCommand(event) {
    var pathname;
    if (event.command === "blacklist-story") 
    {
        console.log("blacklisting story");
        console.log(event.userInfo["pathname"]);
        pathname = event.userInfo["pathname"];
        if (pathname.indexOf("/s/") === 0)
        {
            var story_id = extractIDFromPathname(pathname);
            if (story_id)
            {
                blacklist["stories"][story_id] = 1;
                localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
                notifyAllClients(blacklist, "blacklist-updated");
            }
            else
            {
                console.log("Failed to blacklist due to nonexistent story_id");
            }
        }
        
    }
    else if (event.command === "blacklist-author")
    {
        console.log("blacklisting author");
        console.log(event.userInfo["pathname"]);
        pathname = event.userInfo["pathname"];
        if (pathname.indexOf("/u/") === 0)
        {
            var user_id = extractIDFromPathname(pathname);
            if (user_id)
            {
                blacklist["users"][user_id] = 1;
                localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
                notifyAllClients(blacklist, "blacklist-updated");
            }

        }
    }
}
