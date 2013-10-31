function parseUrl( url ) {
    var a = document.createElement('a');
    a.href = url;
    return a;
}

function generateReceipt(saleJSONStr) {
	chrome.runtime.sendMessage({"command": "generateReceipt", "saleJSONStr": saleJSONStr}, function(response) {
		alert("res " + response);
	});
}

// Get register sale id
var n = document.URL.lastIndexOf("/");
var id = document.URL.substr(n + 1);
var viewReceiptUrl = parseUrl(document.URL);
var base = viewReceiptUrl.protocol + "//" + viewReceiptUrl.hostname;
//alert(base);
  
// Clear Vend receipt iframe
var frame = document.getElementById('view-receipt');
frame.src = '';

// Get register sales info
var xhr = new XMLHttpRequest();
//xhr.open('GET', oLocation.href + "api/payment_types", true);
xhr.open('GET', base + "/api/register_sales/" + id, true);
xhr.onreadystatechange = function()
{
    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200)
    {
        generateReceipt(xhr.responseText);
    }
};
xhr.send();

