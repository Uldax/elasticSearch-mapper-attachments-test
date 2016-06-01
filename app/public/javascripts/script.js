$(document).ready(function(){
    $("#resultPanel").hide();
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
    
    $("#chooseDates").hide();
    $("#datePreference").change(function(evt){
        console.log($("#datePreference")[0].value);
        if($("#datePreference")[0].value == 1){
            $("#chooseDates").slideDown(500);
        }
        else {
            $("#chooseDates").slideUp(500);
        }
    })
})

