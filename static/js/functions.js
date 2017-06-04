//Javascript functions for the omega hymnal
//This file is loaded on every page

//copypasta code
(function($){

    $.fn.shuffle = function() {

	var allElems = this.get(),
	    getRandom = function(max) {
		return Math.floor(Math.random() * max);
	    },
	    shuffled = $.map(allElems, function(){
		var random = getRandom(allElems.length),
		    randEl = $(allElems[random]).clone(true)[0];
		allElems.splice(random, 1);
		return randEl;
	   });

	this.each(function(i){
	    $(this).replaceWith($(shuffled[i]));
	});

	return $(shuffled);

    };

})(jQuery);


$.extend($.expr[':'], {
  'containsi': function(elem, i, match, array)
  {
    return (elem.textContent || elem.innerText || '').toLowerCase()
    .indexOf((match[3] || "").toLowerCase()) >= 0;
  }
});

var default_dialog_options = {
    width : "90%",
    modal : true
}

function show_popup_form(data, onfinish){
    default_dialog_options.title = $(data).attr("title");
    $("#_dialog_").html(data).dialog(default_dialog_options);
    if(onfinish){
	onfinish();
    }
}

function apply_filters(){
    $(".songlink").hide();
    var category = $("#category_select").val();
    var show_with_music_only = $("#with_music_checkbox").is(":checked");
    if (category === ''){
	$(".songlink").show();
    }else{
	$(".songlink[data-category=\"" + category + "\"]").show();
    }
    if (show_with_music_only){
	$(".songlink:visible:not(:contains(♫))").hide();
    }
}

$(document).ready(function(){
	//even out the navigation
    //setTimeout(function(){
//	var navitems = $("NAV > UL > LI");
//	navitems.css("width", Math.floor((window.innerWidth/navitems.size()) * .95));
  //  }, 200);

    //apply custom colors

    if (typeof bg_color != 'undefined' && bg_color){
	$(document).find("BODY").css({"background-color" : bg_color});
    }
    if (typeof fg_color != 'undefined' && fg_color){
	$(document).find("#content").css({"color": fg_color});
    }
    if (typeof ch_color != 'undefined' && ch_color){
	$(document).find(".chord").css({"color": ch_color});
    }


    $("#search").focus();
    $("#search").keyup(function(){
	var term = $(this).val();

	if (term.length > 0){
	$(".songlink").hide();
	$(".songlink:containsi("+term+")").show();
	}else{
	    $(".songlink").show();
	}
	$("#category_select").attr("value", "");
    });
    //category filter
    $("#category_select").change(function(){
	// var category = $(this).val();
	// console.log(category);
	// if (category === ""){
	//     $(".songlink").show();
	// }else{
	// $(".songlink").hide();
	// $(".songlink[data-category=\"" + category + "\"]").show();
	// }
	apply_filters();
    });
    apply_filters();

    //Music filter
    $("#with_music_checkbox").change(function(){
	apply_filters();
    });

    //some jquery-ui magic
    $("#with_music_checkbox").button();
    $("#randomize_list").button();
    //$("#category_select").addClass("ui-widget");
    $("#category_select").selectmenu({
	position: {my: "bottom center", at: "top center"},
	width: "16em",
	change: function(){
	    $("#category_select").trigger("change");
	}
    });
    $("#search").button().css({"text-align": "left"});

    //make the main page LI's clickable
    $song_container = Song("#song_container");

    $("#songlist > LI").click(function(){
	var href = $(this).attr("data-href");
	document.song_id = href.match(/\d+$/);
	$("#songlist_container").hide();
	$song_container.show_song(href);
    });

   //randomize button
    $("#randomize_list").click(function(){
	var orig_label = $(this).html();
	$(this).html("Hang on a sec").attr("disabled", "disabled");
	$("#content  #songlist  LI").shuffle();
	$(this).html(orig_label).removeAttr("disabled");
    });

    //If this is a song page, make "Home" close the window
    $("#link_home").click(function(){
	$("#song_container").hide();
	$("#songlist_container").show();
    });
    $("_dialog_").hide();

    //SONG EDITING
    //New song button
    $(document).on("click", "#new_song A", function(){
	$.get("edit_song/0", function(data){
	    show_popup_form(data);
	    $("#_dialog_ INPUT[name=category]").autocomplete({
		source:"/json/categories",
		minLength: 2
	    });
	});
    });

    //Add a verse when the last textedit is edited on the song form
    $(document).on("keyup", "#edit_form .page_textarea:last", function(){
	if ($(this).val() !== ''){
	    var newpage = $(this).closest("LI").clone();
	    newpage.find("textarea").val("");
	    $(this).closest("UL").append(newpage);
	}
    });
    //Remove blank verses from the end
    $(document).on("keyup", "#edit_form .page_textarea:eq(-2)", function(){
	if ($(this).val()===''){
	    $("#edit_form .page_textarea:last").remove();
	}
    });

    //Post a song edit
    $(document).on("submit", "#edit_form", function(e){
	e.preventDefault();
	var formdata = $(this).serialize();
	var new_song = $(this).find("INPUT[name=id]").val() === 'None';
	$.post("/post/song", formdata, function(song_id){
	    $("#songlist_container").hide();
	    $song_container.show_song("/song/"+song_id);
	    $("#_dialog_").dialog("close");
	});
    });
    //EXPORT
    //Show the export dialog
    $(document).on("click", "#link_export", function(){
	$.get("/export", function(data){
	    show_popup_form(data);
	    $("#_dialog_ INPUT[name=name]").autocomplete({
		source:"/json/names",
		minLength: 2
	    });
	    //disable fields until the matching radio button is clicked.
	    $("#export_form INPUT[name=type]").change(function(){
		var selected = $("#export_form INPUT[name=type]:checked");
		$("#export_form INPUT[type=text], #export_form SELECT").attr("disabled", 1);
		selected.closest("LI").find("INPUT[type=text], SELECT").removeAttr("disabled");
		$("#export_form LI").removeClass("selected");
		selected.closest("LI").addClass("selected");
		if (selected.val()==='all'){
		    $("#songs_to_export").html("(All)");
		}else{
		$("#songs_to_export").html("");
		}
	    });
	    $("#export_form INPUT[name=type]").trigger("change");
	});
    });
    //When the export form is changed, display the songs to be exported
    $(document).on("change keyup autocompleteselect",
		   "#export_form INPUT[type=text], #export_form SELECT",
		   function(e, ui){
		       var value = (ui && ui.item.value)|| $(this).val();
		       if (value !== ''){
	    var formdata = $("#export_form").serialize();
	    $.getJSON("/json/export", formdata, function(data){
		var dest = $('#songs_to_export');
		dest.html('');
		$.each(data, function(i, val){
		    dest.append("<li>" + val + "</li>");
		});
	    })
	}else{
	    $("#song_to_export").html("");
	}
    });

    //IMPORT
    //Show the import dialog
    $(document).on("click", "#link_import", function(){
	$.get("/import", function(data){
	    show_popup_form(data);
	});
    });

    //Ajaxify the import dialog
    $(document).on("submit", "#import_form", function(event){
	event.preventDefault();
	var formdata = new FormData($(this)[0]);

	$.ajax({
	    url : $(this).attr("action"),
	    type: "POST",
	    data : formdata,
	    async : false,
	    cache : false,
	    contentType : false,
	    processData : false,
	    success : function(data){
		$("#_dialog_").html(data).dialog(default_dialog_options);
	    }
	});

	return false;
    });

    //SETTINGS
    //Show the settings dialog
    $(document).on("click", "#link_settings", function(event){
	$.get("/settings", function(data){
	    show_popup_form(data, check_color);
	});
    });
    //the "page forward key" and "page backward key" fields need to hold a keycode, not a character
    $(document).on("keydown", "INPUT[name=page_forward_key], INPUT[name=page_backward_key]", function(e){
	$(this).val(e.which);
	e.preventDefault();
	return false;
    });

    //Color default checkboxes should disable the color selects
    function check_color(){
	$("input[type=checkbox].color_default").each(function(i, el){
	    var name = $(el).attr("name");
	    if ($(el).is(":checked")){
		$("input[type=color][name="+name+"]").attr("disabled", true);
	    }else{
		$("input[type=color][name="+name+"]").removeAttr("disabled");
	    }
	});
    }
    $(document).on("change", "input.color_default", check_color);

    //submit settings
    $(document).on("submit", "#settings_form", function(e){
	e.preventDefault();
	var data = $(this).serialize();
	$.post(
	    $(this).attr("action"),
	    data,
	    function(){
		$("#_dialog_").dialog("close");
	    }
	)
	return false;
    });

    //INITIALIZE
    //Call the initialize form
    $(document).on("click", "#link_initialize", function(event){
	event.preventDefault();
	$.get("/initialize", function(data){
	    show_popup_form(data);
	    $("#initialize_form INPUT[type=submit]").attr("disabled", 1);
	    $(document).on("change", "#init_db", function(){
		if ($(this).is(":checked")){
		    $("#initialize_form INPUT[type=submit]").removeAttr("disabled");
		}else{
		    $("#initialize_form INPUT[type=submit]").attr("disabled", 1);
		}
	    });
	});
    });
    //Handle submit
    $(document).on("submit", "#initialize_form", function(event){
	event.preventDefault();
	var location = window.location;
	var formdata = $(this).serialize();
	$.post($(this).attr("action"), formdata, function(){
	    window.location = location;
	    window.location.reload();
	})
	return false
    });

    // LOGIN/LOGOUT
    $(document).on("click", "#link_login", function(event){
	$.get("/login", function(data){
	    show_popup_form(data);
	    $("#loginform").on("submit", function( event ){
		event.preventDefault();
		$.post("/login", $(this).serialize(), function(data){
		    show_popup_form(data);
		    window.location.reload();
		});
		return false;
	    });
	});
    });

    $(document).on("click", "#link_logout", function(event){
	$.get("/logout", function(data){
	    //show_popup_form(data);
	    window.location.reload();
	});
    });
});
