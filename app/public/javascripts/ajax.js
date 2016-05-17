//get buttonSearch, search string, auth level
var buttonSearch = document.querySelector("#submitButton");
var inputSearch = document.querySelector("#inputSearch");
var userPrivilege = document.querySelector("#userPrivilege");

//set eventlidtener onclick call function 
buttonSearch.addEventListener("click", ajaxCall);

function ajaxCall(evt) {
    evt.preventDefault();
    var xhr = null;
    
    if (window.XMLHttpRequest || window.ActiveXObject) {
        if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        } else {
            xhr = new XMLHttpRequest();
        }
    } else {
        console.log("Votre navigateur ne supporte pas l'objet XMLHTTPRequest...");
        return;
    }
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
			readData(xhr.responseText);
		}
    };
     
    //akax vers /search?search=XX&authLevel=XX
    xhr.open("GET", "/search?search=" + inputSearch.value + "&userAuth=" + userPrivilege.value, true);
    xhr.send(null);
    
}

    function readData(data) {
        var myObject = JSON.parse(data);
        if(myObject.hasOwnProperty("error")){
            console.log(myObject.error);
        }
        else{
            for (node in myObject){
                console.log(myObject[node]._source.my_attachment._name);
            }
        }
    }