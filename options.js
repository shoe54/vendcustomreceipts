// Restores select box state to saved value from localStorage.
function restore_options() {
  // Restore Template
  var template = localStorage["template"];
  if (!template) {
    return;
  }
  var templateElem = document.getElementById("template");
  templateElem.value = template;
  
  // Populate JSON
  $.getJSON(chrome.extension.getURL('/defaultsale.json'), function(defaultSale) {
    if (!defaultSale) {
      return;
    }
    var jsonElem = document.getElementById("json");
    jsonElem.value = JSON.stringify(defaultSale, undefined, 2);  
  });
  
}
function save_options() {
  var templateElem = document.getElementById("template");
  localStorage["template"] = templateElem.value;

  /*// Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);*/
}

$( document ).ready(function() {
    restore_options();
    $( "#save" ).on( "click", function() {
        save_options();
	});
    $( "#transform" ).on( "click", function() {
		var saleJSON = JSON.parse(document.getElementById("json").value);
        var receipt = chrome.extension.getBackgroundPage().generateReceipt(document.getElementById("template").value, saleJSON);
		document.getElementById('result').contentWindow.document.body.innerHTML = "";
		document.getElementById('result').contentWindow.document.write(receipt);
	});
});
//document.addEventListener('DOMContentLoaded', restore_options);
//document.querySelector('#save').addEventListener('click', save_options);