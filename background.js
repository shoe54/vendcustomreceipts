Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

var paymentTypes;

function parseUrl( url ) {
    var a = document.createElement('a');
    a.href = url;
    return a;
}

// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  // If the letter 'g' is found in the tab's URL...
  if (tab.url.indexOf('.vendhq.com') > -1) {
    // ... show the page action.
    chrome.pageAction.show(tabId);
	//initVendData(tab.url);
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

/*function initVendData(url) {
	var oLocation = parseUrl(url);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', oLocation.href + "api/payment_types", true);
    //xhr.open('GET', "http://hotxbuns.vendhq.com/api/payment_types", true);
    xhr.onreadystatechange = function()
    {
      if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200)
      {
        paymentTypes = JSON.parse(xhr.responseText);
      }
    };
    xhr.send();
}*/

function extendSaleJSON(saleJSON) {

    // Format money and calculate totals
    for (var i = 0; i < saleJSON.register_sale_products.length; i++) {
      saleJSON.register_sale_products[i].total = (saleJSON.register_sale_products[i].quantity * saleJSON.register_sale_products[i].price).formatMoney();
	  saleJSON.register_sale_products[i].price = saleJSON.register_sale_products[i].price.formatMoney();
    }
	var total = saleJSON.total_price + saleJSON.total_tax;
    saleJSON.total = total.formatMoney();
    saleJSON.total_price = saleJSON.total_price.formatMoney();
    saleJSON.total_tax = saleJSON.total_tax.formatMoney();
	
	// Specify readable payment types
    for (var i = 0; i < saleJSON.register_sale_payments.length; i++) {
      for (var j = 0; j < paymentTypes.payment_types.length; j++) {
	    if (saleJSON.register_sale_payments[i].retailer_payment_type_id == paymentTypes.payment_types[j].id) {
		  if (saleJSON.register_sale_payments[i].amount < 0)
		    saleJSON.register_sale_payments[i].retailer_payment_type_name = "Change";
		  else
		    saleJSON.register_sale_payments[i].retailer_payment_type_name = paymentTypes.payment_types[j].name;
		  break;
		}
	  }
	}
	
	// Format money and calculate topay
	var toPay = total;
    for (var i = 0; i < saleJSON.register_sale_payments.length; i++) {
	  toPay = toPay - saleJSON.register_sale_payments[i].amount;
	  saleJSON.register_sale_payments[i].amount = saleJSON.register_sale_payments[i].amount.formatMoney();
	}
	saleJSON.toPay = toPay.formatMoney();
	
	return saleJSON;
}

function generateReceipt(template, saleJSON) {
  //var saleJSON = JSON.parse(saleJSONStr);
  
  console.log("Generating receipt for " + JSON.stringify(saleJSON, undefined, 2));  
  var output = Mustache.render(template, saleJSON);
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
	var saleJSONStr = String.fromCharCode.apply(null, new Uint8Array(arrayBuf));
    //alert(details.requestBody.raw)
    var template = localStorage["template"];

 	// Inject useful data into sale JSON
    var saleJSON = JSON.parse(saleJSONStr);
	saleJSON = extendSaleJSON(saleJSON);

    var receipt = generateReceipt(template, saleJSON);
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
  
chrome.webRequest.onCompleted.addListener(
  function(details) {
	//var oLocation = parseUrl(details.url);
    var xhr = new XMLHttpRequest();
    //xhr.open('GET', oLocation.href + "api/payment_types", true);
    xhr.open('GET', details.url, true);
    xhr.onreadystatechange = function()
    {
      if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200)
      {
        paymentTypes = JSON.parse(xhr.responseText);
      }
    };
    xhr.send();
  },
  {urls: ["*://*/api/payment_types*"]},
  []);
