$(document).ready(function(){
    $('#buttonAdvancedResearch').click(function(evt){
        evt.preventDefault();
        var toHideAndShow = $('#parametersAdvancedResearch');
        if(toHideAndShow.css('display') == 'none' ){
            toHideAndShow.slideDown('500');
        }
        else{
            toHideAndShow.slideUp('300')
        }
    })
})
