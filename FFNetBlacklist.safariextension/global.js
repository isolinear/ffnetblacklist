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

}


function notifyClient(data, msgID, msgEvent)
{
    msgEvent.target.page.dispatchMessage(msgID, data);
}

function processClientRequest(msgEvent) {
    var uri;
    var response;
    if(msgEvent.name === "get-blacklist") {
        notifyClient(blacklist, "blacklist-updated", msgEvent);
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
    if (event.command === "blacklist-story") 
    {
        console.log("blacklisting story");
        console.log(event.userInfo["pathname"]);
        if (pathname.indexOf("/s/") === 0)
        {
            var story_id = extractIDFromPathname(pathname);
            if (story_id)
            {
                blacklist["stories"][story_id] = 1;
                localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
                notifyClient(blacklist, "blacklist-updated", msgEvent);
            }
            else
            {

            }
        }
        
    }
    else if (event.command === "blacklist-author")
    {
        console.log("blacklisting author");
        console.log(event.userInfo["pathname"]);
        if (pathname.indexOf("/u/") === 0)
        {
            var user_id = extractIDFromPathname(pathname);
            if (user_id)
            {
                blacklist["users"][user_id] = 1;
                localStorage.blacklist = JSON.stringify(blacklist); // WARNING: this is a race condition if you have multiple tabs open and blacklist stuff at the same time
                notifyClient(blacklist, "blacklist-updated", msgEvent);
            }

        }
    }
}
