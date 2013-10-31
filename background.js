/*Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};*/

var paymentTypes = {getting: false};
var config = {getting: false};

function formatMoney(n, c, d, t) {
 var c = isNaN(c = Math.abs(c)) ? 2 : c, 
     d = d == undefined ? "." : d, 
     t = t == undefined ? "," : t, 
     s = n < 0 ? "-" : "", 
     i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
     j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}
/*function parseUrl( url ) {
    var a = document.createElement('a');
    a.href = url;
    return a;
}

function getBaseUrl(urlStr) {
	var n = urlStr.lastIndexOf("/");
	var id = urlStr.substr(n + 1);
	var parsedUrl = parseUrl(urlStr);
	var base = parsedUrl.protocol + "//" + parsedUrl.hostname;
	return base;
}*/

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
    xhr.open('GET', chrome.extension.getURL('/defaulttemplate.jsrender'), true);
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

function normalizeSaleJSONFromSellScreen(saleJSON) {
	var ret = {};
	
    // JSON coming in from api/register_sales is wrapped in register_sales but not from the sell screen
	if (saleJSON.register_sales == undefined) {
	  ret.register_sales = new Array();
	  ret.register_sales[0] = saleJSON;
	  //saleJSON.register_sales = saleJSON;
	} else {
	  ret = saleJSON;
	}

    for (var n = 0; n < ret.register_sales.length; n++) {
	  var current_register_sales = ret.register_sales[n];

	  // Specify readable payment types
      for (var i = 0; i < current_register_sales.register_sale_payments.length; i++) {
      for (var j = 0; j < paymentTypes.Value.payment_types.length; j++) {
	    if (current_register_sales.register_sale_payments[i].retailer_payment_type_id == paymentTypes.Value.payment_types[j].id) {
		  //if (saleJSON.register_sale_payments[i].amount < 0)
		  //  saleJSON.register_sale_payments[i].name = "Change";
		  //else
		    current_register_sales.register_sale_payments[i].name = paymentTypes.Value.payment_types[j].name;
		  break;
		}
	  }
	  }
	
      // Calculate totals
      for (var i = 0; i < current_register_sales.register_sale_products.length; i++) {
      current_register_sales.register_sale_products[i].price_total = current_register_sales.register_sale_products[i].quantity * current_register_sales.register_sale_products[i].price;
      }

	  var total = current_register_sales.total_price + current_register_sales.total_tax;
	  var toPay = total;
	
      for (var i = 0; i < current_register_sales.register_sale_payments.length; i++) {
	  toPay = toPay - current_register_sales.register_sale_payments[i].amount;
	  }
	  current_register_sales.totals = { 
     "total_to_pay"    :   toPay, 
     "total_tax"       :   current_register_sales.total_tax, 
     "total_price" :   current_register_sales.total_price,
	 "total_payment" : current_register_sales.total_tax + current_register_sales.total_price
      };
	}
	
	return ret;
}

function extendSaleJSON(saleJSON) {

	// Include config info 
	saleJSON.config = config.Value.config;
	
	return saleJSON;
}

function formatSaleJSONMoneys(saleJSON) {
    for (var n = 0; n < saleJSON.register_sales.length; n++) {
		var current_register_sales = saleJSON.register_sales[n];

		for (var i = 0; i < current_register_sales.register_sale_products.length; i++) {
		  current_register_sales.register_sale_products[i].price_total = formatMoney(current_register_sales.register_sale_products[i].price_total);
		  current_register_sales.register_sale_products[i].price = formatMoney(current_register_sales.register_sale_products[i].price);
		}
		//saleJSON.total = total.formatMoney();
		current_register_sales.totals.total_price = formatMoney(current_register_sales.totals.total_price);
		current_register_sales.totals.total_tax = formatMoney(current_register_sales.totals.total_tax);
		current_register_sales.totals.total_to_pay = formatMoney(current_register_sales.totals.total_to_pay);
		current_register_sales.totals.total_payment = formatMoney(current_register_sales.totals.total_payment);
		
		for (var i = 0; i < current_register_sales.register_sale_payments.length; i++) {
		  current_register_sales.register_sale_payments[i].amount = formatMoney(current_register_sales.register_sale_payments[i].amount);
		}
    }
}

function generateReceipt(template, saleJSON) {
  formatSaleJSONMoneys(saleJSON);
  
  console.log("Generating receipt for " + JSON.stringify(saleJSON, undefined, 2));  
  var template = $.templates(template);
  var output = template.render(saleJSON);
  //var output = Mustache.render(template, saleJSON);
  return output;
}

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.pageAction.onClicked.addListener(openOptions);

initDefaults();

function getFromApi(urlStr, storage, async) {
    var xhr = new XMLHttpRequest();
	//storage.Value = {}; // So that callers know that this call is in progress
    xhr.open('GET', urlStr, async);
	if (async) {
		storage.getting = true;
		xhr.onreadystatechange = function()
		{
			if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200)
			{
				storage.Value = JSON.parse(xhr.responseText);
				storage.getting = false;
			}
		};
		xhr.send();
	} else {
		xhr.send();
		if (xhr.status == 200) {
			storage.Value = JSON.parse(xhr.responseText);
		}
	}
}

// Listen to messages sent from content script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    /*console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");*/
    if (request.command == "generateReceipt") {
	  // If the Vend sell screen isn't loaded before the receipt page is loaded, config will not yet have been loaded
	  if (config.Value == undefined) {
		getFromApi(request.baseURLStr + "/api/config", config, false);
	  }
	  var saleJSON = extendSaleJSON(JSON.parse(request.saleJSONStr));
      var template = localStorage["template"];
	  var receipt = generateReceipt(template, saleJSON);
      sendResponse({output: receipt});
	}
  }
);
  
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    //alert(details.requestBody.formData)
	var arrayBuf = details.requestBody.raw[0].bytes;
	//console.log(arrayBuf);
	//var tmp = ab2str(str2ab("asdfg"));
	var saleJSONStr = String.fromCharCode.apply(null, new Uint8Array(arrayBuf));
    //alert(details.requestBody.raw)
    var template = localStorage["template"];

    var saleJSON = JSON.parse(saleJSONStr);
	
	// If sale status is not VOIDED, print receipt
	if (saleJSON.status != "VOIDED") {
      // Inject useful data into sale JSON
	  saleJSON = normalizeSaleJSONFromSellScreen(saleJSON);
	  saleJSON = extendSaleJSON(saleJSON);

      var receipt = generateReceipt(template, saleJSON);
      var myWindow=window.open('','');
      myWindow.document.write(receipt);
      myWindow.document.close();
      myWindow.focus();
      myWindow.print();
      myWindow.close();
	}
	
    return {cancel: false};
  },
  {urls: ["*://*/api/register_sales"]},
  ["blocking", "requestBody"]);
  
chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (paymentTypes.getting == false)
		getFromApi(details.url, paymentTypes, true);
  },
  {urls: ["*://*/api/payment_types*"]},
  []);

chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (config.getting == false)
		getFromApi(details.url, config, true);
  },
  {urls: ["*://*/api/config*"]},
  []);
