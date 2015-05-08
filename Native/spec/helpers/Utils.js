var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "Other";
        this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "Unknown";
    },
    searchString: function (data) {
        for (var i = 0; i < data.length; i++) {
            var dataString = data[i].string;
            this.versionSearchString = data[i].subString;

            if (dataString.indexOf(data[i].subString) !== -1) {
                return data[i].identity;
            }
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index === -1) {
            return;
        }

        var rv = dataString.indexOf("rv:");
        if (this.versionSearchString === "Trident" && rv !== -1) {
            return parseFloat(dataString.substring(rv + 3));
        } else {
            return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
        }
    },

    dataBrowser: [
        { string: navigator.userAgent, subString: "Chrome", identity: "Chrome" },
        { string: navigator.userAgent, subString: "MSIE", identity: "Explorer" },
        { string: navigator.userAgent, subString: "Trident", identity: "Explorer" },
        { string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
        { string: navigator.userAgent, subString: "Safari", identity: "Safari" },
        { string: navigator.userAgent, subString: "Opera", identity: "Opera" }
    ]

};


function hasExpectedStack(stackTrace, expectedFrames) {
    return expectedFrames.every(function (item) {
        return stackTrace.some(function (frame) {
            return frame.indexOf(item) > -1;
        });
    });
}

function hasLoupeFrame(item) {
    var loupeItems = ["createStackTrace", "getStackTrace", "logError"];

    return loupeItems.some(function (check) {
        return item.indexOf(check) > -1;
    });
}

function TestingStack() {


    var inner = new InnerItem();

    this.createError = function () {
        inner.throwUnitializeError();
    };

    this.createCustomError = function () {
        inner.throwCustomError();
    };

    this.createThrowWithMessage = function () {
        inner.throwWithMessage();
    };
}

function InnerItem() {


    var uninitializedObject;

    this.throwUnitializeError = function () {
        uninitializedObject.doStuff();
    };

    this.throwCustomError = function () {
        throw new Error("My custom error");
    };

    this.throwWithMessage = function () {
        throw "Throw with message";
    };
}

function checkClientMessageStructure(client){
    expect(client['description']).toBeDefined('client description missing');
    expect(client['layout']).toBeDefined('client layout missing');
    expect(client['manufacturer']).toBeDefined('client manufacturer missing');
    expect(client['name']).toBeDefined('client name missing');
    expect(client['prerelease']).toBeDefined('client prerelease missing');
    expect(client['product']).toBeDefined('client product missing');
    expect(client['ua']).toBeDefined('client ua missing');
    expect(client['version']).toBeDefined('client version missing');
    expect(client['os']).toBeDefined('client os missing');

    var clientOS = client.os;
    expect(clientOS['architecture']).toBeDefined('client os architecture missing');
    expect(clientOS['family']).toBeDefined('client os family missing');
    expect(clientOS['version']).toBeDefined('client os version missing');
    
    var clientSize = client.size;
    expect(clientSize['width']).toBeDefined('client size width missing');
    expect(clientSize['height']).toBeDefined('client size height missing');          
}

function checkMessageStructure(message){
    expect(message['severity']).toBeDefined('severity missing');
    expect(message['category']).toBeDefined('category missing');
    expect(message['caption']).toBeDefined('caption missing');
    expect(message['description']).toBeDefined('description missing');
    expect(message['parameters']).toBeDefined('parameters missing');
    expect(message['details']).toBeDefined('details missing');
    expect(message['exception']).toBeDefined('exception missing');
    expect(message['methodSourceInfo']).toBeDefined('methodSourceInfo missing');
    expect(message['timeStamp']).toBeDefined('timeStamp missing');
    expect(message['sequence']).toBeDefined('sequence missing');        
}

function createTimeStamp() {
    var now = new Date(),
        tzo = -now.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.abs(Math.floor(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return now.getFullYear() 
        + '-' + pad(now.getMonth()+1)
        + '-' + pad(now.getDate())
        + 'T' + pad(now.getHours())
        + ':' + pad(now.getMinutes());
}

function Messages(){
    
    var requests=[];
    var responseCodes=[];
    
    this.init = function(requestsToMonitor){
        requests = requestsToMonitor;
    }
    
    this.getRequestBody = function (){
        return  JSON.parse(requests[0].requestBody);
    };
    
    this.setResponseCodes = function(codes){
        responseCodes = codes;
    }
    
    this.waitToBeLogged = function waitForMessageRecieved(fn){

        sometimeWhen(function () { 
            if(requests.length){
                var code = 204;
                
                if(responseCodes.length){
                    code = responseCodes.shift();
                }
                
                requests[0].respond(code);

                return true;
            }
            return false;
            }, fn);        
    };   
    
    function sometimeWhen(test, then){
        async(function () {
            if ( test() ) {
                then();
            } else {
                async(arguments.callee);
            }
        });        
    }
    
    function async (fn) {
        setTimeout(fn, 10);
    }    
};

