let newServer = function () {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            let port = JSON.parse(xmlHttp.responseText).port;
            let response = "";
            if (port !== undefined)
                response = "The server port is " + port;
            else
                response = "A error has occured and a server wasn't created";
            
            document.getElementById("serverPort").innerHTML = response;
        }
    }
    xmlHttp.open("GET", "/new-server", true); // true for asynchronous 
    xmlHttp.send(null);
}