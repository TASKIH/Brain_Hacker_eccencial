var cards = {};
var boardInitialized = false;
var nickname = {name : "default"}
var create_colour = 'grey';
var droppable_layer = '<div class="dock-container droppable" id="{droppable_id}">' +
'<i class="material-icons">arrow_drop_down</i>' + 
'ドロップで子カードにできます' + 
'</div>';

$(document).ready( function(){
    $(".sticky-colour").click(function() {
        var colours = $(".sticky-colour");
        for (var i=0; i< colours.length; i++) {
            if ($(colours[i]).hasClass('selected')) {
                $(colours[i]).removeClass('selected');
            }
        }
        $(this).addClass('selected');
        create_colour = $(this).attr('colour');
        $('#idea-input').css({'background-color': $(this).attr('code')});
    });

    $(".ai-switch").click(function() {
        var ai_switch = $(".ai-switch");
        if (ai_switch.hasClass('selected')) {
            ai_switch.removeClass('selected');
            $('.ai-state').text('AI OFF');
        }else {
            ai_switch.addClass('selected');
            $('.ai-state').text('AI ON');
        }
    });

    $(".my-idea-switch").click(function() {
        var idea_switch = $(".my-idea-switch");
        if (idea_switch.hasClass('selected')) {
            idea_switch.removeClass('selected');
            showAllCards();
        }else {
            idea_switch.addClass('selected');
            hideAllCards();
        }
    });


    $("#board-screen-shot").click(function() {
		screenshot('.target_screen');
	});

	$('#chat-message').keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            var message = $(this).val();
            var data = {body: message, name: nickname.name}

            sendAction('chat', data);
            $(this).val('');
            $(this).text('');
        }
    });

    $('#idea-input').keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            var message = $(this).val();
            var uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?

            createCard('card' + uniqueID,
                       $(this).val(), // text
                       300, 200,
                       0, // rotation,
                       create_colour,
                       0); //vote count
            $(this).val('');
        }
    });

     $('#testa').click(function() {
        $("#main-screen").css("zoom","40%");
        //$("#main-screen").css("transform","scale(0.5, 0.5)");
        //$("#main-container").css("padding-left","480px");
    });
    $('.boundary').on("dragover", function(e) {
        $(this).addClass("ui-state-highlight");
        $('.overlay').show();
        e.stopPropagation();
    })
    $('.boundary').on("dragleave", function(e) {
        $(this).removeClass("ui-state-highlight");
        $('.overlay').hide();
        e.stopPropagation();
    })

});

function sendAction(a, d) {
    var message = {
        action: a,
        data: d
    };

    console.log(message);
    getMessage(JSON.stringify(message));
}


function unblockUI() {
    $.unblockUI({fadeOut: 50});
}

function blockUI(message) {
    message = message || 'Waiting...';

    $.blockUI({
        message: message,

        css: {
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: 0.5,
            color: '#fff',
            fontSize: '20px'
        },

        fadeOut: 0,
        fadeIn: 10
    });
}


function getAISwitchStatus() {
    var ai_switch = $(".ai-switch");
    if (ai_switch.hasClass('selected')) {
        return true;
    }else {
        return false;
    }
}

function getMyID() {
    return $('[name=myid]').val();
}

function hideCard(card, id) {
    //if () {
        $(card).hide();
    //}
}

function hideAllCards() {
    var cards = $('.card');
    var id = getMyID();
    for (var i=0; i<cards.length; i++) {
        hideCard(cards[i], id);
    }
}

function showAllCards() {
    var cards = $('.card');
    for (var i=0; i<cards.length; i++) {
        $(cards[i]).show();
    }
}

//respond to an action event
function getMessage(m) {
    
    console.log(message);
    var message = JSON.parse(m);
    var action = message.action;
    var data = message.data;
    console.log('action: ' + action);
    console.log('data  : ');
    console.log(data);

    switch (action) {
        case 'moveCard':
            //moveCard($("#" + data.id), data.position);
            break;

        case 'createCard':
            drawNewCard(data.id, data.text, data.x, data.y, data.rot, data.colour, null, data.vote_count);
            break;

        case 'deleteCard':
            $("#" + data.id).fadeOut(500,
                function() {
                    $(this).remove();
                }
            );
            break;

        case 'editCard':
            content =  $("#" + data.id).children('.card-content').children('.content');
            content.text(data.value);
            break;

        case 'voteUp':
            $('#' + data.id + ' .thumb-up-count').html('+' + data['thumb-up-count']);
            break;

        default:
            //unknown message
            alert('unknown action: ' + JSON.stringify(message));
            break;
    }

}

function drawNewCard(id, text, x, y, rot, colour, sticker, vote_count, parent_id, animationspeed) {

    var template = '<div id={id} class="card savable-card draggable {colour}" ' +
                    'data-color="{colour}" data-parent-id="" style="width:250px;position:absolute;">' +
                       '<div class="card-content white-text">' +
                            '<textarea class="content black-text description expanding" ' +
                            'data-type="textarea">{text}</textarea>' +
                       '</div>' +
                        '<div class="card-action valign-wrapper">' +
                            '<a href="#" class="thumb-up black-text"><i class="material-icons">thumb_up</i></a>' +
                            '<a class="thumb-up-count valign black-text">{thumb-up-count}</a>' +
                            '<a href="#" class="delete-card valign black-text"><i class="material-icons">delete</i></a>' +
                        '</div>' +
                   '</div>';
    var h = '';
    template = template.replace('{id}', id);
    template = template.replace('{colour}', colour);
    template = template.replace('{colour}', colour);
    template = template.replace('{text}', text);
    template = template.replace('{thumb-up-count}', vote_count);
    h = template;

    console.log(template);
    var card = $(h);
    card.appendTo('.boundary');

    card.draggable({
        snap: false,
        snapTolerance: 5,
        containment: '.boundary',
        scroll: true,
        stack: ".card",
        opacity: 0.80,
        // necessary for changing height of droppable element.
        refreshPositions: true,
		handle: "div.card-content, div.card-action",
    });
    addDroppableDiv(card.children('.card-action'));

    card.find('.expanding').expanding();

    card.resizable({
        handles: 'e, w'
    });
    //After a drag:
    card.bind("dragstop", function(event, ui) {

        var data = {
            id: this.id,
            position: ui.position,
            oldposition: ui.originalPosition,
        };

        sendAction('moveCard', data);
    });


    var speed = Math.floor(Math.random() * 1000);
    if (typeof(animationspeed) != 'undefined') speed = animationspeed;

    var startPosition = $(".boundary").position();

    card.css('top', startPosition.top - card.height() * 0.5);
    card.css('left', startPosition.left - card.width() * 0.5);

    card.animate({
        left: x + "px",
        top: y + "px"
    }, speed);

   var zindex;

    card.hover(
        function() {
            $(this).addClass('hover');
            $(this).children('.card-icon').fadeIn(10);

        },
        function() {
            $(this).removeClass('hover');
            $(this).children('.card-icon').fadeOut(150);
        }
    );

    card.children('.card-icon').hover(
        function() {
            $(this).addClass('card-icon-hover');
        },
        function() {
            $(this).removeClass('card-icon-hover');
        }
    );

    card.children('.card-action').children('.delete-card').click(
        function() {
            $("#" + id).remove();
            sendAction('deleteCard', {
                'id': id
            });
        }
    );

    card.children('.card-action').children('.thumb-up').click(
        function() {
            var thumb_up_count = parseInt($('#' + id + ' .thumb-up-count').html());
            sendAction('voteUp', {'id': id, 'thumb-up-count': thumb_up_count});
        }
    );

    /*
    card.children('.card-content').children('.content').editable({
        type: 'textarea',
        //submit: 'OK',
        mode: 'inline',
        onblur: 'submit',
        rows: 10,
        emptytext: '入力してください。',
        success: function(response, newValue) {
            onCardChange(id, newValue);
        }
    });*/

    if (parent_id) {
        var parent = $('#' + parent_id).children('.dock-container').last();
        console.log(parent);
        makeCardChild(parent, card);
    }
}

function onCardChange(id, text) {
    sendAction('editCard', {
        id: id,
        value: text
    });
}

function moveCard(card, position) {
    card.animate({
        left: position.left + "px",
        top: position.top + "px"
    }, 500);
}

function makeCardChild(parent, card) {
    elements = card.find(".card-action");
    unchain = document.createElement('a');

    console.log(parent);
    $(unchain).addClass("unchain-card")
        .addClass("valign")
        .addClass("black-text")
        .html("解除")
        .attr('href', '#')
        .appendTo(elements[0]) //main div
        .click(function() {
            var my_card = this.closest('.card');
            var parent_card = $(my_card).parent().closest('.card');
            
            $.removeData(my_card, 'parent-id');
            $(my_card).draggable('enable');
            $(my_card).appendTo('.boundary');
            $(my_card).find('.unchain-card').remove();
            $(my_card).css('position', 'absolute');
            $(my_card).removeClass('child-card');
            $(parent_card).children('#' + $(my_card).attr('id')).remove();
            $(parent_card).children('#' + $(my_card).attr('id')+'_droppable').remove();
        });
    card.draggable( 'disable' );
    $(parent).after(card);
    //card.appendTo($(parent));
    card.css('position', 'static');
    card.data('parent-id', $(parent).closest('.card').attr("id"));
    card.addClass('child-card');


    addDroppableDiv(card);
}

function addDroppableDiv(targetAfter) {
    var droppable_cont_id = droppable_layer.replace('{droppable_id}', $(targetAfter).attr('id') + '_droppable');
    $(targetAfter).after($(droppable_cont_id));
    
    $(targetAfter).parent().children(".droppable").droppable({
        accept: ".draggable",
        activeClass: "ui-state-active",
        hoverClass: "ui-state-highlight",
        tolerance: "pointer",
        greedy: true,
        drop: function( event, ui ) {
            element = ui.draggable;
            makeCardChild($(this), element);
        }
    });
}

//----------------------------------
// cards
//----------------------------------
function createCard(id, text, x, y, rot, colour, vote_count) {
    var action = "createCard";
    var data = {
        id: id,
        text: text,
        x: x,
        y: y,
        rot: rot,
        colour: colour,
        vote_count: vote_count,
        ai_switch: getAISwitchStatus()
    };

    sendAction(action, data);
}

$(function() {

    if (boardInitialized === false) {        
        blockUI('<img src="images/ajax-loader.gif" width=43 height=11/>');
        load();   
        boardInitialized = true;
        unblockUI();
    }

});


function screenshot( selector) {
    var element = $(selector)[0];
    html2canvas(element, { onrendered: function(canvas) {
        date = new Date(jQuery.now()).toLocaleString();
        if (canvas.msToBlob) { //for IE
            var blob = canvas.msToBlob();
            window.navigator.msSaveBlob(blob, "Brain_Hacker" + date + ".png");
        } else {
        	var imgData = canvas.toDataURL();
	        var a = document.createElement('a');
	        a.href = imgData;
	        a.download = "Brain_Hacker" + date + ".png";
	        document.body.appendChild(a);
	        a.click();
	        a.remove();
        }
    }});
}

function showVal(newVal){
  //document.getElementById("valBox").innerHTML=newVal;
  $("#main-screen").css("zoom", (newVal * 100) + "%");
}

function save() {
    blockUI();

    var elem = getSaveElements();
    localStorage.setItem("dataset", JSON.stringify(elem));
    
    unblockUI();
}

function load() {
    blockUI();

    var item = localStorage.getItem("dataset");
    var data = JSON.parse(item);
    if (!data) {
        return;
    }

    $('.boundary').text('');

    Object.keys(data).forEach(function (key) {
        var elem = data[key];
        drawNewCard(elem.id,
            elem.text, // text
            elem.left, 
            elem.top,
            0, // rotation,
            elem.color,
            null,
            0,
            elem.parent_id,
            0);
    });
    
    unblockUI();
}

function getSaveElements() {
    var savedElement = {};
    $('.savable-card').each(function(idx, elem){
        console.log(elem);
        savedElement[$(elem).attr('id')] = {
            'id': $(elem).attr('id'),
            'order': idx,
            'color': $(elem).data('color'),
            'text': $(elem).find('.description').first().text(),
            'parent_id': $(elem).data('parent-id'),
            'top': $(elem).css('top').replace('px',''),
            'left': $(elem).css('left').replace('px',''),
            'width': $(elem).css('width').replace('px',''),
        };
    });
    return savedElement;
}