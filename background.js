// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  // If the letter 'g' is found in the tab's URL...
  if (tab.url.indexOf('.vendhq.com') > -1) {
    // ... show the page action.
    chrome.pageAction.show(tabId);
  }
};

function openOptions(tab) {
  chrome.tabs.create({url: "options.html"});
};

function initDefaults() {
  var template = localStorage["template"];
  if (!template) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL('/defaulttemplate.mustache'), true);
    xhr.onreadystatechange = function()
    {
      if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200)
      {
        localStorage["template"] = xhr.responseText;
      }
    };
    xhr.send();
  }
}

function generateReceipt(saleJSONStr) {
  console.log("Generating receipt for " + saleJSONStr);
  var template = localStorage["template"];
  var output = Mustache.render(template, JSON.parse(saleJSONStr));
  return output;
}

/*function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}*/

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.pageAction.onClicked.addListener(openOptions);

initDefaults();

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    //alert(details.requestBody.formData)
	var arrayBuf = details.requestBody.raw[0].bytes;
	//console.log(arrayBuf);
	//var tmp = ab2str(str2ab("asdfg"));
	var saleJSON = String.fromCharCode.apply(null, new Uint8Array(arrayBuf));
    //alert(details.requestBody.raw)
	var receipt = generateReceipt(saleJSON);
    var myWindow=window.open('','');
    myWindow.document.write(receipt);
    myWindow.document.close();
    myWindow.focus();
    myWindow.print();
    myWindow.close();
    return {cancel: false};
  },
  {urls: ["*://*/api/register_sales"]},
  ["blocking", "requestBody"]);