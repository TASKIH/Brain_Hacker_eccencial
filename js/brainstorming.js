var cards = {};
var boardInitialized = false;
var nickname = {name : "default"}
var create_colour = 'grey';

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

    initCards([]);
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
        case 'chat':
            var template = '<a href="#"><b>{name}</b>： {text}</a>';
            template = template.replace('{name}', data['name']);
            template = template.replace('{text}', data['body']);
            var message = $(template);
            message.appendTo('#chat-box');
            break;

        case 'chatMessages':
            nickname.name = data.name;
            var template = '<a href="#"><b>{name}</b>： {text}</a>';
            for (var i = 0; i < data.cache.length; i++) {
                template = template.replace('{name}', data.cache[i]['name']);
                template = template.replace('{text}', data.cache[i]['body']);
                var message = $(template);
                message.appendTo('#chat-box');
            }
            break;

        case 'roomAccept':
            sendAction('initializeMe', null);
            break;

        case 'moveCard':
            moveCard($("#" + data.id), data.position);
            break;

        case 'initCards':
            initCards(data);
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

        case 'advice':
        Lobibox.notify('info', {
               msg: data['sent'],
               title: 'ちょっと一言',
               //img: "../images/avatar.png",
               img: "https://avatars1.githubusercontent.com/u/6737785?v=3&s=460",
               position: 'bottom left',
               delay: 5000,
               sound: false
               }
            );
            break;

        case 'countUser':
        	$(".count-user").text('参加者： ' + data + '人');
            break;

        case 'getMember':
            var embed_html = '';
            template = '<li class="valign-wrapper white-text"><i class="material-icons">perm_identity</i><span class="valign">{name}</span></li>';
            for (var i=0; i<data.length; i++) {
                embed_html += template.replace('{name}', data[i]);
            }

            $('#member_div').html(embed_html);
            break;

        default:
            //unknown message
            alert('unknown action: ' + JSON.stringify(message));
            break;
    }

}

function drawNewCard(id, text, x, y, rot, colour, sticker, vote_count, animationspeed) {

    var template = '<div id={id} class="card savable-card draggable {colour}" ' +
                    'data-id="{id}" data-color="{colour}" style="width:250px;position:absolute;">' +
                       '<div class="card-content white-text">' +
                            '<textarea class="content black-text">{text}</textarea>' +
                       '</div>' +
                       '<div class="dock-container droppable">' + 
                       '</div>' + 
                        '<div class="card-action valign-wrapper">' +
                            '<a href="#" class="thumb-up black-text"><i class="material-icons">thumb_up</i></a>' +
                            '<a class="thumb-up-count valign black-text">{thumb-up-count}</a>' +
                            '<a href="#" class="delete-card valign black-text">DEL</a>' +
                        '</div>' +
                   '</div>';
    var h = '';
    template = template.replace('{id}', id);
    template = template.replace('{colour}', colour);
    template = template.replace('{text}', text);
    template = template.replace('{thumb-up-count}', vote_count);
    h = template;

    var card = $(h);
    card.appendTo('.boundary');

    card.draggable({
        snap: false,
        snapTolerance: 5,
        containment: '.boundary',
        scroll: true,
        stack: ".card",
		handle: "div.card-content, div.card-action",
    });

    $(card).children(".droppable").droppable({
        accept: ".draggable",
        activeClass: "ui-state-hover",
        hoverClass: "ui-state-active",
        drop: function( event, ui ) {
            element = ui.draggable;
            elements = element.find(".card-action");
            unchain = document.createElement('a');
            console.log($(this));
            $(unchain).addClass("unchain-card")
                .addClass("valign")
                .addClass("black-text")
                .html("解除")
                .attr('href', '#')
                .appendTo(elements[0]) //main div
            .click(onUnchainClicked());
            element.draggable( 'disable' );
            console.log(this);
            element.appendTo($(this));
            element.css('position', 'static');
            element.data('parent', $(this).id);
        }
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
            zindex = $(this).css('z-index');
            $(this).css('z-index', 10000);

        },
        function() {
            $(this).removeClass('hover');
            $(this).children('.card-icon').fadeOut(150);
            $(this).css('z-index', zindex);
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

    card.children('.card-content').children('.content').editable(function(value, settings) {
        onCardChange(id, value);
        return (value);
        //return (value);
    }, {
        type: 'textarea',
        //submit: 'OK',
        style: 'inherit',
        cssclass: 'card-edit-form',
        placeholder: 'Double Click to Edit.',
        onblur: 'submit',
        event: 'dblclick', //event: 'mouseover'
    });

}

function onUnchainClicked() {
    var my_card = $(this).closest('.card');
    var parent_card = my_card.closest('.card');
    my_card.removeData('parent-id');
    my_card.appendTo('.boundary');
    parent_card.remove('#' + my_card.id);
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

function initCards(cardArray) {
    //first delete any cards that exist
    $('.card').remove();

    cards = cardArray;

    for (var i in cardArray) {
        card = cardArray[i];

        drawNewCard(
            card.id,
            card.text,
            card.x,
            card.y,
            card.rot,
            card.colour,
            card.sticker,
            card.vote_count,
            0
        );
    }

    boardInitialized = true;
    unblockUI();
}

$(function() {

    if (boardInitialized === false)
        blockUI('<img src="images/ajax-loader.gif" width=43 height=11/>');

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

function getSaveElements() {
    var elements = $('.savable-card');

}