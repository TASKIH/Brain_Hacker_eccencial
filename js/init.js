(function($){
  $(function(){

    $('.button-collapse').sideNav();
    $('.parallax').parallax();
    $('.modal-trigger').on('click',function(){
        $('.modal').modal();
    });
    $('#testbutton').on('click',function(){
        $('#nav-mobile1').toggle();
    });
  }); // end of document ready
})(jQuery); // end of jQuery name space