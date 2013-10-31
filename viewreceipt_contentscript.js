function parseUrl( url ) {
    var a = document.createElement('a');
    a.href = url;
    return a;
}

function generateReceipt(saleJSONStr, baseURLStr) {
	chrome.runtime.sendMessage(
		{"command": "generateReceipt", "saleJSONStr": saleJSONStr, "baseURLStr": baseURLStr}, 
		function(response) {
			document.getElementById('view-receipt').contentWindow.document.write("<style type=\"text/css\" media=\"print\">.no-print, .no-print * { display: none !important; }</style><button class=\"no-print\" onClick=\"window.print()\" >Print</button>");
			document.getElementById('view-receipt').contentWindow.document.write(response.output);
		}
	);
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
        generateReceipt(xhr.responseText, base);
    }
};
xhr.send();

