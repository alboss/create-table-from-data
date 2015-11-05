<script>

/* A scriptt take a JSON or CSV data feed and return it as a formatted table. 
Use the CSV option when you need the items in the order they're presented in the CSV.  
The script was written for Socrata data but should work for any JSON or CSV. 
The CSS classes are Twitter Bootstrap. */

  "use strict";
  /*jslint browser: true*/
  /*global  $*/

 /* $(document).ready(function() {
  	$("#loadingDiv").show();
}*/

  $.ajax({

    url: "/insert/your/url/here", // put a real URL or file path here
    dataType: "text", //dataTytpe is json for JSON, text for CSV
    jsonp: false,
    success: parseData,
    error: function() {

      var output = "";
      output += "<div class=\"col-sm-12\"><p>Uh-oh; there seems to be a problem here. Please call Mom.</p></div>";
      $("#mydata").html(output);

    }
  });

// a global variable that links to the Socrata dataset where files are stored
var fileLocation = "https://data.kingcounty.gov/views/pixs-6du6/files/";


// a global variable we will use to keep track of datatype later
var pagend = 1;


  // format phone numbers consistently
  function phoneFormat(phone) {
    phone = phone.replace(/[^0-9]/g, '');
    phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    return phone;
  }

function parseData(data) {

  /* ---------------------------------------------------------------- */
  // this section converts CSV to JSON and handles commas within the values

    if (typeof(data) !== "object") 
    {
       pagend = 2;
       var ii;
        var jj;
        //this could be changed to replace with just "'"
        var input = data.replace(/\"\"/g, encodeURIComponent('"'));
        //split on " to create an odds in quotes
        var quotesAndValues = input.split(/\"/g);
        var escapedInput;

        var quotesAndValuesLength = quotesAndValues.length;
        //encode the odd positions as these should be treated as one value
        //and need to ignore , 
        for (ii = 1; ii < quotesAndValuesLength; ii = ii + 2) {
            quotesAndValues[ii] = encodeURIComponent(quotesAndValues[ii]);
        }
        //join together the newly escaped values with no gaps
        escapedInput = quotesAndValues.join("");
        //split at new lines to get each row
        var lines = escapedInput.split(/\r\n|\n/g);

        var result = [];
        //split index 0 at , to get headers
        var headers = lines[0].split(/,/g);
        var headersLength = headers.length;
        for (ii = 0; ii < headersLength; ii++) {
            //Headers will be JS objects so replace special char with safe _
            headers[ii] = headers[ii].replace(/\W/g, '_');
        }

        for (ii = 1; ii < lines.length; ii++) {

            var obj = {};
            //splitat , to get values
            var currentline = lines[ii].split(/,/g);
            for (jj = 0; jj < headersLength; jj++) {
                //double decode
                //first: decodes the quoted values , % etc
                //second: decodes the double quotes that were escaped at the start as %22 (%2522)
                //double decode not necessary here; seems to break the page
                //obj[headers[jj]] = decodeURIComponent(decodeURIComponent(currentline[jj]));
                obj[headers[jj]] = decodeURIComponent(currentline[jj]);
            }

            result.push(obj);

        }
        //return result; //JavaScript object
        data = JSON.stringify(result); //JSON
    }

    else {
        // JavaScript object
        data = JSON.stringify(data); //JSON
    }

    // that's it for the CSV conversion
    /* ---------------------------------------------------------------- */
      
  	data = JSON.parse(data);


  	$.each(data, function(i, item) {


  		var thisRecord =
  			"<div id=\"" + i + "\" class=\"table-responsive\" style=\"display:none\"><table id=\"record" + i + "\" class=\"table table-striped\"><tr>";

      $.each(item, function(key, value) {
        var value3 = "";
        // Socrata JSON nests objects for files and phone numbers. This handles those and hyperlinks the attatchments if they're in a JSON object.
        if ((typeof value === "object") && (pagend === 1)) {
      
          $.each(value, function(key2, value2) {

            if (key2.indexOf("file_id") > -1) {
              key = "Attachment";
              var url = fileLocation + value2;
              value3 = "<a href = \"" + url + "\"\" target=\"_blank\">" + url + "</a>";
            } else {
              var subtable;
              subtable = "<table cellpadding=\"3\">";
              subtable += "<tr><th width=\"125\">" + toTitleCase(key2) + "</th>";
              if ((key2.indexOf("phone_number") > -1)  && (value2.indexOf("-") == -1))  {
                value2 = phoneFormat(value2);
              }
              subtable += "<td>" + value2 + "</td>";
              subtable += "</tr></table>";

              value3 += subtable;
            }
        
        if (value3 !== null) {
          value=value3;
          } 
          });
//        }
        // if we got a CSV instead of native JSON then we still need to hyperlink the attachments

        }

         else if ((key.indexOf("Attachment") > -1) && (pagend === 2)) {
         
          value3 = "<a href = \"" + value + "\" target=\"_blank\">" + value + "</a>";
            if (value3 !== null) {
            value=value3;
            } 
      }

        /* These next two are unique to field names in my dataset. In a later version of this script I will refine it to work off the 
        date-time object instead of looking for field names. I was out of time (pun not intended) and had to go with the kludge */
  			if ((key.indexOf("date") > -1) && (key.indexOf("additional") == -1)) {

  				value = moment(moment.utc(value).toDate()).format("MM/DD/YY, HH:mm");
  			}
  			if (key.indexOf("dob") > -1) {
  				value = moment(value).format("MM/DD/YY");
  			}
        // end of date formatting

        // replace underscores in field names, and use title case, just to make them look nicer
  			function toTitleCase(str) {
  				str = str.replace(/_/g, " ");
  				return str.replace(/(?:^|\s)\w/g, function(match) {

  					return match = match.toUpperCase();
  				});

  			}

        // display if not blank
        if (value !== "") {
                thisRecord += "<tr><th>" + toTitleCase(key) + "</th><td>" + value + "</td></tr>";
        }

  		});
$("#loadingDiv").hide();

      // close this record
  		thisRecord += "</table>";

      // add some paging controls
      thisRecord += "<input type=\"button\" id=\"btnPrev" + i + "\" value=\"Prev\" onclick=\"$('#" + (i - 1) + "').toggle(); $('#" + (i) + "').toggle();$('html, body').animate({ scrollTop: 0 }, 'slow');" +  "\"/>" + "<input type=\"button\" id=\"btnNext" + i + "\"  value=\"Next\" onclick=\"$('#" + (i + 1) + "').toggle(); $('#" + i + "').toggle();$('html, body').animate({ scrollTop: 0 }, 'slow');" +  "\"/></div>";


      // display it
  		$("#mydata").append(thisRecord);

      // previous/next record buttons, enabled if there is a previous or next record
      // data length -3 for a CSV; data.length -1 for actual JSON
      // pagend variable is being set by datatype

  		if  ((((i == data.length - 3) && (pagend === 2)) || (i == data.length - 1) && (pagend === 1)))
  			$("#btnNext" + i).attr("disabled", true);
  		else
  			$("#btnNext" + i).attr("disabled", false);

  		if (i === 0)
  			$("#btnPrev" + i).attr("disabled", true);
  		else
  			$("#btnPrev" + i).attr("disabled", false);



  	});
  	$("#0").toggle();

  }


</script>
<script type="application/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.6/moment.min.js"></script>